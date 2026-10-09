import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AccountService } from './account-service.js';
const options = { database: process.env.SDD_ACCOUNT_DATABASE, publicOrigin: process.env.SDD_PUBLIC_ORIGIN, port: Number(process.env.PORT || 3457), host: process.env.SDD_ACCOUNT_HOST || '127.0.0.1', staticDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist') };
options.bootstrapProjects = [];
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) { if (args[i] === '--project' && args[i+1]) options.bootstrapProjects.push(path.resolve(args[++i])); else throw new Error('Usage: accounts -- --project /absolute/project (repeatable)'); }
const service = new AccountService(options);
const info = await service.start(); console.log(`SDD account service: ${info.url}`);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { await service.stop(); process.exit(0); });
