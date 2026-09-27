import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@libsql/client';
import { loadEnv } from 'vite';

const env = {
  ...loadEnv('', process.cwd(), 'ASTRO_'),
  ...process.env
};

const remoteUrl = env.ASTRO_DB_REMOTE_URL || 'libsql://tolklo-organizer-alextld2.aws-eu-west-1.turso.io';
const appToken = env.ASTRO_DB_APP_TOKEN;

if (!appToken) {
  console.error('❌ Falta ASTRO_DB_APP_TOKEN en .env');
  process.exit(1);
}

const localDb = new DatabaseSync('local.db');
const remoteDb = createClient({
  url: remoteUrl,
  authToken: appToken
});

console.log('========================================================');
console.log('📦 Volcado de Base de Datos: local.db -> Turso Cloud');
console.log('========================================================');
console.log(`📡 Destino: ${remoteUrl}\n`);

// Tablas en orden respetando dependencias de claves foráneas
const tables = [
  'ConfiguracionFiscal',
  'DireccionCliente',
  'RegistroActividad',
  'Trabajo',
  'DesgloseTrabajo',
  'Presupuesto',
  'LineaPresupuesto',
  'Albaran',
  'LineaAlbaran',
  'Factura',
  'LineaFactura'
];

async function migrate() {
  for (const table of tables) {
    try {
      const rows = localDb.prepare(`SELECT * FROM "${table}"`).all();
      const countBefore = (await remoteDb.execute(`SELECT count(*) as c FROM "${table}"`)).rows[0].c;
      console.log(`📋 Tabla [${table}]:`);
      console.log(`   - Filas en local.db: ${rows.length}`);
      console.log(`   - Filas actuales en Turso: ${countBefore}`);

      if (rows.length === 0) {
        console.log(`   ℹ️ Sin filas locales que volcar.\n`);
        continue;
      }

      let insertedCount = 0;
      for (const row of rows) {
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        const colNames = columns.map(c => `"${c}"`).join(', ');
        const values = Object.values(row);

        const sql = `INSERT OR REPLACE INTO "${table}" (${colNames}) VALUES (${placeholders})`;
        await remoteDb.execute({
          sql,
          args: values
        });
        insertedCount++;
      }

      const countAfter = (await remoteDb.execute(`SELECT count(*) as c FROM "${table}"`)).rows[0].c;
      console.log(`   ✅ Volcadas/Actualizadas: ${insertedCount} filas. Total actual en Turso: ${countAfter}\n`);
    } catch (err) {
      console.error(`   ❌ Error volcando tabla [${table}]:`, err.message);
    }
  }

  console.log('========================================================');
  console.log('🎉 ¡Volcado a Turso Cloud completado con éxito!');
  console.log('========================================================');
}

migrate().catch(console.error);
