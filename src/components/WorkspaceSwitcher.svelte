<script lang="ts">
  // Recibimos el espacio actual desde Astro para saber cuál iluminar por defecto
  export let workspaceActivo: string = "produccion";

  let desplegado = false;

  // Catálogo estático de espacios (Coincide con los IDs exactos de tu DB)
  const espacios = [
    { id: "produccion", nombre: "Producción Industrial", icono: "factory", color: "text-[#5C42FF]", bg: "bg-purple-50/70" },
    { id: "escolar", nombre: "Agendas Escolares", icono: "school", color: "text-sky-500", bg: "bg-sky-50/70" },
    { id: "profesional", nombre: "Agendas Profesionales", icono: "business_center", color: "text-emerald-500", bg: "bg-emerald-50/70" }
  ];

  // Encontramos los datos del espacio que está abierto actualmente
  $: espacioSeleccionado = espacios.find(e => e.id === workspaceActivo) || espacios[0];

  // Cerramos el panel de forma limpia si hacen clic fuera
  function conmutarMenu(event: MouseEvent) {
    event.stopPropagation();
    desplegado = !desplegado;
  }

  function cerrarMenu() {
    desplegado = false;
  }
</script>

<svelte:window on:click={cerrarMenu} />

<div class="relative w-full px-4 font-sans text-[#1A1D21]">
  
  <button
    type="button"
    on:click={conmutarMenu}
    class="w-full flex items-center justify-between p-2.5 bg-[#F1F3F6]/80 hover:bg-[#EAECEF] border border-[#E9EBF0] rounded-2xl transition-all cursor-pointer shadow-xs group select-none outline-none"
  >
    <div class="flex items-center gap-2.5 min-w-0">
      <div class="w-8 h-8 rounded-xl flex items-center justify-center border border-gray-200/40 bg-white shadow-xs">
        <span class="material-symbols-rounded text-base {espacioSeleccionado.color}" style="font-variation-settings: 'wght' 400;">
          {espacioSeleccionado.icono}
        </span>
      </div>
      
      <div class="flex flex-col text-left min-w-0">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Workspace</span>
        <span class="text-xs font-semibold text-[#1A1D21] mt-1 truncate">{espacioSeleccionado.nombre}</span>
      </div>
    </div>

    <span 
      class="material-symbols-rounded text-gray-400 text-lg transition-transform duration-200 pr-0.5
             {desplegado ? 'rotate-180 text-[#1A1D21]' : ''}"
      style="font-variation-settings: 'wght' 300;"
    >
      keyboard_arrow_down
    </span>
  </button>

  {#if desplegado}
    <div class="absolute top-[calc(100%+6px)] left-4 right-4 bg-white border border-[#E9EBF0] rounded-2xl shadow-xl p-1.5 space-y-0.5 z-50 animate-scale-up">
      <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2.5 py-1.5">Cambiar de espacio</p>
      
      {#each espacios as espacio}
        <a
          href="/w/{espacio.id}"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all group
                 {workspaceActivo === espacio.id 
                   ? 'bg-[#5C42FF]/5 text-[#5C42FF]' 
                   : 'text-[#1A1D21] hover:bg-gray-50'}"
        >
          <div class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                      {workspaceActivo === espacio.id ? 'bg-white shadow-xs' : 'bg-gray-50 group-hover:bg-white'}">
            <span class="material-symbols-rounded text-sm {espacio.color}" style="font-variation-settings: 'wght' 400;">
              {espacio.icono}
            </span>
          </div>

          <span class="flex-1 truncate">{espacio.nombre}</span>

          {#if workspaceActivo === espacio.id}
            <span class="material-symbols-rounded text-base text-[#5C42FF]" style="font-variation-settings: 'wght' 500;">
              check
            </span>
          {/if}
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  @keyframes scale-up { 
    from { opacity: 0; transform: scale(0.97) translateY(-4px); } 
    to { opacity: 1; transform: scale(1) translateY(0); } 
  }
  .animate-scale-up { animation: scale-up 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>