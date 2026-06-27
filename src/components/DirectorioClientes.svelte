<script lang="ts">
  import { busquedaGlobal } from '../stores/busqueda'; // Escucha la barra superior

  // Recibimos los clientes procesados desde el servidor de Astro (se mantiene igual)
  export let clientes: Array<{
    nombre: string;
    estado: 'ACTIVE' | 'ON HOLD' | 'OVERDUE';
    totalTareas: number;
    porcentajeProgreso: number; 
  }> = [];

  // Abecedario completo para el filtro indexado
  const abecedario = ["TODOS", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
  let letraSeleccionada = "TODOS";

  const paletaAvatares = [
    { bg: "bg-sky-50", texto: "text-sky-600" },
    { bg: "bg-emerald-50", texto: "text-emerald-600" },
    { bg: "bg-purple-50", texto: "text-purple-600" },
    { bg: "bg-amber-50", texto: "text-amber-600" },
    { bg: "bg-rose-50", texto: "text-rose-600" },
    { bg: "bg-indigo-50", texto: "text-indigo-600" },
    { bg: "bg-teal-50", texto: "text-teal-600" },
    { bg: "bg-cyan-50", texto: "text-cyan-600" },
  ];

  function obtenerColorAvatar(nombre: string) {
    const inicial = nombre.charAt(0).toUpperCase();
    const codigoChar = inicial.charCodeAt(0);
    const indice = codigoChar % paletaAvatares.length;
    return paletaAvatares[indice];
  }

  // --- SOLUCIÓN: Claves en inglés para la DB, pero añadimos la propiedad 'nombreEs' ---
  const estilosEstado = {
    'ACTIVE': { nombreEs: "ACTIVO", icono: "check_circle", color: "text-emerald-600", bg: "bg-emerald-50", borde: "border-emerald-100" },
    'ON HOLD': { nombreEs: "EN ESPERA", icono: "pause_circle", color: "text-gray-500", bg: "bg-gray-50", borde: "border-gray-100" },
    'OVERDUE': { nombreEs: "ATRASADO", icono: "error_outline", color: "text-red-600", bg: "bg-rose-50", borde: "border-rose-100" }
  };

  // El filtrado sigue buscando por el estado real de la DB
  $: clientesFiltrados = clientes.filter(c => {
    const query = ($busquedaGlobal || "").toLowerCase().trim();
    const coincideBusqueda = c.nombre.toLowerCase().includes(query);
    const coincideLetra = letraSeleccionada === "TODOS" || 
                          c.nombre.toUpperCase().startsWith(letraSeleccionada);
    return coincideBusqueda && coincideLetra;
  });

  // Se mantiene en 'ACTIVE' porque así viene de la base de datos
  $: totalActivos = clientes.filter(c => c.estado === 'ACTIVE').length;
</script>

<div class="w-full font-sans flex flex-col h-full space-y-6">
  
  <div class="flex justify-between items-center flex-shrink-0">
    <div>
      <h1 class="text-3xl font-semibold text-[#1A1D21] tracking-tight">Directorio de Clientes</h1>
      <p class="text-xs font-medium text-gray-400 mt-1">Nuestros socios comerciales y su estado de producción actual.</p>
    </div>
    
    <div class="flex items-center gap-3 bg-white border border-[#E9EBF0] px-4 py-2.5 rounded-2xl shadow-xs">
      <div class="flex -space-x-1.5">
         <div class="w-7 h-7 rounded-full bg-blue-50/50 border-2 border-white flex items-center justify-center text-blue-500 border-blue-100/50">
          <span class="material-symbols-rounded text-base" style="font-variation-settings: 'wght' 200;">account_circle</span>
        </div>
        <div class="w-7 h-7 rounded-full bg-purple-50/50 border-2 border-white flex items-center justify-center text-[#5C42FF] border-purple-100/50">
          <span class="material-symbols-rounded text-base" style="font-variation-settings: 'wght' 200;">account_circle</span>
        </div>
      </div>
      <div class="flex flex-col">
        <span class="text-sm font-semibold text-[#1A1D21] leading-none">{totalActivos} ACTIVOS</span>
        <span class="text-[9px] font-medium text-gray-400 uppercase tracking-widest mt-1">En taller</span>
      </div>
    </div>
  </div>

  <div class="flex flex-wrap items-center gap-1 bg-white border border-[#E9EBF0] p-1.5 rounded-xl shadow-xs">
    {#each abecedario as letra}
      <button
        type="button"
        on:click={() => letraSeleccionada = letra}
        class="px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide transition-all cursor-pointer
               {letraSeleccionada === letra 
                 ? 'bg-[#5C42FF] text-white shadow-sm' 
                 : 'text-gray-400 hover:text-black hover:bg-gray-50'}"
      >
        {letra}
      </button>
    {/each}
  </div>

  <div class="space-y-3 flex-1 overflow-y-auto pr-1">
    {#each clientesFiltrados as cliente}
      <div class="bg-white border border-[#E9EBF0] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:shadow-sm transition-all group">
        
        <div class="flex items-center gap-4 min-w-[280px]">
          <div class="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg border {obtenerColorAvatar(cliente.nombre).bg} {obtenerColorAvatar(cliente.nombre).texto} {obtenerColorAvatar(cliente.nombre).bg.replace('bg-','border-')} transition-transform group-hover:scale-105">
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 class="text-sm font-semibold text-[#1A1D21] group-hover:text-[#5C42FF] transition-colors">{cliente.nombre}</h3>
            <p class="text-[10px] font-medium text-gray-400 mt-0.5">Aeroprint Partner</p>
          </div>
        </div>

        <div class="flex items-center min-w-[120px]">
          <div class="px-2.5 py-1 text-[10px] font-semibold rounded-lg uppercase tracking-wider border flex items-center gap-1.5 {estilosEstado[cliente.estado].bg} {estilosEstado[cliente.estado].color} {estilosEstado[cliente.estado].borde}">
            <span class="material-symbols-rounded text-sm" style="font-variation-settings: 'wght' 300;">{estilosEstado[cliente.estado].icono}</span>
            <span>{estilosEstado[cliente.estado].nombreEs}</span>
          </div>
        </div>

        <div class="flex flex-col min-w-[80px]">
          <span class="text-[9px] font-medium text-gray-400 uppercase tracking-widest">Tareas</span>
          <span class="text-sm font-semibold text-[#1A1D21] mt-1">{cliente.totalTareas.toString().padStart(2, '0')}</span>
        </div>

        <div class="flex items-center gap-3 flex-1 max-w-xs">
          <div class="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div 
              class="bg-[#5C42FF] h-full rounded-full transition-all duration-700" 
              style="width: {cliente.porcentajeProgreso}%"
            ></div>
          </div>
          <span class="text-[11px] font-medium text-gray-500 w-8 text-right">{cliente.porcentajeProgreso}%</span>
        </div>

        <div class="flex items-center justify-end">
          <a 
            href="/clients/{cliente.nombre}" 
            class="text-[10px] font-medium tracking-wider px-4 py-2 bg-[#F1F3F6] text-[#1A1D21] rounded-lg hover:bg-[#5C42FF] hover:text-white transition-all cursor-pointer shadow-xs text-center inline-block"
          >
            Ver Historial
          </a>
        </div>

      </div>
    {:else}
      <div class="bg-gray-50/30 border border-dashed border-[#E9EBF0] rounded-2xl p-12 text-center text-gray-400">
        <span class="material-symbols-rounded text-4xl block mb-3 text-gray-300" style="font-variation-settings: 'wght' 100;">folder_open</span>
        <p class="text-xs font-semibold">No se encontraron clientes que empiecen por "{letraSeleccionada}" o coincidan con tu búsqueda actual.</p>
      </div>
    {/each}
  </div>

</div>