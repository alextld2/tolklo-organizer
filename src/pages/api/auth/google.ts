// src/pages/api/auth/google.ts
import type { APIRoute } from 'astro';
import crypto from 'node:crypto';

export const prerender = false;

// Función de saneamiento de variables de entorno de Render
const limpiarVariable = (val: string | undefined): string => {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

export const GET: APIRoute = async () => {
  // Generamos un 'state' seguro para prevenir ataques CSRF
  const state = crypto.randomBytes(32).toString('hex');

  const clientId = limpiarVariable(import.meta.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID);
  
  // Soporte multivariable de Render para URL base
  let siteUrl = limpiarVariable(
    import.meta.env.SITE_URL || process.env.SITE_URL || 
    import.meta.env.SITE || process.env.SITE ||
    'http://localhost:4321'
  );
  
  if (siteUrl.endsWith('/')) {
    siteUrl = siteUrl.slice(0, -1);
  }
  
  const redirectUri = `${siteUrl}/api/auth/callback`;
  
  // Construimos la URL oficial de autenticación de Google
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid profile email')}` +
    `&state=${state}` +
    `&prompt=select_account`;

  console.log('--> [OAUTH INITIALIZED] Redirigiendo a Google con Bypass de Cookies.');

  // 🛡️ SOLUCIÓN DEFINITIVA CONTRA 'TypeError: immutable':
  // Bypass de cookies de Astro. Creamos cabeceras puras mutables para evitar bloqueos del servidor.
  const headers = new Headers();
  headers.set('Location', googleAuthUrl);
  
  // Seteamos la cookie de estado directamente usando la cabecera Set-Cookie estándar
  const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
  headers.set('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; ${secureFlag} Max-Age=600; SameSite=Lax`);

  return new Response(null, {
    status: 302,
    headers
  });
};