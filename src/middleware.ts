// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { verifySessionToken } from './utils/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // 🧑‍💻 DEV BYPASS: Activo en `npm run dev` para comodidad local.
  if (import.meta.env.DEV) {
    context.locals.user = {
      email: 'dev@local.dev',
      name: 'Dev Local',
      picture: '',
    };
  } else {
    // 🛡️ PRODUCCIÓN: Verificamos token criptográfico de sesión
    const token = context.cookies.get('session_token')?.value;
    let user = null;
    if (token) {
      user = verifySessionToken(token);
    }
    context.locals.user = user;

    const isPublicRoute = 
      pathname === '/login' || 
      pathname.startsWith('/api/auth/') || 
      pathname.startsWith('/_astro/') ||
      pathname.startsWith('/favicon') ||
      pathname === '/robots.txt';

    // 🛡️ REGLA 1: Rutas de API protegidas devuelven 401 si no hay sesión
    if (!user && pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
      return new Response(
        JSON.stringify({ error: 'No autorizado. Sesión no válida o expirada.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 🛡️ REGLA 2: Rutas privadas redirigen a /login si no hay sesión
    if (!user && !isPublicRoute) {
      return context.redirect('/login');
    }

    // 🛡️ REGLA 3: Si ya está autenticado e intenta acceder a /login o /, redirigir a producción
    if (user && (pathname === '/login' || pathname === '/')) {
      return context.redirect('/w/produccion');
    }
  }

  const response = await next();

  // 🛡️ CABECERAS DE SEGURIDAD HTTP (Protección contra Clickjacking, XSS, MIME sniffing)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
});