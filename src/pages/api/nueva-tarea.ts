// src/pages/api/nueva-tarea.ts
import { db, Trabajo, DesgloseTrabajo, RegistroActividad, eq } from 'astro:db';
import type { APIRoute } from 'astro';
import crypto from 'node:crypto';

// 1. COLOCACIÓN DE LA FUNCIÓN: Herramienta de limpieza formal
const aTipoTitulo = (texto: string): string => {
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // Validamos campos críticos obligatorios
    if (!body.numParte || !body.workspaceId || !body.cliente || !body.fechaSalida) {
      return new Response(
        JSON.stringify({ message: 'Por favor, rellena todos los campos marcados con asterisco (*).' }),
        { status: 400 }
      );
    }

    // Comprobamos si el número de parte ya existe en Astro DB
    const parteExistente = await db
      .select()
      .from(Trabajo)
      .where(eq(Trabajo.numParte, Number(body.numParte)));

    if (parteExistente.length > 0) {
      return new Response(
        JSON.stringify({
          code: 'DUPLICATE_NUM_PARTE',
          message: `El número de parte #${body.numParte} ya está asignado a otro trabajo en el taller. Por favor, revisa el número.`
        }),
        { status: 409 }
      );
    }

    const clienteFormateado = aTipoTitulo(body.cliente.trim());
    const areaTecnica = body.area || 'Digital';
    const descripcionFormateada = body.descripcionGeneral
      ? aTipoTitulo(body.descripcionGeneral.trim())
      : null;

    // 2. APLICACIÓN DE LA FUNCIÓN: Guardamos la cabecera limpia en la tabla máster
    await db.insert(Trabajo).values({
      numParte: Number(body.numParte),
      workspaceId: body.workspaceId,
      cliente: clienteFormateado,
      descripcionGeneral: descripcionFormateada,
      comercial: body.comercial || null,
      diseñador: body.diseñador || null,
      fechaSalida: body.fechaSalida,
      estado: body.estado || 'Por hacer',
      area: areaTecnica,
      subcontrata: (body.subcontrata && body.subcontrata.trim() !== '') ? aTipoTitulo(body.subcontrata.trim()) : null,
    });

    // 3. EN EL DESGLOSE: Sincronizamos los productos con IDs numéricos limpios a prueba de fallos
    if (body.desgloses && body.desgloses.length > 0) {
      let index = 0;
      for (const item of body.desgloses) {
        if (item.descripcionProducto && item.cantidad !== null) {
          await db.insert(DesgloseTrabajo).values({
            id: parseInt(crypto.randomUUID().replace(/-/g, '').slice(0, 13), 16), // ID único sin race conditions
            numParte: Number(body.numParte),
            descripcionProducto: aTipoTitulo(item.descripcionProducto.trim()),
            cantidad: Number(item.cantidad)
          });
        }
      }
    }

    // 4. 🔥 REGISTRO DE AUDITORÍA: Estampamos la creación del registro en el log
    const usuarioActivo = locals.user?.name || locals.user?.email || 'Sistema';

    await db.insert(RegistroActividad).values({
      usuario: usuarioActivo,
      workspaceId: body.workspaceId,
      tipo: 'create',
      accion: 'Creación de Orden',
      detalles: `Introdujo el nuevo parte #${body.numParte} para el cliente "${clienteFormateado}" asignado al departamento de ${areaTecnica}. Especificación: "${descripcionFormateada}".`
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    console.error("❌ ERROR EN API [nueva-tarea]:", error);
    return new Response(
      JSON.stringify({ message: 'Ha ocurrido un error inesperado en el taller. Inténtalo de nuevo.' }),
      { status: 500 }
    );
  }
};