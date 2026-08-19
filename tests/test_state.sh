#!/usr/bin/env bash
# REQ-003.3 — machine-readable state.

source "$(dirname "${BASH_SOURCE[0]}")/lib/assert.sh"

FRAMEWORK_ROOT="${FRAMEWORK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
source "$FRAMEWORK_ROOT/scripts/state.sh"

# ------------------------------------------------------------------------------
start_test "get/set round-trip and absent-key handling"
# ------------------------------------------------------------------------------

sandbox=$(make_sandbox)
register_sandbox "$sandbox"
export SDD_STATE_FILE="$sandbox/.sdd/state"

assert_eq "" "$(state_get active_phase)" "absent key returns empty, not an error"

state_set active_phase "phase-003-framework-hardening"
assert_eq "phase-003-framework-hardening" "$(state_get active_phase)" \
    "set then get round-trips"

state_set active_phase "phase-004-something-else"
assert_eq "phase-004-something-else" "$(state_get active_phase)" \
    "overwrite replaces rather than appends"

occurrences=$(grep -c '^active_phase=' "$SDD_STATE_FILE")
assert_eq "1" "$occurrences" "overwrite leaves exactly one key line"

state_set branch "feat/x"
assert_eq "phase-004-something-else" "$(state_get active_phase)" \
    "setting one key preserves others"

# ------------------------------------------------------------------------------
start_test "values containing '=' and spaces survive"
# ------------------------------------------------------------------------------

state_set note "a=b c=d spaced"
assert_eq "a=b c=d spaced" "$(state_get note)" "cut -d= -f2- preserves the full value"

# ------------------------------------------------------------------------------
start_test "malformed state file does not crash reads"
# ------------------------------------------------------------------------------

printf 'garbage line without equals\nactive_phase=phase-009-ok\n\n' > "$SDD_STATE_FILE"
assert_eq "phase-009-ok" "$(state_get active_phase)" \
    "reads a valid key alongside malformed lines"
assert_eq "" "$(state_get nonexistent)" "missing key in malformed file returns empty"

# ------------------------------------------------------------------------------
start_test "duplicate keys resolve to last assignment"
# ------------------------------------------------------------------------------

printf 'active_phase=first\nactive_phase=second\n' > "$SDD_STATE_FILE"
assert_eq "second" "$(state_get active_phase)" "last assignment wins"

# ------------------------------------------------------------------------------
start_test "unwritable target fails loudly (REQ-003.3.4)"
# ------------------------------------------------------------------------------

# The critical anti-requirement: a failed write must never report success.
readonly_dir="$sandbox/readonly"
mkdir -p "$readonly_dir"
export SDD_STATE_FILE="$readonly_dir/state"
state_set seed ok >/dev/null 2>&1
chmod 500 "$readonly_dir"

if state_set active_phase "should-fail" >/dev/null 2>&1; then
    _fail "state_set on unwritable dir returns non-zero" \
          "expected: non-zero exit" "actual:   exit 0 (silent false success)"
else
    _pass "state_set on unwritable dir returns non-zero"
fi

chmod 700 "$readonly_dir"

# ------------------------------------------------------------------------------
start_test "resolve_phase_folder maps prose titles to folder names"
# ------------------------------------------------------------------------------

# This is the F1 fix: active-context.md holds "Phase 002 - Skills Management"
# where a folder name is required.
sandbox2=$(make_sandbox)
register_sandbox "$sandbox2"
mkdir -p "$sandbox2/.sdd/specs/active/phase-002-skills-management"
mkdir -p "$sandbox2/.sdd/specs/active/phase-003-framework-hardening"

(
    cd "$sandbox2" || exit 1
    source "$FRAMEWORK_ROOT/scripts/state.sh"

    r1=$(resolve_phase_folder "phase-002-skills-management")
    r2=$(resolve_phase_folder "Phase 002 - Skills Management")
    r3=$(resolve_phase_folder "Phase 003 - Renamed Title Entirely")
    r4=$(resolve_phase_folder "Phase 099 - Does Not Exist")
    r5=$(resolve_phase_folder "")
    printf '%s\n%s\n%s\n%s\n%s\n' "$r1" "$r2" "$r3" "$r4" "$r5"
) > "$sandbox2/results.txt" 2>/dev/null

r1=$(sed -n '1p' "$sandbox2/results.txt")
r2=$(sed -n '2p' "$sandbox2/results.txt")
r3=$(sed -n '3p' "$sandbox2/results.txt")
r4=$(sed -n '4p' "$sandbox2/results.txt")
r5=$(sed -n '5p' "$sandbox2/results.txt")

assert_eq "phase-002-skills-management" "$r1" "exact folder name passes through"
assert_eq "phase-002-skills-management" "$r2" "prose title resolves to folder (the F1 fix)"
assert_eq "phase-003-framework-hardening" "$r3" "falls back to phase-number match"
assert_eq "" "$r4" "unresolvable phase returns empty rather than a bogus path"
assert_eq "" "$r5" "empty input returns empty"

# ------------------------------------------------------------------------------
start_test "D2: task state is never stored in the state file"
# ------------------------------------------------------------------------------

# Guards the one-fact-one-home rule against future drift.
export SDD_STATE_FILE="$sandbox/.sdd/state"
printf 'schema_version=1\nactive_phase=phase-003-framework-hardening\n' > "$SDD_STATE_FILE"
assert_not_contains "$SDD_STATE_FILE" '^task' "no task_* keys in state"
assert_not_contains "$SDD_STATE_FILE" '\[[ xX/]\]' "no checkbox state in state file"

unset SDD_STATE_FILE
finish_test_file
