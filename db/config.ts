// db/config.ts
import { defineDb, defineTable, column } from 'astro:db'; // <-- CORREGIDO: 'defineDb' con la 'b' minúscula

const Trabajo = defineTable({
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
const DesgloseTrabajo = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    numParte: column.number({ references: () => Trabajo.columns.numParte }),
    descripcionProducto: column.text(),
    cantidad: column.number(),
  }
});

export default defineDb({ // <-- CORREGIDO: 'defineDb' también aquí
  tables: { Trabajo, DesgloseTrabajo }
});