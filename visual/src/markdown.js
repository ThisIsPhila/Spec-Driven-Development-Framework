import { marked } from 'marked';
import { sanitizeHtml } from './sanitize.js';

/**
 * Configure marked renderer
 */
const renderer = new marked.Renderer();

// Custom code block renderer to identify mermaid diagrams
renderer.code = function ({ text, lang }) {
  const language = (lang || '').trim().toLowerCase();
  if (language === 'mermaid') {
    const encoded = encodeURIComponent(text);
    return `<div class="mermaid-container" data-code="${encoded}">
      <div class="mermaid-loading">Rendering diagram...</div>
      <div class="mermaid-svg"></div>
      <div class="mermaid-fallback" style="display:none;">
        <div class="diagram-error-badge">Diagram syntax error — showing source:</div>
        <pre><code class="language-mermaid">${escapeHtml(text)}</code></pre>
      </div>
    </div>`;
  }
  return `<pre><code class="language-${escapeHtml(language)}">${escapeHtml(text)}</code></pre>`;
};

renderer.heading = function ({ text, depth, tokens }) {
  const id = text.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-|-$/g, '');
  return `<h${depth} id="sdd-section-${escapeHtml(id)}">${this.parser.parseInline(tokens)}</h${depth}>`;
};

renderer.image = function ({href, text}) {
  if (!href || /^[a-z]+:/i.test(href) || href.startsWith('//')) return `<span>External image omitted: ${escapeHtml(text)}</span>`;
  return `<a href="${escapeHtml(href)}" data-media-path="${escapeHtml(href)}">View image: ${escapeHtml(text || href)}</a>`;
};

// Safe link renderer
renderer.link = function ({ href, title, text }) {
  const safeHref = href?.startsWith('#') && href.length > 1 ? '#sdd-section-' + href.slice(1) : href || '#';
  const isExternal = /^https?:\/\//i.test(safeHref);
  const relAttr = isExternal ? ' rel="noopener noreferrer" target="_blank"' : '';
  const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
  return `<a href="${escapeHtml(safeHref)}"${titleAttr}${relAttr}>${text}</a>`;
};

marked.setOptions({
  renderer,
  gfm: true,
  breaks: false,
});

export function renderMarkdown(markdownText) {
  if (!markdownText) return '';
  const rawHtml = marked.parse(markdownText);
  return sanitizeHtml(rawHtml);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
