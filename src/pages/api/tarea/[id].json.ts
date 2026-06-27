import type { APIRoute } from 'astro';
import { db, Trabajo, DesgloseTrabajo, eq } from 'astro:db';

export const GET: APIRoute = async ({ params }) => {
  const id = Number(params.id);

  if (isNaN(id)) return new Response(null, { status: 400 });

  try {
    // Obtenemos la tarea
    const tarea = await db.select().from(Trabajo).where(eq(Trabajo.numParte, id)).get();
    
    if (!tarea) return new Response(null, { status: 404 });

    // Obtenemos sus productos desglosados
    const desgloses = await db.select().from(DesgloseTrabajo).where(eq(DesgloseTrabajo.numParte, id));

    return new Response(JSON.stringify({ ...tarea, desgloses }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(null, { status: 500 });
  }
};