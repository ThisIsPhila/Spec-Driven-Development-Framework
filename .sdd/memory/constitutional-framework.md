# Constitutional Framework

**Status:** Active
**Version:** 1.0

---

## 🎯 Purpose

This document defines the non-negotiable principles that govern this project. It ensures consistency, quality, and maintainability.

---

## ⚖️ The Articles

### Article I – Security & Privacy
**Principle:** Security is not an afterthought.
- **Rule:** No hardcoded secrets.
- **Rule:** Least privilege access.
- **Rule:** Data must be encrypted where applicable.

### Article II – Specification-Driven Development (SDD)
**Principle:** Code is a liability; specs are an asset.
- **Rule:** No code without a linked Requirement and Design spec.
- **Rule:** Specs must be approved before implementation begins.
- **Rule:** Commits must reference the Spec/Task ID.

### Article III – Test-First
**Principle:** If it isn't tested, it doesn't exist.
- **Rule:** Write tests before code (TDD) where possible.
- **Rule:** Coverage must meet defined thresholds.
- **Rule:** Tests must be deterministic.

### Article IV – AI & Context
**Principle:** AI agents are first-class team members.
- **Rule:** Keep context files (`progress-tracker.md`, `project-overview.md`) up to date.
- **Rule:** AI agents must follow the `AGENT_ONBOARDING.md` protocol.

---

## 📋 Governance

- **Approval Gates:** Requirements -> Design -> Implementation.
- **Amendments:** Changes to this constitution require team consensus.
