# Phase 1.1: Template Profiles & Methodology - Requirements

**Phase:** Phase 1.1 - Template Profiles & Methodology  
**Created:** December 9, 2025  
**Status:** 📝 DRAFT  
**Approved:** Pending

---

## 🎯 Phase Overview

**Goal:** Enable users to initialize the SDD framework with specialized "Methodology Profiles" tailored to their project, using a **composable architecture** (base + modifiers).

**Why This Phase Matters:**  
Different projects need different workflows. A web app with ML models needs both web-specific templates AND ML governance. Traditional monolithic profiles force users to choose one or the other.

**Profile Architecture:**
- **Base Profiles** (What you're building): `web`, `mobile`, `api`, `cli`, `full-stack`, `general`
- **Modifiers** (How you're building): `+devsecops`, `+mlops`, `+devops`
- **Composition**: `web+devsecops` = React app with security workflows

**Version Control Note:**  
The `.sdd/` directory is now version-controlled (removed from `.gitignore`) to enable normal agent file access and show planning evolution in git history.

**Duration Estimate:** 1 week  
**Complexity:** Low-Medium

---

## 📋 Requirements

### REQ-1.1: Profile Selection & Composition

**User Story:**  
As a developer, I need to select/compose profiles that match my project needs so I get relevant templates without unnecessary overhead.

**Acceptance Criteria:**
1. WHEN I run `scripts/setup.sh` THEN I SHALL see an interactive menu showing base profiles first, then modifiers
2. WHEN I run `scripts/setup.sh --profile web+devsecops` THEN it SHALL parse and apply both components
3. WHEN I select invalid combinations THEN I SHALL see clear error messages
4. WHEN I run `scripts/setup.sh --list-profiles` THEN I SHALL see all base profiles and modifiers with descriptions

**Composition Rules:**
- ONE base profile (required): `general|web|mobile|api|cli|full-stack`
- ZERO or MORE modifiers (optional): `+devsecops`, `+mlops`, `+devops`
- Syntax: `<base>` or `<base>+<modifier1>+<modifier2>`

**Success Metrics:**
- Profile selection time: < 10 seconds
- Composition parsing accuracy: 100%
- User confusion: 0 (clear menu)

**Priority:** 🔴 CRITICAL

---

### REQ-1.2: Composable Directory Structure

**User Story:**  
As a maintainer, I need profiles organized by type (base vs modifiers) so composition logic is clear.

**Acceptance Criteria:**
1. WHEN I look at `defaults/profiles/` THEN I SHALL see `base/` and `modifiers/` subdirectories
2. WHEN `setup.sh` composes `web+devsecops` THEN it SHALL:
   - Copy base templates from `defaults/templates/`
   - Overlay `profiles/base/web/` files
   - Overlay `profiles/modifiers/devsecops/` files
3. WHEN files conflict THEN later layers SHALL override earlier ones

**Structure:**
```
defaults/profiles/
├── base/
│   ├── general/README.md
│   ├── web/
│   │   ├── README.md
│   │   ├── templates/component-design-template.md
│   │   └── rules/accessibility-checklist.md
│   ├── mobile/
│   ├── api/
│   ├── cli/
│   └── full-stack/
└── modifiers/
    ├── devsecops/
    │   ├── README.md
    │   ├── rules/security-checklist.md
    │   ├── templates/security-design-template.md
    │   └── memory/security-requirements.md
    ├── mlops/
    │   ├── README.md
    │   ├── rules/data-versioning.md
    │   └── templates/model-design-template.md
    └── devops/
        └── README.md
```

**Priority:** 🔴 CRITICAL

---

### REQ-1.3: Base Profile - General (Default)

**User Story:**  
As a developer on a standard project, I need the baseline SDD templates without domain-specific additions.

**Acceptance Criteria:**
1. WHEN I select `general` OR no profile THEN I get core templates (requirements, design, tasks) only
2. WHEN I add `+devsecops` to general THEN I get security additions

**Success Metrics:**
- Template count: Exactly 3 base templates
- Rules count: Exactly 3 base rules
- Onboarding time: < 30 min

**Priority:** 🔴 CRITICAL

---

### REQ-1.4: Base Profile - Web

**User Story:**  
As a web developer, I need web-specific templates for component design and API contracts.

**Specific Files:**
- `templates/component-design-template.md` - UI components
- `templates/api-contract-template.md` - Frontend/backend contracts
- `rules/accessibility-checklist.md` - WCAG compliance

**Priority:** 🟡 HIGH

---

### REQ-1.5: Base Profile - Mobile

**User Story:**  
As a mobile developer, I need templates for screen design and platform compliance.

**Specific Files:**
- `templates/screen-design-template.md` - Mobile screens
- `rules/platform-guidelines.md` - iOS HIG / Material Design

**Priority:** 🟢 MEDIUM

---

### REQ-1.6: Base Profile - API

**User Story:**  
As a backend developer, I need API design and schema templates.

**Specific Files:**
- `templates/api-design-template.md` - REST/GraphQL specs
- `templates/schema-template.md` - Database schemas
- `rules/api-versioning.md` - Versioning strategy

**Priority:** 🟡 HIGH

---

### REQ-1.7: Base Profile - CLI

**User Story:**  
As a CLI tool developer, I need command specification templates.

**Specific Files:**
- `templates/command-design-template.md` - CLI commands
- `rules/ux-principles.md` - CLI UX best practices

**Priority:** 🟢 MEDIUM

---

### REQ-1.8: Base Profile - Full-Stack

**User Story:**  
As a full-stack developer, I need combined web + API templates.

**Specific Files:**
- Inherits: All files from `web` + `api`
- `templates/architecture-template.md` - System architecture
- `rules/integration-testing.md` - End-to-end testing

**Priority:** 🟡 HIGH

---

### REQ-1.9: Modifier - DevSecOps

**User Story:**  
As a security-focused team, I need security checklists and threat modeling templates added to my base profile.

**Acceptance Criteria:**
1. WHEN I use `+devsecops` THEN `rules/before-task.md` SHALL include security impact assessment
2. WHEN I use `+devsecops` THEN constitution SHALL add "Security-First Development" article

**Specific Files:**
- `rules/security-checklist.md` - Pre-implementation security review
- `templates/security-design-template.md` - Threat modeling
- `memory/security-requirements.md` - OWASP/CWE mapping

**Component Alignment:**
- Constitution: Add Article VI "Security-First Development"
- Rules: Security checklist in `before-task.md`
- Progress Tracker: Security milestones

**Priority:** 🟡 HIGH

---

### REQ-1.10: Modifier - MLOps

**User Story:**  
As a data science team, I need ML experiment tracking and data governance workflows.

**Acceptance Criteria:**
1. WHEN I use `+mlops` THEN `rules/before-task.md` SHALL include data lineage validation
2. WHEN I use `+mlops` THEN constitution SHALL add "Data Governance" article

**Specific Files:**
- `rules/data-versioning.md` - Dataset version control
- `rules/experiment-tracking.md` - Experiment logging
- `templates/model-design-template.md` - ML system design
- `templates/dataset-card-template.md` - Dataset documentation

**Component Alignment:**
- Constitution: Add Article VI "Data Governance"
- Rules: Data lineage in `before-task.md`
- Progress Tracker: Experiment milestones

**Priority:** 🟡 HIGH

---

### REQ-1.11: Modifier - DevOps

**User Story:**  
As a DevOps-focused team, I need advanced CI/CD and infrastructure-as-code templates.

**Specific Files:**
- `templates/pipeline-design-template.md` - CI/CD pipeline specs
- `templates/infrastructure-template.md` - Terraform/IaC docs
- `rules/deployment-checklist.md` - Zero-downtime deployment requirements

**Priority:** 🟢 MEDIUM

---

### REQ-1.12: Custom Profile Support

**User Story:**  
As an advanced user, I want to create my own profile combinations or entirely custom profiles.

**Acceptance Criteria:**
1. WHEN I create `defaults/profiles/base/myprofile/` THEN `setup.sh --list-profiles` SHALL show it
2. WHEN I create a profile THEN it SHALL follow the same structure as built-in profiles (README.md + optional templates/rules/memory)

**Custom Profile Structure:**
```
defaults/profiles/base/myprofile/
├── README.md (required)
├── templates/ (optional)
├── rules/ (optional)
└── memory/ (optional)
```

**Priority:** 🟢 MEDIUM

---

### REQ-1.13: Profile Confirmation & Preview

**User Story:**  
As a developer, I want to see exactly what will be installed before any files are copied.

**Acceptance Criteria:**
1. WHEN I run `setup.sh --profile web+devsecops` THEN I SHALL see a preview listing:
   - Profile composition (base + modifiers)
   - Templates to be installed
   - Rules to be added/modified
   - Memory files to be initialized
2. WHEN I view the preview THEN I SHALL be prompted: "Proceed? [Y/n]"
3. WHEN I decline THEN no files SHALL be copied

**Success Metrics:**
- User regret rate: 0%
- Installation time: < 15 seconds (including preview)

**Priority:** 🔴 CRITICAL

---

### REQ-1.14: Agent-Driven Profile Detection

**User Story:**  
As an AI agent, I need to analyze an existing codebase and recommend appropriate profile compositions.

**Acceptance Criteria:**
1. WHEN asked to "set up SDD" in existing project THEN agent SHALL:
   - Scan for tech markers (package.json, requirements.txt, etc.)
   - Identify security indicators (snyk, sonarqube dependencies)
   - Identify ML indicators (tensorflow, mlflow)
   - Recommend composed profile with 1-2 sentence reasoning
2. WHEN user confirms THEN agent SHALL run `setup.sh --profile <composition>` and verify

**Detection Heuristics:**
- Base: `web` (package.json + react/vue/next), `api` (fastapi/flask + no frontend), `mobile` (Swift/Kotlin), `cli` (click/argparse)
- Modifiers: `+devsecops` (snyk/dependabot), `+mlops` (tensorflow/mlflow), `+devops` (terraform/github-actions)

**Example Recommendations:**
- Detects: React + Snyk → `web+devsecops`
- Detects: FastAPI + MLflow → `api+mlops`
- Detects: Next.js + TensorFlow + Sonarqube → `full-stack+devsecops+mlops`

**Success Metrics:**
- Recommendation accuracy: > 90%
- False positive rate: < 5%

**Priority:** 🔴 CRITICAL

---

### REQ-1.15: Profile Documentation

**User Story:**  
As a user, I need clear descriptions for each profile so I can make informed choices.

**Acceptance Criteria:**
1. WHEN I run `setup.sh --list-profiles` THEN I SHALL see:
   - Base profiles with 1-line descriptions
   - Modifiers with 1-line descriptions
   - Example compositions
2. WHEN I examine a profile directory THEN it SHALL have `README.md` with purpose, target audience, and included files

**Success Metrics:**
- Profile docs coverage: 100%
- User decision time: < 1 minute

**Priority:** 🟡 HIGH

---

### REQ-1.16: Profile Validation & Testing

**User Story:**  
As a maintainer, I need automated tests to ensure profiles install correctly.

**Acceptance Criteria:**
1. WHEN I add a profile THEN validation script SHALL verify:
   - README.md exists
   - Templates have approval checkpoints
   - No circular dependencies
2. WHEN CI runs THEN profile tests SHALL execute automatically

**Success Metrics:**
- Test coverage: 100%
- Test time: < 30 seconds

**Priority:** 🟢 MEDIUM

---

## 🎯 Success Criteria for Phase 1.1

**Phase 1.1 is COMPLETE when:**

1. ✅ `setup.sh` supports `--profile <base>+<modifier>` composition syntax with preview
2. ✅ Base profiles exist: general, web, mobile, api, cli, full-stack
3. ✅ Modifiers exist: +devsecops, +mlops, +devops
4. ✅ Agent detection recommends appropriate compositions
5. ✅ Profile components (templates, rules, constitution, memory) are aligned
6. ✅ Custom profiles are supported
7. ✅ Automated tests validate all profiles
8. ✅ Documentation updated (README, AGENT_ONBOARDING)

**Validation Tests:**
- Agent analyzes 5 sample projects and correctly recommends composed profiles
- Run `setup.sh --profile web+devsecops` and verify preview, then correct installation
- Verify constitution, rules, and templates reference devsec methodology consistently
- List profiles and verify all appear with descriptions

---

## 📊 Requirements Traceability

| Requirement | User Type | Business Value | Technical Risk |
|-------------|-----------|----------------|----------------|
| REQ-1.1 | All Users | Core composition UX | Low (parsing) |
| REQ-1.2 | Maintainer | Clear organization | Low (directory structure) |
| REQ-1.3-8 | Domain Users | Base profile workflows | Low (templating) |
| REQ-1.9-11 | Domain Users | Modifier workflows | Medium (component sync) |
| REQ-1.12 | Advanced Users | Extensibility | Low (convention) |
| REQ-1.13 | All Users | Installation safety | Low (preview logic) |
| REQ-1.14 | AI Agents | Intelligent guidance | Medium (detection heuristics) |
| REQ-1.15 | All Users | Discoverability | Low (documentation) |
| REQ-1.16 | Maintainer | Quality assurance | Low (test scripts) |

---

## 🚫 Out of Scope for Phase 1.1

❌ Profile switching after initialization  
❌ Cloud-hosted profile registry  
❌ GUI profile selector  
❌ Framework-specific profiles (React, Django)  
❌ Internationalization  

---

## 📝 Dependencies & Assumptions

**Dependencies:**
- Phase 1.0 framework (baseline exists)
- Bash scripting

**Assumptions:**
- Users install once per project (no switching)
- Filesystem-based profiles (no database)
- Profile count manageable (< 15 total)

**Risks:**
1. **Profile Proliferation**: Too many → maintenance burden
   - Mitigation: Start with 6 base + 3 modifiers, add based on demand
2. **Composition Complexity**: Users confused by syntax
   - Mitigation: Interactive menu, agent recommendations, clear docs

---

## ✅ Approval Checkpoint

**🛑 STOP - DO NOT PROCEED TO DESIGN WITHOUT APPROVAL**

**Please confirm:**
1. Composition architecture (base+modifiers) makes sense?
2. Starting set is appropriate (6 base + 3 modifiers)?
3. Priorities correct?

**Respond with:**
- ✅ "Approved - proceed to Design"
- 🔄 "I have changes..."
- ❓ "I have questions..."

---

**Once approved, I will create the Phase 1.1 Design document.**
