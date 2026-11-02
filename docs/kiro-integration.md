# Kiro Native Integration

The SDD Framework integrates seamlessly with Kiro's native features through a thin adapter layer that preserves universal agent neutrality while providing Kiro-specific acceleration when available.

---

## Architecture Philosophy

**Core Principle:** `.sdd/` remains canonical and agent-neutral. Kiro features accelerate but never own the workflow.

```
Layer 1 (Universal)        Layer 2 (Kiro Native)       Layer 3 (Enforcement)
-------------------        ----------------------      ------------------
.sdd/constitution.md  →    .kiro/steering/            CLI validation
.sdd/specs/active/    ←→   .kiro/specs/ (symlinks)    + Kiro hooks
.sdd/memory/          →    .kiro/hooks/               = Dual enforcement
phase.sh lifecycle    →    pre/post-task-exec         Graceful degradation
```

**Graceful Degradation:** All CLI tools work without Kiro. Hooks add enforcement but don't block portability.

---

## Installation

### Automatic (Recommended)

```bash
# Install with Kiro profile
bash scripts/setup.sh --profile general+kiro --yes
```

This automatically:
1. Detects Kiro environment (env vars, directories, executables)
2. Installs adapter files to `defaults/adapters/kiro/`
3. Symlinks to `.kiro/hooks/` and `.kiro/steering/`
4. Registers "kiro" as a valid modifier

### Manual Installation

If you've already run setup without `+kiro`:

```bash
# Add kiro to existing installation
bash scripts/setup.sh --profile <your-base-profile>+kiro --yes
```

### Verification

```bash
# Check hooks are installed
ls -la .kiro/hooks/

# Check steering is active
ls -la .kiro/steering/

# Verify symlinks created
ls -la .kiro/specs/
```

---

## Features

### 1. Conditional Steering (Auto-Loading Instructions)

**File:** `.kiro/steering/sdd-framework.md`

```yaml
---
inclusion: auto
fileMatchPattern: ".sdd/specs/active/**"
---
```

**Behavior:**
- Kiro agents automatically load SDD Framework instructions when working with specs
- Only activates when `.sdd/specs/active/` files are open
- No manual skill activation required

**How It Works:**
- Kiro's `fileMatchPattern` watches for spec file access
- Steering content loads on-demand into agent context
- Instructions guide agents to use `phase.sh` lifecycle hooks

### 2. Lifecycle Hooks (Automated Enforcement)

**Location:** `.kiro/hooks/`

#### Pre-Task Execution Hook
**File:** `.kiro/hooks/pre-task-exec.sh`

**Triggers:** Before any task execution in Kiro

**Actions:**
1. Checks task is approved in `tasks.md`
2. Validates `phase.sh` state consistency
3. **Blocks execution (exit 2)** if unapproved
4. Calls `phase.sh task <id> doing` on approval

**Exit Codes:**
- `0` - Task approved, proceed
- `2` - Task blocked (unapproved or invalid state)
- Other - Silent fail (hook error, fallback to CLI validation)

#### Post-Task Execution Hook
**File:** `.kiro/hooks/post-task-exec.sh`

**Triggers:** After successful task completion in Kiro

**Actions:**
1. Records completion timestamp
2. Calls `phase.sh task <id> done`
3. Updates active context with next ready task
4. Logs evidence trail

**Exit Codes:**
- `0` - Completion recorded
- Other - Silent fail (task remains in Kiro as completed)

#### Session Stop Hook
**File:** `.kiro/hooks/session-stop.sh`

**Triggers:** When Kiro session ends

**Actions:**
- Suggests session summary in `.sdd/memory/session-logs/`
- Reminds agent to commit evidence

**Exit Codes:**
- `0` - Suggestion displayed
- Other - Silent fail

### 3. Bidirectional Symlink Bridge

**Purpose:** Allow both `.sdd/` and `.kiro/` paths to access the same specs

**Structure:**
```
.sdd/specs/active/phase-001/requirements.md  (canonical)
                           ↕
.kiro/specs/phase-001/requirements.md         (symlink)
```

**Created By:** `phase.sh start <phase-name>`

**Cleaned By:** `phase.sh archive <phase-name>`

**Benefits:**
- Kiro UI shows specs in native location
- CLI tools use canonical `.sdd/` paths
- No duplication, single source of truth

### 4. Kiro Detection Logic

**Detection Signals** (checked in order):

1. **Environment Variables:**
   - `KIRO_SESSION`
   - `KIRO_WORKSPACE_ROOT`
   - `ORCA_CLI_COMMAND` (Kiro internal)

2. **Directories:**
   - `.kiro/`
   - `.kiro/hooks/`
   - `.kiro/steering/`

3. **Executables:**
   - `kiro` command in PATH
   - `orca` command in PATH

**Detection Function:**
```bash
detect_kiro() {
  # Check env vars
  if [[ -n "${KIRO_SESSION:-}" ]] || [[ -n "${KIRO_WORKSPACE_ROOT:-}" ]]; then
    return 0
  fi
  
  # Check directories
  if [[ -d ".kiro" ]]; then
    return 0
  fi
  
  # Check executables
  if command -v kiro &>/dev/null || command -v orca &>/dev/null; then
    return 0
  fi
  
  return 1
}
```

---

## Usage Patterns

### Starting a Phase (with Kiro)

```bash
# Kiro session detected - hooks will fire automatically
bash .sdd/scripts/phase.sh start phase-001-user-authentication

# Agent sees steering instructions automatically when opening specs
# pre-task-exec.sh validates approvals before each task
# post-task-exec.sh records evidence after each task
```

**What Happens:**
1. `phase.sh start` creates `.kiro/specs/phase-001/` symlinks
2. Kiro steering loads when agent opens `.sdd/specs/active/phase-001/requirements.md`
3. Agent reads instructions to use `phase.sh task <id> doing` before work
4. `pre-task-exec.sh` fires, validates approval, allows execution
5. Agent completes work
6. `post-task-exec.sh` fires, records completion

### Task Execution Flow (with Hooks)

**Without Kiro (Universal):**
```bash
# Manual CLI workflow
bash .sdd/scripts/phase.sh task T001.1 doing
# ... implement task ...
bash .sdd/scripts/phase.sh task T001.1 done
```

**With Kiro (Automated):**
```
Agent Decision → pre-task-exec.sh → Approval Check → Allow/Block
                     ↓ (approved)
Agent Implementation
                     ↓
post-task-exec.sh → phase.sh task done → Evidence Logged
```

**Key Difference:** Kiro hooks automate the `phase.sh task` lifecycle calls, but CLI remains available for manual intervention.

### Session End (with Hook)

```bash
# Kiro session ends (user closes workspace or times out)
# session-stop.sh fires automatically

# Output:
# "Consider documenting this session in .sdd/memory/session-logs/"
# "Run: bash .sdd/scripts/phase.sh finish"
```

---

## Troubleshooting

### Hooks Not Firing

**Symptom:** Tasks execute without approval validation

**Check:**
```bash
# Verify hooks are executable
ls -la .kiro/hooks/
# Expected: -rwxr-xr-x (executable bit set)

# Test hook manually
bash .kiro/hooks/pre-task-exec.sh
echo $?  # Should be 0 or 2
```

**Fix:**
```bash
chmod +x .kiro/hooks/*.sh
```

### Steering Not Loading

**Symptom:** Agent doesn't follow SDD Framework instructions

**Check:**
```bash
# Verify steering file exists
cat .kiro/steering/sdd-framework.md | head -5

# Expected frontmatter:
# ---
# inclusion: auto
# fileMatchPattern: ".sdd/specs/active/**"
# ---
```

**Fix:**
```bash
# Reinstall adapter
bash scripts/setup.sh --profile general+kiro --yes
```

### Symlinks Broken

**Symptom:** `.kiro/specs/` shows "No such file or directory"

**Check:**
```bash
# List symlinks
ls -la .kiro/specs/

# Check targets exist
ls -la .sdd/specs/active/
```

**Fix:**
```bash
# Recreate symlinks
bash .sdd/scripts/phase.sh start <phase-name>

# Or manually:
ln -sf "../../.sdd/specs/active/phase-001" ".kiro/specs/phase-001"
```

### Detection Failed

**Symptom:** Setup doesn't install Kiro adapter

**Check:**
```bash
# Run detection manually
bash -c '
  if [[ -n "${KIRO_SESSION:-}" ]] || [[ -d ".kiro" ]] || command -v kiro &>/dev/null; then
    echo "Kiro detected"
  else
    echo "Kiro NOT detected"
  fi
'
```

**Fix:**
```bash
# Force installation with +kiro modifier
bash scripts/setup.sh --profile general+kiro --yes
```

---

## Compatibility Matrix

| Kiro Feature | SDD Integration | Fallback (without Kiro) |
| :--- | :--- | :--- |
| Steering (auto-load) | ✅ Conditional via `fileMatchPattern` | ⚠️ Manual skill activation |
| Hooks (lifecycle) | ✅ Automated `pre/post-task-exec` | ⚠️ Manual `phase.sh task` calls |
| Symlinks (bidirectional) | ✅ Created by `phase.sh start` | ⚠️ Not needed (CLI uses `.sdd/` directly) |
| Detection (env/dir/exe) | ✅ Multi-signal detection | N/A |
| Worktrees (Orca CLI) | ❌ Not integrated (separate tool) | N/A |

**Legend:**
- ✅ Fully integrated
- ⚠️ Degraded but functional
- ❌ Not integrated (out of scope)

---

## Design Decisions

### Why Thin Adapter (Not Deep Integration)?

**Decision:** Keep `.sdd/` as canonical source of truth, Kiro features accelerate but don't own workflow

**Rationale:**
- **Portability:** SDD Framework works with any agent platform (Claude Desktop, GitHub Copilot, cursor, windsurf, etc.)
- **Resilience:** If Kiro features change, adapter updates without touching core framework
- **Simplicity:** Hooks call existing CLI tools, no duplicate logic

**Trade-off:** Kiro-specific features (worktrees, browser, computer-use) remain manual or handled by Kiro's own skills

### Why Conditional Steering (Not Always-On)?

**Decision:** Steering only loads when working with `.sdd/specs/active/` files

**Rationale:**
- **Efficiency:** Don't load framework instructions when editing unrelated files
- **Context Budget:** Preserve token budget for actual spec content
- **Relevance:** Instructions only needed during spec-driven work

**Trade-off:** Agent must open a spec file before steering loads (acceptable—phase work always starts with reading specs)

### Why Exit Code 2 for Blocking?

**Decision:** Hooks use exit code `2` to block task execution, not `1`

**Rationale:**
- **Kiro Convention:** Exit code `2` signals "block and show error", `1` is generic failure
- **Silent Degradation:** Non-zero codes other than `2` fail silently (hook errors don't break workflow)
- **User Feedback:** Blocked tasks show clear message in Kiro UI

**Trade-off:** Requires Kiro-aware hook implementation (acceptable—hooks are Kiro-specific by definition)

### Why No Orca CLI Integration?

**Decision:** Adapter does NOT include Orca-specific commands or worktree logic

**Rationale:**
- **Separation of Concerns:** Orca is a separate orchestration tool being tested, not part of SDD Framework core
- **Scope Creep:** Integrating Orca would introduce dependencies not everyone uses
- **Agent Neutrality:** SDD Framework remains universal, works without Orca or Kiro

**Future Consideration:** If Orca becomes tightly coupled to Kiro's task execution, revisit integration

---

## Testing Checklist

Before committing the integration, verify:

- [ ] **Installation:** `bash scripts/setup.sh --profile general+kiro --yes` succeeds
- [ ] **Detection:** Setup script correctly identifies Kiro environment
- [ ] **Hooks Installed:** `.kiro/hooks/` contains 3 executable scripts
- [ ] **Steering Installed:** `.kiro/steering/sdd-framework.md` exists with correct frontmatter
- [ ] **Symlinks Created:** `phase.sh start` creates `.kiro/specs/<phase>` symlinks
- [ ] **Pre-Task Hook:** Blocks unapproved tasks (exit 2), allows approved (exit 0)
- [ ] **Post-Task Hook:** Records completion, calls `phase.sh task done`
- [ ] **Session Hook:** Displays session summary suggestion
- [ ] **Graceful Degradation:** All CLI tools work without Kiro installed
- [ ] **Documentation:** README updated, `docs/kiro-integration.md` complete

---

## Related Documentation

- **[CLI Reference](cli-reference.md)** - `phase.sh` lifecycle subcommands
- **[Architecture](architecture.md)** - Directory layout and profile composition
- **[Process Flows](process-flows.md)** - Visual diagrams of phase sprints
- **[Governance](governance.md)** - Approval rules and constitution articles

---

## Future Enhancements

**Potential Additions** (not currently planned):

1. **Kiro Task Visualization:** Display SDD task DAG in Kiro UI (requires Kiro API access)
2. **Real-Time Context Sync:** Push active context updates to Kiro sidebar (requires Kiro extension points)
3. **Evidence Viewer:** Show PBT results and evidence records in Kiro (requires Kiro plugin system)
4. **Worktree Integration:** Coordinate with Orca CLI for multi-phase parallelism (requires Orca stabilization)

These features require deeper Kiro API integration and are deferred until Kiro's extension model is documented.

---

**Last Updated:** December 2024  
**Adapter Version:** 1.0.0  
**Compatible With:** Kiro (all versions), SDD Framework 1.x
