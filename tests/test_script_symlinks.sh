#!/usr/bin/env bash
# Guards design decision D4: .sdd/scripts/ mirrors scripts/ via symlinks.
#
# Added after a real defect during T003.6: scripts/state.sh was created after the
# symlinks were generated, so .sdd/scripts/state.sh did not exist and phase.sh
# failed with "get_active_phase: command not found" when invoked through the
# documented path. The mirror is drift-prone by construction, so it needs a test.

source "$(dirname "${BASH_SOURCE[0]}")/lib/assert.sh"

FRAMEWORK_ROOT="${FRAMEWORK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

# ------------------------------------------------------------------------------
start_test "every script in scripts/ has a resolving symlink in .sdd/scripts/"
# ------------------------------------------------------------------------------

missing=""
for src in "$FRAMEWORK_ROOT"/scripts/*.sh "$FRAMEWORK_ROOT"/scripts/*.js; do
    [[ -f "$src" ]] || continue
    base=$(basename "$src")
    link="$FRAMEWORK_ROOT/.sdd/scripts/$base"

    if [[ -L "$link" && -e "$link" ]]; then
        _pass ".sdd/scripts/$base resolves"
    elif [[ -f "$link" ]]; then
        _pass ".sdd/scripts/$base present (regular file)"
    else
        missing="$missing $base"
        _fail ".sdd/scripts/$base resolves" \
              "expected: a resolving symlink or file at $link" \
              "actual:   not present" \
              "fix:      re-run the symlink generation for scripts/"
    fi
done

# ------------------------------------------------------------------------------
start_test "no orphan symlinks pointing at deleted scripts"
# ------------------------------------------------------------------------------

if [[ -d "$FRAMEWORK_ROOT/.sdd/scripts" ]]; then
    for link in "$FRAMEWORK_ROOT"/.sdd/scripts/*; do
        [[ -e "$link" || -L "$link" ]] || continue
        base=$(basename "$link")
        if [[ -L "$link" && ! -e "$link" ]]; then
            _fail "no orphan symlink: $base" \
                  "symlink target missing: $(readlink "$link" 2>/dev/null)" \
                  "fix:      remove the stale link or restore scripts/$base"
        else
            _pass "no orphan symlink: $base"
        fi
    done
fi

# ------------------------------------------------------------------------------
start_test "sourcing chain works through the documented path"
# ------------------------------------------------------------------------------

# The actual regression: phase.sh sources state.sh and common.sh relative to its
# own location, so invoking it via the symlink must still resolve them.
(
    cd "$FRAMEWORK_ROOT" || exit 1
    out=$(bash .sdd/scripts/phase.sh status 2>&1)
    if printf '%s' "$out" | grep -q "command not found"; then
        printf 'SOURCING_BROKEN\n'
    else
        printf 'SOURCING_OK\n'
    fi
) > /tmp/sdd_sourcing_check.$$ 2>&1

result=$(cat "/tmp/sdd_sourcing_check.$$")
rm -f "/tmp/sdd_sourcing_check.$$"
assert_eq "SOURCING_OK" "$result" \
    "phase.sh via symlink resolves its sourced dependencies"

finish_test_file
