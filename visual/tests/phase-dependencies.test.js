import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPhaseDependencies} from '../src/phase-dependencies.js';
test('phase dependencies distinguish unknown and empty declarations and resolve only existing targets',()=>{
 const html=renderPhaseDependencies([{id:'phase-001-start',metadata:{dependencies:[]}},{id:'phase-002-next',metadata:{dependsOn:['phase-001-start','missing']}},{id:'phase-003-unknown'}]);
 assert.match(html,/1 explicit links/);assert.match(html,/0 prerequisites declared/);assert.match(html,/Dependencies unrecorded/);assert.match(html,/data-from="phase-001-start"/);assert.doesNotMatch(html,/data-from="missing"/);
});
