#!/usr/bin/env bash
# Delivery metrics: task timestamps, delivery-field check, Kiro usage attribution and the
# three-way report. Uses a fake Kiro sessions directory; nothing real is read.

source "$(dirname "${BASH_SOURCE[0]}")/lib/assert.sh"

FRAMEWORK_ROOT="${FRAMEWORK_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

if ! command -v node >/dev/null 2>&1; then
    start_test "delivery metrics need node"
    _pass "node unavailable; skipped"
    finish_test_file
    exit 0
fi

sandbox=$(make_sandbox)
register_sandbox "$sandbox"
sessions=$(mktemp -d)
register_sandbox "$sessions"

(
    cd "$sandbox" || exit 1
    bash "$FRAMEWORK_ROOT/scripts/setup.sh" --profile general --yes --no-agent-files
) >/dev/null 2>&1

phase="$sandbox/.sdd/scripts/phase.sh"
metrics="$sandbox/.sdd/scripts/metrics.cjs"
spec="$sandbox/.sdd/specs/active/phase-002-metrics-proof"
export KIRO_SESSIONS_DIR="$sessions"

# ------------------------------------------------------------------------------
start_test "setup installs rates and profile without overwriting edits"
# ------------------------------------------------------------------------------

assert_file "$sandbox/.sdd/metrics/rates.json" "rates.json installed"
assert_file "$sandbox/.sdd/metrics/profile.json" "profile.json installed"
assert_file "$sandbox/.sdd/memory/rules/delivery-process.md" "delivery rules installed"
assert_file "$sandbox/.sdd/templates/delegation-brief-template.md" "brief template installed"
sed -i.bak 's/"hourly_rate_usd": 75/"hourly_rate_usd": 100/' "$sandbox/.sdd/metrics/profile.json" && rm -f "$sandbox/.sdd/metrics/profile.json.bak"
( cd "$sandbox" && bash "$FRAMEWORK_ROOT/scripts/setup.sh" --upgrade --yes --no-agent-files ) >/dev/null 2>&1
assert_contains "$sandbox/.sdd/metrics/profile.json" '"hourly_rate_usd": 100' "upgrade keeps the project's profile edit"

# ------------------------------------------------------------------------------
start_test "task status changes are timestamped"
# ------------------------------------------------------------------------------

( cd "$sandbox" && bash "$phase" new phase-002-metrics-proof && bash "$phase" approve requirements && bash "$phase" approve design ) >/dev/null 2>&1
# Give the generated tasks the delivery fields (T002.1 complete, T002.2 missing everything).
node -e '
const fs=require("fs"); const f=process.argv[1];
let s=fs.readFileSync(f,"utf8");
// Fill the delivery fields of T002.1 only (the template ships them as placeholders).
const i=s.indexOf("**[T002.1]**"), j=s.indexOf("**[T002.2]**");
let block=s.slice(i,j)
  .replace(/\*\*Executor:\*\*.*/, "**Executor:** Haiku")
  .replace(/\*\*Risk:\*\*.*/, "**Risk:** high")
  .replace(/\*\*Human estimate:\*\*.*/, "**Human estimate:** 2/4/8 h")
  .replace(/\*\*Time budget:\*\*.*/, "**Time budget:** 45 min");
fs.writeFileSync(f, s.slice(0,i)+block+s.slice(j));' "$spec/tasks.md"
( cd "$sandbox" && bash "$phase" approve tasks && bash "$phase" start phase-002-metrics-proof ) >/dev/null 2>&1
( cd "$sandbox" && bash "$phase" task T002.1 doing ) >/dev/null 2>&1
sleep 1
( cd "$sandbox" && bash "$phase" task T002.1 done ) >/dev/null 2>&1
assert_file "$sandbox/.sdd/metrics/tasks.tsv" "tasks.tsv written"
assert_contains "$sandbox/.sdd/metrics/tasks.tsv" 'phase-002-metrics-proof	T002.1	doing' "doing recorded"
assert_contains "$sandbox/.sdd/metrics/tasks.tsv" 'phase-002-metrics-proof	T002.1	done' "done recorded"

# ------------------------------------------------------------------------------
start_test "check warns only from required_from_phase, and fails under --strict"
# ------------------------------------------------------------------------------

out=$(cd "$sandbox" && node "$metrics" check 2>&1)
assert_eq "OK   delivery fields present where required" "$out" "no requirement is set by default"
sed -i.bak 's/"required_from_phase": null/"required_from_phase": 2/' "$sandbox/.sdd/metrics/profile.json" && rm -f "$sandbox/.sdd/metrics/profile.json.bak"
out=$(cd "$sandbox" && node "$metrics" check 2>&1)
case "$out" in
    *"WARN phase-002-metrics-proof T002.2"*) _pass "task without fields is warned about" ;;
    *) _fail "task without fields is warned about" "$out" ;;
esac
case "$out" in
    *"T002.1:"*) _fail "complete task is not warned about" "$out" ;;
    *) _pass "complete task is not warned about" ;;
esac
assert_exit 1 "--strict fails" bash -c "cd '$sandbox' && node '$metrics' check --strict"

# ------------------------------------------------------------------------------
start_test "usage attributes credits and estimates tokens inside the task window"
# ------------------------------------------------------------------------------

node -e '
const fs=require("fs"), path=require("path");
const [dir, root] = process.argv.slice(1);
const tasks = fs.readFileSync(root + "/.sdd/metrics/tasks.tsv","utf8").trim().split("\n").slice(1).map(l=>l.split("\t"));
const start = Date.parse(tasks.find(r=>r[3]==="doing")[0]);
const end = Date.parse(tasks.find(r=>r[3]==="done")[0]);
const mid = new Date((start+end)/2).toISOString();
const sess = path.join(dir, "h1", "sess_child");
fs.mkdirSync(sess, {recursive:true});
fs.writeFileSync(sess+"/session.json", JSON.stringify({id:"sess_child", modelId:"claude-haiku-5.5", workspacePaths:[root], createdAt:new Date(start+1).toISOString(), lastModifiedAt:mid}));
const ev=(t,p)=>JSON.stringify({id:"x",timestamp:t,payload:p});
const lines=[
 ev(mid,{type:"session_start",content:"s".repeat(4000)}),
 ev(mid,{type:"user",content:"u".repeat(4000)}),
 ev(mid,{type:"assistant",content:"a".repeat(2000)}),
 ev(mid,{type:"tool_call",args:{c:"b".repeat(400)}}),
 ev(mid,{type:"tool_result",content:"r".repeat(8000)}),
 ev(mid,{type:"assistant",content:"d".repeat(1000)}),
 ev(mid,{type:"usage_summary",promptTurnSummaries:[{unit:"credit",usage:1.5}],elapsedTime:60000}),
];
fs.writeFileSync(sess+"/messages.jsonl", lines.join("\n")+"\n");
// A session from another project must be ignored.
const other = path.join(dir,"h1","sess_other"); fs.mkdirSync(other,{recursive:true});
fs.writeFileSync(other+"/session.json", JSON.stringify({id:"sess_other", modelId:"claude-haiku-5.5", workspacePaths:["/somewhere/else"], createdAt:mid, lastModifiedAt:mid}));
fs.writeFileSync(other+"/messages.jsonl", lines.join("\n")+"\n");
' "$sessions" "$sandbox"
( cd "$sandbox" && bash "$phase" usage phase-002-metrics-proof ) >"$sandbox/usage.out" 2>&1
assert_eq "0" "$?" "usage runs"
assert_file "$sandbox/.sdd/metrics/usage.tsv" "usage.tsv written"
assert_contains "$sandbox/.sdd/metrics/usage.tsv" 'T002.1	child	sess_child	claude-haiku-5.5	1.500' "child session credits attributed"
assert_not_contains "$sandbox/.sdd/metrics/usage.tsv" 'sess_other' "other project's session ignored"

# ------------------------------------------------------------------------------
start_test "report shows human, used and comparison rows; pricing follows rates.json"
# ------------------------------------------------------------------------------

( cd "$sandbox" && bash "$phase" report phase-002-metrics-proof --write ) >"$sandbox/report.out" 2>&1
assert_eq "0" "$?" "report runs"
assert_contains "$sandbox/report.out" '\| Human developer \|' "human row"
assert_contains "$sandbox/report.out" 'Used: low-capability model' "used row"
assert_contains "$sandbox/report.out" 'Not used: claude-opus-5.5' "comparison row"
assert_file "$sandbox/.sdd/reports/phase-002-metrics-proof/delivery-report.md" "report written"
assert_file "$sandbox/.sdd/metrics/report.json" "report.json written for the dashboard"
# 2/4/8 h => PERT 4.33 h; at $100/h => $433.33
cat "$sandbox/report.out" >&2
assert_contains "$sandbox/report.out" '\$433.33' "human cost uses PERT estimate and the edited rate"
node -e '
const r=require(process.argv[1]); const row=r.phases[0].rows.find(x=>x.id==="T002.1");
// Opus 5.5 output is 40x Haiku 5.5 output, so the comparison cost must exceed the used cost.
if(!(row.child.usd>0 && row.child.usd_cmp>row.child.usd*10)) { console.error(JSON.stringify(row.child)); process.exit(1); }
' "$sandbox/.sdd/metrics/report.json"
assert_eq "0" "$?" "comparison model costs more than the used model for the same tokens"

# ------------------------------------------------------------------------------
start_test "approve passes the phase argument through"
# ------------------------------------------------------------------------------

( cd "$sandbox" && bash "$phase" new phase-003-approve-arg ) >/dev/null 2>&1
( cd "$sandbox" && bash "$phase" approve requirements phase-003-approve-arg ) >/dev/null 2>&1
assert_contains "$sandbox/.sdd/specs/active/phase-003-approve-arg/requirements.md" '^\*\*Status:\*\*.*APPROVED' "named phase approved without selecting it first"

finish_test_file
