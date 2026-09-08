<script lang="ts">
  import { busquedaGlobal } from "../stores/busqueda";
  import DataTableTareas from "./DataTableTareas.svelte";
  import ModalEditarTarea from "./ModalEditarTarea.svelte";
  import { Toaster, toast } from "./ui/sonner";
  import {
    LISTA_COMERCIALES,
    LISTA_ESTADOS,
    LISTA_AREAS,
    ESTADOS_ESTILOS,
  } from "../utils/constants";
  import {
    Monitor, Layers, PenTool, Zap, Shirt, Palette,
    CheckCircle2, Printer, Package, Circle, Flame,
    Pencil, Trash2, MoreHorizontal, SearchX, X, Plus,
    AlertTriangle, FileText, Handshake,
  } from "lucide-svelte";
  import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
  } from "./ui/table";
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
  } from "./ui/dropdown-menu";
  import { Card, CardContent } from "./ui/card";

  // Mapa de iconos Lucide por estado
  const ICONOS_ESTADO_LUCIDE: Record<string, any> = {
    "Terminado": CheckCircle2,
    "Imprimiendo": Printer,
    "Manipulado": Package,
    "Urgente": Flame,
    "Por hacer": Circle,
  };

  // RECEPCIÓN DE DATOS RELACIONALES DESDE ASTRO DB
  export let tareas: Array<{
    numParte: number;
    cliente: string;
    descripcionGeneral: string;
    comercial: string | null;
    estado: string;
    area: string;
    fechaSalida: string;
    subcontrata: string | null;
    desgloses?: Array<{ descripcionProducto: string; cantidad: number | null }>;
  }> = [];

  const listaComerciales = LISTA_COMERCIALES;

  // 1. 🔥 MATRIZ DE 5 ESTADOS ACTUALIZADA
  const listaEstados = LISTA_ESTADOS;
  const listaAreas = LISTA_AREAS;

  const configuracionAreas = [
    { id: "Digital",  nombre: "Digital",               icon: Monitor,  colorBg: "bg-blue-50/60",    colorTexto: "text-blue-600",    colorBorde: "border-blue-100",    darkBg: "dark:bg-blue-500/10",    darkTexto: "dark:text-blue-400",    darkBorde: "dark:border-blue-500/20" },
    { id: "Offset",   nombre: "Offset",                icon: Layers,   colorBg: "bg-emerald-50/60", colorTexto: "text-emerald-600", colorBorde: "border-emerald-100", darkBg: "dark:bg-emerald-500/10", darkTexto: "dark:text-emerald-400", darkBorde: "dark:border-emerald-500/20" },
    { id: "Plotter",  nombre: "Plotter",               icon: PenTool, colorBg: "bg-amber-50/60",   colorTexto: "text-amber-600",   colorBorde: "border-amber-100",   darkBg: "dark:bg-amber-500/10",   darkTexto: "dark:text-amber-400",   darkBorde: "dark:border-amber-500/20" },
    { id: "OPX",      nombre: "OPX",                   icon: Zap,      colorBg: "bg-purple-50/60",  colorTexto: "text-purple-600",  colorBorde: "border-purple-100",  darkBg: "dark:bg-purple-500/10",  darkTexto: "dark:text-purple-400",  darkBorde: "dark:border-purple-500/20" },
    { id: "DTF",      nombre: "DTF",                   icon: Shirt,    colorBg: "bg-rose-50/60",    colorTexto: "text-rose-600",    colorBorde: "border-rose-100",    darkBg: "dark:bg-rose-500/10",    darkTexto: "dark:text-rose-400",    darkBorde: "dark:border-rose-500/20" },
    { id: "Mimaki",   nombre: "Mimaki",                icon: Palette,  colorBg: "bg-cyan-50/60",    colorTexto: "text-cyan-600",    colorBorde: "border-cyan-100",    darkBg: "dark:bg-cyan-500/10",    darkTexto: "dark:text-cyan-400",    darkBorde: "dark:border-cyan-500/20" },
  ];

  let modalEditarAbierto = false;
  let tareaEnEdicion: any = null;
  let modalEliminarAbierto = false;
  let numParteAEliminar: number | null = null;

  const coloresTextoEstado = ESTADOS_ESTILOS;



  // --- PERSISTENCIA: CAMBIO DE ESTADO RÁPIDO ---
  async function actualizarEstadoRapido(numParte: number | string, nuevoEstado: string) {
    const itemTarget = tareas.find((t) => String(t.numParte) === String(numParte));
    if (!itemTarget || itemTarget.estado === nuevoEstado)
      return;

    tareas = tareas.map((t) =>
      String(t.numParte) === String(numParte) ? { ...t, estado: nuevoEstado } : t,
    );

    try {
      const res = await fetch("/api/actualizar-tarea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemTarget.numParte, numParte: itemTarget.numParte, estado: nuevoEstado }),
      });
      if (res.ok) {
        toast.success(`Estado de #${numParte} cambiado a ${nuevoEstado}`);
      } else {
        toast.error("Error al actualizar el estado");
      }
    } catch (e) {
      console.error("Error guardando estado rápido en Astro DB", e);
      toast.error("Error de conexión al actualizar el estado");
    }
  }

  // --- MODAL DE EDICIÓN ---
  function abrirModalEditar(tarea: any) {
    tareaEnEdicion = { ...tarea };
    modalEditarAbierto = true;
  }

  function onTareaGuardada(tareaActualizada: any) {
    tareas = tareas.map((t) =>
      String(t.numParte) === String(tareaActualizada.numParte)
        ? { ...t, ...tareaActualizada }
        : t,
    );
    tareaEnEdicion = null;
  }

  // --- PERSISTENCIA: CONFIRMAR ELIMINACIÓN ---
  function abrirModalEliminar(numParte: number) {
    numParteAEliminar = numParte;
    modalEliminarAbierto = true;
  }

  async function confirmarEliminar() {
    const objetivoAEliminar = numParteAEliminar;
    tareas = tareas.filter((t) => t.numParte !== objetivoAEliminar);
    modalEliminarAbierto = false;
    numParteAEliminar = null;

    try {
      await fetch("/api/eliminar-tarea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numParte: objetivoAEliminar }),
      });
    } catch (e) {
      console.error("Error Hard-Delete en Astro DB", e);
    }
  }

  // EXPORTACIÓN PDF
  function exportarListadoAreaPDF(areaId: string) {
    const tareasPendientesArea = tareas.filter(
      (t) =>
        t.area.toLowerCase() === areaId.toLowerCase() &&
        t.estado !== "Terminado",
    );
    if (tareasPendientesArea.length === 0) {
      alert(`No hay tareas pendientes (sin terminar) asignadas a ${areaId}.`);
      return;
    }
    const tareasOrdenadas = [...tareasPendientesArea].sort(
      (a, b) =>
        new Date(a.fechaSalida).getTime() - new Date(b.fechaSalida).getTime(),
    );
    const ventanaPDF = window.open("", "_blank");
    if (!ventanaPDF) return;

    const fechaHoy = new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const horaHoy = new Date().toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const tablaFilas = tareasOrdenadas
      .map(
        (t) => `
      <tr>
        <td class="bold-text">#${t.numParte}</td>
        <td>
          <div class="bold-text">${(t.descripcionGeneral || "").toUpperCase()}</div>
          <div style="font-size:9px; margin-top:3px;">CLIENTE: ${t.cliente.toUpperCase()}</div>
        </td>
        <td class="bold-text">${t.fechaSalida}</td>
      </tr>
    `,
      )
      .join("");

    ventanaPDF.document.write(`
      <html>
        <head>
          <title>JOB_LIST_${areaId.toUpperCase()}</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
            @page { size: A4 vertical; margin: 20mm; }
            body { font-family: 'JetBrains Mono', monospace; color: #000000; background: #ffffff; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
            .header-block { width: 100%; border-bottom: 2px solid #000000; padding-bottom: 12px; margin-bottom: 25px; }
            .title-main { font-size: 15px; font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
            .icon-pdf { font-size: 22px; color: #000000; }
            table { width: 100%; border-collapse: collapse; }
            th { padding: 8px 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #000000; }
            td { padding: 12px 4px; border-bottom: 1px dashed #000000; vertical-align: top; }
            .bold-text { font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="header-block">
            <div class="title-main">
              <span class="material-symbols-outlined icon-pdf">print</span>
              <span>Aeroprint // Hoja de Producción: ${areaId.toUpperCase()}</span>
            </div>
            <div style="font-size:10px; margin-top:5px; padding-left: 30px;">EMISION: ${fechaHoy} - ${horaHoy} | TAREAS ACTIVAS</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:15%">Nº PARTE</th>
                <th style="width:65%">DESCRIPCION</th>
                <th style="width:20%">F. SALIDA</th>
              </tr>
            </thead>
            <tbody>
              ${tablaFilas}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 300); };
          <\/script>
        </body>
      </html>
    `);
    ventanaPDF.document.close();
  }

  // Analíticas globales
  $: totalTareasGlobal = tareas.length;
  $: completadas = tareas.filter((t) => t.estado === "Terminado").length;
  $: porcentajeEficiencia =
    totalTareasGlobal > 0
      ? Math.round((completadas / totalTareasGlobal) * 100)
      : 0;
  $: contarIncompletasPorArea = (areaId: string) =>
    tareas.filter(
      (t) =>
        t.area.toLowerCase() === areaId.toLowerCase() &&
        t.estado !== "Terminado",
    ).length;
  $: contarCompletadasPorArea = (areaId: string) =>
    tareas.filter(
      (t) =>
        t.area.toLowerCase() === areaId.toLowerCase() &&
        t.estado === "Terminado",
    ).length;
</script>

<div class="w-full font-sans flex flex-col h-full space-y-6">
  <div class="flex justify-between items-center flex-shrink-0">
    <div>
      <div class="flex items-center gap-3">
        <h1
          class="text-3xl font-semibold text-[#1A1D21] dark:text-[#EDF0F3] tracking-tight"
        >
          Listado de partes
        </h1>
        <span
          class="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-[#a4f4cf] text-[11px] font-semibold px-2.5 py-1 rounded-full"
        >
          {porcentajeEficiencia}% Eficiencia
        </span>
      </div>
      <p class="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">
        Gestiona y supervisa el flujo de órdenes de producción de Aeroprint.
      </p>
    </div>
  </div>

  <DataTableTareas
    {tareas}
    busquedaGlobal={$busquedaGlobal}
    {listaEstados}
    coloresTextoEstado={ESTADOS_ESTILOS}
    onEditarTarea={abrirModalEditar}
    onEliminarTarea={abrirModalEliminar}
    onActualizarEstadoRapido={actualizarEstadoRapido}
  />

  <!-- ─── Fila de Tarjetas de Área y Resumen ────────────────────────────────── -->
  <div class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3 w-full flex-shrink-0">
    {#each configuracionAreas as area}
      {@const activas = contarIncompletasPorArea(area.id)}
      {@const listas = contarCompletadasPorArea(area.id)}
      <Card class="w-full border border-[#E9EBF0] dark:border-[#232830] bg-white dark:bg-[#16191D] rounded-2xl shadow-none transition-all hover:border-gray-300 dark:hover:border-gray-600">
        <CardContent class="p-3.5 flex flex-col justify-between h-full gap-2">
          <!-- Nombre del área + badge activas -->
          <div class="flex items-center justify-between gap-1">
            <span class="text-[10px] font-semibold uppercase tracking-wider truncate {area.colorTexto} {area.darkTexto}">
              {area.nombre}
            </span>
            {#if activas > 0}
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md {area.colorBg} {area.colorTexto} {area.colorBorde} {area.darkBg} {area.darkTexto} {area.darkBorde} border">
                {activas}
              </span>
            {:else}
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800/40 text-gray-400 border border-transparent">
                0
              </span>
            {/if}
          </div>

          <!-- Métricas -->
          <div>
            <div class="flex items-baseline gap-1">
              <span class="text-xl font-semibold text-[#1A1D21] dark:text-[#EDF0F3] leading-none">
                {activas.toString().padStart(2, "0")}
              </span>
              <span class="text-[9px] font-medium text-gray-400 dark:text-gray-500">
                activas
              </span>
            </div>
            <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 block mt-0.5">
              ✓ {listas.toString().padStart(2, "0")} listas
            </span>
          </div>

          <!-- Botón PDF -->
          <button
            type="button"
            onclick={() => exportarListadoAreaPDF(area.id)}
            disabled={activas === 0}
            class="w-full inline-flex items-center justify-center gap-1 text-[10px] font-semibold py-1 rounded-lg border transition-all
              {activas > 0
                ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer'
                : 'border-transparent bg-gray-50/50 dark:bg-gray-800/20 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'}"
          >
            <FileText size={11} strokeWidth={2} />
            PDF
          </button>
        </CardContent>
      </Card>
    {/each}

    <!-- Tarjeta resumen rápido -->
    <Card class="w-full border border-[#E9EBF0] dark:border-[#232830] bg-gray-900 dark:bg-black rounded-2xl shadow-none">
      <CardContent class="p-3.5 flex flex-col justify-between h-full gap-2">
        <span class="text-[9px] font-semibold text-gray-400 dark:text-[#a4f4cf]/70 uppercase tracking-wider block">
          Resumen
        </span>
        <div class="space-y-1.5 text-[10px]">
          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-400 dark:text-gray-400">Listas</span>
            <span class="font-semibold text-white dark:text-[#a4f4cf]">
              {completadas.toString().padStart(2, "0")}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-400 dark:text-gray-400">Pendientes</span>
            <span class="font-semibold text-white">
              {(totalTareasGlobal - completadas).toString().padStart(2, "0")}
            </span>
          </div>
          <div class="flex items-center justify-between border-t border-white/10 pt-1">
            <span class="font-medium text-gray-400 dark:text-gray-400">Eficiencia</span>
            <span class="font-semibold text-white dark:text-[#a4f4cf]">{porcentajeEficiencia}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  <ModalEditarTarea
    bind:open={modalEditarAbierto}
    tarea={tareaEnEdicion}
    {listaComerciales}
    {listaAreas}
    {listaEstados}
    onGuardado={onTareaGuardada}
  />

  {#if modalEliminarAbierto}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar modal de confirmación"
        class="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onclick={() => (modalEliminarAbierto = false)}
      ></button>
      <div
        class="bg-white dark:bg-[#16191D] rounded-3xl border border-[#E9EBF0] dark:border-[#232830] shadow-2xl w-full max-w-md z-10 p-6 space-y-4 text-center text-[#1A1D21] dark:text-[#EDF0F3]"
      >
        <div
          class="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center mx-auto mb-1 border border-red-100/50 dark:border-red-500/20"
        >
          <AlertTriangle size={20} strokeWidth={2} />
        </div>
        <div>
          <h3
            class="text-lg font-semibold text-[#1A1D21] dark:text-[#EDF0F3] tracking-tight"
          >
            ¿Eliminar orden de trabajo?
          </h3>
          <p
            class="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1 leading-relaxed"
          >
            Estás a punto de eliminar la tarea número <span
              class="text-red-500 font-semibold">#{numParteAEliminar}</span
            >. Esta acción es permanente.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onclick={() => (modalEliminarAbierto = false)}
            class="w-full py-2.5 border border-gray-100 dark:border-[#232830] text-gray-400 dark:text-gray-500 font-semibold text-xs rounded-xl cursor-pointer"
            >Cancelar</button
          >
          <button
            type="button"
            onclick={confirmarEliminar}
            class="w-full py-2.5 bg-red-500 text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer"
            >Sí, Eliminar</button
          >
        </div>
      </div>
    </div>
  {/if}

  <Toaster position="bottom-right" richColors />
</div>

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
  .animate-scale-up {
    animation: scale-up 0.12s ease-out forwards;
  }
</style>
