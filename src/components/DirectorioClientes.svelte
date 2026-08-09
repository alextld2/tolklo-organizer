<script lang="ts">
  import { busquedaGlobal } from "../stores/busqueda"; // Escucha la barra superior

  // Recibimos los clientes procesados desde el servidor de Astro
  export let clientes: Array<{
    nombre: string;
    estado: "ACTIVE" | "ON HOLD" | "OVERDUE";
    totalTareas: number;
    porcentajeProgreso: number;
  }> = [];

  // Abecedario completo para el filtro indexado
  const abecedario = ["TODOS", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];
  let letraSeleccionada = "TODOS";

  // Paleta de avatares unificada (todos los clientes tienen la misma importancia visual mediante el color verde)
  const paletaAvatares = [
    {
      bg: "bg-[#a4f4cf] dark:bg-[#a4f4cf]/10",
      texto: "text-gray-900 dark:text-[#a4f4cf]",
      borde: "border-transparent dark:border-[#a4f4cf]/20",
    },
  ];

  function obtenerColorAvatar(nombre: string) {
    const inicial = nombre.charAt(0).toUpperCase();
    const codigoChar = inicial.charCodeAt(0);
    return paletaAvatares[codigoChar % paletaAvatares.length];
  }

  // Función para generar slugs limpios idénticos a los de DetalleCliente para el Morphing
  const generarSlug = (nombre: string) =>
    nombre.toLowerCase().replace(/[^a-z0-9]/g, "-");

  // Filtrado reactivo en tiempo real por buscador e índice alfabético
  $: clientesFiltrados = clientes.filter((c) => {
    const query = ($busquedaGlobal || "").toLowerCase().trim();
    const coincideBusqueda = c.nombre.toLowerCase().includes(query);
    const coincideLetra =
      letraSeleccionada === "TODOS" ||
      c.nombre.toUpperCase().startsWith(letraSeleccionada);
    return coincideBusqueda && coincideLetra;
  });

  // 🔥 SIMPLIFICADO: Métrica total del censo de clientes sin distinción de estados
  $: totalClientes = clientes.length;
</script>

<div class="w-full font-sans flex flex-col h-full space-y-5 text-foreground">
  <!-- CABECERA SUPERIOR -->
  <div class="flex justify-between items-center flex-shrink-0">
    <div>
      <h1 class="text-3xl font-semibold tracking-tight text-foreground">
        Directorio de Clientes
      </h1>
      <p class="text-xs font-medium text-muted-foreground mt-0.5">
        Nuestros socios comerciales y el volumen histórico de producción.
      </p>
    </div>

    <!-- Contador global limpio -->
    <div
      class="flex items-center gap-3 bg-card border border-border px-5 py-2.5 rounded-2xl shadow-xs transition-colors"
    >
      <div class="flex flex-col text-right">
        <span class="text-xs font-semibold text-foreground leading-none">
          {totalClientes.toString().padStart(2, "0")} CARTERAS
        </span>
        <span
          class="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mt-1"
          >Clientes Totales</span
        >
      </div>
    </div>
  </div>

  <!-- BARRA DEL FILTRO INDEXADO ALFABÉTICO -->
  <div
    class="flex flex-wrap items-center gap-1 bg-card border border-border p-1.5 rounded-xl shadow-xs transition-colors"
  >
    {#each abecedario as letra}
      <button
        type="button"
        on:click={() => (letraSeleccionada = letra)}
        class="px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wide transition-all cursor-pointer duration-150
               {letraSeleccionada === letra
          ? 'bg-primary text-primary-foreground shadow-xs scale-102 font-semibold'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
      >
        {letra}
      </button>
    {/each}
  </div>

  <!-- LISTADO DE FILAS LIMPIAS -->
  <div class="space-y-2 flex-1 overflow-y-auto pr-1 Brass-container pb-6">
    {#each clientesFiltrados as cliente}
      {@const slug = generarSlug(cliente.nombre)}

      <div
        style="view-transition-name: cliente-card-{slug};"
        class="bg-card text-card-foreground border border-border rounded-2xl p-4 flex items-center justify-between gap-6 shadow-xs hover:shadow-sm transition-all group duration-200"
      >
        <!-- SECCIÓN A: IDENTIDAD COMERCIAL -->
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <div
            style="view-transition-name: cliente-avatar-{slug};"
            class="w-12 h-12 rounded-2xl flex items-center justify-center font-semibold text-lg border border-primary/20 bg-primary/10 text-primary shadow-xs flex-shrink-0 transition-transform group-hover:scale-105 duration-300"
          >
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div class="min-w-0">
            <h3
              class="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate"
            >
              {cliente.nombre}
            </h3>
            <p class="text-[10px] font-semibold text-muted-foreground mt-0.5">
              Aeroprint Partner
            </p>
          </div>
        </div>

        <!-- SECCIÓN B: CONTADOR EXCLUSIVO DE ÓRDENES -->
        <div
          class="flex flex-col w-[120px] flex-shrink-0 text-left sm:text-center"
        >
          <span
            class="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none"
            >Órdenes Totales</span
          >
          <span
            class="text-sm font-semibold text-foreground mt-1.5 tabular-nums leading-none"
          >
            {cliente.totalTareas.toString().padStart(2, "0")} partes
          </span>
        </div>

        <!-- SECCIÓN C: ACCESO DIRECTO MÓRFICO AL HISTORIAL -->
        <div class="w-[130px] flex-shrink-0 flex items-center justify-end">
          <a
            href="/clients/{cliente.nombre}"
            class="text-[10px] font-semibold tracking-wider px-4 py-2 bg-muted text-foreground rounded-xl hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-xs text-center inline-block"
          >
            Ver Historial
          </a>
        </div>
      </div>
    {:else}
      <div
        class="bg-card border border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground shadow-xs transition-colors"
      >
        <span
          class="material-symbols-rounded text-4xl block mb-2 text-muted-foreground/60"
          style="font-variation-settings: 'wght' 100;">folder_open</span
        >
        <p class="text-xs font-semibold">
          No se encontraron clientes que empiecen por "{letraSeleccionada}" o
          coincidan con tu búsqueda actual.
        </p>
      </div>
    {/each}
  </div>
</div>
