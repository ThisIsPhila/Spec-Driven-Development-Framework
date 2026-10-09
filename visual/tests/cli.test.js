import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { once } from 'node:events';
const cli=path.resolve('server/cli.js');
test('actual CLI accepts repeated project arguments, serves them and exits cleanly', async () => {
  const child=spawn(process.execPath,[cli,'--project',path.resolve('tests/fixtures/canonical-project'),'--project',path.resolve('tests/fixtures/legacy-project'),'--port','0'],{env:{...process.env,SDD_SYNC_URL:'',SDD_SYNC_TOKEN:''},stdio:['ignore','pipe','pipe']});
  let output='', errors=''; child.stderr.on('data',chunk=>errors+=chunk);
  try {
    const url=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('CLI launch timed out: '+errors)),10000);
      child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127\.0\.0\.1:\d+\/#token=[a-f0-9]+/);if(match){clearTimeout(timer);resolve(match[0]);}});
      child.once('exit',code=>{clearTimeout(timer);reject(new Error(`CLI exited ${code}: ${errors}`));});
    });
    const parsed=new URL(url), token=parsed.hash.split('=')[1];
    const projects=await(await fetch(parsed.origin+'/api/projects',{headers:{Authorization:`Bearer ${token}`}})).json();
    assert.equal(projects.length,2);
    assert.ok(projects.some(project=>project.name==='canonical-project'));
    assert.ok(projects.some(project=>project.name==='legacy-project'));
  } finally {child.kill('SIGTERM');await once(child,'exit');}
});
test('CLI rejects unknown options rather than silently ignoring them',()=>{
  const result=spawnSync(process.execPath,[cli,'--unknown'],{encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stderr,/Unknown or incomplete option/);
});
