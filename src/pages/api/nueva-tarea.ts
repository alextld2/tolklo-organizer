// src/pages/api/nueva-tarea.ts
// Importamos 'RegistroActividad' para el historial de auditoría
import { db, Trabajo, DesgloseTrabajo, RegistroActividad, eq } from 'astro:db';

// 1. COLOCACIÓN DE LA FUNCIÓN: Herramienta de limpieza formal
const aTipoTitulo = (texto: string): string => {
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

// 🔥 AÑADIDO: 'locals' en los parámetros para poder capturar al operario real
export async function POST({ request, locals }) {
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
    const descripcionFormateada = body.descripcionGeneral ? aTipoTitulo(body.descripcionGeneral.trim()) : 'Sin descripción';
    const areaTecnica = body.area || 'Digital';

    // 2. APLICACIÓN DE LA FUNCIÓN: Guardamos la cabecera limpia en la tabla máster
    await db.insert(Trabajo).values({
      numParte: Number(body.numParte),
      workspaceId: body.workspaceId,
      cliente: clienteFormateado, 
      descripcionGeneral: body.descripcionGeneral ? aTipoTitulo(body.descripcionGeneral.trim()) : null,
      comercial: body.comercial || null,
      diseñador: body.diseñador || null,
      fechaSalida: body.fechaSalida,
      estado: body.estado || 'Por hacer', // Sincronizado con vuestra nueva matriz de estados
      area: areaTecnica, 
      subcontrata: (body.subcontrata && body.subcontrata.trim() !== '') ? aTipoTitulo(body.subcontrata.trim()) : null,
    });

    // 3. EN EL DESGLOSE: Sincronizamos los productos con IDs numéricos limpios a prueba de fallos
    if (body.desgloses && body.desgloses.length > 0) {
      let index = 0;
      for (const item of body.desgloses) {
        if (item.descripcionProducto && item.cantidad !== null) {
          await db.insert(DesgloseTrabajo).values({
            id: Date.now() + index++, // Genera un ID numérico secuencial exacto
            numParte: Number(body.numParte),
            descripcionProducto: aTipoTitulo(item.descripcionProducto.trim()), 
            cantidad: Number(item.cantidad)
          });
        }
      }
    }

    // 4. 🔥 REGISTRO DE AUDITORÍA: Estampamos la creación del registro en el log
    const usuarioActivo = locals.user ? locals.user.nombre : "Alex"; // Captura tu sesión en la demo
    
    await db.insert(RegistroActividad).values({
      usuario: usuarioActivo,
      workspaceId: body.workspaceId,
      tipo: 'create',
      accion: 'Creación de Orden',
      detalles: `Introdujo el nuevo parte #${body.numParte} para el cliente "${clienteFormateado}" asignado al departamento de ${areaTecnica}. Especificación: "${descripcionFormateada}".`
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    console.error("❌ ERROR EN API [nueva-tarea]:", error);
    return new Response(
      JSON.stringify({ message: 'Ha ocurrido un error inesperado en el taller. Inténtalo de nuevo.' }), 
      { status: 500 }
    );
  }
}