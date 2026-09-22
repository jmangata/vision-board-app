import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { railwayEnvironment, railwayExecutable } from './railway-cli.mjs';
import { uploadRailwaySecrets } from './railway-secrets.mjs';

const projectName = process.env.RAILWAY_PROJECT_NAME || 'vision-board-app';
const environment = process.env.RAILWAY_ENVIRONMENT || 'production';

function railway(args, { capture = false, allowFailure = false } = {}) {
  const result = spawnSync(railwayExecutable(), args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: capture ? 'pipe' : 'inherit',
    env: railwayEnvironment(),
  });

  if (result.error) throw result.error;
  if (!allowFailure && result.status !== 0) {
    throw new Error(`La commande a echoue : railway ${args.join(' ')}`);
  }
  return result;
}

function captured(args, allowFailure = false) {
  return railway(args, { capture: true, allowFailure });
}

function findRailwayDomain(text = '') {
  return text.match(/[a-z0-9-]+\.up\.railway\.app/i)?.[0] || null;
}

function getDomain(service) {
  const result = captured(['domain', 'list', '--service', service, '--json'], true);
  if (result.status !== 0) return null;
  return findRailwayDomain(result.stdout);
}

function latestDeploymentStatus(service) {
  const result = captured(['deployment', 'list', '--service', service, '--json'], true);
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout)?.[0]?.status || null;
  } catch {
    return null;
  }
}

async function waitForDeploymentUnlock(service, timeoutMs = 10 * 60 * 1000) {
  const transient = new Set(['BUILDING', 'DEPLOYING', 'INITIALIZING', 'WAITING', 'QUEUED', 'SLEEPING']);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const status = latestDeploymentStatus(service);
    if (!status || !transient.has(status)) {
      console.log(`  ${service} : ${status || 'aucun deploiement actif'}`);
      return;
    }
    process.stdout.write(`  ${service} : ${status}, attente...\r`);
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }

  throw new Error(`Le deploiement initial de '${service}' est encore verrouille apres 10 minutes.`);
}

function ensureDomain(service) {
  const existing = getDomain(service);
  if (existing) {
    console.log(`  Domaine ${service} deja present : https://${existing}`);
    return existing;
  }

  console.log(`  Generation du domaine public pour ${service}...`);
  const created = captured(['domain', '--service', service, '--json']);
  const fromResponse = findRailwayDomain(created.stdout);
  if (fromResponse) {
    console.log(`  Domaine ${service} cree : https://${fromResponse}`);
    return fromResponse;
  }

  const fromList = getDomain(service);
  if (!fromList) throw new Error(`Domaine cree mais impossible a relire pour '${service}'.`);
  console.log(`  Domaine ${service} cree : https://${fromList}`);
  return fromList;
}

async function main() {
  console.log('\n=== Vision Board - bootstrap Railway ===\n');

  const whoami = captured(['whoami'], true);
  if (whoami.status !== 0) {
    console.error('Authentification Railway requise. Execute :');
    console.error('  npm run railway:login');
    console.error('Puis relance :');
    console.error('  npm run railway:bootstrap');
    process.exitCode = 1;
    return;
  }
  console.log(`Authentifie Railway : ${whoami.stdout.trim()}`);

  const status = captured(['status', '--json'], true);
  if (status.status !== 0) {
    console.log(`Aucun projet lie. Creation de '${projectName}'...`);
    railway(['init', '--name', projectName]);
  } else {
    console.log('Projet Railway deja lie.');
  }

  const environmentLink = captured(['environment', 'link', environment], true);
  if (environmentLink.status !== 0) {
    console.warn(`Environnement '${environment}' non trouve ; l'environnement actif sera utilise.`);
  }

  console.log('\nApplication de .railway/railway.ts...');
  console.log('Le plan doit creer ou conserver : postgres, api et web.');
  railway(['config', 'apply', '--yes']);

  console.log('\nConfiguration des domaines publics...');
  const apiDomain = ensureDomain('api');
  const webDomain = ensureDomain('web');

  writeFileSync(
    new URL('../mobile/.env', import.meta.url),
    `EXPO_PUBLIC_API_URL=https://${apiDomain}/api\nEXPO_PUBLIC_WEB_URL=https://${webDomain}\n`,
  );
  console.log('  mobile/.env mis a jour avec les domaines Railway.');

  console.log('\nChargement securise des secrets applicatifs...');
  await uploadRailwaySecrets({ service: 'api', yes: true });

  console.log('\nAttente de la liberation des deploiements initiaux...');
  await Promise.all([
    waitForDeploymentUnlock('api'),
    waitForDeploymentUnlock('web'),
  ]);

  console.log('\nRedeploiement final...');
  railway(['redeploy', '--service', 'api', '--yes']);
  railway(['redeploy', '--service', 'web', '--yes']);

  console.log('\n=== Deploiement lance avec succes ===\n');
  console.log(`API      : https://${apiDomain}/api/health`);
  console.log(`Frontend : https://${webDomain}`);
  console.log('\nAttends les statuts SUCCESS dans Railway, puis execute :');
  console.log('  npm run railway:verify');
}

main().catch((error) => {
  console.error(`\nErreur : ${error.message}`);
  process.exitCode = 1;
});
