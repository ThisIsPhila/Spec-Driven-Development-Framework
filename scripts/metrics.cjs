#!/usr/bin/env node
/**
 * SDD delivery metrics: task timing, Kiro usage, and the human / actual / comparison report.
 *
 *   metrics.cjs record <phase> <task> <todo|doing|done> [rev]   append to .sdd/metrics/tasks.tsv
 *   metrics.cjs usage  <phase> [task]                           attribute Kiro session usage to task windows
 *   metrics.cjs report [phase] [--json] [--write]               print (and optionally write) the delivery report
 *   metrics.cjs check  [phase] [--strict]                       lint the delivery fields in tasks.md
 *
 * Data lives in .sdd/metrics/: tasks.tsv, usage.tsv, rates.json, profile.json (all project-owned).
 * Tokens are ESTIMATED from Kiro session logs; credits and elapsed time are measured. Every report
 * prints which numbers are measured and which are assumptions.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

// ---------------------------------------------------------------------------
// Paths and config
// ---------------------------------------------------------------------------
function repoRoot() {
  if (process.env.SDD_REPO_ROOT) return process.env.SDD_REPO_ROOT;
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return process.cwd();
  }
}
const ROOT = (() => {
  const r = repoRoot();
  try {
    return fs.realpathSync(r);
  } catch {
    return r;
  }
})();
const SDD = process.env.SDD_DIR || path.join(ROOT, '.sdd');
const METRICS = path.join(SDD, 'metrics');
const FRAMEWORK_DEFAULTS = path.resolve(__dirname, '..', 'defaults', 'metrics');
const KIRO_SESSIONS = process.env.KIRO_SESSIONS_DIR || path.join(os.homedir(), '.kiro', 'sessions');

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}
function loadConfig() {
  const pick = (name) => {
    const own = path.join(METRICS, name);
    return readJson(fs.existsSync(own) ? own : path.join(FRAMEWORK_DEFAULTS, name), {});
  };
  return { rates: pick('rates.json'), profile: pick('profile.json') };
}

const TASK_COLS = ['ts', 'phase', 'task', 'status', 'rev'];
const USAGE_COLS = ['ts', 'phase', 'task', 'role', 'session', 'model', 'credits', 'elapsed_s', 'calls', 'tokens_in', 'tokens_cache_read', 'tokens_cache_write', 'tokens_out', 'source'];

function ensureTsv(file, cols) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) fs.writeFileSync(file, cols.join('\t') + '\n');
}
function appendTsv(file, cols, row) {
  ensureTsv(file, cols);
  fs.appendFileSync(file, cols.map((c) => String(row[c] ?? '').replace(/[\t\n]/g, ' ')).join('\t') + '\n');
}
function readTsv(file) {
  if (!fs.existsSync(file)) return [];
  const [head, ...lines] = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  const cols = head.split('\t');
  return lines.map((l) => Object.fromEntries(l.split('\t').map((v, i) => [cols[i], v])));
}

// ---------------------------------------------------------------------------
// tasks.md parsing
// ---------------------------------------------------------------------------
const FIELD_RE = /^\s*-\s+\*\*(Executor|Risk|Human estimate|Time budget|Token budget)(?:\s*\([^)]*\))?:\*\*\s*(.*)$/;

function parseTasks(phaseDir) {
  const file = path.join(phaseDir, 'tasks.md');
  if (!fs.existsSync(file)) return [];
  const tasks = [];
  let cur = null;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = /^- \[([ xX/])\]\s+\*\*\[([^\]]+)\]\*\*\s*(.*)$/.exec(line);
    if (m) {
      cur = { id: m[2], title: m[3], status: m[1] === ' ' ? 'todo' : m[1] === '/' ? 'doing' : 'done', fields: {} };
      tasks.push(cur);
      continue;
    }
    if (cur) {
      const f = FIELD_RE.exec(line);
      // A value that still starts with "[" is the template placeholder, not a filled field.
      if (f && !f[2].trim().startsWith('[')) cur.fields[f[1]] = f[2].trim();
      else if (/^##\s/.test(line)) cur = null;
    }
  }
  return tasks;
}

function parseHumanEstimate(text) {
  if (!text) return null;
  const nums = (text.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  const unit = /\bd(ays?)?\b/i.test(text) ? 'd' : 'h';
  if (nums.length === 0) return null;
  let best = nums[0];
  let likely = nums[0];
  let worst = nums[0];
  if (nums.length >= 3) {
    [best, likely, worst] = nums;
  } else if (nums.length === 2) {
    [best, worst] = nums;
    likely = (best + worst) / 2;
  }
  return { best, likely, worst, unit, pert: (best + 4 * likely + worst) / 6 };
}
function parseMinutes(text) {
  if (!text) return null;
  const m = /(\d+(?:\.\d+)?)\s*(min|m|h|hr|hours?)\b/i.exec(text);
  if (!m) return null;
  return /^h/i.test(m[2]) ? Number(m[1]) * 60 : Number(m[1]);
}
function parseTokens(text) {
  if (!text) return null;
  const m = /(\d+(?:\.\d+)?)\s*([kKmM])?/.exec(text);
  if (!m) return null;
  return Number(m[1]) * (/m/i.test(m[2] || '') ? 1e6 : /k/i.test(m[2] || '') ? 1e3 : 1);
}

function phaseDirs(filter) {
  const active = path.join(SDD, 'specs', 'active');
  if (!fs.existsSync(active)) return [];
  return fs
    .readdirSync(active)
    .filter((d) => /^phase-\d+/.test(d) && (!filter || d === filter || d.startsWith(filter)))
    .sort()
    .map((d) => ({ name: d, dir: path.join(active, d), number: Number(/^phase-0*(\d+)/.exec(d)[1]) }));
}

// ---------------------------------------------------------------------------
// record
// ---------------------------------------------------------------------------
function cmdRecord([phase, task, status, rev]) {
  if (!phase || !task || !['todo', 'doing', 'done'].includes(status)) {
    console.error('usage: metrics.cjs record <phase> <task> <todo|doing|done> [rev]');
    process.exit(2);
  }
  appendTsv(path.join(METRICS, 'tasks.tsv'), TASK_COLS, { ts: new Date().toISOString(), phase, task, status, rev: rev || '' });
}

// ---------------------------------------------------------------------------
// Kiro session usage
// ---------------------------------------------------------------------------
function sessionMatchesProject(meta) {
  const real = (p) => {
    try {
      return fs.realpathSync(p);
    } catch {
      return p;
    }
  };
  const paths = [...(meta.workspacePaths || []), ...(meta.rootPaths || [])].map(real);
  const base = path.basename(ROOT);
  return paths.some((p) => p === ROOT || p.startsWith(ROOT + path.sep) || p.includes(`${path.sep}worktrees${path.sep}${base}${path.sep}`));
}

function contentChars(payload) {
  const c = payload.content ?? payload.args ?? payload.result ?? payload.output ?? payload;
  return typeof c === 'string' ? c.length : JSON.stringify(c).length;
}

/** Parses one session into time-ordered events and per-call records. */
function loadSession(dir, cfg) {
  const meta = readJson(path.join(dir, 'session.json'), null);
  if (!meta || !sessionMatchesProject(meta)) return null;
  const file = path.join(dir, 'messages.jsonl');
  if (!fs.existsSync(file)) return null;
  const { chars_per_token: cpt, tokenizer_factor: tf, context_cap_tokens: cap } = cfg.profile.tokens;
  const toTok = (chars) => (chars / cpt) * tf;
  const calls = []; // {t, ctx, delta, out}
  const credits = []; // {t, v, elapsed}
  let ctx = 0;
  let lastCallCtx = 0;
  let needCall = true;
  let open = null;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line) continue;
    let d;
    try {
      d = JSON.parse(line);
    } catch {
      continue;
    }
    const p = d.payload || {};
    const t = Date.parse(d.timestamp);
    switch (p.type) {
      case 'session_start':
      case 'steering_inclusion':
      case 'user':
      case 'agent_note':
        ctx += toTok(contentChars(p));
        needCall = true;
        break;
      case 'tool_result':
        ctx += toTok(contentChars(p));
        needCall = true;
        break;
      case 'assistant':
      case 'tool_call': {
        if (needCall) {
          const c = Math.min(ctx, cap);
          open = { t, ctx: c, delta: Math.max(0, c - lastCallCtx), out: 0 };
          calls.push(open);
          lastCallCtx = c;
          needCall = false;
        }
        const o = toTok(contentChars(p));
        if (open) open.out += o;
        ctx += o;
        break;
      }
      case 'usage_summary':
        for (const s of p.promptTurnSummaries || []) credits.push({ t, v: s.usage || 0, elapsed: (p.elapsedTime || 0) / 1000 });
        break;
      default:
    }
  }
  return {
    id: meta.id,
    model: meta.modelId,
    createdAt: Date.parse(meta.createdAt),
    lastModifiedAt: Date.parse(meta.lastModifiedAt),
    calls,
    credits,
  };
}

function loadSessions(cfg) {
  if (!fs.existsSync(KIRO_SESSIONS)) return [];
  const out = [];
  for (const h of fs.readdirSync(KIRO_SESSIONS)) {
    const hd = path.join(KIRO_SESSIONS, h);
    if (!fs.statSync(hd).isDirectory()) continue;
    for (const s of fs.readdirSync(hd)) {
      if (!s.startsWith('sess_')) continue;
      const loaded = loadSession(path.join(hd, s), cfg);
      if (loaded) out.push(loaded);
    }
  }
  return out;
}

function usageInWindow(sess, from, to) {
  const calls = sess.calls.filter((c) => c.t >= from && c.t <= to);
  const cr = sess.credits.filter((c) => c.t >= from && c.t <= to);
  return {
    calls,
    credits: cr.reduce((a, c) => a + c.v, 0),
    elapsed_s: cr.reduce((a, c) => a + c.elapsed, 0),
  };
}

/** Cost in USD of a list of calls on one model. Returns tokens and cost. */
function priceCalls(calls, model, cfg) {
  const r = cfg.rates.models[model];
  if (!r) return null;
  const cache = cfg.profile.caching.assume_prompt_caching;
  let tin = 0, tread = 0, twrite = 0, tout = 0, usd = 0;
  let prev = 0;
  for (const c of calls) {
    const long = r.long_prompt_tokens && c.ctx > r.long_prompt_tokens;
    const rate = (k) => (long && r['long_' + k] !== undefined ? r['long_' + k] : r[k]);
    if (cache) {
      const read = Math.min(prev, c.ctx);
      const write = c.ctx - read;
      tread += read;
      twrite += write;
      usd += (read * rate('cache_read') + write * rate('cache_write')) / 1e6;
    } else {
      tin += c.ctx;
      usd += (c.ctx * rate('input')) / 1e6;
    }
    tout += c.out;
    usd += (c.out * rate('output')) / 1e6;
    prev = c.ctx;
  }
  return { tokens_in: Math.round(tin), tokens_cache_read: Math.round(tread), tokens_cache_write: Math.round(twrite), tokens_out: Math.round(tout), usd };
}

function taskWindows(phaseName) {
  const rows = readTsv(path.join(METRICS, 'tasks.tsv')).filter((r) => r.phase === phaseName);
  const by = {};
  for (const r of rows) {
    const t = Date.parse(r.ts);
    const w = (by[r.task] ||= { start: null, end: null, last: null });
    if (r.status === 'doing' && w.start === null) w.start = t;
    if (r.status === 'done') w.end = t;
    if (r.status === 'todo') {
      w.start = null;
      w.end = null;
    }
    w.last = r.status;
  }
  return by;
}

function cmdUsage([phase, task]) {
  if (!phase) {
    console.error('usage: metrics.cjs usage <phase> [task]');
    process.exit(2);
  }
  const cfg = loadConfig();
  const pd = phaseDirs(phase)[0];
  const name = pd ? pd.name : phase;
  const windows = taskWindows(name);
  const sessions = loadSessions(cfg);
  const file = path.join(METRICS, 'usage.tsv');
  const kept = readTsv(file).filter((r) => !(r.phase === name && (!task || r.task === task) && r.source === 'kiro-session'));
  fs.rmSync(file, { force: true });
  for (const r of kept) appendTsv(file, USAGE_COLS, r);
  let written = 0;
  for (const [id, w] of Object.entries(windows)) {
    if (task && id !== task) continue;
    if (w.start === null) continue;
    const to = w.end ?? Date.now();
    for (const s of sessions) {
      const u = usageInWindow(s, w.start, to);
      if (u.calls.length === 0 && u.credits === 0) continue;
      const role = s.createdAt >= w.start - 120000 ? 'child' : 'lead';
      const price = priceCalls(u.calls, s.model, cfg) || { tokens_in: 0, tokens_cache_read: 0, tokens_cache_write: 0, tokens_out: 0 };
      appendTsv(file, USAGE_COLS, {
        ts: new Date().toISOString(),
        phase: name,
        task: id,
        role,
        session: s.id,
        model: s.model,
        credits: u.credits.toFixed(3),
        elapsed_s: Math.round(u.elapsed_s),
        calls: u.calls.length,
        tokens_in: price.tokens_in,
        tokens_cache_read: price.tokens_cache_read,
        tokens_cache_write: price.tokens_cache_write,
        tokens_out: price.tokens_out,
        source: 'kiro-session',
      });
      written++;
    }
  }
  console.log(`usage: ${written} session-window rows written to ${path.relative(ROOT, file)} (tokens estimated, credits and elapsed measured)`);
  console.log('note: a session that overlaps two task windows is counted in both; parallel tasks double-count the lead session.');
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------
const fmtH = (h) => (h === null || h === undefined ? 'n/a' : h >= 10 ? `${h.toFixed(0)} h` : `${h.toFixed(1)} h`);
const fmtMin = (m) => (m === null ? 'n/a' : m >= 120 ? `${(m / 60).toFixed(1)} h` : `${Math.round(m)} min`);
const fmtUsd = (v) => (v === null || v === undefined ? 'n/a' : v < 1 ? `$${v.toFixed(3)}` : `$${v.toFixed(2)}`);

function buildReport(phaseFilter) {
  const cfg = loadConfig();
  const sessions = loadSessions(cfg);
  const cmpModel = cfg.profile.comparison.model;
  const out = [];
  for (const pd of phaseDirs(phaseFilter)) {
    const tasks = parseTasks(pd.dir);
    const windows = taskWindows(pd.name);
    const rows = [];
    for (const t of tasks) {
      const w = windows[t.id] || { start: null, end: null };
      const est = parseHumanEstimate(t.fields['Human estimate']);
      const humanH = est ? est.pert * (est.unit === 'd' ? cfg.profile.human.hours_per_working_day : 1) : null;
      const budget = parseMinutes(t.fields['Time budget']);
      const wallMin = w.start !== null && w.end !== null ? (w.end - w.start) / 60000 : null;
      const row = {
        id: t.id,
        title: t.title,
        status: t.status,
        executor: t.fields.Executor || null,
        risk: t.fields.Risk || null,
        human_hours: humanH,
        time_budget_min: budget,
        token_budget: parseTokens(t.fields['Token budget']),
        wall_min: wallMin,
        over_budget: budget !== null && wallMin !== null ? wallMin > budget : null,
        child: { credits: 0, agent_s: 0, usd: 0, usd_cmp: 0, tokens_out: 0, tokens_in_total: 0, models: new Set() },
        lead: { credits: 0, usd: 0 },
      };
      if (w.start !== null) {
        const to = w.end ?? Date.now();
        for (const s of sessions) {
          const u = usageInWindow(s, w.start, to);
          if (u.calls.length === 0 && u.credits === 0) continue;
          const isChild = s.createdAt >= w.start - 120000;
          const own = priceCalls(u.calls, s.model, cfg);
          if (isChild) {
            row.child.credits += u.credits;
            row.child.agent_s += u.elapsed_s;
            row.child.models.add(s.model);
            if (own) {
              row.child.usd += own.usd;
              row.child.tokens_out += own.tokens_out;
              row.child.tokens_in_total += own.tokens_in + own.tokens_cache_read + own.tokens_cache_write;
            }
            const cmp = priceCalls(u.calls, cmpModel, cfg);
            if (cmp) row.child.usd_cmp += cmp.usd;
          } else {
            row.lead.credits += u.credits;
            if (own) row.lead.usd += own.usd;
          }
        }
      }
      rows.push(row);
    }
    const done = rows.filter((r) => r.status === 'done');
    const sum = (f, set = rows) => set.reduce((a, r) => a + (f(r) || 0), 0);
    const measured = rows.filter((r) => r.wall_min !== null);
    const totals = {
      tasks: rows.length,
      done: done.length,
      with_estimate: rows.filter((r) => r.human_hours !== null).length,
      human_hours: sum((r) => r.human_hours),
      human_usd: sum((r) => r.human_hours) * cfg.profile.human.hourly_rate_usd,
      wall_min: sum((r) => r.wall_min),
      measured_tasks: measured.length,
      child_credits: sum((r) => r.child.credits),
      child_agent_s: sum((r) => r.child.agent_s),
      child_usd: sum((r) => r.child.usd),
      child_usd_cmp: sum((r) => r.child.usd_cmp),
      lead_credits: sum((r) => r.lead.credits),
      lead_usd: sum((r) => r.lead.usd),
      over_budget: rows.filter((r) => r.over_budget).length,
    };
    out.push({ phase: pd.name, rows, totals });
  }
  return { cfg, cmpModel, phases: out };
}

function renderReport(rep) {
  const { cfg, cmpModel } = rep;
  const L = [];
  L.push('# Delivery report');
  L.push('');
  L.push(`Generated ${new Date().toISOString()}. Rates as of ${cfg.rates.as_of} (${cfg.rates.source}).`);
  L.push('');
  L.push('**Measured:** task start and end times (phase.sh), Kiro credits, agent elapsed time.');
  L.push('**Estimated:** tokens (from session logs), all dollar figures, the human estimate, and the comparison-model row.');
  L.push('');
  for (const ph of rep.phases) {
    const t = ph.totals;
    L.push(`## ${ph.phase}`);
    L.push('');
    L.push('| Task | Executor | Risk | Human est. | Budget | Wall time | Over | Credits (agent) | Est. cost (agent) | Est. cost on ' + cmpModel + ' |');
    L.push('|---|---|---|---|---|---|---|---|---|---|');
    for (const r of ph.rows) {
      L.push(
        `| ${r.id} | ${r.executor || 'n/a'} | ${r.risk || 'n/a'} | ${fmtH(r.human_hours)} | ${fmtMin(r.time_budget_min)} | ${fmtMin(r.wall_min)} | ${r.over_budget === null ? '' : r.over_budget ? 'yes' : 'no'} | ${r.child.credits ? r.child.credits.toFixed(2) : ''} | ${r.child.usd ? fmtUsd(r.child.usd) : ''} | ${r.child.usd_cmp ? fmtUsd(r.child.usd_cmp) : ''} |`,
      );
    }
    L.push('');
    const f = cfg.profile.comparison.agent_time_factor;
    const hum = t.human_hours;
    L.push(`### Three-way comparison (${t.done} of ${t.tasks} tasks done; ${t.with_estimate} have a human estimate)`);
    L.push('');
    L.push('| | Time | Cost | Basis |');
    L.push('|---|---|---|---|');
    L.push(`| Human developer | ${fmtH(hum)} (${(hum / cfg.profile.human.hours_per_working_day).toFixed(1)} working days) | ${fmtUsd(t.human_usd)} | Sum of PERT estimates x $${cfg.profile.human.hourly_rate_usd}/h. Estimate. |`);
    L.push(`| Used: low-capability model (agents) | wall ${fmtMin(t.wall_min)}, agent ${fmtMin(t.child_agent_s / 60)} | ${fmtUsd(t.child_usd)} + lead ${fmtUsd(t.lead_usd)}; ${t.child_credits.toFixed(1)} agent credits, ${t.lead_credits.toFixed(1)} lead credits | Time and credits measured. Dollars estimated from tokens at list price. |`);
    L.push(`| Not used: ${cmpModel} for the agent work | agent ${fmtMin((t.child_agent_s / 60) * f)} (x${f}) | ${fmtUsd(t.child_usd_cmp)} + lead ${fmtUsd(t.lead_usd)} | Same tokens priced at ${cmpModel}. Time factor is an assumption. |`);
    L.push('');
    if (t.over_budget) L.push(`Tasks over their time budget: ${t.over_budget}.`);
    if (cfg.profile.credits.usd_per_credit)
      L.push(`Credit value: $${cfg.profile.credits.usd_per_credit} per credit gives ${fmtUsd(t.child_credits * cfg.profile.credits.usd_per_credit)} for agents.`);
    L.push('');
  }
  L.push('## Assumptions');
  L.push('');
  L.push('- Tokens: characters / ' + cfg.profile.tokens.chars_per_token + ' x ' + cfg.profile.tokens.tokenizer_factor + ' tokenizer factor, context capped at ' + cfg.profile.tokens.context_cap_tokens + ' tokens. Caching assumed: ' + cfg.profile.caching.assume_prompt_caching + '.');
  L.push('- A session that overlaps two task windows is counted in both.');
  L.push('- Lead (orchestrator) usage is the part of the lead session inside each task window; review work outside a window is not attributed.');
  L.push('- Human estimates are retrospective unless the task carried one before work started.');
  return L.join('\n') + '\n';
}

function cmdReport(args) {
  const phase = args.find((a) => !a.startsWith('--'));
  const rep = buildReport(phase);
  if (args.includes('--json')) {
    const plain = JSON.parse(
      JSON.stringify(rep.phases, (k, v) => (v instanceof Set ? [...v] : v)),
    );
    const payload = { generated: new Date().toISOString(), rates_as_of: rep.cfg.rates.as_of, comparison_model: rep.cmpModel, phases: plain };
    if (args.includes('--write')) {
      fs.mkdirSync(METRICS, { recursive: true });
      fs.writeFileSync(path.join(METRICS, 'report.json'), JSON.stringify(payload, null, 2) + '\n');
    }
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  const md = renderReport(rep);
  if (args.includes('--write')) {
    const target = phase && rep.phases[0] ? path.join(SDD, 'reports', rep.phases[0].phase) : path.join(SDD, 'reports');
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, 'delivery-report.md'), md);
    fs.mkdirSync(METRICS, { recursive: true });
    fs.writeFileSync(
      path.join(METRICS, 'report.json'),
      JSON.stringify({ generated: new Date().toISOString(), rates_as_of: rep.cfg.rates.as_of, comparison_model: rep.cmpModel, phases: JSON.parse(JSON.stringify(rep.phases, (k, v) => (v instanceof Set ? [...v] : v))) }, null, 2) + '\n',
    );
    console.error(`wrote ${path.relative(ROOT, path.join(target, 'delivery-report.md'))} and .sdd/metrics/report.json`);
  }
  process.stdout.write(md);
}

// ---------------------------------------------------------------------------
// check
// ---------------------------------------------------------------------------
function cmdCheck(args) {
  const strict = args.includes('--strict');
  const phase = args.find((a) => !a.startsWith('--'));
  const cfg = loadConfig();
  const from = cfg.profile.delivery && cfg.profile.delivery.required_from_phase;
  let problems = 0;
  for (const pd of phaseDirs(phase)) {
    if (from === null || from === undefined || pd.number < from) continue;
    for (const t of parseTasks(pd.dir)) {
      const miss = [];
      if (!t.fields.Risk || !/^(low|high)\b/i.test(t.fields.Risk)) miss.push('Risk (low|high)');
      if (!parseHumanEstimate(t.fields['Human estimate'])) miss.push('Human estimate (best/likely/worst h)');
      if (parseMinutes(t.fields['Time budget']) === null) miss.push('Time budget (for example 45 min)');
      if (!t.fields.Executor) miss.push('Executor');
      if (miss.length) {
        problems++;
        console.log(`${strict ? 'FAIL' : 'WARN'} ${pd.name} ${t.id}: missing or unreadable ${miss.join(', ')}`);
      }
    }
  }
  if (problems === 0) console.log('OK   delivery fields present where required');
  process.exit(strict && problems ? 1 : 0);
}

// ---------------------------------------------------------------------------
const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case 'record':
    cmdRecord(rest);
    break;
  case 'usage':
    cmdUsage(rest);
    break;
  case 'report':
    cmdReport(rest);
    break;
  case 'check':
    cmdCheck(rest);
    break;
  default:
    console.error('usage: metrics.cjs <record|usage|report|check> ...');
    process.exit(2);
}
