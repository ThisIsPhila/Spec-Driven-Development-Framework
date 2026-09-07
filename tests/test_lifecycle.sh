#!/usr/bin/env bash
# REQ-003.1.2 / REQ-003.5 — full spec and sprint lifecycle.

source "$(dirname "${BASH_SOURCE[0]}")/lib/assert.sh"

FRAMEWORK_ROOT="${FRAMEWORK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

sandbox=$(make_sandbox)
register_sandbox "$sandbox"

(
    cd "$sandbox" || exit 1
    bash "$FRAMEWORK_ROOT/scripts/setup.sh" --profile general --yes --no-agent-files
) >/dev/null 2>&1

phase="$sandbox/.sdd/scripts/phase.sh"
spec="$sandbox/.sdd/specs/active/phase-007-lifecycle-proof"

# ------------------------------------------------------------------------------
start_test "new scaffolds requirements only (mandatory artifact order)"
# ------------------------------------------------------------------------------

( cd "$sandbox" && bash "$phase" new phase-007-lifecycle-proof ) >"$sandbox/new.out" 2>&1
assert_eq "0" "$?" "phase.sh new succeeds"
assert_file "$spec/requirements.md" "requirements.md created"
assert_no_file "$spec/design.md" "design.md not created before requirements approval"
assert_no_file "$spec/tasks.md" "tasks.md not created before design approval"
assert_contains "$spec/requirements.md" '^\*\*Status:\*\*.*DRAFT' "requirements starts DRAFT"

# ------------------------------------------------------------------------------
start_test "approval order is enforced and each approval creates the next artifact"
# ------------------------------------------------------------------------------

assert_exit 1 "cannot approve design before it exists" \
    bash -c "cd '$sandbox' && bash '$phase' approve design"

( cd "$sandbox" && bash "$phase" approve requirements ) >"$sandbox/approve-req.out" 2>&1
assert_eq "0" "$?" "requirements approval succeeds"
assert_contains "$spec/requirements.md" '^\*\*Status:\*\*.*APPROVED' "requirements status updated"
assert_file "$spec/design.md" "design created after requirements approval"
assert_no_file "$spec/tasks.md" "tasks still absent before design approval"

( cd "$sandbox" && bash "$phase" approve design ) >"$sandbox/approve-design.out" 2>&1
assert_eq "0" "$?" "design approval succeeds"
assert_contains "$spec/design.md" '^\*\*Status:\*\*.*APPROVED' "design status updated"
assert_file "$spec/tasks.md" "tasks created after design approval"
assert_contains "$spec/tasks.md" '^\*\*Status:\*\*.*DRAFT' "tasks starts DRAFT"
assert_contains "$spec/tasks.md" '\*\*\[T007\.1\]\*\*' "generated task has stable ID T007.1"

# ------------------------------------------------------------------------------
start_test "start is a hard gate until tasks are approved"
# ------------------------------------------------------------------------------

assert_exit 1 "start refuses a DRAFT tasks artifact" \
    bash -c "cd '$sandbox' && bash '$phase' start phase-007-lifecycle-proof"

( cd "$sandbox" && bash "$phase" approve tasks ) >"$sandbox/approve-tasks.out" 2>&1
assert_eq "0" "$?" "tasks approval succeeds"
assert_contains "$spec/tasks.md" '^\*\*Status:\*\*.*READY TO START' "tasks status updated"

# ------------------------------------------------------------------------------
start_test "approved sprint starts, tracks exact task IDs, and finishes"
# ------------------------------------------------------------------------------

( cd "$sandbox" && bash "$phase" start phase-007-lifecycle-proof ) >"$sandbox/start.out" 2>&1
assert_eq "0" "$?" "approved sprint starts"
assert_eq "feat/phase-007-lifecycle-proof" "$(git -C "$sandbox" branch --show-current)" \
    "start creates the expected feature branch"
assert_eq "phase-007-lifecycle-proof" "$(grep '^active_phase=' "$sandbox/.sdd/state" | cut -d= -f2-)" \
    "active phase recorded in machine state"
assert_contains "$sandbox/start.out" 'Progress tracker NOT updated' \
    "missing tracker anchor is reported honestly instead of silently no-oping"

( cd "$sandbox" && bash "$phase" task T007.1 doing ) >/dev/null 2>&1
assert_contains "$spec/tasks.md" '^- \[/\].*\[T007\.1\]' "T007.1 marked doing"

( cd "$sandbox" && bash "$phase" task T007.1 done ) >/dev/null 2>&1
( cd "$sandbox" && bash "$phase" task T007.2 done ) >/dev/null 2>&1
assert_contains "$spec/tasks.md" '^- \[x\].*\[T007\.1\]' "T007.1 marked done"
assert_contains "$spec/tasks.md" '^- \[x\].*\[T007\.2\]' "T007.2 marked done"

( cd "$sandbox" && bash "$phase" finish ) >"$sandbox/finish.out" 2>&1
assert_eq "0" "$?" "finish passes after every task is complete"
assert_eq "" "$(grep '^active_phase=' "$sandbox/.sdd/state" | cut -d= -f2-)" \
    "finish clears active phase state"
assert_contains "$sandbox/finish.out" 'Progress tracker NOT updated' \
    "finish also reports absent tracker anchor honestly"

finish_test_file
