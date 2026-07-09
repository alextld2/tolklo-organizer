// src/pages/api/tarea/create.ts
import type { APIRoute } from 'astro';
import { db, Trabajo, DesgloseTrabajo, RegistroActividad } from 'astro:db';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { 
      numParte, workspaceId, cliente, descripcionGeneral, comercial, fechaSalida, area, desgloses,
      papelPortada, colorPortada, papelInterior, colorInterior, espiralColor, wireOColor,
      grapadoTipo, barnizUVTipo, estampingTipo, laminadoTipo,
      encuadernacion, acabados, tipoLaminadoCara1, tipoLaminadoCara2
    } = body;

    // 🛡️ REGLA: Extraemos la autoría real del operario logueado desde context.locals
    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';

    // 1. Salvamos la ficha técnica completa en Turso
    await db.insert(Trabajo).values({
      numParte, workspaceId, cliente, descripcionGeneral: descripcionGeneral || null,
      comercial: comercial || null, diseñador: null, fechaSalida, estado: 'Por hacer', area, subcontrata: null,
      papelPortada, colorPortada, papelInterior, colorInterior, espiralColor, wireOColor,
      grapadoTipo, barnizUVTipo, estampingTipo, laminadoTipo,
      encuadernacionJson: JSON.stringify(encuadernacion),
      acabadosJson: JSON.stringify(acabados),
      laminadoCara1Json: JSON.stringify(tipoLaminadoCara1),
      laminadoCara2Json: JSON.stringify(tipoLaminadoCara2)
    });

    // 2. Líneas de desglose
    if (desgloses && desgloses.length > 0) {
      for (const item of desgloses) {
        if (item.descripcionProducto) {
          await db.insert(DesgloseTrabajo).values({
            numParte,
            descripcionProducto: item.descripcionProducto,
            cantidad: item.cantidad || 0
          });
        }
      }
    }

    // 3. 🔥 ¡AUDITORÍA AUTOMÁTICA EN ACCIÓN! 
    // Guardamos de forma real quién ha registrado el parte de trabajo con su nombre real de Google
    await db.insert(RegistroActividad).values({
      usuario: usuarioLogueado,
      workspaceId,
      tipo: 'CREAR',
      accion: 'Nuevo Parte de Trabajo',
      detalles: `Se registró el parte de trabajo #${numParte} para el cliente: ${cliente}.`
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};