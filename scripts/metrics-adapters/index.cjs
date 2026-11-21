'use strict';
const claude = require('./claude.cjs');
const codex = require('./codex.cjs');
const gemini = require('./gemini.cjs');
const opencode = require('./opencode.cjs');

const ADAPTERS = [claude, codex, gemini, opencode];

/**
 * Loads normalized sessions from all registered non-Kiro harness adapters.
 * Each adapter fails closed (returns []) when its session dir is absent or unreadable.
 */
function loadExternalSessions(ctx) {
  const out = [];
  for (const adapter of ADAPTERS) {
    try {
      const items = adapter.loadSessions(ctx) || [];
      for (const s of items) out.push(s);
    } catch {
      // ignore adapter error so one broken harness never blocks metrics
    }
  }
  return out;
}

/**
 * Computes USD cost for measured/estimated token counts using rates.json.
 */
function priceTokens({ tokens_in = 0, tokens_out = 0, tokens_cache_read = 0, tokens_cache_write = 0 }, model, rates) {
  const r = rates?.models?.[model];
  if (!r) return 0;
  const totalIn = tokens_in + tokens_cache_read + tokens_cache_write;
  const long = r.long_prompt_tokens && totalIn > r.long_prompt_tokens;
  const rate = (k) => (long && r['long_' + k] !== undefined ? r['long_' + k] : r[k] ?? 0);
  return (
    (tokens_in * rate('input') +
      tokens_cache_read * rate('cache_read') +
      tokens_cache_write * rate('cache_write') +
      tokens_out * rate('output')) /
    1e6
  );
}

module.exports = { ADAPTERS, loadExternalSessions, priceTokens };
