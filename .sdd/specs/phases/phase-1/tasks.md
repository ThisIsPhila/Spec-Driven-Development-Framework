# Phase 1: Template Profiles & Methodology - Implementation Plan

**Phase:** Phase 1 - Template Profiles & Methodology  
**Created:** December 9, 2025  
**Status:** 🚀 READY TO START  
**Requirements Approved:** ✅ YES (December 9, 2025)  
**Design Approved:** ✅ YES (December 9, 2025)

---

## Implementation Checklist

### - [x] **Category 1: Profile Infrastructure**
  **Branch:** `feat/profile-infrastructure`
  
  **Objectives:**
  - Set up complete directory structure for composable profiles
  - Create README documentation for all profiles
  - Establish metadata conventions
  
  **Steps:**
  - Create `defaults/profiles/base/` and `defaults/profiles/modifiers/` directories
  - Create subdirectories for 6 base profiles (general, web, mobile, api, cli, full-stack)
  - Create subdirectories for 3 modifiers (devsecops, mlops, devops)
  - Write README.md for each profile (9 total) with YAML frontmatter
  - Document what files each profile provides
  - Add composition examples
  
  **Acceptance Criteria:**
  - All profile directories exist with README.md
  - READMEs have consistent YAML frontmatter (name, type, description, includes, examples)
  - Running `ls defaults/profiles/` shows clear base vs modifiers organization
  
  _Requirements: REQ-1.2 (Directory Structure), REQ-1.15 (Documentation)_  
  _Estimated Time: 6 hours_

---

### - [x] **Category 2: Profile Templates & Content**
  **Branch:** `feat/profile-templates`
  
  **Objectives:**
  - Create all base profile templates (web, mobile, api, cli, full-stack, general)
  - Create all modifier templates (devsecops, mlops, devops)
  - Ensure component alignment (constitution amendments, rule extensions)
  
  **Steps:**
  
  **Base Profiles:**
  - **Web**: component-design-template.md, api-contract-template.md, accessibility-checklist.md
  - **Mobile**: screen-design-template.md, platform-guidelines.md, device-support.md
  - **API**: api-design-template.md, schema-template.md, api-versioning.md
  - **CLI**: command-design-template.md, ux-principles.md, os-compatibility.md
  - **Full-Stack**: architecture-template.md, integration-testing.md (inherits web+api)
  - **General**: (uses base templates only, no additions)
  
  **Modifiers:**
  - **DevSecOps**: security-design-template.md, security-checklist.md, constitutional-amendment.md, before-task_extends.md, design-template_extends.md, security-requirements.md
  - **MLOps**: model-design-template.md, dataset-card-template.md, data-versioning.md, experiment-tracking.md, constitutional-amendment.md, before-task_extends.md, data-governance.md
  - **DevOps**: pipeline-design-template.md, infrastructure-template.md, deployment-checklist.md
  
  **Acceptance Criteria:**
  - All templates follow approval checkpoint pattern
  - Modifiers have `_extends.md` files for template augmentation
  - Modifiers have `constitutional-amendment.md` for Article VI additions
  - All files are valid Markdown
  
  _Requirements: REQ-1.4 to 1.11 (All Profiles)_  
  _Estimated Time: 18 hours_

---

### - [ ] **Category 3: Enhanced Setup Script**
  **Branch:** `feat/setup-enhancement`
  
  **Objectives:**
  - Enhance `setup.sh` with profile composition support
  - Implement interactive menu, preview, and 3-layer file overlay
  - Add component alignment logic (amendments + extensions)
  
  **Steps:**
  
  **Profile Parsing:**
  - Add `VALID_BASES` and `VALID_MODIFIERS` arrays
  - Implement `parse_profile()` to split "web+devsecops" into base + modifiers
  - Add validation with clear error messages
  
  **Interactive Menu:**
  - Detect `whiptail` availability
  - Implement base profile selection menu
  - Implement modifier checkbox selection
  - Add fallback to simple prompts
  
  **Preview & Confirmation:**
  - Implement `list_templates()`, `list_rules()`, `list_memory()` functions
  - Implement `show_preview()` with formatted output
  - Add "Proceed? [Y/n]" confirmation prompt
  
  **File Overlay:**
  - Implement 3-layer rsync: base → profile → modifiers
  - Ensure later layers override earlier ones
  - Generate `.sdd/.profile` metadata file
  
  **Component Alignment:**
  - Append `constitutional-amendment.md` to constitution
  - Parse and insert `*_extends.md` sections into base templates
  - Verify no duplicate content
  
  **Acceptance Criteria:**
  - `setup.sh --profile web+devsecops` parses correctly
  - Interactive menu works on macOS and Linux
  - Preview shows all files before installation
  - File overlay respects precedence (modifiers override base)
  - Constitution gets Article VI from modifiers
  - Templates have extension sections inserted
  
  _Requirements: REQ-1.1, REQ-1.2, REQ-1.13 (Profile Selection, Overlay, Preview)_  
  _Estimated Time: 15 hours_

---

### - [ ] **Category 4: Validation, Testing & Documentation**
  **Branch:** `feat/validation-docs`
  
  **Objectives:**
  - Create profile validation tests
  - Create helper scripts for agents and validation
  - Implement integration tests for compositions
  - Create profile listing tool
  - Update all documentation
  - Cleanup temporary reference files
  
  **Steps:**
  
  **Helper Scripts** (inspired by tmp/spec-kit):
  - Create `scripts/common.sh` (shared bash functions: get_repo_root, check_file, etc.)
  - Create `scripts/update-agent-context.sh` (auto-generate GEMINI.md/CLAUDE.md/.github/copilot-instructions.md)
  - Create `scripts/validate-profiles.sh` (check READMEs, templates, approval checkpoints)
  
  **Profile Listing:**
  - Create `scripts/list-profiles.sh`
  - Parse README.md YAML frontmatter
  - Format output (base profiles first, then modifiers)
  - Integrate into `setup.sh --list-profiles`
  
  **Validation Tests:**
  - Create `tests/validate-profiles.sh`
  - Check all profiles have README.md with frontmatter
  - Check templates have approval checkpoints
  - Check no circular dependencies
  - Integrate into GitHub Actions CI
  
  **Integration Tests:**
  - Test installation of each base profile individually
  - Test compositions: `web+devsecops`, `api+mlops`, `full-stack+devops`
  - Verify file counts, constitution augmentation, template extensions
  - Verify `.sdd/.profile` metadata
  
  **Agent Detection Documentation:**
  - Document detection heuristics in `AGENT_ONBOARDING.md`
  - Add file marker patterns and dependency keywords
  - Provide scoring algorithm pseudocode
  - Add composition recommendation examples
  
  **Documentation Updates:**
  - Update `README.md` with "Choosing a Profile" section
  - Add composition examples (web+devsecops, api+mlops)
  - Update `AGENT_ONBOARDING.md` with profile detection workflow
  - Update `CHANGELOG.md` for v1.1 release
  
  **Cleanup:**
  - Delete `tmp/spec-kit/` directory (reference material, not for production)
  - Verify tmp/ is in .gitignore
  
  **Acceptance Criteria:**
  - Helper scripts created and functional
  - `scripts/list-profiles.sh` shows all 9 profiles with descriptions
  - All validation tests pass
  - Integration tests verify 6 compositions work correctly
  - Agent heuristics documented with examples
  - README, AGENT_ONBOARDING, CHANGELOG all updated
  - No tmp/ files in git history
  
  _Requirements: REQ-1.14, REQ-1.15, REQ-1.16 (Detection, Docs, Testing)_  
  _Estimated Time: 15 hours (was 12h, +3h for helper scripts)_


---

## Summary

**Total Categories:** 4  
**Total Estimated Time:** 51 hours (1.5-2 months @ 8 hours/week)

**Implementation Order:**
1. Category 1 (Infrastructure) - Creates foundation
2. Category 2 (Templates) - Populates profiles (can overlap with 3)
3. Category 3 (Setup Script) - Enables installation
4. Category 4 (Validation) - Ensures quality

**Branch Workflow:**
- Each category maps to one feature branch
- Merge to `main` after category completion and testing
- Enables phased rollout and easier review

---

## Phase 1 Completion Criteria

Phase 1 is complete when:

1. ✅ All 4 categories checked off
2. ✅ All integration tests passing
3. ✅ Profile validation tests passing in CI
4. ✅ Validated compositions install correctly:
   - `web+devsecops`
   - `api+mlops`
   - `full-stack+devops`
5. ✅ Agent detection heuristics documented
6. ✅ All documentation updated (README, AGENT_ONBOARDING, CHANGELOG)
7. ✅ Manual smoke test: New developer can select profile via menu and understand preview

---

**Ready to start? Create branch `feat/profile-infrastructure` and proceed with Category 1!** 🚀
