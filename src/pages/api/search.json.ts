import type { APIRoute } from 'astro';
import { db, Trabajo, like, or, eq, and, sql } from 'astro:db';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const workspace = url.searchParams.get('workspace') || 'produccion';
  const queryClean = query.toLowerCase().trim();

  // Si la búsqueda es muy corta, devolvemos un set vacío instantáneo
  if (queryClean.length < 2) {
    return new Response(JSON.stringify({ clientes: [], tareas: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Condiciones base de texto para el buscador (cliente, descripción o numParte)
    const condicionesBusqueda = [
      like(Trabajo.numParte, `%${queryClean}%`),
      like(Trabajo.cliente, `%${queryClean}%`),
      like(Trabajo.descripcionGeneral, `%${queryClean}%`)
    ];

    // Ejecutamos una sola query controlada filtrando por el entorno activo
    const resultados = await db
      .select()
      .from(Trabajo)
      .where(
        and(
          eq(Trabajo.workspaceId, workspace),
          or(...condicionesBusqueda)
        )
      )
      .limit(30);

    // Diccionarios en memoria para segregar de forma veloz
    const clientesUnicos = new Map();
    const tareasCoincidentes = [];

    for (const t of resultados) {
      // 1. Agrupamos clientes únicos
      if (t.cliente.toLowerCase().includes(queryClean) && clientesUnicos.size < 4) {
        clientesUnicos.set(t.cliente, { nombre: t.cliente });
      }
      
      // 2. Almacenamos el parte detallado para la ventana modal
      if (tareasCoincidentes.length < 6) {
        tareasCoincidentes.push({
          numParte: t.numParte,
          cliente: t.cliente,
          descripcionGeneral: t.descripcionGeneral,
          estado: t.estado,
          comercial: t.comercial,
          diseñador: t.diseñador,
          fechaSalida: t.fechaSalida,
          area: t.area,
          subcontrata: t.subcontrata
        });
      }
    }

    return new Response(JSON.stringify({
      clientes: Array.from(clientesUnicos.values()),
      tareas: tareasCoincidentes
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en el motor SQL predictor:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};