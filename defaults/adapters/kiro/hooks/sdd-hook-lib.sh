#!/usr/bin/env bash
# SDD Framework - shared helpers for the Kiro adapter hooks. Sourced, not run.
#
# Design rule: these hooks add an earlier, native stop to rules that
# .sdd/scripts/phase.sh already enforces. Anything they cannot determine fails
# open (exit 0). Only a deliberate, explained gate exits 2.

# Kiro delivers the event as JSON on stdin. Never block waiting for input when
# stdin is a terminal.
sdd_read_input() {
    SDD_INPUT=""
    if [[ ! -t 0 ]]; then
        SDD_INPUT=$(cat 2>/dev/null || true)
    fi
}

# Move to the workspace the event came from (when Kiro reports one) and confirm
# this is an SDD project. Returns non-zero when it is not.
sdd_enter_workspace() {
    local cwd
    cwd=$(printf '%s' "$SDD_INPUT" \
        | sed -n 's/.*"cwd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)
    if [[ -n "$cwd" && -d "$cwd" ]]; then
        cd "$cwd" 2>/dev/null || true
    fi
    [[ -d .sdd ]]
}

# Last assignment wins, matching scripts/state.sh.
sdd_state_get() {
    grep -E "^$1=" .sdd/state 2>/dev/null | tail -n 1 | cut -d= -f2-
}

# The task is identified by the framework's stable ID form (T<phase>.<n>) found
# anywhere in the payload, so the hooks do not depend on a payload field name.
sdd_task_id() {
    printf '%s' "$SDD_INPUT" | grep -oE 'T[0-9]{3}\.[0-9]+' | head -n 1 || true
}

# Print the active phase folder whose tasks.md declares the given task ID.
sdd_task_phase() {
    local tasks
    for tasks in .sdd/specs/active/*/tasks.md; do
        [[ -f "$tasks" ]] || continue
        if grep -qF "[$1]" "$tasks" 2>/dev/null; then
            basename "$(dirname "$tasks")"
            return 0
        fi
    done
    return 0
}
