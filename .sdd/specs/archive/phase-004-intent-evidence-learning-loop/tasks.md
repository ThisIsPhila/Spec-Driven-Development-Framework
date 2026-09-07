# Phase 004 — Intent, Evidence, and Learning Loop — Tasks

**Status:** 🚀 READY TO START
**Requirements:** Approved 2026-09-07 under `SDD-EXC-2026-09-07-01`  
**Design:** Approved 2026-09-07 under `SDD-EXC-2026-09-07-01`  
**Execution authority:** Granted only for this framework repository by `SDD-EXC-2026-09-07-01`

Only top-level task lines carry lifecycle checkboxes.

## Task plan

- [x] **[T004.1] Canonical governance and agent contract**
  - **Objective and requirements:** Establish one non-repetitive authority and explicit authorization/truth rules; REQ-004.1–004.3.
  - **Implementation and owned outputs:** Update canonical/default constitution, onboarding, glossary, agent entrypoints, governance template, and framework metadata schema.
  - **Owned paths:** `.sdd/constitution.md`, `defaults/`, root agent entrypoints, `.sdd/framework.json`.
  - **Dependencies:** Preserve current Phase 003 changes and universal/project-specific separation.
  - **Positive and negative verification:** Fresh install has one constitution and all pointers resolve; no entrypoint restates policy.
  - **Acceptance evidence:** Full install tests and exact-tree diff.
  - **No-go conditions and handoff:** No product-specific Smart Trader rule in defaults; hand off topology to T004.2.

- [x] **[T004.2] Evidence, report, governance, archive, and learning topology**
  - **Objective and requirements:** Install canonical SDD homes and feedback-loop artifacts; REQ-004.4, REQ-004.6.
  - **Implementation and owned outputs:** Add directory scaffolds, placement rule, evidence/report/governance/learning templates, and current-state learning fields.
  - **Owned paths:** `defaults/memory/`, `defaults/templates/`, `.sdd/` self-hosted mirrors.
  - **Dependencies:** T004.1 terminology.
  - **Positive and negative verification:** Installed tree contains every home; stray scan rejects SDD process artifacts outside `.sdd` without rejecting product docs.
  - **Acceptance evidence:** Install fixture assertions and doctor output.
  - **No-go conditions and handoff:** No duplicated state authority; hand off task validation to T004.3.

- [x] **[T004.3] Detailed task-contract and threshold validation**
  - **Objective and requirements:** Make future task plans executable and validate only governed phases; REQ-004.5–004.6.
  - **Implementation and owned outputs:** Replace both task templates and extend doctor with stable-ID uniqueness, required task fields, and `forwardThreshold` handling.
  - **Owned paths:** `defaults/templates/tasks-template.md`, `.sdd/templates/tasks-template.md`, `scripts/doctor.sh`, tests.
  - **Dependencies:** T004.1 metadata.
  - **Positive and negative verification:** Complete governed task passes; missing field/duplicate ID fails; pre-threshold history is not retro-certified or blocked.
  - **Acceptance evidence:** Dedicated task-contract test results.
  - **No-go conditions and handoff:** Doctor cannot fabricate approval; hand off runtime compatibility to T004.4.

- [x] **[T004.4] Runtime-neutral validator and safe upgrade**
  - **Objective and requirements:** Support ESM/CommonJS consumers and non-destructive adoption; REQ-004.4, REQ-004.7.
  - **Implementation and owned outputs:** Rename validator to `.cjs`, update all references/symlinks, add conservative `--upgrade` behavior and manifest.
  - **Owned paths:** `scripts/setup.sh`, `scripts/doctor.sh`, `scripts/validate-spec.cjs`, `.sdd/scripts/`, docs, tests.
  - **Dependencies:** T004.1 ownership metadata and T004.2 archive home.
  - **Positive and negative verification:** ESM fixture passes; upgrade preserves custom constitution, specs, skills, and hooks byte-for-byte; partial/conflicting upgrade reports failure or conflict truthfully.
  - **Acceptance evidence:** Upgrade and runtime compatibility test results.
  - **No-go conditions and handoff:** No destructive overwrite; hand off documentation to T004.5.

- [x] **[T004.5] Documentation, migration, and learning-loop guidance**
  - **Objective and requirements:** Make the corrected behavior understandable and usable; all requirements.
  - **Implementation and owned outputs:** Update README, architecture, governance, process flows, CLI, changelog, onboarding, and migration guidance with the current→intended→gap→action→evidence→learning loop.
  - **Owned paths:** `README.md`, `CHANGELOG.md`, `docs/`, onboarding and workflow skill files.
  - **Dependencies:** T004.1–T004.4 actual behavior.
  - **Positive and negative verification:** Every documented command/path resolves; wording separates implementation, verification, deployment, and acceptance.
  - **Acceptance evidence:** Documented-path suite and cross-reference audit.
  - **No-go conditions and handoff:** No aspirational command presented as implemented; hand off release verification to T004.6.

- [x] **[T004.6] Exact-tree verification and local release checkpoint**
  - **Objective and requirements:** Reconcile implementation, evidence, and framework state; all requirements.
  - **Implementation and owned outputs:** Run doctor, skills validation, full behavioral suite, diff checks, clean artifact audit, and write closeout report.
  - **Owned paths:** `.sdd/evidence/phase-004/`, `.sdd/reports/phase-004/`, lifecycle state, changelog.
  - **Dependencies:** T004.1–T004.5.
  - **Positive and negative verification:** All applicable checks pass on recorded commit/tree; injected ESM, task-contract, and hook-overwrite failures are caught.
  - **Acceptance evidence:** Phase evidence manifest and assessment report.
  - **No-go conditions and handoff:** Push/release remain unauthorized; local commit becomes the owner-review checkpoint.

## Dependency map

```text
T004.1 → T004.2 → T004.3
   └────────────→ T004.4
T004.3 + T004.4 → T004.5 → T004.6
```

## Completion criteria

All six tasks and their negative checks pass, the framework installs and upgrades safely, self-hosted/default copies agree where intended, evidence and reports are reconciled, and no push or release is implied by local completion.
