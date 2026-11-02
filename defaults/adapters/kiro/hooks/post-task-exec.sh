#!/usr/bin/env bash
# Kiro PostTaskExec Hook — SDD Framework Adapter
# Records task completion with execution context

set -euo pipefail

# Read hook input
HOOK_INPUT=$(cat)
TASK_ID=$(echo "$HOOK_INPUT" | jq -r '.taskId // empty' 2>/dev/null || echo "")
EXIT_CODE=$(echo "$HOOK_INPUT" | jq -r '.exitCode // 0' 2>/dev/null || echo "0")

# Graceful degradation
[[ ! -d ".sdd" ]] && exit 0
[[ -z "$TASK_ID" ]] && exit 0

# Only record successful executions
[[ "$EXIT_CODE" != "0" ]] && exit 0

# Find active phase
ACTIVE_SPECS=".sdd/specs/active"
PHASE_DIR=""

for phase in "$ACTIVE_SPECS"/*; do
  [[ -f "$phase/tasks.md" ]] || continue
  if grep -q "\[$TASK_ID\]" "$phase/tasks.md" 2>/dev/null; then
    PHASE_DIR="$phase"
    break
  fi
done

[[ -z "$PHASE_DIR" ]] && exit 0

# Mark task complete (best effort)
bash .sdd/scripts/phase.sh task "$TASK_ID" done 2>/dev/null || true

exit 0
