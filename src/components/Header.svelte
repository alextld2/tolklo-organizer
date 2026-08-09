<script lang="ts">
  import { onMount } from "svelte";
  import { busquedaGlobal } from "../stores/busqueda";
  import SidebarTrigger from "./SidebarTrigger.svelte";
  import { FolderSearch } from "lucide-svelte";
  import * as Kbd from "./ui/kbd";

  let tieneFoco = false;
  let workspace = "produccion";
  let searchInput: HTMLInputElement;

  // Almacenes de respuesta de la API SQL
  let clientesEncontrados: any[] = [];
  let tareasEncontradas: any[] = [];

  // Estados para la ventana modal de resumen
  let modalAbierto = false;
  let tareaSeleccionada: any = null;
  let desglosesTarea: any[] = []; // <-- Almacén dinámico para las líneas de producto

  onMount(() => {
    const segmentos = window.location.pathname.split("/");
    if (segmentos[1] === "w" && segmentos[2]) {
      workspace = segmentos[2];
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput?.focus();
        searchInput?.select();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  });

  let searchTimer: ReturnType<typeof setTimeout>;

  // Escucha reactiva con debounce de 250ms para optimizar la red y la base de datos
  $: {
    const query = $busquedaGlobal.trim();
    clearTimeout(searchTimer);
    if (query.length >= 2) {
      searchTimer = setTimeout(() => {
        fetch(
          `/api/search.json?q=${encodeURIComponent(query)}&workspace=${workspace}`,
        )
          .then((res) => res.json())
          .then((data) => {
            clientesEncontrados = data.clientes || [];
            tareasEncontradas = data.tareas || [];
          })
          .catch((err) =>
            console.error("Error en la consulta del buscador:", err),
          );
      }, 250);
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
      const res = await fetch(
        `/api/tarea/${encodeURIComponent(tarea.numParte)}.json`,
      );
      if (res.ok) {
        const data = await res.json();
        desglosesTarea = data.desgloses || [];
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

<header
  class="h-14 w-full flex items-center justify-between px-4 sm:px-6 relative z-40 bg-transparent transition-colors duration-200 font-sans flex-shrink-0"
>
  <SidebarTrigger />

  <div class="relative w-full max-w-md ml-auto">
    <div
      class="w-full flex items-center gap-2.5 bg-card border border-border/70 rounded-xl px-3.5 py-1.5 shadow-2xs transition-all focus-within:border-ring focus-within:ring-1 focus-within:ring-ring"
    >
      <FolderSearch class="w-4 h-4 text-muted-foreground flex-shrink-0" />

      <input
        bind:this={searchInput}
        type="text"
        placeholder="Buscar por nº parte, cliente o trabajo..."
        bind:value={$busquedaGlobal}
        on:focus={() => (tieneFoco = true)}
        on:blur={() => setTimeout(() => (tieneFoco = false), 250)}
        class="w-full bg-transparent border-none text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground flex-1 p-0 m-0 focus:ring-0"
      />

      <Kbd.Group>
        <Kbd.Root>Ctrl + K</Kbd.Root>
      </Kbd.Group>
    </div>

    {#if mostrarResultados}
      <div
        class="absolute top-[calc(100%+8px)] left-0 right-0 bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl p-4 z-50 animate-scale-up transition-colors max-h-[380px] overflow-y-auto"
      >
        {#if clientesEncontrados.length > 0}
          <div class="mb-4">
            <p
              class="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 block"
            >
              Clientes
            </p>
            <div class="space-y-1">
              {#each clientesEncontrados as cl}
                <div
                  class="flex items-center justify-between p-2 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors group"
                >
                  <div class="flex items-center gap-3">
                    <span
                      class="material-symbols-rounded text-muted-foreground text-lg"
                      style="font-variation-settings: 'wght' 300;">badge</span
                    >
                    <span class="text-xs font-semibold">{cl.nombre}</span>
                  </div>
                  <a
                    href="/w/{workspace}/clients?search={encodeURIComponent(
                      cl.nombre,
                    )}"
                    class="text-[10px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors"
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
            <p
              class="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 block"
            >
              Órdenes de producción
            </p>
            <div class="space-y-1">
              {#each tareasEncontradas as trabajo}
                <div
                  class="flex items-center justify-between p-2 rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors group"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-2 h-2 rounded-full bg-primary flex-shrink-0"
                    ></div>
                    <div class="flex flex-col min-w-0">
                      <span class="text-xs font-semibold text-foreground">
                        #{trabajo.numParte} — {trabajo.cliente}
                      </span>
                      <span
                        class="text-[10px] font-medium text-muted-foreground truncate"
                      >
                        {trabajo.descripcionGeneral || "Sin descripción"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    on:click={() => abrirResumen(trabajo)}
                    class="text-muted-foreground hover:text-primary p-1 rounded-lg transition-colors cursor-pointer outline-none flex items-center justify-center"
                  >
                    <span
                      class="material-symbols-rounded text-lg"
                      style="font-variation-settings: 'wght' 300;"
                      >visibility</span
                    >
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if clientesEncontrados.length === 0 && tareasEncontradas.length === 0}
          <p class="text-xs text-center py-4 text-muted-foreground font-medium">
            No hay resultados para la búsqueda.
          </p>
        {/if}
      </div>
    {/if}
  </div>
</header>

{#if modalAbierto && tareaSeleccionada}
  <div
    class="fixed inset-0 z-[300] flex items-center justify-center p-4 font-sans"
  >
    <button
      type="button"
      aria-label="Cerrar modal"
      class="absolute inset-0 bg-background/80 backdrop-blur-xs animate-fade-in border-none cursor-default"
      on:click={cerrarModal}
    ></button>

    <div
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      class="bg-card text-card-foreground border border-border rounded-3xl p-8 w-full max-w-2xl shadow-2xl relative transition-colors max-h-[90vh] overflow-y-auto animate-scale-up z-10"
    >
      <div class="flex justify-between items-start mb-2">
        <div class="flex items-center gap-2">
          <span
            class="px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-semibold rounded-lg tracking-wider uppercase"
          >
            Parte #{tareaSeleccionada.numParte}
          </span>
          <span
            class="px-2.5 py-1 text-[10px] font-semibold rounded-lg uppercase tracking-wider border
            {tareaSeleccionada.estado === 'En proceso'
              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}"
          >
            {tareaSeleccionada.estado}
          </span>
        </div>
        <button
          type="button"
          on:click={cerrarModal}
          class="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-accent transition-all cursor-pointer flex items-center justify-center outline-none border border-transparent"
        >
          <span class="material-symbols-rounded text-lg">close</span>
        </button>
      </div>

      <h2
        class="text-3xl font-semibold tracking-tight text-foreground uppercase mb-6"
      >
        {tareaSeleccionada.cliente}
      </h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          class="flex items-center gap-3 bg-muted/60 border border-border p-3 rounded-xl"
        >
          <div
            class="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0"
          >
            <span
              class="material-symbols-rounded text-lg"
              style="font-variation-settings: 'wght' 300;">account_circle</span
            >
          </div>
          <div class="min-w-0 flex flex-col">
            <span
              class="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none"
              >Comercial</span
            >
            <span class="text-xs font-semibold mt-1 text-foreground truncate"
              >{tareaSeleccionada.comercial || "Sin asignar"}</span
            >
          </div>
        </div>

        <div
          class="flex items-center gap-3 bg-muted/60 border border-border p-3 rounded-xl"
        >
          <div
            class="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"
          >
            <span
              class="material-symbols-rounded text-lg"
              style="font-variation-settings: 'wght' 300;">layers</span
            >
          </div>
          <div class="min-w-0 flex flex-col">
            <span
              class="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none"
              >Área</span
            >
            <span class="text-xs font-semibold mt-1 text-foreground truncate"
              >{tareaSeleccionada.area}</span
            >
          </div>
        </div>

        <div
          class="flex items-center gap-3 bg-muted/60 border border-border p-3 rounded-xl"
        >
          <div
            class="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0"
          >
            <span
              class="material-symbols-rounded text-lg"
              style="font-variation-settings: 'wght' 300;">palette</span
            >
          </div>
          <div class="min-w-0 flex flex-col">
            <span
              class="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none"
              >Diseñador</span
            >
            <span
              class="text-xs font-semibold mt-1 text-emerald-600 dark:text-emerald-400 truncate"
              >{tareaSeleccionada.diseñador || "Sin asignar"}</span
            >
          </div>
        </div>

        <div
          class="flex items-center gap-3 bg-muted/60 border border-border p-3 rounded-xl"
        >
          <div
            class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0"
          >
            <span
              class="material-symbols-rounded text-lg"
              style="font-variation-settings: 'wght' 300;">calendar_today</span
            >
          </div>
          <div class="min-w-0 flex flex-col">
            <span
              class="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest leading-none"
              >Entrega</span
            >
            <span class="text-xs font-semibold mt-1 text-foreground truncate"
              >{tareaSeleccionada.fechaSalida}</span
            >
          </div>
        </div>
      </div>

      <div class="mt-6">
        <p
          class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1"
        >
          <span
            class="material-symbols-rounded text-sm"
            style="font-variation-settings: 'wght' 300;">description</span
          >
          <span>Descripción General del Pedido</span>
        </p>
        <div
          class="bg-card p-4 rounded-2xl border border-border text-xs font-medium text-muted-foreground leading-relaxed shadow-xs"
        >
          {tareaSeleccionada.descripcionGeneral ||
            "Sin descripción general redactada."}
        </div>
      </div>

      <div class="mt-6">
        <p
          class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1"
        >
          <span
            class="material-symbols-rounded text-sm"
            style="font-variation-settings: 'wght' 300;">reorder</span
          >
          <span>Desglose Técnico de Producción</span>
        </p>
        <div
          class="border border-border rounded-2xl overflow-hidden bg-card shadow-xs"
        >
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="bg-muted/50 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
              >
                <th class="p-3.5 pl-5">Producto / Subtarea</th>
                <th class="p-3.5 text-right pr-5">Cantidad</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border text-xs text-foreground">
              {#each desglosesTarea as subItem}
                <tr class="hover:bg-accent/40 transition-colors">
                  <td class="p-3.5 pl-5 font-medium text-muted-foreground"
                    >{subItem.descripcionProducto}</td
                  >
                  <td class="p-3.5 text-right pr-5">
                    <span
                      class="bg-primary/10 text-primary px-2.5 py-1 rounded-md font-semibold text-[11px] border border-primary/20"
                    >
                      {subItem.cantidad.toLocaleString()} uds
                    </span>
                  </td>
                </tr>
              {:else}
                <tr>
                  <td
                    colspan="2"
                    class="p-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2"
                  >
                    <span
                      class="material-symbols-rounded text-3xl opacity-30"
                      style="font-variation-settings: 'wght' 100;"
                      >inventory_2</span
                    >
                    <span class="text-[11px] font-medium italic"
                      >No hay subproductos detallados en este parte.</span
                    >
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      {#if tareaSeleccionada.subcontrata}
        <div
          class="mt-4 flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl"
        >
          <span
            class="material-symbols-rounded text-amber-600 text-base"
            style="font-variation-settings: 'wght' 300;">handshake</span
          >
          <p class="text-[11px] font-medium text-amber-600">
            Esta orden se encuentra externalizada en: <span
              class="font-semibold uppercase"
              >{tareaSeleccionada.subcontrata}</span
            >
          </p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  @keyframes scale-up {
    from {
      opacity: 0;
      transform: scale(0.97) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .animate-scale-up {
    animation: scale-up 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .animate-fade-in {
    animation: fade-in 0.2s ease-out forwards;
  }
</style>
