import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createProjectSnapshot, createPhaseModel } from './model.js';

export function extractProject(projectRoot) {
  const resolvedRoot = path.resolve(projectRoot);
  const sddDir = path.join(resolvedRoot, '.sdd');

  if (!fs.existsSync(sddDir)) {
    throw new Error(`Invalid SDD project: .sdd directory not found at ${resolvedRoot}`);
  }

  const projectId = path.basename(resolvedRoot);
  const snapshot = createProjectSnapshot(projectId, resolvedRoot);
  const hash = crypto.createHash('sha256');

  // Read Profile
  const profileFile = path.join(sddDir, '.profile');
  if (fs.existsSync(profileFile)) {
    const pContent = fs.readFileSync(profileFile, 'utf8').trim();
    snapshot.profile = pContent || 'general';
    hash.update(pContent);
  }

  // Read Active Context
  const activeContextFile = path.join(sddDir, 'memory', 'current-state', 'active-context.md');
  if (fs.existsSync(activeContextFile)) {
    const acContent = fs.readFileSync(activeContextFile, 'utf8');
    hash.update(acContent);
    const phaseMatch = acContent.match(/\*\*Current Phase:\*\*\s*([^\n\r]+)/);
    if (phaseMatch && phaseMatch[1]) {
      const pName = phaseMatch[1].trim().replace(/^\[|\]$/g, '');
      if (pName && !pName.includes('Phase N')) {
        snapshot.activePhaseId = pName;
      }
    }
  }

  // Scan specs across scopes
  const scopes = ['active', 'backlog', 'archive'];
  const specsDir = path.join(sddDir, 'specs');

  for (const scope of scopes) {
    const scopeDir = path.join(specsDir, scope);
    if (!fs.existsSync(scopeDir)) continue;

    const entries = fs.readdirSync(scopeDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const phaseId = entry.name;
      const phaseDir = path.join(scopeDir, phaseId);

      const phase = extractPhase(phaseDir, phaseId, scope, sddDir, hash);
      snapshot.phases.push(phase);
    }
  }

  snapshot.contentRevision = hash.digest('hex').slice(0, 16);
  return snapshot;
}

function extractPhase(phaseDir, phaseId, category, sddDir, hash) {
  const phase = createPhaseModel(phaseId, category);

  // Requirements
  const reqPath = path.join(phaseDir, 'requirements.md');
  if (fs.existsSync(reqPath)) {
    const content = fs.readFileSync(reqPath, 'utf8');
    hash.update(content);
    phase.artifacts.requirements = {
      path: reqPath,
      content,
      status: parseStatus(content),
    };
    phase.requirements = parseRequirements(content);
    const titleMatch = content.match(/^#\s+([^\n\r]+)/);
    if (titleMatch) phase.name = titleMatch[1].trim();
  } else {
    phase.warnings.push(`requirements.md missing in ${phaseId}`);
  }

  // Design
  const desPath = path.join(phaseDir, 'design.md');
  if (fs.existsSync(desPath)) {
    const content = fs.readFileSync(desPath, 'utf8');
    hash.update(content);
    phase.artifacts.design = {
      path: desPath,
      content,
      status: parseStatus(content),
      mermaidDiagrams: extractMermaid(content),
    };
  } else {
    phase.warnings.push(`design.md missing in ${phaseId}`);
  }

  // Tasks
  const tskPath = path.join(phaseDir, 'tasks.md');
  if (fs.existsSync(tskPath)) {
    const content = fs.readFileSync(tskPath, 'utf8');
    hash.update(content);
    phase.artifacts.tasks = {
      path: tskPath,
      content,
      status: parseStatus(content),
    };
    phase.tasks = parseTasks(content);
  } else {
    phase.warnings.push(`tasks.md missing in ${phaseId}`);
  }

  // Evidence
  const cleanNum = phaseId.match(/phase-[0-9]+/i)?.[0];
  const candidateDirs = [
    path.join(sddDir, 'evidence', phaseId),
    ...(cleanNum ? [path.join(sddDir, 'evidence', cleanNum)] : []),
  ];
  
  const searched = new Set();
  for (const dir of candidateDirs) {
    if (searched.has(dir) || !fs.existsSync(dir)) continue;
    searched.add(dir);
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const evPath = path.join(dir, file);
      const evContent = fs.readFileSync(evPath, 'utf8');
      hash.update(evContent);
      phase.artifacts.evidence.push({
        filename: file,
        path: evPath,
        content: evContent,
        title: parseTitle(evContent) || file,
        taskRefs: extractTaskRefs(evContent),
        reqRefs: extractReqRefs(evContent),
      });
    }
  }

  // Derive task counts (strictly from top-level tasks)
  const total = phase.tasks.length;
  const completed = phase.tasks.filter(t => t.status === 'done').length;
  const inProgress = phase.tasks.filter(t => t.status === 'doing').length;
  const pending = phase.tasks.filter(t => t.status === 'todo').length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  phase.taskCounts = { total, completed, inProgress, pending, percent };

  // Determine overarching status
  if (category === 'archive') {
    phase.status = 'ARCHIVED';
  } else if (total > 0 && completed === total) {
    phase.status = 'READY_TO_ARCHIVE';
  } else if (inProgress > 0) {
    phase.status = 'IN_PROGRESS';
  } else if (phase.artifacts.tasks && /ready to start|approved/i.test(phase.artifacts.tasks.status)) {
    phase.status = 'READY_TO_START';
  } else if (phase.artifacts.requirements && /approved/i.test(phase.artifacts.requirements.status)) {
    phase.status = 'REQUIREMENTS_APPROVED';
  } else {
    phase.status = 'PLANNING';
  }

  // Extract explicit relationships
  const reqMap = new Set(phase.requirements.map(r => r.id));
  for (const task of phase.tasks) {
    for (const rRef of task.reqRefs) {
      if (reqMap.has(rRef)) {
        phase.relationships.push({
          fromType: 'task',
          fromId: task.id,
          toType: 'requirement',
          toId: rRef,
          label: 'implements',
        });
      } else {
        phase.warnings.push(`Task ${task.id} references unknown requirement ${rRef}`);
      }
    }
  }

  for (const ev of phase.artifacts.evidence) {
    for (const tRef of ev.taskRefs) {
      phase.relationships.push({
        fromType: 'evidence',
        fromId: ev.filename,
        toType: 'task',
        toId: tRef,
        label: 'verifies',
      });
    }
  }

  return phase;
}

function parseStatus(content) {
  const match = content.match(/\*\*Status:\*\*\s*([^\n\r]+)/i) || content.match(/Status:\s*([^\n\r]+)/i);
  return match ? match[1].trim() : 'DRAFT';
}

function parseTitle(content) {
  const match = content.match(/^#\s+([^\n\r]+)/m);
  return match ? match[1].trim() : '';
}

function parseRequirements(content) {
  const reqs = [];
  const reqHeaderRegex = /###\s+(REQ-[0-9.]+):?\s*([^\n\r]*)/gi;
  let match;
  while ((match = reqHeaderRegex.exec(content)) !== null) {
    reqs.push({
      id: match[1].toUpperCase(),
      title: match[2].trim() || match[1],
    });
  }
  return reqs;
}

function parseTasks(content) {
  const tasks = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Only match top-level checklist tasks (not indented nested items)
    const topLevelTaskMatch = line.match(/^-\s*\[([ xX/])\]\s+(.+)$/);
    if (!topLevelTaskMatch) continue;

    const box = topLevelTaskMatch[1];
    const text = topLevelTaskMatch[2].trim();

    let status = 'todo';
    if (box.toLowerCase() === 'x') status = 'done';
    else if (box === '/') status = 'doing';

    // Parse ID: e.g. **[T005.1]** or [T005.1] or Task 1 or Task 028-1
    let id = '';
    const idMatch = text.match(/\[([A-Za-z0-9._-]+)\]/) || text.match(/\b(Task\s+[0-9]+(-[0-9]+)?)\b/i);
    if (idMatch) {
      id = idMatch[1].replace(/[\*\s]/g, '');
    } else {
      id = `T-${tasks.length + 1}`;
    }

    // Extract REQ refs
    const reqRefs = extractReqRefs(text);

    tasks.push({
      id,
      title: text.replace(/^\*\*\[[^\]]+\]\*\*\s*/, '').replace(/^\[[^\]]+\]\s*/, ''),
      status,
      reqRefs,
      raw: line,
    });
  }

  return tasks;
}

function extractReqRefs(text) {
  const matches = text.match(/\bREQ-[0-9.]+\b/gi) || [];
  return [...new Set(matches.map(m => m.toUpperCase()))];
}

function extractTaskRefs(text) {
  const matches = text.match(/\bT[0-9.]+\b/gi) || text.match(/\bTask\s+[0-9]+(-[0-9]+)?\b/gi) || [];
  return [...new Set(matches.map(m => m.replace(/\s+/g, '')))];
}

function extractMermaid(content) {
  const diagrams = [];
  const regex = /```mermaid\s+([\s\S]*?)```/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    diagrams.push(match[1].trim());
  }
  return diagrams;
}
