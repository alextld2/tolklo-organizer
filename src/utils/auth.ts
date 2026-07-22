// src/utils/auth.ts
import crypto from 'node:crypto';

// Se lee desde la variable de entorno JWT_SECRET — OBLIGATORIO en producción
const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET;

if (!JWT_SECRET && !import.meta.env.DEV) {
  throw new Error('⛔ JWT_SECRET no está configurado. La aplicación no puede iniciarse en producción sin esta variable de entorno.');
}

const SECRET = JWT_SECRET || 'dev-secret-local-no-usar-en-produccion';

/**
 * Genera un token de sesión cifrado dinámicamente con AES-256-CBC
 */
export function createSessionToken(user: { email: string; name: string; picture: string }): string {
  const salt = crypto.randomBytes(16); // 🔐 Salt aleatorio único por sesión
  const key = crypto.scryptSync(SECRET, salt, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  const payload = JSON.stringify({ user, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }); // 7 días
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Formato: salt:iv:encrypted (los 3 componentes necesarios para descifrar)
  return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted}`;
}

/**
 * Descifra el token de sesión de la cookie y comprueba su integridad y expiración
 */
export function verifySessionToken(token: string): { email: string; name: string; picture: string } | null {
  try {
    const parts = token.split(':');
    // Soporte para tokens nuevos (3 partes: salt:iv:data) y legacy (2 partes: iv:data)
    let saltHex: string, ivHex: string, encrypted: string;
    if (parts.length === 3) {
      [saltHex, ivHex, encrypted] = parts;
    } else if (parts.length === 2) {
      // Tokens legacy sin salt variable — usar salt estático de compatibilidad
      saltHex = 'legacy';
      [ivHex, encrypted] = parts;
    } else {
      return null;
    }

    const salt = saltHex === 'legacy' ? 'salt-aeroprint' : Buffer.from(saltHex, 'hex');
    const key = crypto.scryptSync(SECRET, salt, 32);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const parsed = JSON.parse(decrypted);
    if (parsed.exp < Date.now()) {
      return null; // Token expirado
    }
    return parsed.user;
  } catch {
    return null; // Token inválido o corrupto
  }
}