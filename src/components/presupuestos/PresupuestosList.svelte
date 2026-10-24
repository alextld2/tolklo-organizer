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
    Cpu,
    Trash2,
    Mail,
    Sparkles,
    Printer,
    ChevronDown,
    X,
    ExternalLink,
    Pencil
  } from "lucide-svelte";
  import { formatEuro, formatFechaES } from "$lib/fiscal-utils";
  import NuevoPresupuestoModal from "./NuevoPresupuestoModal.svelte";
  import CalculadorEscandalloModal from "./CalculadorEscandalloModal.svelte";
  import EnviarPresupuestoModal from "./EnviarPresupuestoModal.svelte";

  let {
    presupuestosIniciales = [],
    workspace = "produccion"
  }: {
    presupuestosIniciales: any[];
    workspace: string;
  } = $props();

  let presupuestos = $state<any[]>([]);

  $effect(() => {
    presupuestos = presupuestosIniciales;
  });

  let modalNuevoAbierto = $state(false);
  let modalEscandalloAbierto = $state(false);
  let datosEscandallo = $state<any>(null);
  let datosPresupuestoEditar = $state<any>(null);
  let filtroEstado = $state("TODOS");
  let textoBusqueda = $state("");
  let cargandoAccion = $state<number | null>(null);

  // Estados interactivos
  let menuEstadoAbiertoId = $state<number | null>(null);
  let modalEnviarAbierto = $state(false);
  let presupuestoAEnviar = $state<any>(null);
  let presupuestoAEliminar = $state<any>(null);
  let cargandoEliminar = $state(false);
  let feedbackExitoParte = $state<{ mensaje: string; numParte?: string } | null>(null);

  function onAplicarEscandallo(datos: any) {
    datosEscandallo = datos;
    datosPresupuestoEditar = null;
    modalNuevoAbierto = true;
  }

  async function abrirEdicionDirecta(presupuesto: any) {
    cargandoAccion = presupuesto.id;
    try {
      const res = await fetch(`/api/presupuestos?id=${presupuesto.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.presupuesto) {
          datosPresupuestoEditar = {
            ...data.presupuesto,
            esEdicion: true
          };
          datosEscandallo = null;
          modalNuevoAbierto = true;
        }
      } else {
        alert("Error al cargar los datos del presupuesto");
      }
    } catch (e: any) {
      alert(e.message || "Error al conectar con el servidor");
    } finally {
      cargandoAccion = null;
    }
  }

  // Métricas KPI reactivas
  let totalPresupuestado = $derived(
    presupuestos.reduce((acc, p) => acc + (Number(p.total) || 0), 0)
  );

  let totalAprobados = $derived(
    presupuestos.filter(p => p.estado === "Aceptado" || p.estado === "Aprobado" || p.estado === "Facturado" || p.estado === "Albaranado").length
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

  // --- CAMBIO DE ESTADO Y CONEXIÓN CON IMPRENTA ---
  async function cambiarEstado(id: number, nuevoEstado: string) {
    cargandoAccion = id;
    menuEstadoAbiertoId = null;

    try {
      const res = await fetch("/api/presupuestos/estado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presupuestoId: id,
          nuevoEstado
        })
      });

      const data = await res.json();
      if (res.ok) {
        await recargarPresupuestos();
        if (nuevoEstado === "Aceptado" && data.numParte) {
          feedbackExitoParte = {
            mensaje: data.mensaje || `¡Presupuesto aceptado! Parte #${data.numParte} generado en taller.`,
            numParte: data.numParte
          };
        }
      } else {
        alert(data.error || "Ocurrió un error al actualizar el estado");
      }
    } catch (e: any) {
      alert(e.message || "Error en la petición");
    } finally {
      cargandoAccion = null;
    }
  }

  function abrirModalEnviar(presupuesto: any) {
    menuEstadoAbiertoId = null;
    presupuestoAEnviar = presupuesto;
    modalEnviarAbierto = true;
  }

  function solicitarEliminar(presupuesto: any) {
    presupuestoAEliminar = presupuesto;
  }

  async function ejecutarEliminacion() {
    if (!presupuestoAEliminar) return;
    cargandoEliminar = true;

    try {
      const res = await fetch(`/api/presupuestos?id=${presupuestoAEliminar.id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (res.ok) {
        presupuestoAEliminar = null;
        await recargarPresupuestos();
      } else {
        alert(data.error || "Error al eliminar presupuesto");
      }
    } catch (e: any) {
      alert(e.message || "Error de conexión al eliminar presupuesto");
    } finally {
      cargandoEliminar = false;
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
      case "Aceptado":
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
      case "Cancelado":
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
  }
</script>

<!-- Cierre de desplegable al hacer clic fuera -->
<svelte:window onclick={(e) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.contenedor-menu-estado')) {
    menuEstadoAbiertoId = null;
  }
}} />

<div class="space-y-6">
  <!-- Cabecera de Sección -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Presupuestos</h1>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
          Comercial & Imprenta
        </span>
      </div>
      <p class="text-xs text-muted-foreground">
        Elabora cotizaciones, envíalas por correo, cámbialas de estado y genera automáticamente partes de taller con un clic al ser aceptadas.
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

  <!-- Banner Informativo / Notificación de Parte Generado en Taller -->
  {#if feedbackExitoParte}
    <div class="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <Sparkles class="w-5 h-5" />
        </div>
        <div>
          <div class="font-bold text-emerald-800 dark:text-emerald-300">
            {feedbackExitoParte.mensaje}
          </div>
          <div class="text-[11px] text-muted-foreground mt-0.5">
            El trabajo ya está registrado con sus partidas en la cola de producción de la imprenta.
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 self-end sm:self-center">
        {#if feedbackExitoParte.numParte}
          <a
            href={`/w/${workspace}/parte/${feedbackExitoParte.numParte}/print`}
            target="_blank"
            class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs inline-flex items-center gap-1.5 text-xs no-underline"
            title="Abrir hoja de ruta A3 de producción técnica"
          >
            <Printer class="w-3.5 h-3.5" />
            <span>Ficha Técnica A3</span>
          </a>
        {/if}
        <a
          href={`/w/${workspace}`}
          class="px-3 py-1.5 bg-card hover:bg-accent border border-border text-foreground rounded-xl font-semibold transition-all text-xs no-underline"
        >
          Cola de Taller
        </a>
        <button
          type="button"
          onclick={() => (feedbackExitoParte = null)}
          class="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  {/if}

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
        <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Aceptados / Taller</span>
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 class="w-4 h-4" />
        </div>
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold tracking-tight text-foreground">{totalAprobados}</span>
      </div>
      <p class="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Conectados con producción o facturación</p>
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
      {#each ["TODOS", "Borrador", "Enviado", "Aceptado", "Albaranado", "Facturado", "Rechazado", "Cancelado"] as st}
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
            <th class="p-3.5 text-center">Estado (Clic para cambiar)</th>
            <th class="p-3.5 text-right pr-5">Acciones Rápidas</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each presupuestosFiltrados as presupuesto}
            <tr class="hover:bg-accent/30 transition-colors">
              <!-- Código y vínculo con parte -->
              <td class="p-3.5 pl-5">
                <div class="flex flex-col">
                  <span class="font-bold text-foreground">{presupuesto.codigo}</span>
                  {#if presupuesto.numParteTrabajoVinculado}
                    <a
                      href={`/w/${workspace}/parte/${presupuesto.numParteTrabajoVinculado}/print`}
                      target="_blank"
                      class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1 hover:underline mt-0.5"
                      title="Ver Ficha Técnica A3 de taller"
                    >
                      <Printer class="w-2.5 h-2.5" />
                      <span>Parte #{presupuesto.numParteTrabajoVinculado}</span>
                    </a>
                  {/if}
                </div>
              </td>

              <!-- Cliente -->
              <td class="p-3.5">
                <div class="flex flex-col">
                  <span class="font-semibold text-foreground">{presupuesto.cliente}</span>
                  {#if presupuesto.clienteNif}
                    <span class="text-[10px] text-muted-foreground font-mono">{presupuesto.clienteNif}</span>
                  {/if}
                </div>
              </td>

              <!-- Fechas -->
              <td class="p-3.5">
                <div class="flex flex-col text-muted-foreground">
                  <span>{formatFechaES(presupuesto.fechaEmision)}</span>
                  {#if presupuesto.fechaValidez}
                    <span class="text-[10px] text-muted-foreground/70">Hasta {formatFechaES(presupuesto.fechaValidez)}</span>
                  {/if}
                </div>
              </td>

              <!-- Importes -->
              <td class="p-3.5 text-right font-medium text-muted-foreground">
                {formatEuro(presupuesto.baseImponible)}
              </td>
              <td class="p-3.5 text-right">
                <span class="font-bold text-foreground bg-muted/60 px-2 py-1 rounded-md border border-border">
                  {formatEuro(presupuesto.total)}
                </span>
              </td>

              <!-- Estado Interactivo con Selector -->
              <td class="p-3.5 text-center">
                <div class="relative inline-block contenedor-menu-estado">
                  <button
                    type="button"
                    onclick={(e) => {
                      e.stopPropagation();
                      menuEstadoAbiertoId = menuEstadoAbiertoId === presupuesto.id ? null : presupuesto.id;
                    }}
                    disabled={cargandoAccion === presupuesto.id}
                    class="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider transition-all cursor-pointer hover:shadow-xs {getBadgeClass(presupuesto.estado)} disabled:opacity-50"
                    title="Haz clic para cambiar el estado comercial de este presupuesto"
                  >
                    <span>{presupuesto.estado}</span>
                    <ChevronDown class="w-3 h-3 opacity-60" />
                  </button>

                  <!-- Desplegable flotante de cambio de estado -->
                  {#if menuEstadoAbiertoId === presupuesto.id}
                    <div
                      class="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-48 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl z-50 py-1.5 divide-y divide-border/60 text-left font-sans text-xs animate-in fade-in zoom-in-95"
                    >
                      <div class="px-3 py-1 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Cambiar Estado
                      </div>
                      <div class="py-1">
                        <!-- Borrador -->
                        <button
                          type="button"
                          onclick={() => cambiarEstado(presupuesto.id, 'Borrador')}
                          class="w-full text-left px-3 py-1.5 text-xs hover:bg-accent flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Borrador</span>
                        </button>

                        <!-- Enviado -->
                        <button
                          type="button"
                          onclick={() => abrirModalEnviar(presupuesto)}
                          class="w-full text-left px-3 py-1.5 text-xs hover:bg-accent flex items-center justify-between gap-2 cursor-pointer transition-colors"
                        >
                          <span class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Enviado</span>
                          </span>
                          <Mail class="w-3 h-3 text-muted-foreground" />
                        </button>

                        <!-- Aceptado (Genera parte en imprenta) -->
                        <button
                          type="button"
                          onclick={() => cambiarEstado(presupuesto.id, 'Aceptado')}
                          class="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors"
                        >
                          <span class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Aceptado</span>
                          </span>
                          <span class="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono">
                            ⚡ Taller
                          </span>
                        </button>

                        <!-- Rechazado -->
                        <button
                          type="button"
                          onclick={() => cambiarEstado(presupuesto.id, 'Rechazado')}
                          class="w-full text-left px-3 py-1.5 text-xs hover:bg-accent text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>Rechazado</span>
                        </button>

                        <!-- Cancelado -->
                        <button
                          type="button"
                          onclick={() => cambiarEstado(presupuesto.id, 'Cancelado')}
                          class="w-full text-left px-3 py-1.5 text-xs hover:bg-accent text-muted-foreground flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <span class="w-2 h-2 rounded-full bg-zinc-400"></span>
                          <span>Cancelado</span>
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>
              </td>

              <!-- Acciones Rápidas -->
              <td class="p-3.5 text-right pr-5">
                <div class="inline-flex items-center gap-1.5">
                  
                  <!-- Conexión directa a Taller si ya tiene Parte -->
                  {#if presupuesto.numParteTrabajoVinculado}
                    <a
                      href={`/w/${workspace}/parte/${presupuesto.numParteTrabajoVinculado}/print`}
                      target="_blank"
                      title="Ver e imprimir Ficha Técnica A3 de taller"
                      class="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all flex items-center gap-1 no-underline"
                    >
                      <Printer class="w-3 h-3" />
                      <span>Ficha A3</span>
                    </a>
                  {:else if presupuesto.estado === 'Borrador' || presupuesto.estado === 'Enviado'}
                    <!-- Botón directo para Aceptar y Generar Parte de Trabajo -->
                    <button
                      type="button"
                      title="Aceptar oferta y generar Parte de Trabajo automático en Taller"
                      disabled={cargandoAccion === presupuesto.id}
                      onclick={() => cambiarEstado(presupuesto.id, 'Aceptado')}
                      class="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles class="w-3 h-3" />
                      <span>Aceptar</span>
                    </button>
                  {/if}

                  <!-- Modificar en Escandallo (recalcular calidades y tiradas) -->
                  {#if presupuesto.estado !== 'Facturado'}
                    <a
                      href={`/w/${workspace}/escandallo?editarPresupuestoId=${presupuesto.id}`}
                      title="Abrir este presupuesto en el escandallo para recalcular calidades, cantidades e imposición"
                      class="px-2 py-1 text-[11px] font-semibold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center gap-1 no-underline cursor-pointer"
                    >
                      <Cpu class="w-3 h-3" />
                      <span>Escandallo</span>
                    </a>

                    <!-- Editar datos directamente -->
                    <button
                      type="button"
                      title="Editar partidas o datos de este presupuesto"
                      disabled={cargandoAccion === presupuesto.id}
                      onclick={() => abrirEdicionDirecta(presupuesto)}
                      class="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg border border-border/80 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Pencil class="w-3.5 h-3.5" />
                    </button>
                  {/if}

                  <!-- Botón Enviar por Correo -->
                  <button
                    type="button"
                    title="Enviar presupuesto por correo al cliente"
                    onclick={() => abrirModalEnviar(presupuesto)}
                    class="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 rounded-lg border border-border/80 transition-colors cursor-pointer"
                  >
                    <Mail class="w-3.5 h-3.5" />
                  </button>

                  <!-- Conversión a Albarán / Factura -->
                  {#if presupuesto.estado !== 'Albaranado' && presupuesto.estado !== 'Facturado'}
                    <button
                      type="button"
                      title="Convertir en Albarán de Entrega"
                      disabled={cargandoAccion === presupuesto.id}
                      onclick={() => convertirPresupuesto(presupuesto.id, 'albaran')}
                      class="px-2 py-1 text-[11px] font-semibold rounded-lg bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Truck class="w-3 h-3" />
                      <span>Albarán</span>
                    </button>
                    <button
                      type="button"
                      title="Convertir en Factura"
                      disabled={cargandoAccion === presupuesto.id}
                      onclick={() => convertirPresupuesto(presupuesto.id, 'factura')}
                      class="px-2 py-1 text-[11px] font-semibold rounded-lg bg-muted/60 hover:bg-emerald-500/10 hover:text-emerald-600 border border-border transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Receipt class="w-3 h-3" />
                      <span>Facturar</span>
                    </button>
                  {:else}
                    <span class="text-[10px] text-muted-foreground italic px-1">Procesado</span>
                  {/if}

                  <!-- Eliminar Presupuesto (legalmente factible si cancelado / borrador) -->
                  {#if presupuesto.estado !== 'Facturado'}
                    <button
                      type="button"
                      title="Eliminar presupuesto"
                      onclick={() => solicitarEliminar(presupuesto)}
                      class="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg border border-border/80 transition-colors cursor-pointer"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
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

<!-- Modal de Confirmación de Eliminación -->
{#if presupuestoAEliminar}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-xs font-sans animate-fade-in">
    <div class="bg-card text-card-foreground border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0">
          <Trash2 class="w-5 h-5" />
        </div>
        <div>
          <h3 class="text-base font-bold text-foreground">¿Eliminar presupuesto?</h3>
          <p class="text-xs text-muted-foreground">Esta acción eliminará la cotización de forma permanente.</p>
        </div>
      </div>

      <div class="p-3 bg-muted/40 rounded-xl border border-border/80 text-xs space-y-1">
        <div><strong>Presupuesto:</strong> {presupuestoAEliminar.codigo}</div>
        <div><strong>Cliente:</strong> {presupuestoAEliminar.cliente}</div>
        <div><strong>Total:</strong> {formatEuro(presupuestoAEliminar.total)}</div>
        <div><strong>Estado actual:</strong> <span class="uppercase font-bold">{presupuestoAEliminar.estado}</span></div>
        {#if presupuestoAEliminar.numParteTrabajoVinculado}
          <div class="text-[11px] text-amber-600 dark:text-amber-400 pt-1">
            * Nota: Este presupuesto tiene vinculado el Parte de Trabajo #{presupuestoAEliminar.numParteTrabajoVinculado}.
          </div>
        {/if}
      </div>

      <p class="text-[11px] text-muted-foreground leading-relaxed">
        Legalmente, los presupuestos comerciales y ofertas no constituyen facturas tributarias emitidas, por lo que es totalmente lícito eliminarlos si han sido cancelados o descartados.
      </p>

      <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
        <button
          type="button"
          onclick={() => (presupuestoAEliminar = null)}
          class="px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onclick={ejecutarEliminacion}
          disabled={cargandoEliminar}
          class="px-4 py-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-xl hover:bg-destructive/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {cargandoEliminar ? "Eliminando..." : "Sí, Eliminar Presupuesto"}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Modales -->
<NuevoPresupuestoModal
  abierto={modalNuevoAbierto}
  {workspace}
  datosIniciales={datosPresupuestoEditar || datosEscandallo}
  onClose={() => {
    modalNuevoAbierto = false;
    datosEscandallo = null;
    datosPresupuestoEditar = null;
  }}
  onCreated={recargarPresupuestos}
/>

<CalculadorEscandalloModal
  abierto={modalEscandalloAbierto}
  onClose={() => (modalEscandalloAbierto = false)}
  onAplicar={onAplicarEscandallo}
/>

<EnviarPresupuestoModal
  abierto={modalEnviarAbierto}
  presupuesto={presupuestoAEnviar}
  onClose={() => {
    modalEnviarAbierto = false;
    presupuestoAEnviar = null;
  }}
  onEnviado={recargarPresupuestos}
/>
