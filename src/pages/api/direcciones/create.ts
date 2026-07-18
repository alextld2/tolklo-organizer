// src/pages/api/direcciones/create.ts
import type { APIRoute } from 'astro';
import { db, DireccionCliente, RegistroActividad } from 'astro:db';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const body = await request.json();
        const { cliente, calle, ciudad, provincia, codigoPostal, pais, telefono, notas } = body;

        if (!cliente || !calle || !ciudad || !codigoPostal) {
            return new Response(JSON.stringify({ error: 'Faltan campos obligatorios: cliente, calle, ciudad, codigoPostal.' }), { status: 400 });
        }

        const usuarioLogueado = locals.user?.name || locals.user?.email || 'Sistema';

        const insertResult = await db.insert(DireccionCliente).values({
            cliente,
            calle,
            ciudad,
            provincia: provincia || null,
            codigoPostal,
            pais: pais || 'España',
            telefono: telefono || null,
            notas: notas || null,
        });

        // Registrar actividad en la auditoría
        await db.insert(RegistroActividad).values({
            usuario: usuarioLogueado,
            workspaceId: 'produccion', // Usamos valor por defecto o desde el body
            tipo: 'CREAR',
            accion: 'Nueva Dirección de Cliente',
            detalles: `Se registró una nueva dirección para el cliente ${cliente}: ${calle}, ${ciudad}.`
        });

        return new Response(JSON.stringify({ success: true, data: insertResult }), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
