<script lang="ts">
  import { fly, slide } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';

  export let nombreCliente: string = "";
  export let trabajos: Array<{
    numParte: number;
    descripcionGeneral: string;
    estado: string;
    fechaSalida: string;
    area: string;
    subcontrata: string | null;
  }> = [];

  // --- CONFIGURACIÓN DE AVATAR INTEGRADO EN MODO OSCURO ---
  const paletaAvatares = [
    { bg: "bg-sky-50 dark:bg-sky-500/10", texto: "text-sky-600 dark:text-sky-400", borde: "border-sky-100 dark:border-sky-500/20" },
    { bg: "bg-emerald-50 dark:bg-emerald-500/10", texto: "text-emerald-600 dark:text-emerald-400", borde: "border-emerald-100 dark:border-emerald-500/20" },
    { bg: "bg-purple-50 dark:bg-purple-500/10", texto: "text-purple-600 dark:text-purple-400", borde: "border-purple-100 dark:border-purple-500/20" },
    { bg: "bg-amber-50 dark:bg-amber-500/10", texto: "text-amber-600 dark:text-amber-400", borde: "border-amber-100 dark:border-amber-500/20" },
    { bg: "bg-rose-50 dark:bg-rose-500/10", texto: "text-rose-600 dark:text-rose-400", borde: "border-rose-100 dark:border-rose-500/20" },
    { bg: "bg-indigo-50 dark:bg-indigo-500/10", texto: "text-indigo-600 dark:text-indigo-400", borde: "border-indigo-100 dark:border-indigo-500/20" }
  ];

  function obtenerColorAvatar(nombre: string) {
    const inicial = nombre.charAt(0).toUpperCase();
    const codigoChar = inicial.charCodeAt(0);
    return paletaAvatares[codigoChar % paletaAvatares.length];
  }

  $: avatar = obtenerColorAvatar(nombreCliente);
  
  // 🔥 NUEVO: Generamos un identificador único limpio para el Morphing (Ej: "ayuntamiento-de-granada")
  $: clienteSlug = nombreCliente.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // --- LOGICA DE EXTRACCIÓN DE AÑOS DISPONIBLES ---
  const añosDisponibles = [...new Set(trabajos.map(t => {
    return t.fechaSalida ? new Date(t.fechaSalida).getFullYear().toString() : new Date().getFullYear().toString();
  }))].sort((a, b) => b.localeCompare(a));

  let añoSeleccionado = añosDisponibles[0] || new Date().getFullYear().toString();

  // --- MÉTRICAS UNIFICADAS ---
  $: totalTrabajosHistoricos = trabajos.length;
  
  $: trabajosFiltradosPorAño = trabajos.filter(t => {
    const añoTrabajo = t.fechaSalida ? new Date(t.fechaSalida).getFullYear().toString() : "";
    return añoTrabajo === añoSeleccionado;
  }).sort((a, b) => b.numParte - a.numParte);

  const coloresEstado = {
    "Terminado": "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10",
    "Imprimiendo": "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10",
    "Manipulado": "text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10",
    "Urgente": "text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 font-semibold animate-pulse",
    "Por hacer": "text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1E2228] border border-gray-100 dark:border-[#232830]"
  };

  const iconosEstado = {
    "Terminado": "check_circle",
    "Imprimiendo": "print",
    "Manipulado": "precision_manufacturing",
    "Urgente": "bolt",
    "Por hacer": "radio_button_unchecked"
  };

  let parteExpandido: number | null = null;

  function toggleAcordeon(numParte: number) {
    parteExpandido = parteExpandido === numParte ? null : numParte;
  }
</script>

<div class="w-full font-sans flex flex-col h-full space-y-5 text-[#1A1D21] dark:text-[#EDF0F3]">
  
  <!-- BOTÓN DE RETORNO AL PANEL GLOBAL -->
  <div class="flex items-center flex-shrink-0 pt-1">
    <button 
      type="button" 
      on:click={() => window.history.back()} 
      class="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#5C42FF] dark:hover:text-[#9A85FF] transition-colors group cursor-pointer bg-transparent border-none p-0 outline-none"
    >
      <span class="material-symbols-rounded text-lg transition-transform group-hover:-translate-x-1" style="font-variation-settings: 'wght' 300;">arrow_back</span>
      <span>Volver al listado de clientes</span>
    </button>
  </div>

  <!-- CABECERA DE SOCIO COMERCIAL (CON SU ETIQUETA DE TRANSICIÓN ASIGNADA) -->
  <div 
    style="view-transition-name: cliente-card-{clienteSlug};"
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#16191D] border border-[#E9EBF0] dark:border-[#232830] p-6 rounded-3xl shadow-xs flex-shrink-0 transition-colors"
  >
    <div class="flex items-center gap-4">
      <!-- 🔥 ICONO MÓRFICO: Le asignamos su propia firma visual única -->
      <div 
        style="view-transition-name: cliente-avatar-{clienteSlug};"
        class="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl border shadow-xs flex-shrink-0 transition-transform hover:scale-105 duration-300 {avatar.bg} {avatar.texto} {avatar.borde}"
      >
        {nombreCliente.charAt(0).toUpperCase()}
      </div>
      
      <div class="space-y-0.5">
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1 class="text-2xl font-semibold text-[#1A1D21] dark:text-[#EDF0F3] tracking-tight">{nombreCliente}</h1>
          <span class="bg-[#5C42FF]/5 dark:bg-[#5C42FF]/10 text-[#5C42FF] dark:text-[#9A85FF] text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md border border-[#5C42FF]/10 dark:border-transparent">
            Aeroprint Partner
          </span>
        </div>
        <p class="text-xs font-medium text-gray-400 dark:text-gray-500">
          Cuenta corporativa activa en el gestor de asignaciones de taller.
        </p>
      </div>
    </div>

    <!-- MÉTRICA TOTAL TIPOGRÁFICA -->
    <div class="bg-gray-50 dark:bg-[#1E2228] border border-gray-100 dark:border-[#232830] px-6 py-2.5 rounded-2xl flex flex-col items-end justify-center sm:self-center transition-colors">
      <span class="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Historial Total</span>
      <span class="text-base font-semibold mt-1 text-[#1A1D21] dark:text-[#EDF0F3] tabular-nums leading-none">
        {totalTrabajosHistoricos.toString().padStart(2, '0')} órdenes
      </span>
    </div>
  </div>

  <!-- SELECTOR DE ANNALES CRONOLÓGICOS -->
  {#if añosDisponibles.length > 1}
    <div class="flex items-center gap-1.5 flex-shrink-0 bg-gray-100/60 dark:bg-[#16191D] p-1 rounded-xl w-fit border border-[#E9EBF0] dark:border-[#232830] transition-colors">
      {#each añosDisponibles as año}
        <button
          type="button"
          on:click={() => añoSeleccionado = año}
          class="px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer relative overflow-hidden duration-200
                 {añoSeleccionado === año 
                    ? 'bg-[#5C42FF] text-white shadow-md shadow-[#5C42FF]/20 scale-102' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-[#1A1D21] dark:hover:text-[#EDF0F3] hover:bg-gray-200/40 dark:hover:bg-[#1E2228]'}"
        >
          {año}
        </button>
      {/each}
    </div>
  {/if}

  <!-- CONTENEDOR DE TARJETAS CON EFECTO ACORDEÓN -->
  <div class="space-y-2.5 flex-1 overflow-y-auto pr-1 min-h-0 pb-6">
    {#each trabajosFiltradosPorAño as trabajo, i (trabajo.numParte)}
      {@const estaAbierto = parteExpandido === trabajo.numParte}
      
      <div 
        in:fly={{ y: 16, duration: 300, delay: i * 40, easing: cubicOut }}
        class="bg-white dark:bg-[#16191D] border rounded-2xl flex flex-col shadow-xs overflow-hidden transition-all duration-300 transform walk-in-animation
          {estaAbierto ? 'border-[#5C42FF] ring-1 ring-[#5C42FF]/20 dark:ring-[#9A85FF]/20 bg-gray-50/20 dark:bg-[#1E2228]/10' : 'border-[#E9EBF0] dark:border-[#232830]'}
          {trabajo.estado === 'Terminado' && !estaAbierto ? 'opacity-55 dark:opacity-45 bg-gray-50/40 dark:bg-[#111418]/20' : 'hover:shadow-md hover:-translate-y-0.5 dark:hover:bg-[#1E2228]/20'}"
      >
        <!-- FILA DE INFORMACIÓN PRINCIPAL -->
        <div 
          on:click={() => toggleAcordeon(trabajo.numParte)}
          class="p-4 flex items-center gap-4 cursor-pointer select-none w-full"
        >
          <div class="w-[90px] flex-shrink-0 text-xs font-semibold text-[#1A1D21] dark:text-[#EDF0F3] whitespace-nowrap tabular-nums">
            #{trabajo.numParte}
          </div>
          
          <div class="flex-1 min-w-0 flex flex-col">
            <span class="text-xs font-semibold text-[#1A1D21] dark:text-[#EDF0F3] truncate transition-colors {trabajo.estado === 'Terminado' ? 'line-through text-gray-400 dark:text-gray-600 font-medium' : ''}">
              {trabajo.descripcionGeneral || 'Sin especificaciones añadidas'}
            </span>
            {#if trabajo.subcontrata}
              <span class="text-[10px] font-semibold text-orange-500 dark:text-orange-400/90 mt-0.5 flex items-center gap-1 truncate">
                <span class="material-symbols-rounded text-xs flex-shrink-0">handshake</span>
                Externalizado: {trabajo.subcontrata}
              </span>
            {/if}
          </div>
          
          <div class="w-[120px] flex-shrink-0 whitespace-nowrap">
            <span class="text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-gray-50 dark:bg-[#1E2228] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-transparent">
              {trabajo.area}
            </span>
          </div>
          
          <div class="w-[130px] flex-shrink-0 text-xs font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap tabular-nums">
            {trabajo.fechaSalida}
          </div>
          
          <div class="w-[140px] flex-shrink-0 flex items-center justify-end gap-2 text-[10px] font-extrabold tracking-wide whitespace-nowrap">
            <span class="px-2.5 py-1 rounded-xl flex items-center gap-1.5 uppercase tracking-wider {coloresEstado[trabajo.estado] || coloresEstado['Por hacer']}">
              <span class="material-symbols-rounded text-sm flex-shrink-0 {trabajo.estado === 'Imprimiendo' ? 'animate-pulse' : ''}">
                {iconosEstado[trabajo.estado] || iconosEstado['Por hacer']}
              </span>
              <span>{trabajo.estado}</span>
            </span>
          </div>

          <div class="w-[30px] flex-shrink-0 flex items-center justify-end">
            <span class="material-symbols-rounded text-base text-gray-400 transition-transform duration-300 {estaAbierto ? 'rotate-180 text-[#5C42FF] dark:text-[#9A85FF]' : ''}" style="font-variation-settings: 'wght' 300;">
              keyboard_arrow_down
            </span>
          </div>
        </div>

        <!-- ACORDEÓN DESPLEGABLE -->
        {#if estaAbierto}
          <div 
            transition:slide={{ duration: 250, easing: cubicOut }}
            class="w-full border-t border-gray-100 dark:border-[#232830] bg-gray-50/50 dark:bg-[#121418]/30 px-6 py-5 flex flex-col space-y-4"
          >
            <div class="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-2.5">
              <span class="text-[10px] font-extrabold text-[#5C42FF] dark:text-[#9A85FF] uppercase tracking-widest flex items-center gap-1.5">
                <span class="material-symbols-rounded text-xs">analytics</span> Ficha Técnica de Producción (Vista Previa)
              </span>
              <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Asignación ID: {trabajo.numParte}</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div class="flex flex-col space-y-2">
                <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Equipo de Diseño y Gestión</span>
                <div class="bg-white dark:bg-[#16191D] border border-gray-100 dark:border-[#232830] p-3 rounded-xl space-y-1.5">
                  <p class="text-gray-500 dark:text-gray-400 font-medium">💼 Comercial: <span class="text-[#1A1D21] dark:text-[#EDF0F3] font-bold">Por definir</span></p>
                  <p class="text-gray-500 dark:text-gray-400 font-medium">🎨 Diseñador: <span class="text-[#1A1D21] dark:text-[#EDF0F3] font-bold">Por definir</span></p>
                </div>
              </div>

              <div class="flex flex-col space-y-2">
                <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Logística de Taller</span>
                <div class="bg-white dark:bg-[#16191D] border border-gray-100 dark:border-[#232830] p-3 rounded-xl space-y-1.5">
                  <p class="text-gray-500 dark:text-gray-400 font-medium">⚙️ Maquinaria principal: <span class="text-[#1A1D21] dark:text-[#EDF0F3] font-bold uppercase">{trabajo.area}</span></p>
                  <p class="text-gray-500 dark:text-gray-400 font-medium">📦 Subcontratación: <span class="text-[#1A1D21] dark:text-[#EDF0F3] font-bold">{trabajo.subcontrata || 'No requiere externa'}</span></p>
                </div>
              </div>

              <div class="flex flex-col space-y-2">
                <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Observaciones Generales</span>
                <div class="bg-white dark:bg-[#16191D] border border-gray-100 dark:border-[#232830] p-3 rounded-xl h-full min-h-[62px]">
                  <p class="text-gray-400 dark:text-gray-500 italic font-medium leading-relaxed">
                    Pendiente de anexar las especificaciones y el desglose de productos desde el formulario máster de planta...
                  </p>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div 
        in:fly={{ y: 10, duration: 250 }}
        class="bg-white dark:bg-[#16191D] border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-16 text-center text-gray-400 dark:text-gray-600 shadow-xs transition-colors"
      >
        <span class="material-symbols-rounded text-3xl block mb-1.5 opacity-30" style="font-variation-settings: 'wght' 100;">folder_open</span>
        <p class="text-xs font-bold">No se registran órdenes de producción en el año {añoSeleccionado}.</p>
      </div>
    {/each}
  </div>

</div>

<style>
  .walk-in-animation {
    will-change: transform, opacity;
  }
</style>