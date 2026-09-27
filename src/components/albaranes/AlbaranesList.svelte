<script lang="ts">
  import { 
    Truck, 
    Plus, 
    Search, 
    PackageCheck, 
    Clock, 
    MapPin, 
    Receipt, 
    CheckCircle2, 
    AlertCircle 
  } from "lucide-svelte";
  import { formatFechaES } from "$lib/fiscal-utils";
  import NuevoAlbaranModal from "./NuevoAlbaranModal.svelte";

  let {
    albaranesIniciales = [],
    workspace = "produccion"
  }: {
    albaranesIniciales: any[];
    workspace: string;
  } = $props();

  let albaranes = $state(albaranesIniciales);
  let modalNuevoAbierto = $state(false);
  let filtroEstado = $state("TODOS");
  let textoBusqueda = $state("");

  let totalAlbaranes = $derived(albaranes.length);
  let totalEntregados = $derived(albaranes.filter(a => a.estado === "Entregado").length);
  let totalEnReparto = $derived(albaranes.filter(a => a.estado === "En reparto" || a.estado === "Pendiente").length);
  let totalSinFacturar = $derived(albaranes.filter(a => !a.facturaIdVinculada).length);

  let albaranesFiltrados = $derived(
    albaranes.filter(a => {
      const coincideFiltro = filtroEstado === "TODOS" || a.estado === filtroEstado;
      const q = textoBusqueda.trim().toLowerCase();
      const coincideTexto = !q || 
        (a.codigo && a.codigo.toLowerCase().includes(q)) || 
        (a.cliente && a.cliente.toLowerCase().includes(q)) ||
        (a.transportista && a.transportista.toLowerCase().includes(q));
      return coincideFiltro && coincideTexto;
    })
  );

  async function recargarAlbaranes() {
    try {
      const res = await fetch(`/api/albaranes?workspace=${workspace}`);
      if (res.ok) {
        const data = await res.json();
        albaranes = data.albaranes || [];
      }
    } catch (e) {
      console.error("Error recargando albaranes:", e);
    }
  }

  function getBadgeClass(estado: string) {
    switch (estado) {
      case "Entregado":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "En reparto":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "En preparación":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
  }
</script>

<div class="space-y-6">
  <!-- Cabecera -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Albaranes de Entrega</h1>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
          Logística & Despacho
        </span>
      </div>
      <p class="text-xs text-muted-foreground">
        Control de expedición, hojas de ruta de reparto y trazabilidad de entrega de material a clientes.
      </p>
    </div>

    <button
      type="button"
      onclick={() => (modalNuevoAbierto = true)}
      class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs cursor-pointer select-none"
    >
      <Plus class="w-4 h-4" />
      <span>Nuevo Albarán</span>
    </button>
  </div>

  <!-- Métricas KPI -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
    <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Albaranes Totales</span>
        <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Truck class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{totalAlbaranes}</span>
      </div>
      <p class="text-[10px] text-muted-foreground mt-1">Expediciones generadas</p>
    </div>

    <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Entregados</span>
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{totalEntregados}</span>
      </div>
      <p class="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Recepción confirmada</p>
    </div>

    <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">En Tránsito / Taller</span>
        <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
          <Clock class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{totalEnReparto}</span>
      </div>
      <p class="text-[10px] text-muted-foreground mt-1">En reparto o preparación</p>
    </div>

    <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pendientes de Facturar</span>
        <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <Receipt class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{totalSinFacturar}</span>
      </div>
      <p class="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Listos para emisión fiscal</p>
    </div>
  </div>

  <!-- Barra de Filtros y Búsqueda -->
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/70 p-3 rounded-2xl shadow-2xs">
    <div class="relative w-full sm:w-80">
      <Search class="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        placeholder="Buscar por código, cliente o agencia..."
        bind:value={textoBusqueda}
        class="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
      />
    </div>

    <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
      {#each ["TODOS", "Pendiente", "En reparto", "Entregado"] as st}
        <button
          type="button"
          onclick={() => (filtroEstado = st)}
          class="px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap {filtroEstado === st ? 'bg-primary text-primary-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
        >
          {st}
        </button>
      {/each}
    </div>
  </div>

  <!-- Tabla de Albaranes -->
  <div class="border border-border/70 rounded-2xl overflow-hidden bg-card shadow-2xs">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-muted/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <th class="p-3.5 pl-5">Nº Albarán</th>
            <th class="p-3.5">Cliente / Receptor</th>
            <th class="p-3.5">Fecha Salida</th>
            <th class="p-3.5">Transporte / Bultos</th>
            <th class="p-3.5 text-center">Estado Entrega</th>
            <th class="p-3.5 text-center">Facturación</th>
            <th class="p-3.5 text-right pr-5">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each albaranesFiltrados as albaran}
            <tr class="hover:bg-accent/30 transition-colors">
              <td class="p-3.5 pl-5">
                <div class="flex flex-col">
                  <span class="font-bold text-foreground">{albaran.codigo}</span>
                  {#if albaran.numParteTrabajoVinculado}
                    <span class="text-[10px] text-muted-foreground">Parte #{albaran.numParteTrabajoVinculado}</span>
                  {/if}
                </div>
              </td>
              <td class="p-3.5">
                <div class="flex flex-col">
                  <span class="font-semibold text-foreground">{albaran.cliente}</span>
                  {#if albaran.clienteDireccion}
                    <span class="text-[10px] text-muted-foreground truncate max-w-xs">{albaran.clienteDireccion}</span>
                  {/if}
                </div>
              </td>
              <td class="p-3.5 text-muted-foreground font-medium">
                {formatFechaES(albaran.fecha)}
              </td>
              <td class="p-3.5">
                <div class="flex flex-col">
                  <span class="font-medium text-foreground">{albaran.transportista || "Reparto Propio"}</span>
                  <span class="text-[10px] text-muted-foreground">{albaran.bultos || 1} bulto(s)</span>
                </div>
              </td>
              <td class="p-3.5 text-center">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider {getBadgeClass(albaran.estado)}">
                  {albaran.estado}
                </span>
              </td>
              <td class="p-3.5 text-center">
                {#if albaran.facturaIdVinculada}
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-wider">
                    Facturado
                  </span>
                {:else}
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                    Pendiente
                  </span>
                {/if}
              </td>
              <td class="p-3.5 text-right pr-5">
                <button
                  type="button"
                  onclick={() => window.print()}
                  class="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-muted/60 hover:bg-accent border border-border transition-colors cursor-pointer"
                >
                  Imprimir Hoja
                </button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="p-12 text-center text-muted-foreground">
                <Truck class="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p class="text-xs font-semibold">No se encontraron albaranes</p>
                <p class="text-[11px] text-muted-foreground mt-0.5">Crea uno nuevo o convierte un presupuesto aprobado.</p>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<NuevoAlbaranModal
  abierto={modalNuevoAbierto}
  {workspace}
  onClose={() => (modalNuevoAbierto = false)}
  onCreated={recargarAlbaranes}
/>
