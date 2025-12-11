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

Recommended **monorepo + DevSecOps** layout for consumer projects:

```
.sdd/
├── constitution.md           # The Supreme Law (Updated for Monorepo)
├── glossary.md               # Shared language (e.g., "What is CUL?")
├── templates/
│   ├── feature-spec.md       # The Standard Feature Contract
│   ├── architecture-rfc.md   # For new Packages/Modules
│   └── privacy-audit.md      # For DevSecOps compliance
└── specs/
    ├── active/               # In-progress specs
    ├── archive/              # Completed specs
    └── backlog/              # Future ideas
```

When you run `scripts/setup.sh`, the framework copies defaults (templates, memory, and rules) into `.sdd/` so the governance engine lives at the repo root while understanding the monorepo tree.

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

## 🔍 Spec Linter (privacy gate)
Run the optional linter before coding to ensure specs cover privacy controls:
```bash
node scripts/validate-spec.js .sdd/specs/active/feature.md
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
