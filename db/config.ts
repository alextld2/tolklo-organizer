// db/config.ts
import { defineDb, defineTable, column, NOW } from 'astro:db';

export const Trabajo = defineTable({
  columns: {
    numParte: column.text({ primaryKey: true }),
    workspaceId: column.text(),
    cliente: column.text(),
    descripcionGeneral: column.text({ optional: true }),
    comercial: column.text({ optional: true }),
    diseñador: column.text({ optional: true }),
    fechaSalida: column.text(),
    estado: column.text(),
    area: column.text(),
    subcontrata: column.text({ optional: true }),

    // 🔥 NUEVOS CAMPOS PARA LA FICHA TÉCNICA REUTILIZABLE
    papelPortada: column.text({ optional: true }),
    colorPortada: column.text({ optional: true }),
    papelInterior: column.text({ optional: true }),
    colorInterior: column.text({ optional: true }),
    espiralColor: column.text({ optional: true }),
    wireOColor: column.text({ optional: true }),
    grapadoTipo: column.text({ optional: true }),
    barnizUVTipo: column.text({ optional: true }),
    estampingTipo: column.text({ optional: true }),
    laminadoTipo: column.text({ optional: true }),

    // Guardamos los estados de los checkboxes serializados en JSON string
    encuadernacionJson: column.text({ optional: true }),
    acabadosJson: column.text({ optional: true }),
    laminadoCara1Json: column.text({ optional: true }),
    laminadoCara2Json: column.text({ optional: true })
  }
});

export const DesgloseTrabajo = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    numParte: column.text({ references: () => Trabajo.columns.numParte }),
    descripcionProducto: column.text(),
    cantidad: column.number(),
  }
});

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

export const DireccionCliente = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    cliente: column.text(),
    calle: column.text(),
    ciudad: column.text(),
    provincia: column.text({ optional: true }),
    codigoPostal: column.text(),
    pais: column.text({ default: 'España' }),
    telefono: column.text({ optional: true }),
    notas: column.text({ optional: true }),
  }
});

export default defineDb({
  tables: { Trabajo, DesgloseTrabajo, RegistroActividad, DireccionCliente }
});