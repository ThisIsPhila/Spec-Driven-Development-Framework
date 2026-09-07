# Phase 003 - Framework Hardening - Requirements

**Phase:** Phase 003 - Framework Hardening
**Created:** 2026-08-19
**Status:** ✅ APPROVED
**Approved:** 2026-08-19

---

## 🎯 Phase Overview

**Goal:** Make the framework do what its documentation says it does, and put a safety net under it
so that it cannot silently stop doing so again.

**Why This Phase Matters:**
The framework currently cannot execute its own mandated workflow in its own repository
(`docs/assessment.md` F1), and it has zero behavioural tests across 2,750 lines of automation
(F5). Those two facts compound: there is no mechanism that would have caught the first, which is
how it survived into a tagged release. Every further improvement to this project is unverifiable
until a test harness exists.

**Ordering rationale:** tests and CI come *first*, before the state refactor. Behavioural tests
assert on the workflow contract, and that contract survives the refactor — so tests written now
protect the riskiest change rather than being rewritten after it. Writing them afterwards gets the
order backwards.

**Scope boundary:** this phase does not touch agent adapters, distribution/packaging, or profile
content. Those depend on a working, tested core and are deferred.

**Duration Estimate:** 6-10 hours
**Complexity:** Medium

---

## 📋 Requirements

### REQ-003.1: Behavioural Test Harness

**User Story:**
As a maintainer, I need automated tests that exercise the framework's real behaviour so that I can
change the automation without silently breaking consumers.

**Acceptance Criteria:**
1. WHEN the test suite runs THEN it MUST install the framework into a temporary directory via
   `setup.sh` and assert on the resulting file tree, rather than inspecting `defaults/` in place.
2. WHEN the test suite runs THEN it MUST execute the full sprint lifecycle
   (`new` → `approve` → `start` → `task` → `finish`) and assert the resulting state after each
   step.
3. WHEN a documented command references a path THEN a test MUST assert that path exists after a
   real install, so that F1-class defects fail the suite.
4. WHEN the suite runs THEN it MUST leave no artifacts outside its temporary directory, and MUST
   not require network access.
5. WHEN a test fails THEN the output MUST identify the failing assertion and the expected versus
   actual value.

**Success Metrics:**
- The suite reproduces F1 as a failing test before F1 is fixed.
- Suite completes in under 60 seconds locally.

**Priority:** 🔴 CRITICAL

---

### REQ-003.2: Continuous Integration

**User Story:**
As a maintainer, I need validation to run on every push so that enforcement does not depend on a
bypassable local git hook.

**Acceptance Criteria:**
1. WHEN a commit is pushed or a pull request opened THEN CI MUST run `doctor.sh`,
   `skills.sh validate`, the spec linter, and the REQ-003.1 test suite.
2. WHEN any of those fail THEN the CI run MUST fail.
3. WHEN CI runs THEN it MUST NOT depend on the local `.git/hooks/pre-commit` being installed.
4. CI MUST run on a clean checkout, proving the repository is self-sufficient after clone.

**Success Metrics:**
- A deliberately broken spec lifecycle fails CI.

**Priority:** 🔴 CRITICAL

---

### REQ-003.3: Machine-Readable State

**User Story:**
As an agent or script, I need to read workflow state deterministically so that operations do not
depend on parsing human-edited prose.

**Acceptance Criteria:**
1. WHEN a sprint is active THEN the active phase, its spec folder name, task states, and approval
   states MUST be readable from a single machine-readable state file.
2. WHEN a human edits narrative sections of `active-context.md` THEN `phase.sh status`, `task`, and
   `finish` MUST continue to work.
3. WHEN state changes THEN human-readable markdown MUST be regenerated from state, so the two
   cannot disagree.
4. WHEN a state write cannot be completed THEN the command MUST fail loudly rather than reporting
   success. (No silent no-ops — see F2.)
5. WHEN a project has an existing `active-context.md` and no state file THEN state MUST be
   migrated automatically without data loss.

**Success Metrics:**
- `phase.sh status` succeeds immediately after an arbitrary hand-edit to `active-context.md` prose.

**Priority:** 🔴 CRITICAL

---

### REQ-003.4: Stable Task Identity

**User Story:**
As an agent, I need to address a task by a stable identifier so that marking a task complete cannot
silently modify the wrong one.

**Acceptance Criteria:**
1. WHEN `tasks.md` is generated from the template THEN each task MUST carry a stable, unique ID.
2. WHEN `phase.sh task <id> <status>` is called with an ID THEN it MUST match exactly one task, or
   fail.
3. WHEN an ID matches zero or more than one task THEN the command MUST fail with an actionable
   message and change nothing.

**Priority:** 🟡 HIGH

---

### REQ-003.5: Spec Scaffolding and Typed Approval

**User Story:**
As a user, I need commands to create and approve specs so that the two most common workflow steps
are not manual file editing.

**Acceptance Criteria:**
1. WHEN `phase.sh new <phase-name>` is run THEN it MUST validate the name against the spec-naming
   regex and scaffold the spec folder from `.sdd/templates/`.
2. WHEN `phase.sh approve <requirements|design|tasks>` is run THEN it MUST record approval as a
   typed state transition, not a hand-edited prose string.
3. WHEN approval is attempted out of order THEN the command MUST refuse.
4. WHEN `phase.sh start` is run against a spec with unapproved artifacts THEN it MUST **fail**, not
   warn. (Closes F4.)

**Priority:** 🟡 HIGH

---

### REQ-003.6: Documentation and Reality Reconciliation

**User Story:**
As an agent entering this repository, I need every documented command to work so that I do not
follow a broken instruction confidently.

**Acceptance Criteria:**
1. WHEN any documented command path is invoked from the repository root THEN it MUST resolve,
   in both the framework repo and a consumer project.
2. WHEN the spec linter (`validate-spec.js`) is relevant THEN it MUST be invoked automatically by
   `doctor.sh`, and MUST degrade gracefully when `node` is unavailable.
3. WHEN `doctor.sh` runs in the framework repository THEN it MUST NOT suppress genuine structural
   failures. The `IS_FRAMEWORK` escape hatch MUST be removed or narrowed to artifacts that
   legitimately do not apply.
4. WHEN documentation cites a rule file, script, or directory THEN that target MUST exist.

**Priority:** 🟡 HIGH

---

## 🎯 Success Criteria for Phase 003

**Phase 003 is COMPLETE when:**

1. `bash .sdd/scripts/phase.sh status` and the root-relative equivalent both work in this
   repository.
2. The full sprint lifecycle can be executed end to end on a real spec, and is covered by a test.
3. CI runs on every push and fails on a broken lifecycle, spec, or structure.
4. No documented command in `README.md`, `docs/`, `AGENTS.md`, or `AGENT_ONBOARDING.md` fails when
   run as written.
5. `doctor.sh` no longer needs a special case to pass against its own repository.

---

## 📝 Dependencies & Assumptions

**Dependencies:**
- None external. Bash and git only; `node` optional and must degrade gracefully.

**Assumptions:**
- Bash 3.2 compatibility remains required (default macOS bash), consistent with the constraint
  recorded for Phase 002.
- GitHub Actions is the CI target.

**Risks:**
1. **State refactor breaks consumer projects mid-sprint.**
   - **Mitigation:** REQ-003.3.5 requires automatic migration; a test must cover the
     legacy-to-state upgrade path.
2. **Test harness invokes `git checkout` and disturbs the working tree.**
   - **Mitigation:** tests must run entirely inside a temp directory with its own git repo.
3. **Scope creep into adapters and packaging.**
   - **Mitigation:** explicit scope boundary above; deferred to later phases.

---

## 🔐 Privacy & Security Model

**Data Classification:** Public

**PII Risk:** [ ] Yes / [x] No
_This phase touches only framework tooling. No user or customer data is processed._

### Masking Strategy
- [x] Data minimization (collect only what is needed)

Additional note: the test harness must not write outside its temporary directory, and CI must not
expose repository secrets to test processes.

---

## ✅ Approval Checkpoint

**Status:** Approved by the user in session on 2026-08-19 ("Alright, I'm happy with that. Go
ahead"), covering the scope and ordering proposed prior to this document: tests and CI first, then
the state refactor, with adapters and distribution deferred.

**Deferred decision carried forward:** profile strategy (assessment F6 — deepen vs collapse). Not
blocking. The test matrix for REQ-003.1 will cover a representative subset of compositions rather
than all 21, so that collapsing later reduces the matrix without invalidating the tests.
