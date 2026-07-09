<script lang="ts">
  import { busquedaGlobal } from '../stores/busqueda';
</script>

<div class="relative w-full max-w-md font-sans">
  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm select-none pointer-events-none">
    🔍
  </span>
  
  <input 
    type="text" 
    placeholder="Buscar por parte, cliente o trabajo..." 
    bind:value={$busquedaGlobal}
    class="w-full bg-[#F1F3F6] dark:bg-[#1E2228] border-none pl-11 pr-4 py-2.5 rounded-2xl text-xs font-semibold text-[#1A1D21] dark:text-[#EDF0F3] outline-none focus:ring-2 focus:ring-[#5C42FF]/20 dark:focus:ring-[#7A62FF]/30 transition-all placeholder-gray-400/80 dark:placeholder-gray-500"
  />
</div>