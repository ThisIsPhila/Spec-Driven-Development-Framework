#!/usr/bin/env bash
# SDD test assertions.
#
# Bash 3.2 compatible (default macOS bash): no associative arrays, no ${var^},
# no readarray, no mapfile.
#
# Every assertion reports expected vs actual on failure (REQ-003.1.5) and
# increments TESTS_FAILED rather than exiting, so a single test file reports all
# of its failures in one run.

TESTS_RUN=0
TESTS_FAILED=0
CURRENT_TEST="(none)"

# ------------------------------------------------------------------------------
# Output helpers
# ------------------------------------------------------------------------------

_pass() {
    TESTS_RUN=$((TESTS_RUN + 1))
    printf '    ok   %s\n' "$1"
}

_fail() {
    TESTS_RUN=$((TESTS_RUN + 1))
    TESTS_FAILED=$((TESTS_FAILED + 1))
    printf '    FAIL %s\n' "$1"
    shift
    while [[ $# -gt 0 ]]; do
        printf '         %s\n' "$1"
        shift
    done
}

# ------------------------------------------------------------------------------
# Assertions
# ------------------------------------------------------------------------------

# assert_eq <expected> <actual> <description>
assert_eq() {
    local expected="$1" actual="$2" desc="$3"
    if [[ "$expected" == "$actual" ]]; then
        _pass "$desc"
    else
        _fail "$desc" "expected: '$expected'" "actual:   '$actual'"
    fi
}

# assert_file <path> <description>
assert_file() {
    local path="$1" desc="$2"
    if [[ -f "$path" ]]; then
        _pass "$desc"
    else
        _fail "$desc" "expected a file at: $path" "actual:   not present"
    fi
}

# assert_no_file <path> <description>
assert_no_file() {
    local path="$1" desc="$2"
    if [[ ! -e "$path" ]]; then
        _pass "$desc"
    else
        _fail "$desc" "expected nothing at: $path" "actual:   exists"
    fi
}

# assert_dir <path> <description>
assert_dir() {
    local path="$1" desc="$2"
    if [[ -d "$path" ]]; then
        _pass "$desc"
    else
        _fail "$desc" "expected a directory at: $path" "actual:   not present"
    fi
}

# assert_symlink_resolves <path> <description>
# Distinct from assert_file: a symlink whose target is missing is a real defect
# and would otherwise pass a naive -e check.
assert_symlink_resolves() {
    local path="$1" desc="$2"
    if [[ -L "$path" && -e "$path" ]]; then
        _pass "$desc"
    elif [[ -L "$path" ]]; then
        _fail "$desc" "symlink exists but target is missing" \
                      "link:   $path -> $(readlink "$path" 2>/dev/null)"
    else
        _fail "$desc" "expected a symlink at: $path" "actual:   not a symlink"
    fi
}

# assert_contains <file> <pattern> <description>
assert_contains() {
    local file="$1" pattern="$2" desc="$3"
    if [[ ! -f "$file" ]]; then
        _fail "$desc" "file does not exist: $file"
        return
    fi
    if grep -qE "$pattern" "$file"; then
        _pass "$desc"
    else
        _fail "$desc" "expected pattern: $pattern" "in file:          $file" \
                      "actual:           no match"
    fi
}

# assert_not_contains <file> <pattern> <description>
assert_not_contains() {
    local file="$1" pattern="$2" desc="$3"
    if [[ ! -f "$file" ]]; then
        _fail "$desc" "file does not exist: $file"
        return
    fi
    if ! grep -qE "$pattern" "$file"; then
        _pass "$desc"
    else
        _fail "$desc" "expected pattern absent: $pattern" \
                      "in file:                 $file" \
                      "actual:                  found: $(grep -nE "$pattern" "$file" | head -n1)"
    fi
}

# assert_exit <expected_code> <description> <command...>
# Captures output so a failing command does not pollute test output, but
# surfaces the tail of it on an unexpected exit code.
assert_exit() {
    local expected="$1" desc="$2"
    shift 2
    local out rc
    out=$("$@" 2>&1)
    rc=$?
    if [[ "$rc" -eq "$expected" ]]; then
        _pass "$desc"
    else
        _fail "$desc" "expected exit: $expected" "actual exit:   $rc" \
                      "command:       $*" \
                      "output tail:   $(printf '%s' "$out" | tail -n 3 | tr '\n' '|')"
    fi
}

# ------------------------------------------------------------------------------
# Test scaffolding
# ------------------------------------------------------------------------------

start_test() {
    CURRENT_TEST="$1"
    printf '  - %s\n' "$1"
}

# make_sandbox
# Creates an isolated git repo in a temp dir and echoes its path. Every test
# that runs setup.sh or phase.sh MUST use one: phase.sh runs `git checkout -b`,
# so testing in place would move the developer's real branch.
make_sandbox() {
    local dir
    dir=$(mktemp -d 2>/dev/null || mktemp -d -t sddtest)
    (
        cd "$dir" || exit 1
        git init -q .
        git config user.email "test@sdd.local"
        git config user.name "SDD Test"
        # A base commit is required before `git checkout -b` will work.
        printf 'sandbox\n' > .sandbox
        git add .sandbox
        git commit -q -m "sandbox base"
    ) >/dev/null 2>&1
    printf '%s' "$dir"
}

# Tracks sandboxes for cleanup so tests leave nothing behind (REQ-003.1.4).
SANDBOXES=""

register_sandbox() {
    SANDBOXES="$SANDBOXES $1"
}

cleanup_sandboxes() {
    local d
    for d in $SANDBOXES; do
        case "$d" in
            /tmp/*|/var/folders/*)
                rm -rf "$d"
                ;;
            *)
                printf '    WARN refusing to remove unexpected sandbox path: %s\n' "$d"
                ;;
        esac
    done
    SANDBOXES=""
}

# finish_test_file
# Prints a per-file summary and returns non-zero if anything failed, so the
# runner can aggregate.
finish_test_file() {
    cleanup_sandboxes
    printf '  %s: %s run, %s failed\n' "$(basename "${BASH_SOURCE[1]:-tests}")" \
        "$TESTS_RUN" "$TESTS_FAILED"
    [[ "$TESTS_FAILED" -eq 0 ]]
}
