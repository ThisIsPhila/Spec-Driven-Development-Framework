import { escapeHtml as e } from './sanitize.js';
export function renderPhaseDependencies(phases) {
 const ids=new Set(phases.map(p=>p.id));
 const rows=phases.map(p=>{const raw=p.metadata?.dependencies ?? p.metadata?.dependsOn;return {id:p.id,declared:Array.isArray(raw),deps:Array.isArray(raw)?raw.filter(d=>typeof d==='string'):[]};});
 const edges=rows.flatMap(row=>row.deps.map(from=>({from,to:row.id}))).filter(edge=>ids.has(edge.from));
 const pos=new Map(rows.map((row,i)=>[row.id,{x:30+(i%3)*370,y:40+Math.floor(i/3)*100}]));
 return `<section class="insight-panel"><h2>Phase dependencies</h2><p>${edges.length} explicit links. No declaration means unknown; an explicitly empty dependency list means none declared.</p><div class="phase-dependency-canvas"><svg viewBox="0 0 1140 ${Math.max(180,Math.ceil(rows.length/3)*100+60)}" aria-label="Declared phase dependencies">
 ${edges.map(edge=>{const a=pos.get(edge.from),b=pos.get(edge.to);return `<path class="trace-edge" data-from="${e(edge.from)}" data-to="${e(edge.to)}" tabindex="0" d="M${a.x+150} ${a.y+40} L${b.x+150} ${b.y}" stroke="#888" fill="none"><title>${e(edge.from)} → ${e(edge.to)}</title></path>`;}).join('')}
 ${rows.map(row=>{const p=pos.get(row.id);return `<g class="trace-node phase-dependency-node" data-id="${e(row.id)}" tabindex="0" role="button" aria-label="${e(row.id)}"><rect x="${p.x}" y="${p.y}" width="330" height="50" rx="4" fill="#171717" stroke="#555"/><text x="${p.x+8}" y="${p.y+20}" fill="#eee" font-size="11">${e(row.id.slice(0,44))}</text><text x="${p.x+8}" y="${p.y+39}" fill="#aaa" font-size="10">${row.declared?row.deps.length+' prerequisites declared':'Dependencies unrecorded'}</text></g>`;}).join('')}</svg></div></section>`;
}
