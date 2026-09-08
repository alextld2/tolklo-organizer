<script lang="ts">
  import { 
    Tv, 
    ArrowUp, 
    ArrowDown, 
    Zap, 
    AlertCircle, 
    Clock, 
    CheckCircle2, 
    Printer, 
    Layers, 
    Flame, 
    Search, 
    Filter, 
    RefreshCw, 
    ExternalLink, 
    SlidersHorizontal,
    FileText,
    Calendar,
    ChevronRight,
    Tag
  } from "lucide-svelte";
  import { slide, fade } from "svelte/transition";
  import { Button } from "./ui/button";
  import { Badge } from "./ui/badge";
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";

  interface DesgloseItem {
    descripcionProducto: string;
    cantidad: number;
  }

  interface TareaCola {
    numParte: string;
    cliente: string;
    descripcionGeneral?: string;
    comercial?: string;
    diseñador?: string;
    estado: string;
    fechaSalida: string;
    area?: string;
    subcontrata?: string;
    prioridad: "Urgente" | "Alta" | "Normal" | "Pausa";
    ordenCola: number;
    grapadoTipo?: string;
    barnizUVTipo?: string;
    laminadoTipo?: string;
    desgloses?: DesgloseItem[];
  }

  let { tareas = [], workspace = "produccion" }: { tareas: TareaCola[]; workspace?: string } = $props();

  // Estado local reactivo de la cola
  let lista = $state<TareaCola[]>([]);
  let filtroArea = $state<string>("TODAS");
  let filtroPrioridad = $state<string>("TODAS");
  let busqueda = $state<string>("");
  let guardando = $state<boolean>(false);
  let mensajeToast = $state<string>("");

  // Inicialización de la lista ordenada
  $effect(() => {
    // Clonamos y ordenamos inicialmente
    const copia = [...tareas].map((t, idx) => ({
      ...t,
      prioridad: (t.prioridad || "Normal") as "Urgente" | "Alta" | "Normal" | "Pausa",
      ordenCola: t.ordenCola && t.ordenCola > 0 ? t.ordenCola : idx + 1
    }));
    copia.sort((a, b) => a.ordenCola - b.ordenCola);
    // Asignamos posiciones continuas 1..N
    copia.forEach((item, index) => {
      item.ordenCola = index + 1;
    });
    lista = copia;
  });

  // Áreas disponibles
  const areasDisponibles = ["TODAS", "DIGITAL", "OFFSET", "PLOTTER", "MIMAKI", "MANIPULADO"];

  // Prioridades con colores
  const configPrioridad: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    Urgente: { color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: Flame, label: "Urgente" },
    Alta: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: AlertCircle, label: "Alta" },
    Normal: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: Clock, label: "Normal" },
    Pausa: { color: "text-neutral-500 dark:text-neutral-400", bg: "bg-neutral-500/10 border-neutral-500/30", icon: Layers, label: "En Pausa" }
  };

  // Estados de producción
  const estadosProduccion = ["Por hacer", "Imprimiendo", "Manipulado", "Urgente", "Terminado"];

  // Filtrado de la lista
  let listaFiltrada = $derived(
    lista.filter((item) => {
      const coincideArea =
        filtroArea === "TODAS" ||
        (item.area && item.area.toUpperCase().includes(filtroArea));
      const coincidePrioridad =
        filtroPrioridad === "TODAS" || item.prioridad === filtroPrioridad;
      const coincideBusqueda =
        !busqueda.trim() ||
        item.numParte.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.descripcionGeneral && item.descripcionGeneral.toLowerCase().includes(busqueda.toLowerCase()));

      return coincideArea && coincidePrioridad && coincideBusqueda;
    })
  );

  // Estadísticas rápidas
  let totalActivos = $derived(lista.filter(t => t.estado !== "Terminado").length);
  let totalUrgentes = $derived(lista.filter(t => t.prioridad === "Urgente" && t.estado !== "Terminado").length);
  let totalEnMaquina = $derived(lista.filter(t => t.estado === "Imprimiendo" || t.estado === "Manipulado").length);

  // Función para mover arriba
  async function moverArriba(index: number) {
    if (index <= 0) return;
    const nueva = [...lista];
    const temp = nueva[index];
    nueva[index] = nueva[index - 1];
    nueva[index - 1] = temp;
    recalcularYGuardar(nueva);
  }

  // Función para mover abajo
  async function moverAbajo(index: number) {
    if (index >= lista.length - 1) return;
    const nueva = [...lista];
    const temp = nueva[index];
    nueva[index] = nueva[index + 1];
    nueva[index + 1] = temp;
    recalcularYGuardar(nueva);
  }

  // Función para mover al primer puesto (#1 Top)
  async function moverAlTop(index: number) {
    if (index === 0) return;
    const nueva = [...lista];
    const [elemento] = nueva.splice(index, 1);
    nueva.unshift(elemento);
    recalcularYGuardar(nueva);
  }

  // Recalcula orden 1..N y persiste en el servidor
  async function recalcularYGuardar(nuevaLista: TareaCola[]) {
    nuevaLista.forEach((item, idx) => {
      item.ordenCola = idx + 1;
    });
    lista = nuevaLista;
    guardando = true;

    try {
      const payload = {
        workspaceId: workspace,
        items: nuevaLista.map((t) => ({
          numParte: t.numParte,
          ordenCola: t.ordenCola,
        })),
      };

      const res = await fetch("/api/cola/reordenar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        mostrarToast("Orden de producción actualizado con éxito");
      }
    } catch (e) {
      console.error("Error guardando orden:", e);
      mostrarToast("Error al guardar el nuevo orden");
    } finally {
      guardando = false;
    }
  }

  // Cambiar prioridad de un trabajo
  async function cambiarPrioridad(tarea: TareaCola, nuevaPrioridad: "Urgente" | "Alta" | "Normal" | "Pausa") {
    tarea.prioridad = nuevaPrioridad;
    lista = [...lista];

    try {
      await fetch("/api/actualizar-tarea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tarea.numParte,
          prioridad: nuevaPrioridad,
          workspaceId: workspace,
        }),
      });
      mostrarToast(`Prioridad de #${tarea.numParte} cambiada a ${nuevaPrioridad}`);
    } catch (e) {
      console.error("Error actualizando prioridad:", e);
    }
  }

  // Cambiar estado de un trabajo
  async function cambiarEstado(tarea: TareaCola, nuevoEstado: string) {
    tarea.estado = nuevoEstado;
    lista = [...lista];

    try {
      await fetch("/api/actualizar-tarea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tarea.numParte,
          estado: nuevoEstado,
          workspaceId: workspace,
        }),
      });
      mostrarToast(`Estado de #${tarea.numParte} cambiado a ${nuevoEstado}`);
    } catch (e) {
      console.error("Error actualizando estado:", e);
    }
  }

  function mostrarToast(msg: string) {
    mensajeToast = msg;
    setTimeout(() => {
      if (mensajeToast === msg) mensajeToast = "";
    }, 3000);
  }

  // Helper formato de fecha de salida relativa
  function formatoFechaSalida(f: string): { texto: string; esUrgente: boolean } {
    if (!f) return { texto: "Sin fecha", esUrgente: false };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const target = new Date(f + "T00:00:00");
    const diffDias = Math.round((target.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return { texto: `Vencido (${Math.abs(diffDias)}d)`, esUrgente: true };
    if (diffDias === 0) return { texto: "Hoy", esUrgente: true };
    if (diffDias === 1) return { texto: "Mañana", esUrgente: true };
    if (diffDias <= 3) return { texto: `En ${diffDias} días`, esUrgente: false };
    return { texto: f, esUrgente: false };
  }
</script>

<div class="space-y-6 max-w-7xl mx-auto pb-16">
  
  <!-- ========================================================================= -->
  <!-- CABECERA PRINCIPAL Y ACCESO A PANTALLA TV -->
  <!-- ========================================================================= -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/80 p-6 rounded-3xl shadow-xs">
    <div class="space-y-1">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
          <SlidersHorizontal class="w-5 h-5" />
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Cola de Producción y Prioridades
            <Badge variant="outline" class="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
              Taller Vivo
            </Badge>
          </h1>
          <p class="text-xs text-muted-foreground">
            Arrastra, sube o prioriza los pedidos para ordenar qué trabajo entra antes a máquinas.
          </p>
        </div>
      </div>
    </div>

    <!-- Botón Destacado: Abrir Pantalla de TV Taller -->
    <div class="flex items-center gap-3">
      <a
        href={`/w/${workspace}/tv`}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        title="Abrir en pantalla completa para monitores o televisores de taller"
      >
        <Tv class="w-4 h-4" />
        <span>📺 Abrir Pantalla Taller (TV)</span>
        <ExternalLink class="w-3.5 h-3.5 opacity-80" />
      </a>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- TARJETAS DE RESUMEN / MÉTRICAS RÁPIDAS -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="bg-card border border-border/70 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
      <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm">
        {totalActivos}
      </div>
      <div>
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">En Cola Total</span>
        <span class="text-xs font-bold text-foreground">Pedidos activos</span>
      </div>
    </div>

    <div class="bg-card border border-border/70 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
      <div class="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold text-sm">
        {totalUrgentes}
      </div>
      <div>
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Urgentes</span>
        <span class="text-xs font-bold text-red-600 dark:text-red-400">Prioridad máxima</span>
      </div>
    </div>

    <div class="bg-card border border-border/70 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
      <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
        {totalEnMaquina}
      </div>
      <div>
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">En Máquina</span>
        <span class="text-xs font-bold text-foreground">Imprimiendo / Man.</span>
      </div>
    </div>

    <div class="bg-card border border-border/70 p-4 rounded-2xl flex items-center gap-3 shadow-2xs">
      <div class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
        <Clock class="w-4 h-4" />
      </div>
      <div>
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Sincronización</span>
        <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> En Vivo
        </span>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- BARRA DE HERRAMIENTAS: BÚSQUEDA Y FILTROS -->
  <!-- ========================================================================= -->
  <div class="bg-card border border-border/80 p-4 rounded-2xl shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
    
    <!-- Filtro por Área -->
    <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
      <span class="text-muted-foreground font-semibold text-[11px] uppercase mr-1">Área:</span>
      {#each areasDisponibles as area}
        <button
          type="button"
          onclick={() => (filtroArea = area)}
          class="px-2.5 py-1 rounded-lg font-semibold transition-all border {filtroArea === area
            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
            : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted'}"
        >
          {area}
        </button>
      {/each}
    </div>

    <!-- Buscador y filtro de prioridad -->
    <div class="flex items-center gap-2 w-full md:w-auto">
      <div class="relative flex-1 md:w-56">
        <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          bind:value={busqueda}
          placeholder="Buscar parte o cliente..."
          class="h-8 w-full rounded-xl border border-input bg-background pl-8 pr-3 text-xs font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <select
        bind:value={filtroPrioridad}
        class="h-8 rounded-xl border border-input bg-background px-2.5 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="TODAS">Prioridad: Todas</option>
        <option value="Urgente">🔴 Urgentes</option>
        <option value="Alta">🟡 Alta</option>
        <option value="Normal">⚪ Normal</option>
        <option value="Pausa">⏸️ En Pausa</option>
      </select>
    </div>
  </div>

  <!-- Toast flotante de confirmación -->
  {#if mensajeToast}
    <div 
      transition:slide={{ duration: 150 }}
      class="p-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-lg flex items-center justify-between"
    >
      <span class="flex items-center gap-2">
        <CheckCircle2 class="w-4 h-4 text-emerald-400" /> {mensajeToast}
      </span>
      {#if guardando}
        <RefreshCw class="w-3.5 h-3.5 animate-spin" />
      {/if}
    </div>
  {/if}

  <!-- ========================================================================= -->
  <!-- LISTADO ORDENADO DE LA COLA -->
  <!-- ========================================================================= -->
  <div class="space-y-3">
    {#if listaFiltrada.length === 0}
      <div class="bg-card border border-border/80 rounded-3xl p-12 text-center space-y-2">
        <p class="text-sm font-semibold text-muted-foreground">No hay trabajos activos que coincidan con el filtro.</p>
        <p class="text-xs text-muted-foreground">Prueba a seleccionar "TODAS" o despejar la búsqueda.</p>
      </div>
    {:else}
      {#each listaFiltrada as item, idx (item.numParte)}
        {@const ordenVisible = idx + 1}
        {@const esPrimero = ordenVisible === 1}
        {@const cfgPrioridad = configPrioridad[item.prioridad] || configPrioridad.Normal}
        {@const infoFecha = formatoFechaSalida(item.fechaSalida)}

        <div
          class="bg-card rounded-2xl border transition-all duration-200 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs {esPrimero
            ? 'border-primary ring-2 ring-primary/20 bg-gradient-to-r from-card to-primary/5'
            : item.prioridad === 'Urgente'
              ? 'border-red-500/40 bg-red-500/5'
              : 'border-border/80 hover:border-border'}"
          transition:slide={{ duration: 150 }}
        >
          <!-- 1. IDENTIFICACIÓN Y POSICIÓN -->
          <div class="flex items-center gap-3 min-w-[200px]">
            <!-- Número de orden gigante -->
            <div
              class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 shadow-xs {esPrimero
                ? 'bg-primary text-primary-foreground scale-105'
                : 'bg-muted text-muted-foreground'}"
              title={`Posición #${ordenVisible} en la cola de producción`}
            >
              #{ordenVisible}
            </div>

            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                <span class="font-mono font-bold text-xs text-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
                  #{item.numParte}
                </span>
                {#if esPrimero}
                  <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                    En Máquina
                  </span>
                {/if}
              </div>
              <h3 class="font-bold text-sm text-foreground truncate max-w-[220px]">
                {item.cliente}
              </h3>
            </div>
          </div>

          <!-- 2. DETALLES DEL TRABAJO Y PRODUCTO -->
          <div class="flex-1 space-y-1">
            <p class="text-xs text-foreground font-medium line-clamp-1">
              {item.descripcionGeneral || "Sin descripción general especificada"}
            </p>

            <!-- Desgloses / Unidades -->
            <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              {#if item.desgloses && item.desgloses.length > 0}
                {#each item.desgloses.slice(0, 2) as d}
                  <span class="bg-muted px-2 py-0.5 rounded-md font-mono font-semibold text-foreground">
                    {d.cantidad.toLocaleString()} unids
                  </span>
                {/each}
                {#if item.desgloses.length > 2}
                  <span class="text-[10px] text-muted-foreground">+{item.desgloses.length - 2} más</span>
                {/if}
              {/if}

              {#if item.area}
                <span class="bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold text-[10px] uppercase">
                  {item.area}
                </span>
              {/if}

              {#if item.laminadoTipo && item.laminadoTipo !== "Sin laminado"}
                <span class="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                  {item.laminadoTipo}
                </span>
              {/if}
            </div>
          </div>

          <!-- 3. FECHA SALIDA Y SELECTOR DE PRIORIDAD -->
          <div class="flex items-center gap-3 min-w-[220px]">
            <!-- Fecha salida -->
            <div class="text-right space-y-0.5">
              <span class="text-[10px] font-semibold text-muted-foreground block uppercase">Entrega:</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded-lg {infoFecha.esUrgente ? 'bg-red-500/15 text-red-600 dark:text-red-400 font-black' : 'text-foreground'}">
                {infoFecha.texto}
              </span>
            </div>

            <!-- Selector de Prioridad -->
            <div class="flex flex-col gap-1">
              <span class="text-[10px] font-semibold text-muted-foreground uppercase">Prioridad:</span>
              <select
                value={item.prioridad}
                onchange={(e) => cambiarPrioridad(item, (e.target as HTMLSelectElement).value as any)}
                class="h-7 text-xs font-bold rounded-lg border px-2 {cfgPrioridad.bg} {cfgPrioridad.color} cursor-pointer focus:outline-none"
              >
                <option value="Urgente">🔴 Urgente</option>
                <option value="Alta">🟡 Alta</option>
                <option value="Normal">⚪ Normal</option>
                <option value="Pausa">⏸️ En Pausa</option>
              </select>
            </div>

            <!-- Selector de Estado de Producción -->
            <div class="flex flex-col gap-1">
              <span class="text-[10px] font-semibold text-muted-foreground uppercase">Estado:</span>
              <select
                value={item.estado}
                onchange={(e) => cambiarEstado(item, (e.target as HTMLSelectElement).value)}
                class="h-7 text-xs font-semibold rounded-lg border border-border bg-background px-2 text-foreground cursor-pointer focus:outline-none"
              >
                {#each estadosProduccion as est}
                  <option value={est}>{est}</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- 4. BOTONES DE REORDENACIÓN EN COLA -->
          <div class="flex items-center gap-1.5 border-t md:border-t-0 md:border-l border-border/70 pt-2 md:pt-0 md:pl-3 w-full md:w-auto justify-end">
            <!-- Botón Hacer Primero (Top 1) -->
            <button
              type="button"
              onclick={() => moverAlTop(idx)}
              disabled={esPrimero}
              class="h-8 px-2.5 rounded-xl border border-border bg-muted/30 hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/40 text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none"
              title="Colocar inmediatamente en la posición #1 para entrar a máquina ahora"
            >
              <Zap class="w-3.5 h-3.5 text-amber-500" />
              <span class="hidden lg:inline">Hacer 1º</span>
            </button>

            <!-- Subir un puesto -->
            <button
              type="button"
              onclick={() => moverArriba(idx)}
              disabled={esPrimero}
              class="w-8 h-8 rounded-xl border border-border bg-muted/30 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
              title="Subir un puesto en la cola de producción"
            >
              <ArrowUp class="w-4 h-4" />
            </button>

            <!-- Bajar un puesto -->
            <button
              type="button"
              onclick={() => moverAbajo(idx)}
              disabled={ordenVisible === listaFiltrada.length}
              class="w-8 h-8 rounded-xl border border-border bg-muted/30 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
              title="Bajar un puesto en la cola de producción"
            >
              <ArrowDown class="w-4 h-4" />
            </button>

            <!-- Ver parte PDF / Imprimir -->
            <a
              href={`/w/${workspace}/parte/${item.numParte}/print`}
              target="_blank"
              class="w-8 h-8 rounded-xl border border-border bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
              title="Ver ficha técnica de producción para imprimir"
            >
              <FileText class="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      {/each}
    {/if}
  </div>

</div>
