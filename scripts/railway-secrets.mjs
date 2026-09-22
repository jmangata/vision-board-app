import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import { railwayEnvironment, railwayExecutable } from './railway-cli.mjs';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

const allowedKeys = [
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'UNSPLASH_ACCESS_KEY',
  'GROQ_API_KEY',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'MAIL_FROM',
];

function railway(args, options = {}) {
  return spawnSync(railwayExecutable(), args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: railwayEnvironment(),
    ...options,
  });
}

function parseEnv(content) {
  const values = new Map();

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      value.length >= 2
      && ((value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }

    if (allowedKeys.includes(key)) values.set(key, value);
  }

  return values;
}

export async function uploadRailwaySecrets({
  envFile = resolve(repoRoot, 'backend', '.env'),
  service = 'api',
  dryRun = false,
  yes = false,
} = {}) {
  let content;
  try {
    content = readFileSync(envFile, 'utf8');
  } catch {
    throw new Error(`Fichier introuvable : ${envFile}\nCopie backend/.env.example vers backend/.env et renseigne tes valeurs.`);
  }

  const values = parseEnv(content);
  const missing = allowedKeys.filter((key) => !values.get(key)?.trim());

  console.log(`\nService cible : ${service}`);
  console.log(`Fichier source : ${envFile}\n`);

  if (values.size === 0) throw new Error(`Aucun secret exploitable trouve dans ${envFile}.`);

  console.log('Secrets qui seront envoyes (valeurs masquees) :');
  for (const [key, value] of [...values].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`  ${key.padEnd(24)} (${value.length} caracteres)`);
  }

  if (missing.length > 0) {
    console.warn('\nAbsents ou vides (ils resteront non definis sur Railway) :');
    for (const key of missing) console.warn(`  ${key}`);
  }

  if (dryRun) {
    console.log('\nMode --dry-run : rien n\'a ete envoye.');
    return;
  }

  if (!yes) {
    const prompt = createInterface({ input: stdin, output: stdout });
    const answer = await prompt.question(`\nEnvoyer ces ${values.size} secrets vers le service '${service}' ? (o/N) `);
    prompt.close();
    if (answer.toLowerCase() !== 'o') {
      console.log('Annule.');
      return;
    }
  }

  const failed = [];

  for (const [key, value] of [...values].sort(([a], [b]) => a.localeCompare(b))) {
    process.stdout.write(`  -> ${key}`);

    const result = railway(
      ['variable', 'set', key, '--stdin', '--service', service, '--skip-deploys'],
      { input: value },
    );

    if (result.status === 0) {
      console.log('  OK');
    } else {
      console.log('  ECHEC');
      failed.push(key);
    }
  }

  if (failed.length > 0) {
    throw new Error(`Echec pour : ${failed.join(', ')}. Verifie le projet lie et le service '${service}'.`);
  }

  console.log('\nTous les secrets ont ete definis.');
}

function readOption(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  uploadRailwaySecrets({
    envFile: resolve(readOption('--env-file', resolve(repoRoot, 'backend', '.env'))),
    service: readOption('--service', 'api'),
    dryRun: process.argv.includes('--dry-run'),
    yes: process.argv.includes('--yes'),
  }).catch((error) => {
    console.error(`\nErreur : ${error.message}`);
    process.exitCode = 1;
  });
}
