import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { localBinary, repoRoot } from './railway-cli.mjs';

const version = '5.57.0';

const releases = {
  'win32-x64': {
    archive: `railway-v${version}-x86_64-pc-windows-msvc.zip`,
    sha256: '798235a0f568261c2e0292a56b234168590956f4dc35dcd2eb74d3dce7274f26',
  },
};

function run(binary, args, options = {}) {
  return spawnSync(binary, args, { encoding: 'utf8', ...options });
}

async function main() {
  const target = releases[`${process.platform}-${process.arch}`];
  if (!target) {
    throw new Error(
      `Plateforme ${process.platform}-${process.arch} non geree par l'installateur local. `
      + 'Installe la CLI selon https://docs.railway.com/cli#installing-the-cli.',
    );
  }

  if (existsSync(localBinary)) {
    const current = run(localBinary, ['--version']);
    if (current.status === 0 && current.stdout.includes(version)) {
      console.log(`Railway CLI ${version} est deja installee : ${localBinary}`);
      return;
    }
  }

  const url = `https://github.com/railwayapp/cli/releases/download/v${version}/${target.archive}`;
  const toolsDirectory = dirname(localBinary);
  const archivePath = resolve(repoRoot, '.tools', target.archive);

  mkdirSync(toolsDirectory, { recursive: true });

  console.log(`Telechargement de Railway CLI ${version}...`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Telechargement impossible : HTTP ${response.status}`);

  const buffer = Buffer.from(await response.arrayBuffer());
  const digest = createHash('sha256').update(buffer).digest('hex');
  if (digest !== target.sha256) {
    throw new Error(`SHA-256 invalide. Attendu ${target.sha256}, obtenu ${digest}. Archive refusee.`);
  }

  console.log('SHA-256 verifie.');
  writeFileSync(archivePath, buffer);

  const extraction = run('tar', ['-xf', archivePath, '-C', toolsDirectory], { stdio: 'inherit' });
  rmSync(archivePath, { force: true });
  if (extraction.status !== 0) throw new Error('Echec de l\'extraction du binaire Railway.');

  if (!existsSync(localBinary)) {
    throw new Error(`Archive extraite mais binaire introuvable : ${localBinary}`);
  }

  const installed = run(localBinary, ['--version']);
  if (installed.status !== 0 || !installed.stdout.includes(version)) {
    throw new Error('Le binaire extrait ne renvoie pas la version attendue.');
  }

  console.log(`Railway CLI installee et verifiee : ${installed.stdout.trim()}`);
}

main().catch((error) => {
  console.error(`\nErreur : ${error.message}`);
  process.exitCode = 1;
});
