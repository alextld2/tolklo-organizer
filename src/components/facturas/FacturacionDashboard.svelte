<script lang="ts">
  import { 
    Receipt, 
    Plus, 
    Search, 
    ShieldCheck, 
    Lock, 
    QrCode, 
    Building2, 
    Eye, 
    CheckCircle2, 
    Clock, 
    AlertTriangle,
    Coins,
    FileCheck2
  } from "lucide-svelte";
  import { formatEuro, formatFechaES } from "$lib/fiscal-utils";
  import NuevaFacturaModal from "./NuevaFacturaModal.svelte";
  import DetalleFacturaModal from "./DetalleFacturaModal.svelte";
  import ConfiguracionFiscalModal from "./ConfiguracionFiscalModal.svelte";

  let {
    facturasIniciales = [],
    configuracionFiscal = null,
    workspace = "produccion"
  }: {
    facturasIniciales: any[];
    configuracionFiscal: any;
    workspace: string;
  } = $props();

  let facturas = $state(facturasIniciales);
  let config = $state(configuracionFiscal);
  let modalNuevaAbierto = $state(false);
  let modalConfigAbierto = $state(false);
  let facturaSeleccionada = $state<any>(null);
  let modalDetalleAbierto = $state(false);

  let filtroEstado = $state("TODOS");
  let textoBusqueda = $state("");
  let emitindoId = $state<number | null>(null);

  // Métricas financieras y fiscales
  let totalFacturado = $derived(
    facturas.filter(f => f.estado !== "Anulada").reduce((acc, f) => acc + (Number(f.totalFactura) || 0), 0)
  );

  let ivaAcumulado = $derived(
    facturas.filter(f => f.estado !== "Anulada").reduce((acc, f) => acc + (Number(f.cuotaIva) || 0), 0)
  );

  let facturasSelladas = $derived(
    facturas.filter(f => f.bloqueada && f.huellaHash).length
  );

  let pendientesCobro = $derived(
    facturas.filter(f => f.estado === "Emitida").length
  );

  let facturasFiltradas = $derived(
    facturas.filter(f => {
      const coincideFiltro = filtroEstado === "TODOS" || f.estado === filtroEstado;
      const q = textoBusqueda.trim().toLowerCase();
      const coincideTexto = !q || 
        (f.numeroFacturaCompleto && f.numeroFacturaCompleto.toLowerCase().includes(q)) || 
        (f.cliente && f.cliente.toLowerCase().includes(q)) ||
        (f.clienteNif && f.clienteNif.toLowerCase().includes(q)) ||
        (f.huellaHash && f.huellaHash.toLowerCase().includes(q));
      return coincideFiltro && coincideTexto;
    })
  );

  async function recargarFacturas() {
    try {
      const res = await fetch(`/api/facturas?workspace=${workspace}`);
      if (res.ok) {
        const data = await res.json();
        facturas = data.facturas || [];
      }
      const resCfg = await fetch(`/api/facturas/configuracion?workspace=${workspace}`);
      if (resCfg.ok) {
        const dataCfg = await resCfg.json();
        config = dataCfg.configuracion || null;
      }
    } catch (e) {
      console.error("Error recargando facturas:", e);
    }
  }

  async function sellarVerifactu(id: number) {
    if (!confirm("¿Deseas emitir y sellar oficialmente esta factura? Según la Ley Antifraude quedará bloqueada contra cualquier alteración y se generará su huella SHA-256 encadenada.")) {
      return;
    }

    emitindoId = id;
    try {
      const res = await fetch("/api/facturas/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facturaId: id })
      });

      if (res.ok) {
        await recargarFacturas();
      } else {
        const data = await res.json();
        alert(data.error || "Error al sellar factura");
      }
    } catch (e: any) {
      alert(e.message || "Error en la llamada");
    } finally {
      emitindoId = null;
    }
  }

  function abrirDetalle(f: any) {
    facturaSeleccionada = f;
    modalDetalleAbierto = true;
  }

  function getBadgeClass(estado: string) {
    switch (estado) {
      case "Cobrada":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Emitida":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Anulada":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
  }
</script>

<div class="space-y-6">
  <!-- Cabecera Principal -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Facturación Fiscal</h1>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1 uppercase tracking-wider">
          <ShieldCheck class="w-3 h-3" />
          VERI*FACTU READY
        </span>
      </div>
      <p class="text-xs text-muted-foreground">
        Emisión, custodia y encadenamiento criptográfico conforme al Real Decreto 1007/2023 y la Ley Antifraude 11/2021.
      </p>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={() => (modalConfigAbierto = true)}
        class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-card hover:bg-accent text-foreground text-xs font-semibold rounded-xl border border-border transition-colors cursor-pointer"
      >
        <Building2 class="w-4 h-4 text-muted-foreground" />
        <span>Datos Emisor Fiscal</span>
      </button>

      <button
        type="button"
        onclick={() => (modalNuevaAbierto = true)}
        class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs cursor-pointer select-none"
      >
        <Plus class="w-4 h-4" />
        <span>Nueva Factura</span>
      </button>
    </div>
  </div>

  <!-- Banner Normativo Veri*factu -->
  <div class="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/25 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
    <div class="flex items-start gap-3">
      <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Lock class="w-5 h-5" />
      </div>
      <div class="text-xs">
        <h3 class="font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
          Garantía de Inalterabilidad y Trazabilidad (RD 1007/2023)
        </h3>
        <p class="text-emerald-800/90 dark:text-emerald-300/90 text-[11px] mt-0.5 leading-relaxed">
          Cada factura emitida genera un hash SHA-256 que encadena matemáticamente con la factura previa de su serie, impidiendo borrados o alteraciones opacas y generando el código QR reglamentario para cotejo con la AEAT.
        </p>
      </div>
    </div>

    <div class="flex-shrink-0 flex items-center gap-2 bg-card/80 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold text-emerald-900 dark:text-emerald-200">
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      <span>{facturasSelladas} facturas selladas</span>
    </div>
  </div>

  <!-- Métricas KPI -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
    <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Facturación Total</span>
        <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Coins class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{formatEuro(totalFacturado)}</span>
      </div>
      <p class="text-[10px] text-muted-foreground mt-1">{facturas.length} facturas registradas</p>
    </div>

    <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">IVA Repercutido</span>
        <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
          <Receipt class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{formatEuro(ivaAcumulado)}</span>
      </div>
      <p class="text-[10px] text-muted-foreground mt-1">Cuota IVA para Modelo 303</p>
    </div>

    <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Facturas Selladas</span>
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <FileCheck2 class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{facturasSelladas}</span>
      </div>
      <p class="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Registros inalterables con QR</p>
    </div>

    <div class="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pendientes de Cobro</span>
        <div class="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <Clock class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{pendientesCobro}</span>
      </div>
      <p class="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Emitidas no cobradas</p>
    </div>
  </div>

  <!-- Barra de Filtros y Búsqueda -->
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/70 p-3 rounded-2xl shadow-2xs">
    <div class="relative w-full sm:w-80">
      <Search class="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        placeholder="Buscar por nº factura, cliente o NIF..."
        bind:value={textoBusqueda}
        class="w-full bg-muted/40 border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
      />
    </div>

    <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
      {#each ["TODOS", "Emitida", "Cobrada", "Borrador"] as st}
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

  <!-- Tabla de Facturas -->
  <div class="border border-border/70 rounded-2xl overflow-hidden bg-card shadow-2xs">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="bg-muted/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <th class="p-3.5 pl-5">Nº Factura</th>
            <th class="p-3.5">Tipo</th>
            <th class="p-3.5">Cliente / NIF</th>
            <th class="p-3.5">Fecha Expedición</th>
            <th class="p-3.5 text-right">Base Imponible</th>
            <th class="p-3.5 text-right">Total Factura</th>
            <th class="p-3.5 text-center">Huella SHA-256</th>
            <th class="p-3.5 text-center">Estado</th>
            <th class="p-3.5 text-right pr-5">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each facturasFiltradas as factura}
            <tr class="hover:bg-accent/30 transition-colors">
              <td class="p-3.5 pl-5">
                <span class="font-bold text-foreground font-mono">{factura.numeroFacturaCompleto}</span>
              </td>
              <td class="p-3.5">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-muted border border-border">
                  {factura.tipoFactura || "F1"}
                </span>
              </td>
              <td class="p-3.5">
                <div class="flex flex-col">
                  <span class="font-semibold text-foreground">{factura.cliente}</span>
                  <span class="text-[10px] text-muted-foreground font-mono">{factura.clienteNif}</span>
                </div>
              </td>
              <td class="p-3.5 text-muted-foreground font-medium">
                {formatFechaES(factura.fechaExpedicion)}
              </td>
              <td class="p-3.5 text-right font-medium text-muted-foreground">
                {formatEuro(factura.baseImponible)}
              </td>
              <td class="p-3.5 text-right">
                <span class="font-bold text-foreground bg-muted/60 px-2 py-1 rounded-md border border-border">
                  {formatEuro(factura.totalFactura)}
                </span>
              </td>
              <td class="p-3.5 text-center">
                {#if factura.huellaHash}
                  <span class="inline-flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" title={factura.huellaHash}>
                    <Lock class="w-2.5 h-2.5" />
                    <span>{factura.huellaHash.substring(0, 6)}...{factura.huellaHash.substring(factura.huellaHash.length - 4)}</span>
                  </span>
                {:else}
                  <span class="text-[10px] text-muted-foreground italic">Sin sellar</span>
                {/if}
              </td>
              <td class="p-3.5 text-center">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider {getBadgeClass(factura.estado)}">
                  {factura.estado}
                </span>
              </td>
              <td class="p-3.5 text-right pr-5">
                <div class="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onclick={() => abrirDetalle(factura)}
                    class="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-muted/60 hover:bg-accent border border-border transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Eye class="w-3 h-3" />
                    <span>Ver</span>
                  </button>

                  {#if !factura.bloqueada}
                    <button
                      type="button"
                      disabled={emitindoId === factura.id}
                      onclick={() => sellarVerifactu(factura.id)}
                      class="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Lock class="w-3 h-3" />
                      <span>Sellar</span>
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="9" class="p-12 text-center text-muted-foreground">
                <Receipt class="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p class="text-xs font-semibold">No se encontraron facturas</p>
                <p class="text-[11px] text-muted-foreground mt-0.5">Genera tu primera factura formal o convierte un presupuesto.</p>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<NuevaFacturaModal
  abierto={modalNuevaAbierto}
  {workspace}
  onClose={() => (modalNuevaAbierto = false)}
  onCreated={recargarFacturas}
/>

<DetalleFacturaModal
  abierto={modalDetalleAbierto}
  factura={facturaSeleccionada}
  configuracionFiscal={config}
  onClose={() => (modalDetalleAbierto = false)}
/>

<ConfiguracionFiscalModal
  abierto={modalConfigAbierto}
  {workspace}
  configuracionInicial={config}
  onClose={() => (modalConfigAbierto = false)}
  onSaved={recargarFacturas}
/>
