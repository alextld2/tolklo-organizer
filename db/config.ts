// db/config.ts
import { defineDb, defineTable, column, NOW } from 'astro:db';

export const Trabajo = defineTable({
  columns: {
    numParte: column.text({ primaryKey: true }),
    workspaceId: column.text(),
    cliente: column.text(),
    descripcionGeneral: column.text({ optional: true }),
    comercial: column.text({ optional: true }),
    diseñador: column.text({ optional: true }),
    fechaSalida: column.text(),
    estado: column.text(),
    area: column.text(),
    subcontrata: column.text({ optional: true }),

    // 🔥 NUEVOS CAMPOS PARA LA FICHA TÉCNICA REUTILIZABLE
    papelPortada: column.text({ optional: true }),
    colorPortada: column.text({ optional: true }),
    papelInterior: column.text({ optional: true }),
    colorInterior: column.text({ optional: true }),
    espiralColor: column.text({ optional: true }),
    wireOColor: column.text({ optional: true }),
    grapadoTipo: column.text({ optional: true }),
    barnizUVTipo: column.text({ optional: true }),
    estampingTipo: column.text({ optional: true }),
    laminadoTipo: column.text({ optional: true }),

    // Guardamos los estados de los checkboxes serializados en JSON string
    encuadernacionJson: column.text({ optional: true }),
    acabadosJson: column.text({ optional: true }),
    laminadoCara1Json: column.text({ optional: true }),
    laminadoCara2Json: column.text({ optional: true }),

    // Gestión de prioridades y orden en cola de producción
    prioridad: column.text({ optional: true, default: 'Normal' }),
    ordenCola: column.number({ optional: true, default: 0 })
  }
});

export const DesgloseTrabajo = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    numParte: column.text({ references: () => Trabajo.columns.numParte }),
    descripcionProducto: column.text(),
    cantidad: column.number(),
  }
});

export const RegistroActividad = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    fecha: column.date({ default: NOW }),
    usuario: column.text(),
    workspaceId: column.text(),
    tipo: column.text(),
    accion: column.text(),
    detalles: column.text(),
  }
});

export const DireccionCliente = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    cliente: column.text(),
    calle: column.text(),
    ciudad: column.text(),
    provincia: column.text({ optional: true }),
    codigoPostal: column.text(),
    pais: column.text({ default: 'España' }),
    telefono: column.text({ optional: true }),
    notas: column.text({ optional: true }),
  }
});

// =============================================
// 📋 PRESUPUESTOS (QUOTES / ESTIMATES)
// =============================================
export const Presupuesto = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    workspaceId: column.text(),
    serie: column.text({ default: 'PRE26' }),
    numero: column.number(),
    codigo: column.text(), // ej. PRE26-0001
    cliente: column.text(),
    clienteNif: column.text({ optional: true }),
    clienteEmail: column.text({ optional: true }),
    clienteTelefono: column.text({ optional: true }),
    clienteDireccion: column.text({ optional: true }),
    fechaEmision: column.text(), // YYYY-MM-DD
    fechaValidez: column.text({ optional: true }),
    estado: column.text({ default: 'Borrador' }), // Borrador, Enviado, Aprobado, Rechazado, Facturado, Albaranado
    descripcionGeneral: column.text({ optional: true }),
    notas: column.text({ optional: true }),
    condiciones: column.text({ optional: true }),
    baseImponible: column.number({ default: 0 }),
    tipoIva: column.number({ default: 21 }),
    cuotaIva: column.number({ default: 0 }),
    tipoRetencionIrpf: column.number({ optional: true, default: 0 }),
    cuotaRetencionIrpf: column.number({ optional: true, default: 0 }),
    total: column.number({ default: 0 }),
    numParteTrabajoVinculado: column.text({ optional: true }),
    creadoEn: column.date({ default: NOW })
  }
});

export const LineaPresupuesto = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    presupuestoId: column.number({ references: () => Presupuesto.columns.id }),
    descripcion: column.text(),
    cantidad: column.number({ default: 1 }),
    precioUnitario: column.number({ default: 0 }),
    descuentoPorcentaje: column.number({ optional: true, default: 0 }),
    tipoIva: column.number({ default: 21 }),
    totalLinea: column.number({ default: 0 }),
    orden: column.number({ optional: true, default: 0 })
  }
});

// =============================================
// 🚚 ALBARANES (DELIVERY NOTES)
// =============================================
export const Albaran = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    workspaceId: column.text(),
    serie: column.text({ default: 'ALB26' }),
    numero: column.number(),
    codigo: column.text(), // ej. ALB26-0001
    cliente: column.text(),
    clienteNif: column.text({ optional: true }),
    clienteDireccion: column.text({ optional: true }),
    fecha: column.text(), // YYYY-MM-DD
    estado: column.text({ default: 'Pendiente' }), // Pendiente, En reparto, Entregado, Facturado
    transportista: column.text({ optional: true }),
    numeroSeguimiento: column.text({ optional: true }),
    bultos: column.number({ optional: true, default: 1 }),
    personaContacto: column.text({ optional: true }),
    notas: column.text({ optional: true }),
    presupuestoIdVinculado: column.number({ optional: true }),
    numParteTrabajoVinculado: column.text({ optional: true }),
    facturaIdVinculada: column.number({ optional: true }),
    baseImponible: column.number({ default: 0 }),
    total: column.number({ default: 0 }),
    creadoEn: column.date({ default: NOW })
  }
});

export const LineaAlbaran = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    albaranId: column.number({ references: () => Albaran.columns.id }),
    descripcion: column.text(),
    cantidad: column.number({ default: 1 }),
    precioUnitario: column.number({ optional: true, default: 0 }),
    totalLinea: column.number({ optional: true, default: 0 }),
    orden: column.number({ optional: true, default: 0 })
  }
});

// =============================================
// 🧾 FACTURAS (INVOICES - NORMATIVA VERI*FACTU & LEY ANTIFRAUDE RD 1007/2023)
// =============================================
export const Factura = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    workspaceId: column.text(),
    serie: column.text({ default: 'F26' }),
    numero: column.number(),
    numeroFacturaCompleto: column.text(), // ej. F26-0001, R26-0001
    tipoFactura: column.text({ default: 'F1' }), // F1 (Ordinaria), F2 (Simplificada), R1..R5 (Rectificativas)
    facturaRectificadaId: column.number({ optional: true }),
    motivoRectificacion: column.text({ optional: true }),
    
    // Datos del Cliente / Receptor
    cliente: column.text(),
    clienteNif: column.text(),
    clienteDireccion: column.text({ optional: true }),
    clienteCodigoPostal: column.text({ optional: true }),
    clienteCiudad: column.text({ optional: true }),
    clienteProvincia: column.text({ optional: true }),
    clientePais: column.text({ default: 'ES' }),
    clienteEmail: column.text({ optional: true }),
    
    // Fechas y Condiciones
    fechaExpedicion: column.text(), // YYYY-MM-DD
    horaExpedicion: column.text(), // HH:mm:ss
    fechaOperacion: column.text({ optional: true }),
    fechaVencimiento: column.text({ optional: true }),
    formaPago: column.text({ default: 'Transferencia bancaria' }),
    cuentaBancaria: column.text({ optional: true }),
    estado: column.text({ default: 'Borrador' }), // Borrador, Emitida, Cobrada, Anulada
    
    // Importes e Impuestos
    baseImponible: column.number({ default: 0 }),
    tipoIva: column.number({ default: 21 }),
    cuotaIva: column.number({ default: 0 }),
    tipoRecargoEquivalencia: column.number({ optional: true, default: 0 }),
    cuotaRecargoEquivalencia: column.number({ optional: true, default: 0 }),
    tipoRetencionIrpf: column.number({ optional: true, default: 0 }),
    cuotaRetencionIrpf: column.number({ optional: true, default: 0 }),
    totalFactura: column.number({ default: 0 }),
    notas: column.text({ optional: true }),
    
    // Trazabilidad comercial
    presupuestoIdVinculado: column.number({ optional: true }),
    albaranIdVinculado: column.number({ optional: true }),
    numParteTrabajoVinculado: column.text({ optional: true }),
    
    // 🛡️ REQUISITOS LEY ANTIFRAUDE / VERI*FACTU (RD 1007/2023)
    huellaHash: column.text({ optional: true }), // SHA-256 canónico del registro de alta
    huellaHashAnterior: column.text({ optional: true }), // SHA-256 de la factura inmediatamente anterior (encadenamiento)
    primerRegistro: column.boolean({ optional: true, default: false }),
    sistemaInformatico: column.text({ default: 'Tolklo Organizer v1.0' }),
    verifactuEstado: column.text({ default: 'Borrador' }), // Borrador, Sellada_ConHuella, RemitidaAEAT, ExentaRemision
    qrPayload: column.text({ optional: true }), // Texto/URL oficial para el QR de cotejo con la AEAT
    bloqueada: column.boolean({ default: false }), // Inalterabilidad: una vez emitida queda bloqueada contra edición
    
    creadoEn: column.date({ default: NOW })
  }
});

export const LineaFactura = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    facturaId: column.number({ references: () => Factura.columns.id }),
    descripcion: column.text(),
    cantidad: column.number({ default: 1 }),
    precioUnitario: column.number({ default: 0 }),
    descuentoPorcentaje: column.number({ optional: true, default: 0 }),
    tipoIva: column.number({ default: 21 }),
    totalLinea: column.number({ default: 0 }),
    orden: column.number({ optional: true, default: 0 })
  }
});

// =============================================
// ⚙️ CONFIGURACIÓN FISCAL DE LA EMPRESA EMISORA
// =============================================
export const ConfiguracionFiscal = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    workspaceId: column.text({ unique: true }),
    razonSocial: column.text({ default: 'Mi Empresa S.L.' }),
    nif: column.text({ default: 'B12345678' }),
    direccion: column.text({ optional: true }),
    codigoPostal: column.text({ optional: true }),
    ciudad: column.text({ optional: true }),
    provincia: column.text({ optional: true }),
    pais: column.text({ default: 'España' }),
    telefono: column.text({ optional: true }),
    email: column.text({ optional: true }),
    iban: column.text({ optional: true }),
    serieFacturaDefecto: column.text({ default: 'F26' }),
    seriePresupuestoDefecto: column.text({ default: 'PRE26' }),
    serieAlbaranDefecto: column.text({ default: 'ALB26' }),
    ivaDefecto: column.number({ default: 21 }),
    modoVerifactu: column.text({ default: 'SIF_ENCADENAMIENTO' }), // SIF_ENCADENAMIENTO (Huella local inalterable) o VERIFACTU_REMISIÓN
    actualizadoEn: column.date({ default: NOW })
  }
});

export default defineDb({
  tables: {
    Trabajo,
    DesgloseTrabajo,
    RegistroActividad,
    DireccionCliente,
    Presupuesto,
    LineaPresupuesto,
    Albaran,
    LineaAlbaran,
    Factura,
    LineaFactura,
    ConfiguracionFiscal
  }
});