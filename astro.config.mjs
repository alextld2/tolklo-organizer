import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import db from '@astrojs/db';
import tailwindVite from '@tailwindcss/vite';
import node from '@astrojs/node'; // 1. Importamos el adaptador de Node

// https://astro.build/config
export default defineConfig({
  // ⚡ ACTIVAMOS EL MOTOR EN MODO SERVIDOR DINÁMICO REAL-TIME
  output: 'server', 
  
  // 2. Le decimos a Astro que use Node en modo standalone para el USB y el NAS
  adapter: node({
    mode: 'standalone'
  }),
  
  integrations: [svelte(), db()],
  vite: {
    plugins: [tailwindVite()],
  },
});