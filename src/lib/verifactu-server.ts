// src/lib/verifactu-server.ts
import crypto from 'node:crypto';

/**
 * Genera la huella digital criptográfica SHA-256 para el registro de alta de facturación
 * conforme a las especificaciones técnicas de la Ley Antifraude y el RD 1007/2023 (Veri*factu).
 *
 * El encadenamiento con la factura inmediatamente anterior garantiza la inalterabilidad (tamper-evident).
 */
export function calcularHuellaVerifactu({
  emisorNif,
  numeroFacturaCompleto,
  fechaExpedicion,
  horaExpedicion,
  tipoFactura,
  cuotaIva,
  totalFactura,
  huellaHashAnterior
}: {
  emisorNif: string;
  numeroFacturaCompleto: string;
  fechaExpedicion: string;
  horaExpedicion?: string;
  tipoFactura: string;
  cuotaIva: number;
  totalFactura: number;
  huellaHashAnterior?: string | null;
}): string {
  const emisorSanitizado = (emisorNif || '').toUpperCase().trim();
  const numFacturaSanitizado = (numeroFacturaCompleto || '').trim();
  const fechaSanitizada = (fechaExpedicion || '').trim();
  const tipoSanitizado = (tipoFactura || 'F1').trim();
  const cuotaFormateada = cuotaIva.toFixed(2);
  const totalFormateado = totalFactura.toFixed(2);
  const huellaAnt = (huellaHashAnterior || '').trim();

  // Concatenación canónica según especificación de registro de alta SIF / AEAT
  const cadenaCanonica = [
    `IDEmisorFactura=${emisorSanitizado}`,
    `NumSerieFactura=${numFacturaSanitizado}`,
    `FechaExpedicionFactura=${fechaSanitizada}`,
    `TipoFactura=${tipoSanitizado}`,
    `CuotaTotal=${cuotaFormateada}`,
    `ImporteTotal=${totalFormateado}`,
    `HuellaRegistroAnterior=${huellaAnt}`
  ].join('&');

  return crypto.createHash('sha256').update(cadenaCanonica, 'utf8').digest('hex').toUpperCase();
}

/**
 * Genera el payload normalizado para el código QR de cotejo en la Sede Electrónica de la AEAT
 * según Orden HAC/1177/2024.
 */
export function generarQrPayloadVerifactu({
  emisorNif,
  numeroFacturaCompleto,
  fechaExpedicion,
  totalFactura,
  huellaHash
}: {
  emisorNif: string;
  numeroFacturaCompleto: string;
  fechaExpedicion: string;
  totalFactura: number;
  huellaHash: string;
}): string {
  const nif = encodeURIComponent((emisorNif || '').trim());
  const num = encodeURIComponent((numeroFacturaCompleto || '').trim());
  const fecha = encodeURIComponent((fechaExpedicion || '').trim());
  const total = encodeURIComponent(totalFactura.toFixed(2));
  const huellaCorta = encodeURIComponent((huellaHash || '').substring(0, 16));

  return `https://sede.agenciatributaria.gob.es/soporte-sistemas-facturacion/qr?nif=${nif}&num=${num}&fecha=${fecha}&total=${total}&huella=${huellaCorta}`;
}
