import test from 'node:test';
import assert from 'node:assert/strict';
import { connectionLevels } from '../src/graphExplorer.js';
test('focus expands across incoming and outgoing edges without exposing distant or unrelated nodes', () => {
 const edges=[{from:'parent',to:'focus'},{from:'focus',to:'child'},{from:'child',to:'grandchild'},{from:'grandchild',to:'focus'},{from:'other',to:'isolated'}];
 assert.deepEqual([...connectionLevels('focus',edges,0).keys()],['focus']);
 const direct=connectionLevels('parent',edges,1);
 assert.equal(direct.has('focus'),true);assert.equal(direct.has('child'),false);
 const expanded=connectionLevels('parent',edges,2);
 assert.equal(expanded.get('child'),2);assert.equal(expanded.has('isolated'),false);
});

test('selecting and expanding connections preserves overview geometry and all nodes', async () => {
 const { attachGraphExplorer } = await import('../src/graphExplorer.js');
 const { JSDOM } = await import('jsdom');
 const dom = new JSDOM('<div id="toolbar"></div><p id="detail"></p><svg viewBox="0 0 1460 820"><g class="trace-node" data-id="a" aria-label="A"><circle r="7"/></g><g class="trace-node" data-id="b"><circle r="7"/></g><g class="trace-node" data-id="c"><circle r="7"/></g><line class="trace-edge" data-from="a" data-to="b"/></svg>');
 const doc=dom.window.document, svg=doc.querySelector('svg');
 attachGraphExplorer(svg, doc.querySelector('#toolbar'), doc.querySelector('#detail'));
 svg.querySelector('.trace-node').dispatchEvent(new dom.window.MouseEvent('click'));
 assert.equal(svg.getAttribute('viewBox'),'0 0 1460 820');
 assert.ok([...svg.querySelectorAll('.trace-node')].every(node=>node.style.display !== 'none'));
 assert.equal(svg.querySelector('circle').getAttribute('r'),'7');
 [...doc.querySelectorAll('button')].find(button=>button.textContent==='More connections').click();
 assert.equal(svg.getAttribute('viewBox'),'0 0 1460 820');
});
