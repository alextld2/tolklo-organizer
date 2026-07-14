<script lang="ts">
  // 1. 🔥 IMPORTACIÓN DEL ALMACÉN: Necesario para escuchar lo que se escribe en el Header
  import { busquedaGlobal } from "../stores/busqueda";
  import { ESTADOS_ESTILOS } from "../utils/constants";

  export let trabajosProximos: any[] = [];
  export let workspace: string = "produccion";

  // Configuración de paginación
  let elementosPorPagina = 5;
  let paginaActual = 0;

  // 2. 🔥 FUNCIÓN MAESTRA: Normaliza el texto quitando mayúsculas y acentos (é -> e)
  const normalizarTexto = (texto: string) => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // 3. 🔥 FILTRADO REACTIVO: Se ejecuta automáticamente cada vez que cambia el valor de $busquedaGlobal y filtra los no terminados
  $: trabajosFiltrados = trabajosProximos
    .filter((trabajo) => trabajo.estado !== "Terminado")
    .filter((trabajo) => {
      const query = normalizarTexto($busquedaGlobal);

      // Si la barra está vacía, permitimos pasar todo el listado
      if (!query) return true;

      // Comparamos campos en minúsculas y sin acentos para que sea infalible
      const clienteMatches = normalizarTexto(trabajo.cliente).includes(query);
      const parteMatches = trabajo.numParte.toString().includes(query);
      const descMatches = trabajo.descripcionGeneral
        ? normalizarTexto(trabajo.descripcionGeneral).includes(query)
        : false;

      return clienteMatches || parteMatches || descMatches;
    });

  // 4. PROTECCIÓN DE RENDIMIENTO: Limitamos los resultados ya filtrados a 50
  $: trabajosLimitados = trabajosFiltrados.slice(0, 50);

  // 5. RESET DE PAGINACIÓN: Si el usuario escribe en el buscador, lo devolvemos a la página 0
  $: if ($busquedaGlobal) {
    paginaActual = 0;
  }

  // Cálculo dinámico de páginas según el filtro actual
  $: totalPaginas = Math.ceil(trabajosLimitados.length / elementosPorPagina);

  // Segmento final que se renderiza en la rejilla
  $: trabajosVisibles = trabajosLimitados.slice(
    paginaActual * elementosPorPagina,
    (paginaActual + 1) * elementosPorPagina,
  );

  function irAPagina(index: number) {
    paginaActual = index;
  }
</script>

<div class="space-y-4 w-full font-sans text-[#1A1D21] dark:text-[#EDF0F3]">
  <div class="flex justify-between items-center">
    <h2
      class="text-xl font-semibold tracking-tight text-[#1A1D21] dark:text-[#EDF0F3]"
    >
      Pedidos Activos
    </h2>

    <a
      href="/w/{workspace}/calendar"
      class="text-xs font-medium text-[#5C42FF] dark:text-[#9A85FF] border border-dashed border-[#5C42FF]/40 dark:border-[#5C42FF]/30 px-3 py-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-[#5C42FF]/10 transition-colors flex items-center gap-1 cursor-pointer select-none"
    >
      <span
        class="material-symbols-rounded text-sm"
        style="font-variation-settings: 'wght' 300;"
      >
        calendar_today
      </span>
      <span>Ver Agenda</span>
    </a>
  </div>

  <div class="space-y-3 min-h-[360px] flex flex-col justify-between">
    <div class="space-y-3 flex-1">
      {#each trabajosVisibles as trabajo (trabajo.numParte)}
        <div
          class="bg-white dark:bg-[#16191D] rounded-2xl p-4 border border-[#E9EBF0] dark:border-[#232830] flex items-center justify-between shadow-xs hover:shadow-sm transition-all group"
        >
          <div class="flex items-center gap-4 min-w-0">
            <div
              class="w-20 h-15 bg-purple-50 dark:bg-[#5C42FF]/10 text-[#5C42FF] dark:text-[#9A85FF] rounded-xl flex flex-col items-center justify-center font-semibold text-xs border border-purple-100/60 dark:border-[#5C42FF]/20 transition-colors group-hover:bg-purple-100/50 dark:group-hover:bg-[#5C42FF]/20 flex-shrink-0"
            >
              <span
                class="text-[10px] uppercase tracking-tighter opacity-50 font-medium"
                >PARTE</span
              >
              <span>{trabajo.numParte}</span>
            </div>

            <div class="min-w-0">
              <p
                class="text-sm font-semibold text-[#1A1D21] dark:text-[#EDF0F3] uppercase tracking-tight truncate"
              >
                {trabajo.cliente}
              </p>
              <p
                class="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5 truncate"
              >
                {trabajo.descripcionGeneral || "Sin descripción"}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2.5 flex-shrink-0">
            <span
              class="px-2.5 py-1 text-[9px] font-semibold rounded-lg uppercase tracking-wider border transition-colors
              {ESTADOS_ESTILOS[trabajo.estado] ||
                'bg-gray-50 text-gray-600 border-gray-100 dark:bg-[#1E2228] dark:text-gray-400 dark:border-[#232830]'}"
            >
              {trabajo.estado}
            </span>

            <span
              class="px-2.5 py-1 bg-gray-50 dark:bg-[#1E2228] border border-gray-100 dark:border-gray-800 text-[9px] font-semibold text-gray-400 dark:text-gray-500 rounded-lg uppercase tracking-wider transition-colors"
            >
              {trabajo.area}
            </span>
          </div>
        </div>
      {:else}
        <div
          class="bg-white dark:bg-[#16191D] border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center text-gray-400 dark:text-gray-500 my-auto shadow-xs transition-colors"
        >
          <span
            class="material-symbols-rounded text-4xl block mb-2 text-gray-300 dark:text-gray-700"
            style="font-variation-settings: 'wght' 100;"
          >
            search_off
          </span>
          <p class="text-xs font-semibold">
            No se encontraron partes activos que coincidan con la búsqueda.
          </p>
        </div>
      {/each}
    </div>

    {#if totalPaginas > 1}
      <div class="flex justify-center items-center gap-2 pt-2 flex-shrink-0">
        {#each Array(totalPaginas) as _, i}
          <button
            type="button"
            on:click={() => irAPagina(i)}
            class="h-2 rounded-full transition-all duration-300 cursor-pointer outline-none
              {paginaActual === i
              ? 'w-5 bg-[#5C42FF] dark:bg-[#7A62FF]'
              : 'w-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'}"
            aria-label="Ir a página {i + 1}"
          ></button>
        {/each}
      </div>
    {/if}
  </div>
</div>
