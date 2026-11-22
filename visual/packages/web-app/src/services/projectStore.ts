import type { ProjectSnapshot, ProjectSummary } from '@sdd/contracts';

const DB_NAME = 'sdd-workspace-db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const LS_KEY = 'sdd.browserProjects.v1';

interface StoredRecord {
  id: string;
  summary: ProjectSummary;
  snapshot: ProjectSnapshot;
  updatedAt: string;
}

function sanitizeSnapshot(snapshot: ProjectSnapshot): ProjectSnapshot {
  const copy: ProjectSnapshot = { ...snapshot };
  delete copy.projectRoot;
  return copy;
}

export function buildProjectSummary(
  snapshot: ProjectSnapshot,
  source: ProjectSummary['source'] = 'browser',
): ProjectSummary {
  const id = snapshot.projectId || 'imported-project';
  return {
    id,
    name: snapshot.projectName || id,
    source,
    activePhaseId: snapshot.activePhaseId,
    overallProgressPct: snapshot.metrics?.overallProgressPct ?? 0,
    frameworkVersion: snapshot.framework?.version || '2.4.0',
    lastSyncedAt: new Date().toISOString(),
    contentRevision: snapshot.contentRevision,
  };
}

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function readLocalStorageRecords(): StoredRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalStorageRecords(records: StoredRecord[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(records));
  } catch {
    // ignore quota errors
  }
}

export async function listBrowserProjects(): Promise<ProjectSummary[]> {
  const db = await openDb();
  if (db) {
    try {
      const records = await new Promise<StoredRecord[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : []);
        req.onerror = () => resolve([]);
      });
      if (records.length > 0) {
        return records
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .map((r) => r.summary);
      }
    } catch {
      // fall through to localStorage
    }
  }
  return readLocalStorageRecords().map((r) => r.summary);
}

export async function getBrowserSnapshot(projectId: string): Promise<ProjectSnapshot | null> {
  const db = await openDb();
  if (db) {
    try {
      const rec = await new Promise<StoredRecord | undefined>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(projectId);
        req.onsuccess = () => resolve(req.result as StoredRecord | undefined);
        req.onerror = () => resolve(undefined);
      });
      if (rec?.snapshot) return rec.snapshot;
    } catch {
      // fall through
    }
  }
  const found = readLocalStorageRecords().find((r) => r.id === projectId);
  return found?.snapshot || null;
}

export async function saveBrowserProject(
  snapshot: ProjectSnapshot,
  source: ProjectSummary['source'] = 'browser',
): Promise<ProjectSummary> {
  const clean = sanitizeSnapshot(snapshot);
  const summary = buildProjectSummary(clean, source);
  const record: StoredRecord = {
    id: summary.id,
    summary,
    snapshot: clean,
    updatedAt: new Date().toISOString(),
  };

  const db = await openDb();
  if (db) {
    try {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // fallback below
    }
  }

  const existing = readLocalStorageRecords().filter((r) => r.id !== record.id);
  writeLocalStorageRecords([record, ...existing].slice(0, 10));
  return summary;
}

export async function removeBrowserProject(projectId: string): Promise<void> {
  const db = await openDb();
  if (db) {
    try {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(projectId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  }
  const next = readLocalStorageRecords().filter((r) => r.id !== projectId);
  writeLocalStorageRecords(next);
}
