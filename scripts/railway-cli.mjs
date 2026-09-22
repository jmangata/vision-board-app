import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const localBinary = resolve(
  repoRoot,
  '.tools',
  'railway',
  process.platform === 'win32' ? 'railway.exe' : 'railway',
);

export function railwayExecutable() {
  return existsSync(localBinary) ? localBinary : 'railway';
}

export function railwayEnvironment() {
  const executable = railwayExecutable();
  return { ...process.env, _: executable };
}

export { localBinary, repoRoot };
