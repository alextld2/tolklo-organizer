<script lang="ts">
  import { cn } from "../../../lib/utils";

  export let datos: number[] = Array(12).fill(0);
  export let meses: string[] = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  export let totales: number = 0;
  export let titulo: string = "Volumen Mensual de Partes";
  export let subtitulo: string =
    "Relación cuantitativa de partes registrados a lo largo del año.";

  $: maxVolumen = Math.max(...datos, 1);
  let hoveredIndex: number | null = null;
</script>

<div
  class="bg-card text-card-foreground border border-border rounded-3xl p-6 transition-colors shadow-xs w-full font-sans select-none mb-6"
>
  <!-- Cabecera -->
  <div
    class="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-6"
  >
    <div>
      <h3 class="text-sm font-semibold text-foreground tracking-tight">
        {titulo}
      </h3>
      <p class="text-[11px] text-muted-foreground mt-0.5">{subtitulo}</p>
    </div>
    <div
      class="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
    >
      <span
        class="w-2.5 h-2.5 rounded-full"
        style="background: hsl(var(--chart));"
      ></span>
      <span>{totales} Partes registrados</span>
    </div>
  </div>

  <!-- Bar Chart -->
  <div class="relative w-full">
    <div
      class="h-48 w-full flex items-end justify-between gap-1 sm:gap-2 px-1 border-b border-border"
    >
      {#each meses as mes, i}
        {@const volumenMes = datos[i] ?? 0}
        {@const alturaPct =
          maxVolumen > 0 ? (volumenMes / maxVolumen) * 100 : 0}
        {@const hovered = hoveredIndex === i}

        <div
          role="group"
          aria-label="{mes}: {volumenMes} partes"
          class="flex flex-col items-center flex-1 h-full justify-end cursor-pointer"
          on:mouseenter={() => (hoveredIndex = i)}
          on:mouseleave={() => (hoveredIndex = null)}
        >
          <!-- Cifra encima de barra -->
          <span
            class={cn(
              "text-[10px] font-bold tracking-tight mb-1 transition-all tabular-nums leading-none",
              volumenMes > 0
                ? hovered
                  ? "opacity-100 scale-110"
                  : "opacity-70"
                : "opacity-0",
            )}
            style={hovered && volumenMes > 0 ? "color: hsl(var(--chart));" : ""}
          >
            {volumenMes > 0 ? volumenMes : "·"}
          </span>

          <!-- Barra -->
          <div
            class="w-full flex items-end justify-center h-36 rounded-t-sm bg-muted/40 overflow-hidden"
          >
            {#if volumenMes > 0}
              <div
                style={`height: ${Math.max(alturaPct, 8)}%; background: hsl(var(--chart) / ${hovered ? 1 : 0.75});`}
                class="w-full rounded-t-md transition-all duration-300"
              ></div>
            {:else}
              <div class="w-full h-px bg-border/50"></div>
            {/if}
          </div>

          <!-- Etiqueta mes -->
          <span
            class={cn(
              "text-[9px] font-semibold uppercase tracking-tight mt-2 transition-colors",
              hovered ? "font-bold" : "text-muted-foreground",
            )}
            style={hovered ? "color: hsl(var(--chart));" : ""}
          >
            {mes}
          </span>
        </div>
      {/each}
    </div>
  </div>
</div>
