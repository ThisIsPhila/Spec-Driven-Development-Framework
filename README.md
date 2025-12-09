# SDD Framework (Spec-Driven Development)
**Unified Specification-Driven Development Framework**

---

## Overview

The **Spec-Driven Development (SDD) Framework** is a bridge between human creativity and AI execution. It provides a structured environment where specifications act as the 'source of truth', allowing AI agents to work autonomously with high precision while helping human developers quickly grasp project context. Whether you're building with agents or just want a cleaner way to manage projects, SDD keeps everyone aligned.

It acts as the **single unified source of truth** for:

- **Specifications** – Requirements, design, and task breakdowns.
- **Memory** – Project tracking, architectural decisions, and rules.
- **Rules** – The codified habits (checklists) that ensure quality.

By keeping everything in the `.sdd/` directory, this framework ensures that context is never lost and that every code change is traceable to a specific requirement.

---

## Directory Structure

```
.sdd-framework/
├── AGENT_ONBOARDING.md          # AI agent workflow guide
├── README.md                    # This file
├── CHANGELOG.md                 # Version history
│
├── defaults/                    # Framework source files
│   ├── memory/                  # Default memory structure
│   │   ├── constitutional-framework.md
│   │   └── rules/               # Workflow rules (before/during/after)
│   │       ├── before-task.md
│   │       ├── during-task.md
│   │       └── after-task.md
│   │
│   ├── templates/               # Core spec templates
│   │   ├── requirements-template.md
│   │   ├── design-template.md
│   │   └── tasks-template.md
│   │
│   └── profiles/                # Composable profiles (NEW in v1.1)
│       ├── base/                # Base profiles (choose one)
│       │   ├── general/         # Generic projects
│       │   ├── web/             # Web applications
│       │   ├── mobile/          # Mobile apps
│       │   ├── api/             # Backend APIs
│       │   ├── cli/             # CLI tools
│       │   └── full-stack/      # Web + API
│       │
│       └── modifiers/          # Optional modifiers (add any)
│           ├── devsecops/      # Security workflows
│           ├── mlops/          # ML governance
│           └── devops/         # CI/CD automation
│
└── scripts/                    # Automation tools
    ├── setup.sh                # Main installation script
    ├── common.sh               # Shared utilities
    └── validate-profiles.sh    # Profile validation
```

**After running setup.sh, your project gets:**
```
your-project/
└── .sdd/                       # Project-specific SDD directory
    ├── .profile                # Installed composition (e.g., "web+devsecops")
    ├── AGENT_ONBOARDING.md
    │
    ├── templates/              # Templates (base + profile-specific)
    │   ├── requirements-template.md
    │   ├── design-template.md
    │   ├── tasks-template.md
    │   ├── component-design-template.md  # (from web profile)
    │   └── security-design-template.md   # (from devsecops modifier)
    │
    ├── memory/
    │   ├── constitutional-framework.md   # (with modifier amendments)
    │   ├── progress-tracker.md
    │   ├── project-overview.md
    │   ├── technical-decisions.md
    │   └── rules/
    │       ├── before-task.md
    │       ├── during-task.md
    │       ├── after-task.md
    │       ├── accessibility-checklist.md     # (from web)
    │       └── security-checklist.md          # (from devsecops)
    │
    └── specs/                  # Your project specs go here
        └── phases/
```

---

## 🚀 Quick Start

```bash
# Clone this repository
git clone https://github.com/ThisIsPhila/Spec-Driven-Development-Framework.git

# Initialize in your project
./scripts/setup.sh

# Follow the interactive menu or use a specific profile
./scripts/setup.sh --profile web+devsecops
```

## 📦 Choosing a Profile

The SDD Framework supports **composable profiles** to match your project type and methodology:

### Base Profiles (choose one):
- **general** - Generic software projects (baseline SDD templates)
- **web** - Web applications (React, Vue, Next.js) with component-design and accessibility templates
- **mobile** - Mobile apps (iOS, Android) with screen-design and platform guidelines
- **api** - Backend APIs (REST, GraphQL) with api-design and schema templates
- **cli** - Command-line tools with command-design and UX principles
- **full-stack** - Web + API combined with system architecture templates

### Modifiers (add zero or more):
- **+devsecops** - Security-first workflows (threat modeling, security checklists)
- **+mlops** - ML model governance (experiment tracking, data versioning)
- **+devops** - Advanced CI/CD (pipeline design, infrastructure as code)

### Example Compositions:
```bash
# Web app with security focus
./scripts/setup.sh --profile web+devsecops

# Machine learning API
./scripts/setup.sh --profile api+mlops

# Full-stack with security and CI/CD
./scripts/setup.sh --profile full-stack+devsecops+devops

# List all available profiles
./scripts/setup.sh --list-profiles
```

2.  **Activate your Agent**:
    Paste this prompt to your chat:
    > "I want to use Spec-Driven Development. Read `.sdd-framework/AGENT_ONBOARDING.md` and set up the project for me."

### Option B: Add to Existing Project
1.  **Download as submodule or folder**:
    ```bash
    # Run in your project root
    git clone https://github.com/ThisIsPhila/.sdd-framework.git .sdd-framework
    ```
2.  **Activate your Agent**:
    Paste this prompt to your chat:
    > "I want to use Spec-Driven Development. Read `.sdd-framework/AGENT_ONBOARDING.md` and set up the project for me."

---

## 🛠️ Manual Setup
Use this if you prefer to run the scripts yourself without an AI agent.

1.  **Get the code**:
    ```bash
    git clone https://github.com/ThisIsPhila/.sdd-framework.git .sdd-framework
    ```
2.  **Run the setup script**:
    ```bash
    bash .sdd-framework/scripts/setup.sh
    ```


## Spec Lifecycle

1. **Requirements (`requirements.md`)** – WHAT and WHY. Focus on user stories and success criteria.
2. **Design (`design.md`)** – HOW. Architecture, data models, and edge cases.
3. **Tasks (`tasks.md`)** – ACTION. Step-by-step implementation plan.
4. **Execution** – Code changes.
5. **Verification** – Tests and manual checks.

**Rule:** You cannot proceed to the next stage until the current artifact is approved.

---

## Principles

1.  **Context First**: Never write code without understanding existing patterns.
2.  **Spec-Driven**: Code exists to fulfill a spec. No spec, no code.
3.  **Traceability**: Every task traces back to a design decision, which traces back to a requirement.

---

## 🤝 Contributing
We use what we build. If you want to contribute, you must follow the SDD process.
See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.

