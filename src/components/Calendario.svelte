<script lang="ts">
  // src/components/Calendario.svelte
  import { onMount } from "svelte";
  import { Toaster, toast } from "./ui/sonner";
  import {
    ContextMenu,
    ContextMenuTrigger,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubTrigger,
    ContextMenuSubContent,
    ContextMenuLabel,
    ContextMenuGroup,
  } from "./ui/context-menu";
  import {
    Printer,
    CheckCircle2,
    Trash2,
    RefreshCw,
    FileText,
    ChevronRight,
    Check,
  } from "lucide-svelte";

  export let trabajosIniciales: any[] = [];
  export let desglosesIniciales: any[] = [];

  // Variables de estado del calendario (se inicializan vacías)
  let trabajos: any[] = [];
  let desgloses: any[] = [];

  // 🛡️ Sincronización reactiva: se actualizan automáticamente cuando Astro cambie los props
  $: if (trabajosIniciales) trabajos = [...trabajosIniciales];
  $: if (desglosesIniciales) desgloses = [...desglosesIniciales];

  let currentDate = new Date();
  let currentYear = currentDate.getFullYear();
  let currentMonth = currentDate.getMonth(); // 0-11
  let expandedCellDate: string | null = null;

  // Nombres de meses y días para la maqueta
  const nombresMeses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const diasSemana = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  // Reactivos: cálculo de celdas del mes actual
  $: daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  $: firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Lunes como primer día

  // Construcción de la matriz mensual
  $: daysGrid = (() => {
    let grid = [];
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    // Relleno de mes anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevMonthDays - i;
      const month = currentMonth === 0 ? 11 : currentMonth - 1;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      grid.push({ day: prevDay, month, year, currentMonth: false });
    }

    // Días del mes activo
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push({
        day: d,
        month: currentMonth,
        year: currentYear,
        currentMonth: true,
      });
    }

    // Relleno de mes siguiente (Hasta completar matriz de 42 celdas)
    const totalSlots = 42;
    const nextMonthFiller = totalSlots - grid.length;
    for (let d = 1; d <= nextMonthFiller; d++) {
      const month = currentMonth === 11 ? 0 : currentMonth + 1;
      const year = currentMonth === 11 ? currentYear + 1 : currentYear;
      grid.push({ day: d, month, year, currentMonth: false });
    }

    return grid;
  })();

  function toggleExpander(dateStr: string) {
    if (expandedCellDate === dateStr) {
      expandedCellDate = null;
    } else {
      expandedCellDate = dateStr;
    }
  }

  async function handleDateInputChange(event: Event, numParte: string) {
    const target = event.target as HTMLInputElement;
    if (!target) return;
    const nuevaFecha = target.value;
    if (!nuevaFecha) return;
    const jobIndex = trabajos.findIndex((t) => t.numParte === numParte);
    if (jobIndex === -1) return;
    const originalDate = trabajos[jobIndex].fechaSalida;
    if (originalDate === nuevaFecha) return;
    // Modificación de UI optimista
    trabajos[jobIndex].fechaSalida = nuevaFecha;
    trabajos = [...trabajos];
    if (selectedTrabajo && selectedTrabajo.numParte === numParte) {
      selectedTrabajo.fechaSalida = nuevaFecha;
      selectedTrabajo = { ...selectedTrabajo };
    }
    showToast(`Actualizando entrega de parte #${numParte}...`, "info");
    try {
      const response = await fetch("/api/actualizar-fecha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numParte,
          nuevaFecha,
        }),
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(
          resData.message || "Error en la actualización remota de Turso.",
        );
      }
      showToast(
        `Parte #${numParte} guardado con éxito el ${nuevaFecha}.`,
        "success",
      );
    } catch (error: any) {
      console.error("❌ Falló la actualización de fecha:", error);
      // Reversión de UI optimista
      trabajos[jobIndex].fechaSalida = originalDate;
      trabajos = [...trabajos];
      if (selectedTrabajo && selectedTrabajo.numParte === numParte) {
        selectedTrabajo.fechaSalida = originalDate;
        selectedTrabajo = { ...selectedTrabajo };
      }
      showToast(
        `Error al mover parte: ${error.message}. Movimiento revertido.`,
        "error",
      );
    }
  }

  // Utilidades auxiliares para fechas
  function formatDate(year: number, month: number, day: number): string {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }

  // 🛡️ SOLUCIÓN AL RETARDO EN TIEMPO REAL (F5):
  // Creamos un diccionario reactivo de trabajos agrupados por fecha.
  // Normalizamos las cadenas de fecha para asegurar compatibilidad total (YYYY-MM-DD).
  $: trabajosPorFecha = trabajos.reduce(
    (acc, t) => {
      if (!t || !t.fechaSalida) return acc;
      let fechaStr = String(t.fechaSalida).trim().split("T")[0];
      const parts = fechaStr.split("-");
      if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1].padStart(2, "0");
        const d = parts[2].padStart(2, "0");
        fechaStr = `${y}-${m}-${d}`;
      }
      if (!acc[fechaStr]) acc[fechaStr] = [];
      acc[fechaStr].push(t);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  // 计算 meses con tareas registradas para acceso rápido y posicionamiento automático
  $: mesesConTareas = (() => {
    const mapa = new Map<
      string,
      { year: number; month: number; nombre: string; total: number }
    >();
    trabajos.forEach((t) => {
      if (!t || !t.fechaSalida) return;
      const fechaStr = String(t.fechaSalida).trim().split("T")[0];
      const parts = fechaStr.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
          const key = `${y}-${m}`;
          if (!mapa.has(key)) {
            mapa.set(key, {
              year: y,
              month: m,
              nombre: `${nombresMeses[m]} ${y}`,
              total: 0,
            });
          }
          mapa.get(key)!.total += 1;
        }
      }
    });
    return Array.from(mapa.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  })();


  function getDesgloses(numParte: string) {
    return desgloses.filter((d) => d.numParte === numParte);
  }

  // Comprueba si un día corresponde a la fecha actual del sistema
  function esHoy(d: number, m: number, y: number): boolean {
    const hoy = new Date();
    return (
      d === hoy.getDate() && m === hoy.getMonth() && y === hoy.getFullYear()
    );
  }

  // Devuelve la visualización del calendario al mes y año actual
  function irAHoy() {
    const hoy = new Date();
    currentMonth = hoy.getMonth();
    currentYear = hoy.getFullYear();
  }

  // Navegación mensual
  function prevMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear -= 1;
    } else {
      currentMonth -= 1;
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear += 1;
    } else {
      currentMonth += 1;
    }
  }

  // Lógica Drag & Drop Robusta (Protección contra truncamiento)
  let draggedParte: string | null = null;
  let dragOverCellDate: string | null = null;

  // Notificaciones Toast con sonner de shadcn-svelte
  function showToast(msg: string, type = "success") {
    if (type === "success") {
      toast.success(msg);
    } else if (type === "error") {
      toast.error(msg);
    } else {
      toast.info(msg);
    }
  }

  function handleDragStart(event: DragEvent, numParte: string) {
    draggedParte = numParte;
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", String(numParte));
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function handleDragEnd() {
    draggedParte = null;
    dragOverCellDate = null;
    expandedCellDate = null; // Cierra la vista expandida al terminar el arrastre
    cerrarMasTareas(); // Cierra la vista modal al terminar el arrastre
  }

  function handleDragOver(event: DragEvent, dateStr: string) {
    event.preventDefault();
    dragOverCellDate = dateStr;
  }

  function handleDragLeave() {
    dragOverCellDate = null;
  }

  async function handleDrop(event: DragEvent, targetDateStr: string) {
    event.preventDefault();
    dragOverCellDate = null;

    const numParteStr =
      event.dataTransfer?.getData("text/plain") || draggedParte;
    if (!numParteStr) return;

    // Localizamos el índice del parte de trabajo
    const jobIndex = trabajos.findIndex((t) => t.numParte === numParteStr);
    if (jobIndex === -1) return;

    const originalDate = trabajos[jobIndex].fechaSalida;
    if (originalDate === targetDateStr) return; // Mismo día, no procesar

    // Modificación de UI optimista (La tarjeta se mueve de inmediato para dar fluidez)
    trabajos[jobIndex].fechaSalida = targetDateStr;
    trabajos = [...trabajos];

    showToast(`Actualizando entrega de parte #${numParteStr}...`, "info");

    try {
      const response = await fetch("/api/actualizar-fecha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numParte: numParteStr,
          nuevaFecha: targetDateStr,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(
          resData.message || "Error en la actualización remota de Turso.",
        );
      }

      showToast(
        `Parte #${numParteStr} guardado con éxito el ${targetDateStr}.`,
        "success",
      );
    } catch (error: any) {
      console.error("❌ Falló el canje remoto:", error);
      // Reversión de UI optimista en caso de error
      trabajos[jobIndex].fechaSalida = originalDate;
      trabajos = [...trabajos];
      showToast(
        `Error al mover parte: ${error.message}. Movimiento revertido.`,
        "error",
      );
    } finally {
      draggedParte = null;
    }
  }

  // Visor de Desgloses y Ficha Técnica lateral
  let selectedTrabajo: any = null;

  // Solución reactiva para calcular el desglose del parte seleccionado sin usar {@const} anidados prohibidos
  $: desglosesFiltro = selectedTrabajo
    ? getDesgloses(selectedTrabajo.numParte)
    : [];
  $: estadoActual = selectedTrabajo
    ? (selectedTrabajo.estado || "Por hacer").toLowerCase()
    : "por hacer";

  function openDetails(trabajo: any) {
    selectedTrabajo = trabajo;
  }
  function closeDetails() {
    selectedTrabajo = null;
    showDeleteConfirmation = false;
  }

  // Estado para la ventana modal de "+ X más tareas"
  let showMoreModal = false;
  let moreModalDate = "";
  let moreModalTrabajos: any[] = [];

  function abrirMasTareas(dateStr: string) {
    moreModalDate = dateStr;
    moreModalTrabajos = trabajosPorFecha[dateStr] || [];
    showMoreModal = true;
  }

  function cerrarMasTareas() {
    showMoreModal = false;
    moreModalDate = "";
    moreModalTrabajos = [];
  }

  // 🎨 Retorna las clases generales de la tarjeta
  function getEstadoClases(estado: string): string {
    const est = (estado || "Por hacer").toLowerCase();
    if (est === "urgente") {
      return "bg-white dark:bg-[#1E2228] text-gray-900 dark:text-gray-200 border-gray-100 dark:border-[#232830] animate-pulse-slow shadow-sm";
    }
    return "bg-white dark:bg-[#1E2228] text-gray-900 dark:text-gray-200 border-gray-100 dark:border-[#232830] shadow-sm";
  }

  // 🛡️ ACCIONES DEL CONJUNTO TÉCNICO DE TRABAJO (image_d47fd4.png)
  async function cambiarEstado(target: any, estado?: string) {
    let trabajoTarget = target;
    let nuevoEstado = estado;

    if (typeof target === "string") {
      nuevoEstado = target;
      trabajoTarget = selectedTrabajo;
    }

    if (!trabajoTarget || !nuevoEstado) return;
    const originalEstado = trabajoTarget.estado;
    const numParteStr = trabajoTarget.numParte;

    // Modificación Optimista de UI en Caliente (Instantáneo, sin F5)
    trabajos = trabajos.map((t) =>
      t.numParte === numParteStr ? { ...t, estado: nuevoEstado } : t,
    );
    if (selectedTrabajo && selectedTrabajo.numParte === numParteStr) {
      selectedTrabajo = { ...selectedTrabajo, estado: nuevoEstado };
    }

    showToast(`Cambiando estado del parte a "${nuevoEstado}"...`, "info");

    try {
      const response = await fetch("/api/actualizar-tarea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: numParteStr,
          estado: nuevoEstado,
          workspaceId: trabajoTarget.workspaceId,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(
          resData.error || "Error al cambiar estado en base de datos.",
        );
      }

      showToast(
        `Parte #${numParteStr} actualizado con éxito a "${nuevoEstado}".`,
        "success",
      );
    } catch (error: any) {
      console.error(error);
      // Reversión optimista de UI en caso de error
      trabajos = trabajos.map((t) =>
        t.numParte === numParteStr ? { ...t, estado: originalEstado } : t,
      );
      if (selectedTrabajo && selectedTrabajo.numParte === numParteStr) {
        selectedTrabajo = { ...selectedTrabajo, estado: originalEstado };
      }
      showToast(
        `Error: No se pudo actualizar el estado: ${error.message}`,
        "error",
      );
    }
  }

  // Confirmación nativa integrada de Svelte para borrado de partes (Elimina alert/confirm intrusivos)
  let showDeleteConfirmation = false;

  async function archivarEliminarTarea(target?: any) {
    const trabajoTarget =
      target && typeof target === "object" ? target : selectedTrabajo;

    if (!target && !showDeleteConfirmation) {
      showDeleteConfirmation = true;
      return;
    }

    if (!trabajoTarget) return;
    const numParteStr = trabajoTarget.numParte;

    showToast(`Eliminando parte de trabajo #${numParteStr}...`, "info");

    try {
      const response = await fetch("/api/eliminar-tarea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: numParteStr,
          workspaceId: trabajoTarget.workspaceId,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(
          resData.error || "Error al procesar la eliminación en Turso.",
        );
      }

      // Eliminación física en el estado reactivo en memoria
      trabajos = trabajos.filter((t) => t.numParte !== numParteStr);
      if (selectedTrabajo && selectedTrabajo.numParte === numParteStr) {
        closeDetails();
      }
      showToast(
        `Parte #${numParteStr} eliminado permanentemente del sistema.`,
        "success",
      );
    } catch (error: any) {
      console.error(error);
      showToast(`Error al eliminar: ${error.message}`, "error");
    } finally {
      showDeleteConfirmation = false;
    }
  }

  function imprimirFicha(target?: any) {
    const trabajoTarget =
      target && typeof target === "object" ? target : selectedTrabajo;
    if (!trabajoTarget) return;
    const url = `/w/${trabajoTarget.workspaceId}/parte/${trabajoTarget.numParte}/print`;
    window.open(url, "_blank");
  }

  // Context Menu flotante robusto y de alto rendimiento
  let contextMenuTrabajo: any = null;
  let contextMenuPos = { x: 0, y: 0 };
  let showStateSubmenu = false;

  function openContextMenu(event: MouseEvent, trabajo: any) {
    event.preventDefault();
    event.stopPropagation();

    const screenW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const screenH = typeof window !== "undefined" ? window.innerHeight : 800;
    let x = event.clientX;
    let y = event.clientY;

    if (x + 220 > screenW) x = Math.max(10, screenW - 230);
    if (y + 280 > screenH) y = Math.max(10, screenH - 290);

    contextMenuPos = { x, y };
    contextMenuTrabajo = trabajo;
    showStateSubmenu = false;
  }

  function closeContextMenu() {
    contextMenuTrabajo = null;
    showStateSubmenu = false;
  }

  // Controladores de accesibilidad seguros para evitar errores sintácticos de Svelte en "keydown"
  function handleCardKeydown(event: KeyboardEvent, trabajo: any) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetails(trabajo);
    }
  }

  function handleMoreKeydown(event: KeyboardEvent, trabajo: any) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetails(trabajo);
      cerrarMasTareas();
    }
  }
</script>

<!-- 🛡️ ESCUDO DE ESTILOS GLOBALES DINÁMICOS CONTRA NAVEGACIÓN Y DESHIDRATACIÓN ASTRO -->
<svelte:head>
  <style>
    .animate-fade-in {
      animation: fadeIn 0.18s ease-out forwards;
    }
    .animate-slide-left {
      animation: slideLeft 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-scale-up {
      animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-pulse-slow {
      animation: pulseSlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes slideLeft {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }
    @keyframes scaleUp {
      from {
        opacity: 0;
        transform: scale(0.96);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    @keyframes pulseSlow {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }
  </style>
</svelte:head>

<div class="flex flex-col h-full select-none">
  <!-- 🛡️ HMR SAFELIST GHOST ELEMENT: Garantiza compilación en caliente perfecta en Vite de colr dinámico -->
  <div
    class="hidden bg-[#a4f4cf] bg-indigo-500 bg-amber-500 bg-rose-500 bg-gray-300 dark:bg-gray-600 animate-pulse"
  ></div>
  <!-- CABECERA DEL CALENDARIO -->
  <div
    class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
  >
    <div class="flex flex-col md:flex-row md:items-center gap-6">
      <div class="flex flex-col">
        <h1
          class="text-3xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3"
        >
          Planificación de Entregas
        </h1>
      </div>
      <!-- LEYENDA DE ESTADOS DE COLOR -->
      <div
        class="flex flex-wrap items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-0 md:pl-6 pt-2 md:pt-0"
      >
        <div
          class="flex items-center gap-1.5 text-[10px] font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-500"
          ></span>
          <span>Por Hacer</span>
        </div>
        <div
          class="flex items-center gap-1.5 text-[10px] font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider"
        >
          <span
            class="w-2.5 h-2.5 rounded-full bg-indigo-300 dark:bg-indigo-400"
          ></span>
          <span>Imprimiendo</span>
        </div>
        <div
          class="flex items-center gap-1.5 text-[10px] font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider"
        >
          <span class="w-2.5 h-2.5 rounded-full bg-amber-300 dark:bg-amber-400"
          ></span>
          <span>Manipulado</span>
        </div>
        <div
          class="flex items-center gap-1.5 text-[10px] font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider"
        >
          <span
            class="w-2.5 h-2.5 rounded-full bg-teal-300 dark:bg-[#a4f4cf]/80"
          ></span>
          <span>Terminado</span>
        </div>
        <div
          class="flex items-center gap-1.5 text-[10px] font-semibold text-gray-800 dark:text-gray-300 uppercase tracking-wider"
        >
          <span
            class="w-2.5 h-2.5 rounded-full bg-rose-300 dark:bg-rose-400 animate-pulse-slow"
          ></span>
          <span>Urgente</span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3 self-end md:self-auto">
      <!-- Botón HOY -->
      <button
        on:click={irAHoy}
        class="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-[#16181c] dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center focus:outline-none"
      >
        Hoy
      </button>

      <!-- Selector de Meses y Años Interactivo -->
      <div
        class="flex items-center gap-2 bg-white dark:bg-[#16181c] border border-slate-200/60 dark:border-slate-800/80 p-1.5 rounded-2xl shadow-sm"
      >
        <button
          on:click={prevMonth}
          aria-label="Mes anterior"
          class="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M15 19l-7-7 7-7"
            /></svg
          >
        </button>

        <div class="flex items-center gap-1 font-semibold text-sm">
          <select
            bind:value={currentMonth}
            class="bg-transparent text-slate-800 dark:text-slate-100 font-semibold text-sm border-none outline-none cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors capitalize"
          >
            {#each nombresMeses as nombre, idx}
              <option
                value={idx}
                class="bg-white dark:bg-[#16181c] text-slate-800 dark:text-slate-200"
              >
                {nombre}
              </option>
            {/each}
          </select>

          <select
            bind:value={currentYear}
            class="bg-transparent text-slate-800 dark:text-slate-100 font-semibold text-sm border-none outline-none cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {#each [2024, 2025, 2026, 2027] as y}
              <option
                value={y}
                class="bg-white dark:bg-[#16181c] text-slate-800 dark:text-slate-200"
              >
                {y}
              </option>
            {/each}
          </select>
        </div>

        <button
          on:click={nextMonth}
          aria-label="Mes siguiente"
          class="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M9 5l7 7-7 7"
            /></svg
          >
        </button>
      </div>
    </div>
  </div>

  <!-- ACCESO RÁPIDO A MESES CON ENTREGAS PLANIFICADAS -->
  {#if mesesConTareas.length > 0}
    <div
      class="flex items-center gap-2 overflow-x-auto pb-4 pt-1 border-b border-slate-100 dark:border-slate-800/80 mb-4"
    >
      <span
        class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0"
      >
        Meses con Entregas:
      </span>
      {#each mesesConTareas as m}
        <button
          on:click={() => {
            currentMonth = m.month;
            currentYear = m.year;
          }}
          class="px-3 py-1.5 text-[11px] font-semibold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0
            {currentMonth === m.month && currentYear === m.year
            ? 'bg-slate-900 text-white dark:bg-[#a4f4cf] dark:text-black border-transparent shadow-sm'
            : 'bg-white dark:bg-[#16181c] text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}"
        >
          <span>{m.nombre}</span>
          <span
            class="text-[9.5px] px-1.5 py-0.2 rounded-md font-mono
            {currentMonth === m.month && currentYear === m.year
              ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}"
          >
            {m.total}
          </span>
        </button>
      {/each}
    </div>
  {/if}

  <!-- TOAST NOTIFICATION SONNER (shadcn-svelte, inferior derecha) -->
  <Toaster position="bottom-right" richColors />

  <!-- REJILLA SEMANAL -->
  <div class="grid grid-cols-7 gap-1.5 mb-2">
    {#each diasSemana as dia}
      <div
        class="text-center font-semibold text-[10px] text-slate-400 dark:text-slate-500 uppercase py-2 tracking-wider"
      >
        {dia}
      </div>
    {/each}
  </div>

  <!-- MATRIZ MENSUAL (DIAS) -->
  <div
    class="grid grid-cols-7 border-t border-l border-slate-200 dark:border-slate-800/80 flex-1 min-h-[620px] rounded-2xl overflow-hidden"
  >
    {#each daysGrid as { day, month, year, currentMonth }}
      {@const celdaFecha = formatDate(year, month, day)}
      {@const estaExpandido = expandedCellDate === celdaFecha}
      {@const trabajosEnCelda = trabajosPorFecha[celdaFecha] || []}
      {@const estaMarcadoDrag = dragOverCellDate === celdaFecha}

      <div
        role="gridcell"
        tabindex="0"
        on:dragover={(e) => handleDragOver(e, celdaFecha)}
        on:dragleave={handleDragLeave}
        on:drop={(e) => handleDrop(e, celdaFecha)}
        class="bg-white dark:bg-[#131519] border-r border-b border-slate-200 dark:border-slate-800/80 p-2.5 flex flex-col gap-1.5 min-h-[110px] transition-all relative
            {currentMonth ? '' : 'opacity-35'}
            {estaMarcadoDrag
          ? 'ring-2 ring-gray-900 dark:ring-[#a4f4cf] bg-gray-50 dark:bg-[#a4f4cf]/5 border-gray-900 dark:border-[#a4f4cf] scale-[1.01]'
          : ''}
            {estaExpandido ? 'overflow-visible z-50' : 'overflow-hidden'}"
      >
        <!-- Numero de dia -->
        <div class="flex justify-start mb-0.5">
          {#if esHoy(day, month, year)}
            <span
              class="text-xs font-semibold bg-gray-900 dark:bg-[#a4f4cf] text-white dark:text-black w-6 h-6 rounded-lg flex items-center justify-center shadow-sm select-none"
            >
              {day}
            </span>
          {:else}
            <span
              class="text-xs font-semibold {currentMonth
                ? 'text-slate-800 dark:text-slate-200'
                : 'text-slate-400 dark:text-slate-600'}"
            >
              {day}
            </span>
          {/if}
        </div>

        <!-- Contenedor de Tarjetas Estándar (Límite visual de 2) -->
        <div class="flex flex-col gap-1.5 flex-1 overflow-hidden">
          {#each trabajosEnCelda.slice(0, 2) as trabajo}
            <div
              draggable="true"
              role="button"
              tabindex="0"
              on:dragstart={(e) => handleDragStart(e, trabajo.numParte)}
              on:dragend={handleDragEnd}
              on:click={(e) => openContextMenu(e, trabajo)}
              on:contextmenu={(e) => openContextMenu(e, trabajo)}
              on:keydown={(e) => handleCardKeydown(e, trabajo)}
              class="border p-2 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01] w-full text-left outline-none block select-none {getEstadoClases(
                trabajo.estado,
              )}"
            >
              <div class="flex items-center justify-between gap-1 min-w-0">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span
                    class="w-2 h-2 shrink-0 rounded-full {(
                      trabajo.estado || 'por hacer'
                    ).toLowerCase() === 'imprimiendo'
                      ? 'bg-indigo-300 dark:bg-indigo-400/90'
                      : (trabajo.estado || 'por hacer').toLowerCase() ===
                          'manipulado'
                        ? 'bg-amber-300 dark:bg-amber-400/90'
                        : (trabajo.estado || 'por hacer').toLowerCase() ===
                            'terminado'
                          ? 'bg-teal-300 dark:bg-[#a4f4cf]/80'
                          : (trabajo.estado || 'por hacer').toLowerCase() ===
                              'urgente'
                            ? 'bg-rose-300 dark:bg-rose-400/90 animate-pulse-slow'
                            : 'bg-gray-300 dark:bg-gray-500/80'}"
                  ></span>
                  <span
                    class="text-[9.5px] font-semibold font-mono tracking-tight shrink-0 text-gray-600 dark:text-gray-400"
                  >
                    #{trabajo.numParte}
                  </span>
                </div>
                <span
                  class="text-[9px] font-semibold px-1.5 py-0.5 bg-white/40 dark:bg-black/20 rounded-md truncate max-w-[85px] capitalize"
                >
                  {trabajo.area}
                </span>
              </div>
              <p class="text-[10px] font-semibold truncate mt-1">
                {trabajo.cliente}
              </p>
            </div>
          {/each}

          <!-- Botón de saturación de tareas: "+ X más" (Activa la rejilla interactiva) -->
          {#if trabajosEnCelda.length > 2}
            <button
              on:click|stopPropagation={() => toggleExpander(celdaFecha)}
              class="btn-expand-tasks w-full text-center py-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#1E2228] dark:hover:bg-[#232830] text-gray-900 dark:text-[#a4f4cf] text-[9.5px] font-semibold rounded-lg transition-colors cursor-pointer mt-auto"
            >
              + {trabajosEnCelda.length - 2} más
            </button>
          {/if}
        </div>

        <!-- 🛡️ NUEVO CONTENEDOR FLOTANTE INTERACTIVO DE EXPANSION DIRECTA (Bypass de Modales) -->
        {#if estaExpandido}
          <div
            class="absolute inset-x-0 top-0 min-h-full h-auto bg-white dark:bg-[#16181c] border-2 border-gray-900 dark:border-[#a4f4cf] shadow-2xl rounded-2xl p-2.5 flex flex-col gap-1.5 z-[999] expanded-cell-container animate-scale-up"
          >
            <!-- Header interior de la celda expandida -->
            <div
              class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-1"
            >
              <span
                class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-500"
                >Planificadas ({day})</span
              >
              <button
                on:click|stopPropagation={() => (expandedCellDate = null)}
                class="text-slate-400 hover:text-rose-500 font-semibold text-xs p-1 rounded-full transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <!-- Listado completo e interactivo (Drap & Drop nativo habilitado) -->
            <div class="flex flex-col gap-1.5 h-auto overflow-visible pr-0.5">
              {#each trabajosEnCelda as trabajo}
                <div
                  draggable="true"
                  role="button"
                  tabindex="0"
                  on:dragstart={(e) => handleDragStart(e, trabajo.numParte)}
                  on:dragend={handleDragEnd}
                  on:click={(e) => openContextMenu(e, trabajo)}
                  on:contextmenu={(e) => openContextMenu(e, trabajo)}
                  on:keydown={(e) => handleCardKeydown(e, trabajo)}
                  class="border p-2 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] w-full text-left outline-none block select-none {getEstadoClases(
                    trabajo.estado,
                  )}"
                >
                  <div class="flex items-center justify-between gap-1">
                    <div class="flex items-center gap-1.5">
                      <span
                        class="w-2.5 h-2.5 shrink-0 rounded-full {(
                          trabajo.estado || 'por hacer'
                        ).toLowerCase() === 'imprimiendo'
                          ? 'bg-indigo-300 dark:bg-indigo-400/90'
                          : (trabajo.estado || 'por hacer').toLowerCase() ===
                              'manipulado'
                            ? 'bg-amber-300 dark:bg-amber-400/90'
                            : (trabajo.estado || 'por hacer').toLowerCase() ===
                                'terminado'
                              ? 'bg-teal-300 dark:bg-[#a4f4cf]/80'
                              : (
                                    trabajo.estado || 'por hacer'
                                  ).toLowerCase() === 'urgente'
                                ? 'bg-rose-300 dark:bg-rose-400/90 animate-pulse-slow'
                                : 'bg-gray-300 dark:bg-gray-500/80'}"
                      ></span>
                      <span
                        class="text-[10px] font-semibold font-mono tracking-tight shrink-0 text-gray-600 dark:text-gray-400"
                      >
                        #{trabajo.numParte}
                      </span>
                    </div>
                    <span
                      class="text-[9px] font-semibold px-1.5 py-0.5 bg-white/40 dark:bg-black/20 rounded-md truncate max-w-[85px] capitalize"
                    >
                      {trabajo.area}
                    </span>
                  </div>
                  <p class="text-[10px] font-semibold truncate mt-1">
                    {trabajo.cliente}
                  </p>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- DRAWER / DETALLES DEL PARTE SELECCIONADO (Apertura lateral premium con barra técnica) -->
  {#if selectedTrabajo}
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detalle del parte"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-[99999] animate-fade-in"
    >
      <button
        type="button"
        aria-label="Cerrar panel de detalles"
        on:click={closeDetails}
        class="absolute inset-0 w-full h-full cursor-default"
      ></button>
      <div
        role="presentation"
        on:click|stopPropagation
        class="w-full max-w-lg bg-white dark:bg-[#16181c] h-full shadow-2xl p-8 flex flex-col gap-6 overflow-y-auto animate-slide-left relative z-10"
      >
        <!-- Cabecera -->
        <div
          class="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4"
        >
          <div>
            <div class="flex items-center gap-2">
              <span
                class="text-xs font-semibold text-gray-600 dark:text-gray-400 font-mono"
                >PARTE #{selectedTrabajo.numParte}</span
              >
              <div class="flex items-center gap-1.5 ml-2">
                <span
                  class="w-2.5 h-2.5 shrink-0 rounded-full {(
                    selectedTrabajo.estado || 'por hacer'
                  ).toLowerCase() === 'imprimiendo'
                    ? 'bg-indigo-300 dark:bg-indigo-400/90'
                    : (selectedTrabajo.estado || 'por hacer').toLowerCase() ===
                        'manipulado'
                      ? 'bg-amber-300 dark:bg-amber-400/90'
                      : (
                            selectedTrabajo.estado || 'por hacer'
                          ).toLowerCase() === 'terminado'
                        ? 'bg-teal-300 dark:bg-[#a4f4cf]/80'
                        : (
                              selectedTrabajo.estado || 'por hacer'
                            ).toLowerCase() === 'urgente'
                          ? 'bg-rose-300 dark:bg-rose-400/90 animate-pulse-slow'
                          : 'bg-gray-300 dark:bg-gray-500/80'}"
                ></span>
                <span
                  class="text-[9px] font-bold text-gray-900 dark:text-white uppercase"
                >
                  {selectedTrabajo.estado || "Por hacer"}
                </span>
              </div>
            </div>
            <h2
              class="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-1"
            >
              {selectedTrabajo.cliente}
            </h2>
          </div>
          <button
            on:click={closeDetails}
            class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Ficha técnica -->
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-slate-50 dark:bg-[#1a1d24] p-3.5 rounded-2xl">
              <span
                class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block"
                >Área de Producción</span
              >
              <span
                class="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 block uppercase"
                >{selectedTrabajo.area}</span
              >
            </div>

            <!-- 🔥 MEJORA DE USABILIDAD: Selector de fecha interactivo para editar en caliente -->
            <div
              class="bg-slate-50 dark:bg-[#1a1d24] p-3.5 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all"
            >
              <span
                class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block"
                >Fecha de Entrega (Editar)</span
              >
              <input
                type="date"
                value={selectedTrabajo.fechaSalida}
                on:change={(e) =>
                  handleDateInputChange(e, selectedTrabajo.numParte)}
                class="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 block font-mono bg-transparent border-none p-0 outline-none w-full focus:ring-0 cursor-pointer dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-[#1a1d24] p-4 rounded-2xl">
            <span
              class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2"
              >Líneas de Desglose de Producto</span
            >
            {#if desglosesFiltro.length === 0}
              <p class="text-xs font-semibold text-slate-400 italic">
                No hay productos desglosados en este parte.
              </p>
            {:else}
              <div class="flex flex-col gap-2">
                {#each desglosesFiltro as d}
                  <div
                    class="flex justify-between items-center text-xs border-b border-slate-200/40 dark:border-slate-800/40 py-1.5 font-semibold"
                  >
                    <span class="text-slate-700 dark:text-slate-300 uppercase"
                      >{d.descripcionProducto}</span
                    >
                    <span
                      class="font-mono text-gray-900 dark:text-[#a4f4cf] bg-gray-100 dark:bg-[#a4f4cf]/10 px-2 py-0.5 rounded-md"
                      >{d.cantidad.toLocaleString()} uds</span
                    >
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <div class="bg-slate-50 dark:bg-[#1a1d24] p-4 rounded-2xl">
            <span
              class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block"
              >Descripción Técnica</span
            >
            <p
              class="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed"
            >
              {selectedTrabajo.descripcionGeneral ||
                "Sin descripción técnica registrada."}
            </p>
          </div>
        </div>

        <!-- ACCIONES DE TRABAJO -->
        <div
          class="border-t border-slate-100 dark:border-slate-800 pt-5 flex flex-col gap-4"
        >
          {#if estadoActual === "terminado"}
            <div
              class="p-4 bg-[#F4FBF7] dark:bg-emerald-950/15 border border-[#D1F2E1] dark:border-emerald-900/40 rounded-2xl flex items-start gap-3.5 animate-scale-up"
            >
              <svg
                class="w-5 h-5 text-[#00A854] dark:text-emerald-400 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p
                class="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed"
              >
                Este parte de trabajo ya está archivado como <span
                  class="font-semibold text-[#008F47] dark:text-emerald-400"
                  >Terminado</span
                >. Por seguridad de taller, su estado no puede volver a
                modificarse en frío.
              </p>
            </div>
          {:else}
            <span
              class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block"
              >Avanzar o Cambiar Estado de Producción</span
            >

            {#if estadoActual === "por hacer" || estadoActual === "urgente"}
              <div class="grid grid-cols-2 gap-2">
                <button
                  on:click={() => cambiarEstado("Imprimiendo")}
                  class="py-2.5 px-2 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-[#5C42FF] dark:text-indigo-400 font-semibold text-[10.5px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <svg
                    class="w-3.5 h-3.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    /></svg
                  >
                  <span>Imprimiendo</span>
                </button>

                <button
                  on:click={() => cambiarEstado("Manipulado")}
                  class="py-2.5 px-2 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-semibold text-[10.5px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <svg
                    class="w-3.5 h-3.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    /></svg
                  >
                  <span>Manipulado</span>
                </button>
              </div>
            {:else}
              <div class="grid grid-cols-1">
                <button
                  on:click={() => cambiarEstado("Manipulado")}
                  class="py-2.5 px-2 w-full border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-semibold text-[10.5px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <svg
                    class="w-3.5 h-3.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    /></svg
                  >
                  <span>Avanzar a Manipulado</span>
                </button>
              </div>
            {/if}

            <button
              on:click={() => cambiarEstado("Terminado")}
              class="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                /></svg
              >
              Finalizar y Cerrar Orden de Trabajo (Archivar)
            </button>
          {/if}

          <button
            on:click={archivarEliminarTarea}
            class="w-full py-3 bg-white hover:bg-rose-50/30 dark:bg-transparent dark:hover:bg-rose-950/10 border-2 border-dashed {showDeleteConfirmation
              ? 'border-rose-500 text-rose-750 bg-rose-50/50 dark:bg-rose-950/20'
              : 'border-rose-250 hover:border-rose-300 text-rose-600 dark:text-rose-400'} font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              /></svg
            >
            <span
              >{showDeleteConfirmation
                ? "⚠️ ¿SEGURO? Haz clic de nuevo para eliminar"
                : "Archivar u Ordenar Eliminación del Parte"}</span
            >
          </button>
        </div>

        <!-- Acciones generales -->
        <div
          class="mt-auto border-t border-slate-100 dark:border-slate-800 pt-5 flex gap-3"
        >
          <a
            href={`/w/${selectedTrabajo.workspaceId}/parte/${selectedTrabajo.numParte}/print`}
            target="_blank"
            class="flex-1 py-3 px-4 bg-slate-100 dark:bg-[#1a1d24] hover:bg-slate-200 dark:hover:bg-[#202530] text-slate-800 dark:text-slate-200 font-semibold text-xs text-center rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            🖨️ Imprimir Ficha A3
          </a>
          <button
            on:click={closeDetails}
            class="px-5 py-3 bg-slate-100 dark:bg-[#1a1d24] hover:bg-slate-200 dark:hover:bg-[#202530] text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- MODAL / VISTA DE TAREAS ACUMULADAS ("+ X más") -->
  {#if showMoreModal}
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tareas adicionales del día"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[99999] animate-fade-in"
    >
      <button
        type="button"
        aria-label="Cerrar modal de tareas"
        on:click={cerrarMasTareas}
        class="absolute inset-0 w-full h-full cursor-default"
      ></button>
      <div
        role="presentation"
        on:click|stopPropagation
        class="bg-white dark:bg-[#16181c] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 max-h-[85vh] overflow-hidden animate-scale-up relative z-10"
      >
        <div
          class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3"
        >
          <div>
            <h3
              class="text-base font-semibold text-slate-800 dark:text-slate-100"
            >
              Entregas Planificadas
            </h3>
            <p
              class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 font-mono mt-0.5"
            >
              {moreModalDate}
            </p>
          </div>
          <button
            on:click={cerrarMasTareas}
            class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <!-- Listado completo de tareas del día (Con colores por estado) -->
        <div class="flex flex-col gap-2 overflow-y-auto max-h-[55vh] pr-1">
          {#each moreModalTrabajos as trabajo}
            <div
              draggable="true"
              role="button"
              tabindex="0"
              on:dragstart={(e) => handleDragStart(e, trabajo.numParte)}
              on:dragend={handleDragEnd}
              on:click={(e) => {
                openContextMenu(e, trabajo);
                cerrarMasTareas();
              }}
              on:contextmenu={(e) => {
                openContextMenu(e, trabajo);
                cerrarMasTareas();
              }}
              on:keydown={(e) => handleMoreKeydown(e, trabajo)}
              class="border p-3 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-grab active:cursor-grabbing transition-all flex flex-col gap-1.5 w-full text-left outline-none block select-none {getEstadoClases(
                trabajo.estado,
              )}"
            >
              <div class="flex items-center justify-between gap-1">
                <div class="flex items-center gap-1.5 min-w-0">
                  <span
                    class="w-2.5 h-2.5 shrink-0 rounded-full {(
                      trabajo.estado || 'por hacer'
                    ).toLowerCase() === 'imprimiendo'
                      ? 'bg-indigo-300 dark:bg-indigo-400/90'
                      : (trabajo.estado || 'por hacer').toLowerCase() ===
                          'manipulado'
                        ? 'bg-amber-300 dark:bg-amber-400/90'
                        : (trabajo.estado || 'por hacer').toLowerCase() ===
                            'terminado'
                          ? 'bg-teal-300 dark:bg-[#a4f4cf]/80'
                          : (
                                trabajo.estado || 'por hacer'
                              ).toLowerCase() === 'urgente'
                            ? 'bg-rose-300 dark:bg-rose-400/90 animate-pulse-slow'
                            : 'bg-gray-300 dark:bg-gray-500/80'}"
                  ></span>
                  <span
                    class="text-[10px] font-semibold font-mono tracking-tight shrink-0 text-gray-600 dark:text-gray-400"
                  >
                    #{trabajo.numParte}
                  </span>
                </div>
                <span
                  class="text-[9.5px] font-semibold px-2 py-0.5 bg-white/40 dark:bg-black/20 rounded-md capitalize"
                >
                  {trabajo.area}
                </span>
              </div>
              <p class="text-xs font-semibold">
                {trabajo.cliente}
              </p>
            </div>
          {/each}
        </div>

        <button
          on:click={cerrarMasTareas}
          class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#202530] dark:hover:bg-[#2a313d] text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Cerrar Vista
        </button>
      </div>
    </div>
  {/if}

  <!-- 🛡️ MENÚ CONTEXTUAL FLOTANTE ROBUSTO DE SHADCN-SVELTE DE ALTO RENDIMIENTO -->
  {#if contextMenuTrabajo}
    <div
      role="presentation"
      class="fixed inset-0 z-[999999] bg-transparent"
      on:click={closeContextMenu}
      on:contextmenu|preventDefault={closeContextMenu}
    >
      <div
        role="menu"
        tabindex="-1"
        on:click|stopPropagation
        on:contextmenu|preventDefault
        style="left: {contextMenuPos.x}px; top: {contextMenuPos.y}px;"
        class="fixed z-[1000000] min-w-[13rem] overflow-visible rounded-2xl border border-gray-100 dark:border-[#232830] bg-white dark:bg-[#1E2228] p-1.5 text-slate-950 dark:text-slate-50 shadow-2xl animate-scale-up outline-none"
      >
        <!-- Encabezado de Tarea -->
        <div
          class="px-3 py-2 flex flex-col gap-0.5 border-b border-gray-100 dark:border-[#232830] mb-1"
        >
          <div class="flex items-center justify-between gap-2">
            <span
              class="font-mono text-[11px] font-bold text-gray-900 dark:text-gray-100"
            >
              #{contextMenuTrabajo.numParte}
            </span>
            <span
              class="text-[9px] font-bold capitalize px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            >
              {contextMenuTrabajo.estado || "Por hacer"}
            </span>
          </div>
          <p
            class="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5"
          >
            {contextMenuTrabajo.cliente}
          </p>
        </div>

        <!-- Submenú: Cambiar de estado -->
        <div class="relative">
          <button
            type="button"
            on:click={() => (showStateSubmenu = !showStateSubmenu)}
            class="w-full flex cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] transition-colors hover:bg-gray-100/80 dark:hover:bg-gray-800/60"
          >
            <div class="flex items-center gap-2">
              <RefreshCw
                class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
              />
              <span>Cambiar estado</span>
            </div>
            <ChevronRight class="w-3.5 h-3.5 text-slate-400" />
          </button>

          {#if showStateSubmenu}
            <div
              class="absolute left-full top-0 ml-1 min-w-[10rem] rounded-2xl border border-gray-100 dark:border-[#232830] bg-white dark:bg-[#1E2228] p-1.5 shadow-2xl z-[1000001] flex flex-col gap-0.5 animate-scale-up"
            >
              <button
                type="button"
                on:click={() => {
                  cambiarEstado(contextMenuTrabajo, "Por hacer");
                  closeContextMenu();
                }}
                class="w-full flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-100/80 dark:hover:bg-gray-800/60"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500"
                  ></span>
                  <span>Por hacer</span>
                </div>
                {#if (contextMenuTrabajo.estado || "por hacer").toLowerCase() === "por hacer"}
                  <Check
                    class="w-3.5 h-3.5 text-gray-600 dark:text-gray-300"
                  />
                {/if}
              </button>

              <button
                type="button"
                on:click={() => {
                  cambiarEstado(contextMenuTrabajo, "Imprimiendo");
                  closeContextMenu();
                }}
                class="w-full flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-100/80 dark:hover:bg-gray-800/60"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="w-2 h-2 rounded-full bg-indigo-300 dark:bg-indigo-400"
                  ></span>
                  <span>Imprimiendo</span>
                </div>
                {#if (contextMenuTrabajo.estado || "").toLowerCase() === "imprimiendo"}
                  <Check class="w-3.5 h-3.5 text-indigo-500" />
                {/if}
              </button>

              <button
                type="button"
                on:click={() => {
                  cambiarEstado(contextMenuTrabajo, "Manipulado");
                  closeContextMenu();
                }}
                class="w-full flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-100/80 dark:hover:bg-gray-800/60"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="w-2 h-2 rounded-full bg-amber-300 dark:bg-amber-400"
                  ></span>
                  <span>Manipulado</span>
                </div>
                {#if (contextMenuTrabajo.estado || "").toLowerCase() === "manipulado"}
                  <Check class="w-3.5 h-3.5 text-amber-500" />
                {/if}
              </button>

              <button
                type="button"
                on:click={() => {
                  cambiarEstado(contextMenuTrabajo, "Terminado");
                  closeContextMenu();
                }}
                class="w-full flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-100/80 dark:hover:bg-gray-800/60"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="w-2 h-2 rounded-full bg-teal-300 dark:bg-[#a4f4cf]/80"
                  ></span>
                  <span>Terminado</span>
                </div>
                {#if (contextMenuTrabajo.estado || "").toLowerCase() === "terminado"}
                  <Check class="w-3.5 h-3.5 text-teal-500" />
                {/if}
              </button>
            </div>
          {/if}
        </div>

        <!-- Imprimir Ficha -->
        <button
          type="button"
          on:click={() => {
            imprimirFicha(contextMenuTrabajo);
            closeContextMenu();
          }}
          class="w-full flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-100/80 dark:hover:bg-gray-800/60"
        >
          <Printer class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Imprimir ficha técnica</span>
        </button>

        <!-- Finalizar -->
        <button
          type="button"
          disabled={(contextMenuTrabajo.estado || "").toLowerCase() ===
            "terminado"}
          on:click={() => {
            cambiarEstado(contextMenuTrabajo, "Terminado");
            closeContextMenu();
          }}
          class="w-full flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-100/80 dark:hover:bg-gray-800/60 disabled:opacity-50 disabled:pointer-events-none"
        >
          <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
          <span>Finalizar tarea</span>
        </button>

        <div class="-mx-1 my-1 h-px bg-gray-100 dark:bg-[#232830]"></div>

        <!-- Ver detalles completos -->
        <button
          type="button"
          on:click={() => {
            openDetails(contextMenuTrabajo);
            closeContextMenu();
          }}
          class="w-full flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-100/80 dark:hover:bg-gray-800/60"
        >
          <FileText class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Ver detalles completos</span>
        </button>

        <div class="-mx-1 my-1 h-px bg-gray-100 dark:bg-[#232830]"></div>

        <!-- Eliminar -->
        <button
          type="button"
          on:click={() => {
            archivarEliminarTarea(contextMenuTrabajo);
            closeContextMenu();
          }}
          class="w-full flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <Trash2 class="w-3.5 h-3.5 text-rose-500" />
          <span>Eliminar tarea</span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* 🛡️ ESTILOS GLOBALES IMPERMEABLES CONTRA NAVEGACIÓN Y DESHIDRATACIÓN ASTRO (image_d42618.png) */
  :global(.animate-fade-in) {
    animation: fadeIn 0.18s ease-out forwards;
  }

  :global(.animate-slide-left) {
    animation: slideLeft 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  :global(.animate-scale-up) {
    animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  :global(.animate-pulse-slow) {
    animation: pulseSlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideLeft {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes scaleUp {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes pulseSlow {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
</style>
