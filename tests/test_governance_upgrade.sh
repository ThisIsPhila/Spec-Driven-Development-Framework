#!/usr/bin/env bash

source "$(dirname "${BASH_SOURCE[0]}")/lib/assert.sh"
FRAMEWORK_ROOT="${FRAMEWORK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

sandbox=$(make_sandbox)
register_sandbox "$sandbox"

start_test "fresh install contains canonical governance and learning topology"
(
    cd "$sandbox" || exit 1
    bash "$FRAMEWORK_ROOT/scripts/setup.sh" --profile general --yes --no-agent-files
) >"$sandbox/install.out" 2>&1
assert_eq "0" "$?" "fresh install succeeds"
for path in .sdd/constitution.md .sdd/framework.json .sdd/evidence .sdd/reports \
    .sdd/memory/governance .sdd/memory/archive .sdd/templates/evidence-template.md \
    .sdd/templates/learning-template.md .sdd/templates/governance-exception-template.md; do
    if [[ -e "$sandbox/$path" ]]; then _pass "$path installed"; else _fail "$path installed"; fi
done
assert_contains "$sandbox/.sdd/constitution.md" 'Authority and truth' "universal truth article installed"
assert_contains "$sandbox/.sdd/constitution.md" 'Project invariants' "project extension point installed"

start_test "ES-module consumer runs the CommonJS validator"
printf '{"type":"module"}\n' > "$sandbox/package.json"
assert_exit 0 "doctor passes inside an ES-module consumer" \
    bash -c "cd '$sandbox' && bash .sdd/scripts/doctor.sh >/dev/null"

start_test "upgrade preserves project meaning and existing hook"
printf '#!/bin/sh\necho project-hook\n' > "$sandbox/.git/hooks/pre-commit"
printf 'CUSTOM CONSTITUTION\n' > "$sandbox/.sdd/constitution.md"
printf '%s\n' '---' 'name: sdd-workflow' 'description: Custom project-owned workflow.' '---' '# Custom Skill' > "$sandbox/skills/sdd-workflow/SKILL.md"
hook_before=$(shasum -a 256 "$sandbox/.git/hooks/pre-commit" | cut -d' ' -f1)
constitution_before=$(shasum -a 256 "$sandbox/.sdd/constitution.md" | cut -d' ' -f1)
skill_before=$(shasum -a 256 "$sandbox/skills/sdd-workflow/SKILL.md" | cut -d' ' -f1)
(
    cd "$sandbox" || exit 1
    bash "$FRAMEWORK_ROOT/scripts/setup.sh" --upgrade --no-agent-files
) >"$sandbox/upgrade.out" 2>&1
assert_eq "0" "$?" "upgrade succeeds"
assert_eq "$hook_before" "$(shasum -a 256 "$sandbox/.git/hooks/pre-commit" | cut -d' ' -f1)" "existing hook preserved byte-for-byte"
assert_eq "$constitution_before" "$(shasum -a 256 "$sandbox/.sdd/constitution.md" | cut -d' ' -f1)" "project constitution preserved"
assert_eq "$skill_before" "$(shasum -a 256 "$sandbox/skills/sdd-workflow/SKILL.md" | cut -d' ' -f1)" "project skill preserved"
manifest=$(find "$sandbox/.sdd/memory/archive/framework-upgrades" -name manifest.md -print -quit)
assert_file "$manifest" "upgrade manifest recorded inside .sdd"

finish_test_file
