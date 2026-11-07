#!/usr/bin/env bash
# REQ-007.1 - REQ-007.5 - Kiro adapter: opt-in install, hook registration,
# steering mode, symlink bridge, and hook behavior with real stdin payloads.
#
# Everything runs against the installed copies in a sandbox, so this exercises
# setup.sh -> .kiro/ -> hook scripts -> phase.sh end to end.
source "$(dirname "${BASH_SOURCE[0]}")/lib/assert.sh"
FRAMEWORK_ROOT="${FRAMEWORK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

run_setup() { # <dir> <profile>
    ( cd "$1" && bash "$FRAMEWORK_ROOT/scripts/setup.sh" --profile "$2" --yes --no-agent-files ) >"$1/setup.out" 2>&1
}

# run_hook <sandbox> <hook-name> <stdin payload> [cwd]
# Sets HOOK_RC, HOOK_STDOUT, HOOK_STDERR.
run_hook() {
    local sandbox="$1" hook="$2" payload="$3" cwd="${4:-$1}"
    printf '%s' "$payload" | ( cd "$cwd" && bash "$sandbox/.kiro/hooks/$hook.sh" ) \
        >"$sandbox/hook.out" 2>"$sandbox/hook.err"
    HOOK_RC=$?
    HOOK_STDOUT=$(cat "$sandbox/hook.out")
    HOOK_STDERR=$(cat "$sandbox/hook.err")
}

# ------------------------------------------------------------------------------
start_test "adapter is opt-in: detection alone prints a hint and installs nothing"
# ------------------------------------------------------------------------------
plain=$(make_sandbox); register_sandbox "$plain"
mkdir -p "$plain/.kiro"
run_setup "$plain" general
assert_eq "0" "$?" "setup without +kiro succeeds when .kiro/ exists"
assert_no_file "$plain/.kiro/hooks" "no hooks installed without +kiro"
assert_no_file "$plain/.kiro/steering/sdd-framework.md" "no steering installed without +kiro"
assert_no_file "$plain/.sdd/adapters.json" "no adapter record without +kiro"
assert_contains "$plain/setup.out" 'Kiro detected.*\+kiro' "hint explains how to opt in"

# ------------------------------------------------------------------------------
start_test "general+kiro installs steering, hook scripts and hook registrations"
# ------------------------------------------------------------------------------
sb=$(make_sandbox); register_sandbox "$sb"
run_setup "$sb" general+kiro
assert_eq "0" "$?" "setup general+kiro succeeds"
assert_file "$sb/.kiro/steering/sdd-framework.md" "steering installed"
assert_contains "$sb/.kiro/steering/sdd-framework.md" '^inclusion: fileMatch$' "steering uses fileMatch inclusion"
assert_contains "$sb/.kiro/steering/sdd-framework.md" '^fileMatchPattern: ".sdd/specs/active/\*\*"$' "steering matches active specs"
assert_not_contains "$sb/.kiro/steering/sdd-framework.md" '^inclusion: auto' "steering does not use auto inclusion"
for hook in sdd-pre-task sdd-post-task sdd-stop; do
    assert_file "$sb/.kiro/hooks/$hook.json" "$hook registration installed"
    assert_file "$sb/.kiro/hooks/$hook.sh" "$hook script installed"
    if [[ -x "$sb/.kiro/hooks/$hook.sh" ]]; then _pass "$hook script is executable"; else _fail "$hook script is executable"; fi
    # The registration must point at a script that exists, or Kiro runs nothing.
    cmd=$(sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"bash \([^"]*\)".*/\1/p' "$sb/.kiro/hooks/$hook.json")
    assert_file "$sb/$cmd" "$hook registration points at an installed script"
done
assert_file "$sb/.kiro/hooks/sdd-hook-lib.sh" "shared hook library installed"
assert_contains "$sb/.kiro/hooks/sdd-pre-task.json" '"trigger": "PreTaskExec"' "pre-task registered on PreTaskExec"
assert_contains "$sb/.kiro/hooks/sdd-post-task.json" '"trigger": "PostTaskExec"' "post-task registered on PostTaskExec"
assert_contains "$sb/.kiro/hooks/sdd-stop.json" '"trigger": "Stop"' "stop registered on Stop"
if command -v python3 >/dev/null 2>&1; then
    for f in "$sb"/.kiro/hooks/*.json "$sb/.sdd/adapters.json"; do
        if python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$f" 2>/dev/null; then
            _pass "valid JSON: ${f#$sb/}"
        else
            _fail "valid JSON: ${f#$sb/}"
        fi
    done
fi
assert_contains "$sb/.sdd/adapters.json" '"name": "kiro"' "adapter recorded"

# ------------------------------------------------------------------------------
start_test "re-running setup is idempotent"
# ------------------------------------------------------------------------------
run_setup "$sb" general+kiro
assert_eq "0" "$?" "second setup succeeds"
assert_eq "1" "$(grep -c '"name": "kiro"' "$sb/.sdd/adapters.json")" "still exactly one adapter record"

# ------------------------------------------------------------------------------
start_test "symlink bridge follows phase new and archive"
# ------------------------------------------------------------------------------
phase="$sb/.sdd/scripts/phase.sh"
name="phase-007-kiro-proof"
( cd "$sb" && bash "$phase" new "$name" ) >"$sb/new.out" 2>&1
assert_eq "0" "$?" "phase new succeeds"
assert_symlink_resolves "$sb/.kiro/specs/$name" "phase new links the phase into .kiro/specs"
assert_file "$sb/.kiro/specs/$name/requirements.md" "Kiro path reaches the canonical requirements.md"

# ------------------------------------------------------------------------------
start_test "pre-task hook gates on approval and start, using the printed fix"
# ------------------------------------------------------------------------------
( cd "$sb" && bash "$phase" approve requirements && bash "$phase" approve design ) >"$sb/approve.out" 2>&1
# Before tasks are approved, make a task visible to the hook the way tasks.md would.
run_hook "$sb" sdd-pre-task '{"hook_event_name":"preTaskExec","taskId":"T007.1"}'
assert_eq "2" "$HOOK_RC" "task in an unapproved phase is blocked (exit 2)"
assert_contains "$sb/hook.err" 'phase\.sh approve tasks' "block message names the exact approve command"
( cd "$sb" && bash "$phase" approve tasks ) >"$sb/approve-tasks.out" 2>&1
run_hook "$sb" sdd-pre-task '{"taskId":"T007.1"}'
assert_eq "2" "$HOOK_RC" "approved but not started is blocked"
assert_contains "$sb/hook.err" "phase\.sh start $name" "block message names the exact start command"
( cd "$sb" && bash "$phase" start "$name" ) >"$sb/start.out" 2>&1
assert_eq "0" "$?" "phase start succeeds"
run_hook "$sb" sdd-pre-task '{"taskId":"T007.1"}'
assert_eq "0" "$HOOK_RC" "approved and started phase is allowed"
assert_contains "$sb/.sdd/specs/active/$name/tasks.md" '^\s*-\s*\[/\]\s*\*\*\[T007\.1\]' "allowed task is marked doing in tasks.md"
run_hook "$sb" sdd-pre-task '{"cwd":"'"$sb"'","payload":{"task":{"label":"run T007.1 now"}}}' "$(dirname "$sb")"
assert_eq "0" "$HOOK_RC" "task ID is found by pattern in a differently shaped payload"

# ------------------------------------------------------------------------------
start_test "pre-task hook fails open when it cannot tell"
# ------------------------------------------------------------------------------
run_hook "$sb" sdd-pre-task ''
assert_eq "0" "$HOOK_RC" "empty stdin is allowed"
run_hook "$sb" sdd-pre-task 'not json at all {{{'
assert_eq "0" "$HOOK_RC" "garbage payload is allowed"
run_hook "$sb" sdd-pre-task '{"taskId":"T999.9"}'
assert_eq "0" "$HOOK_RC" "task in no active phase is allowed"
run_hook "$sb" sdd-pre-task '{"taskId":"T007.1"}' "$(mktemp -d)"
assert_eq "0" "$HOOK_RC" "directory without .sdd is allowed"

# ------------------------------------------------------------------------------
start_test "unapproved artifacts block with the right approve command"
# ------------------------------------------------------------------------------
other="phase-009-unapproved"
( cd "$sb" && bash "$phase" new "$other" ) >"$sb/new2.out" 2>&1
printf -- '- [ ] **[T009.1]** Something\n' > "$sb/.sdd/specs/active/$other/tasks.md"
run_hook "$sb" sdd-pre-task '{"taskId":"T009.1"}'
assert_eq "2" "$HOOK_RC" "task in a phase with unapproved requirements is blocked"
assert_contains "$sb/hook.err" 'phase\.sh approve requirements' "message names the approve requirements command"

# ------------------------------------------------------------------------------
start_test "post-task hook reminds but never marks a task done"
# ------------------------------------------------------------------------------
before=$(grep -F 'T007.1' "$sb/.sdd/specs/active/$name/tasks.md" | head -n 1)
run_hook "$sb" sdd-post-task '{"taskId":"T007.1","exitCode":0}'
assert_eq "0" "$HOOK_RC" "post-task exits 0"
case "$HOOK_STDOUT" in
    *"phase.sh task T007.1 done"*) _pass "reminder names the done command" ;;
    *) _fail "reminder names the done command" "stdout: $HOOK_STDOUT" ;;
esac
after=$(grep -F 'T007.1' "$sb/.sdd/specs/active/$name/tasks.md" | head -n 1)
assert_eq "$before" "$after" "task checkbox is unchanged"
run_hook "$sb" sdd-post-task '{"nothing":"here"}'
assert_eq "" "$HOOK_STDOUT" "no task ID means no output"

# ------------------------------------------------------------------------------
start_test "stop hook is silent unless work is in progress and context is stale"
# ------------------------------------------------------------------------------
run_hook "$sb" sdd-stop '{"hook_event_name":"stop"}'
assert_eq "0" "$HOOK_RC" "stop exits 0"
assert_eq "" "$HOOK_STDOUT" "fresh active-context.md produces no output"
touch -t 200001010000 "$sb/.sdd/memory/current-state/active-context.md"
run_hook "$sb" sdd-stop '{"hook_event_name":"stop"}'
case "$HOOK_STDOUT" in
    *"has not been updated"*) _pass "stale context with a task in progress produces a reminder" ;;
    *) _fail "stale context with a task in progress produces a reminder" "stdout: $HOOK_STDOUT" ;;
esac

# ------------------------------------------------------------------------------
start_test "archive removes the symlink; the canonical spec is untouched"
# ------------------------------------------------------------------------------
( cd "$sb" && bash "$phase" archive "$other" ) >"$sb/archive.out" 2>&1
assert_eq "0" "$?" "archive succeeds"
assert_no_file "$sb/.kiro/specs/$other" "symlink removed on archive"
assert_dir "$sb/.sdd/specs/archive/$other" "spec moved to the archive"

# ------------------------------------------------------------------------------
start_test "adding +kiro later links phases that already exist"
# ------------------------------------------------------------------------------
late=$(make_sandbox); register_sandbox "$late"
run_setup "$late" general
( cd "$late" && bash .sdd/scripts/phase.sh new phase-010-preexisting ) >"$late/new.out" 2>&1
assert_no_file "$late/.kiro/specs/phase-010-preexisting" "no link before the adapter is installed"
run_setup "$late" general+kiro
assert_eq "0" "$?" "setup general+kiro on an existing project succeeds"
assert_symlink_resolves "$late/.kiro/specs/phase-010-preexisting" "existing phase is linked by setup"
assert_file "$late/.kiro/specs/phase-010-preexisting/requirements.md" "linked path reaches the canonical file"

finish_test_file
