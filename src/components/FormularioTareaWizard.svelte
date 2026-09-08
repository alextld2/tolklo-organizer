<script lang="ts">
  import { slide, fade } from "svelte/transition";
  import { LISTA_COMERCIALES } from "../utils/constants";
  import {
    CheckCircle2,
    AlertCircle,
    Check,
    Calendar,
    User,
    Hash,
    FileText,
    Warehouse,
    Store,
    Truck,
    MapPin,
    Layers,
    Printer,
    Settings2,
    Scissors,
    Package,
    Plus,
    Trash2,
    X,
    ArrowLeft,
    ArrowRight,
    Loader2,
    BookOpen,
    Sparkles,
    SlidersHorizontal,
    Palette,
    Info,
    Building2,
    Tag,
    Handshake,
  } from "lucide-svelte";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
  import { Button } from "./ui/button";
  import { Input } from "./ui/input";
  import { Badge } from "./ui/badge";
  import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  } from "./ui/select";

  export let workspace: string = "";
  export let clientesExistentes: string[] = [];
  export let proximoNumParte: string = "";

  // --- ESTADO INTERNO DEL WIZARD Y NOTIFICACIONES ---
  let pasoActual = 1;
  let mensajeNotificacion = "";
  let tipoNotificacion: "success" | "error" = "success";
  let guardandoDato = false;

  // --- PASO 1: ADM & LOGÍSTICA ---
  $: numParte = proximoNumParte;
  let cliente = "";
  let comercial = "Marcos";
  let fechaSalida = "";
  let tipoEntrega = "taller";
  let direccionEntrega = "";
  let albaranAnonimo = false;

  // --- DIRECCIONES REGISTRADAS DEL CLIENTE ---
  let direccionesCliente: Array<{
    id: number;
    cliente: string;
    calle: string;
    ciudad: string;
    provincia: string | null;
    codigoPostal: string;
    pais: string;
    telefono: string | null;
    notas: string | null;
  }> = [];
  let cargandoDirecciones = false;
  let ultimoClienteBuscado = "";

  $: if (cliente && cliente.trim().length > 1) {
    buscarDireccionesCliente(cliente.trim());
  } else {
    direccionesCliente = [];
    ultimoClienteBuscado = "";
  }

  async function buscarDireccionesCliente(nombre: string) {
    if (nombre === ultimoClienteBuscado) return;
    ultimoClienteBuscado = nombre;
    cargandoDirecciones = true;
    try {
      const resp = await fetch(
        `/api/direcciones/list?cliente=${encodeURIComponent(nombre)}`,
      );
      if (resp.ok) {
        direccionesCliente = await resp.json();
      } else {
        direccionesCliente = [];
      }
    } catch (err) {
      console.error(err);
      direccionesCliente = [];
    } finally {
      cargandoDirecciones = false;
    }
  }

  // Buscador predictivo de clientes
  let mostrarSugerencias = false;
  $: sugerenciasFiltradas =
    cliente.trim() !== ""
      ? clientesExistentes.filter(
          (c) =>
            c.toLowerCase().includes(cliente.toLowerCase()) &&
            c.toLowerCase() !== cliente.toLowerCase(),
        )
      : [];

  function seleccionarCliente(nombre: string) {
    cliente = nombre;
    mostrarSugerencias = false;
  }

  const comerciales = LISTA_COMERCIALES;

  // --- PASO 2: PRODUCCIÓN & DESGLOSE ---
  let areasSeleccionadas: string[] = ["DIGITAL"];
  $: area = areasSeleccionadas.length > 0 ? areasSeleccionadas.join(" / ") : "DIGITAL";
  $: tieneSubcontrata = areasSeleccionadas.includes("SUBCONTRATA");

  const listaEmpresasSubcontrata = [
    "Subcontrata 1",
    "Subcontrata 2",
    "Subcontrata 3",
    "Subcontrata 4",
    "Taller Gráfico Externo",
    "Acabados Especiales SL",
  ];
  let empresaSubcontrata = "Subcontrata 1";

  function toggleArea(item: string) {
    if (areasSeleccionadas.includes(item)) {
      if (areasSeleccionadas.length > 1) {
        areasSeleccionadas = areasSeleccionadas.filter((a) => a !== item);
      }
    } else {
      areasSeleccionadas = [...areasSeleccionadas, item];
    }
  }

  let descripcionGeneral = "";
  let desgloses: Array<{
    descripcionProducto: string;
    cantidad: number | null;
    subcontratado?: boolean;
  }> = [{ descripcionProducto: "", cantidad: null, subcontratado: false }];

  function agregarFilaDesglose() {
    desgloses = [...desgloses, { descripcionProducto: "", cantidad: null, subcontratado: false }];
  }
  function eliminarFilaDesglose(index: number) {
    if (desgloses.length > 1)
      desgloses = desgloses.filter((_, i) => i !== index);
  }

  // --- PASO 3: FICHA TÉCNICA (CAMPOS LIMPIOS POR DEFECTO) ---
  let papelPortada = "";
  let colorPortada = "";
  let papelInterior = "";
  let colorInterior = "";

  let tipoTintaPortada = "estandar";
  let listaPantonesPortada: string[] = [];
  let inputPantonePortada = "";

  let tipoTintaInterior = "estandar";
  let listaPantonesInterior: string[] = [];
  let inputPantoneInterior = "";

  $: requiereConfigurarTintasPortada = ["1+0", "1+1", "2+2", "4+1"].includes(
    colorPortada,
  );
  $: requiereConfigurarTintasInterior =
    ["1+1", "2+2", "4+1"].includes(colorPortada) || colorInterior === "Pantone";

  function añadirPantonePortada() {
    if (inputPantonePortada.trim() !== "") {
      listaPantonesPortada = [
        ...listaPantonesPortada,
        inputPantonePortada.trim().toUpperCase(),
      ];
      inputPantonePortada = "";
    }
  }
  function eliminarPantonePortada(idx: number) {
    listaPantonesPortada = listaPantonesPortada.filter((_, i) => i !== idx);
  }

  function añadirPantoneInterior() {
    if (inputPantoneInterior.trim() !== "") {
      listaPantonesInterior = [
        ...listaPantonesInterior,
        inputPantoneInterior.trim().toUpperCase(),
      ];
      inputPantoneInterior = "";
    }
  }
  function eliminarPantoneInterior(idx: number) {
    listaPantonesInterior = listaPantonesInterior.filter((_, i) => i !== idx);
  }

  let encuadernacion = {
    rustica: false,
    cosida: false,
    contracolado: false,
    fresada: false,
    colapur: false,
    solapa: false,
  };
  let espiralColor = "";
  let wireOColor = "";
  let acabados = {
    hendido: false,
    troquelado: false,
    goma: false,
    plegado: false,
    perforado: false,
    pegado: false,
    agujero: false,
    enumerado: false,
  };

  let grapadoTipo = "Seleccionar opción";
  let barnizUVTipo = "No";
  let estampingTipo = "No requiere";

  let laminadoTipo = "1 cara";
  let tipoLaminadoCara1: Record<string, boolean> = {
    brillo: false,
    sandy: false,
    softTouch: false,
    antiAranazos: false,
    mate: false,
  };
  let tipoLaminadoCara2: Record<string, boolean> = {
    brillo: false,
    sandy: false,
    softTouch: false,
    antiAranazos: false,
    mate: false,
  };

  // Selección única y mutuamente excluyente de acabado de laminado
  function seleccionarLaminadoCara1(key: string) {
    const yaSeleccionado = tipoLaminadoCara1[key];
    const nuevoEstado: Record<string, boolean> = {
      brillo: false,
      sandy: false,
      softTouch: false,
      antiAranazos: false,
      mate: false,
    };
    nuevoEstado[key] = !yaSeleccionado;
    tipoLaminadoCara1 = nuevoEstado;
    if (laminadoTipo === "2 caras") {
      tipoLaminadoCara2 = { ...nuevoEstado };
    }
  }

  function seleccionarLaminadoCara2(key: string) {
    const yaSeleccionado = tipoLaminadoCara2[key];
    const nuevoEstado: Record<string, boolean> = {
      brillo: false,
      sandy: false,
      softTouch: false,
      antiAranazos: false,
      mate: false,
    };
    nuevoEstado[key] = !yaSeleccionado;
    tipoLaminadoCara2 = nuevoEstado;
  }

  // Sincronización automática si se selecciona "2 caras"
  $: if (laminadoTipo === "2 caras") {
    tipoLaminadoCara2 = { ...tipoLaminadoCara1 };
  }

  const areasImpresion = [
    "DIGITAL",
    "PLOTTER",
    "MIMAKI",
    "DISEÑO",
    "OFFSET",
    "OPX",
    "DTF",
    "SUBCONTRATA",
  ];
  const opcionesColor = ["4+0", "4+4", "1+0", "1+1", "2+2", "4+1"];
  const opcionesGramaje = [
    "90 gr Offset",
    "115 gr Brillo",
    "135 gr MATE",
    "135 gr Brillo",
    "170 gr MATE",
    "250 gr MATE",
    "300 gr Brillo",
    "350 gr MATE",
  ];

  function irAlSiguiente() {
    if (pasoActual === 1) {
      if (!cliente.trim() || !fechaSalida) {
        mensajeNotificacion = "Por favor, completa el Cliente y la Fecha de Salida antes de continuar.";
        tipoNotificacion = "error";
        return;
      }
    }
    if (pasoActual < 3) {
      mensajeNotificacion = "";
      pasoActual += 1;
    }
  }

  function irAlAnterior() {
    if (pasoActual > 1) {
      mensajeNotificacion = "";
      pasoActual -= 1;
    }
  }

  // PROCESAR ENVÍO CON INCREMENTO REACTIVO AUTOMÁTICO (RUTA EXACTA /api/tarea/create)
  async function procesarEnvio() {
    if (!cliente.trim() || !fechaSalida) {
      mensajeNotificacion =
        "Faltan campos obligatorios por rellenar (Cliente o Fecha Salida).";
      tipoNotificacion = "error";
      pasoActual = 1;
      return;
    }

    guardandoDato = true;
    mensajeNotificacion = "";

    try {
      // 1. Enviamos el objeto completo incluyendo la Ficha Técnica del Paso 3
      const response = await fetch(`/api/tarea/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numParte,
          workspaceId: workspace,
          cliente,
          descripcionGeneral,
          comercial,
          fechaSalida,
          area,
          subcontrata: tieneSubcontrata ? empresaSubcontrata : null,
          desgloses,
          papelPortada,
          colorPortada,
          papelInterior,
          colorInterior,
          espiralColor,
          wireOColor,
          grapadoTipo,
          barnizUVTipo,
          estampingTipo,
          laminadoTipo,
          encuadernacion,
          acabados,
          tipoLaminadoCara1,
          tipoLaminadoCara2,
        }),
      });

      if (!response.ok) {
        const datosError = await response.json().catch(() => ({}));
        throw new Error(
          datosError.error || "Error indeterminado en el servidor.",
        );
      }

      // 2. 🔥 EL NUEVO FLUJO MÁSTER: Abrimos la ruta del PDF real dinámico
      window.open(`/w/${workspace}/parte/${numParte}/print`, "_blank");

      mensajeNotificacion = `¡Parte #${numParte} guardado con éxito en Turso!`;
      tipoNotificacion = "success";

      // 3. Incrementamos el contador reactivo en caliente
      const fragmentos = numParte.split("-");
      if (fragmentos[1]) {
        const numeroActual = parseInt(fragmentos[1], 10);
        const proximoNumero = numeroActual + 1;
        proximoNumParte = `${fragmentos[0]}-${proximoNumero.toString().padStart(4, "0")}`;
      }

      // 4. Reseteamos el formulario a virgen
      cliente = "";
      descripcionGeneral = "";
      fechaSalida = "";
      direccionEntrega = "";
      albaranAnonimo = false;
      tipoEntrega = "taller";
      area = "DIGITAL";
      areasSeleccionadas = ["DIGITAL"];
      empresaSubcontrata = "Subcontrata 1";
      desgloses = [{ descripcionProducto: "", cantidad: null, subcontratado: false }];
      papelPortada = "";
      colorPortada = "";
      papelInterior = "";
      colorInterior = "";
      listaPantonesPortada = [];
      listaPantonesInterior = [];
      encuadernacion = {
        rustica: false,
        cosida: false,
        contracolado: false,
        fresada: false,
        colapur: false,
        solapa: false,
      };
      acabados = {
        hendido: false,
        troquelado: false,
        goma: false,
        plegado: false,
        perforado: false,
        pegado: false,
        agujero: false,
        enumerado: false,
      };
      espiralColor = "";
      wireOColor = "";
      grapadoTipo = "Seleccionar opción";
      barnizUVTipo = "No";
      estampingTipo = "No requiere";
      laminadoTipo = "1 cara";

      pasoActual = 1;
    } catch (err: any) {
      mensajeNotificacion = `${err.message}`;
      tipoNotificacion = "error";
    } finally {
      guardandoDato = false;
      setTimeout(() => {
        mensajeNotificacion = "";
      }, 5000);
    }
  }
</script>

<!-- CONTENEDOR PRINCIPAL DEL WIZARD -->
<div class="w-full max-w-5xl mx-auto flex flex-col space-y-6 text-foreground font-sans pb-10">

  <!-- 🧭 STEPPER INDICATOR (ESTILO SHADCN / ZINC) -->
  <div class="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
    <div class="flex items-center justify-between max-w-3xl mx-auto relative">
      
      <!-- Paso 1 -->
      <button
        type="button"
        onclick={() => (pasoActual = 1)}
        class="flex items-center gap-3 group text-left cursor-pointer transition-all bg-transparent border-none p-0"
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-xs transition-all duration-200 shadow-2xs {pasoActual === 1
            ? 'bg-primary text-primary-foreground ring-4 ring-primary/10'
            : pasoActual > 1
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'bg-muted text-muted-foreground border border-border'}"
        >
          {#if pasoActual > 1}
            <Check class="w-4 h-4" />
          {:else}
            <FileText class="w-4 h-4" />
          {/if}
        </div>
        <div class="hidden sm:flex flex-col">
          <span class="text-[10px] uppercase font-semibold tracking-wider {pasoActual === 1 ? 'text-primary font-bold' : 'text-muted-foreground'}">Paso 1</span>
          <span class="text-xs font-semibold {pasoActual === 1 ? 'text-foreground' : 'text-muted-foreground'}">Administrativo</span>
        </div>
      </button>

      <!-- Línea conectora 1 -> 2 -->
      <div class="flex-1 h-0.5 mx-3 sm:mx-6 rounded-full transition-all duration-300 {pasoActual > 1 ? 'bg-primary/40' : 'bg-border'}"></div>

      <!-- Paso 2 -->
      <button
        type="button"
        onclick={() => { if (cliente.trim() && fechaSalida) pasoActual = 2; }}
        class="flex items-center gap-3 group text-left cursor-pointer transition-all bg-transparent border-none p-0"
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-xs transition-all duration-200 shadow-2xs {pasoActual === 2
            ? 'bg-primary text-primary-foreground ring-4 ring-primary/10'
            : pasoActual > 2
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'bg-muted text-muted-foreground border border-border'}"
        >
          {#if pasoActual > 2}
            <Check class="w-4 h-4" />
          {:else}
            <Layers class="w-4 h-4" />
          {/if}
        </div>
        <div class="hidden sm:flex flex-col">
          <span class="text-[10px] uppercase font-semibold tracking-wider {pasoActual === 2 ? 'text-primary font-bold' : 'text-muted-foreground'}">Paso 2</span>
          <span class="text-xs font-semibold {pasoActual === 2 ? 'text-foreground' : 'text-muted-foreground'}">Producción</span>
        </div>
      </button>

      <!-- Línea conectora 2 -> 3 -->
      <div class="flex-1 h-0.5 mx-3 sm:mx-6 rounded-full transition-all duration-300 {pasoActual > 2 ? 'bg-primary/40' : 'bg-border'}"></div>

      <!-- Paso 3 -->
      <button
        type="button"
        onclick={() => { if (cliente.trim() && fechaSalida) pasoActual = 3; }}
        class="flex items-center gap-3 group text-left cursor-pointer transition-all bg-transparent border-none p-0"
      >
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-xs transition-all duration-200 shadow-2xs {pasoActual === 3
            ? 'bg-primary text-primary-foreground ring-4 ring-primary/10'
            : 'bg-muted text-muted-foreground border border-border'}"
        >
          <Settings2 class="w-4 h-4" />
        </div>
        <div class="hidden sm:flex flex-col">
          <span class="text-[10px] uppercase font-semibold tracking-wider {pasoActual === 3 ? 'text-primary font-bold' : 'text-muted-foreground'}">Paso 3</span>
          <span class="text-xs font-semibold {pasoActual === 3 ? 'text-foreground' : 'text-muted-foreground'}">Ficha Técnica</span>
        </div>
      </button>

    </div>
  </div>

  <!-- 🔔 NOTIFICACIÓN FLOTANTE / INLINE -->
  {#if mensajeNotificacion}
    <div
      transition:slide={{ duration: 200 }}
      class="w-full p-3.5 rounded-xl text-xs font-medium tracking-tight shadow-2xs flex items-center gap-2.5 {tipoNotificacion === 'success'
        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
        : 'bg-destructive/10 text-destructive border border-destructive/20'}"
    >
      {#if tipoNotificacion === "success"}
        <CheckCircle2 class="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
      {:else}
        <AlertCircle class="w-4 h-4 flex-shrink-0 text-destructive" />
      {/if}
      <span class="flex-1">{mensajeNotificacion}</span>
      <button
        type="button"
        onclick={() => (mensajeNotificacion = "")}
        class="text-muted-foreground hover:text-foreground p-1 transition-colors rounded-md"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  {/if}

  <!-- ========================================================================= -->
  <!-- PASO 1: ADM & LOGÍSTICA -->
  <!-- ========================================================================= -->
  {#if pasoActual === 1}
    <div class="space-y-6" in:fade={{ duration: 150 }}>
      
      <!-- Datos Principales -->
      <Card class="border-border/80 shadow-2xs">
        <CardHeader class="pb-4">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FileText class="w-4 h-4" />
            </div>
            <div>
              <CardTitle class="text-base font-semibold">Identificación y Plazos</CardTitle>
              <CardDescription class="text-xs text-muted-foreground">
                Apertura técnica, asignación de comercial y fecha comprometida de entrega.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            
            <!-- Número de Parte -->
            <div class="flex flex-col space-y-1.5">
              <label for="numParte" class="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Hash class="w-3.5 h-3.5" /> Número de Parte (Automático)
              </label>
              <div class="relative">
                <input
                  id="numParte"
                  type="text"
                  bind:value={numParte}
                  readonly
                  class="flex h-9 w-full rounded-xl border border-input bg-muted/60 px-3 py-1 font-mono text-xs font-semibold text-muted-foreground cursor-not-allowed select-none shadow-2xs"
                />
                <Badge variant="secondary" class="absolute right-2 top-1.5 text-[9px] font-mono pointer-events-none">
                  AUTO
                </Badge>
              </div>
            </div>

            <!-- Comercial Asignado con Shadcn Select -->
            <div class="flex flex-col space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <User class="w-3.5 h-3.5" /> Comercial Asignado
              </label>
              <Select bind:value={comercial}>
                <SelectTrigger class="h-9 rounded-xl">
                  <SelectValue placeholder="Seleccionar comercial..." />
                </SelectTrigger>
                <SelectContent>
                  {#each comerciales as c}
                    <SelectItem value={c} label={c}>
                      <div class="flex items-center gap-2">
                        <User class="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{c}</span>
                      </div>
                    </SelectItem>
                  {/each}
                </SelectContent>
              </Select>
            </div>

            <!-- Cliente Corporativo (Con predictivo) -->
            <div class="flex flex-col space-y-1.5 relative">
              <label for="cliente" class="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span class="flex items-center gap-1.5">
                  <Building2 class="w-3.5 h-3.5" /> Cliente Corporativo <span class="text-destructive">*</span>
                </span>
                {#if cliente.trim()}
                  <span class="text-[10px] text-muted-foreground font-normal">Escribe para autocompletar</span>
                {/if}
              </label>
              <div class="relative">
                <input
                  id="cliente"
                  type="text"
                  bind:value={cliente}
                  onfocus={() => (mostrarSugerencias = true)}
                  onblur={() => setTimeout(() => (mostrarSugerencias = false), 200)}
                  placeholder="Escribe el nombre del cliente..."
                  class="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {#if mostrarSugerencias && sugerenciasFiltradas.length > 0}
                <div
                  class="absolute top-[62px] left-0 w-full bg-popover text-popover-foreground border border-border rounded-xl max-h-48 overflow-y-auto shadow-lg z-50 divide-y divide-border/60"
                  transition:slide={{ duration: 150 }}
                >
                  {#each sugerenciasFiltradas as sug}
                    <button
                      type="button"
                      onclick={() => seleccionarCliente(sug)}
                      class="w-full text-left px-3.5 py-2.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between group cursor-pointer border-none bg-transparent"
                    >
                      <span class="flex items-center gap-2">
                        <Building2 class="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                        {sug}
                      </span>
                      <span class="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">Seleccionar</span>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>

            <!-- Fecha Límite de Salida -->
            <div class="flex flex-col space-y-1.5">
              <label for="fechaSalida" class="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5" /> Fecha Límite de Salida <span class="text-destructive">*</span>
              </label>
              <input
                id="fechaSalida"
                type="date"
                bind:value={fechaSalida}
                class="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

          </div>
        </CardContent>
      </Card>

      <!-- Modalidad de Distribución -->
      <Card class="border-border/80 shadow-2xs">
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Truck class="w-4 h-4" />
              </div>
              <div>
                <CardTitle class="text-base font-semibold">Logística y Entrega</CardTitle>
                <CardDescription class="text-xs text-muted-foreground">
                  Define cómo se entregará el pedido terminado.
                </CardDescription>
              </div>
            </div>
            <label class="flex items-center gap-2 cursor-pointer text-xs font-medium text-muted-foreground select-none hover:text-foreground transition-colors">
              <input
                type="checkbox"
                bind:checked={albaranAnonimo}
                class="h-4 w-4 rounded border-input text-primary focus:ring-ring accent-primary cursor-pointer"
              />
              <span>Albarán Anónimo</span>
            </label>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          
          <!-- Segmented Control de Entrega (Unificado Taller y Almacén) -->
          <div class="grid grid-cols-2 gap-2 bg-muted/60 p-1 rounded-xl border border-border/60">
            <button
              type="button"
              onclick={() => (tipoEntrega = "taller")}
              class="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none {tipoEntrega === 'taller' || tipoEntrega === 'almacen'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground bg-transparent'}"
            >
              <Store class="w-3.5 h-3.5" />
              <span>Recogida Taller / Almacén</span>
            </button>
            <button
              type="button"
              onclick={() => (tipoEntrega = "envio")}
              class="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer border-none {tipoEntrega === 'envio'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground bg-transparent'}"
            >
              <Truck class="w-3.5 h-3.5" />
              <span>Se Envía Fuera</span>
            </button>
          </div>

          <!-- Si es Envío Fuera -->
          {#if tipoEntrega === "envio"}
            <div class="space-y-3 pt-2" transition:slide={{ duration: 150 }}>
              
              {#if cargandoDirecciones}
                <div class="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 class="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Buscando direcciones registradas para este cliente...</span>
                </div>
              {:else if direccionesCliente.length > 0}
                <div class="space-y-2 bg-muted/40 border border-border/80 p-3.5 rounded-xl">
                  <div class="flex items-center justify-between">
                    <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin class="w-3.5 h-3.5 text-primary" /> Direcciones registradas ({cliente})
                    </span>
                    <span class="text-[10px] text-muted-foreground">Haz clic para asignar</span>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                    {#each direccionesCliente as dir}
                      <button
                        type="button"
                        onclick={() => {
                          const formateada = `${dir.calle}, ${dir.codigoPostal} ${dir.ciudad}${dir.provincia ? ` (${dir.provincia})` : ""}, ${dir.pais}`;
                          direccionEntrega = formateada;
                        }}
                        class="p-2.5 rounded-xl border text-left flex flex-col justify-start transition-all cursor-pointer select-none {direccionEntrega.startsWith(dir.calle)
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/20'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-accent/50'}"
                      >
                        <span class="font-semibold text-xs text-foreground truncate w-full flex items-center gap-1">
                          <MapPin class="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          {dir.calle}
                        </span>
                        <span class="text-[11px] text-muted-foreground truncate w-full pl-4">
                          {dir.codigoPostal} {dir.ciudad}
                        </span>
                        {#if dir.notas}
                          <span class="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 truncate w-full italic pl-4">
                            *{dir.notas}
                          </span>
                        {/if}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}

              <div class="flex flex-col space-y-1.5">
                <label for="direccion" class="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <MapPin class="w-3.5 h-3.5" /> Dirección de Entrega Completa
                </label>
                <input
                  id="direccion"
                  type="text"
                  bind:value={direccionEntrega}
                  placeholder="Calle, Número, Código Postal, Localidad..."
                  class="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          {/if}

        </CardContent>
      </Card>

    </div>
  {/if}

  <!-- ========================================================================= -->
  <!-- PASO 2: PRODUCCIÓN & DESGLOSE -->
  <!-- ========================================================================= -->
  {#if pasoActual === 2}
    <div class="space-y-6" in:fade={{ duration: 150 }}>
      
      <!-- Maquinaria / Área Principal -->
      <Card class="border-border/80 shadow-2xs">
        <CardHeader class="pb-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers class="w-4 h-4" />
            </div>
            <div>
              <CardTitle class="text-base font-semibold">Área y Maquinaria Principal</CardTitle>
              <CardDescription class="text-xs text-muted-foreground">
                Selecciona el centro de trabajo o técnica asignada a la orden.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 bg-muted/40 p-2 rounded-2xl border border-border/60">
              {#each areasImpresion as item}
                <button
                  type="button"
                  onclick={() => toggleArea(item)}
                  class="py-2.5 px-2 rounded-xl text-xs font-semibold transition-all text-center cursor-pointer border-none {areasSeleccionadas.includes(item)
                    ? 'bg-primary text-primary-foreground shadow-sm scale-102 ring-2 ring-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/80 bg-transparent'}"
                >
                  <span class="flex items-center justify-center gap-1">
                    {#if areasSeleccionadas.includes(item)}
                      <Check class="w-3 h-3" strokeWidth={3} />
                    {/if}
                    {item}
                  </span>
                </button>
              {/each}
            </div>

            <!-- Recuadro dinámico para Empresa Subcontratada -->
            {#if tieneSubcontrata}
              <div
                class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5"
                transition:slide={{ duration: 150 }}
              >
                <div class="flex items-center justify-between">
                  <label class="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Handshake class="w-4 h-4 text-amber-600 dark:text-amber-400" /> Empresa / Taller de Subcontrata
                  </label>
                  <Badge variant="outline" class="text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold">
                    Taller Externo Activo
                  </Badge>
                </div>
                <p class="text-[11px] text-muted-foreground">
                  Selecciona la empresa con la que se trabaja y marca más abajo las líneas de producto que se derivan a subcontratar.
                </p>
                <div class="w-full sm:w-80">
                  <Select bind:value={empresaSubcontrata}>
                    <SelectTrigger class="h-9 rounded-xl bg-background border-amber-500/30">
                      <SelectValue placeholder="Seleccionar subcontrata..." />
                    </SelectTrigger>
                    <SelectContent>
                      {#each listaEmpresasSubcontrata as sub}
                        <SelectItem value={sub} label={sub}>
                          <div class="flex items-center gap-2">
                            <Building2 class="w-3.5 h-3.5 text-amber-500" />
                            <span>{sub}</span>
                          </div>
                        </SelectItem>
                      {/each}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            {/if}
          </div>
        </CardContent>
      </Card>

      <!-- Descripción General y Desgloses -->
      <Card class="border-border/80 shadow-2xs">
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <FileText class="w-4 h-4" />
              </div>
              <div>
                <CardTitle class="text-base font-semibold">Conceptos y Desglose de Producción</CardTitle>
                <CardDescription class="text-xs text-muted-foreground">
                  Título general del trabajo y desglose por líneas de producto.
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onclick={agregarFilaDesglose}
              class="gap-1.5 text-xs h-8 rounded-lg"
            >
              <Plus class="w-3.5 h-3.5" /> Añadir Línea
            </Button>
          </div>
        </CardHeader>
        <CardContent class="space-y-5">
          
          <!-- Descripción General -->
          <div class="flex flex-col space-y-1.5">
            <label for="descripcionGeneral" class="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Tag class="w-3.5 h-3.5" /> Descripción General del Trabajo
            </label>
            <input
              id="descripcionGeneral"
              type="text"
              bind:value={descripcionGeneral}
              placeholder="Ej: FOLLETOS A4 CORPORATIVOS, CARPETAS CON SOLAPA, BOLSA DELUXE..."
              class="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <!-- Tabla de Desglose de Líneas -->
          <div class="space-y-2.5">
            <!-- Encabezados de la Tabla centrados y alineados -->
            <div class="flex items-center gap-2.5 px-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span class="w-6 flex-shrink-0 text-center">#</span>
              <span class="flex-1">Líneas de Producto</span>
              <span class="w-28 sm:w-32 text-center flex-shrink-0">Cantidad (Unids)</span>
              {#if tieneSubcontrata}
                <span class="w-24 sm:w-28 text-center text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">
                  Subcontratar
                </span>
              {/if}
              <span class="w-9 flex-shrink-0"></span>
            </div>

            <div class="space-y-2">
              {#each desgloses as item, idx}
                <div
                  class="flex items-center gap-2.5 bg-muted/40 p-2.5 rounded-xl border border-border/80 transition-all hover:border-border {item.subcontratado ? 'border-amber-500/40 bg-amber-500/5' : ''}"
                  transition:slide={{ duration: 150 }}
                >
                  <div class="flex items-center justify-center w-6 h-6 rounded-lg bg-background text-[11px] font-semibold text-muted-foreground shadow-2xs flex-shrink-0">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    bind:value={item.descripcionProducto}
                    placeholder="Concepto o variante del producto..."
                    class="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />

                  <!-- Cantidad -->
                  <input
                    type="number"
                    bind:value={item.cantidad}
                    placeholder="Cant."
                    class="w-28 sm:w-32 h-9 rounded-lg border border-input bg-background px-3 text-xs font-mono font-semibold text-center text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex-shrink-0"
                  />

                  <!-- Subcontratar (después de la Cantidad, limpio y centrado) -->
                  {#if tieneSubcontrata}
                    <div class="w-24 sm:w-28 flex items-center justify-center flex-shrink-0">
                      <label
                        class="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all hover:bg-amber-500/15 {item.subcontratado ? 'bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/30' : 'text-muted-foreground/60 hover:text-foreground'}"
                        title="Marcar si esta línea se deriva a taller externo"
                      >
                        <input
                          type="checkbox"
                          bind:checked={item.subcontratado}
                          class="h-4 w-4 rounded border-border accent-amber-600 cursor-pointer transition-transform active:scale-90"
                        />
                      </label>
                    </div>
                  {/if}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onclick={() => eliminarFilaDesglose(idx)}
                    disabled={desgloses.length === 1}
                    class="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              {/each}
            </div>
          </div>

        </CardContent>
      </Card>

    </div>
  {/if}

  <!-- ========================================================================= -->
  <!-- PASO 3: FICHA TÉCNICA -->
  <!-- ========================================================================= -->
  {#if pasoActual === 3}
    <div class="space-y-6" in:fade={{ duration: 150 }}>
      
      <!-- Papeles, Tintas y Pantones -->
      <Card class="border-border/80 shadow-2xs">
        <CardHeader class="pb-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Palette class="w-4 h-4" />
            </div>
            <div>
              <CardTitle class="text-base font-semibold">Soportes y Tintas (Portada / Interior)</CardTitle>
              <CardDescription class="text-xs text-muted-foreground">
                Gramajes, esquemas de color y tintas especiales de planta.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Portada -->
            <div class="bg-muted/40 p-4 rounded-xl border border-border/80 space-y-3.5">
              <div class="flex items-center justify-between border-b border-border/60 pb-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <FileText class="w-3.5 h-3.5" /> Configuración Portada
                </span>
                {#if colorPortada}
                  <Badge variant="secondary" class="font-mono text-[10px]">{colorPortada}</Badge>
                {/if}
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col space-y-1.5">
                  <label for="papelPortada" class="text-[11px] font-semibold text-muted-foreground">Papel Portada</label>
                  <select
                    id="papelPortada"
                    bind:value={papelPortada}
                    class="flex h-9 w-full rounded-xl border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">-- Gramaje --</option>
                    {#each opcionesGramaje as g}<option value={g}>{g}</option>{/each}
                  </select>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <label for="colorPortada" class="text-[11px] font-semibold text-muted-foreground">Color Portada</label>
                  <select
                    id="colorPortada"
                    bind:value={colorPortada}
                    class="flex h-9 w-full rounded-xl border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">-- Tintas --</option>
                    {#each opcionesColor as c}<option value={c}>{c}</option>{/each}
                  </select>
                </div>
              </div>

              {#if requiereConfigurarTintasPortada}
                <div class="space-y-2 pt-2 border-t border-border/50" transition:slide={{ duration: 150 }}>
                  <div class="flex flex-col space-y-1">
                    <span class="text-[11px] font-semibold text-muted-foreground">Tipo de Tinta Portada</span>
                    <select
                      bind:value={tipoTintaPortada}
                      class="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs"
                    >
                      <option value="estandar">Tinta Estándar</option>
                      <option value="pantone">Color Pantone Especial</option>
                    </select>
                  </div>

                  {#if tipoTintaPortada === "pantone"}
                    <div class="space-y-2 pt-1" transition:slide={{ duration: 150 }}>
                      <div class="flex gap-2">
                        <input
                          type="text"
                          bind:value={inputPantonePortada}
                          onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); añadirPantonePortada(); } }}
                          placeholder="Código Pantone (Ej: 485C)"
                          class="flex-1 h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-mono text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onclick={añadirPantonePortada}
                          class="h-8 text-xs font-semibold px-3"
                        >
                          Añadir
                        </Button>
                      </div>

                      <div class="flex flex-wrap gap-1.5 min-h-6">
                        {#each listaPantonesPortada as p, idx}
                          <Badge variant="outline" class="font-mono text-[10px] pl-2 pr-1 py-0.5 gap-1 bg-background border-primary/30 text-primary">
                            <span>P. {p}</span>
                            <button
                              type="button"
                              onclick={() => eliminarPantonePortada(idx)}
                              class="text-muted-foreground hover:text-destructive rounded-full p-0.5"
                            >
                              <X class="w-3 h-3" />
                            </button>
                          </Badge>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Interior -->
            <div class="bg-muted/40 p-4 rounded-xl border border-border/80 space-y-3.5">
              <div class="flex items-center justify-between border-b border-border/60 pb-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <FileText class="w-3.5 h-3.5" /> Configuración Interior
                </span>
                {#if colorInterior}
                  <Badge variant="secondary" class="font-mono text-[10px]">{colorInterior}</Badge>
                {/if}
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col space-y-1.5">
                  <label for="papelInterior" class="text-[11px] font-semibold text-muted-foreground">Papel Interior</label>
                  <select
                    id="papelInterior"
                    bind:value={papelInterior}
                    class="flex h-9 w-full rounded-xl border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">-- Gramaje --</option>
                    {#each opcionesGramaje as g}<option value={g}>{g}</option>{/each}
                  </select>
                </div>
                <div class="flex flex-col space-y-1.5">
                  <label for="colorInterior" class="text-[11px] font-semibold text-muted-foreground">Color Interior</label>
                  <select
                    id="colorInterior"
                    bind:value={colorInterior}
                    class="flex h-9 w-full rounded-xl border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">-- Tintas --</option>
                    {#each opcionesColor as c}<option value={c}>{c}</option>{/each}
                    <option value="Pantone">Pantone Especial</option>
                  </select>
                </div>
              </div>

              {#if requiereConfigurarTintasInterior}
                <div class="space-y-2 pt-2 border-t border-border/50" transition:slide={{ duration: 150 }}>
                  <div class="flex flex-col space-y-1">
                    <span class="text-[11px] font-semibold text-muted-foreground">Tipo de Tinta Interior</span>
                    <select
                      bind:value={tipoTintaInterior}
                      class="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs"
                    >
                      <option value="estandar">Tinta Estándar</option>
                      <option value="pantone">Color Pantone Especial</option>
                    </select>
                  </div>

                  {#if tipoTintaInterior === "pantone"}
                    <div class="space-y-2 pt-1" transition:slide={{ duration: 150 }}>
                      <div class="flex gap-2">
                        <input
                          type="text"
                          bind:value={inputPantoneInterior}
                          onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); añadirPantoneInterior(); } }}
                          placeholder="Código Pantone (Ej: 7241C)"
                          class="flex-1 h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-mono text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onclick={añadirPantoneInterior}
                          class="h-8 text-xs font-semibold px-3"
                        >
                          Añadir
                        </Button>
                      </div>

                      <div class="flex flex-wrap gap-1.5 min-h-6">
                        {#each listaPantonesInterior as p, idx}
                          <Badge variant="outline" class="font-mono text-[10px] pl-2 pr-1 py-0.5 gap-1 bg-background border-primary/30 text-primary">
                            <span>P. {p}</span>
                            <button
                              type="button"
                              onclick={() => eliminarPantoneInterior(idx)}
                              class="text-muted-foreground hover:text-destructive rounded-full p-0.5"
                            >
                              <X class="w-3 h-3" />
                            </button>
                          </Badge>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

          </div>
        </CardContent>
      </Card>

      <!-- Encuadernación, Mecanizado y Procesos Industriales -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- 1. Encuadernación -->
        <Card class="border-border/80 shadow-2xs">
          <CardHeader class="pb-3">
            <div class="flex items-center gap-2">
              <BookOpen class="w-4 h-4 text-primary" />
              <CardTitle class="text-sm font-semibold">1. Encuadernación</CardTitle>
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-2 text-xs">
              {#each Object.keys(encuadernacion) as k}
                <label class="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 cursor-pointer select-none capitalize transition-colors {encuadernacion[k] ? 'border-primary/50 bg-primary/5 text-foreground font-semibold' : 'text-muted-foreground'}">
                  <input
                    type="checkbox"
                    bind:checked={encuadernacion[k]}
                    class="h-3.5 w-3.5 rounded border-input accent-primary"
                  />
                  <span>{k}</span>
                </label>
              {/each}
            </div>

            <div class="space-y-2 pt-2 border-t border-border/60">
              <input
                type="text"
                bind:value={espiralColor}
                placeholder="Color de espiral..."
                class="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <input
                type="text"
                bind:value={wireOColor}
                placeholder="Color de wire-o..."
                class="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        <!-- 2. Mecanizado -->
        <Card class="border-border/80 shadow-2xs">
          <CardHeader class="pb-3">
            <div class="flex items-center gap-2">
              <Scissors class="w-4 h-4 text-primary" />
              <CardTitle class="text-sm font-semibold">2. Mecanizado</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-2 text-xs">
              {#each Object.keys(acabados) as k}
                <label class="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/60 cursor-pointer select-none capitalize transition-colors {acabados[k] ? 'border-primary/50 bg-primary/5 text-foreground font-semibold' : 'text-muted-foreground'}">
                  <input
                    type="checkbox"
                    bind:checked={acabados[k]}
                    class="h-3.5 w-3.5 rounded border-input accent-primary"
                  />
                  <span>{k}</span>
                </label>
              {/each}
            </div>
          </CardContent>
        </Card>

        <!-- 3. Acabados (antes Triplete Industrial) -->
        <Card class="border-border/80 shadow-2xs">
          <CardHeader class="pb-3">
            <div class="flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-primary" />
              <CardTitle class="text-sm font-semibold">3. Acabados</CardTitle>
            </div>
          </CardHeader>
          <CardContent class="space-y-3">
            <!-- Grapado -->
            <div class="flex flex-col space-y-1">
              <label class="text-[11px] font-semibold text-muted-foreground">Grapado</label>
              <Select bind:value={grapadoTipo}>
                <SelectTrigger class="h-8 rounded-lg text-xs">
                  <SelectValue placeholder="Seleccionar opción..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Seleccionar opción" label="Seleccionar opción" />
                  <SelectItem value="Normal" label="Normal" />
                  <SelectItem value="Omega" label="Omega" />
                </SelectContent>
              </Select>
            </div>

            <!-- Barniz UV -->
            <div class="flex flex-col space-y-1">
              <label class="text-[11px] font-semibold text-muted-foreground">Barniz UV</label>
              <Select bind:value={barnizUVTipo}>
                <SelectTrigger class="h-8 rounded-lg text-xs">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No" label="No" />
                  <SelectItem value="Sí" label="Sí" />
                </SelectContent>
              </Select>
            </div>

            <!-- Estamping -->
            <div class="flex flex-col space-y-1">
              <label class="text-[11px] font-semibold text-muted-foreground">Estamping</label>
              <Select bind:value={estampingTipo}>
                <SelectTrigger class="h-8 rounded-lg text-xs">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No requiere" label="No requiere" />
                  <SelectItem value="Requiere" label="Requiere" />
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

      </div>

      <!-- 4. Laminadora de Planta -->
      <Card class="border-border/80 shadow-2xs">
        <CardHeader class="pb-3">
          <div class="flex items-center gap-2">
            <SlidersHorizontal class="w-4 h-4 text-primary" />
            <CardTitle class="text-base font-semibold">4. Laminadora de Planta</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          
          <!-- Tipo de Laminado (Radio selector) -->
          <div class="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
            <label class="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors {laminadoTipo === '1 cara' ? 'border-primary/50 bg-primary/5 text-foreground' : ''}">
              <input
                type="radio"
                bind:group={laminadoTipo}
                value="1 cara"
                class="accent-primary"
              />
              <span>1 cara</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors {laminadoTipo === '2 caras' ? 'border-primary/50 bg-primary/5 text-foreground' : ''}">
              <input
                type="radio"
                bind:group={laminadoTipo}
                value="2 caras"
                class="accent-primary"
              />
              <span>2 caras</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors {laminadoTipo === '2 caras diferentes' ? 'border-primary/50 bg-primary/5 text-foreground' : ''}">
              <input
                type="radio"
                bind:group={laminadoTipo}
                value="2 caras diferentes"
                class="accent-primary"
              />
              <span>2 caras diferentes</span>
            </label>
          </div>

          <!-- Selección de Acabados de Laminado -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-border/60">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  {laminadoTipo === "2 caras" ? "Acabado Ambas Caras (1 y 2)" : "Acabado Cara 1"}
                </span>
                {#if laminadoTipo === "2 caras"}
                  <Badge variant="secondary" class="text-[10px] font-normal text-primary bg-primary/10">
                    Sincronizado 2 Caras
                  </Badge>
                {/if}
              </div>
              <div class="flex flex-wrap gap-2 text-xs">
                {#each Object.keys(tipoLaminadoCara1) as k}
                  <button
                    type="button"
                    onclick={() => seleccionarLaminadoCara1(k)}
                    class="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-background hover:bg-muted/40 cursor-pointer select-none capitalize transition-all {tipoLaminadoCara1[k] ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-2xs ring-1 ring-primary/25' : 'text-muted-foreground'}"
                  >
                    <span class="w-4 h-4 rounded-full border flex items-center justify-center {tipoLaminadoCara1[k] ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40 bg-background'}">
                      {#if tipoLaminadoCara1[k]}
                        <span class="w-1.5 h-1.5 rounded-full bg-primary-foreground"></span>
                      {/if}
                    </span>
                    <span>{k.replace("S", " S").replace("A", " A")}</span>
                  </button>
                {/each}
              </div>
            </div>

            {#if laminadoTipo === "2 caras diferentes"}
              <div class="space-y-2" transition:slide={{ duration: 150 }}>
                <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Acabado Cara 2 (Diferente)
                </span>
                <div class="flex flex-wrap gap-2 text-xs">
                  {#each Object.keys(tipoLaminadoCara2) as k}
                    <button
                      type="button"
                      onclick={() => seleccionarLaminadoCara2(k)}
                      class="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-background hover:bg-muted/40 cursor-pointer select-none capitalize transition-all {tipoLaminadoCara2[k] ? 'border-primary bg-primary/10 text-foreground font-semibold shadow-2xs ring-1 ring-primary/25' : 'text-muted-foreground'}"
                    >
                      <span class="w-4 h-4 rounded-full border flex items-center justify-center {tipoLaminadoCara2[k] ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40 bg-background'}">
                        {#if tipoLaminadoCara2[k]}
                          <span class="w-1.5 h-1.5 rounded-full bg-primary-foreground"></span>
                        {/if}
                      </span>
                      <span>{k.replace("S", " S").replace("A", " A")}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {:else if laminadoTipo === "2 caras"}
              <div class="space-y-2 p-3 rounded-xl bg-muted/30 border border-border/60 flex flex-col justify-center" transition:slide={{ duration: 150 }}>
                <span class="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Check class="w-3.5 h-3.5 text-primary" /> Cara 2 idéntica a Cara 1
                </span>
                <p class="text-[11px] text-muted-foreground leading-relaxed">
                  Al haber elegido <strong>2 caras</strong>, el acabado seleccionado en Cara 1 se replica automáticamente en ambas caras del material.
                </p>
              </div>
            {/if}
          </div>

        </CardContent>
      </Card>

    </div>
  {/if}

  <!-- ========================================================================= -->
  <!-- BARRA INFERIOR DE NAVEGACIÓN Y ACCIONES -->
  <!-- ========================================================================= -->
  <div class="flex items-center justify-between pt-2 border-t border-border/60">
    <Button
      type="button"
      variant="outline"
      onclick={irAlAnterior}
      disabled={pasoActual === 1 || guardandoDato}
      class="gap-2 text-xs h-10 px-4 rounded-xl"
    >
      <ArrowLeft class="w-4 h-4" /> Atrás
    </Button>

    {#if pasoActual < 3}
      <Button
        type="button"
        variant="default"
        onclick={irAlSiguiente}
        class="gap-2 text-xs h-10 px-5 rounded-xl shadow-xs"
      >
        Continuar <ArrowRight class="w-4 h-4" />
      </Button>
    {:else}
      <Button
        type="button"
        variant="default"
        onclick={procesarEnvio}
        disabled={guardandoDato}
        class="gap-2 text-xs h-10 px-6 rounded-xl shadow-md"
      >
        {#if guardandoDato}
          <Loader2 class="w-4 h-4 animate-spin" /> Guardando en Turso...
        {:else}
          <Printer class="w-4 h-4" /> Guardar y Generar A3
        {/if}
      </Button>
    {/if}
  </div>

</div>
