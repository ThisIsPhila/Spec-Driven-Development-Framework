import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { extractProject } from './extract.js';

export class LocalProjectService {
  constructor(options = {}) {
    this.port = options.port || 3456;
    this.host = options.host || '127.0.0.1';
    this.token = options.token || crypto.randomBytes(16).toString('hex');
    this.projects = new Map(); // id -> { root, lastSnapshot, sseClients: Set }
    this.watchers = new Map(); // id -> fs.FSWatcher
    this.staticDir = options.staticDir || null;
    this.server = null;
  }

  registerProject(projectPath) {
    const resolvedRoot = path.resolve(projectPath);
    const sddDir = path.join(resolvedRoot, '.sdd');

    if (!fs.existsSync(sddDir)) {
      throw new Error(`Cannot register project: .sdd directory not found in ${resolvedRoot}`);
    }

    const projectId = path.basename(resolvedRoot);
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
      // Keep last valid snapshot, annotate transient diagnostic
      project.lastSnapshot.diagnostics.push({
        type: 'warning',
        message: `Transient read warning during file change: ${err.message}`,
        timestamp: new Date().toISOString(),
      });
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
      this.server = http.createServer((req, res) => this._handleRequest(req, res));
      this.server.listen(this.port, this.host, () => {
        resolve({
          port: this.server.address().port,
          token: this.token,
          url: `http://${this.host}:${this.server.address().port}/?token=${this.token}`,
        });
      });
      this.server.on('error', reject);
    });
  }

  stop() {
    return new Promise((resolve) => {
      for (const watcher of this.watchers.values()) {
        try { watcher.close(); } catch {}
      }
      for (const project of this.projects.values()) {
        for (const res of project.sseClients) {
          try { res.end(); } catch {}
        }
      }
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  _handleRequest(req, res) {
    // Basic CORS and Security Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

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
      res.writeHead(200, { 'Content-Type': 'application/json' });
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

      const safePath = path.resolve(project.root, filePathParam);
      if (!safePath.startsWith(project.root) || !fs.existsSync(safePath) || !fs.statSync(safePath).isFile()) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden: path traversal blocked or file not found' }));
        return;
      }

      const content = fs.readFileSync(safePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
      res.end(content);
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
