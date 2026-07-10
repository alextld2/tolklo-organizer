// src/pages/api/auth/callback.ts
import type { APIRoute } from 'astro';
import { db, RegistroActividad } from 'astro:db';
import { createSessionToken } from '../../../utils/auth';

export const prerender = false; // Forzamos carga en vivo en el servidor (SSR)

const limpiarVariable = (val: string | undefined): string => {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
};

export const GET: APIRoute = async ({ request, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  // Leemos la cookie de estado temporal
  const savedState = cookies.get('oauth_state')?.value;

  // 1. Validar el state de seguridad contra ataques CSRF
  if (!state || !savedState || state !== savedState) {
    return new Response('Ataque CSRF detectado o la sesión de login expiró. Por favor intente de nuevo desde /login.', { status: 400 });
  }

  if (!code) {
    return new Response('No se recibió el código de autorización de Google.', { status: 400 });
  }

  // Obtenemos y limpiamos las credenciales de entorno
  const rawClientId = import.meta.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const rawClientSecret = import.meta.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  
  const clientId = limpiarVariable(rawClientId);
  const clientSecret = limpiarVariable(rawClientSecret);
  
  // Unificación robusta de URLs
  let siteUrl = limpiarVariable(
    import.meta.env.SITE_URL || process.env.SITE_URL || 
    import.meta.env.SITE || process.env.SITE ||
    'http://localhost:4321'
  );
  if (siteUrl.endsWith('/')) {
    siteUrl = siteUrl.slice(0, -1);
  }
  const redirectUri = `${siteUrl}/api/auth/callback`;

  try {
    // 2. Intercambiamos el código por tokens en los servidores de Google
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorPayload = await tokenResponse.json().catch(() => ({}));
      console.error('❌ ERROR CRÍTICO DEVUELTO POR GOOGLE:', errorPayload);
      const mensajeDetallado = errorPayload.error_description 
        ? `${errorPayload.error}: ${errorPayload.error_description}` 
        : JSON.stringify(errorPayload);
      throw new Error(`Google rechazó el canje de tokens. Motivo: "${mensajeDetallado}"`);
    }

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    // 3. Solicitar el perfil del usuario autenticado a Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userResponse.ok) {
      throw new Error('Fallo al descargar el perfil del usuario de Google.');
    }

    const googleUser = await userResponse.json();
    const { email, name, picture } = googleUser;

    // 🔒 RESTRICCIÓN DE SEGURIDAD EXCLUSIVA: SOLO EMAIL @AEROPRINT.ES
    if (!email || !email.toLowerCase().endsWith('@aeroprint.es')) {
      console.warn(`⚠️ INTENTO DE ACCESO NO AUTORIZADO: Se bloqueó el inicio de sesión para la cuenta externa: ${email}`);
      try {
        await db.insert(RegistroActividad).values({
          usuario: name || email,
          workspaceId: 'general',
          tipo: 'SECURITY_ALERT',
          accion: 'Acceso Bloqueado',
          detalles: `Intento de inicio de sesión con correo ajeno a la empresa: ${email}`
        });
      } catch (auditError) {
        console.error('No se pudo escribir la auditoría de acceso bloqueado:', auditError);
      }

      return new Response(
        'Acceso denegado: Tolklo+ Organizer es de uso exclusivo para cuentas de correo corporativas de @aeroprint.es.', 
        { status: 403 }
      );
    }

    const sessionToken = createSessionToken({ email, name, picture });

    // 4. REGISTRO DE ACTIVIDAD: Guardamos la auditoría de acceso en Astro DB
    try {
      await db.insert(RegistroActividad).values({
        usuario: name || email,
        workspaceId: 'general',
        tipo: 'AUTH',
        accion: 'Inicio de Sesión',
        detalles: `Acceso concedido correctamente.`
      });
    } catch (auditError) {
      console.error('No se pudo escribir la auditoría de acceso:', auditError);
    }

    // 🛡️ REDIRECCIÓN MUTABLE CON BYPASS DE COOKIES DE ASTRO:
    // Creamos cabeceras puras y agregamos múltiples 'Set-Cookie' de manera nativa sin pasar por Astro cookies helper.
    const headers = new Headers();
    headers.set('Location', `${siteUrl}/w/produccion`);
    
    const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure;' : '';
    // Borramos oauth_state y escribimos el nuevo session_token de sesión
    headers.append('Set-Cookie', `oauth_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; ${secureFlag} SameSite=Lax`);
    headers.append('Set-Cookie', `session_token=${sessionToken}; Path=/; HttpOnly; ${secureFlag} Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`);

    return new Response(null, {
      status: 302,
      headers
    });

  } catch (error: any) {
    console.error('Error crítico en el flujo:', error.message);
    return new Response(
      `Error de Autenticación: ${error.message}. Por favor, vuelve a intentar el acceso desde ${siteUrl}/login`, 
      { status: 500 }
    );
  }
};