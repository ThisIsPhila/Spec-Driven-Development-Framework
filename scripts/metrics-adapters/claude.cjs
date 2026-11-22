'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

/**
 * Claude Code session adapter (~/.claude/projects/<encoded>/*.jsonl or CLAUDE_SESSIONS_DIR).
 * Extracts measured API usage tokens when present in assistant message records.
 */
function loadClaudeSessions({ root }) {
  const base = process.env.CLAUDE_SESSIONS_DIR || path.join(os.homedir(), '.claude', 'projects');
  if (!fs.existsSync(base)) return [];
  const encoded = root.replace(/[\\/]/g, '-');
  const candidates = [];
  try {
    for (const entry of fs.readdirSync(base)) {
      const full = path.join(base, entry);
      if (fs.statSync(full).isDirectory()) {
        if (entry === encoded || entry.endsWith(path.basename(root)) || process.env.CLAUDE_SESSIONS_DIR) {
          for (const f of fs.readdirSync(full)) {
            if (f.endsWith('.jsonl')) candidates.push(path.join(full, f));
          }
        }
      } else if (entry.endsWith('.jsonl') && process.env.CLAUDE_SESSIONS_DIR) {
        candidates.push(full);
      }
    }
  } catch {
    return [];
  }

  const sessions = [];
  for (const file of candidates) {
    const turns = [];
    let model = 'unknown';
    let createdAt = Infinity;
    let lastModifiedAt = 0;
    try {
      for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        if (!line.trim()) continue;
        let d;
        try { d = JSON.parse(line); } catch { continue; }
        if (d.cwd && !d.cwd.startsWith(root) && !process.env.CLAUDE_SESSIONS_DIR) continue;
        const ts = Date.parse(d.timestamp || d.ts || '');
        if (!Number.isFinite(ts)) continue;
        createdAt = Math.min(createdAt, ts);
        lastModifiedAt = Math.max(lastModifiedAt, ts);
        const msg = d.message || d;
        if (msg.model) model = msg.model;
        const u = msg.usage || d.usage;
        if (u && (u.input_tokens || u.output_tokens || u.cache_read_input_tokens || u.cache_creation_input_tokens)) {
          turns.push({
            t: ts,
            model: msg.model || model,
            tokens_in: Number(u.input_tokens || 0),
            tokens_out: Number(u.output_tokens || 0),
            tokens_cache_read: Number(u.cache_read_input_tokens || 0),
            tokens_cache_write: Number(u.cache_creation_input_tokens || 0),
            provenance: 'measured',
          });
        }
      }
    } catch {
      continue;
    }
    if (turns.length) {
      sessions.push({
        id: path.basename(file, '.jsonl'),
        harness: 'claude',
        agent: 'claude-code',
        model,
        createdAt: Number.isFinite(createdAt) ? createdAt : turns[0].t,
        lastModifiedAt: lastModifiedAt || turns[turns.length - 1].t,
        turns,
        source: 'claude-session',
        provenance: 'measured',
      });
    }
  }
  return sessions;
}

module.exports = { name: 'claude', loadSessions: loadClaudeSessions };
