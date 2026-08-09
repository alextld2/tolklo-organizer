<script lang="ts">
  import { busquedaGlobal } from "../stores/busqueda";
  import { ESTADOS_ESTILOS } from "../utils/constants";
  import { CalendarDays, SearchX } from "lucide-svelte";

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

<div class="space-y-4 w-full font-sans text-foreground">
  <div class="flex justify-between items-center">
    <h2
      class="text-xl font-semibold tracking-tight text-foreground"
    >
      Pedidos Activos
    </h2>

    <a
      href="/w/{workspace}/calendar"
      class="text-xs font-medium text-foreground border border-dashed border-border px-3 py-1.5 rounded-xl hover:bg-accent transition-colors flex items-center gap-1 cursor-pointer select-none"
    >
      <CalendarDays size={13} strokeWidth={2} />
      <span>Ver Agenda</span>
    </a>
  </div>

  <div class="space-y-3 min-h-[360px] flex flex-col justify-between">
    <div class="space-y-3 flex-1">
      {#each trabajosVisibles as trabajo (trabajo.numParte)}
        <div
          class="bg-card text-card-foreground border border-border rounded-2xl p-4 flex items-center justify-between transition-all group shadow-xs"
        >
          <div class="flex items-center gap-4 min-w-0">
            <div
              class="w-20 h-15 bg-muted text-foreground rounded-xl flex flex-col items-center justify-center font-semibold text-xs border border-border transition-colors group-hover:bg-accent flex-shrink-0"
            >
              <span
                class="text-[10px] uppercase tracking-tighter opacity-70 font-medium"
                >PARTE</span
              >
              <span>{trabajo.numParte}</span>
            </div>

            <div class="min-w-0">
              <p
                class="text-sm font-semibold text-foreground uppercase tracking-tight truncate"
              >
                {trabajo.cliente}
              </p>
              <p
                class="text-xs text-muted-foreground font-medium mt-0.5 truncate"
              >
                {trabajo.descripcionGeneral || "Sin descripción"}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2.5 flex-shrink-0">
            <span
              class="px-2.5 py-1 text-[9px] font-semibold rounded-lg uppercase tracking-wider border transition-colors
              {ESTADOS_ESTILOS[trabajo.estado] ||
                'bg-muted text-muted-foreground border-border'}"
            >
              {trabajo.estado}
            </span>

            <span
              class="px-2.5 py-1 bg-muted border border-border text-[9px] font-semibold text-muted-foreground rounded-lg uppercase tracking-wider transition-colors"
            >
              {trabajo.area}
            </span>
          </div>
        </div>
      {:else}
        <div
          class="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground my-auto shadow-xs transition-colors"
        >
          <SearchX size={32} strokeWidth={1} class="mx-auto mb-2 opacity-30" />
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
            class={`h-2 rounded-full transition-all duration-300 cursor-pointer outline-none
              ${paginaActual === i
              ? 'w-5 bg-foreground'
              : 'w-2 bg-border hover:bg-muted-foreground'}`}
            aria-label="Ir a página {i + 1}"
          ></button>
        {/each}
      </div>
    {/if}
  </div>
</div>
