/** Deterministic force layout: springs reveal relationships; gravity keeps isolates in view. */
export function layoutNetwork(nodes, edges, width = 1460, height = 820) {
  const count = nodes.length;
  const positions = new Map(nodes.map((node, i) => {
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    const radius = 18 * Math.sqrt(i);
    return [node.id, { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }];
  }));
  const links = edges.filter(edge => edge.from !== edge.to && positions.has(edge.from) && positions.has(edge.to));
  const velocities = new Map(nodes.map(node => [node.id, { x: 0, y: 0 }]));
  for (let step = 0; step < 320; step++) {
    const forces = new Map(nodes.map(node => {
      const p = positions.get(node.id);
      return [node.id, { x: -p.x * 0.035, y: -p.y * 0.035 }];
    }));
    for (let i = 0; i < count; i++) for (let j = i + 1; j < count; j++) {
      const a = positions.get(nodes[i].id), b = positions.get(nodes[j].id);
      const dx = a.x - b.x, dy = a.y - b.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const strength = 900 / (distance * distance);
      const fa = forces.get(nodes[i].id), fb = forces.get(nodes[j].id);
      fa.x += dx * strength; fa.y += dy * strength;
      fb.x -= dx * strength; fb.y -= dy * strength;
    }
    for (const edge of links) {
      const a = positions.get(edge.from), b = positions.get(edge.to);
      const dx = b.x - a.x, dy = b.y - a.y, distance = Math.max(1, Math.hypot(dx, dy));
      const strength = (distance - 65) * 0.025 / distance;
      const fa = forces.get(edge.from), fb = forces.get(edge.to);
      fa.x += dx * strength; fa.y += dy * strength;
      fb.x -= dx * strength; fb.y -= dy * strength;
    }
    for (const node of nodes) {
      const p = positions.get(node.id), f = forces.get(node.id), v = velocities.get(node.id);
      v.x = (v.x + f.x) * 0.65; v.y = (v.y + f.y) * 0.65;
      const speed = Math.max(1, Math.hypot(v.x, v.y) / 12);
      p.x += v.x / speed; p.y += v.y / speed;
    }
  }
  if (!count) return positions;
  const points = [...positions.values()];
  const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
  const scale = Math.min((width - 200) / Math.max(100, maxX - minX), (height - 160) / Math.max(100, maxY - minY));
  for (const p of points) {
    p.x = width / 2 + (p.x - (minX + maxX) / 2) * scale;
    p.y = height / 2 + (p.y - (minY + maxY) / 2) * scale;
  }
  return positions;
}
