// src/pages/api/facturas/emitir.ts
import { db, Factura, RegistroActividad, eq, desc } from 'astro:db';
import type { APIRoute } from 'astro';
import { calcularHuellaVerifactu, generarQrPayloadVerifactu } from '$lib/verifactu-server';
import { getConfiguracionFiscalWorkspace } from '$lib/db-utils';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { facturaId } = body;

    if (!facturaId) {
      return new Response(JSON.stringify({ error: 'Falta el ID de la factura' }), { status: 400 });
    }

    const facturaResults = await db
      .select()
      .from(Factura)
      .where(eq(Factura.id, Number(facturaId)));

    const factura = facturaResults[0];
    if (!factura) {
      return new Response(JSON.stringify({ error: 'Factura no encontrada' }), { status: 404 });
    }

    if (factura.bloqueada) {
      return new Response(JSON.stringify({ 
        error: 'Esta factura ya fue emitida y sellada criptográficamente. Por imperativo de la Ley Antifraude 11/2021 no puede ser alterada.' 
      }), { status: 403 });
    }

    // 1. Obtener el emisor fiscal
    const configFiscal = await getConfiguracionFiscalWorkspace(factura.workspaceId);
    const emisorNif = configFiscal?.nif || 'B18928374';

    // 2. Buscar la factura emitida previa en la misma serie para encadenar huella
    const facturasSerie = await db
      .select()
      .from(Factura)
      .where(eq(Factura.serie, factura.serie))
      .orderBy(desc(Factura.numero));

    const previaEmitida = facturasSerie.find(f => f.id !== factura.id && f.bloqueada && f.huellaHash);
    const primerRegistro = !previaEmitida;
    const huellaHashAnterior = previaEmitida ? previaEmitida.huellaHash : null;

    const fechaExp = factura.fechaExpedicion || new Date().toISOString().split('T')[0];
    const horaExp = new Date().toTimeString().split(' ')[0];

    // 3. Generar huella canónica SHA-256
    const huellaHash = calcularHuellaVerifactu({
      emisorNif,
      numeroFacturaCompleto: factura.numeroFacturaCompleto,
      fechaExpedicion: fechaExp,
      horaExpedicion: horaExp,
      tipoFactura: factura.tipoFactura || 'F1',
      cuotaIva: factura.cuotaIva || 0,
      totalFactura: factura.totalFactura || 0,
      huellaHashAnterior
    });

    // 4. Generar URL para código QR de cotejo AEAT
    const qrPayload = generarQrPayloadVerifactu({
      emisorNif,
      numeroFacturaCompleto: factura.numeroFacturaCompleto,
      fechaExpedicion: fechaExp,
      totalFactura: factura.totalFactura || 0,
      huellaHash
    });

    // 5. Bloquear y sellar factura
    await db
      .update(Factura)
      .set({
        estado: 'Emitida',
        horaExpedicion: horaExp,
        huellaHash,
        huellaHashAnterior,
        primerRegistro,
        qrPayload,
        verifactuEstado: 'Sellada_ConHuella',
        bloqueada: true
      })
      .where(eq(Factura.id, factura.id));

    // 6. Registro de Actividad
    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';
    await db.insert(RegistroActividad).values({
      usuario: usuarioLogueado,
      workspaceId: factura.workspaceId,
      tipo: 'UPDATE',
      accion: 'Sellar Factura Veri*factu',
      detalles: `Factura ${factura.numeroFacturaCompleto} sellada con huella SHA-256: ${huellaHash.substring(0, 16)}...`
    });

    return new Response(JSON.stringify({ 
      success: true, 
      numeroFacturaCompleto: factura.numeroFacturaCompleto,
      huellaHash,
      qrPayload
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al emitir factura Veri*factu:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
