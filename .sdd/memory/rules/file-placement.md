# File Placement Rules

## Purpose
Keep specs and project documentation cleanly separated so agents and humans can find the right artifacts.

## Rules
- **All SDD specs live in `.sdd/specs/`**.
  - Working specs: `.sdd/specs/active/` or `.sdd/specs/backlog/`.
  - Completed specs: `.sdd/specs/archive/`.
  - Requirements, design, tasks, and spec artifacts must not be placed elsewhere.
- **Project documentation lives in `docs/`** (user guides, architecture notes, runbooks).
  - Do not place `requirements.md`, `design.md`, or `tasks.md` inside `docs/`.
- **Templates live in `.sdd/templates/` only.**

## Privacy
In this public framework repository, `active/` and `backlog/` are gitignored because they contain private in-flight planning. `archive/` is published as the completed historical record. Consumer projects may choose a different visibility policy.

## Quick Checks
- If a file is named `requirements.md`, `design.md`, or `tasks.md`, it must be under `.sdd/specs/`.
- If a file in `docs/` reads like a spec, move it to `.sdd/specs/` and link to it from `docs/` if needed.

## Suggested Tooling
Run:
```bash
bash .sdd/scripts/scan-strays.sh
```
