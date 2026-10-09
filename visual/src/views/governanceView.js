import { renderMarkdown } from '../markdown.js';
import { ICONS } from '../icons.js';

/**
 * Memory & Rules Governance View
 * Surfaces project overview, active context, technical decisions, progress tracker,
 * framework rules engine, and governance exceptions.
 */
export function renderGovernanceView(snapshot, activeSubTab = 'active-context') {
  if (!snapshot) return `<div class="empty-state">No project loaded.</div>`;

  const memories = snapshot.memories || [];
  const rules = snapshot.rules || [];
  const constitution = snapshot.framework?.constitution;

  // Find active memory document based on tab
  let activeDoc = null;
  if (activeSubTab === 'constitution') {
    activeDoc = constitution ? { title: 'SDD Framework Constitution', content: constitution.content } : null;
  } else if (activeSubTab.startsWith('rule-')) {
    const ruleId = activeSubTab.replace('rule-', '');
    const rule = rules.find(r => r.id === ruleId);
    activeDoc = rule ? { title: rule.title, content: rule.content, trigger: rule.trigger, enforcement: rule.enforcement } : null;
  } else {
    activeDoc = memories.find(m => m.id === activeSubTab) || memories[0];
  }

  return `
    <div class="domain-view-container">
      <header class="domain-header">
        <div>
          <span class="domain-kicker font-mono">FRAMEWORK MEMORY & GOVERNANCE</span>
          <h1 class="domain-title">Project Memories & Rules Engine</h1>
          <p class="domain-subtitle font-mono">
            Persistent context records, architectural decisions, and machine-enforced development rules.
          </p>
        </div>
        <div class="domain-stats-pill font-mono">
          <span>${memories.length} Memories</span> • <span>${rules.length} Rules Enforced</span>
        </div>
      </header>

      <div class="domain-two-col-layout">
        <!-- Sidebar Navigation for Memories & Rules -->
        <aside class="domain-sidebar">
          <div class="sidebar-section-title font-mono">CORE CONSTITUTION</div>
          <button class="domain-nav-item ${activeSubTab === 'constitution' ? 'active' : ''}" data-gov-tab="constitution">
            <span class="item-icon">${ICONS.shieldCheck}</span>
            <span class="item-name">Constitution</span>
          </button>

          <div class="sidebar-section-title font-mono" style="margin-top:1.25rem;">PROJECT MEMORIES</div>
          ${memories.map(m => `
            <button class="domain-nav-item ${activeSubTab === m.id ? 'active' : ''}" data-gov-tab="${m.id}">
              <span class="item-icon">${ICONS.clock}</span>
              <span class="item-name">${m.title}</span>
            </button>
          `).join('')}

          <div class="sidebar-section-title font-mono" style="margin-top:1.25rem;">ENFORCED RULES (${rules.length})</div>
          ${rules.map(r => `
            <button class="domain-nav-item ${activeSubTab === `rule-${r.id}` ? 'active' : ''}" data-gov-tab="rule-${r.id}">
              <span class="item-icon">${ICONS.terminal}</span>
              <span class="item-name font-mono text-xs">${r.id}</span>
            </button>
          `).join('')}
        </aside>

        <!-- Main Content Area: Document Reader & Structured Rule Metadata -->
        <main class="domain-content-card">
          ${activeDoc ? `
            <header class="doc-view-header">
              <div class="doc-title-row">
                <h2 class="doc-view-title">${activeDoc.title}</h2>
                ${activeDoc.trigger ? `<span class="rule-trigger-badge font-mono">${activeDoc.trigger}</span>` : ''}
              </div>
              ${activeDoc.enforcement ? `
                <div class="rule-enforcement-line font-mono text-xs text-muted-foreground">
                  <span class="text-accent">${ICONS.shieldCheck}</span> ${activeDoc.enforcement}
                </div>
              ` : ''}
            </header>
            <div class="markdown-body">
              ${renderMarkdown(activeDoc.content || 'No content recorded.')}
            </div>
          ` : `
            <div class="empty-state">Select a memory or rule document to inspect.</div>
          `}
        </main>
      </div>
    </div>
  `;
}
