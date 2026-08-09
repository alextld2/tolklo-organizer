<script lang="ts">
  import { onMount } from 'svelte';
  import { Sun, Moon, Check, X } from 'lucide-svelte';

  let modalAbierto = false;
  let temaActual: 'claro' | 'oscuro' = 'claro';

  onMount(() => {
    const temaGuardado = localStorage.getItem('theme');
    const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (temaGuardado === 'dark' || (!temaGuardado && prefiereOscuro)) {
      temaActual = 'oscuro';
      document.documentElement.classList.add('dark');
    } else {
      temaActual = 'claro';
      document.documentElement.classList.remove('dark');
    }
  });

  function cambiarTema(nuevoTema: 'claro' | 'oscuro') {
    temaActual = nuevoTema;
    if (nuevoTema === 'oscuro') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    modalAbierto = false;
  }
</script>

<button
  type="button"
  on:click={() => modalAbierto = true}
  class="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-all outline-none cursor-pointer select-none"
>
  {#if temaActual === 'oscuro'}
    <Moon size={16} strokeWidth={2} class="text-primary" />
  {:else}
    <Sun size={16} strokeWidth={2} />
  {/if}
  <span class="flex-1 text-left">Modo de visualización</span>
</button>

{#if modalAbierto}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <button
      type="button"
      aria-label="Cerrar modal"
      class="absolute inset-0 bg-background/80 backdrop-blur-xs animate-fade-in border-none cursor-default"
      on:click={() => modalAbierto = false}
    ></button>

    <div class="bg-card text-card-foreground rounded-2xl border border-border shadow-2xl w-full max-w-sm z-10 p-6 space-y-5 animate-scale-up">
      <div class="flex justify-between items-center">
        <div class="space-y-0.5">
          <h3 class="text-sm font-semibold tracking-tight text-foreground">Personalizar vista</h3>
          <p class="text-[11px] font-medium text-muted-foreground">Elige el tema visual de Tolkie Organizer</p>
        </div>
        <button
          type="button"
          on:click={() => modalAbierto = false}
          class="w-7 h-7 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>

      <div class="space-y-2">
        <button
          type="button"
          on:click={() => cambiarTema('claro')}
          class="w-full flex items-center gap-3 p-3 rounded-xl border font-semibold text-xs transition-all cursor-pointer text-left
                 {temaActual === 'claro'
                   ? 'border-primary bg-primary/10 text-primary'
                   : 'border-border hover:bg-accent text-foreground'}"
        >
          <Sun size={15} strokeWidth={2} />
          <span class="flex-1">Modo Claro</span>
          {#if temaActual === 'claro'}
            <Check size={14} strokeWidth={2.5} class="text-primary" />
          {/if}
        </button>

        <button
          type="button"
          on:click={() => cambiarTema('oscuro')}
          class="w-full flex items-center gap-3 p-3 rounded-xl border font-semibold text-xs transition-all cursor-pointer text-left
                 {temaActual === 'oscuro'
                   ? 'border-primary bg-primary/10 text-primary'
                   : 'border-border hover:bg-accent text-foreground'}"
        >
          <Moon size={15} strokeWidth={2} />
          <span class="flex-1">Modo Oscuro</span>
          {#if temaActual === 'oscuro'}
            <Check size={14} strokeWidth={2.5} class="text-primary" />
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes scale-up { from { opacity: 0; transform: scale(0.97) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .animate-fade-in { animation: fade-in 0.18s ease-out forwards; }
  .animate-scale-up { animation: scale-up 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>