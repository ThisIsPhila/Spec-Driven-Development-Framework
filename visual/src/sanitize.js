import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS and ensure strict security bounds.
 * Disables scripts, iframes, objects, forms, and dangerous protocols.
 */
export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml) return '';

  // In browser, DOMPurify is directly usable; in Node testing without DOM, handle gracefully
  if (typeof DOMPurify.sanitize === 'function') {
    return DOMPurify.sanitize(dirtyHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'a', 'b', 'strong', 'i', 'em', 'mark', 'small', 'del', 'ins', 'sub', 'sup',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'pre', 'code', 'blockquote', 'hr', 'br',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span', 'section', 'article', 'details', 'summary',
        'svg', 'path', 'g', 'circle', 'line', 'polyline', 'polygon', 'text', 'rect',
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'class', 'id', 'role', 'aria-label', 'aria-hidden', 'aria-controls',
        'aria-selected', 'target', 'rel', 'data-code', 'data-id',
        'width', 'height', 'viewBox', 'fill', 'stroke', 'stroke-width', 'd', 'x', 'y', 'cx', 'cy', 'r',
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      ALLOW_DATA_ATTR: true,
      ADD_ATTR: ['rel'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
  }

  throw new Error('A DOM-backed sanitizer is required to render source content');
}

export function sanitizeUi(html) {
  if (typeof DOMPurify.sanitize !== 'function') throw new Error('DOM sanitizer unavailable');
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['button', 'input'],
    ADD_ATTR: ['data-code', 'tabindex'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'img'],
    FORBID_ATTR: ['srcdoc'],
  });
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[ch]));
}

const escapedModels = new WeakSet();
/** Escape display metadata once; source documents go through Markdown sanitization. */
export function escapeDisplayModel(value, key = '') {
  if (!value || typeof value !== 'object') {
    return typeof value === 'string' && !['content', 'contract', 'raw', 'path'].includes(key) ? escapeHtml(value) : value;
  }
  if (escapedModels.has(value)) return value;
  const result = Array.isArray(value) ? value.map(item => escapeDisplayModel(item, key)) : Object.fromEntries(Object.entries(value).map(([k, v]) => [k, escapeDisplayModel(v, k)]));
  escapedModels.add(result); return result;
}
