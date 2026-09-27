// src/lib/db-utils.ts
import { 
  db, 
  Trabajo, 
  DesgloseTrabajo, 
  Presupuesto, 
  LineaPresupuesto, 
  Albaran, 
  LineaAlbaran, 
  Factura, 
  LineaFactura, 
  ConfiguracionFiscal, 
  eq,
  desc 
} from "astro:db";

export async function getTrabajosWorkspace(workspaceId: string) {
  return await db
    .select()
    .from(Trabajo)
    .where(eq(Trabajo.workspaceId, workspaceId));
}

export async function getDesglosesWorkspace(workspaceId: string) {
  return await db
    .select({
      id: DesgloseTrabajo.id,
      numParte: DesgloseTrabajo.numParte,
      descripcionProducto: DesgloseTrabajo.descripcionProducto,
      cantidad: DesgloseTrabajo.cantidad,
    })
    .from(DesgloseTrabajo)
    .innerJoin(Trabajo, eq(DesgloseTrabajo.numParte, Trabajo.numParte))
    .where(eq(Trabajo.workspaceId, workspaceId));
}

export async function getPresupuestosWorkspace(workspaceId: string) {
  if (workspaceId === 'facturacion') {
    return await db
      .select()
      .from(Presupuesto)
      .orderBy(desc(Presupuesto.id));
  }
  return await db
    .select()
    .from(Presupuesto)
    .where(eq(Presupuesto.workspaceId, workspaceId))
    .orderBy(desc(Presupuesto.id));
}

export async function getAlbaranesWorkspace(workspaceId: string) {
  if (workspaceId === 'facturacion') {
    return await db
      .select()
      .from(Albaran)
      .orderBy(desc(Albaran.id));
  }
  return await db
    .select()
    .from(Albaran)
    .where(eq(Albaran.workspaceId, workspaceId))
    .orderBy(desc(Albaran.id));
}

export async function getFacturasWorkspace(workspaceId: string) {
  if (workspaceId === 'facturacion') {
    return await db
      .select()
      .from(Factura)
      .orderBy(desc(Factura.id));
  }
  return await db
    .select()
    .from(Factura)
    .where(eq(Factura.workspaceId, workspaceId))
    .orderBy(desc(Factura.id));
}

export async function getConfiguracionFiscalWorkspace(workspaceId: string) {
  let configs = await db
    .select()
    .from(ConfiguracionFiscal)
    .where(eq(ConfiguracionFiscal.workspaceId, workspaceId));
  
  if (!configs[0] && workspaceId === 'facturacion') {
    configs = await db
      .select()
      .from(ConfiguracionFiscal)
      .where(eq(ConfiguracionFiscal.workspaceId, 'produccion'));
    if (!configs[0]) {
      configs = await db.select().from(ConfiguracionFiscal);
    }
  }
  
  return configs[0] || null;
}

