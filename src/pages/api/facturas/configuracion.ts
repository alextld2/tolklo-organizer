// src/pages/api/facturas/configuracion.ts
import { db, ConfiguracionFiscal, eq } from 'astro:db';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace') || 'produccion';

    let configs = await db
      .select()
      .from(ConfiguracionFiscal)
      .where(eq(ConfiguracionFiscal.workspaceId, workspaceId));

    if (!configs[0] && workspaceId === 'facturacion') {
      configs = await db
        .select()
        .from(ConfiguracionFiscal)
        .where(eq(ConfiguracionFiscal.workspaceId, 'produccion'));
      if (!configs[0]) {
        configs = await db.select().from(ConfiguracionFiscal);
      }
    }

    return new Response(JSON.stringify({ configuracion: configs[0] || null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al obtener configuración fiscal:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      workspaceId = 'produccion',
      razonSocial,
      nif,
      direccion,
      codigoPostal,
      ciudad,
      provincia,
      pais = 'España',
      telefono,
      email,
      iban,
      serieFacturaDefecto = 'F26',
      seriePresupuestoDefecto = 'PRE26',
      serieAlbaranDefecto = 'ALB26',
      ivaDefecto = 21,
      modoVerifactu = 'SIF_ENCADENAMIENTO'
    } = body;

    const existentes = await db
      .select()
      .from(ConfiguracionFiscal)
      .where(eq(ConfiguracionFiscal.workspaceId, workspaceId));

    if (existentes.length > 0) {
      await db
        .update(ConfiguracionFiscal)
        .set({
          razonSocial,
          nif,
          direccion,
          codigoPostal,
          ciudad,
          provincia,
          pais,
          telefono,
          email,
          iban,
          serieFacturaDefecto,
          seriePresupuestoDefecto,
          serieAlbaranDefecto,
          ivaDefecto: Number(ivaDefecto) || 21,
          modoVerifactu,
          actualizadoEn: new Date()
        })
        .where(eq(ConfiguracionFiscal.workspaceId, workspaceId));
    } else {
      await db
        .insert(ConfiguracionFiscal)
        .values({
          workspaceId,
          razonSocial,
          nif,
          direccion,
          codigoPostal,
          ciudad,
          provincia,
          pais,
          telefono,
          email,
          iban,
          serieFacturaDefecto,
          seriePresupuestoDefecto,
          serieAlbaranDefecto,
          ivaDefecto: Number(ivaDefecto) || 21,
          modoVerifactu
        });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al guardar configuración fiscal:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
