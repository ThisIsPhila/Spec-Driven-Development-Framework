# SDD Framework - Architecture & Directory Layouts

This document provides a detailed reference of the Spec-Driven Development (SDD) Framework architecture, its layout, and its profile overlay logic.

---

## 🏗️ Core Directory Layouts

### 1. Framework Source Repository (sdd-framework)
The source repository contains the default templates, composable profiles, default agent skills, and the validation engine scripts.

```
sdd-framework/
├── defaults/                    # Shared templates and configurations
│   ├── agent-entrypoints/       # CLI agent entry points (AGENTS.md, etc.)
│   ├── memory/                  # Default memory metadata and governance rules
│   ├── profiles/                # Composable base profiles + modifiers
│   ├── skills/                  # Discoverable agent workflow skills
│   ├── specs-example/           # Phase 0 foundation reference specification
│   └── templates/               # Requirements, design, and task templates
├── scripts/                     # The Framework Engine
│   ├── setup.sh                 # Initializer & profile composer
│   ├── doctor.sh                # Validation check utility
│   ├── skills.sh                # Skills CLI manager
│   ├── phase.sh                 # Phase Sprint runner (Phase hook)
│   ├── validate-spec.js         # Profile-aware spec linter
│   ├── scan-strays.sh           # Misplaced spec detector
│   ├── migrate-structure.sh     # Legacy layout structure migrator
│   └── audit-monorepo.sh        # Monorepo compliance auditor
└── README.md                    # Root high-level developer entry point
```

### 2. Consumer Project Layout
When the setup script is executed, it initializes the project's brain under the `.sdd/` directory and copies the workflow scripts to `.sdd/scripts/` for self-contained, offline execution.

```
consumer-repo/
├── .sdd/                        # Project Brain (initialized by setup.sh)
│   ├── constitution.md          # Supreme Law of the repository
│   ├── glossary.md              # Shared vocabulary
│   ├── .profile                 # Composition metadata (e.g. web+devsecops)
│   ├── memory/                  # Active status logs, technical decisions
│   │   ├── project-overview.md  # High-level context
│   │   ├── progress-tracker.md  # Sprint progress logging
│   │   ├── technical-decisions.md# Architectural decisions (ADRs)
│   │   ├── rules/               # Workflow checklists (before/during/after task)
│   │   └── current-state/       # Active focus + blockers (active-context.md)
│   ├── templates/               # Project templates
│   ├── specs/                   # Project specifications
│   │   ├── active/              # Sprints currently under development
│   │   ├── archive/             # Completed specifications
│   │   └── backlog/             # Future specifications
│   └── scripts/                 # Self-contained framework scripts copy
│       ├── doctor.sh
│       ├── skills.sh
│       ├── phase.sh
│       ├── validate-spec.js
│       ├── scan-strays.sh
│       ├── migrate-structure.sh
│       └── audit-monorepo.sh
├── skills/                      # Local capabilities (discoverable by agents)
│   └── sdd-workflow/            # Default SDD workflow skill
│       └── SKILL.md
├── .git/hooks/pre-commit        # Quality gate git hook
└── AGENTS.md                    # Root agent entrypoint (delegates to onboarding)
```

---

## 🎨 Profile Composition Overlay Logic

The SDD Framework supports composable profiles representing different project types and methodologies. The composition is built by overlaying a single **Base Profile** and zero or more **Modifiers**:

```
[Base Profile] ──> [Modifier 1] ──> [Modifier 2] ──> [Target .sdd/ directory]
```

### 1. Base Profiles
*   `general`: Generic software projects (baseline SDD templates).
*   `web`: Web applications (React, Vue, Next.js) with component design and accessibility templates.
*   `mobile`: Mobile apps (iOS, Android, React Native) with screen design and platform guidelines.
*   `api`: Backend APIs (REST, GraphQL) with API design and schema validation templates.
*   `cli`: Command-line tools with CLI interface design templates.
*   `full-stack`: Web + API combined layout.
*   `monorepo`: Multi-package workspaces with package governance and coordination templates.

### 2. Modifiers
*   `devsecops`: Adds security checklists, threat modeling designs, and threat surface requirements.
*   `mlops`: Adds machine learning model cards, dataset descriptions, and experiment tracking templates.
*   `devops`: Adds advanced CI/CD designs and infrastructure-as-code templates.

### 3. File Overlay Mechanism
During `setup.sh`:
1.  **Base Templates** are copied from `defaults/templates/` to `.sdd/templates/`.
2.  **Base Profile** templates are copied from `defaults/profiles/base/<profile>/` to `.sdd/`. These files overwrite base templates if they share names, tailoring them to the project type.
3.  **Modifiers** are copied from `defaults/profiles/modifiers/<modifier>/` to `.sdd/`. These overlay and extend existing files.
4.  **Constitutional Amendments** (if present in modifiers) are automatically appended to the bottom of `.sdd/constitution.md`.
5.  **Before/During/After rules extensions** are appended to the corresponding rules checklists under `.sdd/memory/rules/`.
6.  The final composition string is written to `.sdd/.profile` to act as metadata for profile-aware linting.
