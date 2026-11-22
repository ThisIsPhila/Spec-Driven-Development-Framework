# Phase 009 — Verification Evidence

**Phase:** `phase-009-landing-and-cloud-workspace`  
**Branch:** `feat/phase-009-landing-and-cloud-workspace`  
**Date:** 2026-11-22  

## Summary of Implemented Capabilities

1. **Editorial Product Landing Page (`visual/packages/web-app/src/views/LandingView.tsx`)**
   - Default view when no local daemon project is connected and user is signed out.
   - Accessible from anywhere via the top-left `SDD` brand button in `Masthead.tsx`.
   - Includes Swiss-editorial hero, **Try Interactive Demo** (`demoSnapshot.ts`), **Connect Project**, **Sign In / Create Cloud Account** CTA, 3-column feature grid, and collapsible **Local CLI** disclosure.
2. **Browser-Native `.sdd/` Folder Import (`sddParser.ts` & `ConnectProjectModal.tsx`)**
   - Supports `webkitdirectory` file input and `showDirectoryPicker` File System Access API.
   - Parses `specs/{active,archive,backlog}/`, `requirements.md`, `design.md`, `tasks.md`, `constitution.md`, `framework.json`, `metrics/events.jsonl`, `metrics/report.json`, and `evidence/` client-side in TypeScript.
3. **GitHub Repository Import (`visual/packages/cloud-api/api/cloud/import-github.js` & `githubImport.ts`)**
   - Serverless `/api/cloud/import-github` endpoint + client GitHub REST fallback supporting public repos and transient PATs (never stored).
4. **Cloud & Browser Persistence (`projectStore.ts`, `dataSource.ts`, `.env.example`)**
   - Syncs to Supabase (`sdd_projects`, `sdd_snapshots`) when signed in; persists cleanly in `IndexedDB` + `localStorage` when signed out or unconfigured.

## Verification Checks

- `npm --prefix visual test`: **56 passed, 0 failed** (including 5 new unit tests for `import-github.js`)
- `npm --prefix visual run build:app`: **passed** (`tsc --noEmit && vite build`)
- `npm --prefix visual run test:browser`: **7 passed, 0 failed** (Playwright Chromium across `375px`, `768px`, `1024px`, `1440px`, interactive demo, `SDD Home`, browser folder upload, and reload persistence)
- `bash scripts/doctor.sh`: **Result: OK**
- `bash tests/run.sh`: **12 test files run, 0 failed**
