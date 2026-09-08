<script lang="ts">
  import { 
    Tv, 
    Maximize2, 
    Minimize2, 
    Flame, 
    Clock, 
    Layers, 
    Printer, 
    RefreshCw, 
    CheckCircle2, 
    AlertTriangle,
    ArrowRight,
    Sun,
    Moon
  } from "lucide-svelte";
  import { onMount, onDestroy } from "svelte";

  interface DesgloseItem {
    descripcionProducto: string;
    cantidad: number;
  }

  interface TareaCola {
    numParte: string;
    cliente: string;
    descripcionGeneral?: string;
    comercial?: string;
    estado: string;
    fechaSalida: string;
    area?: string;
    subcontrata?: string;
    prioridad: string;
    ordenCola: number;
    grapadoTipo?: string;
    barnizUVTipo?: string;
    laminadoTipo?: string;
    desgloses?: DesgloseItem[];
  }

  let { workspace = "produccion" }: { workspace?: string } = $props();

  let tareas = $state<TareaCola[]>([]);
  let cargando = $state<boolean>(true);
  let horaActual = $state<string>("");
  let fechaActual = $state<string>("");
  let esPantallaCompleta = $state<boolean>(false);
  let ultimaActualizacion = $state<string>("");
  let temaOscuro = $state<boolean>(true);

  let intervaloReloj: any;
  let intervaloPolling: any;

  function actualizarReloj() {
    const ahora = new Date();
    horaActual = ahora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    fechaActual = ahora.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    fechaActual = fechaActual.charAt(0).toUpperCase() + fechaActual.slice(1);
  }

  async function cargarDatos() {
    try {
      const res = await fetch(`/api/cola/data.json?workspace=${workspace}`);
      if (res.ok) {
        const json = await res.json();
        tareas = json.tareas || [];
        const ahora = new Date();
        ultimaActualizacion = ahora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      }
    } catch (e) {
      console.error("Error al refrescar cola TV:", e);
    } finally {
      cargando = false;
    }
  }

  function togglePantallaCompleta() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        esPantallaCompleta = true;
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        esPantallaCompleta = false;
      }).catch(() => {});
    }
  }

  onMount(() => {
    actualizarReloj();
    intervaloReloj = setInterval(actualizarReloj, 1000);

    cargarDatos();
    // Auto-refresco silencioso cada 15 segundos para la TV del taller
    intervaloPolling = setInterval(cargarDatos, 15000);

    const onFsChange = () => {
      esPantallaCompleta = !!document.fullscreenElement;
    };
    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
    };
  });

  onDestroy(() => {
    if (intervaloReloj) clearInterval(intervaloReloj);
    if (intervaloPolling) clearInterval(intervaloPolling);
  });

  // Tarea en máquina (#1) y cola siguiente (#2 en adelante)
  let tareaActual = $derived(tareas.length > 0 ? tareas[0] : null);
  let colaSiguiente = $derived(tareas.length > 1 ? tareas.slice(1) : []);
  let urgentesCount = $derived(tareas.filter(t => t.prioridad === "Urgente").length);
</script>

<div class="min-h-screen w-full select-none transition-colors duration-300 font-sans {temaOscuro ? 'bg-neutral-950 text-neutral-100' : 'bg-slate-50 text-slate-900'} p-4 md:p-8 flex flex-col justify-between">

  <!-- ========================================================================= -->
  <!-- BARRA SUPERIOR DE TELEVISIÓN: CABECERA Y RELOJ EN VIVO -->
  <!-- ========================================================================= -->
  <header class="flex items-center justify-between border-b {temaOscuro ? 'border-neutral-800' : 'border-slate-200'} pb-6">
    <!-- Logotipo y Nombre del Taller -->
    <div class="flex items-center gap-4">
      <div class="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
        <Tv class="w-7 h-7" />
      </div>
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl md:text-3xl font-black tracking-tight uppercase">
            Taller {workspace}
          </h1>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            En Vivo
          </span>
        </div>
        <p class="text-xs md:text-sm font-medium {temaOscuro ? 'text-neutral-400' : 'text-slate-500'}">
          Cola de trabajo en tiempo real para operarios y máquinas
        </p>
      </div>
    </div>

    <!-- Controles TV y Reloj Digital Gigante -->
    <div class="flex items-center gap-6">
      <!-- Reloj Digital Gigante -->
      <div class="text-right">
        <div class="font-mono text-3xl md:text-5xl font-black tracking-wider text-amber-400 drop-shadow-sm">
          {horaActual || "00:00:00"}
        </div>
        <div class="text-xs md:text-sm font-semibold {temaOscuro ? 'text-neutral-400' : 'text-slate-500'}">
          {fechaActual}
        </div>
      </div>

      <!-- Botones de Utilidad (Pantalla completa y tema) -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          onclick={() => (temaOscuro = !temaOscuro)}
          class="p-3 rounded-2xl {temaOscuro ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'} transition-all"
          title="Alternar modo claro / oscuro"
        >
          {#if temaOscuro}
            <Sun class="w-5 h-5" />
          {:else}
            <Moon class="w-5 h-5" />
          {/if}
        </button>

        <button
          type="button"
          onclick={togglePantallaCompleta}
          class="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all shadow-md shadow-amber-500/20"
          title="Modo Pantalla Completa (F11)"
        >
          {#if esPantallaCompleta}
            <Minimize2 class="w-5 h-5" />
          {:else}
            <Maximize2 class="w-5 h-5" />
          {/if}
        </button>
      </div>
    </div>
  </header>

  <!-- ========================================================================= -->
  <!-- CUERPO PRINCIPAL: TRABAJO #1 EN CURSO + COLA DE SIGUIENTES -->
  <!-- ========================================================================= -->
  <main class="my-6 flex-1 flex flex-col gap-6">
    
    {#if cargando}
      <div class="flex-1 flex flex-col items-center justify-center gap-4">
        <RefreshCw class="w-12 h-12 text-amber-500 animate-spin" />
        <span class="text-lg font-bold tracking-wider">Cargando cola de producción...</span>
      </div>
    {:else if tareas.length === 0}
      <div class="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed {temaOscuro ? 'border-neutral-800 bg-neutral-900/40' : 'border-slate-300 bg-white'}">
        <CheckCircle2 class="w-16 h-16 text-emerald-500 mb-4" />
        <h2 class="text-3xl font-black">No hay pedidos pendientes en cola</h2>
        <p class="text-base {temaOscuro ? 'text-neutral-400' : 'text-slate-500'} mt-2">
          Todo el trabajo del taller está al día o no se han cargado partes activos.
        </p>
      </div>
    {:else}

      <!-- 1. TRABAJO #1: EL TRABAJO PRINCIPAL EN MÁQUINA (GIGANTE) -->
      {#if tareaActual}
        <div class="rounded-3xl p-6 md:p-8 border-2 {temaOscuro ? 'bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/20 border-amber-500 shadow-2xl shadow-amber-500/10' : 'bg-gradient-to-r from-white via-amber-50/40 to-white border-amber-500 shadow-xl'} relative overflow-hidden">
          
          <!-- Banner Superior de Estado -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="px-4 py-1.5 rounded-xl bg-amber-500 text-black font-black text-xs md:text-sm uppercase tracking-wider animate-pulse flex items-center gap-2">
                <Printer class="w-4 h-4" /> En Máquina / Prioridad 1
              </span>
              <span class="font-mono text-base md:text-xl font-bold {temaOscuro ? 'text-neutral-300' : 'text-slate-700'}">
                Parte #{tareaActual.numParte}
              </span>
            </div>

            <!-- Nivel de Prioridad -->
            {#if tareaActual.prioridad === "Urgente"}
              <span class="px-4 py-1 rounded-xl bg-red-600 text-white font-black text-sm uppercase tracking-wider flex items-center gap-1.5 animate-bounce">
                <Flame class="w-4 h-4" /> Urgente
              </span>
            {:else if tareaActual.prioridad === "Alta"}
              <span class="px-4 py-1 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold text-sm uppercase">
                Alta
              </span>
            {/if}
          </div>

          <!-- Contenido Central: Cliente y Descripción a gran tamaño -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            
            <!-- Posición Gigante + Cliente -->
            <div class="lg:col-span-2 flex items-center gap-6">
              <div class="w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-amber-500 text-black font-black text-5xl md:text-7xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                #1
              </div>

              <div class="space-y-1">
                <h2 class="text-3xl md:text-5xl font-black tracking-tight {temaOscuro ? 'text-white' : 'text-slate-900'}">
                  {tareaActual.cliente}
                </h2>
                <p class="text-lg md:text-2xl font-semibold {temaOscuro ? 'text-amber-300' : 'text-amber-700'}">
                  {tareaActual.descripcionGeneral || "Sin descripción general"}
                </p>
                <div class="flex items-center gap-3 pt-1">
                  {#if tareaActual.area}
                    <span class="px-3 py-1 rounded-lg text-xs font-bold uppercase {temaOscuro ? 'bg-neutral-800 text-neutral-200' : 'bg-slate-200 text-slate-800'}">
                      {tareaActual.area}
                    </span>
                  {/if}
                  {#if tareaActual.laminadoTipo && tareaActual.laminadoTipo !== "Sin laminado"}
                    <span class="px-3 py-1 rounded-lg text-xs font-bold uppercase {temaOscuro ? 'bg-neutral-800 text-neutral-200' : 'bg-slate-200 text-slate-800'}">
                      Laminado: {tareaActual.laminadoTipo}
                    </span>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Cantidad y Entrega -->
            <div class="lg:col-span-1 rounded-2xl p-4 md:p-6 border {temaOscuro ? 'bg-neutral-950/80 border-neutral-800' : 'bg-white border-slate-200'} space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs md:text-sm font-bold uppercase tracking-wider {temaOscuro ? 'text-neutral-400' : 'text-slate-500'}">
                  Tirada / Unidades:
                </span>
                <div class="text-right">
                  {#if tareaActual.desgloses && tareaActual.desgloses.length > 0}
                    <div class="font-mono text-2xl md:text-3xl font-black text-amber-400">
                      {tareaActual.desgloses[0].cantidad.toLocaleString()} unids
                    </div>
                  {:else}
                    <div class="font-mono text-xl font-bold">1 lote</div>
                  {/if}
                </div>
              </div>

              <div class="flex items-center justify-between border-t {temaOscuro ? 'border-neutral-800' : 'border-slate-100'} pt-3">
                <span class="text-xs md:text-sm font-bold uppercase tracking-wider {temaOscuro ? 'text-neutral-400' : 'text-slate-500'}">
                  Fecha Salida:
                </span>
                <span class="font-mono text-base md:text-xl font-black px-3 py-1 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                  {tareaActual.fechaSalida || "Inmediato"}
                </span>
              </div>
            </div>

          </div>
        </div>
      {/if}

      <!-- 2. COLA DE SIGUIENTES TRABAJOS (#2, #3, #4, #5...) -->
      {#if colaSiguiente.length > 0}
        <div class="space-y-3">
          <div class="flex items-center justify-between px-2">
            <h3 class="text-lg md:text-xl font-black uppercase tracking-wider flex items-center gap-2 {temaOscuro ? 'text-neutral-300' : 'text-slate-700'}">
              <ArrowRight class="w-5 h-5 text-amber-500" /> Siguientes en Cola ({colaSiguiente.length})
            </h3>
            <span class="text-xs md:text-sm font-semibold {temaOscuro ? 'text-neutral-400' : 'text-slate-500'}">
              Orden de ejecución establecido por el encargado
            </span>
          </div>

          <!-- Grid de tarjetas de la cola legible a distancia -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {#each colaSiguiente.slice(0, 8) as item, idx}
              {@const pos = idx + 2}
              <div class="rounded-2xl p-5 border {item.prioridad === 'Urgente'
                ? 'border-red-500/60 bg-red-500/10'
                : temaOscuro
                  ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  : 'bg-white border-slate-200 shadow-sm'} flex flex-col justify-between gap-3 transition-all">
                
                <!-- Posición y Parte -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-xl {item.prioridad === 'Urgente' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'} font-black text-lg flex items-center justify-center shadow-xs">
                      #{pos}
                    </span>
                    <span class="font-mono font-bold text-xs {temaOscuro ? 'text-neutral-400' : 'text-slate-500'}">
                      #{item.numParte}
                    </span>
                  </div>

                  {#if item.prioridad === "Urgente"}
                    <span class="px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] uppercase flex items-center gap-1">
                      <Flame class="w-3 h-3" /> Urgente
                    </span>
                  {:else}
                    <span class="text-[11px] font-semibold {temaOscuro ? 'text-neutral-400' : 'text-slate-500'}">
                      {item.estado}
                    </span>
                  {/if}
                </div>

                <!-- Cliente y Descripción -->
                <div class="space-y-1">
                  <h4 class="text-lg font-black truncate {temaOscuro ? 'text-white' : 'text-slate-900'}">
                    {item.cliente}
                  </h4>
                  <p class="text-xs line-clamp-2 {temaOscuro ? 'text-neutral-300' : 'text-slate-600'}">
                    {item.descripcionGeneral || "Sin descripción"}
                  </p>
                </div>

                <!-- Footer de la tarjeta: Cantidad y Fecha -->
                <div class="border-t {temaOscuro ? 'border-neutral-800' : 'border-slate-100'} pt-2.5 flex items-center justify-between text-xs">
                  <span class="font-mono font-bold text-amber-400">
                    {#if item.desgloses && item.desgloses.length > 0}
                      {item.desgloses[0].cantidad.toLocaleString()} unids
                    {:else}
                      1 lote
                    {/if}
                  </span>
                  <span class="font-mono font-semibold {temaOscuro ? 'text-neutral-400' : 'text-slate-500'}">
                    {item.fechaSalida || "-"}
                  </span>
                </div>

              </div>
            {/each}
          </div>
        </div>
      {/if}

    {/if}

  </main>

  <!-- ========================================================================= -->
  <!-- PIE INFERIOR DE PANTALLA: ESTADÍSTICAS Y ESTADO DE SINCRONIZACIÓN -->
  <!-- ========================================================================= -->
  <footer class="border-t {temaOscuro ? 'border-neutral-800 text-neutral-400' : 'border-slate-200 text-slate-500'} pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-semibold">
    <div class="flex items-center gap-6">
      <span>Total en cola: <strong class="{temaOscuro ? 'text-white' : 'text-slate-900'}">{tareas.length}</strong></span>
      <span>Urgentes: <strong class="text-red-500">{urgentesCount}</strong></span>
      <span>Actualización automática: <strong>cada 15s</strong></span>
    </div>

    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
      <span>Última sincronización: {ultimaActualizacion || "Conectando..."}</span>
    </div>
  </footer>

</div>
