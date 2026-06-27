// src/pages/api/nueva-tarea.ts
import { db, Trabajo, DesgloseTrabajo, eq } from 'astro:db';

// 1. 🔥 COLOCACIÓN DE LA FUNCIÓN: La dejamos aquí arriba, fuera del POST, como una herramienta de limpieza
const aTipoTitulo = (texto: string): string => {
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

export async function POST({ request }) {
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

    // 2. 🔥 APLICACIÓN DE LA FUNCIÓN: Transformamos los campos humanos a "Tipo Título" y limpiamos espacios con .trim()
    await db.insert(Trabajo).values({
      numParte: Number(body.numParte),
      workspaceId: body.workspaceId,
      
      // El cliente pasa de "gimnasio iron" a "Gimnasio Iron"
      cliente: aTipoTitulo(body.cliente.trim()), 
      
      // La descripción pasa de "camisetas dtf" a "Camisetas Dtf" (si existe)
      descripcionGeneral: body.descripcionGeneral ? aTipoTitulo(body.descripcionGeneral.trim()) : null,
      
      comercial: body.comercial || null,
      diseñador: body.diseñador || null,
      fechaSalida: body.fechaSalida,
      estado: body.estado || 'Pendiente',
      
      // Mantenemos las áreas técnicas en MAYÚSCULAS fijas (ej: DTF, MIMAKI)
      area: body.area || 'Digital', 
      
      // La subcontrata también la dejamos limpia en Tipo Título
      subcontrata: (body.subcontrata && body.subcontrata.trim() !== '') ? aTipoTitulo(body.subcontrata.trim()) : null,
    });

    // 3. 🔥 EN EL DESGLOSE: También limpiamos las líneas de productos a Tipo Título
    if (body.desgloses && body.desgloses.length > 0) {
      for (const item of body.desgloses) {
        if (item.descripcionProducto && item.cantidad !== null) {
          await db.insert(DesgloseTrabajo).values({
            numParte: Number(body.numParte),
            descripcionProducto: aTipoTitulo(item.descripcionProducto.trim()), // "Sobres Acolchados"
            cantidad: Number(item.cantidad)
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ message: 'Ha ocurrido un error inesperado en el taller. Inténtalo de nuevo.' }), 
      { status: 500 }
    );
  }
}