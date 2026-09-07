# SDD Framework — Critical Assessment

**Assessed version:** v1.3.0 (`bde7df7`)
**Date:** 2026-08-19
**Scope:** the framework as a *tool* — installability, enforceability, testability, and fit with the current agent ecosystem.

This document is an internal critique, not marketing. It is deliberately unflattering where the
evidence warrants it. Every claim below is traceable to a file, a line, or a command output so it
can be re-checked as the code changes.

Related reading: [Architecture](architecture.md) · [CLI Reference](cli-reference.md) ·
[Governance](governance.md) · [Process Flows](process-flows.md)

---

## 1. Method

Assessment was done by reading the full contents of `scripts/`, `.sdd/`, `defaults/`, and `docs/`,
then **executing** the framework's own documented commands against its own repository. Findings
marked *verified* were reproduced by running code, not by reading it. Findings marked *inferred*
are reasoned from source but were not executed.

The distinction matters: several of the most serious problems are invisible on a read-through and
only surface on execution.

---

## 2. Executive summary

The framework has a sound methodology and a real automation layer underneath it — 2,750 lines
across 11 scripts, with genuinely clever checks like the spec-lifecycle approval gate. The
problem is not the idea. It is that **the tool does not currently do what its documentation says
it does, and it has no mechanism that would have caught that.**

Three findings drive everything else:

1. The framework cannot execute its own mandated workflow in its own repository. *(verified)*
2. Project state is stored in human-editable prose and read back with `grep`, which makes the
   state machine inherently fragile. *(verified)*
3. There are zero behavioural tests for 2,750 lines of automation and 21 advertised profile
   compositions, so regressions are undetectable. *(verified)*

The strategic finding is separate and less urgent but larger in scope: the agent ecosystem
acquired native primitives for most of what this framework hand-rolls, which changes what the
project should be *for*.

### Severity index

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| [F1](#f1-the-framework-cannot-run-its-own-workflow) | Framework cannot run its own workflow | **Critical** | verified |
| [F2](#f2-prose-is-the-state-store-grep-is-the-state-machine) | Prose is the state store | **Critical** | verified |
| [F3](#f3-the-documentation-describes-a-system-that-does-not-exist) | Docs describe a system that doesn't exist | **High** | verified |
| [F4](#f4-enforcement-is-advisory) | Enforcement is advisory | **High** | verified |
| [F5](#f5-zero-tests) | Zero tests | **High** | verified |
| [F6](#f6-the-profile-system-is-mostly-empty) | Profile system is mostly empty | Medium | verified |
| [F7](#f7-duplication-with-no-reconciliation) | Duplication with no reconciliation | Medium | verified |
| [F8](#f8-agent-adapters-are-shotgunned) | Agent adapters are shotgunned | Medium | verified |
| [F9](#f9-distribution-and-upgrade-friction) | Distribution and upgrade friction | Medium | inferred |
| [F10](#f10-the-ecosystem-moved) | Reimplements native platform features | Strategic | verified |

---

## 3. What the framework gets right

Stated first, because the critique below is harsh and it would be misleading without this.

- **The artifact sequence is correct.** `requirements.md` → `design.md` → `tasks.md` with an
  approval gate between each is sound methodology, and forcing one artifact at a time is the right
  constraint on an eager agent.
- **The spec-lifecycle gate is a genuinely good check.** `doctor.sh` failing when `design.md`
  exists without an approved `requirements.md` catches process-skipping structurally rather than
  by asking nicely. This is the strongest idea in the codebase.
- **Machine-readable convention as a single source of truth.** `memory/rules/spec-naming.md`
  carries a `Regex:` line that both `doctor.sh` and `phase.sh` parse. One place to change, tooling
  follows. This pattern should be used far more widely than it currently is.
- **Non-destructive installs.** `setup.sh` preserves existing agent entrypoints (`KEEP`) and backs
  up a pre-existing pre-commit hook to `.bak`. Respectful of the user's repo.
- **Cross-agent portability is a real differentiator.** Most comparable tooling is single-vendor.
  Keeping `.sdd/` canonical and agent-neutral is a defensible strategic choice, and it is the
  right one.

---

## 4. Findings

### F1 — The framework cannot run its own workflow

**Severity: Critical · verified**

`AGENTS.md` lists as a non-negotiable: *"You MUST run phase sprint hooks
(`bash .sdd/scripts/phase.sh start <phase>` …)"*. That path does not exist in this repository.

```
$ ls -d .sdd/scripts
ls: .sdd/scripts: No such file or directory
```

`.sdd/scripts/` is only created in *consumer* projects, by `setup.sh:198-203`. Yet it is hardcoded
in 18 places across `AGENTS.md`, `README.md`, `docs/cli-reference.md`, `docs/architecture.md`,
`docs/process-flows.md`, `.sdd/AGENT_ONBOARDING.md`, `skills/sdd-workflow/SKILL.md`, and four
files under `defaults/`. Every one of those commands fails here.

Worse, the runner is broken independently of the path problem:

```
$ bash scripts/phase.sh status
❌ Error: Active tasks.md not found at
   '.../.sdd/specs/active/Phase 002 - Skills Management/tasks.md'
```

`active-context.md` stores the phase *title* (`Phase 002 - Skills Management`) where `phase.sh`
expects the *folder name* (`phase-002-skills-management`), and it uses that string directly as a
directory path. `status`, `task`, and `finish` are all non-functional.

There is corroborating evidence that this has never worked: the phase that *built* `phase.sh`
shipped in v1.3.0, yet its `tasks.md` still shows every task as `[ ]` and it was never archived.
Nobody has completed a sprint using the sprint runner.

This directly violates Article I (Dogfooding) of `.sdd/memory/constitutional-framework.md`.

**Why it matters:** the first thing any agent does on entering this repo is read `AGENTS.md` and
run a command that fails. First-run experience is a broken command.

---

### F2 — Prose is the state store, `grep` is the state machine

**Severity: Critical · verified**

This is the root cause from which most other defects follow. There is no state file. Every piece
of workflow state is embedded in human-readable narrative markdown and recovered with pattern
matching:

| State | Storage | Retrieval |
|---|---|---|
| Active phase | `**Current Phase:**` line in `active-context.md` | `grep` + `sed`, used as a **path** |
| Approval | prose line with emoji | `grep -qi "status:.*approved"` |
| Task identity | checkbox line text | `grep -F` substring, **first match wins** |
| Progress | `### Phase N` + `- **Status:**` | line-by-line rewrite |

Consequences, each independently verified:

- **Any human edit to `active-context.md` breaks the runner** (F1).
- **Approval is unforgeable only by convention.** The literal string `status: approved` anywhere in
  the file satisfies the gate. Conversely, a valid approval phrased differently fails it.
- **Task addressing is ambiguous.** `tasks-template.md` defines no stable IDs — headings are
  `**Task [N]-1: …**` — so `phase.sh task` relies on the caller guessing a unique substring.
- **The progress-tracker update silently no-ops.** `phase.sh` targets a `### Phase N` heading
  followed by `- **Status:**`; this repo's `progress-tracker.md` uses a markdown table. The write
  succeeds, changes nothing, and reports success.

Silent no-op is the worst failure mode here: the tool reports having updated state it did not
update.

**Fix direction:** a single machine-readable `.sdd/state.json` as the source of truth, with
markdown as a *rendering* of state. This is a prerequisite for any reliable automation, hook, or CI
gate, because all of those need to read state deterministically.

---

### F3 — The documentation describes a system that does not exist

**Severity: High · verified**

Beyond F1's phantom `.sdd/scripts/` path:

- **`validate-spec.cjs` (244 LOC) is invoked by nothing.** Documented in `cli-reference.md:111-127`
  and diagrammed in `process-flows.md:139`. Grep across all `.sh`, `.json`, and `.yml` files:
  `NOT INVOKED BY ANY SCRIPT`. Its privacy/PII, threat-model, and MLOps checks only run if a human
  types the command manually. Nearly a tenth of the codebase is dead automation.
- **`after-task.md:15` instructs `bash tests/validate-profiles.sh`.** There is no `tests/`
  directory. The file is `scripts/validate-profiles.sh`.
- **`before-task.md:9-11` points at `specs/phases/phase-1/*`** — a location outside the three
  contract directories, which no validator checks.
- **`architecture.md:97` says modifier amendments append to `.sdd/constitution.md`.** The code
  appends to `memory/constitutional-framework.md` (`setup.sh:~320-342`).
- **`AGENT_ONBOARDING.md:24` tells agents to read `.sdd/constitution.md`.** It does not exist in
  this repo; agents fall through to a legacy escape hatch.

**Why it matters:** for an agent-facing tool, documentation *is* the API. An agent cannot tell a
stale instruction from a live one, so it follows the broken one confidently. Doc drift here is not
cosmetic; it is a functional defect.

---

### F4 — Enforcement is advisory

**Severity: High · verified**

The framework's language is imperative — MUST, non-negotiable, STOP — but the mechanisms are
mostly suggestions.

```
$ grep -c 'WARNINGS=$((WARNINGS+1))' scripts/doctor.sh   → 20
$ grep -c 'ERRORS=$((ERRORS+1))'     scripts/doctor.sh   → 11
```

Nearly two-thirds of `doctor.sh` findings cannot fail a run. Specifically:

- **`phase.sh start` approval checks are warnings** (`phase.sh:118-127`). A sprint can begin on
  unapproved drafts; the tool prints `⚠️` and proceeds.
- **`phase.sh start` discards doctor output** entirely (`> /dev/null 2>&1`) and treats failure as a
  warning.
- **The pre-commit hook is the only real gate, and it is weak.** Installed into `.git/hooks/`, so
  it is not committed, not shared via `core.hooksPath`, bypassable with `--no-verify`, and
  **self-disables with a warning** if it cannot locate the scripts.
- **There is no CI.** `.github/` contains only `copilot-instructions.md`; no `workflows/`.

The one genuinely blocking gate is `phase.sh finish` refusing to complete with open tasks. That is
also the easiest to sidestep by simply not running `finish`.

**Net effect:** compliance is voluntary. For a governance framework, that is close to a
contradiction in terms.

---

### F5 — Zero tests

**Severity: High · verified**

2,750 lines of automation, 11 scripts, 21 advertised profile compositions, and no behavioural test
of any kind.

`validate-profiles.sh` is sometimes mistaken for a test suite. It is a **structure linter** — it
checks that each profile directory has a `README.md` with the required YAML frontmatter keys. It
never runs `setup.sh`, never inspects an installed tree, never asserts on composition output.

So the central promise of the product — that `web+devsecops` produces a correct overlay — has
never been mechanically verified. `after-task.md` asks a human to manually test four compositions
and points at a test file that does not exist (F3).

**Minimum viable fix:** a shell test that runs `setup.sh --profile <composition> --yes` into a
temp directory for each of the highest-value compositions and asserts on the resulting file tree.
This is a few hundred lines of bash and would have caught F1, F2's no-op, and F6.

---

### F6 — The profile system is mostly empty

**Severity: Medium · verified**

Profile composition is the headline feature — 7 bases × 3 modifiers, advertised as 21+
compositions. The actual differentiating payload:

| Profile | Files |
|---|---|
| `general` (the default) | **1** |
| `full-stack` | 3 |
| `api`, `cli`, `mobile`, `web`, `devops` | 4 |
| `devsecops` | 6 |
| `mlops` | 8 |
| `monorepo` | 21 |

The `general` profile — the baseline every user gets by default — consists of exactly one file,
`README.md`. It contributes no templates and no rules. `monorepo` is the only substantial profile
and is a clear outlier.

The combinatorial framing therefore oversells: 21 compositions built from overlays of ~4 files
create an impression of depth that the content does not support, while imposing full combinatorial
test burden (F5) and real cognitive cost on users choosing between them.

**Fix direction:** either invest in profile content, or collapse to two or three real profiles and
drop the combinatorial framing. The current position gets the costs of both approaches and the
benefits of neither.

---

### F7 — Duplication with no reconciliation

**Severity: Medium · verified**

- `AGENT_ONBOARDING.md` exists twice — repo root and `.sdd/` — byte-identical at 5,766 bytes, kept
  in sync by hand.
- `sdd-workflow/SKILL.md` exists twice — `skills/` and `defaults/skills/`.
- `defaults/` and `.sdd/` have drifted: `memory/glossary.md` and `memory/rules/file-placement.md`
  exist in `defaults/` but not `.sdd/`; `templates/spec-template.md` exists in `.sdd/` but not
  `defaults/`.
- The same command is documented two different ways in one release: `SKILL.md:53` says
  `bash .sdd/scripts/scan-strays.sh`, `AGENT_ONBOARDING.md:127` says `bash scripts/scan-strays.sh`.

No command reconciles any of this. There is no `sync` or drift check.

**The related smell:** `doctor.sh:59-62` defines an `IS_FRAMEWORK` escape hatch that downgrades
roughly ten missing-artifact errors to warnings when it detects it is running inside the framework
repo. The validator has been taught to overlook the failings of the repository it lives in. That is
how F1 survived to a tagged release — the tool that exists to catch this class of problem was
explicitly configured not to.

---

### F8 — Agent adapters are shotgunned

**Severity: Medium · verified**

`setup.sh install_agent_entrypoints()` writes all five entrypoints unconditionally — `AGENTS.md`,
`CLAUDE.md`, `GEMINI.md`, `.gemini/GEMINI.md`, `.github/copilot-instructions.md` — with no
detection of what the user actually runs. `skills.sh` mirrors skills into four more directories on
the same all-or-nothing basis:

```
scripts/skills.sh:54-57
  codex)   .agents/skills
  claude)  .claude/skills
  copilot) .github/skills
  gemini)  .gemini/skills
```

Three problems. First, a Claude user gets Gemini and Copilot files they will never open. Second,
`.gitignore` ignores `.gemini/` and `.claude/` while `setup.sh` installs `.gemini/GEMINI.md` and
`doctor.sh:213` warns when it is missing — the installer and the validator disagree with the ignore
rules. Third, **Kiro is not supported at all**: no target in `skills.sh`, no steering, no hooks.

Note also that `AGENTS.md` is now read natively by Kiro, Cursor, Copilot, and Codex. The universal
baseline is one file, not five, which makes most of the shotgunning unnecessary rather than merely
untidy.

**Fix direction:** self-describing adapter bundles under `defaults/adapters/<agent>/` with an
`adapter.json` declaring detection signals, plus a `scripts/agents.sh detect|install|sync`. Default
install becomes `.sdd/` + `AGENTS.md`; everything else is opt-in. Critically, adapters must contain
**zero logic** — enforcement stays in `.sdd/scripts/` so it works in CI and with no agent at all.

---

### F9 — Distribution and upgrade friction

**Severity: Medium · inferred**

Installation is: clone the framework into a sibling `.sdd-framework/` directory, then run a bash
script. Consequences:

- **No version pinning.** `git clone` takes whatever `master` is. A consumer cannot express "I use
  SDD 1.3".
- **No upgrade path.** `migrate-structure.sh` normalises legacy layouts, but there is no
  `sdd upgrade` that moves a project from 1.2 to 1.3.
- **The framework clone is a permanent artifact** in the consumer's tree, or it is deleted and the
  scripts in `.sdd/scripts/` become an unversioned fork.
- **Bash-only** means Windows support depends on WSL or Git Bash; several patterns in use
  (`grep -oE`, process substitution) are not portable to PowerShell.

**Fix direction:** publish as an installable package with a pinnable version. The Agent Plugins
1.0 standard is the strongest current option — one manifest installs across Kiro, Cursor, Copilot,
VS Code, and Codex, which matches the project's cross-agent positioning.

---

### F10 — The ecosystem moved

**Severity: Strategic · verified**

The framework was designed when the only integration point with an agent was a markdown file at
repo root. That assumption no longer holds. Most SDD concerns now have native equivalents:

| SDD concern | This framework | Native equivalent |
|---|---|---|
| Always-read rules | `AGENTS.md` + onboarding prose | steering with `inclusion: always` |
| before/during/after-task rules | checklists nothing enforces | `PreTaskExec` / `PostTaskExec` hooks |
| "STOP and wait for approval" | agent honour system | `PreTaskExec` hook, exit 2 **blocks** |
| Quality gate | bypassable local git hook | `Stop` hook block decision, CI |
| Skills | root `skills/`, hand-synced to 4 dirs | native skills directory, slash commands |
| Profile overlays | rsync file copies | conditional steering (`fileMatch`, `auto`) |
| Distribution | clone a sibling directory | Agent Plugins manifest |

The sharpest instance: `phase.sh task <id> doing` exists **only because there was no event to
hook**. Platforms now fire events around every spec task. The framework is simulating an event loop
in prose instructions that an agent must remember to follow.

**This is not an argument to become Kiro-specific.** Two empirical results from testing bound the
design:

1. **Hooks do not activate until the next session start** (verified: a probe hook created
   mid-session never fired). So no agent-native hook can be a load-bearing gate — it can only
   accelerate one. Enforcement must stay universal.
2. **A symlink bridge works.** Reading *and* writing through
   `.kiro/specs/<phase>` → `.sdd/specs/active/<phase>` both resolve to the canonical file
   (verified). A platform's native spec UI can be pointed at `.sdd/` without `.sdd/` ceding
   ownership.

Together these support the correct layering: **`.sdd/` owns state and enforcement; adapters
translate native events into calls against it.** The framework's differentiator becomes being the
portable, enforceable substrate *underneath* every vendor's native tooling — not a competitor to it.

---

## 5. Improvement roadmap

Sequenced by dependency, not by appeal. Each tier is independently shippable.

### Tier 0 — Make it true *(smallest, highest urgency)*
Resolve the gap between what the docs claim and what runs. Fixes F1, F3, and the F4 CI gap.

1. Fix the `active-context` → spec-folder coupling so `status`/`task`/`finish` work.
2. Resolve the `.sdd/scripts/` contradiction across all 18 references.
3. Fix the `progress-tracker.md` silent no-op.
4. Wire `validate-spec.cjs` into `doctor.sh`.
5. Add CI so enforcement is not only a bypassable local hook.
6. Retire the `IS_FRAMEWORK` escape hatch, or scope it to genuinely framework-only artifacts.

### Tier 1 — Make state machine-readable *(prerequisite for everything after)*
Fixes F2, unblocks reliable automation.

1. `.sdd/state.json` as the single source of truth; markdown renders from it.
2. Stable task IDs in `tasks-template.md`.
3. `phase.sh new <phase>` to scaffold a spec from templates.
4. `phase.sh approve <requirements|design|tasks>` so approval is a typed transition, not a
   hand-edited emoji string.

### Tier 2 — Test it *(fixes F5)*
1. Composition tests: install each high-value profile into a temp dir, assert on the tree.
2. Lifecycle test: `new` → `approve` → `start` → `task` → `finish` end-to-end.
3. Run both in the CI added in Tier 0.

### Tier 3 — Adapter architecture *(fixes F8, enables F10 without lock-in)*
1. `defaults/adapters/<agent>/adapter.json` with declared detection signals.
2. `scripts/agents.sh detect|list|install|remove|sync`.
3. `.sdd/adapters.json` records installed adapters; `doctor.sh` reports drift (also fixes F7).
4. Build the Kiro adapter first — steering, hooks, and a spec bridge — as the reference
   implementation.

### Tier 4 — Distribution *(fixes F9)*
1. Agent Plugins `plugin.json` manifest.
2. Versioned releases with an `upgrade` path.

### Deferred decision — profile strategy *(F6)*
Invest in profile content or collapse to two or three. Worth deciding before Tier 2, since it
determines how large the composition test matrix needs to be.

---

## 6. Open decisions

These need a human call; they are not technical unknowns.

1. **Profile strategy** (F6) — deepen or collapse?
2. **`specs/phases/phase-1/`** — currently outside the contract directories and unvalidated.
   Move to `archive/`? It would need renaming to satisfy the naming regex, which rewrites published
   paths.
3. **Private working specs as a product feature** — `active/` and `backlog/` are now gitignored in
   *this* repo, but `setup.sh` gives consumer projects no equivalent protection. Should it?
4. **`.sdd/scripts/` resolution strategy** — commit it, or introduce a path resolver? Affects 18
   references and the consumer self-containment story.
5. **Stale `phase-002`** — its work shipped in v1.3.0 but the spec was never finished or archived.
   Close it out retroactively, or leave it as evidence of F1?

---

## 7. Metrics appendix

| Metric | Value |
|---|---|
| Automation LOC (`scripts/`, 11 files) | 2,750 |
| Of which never invoked (`validate-spec.cjs`) | 244 (9%) |
| Behavioural tests | 0 |
| Markdown files | 125 |
| Shell + JS files | 11 |
| Repo files that are markdown | 92% |
| `doctor.sh` non-blocking warnings | 20 |
| `doctor.sh` blocking errors | 11 |
| Advertised profile compositions | 21+ |
| Files in the default (`general`) profile | 1 |
| Hardcoded references to the missing `.sdd/scripts/` | 18 |
| Agent entrypoints installed unconditionally | 5 |
| Agent skill directories synced unconditionally | 4 |
| CI workflows | 0 |

The headline ratio — **92% of files are markdown** — is the framework's character in one number. It
is a documentation convention with a CLI attached, and the CLI is the part that has gone untested
and undermaintained. The methodology is the asset; the tooling has not yet earned the same trust.
