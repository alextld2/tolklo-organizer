// src/lib/fiscal-utils.ts

export interface LineaCalculable {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje?: number;
  tipoIva?: number;
}

export interface TotalesFiscales {
  baseImponible: number;
  tipoIva: number;
  cuotaIva: number;
  tipoRecargoEquivalencia: number;
  cuotaRecargoEquivalencia: number;
  tipoRetencionIrpf: number;
  cuotaRetencionIrpf: number;
  total: number;
}

/**
 * Redondeo reglamentario a 2 decimales según Ley del IVA
 */
export function redondear(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calcula la base imponible, cuotas de IVA, recargo de equivalencia, retención IRPF y total final
 */
export function calcularTotalesDocumento(
  lineas: LineaCalculable[],
  tipoIvaDefecto: number = 21,
  tipoRetencionIrpf: number = 0,
  tipoRecargoEquivalencia: number = 0
): TotalesFiscales {
  let baseImponible = 0;

  for (const linea of lineas) {
    const cant = Number(linea.cantidad) || 0;
    const precio = Number(linea.precioUnitario) || 0;
    const desc = Number(linea.descuentoPorcentaje) || 0;
    const subtotalBruto = cant * precio;
    const subtotalConDescuento = subtotalBruto * (1 - desc / 100);
    baseImponible += subtotalConDescuento;
  }

  baseImponible = redondear(baseImponible);

  const tipoIva = Number(tipoIvaDefecto) || 21;
  const cuotaIva = redondear((baseImponible * tipoIva) / 100);

  const cuotaRecargo = tipoRecargoEquivalencia > 0 
    ? redondear((baseImponible * tipoRecargoEquivalencia) / 100)
    : 0;

  const cuotaRetencion = tipoRetencionIrpf > 0 
    ? redondear((baseImponible * tipoRetencionIrpf) / 100)
    : 0;

  const total = redondear(baseImponible + cuotaIva + cuotaRecargo - cuotaRetencion);

  return {
    baseImponible,
    tipoIva,
    cuotaIva,
    tipoRecargoEquivalencia,
    cuotaRecargoEquivalencia: cuotaRecargo,
    tipoRetencionIrpf,
    cuotaRetencionIrpf: cuotaRetencion,
    total
  };
}

/**
 * Validador básico de estructura de NIF / CIF / NIE español
 */
export function validarNifCifNie(doc: string): boolean {
  if (!doc) return false;
  const limpio = doc.toUpperCase().trim().replace(/[\s-]/g, '');
  if (limpio.length !== 9) return false;

  // DNI estándar: 8 dígitos + 1 letra
  const regexDni = /^[0-9]{8}[A-Z]$/;
  // NIE estándar: X/Y/Z + 7 dígitos + 1 letra
  const regexNie = /^[XYZ][0-9]{7}[A-Z]$/;
  // CIF estándar: 1 letra + 7 dígitos + 1 letra/dígito
  const regexCif = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/;

  return regexDni.test(limpio) || regexNie.test(limpio) || regexCif.test(limpio);
}

/**
 * Formatea importes numéricos al estándar monetario español (ej. 1.250,50 €)
 */
export function formatEuro(importe: number | null | undefined): string {
  const valor = Number(importe) || 0;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
}

/**
 * Formatea fechas YYYY-MM-DD al formato legible español DD/MM/YYYY
 */
export function formatFechaES(fechaIso: string | null | undefined): string {
  if (!fechaIso) return '-';
  const partes = fechaIso.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaIso;
}

/**
 * Generador correlativo de códigos de documento con formato SERIE-NUMERO
 * Ej: generarCodigoDocumento('PRE26', 15) -> "PRE26-0015"
 */
export function generarCodigoDocumento(serie: string, numero: number, longitudRelleno: number = 4): string {
  const numPad = String(numero).padStart(longitudRelleno, '0');
  return `${serie}-${numPad}`;
}
