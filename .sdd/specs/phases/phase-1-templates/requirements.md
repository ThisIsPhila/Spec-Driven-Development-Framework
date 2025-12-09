# Phase 1.1: Template Profiles & Methodology - Requirements

**Phase:** Phase 1.1 - Template Profiles & Methodology  
**Created:** December 9, 2025  
**Status:** 📝 DRAFT  
**Approved:** Pending

---

## 🎯 Phase Overview

**Goal:** Enable users to initialize the SDD framework with specialized "Methodology Profiles" (DevSecOps, MLOps, General, Custom) tailored to their project domain, rather than a one-size-fits-all structure.

**Why This Phase Matters:**  
Different development methodologies demand different workflows and artifacts:
- **DevSecOps projects** need security checklists, vulnerability scanning rules, and compliance documentation templates
- **MLOps projects** need data versioning rules, experiment tracking templates, and model governance workflows
- **General projects** need the baseline SDD structure without methodology-specific overhead
- **Custom projects** may need to blend multiple profiles or create entirely new ones

Without profile support, users either:
1. Force-fit the framework to their needs (breaking conventions)
2. Maintain forked versions (losing upstream updates)
3. Abandon the framework entirely (defeating the purpose)

**Duration Estimate:** 1 week  
**Complexity:** Low-Medium (Scripting + Documentation + Testing)

---

## 📋 Requirements

### REQ-1.1: Profile Selection Interface

**User Story:**  
As a developer initializing a new project, I need an intuitive way to select my methodology profile so that I get the right templates and rules from the start.

**Acceptance Criteria:**
1. WHEN I run `scripts/setup.sh` with no arguments THEN I SHALL be prompted with an interactive menu listing available profiles
2. WHEN I run `scripts/setup.sh --profile devsecops` THEN it SHALL skip the prompt and use the specified profile
3. WHEN I select an invalid profile THEN I SHALL see an error message listing valid options
4. WHEN I select a profile THEN the `.sdd/` directory SHALL be initialized with that profile's templates and rules
5. WHEN I run `scripts/setup.sh --list-profiles` THEN I SHALL see all available profiles with short descriptions

**Success Metrics:**
- Profile selection time: < 10 seconds (interactive mode)
- CLI mode setup time: < 5 seconds (non-interactive)
- Error rate for invalid profiles: 0% (clear validation)
- User confusion: 0 (clear menu with descriptions)

**Priority:** 🔴 CRITICAL (Core UX for Phase 1.1)

---

### REQ-1.2: Profile Directory Structure

**User Story:**  
As a framework maintainer, I need a clear organizational structure for profiles so that I can manage them independently and users can understand the layout.

**Acceptance Criteria:**
1. WHEN I look at the source tree THEN there SHALL be a `defaults/profiles/` directory
2. WHEN I list `defaults/profiles/` THEN I SHALL see subdirectories: `general/`, `devsecops/`, `mlops/`, `custom/`
3. WHEN I examine a profile directory THEN it SHALL contain optional subdirectories: `templates/`, `rules/`, `memory/`
4. WHEN a profile has `templates/` THEN those templates SHALL override or extend the base `defaults/templates/`
5. WHEN a profile has `rules/` THEN those workflow rules SHALL override or extend `defaults/memory/rules/`
6. WHEN `setup.sh` runs THEN it SHALL copy base templates first, then overlay profile-specific files

**Success Metrics:**
- Directory depth: ≤ 4 levels (keep it simple)
- Template discoverability: 100% (clear naming)
- Override clarity: 100% (profile files clearly named)

**Structure:**
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
    ├── general/
    │   └── README.md (profile description)
    ├── devsecops/
    │   ├── README.md
    │   ├── rules/
    │   │   ├── security-checklist.md
    │   │   └── before-task.md (extends base)
    │   └── templates/
    │       └── security-design-template.md
    ├── mlops/
    │   ├── README.md
    │   ├── rules/
    │   │   ├── data-versioning.md
    │   │   └── experiment-tracking.md
    │   └── templates/
    │       └── model-design-template.md
    └── custom/
        └── README.md (instructions for customization)
```

**Priority:** 🔴 CRITICAL (Foundation for all profiles)

---

### REQ-1.3: General Profile (Default)

**User Story:**  
As a developer working on a standard software project, I need a "General" profile that includes the core SDD methodology without domain-specific overhead.

**Acceptance Criteria:**
1. WHEN I select "General" profile THEN I SHALL get the baseline templates (requirements, design, tasks)
2. WHEN I select "General" profile THEN I SHALL get the core rules (before-task, during-task, after-task)
3. WHEN I select "General" profile THEN I SHALL NOT get domain-specific templates (security checklists, ML tracking)
4. WHEN no profile is specified THEN "General" SHALL be the default

**Success Metrics:**
- Template count: Exactly 3 base templates (requirements, design, tasks)
- Rules count: Exactly 3 base rules (before/during/after)
- Onboarding time: < 30 minutes (same as current)

**Priority:** 🔴 CRITICAL (Baseline profile)

---

### REQ-1.4: DevSecOps Profile

**User Story:**  
As a developer working on a security-critical application, I need a "DevSecOps" profile that enforces security-first workflows and includes compliance documentation templates.

**Acceptance Criteria:**
1. WHEN I select "DevSecOps" profile THEN I SHALL get all General profile files PLUS security-specific additions
2. WHEN I use DevSecOps profile THEN `rules/before-task.md` SHALL include a security impact assessment checklist
3. WHEN I use DevSecOps profile THEN `templates/` SHALL include `security-design-template.md` with threat modeling sections
4. WHEN I use DevSecOps profile THEN `memory/` SHALL include a `security-requirements.md` template for compliance mapping

**Success Metrics:**
- Security checklist completion rate: 100% (enforced by rules)
- Threat model coverage: 100% (required in design phase)
- Compliance documentation: Present in all specs

**Security-Specific Files:**
- `rules/security-checklist.md` - Pre-implementation security review
- `templates/security-design-template.md` - Design doc with threat modeling
- `templates/incident-response-template.md` - Security incident documentation
- `memory/security-requirements.md` - OWASP/CWE mapping

**Priority:** 🟡 HIGH (High-demand profile)

---

### REQ-1.5: MLOps Profile

**User Story:**  
As a data scientist building ML systems, I need an "MLOps" profile that includes experiment tracking, data versioning, and model governance workflows.

**Acceptance Criteria:**
1. WHEN I select "MLOps" profile THEN I SHALL get all General profile files PLUS ML-specific additions
2. WHEN I use MLOps profile THEN `rules/before-task.md` SHALL include data lineage validation
3. WHEN I use MLOps profile THEN `templates/` SHALL include `model-design-template.md` with sections for:
   - Dataset versioning strategy
   - Experiment tracking (MLflow, W&B, etc.)
   - Model performance metrics
   - Fairness and bias testing
4. WHEN I use MLOps profile THEN `memory/` SHALL include `data-governance.md` for dataset documentation

**Success Metrics:**
- Data lineage documentation: 100% (all datasets tracked)
- Experiment reproducibility: 100% (versioned artifacts)
- Model governance: 100% (documented decisions)

**ML-Specific Files:**
- `rules/data-versioning.md` - Dataset version control workflow
- `rules/experiment-tracking.md` - Experiment logging requirements
- `templates/model-design-template.md` - ML system design doc
- `templates/dataset-card-template.md` - Dataset documentation
- `memory/data-governance.md` - Data handling policies

**Priority:** 🟡 HIGH (High-demand profile)

---

### REQ-1.6: Custom Profile Support

**User Story:**  
As an advanced user with unique needs, I want to create a custom profile by blending existing profiles or adding my own templates so that the framework adapts to my specific workflow.

**Acceptance Criteria:**
1. WHEN I look in `defaults/profiles/custom/` THEN I SHALL find a `README.md` with instructions for customization
2. WHEN I create a custom profile THEN I SHALL be able to specify multiple parent profiles to inherit from
3. WHEN I create custom templates THEN they SHALL follow the same naming conventions as base templates
4. WHEN I run `setup.sh --profile custom` THEN it SHALL use my custom profile configuration

**Success Metrics:**
- Custom profile creation time: < 15 minutes (with clear docs)
- Template compatibility: 100% (follows conventions)
- Inheritance clarity: 100% (clear override rules)

**Custom Profile Structure:**
```
defaults/profiles/custom/
├── README.md (instructions)
├── profile.config (optional: specify inheritance)
├── templates/
│   └── (user-added templates)
└── rules/
    └── (user-added rules)
```

**Priority:** 🟢 MEDIUM (Advanced feature)

---

### REQ-1.7: Profile Metadata & Documentation

**User Story:**  
As a user browsing profiles, I need clear descriptions and metadata so that I can choose the right profile for my project.

**Acceptance Criteria:**
1. WHEN I run `scripts/setup.sh --list-profiles` THEN I SHALL see each profile's name, description, and use case
2. WHEN I examine a profile directory THEN it SHALL contain a `README.md` with:
   - Profile purpose and target audience
   - List of included templates and rules
   - Example projects that use this profile
3. WHEN selecting a profile THEN the setup script SHALL display a 1-line summary of what will be installed

**Success Metrics:**
- Profile documentation coverage: 100% (all profiles have README)
- User decision time: < 1 minute (clear descriptions)
- Documentation clarity: No user questions about profile differences

**Priority:** 🟡 HIGH (Critical for UX)

---

### REQ-1.8: Profile Validation & Testing

**User Story:**  
As a framework maintainer, I need automated tests for profiles so that I can ensure they install correctly and don't break the framework.

**Acceptance Criteria:**
1. WHEN I add a new profile THEN there SHALL be a test script that validates its structure
2. WHEN tests run THEN they SHALL verify:
   - All required files exist (README.md at minimum)
   - Templates follow the expected format (contain approval checkpoints)
   - Rules are valid Markdown
   - No circular dependencies in custom profiles
3. WHEN CI/CD runs THEN profile validation tests SHALL be executed automatically

**Success Metrics:**
- Profile test coverage: 100% (all profiles tested)
- Test execution time: < 30 seconds
- False positive rate: 0% (accurate validation)

**Priority:** 🟢 MEDIUM (Quality assurance)

---

## 🎯 Success Criteria for Phase 1.1

**Phase 1.1 is COMPLETE when:**

1. ✅ `setup.sh` supports `--profile <name>` and interactive profile selection
2. ✅ At least 3 profiles exist and are documented: `general`, `devsecops`, `mlops`
3. ✅ DevSecOps profile includes security-specific templates and rules
4. ✅ MLOps profile includes ML-specific templates and rules
5. ✅ Custom profile structure is documented and tested
6. ✅ Profile selection displays clear descriptions
7. ✅ Automated tests validate all profiles
8. ✅ Documentation (README, AGENT_ONBOARDING) updated to explain profiles

**Validation Tests:**
- Run `setup.sh` with each profile and verify correct files are copied
- Run `setup.sh --list-profiles` and verify all profiles appear
- Create a custom profile and verify it installs correctly
- Run profile validation tests in CI

---

## 📊 Requirements Traceability

| Requirement | User Type | Business Value | Technical Risk |
|-------------|-----------|----------------|----------------|
| REQ-1.1 | All Users | Core UX improvement | Low (scripting) |
| REQ-1.2 | Maintainer | Maintainability | Low (directory structure) |
| REQ-1.3 | General User | Baseline functionality | Low (exists already) |
| REQ-1.4 | Security Teams | Compliance & security | Medium (complex rules) |
| REQ-1.5 | Data Scientists | ML governance | Medium (domain-specific) |
| REQ-1.6 | Advanced Users | Extensibility | Medium (inheritance logic) |
| REQ-1.7 | All Users | Discoverability | Low (documentation) |
| REQ-1.8 | Maintainer | Quality assurance | Low (test scripts) |

---

## 🚫 Out of Scope for Phase 1.1

**What we're NOT building in Phase 1.1:**

❌ Profile switching (changing profiles after initialization) - Use case unclear, defer to user feedback  
❌ Cloud-hosted profile registry - Local profiles only for now  
❌ Profile versioning - Profiles inherit framework version  
❌ GUI profile selector - CLI-only for now  
❌ Automatic profile detection (e.g., detecting package.json → suggest web profile) - Too complex  
❌ Profile composition language (YAML config for mixing profiles) - Custom profile handles this  
❌ Profiles for specific frameworks (React, Django, etc.) - Too specific, community can contribute  
❌ Internationalization (profiles in multiple languages) - English only  

---

## 📝 Dependencies & Assumptions

**Dependencies:**
- Phase 1.0 framework (baseline templates and rules exist)
- Bash scripting (for `setup.sh` enhancements)
- Git (for version control)

**Assumptions:**
- Users run `setup.sh` once per project (no profile switching needed)
- Profiles are filesystem-based (no database)
- Profile count remains manageable (< 10 built-in profiles)
- Users can read Markdown documentation

**Risks:**
1. **Profile Proliferation**: Too many profiles → maintenance burden
   - **Mitigation**: Start with 3, add more based on demand
2. **Template Conflicts**: Profile templates override base in confusing ways
   - **Mitigation**: Clear naming conventions, documentation
3. **User Confusion**: Too many choices → analysis paralysis
   - **Mitigation**: Default to "General", clear descriptions, examples

---

## ✅ Approval Checkpoint

**🛑 STOP - DO NOT PROCEED TO DESIGN WITHOUT APPROVAL**

**Before proceeding, please confirm:**

1. Do these requirements align with your vision for Template Profiles?
2. Are the profiles (General, DevSecOps, MLOps, Custom) the right starting set?
3. Should we add/remove any requirements?
4. Are the priorities correct?
5. Is the scope appropriate (not too big, not too small)?

**Please respond with:**
- ✅ "Approved - proceed to Design"
- 🔄 "I have changes..." (specify changes)
- ❓ "I have questions..." (ask questions)

---

**Once approved, I will create the Phase 1.1 Design document detailing HOW we'll implement these requirements.**

### REQ-1.9: Profile Confirmation & Preview

**User Story:**  
As a developer running setup, I want to see exactly what will be installed before it happens so that I understand what I'm getting and can make adjustments.

**Acceptance Criteria:**
1. WHEN I run `setup.sh --profile mlops` THEN I SHALL see a preview of what will be installed BEFORE any files are copied
2. WHEN the preview displays THEN it SHALL show:
   - Profile name and description
   - List of templates that will be installed
   - List of rules that will be added/modified
   - List of memory files that will be initialized
3. WHEN I view the preview THEN I SHALL be prompted: "Proceed with installation? [Y/n]"
4. WHEN I decline THEN the script SHALL exit without making changes
5. WHEN I accept THEN files SHALL be copied and I SHALL see a summary of what was installed

**Success Metrics:**
- User regret rate: 0% (everyone knows what they're getting)
- Installation time: < 15 seconds (including preview)
- Preview clarity: 100% (users understand what's listed)

**Priority:** 🔴 CRITICAL (Essential UX safeguard)

---

### REQ-1.10: Agent-Driven Profile Detection

**User Story:**  
As an AI agent helping a user adopt SDD in an existing project, I need to analyze the codebase and recommend the appropriate profile so that the user gets relevant templates without manual selection.

**Acceptance Criteria:**
1. WHEN an agent is asked to "set up SDD" in an existing project THEN it SHALL:
   - Scan for technology markers (package.json, requirements.txt, Dockerfile, etc.)
   - Identify security/compliance indicators (OWASP dependencies, audit tools)
   - Identify ML indicators (tensorflow, pytorch, mlflow, datasets)
   - Recommend 1-3 appropriate profiles with reasoning
2. WHEN the agent recommends a profile THEN it SHALL explain in 1-2 sentences why this profile fits
3. WHEN the user confirms THEN the agent SHALL run `setup.sh --profile <name>` and verify installation
4. WHEN conflicting indicators exist (e.g., both ML and security) THEN the agent SHALL recommend Custom profile with specific components

**Detection Heuristics:**
- **Web**: package.json + (react|vue|angular|next|svelte)
- **API**: (fastapi|flask|express|django-rest) + no frontend
- **Mobile**: (Info.plist + Swift) OR (AndroidManifest.xml + Kotlin)
- **CLI**: (click|argparse|commander) + no web server
- **Full-Stack**: Frontend + Backend + Database
- **DevSecOps**: (sonarqube|snyk|dependabot) OR security-focused dependencies
- **MLOps**: (tensorflow|pytorch|sklearn|mlflow) OR model files
- **General**: Fallback if no strong indicators

**Success Metrics:**
- Recommendation accuracy: > 90% (users agree with suggestion)
- False positive rate: < 5% (wrong profile suggested)
- Agent explanation clarity: 100% (users understand reasoning)

**Priority:** 🔴 CRITICAL (Core agent workflow)

---

### REQ-1.11: Profile Component Alignment

**User Story:**  
As a user who selected a profile, I need ALL framework components (templates, rules, constitution, memory) to be aligned with that profile so that I get a cohesive methodology.

**Acceptance Criteria:**
1. WHEN a profile is installed THEN `memory/constitutional-framework.md` SHALL be updated with profile-specific articles (if any)
2. WHEN DevSecOps profile is used THEN constitution SHALL include Article on "Security-First Development"
3. WHEN MLOps profile is used THEN constitution SHALL include Article on "Data Governance"
4. WHEN a profile is installed THEN `memory/progress-tracker.md` SHALL include profile-specific milestones
5. WHEN a profile is installed THEN all rules SHALL reference the same methodology (e.g., DevSecOps rules mention threat modeling)

**Success Metrics:**
- Component consistency: 100% (no contradictions between templates and rules)
- User confusion: 0% (framework feels unified, not patchwork)

**Component Alignment Examples:**

**DevSecOps Profile:**
- **Constitution**: Add Article VI: "Security-First Development" (threat modeling required)
- **Rules**: `before-task.md` includes security impact checklist
- **Templates**: `design-template.md` has threat modeling section
- **Memory**: `progress-tracker.md` tracks security milestones

**MLOps Profile:**
- **Constitution**: Add Article VI: "Data Governance" (dataset versioning required)
- **Rules**: `before-task.md` includes data lineage validation
- **Templates**: `design-template.md` has dataset versioning section
- **Memory**: `progress-tracker.md` tracks experiment milestones

**Priority:** 🟡 HIGH (Ensures coherent experience)

---

## 🔄 Additional Profiles (Expanded List)

### REQ-1.12: Web Profile

**User Story:**  
As a web developer, I need a "Web" profile optimized for frontend/full-stack web applications.

**Specific Files:**
- `templates/component-design-template.md` - UI component specifications
- `templates/api-contract-template.md` - Frontend/backend API contracts
- `rules/accessibility-checklist.md` - WCAG compliance
- `memory/browser-compatibility.md` - Browser support matrix

**Priority:** 🟡 HIGH

---

### REQ-1.13: Mobile Profile

**User Story:**  
As a mobile developer, I need a "Mobile" profile for iOS/Android applications.

**Specific Files:**
- `templates/screen-design-template.md` - Mobile screen specifications
- `rules/platform-guidelines.md` - iOS HIG / Material Design compliance
- `memory/device-support.md` - Device/OS version matrix

**Priority:** 🟢 MEDIUM

---

### REQ-1.14: API Profile

**User Story:**  
As a backend developer building APIs, I need an "API" profile for service development.

**Specific Files:**
- `templates/api-design-template.md` - RESTful/GraphQL API specs
- `templates/schema-template.md` - Database schema documentation
- `rules/api-versioning.md` - Versioning strategy

**Priority:** 🟡 HIGH

---

### REQ-1.15: CLI Profile

**User Story:**  
As a developer building command-line tools, I need a "CLI" profile.

**Specific Files:**
- `templates/command-design-template.md` - CLI command specifications
- `rules/ux-principles.md` - CLI UX best practices
- `memory/os-compatibility.md` - OS support matrix

**Priority:** 🟢 MEDIUM

---

### REQ-1.16: Full-Stack Profile

**User Story:**  
As a full-stack developer, I need a profile that combines web frontend + backend + database.

**Specific Files:**
- Inherits from: Web + API profiles
- `templates/architecture-template.md` - System architecture diagrams
- `rules/integration-testing.md` - End-to-end testing requirements

**Priority:** 🟡 HIGH

---

## 📊 Updated Requirements Traceability

| Requirement | User Type | Business Value | Technical Risk |
|-------------|-----------|----------------|----------------|
| REQ-1.1 | All Users | Core UX improvement | Low (scripting) |
| REQ-1.2 | Maintainer | Maintainability | Low (directory structure) |
| REQ-1.3 | General User | Baseline functionality | Low (exists already) |
| REQ-1.4 | Security Teams | Compliance & security | Medium (complex rules) |
| REQ-1.5 | Data Scientists | ML governance | Medium (domain-specific) |
| REQ-1.6 | Advanced Users | Extensibility | Medium (inheritance logic) |
| REQ-1.7 | All Users | Discoverability | Low (documentation) |
| REQ-1.8 | Maintainer | Quality assurance | Low (test scripts) |
| REQ-1.9 | All Users | Installation safety | Low (preview logic) |
| REQ-1.10 | AI Agents | Intelligent guidance | Medium (detection heuristics) |
| REQ-1.11 | All Users | Methodology coherence | Medium (component sync) |
| REQ-1.12-16 | Domain Users | Domain-specific workflows | Low (templating) |

---

## 🎯 Updated Success Criteria for Phase 1.1

**Phase 1.1 is COMPLETE when:**

1. ✅ `setup.sh` supports `--profile <name>` with confirmation preview
2. ✅ At least 8 profiles exist: general, devsecops, mlops, web, mobile, api, cli, full-stack
3. ✅ Agent-driven profile detection works for existing projects
4. ✅ All profile components (templates, rules, constitution, memory) are aligned
5. ✅ Custom profile structure is documented and tested
6. ✅ Profile selection displays clear descriptions and previews
7. ✅ Automated tests validate all profiles
8. ✅ Documentation (README, AGENT_ONBOARDING) updated to explain agent-driven workflow

**Updated Validation Tests:**
- Agent analyzes 5 sample projects (web, api, ml, cli, mobile) and correctly recommends profiles
- User runs `setup.sh --profile devsecops` and sees preview before installation
- Verify constitution, rules, and templates all reference DevSecOps methodology consistently
- Create a custom profile and verify it installs correctly
# Profile Composition Architecture (Addendum)

## 🔄 Profile Architecture Refinement

After review, we recognized that profiles should be **composable** rather than mutually exclusive.

### Base Profiles (What you're building)
These describe the **type of application**:
- `general` - Generic software projects
- `web` - Web applications (React, Vue, Next.js)
- `mobile` - Mobile apps (iOS, Android)
- `api` - Backend services (REST, GraphQL)
- `cli` - Command-line tools
- `full-stack` - Web + API combined

### Methodology Modifiers (How you're building)
These describe the **development methodology**:
- `+devsecops` - Security-first workflows
- `+mlops` - ML model governance
- `+devops` - CI/CD optimization

### Composition Examples
Users can combine base + modifiers:
- `web+devsecops` = React app with security scanning
- `mobile+mlops` = iOS app with ML deployment
- `api+devops` = Backend with advanced CI/CD
- `full-stack+devsecops+mlops` = Complex app with multiple methodologies

### Implementation Impact

**REQ-1.1 (Profile Selection) - Updated:**
- Support `--profile web+devsecops` syntax
- Interactive menu shows base profiles first, then modifiers
- Agent can recommend composed profiles

**REQ-1.2 (Directory Structure) - Updated:**
```
defaults/profiles/
├── base/
│   ├── general/
│   ├── web/
│   ├── mobile/
│   ├── api/
│   ├── cli/
│   └── full-stack/
└── modifiers/
    ├── devsecops/
    ├── mlops/
    └── devops/
```

**REQ-1.10 (Agent Detection) - Updated:**
Agent recommends composition:
- Detects: React + Snyk → Recommends: `web+devsecops`
- Detects: FastAPI + MLflow → Recommends: `api+mlops`
- Detects: Next.js + TensorFlow + Security tools → Recommends: `full-stack+devsecops+mlops`

## 🔓 Version Control Change

**Decision: Remove `.sdd/` from `.gitignore`**

**Rationale:**
1. `.sdd/` contains planning artifacts (specs, memory, progress) - these ARE version-controlled knowledge
2. Enables agents to use normal file tools instead of shell hacks
3. Shows planning evolution in git history (valuable for contributors)
4. Aligns with spec-driven philosophy: specs are as important as code

**Impact:**
- Framework repos commit their `.sdd/` directory
- Users can see how the framework itself is developed using SDD
- Documentation examples show real `.sdd/` usage
