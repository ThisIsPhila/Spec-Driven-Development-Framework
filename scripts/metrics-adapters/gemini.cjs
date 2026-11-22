'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Gemini / Antigravity session adapter (GEMINI_SESSIONS_DIR or ~/.gemini/sessions).
 * Reads JSON/JSONL usage summaries when available and preserves measured vs estimated provenance.
 */
function loadGeminiSessions({ root }) {
  const base = process.env.GEMINI_SESSIONS_DIR || path.join(os.homedir(), '.gemini', 'sessions');
  if (!fs.existsSync(base)) return [];
  const sessions = [];
  try {
    for (const f of fs.readdirSync(base)) {
      if (!f.endsWith('.json') && !f.endsWith('.jsonl')) continue;
      const full = path.join(base, f);
      const turns = [];
      let model = 'gemini-4-neon-medium';
      let matched = Boolean(process.env.GEMINI_SESSIONS_DIR);
      let createdAt = Infinity;
      let lastModifiedAt = 0;
      const lines = f.endsWith('.jsonl')
        ? fs.readFileSync(full, 'utf8').split('\n').filter(Boolean)
        : [fs.readFileSync(full, 'utf8')];
      for (const line of lines) {
        let d;
        try { d = JSON.parse(line); } catch { continue; }
        if (d.workspace && (d.workspace === root || d.workspace.startsWith(root + path.sep))) matched = true;
        if (d.model) model = d.model;
        const ts = Date.parse(d.timestamp || d.ts || '');
        if (!Number.isFinite(ts)) continue;
        createdAt = Math.min(createdAt, ts);
        lastModifiedAt = Math.max(lastModifiedAt, ts);
        const u = d.usageMetadata || d.usage;
        if (u) {
          turns.push({
            t: ts,
            model: d.model || model,
            tokens_in: Number(u.promptTokenCount ?? u.input_tokens ?? 0),
            tokens_out: Number(u.candidatesTokenCount ?? u.output_tokens ?? 0),
            tokens_cache_read: Number(u.cachedContentTokenCount ?? u.cache_read_tokens ?? 0),
            tokens_cache_write: Number(u.cache_write_tokens ?? 0),
            provenance: d.provenance === 'estimated' ? 'estimated' : 'measured',
          });
        }
      }
      if (matched && turns.length) {
        sessions.push({
          id: path.basename(f, path.extname(f)),
          harness: 'gemini',
          agent: 'antigravity',
          model,
          createdAt: Number.isFinite(createdAt) ? createdAt : turns[0].t,
          lastModifiedAt: lastModifiedAt || turns[turns.length - 1].t,
          turns,
          source: 'gemini-session',
          provenance: turns.every((t) => t.provenance === 'measured') ? 'measured' : 'estimated',
        });
      }
    }
  } catch {
    return [];
  }
  return sessions;
}

module.exports = { name: 'gemini', loadSessions: loadGeminiSessions };
