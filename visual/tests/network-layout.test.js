import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutNetwork } from '../src/networkLayout.js';

test('large networks occupy the centre without accumulating on canvas boundaries', () => {
  const nodes = Array.from({ length: 150 }, (_, i) => ({ id: `n${i}` }));
  for (const edges of [[], nodes.slice(1).map(node => ({ from: 'n0', to: node.id })), nodes.slice(1).map((node, i) => ({ from: `n${i}`, to: node.id }))]) {
    const points = [...layoutNetwork(nodes, edges).values()];
    assert.equal(points.length, 150);
    assert.ok(points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 100 && p.x <= 1360 && p.y >= 80 && p.y <= 740));
    assert.ok(points.filter(p => p.x > 400 && p.x < 1060 && p.y > 220 && p.y < 600).length > 25, 'centre must contain nodes');
    assert.ok(points.filter(p => p.x < 101 || p.x > 1359 || p.y < 81 || p.y > 739).length < 10, 'nodes must not pile against fixed boundaries');
  }
});
test('singletons are centred and invalid links are ignored', () => {
  assert.deepEqual(layoutNetwork([{ id: 'one' }], [{ from: 'one', to: 'missing' }]).get('one'), { x: 730, y: 410 });
  assert.equal(layoutNetwork([], []).size, 0);
});
