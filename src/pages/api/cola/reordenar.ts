// src/pages/api/cola/reordenar.ts
import { db, Trabajo, RegistroActividad, eq } from 'astro:db';
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { items, workspaceId } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Lista de posiciones vacía o inválida' }), { status: 400 });
    }

    // Actualizamos cada tarea en orden
    for (const item of items) {
      if (item.numParte !== undefined && item.ordenCola !== undefined) {
        await db.update(Trabajo)
          .set({ ordenCola: Number(item.ordenCola) })
          .where(eq(Trabajo.numParte, String(item.numParte)));
      }
    }

    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Encargado Taller';

    await db.insert(RegistroActividad).values({
      usuario: usuarioLogueado,
      workspaceId: workspaceId || 'produccion',
      tipo: 'UPDATE',
      accion: 'Reordenar Cola',
      detalles: `Se actualizó el orden de ejecución de ${items.length} trabajos en la cola del taller.`
    });

    return new Response(JSON.stringify({ success: true, actualizados: items.length }), { status: 200 });
  } catch (error: any) {
    console.error('❌ Error al reordenar cola:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
