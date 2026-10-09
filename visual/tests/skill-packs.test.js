import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const { install, validate } = createRequire(import.meta.url)('../../scripts/skill-pack.cjs');
test('community packs install and update managed skills without overwriting local edits', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'sdd-pack-test-')); const pack = path.join(root,'pack'), project = path.join(root,'project');
  fs.mkdirSync(path.join(pack,'skills/cloud-deploy'),{recursive:true}); fs.mkdirSync(path.join(project,'.sdd'),{recursive:true});
  const skill = '---\nname: cloud-deploy\ndescription: Cloud delivery instructions\n---\n# Deploy\n';
  fs.writeFileSync(path.join(pack,'SKILL.md'),'---\nname: cloud-delivery\ndescription: Reusable pack\n---\n');
  fs.writeFileSync(path.join(pack,'skills/cloud-deploy/SKILL.md'),skill);
  fs.writeFileSync(path.join(pack,'sdd-pack.json'),JSON.stringify({schemaVersion:1,name:'cloud-delivery',profile:'api+devops',skills:['cloud-deploy']}));
  try {
    assert.equal(validate(pack).name,'cloud-delivery');
    install(pack,project,false);
    assert.equal(fs.readFileSync(path.join(project,'skills/cloud-deploy/SKILL.md'),'utf8'),skill);
    fs.appendFileSync(path.join(pack,'skills/cloud-deploy/SKILL.md'),'New upstream instructions\n');
    assert.throws(()=>install(pack,project,false),/Refusing/);
    install(pack,project,true);
    fs.appendFileSync(path.join(project,'skills/cloud-deploy/SKILL.md'),'Local edits\n');
    fs.appendFileSync(path.join(pack,'skills/cloud-deploy/SKILL.md'),'Another upstream revision\n');
    assert.throws(()=>install(pack,project,true),/Refusing/);
    fs.symlinkSync('/tmp',path.join(pack,'skills/cloud-deploy/linked'));
    assert.throws(()=>install(pack,project,true),/symlinks/);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
