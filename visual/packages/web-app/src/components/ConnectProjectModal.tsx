import React, { useRef, useState } from 'react';
import { AlertTriangle, FolderOpen, Github, Upload, X, CheckCircle2 } from 'lucide-react';
import type { ProjectSnapshot, ProjectSummary } from '@sdd/contracts';
import { parseSddFileMap, readDirectoryFiles, readDirectoryHandle } from '../services/sddParser';
import { importFromGitHub } from '../services/githubImport';
import { saveImportedProject } from '../services/dataSource';

interface ConnectProjectModalProps {
  open: boolean;
  onClose: () => void;
  onImported: (summary: ProjectSummary, snapshot: ProjectSnapshot, persistedTo: 'cloud' | 'browser') => void;
  cloudUserEmail: string | null;
}

type ImportTab = 'folder' | 'github';

export function ConnectProjectModal({
  open,
  onClose,
  onImported,
  cloudUserEmail,
}: ConnectProjectModalProps) {
  const [tab, setTab] = useState<ImportTab>('folder');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoInput, setRepoInput] = useState('');
  const [refInput, setRefInput] = useState('');
  const [patInput, setPatInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const finalizeSnapshot = async (snapshot: ProjectSnapshot) => {
    const { summary, persistedTo } = await saveImportedProject(snapshot);
    setPatInput('');
    onImported(summary, snapshot, persistedTo);
    onClose();
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const { projectName, files } = await readDirectoryFiles(list);
      const snapshot = parseSddFileMap(projectName, files);
      await finalizeSnapshot(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse selected folder.');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const handleDirectoryPicker = async () => {
    const picker = (window as unknown as { showDirectoryPicker?: () => Promise<unknown> }).showDirectoryPicker;
    if (!picker) {
      fileInputRef.current?.click();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const handle = await picker();
      const { projectName, files } = await readDirectoryHandle(
        handle as Parameters<typeof readDirectoryHandle>[0],
      );
      const snapshot = parseSddFileMap(projectName, files);
      await finalizeSnapshot(snapshot);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setBusy(false);
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to read selected folder.');
    } finally {
      setBusy(false);
    }
  };

  const handleGitHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const snapshot = await importFromGitHub({
        repo: repoInput,
        ref: refInput.trim() || undefined,
        pat: patInput.trim() || undefined,
      });
      await finalizeSnapshot(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub import failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.52)' }}
    >
      <div
        className="w-full max-w-xl sdd-surface p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--paper-raised)', color: 'var(--ink)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 sdd-rule-b">
          <div>
            <div className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
              Zero-CLI Project Import
            </div>
            <h2 id="connect-modal-title" className="text-[20px] font-semibold tracking-tight">
              Connect an SDD Project
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close connect project modal"
            className="p-1.5 cursor-pointer sdd-rule-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Persistence Notice */}
        <div
          className="px-3.5 py-2.5 sdd-rule-all flex items-center gap-2 text-[12px]"
          style={{ backgroundColor: 'var(--paper)', color: 'var(--ink-2)' }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          <span>
            {cloudUserEmail
              ? `Signed in as ${cloudUserEmail} — imported snapshots sync to your private Supabase Cloud workspace.`
              : 'Persisted safely in your browser storage (IndexedDB). Sign in anytime to sync across devices.'}
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setTab('folder');
              setError(null);
            }}
            className="flex-1 py-2.5 px-3 text-[12px] font-mono-sdd uppercase tracking-wide cursor-pointer inline-flex items-center justify-center gap-2"
            style={{
              border: '1px solid var(--ink)',
              backgroundColor: tab === 'folder' ? 'var(--ink)' : 'transparent',
              color: tab === 'folder' ? 'var(--paper)' : 'var(--ink)',
            }}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Local .sdd/ Folder</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('github');
              setError(null);
            }}
            className="flex-1 py-2.5 px-3 text-[12px] font-mono-sdd uppercase tracking-wide cursor-pointer inline-flex items-center justify-center gap-2"
            style={{
              border: '1px solid var(--ink)',
              backgroundColor: tab === 'github' ? 'var(--ink)' : 'transparent',
              color: tab === 'github' ? 'var(--paper)' : 'var(--ink)',
            }}
          >
            <Github className="w-4 h-4" />
            <span>GitHub Repo</span>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 sdd-rule-all flex items-start gap-2 text-[13px]"
            style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {tab === 'folder' ? (
          <div className="flex flex-col gap-4">
            <div
              className="p-6 sdd-rule-all flex flex-col items-center text-center gap-3"
              style={{ backgroundColor: 'var(--paper)' }}
            >
              <Upload className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              <div className="text-[14px] font-medium">
                Select a repository root or <code className="font-mono-sdd">.sdd/</code> folder
              </div>
              <p className="text-[12px] max-w-md" style={{ color: 'var(--ink-2)' }}>
                Parses <code className="font-mono-sdd">specs/</code>, <code className="font-mono-sdd">requirements.md</code>,{' '}
                <code className="font-mono-sdd">design.md</code>, <code className="font-mono-sdd">tasks.md</code>,{' '}
                <code className="font-mono-sdd">constitution.md</code>, and <code className="font-mono-sdd">metrics/</code> directly in TypeScript. Files stay in your browser unless you sign in to sync.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleDirectoryPicker}
                  className="px-4 py-2 text-[12px] font-mono-sdd uppercase tracking-wide cursor-pointer"
                  style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
                >
                  {busy ? 'Parsing folder...' : 'Choose Folder'}
                </button>
                <label
                  className="px-4 py-2 text-[12px] font-mono-sdd uppercase tracking-wide cursor-pointer sdd-rule-all"
                  style={{ backgroundColor: 'var(--paper-raised)' }}
                >
                  <span>Browse via File Input</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    // @ts-expect-error webkitdirectory is supported across Chromium/Firefox/Safari
                    webkitdirectory=""
                    directory=""
                    onChange={handleFileInput}
                    data-testid="folder-file-input"
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGitHubSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                Repository (owner/repo)
              </span>
              <input
                type="text"
                required
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="ThisIsPhila/Spec-Driven-Development-Framework"
                className="px-3 py-2 text-[13px] sdd-rule-all"
                style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                  Branch or Tag (optional)
                </span>
                <input
                  type="text"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  placeholder="main"
                  className="px-3 py-2 text-[13px] sdd-rule-all"
                  style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="font-mono-sdd text-[11px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                  GitHub PAT (optional, transient)
                </span>
                <input
                  type="password"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  placeholder="ghp_... (private repos)"
                  autoComplete="off"
                  className="px-3 py-2 text-[13px] sdd-rule-all"
                  style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
                />
              </label>
            </div>

            <p className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
              Reads only <code className="font-mono-sdd">.sdd/</code> and <code className="font-mono-sdd">skills/</code> files via GitHub REST API. Personal access tokens are used only for the fetch request and never saved.
            </p>

            <button
              type="submit"
              disabled={busy}
              className="py-2.5 text-[12px] font-mono-sdd uppercase tracking-wide cursor-pointer"
              style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
            >
              {busy ? 'Importing .sdd/ from GitHub...' : 'Import Repository'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
