/**
 * SDD Data Model & Helper Types
 */

export function createProjectSnapshot(projectId, projectRoot) {
  return {
    projectId: projectId || 'unknown-project',
    projectRoot: projectRoot || '',
    extractionTime: new Date().toISOString(),
    contentRevision: '',
    profile: 'general',
    activePhaseId: null,
    account: {
      name: 'Local Developer',
      email: '',
      branch: 'local',
      headCommit: '',
      isDirty: false,
      dirtyCount: 0,
    },
    metrics: {
      overallHealthScore: 0,
      overallHealthGrade: 'UNKNOWN',
      totalRequirements: 0,
      totalTasks: 0,
      completedTasks: 0,
      overallProgressPct: 0,
      traceabilityCoveragePct: 0,
      verificationAssurancePct: 0,
      activeSprintsCount: 0,
      orphanTaskCount: 0,
      unmappedReqCount: 0,
      phasesBurndown: [],
    },
    phases: [],
    framework: {
      constitution: null,
      onboarding: null,
      config: null,
      glossary: null,
    },
    memories: [],
    rules: [],
    reports: [],
    scripts: [],
    templates: [],
    hooks: {
      installed: false,
      path: '',
      gates: [],
      telemetry: {
        activeHooksCount: 0,
        totalGatesRun: 0,
        lastRunTimestamp: '',
        lastCommitChecked: '',
        enforcementLevel: 'STRICT',
        gatesList: [],
      },
    },
    docs: [],
    graphify: {
      nodes: [],
      edges: [],
      summary: '',
    },
    diagnostics: [],
  };
}

export function createPhaseModel(id, category) {
  return {
    id,
    name: id,
    category, // 'active' | 'backlog' | 'archive'
    status: 'UNKNOWN',
    artifacts: {
      requirements: null,
      design: null,
      tasks: null,
      evidence: [],
      acceptance: null,
      remediations: [],
      limitations: [],
      future: [],
    },
    taskCounts: {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      percent: 0,
    },
    metrics: {
      healthScore: 0,
      healthGrade: 'UNKNOWN',
      pillars: {
        definition: 0,
        governance: 0,
        execution: 0,
        verification: 0,
      },
      traceability: {
        totalRequirements: 0,
        mappedRequirements: 0,
        unmappedRequirements: [],
        requirementCoveragePct: 0,
        verifiedRequirements: 0,
        unverifiedRequirements: [],
        verificationCoveragePct: 0,
        totalTasks: 0,
        orphanTasks: [],
        orphanTaskCount: 0,
        matrix: [],
      },
      verificationAssurance: {
        totalEvidenceRuns: 0,
        passCount: 0,
        failCount: 0,
        passRate: 100,
        freshness: 'UNLINKED',
        staleDetails: '',
      },
      tasksPerReqRatio: 0,
    },
    requirements: [],
    tasks: [],
    relationships: [],
    acceptanceCriteria: [],
    remediations: [],
    limitations: [],
    futureWork: [],
    warnings: [],
  };
}
