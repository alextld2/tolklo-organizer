// src/lib/db-utils.ts
import { db, Trabajo, DesgloseTrabajo, eq } from "astro:db";

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
