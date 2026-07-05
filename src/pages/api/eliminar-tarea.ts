export const prerender = false;
import type { APIRoute } from 'astro';
// Importamos 'RegistroActividad' para capturar la destrucción del registro
import { db, Trabajo, DesgloseTrabajo, RegistroActividad, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { numParte } = body;

    if (!numParte) {
      return new Response(JSON.stringify({ success: false, message: 'Nº de parte requerido.' }), { status: 400 });
    }

    // 1. EXTRAER DATOS PREVIOS: Consultamos la orden antes de destruirla por completo
    const trabajoExistente = await db.select().from(Trabajo).where(eq(Trabajo.numParte, Number(numParte)));
    
    if (trabajoExistente.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'No se encontró la orden de trabajo a eliminar.' }), { status: 404 });
    }

    const workspaceId = trabajoExistente[0].workspaceId;
    const cliente = trabajoExistente[0].cliente;
    const descripcion = trabajoExistente[0].descripcionGeneral || 'Sin descripción';

    // 2. ELIMINACIÓN EN CASCADA RELACIONAL: Limpiamos desgloses y luego la cabecera
    await db.delete(DesgloseTrabajo).where(eq(DesgloseTrabajo.numParte, Number(numParte)));
    await db.delete(Trabajo).where(eq(Trabajo.numParte, Number(numParte)));

    // 3. REGISTRO DE AUDITORÍA INMUTABLE: Grabamos la huella digital del borrado
    const usuarioActivo = locals.user ? locals.user.nombre : "Alex";
    
    await db.insert(RegistroActividad).values({
      usuario: usuarioActivo,
      workspaceId: workspaceId,
      tipo: 'delete',
      accion: 'Eliminación de Orden',
      detalles: `Eliminó de forma permanente el parte #${numParte} perteneciente a "${cliente}" (${descripcion}).`
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error("❌ ERROR EN API [eliminar-tarea]:", error);
    return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
  }
};