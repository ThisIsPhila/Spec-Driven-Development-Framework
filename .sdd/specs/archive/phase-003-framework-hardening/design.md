# Phase 003 - Framework Hardening - Design

**Phase:** Phase 003 - Framework Hardening
**Created:** 2026-08-19
**Status:** ✅ APPROVED
**Requirements Approved:** ✅ YES (2026-08-19)
**Approved:** 2026-08-19

---

## 🎯 Design Overview

Six deliverables, ordered so each is verifiable when it lands:

1. `tests/` — behavioural test harness (REQ-003.1)
2. `.github/workflows/ci.yml` — CI (REQ-003.2)
3. `.sdd/state` — machine-readable sprint state (REQ-003.3)
4. Stable task IDs (REQ-003.4)
5. `phase.sh new` / `phase.sh approve`, and start becomes a hard gate (REQ-003.5)
6. Path resolution, linter wiring, escape-hatch removal (REQ-003.6)

---

## 🔧 Key Decisions

### D1 — State format: flat `key=value`, not JSON

**Decision:** `.sdd/state` as a flat `key=value` file, not `state.json`.

**Rationale:** JSON in bash requires `jq` or `node`. Making core workflow depend on either
contradicts the project's bash-only portability, and Bash 3.2 (default macOS, a constraint carried
from Phase 002) has no associative-array-friendly JSON story. The state that needs machine
reading is flat:

```
schema_version=1
active_phase=phase-003-framework-hardening
branch=feat/phase-003-framework-hardening
requirements_approved=2026-08-19
design_approved=2026-08-19
tasks_approved=
started=2026-08-19T14:02:11Z
```

Read with a single grep-based accessor; write with an atomic rewrite. Diff-friendly, no
dependencies. Revisit only if nested state becomes genuinely necessary.

### D2 — Tasks stay in `tasks.md`; state file holds sprint scalars only

**Decision:** task completion state lives *only* in `tasks.md`. The state file never duplicates it.

**Rationale:** this is the important one. Storing task state in both places would recreate exactly
the defect this phase exists to remove — two sources of truth that can disagree (F2). `tasks.md` is
already the human artifact and the checkbox surface, so it wins. The state file holds only what
`tasks.md` cannot express: which phase is active, which branch, and approval timestamps.

**Rule:** one fact, one home.

### D3 — Task IDs: bracketed bold token

**Decision:** `- [ ] **[T003.1]** Task name`

Anchor pattern: `^[[:space:]]*-[[:space:]]*\[[ xX/]\][[:space:]]*\*\*\[T003\.1\]\*\*`

**Rationale:** the current failure is `grep -F "$task_id"` taking the first substring hit
(`phase.sh:342-352`). A delimited token that appears exactly once per task makes matching
unambiguous. `phase.sh task` MUST count matches and fail on zero or many rather than acting on the
first — that behaviour, not the token shape, is the actual fix.

### D4 — `.sdd/scripts/` via symlinks in the framework repo

**Decision:** commit `.sdd/scripts/*.sh` as relative symlinks to `../../scripts/`.

**Rationale:** three options were considered.

| Option | Verdict |
|---|---|
| Copy real files into `.sdd/scripts/` | Rejected — duplication, and F7 drift with no reconciliation |
| Rewrite all 18 doc references to `scripts/` | Rejected — breaks the consumer self-containment story, where `.sdd/scripts/` is correct |
| Relative symlinks | **Chosen** — one source of truth, documented path resolves verbatim in both contexts |

`setup.sh` continues to copy real files into consumer projects, so consumers are unaffected.
Caveat: git symlinks require developer mode on Windows; the framework is already bash-only, so this
does not narrow support. A test asserts the documented path resolves (REQ-003.1.3).

### D5 — `start` becomes a hard gate

**Decision:** unapproved artifacts make `phase.sh start` exit non-zero. Approval is read from the
state file, not grepped from prose.

**Rationale:** currently warnings (`phase.sh:118-127`), so the gate is decorative (F4). With typed
approval from D1 there is no ambiguity to be lenient about. An explicit `--force` escape may be
added for recovery, but it must be loud.

### D6 — Test harness: pure bash, temp dirs, no network

**Decision:** `tests/run.sh` as the entry point, one file per area, a small shared
`tests/lib/assert.sh`.

Each test creates its own throwaway git repo under `mktemp -d`, installs the framework into it via
`setup.sh`, and asserts on the result. Nothing touches the developer's working tree — this matters
because `phase.sh start` runs `git checkout -b`, so testing it in place would move the real branch.

```
tests/
├── run.sh                      # runner; exits non-zero on any failure
├── lib/assert.sh               # assert_eq, assert_file, assert_contains, assert_exit
├── test_install.sh             # REQ-003.1.1 — tree shape per composition
├── test_documented_paths.sh    # REQ-003.1.3 — reproduces F1
├── test_lifecycle.sh           # REQ-003.1.2 — new→approve→start→task→finish
├── test_state.sh               # REQ-003.3 — survives prose edits; migration
└── test_task_ids.sh            # REQ-003.4 — ambiguous ID fails safely
```

Composition matrix is a representative subset — `general`, `web+devsecops`, `api+mlops`,
`monorepo` — not all 21, pending the deferred F6 decision.

### D7 — CI

`.github/workflows/ci.yml`, on push and pull_request, `ubuntu-latest` and `macos-latest` (macOS
covers the Bash 3.2 constraint):

```
doctor.sh → skills.sh validate → validate-spec.js (if node) → tests/run.sh
```

Clean checkout, no reliance on `.git/hooks/`. Expected to be **red on arrival**, since F1 is real
and the tests will prove it. That is the intended sequence: prove the defect, then fix it.

### D8 — Linter wiring and escape-hatch removal

`doctor.sh` invokes `validate-spec.js` for each spec under `active/`, guarded on `command -v node`;
absence is a warning, not a failure. The `IS_FRAMEWORK` block (`doctor.sh:59-62`) is removed, and
any artifact genuinely inapplicable to the framework repo is handled by naming that artifact
explicitly rather than by blanket downgrading ten checks.

---

## 📂 Files Touched

```
NEW  tests/{run.sh,lib/assert.sh,test_*.sh}
NEW  .github/workflows/ci.yml
NEW  .sdd/scripts/*.sh                 (symlinks)
NEW  scripts/state.sh                  (state accessors, sourced by phase.sh)
EDIT scripts/phase.sh                  (state-backed; new/approve; hard gate; ID matching)
EDIT scripts/doctor.sh                 (linter wiring; escape hatch removed)
EDIT scripts/setup.sh                  (seed state file on install)
EDIT .sdd/templates/tasks-template.md  (stable IDs)
EDIT defaults/templates/tasks-template.md
EDIT .sdd/memory/rules/after-task.md   (correct the tests/ path — F3)
EDIT docs/{cli-reference,architecture}.md
```

---

## 🧪 Testing Strategy

**Unit-ish:** state accessors — read, write, missing key, malformed file, atomic-write failure.

**Integration:** the five test files in D6. The lifecycle test is the important one; it is the
first time this workflow will have been executed end to end.

**Regression proof:** `test_documented_paths.sh` must fail against current `master` and pass after
the fix. If it passes before the fix, it is not testing the right thing.

**Verification of D2:** a test asserts that no task state appears in `.sdd/state`, guarding the
one-fact-one-home rule against future drift.

---

## ✅ Approval Checkpoint

**Status:** Approved 2026-08-19, continuous with the requirements approval. Design decisions D1
(flat file over JSON) and D4 (symlinks) differ from what was sketched conversationally; both are
recorded above with rationale and are reversible.
