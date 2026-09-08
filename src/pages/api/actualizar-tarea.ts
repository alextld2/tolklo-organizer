// src/pages/api/actualizar-tarea.ts
import { db, Trabajo, DesgloseTrabajo, RegistroActividad, eq } from 'astro:db';
import type { APIRoute } from 'astro';

export const prerender = false; // Forzamos carga en vivo SSR

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const targetId = body.id || body.numParte;
    const { 
      cliente, 
      descripcionGeneral, 
      fechaSalida, 
      estado, 
      area, 
      comercial, 
      subcontrata, 
      desgloses, 
      workspaceId 
    } = body;

    if (!targetId) {
      return new Response(JSON.stringify({ error: 'Falta el ID del parte de trabajo' }), { status: 400 });
    }

    // 1. Preparamos el objeto con los campos a actualizar en Trabajo
    const camposActualizar: Record<string, any> = {};
    if (cliente !== undefined) camposActualizar.cliente = cliente;
    if (descripcionGeneral !== undefined) camposActualizar.descripcionGeneral = descripcionGeneral;
    if (fechaSalida !== undefined) camposActualizar.fechaSalida = fechaSalida;
    if (estado !== undefined) camposActualizar.estado = estado;
    if (area !== undefined) camposActualizar.area = area;
    if (comercial !== undefined) camposActualizar.comercial = comercial;
    if (subcontrata !== undefined) camposActualizar.subcontrata = subcontrata;

    if (Object.keys(camposActualizar).length > 0) {
      await db.update(Trabajo)
        .set(camposActualizar)
        .where(eq(Trabajo.numParte, String(targetId)));
    }

    // 2. Actualizamos las líneas de desglose si se proporcionaron
    if (Array.isArray(desgloses)) {
      await db.delete(DesgloseTrabajo).where(eq(DesgloseTrabajo.numParte, String(targetId)));
      for (const item of desgloses) {
        if (item && item.descripcionProducto && String(item.descripcionProducto).trim() !== '') {
          await db.insert(DesgloseTrabajo).values({
            numParte: String(targetId),
            descripcionProducto: String(item.descripcionProducto).trim(),
            cantidad: Number(item.cantidad) || 0
          });
        }
      }
    }

    // 3. Extracción de autoría
    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';

    // 4. Registramos el movimiento en el historial
    let resumen = `Se actualizó el parte #${targetId}.`;
    if (estado) resumen += ` Estado: ${estado}.`;
    if (area) resumen += ` Área: ${area}.`;
    if (cliente) resumen += ` Cliente: ${cliente}.`;

    await db.insert(RegistroActividad).values({
      usuario: usuarioLogueado,
      workspaceId: workspaceId || 'general',
      tipo: 'UPDATE',
      accion: 'Actualizar Tarea',
      detalles: resumen
    });

    return new Response(JSON.stringify({ success: true, numParte: targetId }), { status: 200 });
  } catch (error: any) {
    console.error('❌ Error al actualizar tarea en la base de datos:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};