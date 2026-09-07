# Constitutional Framework - SDD Framework Project

**Status:** Active  
**Version:** 2.0  
**Project:** Spec-Driven Development Framework

---

## 🎯 Purpose

This constitution governs the development of the SDD framework itself. It ensures we maintain the standards we're promoting to others.

---

## ⚖️ The Articles

### Article I – Dogfooding (Self-Hosting)
**Principle:** We use what we build.

- **Rule:** All framework development must follow SDD methodology
- **Rule:** This project's `.sdd/` directory is our working brain
- **Rule:** Phase 1 specifications must be followed sequentially (Req → Design → Tasks)
- **Rule:** Changes must be tested on this project's own `.sdd/` before release

### Article II – Backward Compatibility
**Principle:** Don't break existing users.

- **Rule:** v1.1 must not break v1.0 installations
- **Rule:** `setup.sh` must support both old (no profiles) and new (with profiles) workflows
- **Rule:** `defaults/` structure changes require migration guide

### Article III – Agent-First Design
**Principle:** AI agents are primary users.

- **Rule:** `AGENT_ONBOARDING.md` must be kept up-to-date with workflow changes
- **Rule:** Agent detection heuristics must be documented and testable
- **Rule:** Error messages must be actionable (agents can self-correct)
- **Rule:** Templates must have clear approval checkpoints

### Article IV – Composability Over Complexity
**Principle:**  Simple building blocks > monolithic solutions.

- **Rule:** Profiles compose (base + modifiers), not multiply
- **Rule:** File overlay must be predictable (base → profile → modifiers)
- **Rule:** No circular dependencies between profiles
- **Rule:** Each profile has single, clear purpose

### Article V – Quality Gates
**Principle:** Specs before code, tests before merge.

- **Rule:** No code without approved Requirements + Design
- **Rule:** Integration tests must pass before merging
- **Rule:** All profiles must pass validation tests
- **Rule:** Documentation must be updated with code changes

### Article VI – Authority and Evidence Truth
**Principle:** A claim is only as broad as the observation that supports it.
- **Rule:** Review, authoring, local implementation, external mutation, merge/push, release, deployment, and owner acceptance are separate authorities.
- **Rule:** Evidence records exact tree/revision, environment, procedure, timestamp, result, and limitations.
- **Rule:** Checkbox state and agent prose never substitute for evidence.

### Article VII – Artifact Boundary and Preservation
**Principle:** One fact has one authoritative home.
- **Rule:** Specs, evidence, reports, governance records, current state, and historical thresholds live in their declared `.sdd/` homes.
- **Rule:** Root agent files are pointers, not duplicate constitutions.
- **Rule:** Framework upgrades preserve consumer hooks, active work, project rules, history, and skills by default.

### Article VIII – Evidence-to-Learning Loop
**Principle:** The specification preserves intent while evidence improves it.
- **Rule:** Each phase makes current state, intended state, observed gap, next authorized action, and learning explicit.
- **Rule:** Failed validation is classified as problem, specification, interaction, execution, environment, timing, or evidence failure.
- **Rule:** Learning changes intent through a recorded decision or successor spec, never silent implementation drift.

---

## 📋 Governance

**Approval Gates:**  
Requirements → Design → Tasks → Implementation

**Amendments:**  
Changes to this constitution require explicit user approval.

**Enforcement:**  
AI agents must refuse to proceed without proper approvals.
