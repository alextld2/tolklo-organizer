// db/seed.ts
import { 
  db, 
  Trabajo, 
  DesgloseTrabajo,
  Presupuesto,
  LineaPresupuesto,
  Albaran,
  LineaAlbaran,
  Factura,
  LineaFactura,
  ConfiguracionFiscal 
} from 'astro:db';
import { calcularHuellaVerifactu, generarQrPayloadVerifactu } from '../src/lib/verifactu-server';

export default async function seed() {
  // 1. LIMPIEZA TOTAL EN LA NUBE
  await db.delete(LineaFactura);
  await db.delete(Factura);
  await db.delete(LineaAlbaran);
  await db.delete(Albaran);
  await db.delete(LineaPresupuesto);
  await db.delete(Presupuesto);
  await db.delete(ConfiguracionFiscal);
  await db.delete(DesgloseTrabajo);
  await db.delete(Trabajo);

  // 2. INSERCIÓN DE HISTÓRICO MULTIANUAL (Prefijos de año en formato Texto)
  await db.insert(Trabajo).values([
    // ==========================================
    // 📅 AÑO 2024 (HISTÓRICO COMPLETO - TODO TERMINADO)
    // ==========================================
    {
      numParte: '24-1205',
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
      numParte: '24-1206',
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
      numParte: '24-1207',
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
      numParte: '25-1540',
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
      numParte: '25-1541',
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
      numParte: '25-1542',
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
      numParte: '25-1543',
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
      numParte: '25-1544',
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
      numParte: '26-1825',
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
      numParte: '26-1824',
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
      numParte: '26-1823',
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
      numParte: '26-1822',
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
      numParte: '26-1821',
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
      numParte: '26-1820',
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
      numParte: '26-1819',
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
      numParte: '26-1818',
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

  // 3. INSERCIÓN DE LÍNEAS DE PRODUCTOS ASOCIADAS (Sincronizado con claves de Texto)
  await db.insert(DesgloseTrabajo).values([
    // Desgloses 2024
    { numParte: '24-1205', descripcionProducto: 'Carteles Mupi Papel Posteri', cantidad: 50 },
    { numParte: '24-1206', descripcionProducto: 'Dípticos Menú Kraft Reciclado', cantidad: 100 },
    { numParte: '24-1207', descripcionProducto: 'Flyers A6 Brillo 115g', cantidad: 10000 },
    
    // Desgloses 2025
    { numParte: '25-1540', descripcionProducto: 'Lonas Microperforadas Andamio', cantidad: 2 },
    { numParte: '25-1541', descripcionProducto: 'Papeletas cartulina con matriz numerada', cantidad: 600 },
    { numParte: '25-1542', descripcionProducto: 'Orlas Mate 30x40cm', cantidad: 110 },
    { numParte: '25-1543', descripcionProducto: 'Pegatinas Troqueladas Bobina', cantidad: 2000 },
    { numParte: '25-1544', descripcionProducto: 'Tarjetas PVC Magnéticas impresas', cantidad: 500 },

    // Desgloses 2026
    { numParte: '26-1825', descripcionProducto: 'Mupis Vinilo Polimérico Mate', cantidad: 15 },
    { numParte: '26-1825', descripcionProducto: 'Lonas Frontlit con Ojales 3x2m', cantidad: 4 },
    { numParte: '26-1824', descripcionProducto: 'Menús A4 Estucado 350g + Laminado Mate', cantidad: 120 },
    { numParte: '26-1823', descripcionProducto: 'Sudaderas JHK Negras Talla L', cantidad: 45 },
    { numParte: '26-1823', descripcionProducto: 'Sudaderas JHK Negras Talla XL', cantidad: 25 },
    { numParte: '26-1822', descripcionProducto: 'Orlas 40x50cm Papel Fotográfico', cantidad: 85 },
    { numParte: '26-1821', descripcionProducto: 'Vinilo Corte Blanco Vehículos', cantidad: 20 },
    { numParte: '26-1820', descripcionProducto: 'Dípticos A5 Brillo 135g', cantidad: 5000 },
    { numParte: '26-1819', descripcionProducto: 'Instalación Vinilo Ácido Arenado', cantidad: 2 },
    { numParte: '26-1818', descripcionProducto: 'Metros Impresión DTF Textil', cantidad: 12 }
  ]);

  // ==========================================
  // ⚙️ 4. CONFIGURACIÓN FISCAL POR ESPACIO
  // ==========================================
  await db.insert(ConfiguracionFiscal).values([
    {
      id: 1,
      workspaceId: 'produccion',
      razonSocial: 'Gráficas Tolklo S.L.',
      nif: 'B18928374',
      direccion: 'C/ Impresores, 14 - Pol. Ind. Juncaril',
      codigoPostal: '18220',
      ciudad: 'Albolote',
      provincia: 'Granada',
      pais: 'España',
      telefono: '+34 958 123 456',
      email: 'administracion@tolklo.es',
      iban: 'ES76 2100 0418 4502 0005 1234',
      serieFacturaDefecto: 'F26',
      seriePresupuestoDefecto: 'PRE26',
      serieAlbaranDefecto: 'ALB26',
      ivaDefecto: 21,
      modoVerifactu: 'SIF_ENCADENAMIENTO'
    },
    {
      id: 2,
      workspaceId: 'escolar',
      razonSocial: 'Gráficas Tolklo S.L. - División Escolar',
      nif: 'B18928374',
      direccion: 'C/ Impresores, 14 - Pol. Ind. Juncaril',
      codigoPostal: '18220',
      ciudad: 'Albolote',
      provincia: 'Granada',
      pais: 'España',
      telefono: '+34 958 123 456',
      email: 'escolar@tolklo.es',
      iban: 'ES76 2100 0418 4502 0005 1234',
      serieFacturaDefecto: 'ESC26',
      seriePresupuestoDefecto: 'PRE-ESC26',
      serieAlbaranDefecto: 'ALB-ESC26',
      ivaDefecto: 21,
      modoVerifactu: 'SIF_ENCADENAMIENTO'
    }
  ]);

  // ==========================================
  // 📋 5. PRESUPUESTOS (SAMPLE ESTIMATES)
  // ==========================================
  await db.insert(Presupuesto).values([
    {
      id: 1,
      workspaceId: 'produccion',
      serie: 'PRE26',
      numero: 1,
      codigo: 'PRE26-0001',
      cliente: 'Ayuntamiento de Granada',
      clienteNif: 'P1808700J',
      clienteEmail: 'cultura@granada.org',
      clienteTelefono: '958 248 100',
      clienteDireccion: 'Plaza del Carmen 1, 18009 Granada',
      fechaEmision: '2026-08-10',
      fechaValidez: '2026-09-10',
      estado: 'Aprobado',
      descripcionGeneral: 'Campaña gráfica fiestas de barrio y banderolas',
      notas: 'Entrega en Almacén Central de Cultura',
      condiciones: 'Validez de la oferta 30 días naturales',
      baseImponible: 1450.00,
      tipoIva: 21,
      cuotaIva: 304.50,
      total: 1754.50,
      numParteTrabajoVinculado: '26-1825'
    },
    {
      id: 2,
      workspaceId: 'produccion',
      serie: 'PRE26',
      numero: 2,
      codigo: 'PRE26-0002',
      cliente: 'Restaurante Los Manueles',
      clienteNif: 'B18294719',
      clienteEmail: 'pedidos@losmanueles.es',
      clienteTelefono: '958 223 415',
      clienteDireccion: 'C/ Reyes Católicos 61, 18001 Granada',
      fechaEmision: '2026-09-02',
      fechaValidez: '2026-10-02',
      estado: 'Enviado',
      descripcionGeneral: 'Cartas plastificadas antimanchas y posavasos grabados',
      notas: 'Laminado mate soft-touch de alta durabilidad',
      condiciones: 'Pago al contado a la entrega',
      baseImponible: 520.00,
      tipoIva: 21,
      cuotaIva: 109.20,
      total: 629.20,
      numParteTrabajoVinculado: '26-1824'
    },
    {
      id: 3,
      workspaceId: 'produccion',
      serie: 'PRE26',
      numero: 3,
      codigo: 'PRE26-0003',
      cliente: 'Clínica Dental Nevada',
      clienteNif: 'B19542109',
      clienteEmail: 'info@dentalnevada.com',
      clienteTelefono: '958 112 233',
      clienteDireccion: 'C/ Recogidas 35, 18002 Granada',
      fechaEmision: '2026-09-15',
      fechaValidez: '2026-10-15',
      estado: 'Borrador',
      descripcionGeneral: 'Folletos buzoneo y vinilo decorativo escaparate',
      notas: '',
      condiciones: '',
      baseImponible: 890.00,
      tipoIva: 21,
      cuotaIva: 186.90,
      total: 1076.90,
      numParteTrabajoVinculado: null
    }
  ]);

  await db.insert(LineaPresupuesto).values([
    { id: 1, presupuestoId: 1, descripcion: 'Mupis Vinilo Polimérico Mate', cantidad: 15, precioUnitario: 50.00, descuentoPorcentaje: 0, tipoIva: 21, totalLinea: 750.00, orden: 1 },
    { id: 2, presupuestoId: 1, descripcion: 'Lonas Frontlit con Ojales 3x2m', cantidad: 4, precioUnitario: 175.00, descuentoPorcentaje: 0, tipoIva: 21, totalLinea: 700.00, orden: 2 },
    { id: 3, presupuestoId: 2, descripcion: 'Menús A4 Estucado 350g + Laminado Mate', cantidad: 120, precioUnitario: 3.50, descuentoPorcentaje: 0, tipoIva: 21, totalLinea: 420.00, orden: 1 },
    { id: 4, presupuestoId: 2, descripcion: 'Posavasos Cartón 1.5mm Impresos 2 Caras', cantidad: 500, precioUnitario: 0.20, descuentoPorcentaje: 0, tipoIva: 21, totalLinea: 100.00, orden: 2 },
    { id: 5, presupuestoId: 3, descripcion: 'Dípticos A5 Brillo 135g Plegados', cantidad: 5000, precioUnitario: 0.118, descuentoPorcentaje: 0, tipoIva: 21, totalLinea: 590.00, orden: 1 },
    { id: 6, presupuestoId: 3, descripcion: 'Vinilo Glaseado Escaparate Instalado', cantidad: 1, precioUnitario: 300.00, descuentoPorcentaje: 0, tipoIva: 21, totalLinea: 300.00, orden: 2 }
  ]);

  // ==========================================
  // 🚚 6. ALBARANES (SAMPLE DELIVERY NOTES)
  // ==========================================
  await db.insert(Albaran).values([
    {
      id: 1,
      workspaceId: 'produccion',
      serie: 'ALB26',
      numero: 1,
      codigo: 'ALB26-0001',
      cliente: 'Ayuntamiento de Granada',
      clienteNif: 'P1808700J',
      clienteDireccion: 'Plaza del Carmen 1, 18009 Granada',
      fecha: '2026-08-25',
      estado: 'Entregado',
      transportista: 'Transportes Locales Granada',
      numeroSeguimiento: 'TLG-26-8941',
      bultos: 3,
      personaContacto: 'Carlos Gómez (Recepción)',
      notas: 'Entregado en muelle de carga cultura',
      presupuestoIdVinculado: 1,
      numParteTrabajoVinculado: '26-1825',
      facturaIdVinculada: 1,
      baseImponible: 1450.00,
      total: 1754.50
    },
    {
      id: 2,
      workspaceId: 'produccion',
      serie: 'ALB26',
      numero: 2,
      codigo: 'ALB26-0002',
      cliente: 'Restaurante Los Manueles',
      clienteNif: 'B18294719',
      clienteDireccion: 'C/ Reyes Católicos 61, 18001 Granada',
      fecha: '2026-09-12',
      estado: 'En reparto',
      transportista: 'Furgoneta Taller',
      numeroSeguimiento: 'FURG-1',
      bultos: 1,
      personaContacto: 'Manuel (Encargado)',
      notas: 'Entregar antes de las 13:00 h',
      presupuestoIdVinculado: 2,
      numParteTrabajoVinculado: '26-1824',
      facturaIdVinculada: null,
      baseImponible: 520.00,
      total: 629.20
    }
  ]);

  await db.insert(LineaAlbaran).values([
    { id: 1, albaranId: 1, descripcion: 'Mupis Vinilo Polimérico Mate', cantidad: 15, precioUnitario: 50.00, totalLinea: 750.00, orden: 1 },
    { id: 2, albaranId: 1, descripcion: 'Lonas Frontlit con Ojales 3x2m', cantidad: 4, precioUnitario: 175.00, totalLinea: 700.00, orden: 2 },
    { id: 3, albaranId: 2, descripcion: 'Menús A4 Estucado 350g + Laminado Mate', cantidad: 120, precioUnitario: 3.50, totalLinea: 420.00, orden: 1 },
    { id: 4, albaranId: 2, descripcion: 'Posavasos Cartón 1.5mm', cantidad: 500, precioUnitario: 0.20, totalLinea: 100.00, orden: 2 }
  ]);

  // ==========================================
  // 🧾 7. FACTURAS CON NORMATIVA VERI*FACTU & LEY ANTIFRAUDE (HASH ENCADENADO)
  // ==========================================
  // Factura 1: Primer registro de la serie (sin huella anterior)
  const f1Emisor = 'B18928374';
  const f1Num = 'F26-0001';
  const f1Fecha = '2026-08-28';
  const f1Hora = '10:15:30';
  const f1Tipo = 'F1';
  const f1Cuota = 304.50;
  const f1Total = 1754.50;
  const f1Hash = calcularHuellaVerifactu({
    emisorNif: f1Emisor,
    numeroFacturaCompleto: f1Num,
    fechaExpedicion: f1Fecha,
    horaExpedicion: f1Hora,
    tipoFactura: f1Tipo,
    cuotaIva: f1Cuota,
    totalFactura: f1Total,
    huellaHashAnterior: ''
  });
  const f1Qr = generarQrPayloadVerifactu({
    emisorNif: f1Emisor,
    numeroFacturaCompleto: f1Num,
    fechaExpedicion: f1Fecha,
    totalFactura: f1Total,
    huellaHash: f1Hash
  });

  // Factura 2: Segundo registro (encadenado con la huella de la Factura 1)
  const f2Num = 'F26-0002';
  const f2Fecha = '2026-09-14';
  const f2Hora = '16:40:12';
  const f2Tipo = 'F1';
  const f2Cuota = 193.20;
  const f2Total = 1113.20;
  const f2Hash = calcularHuellaVerifactu({
    emisorNif: f1Emisor,
    numeroFacturaCompleto: f2Num,
    fechaExpedicion: f2Fecha,
    horaExpedicion: f2Hora,
    tipoFactura: f2Tipo,
    cuotaIva: f2Cuota,
    totalFactura: f2Total,
    huellaHashAnterior: f1Hash // 🔗 Encadenamiento Veri*factu
  });
  const f2Qr = generarQrPayloadVerifactu({
    emisorNif: f1Emisor,
    numeroFacturaCompleto: f2Num,
    fechaExpedicion: f2Fecha,
    totalFactura: f2Total,
    huellaHash: f2Hash
  });

  await db.insert(Factura).values([
    {
      id: 1,
      workspaceId: 'produccion',
      serie: 'F26',
      numero: 1,
      numeroFacturaCompleto: f1Num,
      tipoFactura: 'F1',
      cliente: 'Ayuntamiento de Granada',
      clienteNif: 'P1808700J',
      clienteDireccion: 'Plaza del Carmen 1',
      clienteCodigoPostal: '18009',
      clienteCiudad: 'Granada',
      clienteProvincia: 'Granada',
      clientePais: 'ES',
      clienteEmail: 'intervencion@granada.org',
      fechaExpedicion: f1Fecha,
      horaExpedicion: f1Hora,
      fechaVencimiento: '2026-09-28',
      formaPago: 'Transferencia bancaria a 30 días',
      cuentaBancaria: 'ES76 2100 0418 4502 0005 1234',
      estado: 'Cobrada',
      baseImponible: 1450.00,
      tipoIva: 21,
      cuotaIva: f1Cuota,
      totalFactura: f1Total,
      notas: 'Correspondiente a Presupuesto PRE26-0001 y Albarán ALB26-0001',
      presupuestoIdVinculado: 1,
      albaranIdVinculado: 1,
      numParteTrabajoVinculado: '26-1825',
      huellaHash: f1Hash,
      huellaHashAnterior: null,
      primerRegistro: true,
      sistemaInformatico: 'Tolklo Organizer v1.0',
      verifactuEstado: 'Sellada_ConHuella',
      qrPayload: f1Qr,
      bloqueada: true
    },
    {
      id: 2,
      workspaceId: 'produccion',
      serie: 'F26',
      numero: 2,
      numeroFacturaCompleto: f2Num,
      tipoFactura: 'F1',
      cliente: 'Colegio Sierra Nevada',
      clienteNif: 'R1800293D',
      clienteDireccion: 'Avda. Cervantes 22',
      clienteCodigoPostal: '18008',
      clienteCiudad: 'Granada',
      clienteProvincia: 'Granada',
      clientePais: 'ES',
      clienteEmail: 'secretaria@sierranevada.edu',
      fechaExpedicion: f2Fecha,
      horaExpedicion: f2Hora,
      fechaVencimiento: '2026-10-14',
      formaPago: 'Recibo domiciliado',
      cuentaBancaria: 'ES76 2100 0418 4502 0005 1234',
      estado: 'Emitida',
      baseImponible: 920.00,
      tipoIva: 21,
      cuotaIva: f2Cuota,
      totalFactura: f2Total,
      notas: 'Orlas escolares fin de curso',
      presupuestoIdVinculado: null,
      albaranIdVinculado: null,
      numParteTrabajoVinculado: '26-1822',
      huellaHash: f2Hash,
      huellaHashAnterior: f1Hash, // 🔗 Huella anterior verificada
      primerRegistro: false,
      sistemaInformatico: 'Tolklo Organizer v1.0',
      verifactuEstado: 'Sellada_ConHuella',
      qrPayload: f2Qr,
      bloqueada: true
    }
  ]);

  await db.insert(LineaFactura).values([
    { id: 1, facturaId: 1, descripcion: 'Mupis Vinilo Polimérico Mate', cantidad: 15, precioUnitario: 50.00, descuentoPorcentaje: 0, tipoIva: 21, totalLinea: 750.00, orden: 1 },
    { id: 2, facturaId: 1, descripcion: 'Lonas Frontlit con Ojales 3x2m', cantidad: 4, precioUnitario: 175.00, descuentoPorcentaje: 0, tipoIva: 21, totalLinea: 700.00, orden: 2 },
    { id: 3, facturaId: 2, descripcion: 'Orlas 40x50cm Papel Fotográfico Impreso y Montado', cantidad: 85, precioUnitario: 10.82, descuentoPorcentaje: 0, tipoIva: 21, totalLinea: 920.00, orden: 1 }
  ]);

  console.log('¡Histórico multianual, presupuestos, albaranes y facturas Veri*factu inyectados con éxito! 🚀');
}