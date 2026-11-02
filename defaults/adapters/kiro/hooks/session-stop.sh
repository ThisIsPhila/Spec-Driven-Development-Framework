#!/usr/bin/env bash
# Kiro Stop Hook — SDD Framework Adapter
# Offers session summary recording

set -euo pipefail

# Graceful degradation
[[ ! -d ".sdd" ]] && exit 0

CONTEXT_FILE=".sdd/memory/current-state/active-context.md"
[[ ! -f "$CONTEXT_FILE" ]] && exit 0

# Read current context to determine active work
CURRENT_PHASE=$(grep "^\*\*Current Phase:\*\*" "$CONTEXT_FILE" 2>/dev/null | sed 's/^\*\*Current Phase:\*\* *//' || echo "")
CURRENT_TASK=$(grep "^\*\*Current Task:\*\*" "$CONTEXT_FILE" 2>/dev/null | sed 's/^\*\*Current Task:\*\* *//' || echo "")

# If active work exists, suggest summary update
if [[ -n "$CURRENT_PHASE" ]] || [[ -n "$CURRENT_TASK" ]]; then
  cat <<EOF

📝 SDD Framework Session Summary

Active work detected:
  Phase: ${CURRENT_PHASE:-None}
  Task: ${CURRENT_TASK:-None}

Consider updating active context:
  File: .sdd/memory/current-state/active-context.md

Record session outcomes, decisions, and next steps.

EOF
fi

exit 0
