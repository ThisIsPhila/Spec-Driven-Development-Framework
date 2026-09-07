#!/usr/bin/env bash
# REQ-003.6.2/3 — doctor invokes content lint and has no framework exemption.

source "$(dirname "${BASH_SOURCE[0]}")/lib/assert.sh"

FRAMEWORK_ROOT="${FRAMEWORK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
sandbox=$(make_sandbox)
register_sandbox "$sandbox"

(
    cd "$sandbox" || exit 1
    bash "$FRAMEWORK_ROOT/scripts/setup.sh" --profile general --yes --no-agent-files
) >/dev/null 2>&1

mkdir -p "$sandbox/.sdd/specs/active/phase-009-lint-proof"
cat > "$sandbox/.sdd/specs/active/phase-009-lint-proof/requirements.md" <<'BAD'
# Requirements

**Status:** ✅ APPROVED

## Requirements

This file deliberately omits the mandatory privacy and security model.
BAD

# ------------------------------------------------------------------------------
start_test "doctor fails when the integrated spec linter fails"
# ------------------------------------------------------------------------------

assert_exit 1 "bad active requirements fail doctor" \
    bash -c "cd '$sandbox' && bash .sdd/scripts/doctor.sh"

# Add the required section and prove the same repository now passes.
cat >> "$sandbox/.sdd/specs/active/phase-009-lint-proof/requirements.md" <<'GOOD'

## Privacy & Security Model

**Data Classification:** Public
**PII Risk:** [ ] Yes / [x] No
GOOD

assert_exit 0 "corrected active requirements pass doctor" \
    bash -c "cd '$sandbox' && bash .sdd/scripts/doctor.sh"

# ------------------------------------------------------------------------------
start_test "doctor source has no blanket framework-repository exemption"
# ------------------------------------------------------------------------------

assert_not_contains "$FRAMEWORK_ROOT/scripts/doctor.sh" 'IS_FRAMEWORK' \
    "IS_FRAMEWORK escape hatch removed"

finish_test_file
