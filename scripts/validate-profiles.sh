#!/usr/bin/env bash
# Validate profile structure and content

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

REPO_ROOT=$(get_repo_root)
PROFILES_DIR="$REPO_ROOT/defaults/profiles"

echo "🔍 Validating SDD Framework profiles..."
echo ""

ERRORS=0

# Validate base profiles
echo "📦 Base Profiles:"
for profile_dir in "$PROFILES_DIR/base"/*; do
    profile_name=$(basename "$profile_dir")
    
    # Check README.md exists
    if ! check_file "$profile_dir/README.md" "$profile_name/README.md"; then
        ((ERRORS++))
        continue
    fi
    
    # Check frontmatter has required fields
    readme="$profile_dir/README.md"
    name=$(get_yaml_value "$readme" "name")
    type=$(get_yaml_value "$readme" "type")
    description=$(get_yaml_value "$readme" "description")
    
    if [[ -z "$name" ]] || [[ -z "$type" ]] || [[ -z "$description" ]]; then
        echo "    ✗ $profile_name: Missing frontmatter fields"
        ((ERRORS++))
    fi
    
    # Check type is 'base'
    if [[ "$type" != "base" ]]; then
        echo "    ✗ $profile_name: Type must be 'base', got '$type'"
        ((ERRORS++))
    fi
done

echo ""

# Validate modifiers
echo "🔧 Modifiers:"
for modifier_dir in "$PROFILES_DIR/modifiers"/*; do
    modifier_name=$(basename "$modifier_dir")
    
    # Check README.md exists
    if ! check_file "$modifier_dir/README.md" "$modifier_name/README.md"; then
        ((ERRORS++))
        continue
    fi
    
    # Check frontmatter
    readme="$modifier_dir/README.md"
    name=$(get_yaml_value "$readme" "name")
    type=$(get_yaml_value "$readme" "type")
    
    if [[ -z "$name" ]] || [[ -z "$type" ]]; then
        echo "    ✗ $modifier_name: Missing frontmatter fields"
        ((ERRORS++))
    fi
    
    # Check type is 'modifier'
    if [[ "$type" != "modifier" ]]; then
        echo "    ✗ $modifier_name: Type must be 'modifier', got '$type'"
        ((ERRORS++))
    fi
    
    # Check for constitutional amendment (recommended)
    if [[ ! -f "$modifier_dir/memory/constitutional-amendment.md" ]]; then
        echo "    ⚠️  $modifier_name: No constitutional-amendment.md (recommended)"
    fi
done

echo ""

# Validate templates have approval checkpoints
echo "📝 Templates (checking for approval checkpoints):"
template_count=0
missing_checkpoints=0

for profile_dir in "$PROFILES_DIR"/base/* "$PROFILES_DIR"/modifiers/*; do
    if [[ -d "$profile_dir/templates" ]]; then
        for template in "$profile_dir/templates"/*.md; do
            if [[ -f "$template" ]]; then
                ((template_count++))
                if ! grep -q "Approval Checkpoint" "$template"; then
                    echo "  ✗ $(basename "$template"): Missing approval checkpoint"
                    ((missing_checkpoints++))
                    ((ERRORS++))
                fi
            fi
        done
    fi
done

if [[ $missing_checkpoints -eq 0 ]]; then
    echo "  ✓ All $template_count templates have approval checkpoints"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $ERRORS -eq 0 ]]; then
    echo "✅ Validation passed!"
    exit 0
else
    echo "❌ Validation failed with $ERRORS errors"
    exit 1
fi
