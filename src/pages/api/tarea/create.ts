// src/pages/api/tarea.ts
import type { APIRoute } from 'astro';
import { db, Trabajo, DesgloseTrabajo } from 'astro:db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { numParte, workspaceId, cliente, descripcionGeneral, comercial, fechaSalida, area, desgloses } = body;

    // 1. Inserción de la cabecera del parte en la tabla Trabajo
    await db.insert(Trabajo).values({
      numParte,
      workspaceId,
      cliente,
      descripcionGeneral: descripcionGeneral || null,
      comercial: comercial || null,
      diseñador: null, // Se asigna posteriormente en taller
      fechaSalida,
      estado: 'Por hacer', // Todo parte arranca siempre en la cola de planta
      area,
      subcontrata: null
    });

    // 2. Inserción dinámica de las líneas de desglose relacionales
    if (desgloses && desgloses.length > 0) {
      for (const item of desgloses) {
        if (item.descripcionProducto) {
          await db.insert(DesgloseTrabajo).values({
            numParte, // Clave de relación de texto ("26-0001")
            descripcionProducto: item.descripcionProducto,
            cantidad: item.cantidad || 0
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error("❌ Error en Astro DB:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};