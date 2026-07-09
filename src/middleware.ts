// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken } from './utils/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const token = context.cookies.get('session_token')?.value;

  let user = null;
  if (token) {
    user = verifySessionToken(token);
  }

  // Almacenamos el perfil del usuario en context.locals para usarlo en cualquier archivo .astro
  context.locals.user = user;

  const isWorkspaceRoute = url.pathname.startsWith('/w/');
  const isLoginRoute = url.pathname === '/login';

  // 🛡️ REGLA DE PROTECCIÓN 1: Si no está logueado e intenta entrar en /w/* lo mandamos a login
  if (isWorkspaceRoute && !user) {
    return context.redirect('/login');
  }

  // 🛡️ REGLA DE PROTECCIÓN 2: Si ya está logueado e intenta ir a /login, lo mandamos a producción
  if (isLoginRoute && user) {
    return context.redirect('/w/produccion');
  }

  return next();
});