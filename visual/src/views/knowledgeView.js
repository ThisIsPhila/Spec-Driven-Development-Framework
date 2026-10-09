import { escapeHtml } from '../sanitize.js';
import { escapeDisplayModel } from '../sanitize.js';
import { renderMarkdown } from '../markdown.js';
import { ICONS } from '../icons.js';

/**
 * Docs, Templates, and Graphify Knowledge View
 * Surfaces official framework spec templates, architecture docs, and Graphify knowledge networks.
 */
export function renderKnowledgeView(snapshot, activeSubTab = 'templates', selectedItemId = null) {
  snapshot = escapeDisplayModel(snapshot);
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
          ${ICONS.activity} <span>Artifact Map</span>
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
        <!-- Artifact Map -->
        <div class="graphify-network-card" style="margin-top: 1.5rem;">
          <header class="doc-view-header">
            <div class="doc-title-row">
              <h2 class="doc-view-title">${graphify.source === 'graphify-export' ? 'Imported Graphify Network' : 'Derived Artifact Map'}</h2>
              <span class="domain-stats-pill font-mono">${graphify.totalNodes || graphify.nodes?.length || 0} Nodes • ${graphify.totalEdges || graphify.edges?.length || 0} Relationships</span>
            </div>
            <p class="text-muted-foreground font-mono text-xs">
              ${graphify.summary || 'Traced relationships connecting Constitution, Enforced Rules, Spec Phases, Tasks, Evidence records, and Automated Hooks.'}
            </p>
          </header>

          ${graphify.nodes?.length ? renderImportedGraph(graphify) : '<p class="empty-state">No graph nodes recorded. Select a phase and open Traceability Graph to inspect its requirement mappings.</p>'}
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
      <section class="domain-content-card" style="margin-top:2rem">
        <h2>Installed skills (${snapshot.skills?.length || 0})</h2>
        ${(snapshot.skills || []).map(skill => `<details><summary>${skill.name}${skill.duplicate ? ' (duplicate name)' : ''}</summary><p>${skill.description}</p>${skill.path ? `<button class="btn btn-secondary" data-source-path="${escapeHtml(skill.path)}">Open SKILL.md</button>` : ''}</details>`).join('')}
        <h2>Artifact coverage</h2>
        ${Object.entries(snapshot.coverage || {}).map(([type, support]) => `<p><strong>${type}</strong>: ${support}</p>`).join('')}
        <details><summary>All discovered .sdd artifacts (${snapshot.artifactIndex?.length || 0})</summary>
          ${(snapshot.artifactIndex || []).map(file => `<p><button class="btn btn-secondary" data-source-path="${escapeHtml(file.path)}">${file.relativePath}</button> ${file.kind} · ${file.bytes} bytes</p>`).join('')}
        </details>
        <details><summary>Graph relationships and provenance</summary>${(graphify.edges || []).map(edge => `<p>${edge.from} → ${edge.to}: ${edge.label} (${edge.provenance || 'UNSPECIFIED'}; confidence: ${edge.confidence ?? 'unrecorded'})</p>`).join('')}</details>
      </section>
    </div>
  `;
}

function renderImportedGraph(graph) {
  const nodes = (graph.nodes || []).slice(0, 150);
  const positions = new Map(nodes.map((node, index) => [node.id, {x:30 + (index % 8) * 180, y:40 + Math.floor(index / 8) * 65}]));
  const edges = (graph.edges || []).filter(edge => positions.has(edge.from) && positions.has(edge.to)).slice(0,500);
  const imported = graph.source === 'graphify-export';
  const label = imported ? 'Imported Graphify topology' : 'Derived artifact topology';
  return `<p class="font-mono">${imported ? 'Imported' : 'Derived'} topology: ${nodes.length}/${graph.nodes.length} nodes and ${edges.length} internal edges shown. Full node and provenance lists are below. Relationships do not require live activity and do not certify completion.</p>
    <div class="imported-graph-scroller"><svg class="imported-graph" viewBox="0 0 1460 ${Math.max(160, Math.ceil(nodes.length/8)*65+50)}" role="img" aria-label="${label}">
      ${edges.map(edge => {const a=positions.get(edge.from),b=positions.get(edge.to);return `<line x1="${a.x+75}" y1="${a.y+12}" x2="${b.x+75}" y2="${b.y+12}" stroke="#777" stroke-opacity="0.35"><title>${edge.label}: ${edge.provenance || 'UNSPECIFIED'}</title></line>`;}).join('')}
      ${nodes.map(node => {const point=positions.get(node.id);return `<g><title>${node.label} (${node.type})</title><rect x="${point.x}" y="${point.y}" width="150" height="30" rx="4" fill="#161616" stroke="#555"/><text x="${point.x+6}" y="${point.y+19}" fill="#ddd" font-size="10">${node.label.slice(0,23)}</text></g>`;}).join('')}
    </svg></div>
    <details><summary>All graph nodes (${graph.nodes.length})</summary>${graph.nodes.map(node => `<p>${node.label} — ${node.type}</p>`).join('')}</details>`;
}
