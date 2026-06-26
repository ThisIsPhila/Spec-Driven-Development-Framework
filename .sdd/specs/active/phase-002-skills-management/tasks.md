# Phase 002 - Skills Management - Implementation Plan

**Phase:** Phase 002 - Skills Management  
**Created:** 2026-06-18  
**Status:** 🚀 READY TO START  
**Requirements Approved:** ✅ YES (2026-06-18)  
**Design Approved:** ✅ YES (2026-06-18)

---

## Implementation Checklist

- [ ] **Block 1: Restructuring and Setup/Doctor Migration**
  - Migrate `.sdd/skills/` to `skills/` at the root of this repository
  - Modify `scripts/setup.sh` to copy `defaults/skills/` to `$PROJECT_ROOT/skills/` and migrate any existing `.sdd/skills/` to `skills/`
  - Modify `scripts/doctor.sh` to check `skills/` at root instead of `.sdd/skills/` and validate skill directories and YAML frontmatter
  - _Requirements: REQ-002.1_
  - _Estimated Time: 1 hour_

- [ ] **Block 2: Unified CLI Script (skills.sh)**
  - Implement `scripts/skills.sh` with commands: `list`, `sync`, `create`, `validate`, and `add`
  - Modify `scripts/sync-skills.sh` to output a deprecation warning and call `scripts/skills.sh sync` with original arguments
  - _Requirements: REQ-002.2, REQ-002.3_
  - _Estimated Time: 1.5 hours_

- [ ] **Block 3: Documentation & Verification**
  - Update `AGENT_ONBOARDING.md` references to skills
  - Update `README.md` to document the new `skills/` folder and `skills.sh` CLI commands
  - Verify that `scripts/doctor.sh` and `scripts/skills.sh validate` pass successfully on the repository
  - Run manual tests to verify installation, migration, listing, syncing, creating, and adding remote skills
  - _Requirements: REQ-002.1, REQ-002.2_
  - _Estimated Time: 0.5 hours_

---

## Summary

**Total Tasks:** 3 Blocks  
**Total Estimated Time:** 3 hours  

**Critical Path:**
1. Block 1 (Migration & Core Framework scripts) -> 2. Block 2 (New skills.sh script) -> 3. Block 3 (Docs & Verification)

---

## Phase Completion Criteria

Phase 002 is complete when:

1. ✅ All 3 blocks of tasks are checked off
2. ✅ `scripts/doctor.sh` runs and passes successfully
3. ✅ Verification checks pass (syncing, creating, listing, adding)
