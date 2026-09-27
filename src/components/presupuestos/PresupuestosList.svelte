<script lang="ts">
  import { 
    FileText, 
    Plus, 
    Search, 
    CheckCircle2, 
    Clock, 
    Send, 
    Truck, 
    Receipt, 
    ArrowUpRight,
    Filter,
    Calendar,
    Cpu
  } from "lucide-svelte";
  import { formatEuro, formatFechaES } from "$lib/fiscal-utils";
  import NuevoPresupuestoModal from "./NuevoPresupuestoModal.svelte";
  import CalculadorEscandalloModal from "./CalculadorEscandalloModal.svelte";

  let {
    presupuestosIniciales = [],
    workspace = "produccion"
  }: {
    presupuestosIniciales: any[];
    workspace: string;
  } = $props();

  let presupuestos = $state(presupuestosIniciales);
  let modalNuevoAbierto = $state(false);
  let modalEscandalloAbierto = $state(false);
  let datosEscandallo = $state<any>(null);
  let filtroEstado = $state("TODOS");
  let textoBusqueda = $state("");
  let cargandoAccion = $state<number | null>(null);

  function onAplicarEscandallo(datos: any) {
    datosEscandallo = datos;
    modalNuevoAbierto = true;
  }

  // Recalcular métricas en vivo
  let totalPresupuestado = $derived(
    presupuestos.reduce((acc, p) => acc + (Number(p.total) || 0), 0)
  );

  let totalAprobados = $derived(
    presupuestos.filter(p => p.estado === "Aprobado" || p.estado === "Facturado" || p.estado === "Albaranado").length
  );

  let totalPendientes = $derived(
    presupuestos.filter(p => p.estado === "Enviado" || p.estado === "Borrador").length
  );

  let tasaConversion = $derived(
    presupuestos.length > 0 ? Math.round((totalAprobados / presupuestos.length) * 100) : 0
  );

  let presupuestosFiltrados = $derived(
    presupuestos.filter(p => {
      const coincideFiltro = filtroEstado === "TODOS" || p.estado === filtroEstado;
      const q = textoBusqueda.trim().toLowerCase();
      const coincideTexto = !q || 
        (p.codigo && p.codigo.toLowerCase().includes(q)) || 
        (p.cliente && p.cliente.toLowerCase().includes(q)) ||
        (p.clienteNif && p.clienteNif.toLowerCase().includes(q));
      return coincideFiltro && coincideTexto;
    })
  );

  async function recargarPresupuestos() {
    try {
      const res = await fetch(`/api/presupuestos?workspace=${workspace}`);
      if (res.ok) {
        const data = await res.json();
        presupuestos = data.presupuestos || [];
      }
    } catch (e) {
      console.error("Error recargando presupuestos:", e);
    }
  }

  async function convertirPresupuesto(id: number, destino: "albaran" | "factura") {
    cargandoAccion = id;
    try {
      const res = await fetch("/api/presupuestos/convertir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presupuestoId: id, destino })
      });

      if (res.ok) {
        await recargarPresupuestos();
        if (destino === "albaran") {
          window.location.href = `/w/${workspace}/albaranes`;
        } else {
          window.location.href = `/w/${workspace}/facturacion`;
        }
      } else {
        const data = await res.json();
        alert(data.error || "Error al convertir presupuesto");
      }
    } catch (e: any) {
      alert(e.message || "Error en la petición");
    } finally {
      cargandoAccion = null;
    }
  }

  function getBadgeClass(estado: string) {
    switch (estado) {
      case "Aprobado":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Enviado":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Facturado":
        return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20";
      case "Albaranado":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "Rechazado":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
  }
</script>

<div class="space-y-6">
  <!-- Cabecera de Sección -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Presupuestos</h1>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
          Comercial
        </span>
      </div>
      <p class="text-xs text-muted-foreground">
        Elabora cotizaciones detalladas, calcula márgenes impositivos y conviértelas en albaranes o facturas con un clic.
      </p>
    </div>

    <div class="flex items-center gap-2.5">
      <a
        href={`/w/${workspace}/escandallo`}
        class="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer select-none no-underline"
        title="Simulador técnico de pliegos, máquinas, mermas y costes"
      >
        <Cpu class="w-4 h-4" />
        <span>⚡ Escandallo & Imposición</span>
      </a>

      <button
        type="button"
        onclick={() => {
          datosEscandallo = null;
          modalNuevoAbierto = true;
        }}
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs cursor-pointer select-none"
      >
        <Plus class="w-4 h-4" />
        <span>Nuevo Presupuesto</span>
      </button>
    </div>
  </div>

  <!-- Métricas KPI -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
    <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Volumen Ofertado</span>
        <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <FileText class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{formatEuro(totalPresupuestado)}</span>
      </div>
      <p class="text-[10px] text-muted-foreground mt-1">{presupuestos.length} presupuestos registrados</p>
    </div>

    <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Aprobados</span>
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{totalAprobados}</span>
      </div>
      <p class="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Listos para taller o facturación</p>
    </div>

    <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">En Negociación</span>
        <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
          <Clock class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{totalPendientes}</span>
      </div>
      <p class="text-[10px] text-muted-foreground mt-1">Borradores y enviados a cliente</p>
    </div>

    <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tasa de Aprobación</span>
        <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <ArrowUpRight class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{tasaConversion}%</span>
      </div>
      <p class="text-[10px] text-muted-foreground mt-1">Eficacia de conversión comercial</p>
    </div>
  </div>

  <!-- Barra de Filtros y Búsqueda -->
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/70 p-3 rounded-2xl shadow-2xs">
    <div class="relative w-full sm:w-80">
      <Search class="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        placeholder="Buscar por código, cliente o NIF..."
        bind:value={textoBusqueda}
        class="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
      />
    </div>

    <!-- Píldoras de Filtro -->
    <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
      {#each ["TODOS", "Borrador", "Enviado", "Aprobado", "Albaranado", "Facturado"] as st}
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

  <!-- Tabla de Presupuestos -->
  <div class="border border-border/70 rounded-2xl overflow-hidden bg-card shadow-2xs">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-muted/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <th class="p-3.5 pl-5">Código / Serie</th>
            <th class="p-3.5">Cliente</th>
            <th class="p-3.5">Emisión / Validez</th>
            <th class="p-3.5 text-right">Base Imponible</th>
            <th class="p-3.5 text-right">Total Presupuesto</th>
            <th class="p-3.5 text-center">Estado</th>
            <th class="p-3.5 text-right pr-5">Acciones Rápidas</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each presupuestosFiltrados as presupuesto}
            <tr class="hover:bg-accent/30 transition-colors">
              <td class="p-3.5 pl-5">
                <div class="flex flex-col">
                  <span class="font-bold text-foreground">{presupuesto.codigo}</span>
                  {#if presupuesto.numParteTrabajoVinculado}
                    <span class="text-[10px] text-muted-foreground">Parte #{presupuesto.numParteTrabajoVinculado}</span>
                  {/if}
                </div>
              </td>
              <td class="p-3.5">
                <div class="flex flex-col">
                  <span class="font-semibold text-foreground">{presupuesto.cliente}</span>
                  {#if presupuesto.clienteNif}
                    <span class="text-[10px] text-muted-foreground font-mono">{presupuesto.clienteNif}</span>
                  {/if}
                </div>
              </td>
              <td class="p-3.5">
                <div class="flex flex-col text-muted-foreground">
                  <span>{formatFechaES(presupuesto.fechaEmision)}</span>
                  {#if presupuesto.fechaValidez}
                    <span class="text-[10px] text-muted-foreground/70">Hasta {formatFechaES(presupuesto.fechaValidez)}</span>
                  {/if}
                </div>
              </td>
              <td class="p-3.5 text-right font-medium text-muted-foreground">
                {formatEuro(presupuesto.baseImponible)}
              </td>
              <td class="p-3.5 text-right">
                <span class="font-bold text-foreground bg-muted/60 px-2 py-1 rounded-md border border-border">
                  {formatEuro(presupuesto.total)}
                </span>
              </td>
              <td class="p-3.5 text-center">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider {getBadgeClass(presupuesto.estado)}">
                  {presupuesto.estado}
                </span>
              </td>
              <td class="p-3.5 text-right pr-5">
                <div class="inline-flex items-center gap-1.5">
                  {#if presupuesto.estado !== 'Albaranado' && presupuesto.estado !== 'Facturado'}
                    <button
                      type="button"
                      title="Convertir en Albarán de Entrega"
                      disabled={cargandoAccion === presupuesto.id}
                      onclick={() => convertirPresupuesto(presupuesto.id, 'albaran')}
                      class="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Truck class="w-3 h-3" />
                      <span>Albarán</span>
                    </button>
                    <button
                      type="button"
                      title="Convertir en Factura"
                      disabled={cargandoAccion === presupuesto.id}
                      onclick={() => convertirPresupuesto(presupuesto.id, 'factura')}
                      class="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-muted/60 hover:bg-emerald-500/10 hover:text-emerald-600 border border-border transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Receipt class="w-3 h-3" />
                      <span>Facturar</span>
                    </button>
                  {:else}
                    <span class="text-[11px] text-muted-foreground italic">Procesado</span>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="p-12 text-center text-muted-foreground">
                <FileText class="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p class="text-xs font-semibold">No se encontraron presupuestos</p>
                <p class="text-[11px] text-muted-foreground mt-0.5">Haz clic en "Nuevo Presupuesto" para comenzar a cotizar.</p>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<NuevoPresupuestoModal
  abierto={modalNuevoAbierto}
  {workspace}
  datosIniciales={datosEscandallo}
  onClose={() => {
    modalNuevoAbierto = false;
    datosEscandallo = null;
  }}
  onCreated={recargarPresupuestos}
/>

<CalculadorEscandalloModal
  abierto={modalEscandalloAbierto}
  onClose={() => (modalEscandalloAbierto = false)}
  onAplicar={onAplicarEscandallo}
/>
