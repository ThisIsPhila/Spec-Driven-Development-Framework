#!/usr/bin/env bash
# Sync canonical SDD skills from .sdd/skills into agent-specific skill folders

set -e

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
SOURCE_DIR="$REPO_ROOT/.sdd/skills"
DRY_RUN=false
TARGET="all"

usage() {
    echo "Usage: $0 [--target all|codex|claude|copilot|gemini] [--dry-run]"
    echo ""
    echo "Canonical source: .sdd/skills"
    echo "Targets:"
    echo "  codex   -> .agents/skills"
    echo "  claude  -> .claude/skills"
    echo "  copilot -> .github/skills"
    echo "  gemini  -> .gemini/skills"
}

resolve_target_dir() {
    case "$1" in
        codex) echo "$REPO_ROOT/.agents/skills" ;;
        claude) echo "$REPO_ROOT/.claude/skills" ;;
        copilot) echo "$REPO_ROOT/.github/skills" ;;
        gemini) echo "$REPO_ROOT/.gemini/skills" ;;
        *) return 1 ;;
    esac
}

sync_one() {
    local target_name="$1"
    local target_dir

    target_dir=$(resolve_target_dir "$target_name")

    if [[ "$DRY_RUN" == true ]]; then
        echo "DRY   rsync -a '$SOURCE_DIR/' '$target_dir/'"
        return
    fi

    mkdir -p "$target_dir"
    rsync -a "$SOURCE_DIR/" "$target_dir/"
    echo "SYNC  $target_name -> ${target_dir#$REPO_ROOT/}"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --target)
            TARGET="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

if [[ ! -d "$SOURCE_DIR" ]]; then
    echo "MISS canonical skills directory: .sdd/skills"
    exit 1
fi

if [[ -z "$(find "$SOURCE_DIR" -type f -name "SKILL.md" -print -quit)" ]]; then
    echo "WARN no SKILL.md files found in .sdd/skills"
fi

if [[ "$TARGET" == "all" ]]; then
    sync_one codex
    sync_one claude
    sync_one copilot
    sync_one gemini
    exit 0
fi

case "$TARGET" in
    codex|claude|copilot|gemini)
        sync_one "$TARGET"
        ;;
    *)
        echo "Invalid --target value: $TARGET"
        usage
        exit 1
        ;;
esac
