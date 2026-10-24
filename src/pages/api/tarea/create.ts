// src/pages/api/tarea/create.ts
import type { APIRoute } from 'astro';
import { db, Trabajo, DesgloseTrabajo, RegistroActividad, eq, like } from 'astro:db';

export const prerender = false;

// Función auxiliar para calcular el siguiente correlativo libre para el año
async function obtenerSiguienteNumParte(prefijo: string): Promise<string> {
  const partesDelAño = await db
    .select({ numParte: Trabajo.numParte })
    .from(Trabajo)
    .where(like(Trabajo.numParte, `${prefijo}%`));

  let maxNum = 0;
  for (const p of partesDelAño) {
    if (p.numParte && p.numParte.startsWith(prefijo)) {
      const fragmento = p.numParte.split('-')[1];
      const n = fragmento ? parseInt(fragmento, 10) : 0;
      if (!isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }
  return `${prefijo}${(maxNum + 1).toString().padStart(4, '0')}`;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { 
      numParte: numParteSolicitado, workspaceId, cliente, descripcionGeneral, comercial, fechaSalida, area, desgloses,
      papelPortada, colorPortada, papelInterior, colorInterior, espiralColor, wireOColor,
      grapadoTipo, barnizUVTipo, estampingTipo, laminadoTipo,
      encuadernacion, acabados, tipoLaminadoCara1, tipoLaminadoCara2, subcontrata
    } = body;

    // 🛡️ Extraemos la autoría real del operario logueado
    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';

    // Determinar prefijo de año (ej: "26-")
    const añoActual = new Date().getFullYear().toString().slice(-2);
    const prefijoAño = numParteSolicitado && String(numParteSolicitado).includes('-')
      ? `${String(numParteSolicitado).split('-')[0]}-`
      : `${añoActual}-`;

    let numParteFinal = numParteSolicitado || await obtenerSiguienteNumParte(prefijoAño);
    let reasignadoPorConcurrencia = false;
    let guardado = false;
    let intentos = 0;
    const maxIntentos = 10;

    // Bucle atómico con reintento ante colisión de concurrencia
    while (!guardado && intentos < maxIntentos) {
      intentos++;

      // 1. Comprobamos si el número solicitado ya existe en Turso
      const existente = await db
        .select({ numParte: Trabajo.numParte })
        .from(Trabajo)
        .where(eq(Trabajo.numParte, numParteFinal))
        .limit(1);

      if (existente.length > 0) {
        // El número fue ocupado por otro operario; calculamos el siguiente libre
        reasignadoPorConcurrencia = true;
        numParteFinal = await obtenerSiguienteNumParte(prefijoAño);
      }

      try {
        // Insertamos la cabecera del parte de trabajo
        await db.insert(Trabajo).values({
          numParte: numParteFinal,
          workspaceId,
          cliente,
          descripcionGeneral: descripcionGeneral || null,
          comercial: comercial || null,
          diseñador: null,
          fechaSalida,
          estado: 'Por hacer',
          area, 
          subcontrata: subcontrata || null,
          papelPortada,
          colorPortada,
          papelInterior,
          colorInterior,
          espiralColor,
          wireOColor,
          grapadoTipo,
          barnizUVTipo,
          estampingTipo,
          laminadoTipo,
          encuadernacionJson: JSON.stringify(encuadernacion),
          acabadosJson: JSON.stringify(acabados),
          laminadoCara1Json: JSON.stringify(tipoLaminadoCara1),
          laminadoCara2Json: JSON.stringify(tipoLaminadoCara2)
        });

        guardado = true;
      } catch (insertErr: any) {
        const errorMsg = String(insertErr.message || insertErr);
        if (
          errorMsg.includes('UNIQUE') || 
          errorMsg.includes('constraint') || 
          insertErr.code === 'SQLITE_CONSTRAINT' ||
          insertErr.code === 'SQLITE_CONSTRAINT_PRIMARYKEY'
        ) {
          // Colisión de milisegundos en inserción concurrente: reintentamos
          reasignadoPorConcurrencia = true;
          numParteFinal = await obtenerSiguienteNumParte(prefijoAño);
          continue;
        }
        throw insertErr;
      }
    }

    if (!guardado) {
      throw new Error('No se pudo asignar un número de parte único tras múltiples intentos concurrentes.');
    }

    // 2. Líneas de desglose con el número final asignado
    if (desgloses && desgloses.length > 0) {
      for (const item of desgloses) {
        if (item.descripcionProducto) {
          const descProducto = item.subcontratado
            ? `${item.descripcionProducto} (Subcontratado${subcontrata ? `: ${subcontrata}` : ''})`
            : item.descripcionProducto;
          await db.insert(DesgloseTrabajo).values({
            numParte: numParteFinal,
            descripcionProducto: descProducto,
            cantidad: item.cantidad || 0
          });
        }
      }
    }

    // 3. Auditoría del evento
    const detalleActividad = reasignadoPorConcurrencia
      ? `Se registró el parte #${numParteFinal} para el cliente: ${cliente}. (Reasignado automáticamente desde #${numParteSolicitado} para evitar colisión concurrente).`
      : `Se registró el parte de trabajo #${numParteFinal} para el cliente: ${cliente}.`;

    await db.insert(RegistroActividad).values({
      usuario: usuarioLogueado,
      workspaceId,
      tipo: 'CREAR',
      accion: 'Nuevo Parte de Trabajo',
      detalles: detalleActividad
    });

    return new Response(JSON.stringify({ 
      success: true, 
      numParte: numParteFinal,
      reasignado: reasignadoPorConcurrencia,
      originalNumParte: numParteSolicitado
    }), { status: 200 });
  } catch (error: any) {
    console.error('Error al crear parte de trabajo:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};