import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function MarkdownViewer({ content }: { content: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(content || '', { async: false }) as string;
    return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
  }, [content]);

  return <div className="sdd-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
