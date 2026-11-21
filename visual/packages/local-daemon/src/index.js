import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractProject } from '../../../server/extract.js';
import { portableSnapshot } from '../../../server/sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function isLoopbackHost(header) {
  if (!header) return true;
  const host = header.replace(/:\d+$/, '').toLowerCase();
  return LOOPBACK_HOSTS.has(host);
}

function isLoopbackOrigin(origin) {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    return LOOPBACK_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function slugify(name) {
  return String(name || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'project';
}

export class LocalDaemon {
  constructor({ port = 3456, host = '127.0.0.1', staticDir = null, pollIntervalMs = 2000 } = {}) {
    this.port = port;
    this.host = host;
    this.pollIntervalMs = pollIntervalMs;
    const webAppDist = path.resolve(__dirname, '../../web-app/dist');
    const legacyDist = path.resolve(__dirname, '../../../dist');
    this.staticDir = staticDir || (fs.existsSync(path.join(webAppDist, 'index.html')) ? webAppDist : legacyDist);
    this.projects = new Map();
    this.clients = new Set();
    this.server = null;
    this.pollTimer = null;
  }

  registerProject(projectRoot) {
    const resolved = fs.realpathSync(path.resolve(projectRoot));
    const snapshot = extractProject(resolved);
    const id = slugify(snapshot.projectName || path.basename(resolved));
    const entry = {
      id,
      root: resolved,
      snapshot,
      revision: snapshot.contentRevision,
    };
    this.projects.set(id, entry);
    return entry;
  }

  refreshAll() {
    let changed = false;
    for (const [id, entry] of this.projects.entries()) {
      try {
        const next = extractProject(entry.root);
        if (next.contentRevision !== entry.revision) {
          entry.snapshot = next;
          entry.revision = next.contentRevision;
          changed = true;
          this.broadcast('snapshot-updated', {
            projectId: id,
            revision: next.contentRevision,
            ts: new Date().toISOString(),
          });
        }
      } catch {
        // transient read during git checkout or file write
      }
    }
    return changed;
  }

  broadcast(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of this.clients) {
      try {
        res.write(payload);
      } catch {
        this.clients.delete(res);
      }
    }
  }

  listSummaries() {
    return [...this.projects.values()].map((p) => ({
      id: p.id,
      name: p.snapshot.projectName || p.id,
      source: 'local',
      activePhaseId: p.snapshot.activePhaseId || null,
      overallProgressPct: p.snapshot.metrics?.overallProgressPct ?? 0,
      frameworkVersion: p.snapshot.framework?.version || '2.3.0',
      contentRevision: p.revision,
    }));
  }

  getPortableSnapshot(id) {
    const entry = this.projects.get(id);
    if (!entry) return null;
    return portableSnapshot(entry.snapshot);
  }

  handleRequest(req, res) {
    if (!isLoopbackHost(req.headers.host) || !isLoopbackOrigin(req.headers.origin)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden: loopback access only' }));
      return;
    }

    if (req.headers.origin && isLoopbackOrigin(req.headers.origin)) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${this.host}:${this.port}`);
    const pathname = url.pathname;

    if (pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ status: 'ok', mode: 'local', projects: this.listSummaries() }));
      return;
    }

    if (pathname === '/api/projects') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ projects: this.listSummaries() }));
      return;
    }

    if (pathname === '/api/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(`event: connected\ndata: ${JSON.stringify({ projects: this.listSummaries() })}\n\n`);
      this.clients.add(res);
      req.on('close', () => this.clients.delete(res));
      return;
    }

    const snapMatch = pathname.match(/^\/api\/project\/([^/]+)\/snapshot$/);
    if (snapMatch) {
      const id = decodeURIComponent(snapMatch[1]);
      const entry = this.projects.get(id);
      if (!entry) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Project not found: ${id}` }));
        return;
      }
      this.refreshAll();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(entry.snapshot));
      return;
    }

    if (pathname.startsWith('/api/')) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    this.serveStatic(pathname, res);
  }

  serveStatic(pathname, res) {
    const safeRel = path.normalize(pathname === '/' ? '/index.html' : pathname).replace(/^(\.\.[/\\])+/, '');
    let target = path.join(this.staticDir, safeRel);
    if (!target.startsWith(this.staticDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      target = path.join(this.staticDir, 'index.html');
    }
    if (!fs.existsSync(target)) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('SDD Web App bundle not built yet. Run: npm --prefix visual run build');
      return;
    }
    const ext = path.extname(target).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(target).pipe(res);
  }

  async start() {
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
    await new Promise((resolve, reject) => {
      this.server.once('error', reject);
      this.server.listen(this.port, this.host, resolve);
    });
    const addr = this.server.address();
    this.port = addr.port;
    this.pollTimer = setInterval(() => this.refreshAll(), this.pollIntervalMs);
    this.pollTimer.unref();
    return {
      host: this.host,
      port: this.port,
      url: `http://${this.host}:${this.port}/`,
    };
  }

  async stop() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    for (const res of this.clients) {
      try { res.end(); } catch { /* ignore */ }
    }
    this.clients.clear();
    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve));
      this.server = null;
    }
  }
}
