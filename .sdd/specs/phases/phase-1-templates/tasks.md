# Phase 1.1: Template Profiles & Methodology - Implementation Plan

**Phase:** Phase 1.1 - Template Profiles & Methodology  
**Created:** December 9, 2025  
**Status:** 🚀 READY TO START  
**Requirements Approved:** ✅ YES (December 9, 2025)  
**Design Approved:** ✅ YES (December 9, 2025)

> **📋 Note:** This is a high-level task checklist. Detailed sub-steps are listed under each task.

---

## Implementation Checklist

- [ ] **Task 1-1: Profile Directory Structure Setup**
  - Create `defaults/profiles/base/` directory
  - Create `defaults/profiles/modifiers/` directory
  - Create subdirectories for each base profile: general, web, mobile, api, cli, full-stack
  - Create subdirectories for each modifier: devsecops, mlops, devops
  - Add `.gitkeep` files to initialize structure
  - _Requirements: REQ-1.2 (Composable Directory Structure)_
  - _Estimated Time: 1 hour_

- [ ] **Task 1-2: Profile README Documentation**
  - Write README.md for each base profile (6 files)
  - Write README.md for each modifier (3 files)
  - Include YAML frontmatter in each README (name, type, description, includes, examples)
  - Document what files each profile adds/modifies
  - Add usage examples for common compositions
  - _Requirements: REQ-1.15 (Profile Documentation)_
  - _Estimated Time: 3 hours_

- [ ] **Task 1-3: Base Profile Templates - Web**
  - Create `component-design-template.md` for UI components
  - Create `api-contract-template.md` for frontend/backend contracts
  - Create `accessibility-checklist.md` rule
  - Add browser compatibility memory file
  - _Requirements: REQ-1.4 (Base Profile - Web)_
  - _Estimated Time: 2 hours_

- [ ] **Task 1-4: Base Profile Templates - Mobile**
  - Create `screen-design-template.md` for mobile screens
  - Create `platform-guidelines.md` rule for iOS/Android compliance
  - Add device support matrix memory file
  - _Requirements: REQ-1.5 (Base Profile - Mobile)_
  - _Estimated Time: 2 hours_

- [ ] **Task 1-5: Base Profile Templates - API**
  - Create `api-design-template.md` for REST/GraphQL specs
  - Create `schema-template.md` for database schemas
  - Create `api-versioning.md` rule
  - _Requirements: REQ-1.6 (Base Profile - API)_
  - _Estimated Time: 2 hours_

- [ ] **Task 1-6: Base Profile Templates - CLI**
  - Create `command-design-template.md` for CLI commands
  - Create `ux-principles.md` rule for CLI UX
  - Add OS compatibility memory file
  - _Requirements: REQ-1.7 (Base Profile - CLI)_
  - _Estimated Time: 2 hours_

- [ ] **Task 1-7: Base Profile Templates - Full-Stack**
  - Create `architecture-template.md` for system architecture
  - Create `integration-testing.md` rule
  - Configure inheritance from web + api profiles
  - _Requirements: REQ-1.8 (Base Profile - Full-Stack)_
  - _Estimated Time: 2 hours_

- [ ] **Task 1-8: Modifier Templates - DevSecOps**
  - Create `security-design-template.md` with threat modeling sections
  - Create `security-checklist.md` rule
  - Create `constitutional-amendment.md` for Article VI
  - Create `before-task_extends.md` to add security checklist
  - Create `design-template_extends.md` for threat model section
  - Add security requirements memory file
  - _Requirements: REQ-1.9 (Modifier - DevSecOps)_
  - _Estimated Time: 3 hours_

- [ ] **Task 1-9: Modifier Templates - MLOps**
  - Create `model-design-template.md` for ML systems
  - Create `dataset-card-template.md` for dataset documentation
  - Create `data-versioning.md` rule
  - Create `experiment-tracking.md` rule
  - Create `constitutional-amendment.md` for Article VI (Data Governance)
  - Create `before-task_extends.md` to add data lineage validation
  - Add data governance memory file
  - _Requirements: REQ-1.10 (Modifier - MLOps)_
  - _Estimated Time: 3 hours_

- [ ] **Task 1-10: Modifier Templates - DevOps**
  - Create `pipeline-design-template.md` for CI/CD specs
  - Create `infrastructure-template.md` for IaC documentation
  - Create `deployment-checklist.md` rule
  - _Requirements: REQ-1.11 (Modifier - DevOps)_
  - _Estimated Time: 2 hours_

- [ ] **Task 1-11: Enhanced setup.sh - Profile Parsing**
  - Add `VALID_BASES` and `VALID_MODIFIERS` arrays
  - Implement `parse_profile()` function to split composition string
  - Add validation for base profile (must be valid)
  - Add validation for modifiers (all must be valid)
  - Add error messages for invalid profiles
  - Write unit tests for parsing logic
  - _Requirements: REQ-1.1 (Profile Selection & Composition)_
  - _Estimated Time: 3 hours_

- [ ] **Task 1-12: Enhanced setup.sh - Interactive Menu**
  - Detect if `whiptail` is available
  - Implement whiptail-based base profile selection menu
  - Implement whiptail checkbox for modifier selection
  - Implement fallback to simple read prompts if whiptail unavailable
  - Test on macOS and Linux
  - _Requirements: REQ-1.1 (Profile Selection & Composition)_
  - _Estimated Time: 3 hours_

- [ ] **Task 1-13: Enhanced setup.sh - Profile Preview**
  - Implement `list_templates()` function to enumerate templates for composition
  - Implement `list_rules()` function to enumerate rules
  - Implement `list_memory()` function to enumerate memory files
  - Implement `show_preview()` function with formatted output
  - Add confirmation prompt with Y/n
  - Add cancellation logic
  - _Requirements: REQ-1.13 (Profile Confirmation & Preview)_
  - _Estimated Time: 2 hours_

- [ ] **Task 1-14: Enhanced setup.sh - File Overlay**
  - Implement 3-layer rsync copy (base → profile → modifiers)
  - Test file precedence (modifiers override base)
  - Implement `install_profiles()` function
  - Add progress indicators for each layer
  - Generate `.sdd/.profile` metadata file with composition string
  - _Requirements: REQ-1.2 (Composable Directory Structure)_
  - _Estimated Time: 3 hours_

- [ ] **Task 1-15: Enhanced setup.sh - Component Alignment**
  - Implement constitutional amendment appending logic
  - Implement template extension insertion (scan for `_extends.md`, insert into base)
  - Test that modifiers correctly augment constitution
  - Test that extended templates have sections inserted
  - Verify no duplicate content
  - _Requirements: REQ-1.9, REQ-1.10 (Modifier component alignment)_
  - _Estimated Time: 4 hours_

- [ ] **Task 1-16: Profile Listing Script**
  - Create `scripts/list-profiles.sh`
  - Parse README.md YAML frontmatter for each profile
  - Format output: base profiles first, then modifiers
  - Show name and description for each
  - Add to `setup.sh --list-profiles` flag
  - _Requirements: REQ-1.15 (Profile Documentation)_
  - _Estimated Time: 2 hours_

- [ ] **Task 1-17: Agent Detection Heuristics**
  - Document detection heuristics in `AGENT_ONBOARDING.md`
  - Add file marker patterns (package.json, requirements.txt, etc.)
  - Add dependency keyword lists (react, tensorflow, snyk, etc.)
  - Provide scoring algorithm pseudocode
  - Add composition recommendation examples
  - _Requirements: REQ-1.14 (Agent-Driven Profile Detection)_
  - _Estimated Time: 2 hours_

- [ ] **Task 1-18: Profile Validation Tests**
  - Create `tests/validate-profiles.sh`
  - Check all profiles have README.md
  - Check README.md has required YAML frontmatter
  - Check templates contain approval checkpoints
  - Check no circular dependencies
  - Integrate into CI/CD (GitHub Actions)
  - _Requirements: REQ-1.16 (Profile Validation & Testing)_
  - _Estimated Time: 3 hours_

- [ ] **Task 1-19: Integration Testing**
  - Test installation of each base profile individually
  - Test installation of common compositions (web+devsecops, api+mlops, full-stack+devops)
  - Verify file counts match expectations
  - Verify constitution was augmented correctly
  - Verify templates have extensions inserted
  - Verify `.sdd/.profile` metadata is correct
  - _Requirements: All (end-to-end validation)_
  - _Estimated Time: 4 hours_

- [ ] **Task 1-20: Documentation Updates**
  - Update `README.md` with profile system explanation
  - Add "Choosing a Profile" section with composition examples
  - Update `AGENT_ONBOARDING.md` with profile detection workflow
  - Add profile composition section to agent instructions
  - Update `CHANGELOG.md` for v1.1 release
  - _Requirements: REQ-1.15 (Profile Documentation)_
  - _Estimated Time: 2 hours_

---

## Summary

**Total Tasks:** 20  
**Total Estimated Time:** 51 hours (1.5-2 months @ 8 hours/week)

**Critical Path:**
1. Task 1-1 (Directory Setup) → Task 1-2 (READMEs) → Task 1-11 (Parsing) → Task 1-14 (Overlay) → Task 1-19 (Integration Tests)

**Parallel Tracks:**
- **Profile Templates**: Tasks 1-3 to 1-10 (can run in parallel, different profiles)
- **Script Enhancement**: Tasks 1-11 to 1-15 (sequential, build on each other)
- **Support Tools**: Tasks 1-16 to 1-18 (can run in parallel)
- **Final Integration**: Tasks 1-19 to 1-20 (sequential, after all else)

---

## Phase 1.1 Completion Criteria

Phase 1.1 is complete when:

1. ✅ All 20 tasks checked off
2. ✅ All integration tests passing
3. ✅ Profile validation tests passing in CI
4. ✅ Validated compositions:
   - `web+devsecops` installs correctly
   - `api+mlops` installs correctly
   - `full-stack+devops` installs correctly
5. ✅ Agent detection heuristics documented
6. ✅ Documentation updated (README, AGENT_ONBOARDING, CHANGELOG)
7. ✅ Manual testing: New developer can select profile and understand what they're getting

---

**Ready to start? Proceed with Task 1-1!** 🚀
