/**
 * Public Landing Page View (skills.sh authentic directory design)
 * Zero emojis - 100% Lucide & Platform SVG icons.
 * Full mobile/tablet/desktop responsive layouts.
 */

import { ICONS, PLATFORM_LOGOS } from '../icons.js';

import { PROFILES, INSTALL_COMMAND } from '../catalog.js';
export const LANDING_PROFILES = PROFILES;

export function renderLandingView() {
  const agents = [
    { id: 'claude-code', name: 'Claude Code' },
    { id: 'antigravity', name: 'Antigravity' },
    { id: 'cursor', name: 'Cursor' },
    { id: 'windsurf', name: 'Windsurf' },
    { id: 'cline', name: 'Cline' },
    { id: 'github-copilot', name: 'GitHub Copilot' },
    { id: 'roo-code', name: 'Roo Code' },
    { id: 'codex', name: 'Codex' },
    { id: 'openclaw', name: 'OpenClaw' },
    { id: 'zed', name: 'Zed' }
  ];

  return `
    <div class="skills-page-wrapper">
      <!-- Hero Grid Section (Exact skills.sh Responsive 2-Column Grid) -->
      <section class="skills-hero-container">
        <div class="skills-hero-grid">
          <!-- LEFT COLUMN: ASCII Logo, Kicker, and Action CTAs -->
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

            <!-- Hero Action CTAs (Zero Emojis - Lucide Icons) -->
            <div class="hero-action-buttons">
              <button id="launch-demo-btn" class="btn btn-primary btn-with-icon">
                ${ICONS.play}
                <span>Launch Interactive Demo</span>
              </button>
              <button id="connect-workspace-btn" class="btn btn-secondary btn-with-icon">
                ${ICONS.key}
                <span>Connect Local Workspace</span>
              </button>
              <a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-with-icon">
                ${ICONS.github}
                <span>View on GitHub</span>
                ${ICONS.external}
              </a>
            </div>
          </div>

          <!-- RIGHT COLUMN (Side-by-Side): Description, Try it now, and Agents -->
          <div class="hero-right-col">
            <h1 class="skills-sr-only">Spec-Driven Development</h1>
            <p class="hero-lead-text">
              Specs are reusable contracts for AI agents and human engineers. Install procedural workflows with verifiable requirement gates, automated git guardrails, and audit-ready governance.
            </p>

            <!-- Try it now command box -->
            <div class="hero-try-it-now">
              <h2 class="try-kicker">Try it now</h2>
              <div class="cli-command-box" id="install-cmd-box" role="button" tabindex="0" title="Click to copy install command">
                <code class="command-code">
                  <span class="prompt-symbol">$</span>
                  <span class="cmd-run-text">git clone https://github.com/ThisIsPhila/Spec-Driven-Development-Framework.git .sdd-framework && bash .sdd-framework/scripts/setup.sh --profile general</span>
                </code>
                <button class="copy-trigger-btn" id="copy-cmd-btn" aria-label="Copy to clipboard" title="Copy to clipboard">
                  ${ICONS.copy}
                  <span class="copy-status-bubble" id="copy-status-bubble">Copied</span>
                </button>
              </div>
            </div>

            <!-- Agents strip with Official Platform SVG Logos -->
            <div class="hero-agents-container">
              <h2 class="try-kicker">Agent entry points</h2>
              <div class="agents-scroll-wrapper">
                <div class="agents-track">
                  ${agents.map(a => `
                    <div class="agent-chip" title="${a.name} example">
                      <span class="agent-chip-icon">${PLATFORM_LOGOS[a.id] || ICONS.terminal}</span>
                      <span class="agent-chip-title">${a.name}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Central Leaderboard: AI Agents on SDD (skills.sh Pattern) -->
      <main class="skills-leaderboard-container" id="leaderboard">
        <div class="leaderboard-meta-header">
          <div><h2 class="leaderboard-title-kicker">Framework profiles & skills</h2>
          <p class="leaderboard-subtitle text-muted-foreground font-mono">Choose one base profile and optional modifiers. Add community SKILL.md packages alongside them.</p></div>
          <span class="leaderboard-count-tag font-mono">Open source</span>
        </div>
        <div class="skills-table-responsive-wrapper">
          <div class="skills-table">
            ${PROFILES.map((profile, index) => `<div class="skills-row">
              <div class="col-rank font-mono">${index + 1}</div>
              <div class="col-agent"><div class="profile-title-line"><span class="agent-brand-icon">${ICONS.code}</span><span class="profile-name font-mono font-bold">${profile.id}</span></div><p>${profile.description}</p></div>
              <div class="col-error font-mono">${profile.kind}</div>
              <div class="col-runs font-mono"><code>${profile.kind === 'base' ? '--profile ' + profile.id : '--profile general+' + profile.id}</code></div>
            </div>`).join('')}
          </div>
        </div>
      </main>
      <section class="profile-insights-section" id="profiles">
        <div class="foundations-heading"><h2 class="try-kicker">Explore fictional projects</h2><p>These public examples contain made-up project data. Your local and account projects remain private.</p></div>
        <div class="insights-side-by-side-grid">
          ${['Orbit Notes', 'Harbor API', 'Meadow Mobile'].map((name, i) => `<div class="distribution-card"><h3>${name}</h3><p>Fictional ${['web', 'api', 'mobile'][i]} project showing requirements, tasks and evidence.</p><button class="btn btn-secondary" data-demo-project="${i}">Explore example</button></div>`).join('')}
        </div>
      </section>

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
                <td><code class="font-mono">bash .sdd/scripts/setup.sh</code></td>
                <td>Initialize SDD in any project with profile configuration.</td>
              </tr>
              <tr>
                <td><code class="font-mono">bash .sdd/scripts/doctor.sh</code></td>
                <td>Run diagnostic health check on templates, specs, and hooks.</td>
              </tr>
              <tr>
                <td><code class="font-mono">bash .sdd/scripts/phase.sh start &lt;name&gt;</code></td>
                <td>Start an active phase sprint and check out feature branch.</td>
              </tr>
              <tr>
                <td><code class="font-mono">bash .sdd/scripts/phase.sh task &lt;id&gt; done</code></td>
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
