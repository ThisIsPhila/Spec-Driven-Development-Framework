# Weekly Coordination Rollup Automation Prompt

Use this prompt for a weekly monorepo coordination rollup.

```text
Create a weekly coordination rollup for this monorepo.

Inputs:
- .sdd/coordination/apps/*/*-coordination.md
- .sdd/coordination/services/*/*-coordination.md
- .sdd/coordination/blockers.md
- .sdd/coordination/breaking-changes.md

Output targets:
- Append one entry to .sdd/coordination/progress/weekly-updates.md
- Update .sdd/coordination/progress/current-phase-status.md if lifecycle state changed

Format each entry with:
- Date
- Highlights
- Blockers
- Risks
- Next 7 days
```
