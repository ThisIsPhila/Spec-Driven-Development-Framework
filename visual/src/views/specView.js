import { renderMarkdown } from '../markdown.js';

/**
 * Spec Document and Tasks Reader Component
 */

export function renderSpecView(phase, type, filter = 'all') {
  if (!phase) return `<div class="empty-state">No phase loaded.</div>`;

  const artifact = phase.artifacts?.[type];

  if (!artifact || !artifact.content) {
    return `
      <div class="empty-state">
        <p>No ${type}.md document found for phase <strong>${phase.id}</strong>.</p>
      </div>
    `;
  }

  // If viewing tasks, offer interactive filtered task cards along with the document
  if (type === 'tasks') {
    return renderTasksContainer(phase, artifact, filter);
  }

  // For requirements and design, render the full document
  const renderedContent = renderMarkdown(artifact.content);

  return `
    <div class="spec-view spec-view-${type}">
      <div class="spec-header-meta">
        <div class="meta-left">
          <span class="spec-file-badge">${type}.md</span>
          <span class="spec-status-badge status-${artifact.status?.toLowerCase()}">${artifact.status || 'UNKNOWN'}</span>
        </div>
      </div>
      <div class="markdown-body">
        ${renderedContent}
      </div>
    </div>
  `;
}

function renderTasksContainer(phase, artifact, currentFilter) {
  const tasks = phase.tasks || [];
  const filteredTasks = tasks.filter(t => {
    if (currentFilter === 'all') return true;
    if (currentFilter === 'doing') return t.status === 'doing';
    if (currentFilter === 'done') return t.status === 'done';
    if (currentFilter === 'todo') return t.status === 'todo';
    return true;
  });

  return `
    <div class="spec-view spec-view-tasks">
      <div class="tasks-toolbar">
        <div class="filter-group" role="group" aria-label="Task Status Filters">
          <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
            All (${tasks.length})
          </button>
          <button class="filter-btn ${currentFilter === 'doing' ? 'active' : ''}" data-filter="doing">
            In Progress (${tasks.filter(t => t.status === 'doing').length})
          </button>
          <button class="filter-btn ${currentFilter === 'todo' ? 'active' : ''}" data-filter="todo">
            Pending (${tasks.filter(t => t.status === 'todo').length})
          </button>
          <button class="filter-btn ${currentFilter === 'done' ? 'active' : ''}" data-filter="done">
            Completed (${tasks.filter(t => t.status === 'done').length})
          </button>
        </div>
      </div>

      <div class="task-cards-list" role="list">
        ${
          filteredTasks.length === 0
            ? `<div class="empty-state">No tasks match filter "${currentFilter}".</div>`
            : filteredTasks.map(t => renderTaskCard(t, phase)).join('')
        }
      </div>

      <details class="raw-doc-details">
        <summary>View Complete Rendered tasks.md Document</summary>
        <div class="markdown-body" style="margin-top: 1rem;">
          ${renderMarkdown(artifact.content)}
        </div>
      </details>
    </div>
  `;
}

function renderTaskCard(task, phase) {
  const statusIcon = task.status === 'done' ? '✅' : task.status === 'doing' ? '⚡' : '⚪';
  const statusClass = `task-status-${task.status}`;

  // Find requirements mapped to this task
  const mappedReqs = (phase.relationships || [])
    .filter(r => r.from === task.id && r.type === 'implements')
    .map(r => r.to);

  return `
    <div class="task-card ${statusClass}" role="listitem" tabindex="0">
      <div class="task-card-header">
        <div class="task-card-left">
          <span class="task-icon">${statusIcon}</span>
          <span class="task-id">${task.id}</span>
          <span class="task-title">${task.title}</span>
        </div>
        <div class="task-card-right">
          <span class="badge badge-status">${task.status.toUpperCase()}</span>
        </div>
      </div>
      ${
        mappedReqs.length > 0
          ? `
          <div class="task-card-reqs">
            <span class="tag-label">Implements:</span>
            ${mappedReqs.map(req => `<span class="badge badge-req">${req}</span>`).join(' ')}
          </div>
        `
          : ''
      }
      ${
        task.contract
          ? `
          <div class="task-contract-preview">
            <pre><code>${task.contract}</code></pre>
          </div>
        `
          : ''
      }
    </div>
  `;
}
