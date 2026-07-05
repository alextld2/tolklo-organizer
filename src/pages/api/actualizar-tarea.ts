export const prerender = false;
import type { APIRoute } from 'astro';
// Importamos 'RegistroActividad' para dejar constancia de la autoría
import { db, Trabajo, DesgloseTrabajo, RegistroActividad, eq } from 'astro:db';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { numParte, cliente, descripcionGeneral, comercial, fechaSalida, estado, area, subcontrata, desgloses } = body;

    if (!numParte) {
      return new Response(JSON.stringify({ success: false, message: 'Nº de parte requerido.' }), { status: 400 });
    }

    // 1. EXTRAER ESTADO PREVIO: Interrogamos a Turso antes de sobreescribir los datos
    const trabajoExistente = await db.select().from(Trabajo).where(eq(Trabajo.numParte, Number(numParte)));
    
    if (trabajoExistente.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'No se encontró la orden de trabajo.' }), { status: 404 });
    }

    const estadoAnterior = trabajoExistente[0].estado;
    const workspaceId = trabajoExistente[0].workspaceId;
    const clienteAnterior = trabajoExistente[0].cliente;

    // 2. ACTUALIZACIÓN MÁSTER: Guardamos los datos del parte en la tabla principal
    await db.update(Trabajo)
      .set({
        cliente,
        descripcionGeneral,
        comercial: comercial === "" ? null : comercial,
        fechaSalida,
        estado,
        area,
        subcontrata: subcontrata === "" ? null : subcontrata
      })
      .where(eq(Trabajo.numParte, Number(numParte)));

    // 3. SINCRONIZACIÓN DE DESGLOSES (Líneas de producto 1:N)
    if (desgloses && Array.isArray(desgloses)) {
      // Limpiamos las líneas antiguas para evitar duplicados
      await db.delete(DesgloseTrabajo).where(eq(DesgloseTrabajo.numParte, Number(numParte)));

      // Filtramos líneas vacías e insertamos las nuevas actualizadas
      const desglosesValidos = desgloses.filter(d => d.descripcionProducto.trim() !== "" && d.cantidad !== null);
      if (desglosesValidos.length > 0) {
        await db.insert(DesgloseTrabajo).values(
          desglosesValidos.map((d, i) => ({
            // 🔥 CORREGIDO: Convertido a número puro (timestamp) para cumplir estrictamente con tu db/config.ts
            id: Date.now() + i, 
            numParte: Number(numParte),
            descripcionProducto: d.descripcionProducto,
            cantidad: Number(d.cantidad)
          }))
        );
      }
    }

    // 4. GENERACIÓN DE AUDITORÍA INTELIGENTE
    const usuarioActivo = locals.user ? locals.user.nombre : "Alex";

    if (estadoAnterior !== estado) {
      // ESCENARIO A: El operario ha realizado un cambio rápido de flujo operativo
      await db.insert(RegistroActividad).values({
        usuario: usuarioActivo,
        workspaceId: workspaceId,
        tipo: 'update',
        accion: 'Cambio de Estado',
        detalles: `Movió el parte #${numParte} (${cliente || clienteAnterior}) de "${estadoAnterior}" a "${estado}".`
      });
    } else {
      // ESCENARIO B: Se han editado especificaciones técnicas desde el Maxi-Modal
      await db.insert(RegistroActividad).values({
        usuario: usuarioActivo,
        workspaceId: workspaceId,
        tipo: 'update',
        accion: 'Modificación de Orden',
        detalles: `Actualizó las especificaciones técnicas y el desglose de productos del parte #${numParte} (${cliente || clienteAnterior}).`
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error("❌ ERROR EN API [actualizar-tarea]:", error);
    return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
  }
};