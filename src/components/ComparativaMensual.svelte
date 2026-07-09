<script lang="ts">
  export let datos2026: number[] = []; // Datos año actual
  export let datos2025: number[] = []; // Datos año anterior
  
  const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  
  // Calculamos el valor máximo para escalar la gráfica
  $: maxVal = Math.max(...datos2026, ...datos2025, 10);
  
  // Altura máxima de la barra en px
  const altoGrafica = 200;
</script>

<div class="bg-white dark:bg-[#16191D] rounded-3xl p-8 border border-[#E9EBF0] dark:border-[#232830] shadow-xs w-full transition-colors duration-200">
  
  <div class="flex justify-between items-center mb-10">
    <div>
      <h3 class="text-lg font-semibold text-[#1A1D21] dark:text-[#EDF0F3] tracking-tight transition-colors">
        Comparativa de Volumen Mensual
      </h3>
      
      <div class="flex gap-4 mt-2">
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-[#5C42FF]"></div>
          <span class="text-[10px] font-medium text-gray-400 dark:text-[#7C8796] uppercase tracking-widest">
            Año actual (2026)
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-[#E9EBF0] dark:bg-[#232830] transition-colors"></div>
          <span class="text-[10px] font-medium text-gray-400 dark:text-[#7C8796] uppercase tracking-widest">
            Año anterior (2025)
          </span>
        </div>
      </div>
    </div>
    
    <div class="flex gap-2">
      <button class="p-2 hover:bg-gray-50 dark:hover:bg-[#1E2228] rounded-xl text-gray-400 dark:text-gray-500 transition-colors cursor-pointer">
        <span class="material-symbols-rounded text-xl" style="font-variation-settings: 'wght' 300;">tune</span>
      </button>
      <button class="p-2 hover:bg-gray-50 dark:hover:bg-[#1E2228] rounded-xl text-gray-400 dark:text-gray-500 transition-colors cursor-pointer">
        <span class="material-symbols-rounded text-xl" style="font-variation-settings: 'wght' 300;">more_vert</span>
      </button>
    </div>
  </div>

  <div class="flex items-end justify-between gap-2 h-[220px] w-full px-2">
    {#each meses as mes, i}
      <div class="flex flex-col items-center gap-4 flex-1">
        <div class="relative w-full flex justify-center items-end gap-1.5 h-[200px]">
          
          <div 
            class="w-2.5 bg-[#F1F3F6] dark:bg-[#1E2228] rounded-t-full transition-all duration-1000 ease-out" 
            style="height: {(datos2025[i] / maxVal) * altoGrafica}px"
          ></div>
          
          <div 
            class="w-2.5 bg-[#5C42FF] dark:bg-[#7A62FF] rounded-t-full transition-all duration-1000 ease-out delay-150" 
            style="height: {(datos2026[i] / maxVal) * altoGrafica}px"
          ></div>
          
        </div>
        <span class="text-[10px] font-semibold text-gray-300 dark:text-gray-600 tracking-tighter transition-colors">
          {mes}
        </span>
      </div>
    {/each}
  </div>
</div>