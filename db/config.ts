// db/config.ts
import { defineDb, defineTable, column, NOW } from 'astro:db'; 

// Control de cabeceras de trabajo
export const Trabajo = defineTable({
  columns: {
    numParte: column.text({ primaryKey: true }), // Texto para soportar "26-0001"
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
export const DesgloseTrabajo = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    // 🔥 CORREGIDO: Cambiado de .number() a .text() para coincidir con la tabla Trabajo
    numParte: column.text({ references: () => Trabajo.columns.numParte }),
    descripcionProducto: column.text(),
    cantidad: column.number(),
  }
});

// Registro de Auditoría (Audit Trail)
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