# AI Agent Onboarding Protocol

Welcome, Agent. You are now working within an **SDD (Spec-Driven Development) Framework**.
Your primary goal is to be helpful while strictly adhering to the project's structure and rules.

## Phase 0: Initialization (First Run)

**IF** the `.sdd/` directory does not exist yet (whether this is a new project or an existing one adopting SDD):

1.  **Run the Setup Script**: Execute `bash scripts/setup.sh`.
2.  **Verify Structure**: Ensure `.sdd/` created with `memory`, `specs`, and `templates`.
3.  **Self-Register**: Log your presence in `memory/current-state/active-context.md`.

---

## Phase 1: Context Acquisition

Before writing a single line of code or suggesting a plan, you MUST perform the following steps to ground yourself in the project reality.

### Step 1: Framework Recognition
You are in a repo that uses the `.sdd/` directory. This is your brain.
1.  Read `.sdd/memory/project-overview.md` to understand the high-level goal.
2.  Read `.sdd/memory/progress-tracker.md` to see where we are.
3.  Read `.sdd/constitution.md` to understand the non-negotiable rules.
4.  Read `.sdd/memory/rules/spec-naming.md` to follow the required spec folder naming convention.
5.  If monorepo coordination exists, read:
    - `.sdd/memory/rules/monorepo-governance.md`
    - `.sdd/coordination/progress/current-phase-status.md`

### Step 2: Codebase Reconnaissance
If the memory files are empty or sparse, you must fill the gaps yourself:
1.  **Identify Tech Stack**: Look for `package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`, etc.
2.  **Map Structure**: Run `ls -R` (limit depth if necessary) or use directory listing tools to understand the layout.
3.  **Check Conventions**: Look for existing patterns in the code. How are functions named? Where are tests located?

### Step 3: Self-Registration
If you have write access to `.sdd/memory/current-state/active-context.md` (or equivalent), log your session start and what task you are picking up.

---

## Phase 2: Workflow Adherence

### The Golden Rule
**No Code Without Spec.**
- If the user asks for a feature, check if a spec exists in `.sdd/specs/active/`.
- If NO spec exists, your first job is to help the user create one using the templates in `.sdd/templates/`.

### The Spec Lifecycle (Sequential)
**Condition**: You MUST create specs in this exact order. Do NOT create multiple files at once.

**Spec Folder Rule (Mandatory)**:
- Specs MUST live in `.sdd/specs/{active,archive,backlog}/` under a folder that matches the naming convention in `memory/rules/spec-naming.md`.
- For monorepos, keep root coordination artifacts updated in `.sdd/coordination/`.

1.  **Requirements (`requirements.md`)**:
    - Create draft using `templates/requirements-template.md`.
    - **STOP** and ask for user approval.
    - *Do not proceed until user says "Approved".*

2.  **Design (`design.md`)**:
    - Create draft using `templates/design-template.md`.
    - **STOP** and ask for user approval.
    - *Do not proceed until user says "Approved".*

3.  **Tasks (`tasks.md`)**:
    - Create draft using `templates/tasks-template.md`.
    - Ensure only **High-Level Tasks** have checkboxes.
    - **STOP** and ask for user approval.

4.  **Execute**:
    - Verified against `tasks.md`.
    - Update `task.md` (Artifact) as you go.

---

## Phase 3: Communication

- **Be Concise**: Do not hallucinate files.
- **Be Explicit**: When referring to a file, use its full path.
- **Be Agentic**: Don't just ask "what do you want?". Propose the next logical step based on the SDD framework.

---

## Logging Example (Active Context)

When updating `memory/current-state/active-context.md`, keep it crisp and actionable:

```
Current Phase: Phase 002 - Feature X
Current Task: 2-3 Add schema validation
Branch: feature/task-2-3-schema-validation

Focus:
- Define validation rules
- Update tests

Recent Decisions:
- Use Zod for schema validation
```

---

## File Placement Rules

- **Specs live in `.sdd/specs/` only.** Do not place `requirements.md`, `design.md`, or `tasks.md` under `docs/`.
- **Project docs live in `docs/`**, and may link to specs instead of duplicating them.
- If unsure, run: `bash scripts/scan-strays.sh`.
