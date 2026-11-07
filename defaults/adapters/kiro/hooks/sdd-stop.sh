#!/usr/bin/env bash
# SDD Framework - Kiro Stop hook.
#
# Stop fires at the end of every agent turn, so this stays silent unless a task
# is in progress and active-context.md has not been touched for 30 minutes.

source "$(dirname "${BASH_SOURCE[0]}")/sdd-hook-lib.sh" 2>/dev/null || exit 0

sdd_read_input
sdd_enter_workspace || exit 0
[[ -f .sdd/state ]] || exit 0

PHASE=$(sdd_state_get active_phase)
[[ -n "$PHASE" ]] || exit 0
TASKS=".sdd/specs/active/$PHASE/tasks.md"
[[ -f "$TASKS" ]] || exit 0

DOING=$(grep -E '^[[:space:]]*-[[:space:]]*\[/\]' "$TASKS" | head -n 1)
[[ -n "$DOING" ]] || exit 0

CONTEXT=".sdd/memory/current-state/active-context.md"
[[ -f "$CONTEXT" ]] || exit 0
if [[ -n "$(find "$CONTEXT" -mmin -30 2>/dev/null)" ]]; then
    exit 0
fi

printf 'SDD: a task is in progress in %s and %s has not been updated recently.\n' "$PHASE" "$CONTEXT"
printf 'Record decisions, evidence and the next step there before ending the session.\n'
exit 0
