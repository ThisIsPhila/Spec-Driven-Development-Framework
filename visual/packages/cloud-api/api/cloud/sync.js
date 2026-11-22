/**
 * Vercel Serverless Function: POST /api/cloud/sync
 * Verifies caller's Supabase JWT, strips any local filesystem root, and persists
 * a portable SDD snapshot under the user's Row-Level Security scope.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Unauthorized: missing Bearer token' });
    return;
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    res.status(503).json({ error: 'Supabase cloud configuration missing on server' });
    return;
  }

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userRes, error: userErr } = await sb.auth.getUser(token);
  if (userErr || !userRes?.user) {
    res.status(401).json({ error: 'Unauthorized: invalid session token' });
    return;
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  const { slug, name, frameworkVersion = '2.4.0', activePhaseId = null, revision = '', snapshot } = body;
  if (!slug || !name || !snapshot || typeof snapshot !== 'object') {
    res.status(400).json({ error: 'Bad Request: slug, name, and snapshot are required' });
    return;
  }

  // Strip any local filesystem path before persisting
  const sanitized = { ...snapshot };
  delete sanitized.projectRoot;

  const summary = {
    overallProgressPct: sanitized.metrics?.overallProgressPct ?? 0,
    totalTasks: sanitized.metrics?.totalTasks ?? 0,
    completedTasks: sanitized.metrics?.completedTasks ?? 0,
    totalUsd: sanitized.telemetry?.rollups?.totalUsd ?? 0,
  };

  const { data: project, error: projErr } = await sb
    .from('sdd_projects')
    .upsert(
      {
        user_id: userRes.user.id,
        slug: String(slug),
        name: String(name),
        framework_version: String(frameworkVersion),
        active_phase: activePhaseId,
        summary,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,slug' },
    )
    .select('id, slug')
    .single();

  if (projErr || !project) {
    res.status(500).json({ error: projErr?.message || 'Failed to upsert project' });
    return;
  }

  const { error: snapErr } = await sb.from('sdd_snapshots').insert({
    project_id: project.id,
    user_id: userRes.user.id,
    revision: String(revision),
    payload: sanitized,
  });

  if (snapErr) {
    res.status(500).json({ error: snapErr.message });
    return;
  }

  res.status(200).json({ status: 'synced', projectId: project.id, slug: project.slug, revision });
}
