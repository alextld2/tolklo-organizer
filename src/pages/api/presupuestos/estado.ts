// src/pages/api/presupuestos/estado.ts
import type { APIRoute } from 'astro';
import { db, Presupuesto, LineaPresupuesto, Trabajo, DesgloseTrabajo, RegistroActividad, eq } from 'astro:db';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { presupuestoId, nuevoEstado } = body;

    if (!presupuestoId || !nuevoEstado) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros requeridos (presupuestoId, nuevoEstado)' }), { status: 400 });
    }

    const idNum = Number(presupuestoId);
    const presupuestos = await db.select().from(Presupuesto).where(eq(Presupuesto.id, idNum));
    const presupuesto = presupuestos[0];

    if (!presupuesto) {
      return new Response(JSON.stringify({ error: 'Presupuesto no encontrado' }), { status: 404 });
    }

    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';
    let numParteGenerado: string | null = null;
    let mensajeRespuesta = `Estado actualizado a "${nuevoEstado}".`;

    // 🔥 SI EL ESTADO ES ACEPTADO: Conexión automática con Imprenta / Taller
    if (nuevoEstado === 'Aceptado') {
      if (!presupuesto.numParteTrabajoVinculado) {
        // 1. Calcular el siguiente número de parte para el año actual (ej: "26-1824")
        const añoActual = new Date().getFullYear().toString().slice(-2);
        const prefijo = `${añoActual}-`;
        const todosTrabajos = await db.select({ numParte: Trabajo.numParte }).from(Trabajo);
        const partesDelAño = todosTrabajos
          .map(t => t.numParte)
          .filter(num => num && num.startsWith(prefijo));

        let maxNum = 0;
        for (const p of partesDelAño) {
          const parts = p.split('-');
          const n = parts[1] ? parseInt(parts[1], 10) : 0;
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }

        const proximoNumero = maxNum > 0 ? maxNum + 1 : 1;
        const numParte = `${prefijo}${proximoNumero.toString().padStart(4, '0')}`;
        numParteGenerado = numParte;

        // 2. Traer líneas de presupuesto para desglosar productos
        const lineas = await db.select().from(LineaPresupuesto).where(eq(LineaPresupuesto.presupuestoId, idNum));

        // 3. Calcular fecha de entrega por defecto (+5 días naturales)
        const d = new Date();
        d.setDate(d.getDate() + 5);
        const fechaSalida = d.toISOString().split('T')[0];

        // 4. Construir descripción general comercial
        const descGen = presupuesto.descripcionGeneral || 
          (lineas.length > 0 ? lineas.map(l => `${l.descripcion} (${l.cantidad} uds)`).join(', ') : `Trabajo derivado de Presupuesto ${presupuesto.codigo}`);

        // 5. Insertar trabajo en cola de taller (Trabajo)
        await db.insert(Trabajo).values({
          numParte,
          workspaceId: presupuesto.workspaceId || 'produccion',
          cliente: presupuesto.cliente,
          descripcionGeneral: descGen,
          comercial: usuarioLogueado !== 'Sistema' ? usuarioLogueado : null,
          diseñador: null,
          fechaSalida,
          estado: 'Por hacer',
          area: 'DIGITAL',
          subcontrata: null,
          prioridad: 'Normal',
          ordenCola: 0
        });

        // 6. Insertar desgloses de productos en DesgloseTrabajo
        if (lineas.length > 0) {
          for (const l of lineas) {
            await db.insert(DesgloseTrabajo).values({
              numParte,
              descripcionProducto: l.descripcion,
              cantidad: l.cantidad || 1
            });
          }
        } else {
          await db.insert(DesgloseTrabajo).values({
            numParte,
            descripcionProducto: descGen,
            cantidad: 1
          });
        }

        // 7. Actualizar presupuesto con el estado Aceptado y el numParte vinculado
        await db.update(Presupuesto).set({
          estado: 'Aceptado',
          numParteTrabajoVinculado: numParte
        }).where(eq(Presupuesto.id, idNum));

        // 8. Registro de auditoría
        await db.insert(RegistroActividad).values({
          usuario: usuarioLogueado,
          workspaceId: presupuesto.workspaceId || 'produccion',
          tipo: 'CREATE',
          accion: 'Presupuesto Aceptado -> Parte de Trabajo',
          detalles: `El presupuesto ${presupuesto.codigo} fue ACEPTADO y generó automáticamente el Parte de Trabajo #${numParte} para ${presupuesto.cliente}.`
        });

        mensajeRespuesta = `¡Presupuesto aceptado! Se ha generado automáticamente el Parte de Trabajo #${numParte} en imprenta.`;
      } else {
        // Ya tenía parte vinculado, solo actualizar estado
        await db.update(Presupuesto).set({
          estado: 'Aceptado'
        }).where(eq(Presupuesto.id, idNum));

        numParteGenerado = presupuesto.numParteTrabajoVinculado;
        mensajeRespuesta = `Presupuesto marcado como Aceptado (ya vinculado al Parte #${presupuesto.numParteTrabajoVinculado}).`;
      }
    } else {
      // Cambio a cualquier otro estado (Borrador, Enviado, Rechazado, Cancelado)
      await db.update(Presupuesto).set({
        estado: nuevoEstado
      }).where(eq(Presupuesto.id, idNum));

      await db.insert(RegistroActividad).values({
        usuario: usuarioLogueado,
        workspaceId: presupuesto.workspaceId || 'produccion',
        tipo: 'UPDATE',
        accion: 'Cambio de Estado Presupuesto',
        detalles: `El presupuesto ${presupuesto.codigo} cambió su estado de "${presupuesto.estado}" a "${nuevoEstado}".`
      });
    }

    return new Response(JSON.stringify({
      success: true,
      ok: true,
      nuevoEstado,
      numParte: numParteGenerado,
      mensaje: mensajeRespuesta
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al actualizar estado del presupuesto:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
