#!/bin/bash

# SDD Framework Setup Script
# Initializes the .sdd directory with chosen profile composition

set -e

# ==============================================================================
# CONSTANTS
# ==============================================================================

FRAMEWORK_SOURCE="${BASH_SOURCE%/*}/../"
TARGET_DIR=".sdd"

VALID_BASES=("general" "web" "mobile" "api" "cli" "full-stack")
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
        BASE_PROFILE=$(whiptail --title "Select Base Profile" --menu "Choose your project type:" 18 70 6 \
            "general" "Generic software project (default)" \
            "web" "Web application (React, Vue, Next.js)" \
            "mobile" "Mobile app (iOS, Android, React Native)" \
            "api" "Backend API service (REST, GraphQL)" \
            "cli" "Command-line tool" \
            "full-stack" "Web + API combined" \
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
        read -p "Select base profile (1-6): " base_choice
        
        case $base_choice in
            1) BASE_PROFILE="general" ;;
            2) BASE_PROFILE="web" ;;
            3) BASE_PROFILE="mobile" ;;
            4) BASE_PROFILE="api" ;;
            5) BASE_PROFILE="cli" ;;
            6) BASE_PROFILE="full-stack" ;;
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
    
    # Create directory structure
    mkdir -p "$TARGET_DIR/specs/phases"
    mkdir -p "$TARGET_DIR/memory/rules"
    mkdir -p "$TARGET_DIR/templates"
    
    # Layer 1: Base templates and memory
    echo "  1/3 Copying base framework files..."
    rsync -a "$FRAMEWORK_SOURCE/defaults/templates/" "$TARGET_DIR/templates/" 2>/dev/null || true
    rsync -a "$FRAMEWORK_SOURCE/defaults/memory/" "$TARGET_DIR/memory/" 2>/dev/null || true
    
    # Copy AGENT_ONBOARDING
    cp "$FRAMEWORK_SOURCE/AGENT_ONBOARDING.md" "$TARGET_DIR/" 2>/dev/null || true
}

# Apply base profile overlay
apply_base_profile() {
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
}

# ==============================================================================
# MAIN
# ==============================================================================

# Parse arguments
PROFILE_ARG=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --profile)
            PROFILE_ARG="$2"
            shift 2
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
            echo "  --list-profiles          Show all available profiles"
            echo "  --help                   Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Interactive menu"
            echo "  $0 --profile web+devsecops           # Web with security"
            echo "  $0 --profile api+mlops               # API with ML governance"
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
    interactive_menu
fi

# Show preview and confirm
show_preview

# Install files
install_base_files
apply_base_profile
apply_modifiers
generate_metadata
