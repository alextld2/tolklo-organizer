// db/seed.ts
import { db, Trabajo, DesgloseTrabajo } from 'astro:db';

export default async function seed() {
  // 1. LIMPIEZA TOTAL EN LA NUBE
  await db.delete(DesgloseTrabajo);
  await db.delete(Trabajo);

  // 2. INSERCIÓN DE HISTÓRICO MULTIANUAL (2024, 2025 y 2026)
  await db.insert(Trabajo).values([
    // ==========================================
    // 📅 AÑO 2024 (HISTÓRICO COMPLETO - TODO TERMINADO)
    // ==========================================
    {
      numParte: 1205,
      workspaceId: 'produccion',
      cliente: 'Ayuntamiento de Granada',
      descripcionGeneral: 'CARTELERÍA FIESTAS DEL CORPUS 2024',
      comercial: 'Marcos',
      diseñador: 'Alex',
      fechaSalida: '2024-05-28',
      estado: 'Terminado',
      area: 'Plotter',
      subcontrata: null
    },
    {
      numParte: 1206,
      workspaceId: 'produccion',
      cliente: 'Restaurante Los Manueles',
      descripcionGeneral: 'RENOVACIÓN DE CARTAS DE OTOÑO 2024',
      comercial: 'Jesus',
      diseñador: 'Iván',
      fechaSalida: '2024-10-02',
      estado: 'Terminado',
      area: 'Digital',
      subcontrata: null
    },
    {
      numParte: 1207,
      workspaceId: 'produccion',
      cliente: 'Clínica Dental Nevada',
      descripcionGeneral: 'FOLLETOS APERTURA SEGUNDA PLANTA',
      comercial: 'Maria Jesús',
      diseñador: 'Yolanda',
      fechaSalida: '2024-11-15',
      estado: 'Terminado',
      area: 'Offset',
      subcontrata: null
    },

    // ==========================================
    // 📅 AÑO 2025 (HISTÓRICO COMPLETO - TODO TERMINADO)
    // ==========================================
    {
      numParte: 1540,
      workspaceId: 'produccion',
      cliente: 'Ayuntamiento de Granada',
      descripcionGeneral: 'LONAS DECORATIVAS CONGRESO TURISMO 2025',
      comercial: 'Marcos',
      diseñador: 'Alex',
      fechaSalida: '2025-03-10',
      estado: 'Terminado',
      area: 'Plotter',
      subcontrata: null
    },
    {
      numParte: 1541,
      workspaceId: 'produccion',
      cliente: 'Hermandad del Sur',
      descripcionGeneral: 'PAPELETAS DE SITIO SEMANA SANTA 2025',
      comercial: 'Marcos',
      diseñador: 'Yolanda',
      fechaSalida: '2025-03-22',
      estado: 'Terminado',
      area: 'Digital',
      subcontrata: null
    },
    {
      numParte: 1542,
      workspaceId: 'produccion',
      cliente: 'Colegio Sierra Elvira',
      descripcionGeneral: 'ORLAS E IMPRESIONES FIN DE CURSO 2025',
      comercial: 'Alfonso',
      diseñador: 'Yolanda',
      fechaSalida: '2025-06-18',
      estado: 'Terminado',
      area: 'Digital',
      subcontrata: null
    },
    {
      numParte: 1543,
      workspaceId: 'produccion',
      cliente: 'Restaurante Los Manueles',
      descripcionGeneral: 'ETIQUETAS ADHESIVAS PARA BOTELLAS DE VINO DE LA CASA',
      comercial: 'Jesus',
      diseñador: 'Iván',
      fechaSalida: '2025-09-05',
      estado: 'Terminado',
      area: 'Mimaki',
      subcontrata: null
    },
    {
      numParte: 1544,
      workspaceId: 'produccion',
      cliente: 'Hoteles Alhambra',
      descripcionGeneral: 'TARJETAS LLAVE HABITACIÓN CORTESÍA',
      comercial: 'Maria Jesús',
      diseñador: 'Iván',
      fechaSalida: '2025-11-12',
      estado: 'Terminado',
      area: 'OPX',
      subcontrata: null
    },

    // ==========================================
    // 📅 AÑO 2026 (AÑO ACTUAL - FLUJO DINÁMICO COMÚN)
    // ==========================================
    {
      numParte: 1825,
      workspaceId: 'produccion',
      cliente: 'Ayuntamiento de Granada',
      descripcionGeneral: 'CARTELERÍA FIESTAS DEL CORPUS 2026',
      comercial: 'Marcos',
      diseñador: 'Alex',
      fechaSalida: '2026-06-05',
      estado: 'Terminado',
      area: 'Plotter',
      subcontrata: null
    },
    {
      numParte: 1824,
      workspaceId: 'produccion',
      cliente: 'Restaurante Los Manueles',
      descripcionGeneral: 'CARTAS MENÚ PREMIUM ENCAPSULADAS',
      comercial: 'Jesus',
      diseñador: 'Iván',
      fechaSalida: '2026-06-12',
      estado: 'Terminado',
      area: 'Digital',
      subcontrata: null
    },
    {
      numParte: 1823,
      workspaceId: 'produccion',
      cliente: 'Hermandad del Sur',
      descripcionGeneral: 'SUDADERAS CON CAPUCHA ESCUDO ORO',
      comercial: 'Marcos',
      diseñador: 'Alex',
      fechaSalida: '2026-06-30',
      estado: 'Imprimiendo',
      area: 'Digital',
      subcontrata: null
    },
    {
      numParte: 1822,
      workspaceId: 'produccion',
      cliente: 'Colegio Sierra Elvira',
      descripcionGeneral: 'ORLAS FIN DE CURSO 2026 BRILLO',
      comercial: 'Alfonso',
      diseñador: 'Yolanda',
      fechaSalida: '2026-07-03',
      estado: 'Por hacer',
      area: 'Digital',
      subcontrata: null
    },
    {
      numParte: 1821,
      workspaceId: 'produccion',
      cliente: 'Automóviles Granada',
      descripcionGeneral: 'LUNETAS TÉRMICAS ADHESIVAS CORTE',
      comercial: 'Jesus',
      diseñador: 'Iván',
      fechaSalida: '2026-06-28',
      estado: 'Urgente',
      area: 'Mimaki',
      subcontrata: null
    },
    {
      numParte: 1820,
      workspaceId: 'produccion',
      cliente: 'Clínica Dental Nevada',
      descripcionGeneral: 'FOLLETOS PUBLICITARIOS DIARIO',
      comercial: 'Maria Jesús',
      diseñador: 'Yolanda',
      fechaSalida: '2026-05-18',
      estado: 'Terminado',
      area: 'Offset',
      subcontrata: null
    },
    {
      numParte: 1819,
      workspaceId: 'produccion',
      cliente: 'Óptica Albaicín',
      descripcionGeneral: 'VINILOS ÁCIDO PARA ESCAPARATE',
      comercial: 'Alfonso',
      diseñador: 'Alex',
      fechaSalida: '2026-05-24',
      estado: 'Manipulado',
      area: 'Plotter',
      subcontrata: null
    },
    {
      numParte: 1818,
      workspaceId: 'produccion',
      cliente: 'Gimnasio Inacua',
      descripcionGeneral: 'CAMISETAS TÉCNICAS SUBLIMACIÓN DTF',
      comercial: 'Marcos',
      diseñador: 'Iván',
      fechaSalida: '2026-07-10',
      estado: 'Por hacer',
      area: 'DTF',
      subcontrata: null
    }
  ]);

  // 3. INSERCIÓN DE LÍNEAS DE PRODUCTOS ASOCIADAS (Desglose 1:N)
  await db.insert(DesgloseTrabajo).values([
    // Desgloses 2024
    { numParte: 1205, descripcionProducto: 'Carteles Mupi Papel Posteri', cantidad: 50 },
    { numParte: 1206, descripcionProducto: 'Dípticos Menú Kraft Reciclado', cantidad: 100 },
    { numParte: 1207, descripcionProducto: 'Flyers A6 Brillo 115g', cantidad: 10000 },
    
    // Desgloses 2025
    { numParte: 1540, descripcionProducto: 'Lonas Microperforadas Andamio', cantidad: 2 },
    { numParte: 1541, descripcionProducto: 'Papeletas cartulina con matriz numerada', cantidad: 600 },
    { numParte: 1542, descripcionProducto: 'Orlas Mate 30x40cm', cantidad: 110 },
    { numParte: 1543, descripcionProducto: 'Pegatinas Troqueladas Bobina', cantidad: 2000 },
    { numParte: 1544, descripcionProducto: 'Tarjetas PVC Magnéticas impresas', cantidad: 500 },

    // Desgloses 2026
    { numParte: 1825, descripcionProducto: 'Mupis Vinilo Polimérico Mate', cantidad: 15 },
    { numParte: 1825, descripcionProducto: 'Lonas Frontlit con Ojales 3x2m', cantidad: 4 },
    { numParte: 1824, descripcionProducto: 'Menús A4 Estucado 350g + Laminado Mate', cantidad: 120 },
    { numParte: 1823, descripcionProducto: 'Sudaderas JHK Negras Talla L', cantidad: 45 },
    { numParte: 1823, descripcionProducto: 'Sudaderas JHK Negras Talla XL', cantidad: 25 },
    { numParte: 1822, descripcionProducto: 'Orlas 40x50cm Papel Fotográfico', cantidad: 85 },
    { numParte: 1821, descripcionProducto: 'Vinilo Corte Blanco Vehículos', cantidad: 20 },
    { numParte: 1820, descripcionProducto: 'Dípticos A5 Brillo 135g', cantidad: 5000 },
    { numParte: 1819, descripcionProducto: 'Instalación Vinilo Ácido Arenado', cantidad: 2 },
    { numParte: 1818, descripcionProducto: 'Metros Impresión DTF Textil', cantidad: 12 }
  ]);

  console.log('¡Histórico multianual inyectado con éxito en Turso Cloud! 🚀');
}