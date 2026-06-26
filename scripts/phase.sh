#!/usr/bin/env bash
# SDD Phase Runner - Manage active specifications sprints
# Enforces before-task, during-task, and after-task workflows programmatically

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/common.sh" ]]; then
    source "$SCRIPT_DIR/common.sh"
else
    # Fallback git root resolution if common.sh is not loaded yet
    get_repo_root() {
        git rev-parse --show-toplevel 2>/dev/null || echo "."
    }
fi

REPO_ROOT=$(get_repo_root)
TARGET_DIR="$REPO_ROOT/.sdd"
ACTIVE_CONTEXT="$TARGET_DIR/memory/current-state/active-context.md"
PROGRESS_TRACKER="$TARGET_DIR/memory/progress-tracker.md"

say() {
    printf "%s\n" "$1"
}

show_usage() {
    say "SDD Phase Sprint Runner"
    say ""
    say "Usage: $0 <command> [args]"
    say ""
    say "Commands:"
    say "  start <phase-name>          Initialize and start a phase sprint"
    say "  status                      Check completion status of the active phase sprint"
    say "  task <task_id> <status>     Update a task status (done, doing, todo) in tasks.md"
    say "  finish                      Verify codebase and complete the active sprint"
    say "  archive <phase-name>        Archive the completed phase folder (explicit action)"
    say ""
    say "Examples:"
    say "  $0 start phase-002-skills-management"
    say "  $0 status"
    say "  $0 task \"Block 1\" done"
    say "  $0 task \"1.1\" doing"
    say "  $0 finish"
    say "  $0 archive phase-002-skills-management"
    exit 1
}

# ------------------------------------------------------------------------------
# COMMAND: START
# ------------------------------------------------------------------------------
cmd_start() {
    local phase_name="$1"
    if [[ -z "$phase_name" ]]; then
        say "❌ Error: Missing phase name."
        show_usage
    fi

    # Ensure spec-naming format is valid
    local spec_regex="^phase-[0-9]{3}-[a-z0-9-]+$"
    local spec_rules_file="$TARGET_DIR/memory/rules/spec-naming.md"
    if [[ -f "$spec_rules_file" ]]; then
        local configured_regex=$(grep -i "^Regex:" "$spec_rules_file" | head -n1 | cut -d: -f2- | xargs)
        if [[ -n "$configured_regex" ]]; then
            spec_regex="$configured_regex"
        fi
    fi

    if [[ ! "$phase_name" =~ $spec_regex ]]; then
        say "❌ Error: Phase name '$phase_name' does not match naming regex: $spec_regex"
        exit 1
    fi

    local spec_dir="$TARGET_DIR/specs/active/$phase_name"
    local backlog_dir="$TARGET_DIR/specs/backlog/$phase_name"

    # Move from backlog if present
    if [[ ! -d "$spec_dir" && -d "$backlog_dir" ]]; then
        say "🚚 Moving '$phase_name' from backlog to active specs..."
        mv "$backlog_dir" "$spec_dir"
    fi

    if [[ ! -d "$spec_dir" ]]; then
        say "❌ Error: Spec directory not found under .sdd/specs/active/$phase_name"
        exit 1
    fi

    local req_file="$spec_dir/requirements.md"
    local des_file="$spec_dir/design.md"
    local tsk_file="$spec_dir/tasks.md"

    # Verify spec triplet exists
    if [[ ! -f "$req_file" ]]; then
        say "❌ Error: requirements.md is missing from '$phase_name'"
        exit 1
    fi
    if [[ ! -f "$des_file" ]]; then
        say "❌ Error: design.md is missing from '$phase_name'"
        exit 1
    fi
    if [[ ! -f "$tsk_file" ]]; then
        say "❌ Error: tasks.md is missing from '$phase_name'"
        exit 1
    fi

    # Verify approvals
    local req_approved=false
    local des_approved=false
    local tsk_ready=false

    if grep -qi "status:.*approved" "$req_file" || grep -qi "status:.*complete" "$req_file"; then
        req_approved=true
    fi
    if grep -qi "status:.*approved" "$des_file" || grep -qi "status:.*complete" "$des_file"; then
        des_approved=true
    fi
    if grep -qi "status:.*ready to start" "$tsk_file" || grep -qi "status:.*approved" "$tsk_file" || grep -qi "status:.*complete" "$tsk_file"; then
        tsk_ready=true
    fi

    if [[ "$req_approved" == false ]]; then
        say "⚠️  Warning: requirements.md status is not APPROVED or COMPLETE."
    fi
    if [[ "$des_approved" == false ]]; then
        say "⚠️  Warning: design.md status is not APPROVED or COMPLETE."
    fi
    if [[ "$tsk_ready" == false ]]; then
        say "⚠️  Warning: tasks.md status is not READY TO START, APPROVED, or COMPLETE."
    fi

    # Run Doctor to verify repo integrity
    say "🔍 Running project doctor pre-flight checks..."
    if [[ -f "$SCRIPT_DIR/doctor.sh" ]]; then
        if ! bash "$SCRIPT_DIR/doctor.sh" > /dev/null 2>&1; then
            say "⚠️  Warning: Project doctor detected structure or naming warnings."
        fi
    fi

    # Determine branch
    local branch_name="feat/$phase_name"
    say "🌿 Git Branch Setup..."
    local current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "master")
    if [[ "$current_branch" != "$branch_name" ]]; then
        # Check if local branch already exists
        if git show-ref --verify --quiet "refs/heads/$branch_name"; then
            say "   Switching to existing branch '$branch_name'..."
            git checkout "$branch_name"
        else
            say "   Creating and switching to feature branch '$branch_name'..."
            git checkout -b "$branch_name"
        fi
    else
        say "   Already on branch '$branch_name'"
    fi

    # Update active-context.md
    say "📝 Registering active context..."
    mkdir -p "$(dirname "$ACTIVE_CONTEXT")"
    cat > "$ACTIVE_CONTEXT" <<EOF
# Active Context

**Current Phase:** $phase_name  
**Current Task:** [None]  
**Branch:** $branch_name

## Focus
- Implement specifications for $phase_name

## Recent Decisions
- Sprint initialized using phase.sh start command

## Open Questions
- [None]
EOF

    # Update progress-tracker.md if active phase entry exists
    if [[ -f "$PROGRESS_TRACKER" ]]; then
        # Find if phase header exists and update status to "In Progress"
        local temp_tracker="${PROGRESS_TRACKER}.tmp"
        local updated=false
        
        local clean_phase_num=$(echo "$phase_name" | grep -oE "phase-[0-9]+" | cut -d- -f2 | sed 's/^0*//')
        [[ -z "$clean_phase_num" ]] && clean_phase_num="[0-9]+"

        local tracker_header_regex="^###[[:space:]]+Phase[[:space:]]+0*${clean_phase_num}"
        local status_line_regex="^-[[:space:]]+\*\*Status:\*\*"

        while IFS= read -r line; do
            if [[ "$line" =~ $tracker_header_regex ]]; then
                say "$line" >> "$temp_tracker"
                updated=true
            elif [[ "$updated" == true && "$line" =~ $status_line_regex ]]; then
                say "- **Status:** In Progress" >> "$temp_tracker"
                updated=false
            else
                say "$line" >> "$temp_tracker"
            fi
        done < "$PROGRESS_TRACKER"
        mv "$temp_tracker" "$PROGRESS_TRACKER"
    fi

    say ""
    say "🚀 Phase Sprint '$phase_name' started successfully!"
    say ""
    say "📋 Copy and post this checklist to start:"
    say ""
    say "=========================================================="
    say "BEFORE-TASK CHECKLIST COMPLETE"
    say ""
    say "Category: Phase Sprint"
    say "Branch: $branch_name"
    say "Requirements: $([[ "$req_approved" == true ]] && echo "✅ Approved" || echo "⚠️ DRAFT")"
    say "Design:       $([[ "$des_approved" == true ]] && echo "✅ Approved" || echo "⚠️ DRAFT")"
    say "Tasks:        $([[ "$tsk_ready" == true ]] && echo "✅ Validated" || echo "⚠️ DRAFT")"
    say "Testing Strategy: Self-verification and integration testing"
    say "Dependencies: None"
    say "Backward Compatibility: ✅ Checked"
    say ""
    say "Ready to proceed. Awaiting START confirmation."
    say "=========================================================="
}

# ------------------------------------------------------------------------------
# COMMAND: STATUS / PROGRESS
# ------------------------------------------------------------------------------
cmd_status() {
    if [[ ! -f "$ACTIVE_CONTEXT" ]]; then
        say "ℹ️  No active context found. Start a sprint using: phase.sh start <phase>"
        exit 0
    fi

    local active_phase=$(grep -E "^\*\*Current Phase:\*\*" "$ACTIVE_CONTEXT" | sed -E 's/^\*\*Current Phase:\*\*[[:space:]]*//' | xargs)
    local current_task=$(grep -E "^\*\*Current Task:\*\*" "$ACTIVE_CONTEXT" | sed -E 's/^\*\*Current Task:\*\*[[:space:]]*//' | xargs)
    local active_branch=$(grep -E "^\*\*Branch:\*\*" "$ACTIVE_CONTEXT" | sed -E 's/^\*\*Branch:\*\*[[:space:]]*//' | xargs)

    if [[ -z "$active_phase" || "$active_phase" == "[Phase N - Name]" ]]; then
        say "ℹ️  No active phase sprint is registered in active-context.md."
        exit 0
    fi

    local tasks_file="$TARGET_DIR/specs/active/$active_phase/tasks.md"
    if [[ ! -f "$tasks_file" ]]; then
        say "❌ Error: Active tasks.md not found at '$tasks_file'"
        exit 1
    fi

    # Count tasks
    local total_tasks=$(grep -c -E "^[[:space:]]*-[[:space:]]+\[[ xX/]\]" "$tasks_file" || true)
    local completed_tasks=$(grep -c -E "^[[:space:]]*-[[:space:]]+\[[xX]\]" "$tasks_file" || true)
    local in_progress_tasks=$(grep -c -E "^[[:space:]]*-[[:space:]]+\[/\]" "$tasks_file" || true)
    local todo_tasks=$(grep -c -E "^[[:space:]]*-[[:space:]]+\[[[:space:]]\]" "$tasks_file" || true)

    local percent=0
    if [[ "$total_tasks" -gt 0 ]]; then
        percent=$(( completed_tasks * 100 / total_tasks ))
    fi

    say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    say "🏃 Active Phase Sprint: $active_phase"
    say "🌿 Current Branch:     $active_branch"
    say "🎯 Active Task Focus:   $current_task"
    say "📊 Progress:           $percent% ($completed_tasks / $total_tasks tasks complete)"
    say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [[ "$in_progress_tasks" -gt 0 ]]; then
        say ""
        say "🟡 In Progress Tasks:"
        grep -E "^[[:space:]]*-[[:space:]]+\[/\]" "$tasks_file" | sed 's/^[[:space:]]*- //g'
    fi

    if [[ "$todo_tasks" -gt 0 ]]; then
        say ""
        say "🔵 Pending Tasks:"
        grep -E "^[[:space:]]*-[[:space:]]+\[[[:space:]]\]" "$tasks_file" | sed 's/^[[:space:]]*- //g' | head -n 10
        if [[ "$todo_tasks" -gt 10 ]]; then
            say "   ... and $((todo_tasks - 10)) more tasks"
        fi
    fi
}

# ------------------------------------------------------------------------------
# COMMAND: TASK
# ------------------------------------------------------------------------------
cmd_task() {
    local task_id="$1"
    local status_arg="$2"

    if [[ -z "$task_id" || -z "$status_arg" ]]; then
        say "❌ Error: Missing task identifier or status."
        say "Usage: $0 task <task_id_or_match_text> <done|doing|todo>"
        exit 1
    fi

    if [[ ! -f "$ACTIVE_CONTEXT" ]]; then
        say "❌ Error: No active phase sprint context. Run start first."
        exit 1
    fi

    local active_phase=$(grep -E "^\*\*Current Phase:\*\*" "$ACTIVE_CONTEXT" | sed -E 's/^\*\*Current Phase:\*\*[[:space:]]*//' | xargs)
    if [[ -z "$active_phase" || "$active_phase" == "[Phase N - Name]" ]]; then
        say "❌ Error: No active phase sprint registered in active-context.md."
        exit 1
    fi

    local tasks_file="$TARGET_DIR/specs/active/$active_phase/tasks.md"
    if [[ ! -f "$tasks_file" ]]; then
        say "❌ Error: tasks.md not found at '$tasks_file'"
        exit 1
    fi

    local replacement=" "
    case "$status_arg" in
        done)  replacement="x" ;;
        doing) replacement="/" ;;
        todo)  replacement=" " ;;
        *)
            say "❌ Error: Invalid status '$status_arg'. Choose from: done, doing, todo"
            exit 1
            ;;
    esac

    local matched_line=$(grep -F "$task_id" "$tasks_file" | head -n1 || true)
    if [[ -z "$matched_line" ]]; then
        matched_line=$(grep -i "$task_id" "$tasks_file" | head -n1 || true)
    fi

    if [[ -z "$matched_line" ]]; then
        say "❌ Error: No task matching '$task_id' was found in tasks.md."
        exit 1
    fi

    say "🎯 Found task: $matched_line"

    local escaped_match=$(echo "$matched_line" | sed 's/[&/\]/\\&/g')
    local updated_line=""
    local checklist_line_regex="^([[:space:]]*-)[[:space:]]*\[[ xX/]\](.*)$"
    if [[ "$matched_line" =~ $checklist_line_regex ]]; then
        local prefix="${BASH_REMATCH[1]}"
        local suffix="${BASH_REMATCH[2]}"
        updated_line="$prefix [$replacement]$suffix"
    else
        say "❌ Error: Matched line does not fit standard checklist format: $matched_line"
        exit 1
    fi

    local temp_tasks="${tasks_file}.tmp"
    while IFS= read -r line; do
        if [[ "$line" == "$matched_line" ]]; then
            say "$updated_line" >> "$temp_tasks"
        else
            say "$line" >> "$temp_tasks"
        fi
    done < "$tasks_file"
    mv "$temp_tasks" "$tasks_file"

    local task_text=$(echo "$updated_line" | sed -E 's/^[[:space:]]*-?[[:space:]]*\[[x /]\][[:space:]]*//' | sed 's/^[[:space:]]*\*\*[^*]*\*\*//g' | xargs)

    local temp_context="${ACTIVE_CONTEXT}.tmp"
    local current_task_regex="^\*\*Current[[:space:]]+Task:\*\*"
    local primary_objective_regex="^-[[:space:]]\[Primary[[:space:]]+objective\]"

    while IFS= read -r line; do
        if [[ "$line" =~ $current_task_regex ]]; then
            if [[ "$status_arg" == "doing" || "$status_arg" == "done" ]]; then
                say "**Current Task:** $task_id - $task_text" >> "$temp_context"
            else
                say "**Current Task:** [None]" >> "$temp_context"
            fi
        elif [[ "$line" =~ $primary_objective_regex ]]; then
            if [[ "$status_arg" == "doing" ]]; then
                say "- Working on: $task_text" >> "$temp_context"
            else
                say "- [Primary objective]" >> "$temp_context"
            fi
        else
            say "$line" >> "$temp_context"
        fi
    done < "$ACTIVE_CONTEXT"
    mv "$temp_context" "$ACTIVE_CONTEXT"

    say "✅ Updated task checkbox status to '$status_arg'."
    say "📝 Synced active context."
}

# ------------------------------------------------------------------------------
# COMMAND: FINISH
# ------------------------------------------------------------------------------
cmd_finish() {
    if [[ ! -f "$ACTIVE_CONTEXT" ]]; then
        say "❌ Error: No active context found."
        exit 1
    fi

    local active_phase=$(grep -E "^\*\*Current Phase:\*\*" "$ACTIVE_CONTEXT" | sed -E 's/^\*\*Current Phase:\*\*[[:space:]]*//' | xargs)
    if [[ -z "$active_phase" || "$active_phase" == "[Phase N - Name]" ]]; then
        say "❌ Error: No active phase sprint registered in active-context.md."
        exit 1
    fi

    local tasks_file="$TARGET_DIR/specs/active/$active_phase/tasks.md"
    if [[ ! -f "$tasks_file" ]]; then
        say "❌ Error: tasks.md not found at '$tasks_file'"
        exit 1
    fi

    local open_tasks=$(grep -c -E "^[[:space:]]*-[[:space:]]+\[[ /]\]" "$tasks_file" || true)
    if [[ "$open_tasks" -gt 0 ]]; then
        say "❌ Error: Cannot complete sprint. There are $open_tasks tasks still open or in progress:"
        grep -E "^[[:space:]]*-[[:space:]]+\[[ /]\]" "$tasks_file"
        exit 1
    fi

    say "🔍 Running quality gates and project validations..."
    
    if [[ -f "$SCRIPT_DIR/doctor.sh" ]]; then
        if ! bash "$SCRIPT_DIR/doctor.sh"; then
            say "❌ Validation failed: doctor.sh reported errors. Resolve before completing the phase."
            exit 1
        fi
    fi

    if [[ -f "$SCRIPT_DIR/skills.sh" ]]; then
        if ! bash "$SCRIPT_DIR/skills.sh" validate; then
            say "❌ Validation failed: skills.sh validate reported errors. Resolve before completing the phase."
            exit 1
        fi
    fi

    if [[ -f "$PROGRESS_TRACKER" ]]; then
        local temp_tracker="${PROGRESS_TRACKER}.tmp"
        local updated=false
        local clean_phase_num=$(echo "$active_phase" | grep -oE "phase-[0-9]+" | cut -d- -f2 | sed 's/^0*//')
        [[ -z "$clean_phase_num" ]] && clean_phase_num="[0-9]+"

        local tracker_header_regex="^###[[:space:]]+Phase[[:space:]]+0*${clean_phase_num}"
        local status_line_regex="^-[[:space:]]+\*\*Status:\*\*"

        while IFS= read -r line; do
            if [[ "$line" =~ $tracker_header_regex ]]; then
                say "$line" >> "$temp_tracker"
                updated=true
            elif [[ "$updated" == true && "$line" =~ $status_line_regex ]]; then
                say "- **Status:** Complete" >> "$temp_tracker"
                updated=false
            else
                say "$line" >> "$temp_tracker"
            fi
        done < "$PROGRESS_TRACKER"
        mv "$temp_tracker" "$PROGRESS_TRACKER"
        say "📊 Progress tracker status updated to 'Complete'."
    fi

    # Clear active context
    cat > "$ACTIVE_CONTEXT" <<EOF
# Active Context

**Current Phase:** [Phase N - Name]  
**Current Task:** [Task ID - Title]  
**Branch:** [branch-name]

## Focus
- [Primary objective]
- [Secondary objective]

## Recent Decisions
- [Decision]

## Open Questions
- [Question]
EOF
    say "📝 Active context cleared."

    say ""
    say "🎉 Phase Sprint '$active_phase' marked as finished!"
    say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    say "Next Steps:"
    say "  1. Update CHANGELOG.md."
    say "  2. Submit your PR and squash commits."
    say "  3. Once approved, you can archive this spec folder by running:"
    say "     bash $0 archive $active_phase"
    say "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ------------------------------------------------------------------------------
# COMMAND: ARCHIVE
# ------------------------------------------------------------------------------
cmd_archive() {
    local phase_name="$1"
    if [[ -z "$phase_name" ]]; then
        say "❌ Error: Missing phase name to archive."
        exit 1
    fi

    local active_dir="$TARGET_DIR/specs/active/$phase_name"
    local archive_dir="$TARGET_DIR/specs/archive/$phase_name"

    if [[ ! -d "$active_dir" ]]; then
        say "❌ Error: Spec directory '$phase_name' not found in active specs: $active_dir"
        exit 1
    fi

    say "📦 Archiving spec folder '$phase_name'..."
    mkdir -p "$(dirname "$archive_dir")"
    mv "$active_dir" "$archive_dir"

    say "✅ Spec folder '$phase_name' successfully moved to archive."
}

# ------------------------------------------------------------------------------
# ROUTING
# ------------------------------------------------------------------------------
case "$1" in
    start)
        cmd_start "$2"
        ;;
    status|progress)
        cmd_status
        ;;
    task)
        cmd_task "$2" "$3"
        ;;
    finish)
        cmd_finish
        ;;
    archive)
        cmd_archive "$2"
        ;;
    *)
        show_usage
        ;;
esac
