import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
export class AccountStore {
  constructor(filename) {
    if (filename !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(filename);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS credentials(hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, expires INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS projects(user_id TEXT NOT NULL REFERENCES users(id), id TEXT NOT NULL, snapshot TEXT NOT NULL, updated TEXT NOT NULL, PRIMARY KEY(user_id,id));`);
    if (filename !== ':memory:') fs.chmodSync(filename, 0o600);
  }
  async register(email, password) {
    email = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== 'string' || password.length < 12 || password.length > 256) throw new Error('Use a valid email and a password of 12–256 characters');
    const id = crypto.randomUUID(), salt = crypto.randomBytes(16).toString('hex');
    const hashed = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (err, result) => err ? reject(err) : resolve(result.toString('hex'))));
    try { this.db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(id, email, salt, hashed); }
    catch (error) { if (error.message.includes('UNIQUE constraint failed: users.email')) {const duplicate = new Error('An account with this email already exists. Choose Sign in instead.'); duplicate.code = 'ACCOUNT_EXISTS'; throw duplicate;} throw error; }
    return { id, email };
  }
  async login(email, password) {
    if (typeof password !== 'string' || password.length > 256) throw new Error('Invalid credentials');
    const user = this.db.prepare('SELECT * FROM users WHERE email=?').get(String(email || '').trim().toLowerCase());
    const hashed = await new Promise((resolve, reject) => crypto.scrypt(password, user?.salt || 'missing-user', 64, (err, result) => err ? reject(err) : resolve(result)));
    if (!user || !crypto.timingSafeEqual(hashed, Buffer.from(user.password, 'hex'))) throw new Error('Invalid credentials');
    return { id: user.id, email: user.email };
  }
  issue(userId, kind = 'session') {
    const token = crypto.randomBytes(32).toString('hex');
    this.db.prepare('INSERT INTO credentials VALUES(?,?,?,?)').run(digest(token), userId, kind, Date.now() + (kind === 'session' ? 86400000 : 30 * 86400000));
    return token;
  }
  authenticate(token, kind = 'session') {
    if (!token || token.length > 128) return null;
    return this.db.prepare('SELECT users.id,users.email FROM credentials JOIN users ON users.id=credentials.user_id WHERE hash=? AND kind=? AND expires>?').get(digest(token), kind, Date.now()) || null;
  }
  revokeConnectors(userId) { this.db.prepare("DELETE FROM credentials WHERE user_id=? AND kind='connector'").run(userId); }
  revoke(token) { this.db.prepare('DELETE FROM credentials WHERE hash=?').run(digest(token || '')); }
  publish(userId, id, snapshot) {
    if (!/^[a-zA-Z0-9._-]{1,160}$/.test(id) || !snapshot || !Array.isArray(snapshot.phases) || typeof snapshot.contentRevision !== 'string') throw new Error('Invalid project snapshot');
    const serialized = JSON.stringify(snapshot);
    if (Buffer.byteLength(serialized) > 16 * 1024 * 1024) throw new Error('Snapshot exceeds 16 MiB limit');
    this.db.prepare('INSERT INTO projects VALUES(?,?,?,?) ON CONFLICT(user_id,id) DO UPDATE SET snapshot=excluded.snapshot,updated=excluded.updated').run(userId, id, serialized, new Date().toISOString());
  }
  list(userId) {
    return this.db.prepare('SELECT id,snapshot,updated FROM projects WHERE user_id=? ORDER BY updated DESC').all(userId).map(row => {
      const snapshot = JSON.parse(row.snapshot);
      return { id: row.id, name: snapshot.projectId, profile: snapshot.profile, activePhaseId: snapshot.activePhaseId, contentRevision: snapshot.contentRevision, metrics: snapshot.metrics, phasesCount: snapshot.phases.length, updated: row.updated };
    });
  }
  snapshot(userId, id) {
    const row = this.db.prepare('SELECT snapshot FROM projects WHERE user_id=? AND id=?').get(userId, id);
    return row ? JSON.parse(row.snapshot) : null;
  }
  getSetting(key) { return this.db.prepare('SELECT value FROM settings WHERE key=?').get(key)?.value; }
  setSetting(key,value) { this.db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,value); }
  close() { this.db.close(); }
}
