# Version 2.2.0 — 2026-10-13

Owner authorized version release 2.2.0 for the Visual Framework Workspace test metrics and quality indicators iteration.

## Included Enhancements

1. **Framework Quality Pillars**:
   - 4-pillar readiness breakdown (Spec Definition, Governance, Execution, Verification) scaled at 25 points each (100 total).
   - Clickable inline "needs attention" diagnostic hints providing direct navigation to relevant phase tabs (requirements, design, tasks, evidence).
2. **Project Overview Active Task Contract**:
   - "IN PROGRESS" task banner above KPI tiles displaying active task ID, cleaned title, contract definition, and direct phase/task deep-link.
3. **Per-Phase Health Score Pills**:
   - Status indicators on phase progress list graded by health score: healthy (>=75), attention (>=50), critical (<50).
4. **Verification & Test Assurance**:
   - Verification assurance card on Phase Overview with pass/fail counts, pass rates, and freshness classification.
   - Dedicated "Quality & gate health" KPI tile and Verification & test assurance summary panel on Project Overview.
5. **Hook Telemetry Date Axis**:
   - Automation hook timeline sparkline displays actual session dates (e.g. `9 Oct → 12 Oct`) with midpoint date markers.
6. **Extraction & Evidence Robustness**:
   - Active phase auto-detection fallback for projects with blank `.sdd/state` `active_phase=`.
   - Lenient multi-SHA matching for composite git tree fields preventing false stale readings.
   - Vector SVG status indicators (zero emoji rule compliance).

## Metadata Alignment

- `.sdd/framework.json`: `2.2.0`
- `defaults/framework.json`: `2.2.0`
- `visual/package.json`: `2.2.0`
- `visual/package-lock.json`: `2.2.0`
- `CHANGELOG.md`: `[2.2.0] - 2026-10-13`
