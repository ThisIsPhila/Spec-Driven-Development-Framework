#!/usr/bin/env bash
# Migrate legacy SDD structure to current layout

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_SOURCE="$SCRIPT_DIR/../"

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
TARGET_DIR="$REPO_ROOT/.sdd"
ALT_DIR="$REPO_ROOT/.SDD"

APPLY=false

for arg in "$@"; do
    case "$arg" in
        --yes|--apply)
            APPLY=true
            ;;
        --help|-h)
            echo "Usage: $0 [--yes]"
            echo "  --yes     Apply changes (default is dry-run)"
            exit 0
            ;;
    esac
done

say() {
    printf "%s\n" "$1"
}

move_path() {
    local src="$1"
    local dest="$2"
    if [[ -e "$src" && ! -e "$dest" ]]; then
        if [[ "$APPLY" == true ]]; then
            mv "$src" "$dest"
            say "MOVED $src -> $dest"
        else
            say "MOVE  $src -> $dest"
        fi
    fi
}

copy_if_missing() {
    local src="$1"
    local dest="$2"
    if [[ -f "$src" && ! -f "$dest" ]]; then
        if [[ "$APPLY" == true ]]; then
            mkdir -p "$(dirname "$dest")"
            cp "$src" "$dest"
            say "ADD   $dest"
        else
            say "ADD   $dest"
        fi
    fi
}

mkdir_if_missing() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        if [[ "$APPLY" == true ]]; then
            mkdir -p "$dir"
            say "ADD   $dir/"
        else
            say "ADD   $dir/"
        fi
    fi
}

say "SDD Migrate"
if [[ "$APPLY" == false ]]; then
    say "Mode: dry-run (use --yes to apply)"
fi

# Handle .SDD -> .sdd (case normalization)
if [[ -d "$ALT_DIR" && ! -d "$TARGET_DIR" ]]; then
    if [[ "$APPLY" == true ]]; then
        tmp="$REPO_ROOT/.sdd_tmp_$$"
        mv "$ALT_DIR" "$tmp"
        mv "$tmp" "$TARGET_DIR"
        say "MOVED $ALT_DIR -> $TARGET_DIR"
    else
        say "MOVE  $ALT_DIR -> $TARGET_DIR"
    fi
fi

if [[ ! -d "$TARGET_DIR" ]]; then
    say "WARN  .sdd not found; nothing to migrate"
    exit 0
fi

# Normalize legacy file names
move_path "$TARGET_DIR/memory/current-state/activeContext.md" "$TARGET_DIR/memory/current-state/active-context.md"

# Ensure core folders exist
mkdir_if_missing "$TARGET_DIR/specs/active"
mkdir_if_missing "$TARGET_DIR/specs/archive"
mkdir_if_missing "$TARGET_DIR/specs/backlog"
mkdir_if_missing "$TARGET_DIR/memory/rules"
mkdir_if_missing "$TARGET_DIR/memory/current-state"
mkdir_if_missing "$TARGET_DIR/memory/completed-tasks"

# Backfill missing memory files from defaults
copy_if_missing "$FRAMEWORK_SOURCE/defaults/memory/project-overview.md" "$TARGET_DIR/memory/project-overview.md"
copy_if_missing "$FRAMEWORK_SOURCE/defaults/memory/progress-tracker.md" "$TARGET_DIR/memory/progress-tracker.md"
copy_if_missing "$FRAMEWORK_SOURCE/defaults/memory/technical-decisions.md" "$TARGET_DIR/memory/technical-decisions.md"
copy_if_missing "$FRAMEWORK_SOURCE/defaults/memory/current-state/active-context.md" "$TARGET_DIR/memory/current-state/active-context.md"
copy_if_missing "$FRAMEWORK_SOURCE/defaults/memory/current-state/progress.md" "$TARGET_DIR/memory/current-state/progress.md"
copy_if_missing "$FRAMEWORK_SOURCE/defaults/memory/completed-tasks/README.md" "$TARGET_DIR/memory/completed-tasks/README.md"

# Sync templates (non-destructive; only adds missing files)
mkdir_if_missing "$TARGET_DIR/templates"
copy_if_missing "$FRAMEWORK_SOURCE/defaults/templates/requirements-template.md" "$TARGET_DIR/templates/requirements-template.md"
copy_if_missing "$FRAMEWORK_SOURCE/defaults/templates/design-template.md" "$TARGET_DIR/templates/design-template.md"
copy_if_missing "$FRAMEWORK_SOURCE/defaults/templates/tasks-template.md" "$TARGET_DIR/templates/tasks-template.md"

say "Done"
