import type { ProjectSnapshot, ProjectSummary } from '@sdd/contracts';

export const DEMO_PROJECT_ID = 'cloud-billing-service';

export const DEMO_PROJECT_SUMMARY: ProjectSummary = {
  id: DEMO_PROJECT_ID,
  name: 'Cloud Billing Service (Demo)',
  source: 'demo',
  activePhaseId: 'phase-003-stripe-webhook-handling',
  overallProgressPct: 80,
  frameworkVersion: '2.4.0',
  contentRevision: 'demo-v240-9f8e7d6c',
};

export const DEMO_PROJECT_SNAPSHOT: ProjectSnapshot = {
  projectId: DEMO_PROJECT_ID,
  projectName: 'Cloud Billing Service (Demo)',
  activePhaseId: 'phase-003-stripe-webhook-handling',
  contentRevision: 'demo-v240-9f8e7d6c',
  account: {
    name: 'Demo Workspace',
    branch: 'feat/phase-003-stripe-webhook-handling',
    headCommit: '7b29e01',
    isDirty: false,
    dirtyCount: 0,
  },
  framework: {
    version: '2.4.0',
    profile: 'api',
    constitution: {
      content: `# Constitutional Framework — Cloud Billing Service

**Status:** Active  
**Profile:** API Service

## Articles

### Article I — Specs Before Code
Every webhook handler, idempotency key store, and retry policy requires approved \`requirements.md\`, \`design.md\`, and \`tasks.md\` before implementation begins.

### Article II — Fail-Closed Verification
Webhook signature checks and idempotency locks must fail closed on invalid HMAC headers, missing timestamps, or expired replay windows.

### Article III — Transparent Agent Telemetry
Every onboarding, phase start, and task transition logs agent, harness, and model attribution in \`.sdd/metrics/events.jsonl\`.`,
    },
  },
  phases: [
    {
      id: 'phase-003-stripe-webhook-handling',
      name: 'Phase 003 — Stripe Webhook Handling',
      category: 'active',
      taskCounts: {
        total: 4,
        completed: 2,
        inProgress: 1,
        todo: 1,
        percent: 50,
      },
      requirements: [
        { id: 'REQ-3.1', title: 'HMAC Signature & Replay Window Verification' },
        { id: 'REQ-3.2', title: 'Idempotent Event Deduplication Store' },
        { id: 'REQ-3.3', title: 'Asynchronous Billing Queue Dispatch' },
      ],
      tasks: [
        {
          id: 'T003.1',
          title: 'Implement constant-time Stripe-Signature HMAC verification middleware',
          status: 'done',
          reqRefs: ['REQ-3.1'],
        },
        {
          id: 'T003.2',
          title: 'Add Postgres unique event_id idempotency lock with 72h TTL',
          status: 'done',
          reqRefs: ['REQ-3.2'],
        },
        {
          id: 'T003.3',
          title: 'Dispatch verified billing events to async worker queue with dead-letter fallback',
          status: 'doing',
          reqRefs: ['REQ-3.3'],
        },
        {
          id: 'T003.4',
          title: 'Add negative integration tests for expired timestamps and duplicate deliveries',
          status: 'todo',
          reqRefs: ['REQ-3.1', 'REQ-3.2'],
        },
      ],
      artifacts: {
        requirements: {
          status: 'APPROVED',
          content: `# Phase 003 — Stripe Webhook Handling (Requirements)

**Status:** APPROVED  
**Approved:** 2026-11-18

### REQ-3.1: HMAC Signature & Replay Window Verification
1. WHEN a webhook request arrives with an invalid or missing \`Stripe-Signature\` header THEN the endpoint rejects it with HTTP \`401\`.
2. WHEN the signature timestamp is older than 300 seconds THEN the handler rejects the replay attempt.

### REQ-3.2: Idempotent Event Deduplication Store
1. WHEN Stripe retries an already-processed \`event.id\` THEN the worker acknowledges \`200 OK\` without re-applying invoice mutations.

### REQ-3.3: Asynchronous Billing Queue Dispatch
1. WHEN a valid new event is recorded THEN it is enqueued within 50ms for asynchronous ledger reconciliation.`,
        },
        design: {
          status: 'APPROVED',
          content: `# Phase 003 — Design

**Status:** APPROVED  
**Approved:** 2026-11-19

## Architecture

\`\`\`mermaid
flowchart LR
  Stripe[Stripe Webhook] --> Verify[HMAC + 300s Replay Check]
  Verify -->|Valid| Dedupe[Postgres event_id Lock]
  Verify -->|Invalid| Reject[401 Fail Closed]
  Dedupe -->|New Event| Queue[Async Billing Queue]
  Dedupe -->|Duplicate| Ack[200 Idempotent Ack]
\`\`\`

## Decisions
- Use \`crypto.timingSafeEqual\` against raw request body bytes before JSON parsing.
- Persist \`stripe_events(event_id PRIMARY KEY, received_at)\` before dispatching to queue.`,
        },
        tasks: {
          status: 'APPROVED',
          content: `# Phase 003 — Tasks

- [x] **[T003.1]** Implement constant-time Stripe-Signature HMAC verification middleware (\`REQ-3.1\`)
- [x] **[T003.2]** Add Postgres unique event_id idempotency lock with 72h TTL (\`REQ-3.2\`)
- [/] **[T003.3]** Dispatch verified billing events to async worker queue with dead-letter fallback (\`REQ-3.3\`)
- [ ] **[T003.4]** Add negative integration tests for expired timestamps and duplicate deliveries (\`REQ-3.1\`, \`REQ-3.2\`)`,
        },
        evidence: [
          {
            id: 'webhook-idempotency.md',
            filename: 'webhook-idempotency.md',
            title: 'Webhook Verification & Deduplication Evidence',
            taskRefs: ['T003.1', 'T003.2'],
            reqRefs: ['REQ-3.1', 'REQ-3.2'],
            content: `# Verification Evidence — T003.1 & T003.2

**Result:** PASS  
**Commit:** \`7b29e01\`  
**Command:** \`npm test -- tests/webhook-verify.test.js\`

- Verified valid HMAC signatures pass in < 2ms.
- Verified tampered payloads and >300s timestamps return \`401\`.
- Verified concurrent duplicate \`evt_123\` deliveries apply only once.`,
          },
        ],
      },
      metrics: {
        healthScore: 88,
        traceability: {
          totalRequirements: 3,
          mappedRequirements: 3,
          verifiedRequirements: 2,
          orphanTaskCount: 0,
          unmappedRequirements: [],
        },
      },
    },
    {
      id: 'phase-002-invoice-generation',
      name: 'Phase 002 — Invoice Generation & PDF Ledger',
      category: 'archive',
      taskCounts: {
        total: 3,
        completed: 3,
        inProgress: 0,
        todo: 0,
        percent: 100,
      },
      requirements: [
        { id: 'REQ-2.1', title: 'Deterministic Line-Item Rounding' },
        { id: 'REQ-2.2', title: 'Immutable Tax Snapshot Capture' },
      ],
      tasks: [
        { id: 'T002.1', title: 'Implement integer minor-unit currency calculator', status: 'done', reqRefs: ['REQ-2.1'] },
        { id: 'T002.2', title: 'Store immutable tax jurisdiction snapshot per invoice', status: 'done', reqRefs: ['REQ-2.2'] },
        { id: 'T002.3', title: 'Generate signed PDF receipt URLs with 15m expiry', status: 'done', reqRefs: ['REQ-2.1', 'REQ-2.2'] },
      ],
      artifacts: {
        requirements: {
          status: 'APPROVED',
          content: `# Phase 002 — Invoice Generation (Requirements)\n\n### REQ-2.1: Deterministic Line-Item Rounding\nAll calculations execute in integer cents.\n\n### REQ-2.2: Immutable Tax Snapshot Capture\nInvoices retain point-in-time tax rate metadata.`,
        },
        design: {
          status: 'APPROVED',
          content: `# Phase 002 — Design\n\nAll monetary values are represented as \`bigint\` minor units paired with ISO-4217 currency codes.`,
        },
        tasks: {
          status: 'APPROVED',
          content: `# Phase 002 — Tasks\n\n- [x] **[T002.1]** Implement integer minor-unit currency calculator\n- [x] **[T002.2]** Store immutable tax jurisdiction snapshot per invoice\n- [x] **[T002.3]** Generate signed PDF receipt URLs with 15m expiry`,
        },
      },
      metrics: {
        healthScore: 96,
        traceability: {
          totalRequirements: 2,
          mappedRequirements: 2,
          verifiedRequirements: 2,
          orphanTaskCount: 0,
          unmappedRequirements: [],
        },
      },
    },
    {
      id: 'phase-001-account-provisioning',
      name: 'Phase 001 — Tenant Account Provisioning',
      category: 'archive',
      taskCounts: {
        total: 3,
        completed: 3,
        inProgress: 0,
        todo: 0,
        percent: 100,
      },
      requirements: [
        { id: 'REQ-1.1', title: 'Idempotent Customer Onboarding API' },
      ],
      tasks: [
        { id: 'T001.1', title: 'Create tenant_accounts schema with RLS isolation', status: 'done', reqRefs: ['REQ-1.1'] },
        { id: 'T001.2', title: 'Add POST /v1/accounts idempotency key header', status: 'done', reqRefs: ['REQ-1.1'] },
        { id: 'T001.3', title: 'Verify cross-tenant RLS isolation suite', status: 'done', reqRefs: ['REQ-1.1'] },
      ],
      artifacts: {
        requirements: {
          status: 'APPROVED',
          content: `# Phase 001 — Tenant Account Provisioning\n\n### REQ-1.1: Idempotent Customer Onboarding API\nTenant creation supports idempotency keys and enforces RLS.`,
        },
        design: {
          status: 'APPROVED',
          content: `# Phase 001 — Design\n\nPostgreSQL Row-Level Security scopes every row to \`auth.uid()\`.`,
        },
        tasks: {
          status: 'APPROVED',
          content: `# Phase 001 — Tasks\n\n- [x] **[T001.1]** Create tenant_accounts schema with RLS isolation\n- [x] **[T001.2]** Add POST /v1/accounts idempotency key header\n- [x] **[T001.3]** Verify cross-tenant RLS isolation suite`,
        },
      },
      metrics: {
        healthScore: 98,
        traceability: {
          totalRequirements: 1,
          mappedRequirements: 1,
          verifiedRequirements: 1,
          orphanTaskCount: 0,
          unmappedRequirements: [],
        },
      },
    },
  ],
  metrics: {
    overallHealthScore: 94,
    totalRequirements: 6,
    totalTasks: 10,
    completedTasks: 8,
    overallProgressPct: 80,
    traceabilityCoveragePct: 100,
    verificationAssurancePct: 83,
    activeSprintsCount: 1,
    orphanTaskCount: 0,
    unmappedReqCount: 0,
  },
  telemetry: {
    ratesAsOf: '2026-11-20',
    attribution: [
      {
        ts: '2026-11-18T09:10:00Z',
        event: 'onboard',
        phase: null,
        task: null,
        status: null,
        agent: 'architect',
        harness: 'antigravity',
        model: 'gemini-4-neon-medium',
        provider: 'google',
        session_id: 'sess-demo-01',
        rev: '4a18c20',
      },
      {
        ts: '2026-11-19T10:02:00Z',
        event: 'phase_start',
        phase: 'phase-003-stripe-webhook-handling',
        task: null,
        status: null,
        agent: 'lead-dev',
        harness: 'claude',
        model: 'claude-sonnet-5.5',
        provider: 'anthropic',
        session_id: 'sess-demo-02',
        rev: '5c21f10',
      },
      {
        ts: '2026-11-19T10:45:00Z',
        event: 'task_done',
        phase: 'phase-003-stripe-webhook-handling',
        task: 'T003.1',
        status: 'done',
        agent: 'lead-dev',
        harness: 'claude',
        model: 'claude-sonnet-5.5',
        provider: 'anthropic',
        session_id: 'sess-demo-02',
        rev: '6a88d04',
      },
      {
        ts: '2026-11-20T14:15:00Z',
        event: 'task_done',
        phase: 'phase-003-stripe-webhook-handling',
        task: 'T003.2',
        status: 'done',
        agent: 'worker-api',
        harness: 'codex',
        model: 'gpt-5.3-codex',
        provider: 'openai',
        session_id: 'sess-demo-03',
        rev: '7b29e01',
      },
      {
        ts: '2026-11-21T08:30:00Z',
        event: 'task_doing',
        phase: 'phase-003-stripe-webhook-handling',
        task: 'T003.3',
        status: 'doing',
        agent: 'worker-queue',
        harness: 'antigravity',
        model: 'gemini-4-neon-medium',
        provider: 'google',
        session_id: 'sess-demo-04',
        rev: '7b29e01',
      },
    ],
    onboarding: [
      {
        ts: '2026-11-18T09:10:00Z',
        event: 'onboard',
        phase: null,
        task: null,
        status: null,
        agent: 'architect',
        harness: 'antigravity',
        model: 'gemini-4-neon-medium',
        provider: 'google',
        session_id: 'sess-demo-01',
        rev: '4a18c20',
      },
    ],
    phaseStarts: [
      {
        ts: '2026-11-19T10:02:00Z',
        event: 'phase_start',
        phase: 'phase-003-stripe-webhook-handling',
        task: null,
        status: null,
        agent: 'lead-dev',
        harness: 'claude',
        model: 'claude-sonnet-5.5',
        provider: 'anthropic',
        session_id: 'sess-demo-02',
        rev: '5c21f10',
      },
    ],
    taskEvents: [
      {
        ts: '2026-11-19T10:45:00Z',
        event: 'task_done',
        phase: 'phase-003-stripe-webhook-handling',
        task: 'T003.1',
        status: 'done',
        agent: 'lead-dev',
        harness: 'claude',
        model: 'claude-sonnet-5.5',
        provider: 'anthropic',
        session_id: 'sess-demo-02',
        rev: '6a88d04',
      },
      {
        ts: '2026-11-20T14:15:00Z',
        event: 'task_done',
        phase: 'phase-003-stripe-webhook-handling',
        task: 'T003.2',
        status: 'done',
        agent: 'worker-api',
        harness: 'codex',
        model: 'gpt-5.3-codex',
        provider: 'openai',
        session_id: 'sess-demo-03',
        rev: '7b29e01',
      },
      {
        ts: '2026-11-21T08:30:00Z',
        event: 'task_doing',
        phase: 'phase-003-stripe-webhook-handling',
        task: 'T003.3',
        status: 'doing',
        agent: 'worker-queue',
        harness: 'antigravity',
        model: 'gemini-4-neon-medium',
        provider: 'google',
        session_id: 'sess-demo-04',
        rev: '7b29e01',
      },
    ],
    rollups: {
      totalUsd: 1.8425,
      totalTokens: {
        input: 318400,
        output: 46200,
        cache_read: 612000,
        cache_write: 28000,
      },
      byModel: [
        {
          model: 'claude-sonnet-5.5',
          provider: 'anthropic',
          calls: 18,
          tokens_in: 124000,
          tokens_out: 19400,
          tokens_cache_read: 380000,
          tokens_cache_write: 18000,
          usd: 0.964,
          provenance: 'measured',
        },
        {
          model: 'gpt-5.3-codex',
          provider: 'openai',
          calls: 12,
          tokens_in: 98400,
          tokens_out: 14200,
          tokens_cache_read: 142000,
          tokens_cache_write: 0,
          usd: 0.591,
          provenance: 'measured',
        },
        {
          model: 'gemini-4-neon-medium',
          provider: 'google',
          calls: 9,
          tokens_in: 96000,
          tokens_out: 12600,
          tokens_cache_read: 90000,
          tokens_cache_write: 10000,
          usd: 0.2875,
          provenance: 'estimated',
        },
      ],
      byHarness: [
        {
          harness: 'claude',
          calls: 18,
          tokens_total: 541400,
          usd: 0.964,
          provenance: 'measured',
        },
        {
          harness: 'codex',
          calls: 12,
          tokens_total: 254600,
          usd: 0.591,
          provenance: 'measured',
        },
        {
          harness: 'antigravity',
          calls: 9,
          tokens_total: 208600,
          usd: 0.2875,
          provenance: 'estimated',
        },
      ],
    },
    deliveryReport: null,
  },
  hooks: {
    configured: [
      { name: 'pre-commit', exists: true },
      { name: 'pre-push', exists: true },
    ],
    runs: [{ gate: 'doctor', result: 'PASS', ts: '2026-11-20T14:20:00Z' }],
  },
  skills: [
    {
      id: 'spec-authoring',
      name: 'spec-authoring',
      description: 'Author requirements, design, and traceable task specs conforming to SDD rules.',
      content: `# Skill: Spec Authoring\n\nEnsures every phase progresses sequentially: \`requirements.md\` → \`design.md\` → \`tasks.md\`.`,
    },
    {
      id: 'api-verification',
      name: 'api-verification',
      description: 'Verify webhook HMAC signatures, idempotency locks, and negative fail-closed tests.',
      content: `# Skill: API Verification\n\nCaptures positive and negative verification results in \`.sdd/evidence/\`.`,
    },
  ],
  diagnostics: [
    {
      type: 'info',
      message: 'Interactive demo dataset loaded cleanly in browser memory (zero CLI commands required).',
    },
  ],
};
