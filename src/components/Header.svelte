<script lang="ts">
  import { onMount } from 'svelte';
  import { busquedaGlobal } from '../stores/busqueda';
  
  let tieneFoco = false;
  let workspace = "produccion";

  // Almacenes de respuesta de la API SQL
  let clientesEncontrados: any[] = [];
  let tareasEncontradas: any[] = [];

  // Estados para la ventana modal de resumen
  let modalAbierto = false;
  let tareaSeleccionada: any = null;
  let desglosesTarea: any[] = []; // <-- Almacén dinámico para las líneas de producto

  onMount(() => {
    const segmentos = window.location.pathname.split('/');
    if (segmentos[1] === 'w' && segmentos[2]) {
      workspace = segmentos[2];
    }
  });

  // Escucha reactiva para interrogar al motor SQL predictor
  $: {
    const query = $busquedaGlobal.trim();
    if (query.length >= 2) {
      fetch(`/api/search.json?q=${encodeURIComponent(query)}&workspace=${workspace}`)
        .then(res => res.json())
        .then(data => {
          clientesEncontrados = data.clientes || [];
          tareasEncontradas = data.tareas || [];
        })
        .catch(err => console.error("Error en la consulta del buscador:", err));
    } else {
      clientesEncontrados = [];
      tareasEncontradas = [];
    }
  }

  $: mostrarResultados = tieneFoco && $busquedaGlobal.trim().length >= 2;

  // 🔥 MEJORA: Abre el resumen y se trae los desgloses en segundo plano al instante
  async function abrirResumen(tarea: any) {
    tareaSeleccionada = tarea;
    modalAbierto = true;
    desglosesTarea = []; // Limpieza inicial

    try {
      const res = await fetch(`/api/desglose-tarea?numParte=${tarea.numParte}`);
      if (res.ok) {
        desglosesTarea = await res.json();
      }
    } catch (e) {
      console.error("Error cargando líneas de producción:", e);
    }
  }

  function cerrarModal() {
    modalAbierto = false;
    tareaSeleccionada = null;
    desglosesTarea = [];
  }
</script>

<header class="h-20 w-full flex items-center px-10 justify-center relative z-40 bg-[#F8F9FB] dark:bg-[#0E1114] transition-colors duration-200 font-sans">
  
  <div class="relative w-full max-w-md">
    <span class="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center select-none pointer-events-none">
      <span class="material-symbols-rounded text-gray-400 dark:text-gray-500 text-lg" style="font-variation-settings: 'wght' 300;">
        search
      </span>
    </span>
    
    <input 
      type="text" 
      placeholder="Buscar por nº parte, cliente o trabajo..." 
      bind:value={$busquedaGlobal}
      on:focus={() => tieneFoco = true}
      on:blur={() => setTimeout(() => tieneFoco = false, 250)}
      class="w-full bg-[#F1F3F6] dark:bg-[#1E2228] border border-transparent focus:border-[#5C42FF] dark:focus:border-[#7A62FF] pl-11 pr-4 py-2.5 rounded-2xl text-xs font-bold text-[#1A1D21] dark:text-[#EDF0F3] outline-none focus:bg-[#F1F3F6] dark:focus:bg-[#1E2228] transition-all placeholder-gray-400/80 dark:placeholder-gray-500 shadow-xs"
    />

    {#if mostrarResultados}
      <div class="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-[#16191D] border border-[#E9EBF0] dark:border-[#232830] rounded-2xl shadow-xl p-4 z-50 animate-scale-up text-[#1A1D21] dark:text-[#EDF0F3] transition-colors max-h-[380px] overflow-y-auto">
        
        {#if clientesEncontrados.length > 0}
          <div class="mb-4">
            <p class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Clientes</p>
            <div class="space-y-1">
              {#each clientesEncontrados as cl}
                <div class="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1E2228] transition-colors group">
                  <div class="flex items-center gap-3">
                    <span class="material-symbols-rounded text-gray-400 dark:text-gray-500 text-lg" style="font-variation-settings: 'wght' 300;">badge</span>
                    <span class="text-xs font-semibold">{cl.nombre}</span>
                  </div>
                  <a 
                    href="/w/{workspace}/clients?search={encodeURIComponent(cl.nombre)}" 
                    class="text-[10px] font-bold text-[#5C42FF] dark:text-[#9A85FF] bg-[#5C42FF]/5 dark:bg-[#5C42FF]/10 px-2.5 py-1 rounded-lg border border-[#5C42FF]/10 hover:bg-[#5C42FF]/10 transition-colors"
                  >
                    Ver Ficha
                  </a>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if tareasEncontradas.length > 0}
          <div>
            <p class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Órdenes de producción</p>
            <div class="space-y-1">
              {#each tareasEncontradas as trabajo}
                <div class="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1E2228] transition-colors group">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-2 h-2 rounded-full bg-[#5C42FF] dark:bg-[#7A62FF] flex-shrink-0"></div>
                    <div class="flex flex-col min-w-0">
                      <span class="text-xs font-bold text-[#1A1D21] dark:text-[#EDF0F3]">
                        #{trabajo.numParte} — {trabajo.cliente}
                      </span>
                      <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 truncate">
                        {trabajo.descripcionGeneral || 'Sin descripción'}
                      </span>
                    </div>
                  </div>

                  <button 
                    type="button"
                    on:click={() => abrirResumen(trabajo)}
                    class="text-gray-400 dark:text-gray-500 hover:text-[#5C42FF] dark:hover:text-[#9A85FF] p-1 rounded-lg transition-colors cursor-pointer outline-none flex items-center justify-center"
                  >
                    <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">visibility</span>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if clientesEncontrados.length === 0 && tareasEncontradas.length === 0}
          <p class="text-xs text-center py-4 text-gray-400 dark:text-gray-500 font-medium">No hay resultados para la búsqueda.</p>
        {/if}

      </div>
    {/if}
  </div>
</header>

{#if modalAbierto && tareaSeleccionada}
  <div class="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-fade-in" on:click={cerrarModal}>
    <div 
      class="bg-white dark:bg-[#16191D] border border-[#E9EBF0] dark:border-[#232830] rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative text-[#1A1D21] dark:text-[#EDF0F3] transition-colors max-h-[90vh] overflow-y-auto animate-scale-up"
      on:click|stopPropagation
    >
      <div class="flex justify-between items-start mb-2">
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-1 bg-black text-white dark:bg-[#1E2228] dark:border dark:border-gray-800 text-[10px] font-bold rounded-lg tracking-wider uppercase">
            Parte #{tareaSeleccionada.numParte}
          </span>
          <span class="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider border 
            {tareaSeleccionada.estado === 'En proceso' ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'}">
            {tareaSeleccionada.estado}
          </span>
        </div>
        <button type="button" on:click={cerrarModal} class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1E2228] transition-all cursor-pointer flex items-center justify-center outline-none border border-transparent">
          <span class="material-symbols-rounded text-lg">close</span>
        </button>
      </div>

      <h2 class="text-3xl font-extrabold tracking-tight text-[#1A1D21] dark:text-[#EDF0F3] uppercase mb-6">
        {tareaSeleccionada.cliente}
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        <div class="flex items-center gap-3 bg-[#F8F9FB] dark:bg-[#1E2228]/60 border border-[#E9EBF0]/60 dark:border-[#232830] p-3 rounded-xl">
          <div class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">account_circle</span>
          </div>
          <div class="min-w-0 flex flex-col">
            <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Comercial</span>
            <span class="text-xs font-bold mt-1 text-[#1A1D21] dark:text-[#EDF0F3] truncate">{tareaSeleccionada.comercial || 'Sin asignar'}</span>
          </div>
        </div>

        <div class="flex items-center gap-3 bg-[#F8F9FB] dark:bg-[#1E2228]/60 border border-[#E9EBF0]/60 dark:border-[#232830] p-3 rounded-xl">
          <div class="w-9 h-9 rounded-lg bg-purple-50 dark:bg-[#5C42FF]/10 text-[#5C42FF] dark:text-white flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">layers</span>
          </div>
          <div class="min-w-0 flex flex-col">
            <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Área</span>
            <span class="text-xs font-bold mt-1 text-[#1A1D21] dark:text-[#EDF0F3] truncate">{tareaSeleccionada.area}</span>
          </div>
        </div>

        <div class="flex items-center gap-3 bg-[#F8F9FB] dark:bg-[#1E2228]/60 border border-[#E9EBF0]/60 dark:border-[#232830] p-3 rounded-xl">
          <div class="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">palette</span>
          </div>
          <div class="min-w-0 flex flex-col">
            <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Diseñador</span>
            <span class="text-xs font-bold mt-1 text-emerald-600 dark:text-emerald-400 truncate">{tareaSeleccionada.diseñador || 'Sin asignar'}</span>
          </div>
        </div>

        <div class="flex items-center gap-3 bg-[#F8F9FB] dark:bg-[#1E2228]/60 border border-[#E9EBF0]/60 dark:border-[#232830] p-3 rounded-xl">
          <div class="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">calendar_today</span>
          </div>
          <div class="min-w-0 flex flex-col">
            <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Entrega</span>
            <span class="text-xs font-bold mt-1 text-[#1A1D21] dark:text-[#EDF0F3] truncate">{tareaSeleccionada.fechaSalida}</span>
          </div>
        </div>

      </div>

      <div class="mt-6">
        <p class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
          <span class="material-symbols-rounded text-sm" style="font-variation-settings: 'wght' 300;">description</span>
          <span>Descripción General del Pedido</span>
        </p>
        <div class="bg-white dark:bg-[#1A1D21] p-4 rounded-2xl border border-[#E9EBF0] dark:border-[#232830] text-xs font-medium text-gray-600 dark:text-gray-400 leading-relaxed shadow-xs">
          {tareaSeleccionada.descripcionGeneral || 'Sin descripción general redactada.'}
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
              {#each desglosesTarea as subItem}
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

      {#if tareaSeleccionada.subcontrata}
        <div class="mt-4 flex items-center gap-2 px-4 py-3 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
          <span class="material-symbols-rounded text-orange-500 text-base" style="font-variation-settings: 'wght' 300;">handshake</span>
          <p class="text-[11px] font-medium text-orange-600 dark:text-orange-400">
            Esta orden se encuentra externalizada en: <span class="font-bold uppercase">{tareaSeleccionada.subcontrata}</span>
          </p>
        </div>
      {/if}

    </div>
  </div>
{/if}

<style>
  @keyframes scale-up { 
    from { opacity: 0; transform: scale(0.97) translateY(-4px); } 
    to { opacity: 1; transform: scale(1) translateY(0); } 
  }
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  .animate-scale-up { animation: scale-up 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
</style>