# Phase 002 - Skills Management (Vercel-style skills.sh integration) - Requirements

**Phase:** Phase 002 - Skills Management  
**Created:** 2026-06-15  
**Status:** ✅ APPROVED  
**Approved:** 2026-06-18

---

## 🎯 Phase Overview

**Goal:** Refactor the SDD framework's skills organization to align with Vercel's `skills.sh` / `vercel-labs/skills` architecture, making local skills root-level assets and introducing a CLI script `scripts/skills.sh` to manage them.

**Why This Phase Matters:**  
Using the standard `skills/` directory at the project root makes local agent skills discoverable by default for AI agents configured with `skills.sh`. It also provides developers with a standard, clean, and developer-friendly way to list, validate, create, and fetch skills locally using a CLI.

**Duration Estimate:** 1-2 hours  
**Complexity:** Medium

---

## 📋 Requirements

### REQ-002.1: Root-Level Skills Directory Support

**User Story:**  
As a developer using the SDD framework, I want my project's local skills to be located in `skills/` at the root of the project so that my coding agents can automatically discover them.

**Acceptance Criteria:**
1. WHEN running `setup.sh` to initialize a new project, default skills (e.g. `sdd-workflow`) MUST be placed in `skills/` at the root of the target project, not `.sdd/skills/`.
2. WHEN running `setup.sh` on an existing project containing `.sdd/skills/`, the script MUST automatically migrate the folder's contents to `skills/` at the project root.
3. WHEN running `doctor.sh` to validate the workspace structure, it MUST validate the root `skills/` directory and check that it contains valid skills.

**Priority:** 🔴 CRITICAL

---

### REQ-002.2: Unified CLI Helper (`skills.sh`)

**User Story:**  
As a developer, I want a CLI script `scripts/skills.sh` to manage my skills so that I can easily list, validate, sync, create, and fetch them.

**Acceptance Criteria:**
1. **`skills.sh list`**: WHEN executed, it MUST list all available skills in `./skills/` along with their name and description extracted from the `SKILL.md` YAML frontmatter.
2. **`skills.sh sync [target]`**: WHEN executed, it MUST sync (copy or link) the skills in `./skills/` to agent-specific directories (such as `.claude/skills/`, `.gemini/skills/`, etc.). If no target is specified, it syncs to all supported targets.
3. **`skills.sh create <name>`**: WHEN executed, it MUST scaffold a new skill directory `skills/<name>/` and create a `SKILL.md` file with pre-populated YAML frontmatter (`name: <name>`, `description: ...`).
4. **`skills.sh validate`**: WHEN executed, it MUST check that all directories under `skills/` are named in kebab-case, contain `SKILL.md`, and that each `SKILL.md` has valid YAML frontmatter containing `name` and `description`.
5. **`skills.sh add <source> [--skill <name>]`**: WHEN executed, it MUST copy/download a remote skill from a GitHub repository shorthand (e.g. `owner/repo`) or a local directory, and place it in the `./skills/` directory.

**Priority:** 🔴 CRITICAL

---

### REQ-002.3: Backward Compatibility for Skill Syncing

**User Story:**  
As an existing user of the SDD framework, I want `scripts/sync-skills.sh` to continue working so that my CI/CD pipelines or local shortcuts do not break.

**Acceptance Criteria:**
1. WHEN `scripts/sync-skills.sh` is invoked, it MUST print a deprecation warning indicating that it is deprecated in favor of `scripts/skills.sh sync`.
2. WHEN `scripts/sync-skills.sh` is invoked with any parameters, it MUST forward them directly to `scripts/skills.sh sync` and exit with the correct status code.

**Priority:** 🟡 HIGH

---

## 🎯 Success Criteria for Phase 002

**Phase 002 is COMPLETE when:**

1. The SDD framework's own self-hosted skills are migrated to `skills/` at the repository root.
2. The setup script (`scripts/setup.sh`) successfully installs skills into the root `skills/` folder of a new project and handles migration.
3. The validation script (`scripts/doctor.sh`) checks root `skills/` instead of `.sdd/skills/`.
4. The CLI tool `scripts/skills.sh` implements all specified commands and passes manual validation.
5. `AGENT_ONBOARDING.md` and `README.md` are updated to reflect the new skills format.

---

## 📝 Dependencies & Assumptions

**Dependencies:**
- None.

**Assumptions:**
- AI agents reading the repository support skills in the root `skills/` folder with YAML frontmatter.
- The Vercel `skills` CLI specifications use kebab-cased folders containing `SKILL.md` files with a `name` and `description` frontmatter.

**Risks:**
1. **Ambiguous Source on Remote Download:** Implementing GitHub downloading in bash might require `curl`/`git` depending on permissions.
   - *Mitigation:* Use git clone to a temporary directory to copy out target skills, avoiding complex custom curl parsing.

---

## 🔐 Privacy & Security Model

**Data Classification:** Public / Open Source

**PII Risk:** [ ] Yes / [x] No  

---

## ✅ Approval Checkpoint

**🛑 STOP - DO NOT PROCEED TO DESIGN WITHOUT APPROVAL**

**Before proceeding, please confirm:**
1. Do these requirements align with your vision?
2. Are there any requirements you'd like to add, remove, or modify?
3. Are the priorities correct?

**Please respond with:**
- ✅ "Approved - proceed to Design"
- 🔄 "I have changes..." (specify changes)
- ❓ "I have questions..." (ask questions)
