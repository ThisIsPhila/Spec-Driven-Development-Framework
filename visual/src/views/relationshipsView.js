import { escapeDisplayModel } from '../sanitize.js';
import { generateTraceabilitySvg, generateTraceabilityList } from '../traceability.js';

/**
 * Relationships & Traceability View Component
 */

export function renderRelationshipsView(phase, mode = 'svg') {
  phase = escapeDisplayModel(phase);
  if (!phase) return `<div class="empty-state">No phase loaded.</div>`;

  const svgContent = generateTraceabilitySvg(phase);
  const listContent = generateTraceabilityList(phase);

  return `
    <div class="relationships-view">
      <div class="relationships-toolbar">
        <div class="mode-switch" role="group" aria-label="Relationships Presentation Mode">
          <button class="mode-btn ${mode === 'svg' ? 'active' : ''}" data-rel-mode="svg">
            Visual Graph (SVG)
          </button>
          <button class="mode-btn ${mode === 'list' ? 'active' : ''}" data-rel-mode="list">
            Accessible List
          </button>
        </div>
        <div class="legend">
          <span class="legend-item"><span class="legend-dot dot-req"></span> Requirement</span>
          <span class="legend-item"><span class="legend-dot dot-task"></span> Task</span>
          <span class="legend-item"><span class="legend-dot dot-evidence"></span> Evidence</span>
          <span class="legend-item"><span class="legend-line line-impl"></span> Implements</span>
          <span class="legend-item"><span class="legend-line line-verif"></span> Verifies</span>
        </div>
      </div>

      <div class="relationships-body">
        <div class="rel-mode-container rel-svg-container" style="display: ${mode === 'svg' ? 'block' : 'none'};">
          ${svgContent}
        </div>
        <div class="rel-mode-container rel-list-container" style="display: ${mode === 'list' ? 'block' : 'none'};">
          ${listContent}
        </div>
      </div>
    </div>
  `;
}
