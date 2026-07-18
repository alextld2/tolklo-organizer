// src/pages/api/direcciones/delete.ts
import type { APIRoute } from 'astro';
import { db, DireccionCliente, RegistroActividad, eq } from 'astro:db';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: 'El ID de la dirección es obligatorio.' }), { status: 400 });
        }

        const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';

        // Obtener datos de la dirección antes de borrar para registro de auditoría
        const direccion = await db
            .select()
            .from(DireccionCliente)
            .where(eq(DireccionCliente.id, id))
            .get();

        if (!direccion) {
            return new Response(JSON.stringify({ error: 'La dirección no existe.' }), { status: 404 });
        }

        // Eliminar dirección
        await db.delete(DireccionCliente).where(eq(DireccionCliente.id, id));

        // Registrar actividad en la auditoría
        await db.insert(RegistroActividad).values({
            usuario: usuarioLogueado,
            workspaceId: 'produccion',
            tipo: 'BORRAR',
            accion: 'Eliminar Dirección de Cliente',
            detalles: `Se eliminó la dirección del cliente ${direccion.cliente}: ${direccion.calle}, ${direccion.ciudad}.`
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
