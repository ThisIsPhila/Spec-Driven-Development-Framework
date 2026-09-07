# Phase 004 — Intent, Evidence, and Learning Loop — Requirements

**Phase:** Phase 004 — Intent, Evidence, and Learning Loop  
**Created:** 2026-09-07  
**Status:** ✅ APPROVED
**Authorization:** Owner directed the official framework update; combined authoring and implementation exception recorded in `.sdd/memory/governance/SDD-EXC-2026-09-07-01.md`

## Outcome

The reusable framework carries forward the corrected Smart Trader operating model: one policy authority, precise authorization, environment-bound evidence, truthful completion, safe framework upgrades, and a learning loop that updates intent deliberately rather than allowing implementation drift.

## Requirements

### REQ-004.1 — Canonical, non-repetitive authority

1. A consumer has one canonical constitution at `.sdd/constitution.md`.
2. Agent entrypoints are concise pointers and cannot become competing policy documents.
3. Framework defaults distinguish universal rules from project-specific invariants and profile amendments.
4. Constitution amendments require authority, version/date, rationale, and corresponding tooling/template changes.

### REQ-004.2 — Explicit scope and authorization

1. The workflow distinguishes review, spec authoring, local implementation, external mutation, merge/push, deployment, and owner acceptance.
2. An authorization grants only the named action and target; it cannot expand by implication.
3. Exceptions are recorded inside `.sdd/memory/governance/` with source, scope, exclusions, and resolution.
4. Product implementation cannot start from draft/co-authored packets unless the exception explicitly authorizes it.

### REQ-004.3 — Truth ladder and exact-tree evidence

1. The framework distinguishes planned, approved, implemented, locally verified, deployed to testing, authenticated-owner verified, owner accepted, production deployed, and live validated states.
2. Evidence records revision/tree, environment, procedure, timestamp, result, and limitations.
3. Remote or UI claims require direct observations from that target; screenshots and local mocks cannot prove durable remote state.
4. A checkbox or agent statement cannot substitute for evidence.

### REQ-004.4 — Artifact placement and preservation

1. Specs, evidence, reports, governance records, current state, and historical thresholds have separate canonical homes under `.sdd/`.
2. `docs/` contains application/user/operator documentation, not authoritative SDD process artifacts.
3. Framework upgrades preserve existing hooks, user work, project rules, and historical specs by default.
4. Migration reports every preserved, added, changed, skipped, and conflicting artifact without claiming success after a partial copy.

### REQ-004.5 — Executable task contracts

1. Each top-level task has a stable ID and one lifecycle checkbox.
2. Each task states objective and requirements, implementation and owned outputs, dependencies, positive and negative verification, evidence, no-go conditions, and handoff.
3. External and irreversible actions are separately visible and gated.
4. Doctor validates task-contract completeness for newly governed phases without retroactively failing archived history.

### REQ-004.6 — Intent-to-learning loop

1. Every active phase makes current state, intended state, observed gap, next authorized action, and learning explicit.
2. Validation failures are classified as problem, specification, interaction, execution, environment, timing, or evidence failure.
3. Learning changes the specification through a recorded decision; it never silently changes implementation while leaving intent stale.
4. User interest, a demo, local tests, deployment, repeated use, and acceptance remain distinct signals.

### REQ-004.7 — Safe adoption and compatibility

1. Setup and migration work in repositories whose package type is ES module or CommonJS.
2. Consumer validation does not depend on the consuming project's JavaScript module mode.
3. An upgrade path updates framework-owned assets while retaining project-owned constitution sections, rules, skills, hooks, and active work.
4. Behavioral tests cover fresh installs and upgrades from a legacy fixture.

## Non-goals

- Encoding Smart Trader, FRAME_25, Confessions, or any other product's domain rules into universal defaults.
- Automatically approving specifications, executing product tasks, deploying, or pushing consumer repositories.
- Replacing human product judgment with aggregate metrics.

## Privacy & Security Model

**Data classification:** Public framework metadata.  
**PII risk:** No. Upgrade and evidence examples must use synthetic values and must never collect secrets.

## Phase acceptance

The phase is acceptable when fresh-install and upgrade tests pass, a generated consumer receives the new governance/evidence/task/learning structure, existing hooks survive an upgrade fixture byte-for-byte, the validator works in an ES-module consumer, documentation matches behavior, and the framework's own SDD records truthfully reconcile the change.
