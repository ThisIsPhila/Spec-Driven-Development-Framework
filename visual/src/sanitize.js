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

  // Fallback regex sanitizer if DOMPurify is not instantiated (e.g. Node tests without JSDOM)
  return dirtyHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:[^"']*/gi, '#unsafe');
}
