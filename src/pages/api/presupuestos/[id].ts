// src/pages/api/presupuestos/[id].ts
import type { APIRoute } from 'astro';
import { db, Presupuesto, LineaPresupuesto, RegistroActividad, eq } from 'astro:db';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(JSON.stringify({ error: 'El ID del presupuesto es obligatorio' }), { status: 400 });
    }

    const idNum = Number(id);
    const existentes = await db.select().from(Presupuesto).where(eq(Presupuesto.id, idNum));
    const pres = existentes[0];

    if (!pres) {
      return new Response(JSON.stringify({ error: 'Presupuesto no encontrado' }), { status: 404 });
    }

    if (pres.estado === 'Facturado') {
      return new Response(JSON.stringify({ error: 'No se puede eliminar un presupuesto que ya ha sido Facturado legalmente.' }), { status: 400 });
    }

    // 1. Eliminar líneas asociadas
    await db.delete(LineaPresupuesto).where(eq(LineaPresupuesto.presupuestoId, idNum));

    // 2. Eliminar cabecera
    await db.delete(Presupuesto).where(eq(Presupuesto.id, idNum));

    // 3. Auditoría
    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';
    await db.insert(RegistroActividad).values({
      usuario: usuarioLogueado,
      workspaceId: pres.workspaceId || 'produccion',
      tipo: 'DELETE',
      accion: 'Eliminar Presupuesto',
      detalles: `Se eliminó el presupuesto ${pres.codigo} de "${pres.cliente}" por importe ${pres.total.toFixed(2)} €.`
    });

    return new Response(JSON.stringify({ 
      success: true, 
      ok: true, 
      mensaje: `Presupuesto ${pres.codigo} eliminado correctamente.` 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al eliminar presupuesto:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
