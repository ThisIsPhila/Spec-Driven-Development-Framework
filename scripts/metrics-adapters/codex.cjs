'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

function walkJsonl(dir, out = []) {
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walkJsonl(full, out);
      else if (e.name.endsWith('.jsonl')) out.push(full);
    }
  } catch {
    // ignore unreadable dirs
  }
  return out;
}

/**
 * Codex CLI session adapter (~/.codex/sessions or CODEX_SESSIONS_DIR).
 */
function loadCodexSessions({ root }) {
  const base = process.env.CODEX_SESSIONS_DIR || path.join(os.homedir(), '.codex', 'sessions');
  if (!fs.existsSync(base)) return [];
  const sessions = [];
  for (const file of walkJsonl(base)) {
    const turns = [];
    let model = 'gpt-5-codex';
    let matched = Boolean(process.env.CODEX_SESSIONS_DIR);
    let createdAt = Infinity;
    let lastModifiedAt = 0;
    try {
      for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        if (!line.trim()) continue;
        let d;
        try { d = JSON.parse(line); } catch { continue; }
        const p = d.payload || d;
        if (p.cwd && (p.cwd === root || p.cwd.startsWith(root + path.sep))) matched = true;
        if (p.model) model = p.model;
        const ts = Date.parse(d.timestamp || p.timestamp || '');
        if (!Number.isFinite(ts)) continue;
        createdAt = Math.min(createdAt, ts);
        lastModifiedAt = Math.max(lastModifiedAt, ts);
        const u = p.info?.total_token_usage || p.usage || d.usage;
        if (u && (u.input_tokens || u.output_tokens)) {
          turns.push({
            t: ts,
            model: p.model || model,
            tokens_in: Number(u.input_tokens || 0),
            tokens_out: Number(u.output_tokens || 0),
            tokens_cache_read: Number(u.cached_input_tokens || u.cache_read_tokens || 0),
            tokens_cache_write: Number(u.cache_write_tokens || 0),
            provenance: 'measured',
          });
        }
      }
    } catch {
      continue;
    }
    if (matched && turns.length) {
      sessions.push({
        id: path.basename(file, '.jsonl'),
        harness: 'codex',
        agent: 'codex-cli',
        model,
        createdAt: Number.isFinite(createdAt) ? createdAt : turns[0].t,
        lastModifiedAt: lastModifiedAt || turns[turns.length - 1].t,
        turns,
        source: 'codex-session',
        provenance: 'measured',
      });
    }
  }
  return sessions;
}

module.exports = { name: 'codex', loadSessions: loadCodexSessions };
