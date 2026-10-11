<!-- src/components/presupuestos/EscandalloTarifasPage.svelte -->
<script lang="ts">
  import { 
    Sliders, 
    Settings2, 
    FileText, 
    Layers, 
    Cpu, 
    Printer, 
    Plus, 
    Trash2, 
    Edit3, 
    Save, 
    RotateCcw, 
    Download, 
    Upload, 
    Check, 
    CheckCircle2, 
    AlertTriangle, 
    Search, 
    Sparkles, 
    Calculator, 
    ArrowLeft,
    ArrowRight, 
    FoldHorizontal, 
    BookOpen, 
    Clock, 
    Zap, 
    Percent, 
    X,
    Filter,
    Package,
    Scissors,
    Palette
  } from "lucide-svelte";
  import { formatEuro } from "$lib/fiscal-utils";
  import { 
    escandalloConfig, 
    guardandoConfig, 
    estadoSincronizacion,
    guardarConfiguracionServidor, 
    restablecerValoresFabrica, 
    exportarTarifasAJson, 
    importarTarifasDesdeJson,
    agregarPapel,
    actualizarPapel,
    eliminarPapel,
    actualizarAcabado,
    agregarAcabado,
    eliminarAcabado,
    actualizarMaquina,
    agregarMaquina,
    eliminarMaquina,
    actualizarCostesTaller,
    agregarPreset,
    actualizarPreset,
    eliminarPreset,
    type PapelConfig, 
    type AcabadoItemConfig, 
    type MaquinaItemConfig, 
    type CostesTallerConfig,
    type ProductoPresetConfig 
  } from "$lib/escandallo-config";

  let { workspace = "facturacion" }: { workspace?: string } = $props();

  // Pestaña activa
  type TabId = "papeles" | "acabados" | "maquinas" | "taller" | "presets";
  let pestanaActiva = $state<TabId>("papeles");

  // Filtros y búsquedas
  let busquedaPapel = $state("");
  let filtroCategoriaAcabado = $state<string>("todos");
  let busquedaAcabado = $state("");
  let filtroTecnologiaMaquina = $state<string>("todas");

  // Feedback y notificaciones
  let mensajeToast = $state<{ tipo: "exito" | "error" | "info"; texto: string } | null>(null);
  function mostrarToast(texto: string, tipo: "exito" | "error" | "info" = "exito") {
    mensajeToast = { tipo, texto };
    setTimeout(() => {
      if (mensajeToast?.texto === texto) {
        mensajeToast = null;
      }
    }, 4000);
  }

  // Input de archivo oculto para importar JSON
  let fileInputRef: HTMLInputElement | null = null;

  async function handleImportarArchivo(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        if (content) {
          const res = await importarTarifasDesdeJson(content);
          if (res.ok) {
            mostrarToast("Tarifas importadas correctamente desde el archivo JSON", "exito");
          } else {
            mostrarToast(res.error || "Error al importar el archivo", "error");
          }
        }
      };
      reader.readAsText(file);
    }
  }

  // Modal para confirmar restablecimiento de fábrica
  let modalConfirmarReset = $state(false);

  async function confirmarRestablecer() {
    modalConfirmarReset = false;
    const res = await restablecerValoresFabrica();
    if (res.ok) {
      mostrarToast("Tarifas restablecidas a los valores de fábrica de la imprenta", "exito");
    } else {
      mostrarToast(res.error || "No se pudo restablecer", "error");
    }
  }

  // Guardar configuración en servidor
  async function handleGuardar() {
    const res = await guardarConfiguracionServidor();
    if (res.ok) {
      mostrarToast("¡Tarifas y parámetros guardados en el servidor con éxito!", "exito");
    } else {
      mostrarToast(res.error || "Error al guardar tarifas", "error");
    }
  }

  // =========================================================================
  // 1. GESTIÓN DE PAPELES (Modales y Estado)
  // =========================================================================
  let modalPapelAbierto = $state(false);
  let modoEdicionPapel = $state(false);
  let formPapel = $state<PapelConfig>({
    id: "",
    nombre: "",
    gramajes: [135, 170, 250],
    precioKg: 1.85,
    densidadAparente: "",
    tamanoPliegoEstandar: "70x100 cm"
  });
  let gramajesInputStr = $state("135, 170, 250");

  function abrirModalNuevoPapel() {
    modoEdicionPapel = false;
    const idSugerido = "papel-" + Date.now().toString(36);
    formPapel = {
      id: idSugerido,
      nombre: "",
      gramajes: [135, 170, 250],
      precioKg: 1.90,
      densidadAparente: "Papel comercial estándar",
      tamanoPliegoEstandar: "70x100 cm"
    };
    gramajesInputStr = "135, 170, 250";
    modalPapelAbierto = true;
  }

  function abrirModalEditarPapel(papel: PapelConfig) {
    modoEdicionPapel = true;
    formPapel = { ...papel };
    gramajesInputStr = papel.gramajes.join(", ");
    modalPapelAbierto = true;
  }

  function guardarFormPapel() {
    if (!formPapel.nombre.trim()) {
      mostrarToast("El nombre del papel es obligatorio", "error");
      return;
    }
    const gramajesParsed = gramajesInputStr
      .split(",")
      .map(g => parseInt(g.trim()))
      .filter(g => !isNaN(g) && g > 0)
      .sort((a, b) => a - b);

    if (gramajesParsed.length === 0) {
      mostrarToast("Debes especificar al menos un gramaje válido (ej. 135, 170)", "error");
      return;
    }

    formPapel.gramajes = gramajesParsed;
    formPapel.precioKg = Number(formPapel.precioKg) || 1.85;

    if (modoEdicionPapel) {
      actualizarPapel(formPapel);
      mostrarToast(`Papel "${formPapel.nombre}" actualizado`, "exito");
    } else {
      if (!formPapel.id) {
        formPapel.id = formPapel.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      }
      agregarPapel(formPapel);
      mostrarToast(`Nuevo papel "${formPapel.nombre}" añadido al catálogo`, "exito");
    }
    modalPapelAbierto = false;
  }

  function handleEliminarPapel(id: string, nombre: string) {
    if (confirm(`¿Eliminar el papel "${nombre}" del catálogo? Los cálculos que lo usen cambiarán al papel base por defecto.`)) {
      eliminarPapel(id);
      mostrarToast(`Papel "${nombre}" eliminado`, "info");
    }
  }

  // Filtrado reactivo de papeles
  let papelesFiltrados = $derived(
    ($escandalloConfig?.papeles || []).filter(p => {
      if (!busquedaPapel.trim()) return true;
      const b = busquedaPapel.toLowerCase();
      return p.nombre.toLowerCase().includes(b) || 
             p.densidadAparente.toLowerCase().includes(b) ||
             (p.tamanoPliegoEstandar && p.tamanoPliegoEstandar.toLowerCase().includes(b)) ||
             p.gramajes.some(g => g.toString().includes(b));
    })
  );

  // =========================================================================
  // 2. GESTIÓN DE ACABADOS (Modales y Estado)
  // =========================================================================
  let modalAcabadoAbierto = $state(false);
  let modoEdicionAcabado = $state(false);
  let formAcabado = $state<AcabadoItemConfig>({
    id: "",
    nombre: "",
    categoria: "manipulado",
    tipoCobro: "unidad",
    tarifaFijaArranque: 15.0,
    precioUnitario: 0.02
  });

  function abrirModalNuevoAcabado() {
    modoEdicionAcabado = false;
    const idSugerido = "acabado-" + Date.now().toString(36);
    formAcabado = {
      id: idSugerido,
      nombre: "",
      categoria: "manipulado",
      tipoCobro: "unidad",
      tarifaFijaArranque: 15.0,
      precioUnitario: 0.025
    };
    modalAcabadoAbierto = true;
  }

  function abrirModalEditarAcabado(acabado: AcabadoItemConfig) {
    modoEdicionAcabado = true;
    formAcabado = { ...acabado };
    modalAcabadoAbierto = true;
  }

  function guardarFormAcabado() {
    if (!formAcabado.nombre.trim()) {
      mostrarToast("El nombre del acabado es obligatorio", "error");
      return;
    }
    formAcabado.tarifaFijaArranque = Number(formAcabado.tarifaFijaArranque) || 0;
    formAcabado.precioUnitario = Number(formAcabado.precioUnitario) || 0;

    if (modoEdicionAcabado) {
      actualizarAcabado(formAcabado.id, formAcabado);
      mostrarToast(`Acabado "${formAcabado.nombre}" actualizado`, "exito");
    } else {
      if (!formAcabado.id) {
        formAcabado.id = formAcabado.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      }
      agregarAcabado(formAcabado);
      mostrarToast(`Nuevo acabado "${formAcabado.nombre}" añadido`, "exito");
    }
    modalAcabadoAbierto = false;
  }

  function handleEliminarAcabado(id: string, nombre: string) {
    if (confirm(`¿Eliminar el proceso/acabado "${nombre}" del catálogo?`)) {
      eliminarAcabado(id);
      mostrarToast(`Acabado "${nombre}" eliminado`, "info");
    }
  }

  // Lista de acabados filtrados
  let acabadosArray = $derived(Object.values($escandalloConfig?.acabados || {}));
  let acabadosFiltrados = $derived(
    acabadosArray.filter(ac => {
      if (filtroCategoriaAcabado !== "todos" && ac.categoria !== filtroCategoriaAcabado) {
        return false;
      }
      if (busquedaAcabado.trim()) {
        const b = busquedaAcabado.toLowerCase();
        return ac.nombre.toLowerCase().includes(b);
      }
      return true;
    })
  );

  // =========================================================================
  // 3. GESTIÓN DE MAQUINARIA (Modales y Estado)
  // =========================================================================
  let modalMaquinaAbierto = $state(false);
  let modoEdicionMaquina = $state(false);
  let formMaquina = $state<MaquinaItemConfig>({
    id: "",
    nombre: "",
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
    costeClicColorPliego: 0.05,
    costeClicBnPliego: 0.012,
    maxGramaje: 360,
    minGramaje: 52
  });

  function abrirModalNuevaMaquina() {
    modoEdicionMaquina = false;
    formMaquina = {
      id: "maquina-" + Date.now().toString(36),
      nombre: "",
      tecnologia: "digital",
      pliegoAncho: 488,
      pliegoAlto: 330,
      pinzaMm: 4,
      margenLateralMm: 4,
      tiraControlMm: 0,
      costeHora: 60.0,
      costePlancha: 0.0,
      tiempoArregloMinutos: 5,
      velocidadPliegosHora: 5000,
      mermaArranquePliegosPorColor: 5,
      mermaTiradaPorcentaje: 1.5,
      costeClicColorPliego: 0.05,
      costeClicBnPliego: 0.012,
      maxGramaje: 400,
      minGramaje: 60
    };
    modalMaquinaAbierto = true;
  }

  function abrirModalEditarMaquina(maq: MaquinaItemConfig) {
    modoEdicionMaquina = true;
    formMaquina = { ...maq };
    modalMaquinaAbierto = true;
  }

  function guardarFormMaquina() {
    if (!formMaquina.nombre.trim()) {
      mostrarToast("El nombre de la máquina es obligatorio", "error");
      return;
    }
    formMaquina.costeHora = Number(formMaquina.costeHora) || 50;
    formMaquina.costePlancha = Number(formMaquina.costePlancha) || 0;
    formMaquina.costeClicColorPliego = Number(formMaquina.costeClicColorPliego) || 0;
    formMaquina.costeClicBnPliego = Number(formMaquina.costeClicBnPliego) || 0;
    formMaquina.velocidadPliegosHora = Number(formMaquina.velocidadPliegosHora) || 4000;
    formMaquina.tiempoArregloMinutos = Number(formMaquina.tiempoArregloMinutos) || 5;

    if (modoEdicionMaquina) {
      actualizarMaquina(formMaquina);
      mostrarToast(`Máquina "${formMaquina.nombre}" actualizada`, "exito");
    } else {
      if (!formMaquina.id) {
        formMaquina.id = formMaquina.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      }
      agregarMaquina(formMaquina);
      mostrarToast(`Nueva máquina "${formMaquina.nombre}" incorporada`, "exito");
    }
    modalMaquinaAbierto = false;
  }

  function handleEliminarMaquina(id: string, nombre: string) {
    if (($escandalloConfig?.maquinas || []).length <= 1) {
      mostrarToast("Debes conservar al menos una máquina en el parque de producción.", "error");
      return;
    }
    if (confirm(`¿Eliminar la máquina "${nombre}" del parque de impresión?`)) {
      eliminarMaquina(id);
      mostrarToast(`Máquina "${nombre}" eliminada`, "info");
    }
  }

  let maquinasFiltradas = $derived(
    ($escandalloConfig?.maquinas || []).filter(m => {
      if (filtroTecnologiaMaquina !== "todas" && m.tecnologia !== filtroTecnologiaMaquina) {
        return false;
      }
      return true;
    })
  );

  // =========================================================================
  // 4. GESTIÓN DE COSTES DE TALLER & MÁRGENES
  // =========================================================================
  function actualizarCampoTaller(campo: keyof CostesTallerConfig, valor: number) {
    actualizarCostesTaller({ [campo]: Number(valor) });
  }

  // =========================================================================
  // 5. GESTIÓN DE PRESETS DE PRODUCTOS
  // =========================================================================
  let modalPresetAbierto = $state(false);
  let modoEdicionPreset = $state(false);
  let formPreset = $state<ProductoPresetConfig>({
    id: "",
    nombre: "",
    categoria: "comercial",
    ancho: 148,
    alto: 210,
    sangre: 2,
    tipo: "flyer",
    gramajesSugeridos: [135, 170],
    acabadosCompatibles: []
  });
  let gramajesPresetInputStr = $state("135, 170");

  function abrirModalNuevoPreset() {
    modoEdicionPreset = false;
    formPreset = {
      id: "preset-" + Date.now().toString(36),
      nombre: "",
      categoria: "comercial",
      ancho: 148,
      alto: 210,
      sangre: 2,
      tipo: "flyer",
      gramajesSugeridos: [135, 170],
      acabadosCompatibles: []
    };
    gramajesPresetInputStr = "135, 170";
    modalPresetAbierto = true;
  }

  function abrirModalEditarPreset(preset: ProductoPresetConfig) {
    modoEdicionPreset = true;
    formPreset = { ...preset };
    gramajesPresetInputStr = (preset.gramajesSugeridos || []).join(", ");
    modalPresetAbierto = true;
  }

  function guardarFormPreset() {
    if (!formPreset.nombre.trim()) {
      mostrarToast("El nombre del preset es obligatorio", "error");
      return;
    }
    const gramajesParsed = gramajesPresetInputStr
      .split(",")
      .map(g => parseInt(g.trim()))
      .filter(g => !isNaN(g) && g > 0);

    formPreset.gramajesSugeridos = gramajesParsed.length > 0 ? gramajesParsed : [135, 170];

    if (modoEdicionPreset) {
      actualizarPreset(formPreset);
      mostrarToast(`Preset "${formPreset.nombre}" actualizado`, "exito");
    } else {
      if (!formPreset.id) {
        formPreset.id = formPreset.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      }
      agregarPreset(formPreset);
      mostrarToast(`Nuevo formato preset "${formPreset.nombre}" añadido`, "exito");
    }
    modalPresetAbierto = false;
  }

  function handleEliminarPreset(id: string, nombre: string) {
    if (confirm(`¿Eliminar el preset de producto "${nombre}"?`)) {
      eliminarPreset(id);
      mostrarToast(`Preset "${nombre}" eliminado`, "info");
    }
  }

</script>

<div class="w-full text-foreground flex flex-col font-sans pb-16">

  <!-- TOAST DE NOTIFICACIÓN -->
  {#if mensajeToast}
    <div class="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-in fade-in slide-in-from-top-3 {mensajeToast.tipo === 'exito' ? 'bg-emerald-600/90 text-white border-emerald-500' : mensajeToast.tipo === 'error' ? 'bg-rose-600/90 text-white border-rose-500' : 'bg-primary/95 text-primary-foreground border-border'}">
      {#if mensajeToast.tipo === 'exito'}
        <CheckCircle2 class="w-5 h-5 text-white flex-shrink-0" />
      {:else if mensajeToast.tipo === 'error'}
        <AlertTriangle class="w-5 h-5 text-white flex-shrink-0" />
      {:else}
        <Sparkles class="w-5 h-5 text-white flex-shrink-0" />
      {/if}
      <span class="text-xs font-medium">{mensajeToast.texto}</span>
      <button onclick={() => mensajeToast = null} class="text-white/80 hover:text-white ml-2">
        <X class="w-4 h-4" />
      </button>
    </div>
  {/if}

  <!-- INPUT OCULTO DE IMPORTACIÓN -->
  <input 
    type="file" 
    accept=".json" 
    class="hidden" 
    bind:this={fileInputRef} 
    onchange={handleImportarArchivo} 
  />

  <!-- CABECERA PRINCIPAL CON NAVEGACIÓN Y ACCIONES -->
  <div class="border-b border-border/60 pb-5">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      
      <!-- Título y subtítulo -->
      <div>
        <div class="flex items-center gap-2 mb-1">
          <a
            href={`/w/${workspace}/escandallo`}
            class="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors mr-2 no-underline"
          >
            <ArrowLeft class="w-3.5 h-3.5" />
            <span>Volver a Escandallo</span>
          </a>
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            Tarifario MIS
          </span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Sliders class="w-7 h-7 text-amber-500" />
          <span>Tarifario & Parámetros Técnicos</span>
        </h1>
        <p class="text-xs sm:text-sm text-muted-foreground mt-1">
          Ajusta precios de compra de papel (€/kg), tiempos de tirada, clichés de stamping, hendidos y tarifas horarias para presupuestos reales.
        </p>
      </div>

      <!-- Barra de acciones -->
      <div class="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
        
        <!-- Enlace al Calculador -->
        <a 
          href={`/w/${workspace}/escandallo`}
          class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-muted/60 hover:bg-muted text-foreground border border-border transition-all"
          title="Abrir el calculador de escandallo para probar las tarifas"
        >
          <Calculator class="w-4 h-4 text-primary" />
          <span>Calculador & Poses</span>
          <ArrowRight class="w-3.5 h-3.5 opacity-60" />
        </a>

        <!-- Exportar JSON -->
        <button
          onclick={exportarTarifasAJson}
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-background hover:bg-accent border border-border text-foreground transition-all"
          title="Descargar copia de seguridad de las tarifas en formato JSON"
        >
          <Download class="w-3.5 h-3.5 text-muted-foreground" />
          <span>Exportar</span>
        </button>

        <!-- Importar JSON -->
        <button
          onclick={() => fileInputRef?.click()}
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-background hover:bg-accent border border-border text-foreground transition-all"
          title="Cargar tarifas previamente exportadas desde un archivo JSON"
        >
          <Upload class="w-3.5 h-3.5 text-muted-foreground" />
          <span>Importar</span>
        </button>

        <!-- Restablecer Fábrica -->
        <button
          onclick={() => modalConfirmarReset = true}
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
          title="Restablecer los valores estándar del sector"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>Fábrica</span>
        </button>

        <!-- Guardar Cambios en Servidor -->
        <button
          onclick={handleGuardar}
          disabled={$guardandoConfig}
          class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50"
        >
          {#if $guardandoConfig}
            <div class="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
            <span>Guardando...</span>
          {:else}
            <Save class="w-4 h-4" />
            <span>Guardar Cambios</span>
          {/if}
        </button>

      </div>
    </div>

    <!-- PESTAÑAS DE NAVEGACIÓN SECUNDARIAS -->
    <div class="max-w-7xl mx-auto mt-4 pt-2 border-t border-border flex items-center justify-between overflow-x-auto gap-2">
      <div class="flex items-center gap-1.5 py-1">
        
        <button
          onclick={() => pestanaActiva = "papeles"}
          class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all {pestanaActiva === 'papeles' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
        >
          <FileText class="w-4 h-4" />
          <span>1. Papeles & Soportes</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full {pestanaActiva === 'papeles' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}">
            {$escandalloConfig?.papeles?.length || 0}
          </span>
        </button>

        <button
          onclick={() => pestanaActiva = "acabados"}
          class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all {pestanaActiva === 'acabados' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
        >
          <Palette class="w-4 h-4" />
          <span>2. Acabados & Procesos</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full {pestanaActiva === 'acabados' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}">
            {Object.keys($escandalloConfig?.acabados || {}).length}
          </span>
        </button>

        <button
          onclick={() => pestanaActiva = "maquinas"}
          class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all {pestanaActiva === 'maquinas' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
        >
          <Printer class="w-4 h-4" />
          <span>3. Parque de Maquinaria</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full {pestanaActiva === 'maquinas' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}">
            {$escandalloConfig?.maquinas?.length || 0}
          </span>
        </button>

        <button
          onclick={() => pestanaActiva = "taller"}
          class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all {pestanaActiva === 'taller' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
        >
          <Zap class="w-4 h-4" />
          <span>4. Costes de Taller & Márgenes</span>
        </button>

        <button
          onclick={() => pestanaActiva = "presets"}
          class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all {pestanaActiva === 'presets' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
        >
          <Package class="w-4 h-4" />
          <span>5. Presets de Productos</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full {pestanaActiva === 'presets' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}">
            {$escandalloConfig?.presets?.length || 0}
          </span>
        </button>

      </div>

      <!-- Estado de sincronización -->
      <div class="hidden lg:flex items-center gap-2 text-[11px] text-muted-foreground px-3">
        {#if $estadoSincronizacion === 'guardado'}
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Tarifas sincronizadas</span>
        {:else if $estadoSincronizacion === 'modificado'}
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          <span class="text-amber-600 dark:text-amber-400 font-medium">Hay cambios sin guardar</span>
        {:else if $estadoSincronizacion === 'cargando'}
          <span class="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
          <span>Sincronizando...</span>
        {:else}
          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Modo local</span>
        {/if}
      </div>
    </div>
  </div>

  <!-- CONTENIDO PRINCIPAL SEGÚN PESTAÑA ACTIVA -->
  <div class="w-full mt-4 flex-1">

    <!-- =================================================================== -->
    <!-- 1. PESTAÑA PAPELES & MATERIAS PRIMAS -->
    <!-- =================================================================== -->
    {#if pestanaActiva === "papeles"}
      <div class="space-y-6 animate-in fade-in duration-200">
        
        <!-- Barra de herramientas de papeles -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div class="relative flex-1 max-w-md">
            <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, gramajes, formato..."
              bind:value={busquedaPapel}
              class="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          <div class="flex items-center gap-2">
            <button
              onclick={abrirModalNuevoPapel}
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
            >
              <Plus class="w-4 h-4" />
              <span>Añadir Nuevo Papel</span>
            </button>
          </div>
        </div>

        <!-- Lista en cuadrícula de papeles -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each papelesFiltrados as papel (papel.id)}
            <div class="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover:border-primary/40 hover:shadow-md transition-all group">
              <div>
                
                <!-- Encabezado de la tarjeta -->
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 class="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                      {papel.nombre}
                    </h3>
                    <p class="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {papel.densidadAparente || "Sin descripción de mano"}
                    </p>
                  </div>
                  
                  <!-- Precio por Kg destacado -->
                  <div class="text-right flex-shrink-0">
                    <span class="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {papel.precioKg.toFixed(2)} €/kg
                    </span>
                  </div>
                </div>

                <!-- Formato de pliego y propiedades -->
                <div class="flex items-center gap-2 text-[11px] text-muted-foreground mb-4">
                  <span class="px-2 py-0.5 rounded-md bg-muted font-medium">
                    Pliego: {papel.tamanoPliegoEstandar || "70x100 cm"}
                  </span>
                  <span>·</span>
                  <span>{papel.gramajes.length} gramajes disponibles</span>
                </div>

                <!-- Gramajes como tags interactivos -->
                <div class="space-y-1.5 mb-4">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gramajes Soportados:</span>
                  <div class="flex flex-wrap gap-1.5">
                    {#each papel.gramajes as g}
                      <span class="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-accent text-accent-foreground border border-border">
                        {g}g
                      </span>
                    {/each}
                  </div>
                </div>

              </div>

              <!-- Acciones de tarjeta -->
              <div class="pt-4 border-t border-border/60 flex items-center justify-between">
                <span class="text-[10px] text-muted-foreground font-mono">ID: {papel.id}</span>
                <div class="flex items-center gap-1.5">
                  <button
                    onclick={() => abrirModalEditarPapel(papel)}
                    class="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Editar precio, gramajes y datos del papel"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    onclick={() => handleEliminarPapel(papel.id, papel.nombre)}
                    class="p-2 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                    title="Eliminar papel del catálogo"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          {/each}
        </div>

        {#if papelesFiltrados.length === 0}
          <div class="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
            <FileText class="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p class="text-sm font-medium">No se encontraron papeles que coincidan con la búsqueda</p>
            <p class="text-xs text-muted-foreground/80 mt-1">Prueba otro término o añade un nuevo papel.</p>
          </div>
        {/if}

      </div>
    {/if}

    <!-- =================================================================== -->
    <!-- 2. PESTAÑA ACABADOS, BARNICES, STAMPING & ENCUADERNACIONES -->
    <!-- =================================================================== -->
    {#if pestanaActiva === "acabados"}
      <div class="space-y-6 animate-in fade-in duration-200">
        
        <!-- Filtros y buscador de acabados -->
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
          
          <!-- Filtros de categoría -->
          <div class="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            {#each [
              { id: 'todos', label: 'Todos' },
              { id: 'plastificado', label: 'Plastificados' },
              { id: 'barniz', label: 'Barnices UV' },
              { id: 'stamping', label: 'Stamping & Foil' },
              { id: 'manipulado', label: 'Manipulado & Plegado' },
              { id: 'encuadernacion', label: 'Encuadernación' }
            ] as cat}
              <button
                onclick={() => filtroCategoriaAcabado = cat.id}
                class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all {filtroCategoriaAcabado === cat.id ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 hover:bg-muted text-muted-foreground'}"
              >
                {cat.label}
              </button>
            {/each}
          </div>

          <div class="flex items-center gap-2">
            <div class="relative flex-1 sm:w-60">
              <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar acabado..."
                bind:value={busquedaAcabado}
                class="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>

            <button
              onclick={abrirModalNuevoAcabado}
              class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs flex-shrink-0"
            >
              <Plus class="w-4 h-4" />
              <span>Añadir Acabado</span>
            </button>
          </div>
        </div>

        <!-- Tabla moderna de acabados -->
        <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th class="py-3 px-4">Proceso / Acabado</th>
                  <th class="py-3 px-4">Categoría</th>
                  <th class="py-3 px-4">Tipo de Cobro</th>
                  <th class="py-3 px-4 text-right">Tarifa Arranque / Cliché (€)</th>
                  <th class="py-3 px-4 text-right">Precio Variable Unitario (€)</th>
                  <th class="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/60">
                {#each acabadosFiltrados as ac (ac.id)}
                  <tr class="hover:bg-accent/40 transition-colors group">
                    
                    <!-- Nombre del acabado -->
                    <td class="py-3.5 px-4 font-semibold text-foreground">
                      <div class="flex items-center gap-2.5">
                        <div class="w-2 h-2 rounded-full {ac.categoria === 'stamping' ? 'bg-amber-500' : ac.categoria === 'barniz' ? 'bg-purple-500' : ac.categoria === 'plastificado' ? 'bg-blue-500' : ac.categoria === 'encuadernacion' ? 'bg-rose-500' : 'bg-emerald-500'}"></div>
                        <span>{ac.nombre}</span>
                      </div>
                      <span class="text-[10px] font-mono text-muted-foreground ml-4.5 block mt-0.5">{ac.id}</span>
                    </td>

                    <!-- Categoría -->
                    <td class="py-3.5 px-4">
                      <span class="text-[10px] font-semibold px-2 py-0.5 rounded-lg uppercase tracking-wider {ac.categoria === 'stamping' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : ac.categoria === 'barniz' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : ac.categoria === 'plastificado' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : ac.categoria === 'encuadernacion' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}">
                        {ac.categoria}
                      </span>
                    </td>

                    <!-- Método de cobro -->
                    <td class="py-3.5 px-4 text-muted-foreground">
                      {#if ac.tipoCobro === 'pliego'}
                        <span class="font-medium text-foreground">Por Pliego Impreso</span>
                      {:else if ac.tipoCobro === 'unidad'}
                        <span class="font-medium text-foreground">Por Ejemplar / Unidad</span>
                      {:else if ac.tipoCobro === 'm2'}
                        <span class="font-medium text-foreground">Por Metro Cuadrado (m²)</span>
                      {:else}
                        <span class="font-medium text-foreground">Tarifa Fija Cerrada</span>
                      {/if}
                    </td>

                    <!-- Tarifa Fija Arranque -->
                    <td class="py-3.5 px-4 text-right">
                      <div class="inline-flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          bind:value={ac.tarifaFijaArranque}
                          onchange={() => actualizarAcabado(ac.id, ac)}
                          class="w-20 text-right bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                        />
                        <span class="text-muted-foreground">€</span>
                      </div>
                    </td>

                    <!-- Precio Unitario -->
                    <td class="py-3.5 px-4 text-right">
                      <div class="inline-flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          bind:value={ac.precioUnitario}
                          onchange={() => actualizarAcabado(ac.id, ac)}
                          class="w-24 text-right bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold focus:ring-1 focus:ring-primary outline-none"
                        />
                        <span class="text-muted-foreground">€/{ac.tipoCobro === 'pliego' ? 'plieg.' : ac.tipoCobro === 'unidad' ? 'ud.' : 'm²'}</span>
                      </div>
                    </td>

                    <!-- Acciones -->
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          onclick={() => abrirModalEditarAcabado(ac)}
                          class="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar acabado"
                        >
                          <Edit3 class="w-3.5 h-3.5" />
                        </button>
                        <button
                          onclick={() => handleEliminarAcabado(ac.id, ac.nombre)}
                          class="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                          title="Eliminar acabado"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
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
    {/if}

    <!-- =================================================================== -->
    <!-- 3. PESTAÑA PARQUE DE MAQUINARIA -->
    <!-- =================================================================== -->
    {#if pestanaActiva === "maquinas"}
      <div class="space-y-6 animate-in fade-in duration-200">
        
        <!-- Barra de herramientas de maquinaria -->
        <div class="flex items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div class="flex items-center gap-1.5">
            <button
              onclick={() => filtroTecnologiaMaquina = "todas"}
              class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all {filtroTecnologiaMaquina === 'todas' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground'}"
            >
              Todas ({$escandalloConfig?.maquinas?.length || 0})
            </button>
            <button
              onclick={() => filtroTecnologiaMaquina = "digital"}
              class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all {filtroTecnologiaMaquina === 'digital' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-muted/60 text-muted-foreground'}"
            >
              Prensas Digitales ({($escandalloConfig?.maquinas || []).filter(m => m.tecnologia === 'digital').length})
            </button>
            <button
              onclick={() => filtroTecnologiaMaquina = "offset"}
              class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all {filtroTecnologiaMaquina === 'offset' ? 'bg-purple-600 text-white shadow-xs' : 'bg-muted/60 text-muted-foreground'}"
            >
              Prensas Offset ({($escandalloConfig?.maquinas || []).filter(m => m.tecnologia === 'offset').length})
            </button>
          </div>

          <button
            onclick={abrirModalNuevaMaquina}
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus class="w-4 h-4" />
            <span>Añadir Máquina</span>
          </button>
        </div>

        <!-- Tarjetas de máquinas -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {#each maquinasFiltradas as maq (maq.id)}
            <div class="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between">
              
              <div>
                <!-- Cabecera de la máquina -->
                <div class="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest {maq.tecnologia === 'digital' ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20' : 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'}">
                        {maq.tecnologia.toUpperCase()}
                      </span>
                      <h3 class="font-bold text-sm text-foreground">{maq.nombre}</h3>
                    </div>
                    <span class="text-[11px] text-muted-foreground">
                      Pliego máx: <strong class="text-foreground">{maq.pliegoAncho} x {maq.pliegoAlto} mm</strong> (Pinza: {maq.pinzaMm}mm)
                    </span>
                  </div>

                  <!-- Coste Hora de la Máquina -->
                  <div class="text-right">
                    <span class="text-xs font-bold px-2.5 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      {maq.costeHora.toFixed(2)} €/hora
                    </span>
                  </div>
                </div>

                <!-- Métricas Técnicas y Económicas -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-y border-border/60 text-xs mb-4">
                  
                  <div class="bg-muted/40 p-2.5 rounded-xl">
                    <span class="text-[10px] text-muted-foreground block">Velocidad:</span>
                    <strong class="text-foreground">{maq.velocidadPliegosHora.toLocaleString()}</strong> <span class="text-[10px] text-muted-foreground">pl/h</span>
                  </div>

                  <div class="bg-muted/40 p-2.5 rounded-xl">
                    <span class="text-[10px] text-muted-foreground block">Puesta a punto:</span>
                    <strong class="text-foreground">{maq.tiempoArregloMinutos}</strong> <span class="text-[10px] text-muted-foreground">min</span>
                  </div>

                  {#if maq.tecnologia === 'digital'}
                    <div class="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
                      <span class="text-[10px] text-cyan-700 dark:text-cyan-300 block">Clic Color:</span>
                      <strong class="text-cyan-600 dark:text-cyan-400">{maq.costeClicColorPliego.toFixed(3)}</strong> <span class="text-[10px] text-muted-foreground">€/pl</span>
                    </div>

                    <div class="bg-muted/40 p-2.5 rounded-xl">
                      <span class="text-[10px] text-muted-foreground block">Clic B/N:</span>
                      <strong class="text-foreground">{maq.costeClicBnPliego.toFixed(3)}</strong> <span class="text-[10px] text-muted-foreground">€/pl</span>
                    </div>
                  {:else}
                    <div class="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
                      <span class="text-[10px] text-purple-700 dark:text-purple-300 block">Coste Plancha CTP:</span>
                      <strong class="text-purple-600 dark:text-purple-400">{maq.costePlancha.toFixed(2)}</strong> <span class="text-[10px] text-muted-foreground">€/plancha</span>
                    </div>

                    <div class="bg-muted/40 p-2.5 rounded-xl">
                      <span class="text-[10px] text-muted-foreground block">Merma arranque:</span>
                      <strong class="text-foreground">{maq.mermaArranquePliegosPorColor}</strong> <span class="text-[10px] text-muted-foreground">pl/color</span>
                    </div>
                  {/if}

                </div>

                <!-- Gramajes soportados y mermas -->
                <div class="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
                  <span>Gramajes: {maq.minGramaje}g - {maq.maxGramaje}g</span>
                  <span>Merma de tirada: {maq.mermaTiradaPorcentaje}%</span>
                </div>

              </div>

              <!-- Acciones de Máquina -->
              <div class="pt-3 border-t border-border/60 flex items-center justify-between">
                <span class="text-[10px] font-mono text-muted-foreground">ID: {maq.id}</span>
                <div class="flex items-center gap-1.5">
                  <button
                    onclick={() => abrirModalEditarMaquina(maq)}
                    class="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Editar parámetros de la máquina"
                  >
                    <Edit3 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    onclick={() => handleEliminarMaquina(maq.id, maq.nombre)}
                    class="p-2 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                    title="Eliminar máquina"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          {/each}
        </div>

      </div>
    {/if}

    <!-- =================================================================== -->
    <!-- 4. PESTAÑA COSTES DE TALLER & MÁRGENES DE EMPRESA -->
    <!-- =================================================================== -->
    {#if pestanaActiva === "taller"}
      <div class="max-w-4xl space-y-6 animate-in fade-in duration-200">
        
        <div class="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 class="text-base font-bold text-foreground flex items-center gap-2">
              <Scissors class="w-5 h-5 text-primary" />
              <span>1. Guillotina y Corte Mecánico</span>
            </h3>
            <p class="text-xs text-muted-foreground mt-1">
              Costes de preparación de escuadra y despiece de pliegos grandes a poses terminadas.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground">Puesta a punto guillotina fija (€):</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={$escandalloConfig?.costesTaller?.costeGuillotinaFijo ?? 0}
                onchange={(e) => actualizarCampoTaller("costeGuillotinaFijo", parseFloat(e.currentTarget.value))}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <span class="text-[10px] text-muted-foreground">Setup base por trabajo (programación, pruebas de corte).</span>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground">Coste por golpe de taco (€):</label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={$escandalloConfig?.costesTaller?.costeGuillotinaPorGolpeTaco ?? 0}
                onchange={(e) => actualizarCampoTaller("costeGuillotinaPorGolpeTaco", parseFloat(e.currentTarget.value))}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <span class="text-[10px] text-muted-foreground">Coste de cada corte por cada bloque de 500 hojas.</span>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 class="text-base font-bold text-foreground flex items-center gap-2">
              <Palette class="w-5 h-5 text-amber-500" />
              <span>2. Tintas Especiales & Pantones Directos</span>
            </h3>
            <p class="text-xs text-muted-foreground mt-1">
              Gastos de lavado de tinteros, disolventes y tintas metalizadas o directas.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground">Lavado tintero Offset (€/cuerpo):</label>
              <input
                type="number"
                step="1"
                min="0"
                value={$escandalloConfig?.costesTaller?.costeLavadoTinteroPantone ?? 0}
                onchange={(e) => actualizarCampoTaller("costeLavadoTinteroPantone", parseFloat(e.currentTarget.value))}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <span class="text-[10px] text-muted-foreground">Limpieza mecánica y disolventes de rodillos.</span>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground">Tinta Pantone Offset (€/pliego):</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={$escandalloConfig?.costesTaller?.costeTintaPantoneOffsetPliego ?? 0}
                onchange={(e) => actualizarCampoTaller("costeTintaPantoneOffsetPliego", parseFloat(e.currentTarget.value))}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <span class="text-[10px] text-muted-foreground">Consumo de tinta directa por pliego.</span>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground">Tinta Pantone Digital (€/pliego):</label>
              <input
                type="number"
                step="0.005"
                min="0"
                value={$escandalloConfig?.costesTaller?.costeTintaPantoneDigitalPliego ?? 0}
                onchange={(e) => actualizarCampoTaller("costeTintaPantoneDigitalPliego", parseFloat(e.currentTarget.value))}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <span class="text-[10px] text-muted-foreground">5ª estación tóner oro/plata/blanco.</span>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 class="text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen class="w-5 h-5 text-purple-500" />
              <span>3. Libros Tapa Dura, Cartoné & Agendas</span>
            </h3>
            <p class="text-xs text-muted-foreground mt-1">
              Precio del cartón gris compacto y densidad para cálculo de cubiertas rígidas contracoladas.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground">Precio Cartón Compacto (€/kg):</label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={$escandalloConfig?.costesTaller?.precioKgCartonCompacto ?? 0}
                onchange={(e) => actualizarCampoTaller("precioKgCartonCompacto", parseFloat(e.currentTarget.value))}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <span class="text-[10px] text-muted-foreground">Cartón contracolado de 1.5 a 3.0 mm de espesor.</span>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground">Densidad cartón (kg/m² por mm):</label>
              <input
                type="number"
                step="0.05"
                min="0"
                value={$escandalloConfig?.costesTaller?.densidadCartonCompacto ?? 0}
                onchange={(e) => actualizarCampoTaller("densidadCartonCompacto", parseFloat(e.currentTarget.value))}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <span class="text-[10px] text-muted-foreground">Normalmente ~0.75 kg por m² por cada milímetro.</span>
            </div>
          </div>
        </div>

        <div class="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 class="text-base font-bold text-foreground flex items-center gap-2">
              <Percent class="w-5 h-5 text-emerald-500" />
              <span>4. Márgenes Comerciales & Gastos Generales por Defecto</span>
            </h3>
            <p class="text-xs text-muted-foreground mt-1">
              Porcentajes predeterminados aplicados automáticamente al abrir un nuevo trabajo en el escandallo.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground">Gastos Generales / Estructura por defecto (%):</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={$escandalloConfig?.costesTaller?.gastosGeneralesPorcentajeDefecto ?? 0}
                onchange={(e) => actualizarCampoTaller("gastosGeneralesPorcentajeDefecto", parseFloat(e.currentTarget.value))}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <span class="text-[10px] text-muted-foreground">Amortizaciones, naves, electricidad y administración (ej. 12%).</span>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-foreground">Margen de Beneficio Objetivo por defecto (%):</label>
              <input
                type="number"
                step="1"
                min="0"
                max="300"
                value={$escandalloConfig?.costesTaller?.margenBeneficioPorcentajeDefecto ?? 0}
                onchange={(e) => actualizarCampoTaller("margenBeneficioPorcentajeDefecto", parseFloat(e.currentTarget.value))}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <span class="text-[10px] text-muted-foreground">Margen comercial de venta sugerido (ej. 35%).</span>
            </div>
          </div>
        </div>

      </div>
    {/if}

    <!-- =================================================================== -->
    <!-- 5. PESTAÑA PRESETS DE PRODUCTOS -->
    <!-- =================================================================== -->
    {#if pestanaActiva === "presets"}
      <div class="space-y-6 animate-in fade-in duration-200">
        
        <div class="flex items-center justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div>
            <h3 class="font-bold text-sm text-foreground">Catálogo de Productos y Formatos Preset</h3>
            <p class="text-xs text-muted-foreground">Plantillas preconfiguradas con sus medidas, sangres y tipos de plegado o encuadernación.</p>
          </div>

          <button
            onclick={abrirModalNuevoPreset}
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus class="w-4 h-4" />
            <span>Añadir Preset</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each ($escandalloConfig?.presets || []) as preset (preset.id)}
            <div class="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-2 mb-2">
                  <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-widest">
                    {preset.categoria}
                  </span>
                  <span class="text-[10px] text-muted-foreground font-mono">ID: {preset.id}</span>
                </div>

                <h4 class="font-bold text-sm text-foreground mb-1">{preset.nombre}</h4>
                <p class="text-xs text-muted-foreground mb-3">
                  Dimensiones: <strong class="text-foreground">{preset.ancho} x {preset.alto} mm</strong> (+{preset.sangre}mm sangre)
                </p>

                <div class="space-y-1 mb-4">
                  <span class="text-[10px] text-muted-foreground font-bold uppercase">Gramajes sugeridos:</span>
                  <div class="flex flex-wrap gap-1">
                    {#each preset.gramajesSugeridos as g}
                      <span class="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {g}g
                      </span>
                    {/each}
                  </div>
                </div>
              </div>

              <div class="pt-3 border-t border-border flex items-center justify-end gap-1.5">
                <button
                  onclick={() => abrirModalEditarPreset(preset)}
                  class="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  title="Editar preset"
                >
                  <Edit3 class="w-3.5 h-3.5" />
                </button>
                <button
                  onclick={() => handleEliminarPreset(preset.id, preset.nombre)}
                  class="p-2 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                  title="Eliminar preset"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          {/each}
        </div>

      </div>
    {/if}

  </div>

  <!-- ===================================================================== -->
  <!-- MODAL: CREAR / EDITAR PAPEL -->
  <!-- ===================================================================== -->
  {#if modalPapelAbierto}
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h3 class="font-bold text-base text-foreground flex items-center gap-2">
            <FileText class="w-5 h-5 text-primary" />
            <span>{modoEdicionPapel ? 'Editar Papel' : 'Añadir Nuevo Papel'}</span>
          </h3>
          <button onclick={() => modalPapelAbierto = false} class="p-1 rounded-lg hover:bg-accent text-muted-foreground">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <div class="space-y-1.5">
            <label class="font-semibold text-foreground">Nombre Comercial del Papel *</label>
            <input
              type="text"
              placeholder="Ej: Verjurado Fedrigoni Blanco"
              bind:value={formPapel.nombre}
              class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Precio por Kilo (€/kg) *</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                bind:value={formPapel.precioKg}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Tamaño Pliego Estándar</label>
              <input
                type="text"
                placeholder="70x100 cm, 50x70 cm..."
                bind:value={formPapel.tamanoPliegoEstandar}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="font-semibold text-foreground">Gramajes Disponibles (separados por coma) *</label>
            <input
              type="text"
              placeholder="Ej: 90, 115, 135, 170, 250, 300"
              bind:value={gramajesInputStr}
              class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <span class="text-[10px] text-muted-foreground">Estos gramajes aparecerán en el desplegable de opciones del escandallo.</span>
          </div>

          <div class="space-y-1.5">
            <label class="font-semibold text-foreground">Descripción / Densidad Aparente / Mano</label>
            <textarea
              rows="2"
              placeholder="Ej: Acabado mate de textura sedosa, volumen 1.15..."
              bind:value={formPapel.densidadAparente}
              class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none resize-none"
            ></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            onclick={() => modalPapelAbierto = false}
            class="px-4 py-2 rounded-xl text-xs font-medium hover:bg-accent text-muted-foreground"
          >
            Cancelar
          </button>
          <button
            onclick={guardarFormPapel}
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            {modoEdicionPapel ? 'Guardar Cambios' : 'Crear Papel'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ===================================================================== -->
  <!-- MODAL: CREAR / EDITAR ACABADO -->
  <!-- ===================================================================== -->
  {#if modalAcabadoAbierto}
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h3 class="font-bold text-base text-foreground flex items-center gap-2">
            <Palette class="w-5 h-5 text-primary" />
            <span>{modoEdicionAcabado ? 'Editar Acabado / Proceso' : 'Añadir Nuevo Acabado'}</span>
          </h3>
          <button onclick={() => modalAcabadoAbierto = false} class="p-1 rounded-lg hover:bg-accent text-muted-foreground">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <div class="space-y-1.5">
            <label class="font-semibold text-foreground">Nombre del Acabado *</label>
            <input
              type="text"
              placeholder="Ej: Barniz Glitter Holográfico"
              bind:value={formAcabado.nombre}
              class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Categoría *</label>
              <select
                bind:value={formAcabado.categoria}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="plastificado">Plastificado / Laminado</option>
                <option value="barniz">Barniz UV</option>
                <option value="stamping">Stamping / Foil / Relieve</option>
                <option value="manipulado">Manipulado / Plegado</option>
                <option value="encuadernacion">Encuadernación</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Método de Cobro *</label>
              <select
                bind:value={formAcabado.tipoCobro}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="unidad">Por Ejemplar / Unidad</option>
                <option value="pliego">Por Pliego Impreso</option>
                <option value="m2">Por Metro Cuadrado (m²)</option>
                <option value="fijo">Tarifa Fija Cerrada</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Tarifa Fija Arranque (€)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                bind:value={formAcabado.tarifaFijaArranque}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <span class="text-[10px] text-muted-foreground">Puesta a punto, cliché, pantalla o setup base.</span>
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Precio Variable (€)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                bind:value={formAcabado.precioUnitario}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <span class="text-[10px] text-muted-foreground">Por cada {formAcabado.tipoCobro === 'pliego' ? 'pliego' : formAcabado.tipoCobro === 'unidad' ? 'unidad' : 'm²'}.</span>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            onclick={() => modalAcabadoAbierto = false}
            class="px-4 py-2 rounded-xl text-xs font-medium hover:bg-accent text-muted-foreground"
          >
            Cancelar
          </button>
          <button
            onclick={guardarFormAcabado}
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            {modoEdicionAcabado ? 'Guardar Cambios' : 'Crear Acabado'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ===================================================================== -->
  <!-- MODAL: CREAR / EDITAR MÁQUINA -->
  <!-- ===================================================================== -->
  {#if modalMaquinaAbierto}
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 my-8 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h3 class="font-bold text-base text-foreground flex items-center gap-2">
            <Printer class="w-5 h-5 text-primary" />
            <span>{modoEdicionMaquina ? 'Editar Máquina' : 'Añadir Nueva Prensa / Máquina'}</span>
          </h3>
          <button onclick={() => modalMaquinaAbierto = false} class="p-1 rounded-lg hover:bg-accent text-muted-foreground">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Nombre de la Máquina *</label>
              <input
                type="text"
                placeholder="Ej: Heidelberg Speedmaster XL 75"
                bind:value={formMaquina.nombre}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Tecnología de Impresión *</label>
              <select
                bind:value={formMaquina.tecnologia}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="digital">Digital (Tóner / Inyección continua)</option>
                <option value="offset">Offset tradicional (CTP / Planchas)</option>
              </select>
            </div>
          </div>

          <!-- Medidas de pliego y márgenes -->
          <div class="p-3 bg-muted/40 rounded-xl space-y-2 border border-border/60">
            <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dimensiones de Pliego Máximo:</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label class="text-[11px] text-muted-foreground">Ancho Pliego (mm):</label>
                <input
                  type="number"
                  bind:value={formMaquina.pliegoAncho}
                  class="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold"
                />
              </div>
              <div>
                <label class="text-[11px] text-muted-foreground">Alto Pliego (mm):</label>
                <input
                  type="number"
                  bind:value={formMaquina.pliegoAlto}
                  class="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold"
                />
              </div>
              <div>
                <label class="text-[11px] text-muted-foreground">Pinza (mm):</label>
                <input
                  type="number"
                  bind:value={formMaquina.pinzaMm}
                  class="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold"
                />
              </div>
              <div>
                <label class="text-[11px] text-muted-foreground">Margen Lateral (mm):</label>
                <input
                  type="number"
                  bind:value={formMaquina.margenLateralMm}
                  class="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          <!-- Coste hora, velocidad y puesta a punto -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Coste por Hora (€/h) *</label>
              <input
                type="number"
                step="1"
                bind:value={formMaquina.costeHora}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Velocidad (pliegos/hora) *</label>
              <input
                type="number"
                step="100"
                bind:value={formMaquina.velocidadPliegosHora}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Puesta a punto (minutos) *</label>
              <input
                type="number"
                step="1"
                bind:value={formMaquina.tiempoArregloMinutos}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          {#if formMaquina.tecnologia === 'digital'}
            <!-- Clics Digital -->
            <div class="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Tarifas de Clic Digital:</span>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-[11px] text-cyan-800 dark:text-cyan-200">Coste Clic Color Pliego (€):</label>
                  <input
                    type="number"
                    step="0.001"
                    bind:value={formMaquina.costeClicColorPliego}
                    class="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label class="text-[11px] text-cyan-800 dark:text-cyan-200">Coste Clic B/N Pliego (€):</label>
                  <input
                    type="number"
                    step="0.001"
                    bind:value={formMaquina.costeClicBnPliego}
                    class="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          {:else}
            <!-- Planchas Offset -->
            <div class="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2">
              <span class="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">Costes Offset CTP:</span>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-[11px] text-purple-800 dark:text-purple-200">Coste Plancha CTP (€):</label>
                  <input
                    type="number"
                    step="0.5"
                    bind:value={formMaquina.costePlancha}
                    class="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label class="text-[11px] text-purple-800 dark:text-purple-200">Merma arranque por color (pliegos):</label>
                  <input
                    type="number"
                    step="1"
                    bind:value={formMaquina.mermaArranquePliegosPorColor}
                    class="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          {/if}

          <!-- Gramajes y mermas -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="font-semibold text-foreground">Gramaje Mínimo (g):</label>
              <input
                type="number"
                bind:value={formMaquina.minGramaje}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
            <div>
              <label class="font-semibold text-foreground">Gramaje Máximo (g):</label>
              <input
                type="number"
                bind:value={formMaquina.maxGramaje}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
            <div>
              <label class="font-semibold text-foreground">Merma Tirada (%):</label>
              <input
                type="number"
                step="0.1"
                bind:value={formMaquina.mermaTiradaPorcentaje}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold"
              />
            </div>
          </div>

        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            onclick={() => modalMaquinaAbierto = false}
            class="px-4 py-2 rounded-xl text-xs font-medium hover:bg-accent text-muted-foreground"
          >
            Cancelar
          </button>
          <button
            onclick={guardarFormMaquina}
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            {modoEdicionMaquina ? 'Guardar Cambios' : 'Incorporar Máquina'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ===================================================================== -->
  <!-- MODAL: CREAR / EDITAR PRESET DE PRODUCTO -->
  <!-- ===================================================================== -->
  {#if modalPresetAbierto}
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h3 class="font-bold text-base text-foreground flex items-center gap-2">
            <Package class="w-5 h-5 text-primary" />
            <span>{modoEdicionPreset ? 'Editar Preset de Producto' : 'Añadir Nuevo Preset'}</span>
          </h3>
          <button onclick={() => modalPresetAbierto = false} class="p-1 rounded-lg hover:bg-accent text-muted-foreground">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-4 text-xs">
          <div class="space-y-1.5">
            <label class="font-semibold text-foreground">Nombre del Producto / Formato *</label>
            <input
              type="text"
              placeholder="Ej: Díptico Cuadrado 150x150 mm"
              bind:value={formPreset.nombre}
              class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Categoría *</label>
              <select
                bind:value={formPreset.categoria}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="comercial">Flyers & Hojas Planas</option>
                <option value="tarjetas">Tarjetas & Papelería</option>
                <option value="desplegable">Dípticos & Desplegables</option>
                <option value="publicacion">Libros, Revistas & Catálogos</option>
                <option value="calendario">Agendas & Calendarios</option>
                <option value="carpeta">Carpetas Corporativas</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Tipo de Geometría</label>
              <select
                bind:value={formPreset.tipo}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="flyer">Hoja Plana / Flyer</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="diptico">Díptico</option>
                <option value="triptico">Tríptico</option>
                <option value="cuadriptico">Cuadríptico</option>
                <option value="revista">Revista multi-página</option>
                <option value="libro">Libro</option>
                <option value="agenda">Agenda / Cuaderno</option>
                <option value="calendario">Calendario</option>
                <option value="carpeta">Carpeta con solapa</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Ancho (mm) *</label>
              <input
                type="number"
                bind:value={formPreset.ancho}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Alto (mm) *</label>
              <input
                type="number"
                bind:value={formPreset.alto}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <div class="space-y-1.5">
              <label class="font-semibold text-foreground">Sangre (mm)</label>
              <input
                type="number"
                bind:value={formPreset.sangre}
                class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="font-semibold text-foreground">Gramajes Sugeridos (separados por coma)</label>
            <input
              type="text"
              placeholder="135, 170, 250"
              bind:value={gramajesPresetInputStr}
              class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            onclick={() => modalPresetAbierto = false}
            class="px-4 py-2 rounded-xl text-xs font-medium hover:bg-accent text-muted-foreground"
          >
            Cancelar
          </button>
          <button
            onclick={guardarFormPreset}
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            {modoEdicionPreset ? 'Guardar Cambios' : 'Crear Preset'}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ===================================================================== -->
  <!-- MODAL: CONFIRMAR RESTABLECIMIENTO DE FÁBRICA -->
  <!-- ===================================================================== -->
  {#if modalConfirmarReset}
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
        <div class="flex items-center gap-3 text-amber-600 dark:text-amber-400">
          <div class="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle class="w-6 h-6" />
          </div>
          <h3 class="font-bold text-base text-foreground">¿Restablecer valores de fábrica?</h3>
        </div>

        <p class="text-xs text-muted-foreground leading-relaxed">
          Esta acción reemplazará todos los papeles, acabados, máquinas y costes de taller actuales con los valores predeterminados estándar de la industria. Si has realizado cambios personalizados, te recomendamos <strong>Exportar a JSON</strong> antes de continuar.
        </p>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            onclick={() => modalConfirmarReset = false}
            class="px-4 py-2 rounded-xl text-xs font-medium hover:bg-accent text-muted-foreground"
          >
            Cancelar
          </button>
          <button
            onclick={confirmarRestablecer}
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
          >
            Sí, Restablecer Todo
          </button>
        </div>
      </div>
    </div>
  {/if}

</div>
