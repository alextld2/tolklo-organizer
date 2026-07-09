// src/pages/api/auth/google.ts
import type { APIRoute } from 'astro';
import crypto from 'node:crypto';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  // Generamos un 'state' seguro para prevenir ataques CSRF
  const state = crypto.randomBytes(32).toString('hex');
  
  // Lo almacenamos temporalmente en las cookies del cliente por 10 minutos
  cookies.set('oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    sameSite: 'lax',
  });

  const clientId = import.meta.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const siteUrl = import.meta.env.SITE_URL || process.env.SITE_URL || 'http://localhost:4321';
  const redirectUri = `${siteUrl}/api/auth/callback`;
  
  // Construimos la URL oficial de autenticación de Google
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid profile email')}` +
    `&state=${state}` +
    `&prompt=select_account`;

  return Response.redirect(googleAuthUrl, 302);
};