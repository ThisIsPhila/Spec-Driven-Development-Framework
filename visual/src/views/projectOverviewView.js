import { escapeHtml as e } from '../sanitize.js';
export const phaseOrder = (a,b) => Number(a.id.match(/^phase-(\d+)/)?.[1] || 0)-Number(b.id.match(/^phase-(\d+)/)?.[1] || 0) || a.id.localeCompare(b.id);
export function sortPhases(phases, order = 'latest') {
 return [...phases].sort(order==='name'?(a,b)=>(a.name || a.id).localeCompare(b.name || b.id):order==='oldest'?phaseOrder:(a,b)=>phaseOrder(b,a));
}
export function renderPhaseSort(order='latest') {
 return `<div class="phase-sort-buttons" role="group" aria-label="Sort phases">${[['latest','Latest'],['oldest','Phase order'],['name','A–Z']].map(([value,label])=>`<button class="phase-sort-button" data-phase-sort="${value}" aria-pressed="${value===order}">${label}</button>`).join('')}</div>`;
}
export function deriveInsights(snapshot) {
  const phases=[...(snapshot?.phases || [])].sort(phaseOrder);
  const tasks=phases.flatMap(phase=>(phase.tasks || []).map(task=>({...task,phaseId:phase.id})));
  const completed=tasks.filter(task=>task.status==='done').length;
  const attention=[];
  if (snapshot?.activePhaseId && !phases.some(p=>p.id===snapshot.activePhaseId)) attention.push({phaseId:snapshot.activePhaseId,text:'Declared current phase is missing from project files',tab:'overview'});
  for (const phase of phases) {
    for (const kind of ['requirements','design','tasks']) if (phase.category==='active' && !phase.artifacts?.[kind]) attention.push({phaseId:phase.id,text:`${kind === 'requirements' ? 'Requirements' : kind === 'design' ? 'Design' : 'Task plan'} missing`,tab:kind});
    for (const warning of phase.warnings || []) if (!attention.some(item=>item.phaseId===phase.id && item.text===warning)) attention.push({phaseId:phase.id,text:warning,tab:'overview'});
  }
  const reqs=phases.flatMap(p=>(p.requirements || []).map(req=>({phaseId:p.id,id:req.id})));
  const mapped=reqs.filter(req=>phases.find(p=>p.id===req.phaseId)?.relationships?.some(rel=>(rel.toId || rel.to)===req.id && (rel.fromType==='task' || phases.find(p=>p.id===req.phaseId)?.tasks?.some(t=>t.id===(rel.fromId || rel.from))))).length;
  const records=phases.flatMap(p=>(p.artifacts?.evidence || []).map(record=>({...record,phaseId:p.id})));
  const next=tasks.filter(task=>task.status!=='done' && phases.find(p=>p.id===task.phaseId)?.category==='active').sort((a,b)=>(a.phaseId===snapshot.activePhaseId?-1:0)-(b.phaseId===snapshot.activePhaseId?-1:0) || (a.status==='doing'?-1:0)-(b.status==='doing'?-1:0)).slice(0,5);
  const decisions=[];
  for (const doc of snapshot?.memories || []) {
    if (!/decision/i.test(doc.id || doc.filename || '')) continue;
    for (const block of (doc.content || '').split(/(?=^#{2,4} )/m)) {
      const title=block.match(/^#{2,4}\s+(.+)/)?.[1];
      const text=block.replace(/^#{1,4} .+\n?/,'').replace(/<!--[^]*?-->/g,'').trim();
      if (!title || !text || /template|placeholder|\[.*\]|YYYY|how to|format/i.test(title) || /^\s*\[|^\s*\{\{|^\s*TBD/i.test(text)) continue;
      decisions.push({title,text:text.replace(/[*`#]/g,'').slice(0,300),path:doc.path});
    }
  }
  return {phases,tasks,completed,percent:tasks.length?Math.round(completed/tasks.length*100):null,attention,reqs,mapped,records,next,decisions:decisions.slice(-6).reverse()};
}
export function renderProjectOverview(snapshot, order = 'latest') {
  if (!snapshot) return '<p class="empty-state">Loading project…</p>';
  const i=deriveInsights(snapshot), active=i.phases.find(p=>p.id===snapshot.activePhaseId);

  // Change 3: active task banner
  const doingTask = i.next.find(t => t.status === 'doing');
  const activeBanner = doingTask ? `<div class="project-active-task-banner">
    <div class="project-active-task-left">
      <span class="pulse-indicator"></span>
      <span class="active-tag">IN PROGRESS</span>
      <span class="task-id-badge">${e(doingTask.id)}</span>
    </div>
    <div class="project-active-task-body">
      <strong class="project-active-task-title">${e((doingTask.title || '').replace(/[*`]/g,''))}</strong>
      ${doingTask.contract ? `<span class="project-active-task-contract">${e(doingTask.contract)}</span>` : ''}
    </div>
    <button class="btn btn-secondary project-active-task-cta" data-insight-phase="${e(doingTask.phaseId)}" data-insight-tab="tasks">View task</button>
  </div>` : '';

  return `<section class="project-insights"><div class="insights-heading"><div><p class="eyebrow">PROJECT OVERVIEW</p><h1>${e(snapshot.projectId)}</h1><p>${active?`Current phase: ${e(active.id)}`:'No current phase declared'} · ${e(snapshot.profile || 'general')}</p></div><button class="btn btn-secondary" data-domain="phases">Explore phases</button></div>
    ${activeBanner}
    <div class="insight-kpis"><article><span>Recorded progress</span><strong>${i.percent===null?'No task plan':i.percent+'%'}</strong><p>${i.completed} of ${i.tasks.length} tasks marked complete</p></article><article><span>Needs attention</span><strong>${i.attention.length}</strong><p>Missing phase inputs and extraction warnings</p></article><article><span>Requirement links</span><strong>${i.mapped}/${i.reqs.length}</strong><p>Requirements mapped to tasks</p></article><article><span>Evidence records</span><strong>${i.records.length}</strong><p>${i.records.filter(r=>/^PASS(?:ED)?\b/i.test(r.parsed?.result || '')).length} recorded pass outcomes · not independent certification</p></article><article><span>Quality &amp; gate health</span><strong>${snapshot.metrics?.overallHealthScore ?? 0}/100</strong><p>${snapshot.hooks?.telemetry?.totalGatesRun ?? 0} gate checks · ${snapshot.hooks?.telemetry?.passRate ?? '100%'} pass rate</p></article></div>
    <div class="insights-grid"><section class="insight-panel"><h2>Progress by phase</h2>${renderPhaseSort(order)}<p>Current task completion and verification status per phase.</p><div role="img" aria-label="Recorded progress by phase" class="phase-progress-list">${sortPhases(i.phases, order).map(p=>{
      const evCount = p.artifacts?.evidence?.length || 0;
      const passEv = (p.artifacts?.evidence || []).filter(ev => /^PASS(?:ED)?\b/i.test(ev.parsed?.result || '')).length;
      const testPill = evCount > 0 ? (passEv === evCount ? `<span class="phase-test-pill pill-pass">${evCount} pass</span>` : `<span class="phase-test-pill pill-warn">${passEv}/${evCount} pass</span>`) : `<span class="phase-test-pill pill-muted">No tests</span>`;
      // Change 4: health score pill
      const score = p.metrics?.healthScore || 0;
      const grade = score >= 75 ? 'healthy' : score >= 50 ? 'attention' : 'critical';
      const healthPill = `<span class="phase-health-pill health-${grade}">${score}/100</span>`;
      return `<button class="phase-progress-row" data-insight-phase="${e(p.id)}" data-insight-tab="overview"><span>${e(p.id)}</span><span>${p.taskCounts?.total?`${p.taskCounts.completed}/${p.taskCounts.total}`:p.artifacts?.tasks?'Unassessed':'No task plan'}</span><span class="insight-bar"><span style="width:${Math.max(0,Math.min(100,p.taskCounts?.percent || 0))}%"></span></span>${testPill}${healthPill}</button>`;
    }).join('')}</div></section>
    <section class="insight-panel"><h2>Verification &amp; test assurance</h2><p>Automated gate executions and recorded phase evidence.</p><div class="test-assurance-summary font-mono"><div class="test-stat-box"><span class="stat-number text-accent">${snapshot.hooks?.telemetry?.totalGatesRun ?? 0}</span><span class="stat-label">Gate Executions</span></div><div class="test-stat-box"><span class="stat-number text-success">${snapshot.hooks?.telemetry?.passRate ?? '100%'}</span><span class="stat-label">Pass Rate</span></div><div class="test-stat-box"><span class="stat-number text-foreground">${i.records.length}</span><span class="stat-label">Evidence Files</span></div><div class="test-stat-box"><span class="stat-number ${i.records.filter(r=>/^PASS/i.test(r.parsed?.result||'')).length === i.records.length && i.records.length > 0 ? 'text-success' : 'text-warning'}">${i.records.filter(r=>/^PASS/i.test(r.parsed?.result||'')).length}</span><span class="stat-label">Passing Evidence</span></div></div>${(snapshot.hooks?.telemetry?.gatesList || []).length ? `<div class="gate-quick-list font-mono">${snapshot.hooks.telemetry.gatesList.map(g => `<div class="gate-quick-item"><span>${e(g.name)}</span><span class="badge ${g.status === 'PASS' ? 'badge-pass' : 'badge-status'}">${e(g.status)}</span></div>`).join('')}</div>` : ''}<button class="btn btn-secondary" data-domain="automation" style="margin-top:0.75rem;">View checks &amp; automation</button></section>
    <section class="insight-panel"><h2>Next recorded work</h2>${i.next.length?i.next.map(t=>`<button class="insight-action" data-insight-phase="${e(t.phaseId)}" data-insight-tab="tasks"><span class="eyebrow">${e(t.id)} · ${t.status==='doing'?'In progress':'Pending'}</span><strong>${e((t.title || '').replace(/[*`]/g,''))}</strong><span>${e(t.phaseId)}</span></button>`).join(''):'<p>No pending tasks recorded in active phases. This does not establish acceptance.</p>'}</section>
    <section class="insight-panel"><h2>Needs attention</h2>${i.attention.length?i.attention.slice(0,8).map(item=>`<button class="insight-action" data-insight-phase="${e(item.phaseId)}" data-insight-tab="${item.tab}"><strong>${e(item.text)}</strong><span>${e(item.phaseId)}</span></button>`).join(''):'<p>No missing active-phase inputs or extraction warnings recorded.</p>'}<button class="btn btn-secondary" data-domain="automation">View checks &amp; automation</button></section>
    <section class="insight-panel"><h2>Recorded decisions</h2><p>Excerpts from project decision records, with source links.</p>${i.decisions.length?i.decisions.map(d=>`<article class="decision-excerpt"><h3>${e(d.title)}</h3><p>${e(d.text)}</p><button class="btn btn-secondary" data-source-path="${e(d.path)}">Read decision source</button></article>`).join(''):'<p>No populated decision sections found. Add decisions to your project decision record to surface them here.</p>'}</section></div>
    <p class="insights-provenance">Derived from this project's latest recorded files. Task checkboxes, references and evidence claims are distinct from verified acceptance. <button class="btn btn-secondary" data-domain="knowledge">Explore relationships</button></p></section>`;
}

export function renderDecisionOverview(snapshot) {
  const model=deriveInsights(snapshot);
  const context=(snapshot?.memories || []).find(doc=>doc.id==='active-context');
  const focus=context?.content?.match(/\*\*Current Task:\*\*\s*([^\n]+)/)?.[1] || context?.content?.match(/Current Task:\s*([^\n]+)/)?.[1];
  return `<section class="project-insights"><p class="eyebrow">PROJECT CONTEXT</p><h1>Decisions & context</h1><p>Recorded rationale and current focus, linked to the documents that declare them.</p><div class="insights-grid"><section class="insight-panel"><h2>Current focus</h2><p>${focus?e(focus):'No structured current-task declaration found.'}</p>${context?.path?`<button class="btn btn-secondary" data-source-path="${e(context.path)}">Read context source</button>`:''}<p>${snapshot?.activePhaseId?'Declared current phase: '+e(snapshot.activePhaseId):'No current phase declared.'}</p><button class="btn btn-secondary" data-gov-tab="${context?.id || 'constitution'}">Browse context documents & rules</button></section><section class="insight-panel"><h2>Recorded decisions</h2>${model.decisions.length?model.decisions.map(d=>`<article class="decision-excerpt"><h3>${e(d.title)}</h3><p>${e(d.text)}</p><button class="btn btn-secondary" data-source-path="${e(d.path)}">Read decision source</button></article>`).join(''):'<p>No populated decision sections found.</p>'}</section></div></section>`;
}
