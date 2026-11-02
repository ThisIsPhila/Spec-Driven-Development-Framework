#!/usr/bin/env bash
# Kiro PreTaskExec Hook — SDD Framework Adapter
# Validates task approval before execution begins

set -euo pipefail

# Read hook input (Kiro provides context via stdin JSON)
HOOK_INPUT=$(cat)
TASK_ID=$(echo "$HOOK_INPUT" | jq -r '.taskId // empty' 2>/dev/null || echo "")

# Graceful degradation: if .sdd/ doesn't exist, allow execution
[[ ! -d ".sdd" ]] && exit 0

# Graceful degradation: if no task ID provided, allow execution  
[[ -z "$TASK_ID" ]] && exit 0

# Find active phase containing this task
ACTIVE_SPECS=".sdd/specs/active"
PHASE_DIR=""

for phase in "$ACTIVE_SPECS"/*; do
  [[ -f "$phase/tasks.md" ]] || continue
  if grep -q "\[$TASK_ID\]" "$phase/tasks.md" 2>/dev/null; then
    PHASE_DIR="$phase"
    break
  fi
done

# If task not found in active phases, allow (may be non-SDD work)
[[ -z "$PHASE_DIR" ]] && exit 0

PHASE_NAME=$(basename "$PHASE_DIR")

# Check if state file exists for this phase
if [[ -f ".sdd/state" ]]; then
  # Read state file (key=value format)
  CURRENT_SPEC=$(grep "^current_spec=" ".sdd/state" 2>/dev/null | cut -d= -f2 || echo "")
  
  # Only validate if this is the active phase
  if [[ "$CURRENT_SPEC" == "$PHASE_NAME" ]]; then
    # Check typed approvals
    REQ_APPROVED=$(grep "^requirements_approved=" ".sdd/state" 2>/dev/null | cut -d= -f2 || echo "")
    DESIGN_APPROVED=$(grep "^design_approved=" ".sdd/state" 2>/dev/null | cut -d= -f2 || echo "")
    TASKS_APPROVED=$(grep "^tasks_approved=" ".sdd/state" 2>/dev/null | cut -d= -f2 || echo "")
    STARTED=$(grep "^started=" ".sdd/state" 2>/dev/null | cut -d= -f2 || echo "")
    
    # Block if requirements not approved
    if [[ -z "$REQ_APPROVED" ]]; then
      echo "❌ Task $TASK_ID blocked: Requirements not approved for $PHASE_NAME" >&2
      echo "   Run: bash .sdd/scripts/phase.sh approve requirements" >&2
      exit 2
    fi
    
    # Block if design not approved
    if [[ -z "$DESIGN_APPROVED" ]]; then
      echo "❌ Task $TASK_ID blocked: Design not approved for $PHASE_NAME" >&2
      echo "   Run: bash .sdd/scripts/phase.sh approve design" >&2
      exit 2
    fi
    
    # Block if tasks not approved  
    if [[ -z "$TASKS_APPROVED" ]]; then
      echo "❌ Task $TASK_ID blocked: Tasks not approved for $PHASE_NAME" >&2
      echo "   Run: bash .sdd/scripts/phase.sh approve tasks" >&2
      exit 2
    fi
    
    # Block if phase not started
    if [[ -z "$STARTED" ]]; then
      echo "❌ Task $TASK_ID blocked: Phase $PHASE_NAME not started" >&2
      echo "   Run: bash .sdd/scripts/phase.sh start $PHASE_NAME" >&2
      exit 2
    fi
  fi
fi

# Mark task as in-progress (best effort, don't fail if this doesn't work)
bash .sdd/scripts/phase.sh task "$TASK_ID" doing 2>/dev/null || true

# Allow execution
exit 0
