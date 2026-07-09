// src/pages/api/actualizar-tarea.ts
import { db, Trabajo, RegistroActividad, eq } from 'astro:db';
import type { APIRoute } from 'astro';

export const prerender = false; // Forzamos carga en vivo SSR

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { id, estado, area, workspaceId } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Falta el ID del parte de trabajo' }), { status: 400 });
    }

    // 1. Preparamos el objeto con los campos a actualizar
    const camposActualizar: any = {};
    if (estado !== undefined) camposActualizar.estado = estado;
    if (area !== undefined) camposActualizar.area = area;

    // 2. Actualizamos el trabajo en Turso
    await db.update(Trabajo)
      .set(camposActualizar)
      .where(eq(Trabajo.numParte, id));

    // 3. 🛡️ EXTRACCIÓN SEGURA DE AUTORÍA (Evita conflictos con el nuevo objeto de Google)
    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';

    // 4. Registramos el movimiento en el historial
    await db.insert(RegistroActividad).values({
      usuario: usuarioLogueado,
      workspaceId: workspaceId || 'general',
      tipo: 'UPDATE',
      accion: 'Modificar Estado/Área',
      detalles: `Se actualizó el parte #${id}. ${estado ? `Estado: ${estado}.` : ''} ${area ? `Área: ${area}.` : ''}`
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error('❌ Error al actualizar tarea en la base de datos:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};