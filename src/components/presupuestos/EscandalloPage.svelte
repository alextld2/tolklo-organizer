<!-- src/components/presupuestos/EscandalloPage.svelte -->
<script lang="ts">
  import { 
    Cpu, 
    Layers, 
    Zap, 
    Percent, 
    FileText, 
    Clock, 
    ArrowRight, 
    CheckCircle2, 
    Sparkles, 
    FoldHorizontal, 
    AlertTriangle, 
    RotateCcw,
    Table,
    Calculator,
    ArrowLeft,
    BookOpen,
    CreditCard,
    Calendar,
    FolderOpen,
    Palette,
    ShoppingCart,
    Plus,
    Trash2,
    Printer,
    Settings2,
    Bookmark,
    ChevronRight,
    Eye,
    X,
    Copy,
    Check,
    Sliders,
    BookMarked
  } from "lucide-svelte";
  import { formatEuro } from "$lib/fiscal-utils";
  import { 
    PAPELES_CATALOGO, 
    CATALOGO_ACABADOS, 
    TIPOS_PLEGADO,
    CATEGORIAS_PRODUCTO,
    PRODUCTOS_PRESET,
    PARQUE_MAQUINAS,
    generarTramosIntervalo,
    calcularGeometriaDesplegable,
    calcularGeometriaPublicacion,
    calcularEscandalloCompleto,
    calcularEscaladoCantidades,
    type CategoriaProductoId,
    type ProductoPreset,
    type ParametrosCalculo,
    type ArticuloCestaEscandallo,
    type TipoTapaPublicacion
  } from "$lib/escandallo-imprenta";
  import { escandalloConfig } from "$lib/escandallo-config";
  import NuevoPresupuestoModal from "./NuevoPresupuestoModal.svelte";

  let { workspace = "facturacion" }: { workspace?: string } = $props();

  // Catálogos dinámicos reactivos desde la configuración guardada
  let catalogoPresets = $derived($escandalloConfig?.presets || PRODUCTOS_PRESET);
  let catalogoPapeles = $derived($escandalloConfig?.papeles || PAPELES_CATALOGO);
  let catalogoAcabados = $derived($escandalloConfig?.acabados || CATALOGO_ACABADOS);
  let catalogoMaquinas = $derived($escandalloConfig?.maquinas || PARQUE_MAQUINAS);
  let papelSeleccionadoActual = $derived(
    catalogoPapeles?.find(p => p.id === papelId) || catalogoPapeles?.[0] || PAPELES_CATALOGO[0]
  );

  // 1. Categoría y Preset de Producto Activo
  let categoriaActiva = $state<CategoriaProductoId>("comercial");
  let presetActivoId = $state<string>("flyer-a5");
  let nombreTrabajo = $state("Flyer Promocional A5");

  // 2. Geometría y Plegado
  let anchoBaseMm = $state(148);
  let altoBaseMm = $state(210);
  let sangreMm = $state(2);
  let tipoPlegadoId = $state("hoja_simple");
  let modoDefinicionDesplegable = $state<"cerrado" | "abierto">("cerrado");

  // 3. Publicaciones (Libros, Revistas, Catálogos, Agendas, Cuadernos)
  let paginasInteriores = $state(32);
  let papelInteriorId = $state("offset-blanco");
  let gramajeInterior = $state(90);
  let colorInterior = $state<"4+4" | "1+1" | "4+0" | "1+0">("4+4");
  let papelPortadaId = $state("estucado-mate");
  let gramajePortada = $state(300);
  let colorPortada = $state<"4+4" | "4+0" | "1+0">("4+4");
  let solapasMm = $state(0);
  let tipoEncuadernacion = $state<"grapado" | "rustica_pur" | "rustica_cosida" | "wire_o" | "espiral">("grapado");
  let tipoTapa = $state<TipoTapaPublicacion>("flexible");
  let grosorCartonMm = $state(2.0);
  let impresionCubiertaTecnologia = $state<"auto" | "digital" | "offset">("auto");
  let maquinaCubiertaId = $state<string | null>(null);
  let plastificadoCubiertaId = $state("plastificado_mate_1c");

  // 4. Tirada, Papel y Colores para Hoja Plana / Desplegable
  let cantidadTirada = $state(2500);
  let papelId = $state("estucado-mate");
  let gramaje = $state(135);
  let colorImpresion = $state<"4+4" | "4+0" | "1+1" | "1+0">("4+4");

  // 5. Tintas Especiales (Pantones) y Procesos de Alto Valor
  let numPantones = $state(0);
  let nombresPantone = $state("");
  let barnizUV = $state<"ninguno" | "offset_proteccion" | "uvi_brillo_total" | "uvi_selectivo" | "uvi_3d_relieve">("ninguno");
  let stampingFoil = $state<"ninguno" | "oro" | "plata" | "cobre" | "holografico">("ninguno");
  let golpeSeco = $state(false);

  // 6. Acabados genéricos seleccionados y Filtros de Maquinaria
  let acabadosSeleccionados = $state<string[]>([]);
  let margenBeneficio = $state(35); // 35% de markup comercial
  let permitirOffset = $state(true);
  let permitirDigital = $state(true);
  let maquinaSeleccionadaId = $state<string | null>(null); // null = "Todas (Automático)"

  // 7. Cesta de Artículos / Presupuesto Multilínea
  let cestaArticulos = $state<ArticuloCestaEscandallo[]>([]);
  let panelCestaAbierto = $state(false);
  let feedbackCestaMsg = $state<string | null>(null);

  // 8. Modo de Escalado de Tiradas & Curva de Degresión
  let modoEscalado = $state<"auto" | "intervalos" | "manual">("auto");
  let intervaloDesde = $state(100);
  let intervaloHasta = $state(1000);
  let intervaloPaso = $state(100);
  let tramosPersonalizados = $state<number[]>([50, 100, 200, 300, 500, 1000, 2500]);
  let nuevoTramoInput = $state<number | null>(null);
  let copiadoTarifaFeedback = $state(false);

  function agregarTramoPersonalizado() {
    if (nuevoTramoInput && nuevoTramoInput > 0 && !tramosPersonalizados.includes(nuevoTramoInput)) {
      tramosPersonalizados = [...tramosPersonalizados, nuevoTramoInput].sort((a, b) => a - b);
      nuevoTramoInput = null;
    }
  }

  function eliminarTramoPersonalizado(cant: number) {
    tramosPersonalizados = tramosPersonalizados.filter(c => c !== cant);
  }

  // Modal para transferir al presupuesto oficial
  let modalPresupuestoAbierto = $state(false);
  let datosParaPresupuesto = $state<any>(null);

  // Presets filtrados por la categoría seleccionada
  let presetsFiltrados = $derived(
    catalogoPresets.filter(p => p.categoria === categoriaActiva)
  );

  // Cambiar de categoría
  function seleccionarCategoria(catId: CategoriaProductoId) {
    categoriaActiva = catId;
    const primerPreset = catalogoPresets.find(p => p.categoria === catId);
    if (primerPreset) {
      aplicarPreset(primerPreset);
    }
  }

  // Aplicar un Preset de Producto
  function aplicarPreset(preset: ProductoPreset) {
    presetActivoId = preset.id;
    nombreTrabajo = preset.nombre;
    anchoBaseMm = preset.ancho;
    altoBaseMm = preset.alto;
    sangreMm = preset.sangre;

    if (preset.gramajesSugeridos.length > 0) {
      gramaje = preset.gramajesSugeridos[0];
    }

    if (preset.tipoPlegadoDefecto) {
      tipoPlegadoId = preset.tipoPlegadoDefecto;
    } else if (preset.categoria === "desplegable") {
      tipoPlegadoId = "diptico";
    } else {
      tipoPlegadoId = "hoja_simple";
    }

    if (preset.categoria === "publicacion" || preset.categoria === "calendario") {
      paginasInteriores = preset.paginasDefecto || 32;
      tipoEncuadernacion = preset.tipoEncuadernacionDefecto || "grapado";
      if (preset.tipoTapaDefecto) {
        tipoTapa = preset.tipoTapaDefecto;
      } else {
        tipoTapa = preset.categoria === "publicacion" && paginasInteriores > 48 ? "flexible" : "flexible";
      }
      if (preset.grosorCartonMmDefecto) {
        grosorCartonMm = preset.grosorCartonMmDefecto;
      }
      if (preset.categoria === "publicacion" && paginasInteriores > 48 && !preset.tipoEncuadernacionDefecto) {
        tipoEncuadernacion = "rustica_pur";
      }
    }

    acabadosSeleccionados = preset.acabadosCompatibles ? [preset.acabadosCompatibles[0]] : [];
  }

  // Geometría del desplegable
  let geometriaDesplegable = $derived(
    calcularGeometriaDesplegable(
      tipoPlegadoId,
      modoDefinicionDesplegable,
      Number(anchoBaseMm) || 100,
      Number(altoBaseMm) || 210,
      Number(gramaje) || 135
    )
  );

  // Geometría de publicación (libros/revistas/agendas/cuadernos)
  let esPublicacion = $derived(
    categoriaActiva === "publicacion" || categoriaActiva === "calendario"
  );

  let geometriaPublicacion = $derived(
    esPublicacion
      ? calcularGeometriaPublicacion(
          Number(anchoBaseMm) || 148,
          Number(altoBaseMm) || 210,
          Number(paginasInteriores) || 32,
          Number(gramajeInterior) || 90,
          tipoEncuadernacion,
          Number(solapasMm) || 0,
          tipoTapa,
          Number(grosorCartonMm) || 2.0
        )
      : null
  );

  // Auto-sugerir hendido para desplegables si gramaje >= 170g
  $effect(() => {
    if (categoriaActiva === "desplegable" && geometriaDesplegable.requiereHendidoSugerido && !acabadosSeleccionados.includes("hendido")) {
      acabadosSeleccionados = [...acabadosSeleccionados, "hendido"];
    }
  });

  function toggleAcabado(id: string) {
    if (acabadosSeleccionados.includes(id)) {
      acabadosSeleccionados = acabadosSeleccionados.filter(a => a !== id);
    } else {
      acabadosSeleccionados = [...acabadosSeleccionados, id];
    }
  }

  // Dimensiones efectivas de impresión
  let anchoEfectivoMm = $derived(
    categoriaActiva === "desplegable" 
      ? geometriaDesplegable.anchoAbierto 
      : Number(anchoBaseMm) || 148
  );

  let altoEfectivoMm = $derived(
    categoriaActiva === "desplegable" 
      ? geometriaDesplegable.altoAbierto 
      : Number(altoBaseMm) || 210
  );

  // Parámetros completos pasados al motor de cálculo
  let parametrosCalculo = $derived<ParametrosCalculo>({
    nombreTrabajo,
    categoria: categoriaActiva,
    cantidadTirada: Math.max(1, Number(cantidadTirada) || 100),
    anchoMm: anchoEfectivoMm,
    altoMm: altoEfectivoMm,
    sangreMm: Number(sangreMm) || 2,
    papelId: esPublicacion ? papelInteriorId : papelId,
    gramaje: esPublicacion ? (Number(gramajeInterior) || 90) : (Number(gramaje) || 135),
    colorImpresion: esPublicacion ? colorInterior : colorImpresion,
    acabadosIds: acabadosSeleccionados,
    margenBeneficioPorcentaje: Number(margenBeneficio) || 35,
    permitirDigital,
    permitirOffset,
    maquinaForzadaId: maquinaSeleccionadaId,
    numPantones: Number(numPantones) || 0,
    nombresPantone,
    barnizUV,
    stampingFoil,
    golpeSeco,
    publicacion: esPublicacion ? {
      esPublicacion: true,
      paginasInteriores: Number(paginasInteriores) || 32,
      papelInteriorId,
      gramajeInterior: Number(gramajeInterior) || 90,
      colorInterior,
      papelPortadaId,
      gramajePortada: Number(gramajePortada) || 300,
      colorPortada,
      solapasMm: Number(solapasMm) || 0,
      tipoEncuadernacion,
      tipoTapa,
      grosorCartonMm: Number(grosorCartonMm) || 2.0,
      impresionCubiertaTecnologia,
      maquinaCubiertaId,
      plastificadoCubiertaId
    } : undefined
  });

  // Ejecución del motor para la configuración actual con tarifas personalizadas
  let calculo = $derived(calcularEscandalloCompleto(parametrosCalculo, $escandalloConfig || undefined));

  // Máquina activa seleccionada
  let maquinaActiva = $derived(
    maquinaSeleccionadaId
      ? (calculo.opcionesMaquinas.find(m => m.maquina.id === maquinaSeleccionadaId) || calculo.maquinaOptima)
      : calculo.maquinaOptima
  );

  // Lista de tramos según modo activo (automático, intervalos de X en X, o manual)
  let listaTramosACalcular = $derived.by(() => {
    if (modoEscalado === "intervalos") {
      return generarTramosIntervalo(Number(intervaloDesde) || 100, Number(intervaloHasta) || 1000, Number(intervaloPaso) || 100);
    } else if (modoEscalado === "manual") {
      return tramosPersonalizados.length > 0 ? tramosPersonalizados : [100, 250, 500, 1000];
    } else {
      const base = Number(cantidadTirada) || 1000;
      const lista = [
        Math.max(50, Math.round(base * 0.2 / 25) * 25),
        Math.max(100, Math.round(base * 0.5 / 50) * 50),
        base,
        Math.round(base * 2 / 100) * 100,
        Math.round(base * 4 / 250) * 250,
        Math.round(base * 8 / 500) * 500
      ];
      return Array.from(new Set(lista)).sort((a, b) => a - b);
    }
  });

  // Escalado de cantidades multiescala con tarifas personalizadas
  let tramosEscalado = $derived.by(() => {
    return calcularEscaladoCantidades(parametrosCalculo, listaTramosACalcular, $escandalloConfig || undefined);
  });

  function copiarTarifaPortapapeles() {
    const filas = tramosEscalado;
    const lineas = [
      "Tirada (uds)\tPrensa\tTecnología\tCoste Total (€)\tCoste/Ud (€)\tPVP Total (€)\tPVP/Ud (€)\tMargen (€)"
    ];
    filas.forEach(f => {
      lineas.push(`${f.cantidad}\t${f.maquinaOptimaNombre}\t${f.tecnologia.toUpperCase()}\t${f.costeTotal.toFixed(2)} €\t${f.costeUnitario.toFixed(3)} €\t${f.precioVentaSugerido.toFixed(2)} €\t${f.precioUnitario.toFixed(3)} €\t${f.margenEuros.toFixed(2)} €`);
    });
    navigator.clipboard.writeText(lineas.join("\n"));
    copiadoTarifaFeedback = true;
    setTimeout(() => {
      copiadoTarifaFeedback = false;
    }, 2500);
  }

  // Construir resumen técnico para un artículo
  function construirDetalleTecnico(opcion?: any) {
    const maq = opcion ? (calculo.opcionesMaquinas.find(m => m.maquina.id === opcion.maquinaOptimaNombre) || maquinaActiva) : maquinaActiva;
    const cant = opcion ? opcion.cantidad : cantidadTirada;
    const pvpUnit = opcion ? opcion.precioUnitario : maq.precioUnitarioSugerido;
    const costeTot = opcion ? opcion.costeTotal : maq.costeTotalEmpresa;

    let descProducto = "";
    if (esPublicacion && geometriaPublicacion) {
      const cubDetalle = geometriaPublicacion.esTapaDura
        ? `Tapa Dura Contracolada (${geometriaPublicacion.grosorCartonMm}mm)`
        : `Tapa Flexible ${gramajePortada}g`;
      const cubTecno = maq.desglosePublicacion ? ` [Cubierta: ${maq.desglosePublicacion.maquinaCubiertaNombre} (${maq.desglosePublicacion.tecnologiaCubierta.toUpperCase()})]` : "";
      descProducto = `${nombreTrabajo}: ${geometriaPublicacion.descripcionTecnica} | ${cubDetalle} + ${colorPortada}${cubTecno}`;
    } else if (categoriaActiva === "desplegable") {
      descProducto = `${nombreTrabajo}: ${geometriaDesplegable.descripcionTecnica}`;
    } else {
      descProducto = `${nombreTrabajo}: ${anchoBaseMm}x${altoBaseMm} mm | ${calculo.papel.nombre} ${gramaje}g | Tintas ${colorImpresion}`;
    }

    const extras: string[] = [];
    if (numPantones > 0) extras.push(`${numPantones} Pantone (${nombresPantone || 'Directo'})`);
    if (barnizUV !== "ninguno") extras.push(catalogoAcabados[barnizUV]?.nombre || CATALOGO_ACABADOS[barnizUV]?.nombre || barnizUV);
    if (stampingFoil !== "ninguno") extras.push(`Stamping ${stampingFoil.toUpperCase()}`);
    if (golpeSeco) extras.push("Golpe en Seco (Relieve)");
    acabadosSeleccionados.forEach(id => {
      const nom = catalogoAcabados[id]?.nombre || CATALOGO_ACABADOS[id]?.nombre;
      if (nom) extras.push(nom);
    });

    const extrasTxt = extras.length > 0 ? ` | Acabados: ${extras.join(", ")}` : "";

    return {
      nombre: nombreTrabajo,
      detalles: `${descProducto}${extrasTxt}. Imposición: ${maq.imposicion.totalPosesPorPliego} poses/pliego (${maq.imposicion.aprovechamientoPorcentaje}% aprovecham.). Pliegos: ${maq.totalPliegosBrutos.toLocaleString()} brutos. Prensa: ${maq.maquina.nombre}.`,
      cant,
      pvpUnit,
      costeTot,
      maq
    };
  }

  // 🛒 AÑADIR A LA CESTA MULTILÍNEA
  function agregarArticuloACesta(opcion?: any) {
    const info = construirDetalleTecnico(opcion);
    const nuevoArticulo: ArticuloCestaEscandallo = {
      id: "art-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      nombre: info.nombre,
      categoria: categoriaActiva,
      cantidad: info.cant,
      anchoMm: anchoBaseMm,
      altoMm: altoBaseMm,
      papelNombre: esPublicacion ? papelInteriorId : calculo.papel.nombre,
      gramaje: esPublicacion ? gramajeInterior : gramaje,
      colorImpresion: esPublicacion ? colorInterior : colorImpresion,
      detallesTecnicos: info.detalles,
      maquinaOptimaNombre: info.maq.maquina.nombre,
      tecnologia: info.maq.maquina.tecnologia,
      costeProduccionTotal: info.costeTot,
      costeUnitario: Math.round((info.costeTot / info.cant) * 1000) / 1000,
      precioVentaSugerido: Math.round((info.pvpUnit * info.cant) * 100) / 100,
      precioUnitario: info.pvpUnit,
      margenBeneficioEuros: Math.round(((info.pvpUnit * info.cant) - info.costeTot) * 100) / 100,
      margenPorcentaje: margenBeneficio
    };

    cestaArticulos = [...cestaArticulos, nuevoArticulo];
    panelCestaAbierto = true;
    feedbackCestaMsg = `¡"${nuevoArticulo.nombre}" añadido a la cesta!`;
    setTimeout(() => {
      feedbackCestaMsg = null;
    }, 3500);
  }

  function eliminarDeCesta(id: string) {
    cestaArticulos = cestaArticulos.filter(a => a.id !== id);
  }

  function vaciarCesta() {
    cestaArticulos = [];
  }

  // Totales acumulados de la cesta
  let totalBaseCesta = $derived(
    cestaArticulos.reduce((acc, a) => acc + (a.precioUnitario * a.cantidad), 0)
  );
  let totalIvaCesta = $derived(Math.round((totalBaseCesta * 0.21) * 100) / 100);
  let totalGeneralCesta = $derived(Math.round((totalBaseCesta + totalIvaCesta) * 100) / 100);

  // Transferir al presupuesto oficial
  function cotizarSoloEsteArticulo(opcion?: any) {
    const info = construirDetalleTecnico(opcion);
    datosParaPresupuesto = {
      descripcion: `${info.nombre} — ${info.detalles}`,
      cantidad: info.cant,
      precioUnitario: info.pvpUnit,
      detallesTecnicos: info.detalles
    };
    modalPresupuestoAbierto = true;
  }

  function emitirPresupuestoDesdeCesta() {
    if (cestaArticulos.length === 0) return;
    datosParaPresupuesto = {
      articulos: cestaArticulos
    };
    modalPresupuestoAbierto = true;
  }
</script>

<div class="space-y-6 pb-20 font-sans">
  <!-- Cabecera Principal y Barra de Cesta Flotante -->
  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-5">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <a
          href={`/w/${workspace}/presupuestos`}
          class="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors mr-2 no-underline"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Volver a Presupuestos</span>
        </a>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
          Motor MIS / ERP
        </span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
        <Cpu class="w-7 h-7 text-amber-500" />
        <span>Escandallo e Imposición Técnica</span>
      </h1>
      <p class="text-xs sm:text-sm text-muted-foreground mt-1">
        Calcula costes industriales, imposición geométrica de pliegos, crossover de maquinaria y añade múltiples artículos al presupuesto.
      </p>
    </div>

    <!-- Barra de Estado de Cesta Multilínea y Acceso a Tarifas -->
    <div class="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
      
      <!-- Enlace a Ajustes de Tarifas y Parámetros -->
      <a
        href={`/w/${workspace}/escandallo/tarifas`}
        class="inline-flex items-center gap-2 px-3.5 py-2.5 bg-card hover:bg-accent border border-border hover:border-amber-500/50 rounded-xl text-xs font-semibold text-foreground transition-all shadow-2xs group"
        title="Modificar precios de papel, clics, tiempos de máquina y acabados"
      >
        <Sliders class="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
        <span>Tarifas & Parámetros</span>
        <span class="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">AJUSTES</span>
      </a>

      <button
        type="button"
        onclick={() => (panelCestaAbierto = !panelCestaAbierto)}
        class="relative inline-flex items-center gap-2 px-4 py-2.5 bg-card hover:bg-accent border border-border rounded-xl text-xs font-semibold text-foreground transition-all shadow-2xs cursor-pointer"
      >
        <ShoppingCart class="w-4 h-4 text-primary" />
        <span>Cesta de Artículos</span>
        {#if cestaArticulos.length > 0}
          <span class="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            {cestaArticulos.length}
          </span>
          <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {formatEuro(totalBaseCesta)}
          </span>
        {/if}
      </button>

      {#if cestaArticulos.length > 0}
        <button
          type="button"
          onclick={emitirPresupuestoDesdeCesta}
          class="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Sparkles class="w-4 h-4" />
          <span>Emitir Presupuesto ({cestaArticulos.length})</span>
        </button>
      {/if}
    </div>
  </div>

  <!-- Toast Notificación de Artículo Añadido -->
  {#if feedbackCestaMsg}
    <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2">
      <div class="flex items-center gap-2 font-medium">
        <CheckCircle2 class="w-4 h-4 text-emerald-500" />
        <span>{feedbackCestaMsg}</span>
      </div>
      <button
        type="button"
        onclick={() => (feedbackCestaMsg = null)}
        class="text-muted-foreground hover:text-foreground"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  {/if}

  <!-- 1. SELECTOR SUPERIOR DE FAMILIAS DE PRODUCTO GRÁFICO -->
  <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
    <div class="flex items-center justify-between mb-3">
      <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Layers class="w-4 h-4 text-primary" />
        <span>1. Selecciona la Tipología de Producto</span>
      </span>
      <span class="text-[11px] text-muted-foreground">Elige la familia para adaptar los parámetros de cálculo</span>
    </div>

    <!-- Pestañas de Categoría -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {#each CATEGORIAS_PRODUCTO as cat}
        <button
          type="button"
          onclick={() => seleccionarCategoria(cat.id)}
          class={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
            categoriaActiva === cat.id
              ? "bg-primary/10 border-primary text-primary font-bold shadow-2xs"
              : "bg-muted/30 border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          <div class="w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 bg-background/80 shadow-2xs">
            {#if cat.id === "comercial"}
              <FileText class="w-4 h-4" />
            {:else if cat.id === "tarjetas"}
              <CreditCard class="w-4 h-4" />
            {:else if cat.id === "desplegable"}
              <FoldHorizontal class="w-4 h-4" />
            {:else if cat.id === "publicacion"}
              <BookOpen class="w-4 h-4" />
            {:else if cat.id === "calendario"}
              <Calendar class="w-4 h-4" />
            {:else}
              <FolderOpen class="w-4 h-4" />
            {/if}
          </div>
          <span class="text-xs leading-tight">{cat.nombre}</span>
        </button>
      {/each}
    </div>

    <!-- Presets Rápidos de la Categoría Activa -->
    <div class="mt-3.5 pt-3.5 border-t border-border/50 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
      <span class="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">Plantillas Rápidas:</span>
      <div class="flex items-center gap-1.5">
        {#each presetsFiltrados as preset}
          <button
            type="button"
            onclick={() => aplicarPreset(preset)}
            class={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              presetActivoId === preset.id
                ? "bg-foreground text-background border-foreground font-semibold"
                : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            {preset.nombre}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- PANEL DESPLEGABLE: CESTA DE ARTÍCULOS ACUMULADOS -->
  {#if panelCestaAbierto && cestaArticulos.length > 0}
    <div class="bg-card border-2 border-primary/30 rounded-2xl p-5 shadow-md">
      <div class="flex items-center justify-between pb-3 border-b border-border">
        <div class="flex items-center gap-2">
          <ShoppingCart class="w-5 h-5 text-primary" />
          <h3 class="text-sm font-bold text-foreground">
            Artículos en Cesta ({cestaArticulos.length})
          </h3>
          <span class="text-xs text-muted-foreground">Listos para consolidar en un único presupuesto</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={vaciarCesta}
            class="text-xs text-rose-500 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            Vaciar Cesta
          </button>
          <button
            type="button"
            onclick={() => (panelCestaAbierto = false)}
            class="text-muted-foreground hover:text-foreground p-1"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="divide-y divide-border/60 max-h-72 overflow-y-auto mt-2">
        {#each cestaArticulos as art, idx}
          <div class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span class="font-bold text-foreground text-sm">{art.nombre}</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-muted uppercase tracking-wider text-muted-foreground font-semibold">
                  {art.categoria}
                </span>
              </div>
              <p class="text-[11px] text-muted-foreground line-clamp-1">
                {art.detallesTecnicos}
              </p>
              <div class="text-[11px] text-muted-foreground flex items-center gap-3">
                <span>Tirada: <strong class="text-foreground">{art.cantidad.toLocaleString()} uds</strong></span>
                <span>Prensa: <strong class="text-foreground">{art.maquinaOptimaNombre}</strong></span>
              </div>
            </div>

            <div class="flex items-center justify-between sm:justify-end gap-4 self-end sm:self-center">
              <div class="text-right">
                <div class="text-sm font-bold text-foreground">
                  {formatEuro(art.precioVentaSugerido)}
                </div>
                <div class="text-[10px] text-muted-foreground">
                  {art.precioUnitario.toFixed(3)} €/ud (Coste: {formatEuro(art.costeProduccionTotal)})
                </div>
              </div>
              <button
                type="button"
                onclick={() => eliminarDeCesta(art.id)}
                class="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                title="Eliminar partida"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        {/each}
      </div>

      <div class="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/30 p-3 rounded-xl">
        <div class="flex items-center gap-4 text-xs">
          <span>Base Imponible: <strong class="text-foreground font-bold">{formatEuro(totalBaseCesta)}</strong></span>
          <span>IVA (21%): <strong class="text-foreground font-bold">{formatEuro(totalIvaCesta)}</strong></span>
          <span class="text-sm font-extrabold text-foreground">Total Presupuesto: {formatEuro(totalGeneralCesta)}</span>
        </div>
        <button
          type="button"
          onclick={emitirPresupuestoDesdeCesta}
          class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
        >
          <Sparkles class="w-4 h-4" />
          <span>Generar Presupuesto con {cestaArticulos.length} Partidas</span>
        </button>
      </div>
    </div>
  {/if}

  <!-- CUADRO DE CONFIGURACIÓN TÉCNICA PRINCIPAL -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- COLUMNA IZQUIERDA: CONFIGURADOR DINÁMICO SEGÚN FAMILIA -->
    <div class="lg:col-span-6 space-y-5">
      <!-- Datos Generales del Artículo -->
      <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs space-y-4">
        <div class="flex items-center justify-between border-b border-border/50 pb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Settings2 class="w-4 h-4 text-amber-500" />
            <span>2. Especificaciones de Producción</span>
          </span>
          <div class="flex items-center gap-2">
            <label class="text-[11px] text-muted-foreground">Tirada deseada:</label>
            <input
              type="number"
              bind:value={cantidadTirada}
              min="1"
              step="100"
              class="w-28 px-2.5 py-1 text-xs font-bold rounded-lg border border-border bg-background text-foreground text-right"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground mb-1">Nombre / Título del Trabajo:</label>
            <input
              type="text"
              bind:value={nombreTrabajo}
              class="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground mb-1">Margen Comercial (% Markup):</label>
            <div class="flex items-center gap-2">
              <input
                type="number"
                bind:value={margenBeneficio}
                min="0"
                max="100"
                class="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs text-right font-bold"
              />
              <span class="text-xs text-muted-foreground font-semibold">%</span>
            </div>
          </div>
        </div>

        <!-- CONDICIONAL A: CONFIGURADOR DE PUBLICACIONES (Libros, Revistas, Agendas) -->
        {#if esPublicacion}
          <div class="border-t border-border/60 pt-3 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BookOpen class="w-4 h-4 text-primary" />
                <span>Interiores & Tripas Multi-página</span>
              </span>
              <span class="text-[11px] text-muted-foreground">Múltiplo de 4 págs para plegado</span>
            </div>

            <div class="grid grid-cols-3 gap-2.5 text-xs">
              <div>
                <label class="block text-[10px] text-muted-foreground mb-1">Páginas Totales:</label>
                <select
                  bind:value={paginasInteriores}
                  class="w-full px-2.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold"
                >
                  <option value={16}>16 págs (1 pliego)</option>
                  <option value={24}>24 págs</option>
                  <option value={32}>32 págs (2 pliegos)</option>
                  <option value={48}>48 págs (3 pliegos)</option>
                  <option value={64}>64 págs (4 pliegos)</option>
                  <option value={96}>96 págs</option>
                  <option value={128}>128 págs</option>
                  <option value={160}>160 págs</option>
                  <option value={240}>240 págs</option>
                </select>
              </div>

              <div>
                <label class="block text-[10px] text-muted-foreground mb-1">Papel Interior:</label>
                <select
                  bind:value={papelInteriorId}
                  class="w-full px-2 py-2 rounded-xl border border-border bg-background text-foreground text-xs"
                >
                  {#each catalogoPapeles as p}
                    <option value={p.id}>{p.nombre}</option>
                  {/each}
                </select>
              </div>

              <div>
                <label class="block text-[10px] text-muted-foreground mb-1">Gramaje Interior:</label>
                <select
                  bind:value={gramajeInterior}
                  class="w-full px-2 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-bold"
                >
                  <option value={80}>80g Offset</option>
                  <option value={90}>90g Offset</option>
                  <option value={100}>100g Offset</option>
                  <option value={115}>115g Couché</option>
                  <option value={135}>135g Couché</option>
                  <option value={150}>150g Couché</option>
                </select>
              </div>
            </div>

            <!-- Cubierta, Tapa Dura Contracolada & Encuadernación -->
            <div class="bg-muted/40 p-3.5 rounded-xl border border-border/60 space-y-3 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  <BookMarked class="w-4 h-4 text-amber-500" />
                  <span>Cubiertas, Tapas & Encuadernación</span>
                </span>
                <!-- Selector Tipo de Tapa -->
                <div class="flex items-center bg-background/80 p-0.5 rounded-lg border border-border text-[10px]">
                  <button
                    type="button"
                    onclick={() => (tipoTapa = "flexible")}
                    class={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                      tipoTapa === "flexible" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Tapa Flexible
                  </button>
                  <button
                    type="button"
                    onclick={() => (tipoTapa = "dura_contracolada")}
                    class={`px-2.5 py-1 rounded-md transition-all font-semibold cursor-pointer ${
                      tipoTapa === "dura_contracolada" ? "bg-amber-600 text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Tapa Dura Contracolada
                  </button>
                </div>
              </div>

              <!-- Parámetros de la Cubierta según tipo -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label class="block text-[10px] text-muted-foreground mb-0.5 font-medium">Tipo Encuadernación:</label>
                  <select
                    bind:value={tipoEncuadernacion}
                    class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold"
                  >
                    <option value="wire_o">Wire-O Metálico (Agendas & Cuadernos)</option>
                    <option value="rustica_pur">Rústica PUR (Lomo Cuadrado)</option>
                    <option value="rustica_cosida">Rústica Cosida con Hilo</option>
                    <option value="grapado">Grapado Caballete (≤64p)</option>
                    <option value="espiral">Espiral Plástica</option>
                  </select>
                </div>

                {#if tipoTapa === "dura_contracolada"}
                  <div>
                    <label class="block text-[10px] text-muted-foreground mb-0.5 font-medium">Cartón Compacto Rígido:</label>
                    <select
                      bind:value={grosorCartonMm}
                      class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-bold"
                    >
                      <option value={1.5}>Cartón Gris 1.5 mm</option>
                      <option value={2.0}>Cartón Gris 2.0 mm (Estándar)</option>
                      <option value={2.5}>Cartón Gris 2.5 mm (Premium)</option>
                      <option value={3.0}>Cartón Gris 3.0 mm (Gran calibre)</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-[10px] text-muted-foreground mb-0.5 font-medium">Forro Exterior Contracolado:</label>
                    <select
                      class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                      disabled
                    >
                      <option>Couché 150g (+20mm vuelta)</option>
                    </select>
                  </div>
                {:else}
                  <div>
                    <label class="block text-[10px] text-muted-foreground mb-0.5 font-medium">Gramaje Portada:</label>
                    <select
                      bind:value={gramajePortada}
                      class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                    >
                      <option value={250}>250g Couché</option>
                      <option value={300}>300g Couché</option>
                      <option value={350}>350g Couché</option>
                      <option value={300}>300g Folding 1C</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-[10px] text-muted-foreground mb-0.5 font-medium">Solapas Portada:</label>
                    <select
                      bind:value={solapasMm}
                      class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                    >
                      <option value={0}>Sin solapas</option>
                      <option value={60}>2 solapas de 60 mm</option>
                      <option value={75}>2 solapas de 75 mm</option>
                    </select>
                  </div>
                {/if}
              </div>

              <!-- Producción Híbrida de Cubierta (Offset vs Digital) & Acabado -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-border/40">
                <div>
                  <label class="block text-[10px] text-muted-foreground mb-0.5 font-medium">Impresión Cubierta (Híbrida):</label>
                  <select
                    bind:value={impresionCubiertaTecnologia}
                    class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold"
                  >
                    <option value="auto">Automática (Óptima)</option>
                    <option value="digital">Prensa Digital (Ricoh 7200 / 9200)</option>
                    <option value="offset">Prensa Offset (SM 52 / Sakurai)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] text-muted-foreground mb-0.5 font-medium">Color Cubierta:</label>
                  <select
                    bind:value={colorPortada}
                    class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold"
                  >
                    <option value="4+0">4+0 (Color 1 Cara / Exterior)</option>
                    <option value="4+4">4+4 (Color 2 Caras)</option>
                    <option value="1+0">1+0 (B/N 1 Cara)</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] text-muted-foreground mb-0.5 font-medium">Plastificado Cubierta/Forro:</label>
                  <select
                    bind:value={plastificadoCubiertaId}
                    class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs"
                  >
                    <option value="plastificado_mate_1c">Plastificado Mate 1 Cara</option>
                    <option value="plastificado_brillo_1c">Plastificado Brillo 1 Cara</option>
                    <option value="plastificado_softtouch_2c">Laminado Soft Touch (Tacto Seda)</option>
                    {#if tipoTapa === "flexible"}
                      <option value="">Sin Plastificado</option>
                    {/if}
                  </select>
                </div>
              </div>

              <!-- Ficha Técnica de Lomo y Estructura -->
              {#if geometriaPublicacion}
                <div class="mt-2 text-[11px] p-2.5 rounded-xl border bg-background/80 space-y-1 {geometriaPublicacion.esTapaDura ? 'border-amber-500/30 text-amber-700 dark:text-amber-400' : 'border-primary/20 text-primary'}">
                  <div class="flex items-center justify-between font-bold">
                    <span>📐 {geometriaPublicacion.esTapaDura ? `Tapa Dura Cartoné (${geometriaPublicacion.grosorCartonMm}mm)` : 'Tapa Flexible'} · Lomo: {geometriaPublicacion.lomoMm} mm</span>
                    <span>{geometriaPublicacion.signaturasTotales} signaturas ({geometriaPublicacion.pliegosTripaPorEjemplar} pliegos/ud)</span>
                  </div>
                  <div class="text-[10px] text-muted-foreground">
                    {#if geometriaPublicacion.esTapaDura}
                      <span>Cartón tapas: <strong>{geometriaPublicacion.anchoCartonTapaMm}x{geometriaPublicacion.altoCartonTapaMm} mm</strong> · Papel forro exterior: <strong>{geometriaPublicacion.anchoForroAbiertoMm}x{geometriaPublicacion.altoForroAbiertoMm} mm</strong> (incluye 20mm vueltas de contracolado) · Guardas interiores offset 120g.</span>
                    {:else}
                      <span>Cubierta extendida: <strong>{geometriaPublicacion.anchoCubiertaAbierta}x{geometriaPublicacion.altoCubiertaAbierta} mm</strong>{solapasMm > 0 ? ` (con 2 solapas de ${solapasMm}mm)` : ''}.</span>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          </div>

        <!-- CONDICIONAL B: CONFIGURADOR DE DESPLEGABLES (Palas & Ventanas) -->
        {:else if categoriaActiva === "desplegable"}
          <div class="border-t border-border/60 pt-3 space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FoldHorizontal class="w-4 h-4 text-primary" />
                <span>Geometría del Desplegable</span>
              </span>
              <div class="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 text-[10px]">
                <button
                  type="button"
                  onclick={() => (modoDefinicionDesplegable = "cerrado")}
                  class={`px-2 py-1 rounded-md transition-all ${
                    modoDefinicionDesplegable === "cerrado" ? "bg-background font-bold text-foreground shadow-2xs" : "text-muted-foreground"
                  }`}
                >
                  Tamaño Cerrado
                </button>
                <button
                  type="button"
                  onclick={() => (modoDefinicionDesplegable = "abierto")}
                  class={`px-2 py-1 rounded-md transition-all ${
                    modoDefinicionDesplegable === "abierto" ? "bg-background font-bold text-foreground shadow-2xs" : "text-muted-foreground"
                  }`}
                >
                  Tamaño Abierto
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div class="sm:col-span-2">
                <label class="block text-[10px] text-muted-foreground mb-1">Tipo de Plegado:</label>
                <select
                  bind:value={tipoPlegadoId}
                  class="w-full px-2.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-medium"
                >
                  {#each TIPOS_PLEGADO as t}
                    <option value={t.id}>{t.nombre} ({t.paginas} págs)</option>
                  {/each}
                </select>
              </div>

              <div>
                <label class="block text-[10px] text-muted-foreground mb-1">Cotas {modoDefinicionDesplegable}:</label>
                <div class="flex items-center gap-1">
                  <input
                    type="number"
                    bind:value={anchoBaseMm}
                    class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-center text-xs font-bold"
                  />
                  <span>x</span>
                  <input
                    type="number"
                    bind:value={altoBaseMm}
                    class="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-center text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <!-- Esquema gráfico de palas calculadas -->
            <div class="bg-muted/30 p-2.5 rounded-xl border border-border/50 text-[11px] space-y-1.5">
              <div class="flex items-center justify-between text-muted-foreground">
                <span>Abierto: <strong>{geometriaDesplegable.anchoAbierto} x {geometriaDesplegable.altoAbierto} mm</strong></span>
                <span>Cerrado: <strong>{geometriaDesplegable.anchoCerrado} x {geometriaDesplegable.altoCerrado} mm</strong></span>
              </div>
              <div class="flex items-stretch gap-1.5 h-12">
                {#each geometriaDesplegable.palas as pala}
                  <div class="flex-1 bg-background border border-primary/30 rounded-lg p-1 text-center flex flex-col justify-center">
                    <span class="text-[9px] text-muted-foreground font-semibold truncate">{pala.nombre}</span>
                    <span class="text-xs font-bold text-foreground">{pala.ancho} mm</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>

        <!-- CONDICIONAL C: FORMATO PLANO ESTÁNDAR (Flyers, Tarjetas, Carpetas) -->
        {:else}
          <div class="border-t border-border/60 pt-3 space-y-3">
            <span class="text-xs font-bold text-foreground block">Dimensiones de Corte Final:</span>
            <div class="grid grid-cols-3 gap-2.5 text-xs">
              <div>
                <label class="block text-[10px] text-muted-foreground mb-1">Ancho (mm):</label>
                <input
                  type="number"
                  bind:value={anchoBaseMm}
                  class="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold text-center"
                />
              </div>
              <div>
                <label class="block text-[10px] text-muted-foreground mb-1">Alto (mm):</label>
                <input
                  type="number"
                  bind:value={altoBaseMm}
                  class="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold text-center"
                />
              </div>
              <div>
                <label class="block text-[10px] text-muted-foreground mb-1">Sangre (mm):</label>
                <input
                  type="number"
                  bind:value={sangreMm}
                  class="w-full px-2.5 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold text-center"
                />
              </div>
            </div>
          </div>
        {/if}

        <!-- Papel y Tintas para No Publicaciones -->
        {#if !esPublicacion}
          <div class="border-t border-border/60 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label class="block text-[10px] text-muted-foreground mb-1">Tipo de Papel:</label>
              <select
                bind:value={papelId}
                class="w-full px-2 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs"
              >
                {#each catalogoPapeles as p}
                  <option value={p.id}>{p.nombre} ({p.precioKg.toFixed(2)} €/kg)</option>
                {/each}
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-muted-foreground mb-1">Gramaje:</label>
              <select
                bind:value={gramaje}
                class="w-full px-2 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold"
              >
                {#each (papelSeleccionadoActual?.gramajes && papelSeleccionadoActual.gramajes.length > 0 ? papelSeleccionadoActual.gramajes : [90, 115, 135, 150, 170, 200, 250, 300, 350, 400]) as g}
                  <option value={g}>{g}g</option>
                {/each}
              </select>
            </div>
            <div>
              <label class="block text-[10px] text-muted-foreground mb-1">Tintas:</label>
              <select
                bind:value={colorImpresion}
                class="w-full px-2 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs font-bold"
              >
                <option value="4+4">4+4 (Color 2 Caras)</option>
                <option value="4+0">4+0 (Color 1 Cara)</option>
                <option value="1+1">1+1 (B/N 2 Caras)</option>
                <option value="1+0">1+0 (B/N 1 Cara)</option>
              </select>
            </div>
          </div>
        {/if}
      </div>

      <!-- TINTAS ESPECIALES & ACABADOS DE ALTO VALOR AÑADIDO -->
      <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs space-y-3.5">
        <div class="flex items-center justify-between border-b border-border/50 pb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Palette class="w-4 h-4 text-purple-500" />
            <span>3. Tintas Especiales & Procesos de Valor</span>
          </span>
          <span class="text-[11px] text-muted-foreground">Pantones, UVI, Stamping y Relieve</span>
        </div>

        <!-- Pantones -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label class="block text-[10px] font-semibold text-muted-foreground mb-1">Colores Pantone Directos:</label>
            <select
              bind:value={numPantones}
              class="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs"
            >
              <option value={0}>Sin Pantone (Solo cuatricromía)</option>
              <option value={1}>1 Pantone Directo (+ lavado tintero + CTP)</option>
              <option value={2}>2 Pantones Directos (+ 2 CTPs)</option>
            </select>
          </div>
          {#if numPantones > 0}
            <div>
              <label class="block text-[10px] font-semibold text-muted-foreground mb-1">Ref. Pantone (ej. 871 C Oro):</label>
              <input
                type="text"
                bind:value={nombresPantone}
                placeholder="ej. Pantone 286 C / 871 C"
                class="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs"
              />
            </div>
          {/if}
        </div>

        <!-- Barniz UV & Stamping -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
          <div>
            <label class="block text-[10px] font-semibold text-muted-foreground mb-1">Barniz UV / Acrílico:</label>
            <select
              bind:value={barnizUV}
              class="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs"
            >
              <option value="ninguno">Ninguno</option>
              <option value="offset_proteccion">Barniz Máquina Offset Protección</option>
              <option value="uvi_brillo_total">Barniz UVI Brillo Pliego Total</option>
              <option value="uvi_selectivo">Barniz UVI Brillo Selectivo (Reserva)</option>
              <option value="uvi_3d_relieve">Barniz Digital con Relieve 3D</option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-semibold text-muted-foreground mb-1">Stamping / Hot Foil Térmico:</label>
            <select
              bind:value={stampingFoil}
              class="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-foreground text-xs"
            >
              <option value="ninguno">Sin Stamping</option>
              <option value="oro">Foil Oro Metálico (+ cliché magnesio)</option>
              <option value="plata">Foil Plata Espejo</option>
              <option value="cobre">Foil Cobre / Bronce</option>
              <option value="holografico">Foil Holográfico</option>
            </select>
          </div>
        </div>

        <!-- Golpe en seco y acabados tradicionales -->
        <div class="pt-2 border-t border-border/50">
          <label class="flex items-center gap-2 cursor-pointer text-xs mb-3">
            <input
              type="checkbox"
              bind:checked={golpeSeco}
              class="rounded text-primary focus:ring-primary w-4 h-4"
            />
            <span class="font-medium text-foreground">Añadir Golpe en Seco / Relieve sin tinta (Embossing)</span>
            <span class="text-[10px] text-muted-foreground">(Incluye molde macho/hembra)</span>
          </label>

          <span class="text-[11px] font-semibold text-muted-foreground block mb-2">Acabados Adicionales de Catálogo:</span>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {#each Object.values(catalogoAcabados) as ac}
              <button
                type="button"
                onclick={() => toggleAcabado(ac.id)}
                class={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] flex items-center justify-between transition-all cursor-pointer ${
                  acabadosSeleccionados.includes(ac.id)
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-2xs"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span class="truncate">{ac.nombre}</span>
                {#if acabadosSeleccionados.includes(ac.id)}
                  <CheckCircle2 class="w-3.5 h-3.5 text-primary flex-shrink-0 ml-1" />
                {/if}
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- COLUMNA DERECHA: RESULTADOS EN VIVO, COMPARADOR DE MÁQUINAS Y CESTA -->
    <div class="lg:col-span-6 space-y-5">
      <!-- Tarjeta Resumen Financiero y Acciones -->
      <div class="bg-card border-2 border-primary/20 rounded-2xl p-5 shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-primary">Presupuesto Sugerido del Artículo</span>
            <h2 class="text-xl font-bold text-foreground mt-0.5">{nombreTrabajo}</h2>
          </div>
          <div class="text-right">
            <span class="text-2xl font-extrabold text-foreground">
              {formatEuro(maquinaActiva.precioVentaSugerido)}
            </span>
            <span class="text-xs text-muted-foreground block">
              {maquinaActiva.precioUnitarioSugerido.toFixed(3)} € / unidad
            </span>
          </div>
        </div>

        <!-- Desglose de Costes Clave -->
        <div class="grid grid-cols-3 gap-2 bg-muted/30 p-3 rounded-xl text-center text-xs">
          <div>
            <span class="text-[10px] text-muted-foreground block">Coste Industrial</span>
            <span class="font-bold text-foreground">{formatEuro(maquinaActiva.costeIndustrialTotal)}</span>
          </div>
          <div>
            <span class="text-[10px] text-muted-foreground block">Estructura ({calculo.parametros.gastosGeneralesPorcentaje || 12}%)</span>
            <span class="font-bold text-foreground">{formatEuro(maquinaActiva.gastosGenerales)}</span>
          </div>
          <div>
            <span class="text-[10px] text-emerald-600 dark:text-emerald-400 block">Beneficio ({margenBeneficio}%)</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400">+{formatEuro(maquinaActiva.margenBeneficioEuros)}</span>
          </div>
        </div>

        <!-- BOTONES DE ACCIÓN: AÑADIR A CESTA O COTIZAR -->
        <div class="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onclick={() => agregarArticuloACesta()}
            class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>Añadir este Artículo a la Cesta</span>
          </button>

          <button
            type="button"
            onclick={() => cotizarSoloEsteArticulo()}
            class="w-full sm:w-auto whitespace-nowrap inline-flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-accent text-foreground font-semibold text-xs rounded-xl border border-border transition-all cursor-pointer"
          >
            <FileText class="w-4 h-4" />
            <span>Cotizar Solo Este</span>
          </button>
        </div>
      </div>

      <!-- Selector de Máquinas (Crossover Digital vs Offset) -->
      <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs space-y-3">
        <div class="flex items-center justify-between border-b border-border/50 pb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Printer class="w-4 h-4 text-primary" />
            <span>Parque de Maquinaria & Crossover</span>
          </span>
          <span class="text-[11px] text-muted-foreground">{calculo.puntoCorteCrossover}</span>
        </div>

        <!-- Barra de Tecnologías y Filtro de Prensas (como en el MIS de taller) -->
        <div class="bg-muted/40 p-3 rounded-xl border border-border/60 space-y-2.5 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-4">
              <span class="font-bold text-foreground text-[11px] uppercase tracking-wider">Impresión:</span>
              <label class="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  bind:checked={permitirOffset}
                  class="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                />
                <span class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">OFFSET</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  bind:checked={permitirDigital}
                  class="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                />
                <span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">DIGITAL</span>
              </label>
            </div>

            {#if maquinaSeleccionadaId}
              <button
                type="button"
                onclick={() => (maquinaSeleccionadaId = null)}
                class="text-[10px] text-muted-foreground hover:text-primary transition-colors underline cursor-pointer"
              >
                Volver a selección automática
              </button>
            {/if}
          </div>

          <!-- Selector de Máquina Específica -->
          <div>
            <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Elegir máquina de producción:
            </span>
            <div class="flex flex-wrap gap-1.5">
              <button
                type="button"
                onclick={() => (maquinaSeleccionadaId = null)}
                class={`px-2.5 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
                  maquinaSeleccionadaId === null
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                    : "bg-background border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Todas (Óptima Automática)
              </button>
              {#each catalogoMaquinas as m}
                {@const deshabilitada = (m.tecnologia === "offset" && !permitirOffset) || (m.tecnologia === "digital" && !permitirDigital)}
                {#if !deshabilitada}
                  <button
                    type="button"
                    onclick={() => (maquinaSeleccionadaId = m.id)}
                    class={`px-2 py-1 rounded-lg border text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                      maquinaSeleccionadaId === m.id
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                        : "bg-background border-border text-foreground hover:bg-accent"
                    }`}
                  >
                    <span class={`w-1.5 h-1.5 rounded-full ${m.tecnologia === 'digital' ? 'bg-blue-400' : 'bg-emerald-400'}`}></span>
                    <span>{m.nombre}</span>
                  </button>
                {/if}
              {/each}
            </div>
          </div>
        </div>

        <!-- Banner de Producción Híbrida si es Publicación -->
        {#if esPublicacion && maquinaActiva.desglosePublicacion}
          <div class="bg-primary/5 border border-primary/20 rounded-xl p-2.5 text-xs space-y-1">
            <div class="flex items-center justify-between font-bold text-foreground">
              <span class="flex items-center gap-1.5 text-primary">
                <Layers class="w-3.5 h-3.5" />
                <span>Ruta de Producción Gráfica Híbrida:</span>
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">
                {maquinaActiva.desglosePublicacion.esTapaDura ? "Tapa Dura Contracolada" : "Tapa Flexible"}
              </span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-1">
              <div>
                <span>📖 <strong>Interiores/Tripas:</strong> {maquinaActiva.maquina.nombre} ({maquinaActiva.maquina.tecnologia.toUpperCase()})</span>
              </div>
              <div>
                <span>🎨 <strong>Cubierta:</strong> {maquinaActiva.desglosePublicacion.maquinaCubiertaNombre} ({maquinaActiva.desglosePublicacion.tecnologiaCubierta.toUpperCase()})</span>
              </div>
            </div>
          </div>
        {/if}

        <!-- Tarjetas comparativas de prensas -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {#each calculo.opcionesMaquinas as opcion}
            <button
              type="button"
              onclick={() => (maquinaSeleccionadaId = opcion.maquina.id)}
              class={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                maquinaActiva.maquina.id === opcion.maquina.id
                  ? "bg-primary/10 border-primary ring-1 ring-primary shadow-2xs"
                  : "bg-background border-border/70 hover:bg-accent"
              }`}
            >
              <div>
                <div class="flex items-center justify-between gap-1">
                  <span class="font-bold text-foreground text-xs truncate">{opcion.maquina.nombre}</span>
                  {#if opcion.esRecomendada}
                    <span class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[9px] font-bold shrink-0">
                      ÓPTIMA
                    </span>
                  {/if}
                </div>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                    opcion.maquina.tecnologia === "digital" 
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}>
                    {opcion.maquina.tecnologia}
                  </span>
                  <span class="text-[10px] text-muted-foreground">{opcion.imposicion.totalPosesPorPliego} poses/pliego</span>
                </div>
              </div>

              <div class="mt-2 pt-1.5 border-t border-border/50 flex items-baseline justify-between">
                <span class="text-xs font-extrabold text-foreground">{formatEuro(opcion.precioVentaSugerido)}</span>
                <span class="text-[10px] text-muted-foreground">{opcion.precioUnitarioSugerido.toFixed(3)} €/ud</span>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Canvas SVG de Imposición 2D en Pliego -->
      <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs space-y-2">
        <div class="flex items-center justify-between text-xs border-b border-border/50 pb-2">
          <span class="font-bold text-foreground flex items-center gap-1.5">
            <Eye class="w-4 h-4 text-primary" />
            <span>Imposición 2D: Pliego {maquinaActiva.maquina.pliegoAncho}x{maquinaActiva.maquina.pliegoAlto} mm</span>
          </span>
          <span class="text-[11px] font-bold text-primary">
            {maquinaActiva.imposicion.aprovechamientoPorcentaje}% Aprovechamiento
          </span>
        </div>

        <div class="bg-muted/20 border border-border/60 rounded-xl p-3 flex flex-col items-center justify-center">
          <svg
            viewBox={`0 0 ${maquinaActiva.maquina.pliegoAncho} ${maquinaActiva.maquina.pliegoAlto}`}
            class="max-w-full max-h-48 border border-border bg-card rounded shadow-inner"
          >
            <!-- Pinza de arrastre -->
            <rect
              x="0"
              y="0"
              width={maquinaActiva.maquina.pliegoAncho}
              height={maquinaActiva.maquina.pinzaMm}
              fill="rgba(239, 68, 68, 0.2)"
            />
            <!-- Área útil de poses -->
            {#each Array(maquinaActiva.imposicion.posesFilas) as _, fila}
              {#each Array(maquinaActiva.imposicion.posesColumnas) as _, col}
                <rect
                  x={maquinaActiva.maquina.margenLateralMm + col * (maquinaActiva.imposicion.anchoPoseConSangre + 3)}
                  y={maquinaActiva.maquina.pinzaMm + fila * (maquinaActiva.imposicion.altoPoseConSangre + 3)}
                  width={maquinaActiva.imposicion.anchoPoseConSangre}
                  height={maquinaActiva.imposicion.altoPoseConSangre}
                  fill="rgba(59, 130, 246, 0.2)"
                  stroke="rgba(59, 130, 246, 0.7)"
                  stroke-width="1.5"
                  rx="1"
                />
              {/each}
            {/each}
          </svg>
          <div class="mt-2 text-[10px] text-muted-foreground flex items-center gap-4">
            <span>Poses: <strong>{maquinaActiva.imposicion.totalPosesPorPliego}</strong> ({maquinaActiva.imposicion.posesColumnas} x {maquinaActiva.imposicion.posesFilas})</span>
            <span>Pliegos necesarios: <strong>{maquinaActiva.totalPliegosBrutos.toLocaleString()}</strong> ({maquinaActiva.pesoPapelKg.toFixed(1)} kg)</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- TABLA INTERACTIVA DE ESCALADO DE TIRADAS & GENERADOR DE TARIFAS -->
  <div class="bg-card border border-border/70 rounded-2xl p-5 shadow-2xs space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
      <div>
        <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
          <Table class="w-4 h-4 text-amber-500" />
          <span>Escalado de Tiradas, Tarifas Comerciales & Curva de Degresión</span>
        </h3>
        <p class="text-xs text-muted-foreground mt-0.5">
          Calcula tramos específicos para confeccionar tarifas comerciales (de 50 en 50, de 100 en 100...) o analiza la curva de absorción de costes
        </p>
      </div>

      <div class="flex items-center gap-2">
        <!-- Botón Copiar Tarifa -->
        <button
          type="button"
          onclick={copiarTarifaPortapapeles}
          class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            copiadoTarifaFeedback
              ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "bg-muted/50 hover:bg-muted text-foreground border-border hover:border-foreground/20"
          }`}
          title="Copiar tarifa formateada para Excel o email"
        >
          {#if copiadoTarifaFeedback}
            <Check class="w-3.5 h-3.5 text-emerald-500" />
            <span>¡Tarifa Copiada!</span>
          {:else}
            <Copy class="w-3.5 h-3.5" />
            <span>Copiar Tarifa (Excel)</span>
          {/if}
        </button>
      </div>
    </div>

    <!-- Pestañas de Modo de Escalado -->
    <div class="flex flex-wrap items-center justify-between gap-2.5 bg-muted/30 p-2 rounded-xl border border-border/60">
      <div class="flex items-center gap-1 text-xs">
        <button
          type="button"
          onclick={() => (modoEscalado = "auto")}
          class={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            modoEscalado === "auto"
              ? "bg-background text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Automático Dinámico
        </button>
        <button
          type="button"
          onclick={() => (modoEscalado = "intervalos")}
          class={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            modoEscalado === "intervalos"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders class="w-3.5 h-3.5" />
          <span>Generador de Tarifas por Intervalo</span>
        </button>
        <button
          type="button"
          onclick={() => (modoEscalado = "manual")}
          class={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
            modoEscalado === "manual"
              ? "bg-background text-foreground shadow-2xs border border-border"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Tramos Personalizados
        </button>
      </div>

      <span class="text-[11px] text-muted-foreground font-medium">
        {tramosEscalado.length} tramos calculados
      </span>
    </div>

    <!-- Panel Condicional A: Generador de Tarifa por Intervalos -->
    {#if modoEscalado === "intervalos"}
      <div class="bg-background/80 p-3.5 rounded-xl border border-primary/20 space-y-2.5 text-xs animate-fade-in">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-bold text-foreground text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Sliders class="w-3.5 h-3.5 text-primary" />
            <span>Configuración de Tarifa Escalonada:</span>
          </span>
          <span class="text-[11px] text-muted-foreground">
            Desde <strong>{intervaloDesde.toLocaleString()}</strong> hasta <strong>{intervaloHasta.toLocaleString()}</strong> cada <strong>{intervaloPaso.toLocaleString()}</strong> uds
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div class="sm:col-span-3">
            <label class="block text-[10px] text-muted-foreground mb-1 font-semibold">Tirada Inicial (Desde):</label>
            <input
              type="number"
              bind:value={intervaloDesde}
              min="1"
              step="50"
              class="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-bold"
            />
          </div>

          <div class="sm:col-span-3">
            <label class="block text-[10px] text-muted-foreground mb-1 font-semibold">Tirada Final (Hasta):</label>
            <input
              type="number"
              bind:value={intervaloHasta}
              min="10"
              step="100"
              class="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-bold"
            />
          </div>

          <div class="sm:col-span-6 space-y-1">
            <label class="block text-[10px] text-muted-foreground font-semibold">Intervalo / Paso de cálculo:</label>
            <div class="flex items-center gap-1.5 flex-wrap">
              {#each [25, 50, 100, 200, 250, 500] as paso}
                <button
                  type="button"
                  onclick={() => (intervaloPaso = paso)}
                  class={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    intervaloPaso === paso
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-muted hover:bg-accent text-foreground border border-border"
                  }`}
                >
                  +{paso}
                </button>
              {/each}
              <input
                type="number"
                bind:value={intervaloPaso}
                min="1"
                step="10"
                placeholder="Otro..."
                class="w-20 px-2 py-1 rounded-md border border-border bg-background text-foreground text-[11px] font-bold text-center"
              />
            </div>
          </div>
        </div>
      </div>
    {:else if modoEscalado === "manual"}
      <!-- Panel Condicional B: Tramos Personalizados / Manuales -->
      <div class="bg-background/80 p-3.5 rounded-xl border border-border/80 space-y-2.5 text-xs animate-fade-in">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-bold text-foreground text-[11px] uppercase tracking-wider">
            Añadir cantidades a medida:
          </span>
          <button
            type="button"
            onclick={() => (tramosPersonalizados = [50, 100, 200, 300, 500, 1000, 2500])}
            class="text-[10px] text-muted-foreground hover:text-primary underline cursor-pointer"
          >
            Restablecer valores por defecto
          </button>
        </div>

        <div class="flex items-center gap-2">
          <input
            type="number"
            bind:value={nuevoTramoInput}
            placeholder="ej. 75, 150, 750, 1500..."
            min="1"
            class="w-48 px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-semibold"
            onkeydown={(e) => { if (e.key === 'Enter') agregarTramoPersonalizado(); }}
          />
          <button
            type="button"
            onclick={agregarTramoPersonalizado}
            class="px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all text-xs cursor-pointer flex items-center gap-1"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Añadir Tramo</span>
          </button>
        </div>

        <div class="flex flex-wrap gap-1.5 pt-1">
          {#each tramosPersonalizados as cant}
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-foreground text-xs font-semibold border border-border">
              <span>{cant.toLocaleString()} uds</span>
              <button
                type="button"
                onclick={() => eliminarTramoPersonalizado(cant)}
                class="text-muted-foreground hover:text-rose-500 cursor-pointer ml-0.5"
                title="Eliminar tramo"
              >
                &times;
              </button>
            </span>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Tabla con Resultados de la Tarifa y Botones de Acción -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <th class="py-2.5 px-3">Tirada</th>
            <th class="py-2.5 px-3">Prensa Sugerida</th>
            <th class="py-2.5 px-3 text-right">Coste Total</th>
            <th class="py-2.5 px-3 text-right">Coste / Ud</th>
            <th class="py-2.5 px-3 text-right">PVP Total</th>
            <th class="py-2.5 px-3 text-right">PVP / Ud</th>
            <th class="py-2.5 px-3 text-right">Margen</th>
            <th class="py-2.5 px-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/50">
          {#each tramosEscalado as tramo}
            <tr class={`hover:bg-muted/40 transition-colors ${tramo.cantidad === cantidadTirada ? 'bg-primary/5 font-semibold' : ''}`}>
              <td class="py-3 px-3 font-bold text-foreground">
                <div class="flex items-center gap-1.5">
                  <span>{tramo.cantidad.toLocaleString()} uds</span>
                  {#if tramo.cantidad === cantidadTirada}
                    <span class="px-1.5 py-0.2 rounded text-[9px] bg-primary/20 text-primary font-bold">ACTUAL</span>
                  {/if}
                </div>
              </td>
              <td class="py-3 px-3">
                <span class={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  tramo.tecnologia === "digital" 
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}>
                  {tramo.maquinaOptimaNombre}
                </span>
              </td>
              <td class="py-3 px-3 text-right text-muted-foreground">
                {formatEuro(tramo.costeTotal)}
              </td>
              <td class="py-3 px-3 text-right text-muted-foreground">
                {tramo.costeUnitario.toFixed(3)} €
              </td>
              <td class="py-3 px-3 text-right font-extrabold text-foreground">
                {formatEuro(tramo.precioVentaSugerido)}
              </td>
              <td class="py-3 px-3 text-right font-bold text-primary text-sm">
                {tramo.precioUnitario.toFixed(3)} €
              </td>
              <td class="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                +{formatEuro(tramo.margenEuros)}
              </td>
              <td class="py-3 px-3 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onclick={() => agregarArticuloACesta(tramo)}
                    class="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                    title="Añadir esta cantidad a la cesta multilínea"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>A Cesta</span>
                  </button>
                  <button
                    type="button"
                    onclick={() => cotizarSoloEsteArticulo(tramo)}
                    class="inline-flex items-center gap-1 px-2.5 py-1 bg-muted hover:bg-accent text-foreground border border-border rounded-lg text-xs font-medium cursor-pointer transition-all"
                    title="Emitir presupuesto oficial directo para esta tirada"
                  >
                    <FileText class="w-3.5 h-3.5" />
                    <span>Cotizar</span>
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Modal para emitir presupuesto oficial con uno o múltiples artículos -->
<NuevoPresupuestoModal
  abierto={modalPresupuestoAbierto}
  {workspace}
  datosIniciales={datosParaPresupuesto}
  onClose={() => {
    modalPresupuestoAbierto = false;
    datosParaPresupuesto = null;
  }}
  onCreated={() => {
    modalPresupuestoAbierto = false;
    datosParaPresupuesto = null;
    vaciarCesta();
  }}
/>
