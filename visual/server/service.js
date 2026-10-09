import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { extractProject } from './extract.js';

export class LocalProjectService {
  constructor(options = {}) {
    this.port = options.port !== undefined ? options.port : 3456;
    this.host = options.host || '127.0.0.1';
    if (!['127.0.0.1', 'localhost', '::1'].includes(this.host)) throw new Error('Local workspace service must bind to loopback');
    this.token = options.token || crypto.randomBytes(16).toString('hex');
    this.projects = new Map(); // id -> { root, lastSnapshot, sseClients: Set }
    this.watchers = new Map(); // id -> fs.FSWatcher
    this.staticDir = options.staticDir || null;
    this.server = null;
    this.refreshTimer = null;
  }

  registerProject(projectPath) {
    const resolvedRoot = fs.realpathSync(projectPath);
    const sddDir = path.join(resolvedRoot, '.sdd');

    if (!fs.existsSync(sddDir)) {
      throw new Error(`Cannot register project: .sdd directory not found in ${resolvedRoot}`);
    }

    const existing = [...this.projects.values()].find(p => p.root === resolvedRoot);
    if (existing) return existing;
    const projectId = path.basename(resolvedRoot) + '-' + crypto.createHash('sha256').update(resolvedRoot).digest('hex').slice(0, 10);
    const initialSnapshot = extractProject(resolvedRoot);

    const projectData = {
      id: projectId,
      root: resolvedRoot,
      lastSnapshot: initialSnapshot,
      sseClients: new Set(),
    };

    this.projects.set(projectId, projectData);
    this._startWatcher(projectId);
    return projectData;
  }

  _startWatcher(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return;

    const sddDir = path.join(project.root, '.sdd');
    let debounceTimer = null;

    try {
      const watcher = fs.watch(sddDir, { recursive: true }, () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this._refreshProject(projectId);
        }, 150);
      });
      watcher.on('error', err => {
        watcher.close();
        project.lastSnapshot.diagnostics.push({ type: 'warning', message: `Watcher unavailable; polling refresh active: ${err.code || 'error'}` });
      });
      this.watchers.set(projectId, watcher);
    } catch {
      // Fallback if recursive watch not supported
    }
  }

  _refreshProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return;

    try {
      const newSnapshot = extractProject(project.root);
      if (newSnapshot.contentRevision !== project.lastSnapshot.contentRevision) {
        project.lastSnapshot = newSnapshot;
        this._notifyClients(projectId, newSnapshot);
      }
    } catch (err) {
      // Preserve source data and expose a stable stale revision without growing logs.
      const message = `Read failed; displaying last valid snapshot: ${err.message}`;
      if (project.lastSnapshot.readError !== message) {
        project.lastSnapshot = { ...project.lastSnapshot, readStatus: 'stale', readError: message,
          contentRevision: crypto.createHash('sha256').update(project.lastSnapshot.contentRevision + message).digest('hex').slice(0,16),
          diagnostics: [...project.lastSnapshot.diagnostics.slice(-63), {type:'warning',message,timestamp:new Date().toISOString()}],
        };
        this._notifyClients(projectId, project.lastSnapshot);
      }
    }
  }

  _notifyClients(projectId, snapshot) {
    const project = this.projects.get(projectId);
    if (!project) return;

    const payload = `data: ${JSON.stringify({ type: 'update', revision: snapshot.contentRevision, snapshot })}\n\n`;
    for (const res of project.sseClients) {
      res.write(payload);
    }
  }

  start() {
    return new Promise((resolve, reject) => {
      this.refreshTimer = setInterval(() => {
        for (const id of this.projects.keys()) this._refreshProject(id);
      }, 2000);
      this.refreshTimer.unref();
      this.server = http.createServer((req, res) => this._handleRequest(req, res));
      this.server.listen(this.port, this.host, () => {
        resolve({
          port: this.server.address().port,
          token: this.token,
          url: `http://${this.host}:${this.server.address().port}/#token=${this.token}`,
        });
      });
      this.server.on('error', reject);
    });
  }

  stop() {
    return new Promise((resolve) => {
      clearInterval(this.refreshTimer);
      for (const watcher of this.watchers.values()) {
        try { watcher.close(); } catch {}
      }
      for (const project of this.projects.values()) {
        for (const res of project.sseClients) {
          try { res.end(); } catch {}
        }
      }
      if (this.server) {
        if (typeof this.server.closeAllConnections === 'function') {
          this.server.closeAllConnections();
        }
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  _handleRequest(req, res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    const authority = `${this.host}:${this.server?.address()?.port || this.port}`;
    const allowedHosts = new Set([authority, `localhost:${this.server?.address()?.port || this.port}`]);
    if (!allowedHosts.has(req.headers.host) || (req.headers.origin && !['http://' + authority, 'http://localhost:' + (this.server?.address()?.port || this.port)].includes(req.headers.origin))) {
      res.writeHead(403); res.end('Untrusted host or origin'); return;
    }
    if (req.method !== 'GET') { res.writeHead(405, { Allow: 'GET' }); res.end('Method not allowed'); return; }
    const parsedUrl = new URL(req.url, `http://${authority}`);
    const pathname = parsedUrl.pathname;

    if (pathname.startsWith('/api/account/')) { res.writeHead(404, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:'Accounts are provided by the optional account service'})); return; }

    // Token check for API routes
    if (pathname.startsWith('/api/')) {
      const authHeader = req.headers['authorization'];
      const queryToken = parsedUrl.searchParams.get('token');
      const providedToken = queryToken || (authHeader ? authHeader.replace(/^Bearer\s+/, '') : null);

      if (providedToken !== this.token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: invalid or missing security token' }));
        return;
      }
    }

    // Router
    if (pathname === '/api/projects') {
      const list = Array.from(this.projects.values()).map(p => ({
        id: p.id,
        name: p.lastSnapshot.projectId,
        root: p.root,
        profile: p.lastSnapshot.profile,
        activePhaseId: p.lastSnapshot.activePhaseId,
        contentRevision: p.lastSnapshot.contentRevision,
        metrics: p.lastSnapshot.metrics,
        phasesCount: p.lastSnapshot.phases.length,
      }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(list));
      return;
    }

    const snapshotMatch = pathname.match(/^\/api\/project\/([^/]+)\/snapshot$/);
    if (snapshotMatch) {
      const projectId = snapshotMatch[1];
      const project = this.projects.get(projectId);
      if (!project) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Project not found: ${projectId}` }));
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      this._refreshProject(projectId);
      res.setHeader('ETag', project.lastSnapshot.contentRevision);
      if (req.headers['if-none-match'] === project.lastSnapshot.contentRevision) { res.writeHead(304); res.end(); return; }
      res.end(JSON.stringify(project.lastSnapshot));
      return;
    }

    const eventsMatch = pathname.match(/^\/api\/project\/([^/]+)\/events$/);
    if (eventsMatch) {
      const projectId = eventsMatch[1];
      const project = this.projects.get(projectId);
      if (!project) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Project not found: ${projectId}` }));
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });
      res.write(`data: ${JSON.stringify({ type: 'connected', revision: project.lastSnapshot.contentRevision })}\n\n`);

      project.sseClients.add(res);
      req.on('close', () => {
        project.sseClients.delete(res);
      });
      return;
    }

    // Safe Artifact Read
    const artifactMatch = pathname.match(/^\/api\/project\/([^/]+)\/artifact$/);
    if (artifactMatch) {
      const projectId = artifactMatch[1];
      const project = this.projects.get(projectId);
      if (!project) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Project not found: ${projectId}` }));
        return;
      }

      const filePathParam = parsedUrl.searchParams.get('path');
      if (!filePathParam) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing path parameter' }));
        return;
      }

      try {
        const requested = path.resolve(project.root, filePathParam);
        const safePath = fs.realpathSync(requested);
        const relative = path.relative(project.root, safePath);
        const contained = relative && !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative);
        const allowed = /^(?:\.sdd|docs|scripts|skills|\.sdd-framework)[\/\\]/.test(relative);
        const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };
        const ext = path.extname(safePath).toLowerCase();
        const supported = mime[ext] || ['.md', '.json', '.sh', '.js', '.cjs', '.txt'].includes(ext);
        const stat = fs.statSync(safePath);
        if (!contained || !allowed || !supported || !stat.isFile() || stat.size > 4 * 1024 * 1024) throw new Error('Artifact is outside permitted scope');
        const content = fs.readFileSync(safePath);
        res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain; charset=utf-8' });
        res.end(content);
      } catch {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Artifact unavailable or outside permitted scope' }));
      }
      return;
    }

    // Static files fallback if staticDir configured
    if (this.staticDir && fs.existsSync(this.staticDir)) {
      let targetFile = path.join(this.staticDir, pathname === '/' ? 'index.html' : pathname);
      if (!targetFile.startsWith(this.staticDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
      if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
        const ext = path.extname(targetFile).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(targetFile).pipe(res);
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}
