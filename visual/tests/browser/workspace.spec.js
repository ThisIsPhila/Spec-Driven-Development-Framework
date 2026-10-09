import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { LocalProjectService } from '../../server/service.js';
import { AccountService } from '../../server/account-service.js';
let service, accountService, root, info, accountInfo;
test.beforeAll(async () => {
  root = fs.mkdtempSync(path.join(os.tmpdir(),'sdd-browser-'));
  for (let i=1;i<=60;i++) {
    const id=String(i).padStart(3,'0'); const folder=path.join(root,`.sdd/specs/active/phase-${id}-example`);
    fs.mkdirSync(folder,{recursive:true});
    fs.writeFileSync(path.join(folder,'requirements.md'),`# Project phase ${i}\n**Status:** Approved\n### REQ-${id}.1: Functional behavior\n`);
    fs.writeFileSync(path.join(folder,'tasks.md'),`# Tasks\n- [x] **[T${id}.1]** Completed task\n  - **Objective:** REQ-${id}.1\n- [ ] **[T${id}.2]** Pending task\n  - **Objective:** REQ-${id}.1\n`);
  }
  fs.mkdirSync(path.join(root,'graphify-out'));
  fs.writeFileSync(path.join(root,'graphify-out/graph.json'),JSON.stringify({nodes:[{id:'source',label:'Source file',type:'file'},{id:'parser',label:'Task parser',type:'function'}],edges:[{from:'source',to:'parser',label:'calls',provenance:'EXTRACTED'}]}));
  service = new LocalProjectService({port:0,staticDir:path.resolve('dist')}); service.registerProject(root); info=await service.start();
  accountService = new AccountService({database:':memory:',port:0,staticDir:path.resolve('dist')}); accountInfo=await accountService.start();
});
test.afterAll(async () => { await service.stop(); await accountService.stop(); fs.rmSync(root,{recursive:true,force:true}); });
test('public page stays contained at mobile, tablet and desktop widths',async ({page})=>{
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({width,height:844}); await page.goto(`http://127.0.0.1:${info.port}/`);
    await expect(page.getByText('Explore fictional projects')).toBeVisible();
    const overflow=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
    expect(overflow.document,`page-wide overflow at ${width}`).toBeLessThanOrEqual(overflow.viewport);
  }
});
test('real 60-phase workspace filters tasks and follows requirement/source links',async ({page})=>{
  await page.goto(info.url);
  await expect(page.locator('.phase-nav-sidebar [data-phase-select]').first()).toBeVisible();
  // Navigator selection uses the actual markup rather than synthetic demo state.
  await expect(page.locator('.phase-nav-sidebar [data-phase-select]')).toHaveCount(60);
  await page.locator('#phase-search-field').fill('T060.1');
  await expect(page.locator('.phase-nav-sidebar [data-phase-select]')).toHaveCount(1);
  await page.locator('#phase-search-field').fill('');
  await expect(page.locator('.phase-nav-sidebar [data-phase-select]')).toHaveCount(60);
  const phaseButton=page.locator('.phase-nav-sidebar [data-phase-select]').first();
  await phaseButton.click();
  await page.locator('[data-phase-tab="tasks"]').click();
  await expect(page.locator('.task-card')).toHaveCount(2);
  await page.locator('.tasks-toolbar [data-filter="todo"]').click();
  await expect(page.locator('.task-card')).toHaveCount(1);
  await expect(page.locator('.task-card')).toContainText('Pending task');
  await page.locator('[data-open-ref]').first().click();
  await expect(page.locator('.markdown-body')).toContainText('Functional behavior');
  await page.locator('button[data-source-path]').first().click();
  await expect(page.locator('dialog')).toContainText('REQ-001.1');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.locator('[data-phase-tab="tasks"]').click();
  await page.locator('#phase-search-field').focus();
  const before=await page.locator('.task-card').count();
  fs.appendFileSync(path.join(root,'.sdd/specs/active/phase-001-example/tasks.md'),'\n- [ ] **[T001.3]** Automatically refreshed\n');
  await expect(page.locator('.task-card')).toHaveCount(before+1,{timeout:5000});
  await expect(page.locator('#phase-search-field')).toBeFocused();
  const deepLink=page.url(); await page.goto(deepLink);
  await expect(page.locator('[data-phase-tab="tasks"]')).toHaveClass(/active/);
  await expect(page.locator('.task-card')).toHaveCount(2);
  for (const width of [320,390,768,1024,1440]) { await page.setViewportSize({width,height:844}); const sizes=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth})); expect(sizes.document, `workspace overflow at ${width}`).toBeLessThanOrEqual(sizes.viewport); }
  await page.locator('[data-domain="knowledge"]').click(); await page.locator('[data-know-section="graphify"]').click();
  await expect(page.getByRole('img',{name:'Imported Graphify topology'})).toBeVisible();
  await expect(page.locator('.imported-graph rect')).toHaveCount(2);
  await expect(page.locator('.imported-graph line')).toHaveCount(1);
});
test('account sign-up is functional and an empty account has no invented projects',async ({page})=>{
  await page.goto(accountInfo.url);
  page.once('dialog', dialog => dialog.accept(info.url));
  await page.locator('#connect-workspace-btn').click();
  await expect(page.locator('.phase-nav-sidebar [data-phase-select]')).toHaveCount(60);
  await page.goto(accountInfo.url);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.locator('#account-email').fill('browser@example.test');
  await page.locator('#account-password').fill('browser-test-password');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page.getByText('No connected projects yet')).toBeVisible();
  await page.getByRole('button',{name:'Connect machine',exact:true}).click();
  await expect(page.locator('dialog')).toContainText('SDD_SYNC_TOKEN=');
});
