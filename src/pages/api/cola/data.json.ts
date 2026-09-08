// src/pages/api/cola/data.json.ts
import { db, Trabajo, DesgloseTrabajo, eq, and, ne } from 'astro:db';
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const workspace = url.searchParams.get('workspace') || 'produccion';
    const incluirTerminados = url.searchParams.get('todos') === 'true';

    // Consultamos los trabajos
    let query = db
      .select()
      .from(Trabajo)
      .leftJoin(DesgloseTrabajo, eq(Trabajo.numParte, DesgloseTrabajo.numParte));

    const filasBD = incluirTerminados
      ? await query.where(eq(Trabajo.workspaceId, workspace))
      : await query.where(
          and(
            eq(Trabajo.workspaceId, workspace),
            ne(Trabajo.estado, 'Terminado')
          )
        );

    const tareasAgrupadas = new Map<string, any>();

    for (const fila of filasBD) {
      const t = fila.Trabajo;
      const d = fila.DesgloseTrabajo;

      if (!tareasAgrupadas.has(t.numParte)) {
        tareasAgrupadas.set(t.numParte, {
          numParte: t.numParte,
          cliente: t.cliente,
          descripcionGeneral: t.descripcionGeneral || '',
          comercial: t.comercial || '',
          diseñador: t.diseñador || '',
          estado: t.estado || 'Por hacer',
          fechaSalida: t.fechaSalida,
          area: t.area || '',
          subcontrata: t.subcontrata || '',
          prioridad: t.prioridad || 'Normal',
          ordenCola: t.ordenCola ?? 0,
          papelPortada: t.papelPortada || '',
          colorPortada: t.colorPortada || '',
          grapadoTipo: t.grapadoTipo || '',
          barnizUVTipo: t.barnizUVTipo || '',
          laminadoTipo: t.laminadoTipo || '',
          desgloses: []
        });
      }

      if (d && d.descripcionProducto) {
        tareasAgrupadas.get(t.numParte).desgloses.push({
          descripcionProducto: d.descripcionProducto,
          cantidad: d.cantidad
        });
      }
    }

    // Ordenamos primero por ordenCola ascendente (los menores van primero), luego por fechaSalida o numParte
    const lista = Array.from(tareasAgrupadas.values()).sort((a, b) => {
      // Si ambos tienen ordenCola definido (> 0)
      if (a.ordenCola > 0 && b.ordenCola > 0) {
        return a.ordenCola - b.ordenCola;
      }
      if (a.ordenCola > 0 && (!b.ordenCola || b.ordenCola === 0)) return -1;
      if (b.ordenCola > 0 && (!a.ordenCola || a.ordenCola === 0)) return 1;

      // Si tienen prioridad Urgente, van antes
      if (a.prioridad === 'Urgente' && b.prioridad !== 'Urgente') return -1;
      if (b.prioridad === 'Urgente' && a.prioridad !== 'Urgente') return 1;

      // Por fecha de salida más próxima
      if (a.fechaSalida && b.fechaSalida) {
        return a.fechaSalida.localeCompare(b.fechaSalida);
      }
      return 0;
    });

    return new Response(JSON.stringify({ 
      success: true, 
      total: lista.length, 
      timestamp: new Date().toISOString(),
      tareas: lista 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error: any) {
    console.error('❌ Error al obtener cola:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
