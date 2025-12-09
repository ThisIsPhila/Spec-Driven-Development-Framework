# SDD Framework - Project Overview

**Project Name:** Spec-Driven Development Framework  
**Version:** 1.0 (stable), 1.1 (in development)  
**Repository:** https://github.com/ThisIsPhila/Spec-Driven-Development-Framework  
**License:** MIT

---

## 🎯 Mission

Create a lightweight, agent-friendly framework that enforces spec-driven development workflows for software projects.

---

## 📋 What We're Building

A framework that:
1. **Hydrates projects** with SDD methodology (templates, rules, memory structure)
2. **Supports composable profiles** (web, mobile, api, cli + devsecops, mlops, devops modifiers)
3. **Guides AI agents** to follow strict sequential spec approval (Requirements → Design → Tasks)
4. **Dog foods itself** - we use SDD to build the SDD framework

---

## 🏗️ Current Phase

**Phase 1: Template Profiles & Methodology**

**Goal:** Enable users to initialize SDD with specialized profiles (e.g., `web+devsecops`)

**Status:** Planning complete (requirements, design, tasks approved)

**Next:** Implementation of 4 categories:
1. Profile Infrastructure (directories + READMEs)
2. Profile Templates (base + modifier content)
3. Setup Script Enhancement (composition parsing + overlay)
4. Validation & Documentation (tests + docs)

---

## 🗂️ Repository Structure

```
spec-framework/
├── defaults/                    # Source files copied to new projects
│   ├── memory/                  # Constitutional framework, rules
│   ├── templates/               # Base spec templates
│   ├── specs-example/           # Gold standard examples
│   └── profiles/                # [PHASE 1] Composable profiles
│       ├── base/                # web, mobile, api, cli, full-stack, general
│       └── modifiers/           # devsecops, mlops, devops
├── scripts/
│   └── setup.sh                 # Hydration script (copies defaults → .sdd/)
├── .sdd/                        # [SELF-HOSTING] Our own SDD workspace
│   ├── specs/phases/phase-1/    # Phase 1 planning docs
│   ├── memory/                  # Our project rules, decisions, progress
│   └── templates/               # Templates WE use
├── AGENT_ONBOARDING.md          # Agent instructions
├── README.md                    # User-facing docs
└── CHANGELOG.md                 # Version history
```

---

## 🧭 Key Principles

1. **Self-Hosting:** We use SDD to develop SDD (`.sdd/` is our workspace)
2. **Composability:** Profiles combine base (what) + modifiers (how)
3. **Sequential Approval:** Requirements → Design → Tasks (strict gates)
4. **Agent-First:** AI agents detect project type and recommend profiles
5. **Backward Compatibility:** v1.1 must not break v1.0 users

---

## 🔗 Related Documents

- **Requirements:** `.sdd/specs/phases/phase-1/requirements.md`
- **Design:** `.sdd/specs/phases/phase-1/design.md`
- **Tasks:** `.sdd/specs/phases/phase-1/tasks.md`
- **Progress:** `.sdd/memory/progress-tracker.md`
- **Decisions:** `.sdd/memory/technical-decisions.md`
