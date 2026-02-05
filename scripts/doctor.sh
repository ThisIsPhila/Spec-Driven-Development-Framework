#!/usr/bin/env bash
# SDD Doctor - validate .sdd structure and key files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

REPO_ROOT=$(get_repo_root)
TARGET_DIR="$REPO_ROOT/.sdd"
ALT_DIR="$REPO_ROOT/.SDD"

ERRORS=0
WARNINGS=0

say() {
    printf "%s\n" "$1"
}

check_file() {
    local file="$1"
    local label="$2"
    if [[ -f "$file" ]]; then
        say "OK   $label"
        return 0
    else
        say "MISS $label"
        ERRORS=$((ERRORS+1))
        return 1
    fi
}

check_dir() {
    local dir="$1"
    local label="$2"
    if [[ -d "$dir" ]]; then
        say "OK   $label"
        return 0
    else
        say "MISS $label"
        ERRORS=$((ERRORS+1))
        return 1
    fi
}

say "SDD Doctor"

if [[ -d "$ALT_DIR" && ! -d "$TARGET_DIR" ]]; then
    say "WARN .SDD exists but .sdd is missing (case-sensitive issue)."
    WARNINGS=$((WARNINGS+1))
fi

if [[ ! -d "$TARGET_DIR" ]]; then
    say "MISS .sdd directory not found in repo root."
    exit 1
fi

# Framework repo may include a partial .sdd; allow best-effort checks
IS_FRAMEWORK=false
if [[ -d "$REPO_ROOT/defaults" && -d "$REPO_ROOT/scripts" ]]; then
    IS_FRAMEWORK=true
fi

say ""
say "Core Structure"
check_dir "$TARGET_DIR/specs" ".sdd/specs"
if [[ "$IS_FRAMEWORK" == false ]]; then
    check_dir "$TARGET_DIR/specs/active" ".sdd/specs/active"
    check_dir "$TARGET_DIR/specs/archive" ".sdd/specs/archive"
    check_dir "$TARGET_DIR/specs/backlog" ".sdd/specs/backlog"
else
    if [[ ! -d "$TARGET_DIR/specs/active" ]]; then
        say "WARN .sdd/specs/active missing (framework repo)"
        WARNINGS=$((WARNINGS+1))
    fi
    if [[ ! -d "$TARGET_DIR/specs/archive" ]]; then
        say "WARN .sdd/specs/archive missing (framework repo)"
        WARNINGS=$((WARNINGS+1))
    fi
    if [[ ! -d "$TARGET_DIR/specs/backlog" ]]; then
        say "WARN .sdd/specs/backlog missing (framework repo)"
        WARNINGS=$((WARNINGS+1))
    fi
fi
check_dir "$TARGET_DIR/templates" ".sdd/templates"
check_dir "$TARGET_DIR/memory" ".sdd/memory"
check_dir "$TARGET_DIR/memory/rules" ".sdd/memory/rules"
if [[ "$IS_FRAMEWORK" == false ]]; then
    check_dir "$TARGET_DIR/memory/current-state" ".sdd/memory/current-state"
    check_dir "$TARGET_DIR/memory/completed-tasks" ".sdd/memory/completed-tasks"
else
    if [[ ! -d "$TARGET_DIR/memory/current-state" ]]; then
        say "WARN .sdd/memory/current-state missing (framework repo)"
        WARNINGS=$((WARNINGS+1))
    fi
    if [[ ! -d "$TARGET_DIR/memory/completed-tasks" ]]; then
        say "WARN .sdd/memory/completed-tasks missing (framework repo)"
        WARNINGS=$((WARNINGS+1))
    fi
fi

say ""
say "Memory Files"
check_file "$TARGET_DIR/memory/project-overview.md" "memory/project-overview.md"
check_file "$TARGET_DIR/memory/progress-tracker.md" "memory/progress-tracker.md"
check_file "$TARGET_DIR/memory/technical-decisions.md" "memory/technical-decisions.md"
if [[ "$IS_FRAMEWORK" == false ]]; then
    check_file "$TARGET_DIR/memory/current-state/active-context.md" "memory/current-state/active-context.md"
    check_file "$TARGET_DIR/memory/current-state/progress.md" "memory/current-state/progress.md"
else
    if [[ ! -f "$TARGET_DIR/memory/current-state/active-context.md" ]]; then
        say "WARN memory/current-state/active-context.md missing (framework repo)"
        WARNINGS=$((WARNINGS+1))
    fi
    if [[ ! -f "$TARGET_DIR/memory/current-state/progress.md" ]]; then
        say "WARN memory/current-state/progress.md missing (framework repo)"
        WARNINGS=$((WARNINGS+1))
    fi
fi
check_file "$TARGET_DIR/memory/rules/before-task.md" "memory/rules/before-task.md"
check_file "$TARGET_DIR/memory/rules/during-task.md" "memory/rules/during-task.md"
check_file "$TARGET_DIR/memory/rules/after-task.md" "memory/rules/after-task.md"

if [[ -f "$TARGET_DIR/memory/current-state/activeContext.md" ]]; then
    say "WARN Found legacy file: memory/current-state/activeContext.md"
    WARNINGS=$((WARNINGS+1))
fi

say ""
say "Templates"
check_file "$TARGET_DIR/templates/requirements-template.md" "templates/requirements-template.md"
check_file "$TARGET_DIR/templates/design-template.md" "templates/design-template.md"
check_file "$TARGET_DIR/templates/tasks-template.md" "templates/tasks-template.md"

if [[ -f "$TARGET_DIR/templates/requirements-template.md" ]]; then
    if ! grep -qi "Privacy & Security Model" "$TARGET_DIR/templates/requirements-template.md"; then
        say "WARN requirements-template.md missing Privacy & Security Model section"
        WARNINGS=$((WARNINGS+1))
    fi
fi

PROFILE_FILE="$TARGET_DIR/.profile"
if [[ -f "$PROFILE_FILE" ]]; then
    PROFILE=$(cat "$PROFILE_FILE")
    say ""
    say "Profile: $PROFILE"

    if echo "$PROFILE" | grep -q "api"; then
        check_file "$TARGET_DIR/templates/api-design-template.md" "templates/api-design-template.md"
        check_file "$TARGET_DIR/templates/schema-template.md" "templates/schema-template.md"
    fi

    if echo "$PROFILE" | grep -q "cli"; then
        check_file "$TARGET_DIR/templates/command-design-template.md" "templates/command-design-template.md"
    fi

    if echo "$PROFILE" | grep -q "full-stack"; then
        check_file "$TARGET_DIR/templates/architecture-template.md" "templates/architecture-template.md"
        check_file "$TARGET_DIR/templates/integration-testing.md" "templates/integration-testing.md"
    fi

    if echo "$PROFILE" | grep -q "monorepo"; then
        check_dir "$TARGET_DIR/coordination" "coordination/"
    fi

    if echo "$PROFILE" | grep -q "devsecops"; then
        check_file "$TARGET_DIR/templates/security-design-template.md" "templates/security-design-template.md"
        check_file "$TARGET_DIR/templates/security-requirements.md" "templates/security-requirements.md"
    fi

    if echo "$PROFILE" | grep -q "mlops"; then
        check_file "$TARGET_DIR/templates/model-design-template.md" "templates/model-design-template.md"
        check_file "$TARGET_DIR/templates/dataset-card-template.md" "templates/dataset-card-template.md"
    fi
fi

say ""
say ""
say "Stray Spec Scan"
if "$SCRIPT_DIR/scan-strays.sh"; then
    say "OK   No stray specs detected"
else
    WARNINGS=$((WARNINGS+1))
fi

if [[ $ERRORS -eq 0 ]]; then
    say "Result: OK"
else
    say "Result: FAIL ($ERRORS missing)"
fi

if [[ $WARNINGS -gt 0 ]]; then
    say "Warnings: $WARNINGS"
fi

if [[ $ERRORS -ne 0 ]]; then
    exit 1
fi
