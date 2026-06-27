<script lang="ts">
  export let nombreCliente: string = "";
  export let trabajos: Array<{
    numParte: number;
    descripcionGeneral: string;
    estado: string;
    fechaSalida: string;
    area: string;
    subcontrata: string | null;
  }> = [];

  // --- 1. CONFIGURACIÓN DE AVATAR DINÁMICO ---
  const paletaAvatares = [
    { bg: "bg-sky-50", texto: "text-sky-600" },
    { bg: "bg-emerald-50", texto: "text-emerald-600" },
    { bg: "bg-purple-50", texto: "text-purple-600" },
    { bg: "bg-amber-50", texto: "text-amber-600" },
    { bg: "bg-rose-50", texto: "text-rose-600" },
    { bg: "bg-indigo-50", texto: "text-indigo-600" }
  ];

  function obtenerColorAvatar(nombre: string) {
    const inicial = nombre.charAt(0).toUpperCase();
    const codigoChar = inicial.charCodeAt(0);
    return paletaAvatares[codigoChar % paletaAvatares.length];
  }

  // --- 2. LOGICA DE EXTRACCIÓN DE AÑOS ---
  const añosDisponibles = [...new Set(trabajos.map(t => {
    return t.fechaSalida ? new Date(t.fechaSalida).getFullYear().toString() : new Date().getFullYear().toString();
  }))].sort((a, b) => b.localeCompare(a));

  let añoSeleccionado = añosDisponibles[0] || new Date().getFullYear().toString();

  // --- 3. MÉTRICAS Y FILTRADO ACTIVO ---
  $: totalTrabajosHistoricos = trabajos.length;
  
  $: trabajosFiltradosPorAño = trabajos.filter(t => {
    const añoTrabajo = t.fechaSalida ? new Date(t.fechaSalida).getFullYear().toString() : "";
    return añoTrabajo === añoSeleccionado;
  }).sort((a, b) => b.numParte - a.numParte);

  // Colores de texto estables para los estados
  const coloresTextoEstado = {
    "Terminado": "text-[#5C42FF]",
    "En proceso": "text-blue-500",
    "Pendiente": "text-amber-500"
  };
</script>

<div class="w-full font-sans flex flex-col h-full space-y-5">
  
  <div class="flex items-center gap-4 bg-white border border-[#E9EBF0] p-6 rounded-3xl shadow-xs flex-shrink-0">
    <div class="w-14 h-14 rounded-full flex items-center justify-center font-semibold text-xl border {obtenerColorAvatar(nombreCliente).bg} {obtenerColorAvatar(nombreCliente).texto} {obtenerColorAvatar(nombreCliente).bg.replace('bg-','border-')}">
      {nombreCliente.charAt(0).toUpperCase()}
    </div>
    
    <div class="space-y-0.5">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-semibold text-[#1A1D21] tracking-tight">{nombreCliente}</h1>
        <span class="bg-[#5C42FF]/5 text-[#5C42FF] text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md border border-[#5C42FF]/10">
          Aeroprint Partner
        </span>
      </div>
      <p class="text-xs font-medium text-gray-400">
        Historial consolidado: <span class="text-[#1A1D21] font-semibold">{totalTrabajosHistoricos.toString().padStart(2, '0')} trabajos totales</span> realizados a través de todos los años de actividad.
      </p>
    </div>
  </div>

  {#if añosDisponibles.length > 1}
    <div class="flex items-center gap-2 flex-shrink-0 bg-gray-100/50 p-1 rounded-xl w-fit border border-[#E9EBF0]">
      {#each añosDisponibles as año}
        <button
          type="button"
          on:click={() => añoSeleccionado = año}
          class="px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer
                 {añoSeleccionado === año 
                   ? 'bg-[#5C42FF] text-white shadow-xs' 
                   : 'text-gray-400 hover:text-[#1A1D21]'}"
        >
          {año}
        </button>
      {/each}
    </div>
  {/if}

  <div class="grid grid-cols-[100px_1fr_130px_140px_150px] gap-4 px-6 text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex-shrink-0">
    <div>Nº Parte</div>
    <div>Descripción del Trabajo</div>
    <div>Área</div>
    <div>Fecha Entrega</div>
    <div class="text-right pr-4">Estado</div>
  </div>

  <div class="space-y-2.5 flex-1 overflow-y-auto pr-1 min-h-0">
    {#each trabajosFiltradosPorAño as trabajo (trabajo.numParte)}
      <div class="bg-white border border-[#E9EBF0] rounded-2xl p-4 grid grid-cols-[100px_1fr_130px_140px_150px] gap-4 items-center shadow-xs transition-all
        {trabajo.estado === 'Terminado' ? 'opacity-60 bg-gray-50/30' : 'hover:shadow-sm group'}">
        
        <div class="text-xs font-semibold text-[#1A1D21] whitespace-nowrap">
          #{trabajo.numParte}
        </div>
        
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-semibold text-[#1A1D21] truncate {trabajo.estado === 'Terminado' ? 'line-through text-gray-400' : ''}">
            {trabajo.descripcionGeneral || 'Sin especificaciones añadidas'}
          </span>
          {#if trabajo.subcontrata}
            <span class="text-[10px] font-medium text-orange-500 mt-0.5 flex items-center gap-1 truncate">
              <span class="material-symbols-outlined text-xs" style="font-variation-settings: 'wght' 300;">handshake</span>
              Subcontratado a: {trabajo.subcontrata}
            </span>
          {/if}
        </div>
        
        <div class="whitespace-nowrap">
          <span class="text-[9px] font-semibold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-gray-50 text-gray-500 border border-gray-100">
            {trabajo.area}
          </span>
        </div>
        
        <div class="text-xs font-medium text-gray-500 whitespace-nowrap">
          {trabajo.fechaSalida}
        </div>
        
        <div class="flex items-center justify-end gap-2 text-xs font-semibold whitespace-nowrap pr-4">
          {#if trabajo.estado === 'Terminado'}
            <span class="material-symbols-outlined text-lg text-[#5C42FF]" style="font-variation-settings: 'wght' 400;">check_circle</span>
            <span class="{coloresTextoEstado[trabajo.estado]} font-semibold">{trabajo.estado}</span>
          {:else}
            <span class="material-symbols-outlined text-lg {trabajo.estado === 'En proceso' ? 'text-blue-500 animate-pulse' : 'text-amber-500'}" style="font-variation-settings: 'wght' 300;">
              {trabajo.estado === 'En proceso' ? 'motion_photos_on' : 'schedule'}
            </span>
            <span class="{coloresTextoEstado[trabajo.estado]}">{trabajo.estado}</span>
          {/if}
        </div>
      </div>
    {:else}
      <div class="bg-white border border-dashed border-gray-200 rounded-3xl p-16 text-center text-gray-400 shadow-xs">
        <span class="material-symbols-outlined text-3xl block mb-1.5 opacity-40" style="font-variation-settings: 'wght' 100;">folder_open</span>
        <p class="text-xs font-semibold">No se registran órdenes de producción en el año {añoSeleccionado}.</p>
      </div>
    {/each}
  </div>

</div>