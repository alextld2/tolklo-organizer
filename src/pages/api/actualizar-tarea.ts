export const prerender = false;
import type { APIRoute } from 'astro';
import { db, Trabajo, DesgloseTrabajo, eq } from 'astro:db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { numParte, cliente, descripcionGeneral, comercial, fechaSalida, estado, area, subcontrata, desgloses } = body;

    if (!numParte) {
      return new Response(JSON.stringify({ success: false, message: 'Nº de parte requerido.' }), { status: 400 });
    }

    // 1. Actualizamos los datos del parte en la tabla principal
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

    // 2. Si el envío incluye un desglose de productos (desde el Maxi-Modal), los sincronizamos
    if (desgloses && Array.isArray(desgloses)) {
      // Limpiamos las líneas antiguas para evitar duplicados
      await db.delete(DesgloseTrabajo).where(eq(DesgloseTrabajo.numParte, Number(numParte)));

      // Filtramos líneas vacías e insertamos las nuevas actualizadas
      const desglosesValidos = desgloses.filter(d => d.descripcionProducto.trim() !== "" && d.cantidad !== null);
      if (desglosesValidos.length > 0) {
        await db.insert(DesgloseTrabajo).values(
          desglosesValidos.map((d, i) => ({
            id: `dg_${numParte}_rev_${Date.now()}_${i}`,
            numParte: Number(numParte),
            descripcionProducto: d.descripcionProducto,
            cantidad: Number(d.cantidad)
          }))
        );
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
  }
};