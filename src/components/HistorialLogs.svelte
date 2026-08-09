<script lang="ts">
  import { LockOpen, ArrowLeftRight, Trash2, PlusCircle, History } from 'lucide-svelte';

  export let logs: Array<{
    id: number;
    fecha: string;
    usuario: string;
    tipo: string;
    accion: string;
    detalles: string;
  }> = [];

  const tipoIcono: Record<string, any> = {
    "auth": LockOpen,
    "update": ArrowLeftRight,
    "delete": Trash2,
    "create": PlusCircle,
  };

  const tipoEstilos: Record<string, { bg: string; texto: string; borde: string }> = {
    "auth": { bg: "bg-blue-50 dark:bg-blue-500/10", texto: "text-blue-600 dark:text-blue-400", borde: "border-blue-100" },
    "update": { bg: "bg-amber-50 dark:bg-amber-500/10", texto: "text-amber-600 dark:text-amber-400", borde: "border-amber-100" },
    "delete": { bg: "bg-red-50 dark:bg-red-500/10", texto: "text-red-600 dark:text-red-400", borde: "border-red-100" },
    "create": { bg: "bg-emerald-50 dark:bg-emerald-500/10", texto: "text-emerald-600 dark:text-emerald-400", borde: "border-emerald-100" },
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

<div class="w-full bg-card text-card-foreground border border-border rounded-3xl p-6 shadow-xs flex flex-col h-full font-sans">

  <div class="mb-6">
    <h3 class="text-sm font-semibold text-foreground tracking-tight">Registro de Operaciones de Planta</h3>
    <p class="text-[11px] text-muted-foreground mt-0.5">Auditoría en tiempo real de accesos, modificaciones y borrados del sistema.</p>
  </div>

  <div class="relative border-l-2 border-border ml-4 pl-6 space-y-6 flex-1 overflow-y-auto pr-2 max-h-[60vh]">
    {#each logs as log (log.id)}
      {@const estilos = tipoEstilos[log.tipo] || tipoEstilos['update']}
      {@const Icono = tipoIcono[log.tipo] || ArrowLeftRight}

      <div class="relative animate-fade-in text-xs">
        <!-- Icono flotante en la línea del tiempo -->
        <span class="absolute -left-[35px] top-0.5 w-6 h-6 rounded-lg flex items-center justify-center border shadow-xs {estilos.bg} {estilos.texto} {estilos.borde}">
          <svelte:component this={Icono} size={12} strokeWidth={2} />
        </span>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wide border border-border">
              👤 {log.usuario}
            </span>
            <span class="font-semibold text-foreground">{log.accion}</span>
          </div>
          <span class="text-[10px] font-semibold text-muted-foreground tracking-tighter tabular-nums">
            {formatearFecha(log.fecha)}
          </span>
        </div>

        <p class="text-muted-foreground font-medium mt-1.5 pl-1 bg-muted/40 py-1 rounded">
          {log.detalles}
        </p>
      </div>
    {:else}
      <div class="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
        <History size={24} strokeWidth={1.5} class="opacity-30" />
        <span class="font-medium text-[11px]">No se registran operaciones recientes en este espacio de trabajo.</span>
      </div>
    {/each}
  </div>
</div>