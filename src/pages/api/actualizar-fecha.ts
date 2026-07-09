// src/pages/api/actualizar-fecha.ts
import { db, Trabajo, RegistroActividad, eq } from 'astro:db';
import type { APIRoute } from 'astro';

export const prerender = false; // Forzamos carga en vivo SSR

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    
    // Leemos la estructura nativa que envía tu calendario
    const { numParte, nuevaFecha } = body;

    if (!numParte || !nuevaFecha) {
      return new Response(
        JSON.stringify({ message: 'Faltan campos obligatorios: numParte o nuevaFecha' }), 
        { status: 400 }
      );
    }

    // Convertimos a String limpio para asegurar compatibilidad de búsqueda en la base de datos
    const numParteStr = String(numParte).trim();

    // 1. CARGA DE CONTROL: Buscamos la orden de trabajo con el formato de texto exacto
    const trabajoExistente = await db.select().from(Trabajo).where(eq(Trabajo.numParte, numParteStr));
    
    if (trabajoExistente.length === 0) {
      return new Response(
        JSON.stringify({ message: `No se encontró la orden de trabajo especificada para: ${numParteStr}` }), 
        { status: 404 }
      );
    }

    const fechaAnterior = trabajoExistente[0].fechaSalida;
    const workspaceId = trabajoExistente[0].workspaceId;
    const cliente = trabajoExistente[0].cliente;

    // 2. ACTUALIZACIÓN MÁSTER: Guardamos la fecha utilizando la clave recuperada exacta
    await db.update(Trabajo)
      .set({ fechaSalida: nuevaFecha })
      .where(eq(Trabajo.numParte, numParteStr));

    // 3. INSERCIÓN DE AUDITORÍA: Si la fecha ha cambiado realmente, grabamos la huella del operario
    if (fechaAnterior !== nuevaFecha) {
      try {
        // Extraemos con seguridad el nombre de sesión de Google o el correo
        const usuarioActivo = String(locals.user?.name || locals.user?.email || "Alex");
        
        await db.insert(RegistroActividad).values({
          usuario: usuarioActivo,
          workspaceId: workspaceId || 'general',
          tipo: 'update',
          accion: 'Cambio de Fecha',
          detalles: `Modificó la entrega del parte #${numParteStr} (${cliente || 'Sin Cliente'}) de "${fechaAnterior}" a "${nuevaFecha}".`
        });
      } catch (logError: any) {
        // Escudo de protección: Si la auditoría falla en desarrollo, el calendario NO se cae
        console.warn("⚠️ Advertencia: No se pudo registrar la actividad de auditoría:", logError.message);
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error: any) {
    console.error("❌ ERROR CRÍTICO EN API actualizar-fecha:", error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};