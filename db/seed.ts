// db/seed.ts
import { db, Trabajo, DesgloseTrabajo } from 'astro:db';

export default async function seed() {
  // 1. LIMPIEZA PREVIA: Borramos los datos antiguos para evitar duplicados de claves al reiniciar
  // IMPORTANTE: Primero borramos el desglose debido a las claves foráneas (Foreign Keys)
  await db.delete(DesgloseTrabajo);
  await db.delete(Trabajo);

  // 2. INSERCIÓN DE DATOS DE PRUEBA (Opcional, con la nueva columna 'diseñador' integrada)
  await db.insert(Trabajo).values([
    {
      numParte: 1819,
      workspaceId: 'produccion',
      cliente: 'Hermandad del Sur',
      descripcionGeneral: 'SUDADERAS CON CAPUCHA ESCUDO ORO',
      comercial: 'Marcos',
      diseñador: 'Alex',
      fechaSalida: '2026-06-30',
      estado: 'En proceso',
      area: 'Digital',
      subcontrata: null
    },
    {
      numParte: 1818,
      workspaceId: 'produccion',
      cliente: 'Colegio Sierra Elvira',
      descripcionGeneral: 'ORLAS FIN DE CURSO 2026 BRILLO',
      comercial: 'Alfonso',
      diseñador: 'Yolanda',
      fechaSalida: '2026-07-03',
      estado: 'Pendiente',
      area: 'Digital',
      subcontrata: null
    },
    {
      numParte: 1817,
      workspaceId: 'produccion',
      cliente: 'Automóviles Granada',
      descripcionGeneral: 'LUNETAS TÉRMICAS ADHESIVAS CORTE',
      comercial: 'Jesus',
      diseñador: 'Iván',
      fechaSalida: '2026-06-28',
      estado: 'En proceso',
      area: 'Mimaki',
      subcontrata: null
    }
  ]);

  console.log('¡Base de datos local e índice de búsqueda inicializados con éxito! 🎉');
}