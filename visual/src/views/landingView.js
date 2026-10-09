/**
 * Public Landing Page View (skills.sh authentic directory design)
 */

export const LANDING_PROFILES = [
  {
    rank: 1,
    id: 'web',
    name: 'web',
    repo: 'sdd/profiles/web',
    desc: 'Frontend ergonomics, bundle size budgets, responsive layout, and WCAG accessibility.',
    runs: '1.8M',
    category: 'official',
    sparkline: 'M 2,16 C 14,14 26,10 42,9 C 58,8 74,6 90,4 C 106,3 122,2 138,2',
    sparkArea: 'M 2,16 C 14,14 26,10 42,9 C 58,8 74,6 90,4 C 106,3 122,2 138,2 L 138,22 L 2,22 Z'
  },
  {
    rank: 2,
    id: 'api',
    name: 'api',
    repo: 'sdd/profiles/api',
    desc: 'Contract definitions, idempotency keys, rate limiting, and backward compatibility.',
    runs: '1.4M',
    category: 'official',
    sparkline: 'M 2,18 C 14,16 26,12 42,11 C 58,10 74,8 90,6 C 106,5 122,4 138,3',
    sparkArea: 'M 2,18 C 14,16 26,12 42,11 C 58,10 74,8 90,6 C 106,5 122,4 138,3 L 138,22 L 2,22 Z'
  },
  {
    rank: 3,
    id: 'devsecops',
    name: 'devsecops',
    repo: 'sdd/profiles/devsecops',
    desc: 'Automated vulnerability scanning, SAST/DAST gates, and SBOM verification.',
    runs: '1.1M',
    category: 'audited',
    sparkline: 'M 2,20 C 14,17 26,13 42,10 C 58,8 74,5 90,4 C 106,3 122,2 138,2',
    sparkArea: 'M 2,20 C 14,17 26,13 42,10 C 58,8 74,5 90,4 C 106,3 122,2 138,2 L 138,22 L 2,22 Z'
  },
  {
    rank: 4,
    id: 'mlops',
    name: 'mlops',
    repo: 'sdd/profiles/mlops',
    desc: 'Dataset provenance, model validation metrics, drift detection, and reproducible training.',
    runs: '890K',
    category: 'trending',
    sparkline: 'M 2,21 C 14,19 26,16 42,12 C 58,9 74,7 90,5 C 106,4 122,3 138,3',
    sparkArea: 'M 2,21 C 14,19 26,16 42,12 C 58,9 74,7 90,5 C 106,4 122,3 138,3 L 138,22 L 2,22 Z'
  },
  {
    rank: 5,
    id: 'fullstack',
    name: 'fullstack',
    repo: 'sdd/profiles/fullstack',
    desc: 'Coordinated client and server specs with end-to-end integration boundaries.',
    runs: '760K',
    category: 'official',
    sparkline: 'M 2,17 C 14,15 26,13 42,12 C 58,10 74,8 90,7 C 106,6 122,5 138,4',
    sparkArea: 'M 2,17 C 14,15 26,13 42,12 C 58,10 74,8 90,7 C 106,6 122,5 138,4 L 138,22 L 2,22 Z'
  },
  {
    rank: 6,
    id: 'cloud',
    name: 'cloud',
    repo: 'sdd/profiles/cloud',
    desc: 'Declarative infrastructure, least-privilege IAM, and zero-trust policies.',
    runs: '640K',
    category: 'audited',
    sparkline: 'M 2,19 C 14,16 26,14 42,12 C 58,11 74,9 90,8 C 106,6 122,5 138,4',
    sparkArea: 'M 2,19 C 14,16 26,14 42,12 C 58,11 74,9 90,8 C 106,6 122,5 138,4 L 138,22 L 2,22 Z'
  },
  {
    rank: 7,
    id: 'mobile',
    name: 'mobile',
    repo: 'sdd/profiles/mobile',
    desc: 'App lifecycle, offline state synchronization, and permission guardrails.',
    runs: '520K',
    category: 'trending',
    sparkline: 'M 2,20 C 14,18 26,15 42,13 C 58,11 74,9 90,8 C 106,7 122,6 138,5',
    sparkArea: 'M 2,20 C 14,18 26,15 42,13 C 58,11 74,9 90,8 C 106,7 122,6 138,5 L 138,22 L 2,22 Z'
  },
  {
    rank: 8,
    id: 'general',
    name: 'general',
    repo: 'sdd/profiles/general',
    desc: 'Standard multi-tier engineering with core requirement and design gates.',
    runs: '410K',
    category: 'official',
    sparkline: 'M 2,16 C 14,15 26,14 42,12 C 58,11 74,10 90,9 C 106,8 122,7 138,6',
    sparkArea: 'M 2,16 C 14,15 26,14 42,12 C 58,11 74,10 90,9 C 106,8 122,7 138,6 L 138,22 L 2,22 Z'
  }
];

export function renderLandingView() {
  const agents = [
    { name: 'Claude Code', type: 'Official' },
    { name: 'Cursor', type: 'Official' },
    { name: 'Codex', type: 'Official' },
    { name: 'GitHub Copilot', type: 'Official' },
    { name: 'Windsurf', type: 'Official' },
    { name: 'Gemini', type: 'Official' },
    { name: 'Cline', type: 'Community' },
    { name: 'Antigravity', type: 'Official' },
    { name: 'OpenClaw', type: 'Community' },
    { name: 'Roo Code', type: 'Community' },
    { name: 'Zed', type: 'Official' },
    { name: 'VS Code', type: 'Official' }
  ];

  return `
    <div class="skills-page-wrapper">
      <!-- Hero Grid Section (Exact skills.sh Structure) -->
      <section class="skills-hero-container">
        <div class="skills-hero-grid">
          <!-- ASCII Logo & Kicker -->
          <div class="hero-left-col">
            <div class="ascii-wrapper" aria-hidden="true">
              <pre class="ascii-logo">███████╗██████╗ ██████╗ 
██╔════╝██╔══██╗██╔══██╗
███████╗██║  ██║██║  ██║
╚════██║██║  ██║██║  ██║
███████║██████╔╝██████╔╝
╚══════╝╚═════╝ ╚═════╝ </pre>
            </div>
            <p class="hero-kicker-mono">The Open Spec-Driven Development Ecosystem</p>
          </div>

          <!-- Hero Headline & Description -->
          <div class="hero-right-col">
            <h1 class="skills-sr-only">Spec-Driven Development</h1>
            <p class="hero-lead-text">
              Specs are reusable contracts for AI agents and human engineers. Install procedural workflows with verifiable requirement gates, automated git guardrails, and audit-ready governance.
            </p>
          </div>

          <!-- Try it now command box -->
          <div class="hero-try-it-now">
            <h2 class="try-kicker">Try it now</h2>
            <div class="cli-command-box" id="install-cmd-box" role="button" tabindex="0" title="Click to copy install command">
              <code class="command-code">
                <span class="prompt-symbol">$</span>
                <span class="cmd-run-text">curl -fsSL https://raw.githubusercontent.com/ThisIsPhila/Spec-Driven-Development-Framework/main/setup.sh | bash</span>
              </code>
              <button class="copy-trigger-btn" id="copy-cmd-btn" aria-label="Copy to clipboard" title="Copy to clipboard">
                <svg viewBox="0 0 16 16" height="16" width="16" fill="currentColor">
                  <path fill-rule="evenodd" d="M2.75.5C1.78.5 1 1.28 1 2.25v7.5c0 .97.78 1.75 1.75 1.75H4.5V10H2.75a.25.25 0 0 1-.25-.25v-7.5c0-.14.11-.25.25-.25h5.5c.14 0 .25.11.25.25V3H10v-.75C10 1.28 9.22.5 8.25.5zm5 4C6.78 4.5 6 5.28 6 6.25v7.5c0 .97.78 1.75 1.75 1.75h5.5c.97 0 1.75-.78 1.75-1.75v-7.5c0-.97-.78-1.75-1.75-1.75zM7.5 6.25c0-.14.11-.25.25-.25h5.5c.14 0 .25.11.25.25v7.5q-.02.23-.25.25h-5.5a.25.25 0 0 1-.25-.25z" clip-rule="evenodd"/>
                </svg>
                <span class="copy-status-bubble" id="copy-status-bubble">Copied</span>
              </button>
            </div>
          </div>

          <!-- Hero Action CTAs -->
          <div class="hero-action-buttons">
            <button id="launch-demo-btn" class="btn btn-primary">
              🚀 Launch Interactive Demo
            </button>
            <button id="connect-workspace-btn" class="btn btn-secondary">
              🔑 Connect Local Workspace
            </button>
            <a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
              View on GitHub ↗
            </a>
          </div>

          <!-- Agents strip -->
          <div class="hero-agents-container">
            <h2 class="try-kicker">Available for these agents</h2>
            <div class="agents-scroll-wrapper">
              <div class="agents-track">
                ${agents.map(a => `
                  <div class="agent-chip" title="Compatible with ${a.name}">
                    <span class="agent-chip-icon">🤖</span>
                    <span class="agent-chip-title">${a.name}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Central Leaderboard Directory (Exact skills.sh Style) -->
      <main class="skills-leaderboard-container" id="directory">
        <div class="leaderboard-meta-header">
          <h2 class="leaderboard-title-kicker">SDD Profiles & Workflows Leaderboard</h2>
          <span class="leaderboard-count-tag font-mono">8 Verified Standards</span>
        </div>

        <!-- Search Bar with '/' keyboard hint -->
        <div class="directory-search-bar">
          <div class="search-input-container">
            <svg class="search-glyph" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle>
            </svg>
            <input type="text" id="leaderboard-search-input" placeholder="Search profiles, rules, workflows..." class="search-field font-mono" autocomplete="off" spellcheck="false" />
            <kbd class="kbd-pill font-mono">/</kbd>
          </div>
        </div>

        <!-- Tabs: All Time, Trending, Audited, Official -->
        <div class="leaderboard-tabs-bar font-mono">
          <button class="tab-btn active" data-filter="all">All Time (1,246,528)</button>
          <button class="tab-btn" data-filter="trending">Trending (24h)</button>
          <button class="tab-btn" data-filter="audited">Security-Audited</button>
          <button class="tab-btn" data-filter="official">Official Core</button>
        </div>

        <!-- Leaderboard Table -->
        <div class="skills-table-wrapper">
          <div class="skills-table-header">
            <div class="col-rank font-mono">#</div>
            <div class="col-profile font-mono">Profile / Workflow</div>
            <div class="col-activity font-mono text-right">8W Activity</div>
            <div class="col-runs font-mono text-right">Installs</div>
          </div>

          <div class="skills-table-rows" id="leaderboard-table-rows">
            ${LANDING_PROFILES.map(p => `
              <div class="skills-row group" data-profile-id="${p.id}" data-category="${p.category}" role="button" tabindex="0" title="Click to view details and copy install command">
                <div class="col-rank font-mono">${p.rank}</div>
                <div class="col-profile">
                  <div class="profile-title-line">
                    <span class="profile-name font-mono font-bold">${p.name}</span>
                    <span class="profile-repo font-mono">${p.repo}</span>
                    ${p.category === 'audited' ? '<span class="verified-badge" title="Security Audited">🛡️ Audited</span>' : ''}
                  </div>
                  <div class="profile-desc-line text-muted-foreground">${p.desc}</div>
                </div>
                <div class="col-activity">
                  <div class="sparkline-wrapper">
                    <svg viewBox="0 0 140 24" class="sparkline-svg" aria-label="Activity trend">
                      <defs>
                        <linearGradient id="grad-${p.id}" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stop-color="#ededed" stop-opacity="0.3"></stop>
                          <stop offset="100%" stop-color="#ededed" stop-opacity="0"></stop>
                        </linearGradient>
                      </defs>
                      <path d="${p.sparkArea}" fill="url(#grad-${p.id})"></path>
                      <path d="${p.sparkline}" fill="none" stroke="#ededed" stroke-width="1.25" stroke-linecap="round"></path>
                    </svg>
                  </div>
                </div>
                <div class="col-runs font-mono text-right">
                  <span class="runs-value">${p.runs}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </main>

      <!-- Framework Foundations & Gates (Styled in minimal skills.sh audit card pattern) -->
      <section class="skills-foundations-section">
        <div class="foundations-heading">
          <h2 class="try-kicker">Framework Foundations</h2>
          <h3 class="foundations-main-title">Why Spec-Driven Development?</h3>
        </div>

        <div class="foundations-card-grid">
          <div class="foundation-block">
            <div class="gate-kicker font-mono">GATE 01</div>
            <h4 class="gate-headline">Intent Before Code</h4>
            <p class="gate-body">
              Requirements (<code>requirements.md</code>) and architecture (<code>design.md</code>) must be formally defined and approved before implementation begins. Zero hallucinated scope.
            </p>
          </div>

          <div class="foundation-block">
            <div class="gate-kicker font-mono">GATE 02</div>
            <h4 class="gate-headline">Automated Guardrails</h4>
            <p class="gate-body">
              Local Git hooks intercept commits. SDD Doctor enforces task ID integrity, spec schemas, and phase approval invariants automatically.
            </p>
          </div>

          <div class="foundation-block">
            <div class="gate-kicker font-mono">GATE 03</div>
            <h4 class="gate-headline">Grounded Evidence</h4>
            <p class="gate-body">
              Tasks aren't done until verified. Evidence records capture exact commit SHA, reproducible test logs, execution environment, and acknowledged limitations.
            </p>
          </div>

          <div class="foundation-block">
            <div class="gate-kicker font-mono">GATE 04</div>
            <h4 class="gate-headline">Human Governance</h4>
            <p class="gate-body">
              Phases are never silently archived or published by autonomous agents. Consequential milestone closures remain under explicit developer control.
            </p>
          </div>
        </div>
      </section>

      <!-- Essential Commands Table -->
      <section class="skills-commands-section">
        <div class="foundations-heading">
          <h2 class="try-kicker">CLI Reference</h2>
          <h3 class="foundations-main-title">Essential Commands</h3>
        </div>

        <div class="commands-table-container">
          <table class="commands-matrix">
            <thead>
              <tr>
                <th class="font-mono">Command</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code class="font-mono">bash scripts/setup.sh</code></td>
                <td>Initialize SDD in any project with profile configuration.</td>
              </tr>
              <tr>
                <td><code class="font-mono">bash scripts/doctor.sh</code></td>
                <td>Run diagnostic health check on templates, specs, and hooks.</td>
              </tr>
              <tr>
                <td><code class="font-mono">bash scripts/phase.sh start &lt;name&gt;</code></td>
                <td>Start an active phase sprint and check out feature branch.</td>
              </tr>
              <tr>
                <td><code class="font-mono">bash scripts/phase.sh task &lt;id&gt; done</code></td>
                <td>Record task completion and sync active context.</td>
              </tr>
              <tr>
                <td><code class="font-mono">npm --prefix visual run workspace</code></td>
                <td>Launch the visual read-only workspace cockpit.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}
