import test from 'node:test';
import assert from 'node:assert/strict';
import {sortPhases} from '../src/views/phaseExplorerView.js';
test('phase sorting defaults to latest number and supports ascending and names without mutating source',()=>{
 const phases=[{id:'phase-002-two',name:'Zulu'},{id:'phase-010-ten',name:'Alpha'}];
 assert.equal(sortPhases(phases)[0].id,'phase-010-ten');
 assert.equal(sortPhases(phases,'oldest')[0].id,'phase-002-two');
 assert.equal(sortPhases(phases,'name')[0].name,'Alpha');
 assert.equal(phases[0].id,'phase-002-two');
});
