import { spawnSync } from 'node:child_process';
import { railwayEnvironment, railwayExecutable } from './railway-cli.mjs';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage : node scripts/railway-command.mjs <commande> [arguments]');
  process.exit(1);
}

const result = spawnSync(railwayExecutable(), args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: railwayEnvironment(),
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
