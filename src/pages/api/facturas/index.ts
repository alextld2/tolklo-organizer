// src/pages/api/facturas/index.ts
import { db, Factura, LineaFactura, RegistroActividad, eq, desc } from 'astro:db';
import type { APIRoute } from 'astro';
import { 
  calcularTotalesDocumento, 
  generarCodigoDocumento 
} from '$lib/fiscal-utils';
import { 
  calcularHuellaVerifactu, 
  generarQrPayloadVerifactu 
} from '$lib/verifactu-server';
import { getConfiguracionFiscalWorkspace } from '$lib/db-utils';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace') || 'produccion';

    const facturas = workspaceId === 'facturacion'
      ? await db
          .select()
          .from(Factura)
          .orderBy(desc(Factura.id))
      : await db
          .select()
          .from(Factura)
          .where(eq(Factura.workspaceId, workspaceId))
          .orderBy(desc(Factura.id));

    return new Response(JSON.stringify({ facturas }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al obtener facturas:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const {
      workspaceId = 'produccion',
      serie = 'F26',
      tipoFactura = 'F1',
      cliente,
      clienteNif,
      clienteDireccion,
      clienteCodigoPostal,
      clienteCiudad,
      clienteProvincia,
      clientePais = 'ES',
      clienteEmail,
      fechaExpedicion = new Date().toISOString().split('T')[0],
      horaExpedicion = new Date().toTimeString().split(' ')[0],
      fechaVencimiento,
      formaPago = 'Transferencia bancaria',
      cuentaBancaria,
      notas,
      presupuestoIdVinculado,
      albaranIdVinculado,
      numParteTrabajoVinculado,
      lineas = [],
      tipoIvaDefecto = 21,
      tipoRetencionIrpf = 0,
      tipoRecargoEquivalencia = 0,
      emitirDirectamente = false
    } = body;

    if (!cliente || String(cliente).trim() === '') {
      return new Response(JSON.stringify({ error: 'El nombre del cliente es obligatorio' }), { status: 400 });
    }
    if (!clienteNif || String(clienteNif).trim() === '') {
      return new Response(JSON.stringify({ error: 'El NIF/CIF del cliente es obligatorio según normativa fiscal' }), { status: 400 });
    }

    // 1. Obtener correlativo de número dentro de la serie
    const existentes = await db
      .select()
      .from(Factura)
      .where(eq(Factura.serie, serie))
      .orderBy(desc(Factura.numero));

    const ultimoNumero = existentes.length > 0 ? (existentes[0].numero || 0) : 0;
    const nuevoNumero = ultimoNumero + 1;
    const numeroFacturaCompleto = generarCodigoDocumento(serie, nuevoNumero);

    // 2. Calcular desglose impositivo
    const totales = calcularTotalesDocumento(lineas, tipoIvaDefecto, tipoRetencionIrpf, tipoRecargoEquivalencia);

    // 3. Obtener configuración fiscal del emisor
    const configFiscal = await getConfiguracionFiscalWorkspace(workspaceId);
    const emisorNif = configFiscal?.nif || 'B18928374';

    // 4. Si se emite directamente, calcular huella SHA-256 Veri*factu encadenada
    let huellaHash: string | null = null;
    let huellaHashAnterior: string | null = null;
    let primerRegistro = false;
    let qrPayload: string | null = null;
    let verifactuEstado = 'Borrador';
    let bloqueada = false;

    if (emitirDirectamente) {
      // Buscar la última factura formal emitida en la misma serie
      const facturasEmitidasPrevias = existentes.filter(f => f.bloqueada && f.huellaHash);
      if (facturasEmitidasPrevias.length === 0) {
        primerRegistro = true;
        huellaHashAnterior = null;
      } else {
        primerRegistro = false;
        huellaHashAnterior = facturasEmitidasPrevias[0].huellaHash;
      }

      huellaHash = calcularHuellaVerifactu({
        emisorNif,
        numeroFacturaCompleto,
        fechaExpedicion,
        horaExpedicion,
        tipoFactura,
        cuotaIva: totales.cuotaIva,
        totalFactura: totales.total,
        huellaHashAnterior
      });

      qrPayload = generarQrPayloadVerifactu({
        emisorNif,
        numeroFacturaCompleto,
        fechaExpedicion,
        totalFactura: totales.total,
        huellaHash
      });

      verifactuEstado = 'Sellada_ConHuella';
      bloqueada = true; // Inalterabilidad
    }

    // 5. Insertar Factura
    const resFactura = await db.insert(Factura).values({
      workspaceId,
      serie,
      numero: nuevoNumero,
      numeroFacturaCompleto,
      tipoFactura,
      cliente: cliente.trim(),
      clienteNif: clienteNif.trim().toUpperCase(),
      clienteDireccion: clienteDireccion || null,
      clienteCodigoPostal: clienteCodigoPostal || null,
      clienteCiudad: clienteCiudad || null,
      clienteProvincia: clienteProvincia || null,
      clientePais: clientePais || 'ES',
      clienteEmail: clienteEmail || null,
      fechaExpedicion,
      horaExpedicion,
      fechaVencimiento: fechaVencimiento || null,
      formaPago,
      cuentaBancaria: cuentaBancaria || configFiscal?.iban || null,
      estado: emitirDirectamente ? 'Emitida' : 'Borrador',
      baseImponible: totales.baseImponible,
      tipoIva: totales.tipoIva,
      cuotaIva: totales.cuotaIva,
      tipoRecargoEquivalencia: totales.tipoRecargoEquivalencia,
      cuotaRecargoEquivalencia: totales.cuotaRecargoEquivalencia,
      tipoRetencionIrpf: totales.tipoRetencionIrpf,
      cuotaRetencionIrpf: totales.cuotaRetencionIrpf,
      totalFactura: totales.total,
      notas: notas || null,
      presupuestoIdVinculado: presupuestoIdVinculado ? Number(presupuestoIdVinculado) : null,
      albaranIdVinculado: albaranIdVinculado ? Number(albaranIdVinculado) : null,
      numParteTrabajoVinculado: numParteTrabajoVinculado || null,
      huellaHash,
      huellaHashAnterior,
      primerRegistro,
      sistemaInformatico: 'Tolklo Organizer v1.0',
      verifactuEstado,
      qrPayload,
      bloqueada
    }).returning();

    const nuevaFactura = resFactura[0];
    const facturaId = nuevaFactura?.id;

    // 6. Insertar Líneas de Factura
    if (facturaId && Array.isArray(lineas)) {
      for (let i = 0; i < lineas.length; i++) {
        const item = lineas[i];
        if (item && item.descripcion) {
          const cantidad = Number(item.cantidad) || 1;
          const precioUnitario = Number(item.precioUnitario) || 0;
          const desc = Number(item.descuentoPorcentaje) || 0;
          const totalLinea = Math.round((cantidad * precioUnitario * (1 - desc / 100)) * 100) / 100;

          await db.insert(LineaFactura).values({
            facturaId,
            descripcion: item.descripcion.trim(),
            cantidad,
            precioUnitario,
            descuentoPorcentaje: desc,
            tipoIva: item.tipoIva || totales.tipoIva,
            totalLinea,
            orden: i + 1
          });
        }
      }
    }

    // 7. Registro de Actividad
    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';
    await db.insert(RegistroActividad).values({
      usuario: usuarioLogueado,
      workspaceId,
      tipo: 'CREATE',
      accion: emitirDirectamente ? 'Emitir Factura Veri*factu' : 'Crear Borrador Factura',
      detalles: `Factura ${numeroFacturaCompleto} (${cliente}) por ${totales.total.toFixed(2)} €.`
    });

    return new Response(JSON.stringify({ 
      success: true, 
      factura: nuevaFactura, 
      numeroFacturaCompleto 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al crear factura:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
