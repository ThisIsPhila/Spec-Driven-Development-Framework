import crypto from 'node:crypto';
import { extractProject } from './extract.js';
import { portableSnapshot } from './sync.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { AccountStore } from './accounts.js';
export class AccountService {
  constructor({ database, port = 3457, host = '127.0.0.1', publicOrigin, staticDir, bootstrapProjects = [] } = {}) {
    if (!database) throw new Error('Explicit account database path required');
    this.store = new AccountStore(database); this.port = port; this.host = host;
    this.publicOrigin = publicOrigin; this.staticDir = staticDir; this.attempts = new Map();
    this.bootstrapProjects = bootstrapProjects;
    this.bootstrapScope = 'bootstrap-owner-' + crypto.createHash('sha256').update(JSON.stringify(bootstrapProjects.map(root => path.resolve(root)).sort())).digest('hex');
    this.bootstrapOwner = this.store.getSetting(this.bootstrapScope);
    this.bootstrapRevisions = new Map();
    this.bootstrapToken = bootstrapProjects.length && !this.bootstrapOwner ? crypto.randomBytes(32).toString('hex') : null;
  }
  async start() {
    this.server = http.createServer((req, res) => this.handle(req, res).catch(() => { if (!res.headersSent) res.writeHead(400); res.end('Request could not be completed'); }));
    await new Promise((resolve, reject) => { this.server.once('error', reject); this.server.listen(this.port, this.host, resolve); });
    this.bootstrapTimer = setInterval(() => this.refreshBootstrap(), 2000); this.bootstrapTimer.unref();
    this.refreshBootstrap();
    this.origin = this.publicOrigin || `http://${this.host}:${this.server.address().port}`;
    return { port: this.server.address().port, url: this.origin + (this.bootstrapToken ? '/#bootstrap=' + this.bootstrapToken : '') };
  }
  async stop() { clearInterval(this.bootstrapTimer); await new Promise(resolve => { this.server.closeAllConnections?.(); this.server.close(resolve); }); this.store.close(); }
  refreshBootstrap() {
    if (!this.bootstrapOwner) return;
    for (const root of this.bootstrapProjects) {
      try {
        const snapshot = extractProject(root);
        if (this.bootstrapRevisions.get(root) === snapshot.contentRevision) continue;
        const id = 'bootstrap-' + crypto.createHash('sha256').update(fs.realpathSync(root)).digest('hex').slice(0,16);
        this.store.publish(this.bootstrapOwner, id, portableSnapshot(snapshot));
        this.bootstrapRevisions.set(root, snapshot.contentRevision);
      } catch (error) { console.error('[SDD bootstrap refresh]', error.message); }
    }
  }
  async body(req) {
    let size = 0; const chunks = [];
    for await (const chunk of req) { size += chunk.length; if (size > 16 * 1024 * 1024) throw new Error('Payload too large'); chunks.push(chunk); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  }
  async handle(req, res) {
    const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('Referrer-Policy', 'no-referrer');
    if (req.headers.host !== new URL(this.origin).host || (req.headers.origin && req.headers.origin !== this.origin)) return json(403, { error: 'Untrusted origin or host' });
    const url = new URL(req.url, this.origin);
    const token = /(?:^|;\s*)sdd_session=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
    const user = this.store.authenticate(token);
    const cookie = session => res.setHeader('Set-Cookie', `sdd_session=${session}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${session ? 86400 : 0}${this.origin.startsWith('https:') ? '; Secure' : ''}`);
    if (['/api/account/register', '/api/account/login'].includes(url.pathname) && req.method === 'POST') {
      const key = req.socket.remoteAddress; const now = Date.now();
      const attempts = (this.attempts.get(key) || []).filter(time => now - time < 60000);
      if (attempts.length >= 10) return json(429, { error: 'Too many attempts; retry in a minute' });
      attempts.push(now); this.attempts.set(key, attempts);
      try {
        const body = await this.body(req);
        const account = url.pathname.endsWith('register') ? await this.store.register(body.email, body.password) : await this.store.login(body.email, body.password);
        cookie(this.store.issue(account.id));
        if (this.bootstrapToken && req.headers['x-sdd-bootstrap'] === this.bootstrapToken) {
          this.bootstrapOwner = account.id; this.store.setSetting(this.bootstrapScope, account.id);
          this.refreshBootstrap();
          this.bootstrapToken = null;
        }
        return json(200, account);
      } catch (error) {
        if (error.code === 'ACCOUNT_EXISTS') return json(409, {error:error.message});
        if (url.pathname.endsWith('login')) return json(401, {error:'Email or password is incorrect. If you have not created an account yet, choose Create account.'});
        return json(400, {error:'Account creation failed. Enter a valid email and a password of 12–256 characters.'});
      }
    }
    if (url.pathname === '/api/account/logout' && req.method === 'POST') { this.store.revoke(token); cookie(''); return json(200, { ok: true }); }
    if (url.pathname === '/api/sync' && req.method === 'POST') {
      const connector = this.store.authenticate((req.headers.authorization || '').replace(/^Bearer /, ''), 'connector');
      if (!connector) return json(401, { error: 'Connector credential required' });
      const body = await this.body(req); this.store.publish(connector.id, body.id, body.snapshot); return json(200, { ok: true });
    }
    if (url.pathname.startsWith('/api/')) {
      if (!user) return json(401, { error: 'Sign in required' });
      if (url.pathname === '/api/account/me' && req.method === 'GET') return json(200, user);
      if (url.pathname === '/api/account/connector/revoke' && req.method === 'POST') { this.store.revokeConnectors(user.id); return json(200,{ok:true}); }
      if (url.pathname === '/api/account/connector' && req.method === 'POST') return json(200, { token: this.store.issue(user.id, 'connector'), expiresInDays: 30 });
      if (url.pathname === '/api/projects' && req.method === 'GET') return json(200, this.store.list(user.id));
      const match = url.pathname.match(/^\/api\/project\/([^/]+)\/snapshot$/);
      if (match && req.method === 'GET') { const snapshot = this.store.snapshot(user.id, match[1]); if (snapshot) { res.setHeader('ETag', snapshot.contentRevision); if (req.headers['if-none-match'] === snapshot.contentRevision) { res.writeHead(304); res.end(); return; } } return json(snapshot ? 200 : 404, snapshot || { error: 'Project not found' }); }
      const artifact = url.pathname.match(/^\/api\/project\/([^/]+)\/artifact$/);
      if (artifact && req.method === 'GET') {
        const snapshot = this.store.snapshot(user.id, artifact[1]);
        const requested = url.searchParams.get('path');
        const find = value => {
          if (!value || typeof value !== 'object') return null;
          if (value.path === requested && typeof value.content === 'string') return value.content;
          for (const child of Object.values(value)) { const found = find(child); if (found !== null) return found; }
          return null;
        };
        const content = snapshot ? find(snapshot) : null;
        if (content === null) return json(404, { error: 'Artifact not published' });
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(content); return;
      }
      return json(404, { error: 'Endpoint unavailable' });
    }
    if (req.method !== 'GET') return json(405, { error: 'Method not allowed' });
    if (this.staticDir) {
      const root = fs.realpathSync(this.staticDir);
      const requested = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
      try {
        const canonical = fs.realpathSync(requested), relative = path.relative(root, canonical);
        if (relative.startsWith('..') || path.isAbsolute(relative) || !fs.statSync(canonical).isFile()) throw new Error('Invalid file');
        const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
        res.writeHead(200, { 'Content-Type': mime[path.extname(canonical)] || 'application/octet-stream' }); fs.createReadStream(canonical).pipe(res); return;
      } catch {}
    }
    json(404, { error: 'Not found' });
  }
}
