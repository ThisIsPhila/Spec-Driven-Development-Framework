#!/usr/bin/env bash
# SDD Framework - Kiro PreTaskExec hook.
#
# Blocks (exit 2) an SDD-governed task whose phase is not approved or not
# started, with the exact command that resolves it. Allows everything else,
# including tasks that are not in an active SDD phase.

source "$(dirname "${BASH_SOURCE[0]}")/sdd-hook-lib.sh" 2>/dev/null || exit 0

sdd_read_input
sdd_enter_workspace || exit 0
[[ -f .sdd/state ]] || exit 0

TASK_ID=$(sdd_task_id)
[[ -n "$TASK_ID" ]] || exit 0
PHASE=$(sdd_task_phase "$TASK_ID")
[[ -n "$PHASE" ]] || exit 0

block() {
    printf 'SDD: task %s is blocked. %s\n     Resolve with: %s\n' "$TASK_ID" "$1" "$2" >&2
    exit 2
}

# Approvals are recorded for the selected spec only.
if [[ "$(sdd_state_get current_spec)" == "$PHASE" ]]; then
    for artifact in requirements design tasks; do
        [[ -n "$(sdd_state_get "${artifact}_approved")" ]] || \
            block "The $artifact for $PHASE is not approved." \
                  "bash .sdd/scripts/phase.sh approve $artifact"
    done
fi

# phase.sh task only operates on the started phase.
[[ "$(sdd_state_get active_phase)" == "$PHASE" ]] || \
    block "Phase $PHASE has not been started." \
          "bash .sdd/scripts/phase.sh start $PHASE"

# Best effort: mirror the start in the checklist and active context.
bash .sdd/scripts/phase.sh task "$TASK_ID" doing >/dev/null 2>&1 || true
exit 0
