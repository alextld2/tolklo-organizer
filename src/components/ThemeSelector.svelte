<script lang="ts">
  import { onMount } from 'svelte';

  let modalAbierto = false;
  let temaActual = 'claro'; // 'claro' | 'oscuro'

  onMount(() => {
    // Al montar, verificamos si ya existe una preferencia guardada en el navegador
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
  class="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-gray-400 hover:text-[#1A1D21] hover:bg-gray-50/80 rounded-xl transition-all outline-none cursor-pointer select-none"
>
  <span class="material-symbols-rounded text-lg transition-colors {temaActual === 'oscuro' ? 'text-[#5C42FF]' : ''}" style="font-variation-settings: 'wght' 300;">
    {temaActual === 'oscuro' ? 'toggle_on' : 'toggle_off'}
  </span>
  <span class="flex-1 text-left">Modo de visualización</span>
</button>

{#if modalAbierto}
  <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-900/20 backdrop-blur-xs animate-fade-in" on:click={() => modalAbierto = false}></div>
    
    <div class="bg-white rounded-[28px] border border-[#E9EBF0] shadow-2xl w-full max-w-sm z-10 p-6 space-y-5 animate-scale-up text-[#1A1D21]">
      
      <div class="flex justify-between items-center">
        <div class="space-y-0.5">
          <h3 class="text-sm font-semibold tracking-tight text-[#1A1D21]">Personalizar vista</h3>
          <p class="text-[11px] font-medium text-gray-400">Elige el tema visual de Tolkie Organizer</p>
        </div>
        <button on:click={() => modalAbierto = false} class="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 flex items-center justify-center cursor-pointer transition-colors">
          <span class="material-symbols-rounded text-base">close</span>
        </button>
      </div>

      <div class="space-y-2">
        <button
          type="button"
          on:click={() => cambiarTema('claro')}
          class="w-full flex items-center gap-3 p-3 rounded-xl border font-semibold text-xs transition-all cursor-pointer text-left
                 {temaActual === 'claro' 
                   ? 'border-[#5C42FF] bg-[#5C42FF]/5 text-[#5C42FF]' 
                   : 'border-[#E9EBF0] hover:bg-gray-50 text-[#1A1D21]'}"
        >
          <span class="material-symbols-rounded text-base" style="font-variation-settings: 'wght' 300;">light_mode</span>
          <span class="flex-1">Modo Claro</span>
          {#if temaActual === 'claro'}
            <span class="material-symbols-rounded text-base text-[#5C42FF]">check</span>
          {/if}
        </button>

        <button
          type="button"
          on:click={() => cambiarTema('oscuro')}
          class="w-full flex items-center gap-3 p-3 rounded-xl border font-semibold text-xs transition-all cursor-pointer text-left
                 {temaActual === 'oscuro' 
                   ? 'border-[#5C42FF] bg-[#5C42FF]/5 text-[#5C42FF]' 
                   : 'border-[#E9EBF0] hover:bg-gray-50 text-[#1A1D21]'}"
        >
          <span class="material-symbols-rounded text-base" style="font-variation-settings: 'wght' 300;">dark_mode</span>
          <span class="flex-1">Modo Oscuro</span>
          {#if temaActual === 'oscuro'}
            <span class="material-symbols-rounded text-base text-[#5C42FF]">check</span>
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