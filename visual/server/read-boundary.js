import nativeFs from 'node:fs';
import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
export const extractionScope = new AsyncLocalStorage();
function validate(file, reading = false) {
  const scope = extractionScope.getStore();
  if (!scope) return;
  const canonical = nativeFs.realpathSync(file);
  const relative = path.relative(scope.root, canonical);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error('Source escapes registered project');
  if (reading) {
    const stat = nativeFs.statSync(canonical);
    if (!stat.isFile() || stat.size > (path.basename(canonical) === 'graph.json' ? 16 : 4) * 1024 * 1024) throw new Error('Source is not a supported bounded file');
    scope.bytes += stat.size;
    if (++scope.files > 3000 || scope.bytes > 64 * 1024 * 1024) throw new Error('Project extraction limit exceeded');
  }
}
export const fs = new Proxy(nativeFs, {
  get(target, key) {
    if (key === 'readFileSync' || key === 'readdirSync') return (file, ...args) => { validate(file, key === 'readFileSync'); return target[key](file, ...args); };
    return target[key];
  },
});
