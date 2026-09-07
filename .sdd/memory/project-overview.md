# SDD Framework - Project Overview

**Project Name:** Spec-Driven Development Framework
**Stable Version:** 1.3.0
**Current Work:** Phase 004 - Intent, Evidence, and Learning Loop (2.0.0 candidate)
**Repository:** https://github.com/ThisIsPhila/Spec-Driven-Development-Framework
**License:** MIT

---

## Mission

Create a lightweight, universal, agent-neutral framework that makes spec-driven development executable and verifiable across software projects. The `.sdd/` directory is the canonical source of workflow truth; agent-specific integrations may accelerate the workflow but must not own its logic.

---

## What We're Building

The framework:
1. Hydrates projects with SDD templates, governance, memory, scripts, and optional profiles.
2. Enforces the ordered lifecycle `requirements.md` → `design.md` → `tasks.md` → implementation.
3. Supports seven base profiles (`general`, `web`, `mobile`, `api`, `cli`, `full-stack`, `monorepo`) and three independently optional modifiers (`devops`, `devsecops`, `mlops`).
4. Supports all 56 profile compositions: seven bases multiplied by every subset of three modifiers (`7 × 2³`).
5. Gives every agent the same core behavior through `.sdd/scripts/`; native agent adapters contain no enforcement logic.
6. Dogfoods the framework in this repository and protects behavior with deterministic tests and CI.

---

## Current Phase

**Phase 004: Intent, Evidence, and Learning Loop** — active on `feat/phase-004-intent-evidence-learning-loop`.

Phase 004 carries the Smart Trader correction lessons into universal framework behavior: bounded authority, exact-environment evidence, non-repetitive policy, safe upgrades, forward thresholds, executable tasks, and evidence-driven specification learning.

**Phase 003: Framework Hardening** — locally completed; archival and release publication remain separate actions.

The phase closes the gap between documented and actual behavior by adding:
- machine-readable sprint state in `.sdd/state` with narrative markdown rendered from it;
- stable task IDs and exact task matching;
- typed artifact approvals and a hard sprint-start gate;
- framework-local `.sdd/scripts/` symlinks while consumer installs receive real script files;
- end-to-end lifecycle, state, path, lint, and all-composition tests;
- GitHub Actions validation on Ubuntu and macOS;
- canonical governance at `.sdd/constitution.md` plus explicit placement and glossary files.

**Completed history:**
- Phase 001 — Template Profiles & Methodology: archived at `.sdd/specs/archive/phase-001-template-profiles/`.
- Phase 002 — Skills Management: delivered in v1.3.0; its private working spec remains local pending explicit archival.

---

## Repository Structure

```text
.
├── .github/workflows/ci.yml       # Cross-platform validation
├── .sdd/                           # Canonical self-hosted SDD workspace
│   ├── constitution.md             # Non-negotiable governance
│   ├── glossary.md                 # Framework terminology
│   ├── state                       # Per-developer machine state (gitignored)
│   ├── scripts/                    # Relative links to root scripts in this repo
│   ├── memory/                     # Decisions, rules, and rendered current state
│   ├── specs/
│   │   ├── active/                 # Private in-flight specs (gitignored)
│   │   ├── backlog/                # Private planned specs (gitignored)
│   │   └── archive/                # Published completed specs
│   └── templates/                  # Templates used to develop this framework
├── defaults/                       # Source payload installed into consumer projects
│   ├── agent-entrypoints/          # Thin cross-agent entrypoints
│   ├── memory/                     # Default governance and rules
│   ├── profiles/
│   │   ├── base/                   # Seven project-type profiles
│   │   └── modifiers/              # Three optional methodology overlays
│   ├── skills/                     # Default reusable skills
│   └── templates/                  # Default spec templates
├── scripts/                        # Canonical implementation and validators
├── skills/                         # Framework-repository skills
├── tests/                          # Deterministic Bash behavior suite
├── docs/                           # User and maintainer documentation
├── AGENTS.md                       # Universal agent baseline
├── README.md                       # User-facing entry point
└── CHANGELOG.md                    # Release history
```

---

## Key Principles

1. **`.sdd/` is canonical:** workflow state, governance, specs, and enforcement remain agent-neutral.
2. **One fact, one home:** machine sprint scalars live in `.sdd/state`; task checkboxes live only in `tasks.md`; prose is a rendering, not a state store.
3. **Sequential approval is enforced:** requirements, design, and tasks are approved in order before implementation starts.
4. **Composability is complete and testable:** base + any subset of modifiers produces 56 valid combinations, all covered by the installation matrix.
5. **Private work, public history:** active and backlog specs are untracked; completed archives are publishable.
6. **Adapters contain zero logic:** CI and `.sdd/scripts/` enforce behavior even when no supported agent is present.
7. **Backward compatibility matters:** existing consumers migrate from legacy prose state and constitution locations without requiring new runtime dependencies.

---

## Related Documents

- [Critical assessment and remediation ledger](../../docs/assessment.md)
- [Architecture](../../docs/architecture.md)
- [CLI reference](../../docs/cli-reference.md)
- [Phase 001 requirements](../specs/archive/phase-001-template-profiles/requirements.md)
- [Phase 001 design](../specs/archive/phase-001-template-profiles/design.md)
- [Phase 001 tasks](../specs/archive/phase-001-template-profiles/tasks.md)
- [Progress tracker](progress-tracker.md)
- [Technical decisions](technical-decisions.md)
