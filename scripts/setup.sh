#!/bin/bash

# SDD Framework Setup Script
# Initializes the .sdd directory with chosen profile composition

set -e

# ==============================================================================
# CONSTANTS
# ==============================================================================

FRAMEWORK_SOURCE="${BASH_SOURCE%/*}/../"
TARGET_DIR=".sdd"
PROJECT_ROOT="$(pwd)"

VALID_BASES=("general" "web" "mobile" "api" "cli" "full-stack" "monorepo")
VALID_MODIFIERS=("devsecops" "mlops" "devops")

# ==============================================================================
# FUNCTIONS
# ==============================================================================

# Parse profile composition string (e.g., "web+devsecops+mlops")
parse_profile() {
    local composition=$1
    IFS='+' read -ra PARTS <<< "$composition"
    
    BASE_PROFILE="${PARTS[0]}"
    MODIFIERS=("${PARTS[@]:1}")
    
    # Validate base profile
    if [[ ! " ${VALID_BASES[@]} " =~ " ${BASE_PROFILE} " ]]; then
        echo "❌ Error: Invalid base profile '$BASE_PROFILE'"
        echo "Valid bases: ${VALID_BASES[*]}"
        exit 1
    fi
    
    # Validate modifiers
    for modifier in "${MODIFIERS[@]}"; do
        if [[ ! " ${VALID_MODIFIERS[@]} " =~ " ${modifier} " ]]; then
            echo "❌ Error: Invalid modifier '$modifier'"
            echo "Valid modifiers: ${VALID_MODIFIERS[*]}"
            exit 1
        fi
    done
}

# List all available profiles
list_profiles() {
    echo "📦 Available Base Profiles:"
    for profile in "${VALID_BASES[@]}"; do
        if [ -f "$FRAMEWORK_SOURCE/defaults/profiles/base/$profile/README.md" ]; then
            desc=$(grep "^description:" "$FRAMEWORK_SOURCE/defaults/profiles/base/$profile/README.md" | cut -d: -f2- | xargs)
            printf "  %-12s %s\n" "$profile" "$desc"
        fi
    done
    
    echo ""
    echo "🔧 Available Modifiers:"
    for modifier in "${VALID_MODIFIERS[@]}"; do
        if [ -f "$FRAMEWORK_SOURCE/defaults/profiles/modifiers/$modifier/README.md" ]; then
            desc=$(grep "^description:" "$FRAMEWORK_SOURCE/defaults/profiles/modifiers/$modifier/README.md" | cut -d: -f2- | xargs)
            printf "  +%-11s %s\n" "$modifier" "$desc"
        fi
    done
    
    echo ""
    echo "Example compositions:"
    echo "  setup.sh --profile web+devsecops"
    echo "  setup.sh --profile api+mlops"
    echo "  setup.sh --profile full-stack+devsecops+devops"
}

# Interactive menu for profile selection
interactive_menu() {
    if command -v whiptail &> /dev/null; then
        # Use whiptail for TUI
        BASE_PROFILE=$(whiptail --title "Select Base Profile" --menu "Choose your project type:" 20 70 7 \
            "general" "Generic software project (default)" \
            "web" "Web application (React, Vue, Next.js)" \
            "mobile" "Mobile app (iOS, Android, React Native)" \
            "api" "Backend API service (REST, GraphQL)" \
            "cli" "Command-line tool" \
            "full-stack" "Web + API combined" \
            "monorepo" "Multi-package monorepo (apps + packages)" \
            3>&1 1>&2 2>&3)
        
        if [ $? -ne 0 ]; then
            echo "Installation cancelled."
            exit 0
        fi
        
        # Select modifiers (checkbox)
        MODIFIERS_STR=$(whiptail --title "Select Modifiers (Optional)" --checklist \
            "Choose methodologies to add:" 15 70 3 \
            "devsecops" "Security-first workflows (threat modeling, security checklists)" OFF \
            "mlops" "ML model governance (experiment tracking, data versioning)" OFF \
            "devops" "Advanced CI/CD (pipeline design, infrastructure as code)" OFF \
            3>&1 1>&2 2>&3)
        
        # Parse checkbox output (whiptail returns quoted strings)
        MODIFIERS=()
        for mod in $MODIFIERS_STR; do
            MODIFIERS+=("${mod//\"/}")  # Remove quotes
        done
    else
        # Fallback: simple prompts
        echo "📦 Base Profiles:"
        echo "  1) general   - Generic software project"
        echo "  2) web       - Web application (React, Vue, Next.js)"
        echo "  3) mobile    - Mobile app (iOS, Android)"
        echo "  4) api       - Backend API service"
        echo "  5) cli       - Command-line tool"
        echo "  6) full-stack - Web + API combined"
        echo "  7) monorepo   - Multi-package monorepo (apps + packages)"
        read -p "Select base profile (1-7): " base_choice
        
        case $base_choice in
            1) BASE_PROFILE="general" ;;
            2) BASE_PROFILE="web" ;;
            3) BASE_PROFILE="mobile" ;;
            4) BASE_PROFILE="api" ;;
            5) BASE_PROFILE="cli" ;;
            6) BASE_PROFILE="full-stack" ;;
            7) BASE_PROFILE="monorepo" ;;
            *) echo "Invalid choice. Using 'general'"; BASE_PROFILE="general" ;;
        esac
        
        echo ""
        echo "🔧 Modifiers (optional, comma-separated):"
        echo "  devsecops, mlops, devops"
        read -p "Enter modifiers (or press Enter to skip): " mod_input
        
        if [ -n "$mod_input" ]; then
            IFS=',' read -ra MODIFIERS <<< "$mod_input"
            # Trim whitespace
            for i in "${!MODIFIERS[@]}"; do
                MODIFIERS[$i]=$(echo "${MODIFIERS[$i]}" | xargs)
            done
        else
            MODIFIERS=()
        fi
    fi
}

# Show preview of what will be installed
show_preview() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Profile Composition: $BASE_PROFILE"
    if [ ${#MODIFIERS[@]} -gt 0 ]; then
        echo "   Modifiers: +${MODIFIERS[*]}"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Will install in current directory:"
    echo "  📁 .sdd/templates/      (base + profile templates)"
    echo "  📁 .sdd/memory/         (project memory)"
    echo "  📁 .sdd/memory/rules/   (workflow rules)"
    echo "  📁 skills/              (canonical agent skills at root)"
    if [ "$INSTALL_AGENT_FILES" = true ]; then
        echo "  🧭 AGENTS.md / CLAUDE.md / GEMINI.md / .gemini/GEMINI.md / .github/copilot-instructions.md"
    fi
    echo ""
    
    read -p "Proceed with installation? [Y/n] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]] && [ -n "$REPLY" ]; then
        echo "Installation cancelled."
        exit 0
    fi
}

# Install base framework files
install_base_files() {
    echo "📦 Installing base framework..."
    
    # Migration check: migrate old .sdd/skills/ to root skills/
    if [[ -d "$TARGET_DIR/skills" ]]; then
        echo "🔄 Migrating existing .sdd/skills/ to root skills/ directory..."
        mkdir -p "$PROJECT_ROOT/skills"
        cp -R "$TARGET_DIR/skills/"* "$PROJECT_ROOT/skills/" 2>/dev/null || true
        rm -rf "$TARGET_DIR/skills"
    fi
    
    # Create directory structure
    mkdir -p "$TARGET_DIR/specs/active" "$TARGET_DIR/specs/archive" "$TARGET_DIR/specs/backlog"
    mkdir -p "$TARGET_DIR/memory/rules" "$TARGET_DIR/memory/current-state" "$TARGET_DIR/memory/completed-tasks"
    mkdir -p "$TARGET_DIR/templates"
    mkdir -p "$PROJECT_ROOT/skills"
    
    # Layer 1: Base templates and memory
    echo "  1/3 Copying base framework files..."
    rsync -a "$FRAMEWORK_SOURCE/defaults/templates/" "$TARGET_DIR/templates/" 2>/dev/null || true
    rsync -a "$FRAMEWORK_SOURCE/defaults/memory/" "$TARGET_DIR/memory/" 2>/dev/null || true
    rsync -a "$FRAMEWORK_SOURCE/defaults/skills/" "$PROJECT_ROOT/skills/" 2>/dev/null || true
    
    # Copy AGENT_ONBOARDING
    cp "$FRAMEWORK_SOURCE/AGENT_ONBOARDING.md" "$TARGET_DIR/" 2>/dev/null || true
    
    # Copy top-level governance files
    cp "$FRAMEWORK_SOURCE/defaults/memory/constitutional-framework.md" "$TARGET_DIR/constitution.md" 2>/dev/null || true
    cp "$FRAMEWORK_SOURCE/defaults/memory/glossary.md" "$TARGET_DIR/glossary.md" 2>/dev/null || true
}

# Install root-level agent entrypoints for common coding agents
install_agent_entrypoints() {
    if [ "$INSTALL_AGENT_FILES" != true ]; then
        echo "🧭 Skipping agent entrypoints (--no-agent-files)"
        return
    fi

    local entries=(
        "AGENTS.md"
        "CLAUDE.md"
        "GEMINI.md"
        ".gemini/GEMINI.md"
        ".github/copilot-instructions.md"
    )

    echo "🧭 Installing agent entrypoints..."
    for rel_path in "${entries[@]}"; do
        local src="$FRAMEWORK_SOURCE/defaults/agent-entrypoints/$rel_path"
        local dst="$PROJECT_ROOT/$rel_path"

        if [[ ! -f "$src" ]]; then
            continue
        fi

        mkdir -p "$(dirname "$dst")"
        if [[ -f "$dst" ]]; then
            echo "      KEEP $rel_path (already exists)"
        else
            cp "$src" "$dst"
            echo "      ADD  $rel_path"
        fi
    done
}

# Install git pre-commit hook for automated quality gates
install_git_hooks() {
    local hook_file=".git/hooks/pre-commit"
    if [[ -d ".git" ]]; then
        if [[ -f "$hook_file" ]]; then
            if ! grep -q "SDD Pre-commit Quality Gate" "$hook_file"; then
                echo "⚠️  Found existing git pre-commit hook. Backing it up to ${hook_file}.bak..."
                cp "$hook_file" "${hook_file}.bak"
            fi
        fi
        echo "⚓ Installing git pre-commit hook..."
        mkdir -p ".git/hooks"
        cat > "$hook_file" <<'EOF'
#!/bin/bash
# SDD Pre-commit Quality Gate

echo "🔍 Running SDD validation checks..."

# Resolve script path (check local scripts, .sdd-framework/scripts, or .sdd/scripts)
SCRIPT_PATH=""
if [[ -f "scripts/doctor.sh" ]]; then
    SCRIPT_PATH="scripts"
elif [[ -f ".sdd-framework/scripts/doctor.sh" ]]; then
    SCRIPT_PATH=".sdd-framework/scripts"
elif [[ -f ".sdd/scripts/doctor.sh" ]]; then
    SCRIPT_PATH=".sdd/scripts"
fi

if [[ -n "$SCRIPT_PATH" ]]; then
    if ! bash "$SCRIPT_PATH/doctor.sh"; then
        echo "❌ SDD validation failed. Commit aborted."
        exit 1
    fi

    if [[ -f "$SCRIPT_PATH/skills.sh" ]]; then
        if ! bash "$SCRIPT_PATH/skills.sh" validate; then
            echo "❌ Skills validation failed. Commit aborted."
            exit 1
        fi
    fi
else
    echo "⚠️  Warning: SDD validation scripts (doctor.sh) not found. Skipping commit quality checks."
fi

echo "✅ All SDD validation checks passed."
exit 0
EOF
        chmod +x "$hook_file"
    fi
}

# Apply base profile overlay
apply_base_profile() {
    if [ "$BASE_PROFILE" = "full-stack" ]; then
        echo "  2/3 Applying base profile: full-stack (web + api + full-stack)"
        rsync -a --exclude "README.md" "$FRAMEWORK_SOURCE/defaults/profiles/base/web/" "$TARGET_DIR/" 2>/dev/null || true
        rsync -a --exclude "README.md" "$FRAMEWORK_SOURCE/defaults/profiles/base/api/" "$TARGET_DIR/" 2>/dev/null || true
        rsync -a "$FRAMEWORK_SOURCE/defaults/profiles/base/full-stack/" "$TARGET_DIR/" 2>/dev/null || true
        return
    fi

    if [ -d "$FRAMEWORK_SOURCE/defaults/profiles/base/$BASE_PROFILE" ]; then
        echo "  2/3 Applying base profile: $BASE_PROFILE"
        rsync -a "$FRAMEWORK_SOURCE/defaults/profiles/base/$BASE_PROFILE/" "$TARGET_DIR/" 2>/dev/null || true
    fi
}

# Apply modifier overlays
apply_modifiers() {
    if [ ${#MODIFIERS[@]} -gt 0 ]; then
        echo "  3/3 Applying modifiers:"
        for modifier in "${MODIFIERS[@]}"; do
            if [ -d "$FRAMEWORK_SOURCE/defaults/profiles/modifiers/$modifier" ]; then
                echo "      +$modifier"
                
                # Overlay files
                rsync -a "$FRAMEWORK_SOURCE/defaults/profiles/modifiers/$modifier/" "$TARGET_DIR/" 2>/dev/null || true
                
                # Append constitutional amendment if exists
                if [ -f "$FRAMEWORK_SOURCE/defaults/profiles/modifiers/$modifier/memory/constitutional-amendment.md" ]; then
                    echo "" >> "$TARGET_DIR/memory/constitutional-framework.md"
                    echo "---" >> "$TARGET_DIR/memory/constitutional-framework.md"
                    echo "" >> "$TARGET_DIR/memory/constitutional-framework.md"
                    cat "$FRAMEWORK_SOURCE/defaults/profiles/modifiers/$modifier/memory/constitutional-amendment.md" >> "$TARGET_DIR/memory/constitutional-framework.md"
                fi

                # Append before-task rule extensions if present
                if [ -f "$FRAMEWORK_SOURCE/defaults/profiles/modifiers/$modifier/memory/rules/before-task_extends.md" ]; then
                    echo "" >> "$TARGET_DIR/memory/rules/before-task.md"
                    echo "---" >> "$TARGET_DIR/memory/rules/before-task.md"
                    echo "" >> "$TARGET_DIR/memory/rules/before-task.md"
                    cat "$FRAMEWORK_SOURCE/defaults/profiles/modifiers/$modifier/memory/rules/before-task_extends.md" >> "$TARGET_DIR/memory/rules/before-task.md"
                fi
            fi
        done
    fi
}

# Generate profile metadata
generate_metadata() {
    local composition="$BASE_PROFILE"
    if [ ${#MODIFIERS[@]} -gt 0 ]; then
        composition="$BASE_PROFILE+${MODIFIERS[*]}"
        composition="${composition// /+}"  # Replace spaces with +
    fi
    
    echo "$composition" > "$TARGET_DIR/.profile"
    echo ""
    echo "✅ SDD Framework initialized successfully!"
    echo "   Profile: $composition"
    echo ""
    echo "📖 Next steps:"
    echo "   1. Read .sdd/AGENT_ONBOARDING.md for workflow guidance"
    echo "   2. Start with .sdd/templates/ for spec creation"
    echo "   3. Optionally sync skills: bash scripts/skills.sh sync"
}

# ==============================================================================
# MAIN
# ==============================================================================

# Parse arguments
PROFILE_ARG=""
WITH_EXAMPLES=false
AUTO_YES=false
INSTALL_AGENT_FILES=true
while [[ $# -gt 0 ]]; do
    case $1 in
        --profile)
            PROFILE_ARG="$2"
            shift 2
            ;;
        --with-examples)
            WITH_EXAMPLES=true
            shift 1
            ;;
        --yes|-y)
            AUTO_YES=true
            shift 1
            ;;
        --no-agent-files)
            INSTALL_AGENT_FILES=false
            shift 1
            ;;
        --list-profiles|--list)
            list_profiles
            exit 0
            ;;
        --help|-h)
            echo "SDD Framework Setup"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --profile COMPOSITION    Use specific profile composition"
            echo "                           (e.g., web+devsecops, api+mlops)"
            echo "  --with-examples          Copy example specs into .sdd/specs/examples"
            echo "  --yes                    Skip confirmation prompts"
            echo "  --no-agent-files         Skip creating root agent entrypoint files"
            echo "  --list-profiles          Show all available profiles"
            echo "  --help                   Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Interactive menu"
            echo "  $0 --profile web+devsecops           # Web with security"
            echo "  $0 --profile api+mlops               # API with ML governance"
            echo "  $0 --profile general --with-examples # Include example specs"
            echo "  $0 --profile general --yes           # No prompts"
            echo "  $0 --profile general --no-agent-files"
            echo "  $0 --list-profiles                   # Show all profiles"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Run '$0 --help' for usage information"
            exit 1
            ;;
    esac
done

# Determine profile composition
if [ -n "$PROFILE_ARG" ]; then
    parse_profile "$PROFILE_ARG"
else
    if [ "$AUTO_YES" = true ]; then
        BASE_PROFILE="general"
        MODIFIERS=()
    else
        interactive_menu
    fi
fi

# Show preview and confirm
if [ "$AUTO_YES" = true ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Profile Composition: $BASE_PROFILE"
    if [ ${#MODIFIERS[@]} -gt 0 ]; then
        echo "   Modifiers: +${MODIFIERS[*]}"
    fi
    if [ "$WITH_EXAMPLES" = true ]; then
        echo "   Examples: enabled"
    fi
    if [ "$INSTALL_AGENT_FILES" = false ]; then
        echo "   Agent files: disabled"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
else
    show_preview
fi

# Install files
install_base_files
install_agent_entrypoints
install_git_hooks
apply_base_profile
apply_modifiers

if [ "$WITH_EXAMPLES" = true ]; then
    echo "📄 Copying example specs..."
    mkdir -p "$TARGET_DIR/specs/examples"
    rsync -a "$FRAMEWORK_SOURCE/defaults/specs-example/" "$TARGET_DIR/specs/examples/" 2>/dev/null || true
fi

generate_metadata
