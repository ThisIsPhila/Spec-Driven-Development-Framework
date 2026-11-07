# Kiro Integration

An optional adapter that lets Kiro and the SDD Framework work on the same specs. `.sdd/` stays the single source of truth and every `phase.sh` rule is enforced the same way with or without Kiro. The adapter adds three things inside Kiro: steering that loads when you work on a spec, hooks that stop or remind at the right moment, and a `.kiro/specs/` view of the same files.

## Install

```bash
bash scripts/setup.sh --profile general+kiro --yes
```

`kiro` is a modifier like `devsecops`, so it composes with any base (`web+kiro`, `api+devsecops+kiro`). Restart the Kiro session afterwards; hook files are read at session start.

Installation is opt-in. When setup runs without `+kiro` and finds a `.kiro/` directory or a `kiro` executable, it prints a one-line hint and changes nothing. `setup.sh --upgrade` refreshes the adapter only if it was installed before.

## What it adds

| Piece | Installed at | Behavior |
| :--- | :--- | :--- |
| Steering | `.kiro/steering/sdd-framework.md` | `inclusion: fileMatch` on `.sdd/specs/active/**`. Loads when Kiro reads or edits an active spec file, and points at `.sdd/AGENT_ONBOARDING.md` and the constitution rather than copying them. |
| Hook registrations | `.kiro/hooks/sdd-*.json` | Tell Kiro to run the scripts on `PreTaskExec`, `PostTaskExec` and `Stop`. Kiro does not run a script that has no registration. |
| Hook scripts | `.kiro/hooks/sdd-*.sh` | See below. |
| Spec view | `.kiro/specs/<phase>` | Relative symlink to `.sdd/specs/active/<phase>`. Created by `setup.sh` and `phase.sh new`, removed by `phase.sh archive`. Git-ignored because it is per-checkout. |
| Record | `.sdd/adapters.json` | Which adapter and files were installed. |

### Hooks

| Hook | Behavior |
| :--- | :--- |
| `sdd-pre-task` | If the task's stable ID (for example `T007.3`) appears in an active phase's `tasks.md`: exits 2 with the exact fix command when requirements, design or tasks are unapproved, or the phase has not been started. Otherwise runs `phase.sh task <id> doing`. Tasks without an SDD ID, such as Kiro's own `1.1` tasks, pass untouched. |
| `sdd-post-task` | Prints a reminder to record acceptance evidence and run `phase.sh task <id> done`. It does not mark the task done, because completion requires evidence the hook cannot judge. |
| `sdd-stop` | `Stop` fires after every turn, so this is silent unless a task is in progress and `active-context.md` has not changed for 30 minutes. |

Every hook exits 0 when it cannot determine what is happening: no `.sdd/`, no task ID, empty or malformed input. The only exit 2 is the explained gate in `sdd-pre-task`. The same rules are still enforced by `phase.sh start` and `doctor.sh`, so removing the hooks removes a convenience, not a safeguard.

## How the two fit together

| Moment | In Kiro | Without Kiro |
| :--- | :--- | :--- |
| Opening a spec | Steering loads guidance | Agent reads `AGENTS.md` and onboarding |
| Starting a task | `sdd-pre-task` blocks early with the fix | `phase.sh start` / `task` refuse |
| Finishing a task | `sdd-post-task` reminder | `after-task` rules |
| Ending a turn | `sdd-stop` nudge | Manual |
| Browsing specs | `.kiro/specs/<phase>` | `.sdd/specs/active/<phase>` |

## Verified and not verified

Tested in `tests/test_kiro_adapter.sh` against real installs in temporary repositories: opt-in behavior, idempotent setup, hook registrations pointing at installed scripts, steering frontmatter, symlinks across `setup`, `phase new` and `archive`, and every hook's allow, block and fail-open paths with real stdin payloads.

Not verified: behavior inside a live Kiro session. Kiro's documentation describes hook files, the `PreTaskExec` trigger and exit-code 2 blocking, but I could not find a published payload schema for the task triggers. The hooks therefore find the task by matching the stable-ID pattern anywhere in the payload instead of reading a named field, and fail open if there is none. Check the first real run (Task T007.20) and tighten the extraction if Kiro sends something different.

## Limits

- Hooks and steering load at session start; changes mid-session need a restart.
- Symlinks need Developer Mode or administrator rights on Windows. Without them, use `.sdd/` directly; hooks and steering do not depend on links.
- Steering loads on file access, so it appears after the agent opens a spec file, not before.
- jq is not required. The hooks use only bash, grep, sed and find.

## Troubleshooting

| Symptom | Check |
| :--- | :--- |
| Hooks never run | `.kiro/hooks/sdd-*.json` exist, then restart the session. |
| A task is blocked | Run the command in the message; it is the same gate `phase.sh start` applies. |
| `.kiro/specs/<phase>` is broken | Rerun `setup.sh --profile <base>+kiro --yes`, or open `.sdd/specs/active/<phase>` directly. |
| Remove the adapter | Delete `.kiro/hooks/sdd-*`, `.kiro/steering/sdd-framework.md`, the `.kiro/specs/` links, and the kiro entry in `.sdd/adapters.json`. |

## Related

[CLI reference](cli-reference.md) · [Architecture](architecture.md) · [Governance](governance.md) · adapter files in `defaults/adapters/kiro/`
