---
name: sdd-workflow
description: Use this skill when a task should follow Spec-Driven Development with requirements, design, tasks, and memory updates.
---

# SDD Workflow Skill

Use this skill for feature work, refactors, and substantial bug fixes that should be tracked in `.sdd/`.

## Required Inputs

- The target spec folder under `.sdd/specs/{active,archive,backlog}/`
- Current task context from `.sdd/memory/current-state/`

## Workflow

1. Read `.sdd/AGENT_ONBOARDING.md` and `.sdd/memory/rules/*`.
2. Confirm the spec folder name follows `.sdd/memory/rules/spec-naming.md`.
3. Create or update artifacts in order:
   - `requirements.md`
   - `design.md`
   - `tasks.md`
4. Pause for approval between artifacts.
5. Implement only approved tasks.
6. Update `.sdd/memory/current-state/active-context.md` and progress notes.
7. Run project validation and summarize what changed.

## Guardrails

- Do not create spec artifacts outside `.sdd/specs/`.
- Keep `docs/` for project documentation, not spec triplets.
- If you find stray spec files, run `bash scripts/scan-strays.sh`.
