<script lang="ts">
  // src/components/Calendario.svelte
  import { onMount } from 'svelte';

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

  // Nombres de meses y días para la maqueta
  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

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
      grid.push({ day: d, month: currentMonth, year: currentYear, currentMonth: true });
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

  // Utilidades auxiliares para fechas
  function formatDate(year: number, month: number, day: number): string {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  // 🛡️ SOLUCIÓN AL RETARDO EN TIEMPO REAL (F5):
  // Creamos un diccionario reactivo de trabajos agrupados por fecha.
  // Al actualizarse 'trabajos', Svelte recalculará instantáneamente este mapa,
  // disparando la renderización de las celdas en el DOM sin necesidad de refrescar la página.
  $: trabajosPorFecha = trabajos.reduce((acc, t) => {
    const fecha = t.fechaSalida;
    if (!acc[fecha]) acc[fecha] = [];
    acc[fecha].push(t);
    return acc;
  }, {} as Record<string, any[]>);

  function getDesgloses(numParte: string) {
    return desgloses.filter(d => d.numParte === numParte);
  }

  // Comprueba si un día corresponde a la fecha actual del sistema
  function esHoy(d: number, m: number, y: number): boolean {
    const hoy = new Date();
    return d === hoy.getDate() && m === hoy.getMonth() && y === hoy.getFullYear();
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
  
  // Mensajes flotantes (Toasts integrados de control para no usar alert)
  let toastMessage = "";
  let toastType = "success"; // "success" | "error" | "info"

  function showToast(msg: string, type = "success") {
    toastMessage = msg;
    toastType = type;
    setTimeout(() => {
      if (toastMessage === msg) toastMessage = "";
    }, 5000);
  }

  function handleDragStart(event: DragEvent, numParte: string) {
    draggedParte = numParte;
    if (event.dataTransfer) {
      event.dataTransfer.setData("text/plain", String(numParte));
      event.dataTransfer.effectAllowed = "move";
    }
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

    const numParteStr = event.dataTransfer?.getData("text/plain") || draggedParte;
    if (!numParteStr) return;

    // Localizamos el índice del parte de trabajo
    const jobIndex = trabajos.findIndex(t => t.numParte === numParteStr);
    if (jobIndex === -1) return;

    const originalDate = trabajos[jobIndex].fechaSalida;
    if (originalDate === targetDateStr) return; // Mismo día, no procesar

    // Modificación de UI optimista (La tarjeta se mueve de inmediato para dar fluidez)
    trabajos[jobIndex].fechaSalida = targetDateStr;
    trabajos = [...trabajos];

    showToast(`Actualizando entrega de parte #${numParteStr}...`, "info");

    try {
      const response = await fetch('/api/actualizar-fecha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numParte: numParteStr,
          nuevaFecha: targetDateStr
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Error en la actualización remota de Turso.');
      }

      showToast(`Parte #${numParteStr} guardado con éxito el ${targetDateStr}.`, "success");
    } catch (error: any) {
      console.error("❌ Falló el canje remoto:", error);
      // Reversión de UI optimista en caso de error
      trabajos[jobIndex].fechaSalida = originalDate;
      trabajos = [...trabajos];
      showToast(`Error al mover parte: ${error.message}. Movimiento revertido.`, "error");
    } finally {
      draggedParte = null;
    }
  }

  // Visor de Desgloses y Ficha Técnica lateral
  let selectedTrabajo: any = null;
  
  // Solución reactiva para calcular el desglose del parte seleccionado sin usar {@const} anidados prohibidos
  $: desglosesFiltro = selectedTrabajo ? getDesgloses(selectedTrabajo.numParte) : [];
  $: estadoActual = selectedTrabajo ? (selectedTrabajo.estado || 'Por hacer').toLowerCase() : 'por hacer';

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

  // 🎨 Retorna las clases de estilo por color exactas asociadas a cada estado (image_d42d7d.png)
  function getEstadoClases(estado: string): string {
    const est = (estado || 'Por hacer').toLowerCase();
    
    if (est === 'imprimiendo') {
      return 'bg-indigo-50/75 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50';
    } else if (est === 'manipulado') {
      return 'bg-amber-50/75 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
    } else if (est === 'terminado') {
      return 'bg-emerald-50/75 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
    } else if (est === 'urgente') {
      return 'bg-rose-50/90 text-rose-800 border-rose-200/80 animate-pulse-slow dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50';
    }
    // "Por hacer" o por defecto
    return 'bg-white text-slate-700 border-slate-200 dark:bg-[#1a1d24] dark:text-slate-200 dark:border-slate-850/80';
  }

  // 🛡️ ACCIONES DEL CONJUNTO TÉCNICO DE TRABAJO (image_d47fd4.png)
  async function cambiarEstado(nuevoEstado: string) {
    if (!selectedTrabajo) return;
    const originalEstado = selectedTrabajo.estado;
    const numParteStr = selectedTrabajo.numParte;

    // Modificación Optimista de UI en Caliente (Instantáneo, sin F5)
    trabajos = trabajos.map(t => t.numParte === numParteStr ? { ...t, estado: nuevoEstado } : t);
    selectedTrabajo = { ...selectedTrabajo, estado: nuevoEstado };

    showToast(`Cambiando estado del parte a "${nuevoEstado}"...`, "info");

    try {
      const response = await fetch('/api/actualizar-tarea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: numParteStr,
          estado: nuevoEstado,
          workspaceId: selectedTrabajo.workspaceId
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Error al cambiar estado en base de datos.');
      }

      showToast(`Parte #${numParteStr} actualizado con éxito a "${nuevoEstado}".`, "success");
    } catch (error: any) {
      console.error(error);
      // Reversión optimista de UI en caso de error
      trabajos = trabajos.map(t => t.numParte === numParteStr ? { ...t, estado: originalEstado } : t);
      selectedTrabajo = { ...selectedTrabajo, estado: originalEstado };
      showToast(`Error: No se pudo actualizar el estado: ${error.message}`, "error");
    }
  }

  // Confirmación nativa integrada de Svelte para borrado de partes (Elimina alert/confirm intrusivos)
  let showDeleteConfirmation = false;

  async function archivarEliminarTarea() {
    if (!showDeleteConfirmation) {
      showDeleteConfirmation = true;
      return;
    }

    if (!selectedTrabajo) return;
    const numParteStr = selectedTrabajo.numParte;

    showToast(`Eliminando parte de trabajo #${numParteStr}...`, "info");

    try {
      const response = await fetch('/api/eliminar-tarea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: numParteStr,
          workspaceId: selectedTrabajo.workspaceId
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Error al procesar la eliminación en Turso.');
      }

      // Eliminación física en el estado reactivo en memoria
      trabajos = trabajos.filter(t => t.numParte !== numParteStr);
      closeDetails();
      showToast(`Parte #${numParteStr} eliminado permanentemente del sistema.`, "success");
    } catch (error: any) {
      console.error(error);
      showToast(`Error al eliminar: ${error.message}`, "error");
    } finally {
      showDeleteConfirmation = false;
    }
  }

  // Controladores de accesibilidad seguros para evitar errores sintácticos de Svelte en "keydown"
  function handleCardKeydown(event: KeyboardEvent, trabajo: any) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetails(trabajo);
    }
  }

  function handleMoreKeydown(event: KeyboardEvent, trabajo: any) {
    if (event.key === 'Enter' || event.key === ' ') {
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
      from { opacity: 0; } 
      to { opacity: 1; } 
    }
    @keyframes slideLeft { 
      from { transform: translateX(100%); } 
      to { transform: translateX(0); } 
    }
    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes pulseSlow {
      0%, 100% { opacity: 1; }
      50% { opacity: .7; }
    }
  </style>
</svelte:head>

<div class="flex flex-col h-full select-none">
  <!-- CABECERA DEL CALENDARIO -->
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
    <div class="flex flex-col md:flex-row md:items-center gap-6">
      <div class="flex flex-col">
        <h1 class="text-3xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-3">
          📅 Planificación de Entregas
        </h1>
      </div>
       <!-- LEYENDA DE ESTADOS DE COLOR -->
      <div class="flex flex-wrap items-center gap-4 border-l border-slate-200 dark:border-slate-800 pl-0 md:pl-6 pt-2 md:pt-0">
        <div class="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          <span class="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white"></span>
          <span>Por Hacer</span>
        </div>
        <div class="flex items-center gap-1.5 text-[10px] font-semibold text-[#5C42FF] dark:text-indigo-400 uppercase tracking-wider">
          <span class="w-3.5 h-3.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center text-[8px]">🖨️</span>
          <span>Imprimiendo</span>
        </div>
        <div class="flex items-center gap-1.5 text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
          <span class="w-3.5 h-3.5 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-[8px]">📦</span>
          <span>Manipulado</span>
        </div>
        <div class="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
          <span class="w-3.5 h-3.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-[8px]">✔️</span>
          <span>Terminado</span>
        </div>
        <div class="flex items-center gap-1.5 text-[10px] font-semibold text-rose-600 uppercase tracking-wider animate-pulse">
          <span class="w-3.5 h-3.5 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-[8px]">⚡</span>
          <span>Urgente</span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3 self-end md:self-auto">
      <!-- Botón HOY -->
      <button 
        on:click={irAHoy}
        class="px-4 py-2 bg-white hover:bg-slate-50 dark:bg-[#16181c] dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center focus:outline-none"
      >
        Hoy
      </button>

      <!-- Selector de Meses -->
      <div class="flex items-center gap-3 bg-white dark:bg-[#16181c] border border-slate-200/60 dark:border-slate-800/80 p-1.5 rounded-2xl shadow-sm">
        <button 
          on:click={prevMonth}
          class="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
        </button>
        
        <span class="text-sm font-bold text-slate-800 dark:text-slate-100 min-w-[140px] text-center capitalize">
          {nombresMeses[currentMonth]} {currentYear}
        </span>
        
        <button 
          on:click={nextMonth}
          class="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
      
  </div>

  <!-- TOAST NOTIFICATION CORREGIDO -->
  {#if toastMessage}
    <div class="mb-4 p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold shadow-lg animate-fade-in
      {toastType === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' : ''}
      {toastType === 'error' ? 'bg-rose-50 text-rose-800 border-rose-150' : ''}
      {toastType === 'info' ? 'bg-[#5C42FF]/10 text-[#5C42FF] border-[#5C42FF]/20' : ''}">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full {toastType === 'success' ? 'bg-emerald-500' : ''} {toastType === 'error' ? 'bg-rose-500' : ''} {toastType === 'info' ? 'bg-[#5C42FF]' : ''}"></span>
        <span>{toastMessage}</span>
      </div>
      <button on:click={() => toastMessage = ""} class="text-slate-400 hover:text-slate-600 font-semibold ml-4">✕</button>
    </div>
  {/if}

  <!-- REJILLA SEMANAL -->
  <div class="grid grid-cols-7 gap-1.5 mb-2">
    {#each diasSemana as dia}
      <div class="text-center font-semibold text-[10px] text-slate-400 dark:text-slate-500 uppercase py-2 tracking-wider">
        {dia}
      </div>
    {/each}
  </div>

  <!-- MATRIZ MENSUAL (DIAS) -->
  <div class="grid grid-cols-7 border-t border-l border-slate-200 dark:border-slate-800/80 flex-1 min-h-[620px] rounded-2xl overflow-hidden">
    {#each daysGrid as { day, month, year, currentMonth }}
      {@const celdaFecha = formatDate(year, month, day)}
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
            {estaMarcadoDrag ? 'ring-2 ring-indigo-500 bg-indigo-50/25 dark:bg-indigo-950/15 border-indigo-500 scale-[1.01]' : ''}
            {estaExpandido ? 'overflow-visible z-50' : 'overflow-hidden'}"
        >
          <!-- Numero de dia -->
          <div class="flex justify-start mb-0.5">
            {#if esHoy(day, month, year)}
              <span class="text-xs font-semibold bg-[#5C42FF] text-white w-6 h-6 rounded-lg flex items-center justify-center shadow-sm select-none">
                {day}
              </span>
            {:else}
              <span class="text-xs font-semibold {currentMonth ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}">
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
                on:click={() => openDetails(trabajo)}
                on:keydown={(e) => handleCardKeydown(e, trabajo)}
                class="border p-2 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01] {getEstadoClases(trabajo.estado)}"
              >
                <div class="flex items-center justify-between gap-1">
                  <span class="text-[9.5px] font-semibold font-mono tracking-tight shrink-0">
                    #{trabajo.numParte}
                  </span>
                  <span class="text-[9px] font-semibold px-1.5 py-0.5 bg-white/40 dark:bg-black/20 rounded-md truncate max-w-[85px] capitalize">
                    {trabajo.area}
                  </span>
                </div>
                <p class="text-[10px] font-bold truncate mt-1">
                  {trabajo.cliente}
                </p>
              </div>
            {/each}

            <!-- Botón de saturación de tareas: "+ X más" (Activa la rejilla interactiva) -->
            {#if trabajosEnCelda.length > 2}
              <button 
                on:click|stopPropagation={() => toggleExpander(celdaFecha)}
                class="btn-expand-tasks w-full text-center py-1 bg-indigo-50/60 hover:bg-indigo-100/80 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/50 text-[#5C42FF] dark:text-[#7d68ff] text-[9.5px] font-semibold rounded-lg transition-colors cursor-pointer mt-auto"
              >
                + {trabajosEnCelda.length - 2} más
              </button>
            {/if}
          </div>

          <!-- 🛡️ NUEVO CONTENEDOR FLOTANTE INTERACTIVO DE EXPANSION DIRECTA (Bypass de Modales) -->
          {#if estaExpandido}
            <div class="absolute inset-x-0 top-0 min-h-full h-auto bg-white dark:bg-[#16181c] border-2 border-[#5C42FF] shadow-2xl rounded-2xl p-2.5 flex flex-col gap-1.5 z-[999] expanded-cell-container animate-scale-up">
              <!-- Header interior de la celda expandida -->
              <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
                <span class="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Planificadas ({day})</span>
                <button 
                  on:click|stopPropagation={() => expandedCellDate = null}
                  class="text-slate-400 hover:text-rose-500 font-bold text-xs p-1 rounded-full transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <!-- Listado completo e interactivo (Drap & Drop nativo habilitado) -->
              <div class="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                {#each trabajosEnCelda as trabajo}
                  <div 
                    draggable="true"
                    role="button"
                    tabindex="0"
                    on:dragstart={(e) => handleDragStart(e, trabajo.numParte)}
                    on:click|stopPropagation={() => openDetails(trabajo)}
                    on:keydown={(e) => handleCardKeydown(e, trabajo)}
                    class="border p-2 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] {getEstadoClases(trabajo.estado)}"
                  >
                    <div class="flex items-center justify-between gap-1">
                      <span class="text-[9.5px] font-semibold font-mono tracking-tight shrink-0">
                        #{trabajo.numParte}
                      </span>
                      <span class="text-[9px] font-semibold px-1.5 py-0.5 bg-white/40 dark:bg-black/20 rounded-md truncate max-w-[85px] capitalize">
                        {trabajo.area}
                      </span>
                    </div>
                    <p class="text-[10px] font-bold truncate mt-1">
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
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-[99999] animate-fade-in">
      <div class="w-full max-w-lg bg-white dark:bg-[#16181c] h-full shadow-2xl p-8 flex flex-col gap-6 overflow-y-auto animate-slide-left">
        <!-- Cabecera -->
        <div class="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 font-mono">PARTE #{selectedTrabajo.numParte}</span>
              <span class="text-[9px] font-semibold px-2 py-0.5 rounded-md uppercase {getEstadoClases(selectedTrabajo.estado)}">
                {selectedTrabajo.estado || 'Por hacer'}
              </span>
            </div>
            <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-1">{selectedTrabajo.cliente}</h2>
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
              <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Área de Producción</span>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block uppercase">{selectedTrabajo.area}</span>
            </div>
            
            <!-- 🔥 MEJORA DE USABILIDAD: Selector de fecha interactivo para editar en caliente -->
            <div class="bg-slate-50 dark:bg-[#1a1d24] p-3.5 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
              <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Fecha de Entrega (Editar)</span>
              <input 
                type="date" 
                value={selectedTrabajo.fechaSalida} 
                on:change={(e) => handleDateInputChange(e, selectedTrabajo.numParte)}
                class="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 block font-mono bg-transparent border-none p-0 outline-none w-full focus:ring-0 cursor-pointer dark:[color-scheme:dark]"
              />
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-[#1a1d24] p-4 rounded-2xl">
            <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Líneas de Desglose de Producto</span>
            {#if desglosesFiltro.length === 0}
              <p class="text-xs font-semibold text-slate-400 italic">No hay productos desglosados en este parte.</p>
            {:else}
              <div class="flex flex-col gap-2">
                {#each desglosesFiltro as d}
                  <div class="flex justify-between items-center text-xs border-b border-slate-200/40 dark:border-slate-800/40 py-1.5 font-semibold">
                    <span class="text-slate-700 dark:text-slate-300 uppercase">{d.descripcionProducto}</span>
                    <span class="font-mono text-[#5C42FF] dark:text-[#7d68ff] bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">{d.cantidad.toLocaleString()} uds</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <div class="bg-slate-50 dark:bg-[#1a1d24] p-4 rounded-2xl">
            <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Descripción Técnica</span>
            <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">{selectedTrabajo.descripcionGeneral || 'Sin descripción técnica registrada.'}</p>
          </div>
        </div>

        <!-- ACCIONES DE TRABAJO -->
        <div class="border-t border-slate-100 dark:border-slate-800 pt-5 flex flex-col gap-4">
          {#if estadoActual === 'terminado'}
            <div class="p-4 bg-[#F4FBF7] dark:bg-emerald-950/15 border border-[#D1F2E1] dark:border-emerald-900/40 rounded-2xl flex items-start gap-3.5 animate-scale-up">
              <svg class="w-5 h-5 text-[#00A854] dark:text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p class="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                Este parte de trabajo ya está archivado como <span class="font-semibold text-[#008F47] dark:text-emerald-400">Terminado</span>. Por seguridad de taller, su estado no puede volver a modificarse en frío.
              </p>
            </div>
          {:else}
            <span class="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Avanzar o Cambiar Estado de Producción</span>
            
            {#if estadoActual === 'por hacer' || estadoActual === 'urgente'}
              <div class="grid grid-cols-2 gap-2">
                <button 
                  on:click={() => cambiarEstado('Imprimiendo')}
                  class="py-2.5 px-2 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-[#5C42FF] dark:text-indigo-400 font-semibold text-[10.5px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span>Imprimiendo</span>
                </button>

                <button 
                  on:click={() => cambiarEstado('Manipulado')}
                  class="py-2.5 px-2 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-semibold text-[10.5px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  <span>Manipulado</span>
                </button>
              </div>

            {:else}
              <div class="grid grid-cols-1">
                <button 
                  on:click={() => cambiarEstado('Manipulado')}
                  class="py-2.5 px-2 w-full border border-amber-200 dark:border-amber-900/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-semibold text-[10.5px] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  <span>Avanzar a Manipulado</span>
                </button>
              </div>
            {/if}

            <button 
              on:click={() => cambiarEstado('Terminado')}
              class="w-full py-3 bg-[#5C42FF] hover:bg-[#4730D9] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Finalizar y Cerrar Orden de Trabajo (Archivar)
            </button>
          {/if}

          <button 
            on:click={archivarEliminarTarea}
            class="w-full py-3 bg-white hover:bg-rose-50/30 dark:bg-transparent dark:hover:bg-rose-950/10 border-2 border-dashed {showDeleteConfirmation ? 'border-rose-500 text-rose-750 bg-rose-50/50 dark:bg-rose-950/20' : 'border-rose-250 hover:border-rose-300 text-rose-600 dark:text-rose-400'} font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span>{showDeleteConfirmation ? '⚠️ ¿SEGURO? Haz clic de nuevo para eliminar' : 'Archivar u Ordenar Eliminación del Parte'}</span>
          </button>
        </div>

        <!-- Acciones generales -->
        <div class="mt-auto border-t border-slate-100 dark:border-slate-800 pt-5 flex gap-3">
          <a 
            href={`/w/${selectedTrabajo.workspaceId}/parte/${selectedTrabajo.numParte}/print`}
            target="_blank"
            class="flex-1 py-3 px-4 bg-slate-100 dark:bg-[#1a1d24] hover:bg-slate-200 dark:hover:bg-[#202530] text-slate-800 dark:text-slate-200 font-bold text-xs text-center rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            🖨️ Imprimir Ficha A3
          </a>
          <button 
            on:click={closeDetails}
            class="px-5 py-3 bg-slate-100 dark:bg-[#1a1d24] hover:bg-slate-200 dark:hover:bg-[#202530] text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
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
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[99999] animate-fade-in"
      on:click={cerrarMasTareas}
    >
      <div 
        class="bg-white dark:bg-[#16181c] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4 max-h-[85vh] overflow-hidden animate-scale-up"
        on:click|stopPropagation
      >
        <div class="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">Entregas Planificadas</h3>
            <p class="text-[10px] font-semibold text-slate-400 dark:text-slate-500 font-mono mt-0.5">{moreModalDate}</p>
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
              on:dragstart={(e) => { handleDragStart(e, trabajo.numParte); cerrarMasTareas(); }}
              on:click={() => { openDetails(trabajo); cerrarMasTareas(); }}
              on:keydown={(e) => handleMoreKeydown(e, trabajo)}
              class="border p-3 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] cursor-grab active:cursor-grabbing transition-all flex flex-col gap-1.5 {getEstadoClases(trabajo.estado)}"
            >
              <div class="flex items-center justify-between gap-1">
                <span class="text-[10px] font-semibold font-mono tracking-tight shrink-0">
                  #{trabajo.numParte}
                </span>
                <span class="text-[9.5px] font-semibold px-2 py-0.5 bg-white/40 dark:bg-black/20 rounded-md capitalize">
                  {trabajo.area}
                </span>
              </div>
              <p class="text-xs font-bold">
                {trabajo.cliente}
              </p>
            </div>
          {/each}
        </div>

        <button 
          on:click={cerrarMasTareas}
          class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#202530] dark:hover:bg-[#2a313d] text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          Cerrar Vista
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
    from { opacity: 0; } 
    to { opacity: 1; } 
  }
  
  @keyframes slideLeft { 
    from { transform: translateX(100%); } 
    to { transform: translateX(0); } 
  }
  
  @keyframes scaleUp {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes pulseSlow {
    0%, 100% { opacity: 1; }
    50% { opacity: .7; }
  }
</style>