#!/usr/bin/env bash
# SDD Framework - Kiro PostTaskExec hook.
#
# Reminds the agent to record evidence before closing the task. It does not mark
# the task done: completion needs acceptance evidence, which this hook cannot
# judge.

source "$(dirname "${BASH_SOURCE[0]}")/sdd-hook-lib.sh" 2>/dev/null || exit 0

sdd_read_input
sdd_enter_workspace || exit 0

TASK_ID=$(sdd_task_id)
[[ -n "$TASK_ID" ]] || exit 0
[[ -n "$(sdd_task_phase "$TASK_ID")" ]] || exit 0

printf 'SDD: %s finished in Kiro. After its acceptance evidence is recorded, mark it done:\n' "$TASK_ID"
printf '  bash .sdd/scripts/phase.sh task %s done\n' "$TASK_ID"
exit 0
