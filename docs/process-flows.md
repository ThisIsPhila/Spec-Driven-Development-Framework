# SDD Framework - Process Flows & Life Cycles

This document outlines the operational process flows and lifecycles of the Spec-Driven Development (SDD) Framework using Mermaid diagrams.

---

## 1. Setup & Profile Composition Flow (`setup.sh`)

This flow describes the initialization process in a consumer project. It validates profiles, overlays files, configures Git hooks, and sets up agent entry points.

```mermaid
sequenceDiagram
    autonumber
    actor Developer
    participant Setup as setup.sh
    participant Defaults as defaults/
    participant Project as Project Root
    
    Developer->>Setup: Run setup.sh (with profile options)
    Setup->>Setup: Validate profile options
    Setup->>Project: Create .sdd/ directory structure
    Setup->>Project: Copy base templates & memory files
    
    alt Existing project has .sdd/skills/
        Setup->>Project: Move .sdd/skills/ to root skills/ (Migration)
    else New project
        Setup->>Project: Copy default skills to root skills/
    end
    
    Setup->>Project: Copy framework scripts to .sdd/scripts/
    Setup->>Project: Install agent entrypoints (AGENTS.md, etc.)
    
    alt Git pre-commit hook exists
        Setup->>Project: Backup pre-commit hook to pre-commit.bak
        Setup->>Project: Install pre-commit quality gate hook
    else No pre-commit hook
        Setup->>Project: Install pre-commit quality gate hook
    end
    
    Setup->>Project: Apply profile composition overlay
    Setup->>Project: Save composition to .sdd/.profile
    Setup->>Developer: Display initialization success message
```

---

## 2. Active running Flow: The SDD Specification Lifecycle

Spec-Driven Development enforces sequential progression gates. A developer or agent cannot write design specifications without approved requirements, and cannot write execution tasks without approved design details.

```mermaid
graph TD
    A[Phase 1: Requirements Draft] --> B{Review & Approval}
    B -->|Status: Approved| C[Phase 2: Design Draft]
    B -->|Status: Draft| A
    C --> D{Review & Approval}
    D -->|Status: Approved| E[Phase 3: Tasks Checklist]
    D -->|Status: Draft| C
    E --> F{Review & Approval}
    F -->|Status: Ready to Start| G[Phase 4: Implementation]
    F -->|Status: Draft| E
    G --> H[Phase 5: Verification & Merge]
```

---

## 3. Active Phase Sprint Hook Flow (`phase.sh`)

This flow details how the agent interacts with the `phase.sh` sprint runner tool during active implementation.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Agent as AI Agent
    participant Runner as phase.sh
    participant Context as active-context.md
    participant Tasks as tasks.md
    
    User->>Agent: "Implement Phase X"
    Agent->>Runner: phase.sh start <phase>
    Runner->>Runner: Verify specs approved (Req & Design)
    Runner->>Runner: Checkout Git feature branch
    Runner->>Context: Update active context (Current Phase, Branch)
    Runner->>Agent: Print BEFORE-TASK CHECKLIST
    Agent->>User: Post checklist & wait for start approval
    User->>Agent: "Approved. Proceed."
    
    loop For each task
        Agent->>Runner: phase.sh task <id> doing
        Runner->>Context: Update focus & current task
        Agent->>Agent: Implement task code & self-test
        Agent->>Agent: Git commit -m "feat: task desc (REQ-...)"
        Agent->>Runner: phase.sh task <id> done
        Runner->>Tasks: Check off task checkbox
    end
    
    Agent->>Runner: phase.sh finish
    Runner->>Runner: Assert all tasks complete
    Runner->>Runner: Run doctor.sh & skills.sh validate
    Runner->>Context: Clear active context
    Runner->>Agent: Print completion guidelines (PR, CHANGELOG)
    Agent->>User: Submit PR & Request Merge
    User->>Agent: Merge approved. Archive phase.
    Agent->>Runner: phase.sh archive <phase>
    Runner->>Runner: Move folder to specs/archive/
```

---

## 4. Git Pre-Commit Hook (Quality Gate)

This flow enforces SDD naming rules and file validations programmatically on every `git commit`.

```mermaid
graph TD
    A[git commit] --> B(pre-commit Hook)
    B --> C{Resolve scripts path}
    
    C -->|scripts/| D[Run doctor.sh]
    C -->|.sdd-framework/scripts/| D
    C -->|Not found| E[Print warning, bypass checks]
    
    D -->|Fails name/structure checks| F[Abort Commit]
    D -->|Passes| H{Active specs check}
    
    H -->|design.md exists without approved requirements.md| F
    H -->|tasks.md exists without approved design.md| F
    H -->|All gates pass| I[Run skills.sh validate]
    
    I -->|Fails| F
    I -->|Passes| J[Allow Commit]
    
    E --> J
```

---

## 5. Profile-Aware Spec Validation Flow (`validate-spec.js`)

This flow validates written specifications against the rules defined by the active profile composition.

```mermaid
graph TD
    A[Run validate-spec.js <file>] --> B{Read .sdd/.profile}
    B --> C{Is Requirements file?}
    
    C -->|Yes| D[Check 'Privacy & Security Model' presence]
    D --> E{PII Risk = Yes?}
    E -->|Yes| F{Masking Control Checked?}
    F -->|No| G[Validation FAIL]
    F -->|Yes| H[Check Profiles]
    E -->|No| H
    C -->|No| H
    
    H --> I{Is 'devsecops' active?}
    I -->|Yes| J{Requirements Spec?}
    J -->|Yes| K{Contains 'Threat Surface Summary'?/No}
    K -->|No| G
    J -->|No| L{Design Spec?}
    L -->|Yes| M{Contains Threat Model & Security Checklist?}
    M -->|No| G
    
    H --> N{Is 'mlops' active?}
    N -->|Yes| O{Design Spec?}
    O -->|Yes| P{Contains Dataset, Tracking & Performance?}
    P -->|No| G
    
    K -->|Yes| Q[Validation PASS]
    M -->|Yes| Q
    P -->|Yes| Q
    L -->|No| Q
    O -->|No| Q
    I -->|No| Q
    N -->|No| Q
```
