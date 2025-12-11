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

### Article IV – The Law of Boundaries (Monorepo Architecture)
**Principle:** Architecture integrity is enforced through separation of concerns.
- **Rule:** No App-to-App Imports. `apps/cogni-chat` can never import from `apps/cogni-voice`; communicate via CUL or shared packages.
- **Rule:** Logic Lives in Packages. Business logic belongs in shared packages (e.g., `packages/core`), not in app layers.
- **Rule:** UI Components are Dumb. Shared UI components (`packages/ui`) must not contain business logic or API calls.

### Article V – The Law of Blindness (Privacy & Data)
**Principle:** PII must be minimized, masked, and kept local whenever possible.
- **Rule:** Mask First, Ask Later. No user input enters application state without passing through the PrivacyGuard sanitizer.
- **Rule:** The Double-Blind Rule. Cloud databases (e.g., Supabase) must never contain unencrypted PII—only vectors or masked text.
- **Rule:** Local Sovereignty. Unmasking keys never leave the user's device.

### Article VI – AI & Context
**Principle:** AI agents are first-class team members.
- **Rule:** Keep context files (`progress-tracker.md`, `project-overview.md`) up to date.
- **Rule:** AI agents must follow the `AGENT_ONBOARDING.md` protocol.

---

## 📋 Governance

- **Approval Gates:** Requirements -> Design -> Implementation.
- **Amendments:** Changes to this constitution require team consensus.
