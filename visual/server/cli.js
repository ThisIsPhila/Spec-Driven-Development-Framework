#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalProjectService } from './service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(__dirname, '../dist');

const args = process.argv.slice(2);
let projectPath = process.cwd();
let port = 3456;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--project' && args[i + 1]) {
    projectPath = args[i + 1];
    i++;
  } else if (args[i] === '--port' && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    i++;
  }
}

const service = new LocalProjectService({ port, staticDir });

try {
  const project = service.registerProject(projectPath);
  const info = await service.start();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[SDD] Visual Workspace Server Running');
  console.log(`[SDD] Project: ${project.id} (${project.root})`);
  console.log(`[SDD] URL:     ${info.url}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Press Ctrl+C to stop.');
} catch (err) {
  console.error('[SDD Error] Failed to start visual workspace:', err.message);
  process.exit(1);
}
