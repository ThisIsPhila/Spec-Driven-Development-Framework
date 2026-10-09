import { sanitizeUi } from './sanitize.js';
let mermaid;

let initialized = false;

export async function initMermaid() {
  if (initialized) return;
  try {
    mermaid = (await import('mermaid')).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'strict',
      secure: ['securityLevel', 'startOnLoad', 'secure', 'maxTextSize', 'maxEdges'],
      maxTextSize: 50000, maxEdges: 500,
      themeVariables: {
        darkMode: true,
        background: '#111827',
        primaryColor: '#1e293b',
        primaryTextColor: '#f3f4f6',
        primaryBorderColor: '#3b82f6',
        lineColor: '#60a5fa',
        secondaryColor: '#1f2937',
        tertiaryColor: '#111827',
      },
    });
    initialized = true;
  } catch (err) {
    console.warn('Failed to initialize mermaid:', err);
  }
}

/**
 * Renders all .mermaid-container elements inside rootElement.
 * If rendering fails, safely falls back to showing the raw source code.
 */
export async function renderMermaidBlocks(rootElement) {
  if (!rootElement || typeof window === 'undefined') return;
  await initMermaid();

  const containers = rootElement.querySelectorAll('.mermaid-container');
  let counter = 0;

  for (const container of containers) {
    const rawCodeEncoded = container.getAttribute('data-code');
    if (!rawCodeEncoded) continue;

    let rawCode;
    try { rawCode = decodeURIComponent(rawCodeEncoded); } catch { rawCode = rawCodeEncoded; }
    const loadingEl = container.querySelector('.mermaid-loading');
    const svgEl = container.querySelector('.mermaid-svg');
    const fallbackEl = container.querySelector('.mermaid-fallback');

    const id = `mermaid-diag-${Date.now()}-${++counter}`;

    try {
      const { svg } = await mermaid.render(id, rawCode);
      if (svgEl) {
        svgEl.innerHTML = sanitizeUi(svg);
      }
      if (loadingEl) loadingEl.style.display = 'none';
      if (fallbackEl) fallbackEl.style.display = 'none';
    } catch (err) {
      // Mermaid error: preserve raw code and show error diagnostic
      if (loadingEl) loadingEl.style.display = 'none';
      if (svgEl) svgEl.style.display = 'none';
      if (fallbackEl) {
        fallbackEl.style.display = 'block';
        const errorBadge = fallbackEl.querySelector('.diagram-error-badge');
        if (errorBadge) {
          errorBadge.textContent = `Diagram render error (${err.message || 'Syntax error'}) — showing source:`;
        }
      }
      // Remove any broken temporary mermaid element that might have been inserted into the body
      const brokenEl = document.getElementById(id);
      if (brokenEl && brokenEl.parentNode) {
        brokenEl.parentNode.removeChild(brokenEl);
      }
    }
  }
}
