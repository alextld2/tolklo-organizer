<script lang="ts">
  import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
    Columns,
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
    numParte: number;
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
    onEliminarTarea = (_numParte: number) => {},
    onActualizarEstadoRapido = (_numParte: number, _estado: string) => {},
  }: {
    tareas?: Tarea[];
    busquedaGlobal?: string;
    listaEstados?: string[];
    coloresTextoEstado?: Record<string, string>;
    onEditarTarea?: (tarea: Tarea) => void;
    onEliminarTarea?: (numParte: number) => void;
    onActualizarEstadoRapido?: (numParte: number, estado: string) => void;
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

  // ─── Columnas visibles ─────────────────────────────────────────────────────
  let visibleColumns = $state<Record<string, boolean>>({
    select: true,
    estado: true,
    descripcion: true,
    fechaSalida: true,
    area: true,
    acciones: true,
  });

  const columnLabels: Record<string, string> = {
    select: "Selección",
    estado: "Estado",
    descripcion: "Descripción",
    fechaSalida: "Fecha de Salida",
    area: "Área",
    acciones: "Acciones",
  };

  function toggleColumn(colId: string) {
    visibleColumns[colId] = !visibleColumns[colId];
  }

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
    if (vista.id === "todas") return tareas.length;
    return tareas.filter(
      (t) => t.area.toLowerCase() === (vista.areaId || "").toLowerCase(),
    ).length;
  }

  // ─── Filtrado ──────────────────────────────────────────────────────────────
  const tareasFiltradas = $derived.by(() => {
    return (tareas || []).filter((t) => {
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
    // Reset página cuando cambia búsqueda o vista
    busquedaGlobal;
    vistaActual;
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
  let filasSeleccionadas = $state(new Set<number>());

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

  function toggleSeleccionarFila(numParte: number) {
    if (filasSeleccionadas.has(numParte)) {
      filasSeleccionadas.delete(numParte);
    } else {
      filasSeleccionadas.add(numParte);
    }
    filasSeleccionadas = new Set(filasSeleccionadas);
  }

  const totalColumnasVisibles = $derived(
    Object.values(visibleColumns).filter(Boolean).length,
  );
</script>

<div class="flex flex-col space-y-4 w-full">
  <!-- Pestañas de Vista y Personalizar Columnas -->
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

    <!-- Personalización de Columnas -->
    <div class="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#232830] bg-white dark:bg-[#1E2228] text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer outline-none shadow-xs"
        >
          <Columns size={15} />
          <span class="hidden sm:inline">Columnas</span>
          <ChevronDown size={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {#each Object.keys(visibleColumns) as colId (colId)}
            {#if colId !== "acciones" && colId !== "actions"}
              <DropdownMenuItem
                onSelect={() => toggleColumn(colId)}
                class="flex items-center justify-between"
              >
                <span>{columnLabels[colId] || colId}</span>
                <input
                  type="checkbox"
                  checked={visibleColumns[colId]}
                  class="h-3.5 w-3.5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-400 cursor-pointer pointer-events-none"
                />
              </DropdownMenuItem>
            {/if}
          {/each}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>

  <!-- Contenedor Principal de la Tabla -->
  <div
    class="bg-white dark:bg-[#16191D] rounded-3xl border border-[#E9EBF0] dark:border-[#232830] shadow-sm overflow-hidden flex flex-col"
  >
    <Table>
      <TableHeader>
        <TableRow>
          {#if visibleColumns.select}
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
          {/if}

          {#if visibleColumns.estado}
            <TableHead class="w-44">Estado</TableHead>
          {/if}

          {#if visibleColumns.descripcion}
            <TableHead>Descripción</TableHead>
          {/if}

          {#if visibleColumns.fechaSalida}
            <TableHead>Fecha de salida</TableHead>
          {/if}

          {#if visibleColumns.area}
            <TableHead>Área</TableHead>
          {/if}

          {#if visibleColumns.acciones}
            <TableHead class="text-right pr-8 w-24">Acciones</TableHead>
          {/if}
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
            {#if visibleColumns.select}
              <TableCell class="px-4">
                <input
                  type="checkbox"
                  checked={filasSeleccionadas.has(tarea.numParte)}
                  onchange={() => toggleSeleccionarFila(tarea.numParte)}
                  class="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                  aria-label="Seleccionar orden"
                />
              </TableCell>
            {/if}

            {#if visibleColumns.estado}
              <TableCell>
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold {coloresTextoEstado[
                    tarea.estado
                  ] || 'text-gray-500 border border-transparent'}"
                >
                  {#if tarea.estado === "Terminado"}
                    <!-- Icono relleno verde (green-500 ≈ #22c55e, más cercano a #00c950 en shadcn/Tailwind) -->
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
            {/if}

            {#if visibleColumns.descripcion}
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
                  <!--<span
                    class="text-[10px] font-medium text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-wide"
                  >
                    {tarea.descripcionGeneral || "Sin especificar descripción"}
                  </span>  -->
                </div>
              </TableCell>
            {/if}

            {#if visibleColumns.fechaSalida}
              <TableCell
                class="text-xs font-semibold text-gray-500 dark:text-gray-400"
              >
                {tarea.fechaSalida}
              </TableCell>
            {/if}

            {#if visibleColumns.area}
              <TableCell>
                <span
                  class="text-[9px] font-semibold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-gray-50 dark:bg-[#1E2228] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-[#232830]"
                >
                  {tarea.area}
                </span>
              </TableCell>
            {/if}

            {#if visibleColumns.acciones}
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
            {/if}
          </TableRow>
        {:else}
          <TableRow>
            <TableCell
              colspan={totalColumnasVisibles}
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
