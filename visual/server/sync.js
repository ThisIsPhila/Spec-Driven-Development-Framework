import crypto from 'node:crypto';
import path from 'node:path';
export function portableSnapshot(snapshot) {
  const root = snapshot.projectRoot;
  const visit = (value, key) => {
    if (key === 'projectRoot') return undefined;
    if (Array.isArray(value)) return value.map(item => visit(item));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, visit(v,k)]).filter(([,v]) => v !== undefined));
    if (key === 'path' && typeof value === 'string') {
      const relative = path.relative(root, value);
      return relative.startsWith('..') || path.isAbsolute(relative) ? '' : relative.split(path.sep).join('/');
    }
    return value;
  };
  return visit(snapshot);
}
export class SnapshotPublisher {
  constructor({ url, token, deviceId }) {
    const target = new URL(url);
    if (target.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) throw new Error('Remote sync requires HTTPS');
    this.url = new URL('/api/sync', target); this.token = token;
    this.deviceId = deviceId || crypto.randomUUID(); this.revisions = new Map();
  }
  async publish(project) {
    if (this.revisions.get(project.id) === project.lastSnapshot.contentRevision) return;
    const id = `${this.deviceId}-${project.id}`;
    const response = await fetch(this.url, { method: 'POST', headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, snapshot: portableSnapshot(project.lastSnapshot) }), signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Account synchronization failed (${response.status})`);
    this.revisions.set(project.id, project.lastSnapshot.contentRevision);
  }
}
