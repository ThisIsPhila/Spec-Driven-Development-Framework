# Kiro Adapter

Optional Kiro integration for the SDD Framework. `.sdd/` stays canonical; this adapter only adds earlier, native reminders and a Kiro-visible view of the same specs. Nothing here is required to use the framework.

## Install

```bash
bash scripts/setup.sh --profile general+kiro --yes   # any base works: web+kiro, api+devsecops+kiro, ...
```

Installation is opt-in. If setup runs without `+kiro` and finds a `.kiro/` directory or a `kiro` executable, it prints a hint and installs nothing.

Restart the Kiro session afterwards. Hook files are read when a session starts.

## What gets installed

| Path | Purpose |
| :--- | :--- |
| `.kiro/steering/sdd-framework.md` | Steering with `inclusion: fileMatch` for `.sdd/specs/active/**`. Points at `.sdd/` instead of copying it. |
| `.kiro/hooks/sdd-*.json` | Kiro hook registrations (`PreTaskExec`, `PostTaskExec`, `Stop`). Without these, Kiro does not run the scripts. |
| `.kiro/hooks/sdd-*.sh`, `sdd-hook-lib.sh` | The hook scripts the JSON files call. |
| `.kiro/specs/<phase>` | Symlink to `.sdd/specs/active/<phase>`, so Kiro's spec view shows the same files. Created by `setup.sh` and `phase.sh new`, removed by `phase.sh archive`. |
| `.sdd/adapters.json` | Records what was installed. |

## Hook behavior

| Hook | Behavior |
| :--- | :--- |
| `PreTaskExec` | For a task whose stable ID (`T007.3`) is in an active phase's `tasks.md`: exit 2 with the fix command if the phase has unapproved artifacts or has not been started. Otherwise runs `phase.sh task <id> doing`. Allows everything else. |
| `PostTaskExec` | Prints a reminder to record evidence and run `phase.sh task <id> done`. It never marks a task done, because completion needs acceptance evidence. |
| `Stop` | Silent unless a task is in progress and `active-context.md` is older than 30 minutes. |

Every hook exits 0 when it cannot tell what is going on (no `.sdd/`, no task ID, unreadable input). The task is found by matching the stable-ID pattern in the event payload, not by a named field.

## Troubleshooting

- **Hooks do not run:** check that `.kiro/hooks/sdd-*.json` exist and restart the session.
- **A task is blocked:** run the command the hook prints. It is the same gate `phase.sh start` enforces.
- **Broken or missing symlinks:** run `bash scripts/setup.sh --profile <base>+kiro --yes` again, or use `.sdd/specs/active/` directly.
- **Remove the adapter:** delete `.kiro/hooks/sdd-*`, `.kiro/steering/sdd-framework.md`, the `.kiro/specs/` symlinks and the kiro entry in `.sdd/adapters.json`.

Windows needs Developer Mode or administrator rights for symlinks. Hooks and steering do not depend on them.
