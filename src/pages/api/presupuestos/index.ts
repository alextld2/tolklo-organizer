// src/pages/api/presupuestos/index.ts
import { db, Presupuesto, LineaPresupuesto, Trabajo, DesgloseTrabajo, RegistroActividad, eq, desc } from 'astro:db';
import type { APIRoute } from 'astro';
import { calcularTotalesDocumento, generarCodigoDocumento } from '$lib/fiscal-utils';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // Consulta de presupuesto individual con sus líneas
    if (id) {
      const presRows = await db
        .select()
        .from(Presupuesto)
        .where(eq(Presupuesto.id, Number(id)));
      
      const pres = presRows[0];
      if (!pres) {
        return new Response(JSON.stringify({ error: 'Presupuesto no encontrado' }), { status: 404 });
      }

      const lineas = await db
        .select()
        .from(LineaPresupuesto)
        .where(eq(LineaPresupuesto.presupuestoId, Number(id)))
        .orderBy(LineaPresupuesto.orden);

      return new Response(JSON.stringify({ ok: true, presupuesto: { ...pres, lineas } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
      numParteTrabajoVinculado,
      parametrosEscandalloJson
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
      numParteTrabajoVinculado: numParteTrabajoVinculado || null,
      parametrosEscandalloJson: parametrosEscandalloJson || null
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

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const {
      id,
      cliente,
      clienteNif,
      clienteEmail,
      clienteTelefono,
      clienteDireccion,
      fechaEmision,
      fechaValidez,
      descripcionGeneral,
      notas,
      condiciones,
      lineas = [],
      tipoIvaDefecto = 21,
      tipoRetencionIrpf = 0,
      parametrosEscandalloJson
    } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'El ID del presupuesto es obligatorio para editarlo' }), { status: 400 });
    }

    if (!cliente || String(cliente).trim() === '') {
      return new Response(JSON.stringify({ error: 'El nombre del cliente es obligatorio' }), { status: 400 });
    }

    const idNum = Number(id);
    const existentes = await db.select().from(Presupuesto).where(eq(Presupuesto.id, idNum));
    const pres = existentes[0];

    if (!pres) {
      return new Response(JSON.stringify({ error: 'Presupuesto no encontrado' }), { status: 404 });
    }

    if (pres.estado === 'Facturado') {
      return new Response(JSON.stringify({ error: 'No se puede modificar un presupuesto que ya ha sido Facturado legalmente.' }), { status: 400 });
    }

    // 1. Recalcular importes fiscales
    const totales = calcularTotalesDocumento(lineas, tipoIvaDefecto, tipoRetencionIrpf);

    // 2. Actualizar cabecera de presupuesto
    await db.update(Presupuesto).set({
      cliente: cliente.trim(),
      clienteNif: clienteNif ? clienteNif.trim() : null,
      clienteEmail: clienteEmail ? clienteEmail.trim() : null,
      clienteTelefono: clienteTelefono ? clienteTelefono.trim() : null,
      clienteDireccion: clienteDireccion ? clienteDireccion.trim() : null,
      fechaEmision: fechaEmision || pres.fechaEmision,
      fechaValidez: fechaValidez || null,
      descripcionGeneral: descripcionGeneral || null,
      notas: notas || null,
      condiciones: condiciones || null,
      baseImponible: totales.baseImponible,
      tipoIva: totales.tipoIva,
      cuotaIva: totales.cuotaIva,
      tipoRetencionIrpf: totales.tipoRetencionIrpf,
      cuotaRetencionIrpf: totales.cuotaRetencionIrpf,
      total: totales.total,
      parametrosEscandalloJson: parametrosEscandalloJson || pres.parametrosEscandalloJson || null
    }).where(eq(Presupuesto.id, idNum));

    // 3. Reemplazar líneas de presupuesto
    await db.delete(LineaPresupuesto).where(eq(LineaPresupuesto.presupuestoId, idNum));

    if (Array.isArray(lineas)) {
      for (let i = 0; i < lineas.length; i++) {
        const item = lineas[i];
        if (item && item.descripcion) {
          const cantidad = Number(item.cantidad) || 1;
          const precioUnitario = Number(item.precioUnitario) || 0;
          const desc = Number(item.descuentoPorcentaje) || 0;
          const totalLinea = Math.round((cantidad * precioUnitario * (1 - desc / 100)) * 100) / 100;

          await db.insert(LineaPresupuesto).values({
            presupuestoId: idNum,
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

    // 4. Si ya tiene parte de trabajo vinculado, sincronizar la orden en imprenta
    if (pres.numParteTrabajoVinculado) {
      const descTaller = descripcionGeneral || (lineas.length > 0 ? lineas.map(l => `${l.descripcion} (${l.cantidad} uds)`).join(', ') : pres.descripcionGeneral);
      await db.update(Trabajo).set({
        cliente: cliente.trim(),
        descripcionGeneral: descTaller
      }).where(eq(Trabajo.numParte, pres.numParteTrabajoVinculado));

      await db.delete(DesgloseTrabajo).where(eq(DesgloseTrabajo.numParte, pres.numParteTrabajoVinculado));
      for (const l of lineas) {
        if (l.descripcion) {
          await db.insert(DesgloseTrabajo).values({
            numParte: pres.numParteTrabajoVinculado,
            descripcionProducto: l.descripcion,
            cantidad: l.cantidad || 1
          });
        }
      }
    }

    // 5. Auditoría
    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';
    await db.insert(RegistroActividad).values({
      usuario: usuarioLogueado,
      workspaceId: pres.workspaceId || 'produccion',
      tipo: 'UPDATE',
      accion: 'Modificar Presupuesto',
      detalles: `Se actualizó el presupuesto ${pres.codigo} (${cliente}) con nuevo importe ${totales.total.toFixed(2)} €.`
    });

    return new Response(JSON.stringify({
      success: true,
      ok: true,
      codigo: pres.codigo,
      mensaje: `Presupuesto ${pres.codigo} actualizado con éxito.`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al modificar presupuesto:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    let idParam = url.searchParams.get('id');

    if (!idParam) {
      try {
        const body = await request.json();
        idParam = body?.id;
      } catch (e) {
        // no json body
      }
    }

    if (!idParam) {
      return new Response(JSON.stringify({ error: 'El ID del presupuesto es obligatorio' }), { status: 400 });
    }

    const idNum = Number(idParam);
    const existentes = await db.select().from(Presupuesto).where(eq(Presupuesto.id, idNum));
    const pres = existentes[0];

    if (!pres) {
      return new Response(JSON.stringify({ error: 'Presupuesto no encontrado' }), { status: 404 });
    }

    if (pres.estado === 'Facturado') {
      return new Response(JSON.stringify({ error: 'No se puede eliminar un presupuesto que ya ha sido Facturado legalmente.' }), { status: 400 });
    }

    // 1. Eliminar líneas asociadas
    await db.delete(LineaPresupuesto).where(eq(LineaPresupuesto.presupuestoId, idNum));

    // 2. Eliminar cabecera
    await db.delete(Presupuesto).where(eq(Presupuesto.id, idNum));

    // 3. Registrar auditoría
    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';
    await db.insert(RegistroActividad).values({
      usuario: usuarioLogueado,
      workspaceId: pres.workspaceId || 'produccion',
      tipo: 'DELETE',
      accion: 'Eliminar Presupuesto',
      detalles: `Se eliminó el presupuesto ${pres.codigo} de "${pres.cliente}" por importe ${pres.total.toFixed(2)} €.`
    });

    return new Response(JSON.stringify({ 
      success: true, 
      ok: true, 
      mensaje: `Presupuesto ${pres.codigo} eliminado correctamente.` 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al eliminar presupuesto:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
