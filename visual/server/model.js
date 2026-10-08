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
    phases: [],
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
    },
    taskCounts: {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      percent: 0,
    },
    requirements: [],
    tasks: [],
    relationships: [],
    warnings: [],
  };
}
