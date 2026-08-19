#!/usr/bin/env bash
# REQ-003.1.3 — every documented command path must resolve.
#
# This file exists to reproduce assessment finding F1: AGENTS.md and 17 other
# places instruct agents to run `bash .sdd/scripts/phase.sh`, but that path does
# not exist in the framework repository.
#
# It is EXPECTED TO FAIL until T003.7 lands. If it passes before then, it is not
# testing the right thing.

source "$(dirname "${BASH_SOURCE[0]}")/lib/assert.sh"

FRAMEWORK_ROOT="${FRAMEWORK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

# ------------------------------------------------------------------------------
start_test "documented .sdd/scripts/ path resolves in the framework repo"
# ------------------------------------------------------------------------------

# AGENTS.md and .sdd/AGENT_ONBOARDING.md both mandate this exact invocation.
assert_dir "$FRAMEWORK_ROOT/.sdd/scripts" \
    ".sdd/scripts/ exists (mandated by AGENTS.md)"

for script in phase.sh doctor.sh scan-strays.sh skills.sh; do
    if [[ -L "$FRAMEWORK_ROOT/.sdd/scripts/$script" ]]; then
        assert_symlink_resolves "$FRAMEWORK_ROOT/.sdd/scripts/$script" \
            ".sdd/scripts/$script symlink resolves"
    else
        assert_file "$FRAMEWORK_ROOT/.sdd/scripts/$script" \
            ".sdd/scripts/$script is present"
    fi
done

# ------------------------------------------------------------------------------
start_test "documented paths are actually executable as written"
# ------------------------------------------------------------------------------

# The literal command from AGENTS.md. `status` with no active sprint should exit
# cleanly (0) with an informational message, not crash.
if [[ -e "$FRAMEWORK_ROOT/.sdd/scripts/phase.sh" ]]; then
    (
        cd "$FRAMEWORK_ROOT" || exit 1
        bash .sdd/scripts/phase.sh status >/dev/null 2>&1
    )
    rc=$?
    if [[ "$rc" -eq 0 ]]; then
        _pass "bash .sdd/scripts/phase.sh status exits 0"
    else
        _fail "bash .sdd/scripts/phase.sh status exits 0" \
              "expected exit: 0" "actual exit:   $rc"
    fi
else
    _fail "bash .sdd/scripts/phase.sh status exits 0" \
          "cannot run: .sdd/scripts/phase.sh does not exist"
fi

# ------------------------------------------------------------------------------
start_test "no documentation references a nonexistent tests/ path"
# ------------------------------------------------------------------------------

# F3: after-task.md:15 instructs `bash tests/validate-profiles.sh`, but the file
# lives at scripts/validate-profiles.sh. Now that tests/ exists, a wrong path
# under tests/ is actively misleading.
after_task="$FRAMEWORK_ROOT/.sdd/memory/rules/after-task.md"
if [[ -f "$after_task" ]]; then
    while IFS= read -r referenced; do
        [[ -n "$referenced" ]] || continue
        if [[ -e "$FRAMEWORK_ROOT/$referenced" ]]; then
            _pass "after-task.md reference resolves: $referenced"
        else
            _fail "after-task.md reference resolves: $referenced" \
                  "expected: $FRAMEWORK_ROOT/$referenced" \
                  "actual:   not present"
        fi
    done < <(grep -oE '(tests|scripts)/[a-z0-9._-]+\.(sh|js)' "$after_task" | sort -u)
fi

# ------------------------------------------------------------------------------
start_test "consumer install exposes .sdd/scripts/"
# ------------------------------------------------------------------------------

# setup.sh:199 copies scripts into .sdd/scripts/ for consumer self-containment.
# This is the context in which the documented path is already correct, so it
# must keep working.
sandbox=$(make_sandbox)
register_sandbox "$sandbox"

(
    cd "$sandbox" || exit 1
    bash "$FRAMEWORK_ROOT/scripts/setup.sh" --profile general --yes --no-agent-files
) >/dev/null 2>&1
install_rc=$?

assert_eq "0" "$install_rc" "setup.sh --profile general succeeds in a clean repo"
assert_dir  "$sandbox/.sdd/scripts"          "consumer .sdd/scripts/ created"
assert_file "$sandbox/.sdd/scripts/phase.sh" "consumer .sdd/scripts/phase.sh present"

if [[ -f "$sandbox/.sdd/scripts/phase.sh" ]]; then
    ( cd "$sandbox" && bash .sdd/scripts/phase.sh status >/dev/null 2>&1 )
    rc=$?
    if [[ "$rc" -eq 0 ]]; then
        _pass "consumer: bash .sdd/scripts/phase.sh status exits 0"
    else
        _fail "consumer: bash .sdd/scripts/phase.sh status exits 0" \
              "expected exit: 0" "actual exit:   $rc"
    fi
fi

finish_test_file
