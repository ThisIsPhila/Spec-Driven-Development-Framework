import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { ProjectSnapshot, ProjectSummary } from '@sdd/contracts';

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
    frameworkVersion: String(row.framework_version || '2.3.0'),
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
