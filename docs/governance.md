# SDD Framework - Governance Rules

This document outlines the governance rules and checklists enforced by the Spec-Driven Development (SDD) Framework.

---

## ⚖️ The Constitutional Articles

These rules govern the development of the target project to ensure standards and backward compatibility are maintained:

### Article I – Spec Before Code
*   **Principle:** Code exists solely to fulfill a specification.
*   **Rule:** No source code changes are allowed unless they correspond to an approved specification triplet (`requirements.md`, `design.md`, `tasks.md`).
*   **Rule:** Spec files must progress sequentially (Requirements -> Design -> Tasks).

### Article II – Composable Profiles
*   **Principle:** Simple building blocks overlay to match project methodologies.
*   **Rule:** Profiles compose (`base` + `modifiers`). No monolith architectures.
*   **Rule:** File overlays are predictable: Base -> Profile -> Modifiers.

### Article III – Quality Gates
*   **Principle:** Automated checks are mandatory before committing.
*   **Rule:** The pre-commit hook runs on every `git commit` to assert directory structure and naming conventions.
*   **Rule:** Speclifting linters assert PII and security models before merging.

---

## 📋 Operational Checklists

The following checklists are located under `.sdd/memory/rules/` and represent the canonical workflow requirements for agents:

### 1. Before-Task Rules (`before-task.md`)
Prior to starting implementation:
1.  **Review specs**: Read `requirements.md`, `design.md`, and `tasks.md` from the active phase spec folder.
2.  **Verify branch**: Ensure branch is checked out off master matching the `feat/<phase-name>` naming convention.
3.  **Confirm project status**: Check `progress-tracker.md` for active blockers and `technical-decisions.md` for ADR logs.
4.  **Enforce Startup Gate**: Run `phase.sh start <phase-name>` to validate the state and print the startup confirmation checklist. Post the confirmation block to the user and wait for START approval.

### 2. During-Task Rules (`during-task.md`)
During active development:
1.  **Small Commits**: Make atomic commits using conventional commit syntax (e.g. `feat: implement validation (REQ-1.2)`), referencing requirement IDs.
2.  **Self-Testing**: Test overlays and profile behavior locally.
3.  **Real-time Docs**: Update inline code comments, `README.md`, and `AGENT_ONBOARDING.md` immediately with any workflow adjustments.
4.  **Task Syncing**: Update task checkboxes (`[ ]` -> `[/]` -> `[x]`) in `tasks.md` using the `phase.sh task` command.

### 3. After-Task Rules (`after-task.md`)
Upon completing the tasks:
1.  **Self-Verification**: Run local setup, validation script checks, and verify target directories.
2.  **Integration Testing**: Run the project test suite across profile compositions.
3.  **Documentation Finalization**: Sync changelogs, update readmes, and verify frontmatter configurations.
4.  **PR Preparation**: Squash commits, write clear messages referencing requirements, and push the branch.
5.  **Finish Gate**: Run `phase.sh finish` to clear context and mark the phase complete in the progress tracker.
6.  **Explicit Archive**: Move the folder to `specs/archive/` only upon explicit user instruction.
