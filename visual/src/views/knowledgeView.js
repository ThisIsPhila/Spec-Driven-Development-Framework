import { renderMarkdown } from '../markdown.js';
import { ICONS } from '../icons.js';

/**
 * Docs, Templates, and Graphify Knowledge View
 * Surfaces official framework spec templates, architecture docs, and Graphify knowledge networks.
 */
export function renderKnowledgeView(snapshot, activeSubTab = 'templates', selectedItemId = null) {
  if (!snapshot) return `<div class="empty-state">No project loaded.</div>`;

  const templates = snapshot.templates || [];
  const docs = snapshot.docs || [];
  const graphify = snapshot.graphify || { nodes: [], edges: [] };

  const isTemplates = activeSubTab === 'templates';
  const isDocs = activeSubTab === 'docs';
  const isGraphify = activeSubTab === 'graphify';

  // Selected item
  const currentTemplate = templates.find(t => t.id === selectedItemId) || templates[0];
  const currentDoc = docs.find(d => d.id === selectedItemId) || docs[0];

  return `
    <div class="domain-view-container">
      <header class="domain-header">
        <div>
          <span class="domain-kicker font-mono">SPEC TEMPLATES & SYSTEM KNOWLEDGE</span>
          <h1 class="domain-title">Templates, Documentation & Knowledge Graph</h1>
          <p class="domain-subtitle font-mono">
            Authoritative specification templates, architecture documentation, and relational knowledge graph.
          </p>
        </div>
        <div class="domain-stats-pill font-mono">
          <span>${templates.length} Templates</span> • <span>${docs.length} Docs</span> • <span>${graphify.totalNodes || graphify.nodes?.length || 0} Entities Traced</span>
        </div>
      </header>

      <!-- Knowledge Section Tabs -->
      <div class="knowledge-tabs-bar font-mono">
        <button class="knowledge-tab-btn ${isTemplates ? 'active' : ''}" data-know-section="templates">
          ${ICONS.shieldCheck} <span>Spec Templates (${templates.length})</span>
        </button>
        <button class="knowledge-tab-btn ${isDocs ? 'active' : ''}" data-know-section="docs">
          ${ICONS.clock} <span>Architecture & Guides (${docs.length})</span>
        </button>
        <button class="knowledge-tab-btn ${isGraphify ? 'active' : ''}" data-know-section="graphify">
          ${ICONS.activity} <span>Graphify Knowledge Network</span>
        </button>
      </div>

      ${isTemplates ? `
        <!-- Templates Library -->
        <div class="domain-two-col-layout" style="margin-top: 1.5rem;">
          <aside class="domain-sidebar">
            <div class="sidebar-section-title font-mono">OFFICIAL TEMPLATES (${templates.length})</div>
            ${templates.map(t => `
              <button class="domain-nav-item ${currentTemplate && currentTemplate.id === t.id ? 'active' : ''}" data-tpl-id="${t.id}">
                <span class="item-icon">${ICONS.terminal}</span>
                <div class="item-text-group">
                  <span class="item-name font-mono">${t.filename}</span>
                  <span class="item-sub">${t.title}</span>
                </div>
              </button>
            `).join('')}
          </aside>

          <main class="domain-content-card">
            ${currentTemplate ? `
              <header class="doc-view-header">
                <div class="doc-title-row">
                  <h2 class="doc-view-title font-mono">${currentTemplate.filename}</h2>
                  <button class="btn btn-secondary btn-with-icon" id="copy-tpl-content-btn" style="padding:0.3rem 0.65rem; font-size:0.75rem;">
                    ${ICONS.copy} <span>Copy Template</span>
                  </button>
                </div>
                <p class="template-purpose-text font-mono text-muted-foreground text-xs" style="margin-top:0.4rem;">
                  ${currentTemplate.purpose}
                </p>
              </header>
              <div class="markdown-body">
                ${renderMarkdown(currentTemplate.content || '')}
              </div>
            ` : `
              <div class="empty-state">Select a template to preview.</div>
            `}
          </main>
        </div>
      ` : isDocs ? `
        <!-- Documentation Library -->
        <div class="domain-two-col-layout" style="margin-top: 1.5rem;">
          <aside class="domain-sidebar">
            <div class="sidebar-section-title font-mono">FRAMEWORK DOCUMENTATION (${docs.length})</div>
            ${docs.map(d => `
              <button class="domain-nav-item ${currentDoc && currentDoc.id === d.id ? 'active' : ''}" data-doc-id="${d.id}">
                <span class="item-icon">${ICONS.sparkles}</span>
                <div class="item-text-group">
                  <span class="item-name font-mono">${d.filename}</span>
                  <span class="item-sub">${d.title}</span>
                </div>
              </button>
            `).join('')}
          </aside>

          <main class="domain-content-card">
            ${currentDoc ? `
              <header class="doc-view-header">
                <div class="doc-title-row">
                  <h2 class="doc-view-title">${currentDoc.title}</h2>
                  <span class="report-badge-pill font-mono">${currentDoc.filename}</span>
                </div>
              </header>
              <div class="markdown-body">
                ${renderMarkdown(currentDoc.content || '')}
              </div>
            ` : `
              <div class="empty-state">Select a documentation file to preview.</div>
            `}
          </main>
        </div>
      ` : `
        <!-- Graphify Knowledge Network -->
        <div class="graphify-network-card" style="margin-top: 1.5rem;">
          <header class="doc-view-header">
            <div class="doc-title-row">
              <h2 class="doc-view-title">Graphify Knowledge Network Traceability</h2>
              <span class="domain-stats-pill font-mono">${graphify.totalNodes || graphify.nodes?.length || 0} Nodes • ${graphify.totalEdges || graphify.edges?.length || 0} Relationships</span>
            </div>
            <p class="text-muted-foreground font-mono text-xs">
              ${graphify.summary || 'Traced relationships connecting Constitution, Enforced Rules, Spec Phases, Tasks, Evidence records, and Automated Hooks.'}
            </p>
          </header>

          <!-- Graphify Visual Entity Matrix -->
          <div class="graphify-entity-grid font-mono">
            <div class="entity-column">
              <div class="entity-column-header">1. Governance & Rules</div>
              ${(graphify.nodes || []).filter(n => n.type === 'constitution' || n.type === 'rule' || n.type === 'hook').map(n => `
                <div class="graph-node-pill node-governance">
                  <span class="node-type-dot"></span>
                  <span>${n.label}</span>
                </div>
              `).join('')}
            </div>

            <div class="entity-column">
              <div class="entity-column-header">2. Specification Phases</div>
              ${(graphify.nodes || []).filter(n => n.type === 'phase').map(n => `
                <div class="graph-node-pill node-phase">
                  <span class="node-type-dot"></span>
                  <span>${n.label}</span>
                </div>
              `).join('')}
            </div>

            <div class="entity-column">
              <div class="entity-column-header">3. Tasks & Evidence</div>
              ${(graphify.nodes || []).filter(n => n.type === 'task' || n.type === 'evidence').slice(0, 10).map(n => `
                <div class="graph-node-pill node-execution">
                  <span class="node-type-dot"></span>
                  <span>${n.label}</span>
                </div>
              `).join('')}
              ${(graphify.nodes || []).filter(n => n.type === 'task' || n.type === 'evidence').length > 10 ? `
                <div class="text-xs text-muted-foreground font-mono" style="padding:0.5rem;">+ ${(graphify.nodes || []).filter(n => n.type === 'task' || n.type === 'evidence').length - 10} more tasks & evidence records</div>
              ` : ''}
            </div>
          </div>
        </div>
      `}
    </div>
  `;
}
