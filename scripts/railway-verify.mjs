import { spawnSync } from 'node:child_process';
import { railwayEnvironment, railwayExecutable } from './railway-cli.mjs';

function railway(args) {
  const result = spawnSync(railwayExecutable(), args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: railwayEnvironment(),
  });
  if (result.status !== 0) throw new Error(result.stderr.trim() || `railway ${args.join(' ')} a echoue`);
  return result.stdout;
}

function domain(service) {
  const output = railway(['domain', 'list', '--service', service, '--json']);
  const value = output.match(/[a-z0-9-]+\.up\.railway\.app/i)?.[0];
  if (!value) throw new Error(`Aucun domaine Railway trouve pour le service '${service}'.`);
  return value;
}

async function check(label, url, validate, options = {}) {
  process.stdout.write(`${label.padEnd(26)} `);
  try {
    const response = await fetch(url, { redirect: 'manual', ...options });
    const body = await response.text();
    const error = await validate(response, body);
    if (error) throw new Error(error);
    console.log(`OK (${response.status})`);
    return true;
  } catch (error) {
    console.log(`ECHEC - ${error.message}`);
    return false;
  }
}

async function main() {
  const apiDomain = domain('api');
  const webDomain = domain('web');
  const apiUrl = `https://${apiDomain}`;
  const webUrl = `https://${webDomain}`;

  console.log('\n=== Verification du deploiement Railway ===');
  console.log(`API      : ${apiUrl}`);
  console.log(`Frontend : ${webUrl}\n`);

  const checks = [];

  checks.push(await check('Healthcheck API', `${apiUrl}/api/health`, async (response, body) => {
    if (response.status !== 200) return `HTTP ${response.status}`;
    try {
      const data = JSON.parse(body);
      if (data.status !== 'ok') return `reponse inattendue : ${body.slice(0, 100)}`;
    } catch {
      return 'la reponse API n\'est pas du JSON';
    }
    return null;
  }));

  checks.push(await check('Page racine frontend', webUrl, async (response, body) => {
    if (response.status !== 200) return `HTTP ${response.status}`;
    if (!body.includes('<div id="root">')) return 'index.html React non detecte';
    return null;
  }));

  checks.push(await check('Fallback SPA', `${webUrl}/forgot-password`, async (response, body) => {
    if (response.status !== 200) return `HTTP ${response.status} (fallback SPA absent)`;
    if (!body.includes('<div id="root">')) return 'index.html non servi sur une route imbriquee';
    return null;
  }));

  checks.push(await check('CORS frontend -> API', `${apiUrl}/api/health`, async (response) => {
    const allowedOrigin = response.headers.get('access-control-allow-origin');
    if (allowedOrigin !== webUrl) {
      return `Access-Control-Allow-Origin='${allowedOrigin}', attendu '${webUrl}'`;
    }
    return null;
  }, { headers: { Origin: webUrl } }));

  const passed = checks.filter(Boolean).length;
  console.log(`\nResultat : ${passed}/${checks.length} controles reussis.`);
  if (passed !== checks.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`\nErreur : ${error.message}`);
  process.exitCode = 1;
});
