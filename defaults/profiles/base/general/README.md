---
name: General
type: base
description: Generic software projects (baseline SDD templates)
includes:
  - Uses base templates only (requirements, design, tasks)
  - Uses base rules only (before-task, during-task, after-task)
  - No domain-specific additions
examples:
  - Internal tools
  - Proof-of-concept projects
  - Projects without specific domain requirements
---

# General Profile

The **General** profile provides the baseline SDD methodology without any domain-specific templates or rules. Use this when your project doesn't fit into web, mobile, API, CLI, or full-stack categories, or when you want a minimal starting point.

## What You Get

### Templates
- `requirements-template.md` - Spec-driven requirements
- `design-template.md` - Technical design
- `tasks-template.md` - Implementation tasks

### Rules
- `before-task.md` - Pre-implementation checklist
- `during-task.md` - Development guidelines
- `after-task.md` - Completion verification

### Memory
- `constitutional-framework.md` - Project principles
- `project-overview.md` - Project summary
- `progress-tracker.md` - Milestone tracking
- `technical-decisions.md` - ADR log

## When to Use

- Building internal tools or utilities
- Starting a proof-of-concept
- Project type doesn't match other profiles
- You want minimal overhead

## Composition

Can be combined with modifiers:
- `general+devsecops` - Generic project with security focus
- `general+mlops` - Generic project with ML governance
- `general+devops` - Generic project with advanced CI/CD
