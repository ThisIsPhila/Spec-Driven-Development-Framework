/**
 * Traceability Graph and Accessible List Generator
 */

export function buildTraceabilityModel(phase) {
  if (!phase) return { requirements: [], tasks: [], evidence: [], edges: [] };

  const requirements = (phase.requirements || []).map(r => ({
    id: r.id,
    title: r.title || r.id,
    type: 'requirement',
  }));

  const tasks = (phase.tasks || []).map(t => ({
    id: t.id,
    title: t.title || t.id,
    status: t.status || 'todo',
    type: 'task',
  }));

  const evidence = (phase.artifacts?.evidence || []).map(e => ({
    id: e.id || e.filename,
    title: e.filename,
    type: 'evidence',
  }));

  const edges = (phase.relationships || []).map(rel => ({
    from: rel.from || rel.fromId,
    to: rel.to || rel.toId,
    type: rel.type || rel.label || 'relates',
    source: rel.source || '',
  }));

  return { requirements, tasks, evidence, edges };
}

/**
 * Generate an interactive responsive SVG Traceability Graph
 */
export function generateTraceabilitySvg(phase) {
  const model = buildTraceabilityModel(phase);
  const { requirements, tasks, evidence, edges } = model;

  if (requirements.length === 0 && tasks.length === 0) {
    return `<div class="empty-state">No explicit requirements or tasks defined for this phase yet.</div>`;
  }

  // Layout dimensions
  const colWidth = 260;
  const colGap = 120;
  const rowHeight = 60;
  const rowGap = 16;
  const paddingX = 40;
  const paddingY = 60;

  const maxRows = Math.max(requirements.length, tasks.length, evidence.length, 1);
  const svgHeight = Math.max(maxRows * (rowHeight + rowGap) + paddingY * 2, 300);
  const svgWidth = paddingX * 2 + colWidth * 3 + colGap * 2;

  // Node coordinate maps
  const nodeCoords = new Map();

  // Column X positions
  const xReq = paddingX;
  const xTask = paddingX + colWidth + colGap;
  const xEv = paddingX + (colWidth + colGap) * 2;

  // Compute node Y positions
  function layoutColumn(items, x) {
    items.forEach((item, idx) => {
      const y = paddingY + idx * (rowHeight + rowGap);
      nodeCoords.set(item.id, { x, y, width: colWidth, height: rowHeight, item });
    });
  }

  layoutColumn(requirements, xReq);
  layoutColumn(tasks, xTask);
  layoutColumn(evidence, xEv);

  // Build connecting bezier path SVG elements
  let pathsSvg = '';
  edges.forEach((edge, idx) => {
    let sourceCoord = nodeCoords.get(edge.from);
    let targetCoord = nodeCoords.get(edge.to);

    // If 'from' is task and 'to' is requirement: task right/left to req right
    if (!sourceCoord || !targetCoord) return;

    let x1, y1, x2, y2;
    if (sourceCoord.x < targetCoord.x) {
      x1 = sourceCoord.x + sourceCoord.width;
      y1 = sourceCoord.y + rowHeight / 2;
      x2 = targetCoord.x;
      y2 = targetCoord.y + rowHeight / 2;
    } else {
      x1 = sourceCoord.x;
      y1 = sourceCoord.y + rowHeight / 2;
      x2 = targetCoord.x + targetCoord.width;
      y2 = targetCoord.y + rowHeight / 2;
    }

    const dx = Math.abs(x2 - x1) * 0.5;
    const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
    const strokeColor = edge.type === 'verifies' ? '#10b981' : '#3b82f6';

    pathsSvg += `
      <path
        d="${pathD}"
        class="trace-edge trace-edge-${edge.type}"
        data-from="${edge.from}"
        data-to="${edge.to}"
        stroke="${strokeColor}"
        stroke-width="2"
        fill="none"
        stroke-opacity="0.65"
      />
    `;
  });

  // Build Nodes SVG elements
  let nodesSvg = '';
  nodeCoords.forEach((coord, id) => {
    const { x, y, width, height, item } = coord;
    let badgeClass = `node-${item.type}`;
    let badgeColor = '#3b82f6';
    let label = item.id;
    let title = item.title;

    if (item.type === 'task') {
      badgeColor = item.status === 'done' ? '#10b981' : item.status === 'doing' ? '#f59e0b' : '#64748b';
    } else if (item.type === 'evidence') {
      badgeColor = '#8b5cf6';
    }

    nodesSvg += `
      <g class="trace-node" data-id="${id}" tabindex="0" role="button" aria-label="${item.type}: ${label}">
        <rect
          x="${x}"
          y="${y}"
          width="${width}"
          height="${height}"
          rx="8"
          fill="#111827"
          stroke="${badgeColor}"
          stroke-width="1.5"
          class="node-rect"
        />
        <text x="${x + 12}" y="${y + 24}" fill="${badgeColor}" font-family="var(--font-mono)" font-size="12" font-weight="600">
          ${label}
        </text>
        <text x="${x + 12}" y="${y + 44}" fill="#94a3b8" font-size="11" font-family="sans-serif">
          ${truncate(title, 32)}
        </text>
      </g>
    `;
  });

  // Header column labels
  const headersSvg = `
    <text x="${xReq + 12}" y="${35}" fill="#64748b" font-size="12" font-weight="700" letter-spacing="0.05em">REQUIREMENTS</text>
    <text x="${xTask + 12}" y="${35}" fill="#64748b" font-size="12" font-weight="700" letter-spacing="0.05em">TASKS</text>
    <text x="${xEv + 12}" y="${35}" fill="#64748b" font-size="12" font-weight="700" letter-spacing="0.05em">EVIDENCE RECORDS</text>
  `;

  return `
    <div class="traceability-svg-wrapper">
      <svg
        viewBox="0 0 ${svgWidth} ${svgHeight}"
        width="100%"
        height="${svgHeight}"
        class="traceability-svg"
        aria-label="Traceability Graph"
      >
        ${headersSvg}
        <g class="edges-group">${pathsSvg}</g>
        <g class="nodes-group">${nodesSvg}</g>
      </svg>
    </div>
  `;
}

/**
 * Generate an accessible keyboard-navigable list representation
 */
export function generateTraceabilityList(phase) {
  const model = buildTraceabilityModel(phase);
  const { requirements, tasks, evidence, edges } = model;

  if (requirements.length === 0 && tasks.length === 0) {
    return `<p class="empty-state">No relationships recorded.</p>`;
  }

  let html = `<div class="traceability-list" role="list">`;

  requirements.forEach(req => {
    // Find tasks implementing this req
    const implementingTasks = edges
      .filter(e => e.to === req.id && e.type === 'implements')
      .map(e => e.from);

    // Find evidence verifying this req directly
    const verifyingEv = edges
      .filter(e => e.to === req.id && e.type === 'verifies')
      .map(e => e.from);

    // Also include evidence verifying implementing tasks
    implementingTasks.forEach(tId => {
      edges
        .filter(e => e.to === tId && e.type === 'verifies')
        .forEach(e => {
          if (!verifyingEv.includes(e.from)) verifyingEv.push(e.from);
        });
    });

    html += `
      <div class="trace-list-item" role="listitem">
        <div class="trace-list-header">
          <span class="badge badge-req">${req.id}</span>
          <strong class="trace-list-title">${req.title}</strong>
        </div>
        <div class="trace-list-details">
          <div class="trace-detail-group">
            <span class="detail-label">Implemented by tasks:</span>
            ${
              implementingTasks.length > 0
                ? implementingTasks.map(t => `<span class="badge badge-task">${t}</span>`).join(' ')
                : '<span class="text-muted">None specified</span>'
            }
          </div>
          <div class="trace-detail-group">
            <span class="detail-label">Verified by evidence:</span>
            ${
              verifyingEv.length > 0
                ? verifyingEv.map(e => `<span class="badge badge-evidence">${e}</span>`).join(' ')
                : '<span class="text-muted">No evidence records mapped</span>'
            }
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}
