/**
 * Public Landing Page View (skills.sh inspired)
 */

export function renderLandingView() {
  const profiles = [
    { id: 'general', name: 'General', desc: 'Standard multi-tier engineering with core requirement and design gates.' },
    { id: 'web', name: 'Web', desc: 'Frontend ergonomics, bundle size budgets, responsive layout, and WCAG accessibility.' },
    { id: 'api', name: 'API Services', desc: 'Contract definitions, idempotency keys, rate limiting, and backward compatibility.' },
    { id: 'fullstack', name: 'Fullstack', desc: 'Coordinated client and server specs with end-to-end integration boundaries.' },
    { id: 'mobile', name: 'Mobile', desc: 'App lifecycle, offline state synchronization, and permission guardrails.' },
    { id: 'cloud', name: 'Cloud Infrastructure', desc: 'Declarative infrastructure, least-privilege IAM, and zero-trust policies.' },
    { id: 'devsecops', name: 'DevSecOps', desc: 'Automated vulnerability scanning, SAST/DAST gates, and SBOM verification.' },
    { id: 'mlops', name: 'MLOps', desc: 'Dataset provenance, model validation metrics, drift detection, and reproducible training.' },
  ];

  return `
    <div class="landing-page">
      <!-- Hero Section -->
      <section class="landing-hero">
        <div class="hero-badge">
          <span class="sparkle">⚡</span> Framework for Autonomous & Human Pair-Engineering
        </div>
        <h1 class="hero-title">
          Spec-Driven Development
        </h1>
        <p class="hero-subtitle">
          Turn intent into verified work. Keep AI agents aligned with strict specifications, local task contracts, and evidence-backed governance.
        </p>

        <div class="hero-actions">
          <button id="launch-demo-btn" class="btn btn-primary">
            🚀 Launch Interactive Demo
          </button>
          <a href="https://github.com/ThisIsPhila/Spec-Driven-Development-Framework" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
            View on GitHub
          </a>
        </div>

        <!-- Quick Install Terminal Snippet -->
        <div class="install-card">
          <div class="install-header">
            <span class="install-dots"><i></i><i></i><i></i></span>
            <span class="install-label">Quick Setup</span>
          </div>
          <div class="install-code-row">
            <code class="mono" id="install-cmd">curl -fsSL https://raw.githubusercontent.com/ThisIsPhila/Spec-Driven-Development-Framework/main/setup.sh | bash</code>
            <button id="copy-cmd-btn" class="btn-copy" title="Copy to clipboard">Copy</button>
          </div>
        </div>
      </section>

      <!-- Four Core Pillars -->
      <section class="pillars-section">
        <h2 class="section-title">Why Spec-Driven Development?</h2>
        <div class="pillars-grid">
          <div class="pillar-card">
            <div class="pillar-icon">📐</div>
            <h3>Intent Before Code</h3>
            <p>Requirements (<code>requirements.md</code>) and architecture (<code>design.md</code>) must be defined and approved before implementation begins. No hallucinated scope.</p>
          </div>

          <div class="pillar-card">
            <div class="pillar-icon">🔒</div>
            <h3>Automated Guardrails</h3>
            <p>Local Git hooks run before and during commits. Automated checks ensure agents never skip task contracts or bypass required validations.</p>
          </div>

          <div class="pillar-card">
            <div class="pillar-icon">🛡️</div>
            <h3>Grounded Evidence</h3>
            <p>Tasks aren't done until verified. Evidence records capture exact commit SHA, test procedures, execution environment, and acknowledged limitations.</p>
          </div>

          <div class="pillar-card">
            <div class="pillar-icon">👤</div>
            <h3>Human Governance</h3>
            <p>Phases are never silently archived or published by autonomous agents. Consequential milestone closures remain under explicit developer control.</p>
          </div>
        </div>
      </section>

      <!-- Composable Profiles Catalog -->
      <section class="profiles-section">
        <div class="section-header-row">
          <div>
            <h2 class="section-title">Composable Profiles</h2>
            <p class="section-desc">Tailor validation rules, task checklists, and architectural standards to your project type.</p>
          </div>
        </div>
        <div class="profiles-grid">
          ${profiles.map(p => `
            <div class="profile-card">
              <div class="profile-card-header">
                <span class="profile-name mono">${p.id}</span>
              </div>
              <p class="profile-desc">${p.desc}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Essential Commands Table -->
      <section class="commands-section">
        <h2 class="section-title">Essential Commands</h2>
        <div class="commands-table-wrapper">
          <table class="commands-table">
            <thead>
              <tr>
                <th>Command</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code class="mono">bash scripts/setup.sh</code></td>
                <td>Initialize SDD in any project with profile configuration.</td>
              </tr>
              <tr>
                <td><code class="mono">bash scripts/doctor.sh</code></td>
                <td>Run diagnostic health check on templates, specs, and hooks.</td>
              </tr>
              <tr>
                <td><code class="mono">bash scripts/phase.sh start &lt;name&gt;</code></td>
                <td>Start an active phase sprint and check out feature branch.</td>
              </tr>
              <tr>
                <td><code class="mono">bash scripts/phase.sh task &lt;id&gt; done</code></td>
                <td>Record task completion and sync active context.</td>
              </tr>
              <tr>
                <td><code class="mono">npm --prefix visual run workspace</code></td>
                <td>Launch the visual read-only workspace cockpit.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}
