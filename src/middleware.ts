// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;

  // 1. 🔥 CORREGIDO: 'null' primitivo, sin comillas corporales
  const correoLogueado = 'alex@tuempresa.com'; 
  
  let usuarioActivo = null;

  if (correoLogueado) {
    // 2. MATRIZ DE ROLES (RBAC): Definimos los permisos según la cuenta corporativa
    if (correoLogueado === "alex@tuempresa.com") {
      usuarioActivo = {
        id: "usr_01",
        nombre: "Alex",
        email: correoLogueado,
        rol: "admin",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
      };
    } else if (correoLogueado === "pepe@tuempresa.com") {
      usuarioActivo = {
        id: "usr_02",
        nombre: "Pepe",
        email: correoLogueado,
        rol: "viewer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
      };
    }
  }

  // Inyectamos el usuario en el contexto global de Astro
  context.locals.user = usuarioActivo;

  // 3. BARRERA DE SEGURIDAD INTERNA:
  if (url.pathname.startsWith('/w') && !usuarioActivo) {
    return redirect('/login');
  }

  return next();
});