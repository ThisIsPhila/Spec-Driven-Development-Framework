#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { LocalDaemon } from './index.js';
import { CloudSyncClient } from './cloudSync.js';

const args = process.argv.slice(2);
const projectPaths = [];
const invocationRoot = process.env.INIT_CWD || process.cwd();
let port = Number(process.env.SDD_PORT || 3456);
let shouldOpen = !process.env.CI;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' && args[i + 1]) {
    projectPaths.push(args[++i]);
  } else if (args[i] === '--port' && args[i + 1]) {
    port = Number(args[++i]);
  } else if (args[i] === '--no-open') {
    shouldOpen = false;
  } else if (args[i] === '--open') {
    shouldOpen = true;
  } else {
    console.error(`[SDD] Unknown or incomplete option: ${args[i]}`);
    process.exit(1);
  }
}

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error('[SDD] Port must be an integer from 0 to 65535');
  process.exit(1);
}

function openInBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const cmdArgs = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try {
    const child = spawn(cmd, cmdArgs, { detached: true, stdio: 'ignore' });
    child.unref();
  } catch {
    // non-fatal if headless
  }
}

const daemon = new LocalDaemon({ port });
try {
  if (!projectPaths.length) projectPaths.push(invocationRoot);
  const projects = projectPaths.map((p) => daemon.registerProject(p));
  const info = await daemon.start();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[SDD] Standalone Visual Platform Running (Local-First)');
  for (const project of projects) {
    console.log(`[SDD] Project: ${project.id} (${project.root})`);
  }
  console.log(`[SDD] Open:    ${info.url}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Press Ctrl+C to stop.');

  if (shouldOpen) openInBrowser(info.url);

  if (process.env.SDD_CLOUD_URL && process.env.SDD_CLOUD_TOKEN) {
    const syncClient = new CloudSyncClient({
      baseUrl: process.env.SDD_CLOUD_URL,
      accessToken: process.env.SDD_CLOUD_TOKEN,
    });
    const syncOnce = async () => {
      for (const p of daemon.projects.values()) {
        try {
          await syncClient.pushProject(p);
        } catch (err) {
          console.error('[SDD cloud-sync]', err.message);
        }
      }
    };
    await syncOnce();
    const timer = setInterval(syncOnce, 5000);
    timer.unref();
  }

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, async () => {
      await daemon.stop();
      process.exit(0);
    });
  }
} catch (err) {
  console.error('[SDD Error] Failed to start local daemon:', err.message);
  process.exit(1);
}
