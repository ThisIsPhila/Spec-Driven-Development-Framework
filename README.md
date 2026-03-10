# SDD Framework (Spec-Driven Development)
**Unified Specification-Driven Development Framework**

---

## Overview

The **Spec-Driven Development (SDD) Framework** provides a structured environment where specifications act as the source of truth. It keeps humans and AI agents aligned by making requirements, design, and tasks explicit and traceable.

It acts as the **single unified source of truth** for:

- **Specifications** – Requirements, design, and task breakdowns.
- **Memory** – Project tracking, architectural decisions, and rules.
- **Rules** – The codified habits (checklists) that ensure quality.

By keeping everything in the `.sdd/` directory, this framework ensures that context is never lost and every code change is traceable to a requirement.

---

## Directory Structure

Example **.sdd** layout for consumer projects:

```
.sdd/
├── constitution.md           # The Supreme Law
├── glossary.md               # Shared language
├── memory/
│   ├── project-overview.md   # High-level context
│   ├── progress-tracker.md   # Phase status
│   ├── technical-decisions.md# ADR log
│   ├── current-state/        # Active focus + blockers
│   ├── completed-tasks/      # Task summaries
│   └── rules/                # Before/During/After task checklists
├── templates/
│   ├── requirements-template.md
│   ├── design-template.md
│   └── tasks-template.md
└── specs/
    ├── active/               # In-progress specs
    ├── archive/              # Completed specs
    └── backlog/              # Future ideas
```

When you run the setup script, defaults (templates, memory, and rules) are copied into `.sdd/` at your repo root so governance applies across the entire project.

---

## 🚀 Install (Manual)

Use this if you prefer to run scripts yourself.

```bash
# From your project root
git clone https://github.com/ThisIsPhila/Spec-Driven-Development-Framework.git .sdd-framework
bash .sdd-framework/scripts/setup.sh
```

---

## 🤖 Install (With AI Agent)

If you use an AI agent, point it to the onboarding file:

- `.sdd-framework/AGENT_ONBOARDING.md`

Suggested prompt:
> "I want to use Spec-Driven Development. Read `.sdd-framework/AGENT_ONBOARDING.md` and set up the project for me."

---

## Agent Interoperability Files

By default, setup also creates root instruction files for common agents:

- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`
- `.gemini/GEMINI.md`
- `.github/copilot-instructions.md`

These wrappers keep `.sdd/AGENT_ONBOARDING.md` as the canonical workflow source while making SDD discoverable by different agent runtimes.

If any file already exists, setup keeps your existing file and does not overwrite it.

To skip creating these files:
```bash
bash .sdd-framework/scripts/setup.sh --profile general --no-agent-files
```

---

## Skills Support

SDD now supports a canonical skills source in `.sdd/skills/`.

- Setup copies framework-provided skills from `defaults/skills/` into `.sdd/skills/`.
- The framework currently includes a sample skill: `sdd-workflow`.
- Use `scripts/sync-skills.sh` to mirror canonical skills into common agent locations:
  - `.agents/skills` (Codex-style)
  - `.claude/skills` (Claude)
  - `.github/skills` (Copilot)
  - `.gemini/skills` (Gemini)

Sample (`.sdd/skills/sdd-workflow/SKILL.md`):

```md
---
name: sdd-workflow
description: Use this skill when a task should follow Spec-Driven Development with requirements, design, tasks, and memory updates.
---
```

---

## 📦 Choosing a Profile

The SDD Framework supports **composable profiles** to match your project type and methodology:

### Base Profiles (choose one):
- **general** - Generic software projects (baseline SDD templates)
- **web** - Web applications (React, Vue, Next.js) with component-design and accessibility templates
- **mobile** - Mobile apps (iOS, Android) with screen-design and platform guidelines
- **api** - Backend APIs (REST, GraphQL) with api-design and schema templates
- **cli** - Command-line tools with command-design and UX principles
- **full-stack** - Web + API combined with system architecture templates
- **monorepo** - Multi-package monorepos (apps + shared packages) with package-design and workspace management

**Not sure which to pick (or scope is small)?** Start with **general** and add modifiers later if needed.

### Modifiers (add zero or more):
- **+devsecops** - Security-first workflows (threat modeling, security checklists)
- **+mlops** - ML model governance (experiment tracking, data versioning)
- **+devops** - Advanced CI/CD (pipeline design, infrastructure as code)

### Example Compositions:
```bash
# Web app with security focus
bash .sdd-framework/scripts/setup.sh --profile web+devsecops

# Machine learning API
bash .sdd-framework/scripts/setup.sh --profile api+mlops

# Full-stack with security and CI/CD
bash .sdd-framework/scripts/setup.sh --profile full-stack+devsecops+devops

# Monorepo with DevOps automation
bash .sdd-framework/scripts/setup.sh --profile monorepo+devops

# List all available profiles
bash .sdd-framework/scripts/setup.sh --list-profiles

# Include example specs
bash .sdd-framework/scripts/setup.sh --profile general --with-examples

# Run non-interactively
bash .sdd-framework/scripts/setup.sh --profile web+devsecops --yes

# Skip agent entrypoint files
bash .sdd-framework/scripts/setup.sh --profile general --no-agent-files
```

---

## Spec Lifecycle

1. **Requirements (`requirements.md`)** – WHAT and WHY. Focus on user stories and success criteria.
2. **Design (`design.md`)** – HOW. Architecture, data models, and edge cases.
3. **Tasks (`tasks.md`)** – ACTION. Step-by-step implementation plan.
4. **Execution** – Code changes.
5. **Verification** – Tests and manual checks.

**Rule:** You cannot proceed to the next stage until the current artifact is approved.

**Spec Naming:** Specs are organized in folders under `.sdd/specs/` and must follow the naming convention in `.sdd/memory/rules/spec-naming.md` (customizable).

---

## Maintenance Utilities

### Spec Linter (privacy gate)
Run the optional linter before coding to ensure specs cover privacy controls:
```bash
node .sdd-framework/scripts/validate-spec.js .sdd/specs/active/<feature>/requirements.md
```

### Structure Check
Validate your `.sdd/` structure and agent entrypoint files:
```bash
bash .sdd-framework/scripts/doctor.sh
```

### Stray Spec Scan
Scan for misplaced spec files:
```bash
bash .sdd-framework/scripts/scan-strays.sh
```

Auto-move misplaced specs into a quarantine folder:
```bash
bash .sdd-framework/scripts/scan-strays.sh --fix
```

### Migration
Migrate legacy layouts (dry-run by default). This also backfills missing agent entrypoints:
```bash
bash .sdd-framework/scripts/migrate-structure.sh
bash .sdd-framework/scripts/migrate-structure.sh --yes
```

### Skills Sync
Mirror canonical `.sdd/skills` into agent-specific skills folders:
```bash
bash .sdd-framework/scripts/sync-skills.sh
bash .sdd-framework/scripts/sync-skills.sh --target copilot
bash .sdd-framework/scripts/sync-skills.sh --dry-run
```

### Monorepo Governance Audit
For monorepos, run coordination coverage and consistency checks:
```bash
bash .sdd-framework/scripts/audit-monorepo.sh
```

Update the rolling compliance report files:
```bash
bash .sdd-framework/scripts/audit-monorepo.sh --write-report
```

---

## Principles

1. **Context First**: Never write code without understanding existing patterns.
2. **Spec-Driven**: Code exists to fulfill a spec. No spec, no code.
3. **Traceability**: Every task traces back to a design decision, which traces back to a requirement.

---

## 🔮 Future Ideas (Not Implemented Yet)

These are exploratory concepts to improve SDD; they are not committed features:

- **Frontend Design System Profile**: A UI-focused profile with design tokens, component contracts, and layout guidelines to keep UI work aligned with design constraints.
- **MCP Integration (Optional)**: An MCP server to expose SDD artifacts (list/create/validate specs) and enforce file placement for AI agents.
- **Design Constraint Validators**: Lightweight checks that flag unapproved colors/spacing or missing spec references.

If you want to contribute to any of these, open an issue with a brief proposal.

---

## 🤝 Contributing
We use what we build. If you want to contribute, you must follow the SDD process.
See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.
