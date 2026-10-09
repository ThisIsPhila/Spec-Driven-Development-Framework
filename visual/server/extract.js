import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
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

  // Extract Git / Account Information safely
  snapshot.account = extractGitMetadata(resolvedRoot);
  hash.update(snapshot.account.headCommit || '');

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

      const phase = extractPhase(phaseDir, phaseId, scope, sddDir, hash, snapshot.account.headCommit);
      snapshot.phases.push(phase);
    }
  }

  // Compute Project-level Aggregated Metrics
  computeProjectMetrics(snapshot);

  snapshot.contentRevision = hash.digest('hex').slice(0, 16);
  return snapshot;
}

export function extractGitMetadata(projectRoot) {
  try {
    const name = execSync('git config user.name', { cwd: projectRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    const email = execSync('git config user.email', { cwd: projectRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    const branch = execSync('git branch --show-current', { cwd: projectRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim() || 'detached';
    const headCommit = execSync('git rev-parse --short HEAD', { cwd: projectRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    const statusPorcelain = execSync('git status --porcelain', { cwd: projectRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    const dirtyCount = statusPorcelain ? statusPorcelain.split('\n').filter(Boolean).length : 0;

    return {
      name: name || 'Local Developer',
      email: email || '',
      branch: branch || 'main',
      headCommit: headCommit || '',
      isDirty: dirtyCount > 0,
      dirtyCount,
    };
  } catch {
    return {
      name: 'Local Developer',
      email: '',
      branch: 'local',
      headCommit: '',
      isDirty: false,
      dirtyCount: 0,
    };
  }
}

function extractPhase(phaseDir, phaseId, category, sddDir, hash, gitHeadCommit) {
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

      const parsedMeta = parseEvidenceMetadata(evContent);
      const taskRefs = extractTaskRefs(evContent);
      const reqRefs = extractReqRefs(evContent);

      phase.artifacts.evidence.push({
        id: file,
        filename: file,
        path: evPath,
        content: evContent,
        title: parseTitle(evContent) || file,
        parsed: parsedMeta,
        taskRefs,
        reqRefs,
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
    for (const rRef of ev.reqRefs) {
      if (reqMap.has(rRef)) {
        phase.relationships.push({
          fromType: 'evidence',
          fromId: ev.filename,
          toType: 'requirement',
          toId: rRef,
          label: 'verifies',
        });
      }
    }
  }

  // Compute Actionable Metrics for this Phase
  phase.metrics = computePhaseMetrics(phase, gitHeadCommit);

  return phase;
}

function parseEvidenceMetadata(content) {
  const resultMatch = content.match(/\*\*Result:\*\*\s*([^\n\r]+)/i) || content.match(/Result:\s*([^\n\r]+)/i);
  const treeMatch = content.match(/\*\*(?:Assessed Tree(?:\s*\/\s*Revision)?|Revision|Commit):\*\*\s*([^\n\r]+)/i) ||
                     content.match(/(?:Assessed Tree|Revision):\s*([^\n\r]+)/i);
  const envMatch = content.match(/\*\*Environment:\*\*\s*([^\n\r]+)/i) || content.match(/Environment:\s*([^\n\r]+)/i);
  const timeMatch = content.match(/\*\*Timestamp:\*\*\s*([^\n\r]+)/i) || content.match(/Timestamp:\s*([^\n\r]+)/i);
  const limitMatch = content.match(/##\s+Limitations\s*([\s\S]*?)(?=\n##|\n---|$)/i);

  return {
    result: (resultMatch ? resultMatch[1].trim() : 'PASS'),
    assessedTree: (treeMatch ? treeMatch[1].trim() : ''),
    environment: (envMatch ? envMatch[1].trim() : ''),
    timestamp: (timeMatch ? timeMatch[1].trim() : ''),
    limitations: (limitMatch ? limitMatch[1].trim() : 'None'),
  };
}

function computePhaseMetrics(phase, gitHeadCommit) {
  const reqs = phase.requirements || [];
  const tasks = phase.tasks || [];
  const evidence = phase.artifacts.evidence || [];

  // 1. Traceability Mapping
  const reqMap = new Map(reqs.map(r => [r.id, { req: r, tasks: new Set(), evidence: new Set() }]));
  const orphanTasks = [];

  for (const task of tasks) {
    if (task.reqRefs && task.reqRefs.length > 0) {
      for (const rId of task.reqRefs) {
        if (reqMap.has(rId)) {
          reqMap.get(rId).tasks.add(task.id);
        }
      }
    } else {
      orphanTasks.push(task.id);
    }
  }

  for (const ev of evidence) {
    // Direct REQ refs in evidence
    if (ev.reqRefs && ev.reqRefs.length > 0) {
      for (const rId of ev.reqRefs) {
        if (reqMap.has(rId)) {
          reqMap.get(rId).evidence.add(ev.filename);
        }
      }
    }
    // Indirect REQ refs via linked tasks
    if (ev.taskRefs && ev.taskRefs.length > 0) {
      for (const tId of ev.taskRefs) {
        const matchingTask = tasks.find(t => t.id === tId);
        if (matchingTask && matchingTask.reqRefs) {
          for (const rId of matchingTask.reqRefs) {
            if (reqMap.has(rId)) {
              reqMap.get(rId).evidence.add(ev.filename);
            }
          }
        }
      }
    }
  }

  const unmappedReqs = [];
  const unverifiedReqs = [];
  let mappedCount = 0;
  let verifiedCount = 0;

  for (const [rId, entry] of reqMap.entries()) {
    if (entry.tasks.size > 0) {
      mappedCount++;
    } else {
      unmappedReqs.push(rId);
    }

    if (entry.evidence.size > 0) {
      verifiedCount++;
    } else {
      unverifiedReqs.push(rId);
    }
  }

  const totalReqs = reqs.length;
  const reqCoveragePct = totalReqs > 0 ? Math.round((mappedCount / totalReqs) * 100) : 100;
  const verCoveragePct = totalReqs > 0 ? Math.round((verifiedCount / totalReqs) * 100) : 0;

  // 2. Evidence Assurance & Freshness
  let passCount = 0;
  let failCount = 0;
  let matchesHead = false;
  let anyCommitRecorded = false;
  let lastAssessedTree = '';

  for (const ev of evidence) {
    const res = ev.parsed?.result || 'PASS';
    if (/fail|error/i.test(res)) {
      failCount++;
    } else {
      passCount++;
    }

    if (ev.parsed?.assessedTree) {
      anyCommitRecorded = true;
      lastAssessedTree = ev.parsed.assessedTree;
      if (gitHeadCommit && (gitHeadCommit.startsWith(ev.parsed.assessedTree) || ev.parsed.assessedTree.startsWith(gitHeadCommit))) {
        matchesHead = true;
      }
    }
  }

  let freshness = 'UNLINKED';
  let staleDetails = '';
  if (anyCommitRecorded) {
    if (matchesHead) {
      freshness = 'FRESH';
      staleDetails = `Verified at current Git HEAD (${gitHeadCommit})`;
    } else {
      freshness = 'STALE';
      staleDetails = `Assessed at ${lastAssessedTree} vs active HEAD ${gitHeadCommit || 'local'}`;
    }
  }

  const passRate = evidence.length > 0 ? Math.round((passCount / evidence.length) * 100) : 100;

  // 3. Health Pillars (Max 25 pts each = 100 max)
  // Pillar 1: Specification Definition (25 pts)
  let pDefinition = 0;
  if (totalReqs > 0) pDefinition += 10;
  if (phase.artifacts.design?.content) pDefinition += 10;
  if (tasks.length > 0) pDefinition += 5;

  // Pillar 2: Governance & Approvals (25 pts)
  let pGovernance = 0;
  if (/approved/i.test(phase.artifacts.requirements?.status || '')) pGovernance += 10;
  if (/approved/i.test(phase.artifacts.design?.status || '')) pGovernance += 10;
  if (/ready|approved/i.test(phase.artifacts.tasks?.status || '')) pGovernance += 5;

  // Pillar 3: Execution Progress (25 pts)
  const taskTotal = phase.taskCounts.total;
  const taskDone = phase.taskCounts.completed;
  const pExecution = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 25) : 0;

  // Pillar 4: Verification Assurance & Freshness (25 pts)
  let pVerification = 0;
  if (evidence.length > 0) pVerification += 10;
  if (passRate === 100 && evidence.length > 0) pVerification += 5;
  if (freshness === 'FRESH') pVerification += 10;
  else if (freshness === 'STALE' || freshness === 'UNLINKED') pVerification += 5;

  const healthScore = Math.min(100, pDefinition + pGovernance + pExecution + pVerification);
  let healthGrade = 'CRITICAL';
  if (healthScore >= 90) healthGrade = 'EXCELLENT';
  else if (healthScore >= 75) healthGrade = 'HEALTHY';
  else if (healthScore >= 50) healthGrade = 'NEEDS_ATTENTION';

  return {
    healthScore,
    healthGrade,
    pillars: {
      definition: pDefinition,
      governance: pGovernance,
      execution: pExecution,
      verification: pVerification,
    },
    traceability: {
      totalRequirements: totalReqs,
      mappedRequirements: mappedCount,
      unmappedRequirements: unmappedReqs,
      requirementCoveragePct: reqCoveragePct,
      verifiedRequirements: verifiedCount,
      unverifiedRequirements: unverifiedReqs,
      verificationCoveragePct: verCoveragePct,
      totalTasks: tasks.length,
      orphanTasks,
      orphanTaskCount: orphanTasks.length,
      matrix: reqs.map(r => {
        const item = reqMap.get(r.id);
        const mappedTaskList = Array.from(item?.tasks || []);
        const verifiedEvList = Array.from(item?.evidence || []);
        let status = 'UNMAPPED';
        if (verifiedEvList.length > 0) status = 'VERIFIED';
        else if (mappedTaskList.length > 0) status = 'IMPLEMENTED';
        return {
          id: r.id,
          title: r.title,
          tasks: mappedTaskList,
          evidence: verifiedEvList,
          status,
        };
      }),
    },
    verificationAssurance: {
      totalEvidenceRuns: evidence.length,
      passCount,
      failCount,
      passRate,
      freshness,
      staleDetails,
    },
    tasksPerReqRatio: totalReqs > 0 ? parseFloat((tasks.length / totalReqs).toFixed(1)) : 0,
  };
}

function computeProjectMetrics(snapshot) {
  let totalReqsAll = 0;
  let totalTasksAll = 0;
  let completedTasksAll = 0;
  let mappedReqsAll = 0;
  let verifiedReqsAll = 0;
  let orphanTasksAll = 0;
  let unmappedReqsAll = 0;
  let totalHealthSum = 0;

  for (const phase of snapshot.phases) {
    if (phase.metrics?.traceability) {
      totalReqsAll += phase.metrics.traceability.totalRequirements;
      mappedReqsAll += phase.metrics.traceability.mappedRequirements;
      verifiedReqsAll += phase.metrics.traceability.verifiedRequirements;
      orphanTasksAll += phase.metrics.traceability.orphanTaskCount;
      unmappedReqsAll += phase.metrics.traceability.unmappedRequirements.length;
    }
    totalTasksAll += phase.taskCounts.total;
    completedTasksAll += phase.taskCounts.completed;
    totalHealthSum += (phase.metrics?.healthScore || 0);
  }

  const phaseCount = snapshot.phases.length;
  const overallHealth = phaseCount > 0 ? Math.round(totalHealthSum / phaseCount) : 0;
  let overallGrade = 'CRITICAL';
  if (overallHealth >= 90) overallGrade = 'EXCELLENT';
  else if (overallHealth >= 75) overallGrade = 'HEALTHY';
  else if (overallHealth >= 50) overallGrade = 'NEEDS_ATTENTION';

  snapshot.metrics = {
    overallHealthScore: overallHealth,
    overallHealthGrade: overallGrade,
    totalRequirements: totalReqsAll,
    totalTasks: totalTasksAll,
    completedTasks: completedTasksAll,
    overallProgressPct: totalTasksAll > 0 ? Math.round((completedTasksAll / totalTasksAll) * 100) : 0,
    traceabilityCoveragePct: totalReqsAll > 0 ? Math.round((mappedReqsAll / totalReqsAll) * 100) : 100,
    verificationAssurancePct: totalReqsAll > 0 ? Math.round((verifiedReqsAll / totalReqsAll) * 100) : 0,
    activeSprintsCount: snapshot.phases.filter(p => p.category === 'active').length,
    orphanTaskCount: orphanTasksAll,
    unmappedReqCount: unmappedReqsAll,
    phasesBurndown: snapshot.phases.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      healthScore: p.metrics?.healthScore || 0,
      percent: p.taskCounts.percent,
      completed: p.taskCounts.completed,
      total: p.taskCounts.total,
    })),
  };
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
  let currentTask = null;

  for (const line of lines) {
    // Only match top-level checklist tasks (not indented nested items)
    const topLevelTaskMatch = line.match(/^-\s*\[([ xX/])\]\s+(.+)$/);
    if (topLevelTaskMatch) {
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

      // Extract REQ refs on main task line
      const reqRefs = extractReqRefs(text);

      currentTask = {
        id,
        title: text.replace(/^\*\*\[[^\]]+\]\*\*\s*/, '').replace(/^\[[^\]]+\]\s*/, ''),
        status,
        reqRefs,
        raw: line,
      };
      tasks.push(currentTask);
    } else if (currentTask && line.match(/^\s+-\s+/)) {
      // Nested task metadata lines (e.g. - **Objective and requirements:** ...; REQ-005.1)
      const nestedReqs = extractReqRefs(line);
      for (const r of nestedReqs) {
        if (!currentTask.reqRefs.includes(r)) {
          currentTask.reqRefs.push(r);
        }
      }
    } else if (line.match(/^#[#\s]/) || line.trim() === '---') {
      currentTask = null;
    }
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
