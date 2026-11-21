'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * OpenCode session adapter (OPENCODE_SESSIONS_DIR or ~/.opencode/sessions).
 */
function loadOpenCodeSessions({ root }) {
  const base = process.env.OPENCODE_SESSIONS_DIR || path.join(os.homedir(), '.opencode', 'sessions');
  if (!fs.existsSync(base)) return [];
  const sessions = [];
  try {
    for (const f of fs.readdirSync(base)) {
      if (!f.endsWith('.json')) continue;
      let d;
      try { d = JSON.parse(fs.readFileSync(path.join(base, f), 'utf8')); } catch { continue; }
      if (d.directory && d.directory !== root && !d.directory.startsWith(root + path.sep) && !process.env.OPENCODE_SESSIONS_DIR) continue;
      const turns = [];
      let model = d.model || 'unknown';
      for (const m of d.messages || []) {
        const ts = Date.parse(m.timestamp || m.createdAt || d.updatedAt || '');
        if (!Number.isFinite(ts) || !m.tokens) continue;
        if (m.model) model = m.model;
        turns.push({
          t: ts,
          model: m.model || model,
          tokens_in: Number(m.tokens.input || 0),
          tokens_out: Number(m.tokens.output || 0),
          tokens_cache_read: Number(m.tokens.cache?.read || 0),
          tokens_cache_write: Number(m.tokens.cache?.write || 0),
          provenance: 'measured',
        });
      }
      if (turns.length) {
        sessions.push({
          id: d.id || path.basename(f, '.json'),
          harness: 'opencode',
          agent: 'opencode',
          model,
          createdAt: turns[0].t,
          lastModifiedAt: turns[turns.length - 1].t,
          turns,
          source: 'opencode-session',
          provenance: 'measured',
        });
      }
    }
  } catch {
    return [];
  }
  return sessions;
}

module.exports = { name: 'opencode', loadSessions: loadOpenCodeSessions };
