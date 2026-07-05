export const prerender = false;
import type { APIRoute } from 'astro';
// Importamos 'RegistroActividad' para la auditoría de planta
import { db, Trabajo, RegistroActividad, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    console.log("--> API [actualizar-fecha] ha recibido:", body);
    const { numParte, nuevaFecha } = body;

    if (!numParte || !nuevaFecha) {
      return new Response(JSON.stringify({ message: 'Faltan campos obligatorios: numParte o nuevaFecha' }), { status: 400 });
    }

    // 1. EXTRAER ESTADO PREVIO: Consultamos el parte antes de modificarlo para el registro técnico
    const trabajoExistente = await db.select().from(Trabajo).where(eq(Trabajo.numParte, Number(numParte)));
    
    if (trabajoExistente.length === 0) {
      return new Response(JSON.stringify({ message: 'No se encontró la orden de trabajo especificada' }), { status: 404 });
    }

    const fechaAnterior = trabajoExistente[0].fechaSalida;
    const workspaceId = trabajoExistente[0].workspaceId;
    const cliente = trabajoExistente[0].cliente;

    // 2. ACTUALIZACIÓN MÁSTER: Guardamos la nueva fecha en el parte de producción
    await db.update(Trabajo)
      .set({ fechaSalida: nuevaFecha })
      .where(eq(Trabajo.numParte, Number(numParte)));

    // 3. INYECCIÓN DEL LOG: Si la fecha ha cambiado realmente, grabamos la huella del operario
    if (fechaAnterior !== nuevaFecha) {
      // Extraemos el operario del middleware de sesión o usamos el fallback de tu entorno
      const usuarioActivo = locals.user ? locals.user.nombre : "Alex";
      
      await db.insert(RegistroActividad).values({
        usuario: usuarioActivo,
        workspaceId: workspaceId,
        tipo: 'update',
        accion: 'Cambio de Fecha',
        detalles: `Modificó la entrega del parte #${numParte} (${cliente}) de "${fechaAnterior}" a "${nuevaFecha}".`
      });
    }

    console.log(`--> ✅ Astro DB y Log guardados con éxito: Parte #${numParte} cambiado al ${nuevaFecha}`);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error("❌ ERROR EN CONTROLLER [actualizar-fecha]:", error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};