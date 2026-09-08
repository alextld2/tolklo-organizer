<script lang="ts">
  import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
    Calendar,
    Check,
    SearchX,
    Circle,
    CheckCircle2,
    Printer,
    Package,
    Flame,
    Pencil,
    Trash2,
    MoreHorizontal,
    Loader2,
  } from "lucide-svelte";
  import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
  } from "./ui/table";
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuGroup,
  } from "./ui/dropdown-menu";

  // ─── Props ─────────────────────────────────────────────────────────────────
  type Tarea = {
    numParte: number | string;
    cliente: string;
    descripcionGeneral: string;
    comercial: string | null;
    estado: string;
    area: string;
    fechaSalida: string;
    subcontrata: string | null;
    desgloses?: Array<{ descripcionProducto: string; cantidad: number | null }>;
  };

  let {
    tareas = [],
    busquedaGlobal = "",
    listaEstados = [
      "Por hacer",
      "Imprimiendo",
      "Manipulado",
      "Terminado",
      "Urgente",
    ],
    coloresTextoEstado = {} as Record<string, string>,
    onEditarTarea = (_tarea: Tarea) => {},
    onEliminarTarea = (_numParte: number | string) => {},
    onActualizarEstadoRapido = (_numParte: number | string, _estado: string) => {},
  }: {
    tareas?: Tarea[];
    busquedaGlobal?: string;
    listaEstados?: string[];
    coloresTextoEstado?: Record<string, string>;
    onEditarTarea?: (tarea: Tarea) => void;
    onEliminarTarea?: (numParte: number | string) => void;
    onActualizarEstadoRapido?: (numParte: number | string, estado: string) => void;
  } = $props();

  // ─── Iconos de estado ──────────────────────────────────────────────────────
  const ICONOS_ESTADO_LUCIDE: Record<string, any> = {
    Terminado: CheckCircle2,
    Imprimiendo: Printer,
    Manipulado: Package,
    Urgente: Flame,
    "Por hacer": Circle,
  };

  // ─── Lógica de avance de estados ───────────────────────────────────────────
  // Define qué estados pueden alcanzarse desde el estado actual (orden de proceso)
  const ORDEN_ESTADOS = ["Por hacer", "Imprimiendo", "Manipulado", "Terminado"];

  function estadosPermitidos(estadoActual: string): string[] {
    const idx = ORDEN_ESTADOS.indexOf(estadoActual);
    if (idx === -1) {
      // Estados especiales como "Urgente": puede avanzar a cualquier estado del flujo
      return ORDEN_ESTADOS.filter((e) => e !== estadoActual);
    }
    // Solo puede avanzar (no retroceder)
    return ORDEN_ESTADOS.slice(idx + 1);
  }

  // ─── Lógica de Filtrado por Año ────────────────────────────────────────────
  const añoActualNum = new Date().getFullYear();
  const añoActual = añoActualNum.toString();
  let añoSeleccionado = $state(añoActual);
  let dropdownAnioAbierto = $state(false);

  function obtenerAñoTarea(t: Tarea): string {
    // 1. Intentar por fechaSalida (YYYY-MM-DD, DD/MM/YYYY, ISO...)
    if (t.fechaSalida) {
      const str = String(t.fechaSalida).trim();
      const matchIso = str.match(/^(\d{4})/);
      if (matchIso) return matchIso[1];
      const matchEs = str.match(/(\d{4})$/);
      if (matchEs) return matchEs[1];
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d.getFullYear().toString();
    }

    // 2. Si no tiene fechaSalida, intentar extraer del prefijo numParte (ej: "24-1205" -> "2024", "25-1540" -> "2025", "26-1825" -> "2026")
    if (t.numParte) {
      const matchNumParte = String(t.numParte).match(/^(\d{2})-/);
      if (matchNumParte) {
        return `20${matchNumParte[1]}`;
      }
    }

    return "";
  }

  // Lista de años disponibles: mínimo desde 2024 hasta añoActual + 1 (ej: 2027), más cualquier año en los datos
  const añosDisponibles = $derived.by(() => {
    const set = new Set<string>();
    const minAño = 2024;
    const maxAño = Math.max(añoActualNum + 1, 2027);
    for (let y = minAño; y <= maxAño; y++) {
      set.add(y.toString());
    }
    for (const t of tareas || []) {
      const a = obtenerAñoTarea(t);
      if (a) set.add(a);
    }
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  });

  const tareasPorAño = $derived.by(() => {
    if (añoSeleccionado === "todos") return tareas || [];
    return (tareas || []).filter((t) => {
      const a = obtenerAñoTarea(t);
      return a === añoSeleccionado;
    });
  });

  // ─── Pestañas por área ─────────────────────────────────────────────────────
  let vistaActual = $state("todas");

  const vistasArea = [
    { id: "todas", label: "Todas" },
    { id: "digital", label: "Digital", areaId: "Digital" },
    { id: "offset", label: "Offset", areaId: "Offset" },
    { id: "plotter", label: "Plotter", areaId: "Plotter" },
    { id: "opx", label: "OPX", areaId: "OPX" },
    { id: "dtf", label: "DTF", areaId: "DTF" },
    { id: "mimaki", label: "Mimaki", areaId: "Mimaki" },
  ];

  function contarTareasPorVista(vista: (typeof vistasArea)[number]): number {
    if (vista.id === "todas") return tareasPorAño.length;
    return tareasPorAño.filter(
      (t) => t.area.toLowerCase() === (vista.areaId || "").toLowerCase(),
    ).length;
  }

  // ─── Filtrado ──────────────────────────────────────────────────────────────
  const tareasFiltradas = $derived.by(() => {
    return tareasPorAño.filter((t) => {
      if (vistaActual !== "todas") {
        const vistaObj = vistasArea.find((v) => v.id === vistaActual);
        if (vistaObj?.areaId) {
          if (t.area.toLowerCase() !== vistaObj.areaId.toLowerCase())
            return false;
        }
      }
      const query = (busquedaGlobal || "").toLowerCase().trim();
      if (!query) return true;
      return (
        t.numParte.toString().includes(query) ||
        t.cliente.toLowerCase().includes(query) ||
        (t.descripcionGeneral &&
          t.descripcionGeneral.toLowerCase().includes(query)) ||
        t.area.toLowerCase().includes(query) ||
        t.estado.toLowerCase().includes(query)
      );
    });
  });

  // ─── Paginación ────────────────────────────────────────────────────────────
  let paginaActual = $state(1);
  let tareasPorPagina = $state(8);

  $effect(() => {
    // Reset página cuando cambia búsqueda, vista o año
    busquedaGlobal;
    vistaActual;
    añoSeleccionado;
    tareasPorPagina;
    paginaActual = 1;
  });

  const totalTareasFiltradas = $derived(tareasFiltradas.length);
  const totalPaginas = $derived(
    Math.max(1, Math.ceil(totalTareasFiltradas / tareasPorPagina)),
  );
  const tareasPaginadas = $derived(
    tareasFiltradas.slice(
      (paginaActual - 1) * tareasPorPagina,
      paginaActual * tareasPorPagina,
    ),
  );

  // ─── Selección de filas ────────────────────────────────────────────────────
  let filasSeleccionadas = $state(new Set<number | string>());

  const todasPaginaSeleccionadas = $derived(
    tareasPaginadas.length > 0 &&
      tareasPaginadas.every((t) => filasSeleccionadas.has(t.numParte)),
  );

  const algunasPaginaSeleccionadas = $derived(
    tareasPaginadas.some((t) => filasSeleccionadas.has(t.numParte)) &&
      !todasPaginaSeleccionadas,
  );

  function toggleSeleccionarTodasPagina() {
    if (todasPaginaSeleccionadas) {
      tareasPaginadas.forEach((t) => filasSeleccionadas.delete(t.numParte));
    } else {
      tareasPaginadas.forEach((t) => filasSeleccionadas.add(t.numParte));
    }
    filasSeleccionadas = new Set(filasSeleccionadas);
  }

  function toggleSeleccionarFila(numParte: number | string) {
    if (filasSeleccionadas.has(numParte)) {
      filasSeleccionadas.delete(numParte);
    } else {
      filasSeleccionadas.add(numParte);
    }
    filasSeleccionadas = new Set(filasSeleccionadas);
  }
</script>

<div class="flex flex-col space-y-4 w-full">
  <!-- Pestañas de Vista y Selector de Año -->
  <div class="flex flex-wrap items-center justify-between gap-3 px-1">
    <!-- Pestañas por Área -->
    <div
      class="flex items-center gap-1 bg-gray-100/70 dark:bg-[#1E2228]/60 p-1 rounded-2xl overflow-x-auto"
    >
      {#each vistasArea as v (v.id)}
        {@const count = contarTareasPorVista(v)}
        <button
          type="button"
          onclick={() => (vistaActual = v.id)}
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap {vistaActual ===
          v.id
            ? 'bg-white dark:bg-[#16191D] text-[#1A1D21] dark:text-[#EDF0F3] shadow-xs'
            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}"
        >
          <span>{v.label}</span>
          {#if count > 0}
            <span
              class="px-1.5 py-0.5 rounded-full text-[10px] font-bold {vistaActual ===
              v.id
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-[#a4f4cf]'
                : 'bg-gray-200/60 dark:bg-gray-800/60 text-gray-500'}"
            >
              {count}
            </span>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Desplegable Filtro por Año -->
    <div class="relative inline-block text-left">
      <button
        type="button"
        onclick={() => (dropdownAnioAbierto = !dropdownAnioAbierto)}
        class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#232830] bg-white dark:bg-[#1E2228] text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer outline-none shadow-xs text-[#1A1D21] dark:text-[#EDF0F3]"
        aria-haspopup="true"
        aria-expanded={dropdownAnioAbierto}
      >
        <Calendar size={14} class="text-emerald-500" />
        <span>{añoSeleccionado === "todos" ? "Todos los años" : `Año ${añoSeleccionado}`}</span>
        <ChevronDown
          size={13}
          class="text-gray-400 transition-transform duration-200 {dropdownAnioAbierto ? 'rotate-180' : ''}"
        />
      </button>

      {#if dropdownAnioAbierto}
        <!-- Backdrop para cerrar al hacer clic fuera -->
        <div
          class="fixed inset-0 z-40 bg-transparent"
          onclick={() => (dropdownAnioAbierto = false)}
          role="presentation"
        ></div>

        <!-- Menú flotante -->
        <div
          class="absolute right-0 mt-1.5 w-48 rounded-2xl border border-gray-100 dark:border-[#232830] bg-white dark:bg-[#1E2228] p-1.5 shadow-xl z-50 animate-in fade-in-0 zoom-in-95"
        >
          <div class="px-2.5 py-1.5 text-[11px] font-medium text-gray-400 dark:text-gray-500">
            Filtrar por año
          </div>
          <div class="h-px bg-gray-100 dark:bg-[#232830] my-1"></div>

          <div class="max-h-60 overflow-y-auto space-y-0.5">
            {#each añosDisponibles as año (año)}
              <button
                type="button"
                onclick={() => {
                  añoSeleccionado = año;
                  dropdownAnioAbierto = false;
                }}
                class="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer text-left {añoSeleccionado === año ? 'font-bold text-emerald-600 dark:text-[#a4f4cf] bg-emerald-50/70 dark:bg-emerald-500/10' : 'text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-50 dark:hover:bg-gray-800/60'}"
              >
                <div class="flex items-center gap-2">
                  <span>{año}</span>
                  {#if año === añoActual}
                    <span class="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">Actual</span>
                  {/if}
                </div>
                {#if añoSeleccionado === año}
                  <Check size={14} class="text-emerald-500" />
                {/if}
              </button>
            {/each}
          </div>

          <div class="h-px bg-gray-100 dark:bg-[#232830] my-1"></div>

          <button
            type="button"
            onclick={() => {
              añoSeleccionado = "todos";
              dropdownAnioAbierto = false;
            }}
            class="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer text-left {añoSeleccionado === 'todos' ? 'font-bold text-emerald-600 dark:text-[#a4f4cf] bg-emerald-50/70 dark:bg-emerald-500/10' : 'text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-50 dark:hover:bg-gray-800/60'}"
          >
            <span>Todos los años</span>
            {#if añoSeleccionado === "todos"}
              <Check size={14} class="text-emerald-500" />
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- Contenedor Principal de la Tabla -->
  <div
    class="bg-white dark:bg-[#16191D] rounded-3xl border border-[#E9EBF0] dark:border-[#232830] shadow-sm overflow-hidden flex flex-col"
  >
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead class="w-12 px-4">
            <input
              type="checkbox"
              checked={todasPaginaSeleccionadas}
              indeterminate={algunasPaginaSeleccionadas}
              onchange={toggleSeleccionarTodasPagina}
              class="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
              aria-label="Seleccionar todas"
            />
          </TableHead>
          <TableHead class="w-44">Estado</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Fecha de salida</TableHead>
          <TableHead>Área</TableHead>
          <TableHead class="text-right pr-8 w-24">Acciones</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {#each tareasPaginadas as tarea (tarea.numParte)}
          {@const estadosSiguientes = estadosPermitidos(tarea.estado)}
          <TableRow
            data-state={filasSeleccionadas.has(tarea.numParte)
              ? "selected"
              : undefined}
          >
            <TableCell class="px-4">
              <input
                type="checkbox"
                checked={filasSeleccionadas.has(tarea.numParte)}
                onchange={() => toggleSeleccionarFila(tarea.numParte)}
                class="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                aria-label="Seleccionar orden"
              />
            </TableCell>

            <TableCell>
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold {coloresTextoEstado[
                  tarea.estado
                ] || 'text-gray-500 border border-transparent'}"
              >
                {#if tarea.estado === "Terminado"}
                  <!-- Icono relleno verde -->
                  <CheckCircle2
                    size={13}
                    strokeWidth={2}
                    fill="currentColor"
                    class="flex-shrink-0 text-green-500 [&_path]:stroke-white [&_circle]:stroke-white/20"
                  />
                {:else if tarea.estado === "Por hacer"}
                  <Loader2
                    size={13}
                    strokeWidth={2.5}
                    class="flex-shrink-0 animate-spin [animation-duration:2s]"
                  />
                {:else if tarea.estado === "Imprimiendo"}
                  <Printer
                    size={13}
                    strokeWidth={2}
                    class="flex-shrink-0 animate-pulse"
                  />
                {:else if tarea.estado === "Manipulado"}
                  <Package size={13} strokeWidth={2} class="flex-shrink-0" />
                {:else if tarea.estado === "Urgente"}
                  <Flame
                    size={13}
                    strokeWidth={2}
                    class="flex-shrink-0 animate-pulse"
                  />
                {:else}
                  <Circle size={13} strokeWidth={2} class="flex-shrink-0" />
                {/if}
                {tarea.estado}
              </span>
            </TableCell>

            <TableCell>
              <div class="flex flex-col">
                <span
                  class="text-xs font-semibold text-[#1A1D21] dark:text-[#EDF0F3] max-w-xl truncate {tarea.estado ===
                  'Terminado'
                    ? 'line-through text-gray-400 dark:text-gray-600 font-medium'
                    : ''}"
                >
                  #{tarea.numParte} - {tarea.cliente}
                </span>
              </div>
            </TableCell>

            <TableCell
              class="text-xs font-semibold text-gray-500 dark:text-gray-400"
            >
              {tarea.fechaSalida}
            </TableCell>

            <TableCell>
              <span
                class="text-[9px] font-semibold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-gray-50 dark:bg-[#1E2228] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-[#232830]"
              >
                {tarea.area}
              </span>
            </TableCell>

            <TableCell class="text-right pr-4">
              <DropdownMenu>
                <DropdownMenuTrigger
                  class="inline-flex items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer outline-none"
                  title="Opciones"
                >
                  <MoreHorizontal size={18} strokeWidth={2} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-52">
                  <!-- Acciones comunes: siempre disponibles -->
                  <DropdownMenuItem onSelect={() => onEditarTarea(tarea)}>
                    <Pencil
                      size={14}
                      strokeWidth={2}
                      class="text-gray-500 dark:text-gray-400"
                    />
                    <span>Editar tarea</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={() => onEliminarTarea(tarea.numParte)}
                    class="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30"
                  >
                    <Trash2 size={14} strokeWidth={2} class="text-red-500" />
                    <span>Eliminar tarea</span>
                  </DropdownMenuItem>

                  <!-- Cambio de estado: solo si hay estados a los que avanzar -->
                  {#if estadosSiguientes.length > 0}
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Avanzar estado</DropdownMenuLabel>
                      {#each estadosSiguientes as estadoOpcion (estadoOpcion)}
                        <DropdownMenuItem
                          onSelect={() =>
                            onActualizarEstadoRapido(
                              tarea.numParte,
                              estadoOpcion,
                            )}
                        >
                          <svelte:component
                            this={ICONOS_ESTADO_LUCIDE[estadoOpcion] ||
                              Circle}
                            size={14}
                            strokeWidth={2}
                            class="flex-shrink-0
                              {estadoOpcion === 'Terminado'
                              ? 'text-emerald-500'
                              : ''}
                              {estadoOpcion === 'Imprimiendo'
                              ? 'text-blue-500'
                              : ''}
                              {estadoOpcion === 'Manipulado'
                              ? 'text-amber-500'
                              : ''}
                              {estadoOpcion === 'Urgente'
                              ? 'text-red-500'
                              : ''}
                              {estadoOpcion === 'Por hacer'
                              ? 'text-gray-400'
                              : ''}"
                          />
                          <span>→ {estadoOpcion}</span>
                        </DropdownMenuItem>
                      {/each}
                    </DropdownMenuGroup>
                  {/if}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        {:else}
          <TableRow>
            <TableCell
              colspan={6}
              class="px-6 py-12 text-center text-xs font-semibold text-gray-400 dark:text-gray-500"
            >
              <SearchX
                size={24}
                strokeWidth={1.5}
                class="mx-auto mb-1 opacity-40"
              />
              <span
                >No se han encontrado órdenes de trabajo que coincidan con tu
                búsqueda.</span
              >
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>

    <!-- Footer de Selección y Paginación -->
    <div
      class="border-t border-gray-100 dark:border-[#232830] px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-[#16191D] flex-shrink-0 text-xs"
    >
      <div class="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
        {#if filasSeleccionadas.size > 0}
          <span class="text-emerald-600 dark:text-emerald-400 font-bold"
            >{filasSeleccionadas.size}</span
          >
          de {totalTareasFiltradas} fila(s) seleccionadas.
        {:else}
          Mostrando {totalTareasFiltradas === 0
            ? 0
            : (paginaActual - 1) * tareasPorPagina + 1} –
          {Math.min(paginaActual * tareasPorPagina, totalTareasFiltradas)} de
          {totalTareasFiltradas} resultados
        {/if}
      </div>

      <div class="flex items-center gap-4 flex-wrap justify-end">
        <!-- Selector de Filas Por Página -->
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-medium text-gray-400 dark:text-gray-500"
            >Filas por página:</span
          >
          <select
            bind:value={tareasPorPagina}
            class="px-2.5 py-1 text-xs font-semibold rounded-xl border border-gray-200 dark:border-[#232830] bg-white dark:bg-[#1E2228] text-[#1A1D21] dark:text-[#EDF0F3] cursor-pointer outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {#each [5, 8, 10, 20, 50] as limit}
              <option value={limit}>{limit}</option>
            {/each}
          </select>
        </div>

        <!-- Indicador de Página -->
        <span
          class="text-xs font-semibold px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-[#a4f4cf] rounded-lg"
        >
          Página {paginaActual} de {totalPaginas}
        </span>

        <!-- Navegación -->
        <div class="flex items-center gap-1">
          <button
            type="button"
            onclick={() => (paginaActual = 1)}
            disabled={paginaActual === 1}
            title="Primera página"
            class="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-gray-200 dark:border-[#232830] bg-white dark:bg-[#1E2228] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronsLeft size={15} />
          </button>
          <button
            type="button"
            onclick={() => {
              if (paginaActual > 1) paginaActual--;
            }}
            disabled={paginaActual === 1}
            title="Página anterior"
            class="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-gray-200 dark:border-[#232830] bg-white dark:bg-[#1E2228] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onclick={() => {
              if (paginaActual < totalPaginas) paginaActual++;
            }}
            disabled={paginaActual === totalPaginas}
            title="Página siguiente"
            class="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-gray-200 dark:border-[#232830] bg-white dark:bg-[#1E2228] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight size={15} />
          </button>
          <button
            type="button"
            onclick={() => (paginaActual = totalPaginas)}
            disabled={paginaActual === totalPaginas}
            title="Última página"
            class="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-gray-200 dark:border-[#232830] bg-white dark:bg-[#1E2228] hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronsRight size={15} />
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
