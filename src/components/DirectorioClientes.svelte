<script lang="ts">
  import { busquedaGlobal } from '../stores/busqueda'; // Escucha la barra superior

  // Recibimos los clientes procesados desde el servidor de Astro
  export let clientes: Array<{
    nombre: string;
    estado: 'ACTIVE' | 'ON HOLD' | 'OVERDUE'; 
    totalTareas: number;
    porcentajeProgreso: number; 
  }> = [];

  // Abecedario completo para el filtro indexado
  const abecedario = ["TODOS", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
  let letraSeleccionada = "TODOS";

  // Paleta de avatares sincronizada con soporte para modo oscuro
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

  // Función para generar slugs limpios idénticos a los de DetalleCliente para el Morphing
  const generarSlug = (nombre: string) => nombre.toLowerCase().replace(/[^a-z0-9]/g, '-');

  // Filtrado reactivo en tiempo real por buscador e índice alfabético
  $: clientesFiltrados = clientes.filter(c => {
    const query = ($busquedaGlobal || "").toLowerCase().trim();
    const coincideBusqueda = c.nombre.toLowerCase().includes(query);
    const coincideLetra = letraSeleccionada === "TODOS" || 
                          c.nombre.toUpperCase().startsWith(letraSeleccionada);
    return coincideBusqueda && coincideLetra;
  });

  // 🔥 SIMPLIFICADO: Métrica total del censo de clientes sin distinción de estados
  $: totalClientes = clientes.length;
</script>

<div class="w-full font-sans flex flex-col h-full space-y-5 text-[#1A1D21] dark:text-[#EDF0F3]">
  
  <!-- CABECERA SUPERIOR -->
  <div class="flex justify-between items-center flex-shrink-0">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight text-[#1A1D21] dark:text-[#EDF0F3]">Directorio de Clientes</h1>
      <p class="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">Nuestros socios comerciales y el volumen histórico de producción.</p>
    </div>
    
    <!-- Contador global limpio -->
    <div class="flex items-center gap-3 bg-white dark:bg-[#16191D] border border-[#E9EBF0] dark:border-[#232830] px-5 py-2.5 rounded-2xl shadow-xs transition-colors">
      <div class="flex flex-col text-right">
        <span class="text-xs font-semibold text-[#1A1D21] dark:text-[#EDF0F3] leading-none">
          {totalClientes.toString().padStart(2, '0')} CARTERAS
        </span>
        <span class="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Clientes Totales</span>
      </div>
    </div>
  </div>

  <!-- BARRA DEL FILTRO INDEXADO ALFABÉTICO -->
  <div class="flex flex-wrap items-center gap-1 bg-white dark:bg-[#16191D] border border-[#E9EBF0] dark:border-[#232830] p-1.5 rounded-xl shadow-xs transition-colors">
    {#each abecedario as letra}
      <button
        type="button"
        on:click={() => letraSeleccionada = letra}
        class="px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide transition-all cursor-pointer duration-150
               {letraSeleccionada === letra 
                 ? 'bg-[#5C42FF] text-white shadow-sm scale-102' 
                 : 'text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-[#EDF0F3] hover:bg-gray-50 dark:hover:bg-[#1E2228]'}"
      >
        {letra}
      </button>
    {/each}
  </div>

  <!-- LISTADO DE FILAS LIMPIAS (FLEXBOX ANTI-COLAPSO RESILIENTE) -->
  <div class="space-y-2 flex-1 overflow-y-auto pr-1 Brass-container pb-6">
    {#each clientesFiltrados as cliente}
      {@const slug = generarSlug(cliente.nombre)}
      {@const avatar = obtenerColorAvatar(cliente.nombre)}

      <!-- CONTENEDOR MÓRFICO REFINADO -->
      <div 
        style="view-transition-name: cliente-card-{slug};"
        class="bg-white dark:bg-[#16191D] border border-[#E9EBF0] dark:border-[#232830] rounded-2xl p-4 flex items-center justify-between gap-6 shadow-xs hover:shadow-sm transition-all group duration-200"
      >
        
        <!-- SECCIÓN A: IDENTIDAD COMERCIAL (OCUPA TODO EL ESPACIO DISPONIBLE) -->
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <!-- AVATAR MÓRFICO UNIFICADO (SQUIRCLE PREMIUM) -->
          <div 
            style="view-transition-name: cliente-avatar-{slug};"
            class="w-12 h-12 rounded-2xl flex items-center justify-center font-semibold text-lg border shadow-xs flex-shrink-0 transition-transform group-hover:scale-105 duration-300 {avatar.bg} {avatar.texto} {avatar.borde}"
          >
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-[#1A1D21] dark:text-[#EDF0F3] group-hover:text-[#5C42FF] dark:group-hover:text-[#9A85FF] transition-colors truncate">{cliente.nombre}</h3>
            <p class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">Aeroprint Partner</p>
          </div>
        </div>

        <!-- 🔥 SECCIÓN B: CONTADOR EXCLUSIVO DE ÓRDENES (REEMPLAZA A LA BARRA Y A LAS ETIQUETAS CONFUSAS) -->
        <div class="flex flex-col w-[120px] flex-shrink-0 text-left sm:text-center">
          <span class="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Órdenes Totales</span>
          <span class="text-sm font-semibold text-[#1A1D21] dark:text-[#EDF0F3] mt-1.5 tabular-nums leading-none">
            {cliente.totalTareas.toString().padStart(2, '0')} partes
          </span>
        </div>

        <!-- SECCIÓN C: ACCESO DIRECTO MÓRFICO AL HISTORIAL -->
        <div class="w-[130px] flex-shrink-0 flex items-center justify-end">
          <a 
            href="/clients/{cliente.nombre}" 
            class="text-[10px] font-semibold tracking-wider px-4 py-2 bg-gray-50 dark:bg-[#1E2228] text-[#1A1D21] dark:text-[#EDF0F3] rounded-xl hover:bg-[#5C42FF] dark:hover:bg-[#5C42FF] hover:text-white dark:hover:text-white transition-all cursor-pointer shadow-xs text-center inline-block"
          >
            Ver Historial
          </a>
        </div>

      </div>
    {:else}
      <!-- MENSAJE DE BÚSQUEDA SIN COINCIDENCIAS -->
      <div class="bg-white dark:bg-[#16191D] border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center text-gray-400 dark:text-gray-600 shadow-xs transition-colors">
        <span class="material-symbols-rounded text-4xl block mb-2 text-gray-300 dark:text-gray-700" style="font-variation-settings: 'wght' 100;">folder_open</span>
        <p class="text-xs font-semibold">No se encontraron clientes que empiecen por "{letraSeleccionada}" o coincidan con tu búsqueda actual.</p>
      </div>
    {/each}
  </div>

</div>