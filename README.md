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
.sdd/
├── README.md                    # This file
├── specs/                       # All project specifications
│   └── phases/                  # Phase-specific folders (phase-{N}-{name})
├── templates/                   # Spec creation templates
│   ├── requirements-template.md
│   ├── design-template.md
│   └── tasks-template.md
├── scripts/                     # Automation tools
├── memory/                      # Project memory & tracking
│   ├── constitutional-framework.md  # Core rules/principles
│   ├── progress-tracker.md          # Global status
│   ├── project-overview.md          # High-level context
│   ├── technical-decisions.md       # ADRs (Architecture Decision Records)
│   └── rules/                       # Rules (before/during/after task checklist)
```

---

## ⚡️ Quick Start

### Option A: Start a New Project
1.  **Clone the framework**:
    ```bash
    git clone https://github.com/your-org/sdd-framework.git my-awesome-project
    cd my-awesome-project
    ```
2.  **Activate your Agent**:
    Paste this prompt to your chat:
    > "I want to use Spec-Driven Development. Read `.sdd-framework/AGENT_ONBOARDING.md` and set up the project for me."

### Option B: Add to Existing Project
1.  **Download as submodule or folder**:
    ```bash
    # Run in your project root
    git clone https://github.com/your-org/sdd-framework.git .sdd-framework
    ```
2.  **Activate your Agent**:
    Paste this prompt to your chat:
    > "I want to use Spec-Driven Development. Read `.sdd-framework/AGENT_ONBOARDING.md` and set up the project for me."

---

## 🛠️ Manual Setup
Use this if you prefer to run the scripts yourself without an AI agent.

1.  **Get the code**:
    ```bash
    git clone https://github.com/your-org/sdd-framework.git .sdd-framework
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
We eat our own dog food. If you want to contribute, you must follow the SDD process.
See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License
MIT License. See [LICENSE](LICENSE) for details.

