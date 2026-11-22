/**
 * Vercel Serverless Function: POST /api/cloud/import-github
 * Reads `.sdd/` specification, governance, and metrics files from a GitHub repository
 * (public, or private using a transient user-supplied PAT that is never persisted or logged).
 */

const RELEVANT_SDD_EXT = /\.(md|json|jsonl|tsv|txt|yml|yaml)$/i;
const MAX_TREE_FILES = 250;
const MAX_BLOB_BYTES = 512 * 1024;

export function parseGitHubRepoInput(raw) {
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

export async function importGitHubSdd({ repoInput, ref, pat, fetchImpl = globalThis.fetch }) {
  const parsed = parseGitHubRepoInput(repoInput);
  if (!parsed) {
    return { status: 400, body: { error: 'Invalid repository format. Use owner/repo or a GitHub URL.' } };
  }
  const { owner, repo } = parsed;
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'sdd-visual-cloud-importer',
  };
  if (pat && String(pat).trim()) {
    headers.Authorization = `Bearer ${String(pat).trim()}`;
  }

  let branch = String(ref || '').trim();
  if (!branch) {
    const repoRes = await fetchImpl(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (repoRes.status === 404) {
      return { status: 404, body: { error: `GitHub repository ${owner}/${repo} not found or private.` } };
    }
    if (repoRes.status === 401 || repoRes.status === 403) {
      return { status: repoRes.status, body: { error: 'GitHub authentication failed or API rate limit exceeded. Provide a PAT and retry.' } };
    }
    if (!repoRes.ok) {
      return { status: 502, body: { error: `GitHub repository lookup failed (${repoRes.status}).` } };
    }
    const repoMeta = await repoRes.json();
    branch = repoMeta.default_branch || 'main';
  }

  const treeRes = await fetchImpl(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { headers },
  );
  if (treeRes.status === 404) {
    return { status: 404, body: { error: `Branch or ref "${branch}" not found in ${owner}/${repo}.` } };
  }
  if (treeRes.status === 401 || treeRes.status === 403) {
    return { status: treeRes.status, body: { error: 'GitHub authentication failed or rate limit exceeded.' } };
  }
  if (!treeRes.ok) {
    return { status: 502, body: { error: `Failed to read GitHub tree (${treeRes.status}).` } };
  }

  const treeData = await treeRes.json();
  const tree = Array.isArray(treeData.tree) ? treeData.tree : [];
  const sddEntries = tree
    .filter(
      (item) =>
        item &&
        item.type === 'blob' &&
        typeof item.path === 'string' &&
        (item.path.startsWith('.sdd/') || /^skills\/[^/]+\/SKILL\.md$/i.test(item.path)) &&
        RELEVANT_SDD_EXT.test(item.path) &&
        (typeof item.size !== 'number' || item.size <= MAX_BLOB_BYTES),
    )
    .slice(0, MAX_TREE_FILES);

  if (!sddEntries.some((item) => item.path.startsWith('.sdd/'))) {
    return {
      status: 404,
      body: { error: `No .sdd/ directory found in ${owner}/${repo} (${branch}).` },
    };
  }

  const files = {};
  const batchSize = 12;
  for (let i = 0; i < sddEntries.length; i += batchSize) {
    const batch = sddEntries.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (entry) => {
        const encodedPath = entry.path.split('/').map(encodeURIComponent).join('/');
        const rawUrl = pat
          ? `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`
          : `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${encodedPath}`;
        const fileHeaders = pat
          ? { ...headers, Accept: 'application/vnd.github.raw' }
          : { 'User-Agent': 'sdd-visual-cloud-importer' };
        const fileRes = await fetchImpl(rawUrl, { headers: fileHeaders });
        if (fileRes.ok) {
          files[entry.path] = await fileRes.text();
        }
      }),
    );
  }

  return {
    status: 200,
    body: {
      projectName: repo,
      owner,
      repo,
      branch,
      files,
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
  } catch {
    res.status(400).json({ error: 'Invalid JSON request body' });
    return;
  }

  const { repo, ref, pat } = body;
  const result = await importGitHubSdd({ repoInput: repo, ref, pat });
  res.status(result.status).json(result.body);
}
