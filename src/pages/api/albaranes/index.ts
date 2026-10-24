// src/pages/api/albaranes/index.ts
import { db, Albaran, LineaAlbaran, RegistroActividad, eq, desc } from 'astro:db';
import type { APIRoute } from 'astro';
import { generarCodigoDocumento } from '$lib/fiscal-utils';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspace') || 'produccion';

    const albaranes = workspaceId === 'facturacion'
      ? await db
          .select()
          .from(Albaran)
          .orderBy(desc(Albaran.id))
      : await db
          .select()
          .from(Albaran)
          .where(eq(Albaran.workspaceId, workspaceId))
          .orderBy(desc(Albaran.id));

    return new Response(JSON.stringify({ albaranes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al obtener albaranes:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const {
      workspaceId = 'produccion',
      serie = 'ALB26',
      cliente,
      clienteNif,
      clienteDireccion,
      fecha = new Date().toISOString().split('T')[0],
      estado = 'Pendiente',
      transportista,
      numeroSeguimiento,
      bultos = 1,
      personaContacto,
      notas,
      presupuestoIdVinculado,
      numParteTrabajoVinculado,
      lineas = []
    } = body;

    if (!cliente || String(cliente).trim() === '') {
      return new Response(JSON.stringify({ error: 'El nombre del cliente es obligatorio' }), { status: 400 });
    }

    // 1. Calcular totales si las líneas tienen precio
    let baseImponible = 0;
    lineas.forEach((l: any) => {
      const cant = Number(l.cantidad) || 0;
      const prec = Number(l.precioUnitario) || 0;
      baseImponible += cant * prec;
    });
    baseImponible = Math.round(baseImponible * 100) / 100;
    const total = Math.round(baseImponible * 1.21 * 100) / 100;

    // 2. Obtener correlativo de forma atómica con reintento ante concurrencia
    let intentos = 0;
    const maxIntentos = 10;
    let nuevoAlbaran: any = null;
    let nuevoNumero = 1;
    let codigo = '';

    while (!nuevoAlbaran && intentos < maxIntentos) {
      intentos++;

      const existentes = await db
        .select({ numero: Albaran.numero })
        .from(Albaran)
        .where(eq(Albaran.serie, serie))
        .orderBy(desc(Albaran.numero))
        .limit(1);

      const ultimoNumero = existentes.length > 0 ? (existentes[0].numero || 0) : 0;
      nuevoNumero = ultimoNumero + 1;
      codigo = generarCodigoDocumento(serie, nuevoNumero);

      try {
        // 3. Insertar Albarán
        const resAlbaran = await db.insert(Albaran).values({
          workspaceId,
          serie,
          numero: nuevoNumero,
          codigo,
          cliente: cliente.trim(),
          clienteNif: clienteNif ? clienteNif.trim() : null,
          clienteDireccion: clienteDireccion ? clienteDireccion.trim() : null,
          fecha,
          estado,
          transportista: transportista || null,
          numeroSeguimiento: numeroSeguimiento || null,
          bultos: Number(bultos) || 1,
          personaContacto: personaContacto || null,
          notas: notas || null,
          presupuestoIdVinculado: presupuestoIdVinculado ? Number(presupuestoIdVinculado) : null,
          numParteTrabajoVinculado: numParteTrabajoVinculado || null,
          facturaIdVinculada: null,
          baseImponible,
          total
        }).returning();

        nuevoAlbaran = resAlbaran[0];
      } catch (insertErr: any) {
        const errorMsg = String(insertErr.message || insertErr);
        if (
          errorMsg.includes('UNIQUE') || 
          errorMsg.includes('constraint') || 
          insertErr.code === 'SQLITE_CONSTRAINT'
        ) {
          // Conflicto de colisión concurrente: reintentamos
          continue;
        }
        throw insertErr;
      }
    }

    if (!nuevoAlbaran) {
      throw new Error('No se pudo asignar un código de albarán único tras varios intentos concurrentes.');
    }

    const albaranId = nuevoAlbaran?.id;

    // 4. Insertar Líneas
    if (albaranId && Array.isArray(lineas)) {
      for (let i = 0; i < lineas.length; i++) {
        const item = lineas[i];
        if (item && item.descripcion) {
          const cantidad = Number(item.cantidad) || 1;
          const precioUnitario = Number(item.precioUnitario) || 0;
          const totalLinea = Math.round(cantidad * precioUnitario * 100) / 100;

          await db.insert(LineaAlbaran).values({
            albaranId,
            descripcion: item.descripcion.trim(),
            cantidad,
            precioUnitario,
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
      accion: 'Crear Albarán',
      detalles: `Se emitió el albarán de entrega ${codigo} para "${cliente}".`
    });

    return new Response(JSON.stringify({ 
      success: true, 
      albaran: nuevoAlbaran, 
      codigo 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al crear albarán:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
