// src/lib/escandallo-imprenta.ts
/**
 * Motor de Cálculo Técnico, Imposición y Escandallo de Costes para Artes Gráficas
 * Inspirado en los motores de cálculo de Palmart, Calcuprint, Pressero y Logic Print.
 */

export interface DimensionesMm {
  ancho: number;
  alto: number;
}

export interface ProductoPreset {
  id: string;
  nombre: string;
  ancho: number;
  alto: number;
  sangre: number;
  tipo: "flyer" | "diptico" | "triptico" | "tarjeta" | "carpeta" | "revista";
  gramajesSugeridos: number[];
  acabadosCompatibles: string[];
}

export const PRODUCTOS_PRESET: ProductoPreset[] = [
  {
    id: "tarjeta-visita",
    nombre: "Tarjetas de Visita (85x55 mm)",
    ancho: 85,
    alto: 55,
    sangre: 2,
    tipo: "tarjeta",
    gramajesSugeridos: [300, 350],
    acabadosCompatibles: ["plastificado_mate_1c", "plastificado_mate_2c", "plastificado_softtouch_2c"]
  },
  {
    id: "flyer-a6",
    nombre: "Flyer A6 (105x148 mm)",
    ancho: 105,
    alto: 148,
    sangre: 2,
    tipo: "flyer",
    gramajesSugeridos: [135, 170, 250],
    acabadosCompatibles: ["plastificado_brillo_1c", "plastificado_mate_2c"]
  },
  {
    id: "flyer-a5",
    nombre: "Flyer A5 (148x210 mm)",
    ancho: 148,
    alto: 210,
    sangre: 2,
    tipo: "flyer",
    gramajesSugeridos: [115, 135, 170, 250],
    acabadosCompatibles: ["plastificado_brillo_1c", "plastificado_mate_2c"]
  },
  {
    id: "diptico-a4-a5",
    nombre: "Díptico A4 abierto a A5 (297x210 mm)",
    ancho: 297,
    alto: 210,
    sangre: 2,
    tipo: "diptico",
    gramajesSugeridos: [135, 170, 250],
    acabadosCompatibles: ["plegado_diptico", "hendido", "plastificado_mate_2c"]
  },
  {
    id: "triptico-a4",
    nombre: "Tríptico A4 envolvente (297x210 mm)",
    ancho: 297,
    alto: 210,
    sangre: 2,
    tipo: "triptico",
    gramajesSugeridos: [135, 170],
    acabadosCompatibles: ["plegado_triptico", "hendido"]
  },
  {
    id: "cartel-a3",
    nombre: "Cartel / Afiche A3 (297x420 mm)",
    ancho: 297,
    alto: 420,
    sangre: 2,
    tipo: "flyer",
    gramajesSugeridos: [135, 170, 200],
    acabadosCompatibles: ["plastificado_brillo_1c"]
  },
  {
    id: "carpeta-a4",
    nombre: "Carpeta troquelada A4 con solapa (450x310 mm abierta)",
    ancho: 450,
    alto: 310,
    sangre: 3,
    tipo: "carpeta",
    gramajesSugeridos: [300, 350],
    acabadosCompatibles: ["troquelado", "plastificado_mate_1c", "hendido"]
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
    densidadAparente: "Poroso para escritura/facturas"
  },
  {
    id: "folding-calibre",
    nombre: "Cartulina Folding Estucada 1C",
    gramajes: [240, 280, 300, 350],
    precioKg: 2.45,
    densidadAparente: "Rigidez para packaging y carpetas"
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
  pinzaMm: number; // Margen de pinza (no imprimible)
  margenLateralMm: number;
  tiraControlMm: number; // Tira de color densitométrica
  costeHora: number; // Tarifa horaria de amortización + mano de obra
  costePlancha: number; // Por unidad CTP térmica
  tiempoArregloMinutos: number; // Puesta en marcha / setup
  velocidadPliegosHora: number;
  mermaArranquePliegosPorColor: number;
  mermaTiradaPorcentaje: number;
  costeClicColorPliego: number; // Si digital: coste clic
  costeClicBnPliego: number;
  maxGramaje: number;
  minGramaje: number;
}

export const PARQUE_MAQUINAS: MaquinaConfig[] = [
  {
    id: "digital-sra3",
    nombre: "Prensa Digital SRA3 (Ricoh Pro / Konica)",
    tecnologia: "digital",
    pliegoAncho: 450,
    pliegoAlto: 320,
    pinzaMm: 5, // Margen blanco digital
    margenLateralMm: 5,
    tiraControlMm: 0,
    costeHora: 50.0,
    costePlancha: 0.0,
    tiempoArregloMinutos: 5,
    velocidadPliegosHora: 3000,
    mermaArranquePliegosPorColor: 4,
    mermaTiradaPorcentaje: 1.5,
    costeClicColorPliego: 0.065, // por cara en SRA3
    costeClicBnPliego: 0.018,
    maxGramaje: 400,
    minGramaje: 70
  },
  {
    id: "offset-b2-50x70",
    nombre: "Prensa Offset 4C Medio Pliego (Heidelberg 50x70)",
    tecnologia: "offset",
    pliegoAncho: 700,
    pliegoAlto: 500,
    pinzaMm: 12, // Pinza física de cuerpo impresor
    margenLateralMm: 6,
    tiraControlMm: 8,
    costeHora: 85.0,
    costePlancha: 9.50, // CTP térmico 50x70
    tiempoArregloMinutos: 25, // Calibración de tinteros y registro
    velocidadPliegosHora: 8000,
    mermaArranquePliegosPorColor: 35, // 35 pliegos por plancha para entintar
    mermaTiradaPorcentaje: 2.0,
    costeClicColorPliego: 0.0,
    costeClicBnPliego: 0.0,
    maxGramaje: 450,
    minGramaje: 80
  },
  {
    id: "offset-b1-70x100",
    nombre: "Prensa Offset 4C Pliego Entero (Komori 70x100)",
    tecnologia: "offset",
    pliegoAncho: 1000,
    pliegoAlto: 700,
    pinzaMm: 14,
    margenLateralMm: 8,
    tiraControlMm: 10,
    costeHora: 125.0,
    costePlancha: 18.0, // CTP térmico 70x100
    tiempoArregloMinutos: 35,
    velocidadPliegosHora: 11000,
    mermaArranquePliegosPorColor: 50,
    mermaTiradaPorcentaje: 2.5,
    costeClicColorPliego: 0.0,
    costeClicBnPliego: 0.0,
    maxGramaje: 500,
    minGramaje: 90
  }
];

export interface AcabadoConfig {
  id: string;
  nombre: string;
  tipoCobro: "fijo" | "pliego" | "unidad" | "m2";
  tarifaFijaArranque: number;
  precioUnitario: number;
}

export const CATALOGO_ACABADOS: Record<string, AcabadoConfig> = {
  plastificado_brillo_1c: {
    id: "plastificado_brillo_1c",
    nombre: "Plastificado / Laminado Brillo 1 Cara",
    tipoCobro: "pliego",
    tarifaFijaArranque: 12.0,
    precioUnitario: 0.045
  },
  plastificado_mate_1c: {
    id: "plastificado_mate_1c",
    nombre: "Plastificado / Laminado Mate 1 Cara",
    tipoCobro: "pliego",
    tarifaFijaArranque: 12.0,
    precioUnitario: 0.048
  },
  plastificado_mate_2c: {
    id: "plastificado_mate_2c",
    nombre: "Plastificado / Laminado Mate 2 Caras",
    tipoCobro: "pliego",
    tarifaFijaArranque: 18.0,
    precioUnitario: 0.088
  },
  plastificado_softtouch_2c: {
    id: "plastificado_softtouch_2c",
    nombre: "Laminado Soft Touch (Tacto Seda) 2 Caras",
    tipoCobro: "pliego",
    tarifaFijaArranque: 25.0,
    precioUnitario: 0.14
  },
  plegado_diptico: {
    id: "plegado_diptico",
    nombre: "Plegado Díptico (1 pliegue en V)",
    tipoCobro: "unidad",
    tarifaFijaArranque: 15.0,
    precioUnitario: 0.008
  },
  plegado_triptico: {
    id: "plegado_triptico",
    nombre: "Plegado Tríptico (2 pliegues acordeón/envolvente)",
    tipoCobro: "unidad",
    tarifaFijaArranque: 18.0,
    precioUnitario: 0.012
  },
  hendido: {
    id: "hendido",
    nombre: "Hendido Mecánico (antigrieta para gramajes > 170g)",
    tipoCobro: "unidad",
    tarifaFijaArranque: 14.0,
    precioUnitario: 0.009
  },
  troquelado: {
    id: "troquelado",
    nombre: "Troquelado con Molde / Forma Especial",
    tipoCobro: "unidad",
    tarifaFijaArranque: 65.0, // Fabricación molde madera
    precioUnitario: 0.025
  },
  grapado_2_puntos: {
    id: "grapado_2_puntos",
    nombre: "Encuadernación 2 Grapas al lomo",
    tipoCobro: "unidad",
    tarifaFijaArranque: 20.0,
    precioUnitario: 0.045
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
  const calleCorteMm = 3; // Calle entre poses para doble corte de guillotina

  const poseAncho = anchoTrabajoMm + sangreMm * 2;
  const poseAlto = altoTrabajoMm + sangreMm * 2;

  // Descontar márgenes técnicos de máquina (pinzas de arrastre y guías laterales)
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

  // Si ninguna orientación cabe
  if (totalPoses <= 0) {
    totalPoses = 1; // Mínimo 1 para evitar divisiones entre cero
  }

  // Superficie neta del trabajo vs superficie total del pliego
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
 * 🏭 MOTOR DE ESCANDALLO GRÁFICO (BOM & Machine Cost Routing)
 */
export interface ParametrosCalculo {
  cantidadTirada: number;
  anchoMm: number;
  altoMm: number;
  sangreMm: number;
  papelId: string;
  gramaje: number;
  colorImpresion: "4+4" | "4+0" | "1+1" | "1+0";
  acabadosIds: string[];
  margenBeneficioPorcentaje: number; // Markup ej. 35%
  gastosGeneralesPorcentaje?: number; // Estructura ej. 12%
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
}

export interface ResultadoEscandalloCompleto {
  parametros: ParametrosCalculo;
  papel: PapelSoporte;
  opcionesMaquinas: DesgloseCosteMaquina[];
  maquinaOptima: DesgloseCosteMaquina;
  puntoCorteCrossover: string;
}

export function calcularEscandalloCompleto(params: ParametrosCalculo): ResultadoEscandalloCompleto {
  const papel = PAPELES_CATALOGO.find(p => p.id === params.papelId) || PAPELES_CATALOGO[0];
  const gastosGeneralesPct = params.gastosGeneralesPorcentaje ?? 12;

  // Analizar cada máquina disponible
  const resultadosMaquinas: DesgloseCosteMaquina[] = PARQUE_MAQUINAS.map(maquina => {
    // 1. Imposición geométrica
    const imposicion = calcularImposicion(params.anchoMm, params.altoMm, params.sangreMm, maquina);
    const poses = imposicion.totalPosesPorPliego;

    // 2. Pliegos Netos
    const pliegosNetos = Math.ceil(params.cantidadTirada / poses);

    // 3. Colores y Caras
    const esColor = params.colorImpresion.startsWith("4");
    const esDobleCara = params.colorImpresion.endsWith("4") || params.colorImpresion.endsWith("1");
    const numColoresPorCara = esColor ? 4 : 1;
    const totalCuerposEntintado = esDobleCara ? numColoresPorCara * 2 : numColoresPorCara;

    // 4. Mermas (Maculatura)
    const mermasArranque = maquina.tecnologia === "offset"
      ? maquina.mermaArranquePliegosPorColor * totalCuerposEntintado
      : maquina.mermaArranquePliegosPorColor;

    const mermasTirada = Math.ceil(pliegosNetos * (maquina.mermaTiradaPorcentaje / 100));
    const mermasAcabados = Math.ceil(pliegosNetos * 0.02); // 2% mermas para manipulado/guillotina
    const totalPliegosBrutos = pliegosNetos + mermasArranque + mermasTirada + mermasAcabados;

    // 5. Materia Prima (Papel): Peso en Kg
    // Superficie m2 = (Ancho_mm * Alto_mm) / 1.000.000
    const m2Pliego = (maquina.pliegoAncho * maquina.pliegoAlto) / 1_000_000;
    const pesoTotalKg = Math.round((m2Pliego * (params.gramaje / 1000) * totalPliegosBrutos) * 100) / 100;
    const costePapel = Math.round((pesoTotalKg * papel.precioKg) * 100) / 100;

    // 6. Preimpresión y Planchas
    let costePreimpresion = 0;
    if (maquina.tecnologia === "offset") {
      // 4 planchas si 4/0 o tira y retira / 8 planchas si 4/4 en máquina recta
      const numPlanchas = totalCuerposEntintado;
      costePreimpresion = numPlanchas * maquina.costePlancha;
    }

    // 7. Impresión (Setup + Tirada + Clics)
    let costeArranque = 0;
    let costeTirada = 0;
    let costeClics = 0;
    let tiempoProduccionMinutos = 0;

    if (maquina.tecnologia === "digital") {
      // Digital: Clics de pase + tiempo mínimo
      const caras = esDobleCara ? 2 : 1;
      const tarifaClic = esColor ? maquina.costeClicColorPliego : maquina.costeClicBnPliego;
      costeClics = Math.round((totalPliegosBrutos * caras * tarifaClic) * 100) / 100;

      const tiempoSetupMin = maquina.tiempoArregloMinutos;
      const tiempoTiradaMin = (totalPliegosBrutos / maquina.velocidadPliegosHora) * 60;
      tiempoProduccionMinutos = Math.round(tiempoSetupMin + tiempoTiradaMin);
      costeArranque = Math.round((tiempoSetupMin / 60 * maquina.costeHora) * 100) / 100;
      costeTirada = Math.round((tiempoTiradaMin / 60 * maquina.costeHora) * 100) / 100;
    } else {
      // Offset: Arreglo de cuerpos + lavado + Tirada a velocidad crucero + consumo tinta
      const tiempoSetupMin = maquina.tiempoArregloMinutos;
      const tiempoTiradaMin = (totalPliegosBrutos / maquina.velocidadPliegosHora) * 60;
      tiempoProduccionMinutos = Math.round(tiempoSetupMin + tiempoTiradaMin);

      costeArranque = Math.round(((tiempoSetupMin / 60) * maquina.costeHora) * 100) / 100;
      const costeTintaQuimicos = totalPliegosBrutos * 0.006 * totalCuerposEntintado;
      costeTirada = Math.round((((tiempoTiradaMin / 60) * maquina.costeHora) + costeTintaQuimicos) * 100) / 100;
    }

    // 8. Guillotina (Corte de pliego a poses unitarias)
    const golpesGuillotina = 4 + (imposicion.posesColumnas - 1) + (imposicion.posesFilas - 1);
    const tacosCorte = Math.ceil(totalPliegosBrutos / 500); // 500 pliegos por taco
    const costeGuillotina = Math.round((10 + tacosCorte * golpesGuillotina * 0.45) * 100) / 100;

    // 9. Acabados y Manipulados
    let costeAcabados = 0;
    for (const acabadoId of params.acabadosIds) {
      const cfg = CATALOGO_ACABADOS[acabadoId];
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

    // 10. Totales Financieros & Márgenes
    const costeIndustrial = Math.round((
      costePapel +
      costePreimpresion +
      costeArranque +
      costeTirada +
      costeClics +
      costeGuillotina +
      costeAcabados
    ) * 100) / 100;

    const gastosGenerales = Math.round((costeIndustrial * (gastosGeneralesPct / 100)) * 100) / 100;
    const costeTotalEmpresa = Math.round((costeIndustrial + gastosGenerales) * 100) / 100;

    const margenBeneficioEuros = Math.round((costeTotalEmpresa * (params.margenBeneficioPorcentaje / 100)) * 100) / 100;
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
      costeIndustrialTotal: costeIndustrial,
      gastosGenerales,
      costeTotalEmpresa,
      margenBeneficioEuros,
      precioVentaSugerido,
      costeUnitario,
      precioUnitarioSugerido: precioUnitario,
      esRecomendada: false,
      motivoRecomendacion: "",
      tiempoTotalProduccionMinutos: tiempoProduccionMinutos
    };
  });

  // Determinar la máquina óptima (la de menor coste total de empresa)
  let mejorIndice = 0;
  let menorCoste = resultadosMaquinas[0].costeTotalEmpresa;

  for (let i = 1; i < resultadosMaquinas.length; i++) {
    if (resultadosMaquinas[i].costeTotalEmpresa < menorCoste) {
      menorCoste = resultadosMaquinas[i].costeTotalEmpresa;
      mejorIndice = i;
    }
  }

  resultadosMaquinas[mejorIndice].esRecomendada = true;
  const maqOptima = resultadosMaquinas[mejorIndice];

  if (maqOptima.maquina.tecnologia === "digital") {
    maqOptima.motivoRecomendacion = `Tirada idónea para Impresión Digital: Evita el coste fijo de ${maqOptima.maquina.id.includes("b1") ? 8 : 4} planchas CTP y reduce la merma de arranque a solo 4 pliegos.`;
  } else {
    maqOptima.motivoRecomendacion = `Tirada alta ideal para Offset Industrial: El coste de planchas y puesta a punto queda amortizado, logrando un coste unitario de solo ${maqOptima.costeUnitario.toFixed(3)} €/ud.`;
  }

  // Análisis de Crossover (Punto de Corte)
  const puntoCorte = params.cantidadTirada < 800
    ? "Punto de cruce Offset/Digital estimado en ~800-1.200 ejemplares. Para tiradas inferiores, Digital es imbatible en precio."
    : "Superado el umbral de rentabilidad digital (~1.000 ejemplares). La prensa Offset ofrece el coste marginal más competitivo.";

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
    // 2 palas normales y 1 solapa interior (-3mm para plegar sin abombarse)
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
      // Fórmula: 2W + (W - 3) = Total => 3W = Total + 3 => W = (Total + 3)/3
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
    // 2 alas que cierran en el centro sobre un cuerpo central
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
    // Desplegables de 4, 5 o 6 palas en acordeón
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

export function calcularEscaladoCantidades(
  params: Omit<ParametrosCalculo, "cantidadTirada">,
  tramos: number[] = [100, 250, 500, 1000, 2500, 5000, 10000]
): FilaEscalado[] {
  return tramos.map(cant => {
    const res = calcularEscandalloCompleto({
      ...params,
      cantidadTirada: cant
    });
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

