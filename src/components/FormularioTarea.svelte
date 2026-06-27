<script lang="ts">
  export let clientesExistentes: string[] = [];
  export let workspace: string = "produccion"; 

  let numParte: number | null = null;
  let cliente = "";
  let descripcionGeneral = "";
  let fechaSalida = "";
  let subcontrata = "";

  let inputFechaReferencia: HTMLInputElement;

  const listaComerciales = ["Marcos", "Alfonso", "Jesus", "Maria Jesús"];
  const listaDiseñadores = ["Yolanda", "Alex", "Iván"]; 
  const listaEstados = ["Pendiente", "En proceso", "Terminado"];
  const listaAreas = ["Digital", "Offset", "Plotter", "OPX", "DTF", "Mimaki"];

  let comercial = "";
  let diseñador = ""; 
  let estado = "Pendiente";
  let area = "Digital"; 

  let menuComercialAbierto = false;
  let menuDiseñadorAbierto = false; 
  let menuEstadoAbierto = false;
  let menuAreaAbierto = false;

  let desgloses = [{ descripcionProducto: "", cantidad: null }];

  let toast = { visible: false, tipo: 'success', titulo: '', mensaje: '' };
  let toastTimeout: NodeJS.Timeout;
  let guardando = false;
  let errorNumParte = false;

  function mostrarToast(titulo: string, mensaje: string, tipo: 'success' | 'error' = 'success') {
    clearTimeout(toastTimeout);
    toast = { visible: true, tipo, titulo, mensaje };
    toastTimeout = setTimeout(() => {
      toast.visible = false;
    }, 5000);
  }

  function cerrarToast() {
    toast.visible = false;
  }

  function añadirFilaDesglose() {
    desgloses = [...desgloses, { descripcionProducto: "", cantidad: null }];
  }

  function eliminarFilaDesglose(index: number) {
    if (desgloses.length > 1) {
      desgloses = desgloses.filter((_, i) => i !== index);
    }
  }

  function cerrarDesplegables() {
    menuComercialAbierto = false;
    menuDiseñadorAbierto = false;
    menuEstadoAbierto = false;
    menuAreaAbierto = false;
  }

  async function enviarFormulario() {
    if (!numParte || !cliente || !fechaSalida) {
      mostrarToast("Campos incompletos", "Por favor, rellena los campos obligatorios marcados con asterisco (*).", "error");
      return;
    }

    guardando = true;
    errorNumParte = false;

    try {
      const respuesta = await fetch('/api/nueva-tarea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numParte,
          workspaceId: workspace,
          cliente,
          descripcionGeneral,
          comercial,
          diseñador,
          fechaSalida,
          estado,
          area,
          subcontrata,
          desgloses: desgloses.filter(d => d.descripcionProducto !== "" && d.cantidad !== null)
        })
      });

      const datosAPI = await respuesta.json();

      if (respuesta.ok) {
        mostrarToast("¡Tarea creada con éxito!", "La orden de trabajo ha sido registrada correctamente en el sistema.", "success");
        numParte = null; cliente = ""; descripcionGeneral = ""; comercial = ""; diseñador = ""; fechaSalida = ""; area = "Digital"; estado = "Pendiente"; subcontrata = "";
        desgloses = [{ descripcionProducto: "", cantidad: null }];
      } else {
        if (datosAPI.code === 'DUPLICATE_NUM_PARTE') {
          errorNumParte = true;
        }
        mostrarToast("Error al crear la tarea", datosAPI.message || 'No se pudo guardar la tarea.', "error");
      }
    } catch (e) {
      mostrarToast("Error de conexión", "No se ha podido establecer comunicación con el servidor.", "error");
    } finally {
      guardando = false;
    }
  }
</script>

<div class="w-full font-sans flex flex-col h-full text-[#1A1D21] dark:text-[#EDF0F3]" on:click={cerrarDesplegables}>
  
  {#if toast.visible}
    <div 
      class="fixed bottom-8 left-1/2 md:left-[calc(50%+8rem)] -translate-x-1/2 z-[200] flex items-center gap-4 px-5 py-4 rounded-2xl shadow-xl border animate-slide-up-center w-[calc(100%-2rem)] sm:w-full max-w-xl backdrop-blur-md transition-all
        {toast.tipo === 'success' 
          ? 'bg-emerald-50/95 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/30' 
          : 'bg-red-50/95 dark:bg-red-950/30 border-red-200/60 dark:border-red-900/30'}"
    >
      <div 
        class="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs
          {toast.tipo === 'success' ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-red-500 dark:bg-red-600'}"
      >
        <span class="material-symbols-rounded text-xl" style="font-variation-settings: 'wght' 400;">
          {toast.tipo === 'success' ? 'check_circle' : 'error'}
        </span>
      </div>

      <div class="flex-1 min-w-0">
        <h4 
          class="text-sm font-bold tracking-tight leading-none
            {toast.tipo === 'success' ? 'text-emerald-900 dark:text-emerald-300' : 'text-red-900 dark:text-red-300'}"
        >
          {toast.titulo}
        </h4>
        <p 
          class="text-xs font-medium mt-1 leading-normal
            {toast.tipo === 'success' ? 'text-emerald-800/80 dark:text-emerald-400/80' : 'text-red-800/80 dark:text-red-400/80'}"
        >
          {toast.mensaje}
        </p>
      </div>

      <button 
        type="button" 
        on:click={cerrarToast}
        class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center outline-none"
      >
        <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">close</span>
      </button>
    </div>
  {/if}
  
  <div class="mb-6 flex-shrink-0">
    <h1 class="text-3xl font-semibold tracking-tight text-[#1A1D21] dark:text-[#EDF0F3]">Nueva Tarea</h1>
    <p class="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">Define los detalles del nuevo requerimiento de producción.</p>
  </div>

  <form on:submit|preventDefault={enviarFormulario} class="bg-white dark:bg-[#16191D] rounded-3xl p-8 border border-[#E9EBF0] dark:border-[#232830] shadow-xl shadow-gray-100/10 dark:shadow-none space-y-6 flex-1 overflow-y-auto transition-colors">
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Número de Parte *</label>
        <input 
          type="number" 
          placeholder="Ej: 1810" 
          bind:value={numParte}
          on:input={() => errorNumParte = false} 
          class="w-full bg-[#F1F3F6] dark:bg-[#1E2228] px-4 py-3.5 rounded-xl text-xs font-medium text-[#1A1D21] dark:text-[#EDF0F3] placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:ring-2 transition-all border
            {errorNumParte 
              ? 'border-red-400 dark:border-red-500/50 focus:ring-red-500/20' 
              : 'border-transparent focus:ring-[#5C42FF]/10'}" 
          required
        />
      </div>
      
      <div>
        <label class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Cliente *</label>
        <input 
          type="text" 
          placeholder="Nombre del cliente de Aeroprint" 
          bind:value={cliente}
          list="directorio-predictivo"
          class="w-full bg-[#F1F3F6] dark:bg-[#1E2228] px-4 py-3.5 rounded-xl text-xs font-medium text-[#1A1D21] dark:text-[#EDF0F3] placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:ring-2 focus:ring-[#5C42FF]/10 transition-all border border-transparent" 
          required
        />
        <datalist id="directorio-predictivo">
          {#each clientesExistentes as c}
            <option value={c}></option>
          {/each}
        </datalist>
      </div>
    </div>

    <div>
      <label class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Descripción General del Trabajo</label>
      <input 
        type="text" 
        placeholder="Ej: MINUTA REVOLUTION / SOBRES ACOLCHADOS" 
        bind:value={descripcionGeneral}
        class="w-full bg-[#F1F3F6] dark:bg-[#1E2228] px-4 py-3.5 rounded-xl text-xs font-medium text-[#1A1D21] dark:text-[#EDF0F3] placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:ring-2 focus:ring-[#5C42FF]/10 transition-all border border-transparent" 
      />
    </div>

    <div class="border-t border-gray-50 dark:border-[#232830] pt-5">
      <div class="flex justify-between items-center mb-3">
        <label class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Descripción de Líneas / Subtareas (Desglose 1:N)</label>
        <button 
          type="button" 
          on:click={añadirFilaDesglose} 
          class="text-xs font-medium text-[#5C42FF] dark:text-[#9A85FF] bg-purple-50 dark:bg-[#5C42FF]/10 hover:bg-purple-100 dark:hover:bg-[#5C42FF]/20 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span class="material-symbols-rounded text-base" style="font-variation-settings: 'wght' 300;">add</span> 
          <span>Añadir Fila de Producto</span>
        </button>
      </div>

      <div class="space-y-3">
        {#each desgloses as fila, index}
          <div class="flex items-center gap-4 bg-gray-50/40 dark:bg-[#1E2228]/20 p-3 rounded-2xl border border-gray-100/80 dark:border-[#232830]">
            <input 
              type="text" 
              placeholder="Ej: Carpetas con solapa mate, cajas de packaging..." 
              bind:value={fila.descripcionProducto}
              class="flex-1 bg-[#F1F3F6] dark:bg-[#1E2228] px-4 py-3.5 rounded-xl text-xs font-medium text-[#1A1D21] dark:text-[#EDF0F3] placeholder-gray-400 dark:placeholder-gray-600 outline-none border border-transparent focus:bg-gray-100/50 dark:focus:bg-gray-800/50 transition-colors"
            />
            <input 
              type="number" 
              placeholder="Cantidad" 
              bind:value={fila.cantidad}
              class="w-36 bg-[#F1F3F6] dark:bg-[#1E2228] px-4 py-3.5 rounded-xl text-xs font-medium text-[#1A1D21] dark:text-[#EDF0F3] placeholder-gray-400 dark:placeholder-gray-600 outline-none text-right border border-transparent focus:bg-gray-100/50 dark:focus:bg-gray-800/50 transition-colors"
            />
            {#if desgloses.length > 1}
              <button 
                type="button" 
                on:click={() => eliminarFilaDesglose(index)}
                class="text-gray-400 hover:text-red-500 p-2.5 transition-colors cursor-pointer bg-white dark:bg-[#16191D] hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-center"
              >
                <span class="material-symbols-rounded text-lg" style="font-variation-settings: 'wght' 300;">delete</span>
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-50 dark:border-[#232830] pt-5">
      
      <div class="relative">
        <label class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Comercial Asignado</label>
        <button 
          type="button"
          on:click|stopPropagation={() => { cerrarDesplegables(); menuComercialAbierto = !menuComercialAbierto; }}
          class="w-full bg-[#F1F3F6] dark:bg-[#1E2228] px-4 py-3.5 rounded-xl text-xs font-medium text-[#1A1D21] dark:text-[#EDF0F3] text-left flex justify-between items-center border border-transparent hover:bg-gray-100/70 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        >
          <div class="flex items-center gap-2">
            <span class="material-symbols-rounded text-lg text-purple-500" style="font-variation-settings: 'wght' 300;">assignment_ind</span>
            <span>{comercial || "Seleccionar comercial..."}</span>
          </div>
          <span class="material-symbols-rounded text-sm text-gray-400 transition-transform duration-200 {menuComercialAbierto ? 'rotate-180' : ''}">keyboard_arrow_down</span>
        </button>
        
        {#if menuComercialAbierto}
          <div class="absolute z-30 w-full bg-white dark:bg-[#16191D] mt-1.5 rounded-2xl shadow-2xl border border-gray-100 dark:border-[#232830] p-1.5 space-y-0.5 animate-scale-up">
            <button type="button" on:click={() => { comercial = ""; cerrarDesplegables(); }} class="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1E2228] transition-colors">Ninguno</button>
            {#each listaComerciales as c}
              <button 
                type="button" 
                on:click={() => { comercial = c; cerrarDesplegables(); }} 
                class="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors flex justify-between items-center cursor-pointer
                {comercial === c ? 'bg-[#5C42FF]/5 text-[#5C42FF] dark:text-[#9A85FF] font-semibold' : 'text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-50 dark:hover:bg-[#1E2228]'}"
              >
                <span>{c}</span>
                {#if comercial === c}<span class="material-symbols-rounded text-sm">check</span>{/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div>
        <label class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Fecha de Salida *</label>
        <div class="relative w-full">
          <input 
            type="date" 
            bind:this={inputFechaReferencia}
            on:click={() => inputFechaReferencia.showPicker()}
            bind:value={fechaSalida}
            class="w-full bg-[#F1F3F6] dark:bg-[#1E2228] px-4 py-3.5 rounded-xl text-xs font-medium text-[#1A1D21] dark:text-[#EDF0F3] outline-none cursor-pointer border border-transparent focus:ring-2 focus:ring-[#5C42FF]/10 transition-all text-left" 
            required
          />
        </div>
      </div>

      <div class="relative">
        <label class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Estado Inicial</label>
        <button 
          type="button"
          on:click|stopPropagation={() => { cerrarDesplegables(); menuEstadoAbierto = !menuEstadoAbierto; }}
          class="w-full bg-[#F1F3F6] dark:bg-[#1E2228] px-4 py-3.5 rounded-xl text-xs font-medium text-[#1A1D21] dark:text-[#EDF0F3] text-left flex justify-between items-center border border-transparent hover:bg-gray-100/70 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        >
          <div class="flex items-center gap-2">
            <span class="material-symbols-rounded text-lg {estado === 'Pendiente' ? 'text-amber-500' : estado === 'En proceso' ? 'text-blue-500' : 'text-emerald-500'}" style="font-variation-settings: 'wght' 300;">
              {estado === 'Pendiente' ? 'schedule' : estado === 'En proceso' ? 'motion_photos_on' : 'check_circle'}
            </span>
            <span>{estado}</span>
          </div>
          <span class="material-symbols-rounded text-sm text-gray-400 transition-transform duration-200 {menuEstadoAbierto ? 'rotate-180' : ''}">keyboard_arrow_down</span>
        </button>

        {#if menuEstadoAbierto}
          <div class="absolute z-30 w-full bg-white dark:bg-[#16191D] mt-1.5 rounded-2xl shadow-2xl border border-gray-100 dark:border-[#232830] p-1.5 space-y-0.5 animate-scale-up">
            {#each listaEstados as est}
              <button 
                type="button" 
                on:click={() => { estado = est; cerrarDesplegables(); }} 
                class="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors flex justify-between items-center cursor-pointer
                {estado === est ? 'bg-[#5C42FF]/5 text-[#5C42FF] dark:text-[#9A85FF] font-semibold' : 'text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-50 dark:hover:bg-[#1E2228]'}"
              >
                <div class="flex items-center gap-2">
                  <span class="material-symbols-rounded text-base {est === 'Pendiente' ? 'text-amber-500' : est === 'En proceso' ? 'text-blue-500' : 'text-emerald-500'}" style="font-variation-settings: 'wght' 300;">
                    {est === 'Pendiente' ? 'schedule' : est === 'En proceso' ? 'motion_photos_on' : 'check_circle'}
                  </span>
                  <span>{est}</span>
                </div>
                {#if estado === est}<span class="material-symbols-rounded text-sm">check</span>{/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-gray-50 dark:border-[#232830] pt-5">
      
      <div class="relative">
        <label class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Diseñador Asignado</label>
        <button 
          type="button"
          on:click|stopPropagation={() => { cerrarDesplegables(); menuDiseñadorAbierto = !menuDiseñadorAbierto; }}
          class="w-full bg-[#F1F3F6] dark:bg-[#1E2228] px-4 py-3.5 rounded-xl text-xs font-medium text-[#1A1D21] dark:text-[#EDF0F3] text-left flex justify-between items-center border border-transparent hover:bg-gray-100/70 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        >
          <div class="flex items-center gap-2">
            <span class="material-symbols-rounded text-lg text-emerald-500 dark:text-emerald-400" style="font-variation-settings: 'wght' 300;">palette</span>
            <span>{diseñador || "Seleccionar diseñador..."}</span>
          </div>
          <span class="material-symbols-rounded text-sm text-gray-400 transition-transform duration-200 {menuDiseñadorAbierto ? 'rotate-180' : ''}">keyboard_arrow_down</span>
        </button>
        
        {#if menuDiseñadorAbierto}
          <div class="absolute z-20 w-full bg-white dark:bg-[#16191D] mt-1.5 rounded-2xl shadow-2xl border border-gray-100 dark:border-[#232830] p-1.5 space-y-0.5 animate-scale-up">
            <button type="button" on:click={() => { diseñador = ""; cerrarDesplegables(); }} class="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1E2228] transition-colors">Ninguno</button>
            {#each listaDiseñadores as d}
              <button 
                type="button" 
                on:click={() => { diseñador = d; cerrarDesplegables(); }} 
                class="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors flex justify-between items-center cursor-pointer
                {diseñador === d ? 'bg-[#5C42FF]/5 text-[#5C42FF] dark:text-[#9A85FF] font-semibold' : 'text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-50 dark:hover:bg-[#1E2228]'}"
              >
                <span>{d}</span>
                {#if diseñador === d}<span class="material-symbols-rounded text-sm">check</span>{/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="relative">
        <label class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 block">Área de Producción</label>
        <button 
          type="button"
          on:click|stopPropagation={() => { cerrarDesplegables(); menuAreaAbierto = !menuAreaAbierto; }}
          class="w-full bg-[#F1F3F6] dark:bg-[#1E2228] px-4 py-3.5 rounded-xl text-xs font-medium text-[#1A1D21] dark:text-[#EDF0F3] text-left flex justify-between items-center border border-transparent hover:bg-gray-100/70 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        >
          <div class="flex items-center gap-2">
            <span class="material-symbols-rounded text-lg text-blue-500" style="font-variation-settings: 'wght' 300;">layers</span>
            <span>{area || "Seleccionar área..."}</span>
          </div>
          <span class="material-symbols-rounded text-sm text-gray-400 transition-transform duration-200 {menuAreaAbierto ? 'rotate-180' : ''}">keyboard_arrow_down</span>
        </button>

        {#if menuAreaAbierto}
          <div class="absolute z-20 w-full bg-white dark:bg-[#16191D] mt-1.5 rounded-2xl shadow-2xl border border-gray-100 dark:border-[#232830] p-1.5 space-y-0.5 animate-scale-up">
            {#each listaAreas as a}
              <button 
                type="button" 
                on:click={() => { area = a; cerrarDesplegables(); }} 
                class="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors flex justify-between items-center cursor-pointer
                {area === a ? 'bg-[#5C42FF] text-white shadow-xs font-semibold' : 'text-[#1A1D21] dark:text-[#EDF0F3] hover:bg-gray-50 dark:hover:bg-[#1E2228]'}"
              >
                <span>{a}</span>
                {#if area === a}<span class="material-symbols-rounded text-sm">check</span>{/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div>
        <label class="text-[10px] font-semibold text-orange-500 uppercase tracking-widest mb-2 flex items-center gap-1">
          <span class="material-symbols-rounded text-sm text-orange-500" style="font-variation-settings: 'wght' 300;">handshake</span>
          <span>Subcontratado a</span>
        </label>
        <input 
          type="text" 
          placeholder="Vacío si es propio de Aeroprint" 
          bind:value={subcontrata}
          class="w-full bg-[#F1F3F6] dark:bg-[#1E2228] px-4 py-3.5 rounded-xl text-xs font-medium text-[#1A1D21] dark:text-[#EDF0F3] placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:ring-2 focus:ring-orange-500/10 transition-all border border-transparent focus:border-orange-200/40" 
        />
      </div>
    </div>

    <div class="border-t border-gray-50 dark:border-[#232830] pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
      <p class="text-[11px] font-medium text-gray-400 dark:text-gray-500 text-center sm:text-left">
        Los campos con asterisco (*) son de obligado cumplimiento para almacenar el parte.
      </p>
      
      <div class="flex items-center gap-4 w-full sm:w-auto">
        <a href="/" class="flex-1 sm:flex-none text-center px-8 py-3.5 border border-dashed border-[#5C42FF]/40 dark:border-gray-700 text-[#5C42FF] dark:text-gray-400 font-medium text-xs rounded-full hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">Cancelar</a>
        <button 
          type="submit" 
          disabled={guardando}
          class="flex-1 sm:flex-none justify-center px-8 py-3.5 bg-[#5C42FF] text-white font-medium text-xs rounded-full shadow-lg shadow-[#5C42FF]/20 dark:shadow-none hover:scale-[1.01] active:scale-99 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Crear Tarea'} ➔
        </button>
      </div>
    </div>

  </form>
</div>

<style>
  @keyframes scale-up {
    from { opacity: 0; transform: scale(0.97) translateY(-4px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes slide-up-center {
    from { opacity: 0; transform: translate(-50%, 16px) scale(0.98); }
    to { opacity: 1; transform: translate(-50%, 0) scale(1); }
  }
  .animate-scale-up { animation: scale-up 0.15s ease-out forwards; }
  .animate-slide-up-center { animation: slide-up-center 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
</style>