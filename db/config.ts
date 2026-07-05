// db/config.ts
import { defineDb, defineTable, column, NOW } from 'astro:db'; 

// Control de cabeceras de trabajo
// 🔥 CORREGIDO: Añadido 'export' delante
export const Trabajo = defineTable({
  columns: {
    numParte: column.number({ primaryKey: true }),
    workspaceId: column.text(), 
    cliente: column.text(),
    descripcionGeneral: column.text({ optional: true }),
    comercial: column.text({ optional: true }),
    diseñador: column.text({ optional: true }), 
    fechaSalida: column.text(),
    estado: column.text(),
    area: column.text(),
    subcontrata: column.text({ optional: true }),
  }
});

// Desglose de productos 1:N
// 🔥 CORREGIDO: Añadido 'export' delante
export const DesgloseTrabajo = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    numParte: column.number({ references: () => Trabajo.columns.numParte }),
    descripcionProducto: column.text(),
    cantidad: column.number(),
  }
});

// Registro de Auditoría (Audit Trail)
// 🔥 CORREGIDO: Añadido 'export' delante
export const RegistroActividad = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    fecha: column.date({ default: NOW }), 
    usuario: column.text(),               
    workspaceId: column.text(),           
    tipo: column.text(),                  
    accion: column.text(),                
    detalles: column.text(),              
  }
});

export default defineDb({
  tables: { Trabajo, DesgloseTrabajo, RegistroActividad }
});