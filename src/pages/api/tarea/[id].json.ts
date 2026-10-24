import type { APIRoute } from 'astro';
import { db, Trabajo, DesgloseTrabajo, eq } from 'astro:db';

export const GET: APIRoute = async ({ params }) => {
  const numParte = params.id ? String(params.id).trim() : '';

  if (!numParte) return new Response(null, { status: 400 });

  try {
    // Obtenemos la tarea y sus productos desglosados en paralelo
    const [tarea, desgloses] = await Promise.all([
      db.select().from(Trabajo).where(eq(Trabajo.numParte, numParte)).get(),
      db.select().from(DesgloseTrabajo).where(eq(DesgloseTrabajo.numParte, numParte))
    ]);
    
    if (!tarea) return new Response(null, { status: 404 });

    return new Response(JSON.stringify({ ...tarea, desgloses }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30'
      }
    });
  } catch (e) {
    return new Response(null, { status: 500 });
  }
};