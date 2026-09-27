// src/pages/api/presupuestos/index.ts
import { db, Presupuesto, LineaPresupuesto, RegistroActividad, eq, desc } from 'astro:db';
import type { APIRoute } from 'astro';
import { calcularTotalesDocumento, generarCodigoDocumento } from '$lib/fiscal-utils';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace') || 'produccion';

    const presupuestos = workspaceId === 'facturacion'
      ? await db
          .select()
          .from(Presupuesto)
          .orderBy(desc(Presupuesto.id))
      : await db
          .select()
          .from(Presupuesto)
          .where(eq(Presupuesto.workspaceId, workspaceId))
          .orderBy(desc(Presupuesto.id));

    return new Response(JSON.stringify({ presupuestos }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al obtener presupuestos:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const {
      workspaceId = 'produccion',
      serie = 'PRE26',
      cliente,
      clienteNif,
      clienteEmail,
      clienteTelefono,
      clienteDireccion,
      fechaEmision = new Date().toISOString().split('T')[0],
      fechaValidez,
      estado = 'Borrador',
      descripcionGeneral,
      notas,
      condiciones,
      lineas = [],
      tipoIvaDefecto = 21,
      tipoRetencionIrpf = 0,
      numParteTrabajoVinculado
    } = body;

    if (!cliente || String(cliente).trim() === '') {
      return new Response(JSON.stringify({ error: 'El nombre del cliente es obligatorio' }), { status: 400 });
    }

    // 1. Obtener correlativo para la serie
    const existentes = await db
      .select()
      .from(Presupuesto)
      .where(eq(Presupuesto.serie, serie))
      .orderBy(desc(Presupuesto.numero));

    const ultimoNumero = existentes.length > 0 ? (existentes[0].numero || 0) : 0;
    const nuevoNumero = ultimoNumero + 1;
    const codigo = generarCodigoDocumento(serie, nuevoNumero);

    // 2. Calcular importes con precisión fiscal
    const totales = calcularTotalesDocumento(lineas, tipoIvaDefecto, tipoRetencionIrpf);

    // 3. Insertar cabecera de presupuesto
    const resPresupuesto = await db.insert(Presupuesto).values({
      workspaceId,
      serie,
      numero: nuevoNumero,
      codigo,
      cliente: cliente.trim(),
      clienteNif: clienteNif ? clienteNif.trim() : null,
      clienteEmail: clienteEmail ? clienteEmail.trim() : null,
      clienteTelefono: clienteTelefono ? clienteTelefono.trim() : null,
      clienteDireccion: clienteDireccion ? clienteDireccion.trim() : null,
      fechaEmision,
      fechaValidez: fechaValidez || null,
      estado,
      descripcionGeneral: descripcionGeneral || null,
      notas: notas || null,
      condiciones: condiciones || null,
      baseImponible: totales.baseImponible,
      tipoIva: totales.tipoIva,
      cuotaIva: totales.cuotaIva,
      tipoRetencionIrpf: totales.tipoRetencionIrpf,
      cuotaRetencionIrpf: totales.cuotaRetencionIrpf,
      total: totales.total,
      numParteTrabajoVinculado: numParteTrabajoVinculado || null
    }).returning();

    const nuevoPresupuesto = resPresupuesto[0];
    const presupuestoId = nuevoPresupuesto?.id;

    // 4. Insertar líneas de presupuesto si existen
    if (presupuestoId && Array.isArray(lineas)) {
      for (let i = 0; i < lineas.length; i++) {
        const item = lineas[i];
        if (item && item.descripcion) {
          const cantidad = Number(item.cantidad) || 1;
          const precioUnitario = Number(item.precioUnitario) || 0;
          const desc = Number(item.descuentoPorcentaje) || 0;
          const totalLinea = Math.round((cantidad * precioUnitario * (1 - desc / 100)) * 100) / 100;

          await db.insert(LineaPresupuesto).values({
            presupuestoId,
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

    // 5. Registro de Actividad
    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';
    await db.insert(RegistroActividad).values({
      usuario: usuarioLogueado,
      workspaceId,
      tipo: 'CREATE',
      accion: 'Crear Presupuesto',
      detalles: `Se registró el presupuesto ${codigo} para "${cliente}" por ${totales.total.toFixed(2)} €.`
    });

    return new Response(JSON.stringify({ 
      success: true, 
      presupuesto: nuevoPresupuesto, 
      codigo 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al crear presupuesto:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
