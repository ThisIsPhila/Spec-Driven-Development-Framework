export type Provenance = 'measured' | 'estimated';

export interface AgentAttributionEvent {
  ts: string;
  event: 'onboard' | 'phase_start' | 'task_doing' | 'task_done' | 'task_todo' | string;
  phase: string | null;
  task: string | null;
  status: string | null;
  agent: string;
  harness: string;
  model: string;
  provider: string;
  session_id: string;
  rev: string;
}

export interface ModelRollup {
  model: string;
  provider: string;
  calls: number;
  tokens_in: number;
  tokens_out: number;
  tokens_cache_read: number;
  tokens_cache_write: number;
  usd: number;
  provenance: Provenance;
}

export interface HarnessRollup {
  harness: string;
  calls: number;
  tokens_total: number;
  usd: number;
  provenance: Provenance;
}

export interface TelemetryRollups {
  totalUsd: number;
  totalTokens: {
    input: number;
    output: number;
    cache_read: number;
    cache_write: number;
  };
  byModel: ModelRollup[];
  byHarness: HarnessRollup[];
}

export interface ProjectTelemetry {
  attribution: AgentAttributionEvent[];
  onboarding: AgentAttributionEvent[];
  phaseStarts: AgentAttributionEvent[];
  taskEvents: AgentAttributionEvent[];
  rollups: TelemetryRollups;
  deliveryReport: Record<string, unknown> | null;
  ratesAsOf: string | null;
}

export interface TaskItem {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  reqRefs?: string[];
  rawLine?: string;
}

export interface RequirementItem {
  id: string;
  title: string;
}

export interface PhaseArtifact {
  path?: string;
  content: string;
  status?: string;
}

export interface PhaseRecord {
  id: string;
  name: string;
  category: 'active' | 'archive' | 'backlog';
  taskCounts: {
    total: number;
    completed: number;
    inProgress: number;
    todo: number;
    percent: number;
  };
  requirements: RequirementItem[];
  tasks: TaskItem[];
  artifacts: {
    requirements?: PhaseArtifact;
    design?: PhaseArtifact;
    tasks?: PhaseArtifact;
    evidence?: Array<{
      id: string;
      filename: string;
      title: string;
      content: string;
      taskRefs?: string[];
      reqRefs?: string[];
    }>;
  };
  liveSource?: { worktree: string; branch: string };
  warnings?: string[];
  metrics?: {
    healthScore?: number;
    traceability?: {
      totalRequirements: number;
      mappedRequirements: number;
      verifiedRequirements: number;
      orphanTaskCount: number;
      unmappedRequirements: string[];
    };
  };
}

export interface ProjectSnapshot {
  projectName: string;
  projectRoot?: string;
  activePhaseId: string | null;
  contentRevision: string;
  account?: {
    name?: string;
    branch?: string;
    headCommit?: string;
    isDirty?: boolean;
    dirtyCount?: number;
  };
  framework?: {
    version?: string;
    profile?: string;
    constitution?: { content: string };
  };
  phases: PhaseRecord[];
  metrics: {
    overallHealthScore: number;
    totalRequirements: number;
    totalTasks: number;
    completedTasks: number;
    overallProgressPct: number;
    traceabilityCoveragePct: number;
    verificationAssurancePct: number;
    activeSprintsCount: number;
    orphanTaskCount: number;
    unmappedReqCount: number;
  };
  telemetry?: ProjectTelemetry;
  hooks?: {
    configured?: Array<{ name: string; exists: boolean }>;
    runs?: Array<Record<string, unknown>>;
  };
  skills?: Array<{ id: string; name: string; description: string; content?: string }>;
  rules?: Array<{ name: string; content: string }>;
  memories?: Record<string, { content?: string }>;
  diagnostics?: Array<{ type: string; message: string }>;
}

export interface ProjectSummary {
  id: string;
  name: string;
  source: 'local' | 'cloud';
  activePhaseId: string | null;
  overallProgressPct: number;
  frameworkVersion?: string;
  lastSyncedAt?: string;
  contentRevision?: string;
}

export interface CloudSyncPayload {
  slug: string;
  name: string;
  frameworkVersion: string;
  activePhaseId: string | null;
  revision: string;
  snapshot: ProjectSnapshot;
}
