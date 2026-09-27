import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import db from '@astrojs/db';
import tailwindVite from '@tailwindcss/vite';
import node from '@astrojs/node'; // 1. Importamos el adaptador de Node
import path from 'node:path';

if (!process.env.ASTRO_DATABASE_FILE && !process.env.ASTRO_DB_REMOTE_URL) {
  process.env.ASTRO_DATABASE_FILE = 'file:./local.db';
}

// https://astro.build/config
export default defineConfig({
  // ⚡ ACTIVAMOS EL MOTOR EN MODO SERVIDOR DINÁMICO REAL-TIME
  output: 'server', 
  
  compressHTML: true,
  
  // 2. Le decimos a Astro que use Node en modo standalone para el USB y el NAS
  adapter: node({
    mode: 'standalone',
    bodySizeLimit: 25 * 1024 * 1024 // 25 MB máximo por request
  }),
  
  integrations: [svelte(), db()],
  vite: {
    plugins: [tailwindVite()],
    build: {
      cssMinify: true,
      minify: 'esbuild',
      reportCompressedSize: false
    },
    optimizeDeps: {
      include: ['lucide-svelte', 'bits-ui', 'clsx', 'tailwind-merge', '@internationalized/date']
    },
    ssr: {
      noExternal: ['bits-ui', '@internationalized/date']
    },
    resolve: {
      alias: {
        '$lib': path.resolve('./src/lib'),
        '@': path.resolve('./src')
      }
    }
  },
});