// src/pages/api/clientes/index.ts
import type { APIRoute } from 'astro';
import { db, Trabajo, Presupuesto, Factura, DireccionCliente, desc } from 'astro:db';

export const prerender = false;

export interface DireccionDetalle {
  id?: number;
  calle: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  pais?: string;
  telefono?: string;
  notas?: string;
  formateada: string;
}

export interface ClienteDetalle {
  nombre: string;
  nif: string;
  email: string;
  telefono: string;
  direccionPredeterminada: string;
  direcciones: DireccionDetalle[];
}

export const GET: APIRoute = async ({ url }) => {
  try {
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();

    // 1. Obtener registros de Trabajo, Presupuesto, Factura y DireccionCliente
    const [trabajos, presupuestos, facturas, direcciones] = await Promise.all([
      db.select({ cliente: Trabajo.cliente }).from(Trabajo),
      db.select({
        cliente: Presupuesto.cliente,
        nif: Presupuesto.clienteNif,
        email: Presupuesto.clienteEmail,
        telefono: Presupuesto.clienteTelefono,
        direccion: Presupuesto.clienteDireccion,
        id: Presupuesto.id
      }).from(Presupuesto).orderBy(desc(Presupuesto.id)),
      db.select({
        cliente: Factura.cliente,
        nif: Factura.clienteNif,
        email: Factura.clienteEmail,
        direccion: Factura.clienteDireccion,
        codigoPostal: Factura.clienteCodigoPostal,
        ciudad: Factura.clienteCiudad,
        provincia: Factura.clienteProvincia,
        id: Factura.id
      }).from(Factura).orderBy(desc(Factura.id)),
      db.select().from(DireccionCliente)
    ]);

    // Diccionario de clientes unificados (clave normalizada)
    const clientesMap = new Map<string, ClienteDetalle>();

    function getOrCreateCliente(nombreRaw: string): ClienteDetalle {
      const key = nombreRaw.trim().toLowerCase();
      if (!clientesMap.has(key)) {
        clientesMap.set(key, {
          nombre: nombreRaw.trim(),
          nif: '',
          email: '',
          telefono: '',
          direccionPredeterminada: '',
          direcciones: []
        });
      }
      return clientesMap.get(key)!;
    }

    // A. Registrar desde Trabajos
    for (const t of trabajos) {
      if (t.cliente && t.cliente.trim()) {
        getOrCreateCliente(t.cliente);
      }
    }

    // B. Rellenar datos desde Presupuestos (más recientes primero)
    for (const p of presupuestos) {
      if (p.cliente && p.cliente.trim()) {
        const c = getOrCreateCliente(p.cliente);
        if (!c.nif && p.nif) c.nif = p.nif.trim();
        if (!c.email && p.email) c.email = p.email.trim();
        if (!c.telefono && p.telefono) c.telefono = p.telefono.trim();
        if (!c.direccionPredeterminada && p.direccion) c.direccionPredeterminada = p.direccion.trim();
      }
    }

    // C. Rellenar datos desde Facturas
    for (const f of facturas) {
      if (f.cliente && f.cliente.trim()) {
        const c = getOrCreateCliente(f.cliente);
        if (!c.nif && f.nif) c.nif = f.nif.trim();
        if (!c.email && f.email) c.email = f.email.trim();
        
        let dirFactura = f.direccion || '';
        if (f.codigoPostal || f.ciudad) {
          dirFactura += `${dirFactura ? ', ' : ''}${f.codigoPostal || ''} ${f.ciudad || ''}${f.provincia ? ` (${f.provincia})` : ''}`.trim();
        }
        if (!c.direccionPredeterminada && dirFactura) {
          c.direccionPredeterminada = dirFactura;
        }
      }
    }

    // D. Incorporar direcciones formales registradas en DireccionCliente
    for (const d of direcciones) {
      if (d.cliente && d.cliente.trim()) {
        const c = getOrCreateCliente(d.cliente);
        const formateada = `${d.calle}, ${d.codigoPostal} ${d.ciudad}${d.provincia ? ` (${d.provincia})` : ''}, ${d.pais || 'España'}`.trim();
        
        c.direcciones.push({
          id: d.id,
          calle: d.calle,
          ciudad: d.ciudad,
          provincia: d.provincia || undefined,
          codigoPostal: d.codigoPostal,
          pais: d.pais || 'España',
          telefono: d.telefono || undefined,
          notas: d.notas || undefined,
          formateada
        });

        if (!c.telefono && d.telefono) c.telefono = d.telefono.trim();
        if (!c.direccionPredeterminada) {
          c.direccionPredeterminada = formateada;
        }
      }
    }

    // E. Asegurar que c.direccionPredeterminada esté en c.direcciones como primera opción
    for (const c of clientesMap.values()) {
      if (c.direccionPredeterminada) {
        const yaExiste = c.direcciones.some(d => 
          (d.formateada && d.formateada.toLowerCase() === c.direccionPredeterminada.toLowerCase()) ||
          (d.calle && d.calle.toLowerCase() === c.direccionPredeterminada.toLowerCase())
        );
        if (!yaExiste) {
          c.direcciones.unshift({
            calle: c.direccionPredeterminada,
            formateada: c.direccionPredeterminada
          });
        }
      }
    }

    // F. Filtrar por término de búsqueda si existe
    let lista = Array.from(clientesMap.values());
    if (q) {
      lista = lista.filter(c => 
        c.nombre.toLowerCase().includes(q) || 
        c.nif.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.telefono.toLowerCase().includes(q)
      );
    }

    // Ordenar alfabéticamente
    lista.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

    return new Response(JSON.stringify({ ok: true, clientes: lista }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error al obtener clientes:', error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
