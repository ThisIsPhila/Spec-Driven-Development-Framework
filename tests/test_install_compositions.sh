#!/usr/bin/env bash
# REQ-003.1.1 / archived REQ-1.16 — install every supported composition.
#
# The contract is 7 base project types and zero or more of 3 orthogonal
# modifiers. That is 7 * 2^3 = 56 valid compositions, not 21. Every one is
# smoke-tested here; representative files are asserted for every base and every
# modifier, so this catches both parser regressions and missing overlays.
#
# Installs run in bounded batches of 8. The original serial implementation took
# 89 seconds on macOS, violating the phase's under-60-second suite target. Setup
# does not need git for these assertions, so the matrix uses plain temp dirs;
# lifecycle tests separately cover installation into real git repos.

source "$(dirname "${BASH_SOURCE[0]}")/lib/assert.sh"

FRAMEWORK_ROOT="${FRAMEWORK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BASES="general web mobile api cli full-stack monorepo"
MODIFIERS="devsecops mlops devops"
COMPOSITIONS_RUN=0
MATRIX_ROOT=$(mktemp -d 2>/dev/null || mktemp -d -t sddmatrix)
register_sandbox "$MATRIX_ROOT"
MATRIX_FILE="$MATRIX_ROOT/compositions.txt"

assert_base_payload() {
    local root="$1" base="$2"
    case "$base" in
        general)
            assert_file "$root/.sdd/templates/requirements-template.md" "$base: core requirements template"
            ;;
        web)
            assert_file "$root/.sdd/templates/component-design-template.md" "$base: component design template"
            assert_file "$root/.sdd/memory/rules/accessibility-checklist.md" "$base: accessibility rule"
            ;;
        mobile)
            assert_file "$root/.sdd/templates/screen-design-template.md" "$base: screen design template"
            assert_file "$root/.sdd/memory/rules/platform-guidelines.md" "$base: platform rule"
            ;;
        api)
            assert_file "$root/.sdd/templates/api-design-template.md" "$base: API design template"
            assert_file "$root/.sdd/templates/schema-template.md" "$base: schema template"
            ;;
        cli)
            assert_file "$root/.sdd/templates/command-design-template.md" "$base: command design template"
            assert_file "$root/.sdd/memory/rules/ux-principles.md" "$base: CLI UX rule"
            ;;
        full-stack)
            # setup.sh intentionally composes web + api + full-stack overlays.
            assert_file "$root/.sdd/templates/component-design-template.md" "$base: inherited web template"
            assert_file "$root/.sdd/templates/api-design-template.md" "$base: inherited API template"
            assert_file "$root/.sdd/templates/architecture-template.md" "$base: architecture template"
            ;;
        monorepo)
            assert_file "$root/.sdd/templates/architecture-rfc-template.md" "$base: architecture RFC"
            assert_file "$root/.sdd/coordination/progress/current-phase-status.md" "$base: coordination status"
            assert_file "$root/.sdd/memory/rules/monorepo-governance.md" "$base: governance rule"
            ;;
    esac
}

assert_modifier_payload() {
    local root="$1" composition="$2"
    case "+$composition+" in
        *+devsecops+*)
            assert_file "$root/.sdd/templates/security-design-template.md" "devsecops: security design template"
            assert_file "$root/.sdd/memory/rules/security-checklist.md" "devsecops: security rule"
            assert_contains "$root/.sdd/constitution.md" 'Amendment: Security-First Development' \
                "devsecops: constitutional amendment applied to canonical constitution"
            ;;
    esac
    case "+$composition+" in
        *+mlops+*)
            assert_file "$root/.sdd/templates/model-design-template.md" "mlops: model design template"
            assert_file "$root/.sdd/templates/dataset-card-template.md" "mlops: dataset card"
            assert_contains "$root/.sdd/constitution.md" 'Amendment: Data Governance' \
                "mlops: constitutional amendment applied to canonical constitution"
            ;;
    esac
    case "+$composition+" in
        *+devops+*)
            assert_file "$root/.sdd/templates/pipeline-design-template.md" "devops: pipeline template"
            assert_file "$root/.sdd/templates/infrastructure-template.md" "devops: infrastructure template"
            assert_file "$root/.sdd/memory/rules/deployment-checklist.md" "devops: deployment rule"
            ;;
    esac
}

# Materialize the 56-composition contract once, with base alongside composition
# so assertion logic does not have to infer full-stack inheritance.
: > "$MATRIX_FILE"
for base in $BASES; do
    mask=0
    while [[ "$mask" -lt 8 ]]; do
        composition="$base"
        bit=1
        for modifier in $MODIFIERS; do
            if [[ $((mask & bit)) -ne 0 ]]; then
                composition="$composition+$modifier"
            fi
            bit=$((bit * 2))
        done
        printf '%s|%s\n' "$base" "$composition" >> "$MATRIX_FILE"
        mask=$((mask + 1))
    done
done

# ------------------------------------------------------------------------------
start_test "all 56 supported base + modifier-subset compositions install"
# ------------------------------------------------------------------------------

# Run setup in batches of 8. Bash 3.2 has no `wait -n`, so batching is more
# portable than a dynamic worker pool.
batch_count=0
pids=""
while IFS='|' read -r base composition; do
    target="$MATRIX_ROOT/$composition"
    mkdir -p "$target"
    (
        cd "$target" || exit 1
        bash "$FRAMEWORK_ROOT/scripts/setup.sh" \
            --profile "$composition" --yes --no-agent-files \
            >setup.out 2>&1
        printf '%s' "$?" >setup.rc
    ) &
    pids="$pids $!"
    batch_count=$((batch_count + 1))

    if [[ "$batch_count" -eq 8 ]]; then
        for pid in $pids; do wait "$pid"; done
        pids=""
        batch_count=0
    fi
done < "$MATRIX_FILE"
for pid in $pids; do wait "$pid"; done

# Assert sequentially for deterministic output.
while IFS='|' read -r base composition; do
    target="$MATRIX_ROOT/$composition"
    rc=$(cat "$target/setup.rc" 2>/dev/null || printf 'missing')

    if [[ "$rc" == "0" ]]; then
        _pass "$composition installs"
    else
        _fail "$composition installs" \
              "expected exit: 0" "actual exit:   $rc" \
              "output tail:   $(tail -n 3 "$target/setup.out" 2>/dev/null | tr '\n' '|')"
        continue
    fi

    actual=$(cat "$target/.sdd/.profile" 2>/dev/null)
    assert_eq "$composition" "$actual" "$composition metadata is exact"
    assert_file "$target/.sdd/scripts/phase.sh" "$composition: self-contained phase runner"
    assert_file "$target/.sdd/state" "$composition: machine state seeded"
    assert_file "$target/.sdd/constitution.md" "$composition: canonical constitution installed"
    assert_no_file "$target/.sdd/memory/constitutional-framework.md" \
        "$composition: no duplicate legacy constitution"
    assert_base_payload "$target" "$base"
    assert_modifier_payload "$target" "$composition"
    COMPOSITIONS_RUN=$((COMPOSITIONS_RUN + 1))
done < "$MATRIX_FILE"

assert_eq "56" "$COMPOSITIONS_RUN" "complete composition matrix executed"

# Duplicate modifiers are invalid: they used to duplicate constitutional and
# before-task amendments.
duplicate_target="$MATRIX_ROOT/duplicate-modifier"
mkdir -p "$duplicate_target"
assert_exit 1 "duplicate modifiers are rejected" \
    bash -c "cd '$duplicate_target' && bash '$FRAMEWORK_ROOT/scripts/setup.sh' --profile web+devsecops+devsecops --yes --no-agent-files"

finish_test_file
