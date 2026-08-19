#!/usr/bin/env bash
# SDD Framework test runner.
#
# Discovers tests/test_*.sh, runs each in a subshell, aggregates results, and
# exits non-zero if any test file failed.
#
# Usage:
#   bash tests/run.sh              # run everything
#   bash tests/run.sh install      # run only tests matching *install*
#
# Deliberately does NOT use `set -e`: a failing test file must not abort the
# run, or the first failure would hide every subsequent one.

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export FRAMEWORK_ROOT="$(cd "$TESTS_DIR/.." && pwd)"

FILTER="${1:-}"

# Fail fast on missing prerequisites rather than producing confusing failures.
if ! command -v git >/dev/null 2>&1; then
    printf 'FATAL: git is required to run the test suite.\n' >&2
    exit 1
fi

printf 'SDD Framework Test Suite\n'
printf 'Framework root: %s\n' "$FRAMEWORK_ROOT"
printf 'Bash version:   %s\n' "$BASH_VERSION"
if command -v node >/dev/null 2>&1; then
    printf 'node:           %s\n' "$(node --version)"
else
    printf 'node:           not present (spec linter tests will skip)\n'
fi
printf '\n'

FILES_RUN=0
FILES_FAILED=0
FAILED_NAMES=""

for test_file in "$TESTS_DIR"/test_*.sh; do
    [[ -f "$test_file" ]] || continue

    name=$(basename "$test_file")

    if [[ -n "$FILTER" ]]; then
        case "$name" in
            *"$FILTER"*) ;;
            *) continue ;;
        esac
    fi

    printf '%s\n' "$name"
    FILES_RUN=$((FILES_RUN + 1))

    # Subshell isolation: per-file TESTS_RUN/TESTS_FAILED counters must not leak
    # between files, and a test that cd's somewhere must not affect the next.
    if ! ( bash "$test_file" ); then
        FILES_FAILED=$((FILES_FAILED + 1))
        FAILED_NAMES="$FAILED_NAMES $name"
    fi
    printf '\n'
done

printf '========================================\n'
if [[ "$FILES_RUN" -eq 0 ]]; then
    printf 'No test files matched%s.\n' "${FILTER:+ filter '$FILTER'}"
    exit 1
fi

printf 'Test files run:    %s\n' "$FILES_RUN"
printf 'Test files failed: %s\n' "$FILES_FAILED"

if [[ "$FILES_FAILED" -ne 0 ]]; then
    printf '\nFailed:%s\n' "$FAILED_NAMES"
    exit 1
fi

printf '\nAll tests passed.\n'
