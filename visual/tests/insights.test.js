import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveInsights,renderProjectOverview} from '../src/views/projectOverviewView.js';
test('overview separates recorded progress, absent inputs and declared decisions',()=>{
 const phase={id:'phase-002-work',category:'active',artifacts:{requirements:{},tasks:{},evidence:[{parsed:{result:'Not recorded'}}]},requirements:[{id:'REQ-002.1'}],relationships:[],tasks:[{id:'T002.1',status:'todo',title:'Build feature'}],warnings:[]};
 const snapshot={projectId:'<img src=x>',activePhaseId:phase.id,phases:[phase],memories:[{id:'technical-decisions',path:'.sdd/memory/technical-decisions.md',content:'# Decisions\n## Keep local files canonical\nThe viewer derives information from source files.'}]};
 const model=deriveInsights(snapshot); assert.equal(model.percent,0);assert.equal(model.attention[0].text,'Design missing');assert.equal(model.next[0].id,'T002.1');assert.equal(model.mapped,0);assert.equal(model.decisions[0].title,'Keep local files canonical');
 const html=renderProjectOverview(snapshot);assert.ok(html.includes('&lt;img'));assert.ok(html.includes('0 recorded pass outcomes'));assert.ok(html.includes('Read decision source'));
});
test('overview orders phases numerically and does not invent task progress',()=>{
 const model=deriveInsights({phases:[{id:'phase-010-later',category:'backlog'},{id:'phase-002-earlier',category:'active'}]});
 assert.equal(model.phases[0].id,'phase-002-earlier');assert.equal(model.percent,null);assert.equal(model.next.length,0);
});
