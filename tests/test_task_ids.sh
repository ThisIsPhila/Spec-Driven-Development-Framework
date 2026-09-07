#!/usr/bin/env bash
# REQ-003.4 — stable, unambiguous task identity.

source "$(dirname "${BASH_SOURCE[0]}")/lib/assert.sh"

FRAMEWORK_ROOT="${FRAMEWORK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
sandbox=$(make_sandbox)
register_sandbox "$sandbox"

(
    cd "$sandbox" || exit 1
    bash "$FRAMEWORK_ROOT/scripts/setup.sh" --profile general --yes --no-agent-files
) >/dev/null 2>&1

mkdir -p "$sandbox/.sdd/specs/active/phase-008-task-identity"
cat > "$sandbox/.sdd/specs/active/phase-008-task-identity/tasks.md" <<'TASKS'
# Tasks

- [ ] **[T008.1]** First unique task
- [ ] **[T008.2]** Similar wording
- [ ] **[T008.3]** Similar wording
TASKS
cat > "$sandbox/.sdd/state" <<'STATE'
schema_version=1
active_phase=phase-008-task-identity
branch=feat/phase-008-task-identity
STATE

phase="$sandbox/.sdd/scripts/phase.sh"
tasks="$sandbox/.sdd/specs/active/phase-008-task-identity/tasks.md"

# ------------------------------------------------------------------------------
start_test "stable ID updates exactly one task"
# ------------------------------------------------------------------------------

( cd "$sandbox" && bash "$phase" task T008.1 done ) >/dev/null 2>&1
assert_eq "0" "$?" "stable-ID update succeeds"
assert_contains "$tasks" '^- \[x\].*\[T008\.1\]' "T008.1 changed"
assert_contains "$tasks" '^- \[ \].*\[T008\.2\]' "T008.2 unchanged"

# ------------------------------------------------------------------------------
start_test "ambiguous legacy text fails safely and changes nothing"
# ------------------------------------------------------------------------------

before=$(shasum "$tasks" | awk '{print $1}')
assert_exit 1 "ambiguous free-text match is rejected" \
    bash -c "cd '$sandbox' && bash '$phase' task 'Similar wording' done"
after=$(shasum "$tasks" | awk '{print $1}')
assert_eq "$before" "$after" "ambiguous match leaves tasks.md byte-for-byte unchanged"

# ------------------------------------------------------------------------------
start_test "zero matches fail safely"
# ------------------------------------------------------------------------------

assert_exit 1 "unknown stable ID is rejected" \
    bash -c "cd '$sandbox' && bash '$phase' task T008.99 done"

finish_test_file
