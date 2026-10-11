// src/pages/api/escandallo/config.ts
import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";
import { 
  DEFAULT_CONFIGURACION_ESCANDALLO, 
  type ConfiguracionEscandalloCompleta 
} from "$lib/escandallo-config";

export const prerender = false;

// Ruta del archivo persistente en el servidor
const CONFIG_FILE_PATH = path.resolve(process.cwd(), "src/data/escandallo-config.json");

async function obtenerConfiguracionPersistente(): Promise<ConfiguracionEscandalloCompleta> {
  try {
    const contenido = await fs.readFile(CONFIG_FILE_PATH, "utf-8");
    const parsed = JSON.parse(contenido);
    if (parsed && Array.isArray(parsed.papeles) && parsed.acabados && Array.isArray(parsed.maquinas)) {
      return parsed;
    }
    throw new Error("Formato inválido");
  } catch (err: any) {
    // Si no existe o da error, aseguramos la carpeta y creamos el archivo por defecto
    try {
      await fs.mkdir(path.dirname(CONFIG_FILE_PATH), { recursive: true });
      await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(DEFAULT_CONFIGURACION_ESCANDALLO, null, 2), "utf-8");
    } catch (writeErr) {
      console.warn("No se pudo escribir archivo inicial de configuración de escandallo:", writeErr);
    }
    return DEFAULT_CONFIGURACION_ESCANDALLO;
  }
}

async function guardarConfiguracionPersistente(config: ConfiguracionEscandalloCompleta): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_FILE_PATH), { recursive: true });
  await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export const GET: APIRoute = async () => {
  try {
    const configuracion = await obtenerConfiguracionPersistente();
    return new Response(JSON.stringify({ ok: true, configuracion }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Error al obtener configuración de escandallo:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    if (body.reset === true) {
      const resetConfig: ConfiguracionEscandalloCompleta = {
        ...DEFAULT_CONFIGURACION_ESCANDALLO,
        actualizadoEn: new Date().toISOString()
      };
      await guardarConfiguracionPersistente(resetConfig);
      return new Response(JSON.stringify({ ok: true, configuracion: resetConfig, mensaje: "Valores restablecidos de fábrica" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (!body.configuracion) {
      return new Response(JSON.stringify({ ok: false, error: "Datos de configuración no proporcionados" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const nuevaConfig: ConfiguracionEscandalloCompleta = {
      ...body.configuracion,
      actualizadoEn: new Date().toISOString()
    };

    // Validaciones básicas de integridad
    if (!Array.isArray(nuevaConfig.papeles) || !nuevaConfig.acabados || !Array.isArray(nuevaConfig.maquinas)) {
      return new Response(JSON.stringify({ ok: false, error: "Estructura de configuración incompleta o corrupta" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await guardarConfiguracionPersistente(nuevaConfig);

    return new Response(JSON.stringify({ ok: true, configuracion: nuevaConfig, mensaje: "Tarifas guardadas correctamente en servidor" }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Error al guardar configuración de escandallo:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
