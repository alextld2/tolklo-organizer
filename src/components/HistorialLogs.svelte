<script lang="ts">
  export let logs: Array<{
    id: number;
    fecha: string;
    usuario: string;
    tipo: string;
    accion: string;
    detalles: string;
  }> = [];

  // Configuración de estilos e iconos según la gravedad del log
  const configuracionTipos = {
    "auth": { icono: "lock_open", bg: "bg-blue-50 dark:bg-blue-500/10", texto: "text-blue-600 dark:text-blue-400", borde: "border-blue-100" },
    "update": { icono: "swap_horiz", bg: "bg-amber-50 dark:bg-amber-500/10", texto: "text-amber-600 dark:text-amber-400", borde: "border-amber-100" },
    "delete": { icono: "delete_forever", bg: "bg-red-50 dark:bg-red-500/10", texto: "text-red-600 dark:text-red-400", borde: "border-red-100" },
    "create": { icono: "add_circle", bg: "bg-emerald-50 dark:bg-emerald-500/10", texto: "text-emerald-600 dark:text-emerald-400", borde: "border-emerald-100" }
  };

  function formatearFecha(fechaStr: string) {
    const d = new Date(fechaStr);
    return d.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }
</script>

<div class="w-full bg-white dark:bg-[#16191D] border border-[#E9EBF0] dark:border-[#232830] rounded-3xl p-6 shadow-xs flex flex-col h-full">
  
  <div class="mb-6">
    <h3 class="text-sm font-bold text-[#1A1D21] dark:text-[#EDF0F3] tracking-tight">Registro de Operaciones de Planta</h3>
    <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Auditoría en tiempo real de accesos, modificaciones y borrados del sistema.</p>
  </div>

  <div class="relative border-l-2 border-gray-100 dark:border-[#232830] ml-4 pl-6 space-y-6 flex-1 overflow-y-auto pr-2 max-h-[60vh]">
    {#each logs as log (log.id)}
      {@const config = configuracionTipos[log.tipo] || configuracionTipos['update']}
      
      <div class="relative animate-fade-in text-xs">
        
        <!-- Icono flotante en la línea del tiempo -->
        <span class="absolute -left-[35px] top-0.5 w-6 h-6 rounded-lg flex items-center justify-center border text-sm shadow-xs {config.bg} {config.texto} {config.borde}">
          <span class="material-symbols-rounded text-xs font-semibold">{config.icono}</span>
        </span>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div class="flex items-center gap-2">
            <!-- Nombre del culpable destacado -->
            <span class="font-black text-[#1A1D21] dark:text-[#EDF0F3] bg-gray-100 dark:bg-[#1E2228] px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wide">
              👤 {log.usuario}
            </span>
            <span class="font-bold text-gray-700 dark:text-gray-300">{log.accion}</span>
          </div>
          <!-- Timestamp exacto -->
          <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-tighter tabular-nums">
            {formatearFecha(log.fecha)}
          </span>
        </div>

        <!-- El desglose de qué ha pasado exactamente -->
        <p class="text-gray-400 dark:text-gray-500 font-medium mt-1.5 pl-1 bg-gray-50/40 dark:bg-transparent py-1 rounded">
          {log.detalles}
        </p>

      </div>
    {:else}
      <div class="py-12 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center gap-2">
        <span class="material-symbols-rounded text-2xl opacity-30 animate-pulse">history_toggle_off</span>
        <span class="font-medium text-[11px]">No se registran operaciones recientes en este espacio de trabajo.</span>
      </div>
    {/each}
  </div>
</div>