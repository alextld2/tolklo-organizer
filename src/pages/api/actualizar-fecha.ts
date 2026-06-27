export const prerender = false;
import type { APIRoute } from 'astro';
import { db, Trabajo, eq } from 'astro:db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    console.log("--> API [actualizar-fecha] ha recibido:", body);
    const { numParte, nuevaFecha } = body;

    if (!numParte || !nuevaFecha) {
      return new Response(JSON.stringify({ message: 'Faltan campos obligatorios: numParte o nuevaFecha' }), { status: 400 });
    }

    await db.update(Trabajo)
      .set({ fechaSalida: nuevaFecha })
      .where(eq(Trabajo.numParte, Number(numParte)));

    console.log(`--> ✅ Astro DB actualizado con éxito: Parte #${numParte} cambiado al ${nuevaFecha}`);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error("❌ ERROR EN CONTROLLER [actualizar-fecha]:", error);
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
};