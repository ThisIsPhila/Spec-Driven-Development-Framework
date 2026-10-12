/** Connection levels describe recorded edge direction, not inferred ownership. */
export function connectionLevels(id, edges, depth) {
  const levels = new Map([[id, 0]]);
  let frontier = [id];
  for (let level = 1; level <= depth; level++) {
    const next = [];
    for (const edge of edges) {
      let neighbor;
      if (frontier.includes(edge.from)) neighbor = edge.to;
      else if (frontier.includes(edge.to)) neighbor = edge.from;
      if (neighbor && !levels.has(neighbor)) { levels.set(neighbor, level); next.push(neighbor); }
    }
    frontier = next;
  }
  return levels;
}

export function attachGraphExplorer(svg, toolbar, detail) {
  const document = svg.ownerDocument;
  const nodes = [...svg.querySelectorAll('.trace-node')];
  const lines = [...svg.querySelectorAll('.trace-edge')];
  const edges = lines.map(line => ({ from: line.dataset.from, to: line.dataset.to }));
  const original = svg.getAttribute('viewBox');
  let selected = null, depth = 1;
  const status = document.createElement('span');
  status.setAttribute('aria-live', 'polite');
  const makeButton = (label, action) => {
    const button = document.createElement('button');
    button.className = 'btn btn-secondary'; button.textContent = label;
    button.onclick = action; toolbar.append(button); return button;
  };
  const draw = () => {
    if (!selected) {
      svg.setAttribute('viewBox', original);
      [...nodes, ...lines].forEach(el => { el.style.display = ''; el.style.opacity = '1'; });
      nodes.forEach(node => node.classList.remove('graph-selected-node'));
      status.textContent = 'Select a node to explore its connections.';
      return;
    }
    const levels = connectionLevels(selected, edges, depth);
    const visible = nodes.filter(node => levels.has(node.dataset.id));
    nodes.forEach(node => {
      node.style.display = '';
      node.style.opacity = levels.has(node.dataset.id) ? '1' : '0.25'; node.classList.toggle('graph-selected-node', node.dataset.id === selected);
    });
    lines.forEach(line => {
      line.style.display = '';
      line.style.opacity = levels.has(line.dataset.from) && levels.has(line.dataset.to) ? '1' : '0.12';
    });
    svg.setAttribute('viewBox', original);
    const node = nodes.find(node => node.dataset.id === selected);
    status.textContent = `${node.getAttribute('aria-label') || selected} · ${depth} connection level${depth === 1 ? '' : 's'} · ${visible.length} highlighted nodes`;
    const incoming = edges.filter(e => e.to === selected).length;
    const outgoing = edges.filter(e => e.from === selected).length;
    detail.textContent = `${incoming} incoming and ${outgoing} outgoing connections in this canvas. The overview and node sizes stay fixed.`;
  };
  const closer = makeButton('Fewer connections', () => { if (selected) { depth = Math.max(0, depth - 1); draw(); } });
  const further = makeButton('More connections', () => { if (selected) { depth = Math.min(nodes.length, depth + 1); draw(); } });
  makeButton('Show overview', () => { selected = null; draw(); });
  toolbar.append(status);
  nodes.forEach(node => {
    const select = () => { selected = node.dataset.id; depth = 1; closer.disabled = false; further.disabled = false; draw(); };
    node.addEventListener('click', select);
    node.addEventListener('keydown', event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); select(); } });
  });
  lines.forEach(line => {
    const inspect = () => { detail.textContent = `${line.dataset.from} → ${line.dataset.to}`; };
    line.addEventListener('mouseenter', inspect); line.addEventListener('focus', inspect); line.addEventListener('click', inspect);
  });
  closer.disabled = true; further.disabled = true; draw();
}
