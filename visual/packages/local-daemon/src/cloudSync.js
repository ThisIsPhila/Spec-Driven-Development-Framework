import { portableSnapshot } from '../../../server/sync.js';

/**
 * Pushes portable (path-stripped) SDD snapshots to the Vercel/Supabase cloud API
 * when the user has signed in and configured SDD_CLOUD_URL + SDD_CLOUD_TOKEN.
 */
export class CloudSyncClient {
  constructor({ baseUrl, accessToken }) {
    this.baseUrl = String(baseUrl || '').replace(/\/+$/, '');
    this.accessToken = accessToken;
  }

  async pushProject(projectEntry) {
    if (!this.baseUrl || !this.accessToken) return null;
    const clean = portableSnapshot(projectEntry.snapshot);
    const payload = {
      slug: projectEntry.id,
      name: clean.projectName || projectEntry.id,
      frameworkVersion: clean.framework?.version || '2.3.0',
      activePhaseId: clean.activePhaseId || null,
      revision: clean.contentRevision || projectEntry.revision,
      snapshot: clean,
    };
    const res = await fetch(`${this.baseUrl}/api/cloud/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Cloud sync failed (${res.status}): ${text || res.statusText}`);
    }
    return res.json();
  }
}
