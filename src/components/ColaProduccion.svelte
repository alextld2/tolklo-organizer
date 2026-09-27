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
    Tag,
    GripVertical,
    ChevronsUp,
    ChevronsDown,
    ArrowUpDown,
    LayoutList,
    LayoutGrid,
    Wand2,
    X,
    Hash,
    Info,
    Check,
    HelpCircle
  } from "lucide-svelte";
  import { slide, fade } from "svelte/transition";
  import { Button } from "./ui/button";
  import { Badge } from "./ui/badge";

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
  let filtroEstado = $state<string>("TODOS");
  let busqueda = $state<string>("");
  let guardando = $state<boolean>(false);
  let mensajeToast = $state<string>("");

  // Modo de visualización: 'compacta' (alta densidad para muchas tareas) o 'detallada' (tarjetas grandes)
  let modoVista = $state<"compacta" | "detallada">("compacta");

  // Estado para el modal de "Mover a posición específica"
  let modalMover = $state<{
    abierto: boolean;
    tarea: TareaCola | null;
    posicionDeseada: number;
  }>({
    abierto: false,
    tarea: null,
    posicionDeseada: 1,
  });

  // Estado para el modal de auto-ordenación inteligente
  let modalAutoorden = $state<boolean>(false);

  // Estado de Drag & Drop
  let draggedNumParte = $state<string | null>(null);
  let dropTarget = $state<{ numParte: string; position: "before" | "after" } | null>(null);

  // Inicialización de la lista ordenada
  $effect(() => {
    const copia = [...tareas].map((t, idx) => ({
      ...t,
      prioridad: (t.prioridad || "Normal") as "Urgente" | "Alta" | "Normal" | "Pausa",
      ordenCola: t.ordenCola && t.ordenCola > 0 ? t.ordenCola : idx + 1
    }));
    copia.sort((a, b) => a.ordenCola - b.ordenCola);
    copia.forEach((item, index) => {
      item.ordenCola = index + 1;
    });
    lista = copia;
  });

  // Áreas disponibles
  const areasDisponibles = ["TODAS", "DIGITAL", "OFFSET", "PLOTTER", "MIMAKI", "MANIPULADO"];

  // Configuración de prioridades con colores y etiquetas
  const configPrioridad: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    Urgente: { color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: Flame, label: "Urgente" },
    Alta: { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: AlertCircle, label: "Alta" },
    Normal: { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: Clock, label: "Normal" },
    Pausa: { color: "text-neutral-500 dark:text-neutral-400", bg: "bg-neutral-500/10 border-neutral-500/30", icon: Layers, label: "En Pausa" }
  };

  // Estados de producción disponibles
  const estadosProduccion = ["Por hacer", "Imprimiendo", "Manipulado", "Urgente", "Terminado"];

  // Conteo dinámico de tareas por área para los botones de filtrado
  let conteoPorArea = $derived({
    TODAS: lista.length,
    DIGITAL: lista.filter(t => t.area && t.area.toUpperCase().includes("DIGITAL")).length,
    OFFSET: lista.filter(t => t.area && t.area.toUpperCase().includes("OFFSET")).length,
    PLOTTER: lista.filter(t => t.area && t.area.toUpperCase().includes("PLOTTER")).length,
    MIMAKI: lista.filter(t => t.area && t.area.toUpperCase().includes("MIMAKI")).length,
    MANIPULADO: lista.filter(t => t.area && t.area.toUpperCase().includes("MANIPULADO")).length,
  });

  // Filtrado de la lista reactivo
  let listaFiltrada = $derived(
    lista.filter((item) => {
      const coincideArea =
        filtroArea === "TODAS" ||
        (item.area && item.area.toUpperCase().includes(filtroArea));
      const coincidePrioridad =
        filtroPrioridad === "TODAS" || item.prioridad === filtroPrioridad;
      const coincideEstado =
        filtroEstado === "TODOS" || item.estado === filtroEstado;
      const coincideBusqueda =
        !busqueda.trim() ||
        item.numParte.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.descripcionGeneral && item.descripcionGeneral.toLowerCase().includes(busqueda.toLowerCase()));

      return coincideArea && coincidePrioridad && coincideEstado && coincideBusqueda;
    })
  );

  let hayFiltrosActivos = $derived(
    filtroArea !== "TODAS" || filtroPrioridad !== "TODAS" || filtroEstado !== "TODOS" || busqueda.trim() !== ""
  );

  // Estadísticas rápidas
  let totalActivos = $derived(lista.filter(t => t.estado !== "Terminado").length);
  let totalUrgentes = $derived(lista.filter(t => t.prioridad === "Urgente" && t.estado !== "Terminado").length);
  let totalEnMaquina = $derived(lista.filter(t => t.estado === "Imprimiendo" || t.estado === "Manipulado").length);

  // =========================================================================
  // LÓGICA DE REORDENACIÓN SEGURA BASADA EN numParte (COLA GLOBAL)
  // =========================================================================

  // Mover una posición hacia arriba (Adelantar 1 puesto)
  function moverArriba(numParte: string, paso: number = 1) {
    const currentIndex = lista.findIndex(t => t.numParte === numParte);
    if (currentIndex <= 0) return;
    const targetIndex = Math.max(0, currentIndex - paso);
    if (targetIndex === currentIndex) return;

    const nueva = [...lista];
    const [elemento] = nueva.splice(currentIndex, 1);
    nueva.splice(targetIndex, 0, elemento);
    recalcularYGuardar(nueva);
  }

  // Mover una posición hacia abajo (Atrasar 1 puesto)
  function moverAbajo(numParte: string, paso: number = 1) {
    const currentIndex = lista.findIndex(t => t.numParte === numParte);
    if (currentIndex === -1 || currentIndex >= lista.length - 1) return;
    const targetIndex = Math.min(lista.length - 1, currentIndex + paso);
    if (targetIndex === currentIndex) return;

    const nueva = [...lista];
    const [elemento] = nueva.splice(currentIndex, 1);
    nueva.splice(targetIndex, 0, elemento);
    recalcularYGuardar(nueva);
  }

  // Mover a la primera posición (#1 Top - En máquina ahora)
  function moverAlTop(numParte: string) {
    const currentIndex = lista.findIndex(t => t.numParte === numParte);
    if (currentIndex <= 0) return;
    const nueva = [...lista];
    const [elemento] = nueva.splice(currentIndex, 1);
    nueva.unshift(elemento);
    recalcularYGuardar(nueva, `Pedido #${numParte} adelantado a la posición #1 (En máquina)`);
  }

  // Mover al final de la cola
  function moverAlFinal(numParte: string) {
    const currentIndex = lista.findIndex(t => t.numParte === numParte);
    if (currentIndex === -1 || currentIndex === lista.length - 1) return;
    const nueva = [...lista];
    const [elemento] = nueva.splice(currentIndex, 1);
    nueva.push(elemento);
    recalcularYGuardar(nueva, `Pedido #${numParte} atrasado al final de la cola (#${lista.length})`);
  }

  // Mover a una posición exacta especificada (1-indexed)
  function moverAPosicion(numParte: string, targetPos1Based: number) {
    const currentIndex = lista.findIndex(t => t.numParte === numParte);
    if (currentIndex === -1) return;
    const targetIndex = Math.max(0, Math.min(lista.length - 1, targetPos1Based - 1));
    if (targetIndex === currentIndex) return;

    const nueva = [...lista];
    const [elemento] = nueva.splice(currentIndex, 1);
    nueva.splice(targetIndex, 0, elemento);
    recalcularYGuardar(nueva, `Pedido #${numParte} movido al puesto #${targetIndex + 1}`);
  }

  // Recalcula orden 1..N y persiste en el servidor
  async function recalcularYGuardar(nuevaLista: TareaCola[], mensajeConfirmacion?: string) {
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
        mostrarToast(mensajeConfirmacion || "Orden de producción actualizado con éxito");
      } else {
        mostrarToast("Error al guardar en el servidor");
      }
    } catch (e) {
      console.error("Error guardando orden:", e);
      mostrarToast("Error de conexión al guardar el orden");
    } finally {
      guardando = false;
    }
  }

  // =========================================================================
  // DRAG & DROP FLUIDO CON INDICADOR DE INSERCIÓN
  // =========================================================================

  function handleDragStart(e: DragEvent, numParte: string) {
    draggedNumParte = numParte;
    if (e.dataTransfer) {
      e.dataTransfer.setData("text/plain", numParte);
      e.dataTransfer.effectAllowed = "move";
    }
  }

  function handleDragOver(e: DragEvent, targetNumParte: string) {
    e.preventDefault();
    if (!draggedNumParte || draggedNumParte === targetNumParte) return;

    const targetEl = e.currentTarget as HTMLElement;
    const rect = targetEl.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const position = offsetY < rect.height / 2 ? "before" : "after";

    dropTarget = { numParte: targetNumParte, position };
  }

  function handleDragLeave() {
    // Si salimos sin soltar en otro elemento, dejamos que ondragend limpie
  }

  function handleDragEnd() {
    draggedNumParte = null;
    dropTarget = null;
  }

  function handleDrop(e: DragEvent, targetNumParte: string) {
    e.preventDefault();
    if (!draggedNumParte || draggedNumParte === targetNumParte) {
      handleDragEnd();
      return;
    }

    const fromIndex = lista.findIndex(t => t.numParte === draggedNumParte);
    if (fromIndex === -1) {
      handleDragEnd();
      return;
    }

    const nueva = [...lista];
    const [elemento] = nueva.splice(fromIndex, 1);

    let toIndex = nueva.findIndex(t => t.numParte === targetNumParte);
    if (dropTarget?.position === "after") {
      toIndex += 1;
    }

    nueva.splice(toIndex, 0, elemento);
    handleDragEnd();
    recalcularYGuardar(nueva, `Pedido #${draggedNumParte} reordenado con éxito`);
  }

  // =========================================================================
  // GESTIÓN DEL MODAL DE "MOVER A POSICIÓN"
  // =========================================================================

  function abrirModalMover(tarea: TareaCola) {
    const idx = lista.findIndex(t => t.numParte === tarea.numParte);
    modalMover = {
      abierto: true,
      tarea,
      posicionDeseada: idx !== -1 ? idx + 1 : 1,
    };
  }

  function cerrarModalMover() {
    modalMover.abierto = false;
    modalMover.tarea = null;
  }

  function aplicarModalMover() {
    if (!modalMover.tarea) return;
    moverAPosicion(modalMover.tarea.numParte, modalMover.posicionDeseada);
    cerrarModalMover();
  }

  // =========================================================================
  // ASISTENTE DE AUTO-ORDENACIÓN INTELIGENTE
  // =========================================================================

  function autoordenarPorFecha() {
    const copia = [...lista].sort((a, b) => {
      if (!a.fechaSalida) return 1;
      if (!b.fechaSalida) return -1;
      return a.fechaSalida.localeCompare(b.fechaSalida);
    });
    modalAutoorden = false;
    recalcularYGuardar(copia, "Cola auto-ordenada por fecha de salida más próxima");
  }

  function autoordenarPorPrioridad() {
    const pesoPrioridad: Record<string, number> = { Urgente: 1, Alta: 2, Normal: 3, Pausa: 4 };
    const copia = [...lista].sort((a, b) => {
      const pesoA = pesoPrioridad[a.prioridad] || 3;
      const pesoB = pesoPrioridad[b.prioridad] || 3;
      if (pesoA !== pesoB) return pesoA - pesoB;
      if (a.fechaSalida && b.fechaSalida) return a.fechaSalida.localeCompare(b.fechaSalida);
      return 0;
    });
    modalAutoorden = false;
    recalcularYGuardar(copia, "Cola auto-ordenada priorizando Urgentes y Alta");
  }

  function autoordenarPorArea() {
    const copia = [...lista].sort((a, b) => {
      const areaA = (a.area || "").toUpperCase();
      const areaB = (b.area || "").toUpperCase();
      if (areaA !== areaB) return areaA.localeCompare(areaB);
      if (a.fechaSalida && b.fechaSalida) return a.fechaSalida.localeCompare(b.fechaSalida);
      return 0;
    });
    modalAutoorden = false;
    recalcularYGuardar(copia, "Cola agrupada por área técnica de producción");
  }

  // =========================================================================
  // CAMBIOS DE PRIORIDAD Y ESTADO
  // =========================================================================

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
    }, 3200);
  }

  // Formato relativo de fecha de salida
  function formatoFechaSalida(f: string): { texto: string; esUrgente: boolean; clase: string } {
    if (!f) return { texto: "Sin fecha", esUrgente: false, clase: "text-muted-foreground bg-muted/40" };
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const target = new Date(f + "T00:00:00");
    const diffDias = Math.round((target.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDias < 0) return { texto: `Vencido (${Math.abs(diffDias)}d)`, esUrgente: true, clase: "text-red-700 dark:text-red-300 bg-red-500/15 border-red-500/30 font-black animate-pulse" };
    if (diffDias === 0) return { texto: "Hoy", esUrgente: true, clase: "text-red-600 dark:text-red-400 bg-red-500/15 border-red-500/30 font-black" };
    if (diffDias === 1) return { texto: "Mañana", esUrgente: true, clase: "text-amber-700 dark:text-amber-400 bg-amber-500/15 border-amber-500/30 font-bold" };
    if (diffDias <= 3) return { texto: `En ${diffDias} días`, esUrgente: false, clase: "text-foreground bg-muted/60" };
    return { texto: f, esUrgente: false, clase: "text-muted-foreground bg-muted/30" };
  }

  // Suma total de unidades de una tarea
  function totalUnidades(item: TareaCola): number {
    if (!item.desgloses || item.desgloses.length === 0) return 0;
    return item.desgloses.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);
  }
</script>

<div class="space-y-5 max-w-7xl mx-auto pb-16">
  
  <!-- ========================================================================= -->
  <!-- CABECERA PRINCIPAL Y ACCESO A PANTALLA TV -->
  <!-- ========================================================================= -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/80 p-5 sm:p-6 rounded-3xl shadow-xs">
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
            Arrastra, adelanta, atrasa o asigna posiciones exactas para organizar el flujo de máquinas.
          </p>
        </div>
      </div>
    </div>

    <!-- Botones Superiores: Vistas, Auto-ordenar y Pantalla TV -->
    <div class="flex flex-wrap items-center gap-2.5">
      <!-- Selector de Modo de Vista (Compacta vs Detallada) -->
      <div class="inline-flex rounded-xl border border-border/80 bg-muted/40 p-0.5 shadow-2xs">
        <button
          type="button"
          onclick={() => (modoVista = "compacta")}
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all {modoVista === 'compacta'
            ? 'bg-card text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'}"
          title="Vista compacta: máxima visibilidad de muchas tareas a la vez"
        >
          <LayoutList class="w-3.5 h-3.5" />
          <span>Compacta</span>
        </button>
        <button
          type="button"
          onclick={() => (modoVista = "detallada")}
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all {modoVista === 'detallada'
            ? 'bg-card text-foreground shadow-xs'
            : 'text-muted-foreground hover:text-foreground'}"
          title="Vista detallada: fichas completas con acabados y desgloses"
        >
          <LayoutGrid class="w-3.5 h-3.5" />
          <span>Fichas</span>
        </button>
      </div>

      <!-- Botón de Auto-ordenar Asistido -->
      <button
        type="button"
        onclick={() => (modalAutoorden = true)}
        class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/80 bg-card hover:bg-muted text-xs font-semibold text-foreground transition-all shadow-2xs"
        title="Opciones automáticas para reordenar la cola completa"
      >
        <Wand2 class="w-3.5 h-3.5 text-primary" />
        <span class="hidden sm:inline">Auto-ordenar</span>
      </button>

      <!-- Botón Pantalla TV Taller -->
      <a
        href={`/w/${workspace}/tv`}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-xs shadow-sm shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        title="Abrir en pantalla completa para monitores o televisores de taller"
      >
        <Tv class="w-3.5 h-3.5" />
        <span>Pantalla TV</span>
        <ExternalLink class="w-3 h-3 opacity-80" />
      </a>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- TARJETAS DE RESUMEN / MÉTRICAS RÁPIDAS -->
  <!-- ========================================================================= -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div class="bg-card border border-border/70 p-3.5 rounded-2xl flex items-center gap-3 shadow-2xs">
      <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm">
        {totalActivos}
      </div>
      <div>
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">En Cola Total</span>
        <span class="text-xs font-bold text-foreground">Pedidos activos</span>
      </div>
    </div>

    <div class="bg-card border border-border/70 p-3.5 rounded-2xl flex items-center gap-3 shadow-2xs">
      <div class="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold text-sm">
        {totalUrgentes}
      </div>
      <div>
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Urgentes</span>
        <span class="text-xs font-bold text-red-600 dark:text-red-400">Prioridad máxima</span>
      </div>
    </div>

    <div class="bg-card border border-border/70 p-3.5 rounded-2xl flex items-center gap-3 shadow-2xs">
      <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
        {totalEnMaquina}
      </div>
      <div>
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">En Máquina</span>
        <span class="text-xs font-bold text-foreground">Imprimiendo / Man.</span>
      </div>
    </div>

    <div class="bg-card border border-border/70 p-3.5 rounded-2xl flex items-center gap-3 shadow-2xs">
      <div class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
        <Clock class="w-4 h-4" />
      </div>
      <div>
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Sincronización</span>
        <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {guardando ? "Guardando..." : "En Vivo"}
        </span>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- BARRA DE HERRAMIENTAS: BÚSQUEDA Y FILTROS -->
  <!-- ========================================================================= -->
  <div class="bg-card border border-border/80 p-3.5 rounded-2xl shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
    
    <!-- Filtro por Área con contadores dinámicos -->
    <div class="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
      <span class="text-muted-foreground font-semibold text-[11px] uppercase mr-1 flex-shrink-0">Área:</span>
      {#each areasDisponibles as area}
        {@const conteo = (conteoPorArea as any)[area] ?? 0}
        <button
          type="button"
          onclick={() => (filtroArea = area)}
          class="px-2.5 py-1 rounded-lg font-semibold transition-all border flex items-center gap-1.5 flex-shrink-0 {filtroArea === area
            ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
            : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground'}"
        >
          <span>{area}</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full {filtroArea === area ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}">
            {conteo}
          </span>
        </button>
      {/each}
    </div>

    <!-- Buscador, filtro de prioridad y estado -->
    <div class="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
      <div class="relative flex-1 sm:w-52">
        <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          bind:value={busqueda}
          placeholder="Buscar parte o cliente..."
          class="h-8 w-full rounded-xl border border-input bg-background pl-8 pr-7 text-xs font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {#if busqueda}
          <button
            type="button"
            onclick={() => (busqueda = "")}
            class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X class="w-3 h-3" />
          </button>
        {/if}
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

      <select
        bind:value={filtroEstado}
        class="h-8 rounded-xl border border-input bg-background px-2.5 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="TODOS">Estado: Todos</option>
        {#each estadosProduccion as est}
          <option value={est}>{est}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Aviso de filtro activo si el usuario ha filtrado la lista -->
  {#if hayFiltrosActivos}
    <div class="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
      <span class="flex items-center gap-2">
        <Info class="w-3.5 h-3.5 flex-shrink-0" />
        <span>Mostrando <strong>{listaFiltrada.length}</strong> de <strong>{lista.length}</strong> trabajos en cola. Las acciones de mover modifican la posición global de taller.</span>
      </span>
      <button
        type="button"
        onclick={() => { filtroArea = "TODAS"; filtroPrioridad = "TODAS"; filtroEstado = "TODOS"; busqueda = ""; }}
        class="font-bold underline hover:opacity-80 ml-2"
      >
        Limpiar filtros
      </button>
    </div>
  {/if}

  <!-- Toast flotante de confirmación -->
  {#if mensajeToast}
    <div 
      transition:slide={{ duration: 150 }}
      class="p-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-lg flex items-center justify-between sticky top-4 z-40"
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
  <!-- LISTADO ORDENADO DE LA COLA (VISTA COMPACTA O VISTA DETALLADA) -->
  <!-- ========================================================================= -->
  <div class="space-y-2">
    {#if listaFiltrada.length === 0}
      <div class="bg-card border border-border/80 rounded-3xl p-12 text-center space-y-2">
        <p class="text-sm font-semibold text-muted-foreground">No hay trabajos activos que coincidan con el filtro.</p>
        <p class="text-xs text-muted-foreground">Prueba a seleccionar "TODAS" o despejar la búsqueda.</p>
      </div>
    {:else}

      <!-- ===================================================================== -->
      <!-- MODO VISTA COMPACTA: Filas densas y ágiles para muchas tareas -->
      <!-- ===================================================================== -->
      {#if modoVista === "compacta"}
        <!-- Encabezado de columnas de la vista compacta -->
        <div class="hidden md:grid grid-cols-[38px_60px_90px_1fr_90px_110px_120px_120px_170px] gap-2 px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          <div class="text-center" title="Arrastra desde el asa para reordenar">Mover</div>
          <div>Cola</div>
          <div>Parte</div>
          <div>Cliente / Trabajo</div>
          <div>Unidades</div>
          <div>Área</div>
          <div>Entrega</div>
          <div>Prioridad</div>
          <div class="text-right">Acciones</div>
        </div>

        <div class="space-y-1.5">
          {#each listaFiltrada as item (item.numParte)}
            {@const posReal = item.ordenCola}
            {@const esPrimero = posReal === 1}
            {@const esSiguiente = posReal === 2 || posReal === 3}
            {@const cfgPrioridad = configPrioridad[item.prioridad] || configPrioridad.Normal}
            {@const infoFecha = formatoFechaSalida(item.fechaSalida)}
            {@const isDragging = draggedNumParte === item.numParte}
            {@const isDropTarget = dropTarget?.numParte === item.numParte}
            {@const total = totalUnidades(item)}
            {@const insertionClass = isDropTarget 
              ? dropTarget?.position === 'before'
                ? 'border-t-2 !border-t-primary shadow-[0_-3px_8px_rgba(59,130,246,0.25)]'
                : 'border-b-2 !border-b-primary shadow-[0_3px_8px_rgba(59,130,246,0.25)]'
              : ''}

            <div
              draggable="true"
              ondragstart={(e) => handleDragStart(e, item.numParte)}
              ondragover={(e) => handleDragOver(e, item.numParte)}
              ondragleave={handleDragLeave}
              ondrop={(e) => handleDrop(e, item.numParte)}
              ondragend={handleDragEnd}
              class="group bg-card rounded-xl border transition-all duration-150 p-2.5 md:p-2 flex flex-col md:grid md:grid-cols-[38px_60px_90px_1fr_90px_110px_120px_120px_170px] md:items-center gap-2 md:gap-2 shadow-2xs select-none {insertionClass} {isDragging
                ? 'opacity-30 border-dashed border-primary bg-primary/5'
                : esPrimero
                  ? 'border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                  : item.prioridad === 'Urgente'
                    ? 'border-red-500/40 bg-red-500/5'
                    : 'border-border/70 hover:border-border hover:bg-muted/20'}"
            >
              <!-- 1. Agarrador Drag & Drop -->
              <div class="hidden md:flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground/60 group-hover:text-foreground">
                <GripVertical class="w-4 h-4" />
              </div>

              <!-- 2. Posición en Cola (Clic abre modal para mover a posición exacta) -->
              <div class="flex items-center gap-2 md:block">
                <button
                  type="button"
                  onclick={() => abrirModalMover(item)}
                  class="w-12 md:w-auto h-7 px-2 rounded-lg font-black text-xs flex items-center justify-center transition-all hover:scale-105 shadow-2xs {esPrimero
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : esSiguiente
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'}"
                  title="Haz clic para cambiar la posición exacta en la cola"
                >
                  #{posReal}
                </button>
                {#if esPrimero}
                  <span class="md:hidden text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
                    En Máquina
                  </span>
                {/if}
              </div>

              <!-- 3. Nº de Parte -->
              <div>
                <a
                  href={`/w/${workspace}/parte/${item.numParte}/print`}
                  target="_blank"
                  class="font-mono font-bold text-xs text-foreground bg-muted/60 hover:bg-muted px-2 py-1 rounded-md inline-block transition-colors"
                  title="Ver ficha técnica"
                >
                  #{item.numParte}
                </a>
              </div>

              <!-- 4. Cliente y Descripción -->
              <div class="min-w-0 pr-2">
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-xs text-foreground truncate" title={item.cliente}>
                    {item.cliente}
                  </h3>
                  {#if esPrimero}
                    <span class="hidden lg:inline text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500 text-white">
                      En Máquina
                    </span>
                  {/if}
                </div>
                <p class="text-[11px] text-muted-foreground truncate" title={item.descripcionGeneral}>
                  {item.descripcionGeneral || "Sin descripción"}
                </p>
              </div>

              <!-- 5. Unidades / Desglose -->
              <div>
                {#if total > 0}
                  <span class="text-xs font-mono font-semibold text-foreground bg-muted/50 px-2 py-0.5 rounded-md inline-block">
                    {total.toLocaleString()} u.
                  </span>
                {:else}
                  <span class="text-xs text-muted-foreground">—</span>
                {/if}
              </div>

              <!-- 6. Área Técnica -->
              <div>
                {#if item.area}
                  <span class="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase truncate max-w-full inline-block">
                    {item.area}
                  </span>
                {:else}
                  <span class="text-xs text-muted-foreground">—</span>
                {/if}
              </div>

              <!-- 7. Fecha de Entrega -->
              <div>
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md border border-transparent {infoFecha.clase}">
                  {infoFecha.texto}
                </span>
              </div>

              <!-- 8. Selector de Prioridad Rápido -->
              <div>
                <select
                  value={item.prioridad}
                  onchange={(e) => cambiarPrioridad(item, (e.target as HTMLSelectElement).value as any)}
                  class="h-6 text-[11px] font-bold rounded-md border px-1.5 {cfgPrioridad.bg} {cfgPrioridad.color} cursor-pointer focus:outline-none w-full max-w-[110px]"
                >
                  <option value="Urgente">🔴 Urgente</option>
                  <option value="Alta">🟡 Alta</option>
                  <option value="Normal">⚪ Normal</option>
                  <option value="Pausa">⏸️ Pausa</option>
                </select>
              </div>

              <!-- 9. Botones de Acción Rápida (Adelantar, Atrasar, Mover) -->
              <div class="flex items-center justify-end gap-1 border-t md:border-t-0 pt-2 md:pt-0">
                <!-- Adelantar a #1 Top (En máquina) -->
                <button
                  type="button"
                  onclick={() => moverAlTop(item.numParte)}
                  disabled={esPrimero}
                  class="h-7 w-7 rounded-lg border border-border bg-muted/40 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/40 text-[11px] font-bold transition-all flex items-center justify-center disabled:opacity-25 disabled:pointer-events-none"
                  title="Hacer 1º: Poner en primera posición para entrar a máquina ahora"
                >
                  <Zap class="w-3.5 h-3.5 text-amber-500" />
                </button>

                <!-- Adelantar 1 puesto -->
                <button
                  type="button"
                  onclick={() => moverArriba(item.numParte, 1)}
                  disabled={posReal <= 1}
                  class="h-7 w-7 rounded-lg border border-border bg-muted/40 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center disabled:opacity-25 disabled:pointer-events-none"
                  title="Adelantar 1 puesto"
                >
                  <ArrowUp class="w-3.5 h-3.5" />
                </button>

                <!-- Atrasar 1 puesto -->
                <button
                  type="button"
                  onclick={() => moverAbajo(item.numParte, 1)}
                  disabled={posReal >= lista.length}
                  class="h-7 w-7 rounded-lg border border-border bg-muted/40 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center disabled:opacity-25 disabled:pointer-events-none"
                  title="Atrasar 1 puesto"
                >
                  <ArrowDown class="w-3.5 h-3.5" />
                </button>

                <!-- Mover a posición exacta -->
                <button
                  type="button"
                  onclick={() => abrirModalMover(item)}
                  class="h-7 px-2 rounded-lg border border-border bg-muted/40 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/40 text-[11px] font-semibold transition-all flex items-center gap-1"
                  title="Mover a una posición específica"
                >
                  <ArrowUpDown class="w-3 h-3" />
                  <span class="hidden xl:inline">Mover</span>
                </button>

                <!-- Ver / Imprimir Ficha -->
                <a
                  href={`/w/${workspace}/parte/${item.numParte}/print`}
                  target="_blank"
                  class="h-7 w-7 rounded-lg border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
                  title="Ver ficha técnica de producción"
                >
                  <FileText class="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          {/each}
        </div>

      <!-- ===================================================================== -->
      <!-- MODO VISTA DETALLADA: Fichas grandes con todos los detalles técnicos -->
      <!-- ===================================================================== -->
      {:else}
        <div class="space-y-3">
          {#each listaFiltrada as item (item.numParte)}
            {@const posReal = item.ordenCola}
            {@const esPrimero = posReal === 1}
            {@const esSiguiente = posReal === 2 || posReal === 3}
            {@const cfgPrioridad = configPrioridad[item.prioridad] || configPrioridad.Normal}
            {@const infoFecha = formatoFechaSalida(item.fechaSalida)}
            {@const isDragging = draggedNumParte === item.numParte}
            {@const isDropTarget = dropTarget?.numParte === item.numParte}
            {@const insertionClass = isDropTarget 
              ? dropTarget?.position === 'before'
                ? 'border-t-2 !border-t-primary shadow-[0_-3px_8px_rgba(59,130,246,0.25)]'
                : 'border-b-2 !border-b-primary shadow-[0_3px_8px_rgba(59,130,246,0.25)]'
              : ''}

            <div
              draggable="true"
              ondragstart={(e) => handleDragStart(e, item.numParte)}
              ondragover={(e) => handleDragOver(e, item.numParte)}
              ondragleave={handleDragLeave}
              ondrop={(e) => handleDrop(e, item.numParte)}
              ondragend={handleDragEnd}
              class="group bg-card rounded-2xl border transition-all duration-150 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs select-none {insertionClass} {isDragging
                ? 'opacity-30 border-dashed border-primary bg-primary/5'
                : esPrimero
                  ? 'border-emerald-500/60 ring-1 ring-emerald-500/20 bg-gradient-to-r from-card to-emerald-500/5'
                  : item.prioridad === 'Urgente'
                    ? 'border-red-500/40 bg-red-500/5'
                    : 'border-border/80 hover:border-border'}"
            >
              <!-- 1. IDENTIFICACIÓN Y POSICIÓN -->
              <div class="flex items-center gap-3 min-w-[200px]">
                <!-- Agarrador Drag -->
                <div class="cursor-grab active:cursor-grabbing text-muted-foreground/60 group-hover:text-foreground">
                  <GripVertical class="w-4 h-4" />
                </div>

                <!-- Número de orden clicable para mover -->
                <button
                  type="button"
                  onclick={() => abrirModalMover(item)}
                  class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base flex-shrink-0 transition-all hover:scale-105 shadow-xs {esPrimero
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : esSiguiente
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground'}"
                  title="Haz clic para mover a una posición exacta"
                >
                  #{posReal}
                </button>

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
                  <span class="text-xs font-bold px-2 py-0.5 rounded-lg border border-transparent {infoFecha.clase}">
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
                  onclick={() => moverAlTop(item.numParte)}
                  disabled={esPrimero}
                  class="h-8 px-2.5 rounded-xl border border-border bg-muted/30 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/40 text-[11px] font-bold transition-all flex items-center gap-1 disabled:opacity-25 disabled:pointer-events-none"
                  title="Colocar inmediatamente en la posición #1 para entrar a máquina ahora"
                >
                  <Zap class="w-3.5 h-3.5 text-amber-500" />
                  <span class="hidden lg:inline">Hacer 1º</span>
                </button>

                <!-- Subir un puesto -->
                <button
                  type="button"
                  onclick={() => moverArriba(item.numParte, 1)}
                  disabled={posReal <= 1}
                  class="w-8 h-8 rounded-xl border border-border bg-muted/30 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center disabled:opacity-25 disabled:pointer-events-none"
                  title="Subir un puesto en la cola de producción"
                >
                  <ArrowUp class="w-4 h-4" />
                </button>

                <!-- Bajar un puesto -->
                <button
                  type="button"
                  onclick={() => moverAbajo(item.numParte, 1)}
                  disabled={posReal >= lista.length}
                  class="w-8 h-8 rounded-xl border border-border bg-muted/30 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center disabled:opacity-25 disabled:pointer-events-none"
                  title="Bajar un puesto en la cola de producción"
                >
                  <ArrowDown class="w-4 h-4" />
                </button>

                <!-- Mover a posición -->
                <button
                  type="button"
                  onclick={() => abrirModalMover(item)}
                  class="h-8 px-2.5 rounded-xl border border-border bg-muted/30 hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/40 text-[11px] font-bold transition-all flex items-center gap-1"
                  title="Mover a una posición específica"
                >
                  <ArrowUpDown class="w-3.5 h-3.5" />
                  <span class="hidden lg:inline">Mover</span>
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
        </div>
      {/if}

    {/if}
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: MOVER A POSICIÓN EXACTA -->
  <!-- ========================================================================= -->
  {#if modalMover.abierto && modalMover.tarea}
    {@const item = modalMover.tarea}
    {@const posActual = lista.findIndex(t => t.numParte === item.numParte) + 1}

    <div 
      transition:fade={{ duration: 150 }}
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onclick={(e) => { if (e.target === e.currentTarget) cerrarModalMover(); }}
      onkeydown={(e) => { if (e.key === "Escape") cerrarModalMover(); }}
      tabindex="-1"
      role="dialog"
      aria-modal="true"
    >
      <div 
        transition:slide={{ duration: 150 }}
        class="bg-card border border-border/80 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-5"
      >
        <!-- Cabecera del modal -->
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <h3 class="font-bold text-base text-foreground flex items-center gap-2">
              <ArrowUpDown class="w-4 h-4 text-primary" />
              Reordenar Pedido #{item.numParte}
            </h3>
            <p class="text-xs text-muted-foreground">
              Cliente: <strong class="text-foreground">{item.cliente}</strong>
            </p>
          </div>
          <button
            type="button"
            onclick={cerrarModalMover}
            class="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Indicador de posición actual y campo de destino -->
        <div class="bg-muted/40 border border-border/60 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between text-xs">
            <span class="text-muted-foreground">Posición actual en la cola:</span>
            <span class="font-bold text-foreground bg-card border px-2 py-0.5 rounded-md">
              #{posActual} de {lista.length}
            </span>
          </div>

          <div class="space-y-1.5">
            <label for="input-pos-destino" class="text-xs font-semibold text-foreground block">
              Mover a la posición (1 - {lista.length}):
            </label>
            <div class="flex items-center gap-2">
              <input
                id="input-pos-destino"
                type="number"
                min="1"
                max={lista.length}
                bind:value={modalMover.posicionDeseada}
                onkeydown={(e) => { if (e.key === "Enter") aplicarModalMover(); }}
                class="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-center text-base font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onclick={aplicarModalMover}
                class="h-10 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity shadow-xs"
              >
                Mover Aquí
              </button>
            </div>
          </div>
        </div>

        <!-- Botones de Acción Rápida -->
        <div class="space-y-2">
          <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Acciones Rápidas:
          </span>
          <div class="grid grid-cols-2 gap-2">
            <!-- 1º En máquina -->
            <button
              type="button"
              onclick={() => { modalMover.posicionDeseada = 1; aplicarModalMover(); }}
              class="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-border bg-card hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 text-xs font-bold transition-all text-left"
            >
              <Zap class="w-3.5 h-3.5 text-amber-500" />
              <span>1º En Máquina</span>
            </button>

            <!-- Al final de la cola -->
            <button
              type="button"
              onclick={() => { modalMover.posicionDeseada = lista.length; aplicarModalMover(); }}
              class="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold transition-all text-muted-foreground hover:text-foreground"
            >
              <span>Al Final (#{lista.length})</span>
            </button>

            <!-- Adelantar 5 puestos -->
            <button
              type="button"
              onclick={() => { modalMover.posicionDeseada = Math.max(1, posActual - 5); aplicarModalMover(); }}
              disabled={posActual <= 1}
              class="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-all disabled:opacity-30"
            >
              <ChevronsUp class="w-3.5 h-3.5 text-primary" />
              <span>Adelantar 5</span>
            </button>

            <!-- Atrasar 5 puestos -->
            <button
              type="button"
              onclick={() => { modalMover.posicionDeseada = Math.min(lista.length, posActual + 5); aplicarModalMover(); }}
              disabled={posActual >= lista.length}
              class="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-all disabled:opacity-30"
            >
              <ChevronsDown class="w-3.5 h-3.5 text-primary" />
              <span>Atrasar 5</span>
            </button>

            <!-- Adelantar 1 puesto -->
            <button
              type="button"
              onclick={() => { modalMover.posicionDeseada = Math.max(1, posActual - 1); aplicarModalMover(); }}
              disabled={posActual <= 1}
              class="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-all disabled:opacity-30"
            >
              <ArrowUp class="w-3.5 h-3.5" />
              <span>Subir 1</span>
            </button>

            <!-- Atrasar 1 puesto -->
            <button
              type="button"
              onclick={() => { modalMover.posicionDeseada = Math.min(lista.length, posActual + 1); aplicarModalMover(); }}
              disabled={posActual >= lista.length}
              class="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-all disabled:opacity-30"
            >
              <ArrowDown class="w-3.5 h-3.5" />
              <span>Bajar 1</span>
            </button>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
          <button
            type="button"
            onclick={cerrarModalMover}
            class="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onclick={aplicarModalMover}
            class="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
          >
            Aplicar Posición
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- ========================================================================= -->
  <!-- MODAL: ASISTENTE DE AUTO-ORDENACIÓN INTELIGENTE -->
  <!-- ========================================================================= -->
  {#if modalAutoorden}
    <div 
      transition:fade={{ duration: 150 }}
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      onclick={(e) => { if (e.target === e.currentTarget) modalAutoorden = false; }}
      onkeydown={(e) => { if (e.key === "Escape") modalAutoorden = false; }}
      tabindex="-1"
      role="dialog"
      aria-modal="true"
    >
      <div 
        transition:slide={{ duration: 150 }}
        class="bg-card border border-border/80 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-5"
      >
        <div class="flex items-start justify-between">
          <div class="space-y-1">
            <h3 class="font-bold text-base text-foreground flex items-center gap-2">
              <Wand2 class="w-4 h-4 text-primary" />
              Auto-ordenar Cola de Producción
            </h3>
            <p class="text-xs text-muted-foreground">
              Aplica un criterio automático a los {lista.length} trabajos de la cola.
            </p>
          </div>
          <button
            type="button"
            onclick={() => (modalAutoorden = false)}
            class="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-2.5">
          <!-- 1. Por fecha de salida más próxima -->
          <button
            type="button"
            onclick={autoordenarPorFecha}
            class="w-full text-left p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all space-y-1 group"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-foreground flex items-center gap-2">
                <Calendar class="w-3.5 h-3.5 text-primary" />
                Por Fecha de Entrega
              </span>
              <ChevronRight class="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p class="text-[11px] text-muted-foreground">
              Coloca primero los trabajos con entrega más inmediata o vencidos.
            </p>
          </button>

          <!-- 2. Priorizar Urgentes primero -->
          <button
            type="button"
            onclick={autoordenarPorPrioridad}
            class="w-full text-left p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all space-y-1 group"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-foreground flex items-center gap-2">
                <Flame class="w-3.5 h-3.5 text-red-500" />
                Priorizar Urgentes y Alta
              </span>
              <ChevronRight class="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p class="text-[11px] text-muted-foreground">
              Mueve los trabajos marcados como Urgentes y Alta al inicio de la cola.
            </p>
          </button>

          <!-- 3. Agrupar por Área Técnica -->
          <button
            type="button"
            onclick={autoordenarPorArea}
            class="w-full text-left p-3.5 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all space-y-1 group"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-foreground flex items-center gap-2">
                <Layers class="w-3.5 h-3.5 text-blue-500" />
                Agrupar por Área de Producción
              </span>
              <ChevronRight class="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p class="text-[11px] text-muted-foreground">
              Agrupa los trabajos de DIGITAL, OFFSET, PLOTTER, etc., para reducir cambios de máquina.
            </p>
          </button>
        </div>

        <div class="flex items-center justify-end pt-2 border-t border-border/70">
          <button
            type="button"
            onclick={() => (modalAutoorden = false)}
            class="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  {/if}

</div>
