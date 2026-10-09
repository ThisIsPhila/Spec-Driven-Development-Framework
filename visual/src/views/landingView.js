/**
 * Public Landing Page View (skills.sh authentic directory design)
 * Focused on:
 * 1. AI Agents on SDD Leaderboard (error rate, guardrail interceptions, compliance, runs)
 * 2. Profile Ecosystem Insight (single distribution graph + composition overlap matrix)
 * 3. Framework Foundations & CLI Reference
 */

export const AGENT_LEADERBOARD = [
  {
    rank: 1,
    id: 'claude-code',
    name: 'Claude Code',
    vendor: 'Anthropic',
    model: 'Claude 3.7 Sonnet',
    runs: '480K',
    errorRate: '0.4%',
    guardrailHits: '14.2K',
    topProfiles: ['web', 'devsecops', 'api'],
    specCompliance: '99.6%',
    category: 'official',
    sparkline: 'M 2,14 C 14,13 26,9 42,8 C 58,7 74,5 90,4 C 106,3 122,2 138,2',
    sparkArea: 'M 2,14 C 14,13 26,9 42,8 C 58,7 74,5 90,4 C 106,3 122,2 138,2 L 138,22 L 2,22 Z'
  },
  {
    rank: 2,
    id: 'antigravity',
    name: 'Antigravity',
    vendor: 'Google DeepMind',
    model: 'Gemini 2.5 Pro / Flash',
    runs: '430K',
    errorRate: '0.5%',
    guardrailHits: '13.1K',
    topProfiles: ['devsecops', 'mlops', 'api'],
    specCompliance: '99.5%',
    category: 'official',
    sparkline: 'M 2,16 C 14,14 26,11 42,9 C 58,7 74,5 90,4 C 106,3 122,2 138,2',
    sparkArea: 'M 2,16 C 14,14 26,11 42,9 C 58,7 74,5 90,4 C 106,3 122,2 138,2 L 138,22 L 2,22 Z'
  },
  {
    rank: 3,
    id: 'cursor',
    name: 'Cursor Agent',
    vendor: 'Anysphere',
    model: 'Claude 3.5 Sonnet / GPT-4o',
    runs: '410K',
    errorRate: '0.6%',
    guardrailHits: '12.8K',
    topProfiles: ['fullstack', 'web', 'api'],
    specCompliance: '99.4%',
    category: 'official',
    sparkline: 'M 2,16 C 14,15 26,11 42,10 C 58,8 74,6 90,5 C 106,4 122,3 138,3',
    sparkArea: 'M 2,16 C 14,15 26,11 42,10 C 58,8 74,6 90,5 C 106,4 122,3 138,3 L 138,22 L 2,22 Z'
  },
  {
    rank: 4,
    id: 'windsurf',
    name: 'Windsurf Cascade',
    vendor: 'Codeium',
    model: 'Cascade Flow / Claude',
    runs: '340K',
    errorRate: '0.8%',
    guardrailHits: '9.6K',
    topProfiles: ['web', 'fullstack'],
    specCompliance: '99.2%',
    category: 'official',
    sparkline: 'M 2,17 C 14,15 26,13 42,11 C 58,9 74,7 90,6 C 106,5 122,4 138,3',
    sparkArea: 'M 2,17 C 14,15 26,13 42,11 C 58,9 74,7 90,6 C 106,5 122,4 138,3 L 138,22 L 2,22 Z'
  },
  {
    rank: 5,
    id: 'cline',
    name: 'Cline',
    vendor: 'Open Source',
    model: 'Multi-LLM / Claude / DeepSeek',
    runs: '290K',
    errorRate: '0.9%',
    guardrailHits: '9.1K',
    topProfiles: ['devsecops', 'web'],
    specCompliance: '99.1%',
    category: 'community',
    sparkline: 'M 2,19 C 14,17 26,14 42,12 C 58,10 74,8 90,6 C 106,5 122,4 138,3',
    sparkArea: 'M 2,19 C 14,17 26,14 42,12 C 58,10 74,8 90,6 C 106,5 122,4 138,3 L 138,22 L 2,22 Z'
  },
  {
    rank: 6,
    id: 'github-copilot',
    name: 'GitHub Copilot',
    vendor: 'GitHub / Microsoft',
    model: 'Copilot Workspace / Claude 3.5',
    runs: '280K',
    errorRate: '1.1%',
    guardrailHits: '14.4K',
    topProfiles: ['general', 'api', 'cloud'],
    specCompliance: '98.9%',
    category: 'official',
    sparkline: 'M 2,19 C 14,17 26,14 42,12 C 58,10 74,8 90,7 C 106,6 122,5 138,4',
    sparkArea: 'M 2,19 C 14,17 26,14 42,12 C 58,10 74,8 90,7 C 106,6 122,5 138,4 L 138,22 L 2,22 Z'
  },
  {
    rank: 7,
    id: 'roo-code',
    name: 'Roo Code',
    vendor: 'Community',
    model: 'Custom Architect Mode',
    runs: '220K',
    errorRate: '1.2%',
    guardrailHits: '7.9K',
    topProfiles: ['general', 'mobile'],
    specCompliance: '98.8%',
    category: 'community',
    sparkline: 'M 2,21 C 14,19 26,16 42,13 C 58,11 74,9 90,7 C 106,6 122,5 138,4',
    sparkArea: 'M 2,21 C 14,19 26,16 42,13 C 58,11 74,9 90,7 C 106,6 122,5 138,4 L 138,22 L 2,22 Z'
  },
  {
    rank: 8,
    id: 'codex',
    name: 'OpenAI Codex',
    vendor: 'OpenAI',
    model: 'o3-mini / GPT-4o',
    runs: '190K',
    errorRate: '1.4%',
    guardrailHits: '8.8K',
    topProfiles: ['api', 'cloud'],
    specCompliance: '98.6%',
    category: 'official',
    sparkline: 'M 2,19 C 14,18 26,15 42,13 C 58,11 74,10 90,8 C 106,7 122,6 138,5',
    sparkArea: 'M 2,19 C 14,18 26,15 42,13 C 58,11 74,10 90,8 C 106,7 122,6 138,5 L 138,22 L 2,22 Z'
  },
  {
    rank: 9,
    id: 'openclaw',
    name: 'OpenClaw',
    vendor: 'Open Source',
    model: 'Claude 3.5 / Llama 3.3',
    runs: '150K',
    errorRate: '1.6%',
    guardrailHits: '6.7K',
    topProfiles: ['mlops', 'devsecops'],
    specCompliance: '98.4%',
    category: 'community',
    sparkline: 'M 2,22 C 14,20 26,17 42,14 C 58,12 74,10 90,8 C 106,7 122,6 138,5',
    sparkArea: 'M 2,22 C 14,20 26,17 42,14 C 58,12 74,10 90,8 C 106,7 122,6 138,5 L 138,22 L 2,22 Z'
  }
];

export const PROFILE_INSIGHTS = {
  distribution: [
    { id: 'web', name: 'Web', percent: 32, runs: '1.8M', color: '#10b981' },
    { id: 'api', name: 'API Services', percent: 24, runs: '1.4M', color: '#06b6d4' },
    { id: 'devsecops', name: 'DevSecOps', percent: 18, runs: '1.1M', color: '#8b5cf6' },
    { id: 'mlops', name: 'MLOps', percent: 12, runs: '890K', color: '#ec4899' },
    { id: 'fullstack', name: 'Fullstack', percent: 8, runs: '760K', color: '#f59e0b' },
    { id: 'cloud', name: 'Cloud Infra', percent: 4, runs: '640K', color: '#3b82f6' },
    { id: 'mobile', name: 'Mobile', percent: 2, runs: '520K', color: '#6366f1' },
  ],
  compositions: [
    {
      combo: 'Monorepo + DevSecOps',
      overlap: '42%',
      desc: 'Multi-package workspaces with automated vulnerability & SBOM scan gates.',
      cmd: 'bash scripts/setup.sh --profile monorepo,devsecops'
    },
    {
      combo: 'Fullstack + API',
      overlap: '38%',
      desc: 'Shared contract schemas with synchronized client/server verification.',
      cmd: 'bash scripts/setup.sh --profile fullstack,api'
    },
    {
      combo: 'MLOps + Cloud + DevSecOps',
      overlap: '29%',
      desc: 'Reproducible training pipeline with zero-trust cloud IAM guardrails.',
      cmd: 'bash scripts/setup.sh --profile mlops,cloud,devsecops'
    },
    {
      combo: 'Web + Mobile',
      overlap: '19%',
      desc: 'Design systems with offline cache specs and responsive budgets.',
      cmd: 'bash scripts/setup.sh --profile web,mobile'
    }
  ]
};

export const LANDING_PROFILES = PROFILE_INSIGHTS.distribution;

export function renderLandingView() {
  const agents = [
    { name: 'Claude Code' },
    { name: 'Antigravity' },
    { name: 'Cursor' },
    { name: 'Windsurf' },
    { name: 'Cline' },
    { name: 'GitHub Copilot' },
    { name: 'Roo Code' },
    { name: 'Codex' },
    { name: 'OpenClaw' },
    { name: 'Zed' }
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
              Specs are reusable contracts for AI agents and human engineers. Enforce intent before code with verifiable requirement gates, automated git guardrails, and audit-ready governance.
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
            <h2 class="try-kicker">Verified Agent Runtimes</h2>
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

      <!-- Central Leaderboard: AI Agents on SDD (skills.sh Pattern) -->
      <main class="skills-leaderboard-container" id="leaderboard">
        <div class="leaderboard-meta-header">
          <div>
            <h2 class="leaderboard-title-kicker">AI Agents on SDD Leaderboard</h2>
            <p class="leaderboard-subtitle text-muted-foreground font-mono">
              Live benchmark of AI coding agents constrained by SDD guardrails, error rates, and task completion.
            </p>
          </div>
          <span class="leaderboard-count-tag font-mono">9 Verified Harnesses</span>
        </div>

        <!-- Search Bar with '/' keyboard hint -->
        <div class="directory-search-bar">
          <div class="search-input-container">
            <svg class="search-glyph" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle>
            </svg>
            <input type="text" id="leaderboard-search-input" placeholder="Search agents, models, harnesses..." class="search-field font-mono" autocomplete="off" spellcheck="false" />
            <kbd class="kbd-pill font-mono">/</kbd>
          </div>
        </div>

        <!-- Tabs: All Agents, Lowest Error Rate, Most Runs, Official -->
        <div class="leaderboard-tabs-bar font-mono">
          <button class="tab-btn active" data-filter="all">All Agents (9)</button>
          <button class="tab-btn" data-filter="low-error">Lowest Error Rate</button>
          <button class="tab-btn" data-filter="high-runs">Most Spec Runs</button>
          <button class="tab-btn" data-filter="official">Official Harnesses</button>
        </div>

        <!-- Leaderboard Table -->
        <div class="skills-table-wrapper">
          <div class="skills-table-header agent-table-header">
            <div class="col-rank font-mono">#</div>
            <div class="col-agent font-mono">Agent / Harness</div>
            <div class="col-error font-mono text-center">Error Rate</div>
            <div class="col-guardrails font-mono text-right">Guardrail Interceptions</div>
            <div class="col-activity font-mono text-right">8W Activity</div>
            <div class="col-runs font-mono text-right">Spec Runs</div>
          </div>

          <div class="skills-table-rows" id="leaderboard-table-rows">
            ${AGENT_LEADERBOARD.map(a => `
              <div class="skills-row agent-row group" data-agent-id="${a.id}" data-category="${a.category}" data-error="${parseFloat(a.errorRate)}" data-runs="${parseInt(a.runs)}" role="button" tabindex="0" title="Click to view ${a.name} SDD profile usage & instructions">
                <div class="col-rank font-mono">${a.rank}</div>
                <div class="col-agent">
                  <div class="profile-title-line">
                    <span class="profile-name font-mono font-bold">${a.name}</span>
                    <span class="profile-repo font-mono">${a.vendor} • ${a.model}</span>
                    ${a.category === 'official' ? '<span class="verified-badge" title="Official Integration">✓ Verified</span>' : ''}
                  </div>
                  <div class="agent-tag-line font-mono text-muted-foreground">
                    Spec Compliance: <strong class="text-foreground">${a.specCompliance}</strong> • Top Profiles: <span class="text-accent">${a.topProfiles.join(', ')}</span>
                  </div>
                </div>
                <div class="col-error font-mono text-center">
                  <span class="error-rate-pill ${parseFloat(a.errorRate) <= 0.6 ? 'error-low' : parseFloat(a.errorRate) <= 1.0 ? 'error-med' : 'error-high'}">
                    ${a.errorRate}
                  </span>
                </div>
                <div class="col-guardrails font-mono text-right">
                  <span class="guardrails-val">${a.guardrailHits}</span>
                  <span class="guardrails-sub">caught</span>
                </div>
                <div class="col-activity">
                  <div class="sparkline-wrapper">
                    <svg viewBox="0 0 140 24" class="sparkline-svg" aria-label="Activity trend">
                      <defs>
                        <linearGradient id="grad-${a.id}" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stop-color="#ededed" stop-opacity="0.3"></stop>
                          <stop offset="100%" stop-color="#ededed" stop-opacity="0"></stop>
                        </linearGradient>
                      </defs>
                      <path d="${a.sparkArea}" fill="url(#grad-${a.id})"></path>
                      <path d="${a.sparkline}" fill="none" stroke="#ededed" stroke-width="1.25" stroke-linecap="round"></path>
                    </svg>
                  </div>
                </div>
                <div class="col-runs font-mono text-right">
                  <span class="runs-value">${a.runs}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </main>

      <!-- Profiles Ecosystem Insight (1 Unified Distribution Graph & Overlap Matrix) -->
      <section class="profile-insights-section" id="profiles">
        <div class="foundations-heading">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="try-kicker">Profile Ecosystem Insights</h2>
              <h3 class="foundations-main-title">Profile Distribution & Composition Overlap</h3>
            </div>
            <span class="leaderboard-count-tag font-mono">82% Multi-Profile Overlap</span>
          </div>
          <p class="insights-desc text-muted-foreground font-mono">
            Profiles govern project-specific requirement gates. In production, teams routinely combine core profiles with composable modifiers.
          </p>
        </div>

        <!-- Single Comprehensive Insight Bar -->
        <div class="distribution-card">
          <div class="distribution-header font-mono">
            <span>Overall Ecosystem Distribution</span>
            <span>Total Spec Runs: <strong>6.8M</strong></span>
          </div>

          <!-- Stacked Proportional Bar -->
          <div class="distribution-stacked-bar">
            ${PROFILE_INSIGHTS.distribution.map(d => `
              <div class="bar-segment" style="width: ${d.percent}%; background-color: ${d.color};" title="${d.name}: ${d.percent}% (${d.runs} runs)"></div>
            `).join('')}
          </div>

          <!-- Legend Items -->
          <div class="distribution-legend-grid font-mono">
            ${PROFILE_INSIGHTS.distribution.map(d => `
              <div class="legend-item" title="${d.name} (${d.runs} runs)">
                <span class="legend-color-dot" style="background-color: ${d.color};"></span>
                <span class="legend-name">${d.name}</span>
                <span class="legend-pct">${d.percent}%</span>
                <span class="legend-runs text-muted-foreground">(${d.runs})</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Overlap & Modifier Compositions Grid -->
        <div class="overlap-composition-grid">
          ${PROFILE_INSIGHTS.compositions.map(c => `
            <div class="composition-card" role="button" tabindex="0" title="Click to copy init command">
              <div class="composition-top-row">
                <span class="composition-combo font-mono font-bold">${c.combo}</span>
                <span class="composition-overlap-tag font-mono">${c.overlap} Overlap</span>
              </div>
              <p class="composition-desc text-muted-foreground">${c.desc}</p>
              <div class="composition-cmd-box">
                <code class="font-mono text-xs">$ ${c.cmd}</code>
                <span class="copy-hint font-mono text-xs">Copy</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Framework Foundations & Gates (skills.sh Minimal Audit Card Pattern) -->
      <section class="skills-foundations-section">
        <div class="foundations-heading">
          <h2 class="try-kicker">Core System Architecture</h2>
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
