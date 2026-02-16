# Monorepo Governance Rules

## Scope
These rules apply when one repo contains multiple apps/services with local `.sdd` workspaces.

## Rules
- Maintain a root coordination layer in `.sdd/coordination/`.
- Each component with local `.sdd` must have a coordination card at:
  - `.sdd/coordination/apps/{component}/{component}-coordination.md`
  - `.sdd/coordination/services/{component}/{component}-coordination.md`
- Active phases listed in `.sdd/coordination/progress/current-phase-status.md` must reference an existing phase start record.
- Weekly rollups must update `.sdd/coordination/progress/weekly-updates.md`.
- Cross-project blockers and breaking changes must be tracked in:
  - `.sdd/coordination/blockers.md`
  - `.sdd/coordination/breaking-changes.md`

## Verification
Run:
```bash
bash .sdd-framework/scripts/audit-monorepo.sh
```
