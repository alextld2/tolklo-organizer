// src/utils/auth.ts
import crypto from 'node:crypto';

// Se lee desde la variable de entorno JWT_SECRET — OBLIGATORIO en producción
const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET;

if (!JWT_SECRET && !import.meta.env.DEV) {
  throw new Error('⛔ JWT_SECRET no está configurado. La aplicación no puede iniciarse en producción sin esta variable de entorno.');
}

const SECRET = JWT_SECRET || 'dev-secret-local-no-usar-en-produccion';
const MASTER_KEY = crypto.createHash('sha256').update(SECRET).digest();

/**
 * Genera un token de sesión cifrado dinámicamente con AES-256-CBC de alta velocidad
 */
export function createSessionToken(user: { email: string; name: string; picture: string }): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', MASTER_KEY, iv);

  const payload = JSON.stringify({ user, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }); // 7 días
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Formato rápido v2: v2:iv:encrypted
  return `v2:${iv.toString('hex')}:${encrypted}`;
}

/**
 * Descifra el token de sesión de la cookie y comprueba su integridad y expiración
 */
export function verifySessionToken(token: string): { email: string; name: string; picture: string } | null {
  try {
    const parts = token.split(':');
    
    // ⚡ V2 súper veloz sin bloqueo de CPU
    if (parts.length === 3 && parts[0] === 'v2') {
      const iv = Buffer.from(parts[1], 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', MASTER_KEY, iv);
      let decrypted = decipher.update(parts[2], 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      const parsed = JSON.parse(decrypted);
      if (parsed.exp < Date.now()) return null;
      return parsed.user;
    }

    // Soporte legacy para tokens antiguos (salt:iv:data o iv:data)
    let saltHex: string, ivHex: string, encrypted: string;
    if (parts.length === 3) {
      [saltHex, ivHex, encrypted] = parts;
    } else if (parts.length === 2) {
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