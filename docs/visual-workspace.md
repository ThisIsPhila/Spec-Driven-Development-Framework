# SDD Visual Workspace & Public Landing

The **SDD Visual Workspace** is an optional, read-only visual interface and interactive documentation cockpit for Spec-Driven Development projects.

It provides human engineers with a real-time, high-visibility dashboard into active phase sprints, requirements, designs, task progress, evidence records, and traceability links while agents work in the background.

---

## Key Principles & Architectural Boundaries

1. **Markdown Remains Authoritative Source of Truth:**
   - All specifications (`requirements.md`, `design.md`, `tasks.md`) and verification records (`.sdd/evidence/`) remain version-controlled Markdown files in git.
   - The visual workspace is strictly a **derived presentation layer**.
2. **Strictly Read-Only Cockpit:**
   - The local workspace server exposes **zero mutation or file-write endpoints**.
   - This eliminates race conditions and state corruption between human browser tabs and autonomous coding agents.
3. **Zero Core Footprint:**
   - The core SDD framework remains 100% pure Bash with zero external dependencies.
   - All web dependencies (Vite, Marked, DOMPurify, Mermaid) are strictly isolated within the optional `visual/` directory.
4. **Live Auto-Updating Without Configuration:**
   - The workspace connects to a Server-Sent Events (`SSE`) stream at `/api/project/:id/events`.
   - When an agent completes a task or updates an evidence record on disk, the UI updates dynamically within seconds without requiring manual page reloads or configuration.
   - Background polling (2-second interval when tab is active) acts as an automatic fallback if SSE is disconnected.
   - User scroll position, active tab, and filter selection are preserved across live refreshes.
5. **Traceability & Resilient Diagrams:**
   - Interactive responsive SVG graph connects Requirements (`REQ-*`), Tasks (`T*`), and Evidence records.
   - An equivalent accessible list representation (`role="list"`) is provided for keyboard navigation and screen readers.
   - Mermaid diagrams render inside design documents with automatic error boundaries that fall back to syntax-highlighted source code if invalid syntax is encountered.
6. **Public Landing & Synthetic Demo (skills.sh Model):**
   - Features a public introduction page showcasing the four pillars of SDD, composable engineering profiles (`general`, `web`, `api`, `fullstack`, `mobile`, `cloud`, `devsecops`, `mlops`), and quickstart instructions.
   - Includes a standalone synthetic demonstration dataset (`cloud-billing-service`) that works offline and in static production builds without local server APIs or live credentials.

---

## Quickstart & Commands

Inside the cloned framework repository:

### 1. Install Visual Dependencies
```bash
npm --prefix visual install
```

### 2. Launch Local Workspace Cockpit
To open the visual cockpit for the current project:
```bash
npm --prefix visual run workspace
```

To register multiple projects or a specific directory:
```bash
npm --prefix visual run workspace -- --project /path/to/project --project /path/to/another/project
```
The server binds to `127.0.0.1` on an available port, generates an ephemeral launch token, and prints the browser URL:
```text
🚀 SDD Visual Workspace running at:
   http://127.0.0.1:3456/?token=98a3b8...
```

### 3. Run Automated Tests
```bash
npm --prefix visual test
```
Executes Node native test suites covering project extraction, legacy checklist handling, deterministic revisions, server security bounds, markdown sanitization, traceability graphs, and synthetic demo integrity.

### 4. Build Static Public Production Bundle
```bash
npm --prefix visual run build
```
Generates a static web bundle in `visual/dist/` ready for hosting on GitHub Pages, Vercel, or Netlify.

---

## Security & Isolation

- **Ephemeral Launch Token:** Passed via URL fragment, immediately stored in `sessionStorage`, scrubbed from browser history, and required for all API endpoints (`/api/*`).
- **Loopback Only:** Binds strictly to `127.0.0.1`; external network requests are refused.
- **Path Traversal Guards:** Resolves and validates real filesystem paths against registered project roots. Attempts to access paths outside `.sdd` or escape via symlinks return `403 Forbidden`.
- **HTML & URI Sanitization:** All Markdown rendered through `marked` is sanitized via `DOMPurify` to neutralize `<script>`, `<iframe>`, and dangerous protocols (`javascript:`).

## Functional correctness and privacy

Launch credentials use the URL fragment and are moved into tab session storage. API reads and live streams send a Bearer header; old query-token API clients are supported for compatibility. Do not share a local launch URL. Host and Origin are checked, unrelated repository files and escaping symlinks are rejected, reads are bounded, and local raster media uses typed responses. Markdown and UI metadata use DOM sanitization plus metadata escaping.

Filesystem watchers are an optimization; a two-second server refresh fallback also detects Git, hooks and documentation changes. Browser task filters and source navigation operate on real extracted relationships. Markdown is canonical and HTML is derived. Evidence mentions are references. Missing results and unassessed acceptance stay unknown; completeness is a heuristic, not a verification grade. Hook configuration is separate from recorded execution.

Enable observed gate records while preserving and chaining an existing hook:

```sh
bash .sdd/scripts/hooks.sh status
bash .sdd/scripts/hooks.sh install
```

The runner records command, actual exit/result, timestamp, indexed tree, author identity and OS in `.sdd/evidence/hooks/runs.tsv`. A failed or missing required gate blocks its invocation. Recorded pass rate describes the retained log, not all commits or bypasses. Git hook bypass remains possible. New installations get this runner; existing hooks are preserved until explicitly chained.

The artifact map shows derived organizational links. If a real Graphify export exists at `graphify-out/graph.json` or `.sdd/graphify/graph.json`, the workspace imports it and retains edge provenance/confidence. Graphify inference is useful for exploration, while explicit requirement/task/evidence references remain the framework's contractual traceability.

See [community skill packs](community-skill-packs.md) and [accounts and synchronization](accounts-and-sync.md).

Core Bash compatibility is tested on this macOS environment. Windows core use requires Git Bash plus its Unix utilities; no native PowerShell lifecycle implementation or Windows runtime certification is claimed. The optional visual/account services require Node; account SQLite requires Node 22.13+. Current browser coverage uses Chromium.

Imported Graphify topology draws a bounded subset (150 nodes / 500 internal edges); full imported node and provenance lists remain available. Display limits are visible. Public Connect local accepts the complete loopback launch URL and opens that service; it does not send a local token to a hosted account API.

## Project experience

Signed-in users start at **Projects**, with their real connected projects. **About** is the public product page; when signed in it includes a private **Your workspace** shortcut section. **Account** owns identity, sign-out and machine connection. Opening Projects never issues a machine credential or opens a connection dialog.

A project opens at **Project overview**. The on-screen section rail contains Phases, Decisions & context, Reviews, Checks & automation, Resources & graphs, and Detailed metrics. Project sections do not occupy the global header.

Overview derives recognized task completion, phase progress, requirement mappings, recorded evidence outcomes, missing active-phase inputs and extraction warnings. Pending work and attention items link to the relevant phase. Decision excerpts link to their source record. Unsupported task formats remain unassessed; charts are current recorded progress, not invented historical performance or acceptance.

The Skills & Profiles directory and public catalog entries open real bundled profile documentation, included files, composition guidance and copyable setup commands. Profiles remain framework configurations; standard SKILL.md packages are reusable instructions, and composition packs interoperate with them. A profile is not advertised as a downloadable third-party skill that does not exist.
