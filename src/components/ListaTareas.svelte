<script lang="ts">
  import { busquedaGlobal } from '../stores/busqueda'; // Escucha la barra superior

  // RECEPCIÓN DE DATOS RELACIONALES DESDE ASTRO DB
  export let tareas: Array<{
    numParte: number;
    cliente: string;
    descripcionGeneral: string;
    comercial: string | null;
    estado: string;
    fechaSalida: string;
    area: string;
    subcontrata: string | null;
    desgloses?: Array<{ descripcionProducto: string; cantidad: number | null }>;
  }> = [];

  const listaComerciales = ["Marcos", "Alfonso", "Jesus", "Maria Jesús"];
  const listaEstados = ["Pendiente", "En proceso", "Terminado"];
  const listaAreas = ["Digital", "Offset", "Plotter", "OPX", "DTF", "Mimaki"];

  const configuracionAreas = [
    { id: "Digital", nombre: "Digital", icono: "computer", colorBg: "bg-blue-50/60", colorTexto: "text-blue-600", colorBorde: "border-blue-100" },
    { id: "Offset", nombre: "Offset", icono: "layers", colorBg: "bg-emerald-50/60", colorTexto: "text-emerald-600", colorBorde: "border-emerald-100" },
    { id: "Plotter", nombre: "Plotter", icono: "architecture", colorBg: "bg-amber-50/60", colorTexto: "text-amber-600", colorBorde: "border-amber-100" },
    { id: "OPX", nombre: "OPX", icono: "bolt", colorBg: "bg-purple-50/60", colorTexto: "text-purple-600", colorBorde: "border-purple-100" },
    { id: "DTF", nombre: "DTF", icono: "checkroom", colorBg: "bg-rose-50/60", colorTexto: "text-rose-600", colorBorde: "border-rose-100" },
    { id: "Mimaki", font: "Mimaki", icono: "palette", colorBg: "bg-cyan-50/60", colorTexto: "text-cyan-600", colorBorde: "border-cyan-100" }
  ];

  // CONFIGURACIÓN DE PAGINACIÓN 
  let paginaActual = 1;
  const tareasPorPagina = 8;

  let menuAbiertoNumParte: number | null = null;
  let modalEditarAbierto = false;
  let tareaEnEdicion: any = null;
  let modalEliminarAbierto = false;
  let numParteAEliminar: number | null = null;

  const coloresTextoEstado = {
    "Terminado": "text-[#5C42FF]",
    "En proceso": "text-blue-500",
    "Pendiente": "text-amber-500"
  };

  function ordenarMenuAcciones(numParte: number, event: Event) {
    event.stopPropagation();
    menuAbiertoNumParte = menuAbiertoNumParte === numParte ? null : numParte;
  }

  function cerrarMenus() { menuAbiertoNumParte = null; }

  // --- PERSISTENCIA: CAMBIO DE ESTADO RÁPIDO ---
  async function actualizarEstadoRapido(numParte: number, nuevoEstado: string) {
    const itemTarget = tareas.find(t => t.numParte === numParte);
    if (!itemTarget) return;

    tareas = tareas.map(t => t.numParte === numParte ? { ...t, estado: nuevoEstado } : t);
    menuAbiertoNumParte = null;

    try {
      await fetch('/api/actualizar-tarea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...itemTarget, estado: nuevoEstado })
      });
    } catch (e) {
      console.error("Error guardando estado rápido en Astro DB", e);
    }
  }

  // --- MODAL DE EDICIÓN ---
  function abrirModalEditar(tarea: any) {
    tareaEnEdicion = { 
      ...tarea,
      desgloses: tarea.desgloses ? tarea.desgloses.map((d: any) => ({ ...d })) : [{ descripcionProducto: "", cantidad: null }]
    };
    modalEditarAbierto = true;
  }

  function añadirFilaDesgloseEdicion() { tareaEnEdicion.desgloses = [...tareaEnEdicion.desgloses, { descripcionProducto: "", cantidad: null }]; }
  function eliminarFilaDesgloseEdicion(index: number) { if (tareaEnEdicion.desgloses.length > 1) { tareaEnEdicion.desgloses = tareaEnEdicion.desgloses.filter((_, i) => i !== index); } }

  // --- PERSISTENCIA: GUARDAR EDICIÓN ---
  async function guardarEdicion() {
    tareaEnEdicion.desgloses = tareaEnEdicion.desgloses.filter((d: any) => d.descripcionProducto !== "" && d.cantidad !== null);
    if (tareaEnEdicion.desgloses.length === 0) {
      tareaEnEdicion.desgloses = [{ descripcionProducto: "", cantidad: null }];
    }

    tareas = tareas.map(t => t.numParte === tareaEnEdicion.numParte ? { ...tareaEnEdicion } : t);
    modalEditarAbierto = false;

    try {
      await fetch('/api/actualizar-tarea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tareaEnEdicion)
      });
      tareaEnEdicion = null;
    } catch (e) {
      console.error("Error guardando maxi-modal en Astro DB", e);
    }
  }

  // --- PERSISTENCIA: CONFIRMAR ELIMINACIÓN ---
  function abrirModalEliminar(numParte: number) { numParteAEliminar = numParte; modalEliminarAbierto = true; }
  
  async function confirmarEliminar() {
    const objetivoAEliminar = numParteAEliminar;
    tareas = tareas.filter(t => t.numParte !== objetivoAEliminar);
    modalEliminarAbierto = false;
    numParteAEliminar = null;

    try {
      await fetch('/api/eliminar-tarea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numParte: objetivoAEliminar })
      });
    } catch (e) {
      console.error("Error eliminando registro en Astro DB", e);
    }
  }

  // EXPORTACIÓN PDF INDUSTRIAL EN BLANCO Y NEGRO CON ICONOS DE TRAZO FINO
  function exportarListadoAreaPDF(areaId: string) {
    const tareasPendientesArea = tareas.filter(t => t.area.toLowerCase() === areaId.toLowerCase() && t.estado !== 'Terminado');
    if (tareasPendientesArea.length === 0) {
      alert(`No hay tareas pendientes (sin terminar) asignadas a ${areaId}.`);
      return;
    }
    const tareasOrdenadas = [...tareasPendientesArea].sort((a, b) => new Date(a.fechaSalida).getTime() - new Date(b.fechaSalida).getTime());
    const ventanaPDF = window.open('', '_blank');
    if (!ventanaPDF) return;

    const fechaHoy = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaHoy = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // Generamos las filas de la tabla de forma aislada y segura para Svelte
    const tablaFilas = tareasOrdenadas.map(t => `
      <tr>
        <td class="bold-text">#${t.numParte}</td>
        <td>
          <div class="bold-text">${(t.descripcionGeneral || '').toUpperCase()}</div>
          <div style="font-size:9px; margin-top:3px;">CLIENTE: ${t.cliente.toUpperCase()}</div>
        </td>
        <td class="bold-text">${t.fechaSalida}</td>
      </tr>
    `).join('');

    ventanaPDF.document.write(`
      <html>
        <head>
          <title>JOB_LIST_${areaId.toUpperCase()}</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
            @page { size: A4 vertical; margin: 20mm; }
            body { font-family: 'JetBrains Mono', monospace; color: #000000; background: #ffffff; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
            
            .header-block { width: 100%; border-bottom: 2px solid #000000; padding-bottom: 12px; margin-bottom: 25px; }
            
            /* Alineamos el icono al mismo nivel que el texto de cabecera */
            .title-main { font-size: 15px; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
            .icon-pdf { font-size: 22px; color: #000000; }
            
            table { width: 100%; border-collapse: collapse; }
            th { padding: 8px 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #000000; }
            td { padding: 12px 4px; border-bottom: 1px dashed #000000; vertical-align: top; }
            .bold-text { font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header-block">
            <div class="title-main">
              <span class="material-symbols-outlined icon-pdf">print</span>
              <span>Aeroprint // Hoja de Producción: ${areaId.toUpperCase()}</span>
            </div>
            <div style="font-size:10px; margin-top:5px; padding-left: 30px;">EMISION: ${fechaHoy} - ${horaHoy} | TAREAS ACTIVAS</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:15%">Nº PARTE</th>
                <th style="width:65%">DESCRIPCION</th>
                <th style="width:20%">F. SALIDA</th>
              </tr>
            </thead>
            <tbody>
              ${tablaFilas}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 300); };
          <\/script>
        </body>
      </html>
    `);
    ventanaPDF.document.close();
  }

  // --- TRATAMIENTO DEL BUSCADOR SUPERIOR ---
  $: tareasFiltradas = (tareas || []).filter(t => {
    const query = ($busquedaGlobal || "").toLowerCase().trim();
    if (!query) return true;
    return t.numParte.toString().includes(query) || 
           t.cliente.toLowerCase().includes(query) || 
           (t.descripcionGeneral && t.descripcionGeneral.toLowerCase().includes(query));
  });

  let memorizarUltimaBusqueda = "";
  $: if ($busquedaGlobal !== memorizarUltimaBusqueda) {
    paginaActual = 1;
    memorizarUltimaBusqueda = $busquedaGlobal;
  }

  // --- COMPUTOS DE PAGINACIÓN ---
  $: totalTareasFiltradas = tareasFiltradas.length;
  $: totalPaginas = Math.ceil(totalTareasFiltradas / tareasPorPagina) || 1;
  $: tareasPaginadas = tareasFiltradas.slice((paginaActual - 1) * tareasPorPagina, paginaActual * tareasPorPagina);

  // Analíticas de panel globales
  $: totalTareasGlobal = tareas.length;
  $: completadas = tareas.filter(t => t.estado === 'Terminado').length;
  $: porcentajeEficiencia = totalTareasGlobal > 0 ? Math.round((completadas / totalTareasGlobal) * 100) : 0;
  $: contarIncompletasPorArea = (areaId: string) => tareas.filter(t => t.area.toLowerCase() === areaId.toLowerCase() && t.estado !== 'Terminado').length;
  $: contarCompletadasPorArea = (areaId: string) => tareas.filter(t => t.area.toLowerCase() === areaId.toLowerCase() && t.estado === 'Terminado').length;
</script>

<div class="w-full font-sans flex flex-col h-full space-y-6" on:click={cerrarMenus}>
  
  <div class="flex justify-between items-center flex-shrink-0">
    <div>
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-semibold text-[#1A1D21] tracking-tight">Task Ledger</h1>
        <span class="bg-[#5C42FF]/10 text-[#5C42FF] text-[11px] font-semibold px-2.5 py-1 rounded-full">
          🔄 {porcentajeEficiencia}% Eficiencia
        </span>
      </div>
      <p class="text-xs font-medium text-gray-400 mt-1">Gestiona y supervisa el flujo de órdenes de producción de Aeroprint.</p>
    </div>
  </div>

  <div class="bg-white rounded-3xl border border-[#E9EBF0] shadow-sm overflow-hidden flex flex-col">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-gray-100 bg-gray-50/50">
            <th class="px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest w-40">Status</th>
            <th class="px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Task Name</th>
            <th class="px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Due Date</th>
            <th class="px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Area</th>
            <th class="px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest text-right pr-8 w-36">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          {#each tareasPaginadas as tarea (tarea.numParte)}
            <tr class="group hover:bg-gray-50/40 transition-colors">
              <td class="px-6 py-4.5">
                <div class="flex items-center gap-2.5 text-xs font-semibold">
                  {#if tarea.estado === 'Terminado'}
                    <span class="material-symbols-outlined text-lg text-[#5C42FF]" style="font-variation-settings: 'wght' 400;">check_circle</span>
                    <span class="{coloresTextoEstado[tarea.estado]} font-semibold">{tarea.estado}</span>
                  {:else}
                    <span class="material-symbols-outlined text-lg {tarea.estado === 'En proceso' ? 'text-blue-500 animate-pulse' : 'text-amber-500'}" style="font-variation-settings: 'wght' 300;">
                      {tarea.estado === 'En proceso' ? 'motion_photos_on' : 'schedule'}
                    </span>
                    <span class="{coloresTextoEstado[tarea.estado]}">{tarea.estado}</span>
                  {/if}
                </div>
              </td>
              
              <td class="px-6 py-4.5">
                <div class="flex flex-col">
                  <span class="text-xs font-semibold text-[#1A1D21] max-w-xl truncate {tarea.estado === 'Terminado' ? 'line-through text-gray-400 font-medium' : ''}">
                    #{tarea.numParte} - {tarea.cliente}
                  </span>
                  <span class="text-[10px] font-medium text-gray-400 mt-0.5 uppercase tracking-wide">
                    {tarea.descripcionGeneral || 'Sin especificar descripción'}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4.5 text-xs font-semibold text-gray-500">{tarea.fechaSalida}</td>
              <td class="px-6 py-4.5">
                <span class="text-[9px] font-semibold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-gray-50 text-gray-500 border border-gray-100">
                  {tarea.area}
                </span>
              </td>
              
              <td class="px-6 py-4.5 text-right pr-8 relative">
                <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-end gap-3">
                  <button type="button" on:click={() => abrirModalEditar(tarea)} title="Editar Tarea" class="text-gray-400 hover:text-[#5C42FF] transition-all cursor-pointer flex items-center justify-center">
                    <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'wght' 300;">edit</span>
                  </button>
                  <button type="button" on:click={() => abrirModalEliminar(tarea.numParte)} title="Eliminar Tarea" class="text-gray-400 hover:text-red-500 transition-all cursor-pointer flex items-center justify-center">
                    <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'wght' 300;">delete</span>
                  </button>
                  
                  {#if tarea.estado !== 'Terminado'}
                    <div class="relative inline-block text-left">
                      <button type="button" on:click|stopPropagation={(e) => ordenarMenuAcciones(tarea.numParte, e)} class="text-gray-400 hover:text-black font-semibold text-base px-1 cursor-pointer flex items-center justify-center">
                        <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'wght' 300;">more_horiz</span>
                      </button>
                      {#if menuAbiertoNumParte === tarea.numParte}
                        <div class="absolute right-0 z-30 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 p-1.5 space-y-0.5 text-left animate-scale-up">
                          <button type="button" on:click={() => actualizarEstadoRapido(tarea.numParte, 'Pendiente')} class="w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold text-[#1A1D21] hover:bg-gray-50 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-base text-amber-500" style="font-variation-settings: 'wght' 300;">schedule</span> Pendiente
                          </button>
                          <button type="button" on:click={() => actualizarEstadoRapido(tarea.numParte, 'En proceso')} class="w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold text-[#1A1D21] hover:bg-gray-50 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-base text-blue-500" style="font-variation-settings: 'wght' 300;">motion_photos_on</span> En proceso
                          </button>
                          <button type="button" on:click={() => actualizarEstadoRapido(tarea.numParte, 'Terminado')} class="w-full text-left px-3 py-2 rounded-lg text-[11px] font-semibold text-[#1A1D21] hover:bg-gray-50 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-base text-[#5C42FF]" style="font-variation-settings: 'wght' 300;">check_circle</span> Terminado
                          </button>
                        </div>
                      {/if}
                    </div>
                  {:else}
                    <div class="w-4"></div>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="px-6 py-12 text-center text-xs font-semibold text-gray-400 bg-gray-50/20">
                <span class="material-symbols-outlined text-2xl block mb-1 opacity-50" style="font-variation-settings: 'wght' 200;">search_off</span>
                <span>No se han encontrado órdenes de trabajo que coincidan con tu búsqueda.</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="border-t border-gray-100 px-6 py-4 flex justify-between items-center bg-white flex-shrink-0">
      <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
        Showing {totalTareasFiltradas === 0 ? 0 : (paginaActual - 1) * tareasPorPagina + 1} to {Math.min(paginaActual * tareasPorPagina, totalTareasFiltradas)} of {totalTareasFiltradas} results
      </span>
      <div class="flex items-center gap-2">
        <button type="button" on:click={() => { if (paginaActual > 1) paginaActual--; }} disabled={paginaActual === 1} class="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-100 bg-white hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer">‹ Ant</button>
        <span class="text-xs font-semibold px-3 py-1 bg-purple-50 text-[#5C42FF] rounded-lg">{paginaActual} / {totalPaginas}</span>
        <button type="button" on:click={() => { if (paginaActual < totalPaginas) paginaActual++; }} disabled={paginaActual === totalPaginas} class="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-100 bg-white hover:bg-gray-50 disabled:opacity-30 transition-colors cursor-pointer">Sig ›</button>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0">
    <div class="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
      {#each configuracionAreas as area}
        <div class="bg-white border border-[#E9EBF0] rounded-3xl p-5 flex flex-col justify-between shadow-xs transition-all hover:shadow-sm hover:border-gray-300 group">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{area.nombre}</span>
            <span class="material-symbols-outlined text-lg p-2 rounded-xl border {area.colorBg} {area.colorTexto} {area.colorBorde}" style="font-variation-settings: 'wght' 300;">
              {area.icono}
            </span>
          </div>
          <div class="mt-4 flex items-end justify-between">
            <div class="space-y-0.5">
              <div class="flex items-baseline gap-1.5">
                <span class="text-3xl font-semibold text-[#1A1D21] tracking-tight">{contarIncompletasPorArea(area.id).toString().padStart(2, '0')}</span>
                <span class="text-[9px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">Activas</span>
              </div>
              <div class="text-[10px] font-medium text-gray-400 flex items-center gap-1 pl-0.5">
                <span>✓ {contarCompletadasPorArea(area.id).toString().padStart(2, '0')} listas</span>
              </div>
            </div>
            <button 
              type="button" 
              on:click|stopPropagation={() => exportarListadoAreaPDF(area.id)} 
              disabled={contarIncompletasPorArea(area.id) === 0} 
              class="text-[10px] font-semibold tracking-wider px-2.5 py-1.5 rounded-xl border border-purple-100/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1
                    {contarIncompletasPorArea(area.id) > 0 ? 'bg-purple-50 text-[#5C42FF] hover:bg-[#5C42FF] hover:text-white' : 'bg-gray-50 text-gray-400'}"
            >
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'wght' 200;">
                apk_document
              </span>
              <span>PDF</span>
            </button>
          </div>
        </div>
      {/each}
    </div>

    <div class="bg-[#5C42FF] rounded-3xl p-6 text-white shadow-xs flex flex-col justify-between border border-[#5C42FF]">
      <div>
        <span class="text-[9px] font-semibold text-purple-200 uppercase tracking-widest block mb-1">Quick Summary</span>
        <h3 class="text-lg font-semibold tracking-tight">Finish Strong</h3>
        <div class="mt-4 space-y-2">
          <div class="flex justify-between items-center border-b border-white/10 pb-1.5">
            <span class="text-xs font-semibold text-purple-100">Completed</span>
            <span class="text-base font-semibold">{completadas.toString().padStart(2, '0')}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs font-semibold text-purple-100">Pending</span>
            <span class="text-base font-semibold">{(totalTareasGlobal - completadas).toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>
      <button type="button" class="w-full bg-white text-[#5C42FF] font-semibold text-xs py-3 rounded-xl mt-5 hover:bg-purple-50 transition-colors shadow-xs">Weekly Review</button>
    </div>
  </div>

  {#if modalEditarAbierto && tareaEnEdicion}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" on:click={() => modalEditarAbierto = false}></div>
      <div class="bg-white rounded-3xl border border-[#E9EBF0] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10 p-8 space-y-6 relative text-[#1A1D21]">
        
        <div class="flex justify-between items-start border-b border-gray-100 pb-4">
          <div>
            <h2 class="text-2xl font-semibold text-[#1A1D21] tracking-tight">Editar Orden de Trabajo</h2>
            <p class="text-xs font-medium text-gray-400 mt-0.5">Modifica las especificaciones y el desglose de productos del parte #{tareaEnEdicion.numParte}.</p>
          </div>
          <button type="button" on:click={() => modalEditarAbierto = false} class="text-gray-400 flex items-center justify-center p-1 hover:text-black">
            <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 300;">close</span>
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Cliente</label>
            <input type="text" bind:value={tareaEnEdicion.cliente} class="w-full bg-[#F1F3F6] px-4 py-3 rounded-xl text-xs font-semibold text-[#1A1D21] outline-none" />
          </div>
          <div>
            <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Fecha de Salida</label>
            <input type="date" bind:value={tareaEnEdicion.fechaSalida} class="w-full bg-[#F1F3F6] px-4 py-3 rounded-xl text-xs font-semibold text-[#1A1D21] outline-none cursor-pointer" />
          </div>
        </div>

        <div>
          <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Descripción General del Trabajo</label>
          <input type="text" bind:value={tareaEnEdicion.descripcionGeneral} class="w-full bg-[#F1F3F6] px-4 py-3 rounded-xl text-xs font-semibold text-[#1A1D21] outline-none" />
        </div>

        <div class="border-t border-gray-100 pt-5">
          <div class="flex justify-between items-center mb-3">
            <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Líneas de Production / Cantidades</label>
            <button type="button" on:click={añadirFilaDesgloseEdicion} class="text-xs font-semibold text-[#5C42FF] bg-purple-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer">
              <span class="material-symbols-outlined text-base" style="font-variation-settings: 'wght' 300;">add</span> Añadir Producto
            </button>
          </div>
          <div class="space-y-3 max-h-48 overflow-y-auto pr-1">
            {#each tareaEnEdicion.desgloses as fila, index}
              <div class="flex items-center gap-4 bg-gray-50/40 p-3 rounded-2xl border border-gray-100/80">
                <input type="text" placeholder="Ej: Revistas 16pp..." bind:value={fila.descripcionProducto} class="flex-1 bg-[#F1F3F6] px-4 py-3 rounded-xl text-xs font-semibold text-[#1A1D21] outline-none" />
                <input type="number" placeholder="Cant." bind:value={fila.cantidad} class="w-32 bg-[#F1F3F6] px-4 py-3 rounded-xl text-xs font-semibold text-[#1A1D21] text-right outline-none" />
                {#if tareaEnEdicion.desgloses.length > 1}
                  <button type="button" on:click={() => eliminarFilaDesgloseEdicion(index)} class="text-gray-400 hover:text-red-500 transition-colors p-2 flex items-center justify-center cursor-pointer">
                    <span class="material-symbols-outlined text-lg" style="font-variation-settings: 'wght' 300;">delete</span>
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-gray-100 pt-5">
          <div>
            <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Comercial</label>
            <select bind:value={tareaEnEdicion.comercial} class="w-full bg-[#F1F3F6] px-4 py-3 rounded-xl text-xs font-semibold text-[#1A1D21] outline-none cursor-pointer">
              <option value="">Ninguno</option>
              {#each listaComerciales as c}<option value={c}>{c}</option>{/each}
            </select>
          </div>
          <div>
            <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Área de Production</label>
            <select bind:value={tareaEnEdicion.area} class="w-full bg-[#F1F3F6] px-4 py-3 rounded-xl text-xs font-semibold text-[#1A1D21] outline-none cursor-pointer">
              {#each listaAreas as a}<option value={a}>{a}</option>{/each}
            </select>
          </div>
          <div>
            <label class="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Estado del Parte</label>
            <select bind:value={tareaEnEdicion.estado} class="w-full bg-[#F1F3F6] px-4 py-3 rounded-xl text-xs font-semibold text-[#1A1D21] outline-none cursor-pointer">
              {#each listaEstados as est}<option value={est}>{est}</option>{/each}
            </select>
          </div>
        </div>

        <div>
          <label class="text-[10px] font-semibold text-orange-500 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
            <span class="material-symbols-outlined text-sm text-orange-500" style="font-variation-settings: 'wght' 300;">handshake</span> Taller Externo (Subcontrata)
          </label>
          <input type="text" bind:value={tareaEnEdicion.subcontrata} placeholder="Fabricación interna de Aeroprint" class="w-full bg-[#F1F3F6] px-4 py-3 rounded-xl text-xs font-semibold text-[#1A1D21] outline-none" />
        </div>

        <div class="border-t border-gray-100 pt-5 flex justify-end gap-3">
          <button type="button" on:click={() => modalEditarAbierto = false} class="px-6 py-3 border border-dashed border-gray-200 text-gray-400 font-semibold text-xs rounded-full cursor-pointer">Cancelar</button>
          <button type="button" on:click={guardarEdicion} class="px-6 py-3 bg-[#5C42FF] text-white font-semibold text-xs rounded-full shadow-md shadow-[#5C42FF]/10 cursor-pointer">Guardar Cambios ➔</button>
        </div>
      </div>
    </div>
  {/if}

  {#if modalEliminarAbierto}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" on:click={() => modalEliminarAbierto = false}></div>
      <div class="bg-white rounded-3xl border border-[#E9EBF0] shadow-2xl w-full max-w-md z-10 p-6 space-y-4 text-center text-[#1A1D21]">
        <div class="w-11 h-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-1 border border-red-100/50">
          <span class="material-symbols-outlined text-xl" style="font-variation-settings: 'wght' 400;">warning</span>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-[#1A1D21] tracking-tight">¿Eliminar orden de trabajo?</h3>
          <p class="text-xs font-medium text-gray-400 mt-1 leading-relaxed">Estás a punto de eliminar la tarea número <span class="text-red-500 font-semibold">#{numParteAEliminar}</span>. Esta acción es permanente.</p>
        </div>
        <div class="grid grid-cols-2 gap-3 pt-1">
          <button type="button" on:click={() => modalEliminarAbierto = false} class="w-full py-2.5 border border-gray-100 text-gray-400 font-semibold text-xs rounded-xl cursor-pointer">Cancelar</button>
          <button type="button" on:click={confirmarEliminar} class="w-full py-2.5 bg-red-500 text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer">Sí, Eliminar</button>
        </div>
      </div>
    </div>
  {/if}

</div>

<style>
  @keyframes scale-up { from { opacity: 0; transform: scale(0.97) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .animate-scale-up { animation: scale-up 0.12s ease-out forwards; }
</style>