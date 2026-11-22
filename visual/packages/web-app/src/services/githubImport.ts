import type { ProjectSnapshot } from '@sdd/contracts';
import { parseSddFileMap } from './sddParser';

const RELEVANT_SDD_EXT = /\.(md|json|jsonl|tsv|txt|yml|yaml)$/i;

function parseRepoSlug(raw: string): { owner: string; repo: string } | null {
  const cleaned = String(raw || '')
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/^\/+|\/+$/g, '');
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length !== 2) return null;
  const [owner, repo] = parts;
  if (!/^[a-zA-Z0-9._-]+$/.test(owner) || !/^[a-zA-Z0-9._-]+$/.test(repo)) return null;
  return { owner, repo };
}

async function fetchGitHubDirectly(repoInput: string, ref?: string, pat?: string): Promise<{
  projectName: string;
  branch: string;
  files: Record<string, string>;
}> {
  const parsed = parseRepoSlug(repoInput);
  if (!parsed) {
    throw new Error('Invalid repository format. Enter owner/repo (e.g. octocat/hello-world).');
  }

  const { owner, repo } = parsed;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  };
  if (pat && pat.trim()) {
    headers.Authorization = `Bearer ${pat.trim()}`;
  }

  let branch = (ref || '').trim();
  if (!branch) {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (repoRes.status === 404) {
      throw new Error(`Repository ${owner}/${repo} not found or private.`);
    }
    if (repoRes.status === 401 || repoRes.status === 403) {
      throw new Error('GitHub authentication failed or rate limit exceeded. Supply a PAT and retry.');
    }
    if (!repoRes.ok) {
      throw new Error(`GitHub lookup failed (${repoRes.status}).`);
    }
    const meta = (await repoRes.json()) as { default_branch?: string };
    branch = meta.default_branch || 'main';
  }

  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { headers },
  );
  if (!treeRes.ok) {
    throw new Error(`Could not inspect branch "${branch}" in ${owner}/${repo} (${treeRes.status}).`);
  }

  const treeData = (await treeRes.json()) as {
    tree?: Array<{ type: string; path: string; size?: number }>;
  };
  const entries = (treeData.tree || [])
    .filter(
      (item) =>
        item.type === 'blob' &&
        (item.path.startsWith('.sdd/') || /^skills\/[^/]+\/SKILL\.md$/i.test(item.path)) &&
        RELEVANT_SDD_EXT.test(item.path) &&
        (item.size === undefined || item.size <= 512 * 1024),
    )
    .slice(0, 250);

  if (!entries.some((item) => item.path.startsWith('.sdd/'))) {
    throw new Error(`No .sdd/ directory found in ${owner}/${repo} (${branch}).`);
  }

  const files: Record<string, string> = {};
  const batchSize = 12;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (entry) => {
        const encoded = entry.path.split('/').map(encodeURIComponent).join('/');
        const url = pat?.trim()
          ? `https://api.github.com/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(branch)}`
          : `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${encoded}`;
        const fileRes = await fetch(url, {
          headers: pat?.trim()
            ? { ...headers, Accept: 'application/vnd.github.raw' }
            : undefined,
        });
        if (fileRes.ok) {
          files[entry.path] = await fileRes.text();
        }
      }),
    );
  }

  return { projectName: repo, branch, files };
}

export async function importFromGitHub(params: {
  repo: string;
  ref?: string;
  pat?: string;
}): Promise<ProjectSnapshot> {
  const { repo, ref, pat } = params;
  if (!parseRepoSlug(repo)) {
    throw new Error('Invalid repository format. Enter owner/repo (e.g. ThisIsPhila/Spec-Driven-Development-Framework).');
  }

  let payload: { projectName: string; branch: string; files: Record<string, string> } | null = null;

  try {
    const res = await fetch('/api/cloud/import-github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo, ref, pat }),
    });
    if (res.ok) {
      payload = (await res.json()) as { projectName: string; branch: string; files: Record<string, string> };
    } else if (res.status !== 404 && res.status !== 405) {
      const errBody = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(errBody.error || `GitHub import failed (${res.status}).`);
    }
  } catch (err) {
    // Only fall back when the serverless route itself isn't reachable (local daemon / static preview)
    if (err instanceof Error && !/Failed to fetch|NetworkError|Load failed/i.test(err.message)) {
      throw err;
    }
  }

  if (!payload) {
    payload = await fetchGitHubDirectly(repo, ref, pat);
  }

  const snapshot = parseSddFileMap(payload.projectName, payload.files);
  snapshot.account = {
    ...(snapshot.account || {}),
    name: 'GitHub Import',
    branch: payload.branch,
    headCommit: 'github',
  };
  return snapshot;
}
