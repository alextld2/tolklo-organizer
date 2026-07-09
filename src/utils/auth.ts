// src/utils/auth.ts
import crypto from 'node:crypto';

// Se lee desde la variable de entorno JWT_SECRET
const JWT_SECRET = import.meta.env.JWT_SECRET || process.env.JWT_SECRET || 'un-secreto-temporal-para-desarrollo-local-muy-largo';

/**
 * Genera un token de sesión cifrado dinámicamente con AES-256-CBC
 */
export function createSessionToken(user: { email: string; name: string; picture: string }): string {
  const key = crypto.scryptSync(JWT_SECRET, 'salt-aeroprint', 32);
  const iv = crypto.randomBytes(16); // IV aleatorio único por sesión
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  const payload = JSON.stringify({ user, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }); // Expiración: 7 días
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Descifra el token de sesión de la cookie y comprueba su integridad y expiración
 */
export function verifySessionToken(token: string): { email: string; name: string; picture: string } | null {
  try {
    const [ivHex, encrypted] = token.split(':');
    if (!ivHex || !encrypted) return null;
    
    const key = crypto.scryptSync(JWT_SECRET, 'salt-aeroprint', 32);
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const parsed = JSON.parse(decrypted);
    if (parsed.exp < Date.now()) {
      return null; // El token de sesión ha expirado
    }
    return parsed.user;
  } catch (error) {
    return null; // El token es falso, corrupto o incorrecto
  }
}