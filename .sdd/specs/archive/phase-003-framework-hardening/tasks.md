# Phase 003 - Framework Hardening - Implementation Plan

**Phase:** Phase 003 - Framework Hardening
**Created:** 2026-08-19
**Status:** 🚀 READY TO START
**Requirements Approved:** ✅ YES (2026-08-19)
**Design Approved:** ✅ YES (2026-08-19)

---

## Implementation Checklist

- [x] **[T003.1]** Test harness skeleton and assertion library
  - Create `tests/run.sh` runner that discovers `test_*.sh` and exits non-zero on any failure
  - Create `tests/lib/assert.sh` with `assert_eq`, `assert_file`, `assert_contains`, `assert_exit`
  - Each assertion reports expected vs actual on failure (REQ-003.1.5)
  - Temp-dir helper that creates an isolated git repo and cleans up on exit
  - _Requirements: REQ-003.1.4, REQ-003.1.5_

- [x] **[T003.2]** Install/composition tests
  - Assert tree shape after `setup.sh --profile <c> --yes` for `general`, `web+devsecops`,
    `api+mlops`, `monorepo`
  - Assert `.sdd/.profile` contents match the requested composition
  - Assert modifier amendment append actually lands in the correct file (catches the
    `architecture.md:97` doc/code mismatch)
  - _Requirements: REQ-003.1.1_

- [x] **[T003.3]** Documented-path test that reproduces F1
  - Assert `.sdd/scripts/phase.sh` resolves in the framework repo
  - Assert it resolves in a fresh consumer install
  - MUST fail against current `master` before T003.7 lands
  - _Requirements: REQ-003.1.3_

- [x] **[T003.4]** CI workflow
  - `.github/workflows/ci.yml` on push + pull_request, ubuntu-latest and macos-latest
  - Runs doctor, skills validate, spec linter (if node), `tests/run.sh`
  - Confirm it goes red on arrival for the right reasons
  - _Requirements: REQ-003.2_

- [x] **[T003.5]** State layer
  - `scripts/state.sh`: `state_get`, `state_set`, `state_init`, `state_migrate`, atomic write
  - Write failure must abort loudly, never report false success (REQ-003.3.4)
  - Migrate an existing `active-context.md` into state with no data loss
  - Unit tests: missing key, malformed file, unwritable target
  - _Requirements: REQ-003.3_

- [x] **[T003.6]** Rewire phase.sh onto state
  - `status`, `task`, `finish` read the active phase from state, never from prose
  - Regenerate `active-context.md` from state instead of clobbering it
  - Fix the `progress-tracker.md` silent no-op: verify the write changed something or fail
  - Stable task ID matching; fail on zero or multiple matches (REQ-003.4.2, REQ-003.4.3)
  - Update both `tasks-template.md` copies with `**[TNNN.N]**` IDs
  - _Requirements: REQ-003.3.2, REQ-003.3.3, REQ-003.4_

- [x] **[T003.7]** `.sdd/scripts/` symlinks and path reconciliation
  - Commit relative symlinks `.sdd/scripts/*.sh -> ../../scripts/`
  - Verify T003.3 now passes
  - Reconcile the `scan-strays.sh` path inconsistency between `SKILL.md:53` and
    `AGENT_ONBOARDING.md:127`
  - _Requirements: REQ-003.6.1_

- [x] **[T003.8]** `new` and `approve` commands, hard start gate
  - `phase.sh new <phase>`: validate against spec-naming regex, scaffold from templates
  - `phase.sh approve <requirements|design|tasks>`: typed transition, refuse out-of-order
  - `phase.sh start`: fail (not warn) on unapproved artifacts
  - Lifecycle test covering `new → approve → start → task → finish`
  - _Requirements: REQ-003.5, REQ-003.1.2_

- [x] **[T003.9]** Linter wiring and escape-hatch removal
  - `doctor.sh` runs `validate-spec.js` per active spec, guarded on `command -v node`
  - Remove the `IS_FRAMEWORK` block; name genuinely-inapplicable artifacts explicitly
  - Confirm doctor still passes on this repo without the blanket downgrade
  - _Requirements: REQ-003.6.2, REQ-003.6.3_

- [x] **[T003.10]** Documentation reconciliation
  - Fix `after-task.md:15` (`tests/validate-profiles.sh` → correct path, now that `tests/` exists)
  - Fix `before-task.md:9-11` (points at off-contract `specs/phases/phase-1/`)
  - Fix `architecture.md:97` constitution-append claim
  - Update `cli-reference.md` for `new`, `approve`, and the state file
  - Verify every documented command runs as written
  - _Requirements: REQ-003.6.4_

---

## Summary

**Total Tasks:** 10
**Total Estimated Time:** 6-10 hours

**Critical Path:**
T003.1 → T003.2/T003.3 → T003.4 → T003.5 → T003.6 → T003.7 → T003.8 → T003.9 → T003.10

T003.3 must land and **fail** before T003.7 fixes it. That ordering is deliberate: it proves the
test is real.

---

## Phase Completion Criteria

Phase 003 is complete when:

1. ✅ `tests/run.sh` passes locally and in CI on both runners
2. ✅ The sprint lifecycle runs end to end on a real spec
3. ✅ `doctor.sh` passes without the `IS_FRAMEWORK` escape hatch
4. ✅ Every documented command works as written
5. ✅ `phase.sh status` survives an arbitrary prose edit to `active-context.md`
