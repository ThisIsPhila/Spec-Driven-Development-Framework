# Agent Instructions (SDD)

This repository uses the Spec-Driven Development (SDD) framework.

## Canonical Source

1. Read `.sdd/AGENT_ONBOARDING.md` first.
2. Follow `.sdd/constitution.md` (or `.sdd/memory/constitutional-framework.md` on legacy setups).
3. Follow rules in `.sdd/memory/rules/`.

## Non-Negotiables

- No code without a spec in `.sdd/specs/active/...`.
- Artifact order is mandatory: `requirements.md` -> `design.md` -> `tasks.md`.
- Spec artifacts must stay under `.sdd/specs/`.
- Project docs belong in `docs/` and should link to specs instead of duplicating them.
- Keep `.sdd/memory/current-state/` updated as implementation progresses.
