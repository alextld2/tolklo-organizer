// src/pages/api/auth/logout.ts
import type { APIRoute } from 'astro';

export const prerender = false;

const limpiarVariable = (val: string | undefined): string => {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

export const GET: APIRoute = async () => {
  let siteUrl = limpiarVariable(
    import.meta.env.SITE_URL || process.env.SITE_URL || 
    import.meta.env.SITE || process.env.SITE ||
    'http://localhost:4321'
  );
  if (siteUrl.endsWith('/')) {
    siteUrl = siteUrl.slice(0, -1);
  }
  
  // 🛡️ BORRADO DE COOKIES MUTABLE CON BYPASS DE ASTRO
  const headers = new Headers();
  headers.set('Location', `${siteUrl}/login`);
  
  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
  headers.set('Set-Cookie', `session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; ${secureFlag} SameSite=Lax`);
  
  return new Response(null, {
    status: 302,
    headers
  });
};