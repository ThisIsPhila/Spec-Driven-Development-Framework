# SDD Framework - CLI Reference Guide

This document provides detailed usage information, options, arguments, and examples for all Command Line Interface (CLI) scripts in the Spec-Driven Development (SDD) Framework.

---

## 1. `setup.sh` — Project Initializer
Initializes a target project's `.sdd/` workspace and installs composting profile templates, memory documents, and Git pre-commit hooks.

### Usage
```bash
bash scripts/setup.sh [OPTIONS]
```

### Options
*   `--profile COMPOSITION`
    Apply a specific profile composition (e.g. `web+devsecops`, `api+mlops`, `monorepo+devops`).
*   `--with-examples`
    Copies the Phase 0 reference specification into `.sdd/specs/examples/` for onboarding.
*   `--no-agent-files`
    Skips creating the root agent instructions files (`AGENTS.md`, `CLAUDE.md`, etc.).
*   `--list-profiles`, `--list`
    Lists all available base profiles and modifiers, along with descriptions.
*   `--yes`, `-y`
    Skips interactive TUI/menu prompts and uses defaults.
*   `--help`, `-h`
    Displays usage instructions.

### Examples
```bash
# Interactive configuration menu
bash scripts/setup.sh

# Non-interactive CLI setup
bash scripts/setup.sh --profile web+devsecops --yes --with-examples
```

---

## 2. `phase.sh` — Phase Sprint Runner (Phase Hook)
Enforces the Spec-Driven Development sprint lifecycle rules for agents and developers.

### Usage
```bash
bash .sdd/scripts/phase.sh <command> [args]
```

### Commands
*   `start <phase-name>`
    Validates spec files status (Requirements, Design, Tasks), configures the Git feature branch, registers the active context in `active-context.md`, and prints the `BEFORE-TASK CHECKLIST COMPLETE` block.
*   `status` / `progress`
    Counts checkbox tasks in the active phase's `tasks.md`, calculates progress completion percentage, and lists remaining pending tasks.
*   `task <task_id> <done|doing|todo>`
    Updates the checkbox status in the active spec's `tasks.md`. It also synchronizes the active task focus in `active-context.md` (e.g. updating task description and work target).
*   `finish`
    Ensures all tasks in `tasks.md` are marked complete, executes validation checks (`doctor.sh`, `skills.sh validate`), clears the active context, and marks the phase `Complete` in `progress-tracker.md`.
*   `archive <phase-name>`
    Moves the completed spec folder from `specs/active/` to `specs/archive/` (an explicit action).

### Examples
```bash
# Start a new sprint
bash .sdd/scripts/phase.sh start phase-002-skills-management

# Mark task complete
bash .sdd/scripts/phase.sh task "Block 1" done

# Finish the sprint
bash .sdd/scripts/phase.sh finish
```

---

## 3. `skills.sh` — Skills Manager CLI
Scaffolds, lists, validates, and syncs local skills to agent-specific plugins directories.

### Usage
```bash
bash scripts/skills.sh <command> [args]
```

### Commands
*   `list`
    Lists all available local skills under `skills/` along with description metadata parsed from their frontmatter.
*   `sync`
    Synchronizes the root `skills/` directory to local agent configurations (`.claude/skills`, `.gemini/skills`, etc.).
*   `create <skill-name>`
    Scaffolds a new skill directory `skills/<skill-name>/` containing a boilerplate `SKILL.md` file.
*   `validate`
    Runs validations to ensure skill folders are kebab-case and their `SKILL.md` frontmatter is formatted correctly.
*   `add <source> [--skill <skill-name>]`
    Fetches a remote skill (GitHub repo or specific folder) and copies it into local `skills/`.

---

## 4. `doctor.sh` — Structure Check
Runs validation suites to verify the integrity of the project's `.sdd/` directory.

### Usage
```bash
bash scripts/doctor.sh
```
*   Ensures core directories (`specs`, `templates`, `memory/rules`) are present.
*   Ensures canonical memory files exist.
*   Performs Spec Lifecycle Approval checks: asserts that design specifications do not exist without approved requirements, and task lists do not exist without approved designs.
*   Validates spec folder naming conventions.
*   Validates skills structures.

---

## 5. `validate-spec.js` — Spec Linter
Lints written specifications against profiles and masking rules.

### Usage
```bash
node scripts/validate-spec.js <spec-path>
```
*   Asserts that `requirements.md` contains a "Privacy & Security Model" section.
*   If PII Risk is marked "Yes", it requires a valid masking control checkbox to be checked.
*   If the active profile is `devsecops`, it validates that security specifications contain threat modeling and checklist sections.
*   If the active profile is `mlops`, it validates that model design specifications contain experiment tracking, dataset, and performance details.

---

## 6. Minor Maintenance Scripts
*   `scan-strays.sh [--fix]`
    Identifies spec files (requirements, design, tasks) located outside the `.sdd/specs/` directory. If `--fix` is passed, it moves them into a quarantine folder.
*   `migrate-structure.sh [--yes]`
    Migrates older legacy SDD layouts to the current layout structure. It also backfills missing agent entrypoint instructions.
*   `audit-monorepo.sh [--write-report]`
    Performs monorepo governance audits, scanning sub-packages for `.sdd` structures. If `--write-report` is passed, it generates a compliance report.
