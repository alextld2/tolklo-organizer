// src/pages/api/auth/logout.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  // Eliminamos la cookie de sesión del navegador
  cookies.delete('session_token', { path: '/' });
  
  const siteUrl = import.meta.env.SITE_URL || process.env.SITE_URL || 'http://localhost:4321';
  
  // Devolvemos al usuario a la página de inicio
  return Response.redirect(`${siteUrl}/login`, 302);
};