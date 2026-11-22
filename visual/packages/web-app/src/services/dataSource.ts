import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { ProjectSnapshot, ProjectSummary } from '@sdd/contracts';
import {
  buildProjectSummary,
  getBrowserSnapshot,
  listBrowserProjects,
  saveBrowserProject,
} from './projectStore';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseSingleton: SupabaseClient | null = null;
export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!supabaseSingleton) {
    supabaseSingleton = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseSingleton;
}

export function isCloudConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function fetchLocalProjects(): Promise<ProjectSummary[]> {
  try {
    const res = await fetch('/api/projects', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.projects) ? data.projects : [];
  } catch {
    return [];
  }
}

export async function fetchLocalSnapshot(projectId: string): Promise<ProjectSnapshot | null> {
  const res = await fetch(`/api/project/${encodeURIComponent(projectId)}/snapshot`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchCloudProjects(): Promise<ProjectSummary[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data: userRes } = await sb.auth.getUser();
  if (!userRes.user) return [];
  const { data, error } = await sb
    .from('sdd_projects')
    .select('id, slug, name, framework_version, active_phase, last_synced_at, summary')
    .order('last_synced_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: String(row.slug || row.id),
    name: String(row.name || row.slug),
    source: 'cloud' as const,
    activePhaseId: (row.active_phase as string | null) ?? null,
    overallProgressPct: Number((row.summary as Record<string, unknown> | null)?.overallProgressPct ?? 0),
    frameworkVersion: String(row.framework_version || '2.4.0'),
    lastSyncedAt: row.last_synced_at ? String(row.last_synced_at) : undefined,
  }));
}

export async function fetchCloudSnapshot(slug: string): Promise<ProjectSnapshot | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data: proj } = await sb.from('sdd_projects').select('id').eq('slug', slug).maybeSingle();
  if (!proj) return null;
  const { data: snap } = await sb
    .from('sdd_snapshots')
    .select('payload')
    .eq('project_id', proj.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (snap?.payload as ProjectSnapshot) || null;
}

export async function syncSnapshotToCloud(snapshot: ProjectSnapshot): Promise<ProjectSummary | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data: userRes } = await sb.auth.getUser();
  const user = userRes.user;
  if (!user) return null;

  const sanitized: ProjectSnapshot = { ...snapshot };
  delete sanitized.projectRoot;

  const slug = sanitized.projectId || 'imported-project';
  const name = sanitized.projectName || slug;
  const frameworkVersion = sanitized.framework?.version || '2.4.0';
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
        user_id: user.id,
        slug,
        name,
        framework_version: frameworkVersion,
        active_phase: sanitized.activePhaseId,
        summary,
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,slug' },
    )
    .select('id, slug')
    .single();

  if (projErr || !project) {
    return null;
  }

  const { error: snapErr } = await sb.from('sdd_snapshots').insert({
    project_id: project.id,
    user_id: user.id,
    revision: sanitized.contentRevision,
    payload: sanitized,
  });

  if (snapErr) return null;
  return buildProjectSummary(sanitized, 'cloud');
}

export async function saveImportedProject(snapshot: ProjectSnapshot): Promise<{
  summary: ProjectSummary;
  persistedTo: 'cloud' | 'browser';
}> {
  const cloudSummary = await syncSnapshotToCloud(snapshot);
  if (cloudSummary) {
    // Also cache locally in browser for fast offline reload
    await saveBrowserProject(snapshot, 'browser');
    return { summary: cloudSummary, persistedTo: 'cloud' };
  }
  const browserSummary = await saveBrowserProject(snapshot, 'browser');
  return { summary: browserSummary, persistedTo: 'browser' };
}

export { listBrowserProjects, getBrowserSnapshot };

export async function signInCloud(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { user: null, error: 'Supabase cloud credentials are not configured in this build.' };
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  return { user: data.user ?? null, error: error?.message ?? null };
}

export async function signUpCloud(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { user: null, error: 'Supabase cloud credentials are not configured in this build.' };
  const { data, error } = await sb.auth.signUp({ email, password });
  return { user: data.user ?? null, error: error?.message ?? null };
}

export async function signOutCloud(): Promise<void> {
  const sb = getSupabaseClient();
  if (sb) await sb.auth.signOut();
}
