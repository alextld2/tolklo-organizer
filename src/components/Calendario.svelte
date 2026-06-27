<script lang="ts">
  import { onMount } from 'svelte';

  // RECEPCIÓN DE DATOS DE ASTRO DB
  export let trabajosIniciales: any[] = [];
  export let desglosesIniciales: any[] = [];

  let trabajos = [...trabajosIniciales];
  let desgloses = [...desglosesIniciales];

  let fechaVisualizada = new Date();
  
  // 🔥 CORREGIDO: Diccionario expandido para soportar de forma nativa e integrada el modo oscuro
  const coloresEstado = {
    "En proceso": "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    "Terminado": "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    "Pendiente": "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  };

  // Control de Modales
  let modalMasAbierto = false; 
  let trabajosModalMas: typeof trabajos = [];
  let fechaModalMasTexto = "";

  let modalDetalleAbierto = false; 
  let trabajoSeleccionado: any = null;
  let confirmandoEliminar = false;

  // Cálculos dinámicos del calendario
  $: año = fechaVisualizada.getFullYear();
  $: mesIndex = fechaVisualizada.getMonth();
  $: nombreMes = fechaVisualizada.toLocaleString('es-ES', { month: 'long' });
  $: primerDiaDelMes = new Date(año, mesIndex, 1).getDay();
  $: offset = primerDiaDelMes === 0 ? 6 : primerDiaDelMes - 1; 
  $: diasEnMes = new Date(año, mesIndex + 1, 0).getDate();
  $: celdas = [...Array(offset).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)];

  // Funciones de Navegación
  const mesAnterior = () => fechaVisualizada = new Date(año, mesIndex - 1, 1);
  const mesSiguiente = () => fechaVisualizada = new Date(año, mesIndex + 1, 1);
  const irAHoy = () => fechaVisualizada = new Date();

  function abrirDetallesTrabajo(e: MouseEvent, trabajo: any) {
    e.stopPropagation(); 
    trabajoSeleccionado = trabajo;
    confirmandoEliminar = false; 
    modalDetalleAbierto = true;
  }

  function cerrarModalDetalle() {
    modalDetalleAbierto = false;
    trabajoSeleccionado = null;
  }

  function cambiarEstado(nuevoEstado: string) {
    if (trabajoSeleccionado) {
      trabajos = trabajos.map(t => t.numParte === trabajoSeleccionado.numParte ? { ...t, estado: nuevoEstado } : t);
      trabajoSeleccionado.estado = nuevoEstado; 
      cerrarModalDetalle();
    }
  }

  function eliminarTrabajo() {
    if (trabajoSeleccionado) {
      if (!confirmandoEliminar) {
        confirmandoEliminar = true; 
        return;
      }
      trabajos = trabajos.filter(t => t.numParte !== trabajoSeleccionado.numParte);
      if (modalMasAbierto) {
        trabajosModalMas = trabajos.filter(t => t.fechaSalida === trabajoSeleccionado.fechaSalida);
      }
      cerrarModalDetalle();
    }
  }

  function abrirModalMas(fechaString: string, todosLosTrabajos: typeof trabajos, dia: number) {
    fechaModalMasTexto = `${dia} de ${nombreMes} ${año}`;
    trabajosModalMas = todosLosTrabajos;
    modalMasAbierto = true;
  }

  function cerrarModalMas() { modalMasAbierto = false; }

  function iniciarArrastre(e: DragEvent, numParte: number) {
    e.dataTransfer?.setData("text/plain", numParte.toString());
  }

  async function soltar(e: DragEvent, fechaSalidaNueva: string) {
    e.preventDefault();
    const numParteStr = e.dataTransfer?.getData("text/plain");
    
    if (numParteStr) {
      const numParteInt = parseInt(numParteStr);
      const tareaMovida = trabajos.find(t => t.numParte === numParteInt);
      if (tareaMovida && tareaMovida.fechaSalida === fechaSalidaNueva) return;

      const copiaSeguridadTrabajos = [...trabajos];
      const copiaSeguridadModalMas = [...trabajosModalMas];

      trabajos = trabajos.map(t => t.numParte === numParteInt ? { ...t, fechaSalida: fechaSalidaNueva } : t);
      
      if (modalMasAbierto && tareaMovida) {
        trabajosModalMas = trabajos.filter(t => t.fechaSalida === tareaMovida.fechaSalida);
      }

      try {
        const respuesta = await fetch('/api/actualizar-fecha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ numParte: numParteInt, nuevaFecha: fechaSalidaNueva })
        });
        if (!respuesta.ok) throw new Error("Error de servidor");
      } catch (error) {
        trabajos = copiaSeguridadTrabajos;
        trabajosModalMas = copiaSeguridadModalMas;
        alert("❌ Error: No se pudo guardar la fecha en la base de datos. Movimiento revertido.");
      }
    }
  }
</script>

<div class="flex flex-col h-full w-full font-sans relative text-[#1A1D21] dark:text-[#EDF0F3]">
  
  <div class="flex items-center justify-between pb-6 flex-shrink-0">
    <div>
      <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Production Calendar</p>
      
      <div class="flex items-center gap-6">
        <h1 class="text-3xl font-semibold capitalize tracking-tight text-[#1A1D21] dark:text-[#EDF0F3]">{nombreMes} {año}</h1>
        
        <div class="hidden lg:flex items-center gap-4 border-l border-gray-200 dark:border-gray-800 pl-6 mt-1">
          <div class="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <span class="material-symbols-rounded text-base text-amber-500" style="font-variation-settings: 'wght' 300;">schedule</span>
            <span>Pendiente</span>
          </div>
          <div class="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <span class="material-symbols-rounded text-base text-blue-500" style="font-variation-settings: 'wght' 300;">motion_photos_on</span>
            <span>En proceso</span>
          </div>
          <div class="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
            <span class="material-symbols-rounded text-base text-emerald-500" style="font-variation-settings: 'wght' 300;">check_circle</span>
            <span>Terminado</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="flex items-center gap-3">
      <button on:click={irAHoy} class="px-4 py-2 text-xs font-semibold bg-white dark:bg-[#1E2228] border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-xs text-[#1A1D21] dark:text-[#EDF0F3] cursor-pointer">Hoy</button>
      
      <div class="flex items-center bg-white dark:bg-[#1E2228] border border-gray-200 dark:border-gray-800 rounded-xl p-0.5 shadow-xs">
        <button on:click={mesAnterior} class="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all text-gray-600 dark:text-gray-400 cursor-pointer">
          <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">chevron_left</span>
        </button>
        <div class="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-0.5"></div>
        <button on:click={mesSiguiente} class="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all text-gray-600 dark:text-gray-400 cursor-pointer">
          <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">chevron_right</span>
        </button>
      </div>
    </div>
  </div>

  <div class="flex-1 bg-white dark:bg-[#16191D] rounded-3xl shadow-sm border border-gray-100 dark:border-[#232830] overflow-hidden flex flex-col transition-colors">
    
    <div class="grid grid-cols-7 border-b border-gray-100 dark:border-[#232830] bg-white dark:bg-[#16191D] flex-shrink-0">
      {#each ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as d}
        <div class="py-3 text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{d}</div>
      {/each}
    </div>

    <div class="grid grid-cols-7 flex-1 overflow-y-auto bg-white dark:bg-[#0E1114] divide-x divide-y divide-gray-50 dark:divide-[#232830]/40">
      {#each celdas as dia}
        {#if dia === null}
          <div class="min-h-[135px] bg-white dark:bg-[#111418]/40"></div>
        {:else}
          {@const fechaString = `${año}-${(mesIndex + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`}
          {@const trabajosDelDia = trabajos.filter(t => t.fechaSalida === fechaString)}
          
          <div 
            role="gridcell"
            class="min-h-[135px] p-2.5 bg-white dark:bg-[#16191D] hover:bg-gray-50/40 dark:hover:bg-[#1E2228]/50 transition-colors flex flex-col group relative"
            on:dragover|preventDefault
            on:drop={(e) => soltar(e, fechaString)}
          >
            <div class="flex justify-between items-center mb-1.5">
              <span class="text-xs font-semibold tracking-wide {dia === new Date().getDate() && mesIndex === new Date().getMonth() && año === new Date().getFullYear() ? 'bg-[#5C42FF] text-white w-5 h-5 rounded-md flex items-center justify-center text-[11px]' : 'text-gray-400 dark:text-gray-500'}">{dia}</span>
            </div>

            <div class="flex-1 space-y-1">
              {#each trabajosDelDia.slice(0, 4) as trabajo (trabajo.numParte)}
                <div 
                  role="button"
                  tabindex="0"
                  draggable="true"
                  on:dragstart={(e) => iniciarArrastre(e, trabajo.numParte)}
                  on:click={(e) => abrirDetallesTrabajo(e, trabajo)}
                  class="px-2.5 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-all truncate border flex items-center justify-between {coloresEstado[trabajo.estado] || 'bg-gray-50 text-gray-600 border-gray-100'}"
                  title="{trabajo.numParte} - {trabajo.cliente}"
                >
                  <span class="truncate">#{trabajo.numParte} {trabajo.cliente}</span>
                  {#if trabajo.subcontrata}
                    <span class="material-symbols-rounded text-xs text-orange-500 ml-1" style="font-variation-settings: 'wght' 300;">handshake</span>
                  {/if}
                </div>
              {/each}

              {#if trabajosDelDia.length > 4}
                <button 
                  on:click|stopPropagation={() => abrirModalMas(fechaString, trabajosDelDia, dia)}
                  class="w-full text-center py-1 rounded-lg text-[9px] font-semibold bg-gray-50 dark:bg-[#1E2228] hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-800 transition-colors mt-1 cursor-pointer"
                >
                  +{trabajosDelDia.length - 4} más
                </button>
              {/if}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>

  {#if modalMasAbierto}
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[250] flex items-center justify-center p-4 animate-fade-in" on:click={cerrarModalMas}>
      <div class="bg-white dark:bg-[#16191D] border border-gray-100 dark:border-[#232830] rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[70vh]" on:click|stopPropagation>
        <div class="flex justify-between items-center mb-4 flex-shrink-0">
          <div>
            <p class="text-[9px] font-semibold text-[#5C42FF] dark:text-[#9A85FF] uppercase tracking-widest mb-0.5">Orders Overview</p>
            <h3 class="text-lg font-semibold text-[#1A1D21] dark:text-[#EDF0F3] capitalize">{fechaModalMasTexto}</h3>
          </div>
          <button on:click={cerrarModalMas} class="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-[#1E2228] hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 cursor-pointer">
            <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">close</span>
          </button>
        </div>

        <div class="overflow-y-auto space-y-2 flex-1 pr-1">
          {#each trabajosModalMas as trabajo (trabajo.numParte)}
            <div 
              role="button"
              tabindex="0"
              on:click={(e) => abrirDetallesTrabajo(e, trabajo)}
              class="px-4 py-2.5 rounded-xl text-xs font-medium border border-gray-100 dark:border-[#232830] bg-gray-50/30 dark:bg-[#1E2228]/40 hover:bg-gray-50 dark:hover:bg-[#1E2228] transition-all cursor-pointer flex justify-between items-center"
            >
              <div class="flex items-center gap-2">
                <span class="text-gray-400 dark:text-gray-500">#{trabajo.numParte}</span>
                <span class="font-semibold text-[#1A1D21] dark:text-[#EDF0F3]">{trabajo.cliente}</span>
                {#if trabajo.subcontrata}
                  <span class="material-symbols-rounded text-sm text-orange-500" style="font-variation-settings: 'wght' 300;">handshake</span>
                {/if}
              </div>
              <span class="px-2 py-0.5 text-[9px] font-semibold rounded-md uppercase border {coloresEstado[trabajo.estado]}">{trabajo.estado}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if modalDetalleAbierto && trabajoSeleccionado}
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[300] flex items-center justify-center p-4 animate-fade-in" on:click={cerrarModalDetalle}>
      <div class="bg-white dark:bg-[#16191D] border border-[#E9EBF0] dark:border-[#232830] rounded-3xl w-full max-w-2xl p-8 shadow-2xl flex flex-col max-h-[90vh] relative animate-scale-up text-[#1A1D21] dark:text-[#EDF0F3] transition-colors overflow-y-auto" on:click|stopPropagation>
        
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 bg-black text-white dark:bg-[#1E2228] dark:border dark:border-gray-800 text-[10px] font-bold rounded-lg tracking-wider uppercase">
              Parte #{trabajoSeleccionado.numParte}
            </span>
            <span class="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider border {coloresEstado[trabajoSeleccionado.estado]}">
              {trabajoSeleccionado.estado}
            </span>
          </div>
          <button on:click={cerrarModalDetalle} class="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-[#1E2228] hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 cursor-pointer outline-none border border-transparent">
            <span class="material-symbols-rounded text-lg">close</span>
          </button>
        </div>

        <h2 class="text-3xl font-extrabold tracking-tight text-[#1A1D21] dark:text-[#EDF0F3] uppercase mb-6">
          {trabajoSeleccionado.cliente}
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          <div class="flex items-center gap-3 bg-[#F8F9FB] dark:bg-[#1E2228]/60 border border-[#E9EBF0]/60 dark:border-[#232830] p-3 rounded-xl">
            <div class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">account_circle</span>
            </div>
            <div class="min-w-0 flex flex-col">
              <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Comercial</span>
              <span class="text-xs font-bold mt-1 text-[#1A1D21] dark:text-[#EDF0F3] truncate">{trabajoSeleccionado.comercial || 'Sin asignar'}</span>
            </div>
          </div>

          <div class="flex items-center gap-3 bg-[#F8F9FB] dark:bg-[#1E2228]/60 border border-[#E9EBF0]/60 dark:border-[#232830] p-3 rounded-xl">
            <div class="w-9 h-9 rounded-lg bg-purple-50 dark:bg-[#5C42FF]/10 text-[#5C42FF] dark:text-white flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">layers</span>
            </div>
            <div class="min-w-0 flex flex-col">
              <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Área</span>
              <span class="text-xs font-bold mt-1 text-[#1A1D21] dark:text-[#EDF0F3] truncate">{trabajoSeleccionado.area}</span>
            </div>
          </div>

          <div class="flex items-center gap-3 bg-[#F8F9FB] dark:bg-[#1E2228]/60 border border-[#E9EBF0]/60 dark:border-[#232830] p-3 rounded-xl">
            <div class="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">palette</span>
            </div>
            <div class="min-w-0 flex flex-col">
              <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Diseñador</span>
              <span class="text-xs font-bold mt-1 text-emerald-600 dark:text-emerald-400 truncate">{trabajoSeleccionado.diseñador || 'Sin asignar'}</span>
            </div>
          </div>

          <div class="flex items-center gap-3 bg-[#F8F9FB] dark:bg-[#1E2228]/60 border border-[#E9EBF0]/60 dark:border-[#232830] p-3 rounded-xl">
            <div class="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">calendar_today</span>
            </div>
            <div class="min-w-0 flex flex-col">
              <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Entrega</span>
              <span class="text-xs font-bold mt-1 text-[#1A1D21] dark:text-[#EDF0F3] truncate">{trabajoSeleccionado.fechaSalida}</span>
            </div>
          </div>

        </div>

        <div class="mt-6">
          <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <span class="material-symbols-rounded text-sm" style="font-variation-settings: 'wght' 300;">description</span>
            <span>Descripción General del Pedido</span>
          </p>
          <div class="bg-white dark:bg-[#1A1D21] p-4 rounded-2xl border border-[#E9EBF0] dark:border-[#232830] text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed shadow-xs">
            {trabajoSeleccionado.descripcionGeneral || 'Sin descripción general redactada.'}
          </div>
        </div>

        <div class="mt-6">
          <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
            <span class="material-symbols-rounded text-sm" style="font-variation-settings: 'wght' 300;">reorder</span>
            <span>Desglose Técnico de Producción</span>
          </p>
          <div class="border border-gray-100 dark:border-[#232830] rounded-2xl overflow-hidden bg-white dark:bg-[#1A1D21] shadow-xs">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50/80 dark:bg-[#1E2228]/40 border-b border-gray-100 dark:border-[#232830] text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  <th class="p-3.5 pl-5">Producto / Subtarea</th>
                  <th class="p-3.5 text-right pr-5">Cantidad</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-50 dark:divide-[#232830]/40 text-xs text-[#1A1D21] dark:text-[#EDF0F3]">
                {#each desgloses.filter(d => d.numParte === trabajoSeleccionado.numParte) as subItem}
                  <tr class="hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-colors">
                    <td class="p-3.5 pl-5 font-medium text-gray-600 dark:text-gray-400">{subItem.descripcionProducto}</td>
                    <td class="p-3.5 text-right pr-5">
                      <span class="bg-purple-50 dark:bg-[#5C42FF]/10 text-[#5C42FF] dark:text-[#9A85FF] px-2.5 py-1 rounded-md font-bold text-[11px] border border-purple-100/40 dark:border-transparent">
                        {subItem.cantidad.toLocaleString()} uds
                      </span>
                    </td>
                  </tr>
                {:else}
                  <tr>
                    <td colspan="2" class="p-8 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center gap-2">
                      <span class="material-symbols-rounded text-3xl opacity-30" style="font-variation-settings: 'wght' 100;">inventory_2</span>
                      <span class="text-[11px] font-medium italic">No hay subproductos detallados en este parte.</span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>

        {#if trabajoSeleccionado.subcontrata}
          <div class="mt-4 flex items-center gap-2 px-4 py-3 bg-orange-500/5 border border-orange-500/10 rounded-2xl animate-fade-in">
            <span class="material-symbols-rounded text-orange-500 text-base" style="font-variation-settings: 'wght' 300;">handshake</span>
            <p class="text-[11px] font-medium text-orange-600 dark:text-orange-400">
              Esta orden se encuentra externalizada en: <span class="font-bold uppercase">{trabajoSeleccionado.subcontrata}</span>
            </p>
          </div>
        {/if}

        <div class="mt-8 border-t border-gray-100 dark:border-[#232830] pt-5 space-y-3 flex-shrink-0">
          
          {#if trabajoSeleccionado.estado === 'Terminado'}
            <div class="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3.5 flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-xs font-medium animate-fade-in">
              <span class="material-symbols-rounded text-lg text-emerald-600" style="font-variation-settings: 'wght' 300;">lock</span>
              <p>Este parte de trabajo ya está archivado como <strong>Terminado</strong>. Por seguridad de taller, su estado no puede volver a modificarse en frío.</p>
            </div>
          {:else}
            <div class="animate-fade-in space-y-3">
              <p class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center block mb-1">Avanzar o Cambiar Estado de Producción</p>
              
              {#if trabajoSeleccionado.estado !== 'En proceso'}
                <button 
                  on:click={() => cambiarEstado('En proceso')} 
                  class="w-full py-3.5 border border-[#E9EBF0] dark:border-[#232830] text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 font-bold text-xs rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
                >
                  <span class="material-symbols-rounded text-base" style="font-variation-settings: 'wght' 400;">motion_photos_on</span>
                  <span>Poner En proceso</span>
                </button>
              {/if}

              {#if trabajoSeleccionado.estado !== 'Pendiente'}
                <button 
                  on:click={() => cambiarEstado('Pendiente')} 
                  class="w-full py-3.5 border border-[#E9EBF0] dark:border-[#232830] text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 font-bold text-xs rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
                >
                  <span class="material-symbols-rounded text-base" style="font-variation-settings: 'wght' 400;">schedule</span>
                  <span>Poner Pendiente</span>
                </button>
              {/if}

              <button 
                on:click={() => cambiarEstado('Terminado')} 
                class="w-full py-3.5 bg-[#5C42FF] text-white hover:bg-[#4B33E6] font-bold text-xs rounded-full shadow-lg shadow-[#5C42FF]/10 dark:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer outline-none"
              >
                <span class="material-symbols-rounded text-base" style="font-variation-settings: 'wght' 400;">check_circle</span>
                <span>Finalizar y Cerrar Orden de Trabajo (Archivar)</span>
              </button>
            </div>
          {/if}

          <div class="pt-1">
            {#if !confirmandoEliminar}
              <button on:click={eliminarTrabajo} class="w-full text-center py-2.5 text-xs font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full border border-dashed border-red-200/60 dark:border-red-500/20 transition-colors cursor-pointer flex items-center justify-center gap-1.5 outline-none">
                <span class="material-symbols-rounded text-base" style="font-variation-settings: 'wght' 300;">delete</span>
                <span>Archivar u Ordenar Eliminación del Parte</span>
              </button>
            {:else}
              <div class="p-4 bg-red-50/40 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 flex flex-col items-center animate-scale-up">
                <p class="text-xs font-medium text-red-600 dark:text-red-400 mb-3 text-center">⚠️ ¿Estás seguro? Esta acción eliminará el registro histórico definitivo del parte.</p>
                <div class="flex gap-2 w-full max-w-sm">
                  <button on:click={eliminarTrabajo} class="flex-1 text-center py-2.5 text-xs font-semibold bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer outline-none">Sí, eliminar</button>
                  <button on:click={() => confirmandoEliminar = false} class="flex-1 text-center py-2.5 text-xs font-semibold bg-white dark:bg-[#1E2228] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer outline-none">Cancelar</button>
                </div>
              </div>
            {/if}
          </div>
        </div>

      </div>
    </div>
  {#if modalDetalleAbierto && trabajoSeleccionado}
  {/if}
{/if}

</div>

<style>
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scale-up { from { opacity: 0; transform: scale(0.97) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .animate-fade-in { animation: fade-in 0.18s ease-out forwards; }
  .animate-scale-up { animation: scale-up 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>