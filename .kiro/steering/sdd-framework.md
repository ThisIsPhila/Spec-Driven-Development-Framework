---
inclusion: fileMatch
fileMatchPattern: ".sdd/specs/active/**"
---

# SDD Framework Guidance

You are working in an SDD (Spec-Driven Development) Framework project. This guidance loads when you read or edit files under `.sdd/specs/active/`.

## Core Workflow

**Primary Reference**: Read `.sdd/AGENT_ONBOARDING.md` for complete workflow instructions.

**Non-Negotiable Rules**: Read `.sdd/constitution.md` for governance principles.

## Current Session Context

The current session state is maintained in `.sdd/memory/current-state/active-context.md`. This file contains:
- Current phase name
- Current task focus
- Active branch
- Recent decisions
- Next steps

**Before implementing**: Check the active context to understand where you are in the workflow.

## Phase-Specific Context

When working in `.sdd/specs/active/<phase-name>/`, refer to these documents for phase-specific guidance:

- **Requirements**: `.sdd/specs/active/<phase-name>/requirements.md`
  - Acceptance criteria
  - Success metrics
  - Dependencies and risks

- **Design**: `.sdd/specs/active/<phase-name>/design.md`
  - Architecture decisions
  - Implementation approach
  - Component specifications

- **Tasks**: `.sdd/specs/active/<phase-name>/tasks.md`
  - Implementation checklist
  - Task dependencies
  - Completion criteria

## Workflow Commands

Use these CLI commands to manage the phase lifecycle:

```bash
# Check phase status
bash .sdd/scripts/phase.sh status

# Mark task as in-progress
bash .sdd/scripts/phase.sh task <task-id> doing

# Mark task as complete
bash .sdd/scripts/phase.sh task <task-id> done

# Validate project structure
bash .sdd/scripts/doctor.sh
```

## Evidence and Learning

**Article VI** of the constitution requires evidence-based truth:
- Claims are only as broad as observations that support them
- Evidence records: tree/revision, environment, procedure, timestamp, result, limitations
- Store evidence in `.sdd/evidence/<phase-name>/`

**Learning Loop**:
1. Current state → Intended state → Observed gap
2. Next authorized action → Evidence → Learning
3. Specification decision (never silent drift)

## Quality Gates

**Sequential approval is enforced**:
1. Requirements must be approved before design
2. Design must be approved before tasks
3. Tasks must be approved before implementation starts

**The `start` command is a hard gate**: It will refuse to proceed if approvals are missing.

## Cross-Platform Portability

The SDD Framework is agent-neutral:
- Works in any agent or a plain terminal
- `.sdd/` is the canonical source of truth
- Kiro features enhance but never replace universal CLI enforcement

---

*This steering file is part of the Kiro adapter. It references canonical `.sdd/` documents rather than duplicating content.*
