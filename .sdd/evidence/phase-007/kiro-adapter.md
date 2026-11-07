# T007.1–T007.10 — Verification Evidence

**Revision/tree:** git tree `906f98e28e707d14081f09f00dfb13afe36129d2` (staged content excluding `.sdd/evidence/` and `.sdd/reports/`), on base commit `9e3fb32`  
**Environment:** local, macOS (darwin), bash 3.2.57(1)-release, node v22.22.3, sandbox git repositories in the system temp directory  
**Observed:** 2026-11-07T08:57:47Z  
**Authority:** Owner instruction of 2026-11-07 ("Yes, go ahead") to fix, test, document and prepare a release; no tag and no push.

## Procedure and result

| Check | Command/procedure | Expected | Observed | Result |
|---|---|---|---|---|
| Manifest | `python3 -c 'json.load(open("defaults/adapters/kiro/adapter.json"))'`; every `source` file exists; no `ORCA` or undocumented variable | Valid JSON, files present | Valid; present; none found by grep of `scripts/`, `defaults/adapters/`, `docs/` | Pass |
| Install | `tests/test_kiro_adapter.sh`, tests "general+kiro installs…" and "re-running setup is idempotent" | Steering, 7 hook files, record; one record after two runs | test_kiro_adapter.sh: 64 run, 0 failed (whole file) | Pass |
| Opt-in | Same file, test "adapter is opt-in…" with a `.kiro/` directory present | No hooks, steering or record; hint printed | As expected | Pass |
| Steering | Same file | `inclusion: fileMatch`, pattern `.sdd/specs/active/**`, not `auto` | As expected | Pass |
| Registrations | Same file | Trigger names correct; each command resolves to an installed executable script | As expected | Pass |
| PreTaskExec | Same file, installed hook driven with stdin payloads | Exit 2 for unapproved requirements, for unapproved tasks, and for approved-but-unstarted, each with the exact command; exit 0 and `[/]` for a started phase; exit 0 for empty stdin, garbage, unknown task, no `.sdd` | As expected | Pass |
| PostTaskExec and Stop | Same file | Reminder names the done command, checkbox byte-identical; no ID gives no output; Stop silent when fresh, reminds when stale | As expected | Pass |
| Symlinks | Same file | Link created by `phase new`, resolves to canonical file, removed by `archive`; existing phases linked by later `+kiro` setup | As expected after fixing an absolute-path link target found by this test | Pass |
| Regression | `bash tests/run.sh` | All test files pass, including the 56-composition install matrix | 10 files, 0 failed, 899 assertions ok, 0 FAIL | Pass |
| Governance | `bash scripts/doctor.sh` | No FAIL, Result OK | Result: OK, exit 0 | Pass |
| Skills | `bash scripts/skills.sh validate` | Valid | Validation passed | Pass |
| Documentation | Manual review against code | Commands and paths exist; unverified behavior labeled | `docs/kiro-integration.md` has a "Verified and not verified" section | Pass |
| Release checks | Version fields | `.sdd/framework.json`, `defaults/framework.json`, `visual/package.json`, `visual/package-lock.json` (lines 3 and 9), `CHANGELOG.md` agree on 2.3.0 | Agree | Pass |
| Workspace install | Adapter install functions from `setup.sh` run in this repository (specs and state backed up first); installed hooks driven with stdin against the real phases | Registrations resolve; links read the canonical files; T007.12 blocked with the start command; non-SDD and unknown tasks allowed; no tracked file changed | As expected, after one defect: the pre-task hook set an already-completed task (T005.1) back to doing and overwrote the Current Task line. Both files were restored from the backup, the hook now touches only unstarted tasks, a regression test covers it (68 checks), and the scenario was re-run clean | Pass (after fix) |
| Visual tests | `npm --prefix visual test` | n/a | Not run: `visual/node_modules` is not installed. The package changed only in its version string and no source reads it. | Blocked |

## Limitations

- Nothing here observes Kiro itself. Whether Kiro loads the steering on file access, runs the registered hooks, and sends a payload containing the stable task ID is unproven (T007.12). The hook extraction rule is a deliberate response to the missing payload schema, not a confirmed match.
- Hook behavior was tested with payloads written by the test author. The only payload fields in the cited Kiro documentation are for tool events, not task events.
- The 56-composition matrix does not include `kiro`; adapter installs were tested on `general+kiro` and `general` only.
- Windows was not tested.
- The workspace run exercised the hooks by hand with payloads written by the tester; it did not run them from inside Kiro.
- The earlier `tests/test-kiro-integration.sh` and the report `.sdd/reports/phase-007/final-summary.md` claimed production readiness on evidence that did not support it and are withdrawn.
