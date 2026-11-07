# Version 2.3.0 — 2026-11-07

Prepared for the owner to tag and publish. Not tagged and not pushed.

## Included
1. **Kiro adapter** (`+kiro` modifier): steering, `PreTaskExec`/`PostTaskExec`/`Stop` hooks with registrations, `.kiro/specs` symlink bridge, `.sdd/adapters.json` record. Opt-in; works as before without it.
2. **Adapter test suite**: `tests/test_kiro_adapter.sh`.

## Metadata Alignment
- `.sdd/framework.json`: `2.3.0`
- `defaults/framework.json`: `2.3.0`
- `visual/package.json`: `2.3.0`
- `visual/package-lock.json`: `2.3.0` (project entries only)
- `CHANGELOG.md`: `[2.3.0] - 2026-11-07`

## Known limits
Not yet observed in a live Kiro session (T007.12). `doctor` adapter drift check deferred (T007.11). `visual` tests not run in this pass (dependencies not installed).
