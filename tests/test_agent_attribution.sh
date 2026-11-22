#!/usr/bin/env bash
# T008.1: Structured agent attribution at onboarding, phase start, and task transitions.

source "$(dirname "${BASH_SOURCE[0]}")/lib/assert.sh"

FRAMEWORK_ROOT="${FRAMEWORK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

if ! command -v node >/dev/null 2>&1; then
    start_test "agent attribution needs node"
    _pass "node unavailable; skipped"
    finish_test_file
    exit 0
fi

start_test "onboard, phase start, and task transitions write structured JSONL attribution"
sandbox=$(make_sandbox)
register_sandbox "$sandbox"
(
    cd "$sandbox" || exit 1
    bash "$FRAMEWORK_ROOT/scripts/setup.sh" --profile general --yes --no-agent-files >/dev/null 2>&1
    git add -A && git commit -q -m "init"
    bash .sdd/scripts/phase.sh onboard --agent "antigravity" --harness "antigravity" --model "gemini-4-neon-medium" >/dev/null
    bash .sdd/scripts/phase.sh new phase-001-demo >/dev/null
    cat > .sdd/specs/active/phase-001-demo/requirements.md <<'EOF'
# Phase 001 - Demo - Requirements

**Status:** DRAFT

## Requirements

### REQ-1.1: Demo requirement

**Acceptance Criteria:**
1. WHEN demo runs THEN output is recorded.

## Privacy & Security Model

Data Classification: Internal. PII Risk: No.
EOF
    bash .sdd/scripts/phase.sh approve requirements phase-001-demo >/dev/null
    cat > .sdd/specs/active/phase-001-demo/design.md <<'EOF'
# Phase 001 - Demo - Design

**Status:** DRAFT

## Design Overview

Simple demo design for REQ-1.1.
EOF
    bash .sdd/scripts/phase.sh approve design phase-001-demo >/dev/null
    cat > .sdd/specs/active/phase-001-demo/tasks.md <<'EOF'
# Phase 001 - Demo - Tasks

**Status:** READY TO START

## Task plan

- [ ] **[T001.1]** First task
  - **Objective and requirements:** Demo REQ-1.1.
  - **Implementation and owned outputs:** Demo output.
  - **Owned paths:** README.md.
  - **Positive and negative verification:** Checks pass and fail closed.
  - **Acceptance evidence:** `.sdd/evidence/phase-001/demo.md`.
  - **No-go conditions and handoff:** Fails if missing.
EOF
    bash .sdd/scripts/phase.sh approve tasks phase-001-demo >/dev/null
    SDD_AGENT="claude-code" SDD_HARNESS="claude" SDD_MODEL="claude-sonnet-5.5" \
        bash .sdd/scripts/phase.sh start phase-001-demo >/dev/null 2>&1
    SDD_AGENT="codex-cli" SDD_HARNESS="codex" SDD_MODEL="gpt-5-codex" \
        bash .sdd/scripts/phase.sh task T001.1 doing >/dev/null
    SDD_AGENT="codex-cli" SDD_HARNESS="codex" SDD_MODEL="gpt-5-codex" \
        bash .sdd/scripts/phase.sh task T001.1 done >/dev/null
)

EVENTS="$sandbox/.sdd/metrics/events.jsonl"
assert_contains "$EVENTS" '"event":"onboard"' "onboard event recorded"
assert_contains "$EVENTS" '"provider":"google"' "google provider inferred for gemini model"
assert_contains "$EVENTS" '"event":"phase_start"' "phase_start event recorded"
assert_contains "$EVENTS" '"agent":"claude-code"' "phase_start agent recorded"
assert_contains "$EVENTS" '"provider":"anthropic"' "anthropic provider inferred for claude model"
assert_contains "$EVENTS" '"event":"task_doing"' "task_doing event recorded"
assert_contains "$EVENTS" '"event":"task_done"' "task_done event recorded"
assert_contains "$EVENTS" '"provider":"openai"' "openai provider inferred for codex model"

start_test "omitted env vars fall back to unknown without failing"
sandbox2=$(make_sandbox)
register_sandbox "$sandbox2"
(
    cd "$sandbox2" || exit 1
    bash "$FRAMEWORK_ROOT/scripts/setup.sh" --profile general --yes --no-agent-files >/dev/null 2>&1
    unset SDD_AGENT SDD_HARNESS SDD_MODEL SDD_PROVIDER SDD_SESSION_ID || true
    bash .sdd/scripts/phase.sh onboard >/dev/null
)
EVENTS2="$sandbox2/.sdd/metrics/events.jsonl"
assert_contains "$EVENTS2" '"agent":"unknown"' "fallback agent is unknown"
assert_contains "$EVENTS2" '"model":"unknown"' "fallback model is unknown"

start_test "multi-harness adapters normalize Claude, Codex, Gemini, OpenCode sessions and compute USD rollups"
claude_dir=$(mktemp -d)
gemini_dir=$(mktemp -d)
register_sandbox "$claude_dir"
register_sandbox "$gemini_dir"

NOW_ISO="$(node -e 'console.log(new Date().toISOString())')"
cat > "$claude_dir/sess-claude.jsonl" <<EOF
{"timestamp":"$NOW_ISO","cwd":"$sandbox","message":{"model":"claude-sonnet-5.5","usage":{"input_tokens":10000,"output_tokens":2000,"cache_read_input_tokens":5000,"cache_creation_input_tokens":1000}}}
EOF
cat > "$gemini_dir/sess-gemini.json" <<EOF
{"timestamp":"$NOW_ISO","workspace":"$sandbox","model":"gemini-4-neon-medium","usageMetadata":{"promptTokenCount":20000,"candidatesTokenCount":4000,"cachedContentTokenCount":8000}}
EOF

(
    cd "$sandbox" || exit 1
    # Update tasks.tsv window to encompass NOW_ISO
    node -e '
      const fs = require("fs");
      const now = Date.now();
      const t0 = new Date(now - 60000).toISOString();
      const t1 = new Date(now + 60000).toISOString();
      fs.writeFileSync(".sdd/metrics/tasks.tsv",
        "ts\tphase\ttask\tstatus\trev\n" +
        t0 + "\tphase-001-demo\tT001.1\tdoing\tabc\n" +
        t1 + "\tphase-001-demo\tT001.1\tdone\tdef\n");
    '
    CLAUDE_SESSIONS_DIR="$claude_dir" GEMINI_SESSIONS_DIR="$gemini_dir" KIRO_SESSIONS_DIR="$sandbox/nonexistent" \
        node "$FRAMEWORK_ROOT/scripts/metrics.cjs" usage phase-001-demo >/dev/null
    node "$FRAMEWORK_ROOT/scripts/metrics.cjs" report phase-001-demo --json --write >/dev/null
)

USAGE_FILE="$sandbox/.sdd/metrics/usage.tsv"
REPORT_JSON="$sandbox/.sdd/metrics/report.json"
assert_contains "$USAGE_FILE" "claude-session" "claude adapter wrote usage row"
assert_contains "$USAGE_FILE" "gemini-session" "gemini adapter wrote usage row"
assert_contains "$REPORT_JSON" '"byModel"' "report.json includes byModel rollups"
assert_contains "$REPORT_JSON" '"claude-sonnet-5.5"' "claude-sonnet-5.5 present in rollups"
assert_contains "$REPORT_JSON" '"gemini-4-neon-medium"' "gemini-4-neon-medium present in rollups"
assert_contains "$REPORT_JSON" '"provenance": "measured"' "measured provenance preserved"

finish_test_file
