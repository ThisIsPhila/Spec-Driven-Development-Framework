# Phase 007 — Kiro Native Integration: Implementation Summary

**Status:** Implemented and tested in sandboxes; not yet observed in a live Kiro session.  
**Evidence:** `.sdd/evidence/phase-007/kiro-adapter.md`

## What shipped
An optional `+kiro` modifier that installs Kiro steering, three hooks with their registrations, and `.kiro/specs/<phase>` links. `.sdd/` remains canonical; every rule is still enforced by `phase.sh` and `doctor.sh` without Kiro. Details are in `docs/kiro-integration.md`.

## Corrections made after the first pass
The first commits (`1c84f29` to `9e3fb32`) described the adapter as production ready. Review found, and this pass fixed:

1. Hook scripts were installed but never registered with Kiro, so nothing would have run them. Registrations now ship and are tested.
2. The steering file used `inclusion: auto` with a file pattern, which is not a valid pairing. It now uses `fileMatch`.
3. The pre-task hook hung without stdin, and its "phase started" test read a timestamp that is not a per-phase flag. The test script then hid the hang by checking syntax only. The hooks now fail open, check `active_phase`, and are tested with real stdin.
4. The post-task hook marked tasks done without evidence. It now reminds instead.
5. Symlink creation was documented for `phase.sh start` but only existed in `setup.sh`; one path produced a dangling absolute link. Creation now follows `new`, `start` and `archive`, and the dangling-link case is covered by a test.
6. Detection used undocumented environment variables and Orca signals. It now uses `.kiro/` or the `kiro` executable, and installation is opt-in.
7. The first README insertion split the "AI Agent Integration" section; the original was restored and the Kiro section added after it.
8. The earlier test script only grepped for strings. It is replaced by `tests/test_kiro_adapter.sh`.

## Open
- T007.12: verify in a live Kiro session.
- T007.11: `doctor` adapter drift check (deferred).
