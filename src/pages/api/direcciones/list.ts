// src/pages/api/direcciones/list.ts
import type { APIRoute } from 'astro';
import { db, DireccionCliente, eq } from 'astro:db';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    try {
        const cliente = url.searchParams.get('cliente');

        if (!cliente) {
            return new Response(JSON.stringify({ error: 'El parámetro cliente es obligatorio.' }), { status: 400 });
        }

        const direcciones = await db
            .select()
            .from(DireccionCliente)
            .where(eq(DireccionCliente.cliente, cliente));

        return new Response(JSON.stringify(direcciones), {
            status: 200,
            headers: {
                'content-type': 'application/json'
            }
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
