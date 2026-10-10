# Technical Decisions - SDD Framework

**Project:** Spec-Driven Development Framework
**Last Updated:** August 19, 2026

---

## Decision Log

### TD-001: Profile Composition Architecture (December 9, 2025; expanded February 5, 2026)

**Decision:** Use one base plus zero or more independent modifiers instead of monolithic profiles.

**Current model:**
- **Base profiles:** `general`, `web`, `mobile`, `api`, `cli`, `full-stack`, `monorepo`
- **Modifiers:** `devops`, `devsecops`, `mlops`
- **Syntax:** `web+devsecops` or `monorepo+devops+devsecops+mlops`
- **Inventory:** 10 reusable building blocks
- **Composition space:** 56 valid combinations (`7 × 2³`), including each unmodified base

**Rationale:** Linear content growth supports a complete composition space without maintaining a separate profile for every combination. Duplicate modifiers are rejected because they are not meaningful compositions and can duplicate amendments.

**Alternatives considered:**
- Monolithic profiles — rejected because combinations grow exponentially as maintained artifacts.
- A YAML composition file — rejected because the CLI syntax is sufficient and avoids another parser/dependency.

**Status:** Implemented and covered by the complete 56-composition installation matrix.

---

### TD-002: Predictable Three-Layer Overlay (December 9, 2025)

**Decision:** Install files in base-framework → base-profile → modifier order.

**Rationale:** Later layers can intentionally augment or replace earlier defaults while each profile remains independently understandable. Setup uses `rsync` where available and preserves the same ordering in its fallback copy path.

**Status:** Implemented.

---

### TD-003: Template Extensions via `_extends.md` (December 9, 2025)

**Decision:** Let modifiers augment existing markdown through `*_extends.md` files rather than copying full templates.

**Rationale:** A modifier owns only the content it adds, which reduces drift and preserves composition. Extension insertion is idempotent.

**Status:** Implemented.

---

### TD-004: Private Working Specs, Published Archive (December 9, 2025; superseded August 19, 2026)

**Original decision:** Commit the complete `.sdd/` workspace to demonstrate self-hosting.

**Superseding decision:** Commit the framework, governance, memory, templates, and completed spec archive, but keep `.sdd/specs/active/`, `.sdd/specs/backlog/`, and `.sdd/state` private and untracked in this public repository.

**Rationale:** Dogfooding and public design history remain visible through archived specs without publishing unfinished plans or per-developer sprint state. Existing public specs were security-scanned; no secret or PII exposure justified destructive history rewriting.

**Status:** Implemented. Consumer projects choose their own visibility policy.

---

### TD-005: Portable Bash Core (December 9, 2025)

**Decision:** Keep the executable core in portable Bash, including compatibility with macOS Bash 3.2.

**Rationale:** Consumer projects can run the framework without installing Python, Node, or `jq`. Node remains optional for the richer spec content linter; `doctor.sh` degrades visibly when Node is absent.

**Status:** Implemented and validated on Linux and macOS CI runners.

---

### TD-006: `.sdd/` Owns Enforcement; Adapters Own No Logic (August 19, 2026)

**Decision:** `.sdd/` is the universal canonical layer. Agent-specific adapters may map native events to `.sdd/scripts/`, but may not implement independent lifecycle or governance rules.

**Rationale:** The framework must behave identically for Kiro, Claude, Gemini, Copilot, Codex, Cursor, a human shell, and CI. Native hooks can accelerate feedback but cannot be the only gate because agents and hook capabilities differ.

**Rejected:** Making Kiro or any other vendor's native spec directory canonical. That would undermine the cross-agent purpose of the project.

**Status:** Approved architecture principle; concrete adapters are deferred to a later phase.

---

### TD-007: Flat Machine State and One-Fact-One-Home (August 19, 2026)

**Decision:** Store sprint scalars in a flat `.sdd/state` `key=value` file. Store task completion only in the canonical `tasks.md` checkboxes.

**State owns:** active phase folder, branch, typed approval timestamps, and sprint-start metadata.
**Tasks own:** stable task IDs and task status.
**Markdown current-state files:** rendered human context, never parsed as authoritative sprint state.

**Rationale:** JSON would require `jq` or Node in a Bash-only core. Duplicating checkbox state into `.sdd/state` would create two sources of truth—the defect this decision is intended to remove. Atomic writes and read-back verification prevent false success.

**Compatibility:** When state is absent, legacy `active-context.md` values are migrated automatically.

**Status:** Implemented by Phase 003 (REQ-003.3).

---

### TD-008: Stable IDs, Typed Approvals, and Hard Gates (August 19, 2026)

**Decision:**
- Generated task identifiers use the delimited form `**[T003.1]**`.
- A task operation must match exactly one ID; zero or multiple matches fail without mutation.
- `phase.sh approve` records requirements, design, and tasks approvals as ordered typed transitions.
- `phase.sh start` refuses missing or unapproved artifacts and a failing doctor preflight.

**Rationale:** Substring matching and prose approval detection are ambiguous. Governance must be executable rather than advisory.

**Status:** Implemented and lifecycle-tested by Phase 003 (REQ-003.4 and REQ-003.5).

---

### TD-009: One Script Source, Two Installation Forms (August 19, 2026)

**Decision:** Root `scripts/` is the implementation source. This framework repository commits relative `.sdd/scripts/*.sh` symlinks to `../../scripts/*.sh`; consumer setup copies real files into `.sdd/scripts/`.

**Rationale:** Documented `.sdd/scripts/` commands work verbatim in both contexts without maintaining duplicate script copies. Relative links survive fresh clones. Consumers remain self-contained.

**Rejected:** Rewriting documentation to root-only `scripts/`, which would break the consumer contract, and committing duplicate script copies, which would drift.

**Status:** Implemented and guarded by symlink/path regression tests.

---

### TD-010: Canonical Constitution and Semantic Amendments (August 19, 2026)

**Decision:** Installed governance lives at `.sdd/constitution.md`. Modifier amendments use semantic headings such as `## Amendment: Security-First Development` and are appended idempotently.

**Rationale:** Multiple modifiers cannot all own a fixed “Article VI.” A single canonical location removes the split between root governance and `memory/constitutional-framework.md`. The legacy source filename remains only as installer input and migration fallback.

**Status:** Implemented; doctor verifies the canonical constitution.

---

### TD-011: Complete Composition Matrix and Cross-Platform CI (August 19, 2026)

**Decision:** Test every syntactically valid profile composition: seven bases × all subsets of three modifiers = 56. Execute the deterministic Bash suite in GitHub Actions on Ubuntu and macOS.

**Rationale:** Four examples do not support a universal composition claim. The full matrix is bounded, runs in parallel batches of eight, and stays below the Phase 003 60-second target. macOS protects the Bash 3.2 compatibility floor.

**Status:** Implemented by Phase 003 (REQ-003.1 and REQ-003.2).

---

### TD-012: Phase 001 Canonical Archive Migration (August 19, 2026)

**Decision:** Move the legacy `specs/phases/phase-1/` triplet to `.sdd/specs/archive/phase-001-template-profiles/` and reconcile it with the implementation it now documents.

**Rationale:** The old path was outside the contract directories and escaped validation. The canonical folder follows the repository's `phase-###-slug` naming regex and keeps completed design history public.

**Status:** Implemented as part of Phase 003 documentation reconciliation.

---

## Decision Template

```markdown
### TD-XXX: [Title] (Date)

**Decision:** [What we decided]

**Context:** [Why this was needed]

**Solution:** [How we're solving it]

**Rationale:** [Why this approach]

**Alternatives considered:** [Other options and why rejected]

**Status:** [Proposed / Approved / Implemented / Superseded / Deprecated]
```

## TD-013: Insights First, Documents as Sources (October 10, 2026)

**Decision:** Open connected projects on an overview of recorded progress, gaps, next tasks and sourced decisions. Keep global navigation limited to Projects, Skills & Profiles, About and Account; put project sections in an on-screen rail. Account connection is a settings action and never replaces project navigation.

**Rationale:** The owner found the document-centric interface confusing and wanted to understand what is happening before reading source files. Markdown remains canonical, while the product derives useful summaries and links back to evidence. Recorded observations do not imply independent verification or historical performance data.

**Implementation:** Interactive profile detail pages expose actual profile contents and setup commands. Phases retain their canonical full IDs and numeric ordering. The public demo remains explicitly fictional; signed-in project lists show private connected projects.
