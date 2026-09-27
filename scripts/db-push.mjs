import { cli } from '@astrojs/db';
import { loadEnv } from 'vite';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Cargar variables de entorno con prefijo ASTRO_
const env = {
  ...loadEnv('', process.cwd(), 'ASTRO_'),
  ...process.env
};

const args = process.argv.slice(2);

// URL de la base de datos remota
const defaultUrl = 'libsql://tolklo-organizer-alextld2.aws-eu-west-1.turso.io';
const urlArgIdx = args.findIndex(a => a === '--url');
const remoteUrl = (urlArgIdx !== -1 && args[urlArgIdx + 1]) 
  ? args[urlArgIdx + 1] 
  : (env.ASTRO_DB_REMOTE_URL || defaultUrl);

process.env.ASTRO_DB_REMOTE_URL = remoteUrl;

// Token de autenticación de Turso
const tokenArgIdx = args.findIndex(a => a === '--token' || a === '--db-app-token');
let appToken = (tokenArgIdx !== -1 && args[tokenArgIdx + 1])
  ? args[tokenArgIdx + 1]
  : env.ASTRO_DB_APP_TOKEN;

console.log('----------------------------------------------------');
console.log('🚀 Sincronizador de Esquema Astro DB -> Turso Cloud');
console.log('----------------------------------------------------');
console.log(`📡 URL Remota: ${remoteUrl}\n`);

if (!appToken || appToken.includes('...') || appToken.length < 20) {
  console.error('❌ ERROR: Falta un token válido para autenticar con Turso.\n');
  console.error('El token configurado está ausente, expirado o incompleto.');
  console.error('👉 Solución: Obtén un nuevo token en Turso (o con "turso db tokens create tolklo-organizer") y:');
  console.error('   1. Añádelo a tu archivo .env:');
  console.error('      ASTRO_DB_APP_TOKEN=tu_token_aqui');
  console.error('   O bien pásalo directamente por consola:');
  console.error('      npm run db:push -- --token tu_token_aqui\n');
  process.exit(1);
}

process.env.ASTRO_DB_APP_TOKEN = appToken;

// Flags de ejecución
const isForce = args.includes('--force') || args.includes('--forceReset') || args.includes('--force-reset');
const isDryRun = args.includes('--dry-run') || args.includes('--dryRun');

const flags = {
  _: ['', '', 'push'],
  remote: true,
  forceReset: isForce,
  dryRun: isDryRun,
  dbAppToken: appToken
};

const root = pathToFileURL(path.resolve(process.cwd()) + '/');

try {
  await cli({
    flags,
    config: {
      root,
      integrations: []
    }
  });
  console.log('\n✅ ¡Sincronización con Turso completada exitosamente!');
} catch (error) {
  console.error('\n❌ Ocurrió un error al ejecutar el push a Turso:');
  if (error?.message) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
}
