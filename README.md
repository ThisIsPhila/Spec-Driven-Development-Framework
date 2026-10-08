# SDD Framework (Spec-Driven Development)
**Unified Specification-Driven Development Framework**

---

## 🎯 Overview

The **Spec-Driven Development (SDD) Framework** provides a structured environment where specifications act as the single source of truth. It aligns developers and AI agents by making requirements, design, and tasks explicit and traceable.

By keeping everything in the `.sdd/` directory, this framework ensures that context is never lost and every code change is traceable back to a requirement.

The framework also preserves a continuous learning loop: **current state → intended state → observed gap → next authorized action → evidence → learning → explicit specification decision**. Specifications remain authoritative without becoming dogma; implementation discoveries update intent through traceable decisions rather than silent drift.

---

## 🧭 Documentation Index

To keep this project clean and maintainable, deep technical details are organized into dedicated documentation:

*   **[Core Architecture & Directory Layouts](docs/architecture.md)** — Layout references, profile compositions, and overlay file mechanisms.
*   **[Operational Process Flows & Diagrams](docs/process-flows.md)** — Visual life cycle guides for setup, specifications, phase runner sprints, pre-commit hooks, and validation linters.
*   **[CLI Tool Reference Guide](docs/cli-reference.md)** — Subcommands, arguments, and options for all script tools (`setup.sh`, `doctor.sh`, `skills.sh`, `phase.sh`, `validate-spec.cjs`, etc.).
*   **[Visual Framework Workspace & Cockpit](docs/visual-workspace.md)** — Optional read-only web cockpit, live auto-updates, traceability graphs, and synthetic demonstration.
*   **[Governance Constitution & rules](docs/governance.md)** — Repository constitution articles and operational rules checklists.
*   **[Critical Assessment & Improvement Roadmap](docs/assessment.md)** — Evidence-based critique of the framework as a tool, with a sequenced roadmap and open decisions.

---

## 🚀 Quick Start Installation

### 1. Manual Setup
Initialize the framework by cloning the source and running the compose setup script:
```bash
# From your target project root
git clone https://github.com/ThisIsPhila/Spec-Driven-Development-Framework.git .sdd-framework
bash .sdd-framework/scripts/setup.sh
```

To conservatively update an existing installation while preserving its constitution, memory, specs, skills, and hooks:

```bash
bash .sdd-framework/scripts/setup.sh --upgrade
```

### 2. Autonomous Agent Setup
If you are using an AI agent, you can delegate installation by pointing the agent to the onboarding file:
*   `.sdd-framework/AGENT_ONBOARDING.md`

**Suggested Prompt:**
> "I want to use Spec-Driven Development. Read `.sdd-framework/AGENT_ONBOARDING.md` and set up the project for me."

---

## 📦 Profile Compositions

The SDD Framework supports composable profiles to tailor rules and templates to your codebase. Configure compositions using the CLI during setup:

```bash
# Setup web application with security auditing
bash .sdd-framework/scripts/setup.sh --profile web+devsecops

# Setup API service with MLOps cards
bash .sdd-framework/scripts/setup.sh --profile api+mlops
```

| Base Profiles | Modifiers | Composed Example |
| :--- | :--- | :--- |
| `general` (baseline) | `devsecops` (security checklists) | `web+devsecops` |
| `web` (front-end) | `mlops` (model/dataset tracking) | `api+mlops` |
| `api` / `cli` (backends) | `devops` (advanced CI/CD templates) | `monorepo+devops` |
| `full-stack` / `monorepo` | | `full-stack+devsecops+devops` |

*   To list all available profile options: `bash .sdd-framework/scripts/setup.sh --list`
*   To include template examples: `bash .sdd-framework/scripts/setup.sh --profile general --with-examples`

---

## 🤖 AI Agent Integration

Setup automatically installs root-level instruction files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`) which direct agents to read the onboarding protocol. 

During active development, agents use the **Phase Sprint Hook** to run task sprints programmatically:
```bash
# Start a phase sprint (verifies specs, checkouts branch, registers active context)
bash .sdd/scripts/phase.sh start <phase-name>

# Update task checklist checkbox status and context focus
bash .sdd/scripts/phase.sh task <task-id> <done|doing|todo>

# Run full project validations and complete the sprint
bash .sdd/scripts/phase.sh finish
```
See the **[CLI Reference](docs/cli-reference.md#2-phasesh--phase-sprint-runner-phase-hook)** for detailed subcommand information.

---

## 🖥️ Visual Framework Workspace (Optional Cockpit)

The SDD Framework includes an optional, zero-dependency-on-core visual cockpit that runs locally to provide engineers with real-time visibility into specifications, task completion, evidence records, and dependency traceability while AI agents work:

```bash
# Install isolated visual dependencies
npm --prefix visual install

# Launch local cockpit (loopback-only with ephemeral token)
npm --prefix visual run workspace

# Or build static documentation and demo bundle
npm --prefix visual run build
```

- **Live Auto-Updates:** Reflects file changes on disk via Server-Sent Events (SSE) within seconds without losing scroll or selection.
- **Traceability Visualizations:** Responsive SVG graphs and accessible lists connect Requirements (`REQ-*`), Tasks (`T*`), and Evidence records.
- **Public Demonstration:** Inspired by `skills.sh`, includes an interactive synthetic demonstration that runs completely statically without backend servers or credentials.
- **Strictly Read-Only:** Exposes no file-mutation endpoints, eliminating write-race conflicts with autonomous agents.
