# Coordination Framework

This folder is the cross-project coordination layer for monorepo SDD workflows.

## Scope

- Track lifecycle status across apps and services.
- Record blockers and breaking changes that affect more than one component.
- Capture weekly rollups sourced from each component's local `.sdd` progress.
- Maintain a rolling SDD compliance report.

## Directory Contract

- `apps/{component}/{component}-coordination.md`: Coordination card for each app.
- `apps/{component}/phase-XXX-start.md`: App phase kickoff record.
- `apps/{component}/phase-XXX-complete.md`: App phase completion record.
- `services/{component}/{component}-coordination.md`: Coordination card for each service.
- `services/{component}/phase-XXX-start.md`: Service phase kickoff record.
- `services/{component}/phase-XXX-complete.md`: Service phase completion record.
- `progress/current-phase-status.md`: Current cross-project status snapshot.
- `progress/weekly-updates.md`: Weekly rollup log.
- `progress/sdd-compliance-latest.md`: Rolling compliance audit report.
- `progress/sdd-compliance-history.md`: One-line history per audit run.
- `blockers.md`: Open cross-project blockers.
- `breaking-changes.md`: Active breaking change notices.
- `phase-start-template.md`: Template for phase kickoff records.
- `phase-complete-template.md`: Template for phase completion records.

## Verification

Run:
```bash
bash .sdd-framework/scripts/audit-monorepo.sh
```
