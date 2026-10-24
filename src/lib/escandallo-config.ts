// src/lib/escandallo-config.ts
import type { CategoriaProductoId } from "./escandallo-imprenta";
import { writable, get } from "svelte/store";

export interface PapelConfig {
  id: string;
  nombre: string;
  gramajes: number[];
  precioKg: number; // Euros / Kg
  densidadAparente: string;
  tamanoPliegoEstandar?: string; // ej. "70x100 cm", "50x70 cm", "32x45 cm"
}

export interface AcabadoItemConfig {
  id: string;
  nombre: string;
  categoria: "plastificado" | "barniz" | "stamping" | "manipulado" | "encuadernacion";
  tipoCobro: "fijo" | "pliego" | "unidad" | "m2";
  tarifaFijaArranque: number;
  precioUnitario: number;
}

export interface MaquinaItemConfig {
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

export interface CostesTallerConfig {
  costeGuillotinaFijo: number;
  costeGuillotinaPorGolpeTaco: number;
  costeLavadoTinteroPantone: number;
  costeTintaPantoneOffsetPliego: number;
  costeTintaPantoneDigitalPliego: number;
  precioKgCartonCompacto: number;
  densidadCartonCompacto: number; // kg/m² por mm de grosor
  gastosGeneralesPorcentajeDefecto: number;
  margenBeneficioPorcentajeDefecto: number;
}

export interface ProductoPresetConfig {
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

export interface ConfiguracionEscandalloCompleta {
  papeles: PapelConfig[];
  acabados: Record<string, AcabadoItemConfig>;
  maquinas: MaquinaItemConfig[];
  costesTaller: CostesTallerConfig;
  presets: ProductoPresetConfig[];
  actualizadoEn?: string;
  version?: number;
}

export const DEFAULT_CONFIGURACION_ESCANDALLO: ConfiguracionEscandalloCompleta = {
  version: 2,
  actualizadoEn: new Date().toISOString(),
  papeles: [
    {
      id: "estucado-mate",
      nombre: "Estucado / Couché Mate",
      gramajes: [90, 115, 135, 150, 170, 200, 250, 300, 350],
      precioKg: 1.85,
      densidadAparente: "Sedoso de alta blancura",
      tamanoPliegoEstandar: "70x100 cm"
    },
    {
      id: "estucado-brillo",
      nombre: "Estucado / Couché Brillo",
      gramajes: [90, 115, 135, 150, 170, 200, 250, 300, 350],
      precioKg: 1.80,
      densidadAparente: "Brillo comercial estándar",
      tamanoPliegoEstandar: "70x100 cm"
    },
    {
      id: "offset-blanco",
      nombre: "Offset / Papel Bond Blanco",
      gramajes: [80, 90, 100, 120, 140],
      precioKg: 2.10,
      densidadAparente: "Poroso para escritura, libros y agendas",
      tamanoPliegoEstandar: "70x100 cm"
    },
    {
      id: "folding-calibre",
      nombre: "Cartulina Folding Estucada 1C",
      gramajes: [240, 280, 300, 350],
      precioKg: 2.45,
      densidadAparente: "Rigidez para portadas, carpetas y packaging",
      tamanoPliegoEstandar: "72x102 cm"
    },
    {
      id: "kraft-reciclado",
      nombre: "Kraft Ecológico / Reciclado",
      gramajes: [120, 170, 250, 300],
      precioKg: 2.20,
      densidadAparente: "Tono marrón natural y rústico",
      tamanoPliegoEstandar: "70x100 cm"
    }
  ],
  acabados: {
    // Plastificados
    plastificado_brillo_1c: {
      id: "plastificado_brillo_1c",
      nombre: "Plastificado Brillo 1 Cara",
      categoria: "plastificado",
      tipoCobro: "pliego",
      tarifaFijaArranque: 12.0,
      precioUnitario: 0.045
    },
    plastificado_brillo_2c: {
      id: "plastificado_brillo_2c",
      nombre: "Plastificado Brillo 2 Caras",
      categoria: "plastificado",
      tipoCobro: "pliego",
      tarifaFijaArranque: 18.0,
      precioUnitario: 0.082
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
      tarifaFijaArranque: 45.0,
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
      tarifaFijaArranque: 48.0,
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
    // Relieve Seco / Golpe en Seco
    golpe_seco: {
      id: "golpe_seco",
      nombre: "Golpe en Seco / Relieve sin tinta (Embossing)",
      categoria: "stamping",
      tipoCobro: "unidad",
      tarifaFijaArranque: 55.0,
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
  },
  maquinas: [
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
  ],
  costesTaller: {
    costeGuillotinaFijo: 10.0,
    costeGuillotinaPorGolpeTaco: 0.45,
    costeLavadoTinteroPantone: 35.0,
    costeTintaPantoneOffsetPliego: 0.008,
    costeTintaPantoneDigitalPliego: 0.035,
    precioKgCartonCompacto: 1.65,
    densidadCartonCompacto: 0.75,
    gastosGeneralesPorcentajeDefecto: 12.0,
    margenBeneficioPorcentajeDefecto: 35.0
  },
  presets: [
    {
      id: "flyer-a7",
      nombre: "A7 (7,4 x 10,5 cm)",
      categoria: "comercial",
      ancho: 74,
      alto: 105,
      sangre: 2,
      tipo: "flyer",
      gramajesSugeridos: [115, 135, 170, 250, 300],
      acabadosCompatibles: ["plastificado_brillo_1c", "plastificado_brillo_2c", "plastificado_mate_1c", "plastificado_mate_2c", "plastificado_softtouch_2c", "barniz_offset_proteccion", "perforado_trepado"]
    },
    {
      id: "flyer-a6",
      nombre: "A6 (10,5 x 14,8 cm)",
      categoria: "comercial",
      ancho: 105,
      alto: 148,
      sangre: 2,
      tipo: "flyer",
      gramajesSugeridos: [115, 135, 170, 250, 300],
      acabadosCompatibles: ["plastificado_brillo_1c", "plastificado_brillo_2c", "plastificado_mate_1c", "plastificado_mate_2c", "plastificado_softtouch_2c", "barniz_offset_proteccion", "perforado_trepado"]
    },
    {
      id: "flyer-a5",
      nombre: "A5 (14,8 x 21 cm)",
      categoria: "comercial",
      ancho: 148,
      alto: 210,
      sangre: 2,
      tipo: "flyer",
      gramajesSugeridos: [115, 135, 170, 250, 300],
      acabadosCompatibles: ["plastificado_brillo_1c", "plastificado_brillo_2c", "plastificado_mate_1c", "plastificado_mate_2c", "plastificado_softtouch_2c", "barniz_offset_proteccion", "perforado_trepado"]
    },
    {
      id: "flyer-a4",
      nombre: "A4 (21 x 29,7 cm)",
      categoria: "comercial",
      ancho: 210,
      alto: 297,
      sangre: 2,
      tipo: "flyer",
      gramajesSugeridos: [115, 135, 170, 250, 300],
      acabadosCompatibles: ["plastificado_brillo_1c", "plastificado_brillo_2c", "plastificado_mate_1c", "plastificado_mate_2c", "plastificado_softtouch_2c", "barniz_offset_proteccion", "perforado_trepado"]
    },
    {
      id: "flyer-din-largo",
      nombre: "DIN Largo (10 x 21 cm)",
      categoria: "comercial",
      ancho: 100,
      alto: 210,
      sangre: 2,
      tipo: "flyer",
      gramajesSugeridos: [115, 135, 170, 250, 300],
      acabadosCompatibles: ["plastificado_brillo_1c", "plastificado_brillo_2c", "plastificado_mate_1c", "plastificado_mate_2c", "plastificado_softtouch_2c", "barniz_offset_proteccion", "perforado_trepado"]
    },
    {
      id: "flyer-cuadrado-xl",
      nombre: "Cuadrado XL (21 x 21 cm)",
      categoria: "comercial",
      ancho: 210,
      alto: 210,
      sangre: 2,
      tipo: "flyer",
      gramajesSugeridos: [135, 170, 250, 300],
      acabadosCompatibles: ["plastificado_brillo_1c", "plastificado_brillo_2c", "plastificado_mate_1c", "plastificado_mate_2c", "plastificado_softtouch_2c", "barniz_offset_proteccion", "perforado_trepado"]
    },
    {
      id: "flyer-cuadrado-grande",
      nombre: "Cuadrado Grande (14,8 x 14,8 cm)",
      categoria: "comercial",
      ancho: 148,
      alto: 148,
      sangre: 2,
      tipo: "flyer",
      gramajesSugeridos: [135, 170, 250, 300],
      acabadosCompatibles: ["plastificado_brillo_1c", "plastificado_brillo_2c", "plastificado_mate_1c", "plastificado_mate_2c", "plastificado_softtouch_2c", "barniz_offset_proteccion", "perforado_trepado"]
    },
    {
      id: "flyer-cuadrado-pequeno",
      nombre: "Cuadrado Pequeño (9,8 x 9,8 cm)",
      categoria: "comercial",
      ancho: 98,
      alto: 98,
      sangre: 2,
      tipo: "flyer",
      gramajesSugeridos: [135, 170, 250, 300],
      acabadosCompatibles: ["plastificado_brillo_1c", "plastificado_brillo_2c", "plastificado_mate_1c", "plastificado_mate_2c", "plastificado_softtouch_2c", "barniz_offset_proteccion", "perforado_trepado"]
    },
    {
      id: "cartel-a3",
      nombre: "Cartel / Afiche A3 (29,7 x 42 cm)",
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
      nombre: "Cartel B2 (50 x 70 cm)",
      categoria: "comercial",
      ancho: 500,
      alto: 700,
      sangre: 3,
      tipo: "flyer",
      gramajesSugeridos: [135, 170],
      acabadosCompatibles: ["barniz_offset_proteccion"]
    },
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
  ]
};

// -------------------------------------------------------------
// Svelte Store reactivo y sincronización de configuración
// -------------------------------------------------------------

const LOCAL_STORAGE_KEY = "tolklo-escandallo-config-v1";

function obtenerConfigInicial(): ConfiguracionEscandalloCompleta {
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && Array.isArray(parsed.papeles) && parsed.acabados && Array.isArray(parsed.maquinas)) {
          // Migración automática si faltan los nuevos formatos de flyer o acabados
          if (!parsed.presets?.some((p: any) => p.id === "flyer-a7") || !parsed.acabados?.plastificado_brillo_2c) {
            const comercialPresets = DEFAULT_CONFIGURACION_ESCANDALLO.presets.filter(p => p.categoria === "comercial");
            const otrosPresets = (parsed.presets || []).filter((p: any) => p.categoria !== "comercial");
            parsed.presets = [...comercialPresets, ...otrosPresets];
            parsed.acabados = { ...DEFAULT_CONFIGURACION_ESCANDALLO.acabados, ...parsed.acabados };
            parsed.version = 2;
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
            } catch (_) {}
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error leyendo configuración local:", e);
    }
  }
  return DEFAULT_CONFIGURACION_ESCANDALLO;
}

export const escandalloConfig = writable<ConfiguracionEscandalloCompleta>(obtenerConfigInicial());
export const guardandoConfig = writable<boolean>(false);
export const estadoSincronizacion = writable<"guardado" | "modificado" | "cargando" | "error">("guardado");

let localSaveTimer: any;
if (typeof window !== "undefined") {
  escandalloConfig.subscribe(val => {
    clearTimeout(localSaveTimer);
    localSaveTimer = setTimeout(() => {
      try {
        if (val) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(val));
        }
      } catch (err) {
        console.warn("No se pudo guardar en localStorage:", err);
      }
    }, 200);
  });

  // Carga asíncrona desde API
  cargarConfiguracionDelServidor();
}

export async function cargarConfiguracionDelServidor(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    estadoSincronizacion.set("cargando");
    const res = await fetch("/api/escandallo/config");
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.configuracion) {
        escandalloConfig.set(data.configuracion);
        estadoSincronizacion.set("guardado");
        return;
      }
    }
    estadoSincronizacion.set("error");
  } catch (err) {
    console.warn("No se pudo cargar la configuración de escandallo del servidor, usando local:", err);
    estadoSincronizacion.set("error");
  }
}

export async function guardarConfiguracionServidor(nuevaConfig?: ConfiguracionEscandalloCompleta): Promise<{ ok: boolean; mensaje?: string; error?: string }> {
  const configAGuardar = nuevaConfig || get(escandalloConfig);
  guardandoConfig.set(true);
  try {
    const res = await fetch("/api/escandallo/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configuracion: configAGuardar })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      escandalloConfig.set(data.configuracion);
      estadoSincronizacion.set("guardado");
      guardandoConfig.set(false);
      return { ok: true, mensaje: "Tarifas guardadas en servidor con éxito" };
    }
    guardandoConfig.set(false);
    estadoSincronizacion.set("error");
    return { ok: false, error: data.error || "Error al guardar en el servidor" };
  } catch (err: any) {
    guardandoConfig.set(false);
    estadoSincronizacion.set("error");
    return { ok: false, error: err.message };
  }
}

export async function restablecerValoresFabrica(): Promise<{ ok: boolean; mensaje?: string; error?: string }> {
  guardandoConfig.set(true);
  try {
    const res = await fetch("/api/escandallo/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true })
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      escandalloConfig.set(data.configuracion);
      estadoSincronizacion.set("guardado");
      guardandoConfig.set(false);
      return { ok: true, mensaje: "Valores restablecidos a los de fábrica" };
    }
    guardandoConfig.set(false);
    return { ok: false, error: data.error || "Error al restablecer" };
  } catch (err: any) {
    // Si falla el servidor, restablecemos al menos en local
    escandalloConfig.set(DEFAULT_CONFIGURACION_ESCANDALLO);
    guardandoConfig.set(false);
    return { ok: true, mensaje: "Restablecido a valores por defecto locales" };
  }
}

export function exportarTarifasAJson(): void {
  const config = get(escandalloConfig);
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  const fechaStr = new Date().toISOString().split("T")[0];
  downloadAnchor.setAttribute("download", `tarifas-escandallo-tolklo-${fechaStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export async function importarTarifasDesdeJson(jsonString: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.papeles) || !parsed.acabados || !Array.isArray(parsed.maquinas)) {
      return { ok: false, error: "El archivo JSON no contiene una estructura válida de tarifas de escandallo." };
    }
    const guardado = await guardarConfiguracionServidor(parsed);
    return guardado;
  } catch (err: any) {
    return { ok: false, error: "Error procesando el archivo JSON: " + err.message };
  }
}

// -------------------------------------------------------------
// Mutaciones específicas y reactivas
// -------------------------------------------------------------

export function agregarPapel(papel: PapelConfig) {
  escandalloConfig.update(c => {
    return {
      ...c,
      papeles: [...(c?.papeles || []).filter(p => p.id !== papel.id), papel]
    };
  });
  estadoSincronizacion.set("modificado");
}

export function eliminarPapel(papelId: string) {
  escandalloConfig.update(c => {
    return {
      ...c,
      papeles: (c?.papeles || []).filter(p => p.id !== papelId)
    };
  });
  estadoSincronizacion.set("modificado");
}

export function actualizarPapel(papel: PapelConfig) {
  escandalloConfig.update(c => {
    return {
      ...c,
      papeles: (c?.papeles || []).map(p => p.id === papel.id ? papel : p)
    };
  });
  estadoSincronizacion.set("modificado");
}

export function agregarAcabado(acabado: AcabadoItemConfig) {
  escandalloConfig.update(c => {
    return {
      ...c,
      acabados: {
        ...(c?.acabados || {}),
        [acabado.id]: acabado
      }
    };
  });
  estadoSincronizacion.set("modificado");
}

export function actualizarAcabado(id: string, acabado: AcabadoItemConfig) {
  escandalloConfig.update(c => {
    return {
      ...c,
      acabados: {
        ...(c?.acabados || {}),
        [id]: acabado
      }
    };
  });
  estadoSincronizacion.set("modificado");
}

export function eliminarAcabado(id: string) {
  escandalloConfig.update(c => {
    const nuevos = { ...(c?.acabados || {}) };
    delete nuevos[id];
    return {
      ...c,
      acabados: nuevos
    };
  });
  estadoSincronizacion.set("modificado");
}

export function agregarMaquina(maquina: MaquinaItemConfig) {
  escandalloConfig.update(c => {
    return {
      ...c,
      maquinas: [...(c?.maquinas || []).filter(m => m.id !== maquina.id), maquina]
    };
  });
  estadoSincronizacion.set("modificado");
}

export function actualizarMaquina(maquina: MaquinaItemConfig) {
  escandalloConfig.update(c => {
    return {
      ...c,
      maquinas: (c?.maquinas || []).map(m => m.id === maquina.id ? maquina : m)
    };
  });
  estadoSincronizacion.set("modificado");
}

export function eliminarMaquina(id: string) {
  escandalloConfig.update(c => {
    return {
      ...c,
      maquinas: (c?.maquinas || []).filter(m => m.id !== id)
    };
  });
  estadoSincronizacion.set("modificado");
}

export function actualizarCostesTaller(costes: Partial<CostesTallerConfig>) {
  escandalloConfig.update(c => {
    return {
      ...c,
      costesTaller: {
        ...(c?.costesTaller || DEFAULT_CONFIGURACION_ESCANDALLO.costesTaller),
        ...costes
      }
    };
  });
  estadoSincronizacion.set("modificado");
}

export function agregarPreset(preset: ProductoPresetConfig) {
  escandalloConfig.update(c => {
    return {
      ...c,
      presets: [...(c?.presets || []).filter(p => p.id !== preset.id), preset]
    };
  });
  estadoSincronizacion.set("modificado");
}

export function actualizarPreset(preset: ProductoPresetConfig) {
  escandalloConfig.update(c => {
    return {
      ...c,
      presets: (c?.presets || []).map(p => p.id === preset.id ? preset : p)
    };
  });
  estadoSincronizacion.set("modificado");
}

export function eliminarPreset(id: string) {
  escandalloConfig.update(c => {
    return {
      ...c,
      presets: (c?.presets || []).filter(p => p.id !== id)
    };
  });
  estadoSincronizacion.set("modificado");
}
