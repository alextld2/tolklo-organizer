// src/pages/api/presupuestos/convertir.ts
import { 
  db, 
  Presupuesto, 
  LineaPresupuesto, 
  Albaran, 
  LineaAlbaran, 
  Factura, 
  LineaFactura, 
  RegistroActividad, 
  eq, 
  desc 
} from 'astro:db';
import type { APIRoute } from 'astro';
import { generarCodigoDocumento } from '$lib/fiscal-utils';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { presupuestoId, destino = 'albaran' } = body; // 'albaran' o 'factura'

    if (!presupuestoId) {
      return new Response(JSON.stringify({ error: 'Falta el ID del presupuesto' }), { status: 400 });
    }

    const presupuestos = await db
      .select()
      .from(Presupuesto)
      .where(eq(Presupuesto.id, Number(presupuestoId)));

    const presupuesto = presupuestos[0];
    if (!presupuesto) {
      return new Response(JSON.stringify({ error: 'Presupuesto no encontrado' }), { status: 404 });
    }

    const lineas = await db
      .select()
      .from(LineaPresupuesto)
      .where(eq(LineaPresupuesto.presupuestoId, presupuesto.id));

    const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';

    if (destino === 'albaran') {
      const serie = 'ALB26';
      const albaranesExistentes = await db
        .select()
        .from(Albaran)
        .where(eq(Albaran.serie, serie))
        .orderBy(desc(Albaran.numero));

      const nuevoNumero = (albaranesExistentes[0]?.numero || 0) + 1;
      const codigo = generarCodigoDocumento(serie, nuevoNumero);

      const nuevoAlbaranRes = await db.insert(Albaran).values({
        workspaceId: presupuesto.workspaceId,
        serie,
        numero: nuevoNumero,
        codigo,
        cliente: presupuesto.cliente,
        clienteNif: presupuesto.clienteNif,
        clienteDireccion: presupuesto.clienteDireccion,
        fecha: new Date().toISOString().split('T')[0],
        estado: 'Pendiente',
        presupuestoIdVinculado: presupuesto.id,
        numParteTrabajoVinculado: presupuesto.numParteTrabajoVinculado,
        baseImponible: presupuesto.baseImponible,
        total: presupuesto.total
      }).returning();

      const albaranId = nuevoAlbaranRes[0]?.id;

      for (let i = 0; i < lineas.length; i++) {
        await db.insert(LineaAlbaran).values({
          albaranId,
          descripcion: lineas[i].descripcion,
          cantidad: lineas[i].cantidad,
          precioUnitario: lineas[i].precioUnitario,
          totalLinea: lineas[i].totalLinea,
          orden: i + 1
        });
      }

      await db
        .update(Presupuesto)
        .set({ estado: 'Albaranado' })
        .where(eq(Presupuesto.id, presupuesto.id));

      await db.insert(RegistroActividad).values({
        usuario: usuarioLogueado,
        workspaceId: presupuesto.workspaceId,
        tipo: 'CREATE',
        accion: 'Convertir Presupuesto a Albarán',
        detalles: `Presupuesto ${presupuesto.codigo} convertido en Albarán ${codigo}.`
      });

      return new Response(JSON.stringify({ success: true, codigo, tipo: 'albaran' }), { status: 200 });
    } 
    
    if (destino === 'factura') {
      const serie = 'F26';
      const facturasExistentes = await db
        .select()
        .from(Factura)
        .where(eq(Factura.serie, serie))
        .orderBy(desc(Factura.numero));

      const nuevoNumero = (facturasExistentes[0]?.numero || 0) + 1;
      const numeroFacturaCompleto = generarCodigoDocumento(serie, nuevoNumero);

      const nuevaFacturaRes = await db.insert(Factura).values({
        workspaceId: presupuesto.workspaceId,
        serie,
        numero: nuevoNumero,
        numeroFacturaCompleto,
        tipoFactura: 'F1',
        cliente: presupuesto.cliente,
        clienteNif: presupuesto.clienteNif || '00000000T',
        clienteDireccion: presupuesto.clienteDireccion,
        fechaExpedicion: new Date().toISOString().split('T')[0],
        horaExpedicion: new Date().toTimeString().split(' ')[0],
        estado: 'Borrador',
        baseImponible: presupuesto.baseImponible,
        tipoIva: presupuesto.tipoIva,
        cuotaIva: presupuesto.cuotaIva,
        tipoRetencionIrpf: presupuesto.tipoRetencionIrpf,
        cuotaRetencionIrpf: presupuesto.cuotaRetencionIrpf,
        totalFactura: presupuesto.total,
        presupuestoIdVinculado: presupuesto.id,
        numParteTrabajoVinculado: presupuesto.numParteTrabajoVinculado
      }).returning();

      const facturaId = nuevaFacturaRes[0]?.id;

      for (let i = 0; i < lineas.length; i++) {
        await db.insert(LineaFactura).values({
          facturaId,
          descripcion: lineas[i].descripcion,
          cantidad: lineas[i].cantidad,
          precioUnitario: lineas[i].precioUnitario,
          descuentoPorcentaje: lineas[i].descuentoPorcentaje,
          tipoIva: lineas[i].tipoIva,
          totalLinea: lineas[i].totalLinea,
          orden: i + 1
        });
      }

      await db
        .update(Presupuesto)
        .set({ estado: 'Facturado' })
        .where(eq(Presupuesto.id, presupuesto.id));

      await db.insert(RegistroActividad).values({
        usuario: usuarioLogueado,
        workspaceId: presupuesto.workspaceId,
        tipo: 'CREATE',
        accion: 'Convertir Presupuesto a Factura',
        detalles: `Presupuesto ${presupuesto.codigo} convertido en borrador de Factura ${numeroFacturaCompleto}.`
      });

      return new Response(JSON.stringify({ success: true, numeroFacturaCompleto, tipo: 'factura' }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Destino no válido' }), { status: 400 });
  } catch (error: any) {
    console.error('Error al convertir presupuesto:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
