#!/usr/bin/env node
// Disposable review workspace: never registers or writes to personal projects.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalProjectService } from '../server/service.js';
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
if (args.length) {
  if (!['--complete','--reset'].includes(args[0]) || args.length !== 2) throw new Error('Usage: review-workspace.js [--complete|--reset /tmp/sdd-review-…]');
  const root = fs.realpathSync(args[1]);
  if (!path.basename(root).startsWith('sdd-review-') || !fs.existsSync(path.join(root,'.sdd-review-fixture'))) throw new Error('This is not a generated review workspace.');
  const taskFile = path.join(root,'.sdd/specs/active/phase-001-review/tasks.md');
  const text = fs.readFileSync(taskFile,'utf8');
  fs.writeFileSync(taskFile,text.replace(/- \[[ x]\] \*\*\[T001\.2\]\*\*/,`- [${args[0] === '--complete' ? 'x' : ' '}] **[T001.2]**`));
  console.log('Fixture task T001.2 updated. The viewer should refresh within five seconds.');
} else {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'sdd-review-'));
  const write = (name, text) => {const file=path.join(root,name); fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,text);};
  write('.sdd-review-fixture','Synthetic review workspace. Safe to remove after review.');
  write('.sdd/constitution.md','# Review fixture\nSynthetic data only; no personal project content.\n');
  write('.sdd/state','active_phase=phase-001-review\n');
  write('.sdd/specs/active/phase-001-review/requirements.md','# Phase 001 — Review workspace\n**Status:** Draft\n### REQ-001.1: Read connected documents\nOpen requirements, tasks and source.\n### REQ-001.2: Observe automatic updates\nA filesystem edit must appear without reloading.\n');
  write('.sdd/specs/active/phase-001-review/design.md','# Review design\n**Status:** Draft\n```mermaid\nflowchart LR\n  Files[Markdown files] --> Extractor --> Viewer[Visual workspace]\n```\n');
  write('.sdd/specs/active/phase-001-review/tasks.md','# Review tasks\n- [x] **[T001.1]** Read connected documents\n  - **Objective:** REQ-001.1\n- [ ] **[T001.2]** Observe automatic updates\n  - **Objective:** REQ-001.2\n');
  write('.sdd/evidence/phase-001-review/review-note.md','# Synthetic review note\n**Requirements:** REQ-001.1\n**Tasks:** T001.1\nThis demonstrates a reference. No independent test outcome is recorded.\n');
  write('.sdd/specs/backlog/phase-002-follow-up/requirements.md','# Phase 002 — Follow-up\n**Status:** Draft\n### REQ-002.1: Plan a future phase\nSynthetic backlog requirement.\n');
  write('graphify-out/graph.json',JSON.stringify({nodes:[{id:'files',label:'Synthetic Markdown files',type:'file'},{id:'extractor',label:'Synthetic extractor',type:'function'},{id:'viewer',label:'Synthetic viewer',type:'function'}],edges:[{from:'files',to:'extractor',label:'parsed by',provenance:'SYNTHETIC_REVIEW'},{from:'extractor',to:'viewer',label:'renders',provenance:'SYNTHETIC_REVIEW'}]}));
  const service = new LocalProjectService({port:0,staticDir:path.resolve(scriptDir,'../dist')});
  service.registerProject(root); const info=await service.start();
  console.log(`Synthetic review workspace: ${root}\nOpen: ${info.url}\n\nIn another terminal, from the framework repository:\nnode visual/scripts/review-workspace.js --complete ${root}\nnode visual/scripts/review-workspace.js --reset ${root}\n\nCtrl+C stops the viewer and removes this disposable workspace.`);
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal,async()=>{await service.stop(); fs.rmSync(root,{recursive:true,force:true}); process.exit(0);});
}
