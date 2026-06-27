export const prerender = false;
import type { APIRoute } from 'astro';
import { db, Trabajo, DesgloseTrabajo, eq } from 'astro:db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { numParte } = body;

    if (!numParte) {
      return new Response(JSON.stringify({ success: false, message: 'Nº de parte requerido.' }), { status: 400 });
    }

    // Eliminamos de forma relacional limpia en cascada
    await db.delete(DesgloseTrabajo).where(eq(DesgloseTrabajo.numParte, Number(numParte)));
    await db.delete(Trabajo).where(eq(Trabajo.numParte, Number(numParte)));

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
  }
};