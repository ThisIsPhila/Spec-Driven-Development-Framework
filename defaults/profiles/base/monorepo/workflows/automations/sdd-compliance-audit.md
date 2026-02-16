# SDD Compliance Audit Automation Prompt

Use this prompt for a recurring automation that validates monorepo SDD alignment.

```text
Run an SDD compliance audit for this monorepo.

Checks:
1) Root SDD governance files exist and are readable.
2) Local .sdd coverage in apps/ and services/ is complete.
3) Coordination cards exist for each component with local .sdd.
4) Active phase status entries reference existing start records.
5) Details paths in current-phase-status.md exist.

Reporting:
- Update .sdd/coordination/progress/sdd-compliance-latest.md
- Append one line to .sdd/coordination/progress/sdd-compliance-history.md
- Include Critical, Warning, and Info findings with exact paths.
```
