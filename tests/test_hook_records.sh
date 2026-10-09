#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/lib/assert.sh"
FRAMEWORK_ROOT="${FRAMEWORK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
mkdir -p "$fixture/.sdd/scripts"
git -C "$fixture" init -q
git -C "$fixture" config user.name 'Fixture'
git -C "$fixture" config user.email fixture@example.test
cp "$FRAMEWORK_ROOT/scripts/hook-run.sh" "$fixture/.sdd/scripts/hook-run.sh"
printf '#!/bin/bash\nexit 0\n' > "$fixture/.sdd/scripts/doctor.sh"
printf '#!/bin/bash\nexit 7\n' > "$fixture/.sdd/scripts/skills.sh"
start_test "observed hooks record successful and failed commands and block failure"
(cd "$fixture" && bash .sdd/scripts/hook-run.sh) >/dev/null 2>&1
result=$?
assert_eq '1' "$result" 'failing skill gate blocks execution'
assert_eq '2' "$(wc -l < "$fixture/.sdd/evidence/hooks/runs.tsv" | tr -d ' ')" 'only executed gates are recorded'
assert_contains "$fixture/.sdd/evidence/hooks/runs.tsv" $'doctor\t0\tPASS' 'doctor success is recorded'
assert_contains "$fixture/.sdd/evidence/hooks/runs.tsv" $'skills\t7\tFAIL' 'actual failing exit code is recorded'
start_test "missing gate is recorded as skipped and does not claim success"
rm "$fixture/.sdd/scripts/doctor.sh"
(cd "$fixture" && bash .sdd/scripts/hook-run.sh) >/dev/null 2>&1
assert_eq '1' "$?" 'missing required gate blocks execution'
assert_contains "$fixture/.sdd/evidence/hooks/runs.tsv" $'doctor\t127\tSKIPPED' 'missing doctor is recorded as skipped'
finish_test_file
