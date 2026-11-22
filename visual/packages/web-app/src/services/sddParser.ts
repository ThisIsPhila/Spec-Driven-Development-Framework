import type {
  AgentAttributionEvent,
  PhaseRecord,
  ProjectSnapshot,
  ProjectTelemetry,
  RequirementItem,
  TaskItem,
} from '@sdd/contracts';

const RELEVANT_EXTENSIONS = /\.(md|json|jsonl|tsv|txt|yml|yaml)$/i;
const MAX_FILE_BYTES = 1024 * 1024; // 1MB per text artifact

function hashRevision(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

function parseStatus(content: string): string {
  const match =
    content.match(/\*\*Status:\*\*\s*([^\n\r]+)/i) ||
    content.match(/Status:\s*([^\n\r]+)/i);
  return match ? match[1].trim() : 'UNKNOWN';
}

function parseTitle(content: string): string {
  const match = content.match(/^#\s+([^\n\r]+)/m);
  return match ? match[1].trim() : '';
}

function extractReqRefs(text: string): string[] {
  const expanded = text.replace(
    /REQ-(\d+)\.(\d+)\s*[–—-]\s*(?:REQ-\1\.)?(\d+)/gi,
    (all, phase, start, end) =>
      Number(end) >= Number(start) && Number(end) - Number(start) < 100
        ? Array.from({ length: Number(end) - Number(start) + 1 }, (_, i) => `REQ-${phase}.${Number(start) + i}`).join(' ')
        : all,
  );
  const matches = expanded.match(/\bREQ-[0-9.]+\b/gi) || [];
  return [...new Set(matches.map((m) => m.toUpperCase()))];
}

function extractTaskRefs(text: string): string[] {
  const matches = text.match(/\bT[0-9.]+\b/gi) || [];
  return [...new Set(matches)];
}

function parseRequirements(content: string): RequirementItem[] {
  const reqs: RequirementItem[] = [];
  const regex = /#{2,4}\s+(REQ-[0-9.]+):?\s*([^\n\r]*)/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    reqs.push({
      id: match[1].toUpperCase(),
      title: match[2].trim() || match[1].toUpperCase(),
    });
  }
  return reqs;
}

function parseTasks(content: string): TaskItem[] {
  const tasks: TaskItem[] = [];
  const lines = content.split('\n');
  let current: TaskItem | null = null;

  for (const line of lines) {
    const topMatch = line.match(/^-\s*\[([ xX/])\]\s+(.+)$/);
    if (topMatch) {
      const box = topMatch[1];
      const text = topMatch[2].trim();
      let status: TaskItem['status'] = 'todo';
      if (box.toLowerCase() === 'x') status = 'done';
      else if (box === '/') status = 'doing';

      const idMatch = text.match(/\[([A-Za-z0-9._-]+)\]/);
      const id = idMatch ? idMatch[1].replace(/[*\s]/g, '') : `T-${tasks.length + 1}`;
      const reqRefs = extractReqRefs(text);

      current = {
        id,
        title: text.replace(/^\*\*\[[^\]]+\]\*\*\s*/, '').replace(/^\[[^\]]+\]\s*/, ''),
        status,
        reqRefs,
        rawLine: line,
      };
      tasks.push(current);
    } else if (current && /^\s+-\s+/.test(line)) {
      const nestedReqs = extractReqRefs(line);
      for (const r of nestedReqs) {
        if (!current.reqRefs?.includes(r)) {
          current.reqRefs = [...(current.reqRefs || []), r];
        }
      }
    } else if (/^#[#\s]/.test(line) || line.trim() === '---') {
      current = null;
    }
  }
  return tasks;
}

/**
 * Normalizes paths into `.sdd/`-relative paths, returning the normalized map
 * plus an inferred project name if a parent folder wrapped `.sdd/`.
 */
function normalizeSddFiles(rawFiles: Record<string, string>, fallbackName: string): {
  projectName: string;
  sddFiles: Record<string, string>;
  skillFiles: Record<string, string>;
} {
  const sddFiles: Record<string, string> = {};
  const skillFiles: Record<string, string> = {};
  let inferredName = fallbackName;

  const entries = Object.entries(rawFiles);
  const hasExplicitSdd = entries.some(([p]) => /(^|\/)\.sdd\//.test(p.replace(/\\/g, '/')));

  for (const [rawKey, content] of entries) {
    const clean = rawKey.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
    if (!clean) continue;

    if (hasExplicitSdd) {
      const idx = clean.indexOf('.sdd/');
      if (idx >= 0) {
        const prefix = clean.slice(0, idx).replace(/\/$/, '');
        if (prefix && !prefix.includes('/') && (!inferredName || inferredName === 'sdd-project')) {
          inferredName = prefix;
        }
        const rel = clean.slice(idx + '.sdd/'.length);
        if (rel) sddFiles[rel] = content;
        continue;
      }
      const skillsMatch = clean.match(/(?:^|\/)(?:\.agents\/)?skills\/([^/]+\/SKILL\.md)$/i);
      if (skillsMatch) {
        skillFiles[skillsMatch[1]] = content;
      }
    } else {
      // User picked `.sdd` directly as the root folder
      const parts = clean.split('/');
      const first = parts[0];
      const rest = parts.slice(1).join('/');
      if (first === '.sdd' && rest) {
        sddFiles[rest] = content;
      } else if (
        /^(specs|memory|metrics|evidence|templates|rules|constitution\.md|framework\.json|state|AGENT_ONBOARDING\.md)/i.test(clean)
      ) {
        sddFiles[clean] = content;
      } else if (
        rest &&
        /^(specs|memory|metrics|evidence|templates|rules|constitution\.md|framework\.json|state|AGENT_ONBOARDING\.md)/i.test(rest)
      ) {
        if (!inferredName || inferredName === '.sdd' || inferredName === 'sdd-project') {
          inferredName = first;
        }
        sddFiles[rest] = content;
      }
    }
  }

  return {
    projectName: inferredName && inferredName !== '.sdd' ? inferredName : fallbackName || 'Imported SDD Project',
    sddFiles,
    skillFiles,
  };
}

export function parseSddFileMap(projectName: string, rawFiles: Record<string, string>): ProjectSnapshot {
  const { projectName: resolvedName, sddFiles, skillFiles } = normalizeSddFiles(rawFiles, projectName);

  const keys = Object.keys(sddFiles);
  const hasCoreSdd = keys.some(
    (k) =>
      k.startsWith('specs/') ||
      k === 'constitution.md' ||
      k === 'framework.json' ||
      k === 'AGENT_ONBOARDING.md',
  );

  if (keys.length === 0 || !hasCoreSdd) {
    throw new Error(
      'No .sdd/ specification files found in the selected folder. Pick a repository root containing .sdd/ or the .sdd/ folder itself.',
    );
  }

  let hashSeed = resolvedName;

  // Framework metadata
  let frameworkVersion = '2.4.0';
  let frameworkProfile = 'general';
  if (sddFiles['framework.json']) {
    hashSeed += sddFiles['framework.json'];
    try {
      const fw = JSON.parse(sddFiles['framework.json']);
      if (fw.frameworkVersion) frameworkVersion = String(fw.frameworkVersion);
      if (fw.profile) frameworkProfile = String(fw.profile);
    } catch {
      // ignore malformed framework.json
    }
  }

  const constitutionContent = sddFiles['constitution.md'] || '';
  if (constitutionContent) hashSeed += constitutionContent;

  // Active phase detection
  let activePhaseId: string | null = null;
  const activeContext = sddFiles['memory/current-state/active-context.md'];
  if (activeContext) {
    hashSeed += activeContext;
    const m = activeContext.match(/\*\*Current Phase:\*\*\s*([^\n\r]+)/);
    if (m?.[1]) {
      const candidate = m[1].trim().replace(/^\[|\]$/g, '');
      if (candidate && !candidate.includes('Phase N')) activePhaseId = candidate;
    }
  }
  const stateFile = sddFiles['state'];
  if (stateFile) {
    hashSeed += stateFile;
    const declared = stateFile.match(/^active_phase=(.+)$/m)?.[1]?.trim();
    if (declared) activePhaseId = declared;
  }

  // Group phases by scope/id
  const phaseBuckets = new Map<string, { category: PhaseRecord['category']; files: Record<string, string> }>();
  for (const [rel, content] of Object.entries(sddFiles)) {
    const m = rel.match(/^specs\/(active|archive|backlog)\/([^/]+)\/(.+)$/);
    if (!m) continue;
    const category = m[1] as PhaseRecord['category'];
    const phaseId = m[2];
    const fileRel = m[3];
    const key = `${category}:${phaseId}`;
    if (!phaseBuckets.has(key)) {
      phaseBuckets.set(key, { category, files: {} });
    }
    phaseBuckets.get(key)!.files[fileRel] = content;
    hashSeed += rel + content;
  }

  // Group evidence by phase id or phase-NNN prefix
  const evidenceByPhase = new Map<string, Array<{ filename: string; content: string }>>();
  for (const [rel, content] of Object.entries(sddFiles)) {
    const m = rel.match(/^evidence\/([^/]+)\/(.+\.md)$/i);
    if (!m) continue;
    const dir = m[1];
    const filename = m[2];
    if (!evidenceByPhase.has(dir)) evidenceByPhase.set(dir, []);
    evidenceByPhase.get(dir)!.push({ filename, content });
    hashSeed += rel + content;
  }

  const phases: PhaseRecord[] = [];
  for (const [key, bucket] of phaseBuckets.entries()) {
    const phaseId = key.split(':')[1];
    const reqContent = bucket.files['requirements.md'] || '';
    const desContent = bucket.files['design.md'] || '';
    const tskContent = bucket.files['tasks.md'] || '';

    const requirements = reqContent ? parseRequirements(reqContent) : [];
    const tasks = tskContent ? parseTasks(tskContent) : [];
    const titleFromReq = reqContent ? parseTitle(reqContent).replace(/\s*[—–-]\s*Requirements$/i, '') : '';
    const name = titleFromReq || phaseId;

    const cleanNum = phaseId.match(/phase-[0-9]+/i)?.[0];
    const rawEv = [
      ...(evidenceByPhase.get(phaseId) || []),
      ...(cleanNum && cleanNum !== phaseId ? evidenceByPhase.get(cleanNum) || [] : []),
    ];

    const evidence = rawEv.map((ev) => ({
      id: ev.filename,
      filename: ev.filename,
      title: parseTitle(ev.content) || ev.filename,
      content: ev.content,
      taskRefs: extractTaskRefs(ev.content),
      reqRefs: extractReqRefs(ev.content),
    }));

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'doing').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Traceability calculations
    const reqSet = new Set(requirements.map((r) => r.id));
    const mappedReqs = new Set<string>();
    const verifiedReqs = new Set<string>();
    let orphanTaskCount = 0;

    for (const task of tasks) {
      const refs = (task.reqRefs || []).filter((r) => reqSet.has(r));
      if (refs.length === 0) orphanTaskCount += 1;
      for (const r of refs) mappedReqs.add(r);
    }

    for (const ev of evidence) {
      for (const r of ev.reqRefs || []) {
        if (reqSet.has(r)) verifiedReqs.add(r);
      }
      for (const tId of ev.taskRefs || []) {
        const matchTask = tasks.find((t) => t.id === tId);
        for (const r of matchTask?.reqRefs || []) {
          if (reqSet.has(r)) verifiedReqs.add(r);
        }
      }
    }

    const unmappedRequirements = requirements.filter((r) => !mappedReqs.has(r.id)).map((r) => r.id);
    const healthScore = Math.min(
      100,
      (reqContent ? 25 : 0) +
        (desContent ? 25 : 0) +
        (tskContent ? 25 : 0) +
        Math.round(percent * 0.25),
    );

    phases.push({
      id: phaseId,
      name,
      category: bucket.category,
      taskCounts: { total, completed, inProgress, todo, percent },
      requirements,
      tasks,
      artifacts: {
        ...(reqContent ? { requirements: { content: reqContent, status: parseStatus(reqContent) } } : {}),
        ...(desContent ? { design: { content: desContent, status: parseStatus(desContent) } } : {}),
        ...(tskContent ? { tasks: { content: tskContent, status: parseStatus(tskContent) } } : {}),
        ...(evidence.length > 0 ? { evidence } : {}),
      },
      metrics: {
        healthScore,
        traceability: {
          totalRequirements: requirements.length,
          mappedRequirements: mappedReqs.size,
          verifiedRequirements: verifiedReqs.size,
          orphanTaskCount,
          unmappedRequirements,
        },
      },
    });
  }

  // Sort active first, then highest phase number first
  phases.sort((a, b) => {
    const rank = { active: 0, backlog: 1, archive: 2 };
    if (rank[a.category] !== rank[b.category]) return rank[a.category] - rank[b.category];
    return b.id.localeCompare(a.id);
  });

  if (!activePhaseId || !phases.some((p) => p.id === activePhaseId)) {
    const activePhases = phases.filter((p) => p.category === 'active');
    const inProgress = activePhases.find((p) => p.tasks.some((t) => t.status === 'doing'));
    activePhaseId = (inProgress || activePhases[0] || phases[0])?.id || null;
  }

  // Telemetry extraction
  const attribution: AgentAttributionEvent[] = [];
  if (sddFiles['metrics/events.jsonl']) {
    hashSeed += sddFiles['metrics/events.jsonl'];
    for (const line of sddFiles['metrics/events.jsonl'].split('\n')) {
      if (!line.trim()) continue;
      try {
        attribution.push(JSON.parse(line));
      } catch {
        // skip malformed JSONL line
      }
    }
  }

  let report: Record<string, unknown> | null = null;
  if (sddFiles['metrics/report.json']) {
    hashSeed += sddFiles['metrics/report.json'];
    try {
      report = JSON.parse(sddFiles['metrics/report.json']);
    } catch {
      // skip malformed report.json
    }
  }

  let ratesAsOf: string | null = (report?.rates_as_of as string) || null;
  if (!ratesAsOf && sddFiles['metrics/rates.json']) {
    try {
      const rates = JSON.parse(sddFiles['metrics/rates.json']);
      ratesAsOf = rates.as_of || null;
    } catch {
      // ignore
    }
  }

  const telemetry: ProjectTelemetry = {
    attribution,
    onboarding: attribution.filter((e) => e.event === 'onboard'),
    phaseStarts: attribution.filter((e) => e.event === 'phase_start'),
    taskEvents: attribution.filter((e) => e.event === 'task_doing' || e.event === 'task_done'),
    rollups: (report?.rollups as ProjectTelemetry['rollups']) || {
      totalUsd: 0,
      totalTokens: { input: 0, output: 0, cache_read: 0, cache_write: 0 },
      byModel: [],
      byHarness: [],
    },
    deliveryReport: report,
    ratesAsOf,
  };

  // Skills extraction
  const skills = Object.entries(skillFiles).map(([rel, content]) => {
    const id = rel.split('/')[0];
    const name = content.match(/^name:\s*(.+)$/m)?.[1]?.trim() || id;
    const description = content.match(/^description:\s*(.+)$/m)?.[1]?.trim() || 'Installed project skill';
    return { id, name, description, content };
  });

  // Project-level aggregate metrics
  let totalRequirements = 0;
  let totalTasks = 0;
  let completedTasks = 0;
  let mappedReqsAll = 0;
  let verifiedReqsAll = 0;
  let orphanTaskCount = 0;
  let unmappedReqCount = 0;
  let healthSum = 0;

  for (const p of phases) {
    totalTasks += p.taskCounts.total;
    completedTasks += p.taskCounts.completed;
    healthSum += p.metrics?.healthScore || 0;
    if (p.metrics?.traceability) {
      totalRequirements += p.metrics.traceability.totalRequirements;
      mappedReqsAll += p.metrics.traceability.mappedRequirements;
      verifiedReqsAll += p.metrics.traceability.verifiedRequirements;
      orphanTaskCount += p.metrics.traceability.orphanTaskCount;
      unmappedReqCount += p.metrics.traceability.unmappedRequirements.length;
    }
  }

  const slug =
    resolvedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'imported-project';

  return {
    projectId: slug,
    projectName: resolvedName,
    activePhaseId,
    contentRevision: hashRevision(hashSeed),
    account: {
      name: 'Browser Import',
      branch: 'local-folder',
      headCommit: 'browser',
      isDirty: false,
      dirtyCount: 0,
    },
    framework: {
      version: frameworkVersion,
      profile: frameworkProfile,
      constitution: constitutionContent ? { content: constitutionContent } : undefined,
    },
    phases,
    metrics: {
      overallHealthScore: phases.length > 0 ? Math.round(healthSum / phases.length) : 0,
      totalRequirements,
      totalTasks,
      completedTasks,
      overallProgressPct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      traceabilityCoveragePct: totalRequirements > 0 ? Math.round((mappedReqsAll / totalRequirements) * 100) : 100,
      verificationAssurancePct: totalRequirements > 0 ? Math.round((verifiedReqsAll / totalRequirements) * 100) : 0,
      activeSprintsCount: phases.filter((p) => p.id === activePhaseId).length,
      orphanTaskCount,
      unmappedReqCount,
    },
    telemetry,
    skills,
    diagnostics: [
      {
        type: 'info',
        message: `Parsed ${phases.length} phase(s) and ${keys.length} .sdd/ artifact(s) directly in browser.`,
      },
    ],
  };
}

function isRelevantSddPath(relPath: string): boolean {
  const norm = relPath.replace(/\\/g, '/');
  if (norm.includes('/node_modules/') || norm.includes('/.git/')) return false;
  if (!RELEVANT_EXTENSIONS.test(norm)) return false;
  return (
    norm.includes('.sdd/') ||
    /^(specs|memory|metrics|evidence|templates|rules)\//.test(norm) ||
    /^(constitution\.md|framework\.json|state|AGENT_ONBOARDING\.md)$/i.test(norm) ||
    /\/skills\/[^/]+\/SKILL\.md$/i.test(norm)
  );
}

export async function readDirectoryFiles(fileList: FileList): Promise<{
  projectName: string;
  files: Record<string, string>;
}> {
  const files: Record<string, string> = {};
  let projectName = 'sdd-project';

  const arr = Array.from(fileList);
  if (arr.length > 0) {
    const firstRel = (arr[0] as File & { webkitRelativePath?: string }).webkitRelativePath || arr[0].name;
    const top = firstRel.split('/')[0];
    if (top && top !== '.sdd') projectName = top;
  }

  for (const file of arr) {
    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
    if (!isRelevantSddPath(rel) || file.size > MAX_FILE_BYTES) continue;
    files[rel] = await file.text();
  }

  return { projectName, files };
}

interface FsHandleLike {
  kind: 'file' | 'directory';
  name: string;
  getFile?: () => Promise<File>;
  entries?: () => AsyncIterable<[string, FsHandleLike]>;
}

export async function readDirectoryHandle(rootHandle: FsHandleLike): Promise<{
  projectName: string;
  files: Record<string, string>;
}> {
  const files: Record<string, string> = {};
  const projectName = rootHandle.name === '.sdd' ? 'sdd-project' : rootHandle.name || 'sdd-project';

  async function walk(handle: FsHandleLike, prefix: string, depth: number) {
    if (depth > 8 || !handle.entries) return;
    for await (const [name, child] of handle.entries()) {
      if (name === 'node_modules' || name === '.git') continue;
      const rel = prefix ? `${prefix}/${name}` : name;
      if (child.kind === 'directory') {
        if (
          depth === 0 &&
          name !== '.sdd' &&
          name !== 'skills' &&
          name !== '.agents' &&
          !['specs', 'memory', 'metrics', 'evidence', 'templates', 'rules'].includes(name)
        ) {
          continue;
        }
        await walk(child, rel, depth + 1);
      } else if (child.kind === 'file' && child.getFile) {
        if (!isRelevantSddPath(rel)) continue;
        const file = await child.getFile();
        if (file.size <= MAX_FILE_BYTES) {
          files[rel] = await file.text();
        }
      }
    }
  }

  await walk(rootHandle, '', 0);
  return { projectName, files };
}
