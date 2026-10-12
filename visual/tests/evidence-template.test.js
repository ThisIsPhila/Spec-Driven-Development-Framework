import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEvidenceMetadata} from '../server/evidence.js';
const record = `# T061.6 — Verification Evidence
**Revision/tree:** abc123
**Environment:** Local mocked dependencies
**Observed:** 2026-10-12
**Authority:** owner
## Procedure and result
| Check | Command/procedure | Expected | Observed | Result |
|---|---|---|---|---|
| Types | npx tsc --noEmit | No errors | Exit 0 | Pass |
| Tests | npx vitest run | All pass | 142 tests passed | Pass |
## Limitations
No live provider execution.
`;
test('canonical template metadata and each procedure are recognised', () => {
 const parsed=parseEvidenceMetadata(record);
 assert.equal(parsed.assessedTree,'abc123');assert.equal(parsed.timestamp,'2026-10-12');assert.equal(parsed.authority,'owner');
 assert.equal(parsed.checks.length,2);assert.equal(parsed.result,'PASS');assert.equal(parsed.checks[0].procedure,'npx tsc --noEmit');
 assert.equal(parsed.limitations,'No live provider execution.');
});
test('mixed outcomes, negation and missing observations never become pass',()=>{
 assert.equal(parseEvidenceMetadata(record.replace('| Exit 0 | Pass |','| Exit 1 | Fail |')).result,'FAIL');
 assert.equal(parseEvidenceMetadata(record.replace('| Exit 0 | Pass |','| Unavailable | Blocked |')).result,'BLOCKED');
 assert.equal(parseEvidenceMetadata(record.replace('| Exit 0 | Pass |','| Unavailable | Not passed |')).result,'UNKNOWN');
 assert.equal(parseEvidenceMetadata('# Evidence\nTests should pass.').result,'UNKNOWN');
 assert.equal(parseEvidenceMetadata('**Result:** PASS\n'+record.replace('| Exit 0 | Pass |','| Exit 1 | Fail |')).result,'FAIL');
});
test('legacy metadata still works and skipped observations stay distinct',()=>{
 const p=parseEvidenceMetadata('**Assessed Tree / Revision:** old\n**Timestamp:** then\n**Result:** PASS');
 assert.equal(p.assessedTree,'old');assert.equal(p.timestamp,'then');assert.equal(p.result,'PASS');
 assert.equal(parseEvidenceMetadata(record.replace('| Exit 0 | Pass |','| Omitted | Skipped |')).result,'PARTIAL');
});
