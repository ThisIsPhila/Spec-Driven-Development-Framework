# Delegation brief: [Task ID] [Task name]

Copy into the delegate call. Replace every bracket. Keep what is true; delete what is not.

You are implementing task [Task ID] of the project at [project path] on branch [branch]. Do not push. Do not run `phase.sh task ... done` or `phase.sh finish`.

**Read first:** `AGENTS.md`, `.sdd/AGENT_ONBOARDING.md`, `.sdd/constitution.md`, `.sdd/memory/current-state/active-context.md`, `.sdd/memory/rules/*.md`, the task entry in `[tasks.md path]`, and the design and requirement sections it cites.

**Goal:** [observable result and acceptance, not file names]

**Corrections to the task text:** [anything the planner found out of date: moved files, existing scripts, renamed fixtures. Write "none" if none.]

**Owned paths:** [paths the executor may change. Anything else: stop and report.]

**Risk:** [low | high]. [For high: the executor writes a mutation proof for each safety test: break the code on purpose, show the test fails, restore it.]

**Budgets**
- Time: [N] minutes. If the task passes this, or any single command runs longer than 10 minutes, stop and report what is done and what remains, with a progress count.
- Tokens: [N, or "not set"]. If you estimate you are past this, stop and report.
- No test timeout above 10 minutes. A slow suite must print progress at least once a minute.

**Checks before finishing (paste exit codes in the evidence file):** [commands]

**Evidence:** `.sdd/evidence/[phase]/[Task ID]-[slug].md` with exact commands, exit codes, key output, and anything you could not verify.

**Commit:** one local commit `[type(scope): summary [Task ID]]`, staging files by name. Leave `.sdd/evidence/hooks/runs.tsv`, `tasks.md` and `active-context.md` unstaged unless a hook requires otherwise.

**Final reply:** commit hash, each check's exit code, measured numbers, deviations, open items. Claim nothing you did not run. If a real defect shows up, stop and report the exact reproduction instead of working around it.
