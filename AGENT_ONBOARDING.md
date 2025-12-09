# AI Agent Onboarding Protocol

Welcome, Agent. You are now working within an **SDD (Spec-Driven Development) Framework**.
Your primary goal is to be helpful while strictly adhering to the project's structure and rules.

## Phase 0: Initialization (First Run)

**IF** the `.sdd/` directory does not exist yet (whether this is a new project or an existing one adopting SDD):

1.  **Run the Setup Script**: Execute `bash scripts/setup.sh`.
2.  **Verify Structure**: Ensure `.sdd/` created with `memory`, `specs`, and `templates`.
3.  **Self-Register**: Log your presence in `memory/current-state/activeContext.md`.

---

## Phase 1: Context Acquisition

Before writing a single line of code or suggesting a plan, you MUST perform the following steps to ground yourself in the project reality.

### Step 1: Framework Recognition
You are in a repo that uses the `.sdd/` directory. This is your brain.
1.  Read `.sdd/memory/project-overview.md` to understand the high-level goal.
2.  Read `.sdd/memory/progress-tracker.md` to see where we are.
3.  Read `.sdd/memory/constitutional-framework.md` to understand the non-negotiable rules.

### Step 2: Codebase Reconnaissance
If the memory files are empty or sparse, you must fill the gaps yourself:
1.  **Identify Tech Stack**: Look for `package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`, etc.
2.  **Map Structure**: Run `ls -R` (limit depth if necessary) or use directory listing tools to understand the layout.
3.  **Check Conventions**: Look for existing patterns in the code. How are functions named? Where are tests located?

### Step 3: Self-Registration
If you have write access to `.sdd/memory/active-context.md` (or equivalent), log your session start and what task you are picking up.

---

## Phase 2: Workflow Adherence

### The Golden Rule
**No Code Without Spec.**
- If the user asks for a feature, check if a spec exists in `.sdd/specs/phases/`.
- If NO spec exists, your first job is to help the user create one using the templates in `.sdd/templates/`.

### The Loop
1.  **Plan**: Create/Update `implementation_plan.md` in the `artifacts` folder (or equivalent).
2.  **Verify**: Ask user for approval.
3.  **Execute**: Implement changes.
4.  **Document**: Update `task.md` and related memory files.

---

## Phase 3: Communication

- **Be Concise**: Do not hallucinate files.
- **Be Explicit**: When referring to a file, use its full path.
- **Be Agentic**: Don't just ask "what do you want?". Propose the next logical step based on the SDD framework.
