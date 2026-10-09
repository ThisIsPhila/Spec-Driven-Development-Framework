import test from 'node:test';
import assert from 'node:assert/strict';
import { AccountService } from '../server/account-service.js';
import { SnapshotPublisher } from '../server/sync.js';
test('accounts persist private projects, isolate owners and support connector publishing', async () => {
  const service = new AccountService({ database: ':memory:', port: 0 });
  const { url } = await service.start();
  const post = (endpoint, body, cookie) => fetch(url + endpoint, { method: 'POST', headers: { 'Content-Type':'application/json', ...(cookie ? {Cookie:cookie} : {}) }, body: JSON.stringify(body) });
  try {
    const registration = await post('/api/account/register', {email:'first@example.test',password:'sufficiently-long-password'});
    assert.equal(registration.status,200);
    const cookie = registration.headers.get('set-cookie').split(';')[0];
    const tokenResponse = await post('/api/account/connector', {}, cookie); const {token} = await tokenResponse.json();
    const snapshot = {projectId:'Private project',projectRoot:'/private/example',contentRevision:'revision-one',phases:[],artifacts:{path:'/private/example/.sdd/test.md',content:'private evidence'}};
    const publisher = new SnapshotPublisher({ url, token, deviceId:'machine-a' });
    await publisher.publish({id:'project-a',lastSnapshot:snapshot});
    const projects = await (await fetch(url+'/api/projects', {headers:{Cookie:cookie}})).json();
    assert.equal(projects.length,1);
    const published = await (await fetch(url+`/api/project/${projects[0].id}/snapshot`, {headers:{Cookie:cookie}})).json();
    assert.equal(published.projectRoot,undefined);
    assert.equal(published.artifacts.path,'.sdd/test.md');
    assert.equal((await fetch(url+'/api/projects')).status,401);
    const second = await post('/api/account/register',{email:'second@example.test',password:'another-long-password'});
    const secondCookie = second.headers.get('set-cookie').split(';')[0];
    assert.equal((await fetch(url+`/api/project/${projects[0].id}/snapshot`,{headers:{Cookie:secondCookie}})).status,404);
    assert.equal((await fetch(url+`/api/project/${projects[0].id}/artifact?path=.sdd/test.md`,{headers:{Cookie:secondCookie}})).status,404);
    assert.equal((await fetch(url+'/api/projects',{headers:{Cookie:cookie,Origin:'https://other.invalid'}})).status,403);
    const secondToken = await (await post('/api/account/connector',{},secondCookie)).json();
    await post('/api/account/connector/revoke',{},cookie);
    assert.equal(service.store.authenticate(token,'connector'),null);
    assert.ok(service.store.authenticate(secondToken.token,'connector'));
    await assert.rejects(() => publisher.publish({id:'project-a',lastSnapshot:{...snapshot,contentRevision:'revision-two'}}),/401/);
    await post('/api/account/logout',{},cookie);
    assert.equal((await fetch(url+'/api/projects',{headers:{Cookie:cookie}})).status,401);
    assert.equal((await post('/api/account/login',{email:'first@example.test',password:'wrong-password'})).status,400);
    assert.equal((await post('/api/account/login',{email:'first@example.test',password:'sufficiently-long-password'})).status,200);
  } finally { await service.stop(); }
});

test('bootstrap claim is private, persistent and automatically refreshes configured projects', async () => {
  const fs = await import('node:fs'); const os = await import('node:os'); const path = await import('node:path');
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'sdd-account-claim-')); const project = path.join(root,'project');
  const phase = path.join(project,'.sdd/specs/active/phase-001-test'); fs.mkdirSync(phase,{recursive:true});
  fs.writeFileSync(path.join(phase,'tasks.md'),'# Tasks\n- [ ] **[T001.1]** First task\n');
  const database=path.join(root,'accounts.sqlite'); let service=new AccountService({database,port:0,bootstrapProjects:[project]});
  const info=await service.start(); const origin=new URL(info.url).origin; const claim=new URL(info.url).hash.split('=')[1];
  const register=async (email,claimToken)=>fetch(origin+'/api/account/register',{method:'POST',headers:{'Content-Type':'application/json',...(claimToken?{'X-SDD-Bootstrap':claimToken}:{})},body:JSON.stringify({email,password:'owner-test-password'})});
  try {
    const other=await register('other@example.test'); const otherCookie=other.headers.get('set-cookie').split(';')[0];
    assert.equal((await (await fetch(origin+'/api/projects',{headers:{Cookie:otherCookie}})).json()).length,0);
    const owner=await register('owner@example.test',claim); const cookie=owner.headers.get('set-cookie').split(';')[0];
    let projects=await (await fetch(origin+'/api/projects',{headers:{Cookie:cookie}})).json(); assert.equal(projects.length,1);
    const before=projects[0].contentRevision;
    fs.appendFileSync(path.join(phase,'tasks.md'),'\n- [x] **[T001.2]** New task\n'); service.refreshBootstrap();
    projects=await (await fetch(origin+'/api/projects',{headers:{Cookie:cookie}})).json(); assert.notEqual(projects[0].contentRevision,before);
    await service.stop(); service=new AccountService({database,port:0,bootstrapProjects:[project]});
    assert.equal(service.bootstrapToken,null); assert.ok(service.bootstrapOwner);
    await service.start();
  } finally { await service.stop(); fs.rmSync(root,{recursive:true,force:true}); }
});
