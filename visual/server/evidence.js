// Read declared evidence; never infer an execution from narrative or a reference.
const clean = value => value.replace(/\*\*|`/g, '').trim();
function cells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(v => clean(v.replace(/\\\|/g, '|')));
}
function status(value) {
  const v = clean(value).toUpperCase();
  return ({PASS:'PASS', PASSED:'PASS', FAIL:'FAIL', FAILED:'FAIL', BLOCKED:'BLOCKED', SKIPPED:'SKIPPED', UNKNOWN:'UNKNOWN', 'NOT RECORDED':'UNKNOWN'})[v] || 'UNKNOWN';
}
function aggregate(values) {
  if (!values.length) return 'UNKNOWN';
  if (values.includes('FAIL')) return 'FAIL';
  if (values.includes('BLOCKED')) return 'BLOCKED';
  if (values.includes('UNKNOWN')) return 'UNKNOWN';
  if (values.every(v => v === 'PASS')) return 'PASS';
  if (values.every(v => v === 'SKIPPED')) return 'SKIPPED';
  return 'PARTIAL';
}
export function parseEvidenceMetadata(content) {
  const fields = new Map();
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*(?:\*\*)?([^:*]+):(?:\*\*)?\s*(.+?)\s*$/);
    if (match) fields.set(match[1].trim().toLowerCase(), clean(match[2]));
  }
  const field = (...names) => names.map(n => fields.get(n)).find(Boolean) || '';
  const lines = content.split('\n');
  const checks = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\s*\|/.test(lines[i])) continue;
    const headings = cells(lines[i]).map(h => h.toLowerCase());
    if (!headings.includes('check') || !headings.includes('result') || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[i+1])) continue;
    i += 2;
    for (; i < lines.length && /^\s*\|/.test(lines[i]); i++) {
      const row = cells(lines[i]);
      if (row.length !== headings.length) continue;
      const data = Object.fromEntries(headings.map((h, n) => [h, row[n]]));
      checks.push({name:data.check, procedure:data['command/procedure'] || data.procedure || '', expected:data.expected || '', observed:data.observed || '', result:status(data.result), declaredResult:data.result});
    }
  }
  const declaredResult = field('result');
  const results = checks.map(c => c.result);
  if (declaredResult) results.push(status(declaredResult));
  const limit = content.match(/##\s+Limitations\s*([\s\S]*?)(?=\n##|\n---|$)/i);
  return {
    result: aggregate(results), declaredResult, checks,
    assessedTree: field('revision/tree', 'assessed tree / revision', 'assessed tree/revision', 'assessed tree', 'revision', 'commit'),
    environment: field('environment'), timestamp: field('observed', 'timestamp'), authority: field('authority'),
    limitations: limit ? limit[1].trim() : 'Not recorded',
  };
}
