# Delivery Process Rules

Rules for planning, delegating and accepting work, learned from running a phase with delegated agents. They apply whenever a task is handed to an agent or a person other than the planner. Fields named here live in `tasks.md`; numbers are recorded by `phase.sh` and reported by `phase.sh report`.

## 1. Every task carries delivery fields

Add these bullets to each task (see `templates/tasks-template.md`):

- **Executor:** who does it (`Lead`, `Haiku`, a person, a tool).
- **Risk:** `low` or `high` (see section 3).
- **Human estimate:** `best/likely/worst` hours for a senior developer including tests and documentation, for example `2/4/8 h`. Written before work starts. A task without an estimate cannot be compared later.
- **Time budget:** wall-clock minutes the executor may spend, for example `45 min`.
- **Token budget:** optional, for example `400k`. Advisory unless the harness reports usage (section 2).

`doctor.sh` warns when a task lacks Risk, Human estimate, Time budget or Executor in a phase at or after `delivery.required_from_phase` in `.sdd/metrics/profile.json`.

## 2. Budgets

- **Time budget is a stop condition.** The brief tells the executor: if any single command runs longer than 10 minutes, or the task passes its time budget, stop and report with a progress count. The planner checks the clock when a task passes its budget; waiting silently is not allowed.
- **No test timeout above 10 minutes.** A slow suite prints progress every minute and has a per-iteration timeout. A 3-hour timeout hides a defect for 3 hours.
- **Token budget** is enforced by the executor's own stop-and-report rule. It becomes a hard limit only when the harness exposes usage; `phase.sh usage` estimates tokens from session logs afterwards.
- A task over budget is not failed automatically. The planner records why under "What reality taught us" and adjusts the estimate rule for the next task.

## 3. Verify by risk

- **High risk** (kernel, storage, recovery, concurrency, security, transport, anything with a safety invariant): re-run every check, read the code, and write an independent test. Safety tests need a mutation proof: break the code on purpose and show the test fails.
- **Low risk** (types, fixtures, styling tokens, documentation, scaffolding): re-run the checks and spot-read the diff.
- Never accept an executor's summary alone. A pasted exit code from the planner's own run is the evidence.

## 4. Write tasks as behaviour, not file names

- State the observable result and acceptance, not the internal layout. Name files only when a path is a hard constraint.
- Before dispatching a phase, check its tasks against the code: file paths, dependencies, scripts that already exist, fixtures that moved. Correct the task text in the brief and record the correction.

## 5. Continuous execution

When the owner grants execution authority for a phase and asks for continuous progress, the planner starts the next task after acceptance without waiting for a further message. The "wait for approval before the next task" rule in `after-task.md` applies only when execution is supervised. Stop and ask only for: credits or cost the owner has not approved, destructive or external actions, and decisions not yet determined.

## 6. Parallel work

Run tasks in parallel only when their owned paths are disjoint. Use one worktree per executor, pre-register shared stubs and dependencies first, then merge by cherry-pick and run the combined checks. Dependency installs are done by the planner before parallel dispatch to avoid lockfile conflicts.

## 7. Recording

- `phase.sh task Tn doing|done|todo` timestamps each change in `.sdd/metrics/tasks.tsv`.
- `phase.sh usage` attributes Kiro session credits and estimated tokens to task windows.
- `phase.sh report [phase] --write` produces `.sdd/reports/<phase>/delivery-report.md`: human estimate, the model used, and the same tokens priced on the comparison model.
- Rates and assumptions live in `.sdd/metrics/rates.json` and `profile.json`. Update rates when the provider changes prices.
