import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/markdown.js';
import { sanitizeHtml } from '../src/sanitize.js';
import { buildTraceabilityModel, generateTraceabilitySvg, generateTraceabilityList } from '../src/traceability.js';

test('sanitization removes scripts and unsafe links', () => {
  const dangerous = `<div><script>alert("xss")</script><a href="javascript:alert(1)">Click</a><p>Safe content</p></div>`;
  const sanitized = sanitizeHtml(dangerous);
  assert.ok(!sanitized.includes('<script>'), 'script tag must be removed');
  assert.ok(!sanitized.includes('javascript:alert'), 'javascript: URI must be stripped');
  assert.ok(sanitized.includes('Safe content'), 'safe content must be preserved');
});

test('renderMarkdown converts markdown and wraps mermaid fences safely', () => {
  const md = `# Title\n\nSome text with [a link](https://example.com).\n\n\`\`\`mermaid\ngraph TD\n  A --> B\n\`\`\``;
  const rendered = renderMarkdown(md);

  assert.ok(rendered.includes('<h1>Title</h1>'), 'Heading should be rendered');
  assert.ok(rendered.includes('https://example.com'), 'Link should be rendered');
  assert.ok(rendered.includes('mermaid-container'), 'Mermaid block should have mermaid-container wrapper');
  assert.ok(rendered.includes('graph%20TD'), 'Mermaid source should be encoded in data-code');
});

test('buildTraceabilityModel maps requirements, tasks, and evidence', () => {
  const mockPhase = {
    id: 'phase-002',
    requirements: [
      { id: 'REQ-002.1', title: 'HTTP endpoint' },
      { id: 'REQ-002.2', title: 'Auth check' },
    ],
    tasks: [
      { id: 'T002.1', title: 'Implement endpoint', status: 'done' },
      { id: 'T002.2', title: 'Add auth token', status: 'doing' },
    ],
    artifacts: {
      evidence: [
        { id: 'auth-test.md', filename: 'auth-test.md' },
      ],
    },
    relationships: [
      { from: 'T002.1', to: 'REQ-002.1', type: 'implements', source: 'tasks.md' },
      { from: 'auth-test.md', to: 'REQ-002.2', type: 'verifies', source: 'auth-test.md' },
    ],
  };

  const model = buildTraceabilityModel(mockPhase);
  assert.equal(model.requirements.length, 2);
  assert.equal(model.tasks.length, 2);
  assert.equal(model.evidence.length, 1);
  assert.equal(model.edges.length, 2);

  const svg = generateTraceabilitySvg(mockPhase);
  assert.ok(svg.includes('traceability-svg'), 'Should contain SVG root');
  assert.ok(svg.includes('REQ-002.1'), 'SVG should contain requirement node');
  assert.ok(svg.includes('T002.1'), 'SVG should contain task node');
  assert.ok(svg.includes('trace-edge-implements'), 'SVG should contain implements edge');
  assert.ok(svg.includes('trace-edge-verifies'), 'SVG should contain verifies edge');

  const list = generateTraceabilityList(mockPhase);
  assert.ok(list.includes('role="list"'), 'List should have accessible role="list"');
  assert.ok(list.includes('REQ-002.1'), 'List should contain requirement');
  assert.ok(list.includes('T002.1'), 'List should contain mapped task');
});
