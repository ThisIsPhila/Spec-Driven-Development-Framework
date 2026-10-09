#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
import { SnapshotPublisher } from './sync.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalProjectService } from './service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(__dirname, '../dist');

const args = process.argv.slice(2);
const projectPaths = [];
const invocationRoot = process.env.INIT_CWD || process.cwd();
let port = 3456;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' && args[i + 1]) {
    projectPaths.push(args[i + 1]);
    i++;
  } else if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    i++;
  } else { console.error(`[SDD] Unknown or incomplete option: ${args[i]}`); process.exit(1); }
}
if (!Number.isInteger(port) || port < 0 || port > 65535) { console.error('[SDD] Port must be an integer from 0 to 65535'); process.exit(1); }

const service = new LocalProjectService({ port, staticDir });

try {
  if (!projectPaths.length) projectPaths.push(invocationRoot);
  const projects = projectPaths.map(root => service.registerProject(root));
  const info = await service.start();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[SDD] Visual Workspace Server Running');
  for (const project of projects) console.log(`[SDD] Project: ${project.id} (${project.root})`);
  console.log(`[SDD] URL:     ${info.url}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Press Ctrl+C to stop.');
  if (process.env.SDD_SYNC_URL && process.env.SDD_SYNC_TOKEN) {
    const deviceFile = path.join(projects[0].root, '.sdd/local/device-id');
    fs.mkdirSync(path.dirname(deviceFile), {recursive:true,mode:0o700});
    if (!fs.existsSync(deviceFile)) fs.writeFileSync(deviceFile, crypto.randomUUID(), {mode:0o600});
    const publisher = new SnapshotPublisher({ url: process.env.SDD_SYNC_URL, token: process.env.SDD_SYNC_TOKEN, deviceId: process.env.SDD_DEVICE_ID || fs.readFileSync(deviceFile,'utf8').trim() });
    let publishing = false;
    const publish = async () => {
      if (publishing) return;
      publishing = true;
      try { for (const project of service.projects.values()) await publisher.publish(project); }
      catch (error) { console.error('[SDD sync]', error.message); }
      finally { publishing = false; }
    };
    await publish(); const syncTimer = setInterval(publish, 2500); syncTimer.unref();
  }
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await service.stop(); process.exit(0); });
} catch (err) {
  console.error('[SDD Error] Failed to start visual workspace:', err.message);
  process.exit(1);
}
