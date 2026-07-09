// src/pages/api/eliminar-tarea.ts
// 1. Añade la 's' al importar si en tu config.ts se llama Desgloses
import { db, Trabajo, RegistroActividad, DesgloseTrabajo, eq } from 'astro:db'; 
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { id, workspaceId } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'Falta el ID del parte' }), { status: 400 });
    }

    // 2. Cambia Desglose por Desgloses aquí también
    await db.delete(DesgloseTrabajo).where(eq(DesgloseTrabajo.numParte, id));

    // El resto de tu código de eliminación del Trabajo se queda exactamente igual...
    await db.delete(Trabajo).where(eq(Trabajo.numParte, id));

    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';

    await db.insert(RegistroActividad).values({
      usuario: usuarioLogueado,
      workspaceId: workspaceId || 'general',
      tipo: 'DELETE',
      accion: 'Eliminar Parte',
      detalles: `Se eliminó el parte de trabajo #${id} y sus líneas de desglose asociadas de la base de datos.`
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error('❌ Error al eliminar tarea en la base de datos:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};