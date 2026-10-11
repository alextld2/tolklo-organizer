// src/lib/escandallo-imprenta.ts
import type { ConfiguracionEscandalloCompleta } from "./escandallo-config";
/**
 * Motor de Cálculo Técnico, Imposición y Escandallo de Costes para Artes Gráficas
 * Inspirado en los motores de cálculo de Palmart, Calcuprint, Pressero y Logic Print.
 * 
 * Soporta:
 * - Hojas planas (Flyers, Carteles, Folletos)
 * - Tarjetas de visita y papelería corporativa
 * - Desplegables (Dípticos, Trípticos envolvente/acordeón, Cuadrípticos, Ventana)
 * - Publicaciones multi-página (Revistas grapadas, Libros rústica PUR/cosida, Catálogos)
 * - Agendas y Calendarios (Wire-O, Peana triangular, Varilla pared)
 * - Tintas especiales (Pantones directos con lavado de tinteros y planchas dedicadas)
 * - Acabados de alto valor: Barniz UV selectivo/3D, Stamping/Foil térmico y Golpe en seco
 * - Cesta de partidas para presupuestos multilínea
 */

export interface DimensionesMm {
  ancho: number;
  alto: number;
}

export type CategoriaProductoId = 
  | "comercial"    // Flyers, cartelería, afiches
  | "tarjetas"     // Tarjetas de visita, marcapáginas
  | "desplegable"  // Dípticos, trípticos, cuadrípticos
  | "publicacion"  // Libros, revistas, catálogos multi-página
  | "calendario"   // Agendas escolares/profesionales, calendarios sobremesa/pared
  | "carpeta";     // Carpetas corporativas troqueladas con solapa

export interface CategoriaConfig {
  id: CategoriaProductoId;
  nombre: string;
  icono: string;
  descripcion: string;
}

export const CATEGORIAS_PRODUCTO: CategoriaConfig[] = [
  { id: "comercial", nombre: "Flyers & Hojas Planas", icono: "FileText", descripcion: "Flyers, cartelería, folletos sueltos y afiches a 1 o 2 caras" },
  { id: "tarjetas", nombre: "Tarjetas & Papelería", icono: "CreditCard", descripcion: "Tarjetas corporativas 85x55, tarjetones, marcapáginas y papelería" },
  { id: "desplegable", nombre: "Dípticos & Desplegables", icono: "FoldHorizontal", descripcion: "Folletos plegados, trípticos envolventes/acordeón con cálculo de palas" },
  { id: "publicacion", nombre: "Libros, Revistas & Catálogos", icono: "BookOpen", descripcion: "Publicaciones con cálculo de tripas, lomo y encuadernación PUR o grapada" },
  { id: "calendario", nombre: "Agendas & Calendarios", icono: "Calendar", descripcion: "Agendas escolares/profesionales y calendarios de sobremesa o pared" },
  { id: "carpeta", nombre: "Carpetas Corporativas", icono: "FolderOpen", descripcion: "Carpetas troqueladas con solapa para presupuestos y dosieres" }
];

export interface ProductoPreset {
  id: string;
  nombre: string;
  categoria: CategoriaProductoId;
  ancho: number;
  alto: number;
  sangre: number;
  tipo: "flyer" | "diptico" | "triptico" | "cuadriptico" | "tarjeta" | "carpeta" | "revista" | "libro" | "calendario" | "agenda" | "cuaderno";
  paginasDefecto?: number;
  tipoPlegadoDefecto?: string;
  tipoEncuadernacionDefecto?: "grapado" | "rustica_pur" | "rustica_cosida" | "wire_o" | "espiral";
  tipoTapaDefecto?: "flexible" | "dura_contracolada";
  grosorCartonMmDefecto?: number;
  gramajesSugeridos: number[];
  acabadosCompatibles: string[];
}

export const PRODUCTOS_PRESET: ProductoPreset[] = [
  // 1. Comerciales / Flyers / Carteles
  {
    id: "flyer-a6",
    nombre: "Flyer A6 (105x148 mm)",
    categoria: "comercial",
    ancho: 105,
    alto: 148,
    sangre: 2,
    tipo: "flyer",
    gramajesSugeridos: [135, 170, 250],
    acabadosCompatibles: ["plastificado_brillo_1c", "plastificado_mate_2c", "barniz_offset_proteccion"]
  },
  {
    id: "flyer-a5",
    nombre: "Flyer A5 (148x210 mm)",
    categoria: "comercial",
    ancho: 148,
    alto: 210,
    sangre: 2,
    tipo: "flyer",
    gramajesSugeridos: [115, 135, 170, 250],
    acabadosCompatibles: ["plastificado_brillo_1c", "plastificado_mate_2c", "barniz_offset_proteccion"]
  },
  {
    id: "flyer-a4",
    nombre: "Flyer / Folleto A4 (210x297 mm)",
    categoria: "comercial",
    ancho: 210,
    alto: 297,
    sangre: 2,
    tipo: "flyer",
    gramajesSugeridos: [115, 135, 170, 250],
    acabadosCompatibles: ["plastificado_mate_1c", "plastificado_brillo_1c"]
  },
  {
    id: "cartel-a3",
    nombre: "Cartel / Afiche A3 (297x420 mm)",
    categoria: "comercial",
    ancho: 297,
    alto: 420,
    sangre: 2,
    tipo: "flyer",
    gramajesSugeridos: [135, 170, 200],
    acabadosCompatibles: ["plastificado_brillo_1c", "barniz_offset_proteccion"]
  },
  {
    id: "cartel-50x70",
    nombre: "Cartel B2 (500x700 mm)",
    categoria: "comercial",
    ancho: 500,
    alto: 700,
    sangre: 3,
    tipo: "flyer",
    gramajesSugeridos: [135, 170],
    acabadosCompatibles: ["barniz_offset_proteccion"]
  },

  // 2. Tarjetas & Papelería
  {
    id: "tarjeta-visita",
    nombre: "Tarjetas de Visita Estándar (85x55 mm)",
    categoria: "tarjetas",
    ancho: 85,
    alto: 55,
    sangre: 2,
    tipo: "tarjeta",
    gramajesSugeridos: [350, 400],
    acabadosCompatibles: ["plastificado_mate_2c", "plastificado_softtouch_2c", "barniz_uvi_selectivo", "barniz_uvi_3d_relieve", "stamping_oro", "stamping_plata", "golpe_seco", "esquinas_redondeadas"]
  },
  {
    id: "tarjeta-doble",
    nombre: "Tarjeta de Visita Doble Plegada (170x55 mm abierta)",
    categoria: "tarjetas",
    ancho: 170,
    alto: 55,
    sangre: 2,
    tipo: "diptico",
    tipoPlegadoDefecto: "diptico",
    gramajesSugeridos: [300, 350],
    acabadosCompatibles: ["hendido", "plegado_diptico", "plastificado_mate_2c", "stamping_oro"]
  },
  {
    id: "tarjeton-a6",
    nombre: "Tarjetón Postal A6 (148x105 mm)",
    categoria: "tarjetas",
    ancho: 148,
    alto: 105,
    sangre: 2,
    tipo: "tarjeta",
    gramajesSugeridos: [300, 350],
    acabadosCompatibles: ["plastificado_mate_2c", "plastificado_softtouch_2c", "stamping_oro", "barniz_uvi_selectivo"]
  },
  {
    id: "marcapaginas",
    nombre: "Marcapáginas / Punto de Libro (50x200 mm)",
    categoria: "tarjetas",
    ancho: 50,
    alto: 200,
    sangre: 2,
    tipo: "tarjeta",
    gramajesSugeridos: [350, 400],
    acabadosCompatibles: ["plastificado_mate_2c", "plastificado_softtouch_2c", "esquinas_redondeadas", "perforado_trepado"]
  },

  // 3. Desplegables
  {
    id: "diptico-a4-a5",
    nombre: "Díptico A4 abierto a A5 (297x210 mm)",
    categoria: "desplegable",
    ancho: 297,
    alto: 210,
    sangre: 2,
    tipo: "diptico",
    tipoPlegadoDefecto: "diptico",
    gramajesSugeridos: [135, 170, 250],
    acabadosCompatibles: ["plegado_diptico", "hendido", "plastificado_mate_2c", "barniz_uvi_selectivo"]
  },
  {
    id: "diptico-a3-a4",
    nombre: "Díptico A3 abierto a A4 (420x297 mm)",
    categoria: "desplegable",
    ancho: 420,
    alto: 297,
    sangre: 2,
    tipo: "diptico",
    tipoPlegadoDefecto: "diptico",
    gramajesSugeridos: [150, 170, 250],
    acabadosCompatibles: ["plegado_diptico", "hendido", "plastificado_mate_2c"]
  },
  {
    id: "triptico-a4-envolvente",
    nombre: "Tríptico A4 Envolvente (297x210 mm)",
    categoria: "desplegable",
    ancho: 297,
    alto: 210,
    sangre: 2,
    tipo: "triptico",
    tipoPlegadoDefecto: "triptico_envolvente",
    gramajesSugeridos: [135, 170],
    acabadosCompatibles: ["plegado_triptico", "hendido", "plastificado_mate_2c"]
  },
  {
    id: "triptico-a4-acordeon",
    nombre: "Tríptico A4 Acordeón / Z (297x210 mm)",
    categoria: "desplegable",
    ancho: 297,
    alto: 210,
    sangre: 2,
    tipo: "triptico",
    tipoPlegadoDefecto: "triptico_acordeon",
    gramajesSugeridos: [135, 170],
    acabadosCompatibles: ["plegado_triptico", "hendido"]
  },
  {
    id: "cuadriptico-acordeon",
    nombre: "Cuadríptico Acordeón (400x210 mm abierto)",
    categoria: "desplegable",
    ancho: 400,
    alto: 210,
    sangre: 2,
    tipo: "cuadriptico",
    tipoPlegadoDefecto: "cuadriptico_acordeon",
    gramajesSugeridos: [135, 170],
    acabadosCompatibles: ["hendido", "plastificado_mate_2c"]
  },
  {
    id: "cuadriptico-ventana",
    nombre: "Cuadríptico Ventana / Gate Fold (420x210 mm)",
    categoria: "desplegable",
    ancho: 420,
    alto: 210,
    sangre: 2,
    tipo: "cuadriptico",
    tipoPlegadoDefecto: "cuadriptico_ventana",
    gramajesSugeridos: [150, 170, 200],
    acabadosCompatibles: ["hendido", "plastificado_mate_2c"]
  },

  // 4. Libros, Revistas & Catálogos
  {
    id: "revista-a4-grapada-32p",
    nombre: "Revista A4 Grapada (32 páginas)",
    categoria: "publicacion",
    ancho: 210,
    alto: 297,
    sangre: 2,
    tipo: "revista",
    paginasDefecto: 32,
    tipoEncuadernacionDefecto: "grapado",
    gramajesSugeridos: [115, 135, 150],
    acabadosCompatibles: ["grapado_2_puntos", "plastificado_mate_1c", "plastificado_brillo_1c"]
  },
  {
    id: "revista-a5-grapada-48p",
    nombre: "Revista / Guía A5 Grapada (48 páginas)",
    categoria: "publicacion",
    ancho: 148,
    alto: 210,
    sangre: 2,
    tipo: "revista",
    paginasDefecto: 48,
    tipoEncuadernacionDefecto: "grapado",
    gramajesSugeridos: [115, 135],
    acabadosCompatibles: ["grapado_2_puntos", "plastificado_mate_1c"]
  },
  {
    id: "catalogo-a4-pur-64p",
    nombre: "Catálogo Comercial A4 Rústica PUR (64 páginas)",
    categoria: "publicacion",
    ancho: 210,
    alto: 297,
    sangre: 3,
    tipo: "revista",
    paginasDefecto: 64,
    tipoEncuadernacionDefecto: "rustica_pur",
    gramajesSugeridos: [135, 150, 170],
    acabadosCompatibles: ["encuadernacion_rustica_pur", "plastificado_mate_1c", "plastificado_softtouch_2c", "barniz_uvi_selectivo"]
  },
  {
    id: "libro-a5-pur-160p",
    nombre: "Libro / Novela A5 Rústica PUR (160 páginas)",
    categoria: "publicacion",
    ancho: 148,
    alto: 210,
    sangre: 3,
    tipo: "libro",
    paginasDefecto: 160,
    tipoEncuadernacionDefecto: "rustica_pur",
    tipoTapaDefecto: "flexible",
    gramajesSugeridos: [80, 90, 100],
    acabadosCompatibles: ["encuadernacion_rustica_pur", "plastificado_mate_1c", "plastificado_softtouch_2c", "stamping_oro", "golpe_seco"]
  },
  {
    id: "libro-a5-tapadura-cartone",
    nombre: "Libro / Novela A5 Tapa Dura Cartoné (192 páginas)",
    categoria: "publicacion",
    ancho: 148,
    alto: 210,
    sangre: 3,
    tipo: "libro",
    paginasDefecto: 192,
    tipoEncuadernacionDefecto: "rustica_pur",
    tipoTapaDefecto: "dura_contracolada",
    grosorCartonMmDefecto: 2.0,
    gramajesSugeridos: [80, 90, 100],
    acabadosCompatibles: ["encuadernacion_rustica_pur", "plastificado_mate_1c", "plastificado_softtouch_2c", "stamping_oro", "golpe_seco"]
  },

  // 5. Agendas & Calendarios
  {
    id: "agenda-a5-tapadura-wireo",
    nombre: "Agenda A5 Tapa Dura Contracolada Wire-O (160 páginas)",
    categoria: "calendario",
    ancho: 148,
    alto: 210,
    sangre: 3,
    tipo: "agenda",
    paginasDefecto: 160,
    tipoEncuadernacionDefecto: "wire_o",
    tipoTapaDefecto: "dura_contracolada",
    grosorCartonMmDefecto: 2.0,
    gramajesSugeridos: [80, 90, 100],
    acabadosCompatibles: ["encuadernacion_wire_o", "plastificado_mate_1c", "plastificado_softtouch_2c", "stamping_oro", "esquinas_redondeadas"]
  },
  {
    id: "agenda-escolar-a5",
    nombre: "Agenda A5 Tapa Flexible Wire-O (128 páginas)",
    categoria: "calendario",
    ancho: 148,
    alto: 210,
    sangre: 3,
    tipo: "agenda",
    paginasDefecto: 128,
    tipoEncuadernacionDefecto: "wire_o",
    tipoTapaDefecto: "flexible",
    gramajesSugeridos: [80, 90, 100],
    acabadosCompatibles: ["encuadernacion_wire_o", "plastificado_mate_1c", "esquinas_redondeadas"]
  },
  {
    id: "cuaderno-a5-tapadura",
    nombre: "Cuaderno / Libreta A5 Tapa Dura Contracolada (160 páginas)",
    categoria: "calendario",
    ancho: 148,
    alto: 210,
    sangre: 3,
    tipo: "cuaderno",
    paginasDefecto: 160,
    tipoEncuadernacionDefecto: "wire_o",
    tipoTapaDefecto: "dura_contracolada",
    grosorCartonMmDefecto: 2.0,
    gramajesSugeridos: [80, 90, 100],
    acabadosCompatibles: ["encuadernacion_wire_o", "plastificado_mate_1c", "plastificado_softtouch_2c", "stamping_oro"]
  },
  {
    id: "cuaderno-a5-flexible",
    nombre: "Cuaderno A5 Tapa Flexible Folding Wire-O (100 páginas)",
    categoria: "calendario",
    ancho: 148,
    alto: 210,
    sangre: 3,
    tipo: "cuaderno",
    paginasDefecto: 100,
    tipoEncuadernacionDefecto: "wire_o",
    tipoTapaDefecto: "flexible",
    gramajesSugeridos: [80, 90],
    acabadosCompatibles: ["encuadernacion_wire_o", "plastificado_mate_1c"]
  },
  {
    id: "calendario-sobremesa-peana",
    nombre: "Calendario Sobremesa con Peana Triangular (Wire-O)",
    categoria: "calendario",
    ancho: 210,
    alto: 105,
    sangre: 2,
    tipo: "calendario",
    paginasDefecto: 26,
    tipoEncuadernacionDefecto: "wire_o",
    gramajesSugeridos: [200, 250],
    acabadosCompatibles: ["encuadernacion_wire_o", "plastificado_brillo_1c"]
  },
  {
    id: "calendario-pared-a3",
    nombre: "Calendario de Pared A3 con Varilla y Colgador (14 hojas)",
    categoria: "calendario",
    ancho: 297,
    alto: 420,
    sangre: 2,
    tipo: "calendario",
    paginasDefecto: 28,
    tipoEncuadernacionDefecto: "wire_o",
    gramajesSugeridos: [170, 200],
    acabadosCompatibles: ["encuadernacion_wire_o", "barniz_offset_proteccion"]
  },

  // 6. Carpetas Corporativas
  {
    id: "carpeta-a4-solapa",
    nombre: "Carpeta troquelada A4 con solapa (450x310 mm abierta)",
    categoria: "carpeta",
    ancho: 450,
    alto: 310,
    sangre: 3,
    tipo: "carpeta",
    gramajesSugeridos: [300, 350],
    acabadosCompatibles: ["troquelado", "hendido", "plastificado_mate_1c", "plastificado_softtouch_2c", "barniz_uvi_selectivo", "stamping_oro"]
  }
];

export interface PapelSoporte {
  id: string;
  nombre: string;
  gramajes: number[];
  precioKg: number; // Euros / Kg
  densidadAparente: string;
}

export const PAPELES_CATALOGO: PapelSoporte[] = [
  {
    id: "estucado-mate",
    nombre: "Estucado / Couché Mate",
    gramajes: [90, 115, 135, 150, 170, 200, 250, 300, 350],
    precioKg: 1.85,
    densidadAparente: "Sedoso de alta blancura"
  },
  {
    id: "estucado-brillo",
    nombre: "Estucado / Couché Brillo",
    gramajes: [90, 115, 135, 150, 170, 200, 250, 300, 350],
    precioKg: 1.80,
    densidadAparente: "Brillo comercial estándar"
  },
  {
    id: "offset-blanco",
    nombre: "Offset / Papel Bond Blanco",
    gramajes: [80, 90, 100, 120, 140],
    precioKg: 2.10,
    densidadAparente: "Poroso para escritura, libros y agendas"
  },
  {
    id: "folding-calibre",
    nombre: "Cartulina Folding Estucada 1C",
    gramajes: [240, 280, 300, 350],
    precioKg: 2.45,
    densidadAparente: "Rigidez para portadas, carpetas y packaging"
  },
  {
    id: "kraft-reciclado",
    nombre: "Kraft Ecológico / Reciclado",
    gramajes: [120, 170, 250, 300],
    precioKg: 2.20,
    densidadAparente: "Tono marrón natural y rústico"
  }
];

export interface MaquinaConfig {
  id: string;
  nombre: string;
  tecnologia: "digital" | "offset";
  pliegoAncho: number; // mm
  pliegoAlto: number; // mm
  pinzaMm: number;
  margenLateralMm: number;
  tiraControlMm: number;
  costeHora: number;
  costePlancha: number; // CTP térmica
  tiempoArregloMinutos: number;
  velocidadPliegosHora: number;
  mermaArranquePliegosPorColor: number;
  mermaTiradaPorcentaje: number;
  costeClicColorPliego: number;
  costeClicBnPliego: number;
  maxGramaje: number;
  minGramaje: number;
}

export const PARQUE_MAQUINAS: MaquinaConfig[] = [
  {
    id: "ricoh-7200",
    nombre: "RICOH 7200",
    tecnologia: "digital",
    pliegoAncho: 488,
    pliegoAlto: 330,
    pinzaMm: 4,
    margenLateralMm: 4,
    tiraControlMm: 0,
    costeHora: 55.0,
    costePlancha: 0.0,
    tiempoArregloMinutos: 5,
    velocidadPliegosHora: 4800,
    mermaArranquePliegosPorColor: 5,
    mermaTiradaPorcentaje: 1.5,
    costeClicColorPliego: 0.060,
    costeClicBnPliego: 0.015,
    maxGramaje: 360,
    minGramaje: 52
  },
  {
    id: "ricoh-9200",
    nombre: "RICOH 9200",
    tecnologia: "digital",
    pliegoAncho: 488,
    pliegoAlto: 330,
    pinzaMm: 4,
    margenLateralMm: 4,
    tiraControlMm: 0,
    costeHora: 65.0,
    costePlancha: 0.0,
    tiempoArregloMinutos: 6,
    velocidadPliegosHora: 6600,
    mermaArranquePliegosPorColor: 5,
    mermaTiradaPorcentaje: 1.2,
    costeClicColorPliego: 0.048,
    costeClicBnPliego: 0.012,
    maxGramaje: 450,
    minGramaje: 52
  },
  {
    id: "taskalfa-15000c",
    nombre: "TASKalfa Pro 15000c",
    tecnologia: "digital",
    pliegoAncho: 488,
    pliegoAlto: 330,
    pinzaMm: 3,
    margenLateralMm: 3,
    tiraControlMm: 0,
    costeHora: 50.0,
    costePlancha: 0.0,
    tiempoArregloMinutos: 3,
    velocidadPliegosHora: 9000,
    mermaArranquePliegosPorColor: 3,
    mermaTiradaPorcentaje: 1.0,
    costeClicColorPliego: 0.028,
    costeClicBnPliego: 0.007,
    maxGramaje: 360,
    minGramaje: 52
  },
  {
    id: "speedmaster-32x52",
    nombre: "SPEEDMASTER 32X52",
    tecnologia: "offset",
    pliegoAncho: 520,
    pliegoAlto: 360,
    pinzaMm: 10,
    margenLateralMm: 5,
    tiraControlMm: 8,
    costeHora: 70.0,
    costePlancha: 7.50,
    tiempoArregloMinutos: 20,
    velocidadPliegosHora: 9000,
    mermaArranquePliegosPorColor: 25,
    mermaTiradaPorcentaje: 2.0,
    costeClicColorPliego: 0.0,
    costeClicBnPliego: 0.0,
    maxGramaje: 400,
    minGramaje: 60
  },
  {
    id: "sakurai-4",
    nombre: "SAKURAI 4 COLORES",
    tecnologia: "offset",
    pliegoAncho: 720,
    pliegoAlto: 520,
    pinzaMm: 12,
    margenLateralMm: 6,
    tiraControlMm: 8,
    costeHora: 85.0,
    costePlancha: 9.50,
    tiempoArregloMinutos: 25,
    velocidadPliegosHora: 11000,
    mermaArranquePliegosPorColor: 30,
    mermaTiradaPorcentaje: 2.0,
    costeClicColorPliego: 0.0,
    costeClicBnPliego: 0.0,
    maxGramaje: 450,
    minGramaje: 70
  },
  {
    id: "sakurai-5",
    nombre: "SAKURAI 5 COLORES",
    tecnologia: "offset",
    pliegoAncho: 720,
    pliegoAlto: 520,
    pinzaMm: 12,
    margenLateralMm: 6,
    tiraControlMm: 8,
    costeHora: 95.0,
    costePlancha: 9.50,
    tiempoArregloMinutos: 30,
    velocidadPliegosHora: 11000,
    mermaArranquePliegosPorColor: 30,
    mermaTiradaPorcentaje: 2.0,
    costeClicColorPliego: 0.0,
    costeClicBnPliego: 0.0,
    maxGramaje: 450,
    minGramaje: 70
  },
  {
    id: "roland-700",
    nombre: "ROLAND 700",
    tecnologia: "offset",
    pliegoAncho: 1020,
    pliegoAlto: 720,
    pinzaMm: 14,
    margenLateralMm: 8,
    tiraControlMm: 10,
    costeHora: 130.0,
    costePlancha: 18.00,
    tiempoArregloMinutos: 35,
    velocidadPliegosHora: 13000,
    mermaArranquePliegosPorColor: 45,
    mermaTiradaPorcentaje: 2.5,
    costeClicColorPliego: 0.0,
    costeClicBnPliego: 0.0,
    maxGramaje: 500,
    minGramaje: 80
  }
];

export interface AcabadoConfig {
  id: string;
  nombre: string;
  categoria?: "plastificado" | "barniz" | "stamping" | "manipulado" | "encuadernacion";
  tipoCobro: "fijo" | "pliego" | "unidad" | "m2";
  tarifaFijaArranque: number;
  precioUnitario: number;
}

export const CATALOGO_ACABADOS: Record<string, AcabadoConfig> = {
  // Plastificados
  plastificado_brillo_1c: {
    id: "plastificado_brillo_1c",
    nombre: "Plastificado Brillo 1 Cara",
    categoria: "plastificado",
    tipoCobro: "pliego",
    tarifaFijaArranque: 12.0,
    precioUnitario: 0.045
  },
  plastificado_mate_1c: {
    id: "plastificado_mate_1c",
    nombre: "Plastificado Mate 1 Cara",
    categoria: "plastificado",
    tipoCobro: "pliego",
    tarifaFijaArranque: 12.0,
    precioUnitario: 0.048
  },
  plastificado_mate_2c: {
    id: "plastificado_mate_2c",
    nombre: "Plastificado Mate 2 Caras",
    categoria: "plastificado",
    tipoCobro: "pliego",
    tarifaFijaArranque: 18.0,
    precioUnitario: 0.088
  },
  plastificado_softtouch_2c: {
    id: "plastificado_softtouch_2c",
    nombre: "Laminado Soft Touch (Tacto Seda) 2 Caras",
    categoria: "plastificado",
    tipoCobro: "pliego",
    tarifaFijaArranque: 25.0,
    precioUnitario: 0.14
  },

  // Barnices UV
  barniz_offset_proteccion: {
    id: "barniz_offset_proteccion",
    nombre: "Barniz Máquina Offset Protección",
    categoria: "barniz",
    tipoCobro: "pliego",
    tarifaFijaArranque: 15.0,
    precioUnitario: 0.015
  },
  barniz_uvi_selectivo: {
    id: "barniz_uvi_selectivo",
    nombre: "Barniz UVI Brillo Selectivo (Reserva)",
    categoria: "barniz",
    tipoCobro: "pliego",
    tarifaFijaArranque: 45.0, // Pantalla serigráfica / setup
    precioUnitario: 0.065
  },
  barniz_uvi_3d_relieve: {
    id: "barniz_uvi_3d_relieve",
    nombre: "Barniz Digital UVI con Relieve 3D",
    categoria: "barniz",
    tipoCobro: "pliego",
    tarifaFijaArranque: 35.0,
    precioUnitario: 0.095
  },

  // Stamping / Hot Foil Térmico
  stamping_oro: {
    id: "stamping_oro",
    nombre: "Stamping / Hot Foil Térmico Oro",
    categoria: "stamping",
    tipoCobro: "unidad",
    tarifaFijaArranque: 48.0, // Grabado / cliché de magnesio
    precioUnitario: 0.045
  },
  stamping_plata: {
    id: "stamping_plata",
    nombre: "Stamping / Hot Foil Térmico Plata",
    categoria: "stamping",
    tipoCobro: "unidad",
    tarifaFijaArranque: 48.0,
    precioUnitario: 0.045
  },
  stamping_cobre: {
    id: "stamping_cobre",
    nombre: "Stamping Térmico Cobre / Bronce",
    categoria: "stamping",
    tipoCobro: "unidad",
    tarifaFijaArranque: 50.0,
    precioUnitario: 0.048
  },

  // Relieve Seco / Golpe en Seco (Embossing)
  golpe_seco: {
    id: "golpe_seco",
    nombre: "Golpe en Seco / Relieve sin tinta (Embossing)",
    categoria: "stamping",
    tipoCobro: "unidad",
    tarifaFijaArranque: 55.0, // Molde macho/hembra
    precioUnitario: 0.035
  },

  // Plegado y Manipulado
  plegado_diptico: {
    id: "plegado_diptico",
    nombre: "Plegado Díptico (1 pliegue en V)",
    categoria: "manipulado",
    tipoCobro: "unidad",
    tarifaFijaArranque: 15.0,
    precioUnitario: 0.008
  },
  plegado_triptico: {
    id: "plegado_triptico",
    nombre: "Plegado Tríptico (2 pliegues)",
    categoria: "manipulado",
    tipoCobro: "unidad",
    tarifaFijaArranque: 18.0,
    precioUnitario: 0.012
  },
  hendido: {
    id: "hendido",
    nombre: "Hendido Mecánico (antigrieta gramajes ≥ 170g)",
    categoria: "manipulado",
    tipoCobro: "unidad",
    tarifaFijaArranque: 14.0,
    precioUnitario: 0.009
  },
  troquelado: {
    id: "troquelado",
    nombre: "Troquelado con Molde / Forma Especial",
    categoria: "manipulado",
    tipoCobro: "unidad",
    tarifaFijaArranque: 65.0,
    precioUnitario: 0.025
  },
  esquinas_redondeadas: {
    id: "esquinas_redondeadas",
    nombre: "Esquinas Redondeadas (4 cantos)",
    categoria: "manipulado",
    tipoCobro: "unidad",
    tarifaFijaArranque: 12.0,
    precioUnitario: 0.015
  },
  perforado_trepado: {
    id: "perforado_trepado",
    nombre: "Línea de Trepado / Microperforado",
    categoria: "manipulado",
    tipoCobro: "unidad",
    tarifaFijaArranque: 14.0,
    precioUnitario: 0.008
  },

  // Encuadernaciones
  grapado_2_puntos: {
    id: "grapado_2_puntos",
    nombre: "Encuadernación 2 Grapas al lomo (caballete)",
    categoria: "encuadernacion",
    tipoCobro: "unidad",
    tarifaFijaArranque: 20.0,
    precioUnitario: 0.045
  },
  encuadernacion_rustica_pur: {
    id: "encuadernacion_rustica_pur",
    nombre: "Rústica Fresada con Cola PUR (lomo cuadrado)",
    categoria: "encuadernacion",
    tipoCobro: "unidad",
    tarifaFijaArranque: 45.0,
    precioUnitario: 0.35
  },
  encuadernacion_rustica_cosida: {
    id: "encuadernacion_rustica_cosida",
    nombre: "Rústica Cosida con Hilo Vegetal",
    categoria: "encuadernacion",
    tipoCobro: "unidad",
    tarifaFijaArranque: 65.0,
    precioUnitario: 0.55
  },
  encuadernacion_wire_o: {
    id: "encuadernacion_wire_o",
    nombre: "Encuadernación Wire-O (Doble espiral metálica)",
    categoria: "encuadernacion",
    tipoCobro: "unidad",
    tarifaFijaArranque: 30.0,
    precioUnitario: 0.40
  },
  encuadernacion_espiral: {
    id: "encuadernacion_espiral",
    nombre: "Encuadernación Espiral plástica continua",
    categoria: "encuadernacion",
    tipoCobro: "unidad",
    tarifaFijaArranque: 22.0,
    precioUnitario: 0.30
  },
  confeccion_tapa_dura: {
    id: "confeccion_tapa_dura",
    nombre: "Confección Tapa Dura Contracolada (Cartón 2mm)",
    categoria: "encuadernacion",
    tipoCobro: "unidad",
    tarifaFijaArranque: 35.0,
    precioUnitario: 0.45
  }
};

/**
 * 📐 MOTOR DE IMPOSICIÓN TÉCNICA (2D Sheet Layout & Poses Optimization)
 */
export interface ResultadoImposicion {
  anchoPliego: number;
  altoPliego: number;
  anchoPoseConSangre: number;
  altoPoseConSangre: number;
  anchoUtilPliego: number;
  altoUtilPliego: number;
  posesColumnas: number;
  posesFilas: number;
  totalPosesPorPliego: number;
  rotada90: boolean;
  aprovechamientoPorcentaje: number;
  escalaVisual: number;
}

export function calcularImposicion(
  anchoTrabajoMm: number,
  altoTrabajoMm: number,
  sangreMm: number,
  maquina: MaquinaConfig
): ResultadoImposicion {
  const calleCorteMm = 3;

  const poseAncho = anchoTrabajoMm + sangreMm * 2;
  const poseAlto = altoTrabajoMm + sangreMm * 2;

  const anchoUtil = maquina.pliegoAncho - maquina.margenLateralMm * 2;
  const altoUtil = maquina.pliegoAlto - maquina.pinzaMm - maquina.tiraControlMm;

  // 1. Orientación Directa
  const cols1 = Math.floor((anchoUtil + calleCorteMm) / (poseAncho + calleCorteMm));
  const filas1 = Math.floor((altoUtil + calleCorteMm) / (poseAlto + calleCorteMm));
  const total1 = Math.max(0, cols1) * Math.max(0, filas1);

  // 2. Orientación Rotada 90º
  const cols2 = Math.floor((anchoUtil + calleCorteMm) / (poseAlto + calleCorteMm));
  const filas2 = Math.floor((altoUtil + calleCorteMm) / (poseAncho + calleCorteMm));
  const total2 = Math.max(0, cols2) * Math.max(0, filas2);

  let rotada = false;
  let colsFinal = cols1;
  let filasFinal = filas1;
  let totalPoses = total1;

  if (total2 > total1) {
    rotada = true;
    colsFinal = cols2;
    filasFinal = filas2;
    totalPoses = total2;
  }

  if (totalPoses <= 0) {
    totalPoses = 1;
  }

  const superficieTrabajoMm2 = totalPoses * (anchoTrabajoMm * altoTrabajoMm);
  const superficiePliegoMm2 = maquina.pliegoAncho * maquina.pliegoAlto;
  const aprovechamiento = Math.min(100, Math.round((superficieTrabajoMm2 / superficiePliegoMm2) * 1000) / 10);

  return {
    anchoPliego: maquina.pliegoAncho,
    altoPliego: maquina.pliegoAlto,
    anchoPoseConSangre: rotada ? poseAlto : poseAncho,
    altoPoseConSangre: rotada ? poseAncho : poseAlto,
    anchoUtilPliego: anchoUtil,
    altoUtilPliego: altoUtil,
    posesColumnas: colsFinal,
    posesFilas: filasFinal,
    totalPosesPorPliego: totalPoses,
    rotada90: rotada,
    aprovechamientoPorcentaje: aprovechamiento,
    escalaVisual: Math.min(300 / maquina.pliegoAncho, 200 / maquina.pliegoAlto)
  };
}

/**
 * 📖 MOTOR DE PUBLICACIONES (Libros, Revistas, Catálogos, Agendas)
 */
export type TipoTapaPublicacion = "flexible" | "dura_contracolada";

export interface ParametrosPublicacion {
  esPublicacion: boolean;
  paginasInteriores: number;
  papelInteriorId: string;
  gramajeInterior: number;
  colorInterior: "4+4" | "1+1" | "4+0" | "1+0";
  papelPortadaId: string;
  gramajePortada: number;
  colorPortada: "4+4" | "4+0" | "1+0";
  solapasMm: number;
  tipoEncuadernacion: "grapado" | "rustica_pur" | "rustica_cosida" | "wire_o" | "espiral";

  // Variables avanzadas de Encuadernación y Tapas
  tipoTapa?: TipoTapaPublicacion;
  grosorCartonMm?: number; // 1.5, 2.0, 2.5, 3.0
  impresionCubiertaTecnologia?: "auto" | "digital" | "offset";
  maquinaCubiertaId?: string | null;
  plastificadoCubiertaId?: string;
}

export interface GeometriaPublicacion {
  paginasInteriores: number;
  anchoCerrado: number;
  altoCerrado: number;
  lomoMm: number;
  anchoCubiertaAbierta: number;
  altoCubiertaAbierta: number;
  paginasPorPliego: number;
  signaturasTotales: number;
  pliegosTripaPorEjemplar: number;
  tipoEncuadernacion: string;
  tipoTapa: TipoTapaPublicacion;
  esTapaDura: boolean;
  grosorCartonMm: number;
  anchoCartonTapaMm: number;
  altoCartonTapaMm: number;
  anchoForroAbiertoMm: number;
  altoForroAbiertoMm: number;
  vueltaContracoladoMm: number;
  descripcionTecnica: string;
}

export function calcularGeometriaPublicacion(
  anchoCerradoMm: number,
  altoCerradoMm: number,
  paginasInteriores: number,
  gramajeInterior: number,
  tipoEncuadernacion: "grapado" | "rustica_pur" | "rustica_cosida" | "wire_o" | "espiral",
  solapasMm: number = 0,
  tipoTapa: TipoTapaPublicacion = "flexible",
  grosorCartonMm: number = 2.0
): GeometriaPublicacion {
  const volumenMano = 1.05; // Mano media del papel
  const calibreHojaMm = (gramajeInterior / 1000) * volumenMano;
  const numHojas = Math.ceil(paginasInteriores / 2);

  let lomoMm = 0;
  if (tipoEncuadernacion === "grapado") {
    lomoMm = 0;
  } else if (tipoEncuadernacion === "wire_o" || tipoEncuadernacion === "espiral") {
    lomoMm = Math.max(4, Math.round((numHojas * calibreHojaMm + 2) * 10) / 10);
  } else {
    lomoMm = Math.max(3, Math.round((numHojas * calibreHojaMm + 0.6) * 10) / 10);
  }

  const esTapaDura = tipoTapa === "dura_contracolada";
  const vueltaContracoladoMm = 20; // 20 mm perimetrales de vuelta para encolado

  let anchoCubiertaAbierta = (anchoCerradoMm * 2) + lomoMm + (solapasMm * 2);
  let altoCubiertaAbierta = altoCerradoMm;

  // Si es Tapa Dura Contracolada:
  let anchoCartonTapaMm = anchoCerradoMm;
  let altoCartonTapaMm = altoCerradoMm + 6; // ceja 3mm superior y 3mm inferior

  if (tipoEncuadernacion === "wire_o" || tipoEncuadernacion === "espiral") {
    anchoCartonTapaMm = anchoCerradoMm + 3; // Ceja exterior completa
  } else {
    anchoCartonTapaMm = Math.max(10, anchoCerradoMm - 1); // Descuenta cajo
  }

  // Papel forro exterior extendido con vueltas de 20 mm:
  let anchoForroAbiertoMm = anchoCubiertaAbierta;
  let altoForroAbiertoMm = altoCubiertaAbierta;

  if (esTapaDura) {
    if (tipoEncuadernacion === "wire_o" || tipoEncuadernacion === "espiral") {
      // 2 tapas independientes con 20mm de vuelta por cada lado
      anchoForroAbiertoMm = anchoCartonTapaMm + vueltaContracoladoMm * 2;
      altoForroAbiertoMm = altoCartonTapaMm + vueltaContracoladoMm * 2;
    } else {
      // Cartoné con lomo corrido
      const lomoCartone = lomoMm + (grosorCartonMm * 2);
      anchoForroAbiertoMm = (anchoCartonTapaMm * 2) + lomoCartone + 16 + (vueltaContracoladoMm * 2);
      altoForroAbiertoMm = altoCartonTapaMm + (vueltaContracoladoMm * 2);
      anchoCubiertaAbierta = (anchoCartonTapaMm * 2) + lomoCartone + 16;
      altoCubiertaAbierta = altoCartonTapaMm;
    }
  }

  // Páginas por pliego en prensa media 50x70 / 70x100
  const paginasPorPliegoMedio = anchoCerradoMm <= 160 ? 16 : 8;
  const signaturasTotales = Math.max(1, Math.ceil(paginasInteriores / paginasPorPliegoMedio));
  const pliegosTripaPorEjemplar = Math.max(1, Math.round((paginasInteriores / paginasPorPliegoMedio) * 10) / 10);

  const nombresEncuadernacion: Record<string, string> = {
    grapado: "Grapado 2 puntos al lomo",
    rustica_pur: "Rústica Fresada Cola PUR",
    rustica_cosida: "Rústica Cosida con Hilo",
    wire_o: "Wire-O doble espiral metálica",
    espiral: "Espiral plástica continua"
  };

  const nombreTapa = esTapaDura ? `Tapa Dura Contracolada (Cartón rígido ${grosorCartonMm}mm)` : "Tapa Flexible";
  const desc = `${nombreTapa} + ${nombresEncuadernacion[tipoEncuadernacion] || tipoEncuadernacion}. Interior ${paginasInteriores} págs. ${esTapaDura ? `Forro extendido: ${anchoForroAbiertoMm}x${altoForroAbiertoMm} mm (con 20mm vueltas) | Cartón: ${anchoCartonTapaMm}x${altoCartonTapaMm} mm.` : `Cubierta abierta: ${anchoCubiertaAbierta}x${altoCubiertaAbierta} mm (Lomo: ${lomoMm} mm${solapasMm > 0 ? `, 2 Solapas ${solapasMm}mm` : ''}).`} ${signaturasTotales} signaturas (${pliegosTripaPorEjemplar} pliegos/ejemplar).`;

  return {
    paginasInteriores,
    anchoCerrado: anchoCerradoMm,
    altoCerrado: altoCerradoMm,
    lomoMm,
    anchoCubiertaAbierta,
    altoCubiertaAbierta,
    paginasPorPliego: paginasPorPliegoMedio,
    signaturasTotales,
    pliegosTripaPorEjemplar,
    tipoEncuadernacion,
    tipoTapa,
    esTapaDura,
    grosorCartonMm,
    anchoCartonTapaMm,
    altoCartonTapaMm,
    anchoForroAbiertoMm,
    altoForroAbiertoMm,
    vueltaContracoladoMm,
    descripcionTecnica: desc
  };
}

/**
 * 🏭 MOTOR DE ESCANDALLO GRÁFICO (BOM & Machine Cost Routing)
 */
export interface ParametrosCalculo {
  nombreTrabajo?: string;
  categoria?: CategoriaProductoId;
  cantidadTirada: number;
  anchoMm: number;
  altoMm: number;
  sangreMm: number;
  papelId: string;
  gramaje: number;
  colorImpresion: "4+4" | "4+0" | "1+1" | "1+0";
  acabadosIds: string[];
  margenBeneficioPorcentaje: number;
  gastosGeneralesPorcentaje?: number;

  // Filtros de parque de maquinaria
  permitirDigital?: boolean;
  permitirOffset?: boolean;
  maquinaForzadaId?: string | null;

  // Tintas especiales
  numPantones?: number;
  nombresPantone?: string;

  // Procesos de alto valor
  barnizUV?: "ninguno" | "offset_proteccion" | "uvi_brillo_total" | "uvi_selectivo" | "uvi_3d_relieve";
  stampingFoil?: "ninguno" | "oro" | "plata" | "cobre" | "holografico";
  golpeSeco?: boolean;

  // Publicaciones
  publicacion?: ParametrosPublicacion;
}

export interface DesglosePublicacionInfo {
  tecnologiaCubierta: "digital" | "offset";
  maquinaCubiertaNombre: string;
  costeImpresionCubierta: number;
  costePapelCubierta: number;
  costePlastificadoCubierta: number;
  costeCartonCompacto: number;
  costeGuardas: number;
  costeConfeccionTapaDura: number;
  costeEncuadernacion: number;
  esTapaDura: boolean;
  detalles: string;
}

export interface DesgloseCosteMaquina {
  maquina: MaquinaConfig;
  imposicion: ResultadoImposicion;
  pliegosNetos: number;
  mermasArranque: number;
  mermasTirada: number;
  mermasAcabados: number;
  totalPliegosBrutos: number;
  pesoPapelKg: number;
  costePapel: number;
  costePreimpresionPlanchas: number;
  costeArranqueMaquina: number;
  costeTiradaMaquina: number;
  costeClicsDigital: number;
  costeAcabados: number;
  costeGuillotinaCorte: number;
  costePantones: number;
  costeBarnizUV: number;
  costeStampingFoil: number;
  costeGolpeSeco: number;
  costePublicacionExtra: number;
  costeIndustrialTotal: number;
  gastosGenerales: number;
  costeTotalEmpresa: number;
  margenBeneficioEuros: number;
  precioVentaSugerido: number;
  costeUnitario: number;
  precioUnitarioSugerido: number;
  esRecomendada: boolean;
  motivoRecomendacion: string;
  tiempoTotalProduccionMinutos: number;
  geometriaPublicacion?: GeometriaPublicacion;
  desglosePublicacion?: DesglosePublicacionInfo;
}

export interface ResultadoEscandalloCompleto {
  parametros: ParametrosCalculo;
  papel: PapelSoporte;
  opcionesMaquinas: DesgloseCosteMaquina[];
  maquinaOptima: DesgloseCosteMaquina;
  puntoCorteCrossover: string;
}

export function calcularEscandalloCompleto(
  params: ParametrosCalculo,
  configPersonalizada?: ConfiguracionEscandalloCompleta
): ResultadoEscandalloCompleto {
  const catalogoPapeles = configPersonalizada?.papeles || PAPELES_CATALOGO;
  const catalogoAcabados = configPersonalizada?.acabados || CATALOGO_ACABADOS;
  const parqueMaquinas = configPersonalizada?.maquinas || PARQUE_MAQUINAS;
  const costesTaller = configPersonalizada?.costesTaller;

  const papel = catalogoPapeles.find(p => p.id === params.papelId) || catalogoPapeles[0];
  const gastosGeneralesPct = params.gastosGeneralesPorcentaje ?? (costesTaller?.gastosGeneralesPorcentajeDefecto ?? 12);
  const margenBeneficioPct = params.margenBeneficioPorcentaje ?? (costesTaller?.margenBeneficioPorcentajeDefecto ?? 35);
  const esPubli = params.publicacion && params.publicacion.esPublicacion;

  let geoPubli: GeometriaPublicacion | undefined;
  if (esPubli && params.publicacion) {
    geoPubli = calcularGeometriaPublicacion(
      params.anchoMm,
      params.altoMm,
      params.publicacion.paginasInteriores,
      params.publicacion.gramajeInterior,
      params.publicacion.tipoEncuadernacion,
      params.publicacion.solapasMm,
      params.publicacion.tipoTapa || "flexible",
      params.publicacion.grosorCartonMm || 2.0
    );
  }

  // Filtrado de máquinas candidatas según tecnología y selección
  const permitirDigital = params.permitirDigital ?? true;
  const permitirOffset = params.permitirOffset ?? true;

  let maquinasCandidatas = parqueMaquinas.filter(m => {
    if (m.tecnologia === "digital" && !permitirDigital) return false;
    if (m.tecnologia === "offset" && !permitirOffset) return false;
    return true;
  });

  if (maquinasCandidatas.length === 0) {
    maquinasCandidatas = parqueMaquinas;
  }

  const resultadosMaquinas: DesgloseCosteMaquina[] = maquinasCandidatas.map(maquina => {
    // 1. Imposición geométrica
    const imposicion = calcularImposicion(params.anchoMm, params.altoMm, params.sangreMm, maquina);
    const poses = imposicion.totalPosesPorPliego;

    // 2. Pliegos Netos
    let factorPliegosTripa = 1;
    let factorSignaturasOffset = 1;

    if (esPubli && geoPubli) {
      factorPliegosTripa = geoPubli.pliegosTripaPorEjemplar;
      factorSignaturasOffset = geoPubli.signaturasTotales;
    }

    const pliegosNetos = Math.ceil((params.cantidadTirada / poses) * factorPliegosTripa);

    // 3. Colores y Caras
    const colorImpr = params.colorImpresion || "4+4";
    const esColor = colorImpr.startsWith("4");
    const esDobleCara = colorImpr.endsWith("4") || colorImpr.endsWith("1");
    const numColoresPorCara = esColor ? 4 : 1;
    const totalCuerposEntintado = esDobleCara ? numColoresPorCara * 2 : numColoresPorCara;

    // 4. Mermas (Maculatura)
    const mermasArranque = maquina.tecnologia === "offset"
      ? (maquina.mermaArranquePliegosPorColor * totalCuerposEntintado * factorSignaturasOffset)
      : maquina.mermaArranquePliegosPorColor;

    const mermasTirada = Math.ceil(pliegosNetos * (maquina.mermaTiradaPorcentaje / 100));
    const mermasAcabados = Math.ceil(pliegosNetos * 0.02);
    const totalPliegosBrutos = pliegosNetos + mermasArranque + mermasTirada + mermasAcabados;

    // 5. Materia Prima (Papel): Peso en Kg
    const m2Pliego = (maquina.pliegoAncho * maquina.pliegoAlto) / 1_000_000;
    const pesoTotalKg = Math.round((m2Pliego * (params.gramaje / 1000) * totalPliegosBrutos) * 100) / 100;
    const costePapel = Math.round((pesoTotalKg * papel.precioKg) * 100) / 100;

    // 6. Preimpresión y Planchas
    let costePreimpresion = 0;
    if (maquina.tecnologia === "offset") {
      const numPlanchas = totalCuerposEntintado * factorSignaturasOffset;
      costePreimpresion = numPlanchas * maquina.costePlancha;
    }

    // 7. Impresión (Setup + Tirada + Clics)
    let costeArranque = 0;
    let costeTirada = 0;
    let costeClics = 0;
    let tiempoProduccionMinutos = 0;

    if (maquina.tecnologia === "digital") {
      const caras = esDobleCara ? 2 : 1;
      const tarifaClic = esColor ? maquina.costeClicColorPliego : maquina.costeClicBnPliego;
      costeClics = Math.round((totalPliegosBrutos * caras * tarifaClic) * 100) / 100;

      const tiempoSetupMin = maquina.tiempoArregloMinutos;
      const tiempoTiradaMin = (totalPliegosBrutos / maquina.velocidadPliegosHora) * 60;
      tiempoProduccionMinutos = Math.round(tiempoSetupMin + tiempoTiradaMin);
      costeArranque = Math.round((tiempoSetupMin / 60 * maquina.costeHora) * 100) / 100;
      costeTirada = Math.round((tiempoTiradaMin / 60 * maquina.costeHora) * 100) / 100;
    } else {
      const tiempoSetupMin = maquina.tiempoArregloMinutos * factorSignaturasOffset;
      const tiempoTiradaMin = (totalPliegosBrutos / maquina.velocidadPliegosHora) * 60;
      tiempoProduccionMinutos = Math.round(tiempoSetupMin + tiempoTiradaMin);

      costeArranque = Math.round(((tiempoSetupMin / 60) * maquina.costeHora) * 100) / 100;
      const costeTintaQuimicos = totalPliegosBrutos * 0.006 * totalCuerposEntintado;
      costeTirada = Math.round((((tiempoTiradaMin / 60) * maquina.costeHora) + costeTintaQuimicos) * 100) / 100;
    }

    // 8. Guillotina (Corte de pliego a poses unitarias)
    const costeGuillotinaFijo = costesTaller?.costeGuillotinaFijo ?? 10.0;
    const costeGuillotinaPorTaco = costesTaller?.costeGuillotinaPorGolpeTaco ?? 0.45;
    const golpesGuillotina = 4 + (imposicion.posesColumnas - 1) + (imposicion.posesFilas - 1);
    const tacosCorte = Math.ceil(totalPliegosBrutos / 500);
    const costeGuillotina = Math.round((costeGuillotinaFijo + tacosCorte * golpesGuillotina * costeGuillotinaPorTaco) * 100) / 100;

    // 9. Tintas Especiales (Pantones)
    let costePantones = 0;
    const numPant = params.numPantones || 0;
    const lavadoTarifa = costesTaller?.costeLavadoTinteroPantone ?? 35.0;
    const tintaOffsetPliego = costesTaller?.costeTintaPantoneOffsetPliego ?? 0.008;
    const tintaDigitalPliego = costesTaller?.costeTintaPantoneDigitalPliego ?? 0.035;

    if (numPant > 0) {
      if (maquina.tecnologia === "offset") {
        const planchasPantone = numPant * (esDobleCara ? 2 : 1) * factorSignaturasOffset;
        costePreimpresion += planchasPantone * maquina.costePlancha;
        const lavadoTinteros = numPant * lavadoTarifa; // coste por lavado de cuerpo
        const tintaEspecial = totalPliegosBrutos * tintaOffsetPliego * numPant;
        costePantones = Math.round((lavadoTinteros + tintaEspecial) * 100) / 100;
      } else {
        costePantones = Math.round((totalPliegosBrutos * tintaDigitalPliego * numPant) * 100) / 100;
      }
    }

    // 10. Procesos de Alto Valor (Barniz UV, Stamping Foil, Golpe en Seco)
    let costeBarnizUV = 0;
    if (params.barnizUV && params.barnizUV !== "ninguno") {
      const barnizCfg = catalogoAcabados[params.barnizUV];
      if (barnizCfg) {
        costeBarnizUV = Math.round((barnizCfg.tarifaFijaArranque + totalPliegosBrutos * barnizCfg.precioUnitario) * 100) / 100;
      } else {
        switch (params.barnizUV) {
          case "offset_proteccion":
            costeBarnizUV = Math.round((15.0 + totalPliegosBrutos * 0.012) * 100) / 100;
            break;
          case "uvi_brillo_total":
            costeBarnizUV = Math.round((25.0 + totalPliegosBrutos * 0.035) * 100) / 100;
            break;
          case "uvi_selectivo":
            costeBarnizUV = Math.round((45.0 + totalPliegosBrutos * 0.065) * 100) / 100;
            break;
          case "uvi_3d_relieve":
            costeBarnizUV = Math.round((35.0 + totalPliegosBrutos * 0.095) * 100) / 100;
            break;
        }
      }
    }

    let costeStampingFoil = 0;
    if (params.stampingFoil && params.stampingFoil !== "ninguno") {
      const stampingKey = `stamping_${params.stampingFoil}`;
      const stampingCfg = catalogoAcabados[stampingKey] || catalogoAcabados["stamping_oro"];
      if (stampingCfg) {
        costeStampingFoil = Math.round((stampingCfg.tarifaFijaArranque + params.cantidadTirada * stampingCfg.precioUnitario) * 100) / 100;
      } else {
        costeStampingFoil = Math.round((48.0 + 20.0 + totalPliegosBrutos * 0.045) * 100) / 100;
      }
    }

    let costeGolpeSeco = 0;
    if (params.golpeSeco) {
      const golpeCfg = catalogoAcabados["golpe_seco"];
      if (golpeCfg) {
        costeGolpeSeco = Math.round((golpeCfg.tarifaFijaArranque + params.cantidadTirada * golpeCfg.precioUnitario) * 100) / 100;
      } else {
        costeGolpeSeco = Math.round((55.0 + 18.0 + totalPliegosBrutos * 0.035) * 100) / 100;
      }
    }

    // 11. Coste extra de Publicaciones (Cubierta Híbrida Digital/Offset + Tapa Dura Contracolada + Encuadernación)
    let costePublicacionExtra = 0;
    let desglosePublicacion: DesglosePublicacionInfo | undefined;

    if (esPubli && params.publicacion && geoPubli) {
      const pub = params.publicacion;
      const esTapaDura = pub.tipoTapa === "dura_contracolada";
      const grosorCarton = pub.grosorCartonMm || 2.0;

      // Determinación de la máquina de cubierta (Híbrida Digital vs Offset):
      let tecnoCubierta: "digital" | "offset" = "digital";
      let maqCubierta: MaquinaConfig;

      if (pub.impresionCubiertaTecnologia === "offset") {
        tecnoCubierta = "offset";
        maqCubierta = maquina.tecnologia === "offset" 
          ? maquina 
          : (parqueMaquinas.find(m => m.id === "speedmaster-32x52") || parqueMaquinas.find(m => m.tecnologia === "offset") || maquina);
      } else if (pub.impresionCubiertaTecnologia === "digital") {
        tecnoCubierta = "digital";
        maqCubierta = pub.maquinaCubiertaId 
          ? (parqueMaquinas.find(m => m.id === pub.maquinaCubiertaId) || parqueMaquinas.find(m => m.id === "ricoh-7200") || parqueMaquinas[0])
          : (parqueMaquinas.find(m => m.id === "ricoh-7200") || parqueMaquinas.find(m => m.tecnologia === "digital") || parqueMaquinas[0]);
      } else {
        // Modo "auto": para tiradas de hasta 1.200 cubiertas, la prensa digital evita 4 u 8 planchas CTP y es mucho más rentable
        if (params.cantidadTirada <= 1200) {
          tecnoCubierta = "digital";
          maqCubierta = parqueMaquinas.find(m => m.id === "ricoh-7200") || parqueMaquinas[0];
        } else {
          tecnoCubierta = maquina.tecnologia === "offset" ? "offset" : "digital";
          maqCubierta = tecnoCubierta === "offset" ? maquina : (parqueMaquinas.find(m => m.id === "ricoh-9200") || parqueMaquinas[0]);
        }
      }

      // Dimensiones de la cubierta o papel forro extendido:
      const anchoCubiertaTrabajo = esTapaDura ? geoPubli.anchoForroAbiertoMm : geoPubli.anchoCubiertaAbierta;
      const altoCubiertaTrabajo = esTapaDura ? geoPubli.altoForroAbiertoMm : geoPubli.altoCubiertaAbierta;

      // Imposición de la cubierta en la prensa de cubierta seleccionada
      const imposCubierta = calcularImposicion(anchoCubiertaTrabajo, altoCubiertaTrabajo, params.sangreMm, maqCubierta);
      const posesCub = Math.max(1, imposCubierta.totalPosesPorPliego);
      const pliegosCubNetos = Math.ceil(params.cantidadTirada / posesCub);

      const colorPortadaStr = pub.colorPortada || "4+0";
      const esCubColor = colorPortadaStr.startsWith("4");
      const esCubDobleCara = colorPortadaStr.endsWith("4") || colorPortadaStr.endsWith("1");
      const carasCub = esCubDobleCara ? 2 : 1;

      let costeImpresionCubierta = 0;
      let pliegosCubBrutos = pliegosCubNetos;

      if (tecnoCubierta === "digital") {
        const mermaCubDigital = Math.max(4, Math.ceil(pliegosCubNetos * 0.02));
        pliegosCubBrutos = pliegosCubNetos + mermaCubDigital;
        const tarifaClicCub = esCubColor ? maqCubierta.costeClicColorPliego : maqCubierta.costeClicBnPliego;
        const costeClicsCub = pliegosCubBrutos * carasCub * tarifaClicCub;
        const tiempoTiradaMinCub = (pliegosCubBrutos / maqCubierta.velocidadPliegosHora) * 60;
        const costeMaquinaCub = ((maqCubierta.tiempoArregloMinutos + tiempoTiradaMinCub) / 60) * maqCubierta.costeHora;
        costeImpresionCubierta = Math.round((costeClicsCub + costeMaquinaCub) * 100) / 100;
      } else {
        const numPlanchasCub = (esCubColor ? 4 : 1) * carasCub;
        const costePlanchasCub = numPlanchasCub * maqCubierta.costePlancha;
        const mermaArranqueCub = maqCubierta.mermaArranquePliegosPorColor * numPlanchasCub;
        const mermaTiradaCub = Math.ceil(pliegosCubNetos * (maqCubierta.mermaTiradaPorcentaje / 100));
        pliegosCubBrutos = pliegosCubNetos + mermaArranqueCub + mermaTiradaCub;
        const tiempoTiradaMinCub = (pliegosCubBrutos / maqCubierta.velocidadPliegosHora) * 60;
        const costeMaquinaCub = ((maqCubierta.tiempoArregloMinutos + tiempoTiradaMinCub) / 60) * maqCubierta.costeHora;
        const costeTintaCub = pliegosCubBrutos * 0.005 * numPlanchasCub;
        costeImpresionCubierta = Math.round((costePlanchasCub + costeMaquinaCub + costeTintaCub) * 100) / 100;
      }

      // Costes de Materia Prima: Papel Cubierta, Cartón Compacto y Guardas
      let costePapelCubierta = 0;
      let costeCartonCompacto = 0;
      let costeGuardas = 0;
      let costeConfeccionTapaDura = 0;

      if (esTapaDura) {
        // 1. Papel Forro Exterior (Couché 150g forrado)
        const papelForro = catalogoPapeles.find(p => p.id === "estucado-mate") || catalogoPapeles[0];
        const m2PliegoForro = (maqCubierta.pliegoAncho * maqCubierta.pliegoAlto) / 1_000_000;
        const pesoForroKg = m2PliegoForro * (150 / 1000) * pliegosCubBrutos;
        costePapelCubierta = Math.round((pesoForroKg * papelForro.precioKg) * 100) / 100;

        // 2. Cartón Compacto Rígido (grosorCarton mm)
        const precioKgCarton = costesTaller?.precioKgCartonCompacto ?? 1.65;
        const densidadCarton = costesTaller?.densidadCartonCompacto ?? 0.75;
        const m2CartonPorEjemplar = ((geoPubli.anchoCartonTapaMm * geoPubli.altoCartonTapaMm * 2) + 
          (geoPubli.lomoMm * geoPubli.altoCartonTapaMm)) / 1_000_000;
        const pesoCartonTotalKg = m2CartonPorEjemplar * (grosorCarton * densidadCarton) * params.cantidadTirada * 1.05;
        costeCartonCompacto = Math.round((pesoCartonTotalKg * precioKgCarton) * 100) / 100;

        // 3. Guardas Interiores (2 dípticos 120g offset blanco o espejo)
        const m2GuardasPorEjemplar = (geoPubli.anchoCerrado * 2 * geoPubli.altoCerrado * 2) / 1_000_000;
        const pesoGuardasKg = m2GuardasPorEjemplar * (120 / 1000) * params.cantidadTirada * 1.05;
        const papelGuardas = catalogoPapeles.find(p => p.id === "offset-blanco") || catalogoPapeles[2] || catalogoPapeles[0];
        costeGuardas = Math.round((pesoGuardasKg * papelGuardas.precioKg) * 100) / 100;

        // 4. Confección mecánica de tapa dura (corte cartón, encolado, contracolado y vueltas)
        costeConfeccionTapaDura = Math.round((35.0 + params.cantidadTirada * 0.45) * 100) / 100;
      } else {
        // Tapa Blanda / Flexible
        const cubPapel = catalogoPapeles.find(p => p.id === pub.papelPortadaId) || papel;
        const m2PliegoCub = (maqCubierta.pliegoAncho * maqCubierta.pliegoAlto) / 1_000_000;
        const pesoCubKg = m2PliegoCub * (pub.gramajePortada / 1000) * pliegosCubBrutos;
        costePapelCubierta = Math.round((pesoCubKg * cubPapel.precioKg) * 100) / 100;
      }

      // Plastificado de la cubierta / forro:
      let costePlastificadoCubierta = 0;
      const plastId = pub.plastificadoCubiertaId || (esTapaDura ? "plastificado_mate_1c" : "");
      if (plastId && catalogoAcabados[plastId]) {
        const plastCfg = catalogoAcabados[plastId];
        costePlastificadoCubierta = Math.round((plastCfg.tarifaFijaArranque + pliegosCubBrutos * plastCfg.precioUnitario) * 100) / 100;
      }

      // Encuadernación / Montaje según tipo:
      let setupEncuadernacion = 25.0;
      let tarifaEncuadernacion = 0.05;

      switch (pub.tipoEncuadernacion) {
        case "wire_o":
          if (esTapaDura) {
            setupEncuadernacion = 40.0;
            tarifaEncuadernacion = 0.65; // Perforación de cartón rígido 2mm y cierre Wire-O
          } else {
            setupEncuadernacion = 30.0;
            tarifaEncuadernacion = 0.40;
          }
          break;
        case "espiral":
          setupEncuadernacion = 25.0;
          tarifaEncuadernacion = esTapaDura ? 0.55 : 0.30;
          break;
        case "rustica_pur":
          if (esTapaDura) {
            setupEncuadernacion = 65.0;
            tarifaEncuadernacion = 0.85; // Encajado cartoné de libro a tapa dura
          } else {
            setupEncuadernacion = 45.0;
            tarifaEncuadernacion = 0.35;
          }
          break;
        case "rustica_cosida":
          if (esTapaDura) {
            setupEncuadernacion = 85.0;
            tarifaEncuadernacion = 1.15; // Cosido + encajado cartoné
          } else {
            setupEncuadernacion = 65.0;
            tarifaEncuadernacion = 0.55;
          }
          break;
        case "grapado":
        default:
          setupEncuadernacion = 20.0;
          tarifaEncuadernacion = 0.045;
          break;
      }

      const costeManoEncuadernacion = Math.round((setupEncuadernacion + params.cantidadTirada * tarifaEncuadernacion) * 100) / 100;

      costePublicacionExtra = Math.round((
        costePapelCubierta +
        costeCartonCompacto +
        costeGuardas +
        costeImpresionCubierta +
        costePlastificadoCubierta +
        costeConfeccionTapaDura +
        costeManoEncuadernacion
      ) * 100) / 100;

      const descDetalles = esTapaDura
        ? `Tapa Dura Contracolada (${grosorCarton}mm). Cubierta impresa en ${maqCubierta.nombre} [${tecnoCubierta.toUpperCase()}]. Incluye forro exterior, cartón compacto, guardas y encuadernación.`
        : `Tapa Flexible. Cubierta impresa en ${maqCubierta.nombre} [${tecnoCubierta.toUpperCase()}].`;

      desglosePublicacion = {
        tecnologiaCubierta: tecnoCubierta,
        maquinaCubiertaNombre: maqCubierta.nombre,
        costeImpresionCubierta,
        costePapelCubierta,
        costePlastificadoCubierta,
        costeCartonCompacto,
        costeGuardas,
        costeConfeccionTapaDura,
        costeEncuadernacion: costeManoEncuadernacion,
        esTapaDura,
        detalles: descDetalles
      };
    }

    // 12. Acabados y Manipulados
    let costeAcabados = 0;
    for (const acabadoId of params.acabadosIds) {
      const cfg = catalogoAcabados[acabadoId];
      if (cfg) {
        let variable = 0;
        if (cfg.tipoCobro === "pliego") {
          variable = totalPliegosBrutos * cfg.precioUnitario;
        } else if (cfg.tipoCobro === "unidad") {
          variable = params.cantidadTirada * cfg.precioUnitario;
        } else if (cfg.tipoCobro === "m2") {
          const m2Total = (params.anchoMm * params.altoMm / 1_000_000) * params.cantidadTirada;
          variable = m2Total * cfg.precioUnitario;
        }
        costeAcabados += cfg.tarifaFijaArranque + variable;
      }
    }
    costeAcabados = Math.round(costeAcabados * 100) / 100;

    // 13. Totales Financieros & Márgenes
    const costeIndustrial = Math.round((
      costePapel +
      costePreimpresion +
      costeArranque +
      costeTirada +
      costeClics +
      costeGuillotina +
      costePantones +
      costeBarnizUV +
      costeStampingFoil +
      costeGolpeSeco +
      costePublicacionExtra +
      costeAcabados
    ) * 100) / 100;

    const gastosGenerales = Math.round((costeIndustrial * (gastosGeneralesPct / 100)) * 100) / 100;
    const costeTotalEmpresa = Math.round((costeIndustrial + gastosGenerales) * 100) / 100;

    const margenBeneficioEuros = Math.round((costeTotalEmpresa * (margenBeneficioPct / 100)) * 100) / 100;
    const precioVentaSugerido = Math.round((costeTotalEmpresa + margenBeneficioEuros) * 100) / 100;

    const costeUnitario = Math.round((costeTotalEmpresa / params.cantidadTirada) * 1000) / 1000;
    const precioUnitario = Math.round((precioVentaSugerido / params.cantidadTirada) * 1000) / 1000;

    return {
      maquina,
      imposicion,
      pliegosNetos,
      mermasArranque,
      mermasTirada,
      mermasAcabados,
      totalPliegosBrutos,
      pesoPapelKg: pesoTotalKg,
      costePapel,
      costePreimpresionPlanchas: costePreimpresion,
      costeArranqueMaquina: costeArranque,
      costeTiradaMaquina: costeTirada,
      costeClicsDigital: costeClics,
      costeAcabados,
      costeGuillotinaCorte: costeGuillotina,
      costePantones,
      costeBarnizUV,
      costeStampingFoil,
      costeGolpeSeco,
      costePublicacionExtra,
      costeIndustrialTotal: costeIndustrial,
      gastosGenerales,
      costeTotalEmpresa,
      margenBeneficioEuros,
      precioVentaSugerido,
      costeUnitario,
      precioUnitarioSugerido: precioUnitario,
      esRecomendada: false,
      motivoRecomendacion: "",
      tiempoTotalProduccionMinutos: tiempoProduccionMinutos,
      geometriaPublicacion: geoPubli,
      desglosePublicacion
    };
  });

  // Determinar la máquina óptima o forzada
  let mejorIndice = 0;
  if (params.maquinaForzadaId) {
    const idxForzada = resultadosMaquinas.findIndex(m => m.maquina.id === params.maquinaForzadaId);
    if (idxForzada !== -1) {
      mejorIndice = idxForzada;
    }
  } else {
    let menorCoste = resultadosMaquinas[0].costeTotalEmpresa;
    for (let i = 1; i < resultadosMaquinas.length; i++) {
      if (resultadosMaquinas[i].costeTotalEmpresa < menorCoste) {
        menorCoste = resultadosMaquinas[i].costeTotalEmpresa;
        mejorIndice = i;
      }
    }
  }

  resultadosMaquinas[mejorIndice].esRecomendada = true;
  const maqOptima = resultadosMaquinas[mejorIndice];

  if (maqOptima.maquina.tecnologia === "digital") {
    maqOptima.motivoRecomendacion = `Tirada idónea para Prensa Digital (${maqOptima.maquina.nombre}): Sin planchas CTP y maculatura mínima.`;
  } else {
    maqOptima.motivoRecomendacion = `Tirada idónea para Prensa Offset (${maqOptima.maquina.nombre}): La alta velocidad de tirada diluye el coste de planchas logrando un coste unitario de solo ${maqOptima.costeUnitario.toFixed(3)} €/ud.`;
  }

  const puntoCorte = params.cantidadTirada < 800
    ? "Punto de cruce Offset/Digital estimado en ~800-1.200 ejemplares. Para tiradas inferiores, Digital es imbatible en precio."
    : "Superado el umbral de rentabilidad digital (~1.000 ejemplares). Las prensas Offset ofrecen el coste marginal más competitivo.";

  return {
    parametros: params,
    papel,
    opcionesMaquinas: resultadosMaquinas,
    maquinaOptima: maqOptima,
    puntoCorteCrossover: puntoCorte
  };
}

/**
 * 📖 MOTOR DE GEOMETRÍA DE PLEGADO Y DESPLEGABLES (Palas & Ventanas)
 */
export interface PalaDesplegable {
  numero: number;
  nombre: string;
  ancho: number;
  alto: number;
  tipo: "portada" | "contraportada" | "interior" | "solapa";
  reduccionMm: number;
}

export interface DesglosePlegado {
  tipoId: string;
  nombre: string;
  numPalas: number;
  numPaginas: number;
  numPliegues: number;
  anchoAbierto: number;
  altoAbierto: number;
  anchoCerrado: number;
  altoCerrado: number;
  palas: PalaDesplegable[];
  requiereHendidoSugerido: boolean;
  descripcionTecnica: string;
}

export const TIPOS_PLEGADO = [
  { id: "hoja_simple", nombre: "Hoja Simple / Flyer", palas: 1, paginas: 2, desc: "Sin pliegues" },
  { id: "diptico", nombre: "Díptico (1 pliegue en V)", palas: 2, paginas: 4, desc: "2 palas iguales" },
  { id: "triptico_envolvente", nombre: "Tríptico Envolvente / Cilindro", palas: 3, paginas: 6, desc: "2 palas normales + 1 solapa interior (-3mm)" },
  { id: "triptico_acordeon", nombre: "Tríptico Acordeón / Z", palas: 3, paginas: 6, desc: "3 palas exactamente iguales" },
  { id: "cuadriptico_envolvente", nombre: "Cuadríptico Envolvente", palas: 4, paginas: 8, desc: "Palas exteriores y solapas interiores escalonadas" },
  { id: "cuadriptico_acordeon", nombre: "Cuadríptico Acordeón / Z", palas: 4, paginas: 8, desc: "4 palas iguales en zigzag" },
  { id: "cuadriptico_ventana", nombre: "Cuadríptico en Ventana (Gate Fold)", palas: 4, paginas: 8, desc: "Cuerpo central doble y 2 alas que cierran al centro" },
  { id: "desplegable_5_palas", nombre: "Desplegable 5 Palas (10 páginas)", palas: 5, paginas: 10, desc: "5 palas continuas en acordeón" },
  { id: "desplegable_6_palas", nombre: "Desplegable 6 Palas (12 páginas)", palas: 6, paginas: 12, desc: "6 palas continuas en acordeón" }
];

export function calcularGeometriaDesplegable(
  tipoPlegadoId: string,
  modoDefinicion: "cerrado" | "abierto",
  anchoBase: number,
  altoBase: number,
  gramaje: number
): DesglosePlegado {
  const tipo = TIPOS_PLEGADO.find(t => t.id === tipoPlegadoId) || TIPOS_PLEGADO[1];
  const requiereHendido = gramaje >= 170;

  let anchoAbierto = 0;
  let altoAbierto = altoBase;
  let anchoCerrado = 0;
  let altoCerrado = altoBase;
  const palas: PalaDesplegable[] = [];

  if (tipoPlegadoId === "hoja_simple") {
    anchoAbierto = anchoBase;
    anchoCerrado = anchoBase;
    palas.push({ numero: 1, nombre: "Cara / Dorso", ancho: anchoBase, alto: altoBase, tipo: "portada", reduccionMm: 0 });
  } else if (tipoPlegadoId === "diptico") {
    if (modoDefinicion === "cerrado") {
      anchoCerrado = anchoBase;
      anchoAbierto = anchoBase * 2;
    } else {
      anchoAbierto = anchoBase;
      anchoCerrado = Math.round(anchoBase / 2);
    }
    const wPala = Math.round(anchoAbierto / 2);
    palas.push(
      { numero: 1, nombre: "Pala Exterior / Portada", ancho: wPala, alto: altoBase, tipo: "portada", reduccionMm: 0 },
      { numero: 2, nombre: "Pala Interior / Contra", ancho: wPala, alto: altoBase, tipo: "interior", reduccionMm: 0 }
    );
  } else if (tipoPlegadoId === "triptico_envolvente") {
    if (modoDefinicion === "cerrado") {
      anchoCerrado = anchoBase;
      const wSolapa = anchoBase - 3;
      anchoAbierto = anchoBase * 2 + wSolapa;
      palas.push(
        { numero: 1, nombre: "Portada", ancho: anchoBase, alto: altoBase, tipo: "portada", reduccionMm: 0 },
        { numero: 2, nombre: "Pala Central", ancho: anchoBase, alto: altoBase, tipo: "interior", reduccionMm: 0 },
        { numero: 3, nombre: "Solapa Interior", ancho: wSolapa, alto: altoBase, tipo: "solapa", reduccionMm: 3 }
      );
    } else {
      anchoAbierto = anchoBase;
      const wNormal = Math.round((anchoBase + 3) / 3);
      const wSolapa = anchoBase - wNormal * 2;
      anchoCerrado = wNormal;
      palas.push(
        { numero: 1, nombre: "Portada", ancho: wNormal, alto: altoBase, tipo: "portada", reduccionMm: 0 },
        { numero: 2, nombre: "Pala Central", ancho: wNormal, alto: altoBase, tipo: "interior", reduccionMm: 0 },
        { numero: 3, nombre: "Solapa Interior", ancho: wSolapa, alto: altoBase, tipo: "solapa", reduccionMm: wNormal - wSolapa }
      );
    }
  } else if (tipoPlegadoId === "triptico_acordeon") {
    if (modoDefinicion === "cerrado") {
      anchoCerrado = anchoBase;
      anchoAbierto = anchoBase * 3;
    } else {
      anchoAbierto = anchoBase;
      anchoCerrado = Math.round(anchoBase / 3);
    }
    const w = Math.round(anchoAbierto / 3);
    palas.push(
      { numero: 1, nombre: "Pala 1", ancho: w, alto: altoBase, tipo: "portada", reduccionMm: 0 },
      { numero: 2, nombre: "Pala 2", ancho: w, alto: altoBase, tipo: "interior", reduccionMm: 0 },
      { numero: 3, nombre: "Pala 3", ancho: w, alto: altoBase, tipo: "interior", reduccionMm: 0 }
    );
  } else if (tipoPlegadoId === "cuadriptico_envolvente") {
    if (modoDefinicion === "cerrado") {
      anchoCerrado = anchoBase;
      const w1 = anchoBase;
      const w2 = anchoBase;
      const w3 = anchoBase - 2;
      const w4 = anchoBase - 4;
      anchoAbierto = w1 + w2 + w3 + w4;
      palas.push(
        { numero: 1, nombre: "Portada", ancho: w1, alto: altoBase, tipo: "portada", reduccionMm: 0 },
        { numero: 2, nombre: "Pala Central", ancho: w2, alto: altoBase, tipo: "interior", reduccionMm: 0 },
        { numero: 3, nombre: "Pala Plegada 1", ancho: w3, alto: altoBase, tipo: "solapa", reduccionMm: 2 },
        { numero: 4, nombre: "Solapa Interior", ancho: w4, alto: altoBase, tipo: "solapa", reduccionMm: 4 }
      );
    } else {
      anchoAbierto = anchoBase;
      const wNormal = Math.round((anchoBase + 6) / 4);
      const w3 = wNormal - 2;
      const w4 = anchoBase - (wNormal * 2 + w3);
      anchoCerrado = wNormal;
      palas.push(
        { numero: 1, nombre: "Portada", ancho: wNormal, alto: altoBase, tipo: "portada", reduccionMm: 0 },
        { numero: 2, nombre: "Pala Central", ancho: wNormal, alto: altoBase, tipo: "interior", reduccionMm: 0 },
        { numero: 3, nombre: "Pala Plegada 1", ancho: w3, alto: altoBase, tipo: "solapa", reduccionMm: 2 },
        { numero: 4, nombre: "Solapa Interior", ancho: w4, alto: altoBase, tipo: "solapa", reduccionMm: wNormal - w4 }
      );
    }
  } else if (tipoPlegadoId === "cuadriptico_ventana") {
    if (modoDefinicion === "cerrado") {
      anchoCerrado = anchoBase;
      const wCentral = anchoBase;
      const wAla = Math.round((wCentral - 2) / 2);
      anchoAbierto = wCentral + wAla * 2;
      palas.push(
        { numero: 1, nombre: "Ala Izquierda", ancho: wAla, alto: altoBase, tipo: "solapa", reduccionMm: 0 },
        { numero: 2, nombre: "Cuerpo Central", ancho: wCentral, alto: altoBase, tipo: "interior", reduccionMm: 0 },
        { numero: 3, nombre: "Ala Derecha", ancho: wAla, alto: altoBase, tipo: "solapa", reduccionMm: 0 }
      );
    } else {
      anchoAbierto = anchoBase;
      const wCentral = Math.round(anchoBase / 2);
      const wAla = Math.round((anchoBase - wCentral) / 2);
      anchoCerrado = wCentral;
      palas.push(
        { numero: 1, nombre: "Ala Izquierda", ancho: wAla, alto: altoBase, tipo: "solapa", reduccionMm: 0 },
        { numero: 2, nombre: "Cuerpo Central", ancho: wCentral, alto: altoBase, tipo: "interior", reduccionMm: 0 },
        { numero: 3, nombre: "Ala Derecha", ancho: wAla, alto: altoBase, tipo: "solapa", reduccionMm: 0 }
      );
    }
  } else {
    const n = tipo.palas;
    if (modoDefinicion === "cerrado") {
      anchoCerrado = anchoBase;
      anchoAbierto = anchoBase * n;
    } else {
      anchoAbierto = anchoBase;
      anchoCerrado = Math.round(anchoBase / n);
    }
    const w = Math.round(anchoAbierto / n);
    for (let i = 1; i <= n; i++) {
      palas.push({
        numero: i,
        nombre: `Pala ${i}`,
        ancho: w,
        alto: altoBase,
        tipo: i === 1 ? "portada" : i === n ? "contraportada" : "interior",
        reduccionMm: 0
      });
    }
  }

  const descPalas = palas.map(p => `${p.ancho}mm${p.reduccionMm > 0 ? ` (-${p.reduccionMm}mm)` : ''}`).join(" + ");
  const descTecnica = `${tipo.nombre}: Abierto ${anchoAbierto}x${altoAbierto} mm | Cerrado ${anchoCerrado}x${altoCerrado} mm [Palas: ${descPalas}]. ${requiereHendido ? '⚠️ Requiere hendido previo por gramaje ≥ 170g.' : ''}`;

  return {
    tipoId: tipoPlegadoId,
    nombre: tipo.nombre,
    numPalas: tipo.palas,
    numPaginas: tipo.paginas,
    numPliegues: tipo.palas - 1,
    anchoAbierto,
    altoAbierto,
    anchoCerrado,
    altoCerrado,
    palas,
    requiereHendidoSugerido: requiereHendido,
    descripcionTecnica: descTecnica
  };
}

/**
 * 📊 MOTOR DE ESCALADO DE PRECIOS POR VOLUMEN (Quantity Price Escalation)
 */
export interface FilaEscalado {
  cantidad: number;
  maquinaOptimaNombre: string;
  tecnologia: "digital" | "offset";
  costeTotal: number;
  precioVentaSugerido: number;
  costeUnitario: number;
  precioUnitario: number;
  margenEuros: number;
}

export function generarTramosIntervalo(desde: number, hasta: number, paso: number): number[] {
  const inicio = Math.max(1, Math.min(desde, hasta));
  const fin = Math.max(inicio, hasta);
  const salto = Math.max(1, paso);
  const tramos: number[] = [];

  for (let c = inicio; c <= fin; c += salto) {
    tramos.push(c);
  }

  // Asegurar que el límite 'hasta' exacto esté incluido
  if (tramos[tramos.length - 1] !== fin && fin > inicio) {
    tramos.push(fin);
  }

  return Array.from(new Set(tramos)).sort((a, b) => a - b);
}

export function calcularEscaladoCantidades(
  params: Omit<ParametrosCalculo, "cantidadTirada">,
  tramos: number[] = [100, 250, 500, 1000, 2500, 5000, 10000],
  configPersonalizada?: ConfiguracionEscandalloCompleta
): FilaEscalado[] {
  return tramos.map(cant => {
    const res = calcularEscandalloCompleto({
      ...params,
      cantidadTirada: cant
    }, configPersonalizada);
    const maq = res.maquinaOptima;
    return {
      cantidad: cant,
      maquinaOptimaNombre: maq.maquina.nombre,
      tecnologia: maq.maquina.tecnologia,
      costeTotal: maq.costeTotalEmpresa,
      precioVentaSugerido: maq.precioVentaSugerido,
      costeUnitario: maq.costeUnitario,
      precioUnitario: maq.precioUnitarioSugerido,
      margenEuros: maq.margenBeneficioEuros
    };
  });
}

/**
 * 🛒 MODELO DE CESTA / PRESUPUESTO MULTILÍNEA
 */
export interface ArticuloCestaEscandallo {
  id: string;
  nombre: string;
  categoria: CategoriaProductoId;
  cantidad: number;
  anchoMm: number;
  altoMm: number;
  papelNombre: string;
  gramaje: number;
  colorImpresion: string;
  detallesTecnicos: string;
  maquinaOptimaNombre: string;
  tecnologia: "digital" | "offset";
  costeProduccionTotal: number;
  costeUnitario: number;
  precioVentaSugerido: number;
  precioUnitario: number;
  margenBeneficioEuros: number;
  margenPorcentaje: number;
}
