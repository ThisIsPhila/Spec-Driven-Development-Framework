import { fs, extractionScope } from './read-boundary.js';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync, execFileSync } from 'node:child_process';
import { createProjectSnapshot, createPhaseModel } from './model.js';

export function extractProject(projectRoot) {
  const root = fs.realpathSync(projectRoot);
  return extractionScope.run({ root, bytes: 0, files: 0 }, () => extractSnapshot(root));
}

function extractSnapshot(projectRoot) {
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
  hash.update(JSON.stringify(snapshot.account));

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

  const statePath = path.join(sddDir, 'state');
  if (fs.existsSync(statePath)) {
    const state = fs.readFileSync(statePath, 'utf8');
    hash.update(state);
    snapshot.activePhaseId = state.match(/^active_phase=(.+)$/m)?.[1]?.trim() || null;
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

  // Extract Framework Core, Memories, Rules, Reports, Scripts, Templates, Hooks, Docs, Graphify
  snapshot.framework = extractFrameworkCore(sddDir, hash);
  snapshot.memories = extractMemories(sddDir, hash);
  snapshot.rules = extractRules(sddDir, hash);
  snapshot.reports = extractReports(sddDir, hash);
  snapshot.scripts = extractScripts(resolvedRoot, sddDir, hash);
  snapshot.templates = extractTemplates(sddDir, hash);
  snapshot.hooks = extractHooks(resolvedRoot, sddDir, snapshot.account.headCommit);
  snapshot.docs = extractDocs(resolvedRoot, hash);
  snapshot.graphify = extractGraphify(resolvedRoot, snapshot);

  snapshot.skills = extractInstalledSkills(resolvedRoot, hash);
  snapshot.artifactIndex = discoverArtifacts(sddDir, hash, collectSourcePaths(snapshot));
  snapshot.coverage = { markdown: 'Supported: recursive artifact index', state: 'Supported', phaseJson: 'Parsed metadata; no inferred approvals', media: 'Local raster attachments; cloud media not published', legacyTasks: 'Partial; diagnostics when unrecognized', graphify: snapshot.graphify.source };
  // Compute Project-level Aggregated Metrics
  computeProjectMetrics(snapshot);

  hash.update(JSON.stringify(snapshot.hooks));
  hash.update(JSON.stringify(snapshot.graphify));
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
    if (titleMatch) phase.name = titleMatch[1].trim().replace(/\s*[—–-]\s*Requirements$/i, '');
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

  const phaseMetadata = path.join(phaseDir, 'phase.json');
  if (fs.existsSync(phaseMetadata)) {
    const raw = fs.readFileSync(phaseMetadata, 'utf8'); hash.update(raw);
    try { phase.metadata = JSON.parse(raw); } catch { phase.warnings.push('Invalid phase.json'); }
  }
  if (phase.artifacts.tasks && !phase.tasks.length) phase.warnings.push('No recognized top-level tasks; progress is unassessed');
  const duplicateIds = phase.tasks.map(t => t.id).filter((id, i, ids) => ids.indexOf(id) !== i);
  if (duplicateIds.length) phase.warnings.push(`Duplicate task IDs: ${duplicateIds.join(', ')}`);

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
    const files = recursiveFiles(dir);
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
    phase.status = 'TASKS_RECORDED_COMPLETE';
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
        label: 'references',
      });
    }
    for (const rRef of ev.reqRefs) {
      if (reqMap.has(rRef)) {
        phase.relationships.push({
          fromType: 'evidence',
          fromId: ev.filename,
          toType: 'requirement',
          toId: rRef,
          label: 'references',
        });
      }
    }
  }

  // Extract Acceptance Criteria, Remediations, Limitations, and Future Work
  phase.acceptanceCriteria = parseAcceptanceCriteria(phase);
  phase.limitations = parseLimitations(phase);
  phase.remediations = parseRemediations(phase);
  phase.futureWork = parseFutureWork(phase);

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
    result: (resultMatch ? resultMatch[1].trim() : 'UNKNOWN'),
    assessedTree: (treeMatch ? treeMatch[1].trim() : ''),
    environment: (envMatch ? envMatch[1].trim() : ''),
    timestamp: (timeMatch ? timeMatch[1].trim() : ''),
    limitations: (limitMatch ? limitMatch[1].trim() : 'Not recorded'),
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

    unverifiedReqs.push(rId); // A reference is not independently assessed fulfillment.
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
    const res = ev.parsed?.result || 'UNKNOWN';
    if (/fail|error/i.test(res)) {
      failCount++;
    } else if (/^pass(?:ed)?(?:\b|$)/i.test(res)) {
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
      freshness = 'HEAD_MATCH_ONLY';
      staleDetails = `Evidence declares current Git HEAD; working tree not verified (${gitHeadCommit})`;
    } else {
      freshness = 'STALE';
      staleDetails = `Assessed at ${lastAssessedTree} vs active HEAD ${gitHeadCommit || 'local'}`;
    }
  }

  const passRate = evidence.length > 0 ? Math.round((passCount / evidence.length) * 100) : null;

  // 3. Health Pillars (Max 25 pts each = 100 max)
  // Pillar 1: Specification Definition (25 pts)
  let pDefinition = 0;
  if (totalReqs > 0) pDefinition += 10;
  if (phase.artifacts.design?.content) pDefinition += 10;
  if (tasks.length > 0) pDefinition += 5;

  // Pillar 2: Governance & Approvals (25 pts)
  let pGovernance = 0;
  if (/^approved\b/i.test(phase.artifacts.requirements?.status || '')) pGovernance += 10;
  if (/^approved\b/i.test(phase.artifacts.design?.status || '')) pGovernance += 10;
  if (/^(?:ready|approved)\b/i.test(phase.artifacts.tasks?.status || '')) pGovernance += 5;

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
    healthGrade: 'COMPLETENESS_HEURISTIC',
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
        if (verifiedEvList.length > 0) status = 'EVIDENCE_REFERENCED';
        else if (mappedTaskList.length > 0) status = 'TASKS_MAPPED';
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
    overallHealthGrade: 'COMPLETENESS_HEURISTIC',
    totalRequirements: totalReqsAll,
    totalTasks: totalTasksAll,
    completedTasks: completedTasksAll,
    overallProgressPct: totalTasksAll > 0 ? Math.round((completedTasksAll / totalTasksAll) * 100) : 0,
    traceabilityCoveragePct: totalReqsAll > 0 ? Math.round((mappedReqsAll / totalReqsAll) * 100) : 100,
    verificationAssurancePct: totalReqsAll > 0 ? Math.round((verifiedReqsAll / totalReqsAll) * 100) : 0,
    activeSprintsCount: snapshot.phases.filter(p => p.id === snapshot.activePhaseId).length,
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
  return match ? match[1].trim() : 'UNKNOWN';
}

function parseTitle(content) {
  const match = content.match(/^#\s+([^\n\r]+)/m);
  return match ? match[1].trim() : '';
}

function parseRequirements(content) {
  const reqs = [];
  const reqHeaderRegex = /#{2,4}\s+(REQ-[0-9.]+):?\s*([^\n\r]*)/gi;
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
      currentTask.contract = (currentTask.contract || '') + line.trim() + '\n';
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
  text = text.replace(/REQ-(\d+)\.(\d+)\s*[–—-]\s*(?:REQ-\1\.)?(\d+)/gi, (all, phase, start, end) => Number(end) >= Number(start) && Number(end) - Number(start) < 100 ? Array.from({length:Number(end)-Number(start)+1}, (_,i) => `REQ-${phase}.${Number(start)+i}`).join(' ') : all);
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

function parseAcceptanceCriteria(phase) {
  const criteria = [];
  const content = phase.artifacts?.requirements?.content || '';
  const lines = content.split('\n');
  let inCriteria = false;
  let currentReq = '';

  for (const line of lines) {
    const reqHeader = line.match(/#{2,4}\s+(REQ-[0-9.]+):?\s*([^\n\r]*)/i);
    if (reqHeader) {
      currentReq = reqHeader[1].toUpperCase();
      inCriteria = false;
      continue;
    }
    if (line.match(/\*\*Acceptance Criteria:?\*\*/i) || line.match(/^##+\s+Acceptance criteria/i)) {
      inCriteria = true;
      continue;
    } else if (inCriteria && (line.match(/^#[#\s]/) || line.match(/\*\*(Priority|User Story):\*\*/i))) {
      inCriteria = false;
    }
    if (inCriteria) {
      const numMatch = line.match(/^[0-9]+\.\s+(.+)$/);
      const checkMatch = line.match(/^-\s*\[([ xX])\]\s+(.+)$/);
      const bulletMatch = line.match(/^-\s+(.+)$/);
      if (checkMatch) {
        criteria.push({ reqId: currentReq, text: checkMatch[2].trim(), done: false, declaredDone: checkMatch[1].toLowerCase() === 'x', assessment: 'UNASSESSED' });
      } else if (numMatch) {
        criteria.push({ reqId: currentReq, text: numMatch[1].trim(), done: false });
      } else if (bulletMatch) {
        criteria.push({ reqId: currentReq, text: bulletMatch[1].trim(), done: false });
      }
    }
  }

  // Also check tasks.md completion criteria
  const taskContent = phase.artifacts?.tasks?.content || '';
  const taskLines = taskContent.split('\n');
  let inTaskCriteria = false;
  for (const line of taskLines) {
    if (line.match(/^##+\s+Completion criteria/i)) {
      inTaskCriteria = true;
      continue;
    } else if (inTaskCriteria && line.match(/^##+\s+/)) {
      break;
    }
    if (inTaskCriteria && line.trim()) {
      criteria.push({ reqId: 'PHASE-COMPLETION', text: line.trim(), done: false, assessment: 'UNASSESSED' });
    }
  }

  return criteria;
}

function parseLimitations(phase) {
  const limitations = [];
  for (const ev of phase.artifacts?.evidence || []) {
    if (ev.parsed?.limitations && ev.parsed.limitations !== 'None') {
      limitations.push({
        source: ev.filename,
        text: ev.parsed.limitations,
      });
    }
  }
  return limitations;
}

function parseRemediations(phase) {
  const remediations = [];
  for (const w of phase.warnings || []) {
    remediations.push({ issue: w, status: 'TRACKED', severity: 'WARNING' });
  }
  return remediations;
}

function parseFutureWork(phase) {
  const items = [];
  const content = phase.artifacts?.tasks?.content || '';
  const lines = content.split('\n');
  let inFuture = false;
  for (const line of lines) {
    if (line.match(/^##+\s+(Out of scope|Future considerations|Follow-ups)/i)) {
      inFuture = true;
      continue;
    } else if (inFuture && line.match(/^##+\s+/)) {
      break;
    }
    if (inFuture && line.match(/^-\s+(.+)$/)) {
      items.push(line.replace(/^-\s+/, '').trim());
    } else if (line.match(/^\s*-\s+\*\*No-go conditions and handoff:\*\*\s*(.+)$/i)) {
      const match = line.match(/^\s*-\s+\*\*No-go conditions and handoff:\*\*\s*(.+)$/i);
      items.push(match[1].trim());
    }
  }
  return items;
}

function extractFrameworkCore(sddDir, hash) {
  const result = {
    constitution: null,
    onboarding: null,
    config: null,
    glossary: null,
  };

  const constFile = path.join(sddDir, 'constitution.md');
  if (fs.existsSync(constFile)) {
    const content = fs.readFileSync(constFile, 'utf8');
    hash.update(content);
    result.constitution = {
      title: parseTitle(content) || 'Constitution',
      content,
      path: constFile,
    };
  }

  const onbFile = path.join(sddDir, 'AGENT_ONBOARDING.md');
  if (fs.existsSync(onbFile)) {
    const content = fs.readFileSync(onbFile, 'utf8');
    hash.update(content);
    result.onboarding = {
      title: 'Agent Onboarding',
      content,
      path: onbFile,
    };
  }

  const cfgFile = path.join(sddDir, 'framework.json');
  if (fs.existsSync(cfgFile)) {
    const content = fs.readFileSync(cfgFile, 'utf8');
    hash.update(content);
    try {
      result.config = { parsed: JSON.parse(content), raw: content, path: cfgFile };
    } catch {
      result.config = { parsed: {}, raw: content, path: cfgFile };
    }
  }

  const glossFile = path.join(sddDir, 'glossary.md');
  if (fs.existsSync(glossFile)) {
    const content = fs.readFileSync(glossFile, 'utf8');
    hash.update(content);
    result.glossary = {
      title: 'Glossary',
      content,
      path: glossFile,
    };
  }

  return result;
}

function extractMemories(sddDir, hash) {
  const memDir = path.join(sddDir, 'memory');
  if (!fs.existsSync(memDir)) return [];

  const memories = [];
  function scan(dir, relPrefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'rules' || entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relPrefix, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath, relPath);
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        hash.update(content);
        const id = path.basename(entry.name, '.md');
        const title = parseTitle(content) || id.replace(/-/g, ' ');
        let type = 'general';
        if (relPath.includes('current-state')) type = 'current-state';
        else if (relPath.includes('governance')) type = 'governance';
        else if (relPath.includes('completed-tasks')) type = 'completed-tasks';

        memories.push({
          id,
          filename: entry.name,
          title,
          type,
          relativePath: relPath,
          content,
          path: fullPath,
        });
      }
    }
  }

  scan(memDir);
  return memories;
}

function extractRules(sddDir, hash) {
  const rulesDir = path.join(sddDir, 'memory', 'rules');
  if (!fs.existsSync(rulesDir)) return [];

  const rules = [];
  const files = fs.readdirSync(rulesDir);
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const fullPath = path.join(rulesDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    hash.update(content);

    const id = path.basename(file, '.md');
    let trigger = 'invariant';
    if (id.startsWith('before')) trigger = 'before-task';
    else if (id.startsWith('during')) trigger = 'during-task';
    else if (id.startsWith('after')) trigger = 'after-task';
    else if (id.includes('placement')) trigger = 'file-placement';
    else if (id.includes('naming')) trigger = 'spec-naming';

    rules.push({
      id,
      filename: file,
      title: parseTitle(content) || id,
      trigger,
      enforcement: 'Declared rule; enforcement not measured',
      content,
      path: fullPath,
    });
  }
  return rules;
}

function extractReports(sddDir, hash) {
  const reportsDir = path.join(sddDir, 'reports');
  if (!fs.existsSync(reportsDir)) return [];

  const reports = [];
  function scan(dir, relPrefix = '') {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relPrefix, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath, relPath);
      } else if (entry.name.endsWith('.md')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        hash.update(content);
        const title = parseTitle(content) || path.basename(entry.name, '.md');
        const phaseMatch = relPath.match(/phase-[0-9]+/i);
        const phase = phaseMatch ? phaseMatch[0] : 'framework';
        let type = 'assessment';
        if (entry.name.includes('direction')) type = 'direction';
        else if (entry.name.includes('audit')) type = 'audit';

        reports.push({
          id: path.basename(entry.name, '.md'),
          filename: entry.name,
          title,
          phase,
          type,
          relativePath: relPath,
          content,
          path: fullPath,
        });
      }
    }
  }

  scan(reportsDir);
  return reports;
}

function extractScripts(projectRoot, sddDir, hash) {
  const scriptsDir = path.join(projectRoot, 'scripts');
  if (!fs.existsSync(scriptsDir)) return [];

  const scriptMeta = {
    'doctor.sh': { desc: 'Comprehensive health check, spec validator, and invariant diagnostics', usage: 'bash scripts/doctor.sh' },
    'skill-pack.cjs': { desc: 'Validated community skill composition packages', usage: 'bash .sdd/scripts/skills.sh pack validate <pack-folder>' },
    'phase.sh': { desc: 'Active phase sprint lifecycle, task transition, and context synchronization', usage: 'bash .sdd/scripts/phase.sh help' },
    'setup.sh': { desc: 'Framework initialization, base profiles, and git pre-commit quality gate installer', usage: 'bash scripts/setup.sh' },
    'skills.sh': { desc: 'Discovers and validates agent skills adhering to the AGY skill schema', usage: 'bash scripts/skills.sh validate' },
    'state.sh': { desc: 'State machine managing phase approvals, transitions, and milestone records', usage: 'Helper module: sourced by phase.sh (no standalone command)' },
    'validate-profiles.sh': { desc: 'Validates profile definitions and profile overlays for compliance', usage: 'bash scripts/validate-profiles.sh' },
    'scan-strays.sh': { desc: 'Scans the entire repository tree for orphaned or misplaced spec files', usage: 'bash scripts/scan-strays.sh' },
    'audit-monorepo.sh': { desc: 'Scans multi-package repositories for SDD adherence and compliance', usage: 'bash scripts/audit-monorepo.sh' },
    'validate-spec.cjs': { desc: 'Profile-aware AST linting engine for requirements and design specifications', usage: 'node .sdd/scripts/validate-spec.cjs --help' },
  };

  const scripts = [];
  const files = fs.readdirSync(scriptsDir);
  for (const file of files) {
    if (file.startsWith('.')) continue;
    const fullPath = path.join(scriptsDir, file);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }
    if (!stat.isFile()) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    hash.update(content);
    const meta = scriptMeta[file] || { desc: 'Framework automation script', usage: `bash .sdd/scripts/${file}` };

    scripts.push({
      name: file,
      description: meta.desc,
      usage: meta.usage,
      lines: content.split('\n').length,
      isExecutable: (stat.mode & 0o111) !== 0,
      path: fullPath,
      content,
    });
  }
  return scripts;
}

function extractTemplates(sddDir, hash) {
  const tplDir = path.join(sddDir, 'templates');
  if (!fs.existsSync(tplDir)) return [];

  const tplMeta = {
    'requirements-template.md': 'Requirements Specification Template (User stories, criteria, constraints)',
    'design-template.md': 'Architecture & Design Specification Template (C4 diagrams, data contracts, risk)',
    'tasks-template.md': 'Implementation Task Breakdown Template (Top-level tasks, verification requirements)',
    'evidence-template.md': 'Verification & Evidence Record Template (Assessed trees, test logs, limitations)',
    'learning-template.md': 'Phase Retrospective & Learning Loop Template (Deviations, agent reflections)',
    'governance-exception-template.md': 'Formal Governance Exception Record Template (Authorized waivers)',
    'assessment-report-template.md': 'Phase Closeout Assessment Template (Formal milestone audit signoff)',
    'agent-file-template.md': 'AI Agent Entrypoint Template (Canonical instructions pointer)',
    'plan-template.md': 'Sprint Execution Plan Template',
    'spec-template.md': 'Unified Spec Template',
  };

  const templates = [];
  const files = fs.readdirSync(tplDir);
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const fullPath = path.join(tplDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    hash.update(content);

    templates.push({
      id: path.basename(file, '.md'),
      filename: file,
      title: parseTitle(content) || path.basename(file, '.md'),
      purpose: tplMeta[file] || 'Official framework specification template',
      content,
      path: fullPath,
    });
  }
  return templates;
}

function extractHooks(projectRoot) {
  let hookFile = path.join(projectRoot, '.git', 'hooks', 'pre-commit');
  try {
    hookFile = path.resolve(projectRoot, execFileSync('git', ['rev-parse', '--git-path', 'hooks/pre-commit'], { cwd: projectRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim());
  } catch {}
  let content = '', executable = false;
  try {
    content = fs.readFileSync(hookFile, 'utf8');
    fs.accessSync(hookFile, fs.constants.X_OK);
    executable = true;
  } catch {}
  const logPath = path.join(projectRoot, '.sdd', 'evidence', 'hooks', 'runs.tsv');
  let records = [];
  if (fs.existsSync(logPath)) {
    records = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).slice(-1000).map(line => {
      const [runId, timestamp, tree, command, exitCode, result, actor, environment] = line.split('\t');
      return { runId, timestamp, tree, command, exitCode: Number(exitCode), result, actor: actor || 'Not recorded', environment: environment || 'Not recorded' };
    }).filter(r => r.runId && !Number.isNaN(Date.parse(r.timestamp)) && /^[a-f0-9]{40,64}$/.test(r.tree || '') && ['PASS', 'FAIL', 'SKIPPED'].includes(r.result));
  }
  const last = records.at(-1);
  const installed = Boolean(content);
  const gatesList = ['doctor.sh', 'skills.sh'].filter(name => content.includes(name) || content.includes('hook-run.sh')).map(name => ({
    name, command: name, status: records.filter(record => record.command === name.replace('.sh', '')).at(-1)?.result || 'UNRECORDED', frequency: 'Declared in hook source', enforced: false,
  }));
  return { installed, executable, path: hookFile, content, gates: gatesList.map(g => g.name), telemetry: {
    activeHooksCount: executable ? 1 : 0, totalGatesRun: records.length, lastRunTimestamp: last?.timestamp || '', lastCommitChecked: last?.tree || '',
    enforcementLevel: executable ? 'Configured local hook; bypass possible' : 'No executable hook detected',
    passRate: records.length ? `${Math.round(records.filter(r => r.result === 'PASS').length / records.length * 100)}%` : null, gatesList, records, historyStatus: records.length ? 'Recorded local executions; indexed trees, not commit attestations' : 'Execution history not recorded',
  }};
}

function extractDocs(projectRoot, hash) {
  const docsDir = path.join(projectRoot, 'docs');
  if (!fs.existsSync(docsDir)) return [];

  const docs = [];
  const files = recursiveFiles(docsDir);
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const fullPath = path.join(docsDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    hash.update(content);

    docs.push({
      id: path.basename(file, '.md'),
      filename: file,
      title: parseTitle(content) || path.basename(file, '.md'),
      content,
      path: fullPath,
    });
  }
  return docs;
}

function extractGraphify(projectRoot, snapshot) {
  const graphPath = [path.join(projectRoot, 'graphify-out/graph.json'), path.join(projectRoot, '.sdd/graphify/graph.json')].find(file => fs.existsSync(file));
  if (graphPath) {
    try {
      const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
      if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges || graph.links)) throw new Error('Unsupported graph schema');
      if (graph.nodes.length > 3000 || (graph.edges || graph.links).length > 10000) snapshot.diagnostics.push({type:'warning',message:'Graphify display limited to 3,000 nodes / 10,000 edges'});
      const nodes = graph.nodes.slice(0, 3000).map(node => ({ id: String(node.id), label: String(node.label || node.name || node.id), type: String(node.type || 'external'), source: node.source || '' }));
      const ids = new Set(nodes.map(node => node.id));
      const edges = (graph.edges || graph.links).slice(0, 10000).map(edge => ({ from: String(edge.from || edge.source), to: String(edge.to || edge.target), label: String(edge.label || edge.type || 'related'), provenance: edge.provenance || edge.evidence_type || 'UNSPECIFIED', confidence: edge.confidence ?? null })).filter(edge => ids.has(edge.from) && ids.has(edge.to));
      return { source: 'graphify-export', path: graphPath, nodes, edges, totalNodes: nodes.length, totalEdges: edges.length, summary: 'Imported Graphify output. Inferred or unspecified edges do not establish implementation or verification.' };
    } catch (error) { snapshot.diagnostics.push({type:'warning',message:`Graphify import failed: ${error.message}`}); }
  }
  const nodes = [];
  const edges = [];

  // 1. Core Constitution & Rules nodes
  nodes.push({ id: 'constitution', label: 'Constitution', type: 'constitution' });
  for (const r of snapshot.rules || []) {
    nodes.push({ id: `rule-${r.id}`, label: r.title, type: 'rule' });
    edges.push({ from: 'constitution', to: `rule-${r.id}`, label: 'governs' });
  }

  // 2. Spec Phases
  for (const p of snapshot.phases || []) {
    nodes.push({ id: p.id, label: p.name, type: 'phase', category: p.category });
    edges.push({ from: 'constitution', to: p.id, label: 'constrains' });

    // 3. Tasks in phase
    for (const t of p.tasks || []) {
      nodes.push({ id: `${p.id}-${t.id}`, label: `${t.id}: ${(t.title || '').slice(0, 30)}...`, type: 'task', status: t.status });
      edges.push({ from: p.id, to: `${p.id}-${t.id}`, label: 'defines' });
    }

    // 4. Evidence in phase
    for (const ev of p.artifacts?.evidence || []) {
      nodes.push({ id: `${p.id}-${ev.filename}`, label: ev.filename, type: 'evidence' });
      edges.push({ from: `${p.id}-${ev.filename}`, to: p.id, label: 'references' });
    }
  }

  // 5. Hooks node
  nodes.push({ id: 'pre-commit-hook', label: 'Git Pre-Commit Hook', type: 'hook' });
  // Hook presence is not an enforcement relationship.

  return {
    nodes,
    edges: edges.map(edge => ({ ...edge, provenance: 'DERIVED_ORGANIZATION' })),
    source: 'artifact-map',
    totalNodes: nodes.length,
    totalEdges: edges.length,
    summary: `SDD Knowledge Graph connecting ${nodes.length} entities and ${edges.length} derived organizational links. This is an artifact map, not Graphify output.`,
  };
}

function recursiveFiles(root, prefix = '', depth = 0) {
  if (depth > 8) return [];
  const files = [];
  for (const item of fs.readdirSync(path.join(root, prefix), {withFileTypes:true})) {
    if (item.name.startsWith('.') && item.name !== '.profile') continue;
    const relative = path.join(prefix, item.name);
    if (item.isDirectory()) files.push(...recursiveFiles(root, relative, depth + 1));
    else if (item.isFile() || item.isSymbolicLink()) files.push(relative);
    if (files.length > 3000) throw new Error('Artifact discovery limit exceeded');
  }
  return files;
}
function discoverArtifacts(sddDir, hash, represented) {
  return recursiveFiles(sddDir).filter(file => /\.(md|json|txt|png|jpg|jpeg|webp|gif)$/i.test(file)).map(file => {
    const full = path.join(sddDir,file);
    const content = fs.readFileSync(full);
    hash.update(file); hash.update(content);
    const media = /\.(png|jpg|jpeg|webp|gif)$/i.test(file);
    return {path:full,relativePath:'.sdd/' + file.split(path.sep).join('/'),kind:media?'media':'document',bytes:content.length,...(media || represented.has(full) ? {} : {content:content.toString('utf8')})};
  });
}
function extractInstalledSkills(root, hash) {
  const skills = [], seen = new Set();
  for (const folder of ['skills', '.agents/skills']) {
    const directory = path.join(root, folder);
    if (!fs.existsSync(directory)) continue;
    for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
      if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
      const source = path.join(directory,entry.name,'SKILL.md');
      if (!fs.existsSync(source)) continue;
      try {
        const content = fs.readFileSync(source,'utf8'); hash.update(content);
        const name = content.match(/^name:\s*(.+)$/m)?.[1]?.trim() || entry.name;
        skills.push({id:entry.name,name,description:content.match(/^description:\s*(.+)$/m)?.[1]?.trim() || 'Description not recorded',path:source,content,duplicate:seen.has(name)}); seen.add(name);
      } catch (error) { skills.push({id:entry.name,name:entry.name,description:'External or unsupported linked skill',diagnostic:error.message}); }
    }
  }
  return skills;
}

function collectSourcePaths(value, found = new Set()) {
  if (!value || typeof value !== 'object') return found;
  if (typeof value.path === 'string' && typeof value.content === 'string') found.add(value.path);
  for (const child of Object.values(value)) collectSourcePaths(child, found);
  return found;
}
