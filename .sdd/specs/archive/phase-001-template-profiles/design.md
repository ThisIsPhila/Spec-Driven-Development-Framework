# Phase 001: Template Profiles & Methodology - Design

**Phase:** Phase 001 - Template Profiles & Methodology  
**Created:** December 9, 2025  
**Status:** ✅ COMPLETE  
**Requirements Approved:** ✅ YES (December 9, 2025)  
**Approved:** December 9, 2025

---

## 🎯 Design Overview

This document details **HOW** the completed profile architecture is implemented. It specifies:
- Exact bash script logic for composition parsing
- File overlay mechanism (base → profile → modifiers)
- Agent detection heuristics implementation
- Profile directory structure and conventions
- Component alignment strategy (constitution, rules, templates, memory)

**Post-completion reconciliation (August 19, 2026):** The shipped system now has seven bases including `monorepo`, rejects duplicate modifiers, writes governance to `.sdd/constitution.md`, uses semantic `Amendment:` headings, and validates all 56 combinations through `tests/run.sh install_compositions`. The implementation excerpts below reflect that final contract rather than the superseded six-base prototype.

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User / AI Agent                          │
│                                                             │
│  "setup.sh --profile web+devsecops"                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              scripts/setup.sh (Enhanced)                    │
│                                                             │
│  1. Parse profile composition: "web+devsecops"             │
│  2. Validate base (web) + modifiers (devsecops)            │
│  3. Show preview of what will be installed                 │
│  4. Wait for user confirmation                             │
│  5. Execute file overlay:                                  │
│     ├── Copy defaults/templates/ → .sdd/templates/         │
│     ├── Copy defaults/memory/ → .sdd/memory/               │
│     ├── Overlay profiles/base/web/ → .sdd/                │
│     └── Overlay profiles/modifiers/devsecops/ → .sdd/     │
│  6. Generate profile metadata: .sdd/.profile               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   .sdd/ Directory                          │
│                                                             │
│  ├── .profile (metadata: "web+devsecops")                 │
│  ├── templates/                                            │
│  │   ├── requirements-template.md (base)                  │
│  │   ├── design-template.md (base)                        │
│  │   ├── tasks-template.md (base)                         │
│  │   ├── component-design-template.md (from web)         │
│  │   └── security-design-template.md (from devsecops)    │
│  ├── constitution.md (+ semantic modifier amendments)       │
│  ├── memory/                                                │
│  │   ├── progress-tracker.md (base)                        │
│  │   └── security-requirements.md (from devsecops)       │
│  └── memory/rules/                                         │
│      ├── before-task.md (base + security checklist)      │
│      ├── during-task.md (base)                            │
│      ├── after-task.md (base)                             │
│      ├── accessibility-checklist.md (from web)           │
│      └── security-checklist.md (from devsecops)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack Decisions

### REQ-1.1 & REQ-1.13: Profile Selection & Confirmation

**Decision: Bash script with `whiptail` for interactive menu**

**Rationale:**
- **Bash**: Already used for `setup.sh`, no new dependencies
- **whiptail**: Standard on most Unix systems, provides TUI menus
- **Fallback**: If whiptail unavailable, use simple read prompts

**Implementation:**

```bash
#!/bin/bash
# scripts/setup.sh

# Parse --profile argument
PROFILE_ARG=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --profile)
      PROFILE_ARG="$2"
      shift 2
      ;;
    --list-profiles)
      list_profiles
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

# Parse composition: "web+devsecops+mlops"
parse_profile() {
  local composition=$1
  IFS='+' read -ra PARTS <<< "$composition"
  
  BASE_PROFILE="${PARTS[0]}"
  MODIFIERS=("${PARTS[@]:1}")
  
  # Validate base profile
  if [[ ! " ${VALID_BASES[@]} " =~ " ${BASE_PROFILE} " ]]; then
    echo "Error: Invalid base profile '$BASE_PROFILE'"
    echo "Valid bases: ${VALID_BASES[*]}"
    exit 1
  fi
  
  # Validate modifiers
  for modifier in "${MODIFIERS[@]}"; do
    if [[ ! " ${VALID_MODIFIERS[@]} " =~ " ${modifier} " ]]; then
      echo "Error: Invalid modifier '$modifier'"
      echo "Valid modifiers: ${VALID_MODIFIERS[*]}"
      exit 1
    fi
  done
}

# Show preview
show_preview() {
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📦 Profile Composition: $BASE_PROFILE"
  [[ ${#MODIFIERS[@]} -gt 0 ]] && echo "   Modifiers: +${MODIFIERS[*]}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "Will install:"
  echo "  Templates:"
  list_templates "$BASE_PROFILE" "${MODIFIERS[@]}"
  echo ""
  echo "  Rules:"
  list_rules "$BASE_PROFILE" "${MODIFIERS[@]}"
  echo ""
  echo "  Memory:"
  list_memory "$BASE_PROFILE" "${MODIFIERS[@]}"
  echo ""
  read -p "Proceed with installation? [Y/n] " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 0
  fi
}

# Interactive menu (if no --profile flag)
interactive_menu() {
  if command -v whiptail &> /dev/null; then
    # Use whiptail for TUI
    BASE_PROFILE=$(whiptail --title "Select Base Profile" --menu "Choose your project type:" 15 60 6 \
      "general" "Generic software project" \
      "web" "Web application (React, Vue, Next)" \
      "mobile" "Mobile app (iOS, Android)" \
      "api" "Backend API service" \
      "cli" "Command-line tool" \
      "full-stack" "Web + API combined" \
      3>&1 1>&2 2>&3)
    
    # Select modifiers (checkbox)
    MODIFIERS_STR=$(whiptail --title "Select Modifiers (optional)" --checklist "Choose methodologies:" 15 60 3 \
      "devsecops" "Security-first workflows" OFF \
      "mlops" "ML model governance" OFF \
      "devops" "Advanced CI/CD" OFF \
      3>&1 1>&2 2>&3)
    
    # Parse checkbox output
    MODIFIERS=($MODIFIERS_STR)
  else
    # Fallback: simple prompts
    echo "Base Profiles:"
    echo "  1) general   2) web   3) mobile   4) api   5) cli   6) full-stack"
    read -p "Select base profile (1-6): " base_choice
    # ... map choice to profile name
  fi
}

# Main logic
if [[ -z "$PROFILE_ARG" ]]; then
  interactive_menu
else
  parse_profile "$PROFILE_ARG"
fi

show_preview
install_profiles
```

**Success Metrics:**
- Profile parsing success rate: 100%
- Interactive menu usability: < 10 seconds to select
- Preview clarity: All files listed before installation

---

### REQ-1.2: File Overlay Mechanism

**Decision: Layered copy with rsync**

**Rationale:**
- **rsync**: Standard Unix tool, supports recursive copy with overwrite
- **Layered approach**: Base → Profile → Modifiers (later layers override)
- **Clear precedence**: Predictable conflict resolution

**Implementation:**

```bash
install_profiles() {
  TARGET_DIR=".sdd"
  FRAMEWORK_SOURCE="$(dirname "$0")/.."
  
  echo "📦 Installing files..."
  
  # Layer 1: Base framework files
  echo "  1/3 Copying base templates..."
  rsync -a "$FRAMEWORK_SOURCE/defaults/templates/" "$TARGET_DIR/templates/"
  rsync -a "$FRAMEWORK_SOURCE/defaults/memory/" "$TARGET_DIR/memory/"
  
  # Layer 2: Base profile overlay
  if [[ -d "$FRAMEWORK_SOURCE/defaults/profiles/base/$BASE_PROFILE" ]]; then
    echo "  2/3 Applying base profile: $BASE_PROFILE"
    rsync -a "$FRAMEWORK_SOURCE/defaults/profiles/base/$BASE_PROFILE/" "$TARGET_DIR/"
  fi
  
  # Layer 3: Modifier overlays
  for modifier in "${MODIFIERS[@]}"; do
    if [[ -d "$FRAMEWORK_SOURCE/defaults/profiles/modifiers/$modifier" ]]; then
      echo "  3/3 Applying modifier: +$modifier"
      rsync -a "$FRAMEWORK_SOURCE/defaults/profiles/modifiers/$modifier/" "$TARGET_DIR/"
    fi
  done
  
  # Generate metadata
  echo "$BASE_PROFILE+${MODIFIERS[*]}" > "$TARGET_DIR/.profile"
  
  echo "✅ Installation complete!"
}
```

**File Precedence Example:**
```
defaults/templates/design-template.md (base)
  ↓ (overridden by)
defaults/profiles/base/web/templates/design-template.md (web-specific)
  ↓ (augmented by)
defaults/profiles/modifiers/devsecops/templates/security-design-template.md (additional file)
```

**Success Metrics:**
- File copy accuracy: 100% (all specified files copied)
- Overlay correctness: 100% (modifiers override base)
- Installation speed: < 5 seconds

---

### REQ-1.9-1.11: Component Alignment

**Decision: Modifier-specific amendments to constitutional framework**

**Challenge:** How do modifiers update the constitution without replacing the entire file?

**Solution: Markdown append with section markers**

```bash
# In modifier installation
if [[ -f "$MODIFIER_PATH/memory/constitutional-amendment.md" ]]; then
  echo "" >> "$TARGET_DIR/memory/constitutional-framework.md"
  echo "---" >> "$TARGET_DIR/memory/constitutional-framework.md"
  echo "" >> "$TARGET_DIR/memory/constitutional-framework.md"
  cat "$MODIFIER_PATH/memory/constitutional-amendment.md" >> "$TARGET_DIR/memory/constitutional-framework.md"
fi
```

**Example: devsecops modifier**

`defaults/profiles/modifiers/devsecops/memory/constitutional-amendment.md`:
```markdown
## Article VI: Security-First Development

**Principle:** All changes must be evaluated for security impact before implementation.

**Requirements:**
1. Threat modeling is mandatory for design phase
2. Security checklist must be completed before task execution
3. Dependencies must be scanned for vulnerabilities
4. Secrets must never be committed to version control

**Enforcement:** Agents must refuse to proceed without security review.
```

**Template updates:**

Modifiers can include **partial template replacements** using a `_extends.md` naming convention:

`defaults/profiles/modifiers/devsecops/templates/design-template_extends.md`:
```markdown
<!-- This section is inserted into design-template.md after "## 🎯 Design Overview" -->

## 🔒 Security Considerations

### Threat Model

**Assets:**
- List valuable assets (data, credentials, etc.)

**Threats:**
- Who might attack? (attackers, insiders, etc.)

**Attack Vectors:**
- How could they attack?

**Mitigations:**
- How do we prevent/detect/respond?

**Risk Assessment:**
| Threat | Likelihood | Impact | Mitigation | Residual Risk |
|--------|------------|--------|------------|---------------|
| SQL injection | Medium | High | Parameterized queries | Low |
```

**Implementation:**  
Script scans for `*_extends.md` and inserts sections into base templates at marked insertion points.

**Success Metrics:**
- Constitution augmentation: 100% (modifiers add articles)
- Template integration: 100% (extensions inserted correctly)
- No file conflicts: 100% (clear override/extend behavior)

---

### REQ-1.14: Agent Detection Heuristics

**Decision: Pattern matching on file markers + dependency analysis**

**Rationale:**
- **File markers**: Presence of `package.json`, `requirements.txt`, etc.
- **Dependency scanning**: Parse package files for specific libraries
- **Heuristic scoring**: Multiple indicators → higher confidence

**Implementation (Pseudocode for Agents):**

```python
def detect_profile(project_path):
    indicators = {
        'web': 0,
        'api': 0,
        'mobile': 0,
        'cli': 0,
        'full-stack': 0,
        'devsecops': 0,
        'mlops': 0,
        'devops': 0
    }
    
    # Base profile detection
    if exists('package.json'):
        deps = parse_json('package.json')
        if any(lib in deps for lib in ['react', 'vue', 'next', 'svelte']):
            indicators['web'] += 2
        if any(lib in deps for lib in ['express', 'fastify', 'koa']):
            indicators['api'] += 2
    
    if exists('requirements.txt') or exists('pyproject.toml'):
        deps = parse_requirements()
        if any(lib in deps for lib in ['fastapi', 'flask', 'django']):
            indicators['api'] += 2
        if any(lib in deps for lib in ['click', 'argparse', 'typer']):
            indicators['cli'] += 1
    
    # Modifier detection
    if exists('.github/workflows'):
        indicators['devops'] += 1
    
    if any(exists(f) for f in ['.snyk', 'sonar-project.properties']):
        indicators['devsecops'] += 2
    
    if any(lib in all_deps for lib in ['tensorflow', 'pytorch', 'mlflow', 'wandb']):
        indicators['mlops'] += 2
    
    # Determine composition
    base = max(indicators, key=lambda k: indicators[k] if k in BASES else 0)
    modifiers = [k for k in MODIFIERS if indicators[k] >= 2]
    
    composition = base + (''.join(f'+{m}' for m in modifiers) if modifiers else '')
    
    return composition, reasoning
```

**Example Outputs:**
- Detects: `package.json` with `react` + `fastapi` → `full-stack`
- Detects: `requirements.txt` with `flask` + `snyk` → `api+devsecops`
- Detects: `package.json` with `tensorflow` + `next` → `web+mlops`

**Success Metrics:**
- Detection accuracy: > 90% (validated against test projects)
- False positive rate: < 5%
- Reasoning clarity: 100% (agents explain why)

---

### REQ-1.15: Profile Listing

**Decision: Read `README.md` frontmatter from each profile**

**Profile README.md format:**

```markdown
---
name: Web
type: base
description: Web applications (React, Vue, Next.js)
includes:
  - component-design-template.md
  - accessibility-checklist.md
examples:
  - React + TypeScript SPA
  - Next.js full-stack app
---

# Web Profile

... (full documentation)
```

**Listing command:**

```bash
#!/bin/bash
# scripts/list-profiles.sh

echo "Base Profiles:"
for profile in defaults/profiles/base/*; do
  name=$(grep '^name:' "$profile/README.md" | cut -d: -f2 | xargs)
  desc=$(grep '^description:' "$profile/README.md" | cut -d: -f2- | xargs)
  printf "  %-12s %s\n" "$name" "$desc"
done

echo ""
echo "Modifiers:"
for modifier in defaults/profiles/modifiers/*; do
  name=$(grep '^name:' "$modifier/README.md" | cut -d: -f2 | xargs)
  desc=$(grep '^description:' "$modifier/README.md" | cut -d: -f2- | xargs)
  printf "  +%-11s %s\n" "$name" "$desc"
done
```

**Success Metrics:**
- Listing speed: < 1 second
- Description clarity: 100% (1-line summaries)

---

## 📂 Directory Structure (Final)

```
defaults/
├── memory/
│   ├── constitutional-framework.md
│   └── rules/
│       ├── before-task.md
│       ├── during-task.md
│       └── after-task.md
├── templates/
│   ├── requirements-template.md
│   ├── design-template.md
│   └── tasks-template.md
├── specs-example/
└── profiles/
    ├── base/
    │   ├── general/
    │   │   └── README.md
    │   ├── web/
    │   │   ├── README.md
    │   │   ├── templates/
    │   │   │   ├── component-design-template.md
    │   │   │   └── api-contract-template.md
    │   │   └── memory/rules/
    │   │       └── accessibility-checklist.md
    │   ├── mobile/
    │   ├── api/
    │   ├── cli/
    │   └── full-stack/
    └── modifiers/
        ├── devsecops/
        │   ├── README.md
        │   ├── templates/
        │   │   ├── security-design-template.md
        │   │   └── design-template_extends.md
        │   ├── memory/
        │   │   ├── constitutional-amendment.md
        │   │   └── security-requirements.md
        │   └── memory/rules/
        │       ├── security-checklist.md
        │       └── before-task_extends.md
        ├── mlops/
        └── devops/
```

---

## 🧪 Testing Strategy

### Unit Tests
```bash
# tests/test-profile-parsing.sh
test_parse_simple() {
  result=$(parse_profile "web")
  assert_equals "$BASE_PROFILE" "web"
  assert_equals "${#MODIFIERS[@]}" "0"
}

test_parse_composition() {
  result=$(parse_profile "web+devsecops+mlops")
  assert_equals "$BASE_PROFILE" "web"
  assert_equals "${MODIFIERS[0]}" "devsecops"
  assert_equals "${MODIFIERS[1]}" "mlops"
}
```

### Integration Tests
```bash
# tests/test-installation.sh
test_install_web_devsecops() {
  ./scripts/setup.sh --profile web+devsecops --yes
  
  # Verify base templates exist
  assert_file_exists ".sdd/templates/requirements-template.md"
  
  # Verify web profile files exist
  assert_file_exists ".sdd/templates/component-design-template.md"
  
  # Verify devsecops modifier files exist
  assert_file_exists ".sdd/memory/rules/security-checklist.md"
  
  # Verify constitution was augmented
  assert_file_contains ".sdd/memory/constitutional-framework.md" "Article VI: Security-First"
  
  # Verify metadata
  assert_file_contains ".sdd/.profile" "web+devsecops"
}
```

---

## ✅ Approval Checkpoint

**🛑 STOP - DO NOT PROCEED TO TASKS WITHOUT APPROVAL**

**Before proceeding, please confirm:**
1. Is the bash script approach acceptable for profile composition?
2. Does the file overlay mechanism (rsync layering) make sense?
3. Is the component alignment strategy (amendments + extends) workable?
4. Are the agent detection heuristics reasonable?

**Please respond with:**
- ✅ "Approved - proceed to Tasks"
- 🔄 "I have changes..." (specify changes)
- ❓ "I have questions..." (ask questions)

---

**Once approved, I will create the Phase 1.1 Tasks document.**
