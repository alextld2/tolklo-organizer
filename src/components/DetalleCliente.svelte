<script lang="ts">
  import { fly, slide, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  // --- GESTIÓN DE DIRECCIONES (MODAL) ---
  let mostrarModalDirecciones = false;
  let direcciones: Array<{
    id: number;
    cliente: string;
    calle: string;
    ciudad: string;
    provincia: string | null;
    codigoPostal: string;
    pais: string;
    telefono: string | null;
    notas: string | null;
  }> = [];

  let cargandoDirecciones = false;
  let confirmandoEliminarId: number | null = null;
  let eliminandoDireccionId: number | null = null;
  let errorDirecciones = "";

  async function cargarDirecciones() {
    cargandoDirecciones = true;
    errorDirecciones = "";
    try {
      const resp = await fetch(
        `/api/direcciones/list?cliente=${encodeURIComponent(nombreCliente)}`,
      );
      if (resp.ok) {
        direcciones = await resp.json();
      } else {
        const errorData = await resp.json().catch(() => ({}));
        errorDirecciones = errorData.error || "Error al cargar direcciones.";
      }
    } catch (err: any) {
      errorDirecciones = err.message || "Error al cargar direcciones.";
    } finally {
      cargandoDirecciones = false;
    }
  }

  function abrirModalDirecciones() {
    mostrarModalDirecciones = true;
    confirmandoEliminarId = null;
    errorDirecciones = "";
    cargarDirecciones();
  }

  function cerrarModalDirecciones() {
    mostrarModalDirecciones = false;
  }

  async function eliminarDireccion(id: number) {
    eliminandoDireccionId = id;
    errorDirecciones = "";
    try {
      const resp = await fetch("/api/direcciones/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (resp.ok) {
        confirmandoEliminarId = null;
        await cargarDirecciones();
      } else {
        const errorData = await resp.json().catch(() => ({}));
        errorDirecciones = errorData.error || "Error al eliminar la dirección.";
      }
    } catch (err: any) {
      errorDirecciones = err.message || "Error al eliminar la dirección.";
    } finally {
      eliminandoDireccionId = null;
    }
  }

  // --- SUBMODAL DE NUEVA DIRECCIÓN ---
  let mostrarModalNuevaDireccion = false;
  let nuevaDireccion = {
    calle: "",
    ciudad: "",
    provincia: "",
    codigoPostal: "",
    pais: "España",
    telefono: "",
    notas: "",
  };
  let guardandoDireccion = false;
  let errorNuevaDireccion = "";

  function abrirModalNuevaDireccion() {
    mostrarModalNuevaDireccion = true;
    errorNuevaDireccion = "";
    nuevaDireccion = {
      calle: "",
      ciudad: "",
      provincia: "",
      codigoPostal: "",
      pais: "España",
      telefono: "",
      notas: "",
    };
  }

  function cerrarModalNuevaDireccion() {
    mostrarModalNuevaDireccion = false;
  }

  async function guardarNuevaDireccion() {
    if (
      !nuevaDireccion.calle ||
      !nuevaDireccion.ciudad ||
      !nuevaDireccion.codigoPostal
    ) {
      errorNuevaDireccion = "Por favor, completa los campos requeridos (*).";
      return;
    }

    guardandoDireccion = true;
    errorNuevaDireccion = "";
    try {
      const resp = await fetch(`/api/direcciones/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente: nombreCliente,
          ...nuevaDireccion,
        }),
      });

      if (resp.ok) {
        await cargarDirecciones();
        cerrarModalNuevaDireccion();
      } else {
        const errorData = await resp.json().catch(() => ({}));
        errorNuevaDireccion =
          errorData.error || "Error al guardar la dirección.";
      }
    } catch (err: any) {
      errorNuevaDireccion = err.message || "Error al guardar la dirección.";
    } finally {
      guardandoDireccion = false;
    }
  }

  export let nombreCliente: string = "";
  export let trabajos: Array<{
    numParte: number;
    descripcionGeneral: string;
    estado: string;
    fechaSalida: string;
    area: string;
    subcontrata: string | null;
  }> = [];

  // --- CONFIGURACIÓN DE AVATAR INTEGRADO EN MODO OSCURO ---
  const paletaAvatares = [
    {
      bg: "bg-sky-50 dark:bg-sky-500/10",
      texto: "text-sky-600 dark:text-sky-400",
      borde: "border-sky-100 dark:border-sky-500/20",
    },
    {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      texto: "text-emerald-600 dark:text-emerald-400",
      borde: "border-emerald-100 dark:border-emerald-500/20",
    },
    {
      bg: "bg-purple-50 dark:bg-purple-500/10",
      texto: "text-purple-600 dark:text-purple-400",
      borde: "border-purple-100 dark:border-purple-500/20",
    },
    {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      texto: "text-amber-600 dark:text-amber-400",
      borde: "border-amber-100 dark:border-amber-500/20",
    },
    {
      bg: "bg-rose-50 dark:bg-rose-500/10",
      texto: "text-rose-600 dark:text-rose-400",
      borde: "border-rose-100 dark:border-rose-500/20",
    },
    {
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
      texto: "text-indigo-600 dark:text-indigo-400",
      borde: "border-indigo-100 dark:border-indigo-500/20",
    },
  ];

  function obtenerColorAvatar(nombre: string) {
    const inicial = nombre.charAt(0).toUpperCase();
    const codigoChar = inicial.charCodeAt(0);
    return paletaAvatares[codigoChar % paletaAvatares.length];
  }

  $: avatar = obtenerColorAvatar(nombreCliente);

  // 🔥 NUEVO: Generamos un identificador único limpio para el Morphing (Ej: "ayuntamiento-de-granada")
  $: clienteSlug = nombreCliente.toLowerCase().replace(/[^a-z0-9]/g, "-");

  // --- LOGICA DE EXTRACCIÓN DE AÑOS DISPONIBLES ---
  const añosDisponibles = [
    ...new Set(
      trabajos.map((t) => {
        return t.fechaSalida
          ? new Date(t.fechaSalida).getFullYear().toString()
          : new Date().getFullYear().toString();
      }),
    ),
  ].sort((a, b) => b.localeCompare(a));

  let añoSeleccionado =
    añosDisponibles[0] || new Date().getFullYear().toString();

  // --- MÉTRICAS UNIFICADAS ---
  $: totalTrabajosHistoricos = trabajos.length;

  $: trabajosFiltradosPorAño = trabajos
    .filter((t) => {
      const añoTrabajo = t.fechaSalida
        ? new Date(t.fechaSalida).getFullYear().toString()
        : "";
      return añoTrabajo === añoSeleccionado;
    })
    .sort((a, b) => b.numParte - a.numParte);

  const coloresEstado = {
    Terminado:
      "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10",
    Imprimiendo:
      "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10",
    Manipulado:
      "text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10",
    Urgente:
      "text-red-600 dark:text-red-400 bg-red-50/60 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 font-semibold animate-pulse",
    "Por hacer":
      "text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1E2228] border border-gray-100 dark:border-[#232830]",
  };

  const iconosEstado = {
    Terminado: "check_circle",
    Imprimiendo: "print",
    Manipulado: "precision_manufacturing",
    Urgente: "bolt",
    "Por hacer": "radio_button_unchecked",
  };

  let parteExpandido: number | null = null;

  function toggleAcordeon(numParte: number) {
    parteExpandido = parteExpandido === numParte ? null : numParte;
  }
</script>

<div
  class="w-full font-sans flex flex-col h-full space-y-5 text-[#1A1D21] dark:text-[#EDF0F3]"
>
  <!-- BOTÓN DE RETORNO AL PANEL GLOBAL -->
  <div class="flex items-center flex-shrink-0 pt-1">
    <button
      type="button"
      on:click={() => window.history.back()}
      class="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#5C42FF] dark:hover:text-[#9A85FF] transition-colors group cursor-pointer bg-transparent border-none p-0 outline-none"
    >
      <span
        class="material-symbols-rounded text-lg transition-transform group-hover:-translate-x-1"
        style="font-variation-settings: 'wght' 300;">arrow_back</span
      >
      <span>Volver al listado de clientes</span>
    </button>
  </div>

  <!-- CABECERA DE SOCIO COMERCIAL (CON SU ETIQUETA DE TRANSICIÓN ASIGNADA) -->
  <div
    style="view-transition-name: cliente-card-{clienteSlug};"
    class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#16191D] border border-[#E9EBF0] dark:border-[#232830] p-6 rounded-3xl shadow-xs flex-shrink-0 transition-colors"
  >
    <div class="flex items-center gap-4">
      <!-- 🔥 ICONO MÓRFICO: Le asignamos su propia firma visual única -->
      <div
        style="view-transition-name: cliente-avatar-{clienteSlug};"
        class="w-14 h-14 rounded-2xl flex items-center justify-center font-semibold text-xl border shadow-xs flex-shrink-0 transition-transform hover:scale-105 duration-300 {avatar.bg} {avatar.texto} {avatar.borde}"
      >
        {nombreCliente.charAt(0).toUpperCase()}
      </div>

      <div class="space-y-0.5">
        <div class="flex items-center gap-2.5 flex-wrap">
          <h1
            class="text-2xl font-semibold text-[#1A1D21] dark:text-[#EDF0F3] tracking-tight"
          >
            {nombreCliente}
          </h1>
          <span
            class="bg-[#5C42FF]/5 dark:bg-[#5C42FF]/10 text-[#5C42FF] dark:text-[#9A85FF] text-[9px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded-md border border-[#5C42FF]/10 dark:border-transparent"
          >
            Aeroprint Partner
          </span>
        </div>
        <p class="text-xs font-medium text-gray-400 dark:text-gray-500">
          Cuenta corporativa activa en el gestor de asignaciones de taller.
        </p>
      </div>
    </div>

    <div class="flex items-center gap-3 sm:self-center">
      <!-- BOTÓN DE DIRECCIONES -->
      <button
        type="button"
        on:click={abrirModalDirecciones}
        class="bg-[#5C42FF]/5 hover:bg-[#4a32e0]/10 text-[#5C42FF] px-5 py-3 rounded-2xl font-semibold text-xs tracking-wide transition-all flex items-center gap-2 cursor-pointer border-none h-[49px] self-center"
      >
        <span class="material-symbols-rounded text-base">location_on</span>
        <span>Direcciones</span>
      </button>

      <!-- MÉTRICA TOTAL TIPOGRÁFICA -->
      <div
        class="bg-gray-50 dark:bg-[#1E2228] border border-gray-100 dark:border-[#232830] px-6 py-2.5 rounded-2xl flex flex-col items-end justify-center transition-colors h-[49px] justify-center"
      >
        <span
          class="text-[9px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none"
          >Historial Total</span
        >
        <span
          class="text-base font-semibold mt-1 text-[#1A1D21] dark:text-[#EDF0F3] tabular-nums leading-none"
        >
          {totalTrabajosHistoricos.toString().padStart(2, "0")} órdenes
        </span>
      </div>
    </div>
  </div>

  <!-- SELECTOR DE ANNALES CRONOLÓGICOS -->
  {#if añosDisponibles.length > 1}
    <div
      class="flex items-center gap-1.5 flex-shrink-0 bg-gray-100/60 dark:bg-[#16191D] p-1 rounded-xl w-fit border border-[#E9EBF0] dark:border-[#232830] transition-colors"
    >
      {#each añosDisponibles as año}
        <button
          type="button"
          on:click={() => (añoSeleccionado = año)}
          class="px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer relative overflow-hidden duration-200
                 {añoSeleccionado === año
            ? 'bg-[#5C42FF] text-white shadow-md shadow-[#5C42FF]/20 scale-102'
            : 'text-gray-400 dark:text-gray-500 hover:text-[#1A1D21] dark:hover:text-[#EDF0F3] hover:bg-gray-200/40 dark:hover:bg-[#1E2228]'}"
        >
          {año}
        </button>
      {/each}
    </div>
  {/if}

  <!-- CONTENEDOR DE TARJETAS CON EFECTO ACORDEÓN -->
  <div class="space-y-2.5 flex-1 overflow-y-auto pr-1 min-h-0 pb-6">
    {#each trabajosFiltradosPorAño as trabajo, i (trabajo.numParte)}
      {@const estaAbierto = parteExpandido === trabajo.numParte}

      <div
        in:fly={{ y: 16, duration: 300, delay: i * 40, easing: cubicOut }}
        class="bg-white dark:bg-[#16191D] border rounded-2xl flex flex-col shadow-xs overflow-hidden transition-all duration-300 transform walk-in-animation
          {estaAbierto
          ? 'border-[#5C42FF] ring-1 ring-[#5C42FF]/20 dark:ring-[#9A85FF]/20 bg-gray-50/20 dark:bg-[#1E2228]/10'
          : 'border-[#E9EBF0] dark:border-[#232830]'}
          {trabajo.estado === 'Terminado' && !estaAbierto
          ? 'opacity-55 dark:opacity-45 bg-gray-50/40 dark:bg-[#111418]/20'
          : 'hover:shadow-md hover:-translate-y-0.5 dark:hover:bg-[#1E2228]/20'}"
      >
        <!-- FILA DE INFORMACIÓN PRINCIPAL -->
        <div
          on:click={() => toggleAcordeon(trabajo.numParte)}
          class="p-4 flex items-center gap-4 cursor-pointer select-none w-full"
        >
          <div
            class="w-[90px] flex-shrink-0 text-xs font-semibold text-[#1A1D21] dark:text-[#EDF0F3] whitespace-nowrap tabular-nums"
          >
            #{trabajo.numParte}
          </div>

          <div class="flex-1 min-w-0 flex flex-col">
            <span
              class="text-xs font-semibold text-[#1A1D21] dark:text-[#EDF0F3] truncate transition-colors {trabajo.estado ===
              'Terminado'
                ? 'line-through text-gray-400 dark:text-gray-600 font-medium'
                : ''}"
            >
              {trabajo.descripcionGeneral || "Sin especificaciones añadidas"}
            </span>
            {#if trabajo.subcontrata}
              <span
                class="text-[10px] font-semibold text-orange-500 dark:text-orange-400/90 mt-0.5 flex items-center gap-1 truncate"
              >
                <span class="material-symbols-rounded text-xs flex-shrink-0"
                  >handshake</span
                >
                Externalizado: {trabajo.subcontrata}
              </span>
            {/if}
          </div>

          <div class="w-[120px] flex-shrink-0 whitespace-nowrap">
            <span
              class="text-[9px] font-semibold px-2.5 py-1 rounded-lg uppercase tracking-wider bg-gray-50 dark:bg-[#1E2228] text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-transparent"
            >
              {trabajo.area}
            </span>
          </div>

          <div
            class="w-[130px] flex-shrink-0 text-xs font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap tabular-nums"
          >
            {trabajo.fechaSalida}
          </div>

          <div
            class="w-[140px] flex-shrink-0 flex items-center justify-end gap-2 text-[10px] font-semibold tracking-wide whitespace-nowrap"
          >
            <span
              class="px-2.5 py-1 rounded-xl flex items-center gap-1.5 uppercase tracking-wider {coloresEstado[
                trabajo.estado
              ] || coloresEstado['Por hacer']}"
            >
              <span
                class="material-symbols-rounded text-sm flex-shrink-0 {trabajo.estado ===
                'Imprimiendo'
                  ? 'animate-pulse'
                  : ''}"
              >
                {iconosEstado[trabajo.estado] || iconosEstado["Por hacer"]}
              </span>
              <span>{trabajo.estado}</span>
            </span>
            <a
              href={`/w/imprenta/parte/${trabajo.numParte}/print`}
              target="_blank"
              class="boton-pdf">Ver PDF</a
            >
          </div>

          <div class="w-[30px] flex-shrink-0 flex items-center justify-end">
            <span
              class="material-symbols-rounded text-base text-gray-400 transition-transform duration-300 {estaAbierto
                ? 'rotate-180 text-[#5C42FF] dark:text-[#9A85FF]'
                : ''}"
              style="font-variation-settings: 'wght' 300;"
            >
              keyboard_arrow_down
            </span>
          </div>
        </div>

        <!-- ACORDEÓN DESPLEGABLE -->
        {#if estaAbierto}
          <div
            transition:slide={{ duration: 250, easing: cubicOut }}
            class="w-full border-t border-gray-100 dark:border-[#232830] bg-gray-50/50 dark:bg-[#121418]/30 px-6 py-5 flex flex-col space-y-4"
          >
            <div
              class="flex items-center justify-between border-b border-dashed border-gray-200 dark:border-gray-800 pb-2.5"
            >
              <span
                class="text-[10px] font-semibold text-[#5C42FF] dark:text-[#9A85FF] uppercase tracking-widest flex items-center gap-1.5"
              >
                <span class="material-symbols-rounded text-xs">analytics</span> Ficha
                Técnica de Producción (Vista Previa)
              </span>
              <span
                class="text-[10px] text-gray-400 dark:text-gray-500 font-medium"
                >Asignación ID: {trabajo.numParte}</span
              >
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div class="flex flex-col space-y-2">
                <span
                  class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
                  >Equipo de Diseño y Gestión</span
                >
                <div
                  class="bg-white dark:bg-[#16191D] border border-gray-100 dark:border-[#232830] p-3 rounded-xl space-y-1.5"
                >
                  <p class="text-gray-500 dark:text-gray-400 font-medium">
                    💼 Comercial: <span
                      class="text-[#1A1D21] dark:text-[#EDF0F3] font-semibold"
                      >Por definir</span
                    >
                  </p>
                  <p class="text-gray-500 dark:text-gray-400 font-medium">
                    🎨 Diseñador: <span
                      class="text-[#1A1D21] dark:text-[#EDF0F3] font-semibold"
                      >Por definir</span
                    >
                  </p>
                </div>
              </div>

              <div class="flex flex-col space-y-2">
                <span
                  class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
                  >Logística de Taller</span
                >
                <div
                  class="bg-white dark:bg-[#16191D] border border-gray-100 dark:border-[#232830] p-3 rounded-xl space-y-1.5"
                >
                  <p class="text-gray-500 dark:text-gray-400 font-medium">
                    ⚙️ Maquinaria principal: <span
                      class="text-[#1A1D21] dark:text-[#EDF0F3] font-semibold uppercase"
                      >{trabajo.area}</span
                    >
                  </p>
                  <p class="text-gray-500 dark:text-gray-400 font-medium">
                    📦 Subcontratación: <span
                      class="text-[#1A1D21] dark:text-[#EDF0F3] font-semibold"
                      >{trabajo.subcontrata || "No requiere externa"}</span
                    >
                  </p>
                </div>
              </div>

              <div class="flex flex-col space-y-2">
                <span
                  class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
                  >Observaciones Generales</span
                >
                <div
                  class="bg-white dark:bg-[#16191D] border border-gray-100 dark:border-[#232830] p-3 rounded-xl h-full min-h-[62px]"
                >
                  <p
                    class="text-gray-400 dark:text-gray-500 italic font-medium leading-relaxed"
                  >
                    Pendiente de anexar las especificaciones y el desglose de
                    productos desde el formulario máster de planta...
                  </p>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div
        in:fly={{ y: 10, duration: 250 }}
        class="bg-white dark:bg-[#16191D] border border-dashed border-gray-200 dark:border-gray-800 rounded-3xl p-16 text-center text-gray-400 dark:text-gray-600 shadow-xs transition-colors"
      >
        <span
          class="material-symbols-rounded text-3xl block mb-1.5 opacity-30"
          style="font-variation-settings: 'wght' 100;">folder_open</span
        >
        <p class="text-xs font-semibold">
          No se registran órdenes de producción en el año {añoSeleccionado}.
        </p>
      </div>
    {/each}
  </div>
</div>

<!-- MODAL DIRECCIONES -->
{#if mostrarModalDirecciones}
  <!-- Overlay principal -->
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 bg-[#000]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
    on:click|self={cerrarModalDirecciones}
  >
    <div
      transition:fly={{ y: 20, duration: 250, easing: cubicOut }}
      class="bg-white dark:bg-[#16191D] border border-[#E9EBF0] dark:border-[#232830] w-full max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] text-[#1A1D21] dark:text-[#EDF0F3]"
      on:click|stopPropagation
    >
      <!-- Cabecera del Modal -->
      <div
        class="px-6 py-5 border-b border-gray-100 dark:border-[#232830] flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <span
            class="material-symbols-rounded text-xl text-[#5C42FF] dark:text-[#9A85FF]"
            >location_on</span
          >
          <h2 class="text-base font-semibold">
            Direcciones de {nombreCliente}
          </h2>
        </div>
        <button
          type="button"
          on:click={cerrarModalDirecciones}
          class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 bg-transparent border-none cursor-pointer p-1 rounded-lg flex items-center justify-center focus:outline-none"
        >
          <span class="material-symbols-rounded text-lg">close</span>
        </button>
      </div>

      <!-- Contenido / Lista de Direcciones -->
      <div class="px-6 py-5 overflow-y-auto flex-1 space-y-3">
        {#if errorDirecciones}
          <div
            class="p-3 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-xl font-semibold text-xs transition-colors"
          >
            {errorDirecciones}
          </div>
        {/if}
        {#if cargandoDirecciones}
          <div
            class="flex flex-col items-center justify-center py-10 space-y-2 text-gray-400"
          >
            <span class="material-symbols-rounded animate-spin text-2xl"
              >progress_activity</span
            >
            <span class="text-xs">Cargando direcciones...</span>
          </div>
        {:else if direcciones.length === 0}
          <div
            class="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400"
          >
            <span class="material-symbols-rounded text-3xl opacity-30 mb-2"
              >map</span
            >
            <p class="text-xs font-semibold">
              No hay direcciones registradas para este cliente.
            </p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each direcciones as dir}
              <div
                class="p-4 bg-gray-50 dark:bg-[#1E2228] border border-gray-100 dark:border-[#232830] rounded-2xl flex flex-col space-y-1 hover:border-[#5C42FF]/30 transition-colors"
              >
                <div class="flex justify-between items-start gap-2">
                  <span
                    class="font-semibold text-xs text-[#1A1D21] dark:text-[#EDF0F3] flex-1 break-words"
                    >{dir.calle}</span
                  >
                  <div class="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      class="bg-[#5C42FF]/10 text-[#5C42FF] dark:text-[#9A85FF] text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    >
                      {dir.pais}
                    </span>
                    {#if confirmandoEliminarId === dir.id}
                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          on:click={() => eliminarDireccion(dir.id)}
                          disabled={eliminandoDireccionId === dir.id}
                          class="bg-red-500 hover:bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer border-none flex items-center gap-0.5 shadow-xs"
                          title="Confirmar"
                        >
                          {#if eliminandoDireccionId === dir.id}
                            <span
                              class="material-symbols-rounded text-[10px] animate-spin"
                              >progress_activity</span
                            >
                          {:else}
                            <span>Sí</span>
                          {/if}
                        </button>
                        <button
                          type="button"
                          on:click={() => (confirmandoEliminarId = null)}
                          class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded cursor-pointer border-none"
                          title="Cancelar"
                        >
                          No
                        </button>
                      </div>
                    {:else}
                      <button
                        type="button"
                        on:click={() => (confirmandoEliminarId = dir.id)}
                        class="text-gray-400 hover:text-red-500 dark:hover:text-red-400 bg-transparent border-none cursor-pointer p-0.5 rounded flex items-center justify-center transition-colors focus:outline-none"
                        title="Eliminar dirección"
                      >
                        <span class="material-symbols-rounded text-sm"
                          >delete</span
                        >
                      </button>
                    {/if}
                  </div>
                </div>
                <span class="text-[11px] text-gray-500 dark:text-gray-400"
                  >{dir.codigoPostal}
                  {dir.ciudad}{dir.provincia ? `, ${dir.provincia}` : ""}</span
                >
                {#if dir.telefono}
                  <span
                    class="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5 pt-1"
                  >
                    <span class="material-symbols-rounded text-[13px]"
                      >phone</span
                    >
                    {dir.telefono}
                  </span>
                {/if}
                {#if dir.notas}
                  <span
                    class="text-[10px] text-orange-500/90 dark:text-orange-400/90 mt-1 bg-orange-500/5 px-2.5 py-1.5 rounded-xl border border-orange-500/10"
                  >
                    <strong>Instrucciones:</strong>
                    {dir.notas}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Pie del Modal -->
      <div
        class="px-6 py-4 bg-gray-50 dark:bg-[#121418]/50 border-t border-gray-100 dark:border-[#232830] flex items-center justify-between gap-3"
      >
        <button
          type="button"
          on:click={cerrarModalDirecciones}
          class="px-4 py-2.5 rounded-xl border border-[#E9EBF0] dark:border-[#232830] font-semibold text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer bg-transparent"
        >
          Cerrar
        </button>
        <button
          type="button"
          on:click={abrirModalNuevaDireccion}
          class="bg-[#5C42FF] hover:bg-[#4a32e0] text-white px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center gap-1.5 cursor-pointer border-none"
        >
          <span class="material-symbols-rounded text-sm">add_location_alt</span>
          <span>Añadir Dirección</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL CREACIÓN DIRECCIÓN -->
{#if mostrarModalNuevaDireccion}
  <!-- Overlay Nueva Dirección con Z-Index mayor para que flote encima -->
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 bg-[#000]/70 backdrop-blur-xs flex items-center justify-center z-55 p-4"
    on:click|self={cerrarModalNuevaDireccion}
  >
    <div
      transition:fly={{ y: 20, duration: 250, easing: cubicOut }}
      class="bg-white dark:bg-[#16191D] border border-[#E9EBF0] dark:border-[#232830] w-full max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#1A1D21] dark:text-[#EDF0F3]"
      on:click|stopPropagation
    >
      <!-- Cabecera -->
      <div
        class="px-6 py-5 border-b border-gray-100 dark:border-[#232830] flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <span
            class="material-symbols-rounded text-xl text-[#5C42FF] dark:text-[#9A85FF]"
            >add_location_alt</span
          >
          <h2 class="text-base font-semibold">Nueva Dirección de Entrega</h2>
        </div>
        <button
          type="button"
          on:click={cerrarModalNuevaDireccion}
          class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 bg-transparent border-none cursor-pointer p-1 rounded-lg flex items-center justify-center focus:outline-none"
        >
          <span class="material-symbols-rounded text-lg">close</span>
        </button>
      </div>

      <!-- Formulario -->
      <div
        class="px-6 py-5 overflow-y-auto flex-1 space-y-4 font-semibold text-xs"
      >
        {#if errorNuevaDireccion}
          <div
            class="p-3 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-xl font-medium"
          >
            {errorNuevaDireccion}
          </div>
        {/if}

        <div class="flex flex-col space-y-1.5">
          <label class="text-gray-400 uppercase tracking-wider text-[10px]"
            >Calle y Número *</label
          >
          <input
            type="text"
            bind:value={nuevaDireccion.calle}
            placeholder="Ej: Calle Gran Vía, 12, 3º Izq"
            class="p-3 bg-gray-50 dark:bg-[#1E2228] border border-gray-200 dark:border-[#232830] rounded-xl outline-none text-xs font-semibold focus:border-[#5C42FF] dark:focus:border-[#9A85FF] transition-colors"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col space-y-1.5">
            <label class="text-gray-400 uppercase tracking-wider text-[10px]"
              >Ciudad *</label
            >
            <input
              type="text"
              bind:value={nuevaDireccion.ciudad}
              placeholder="Ej: Granada"
              class="p-3 bg-gray-50 dark:bg-[#1E2228] border border-gray-200 dark:border-[#232830] rounded-xl outline-none text-xs font-semibold focus:border-[#5C42FF] dark:focus:border-[#9A85FF] transition-colors"
            />
          </div>
          <div class="flex flex-col space-y-1.5">
            <label class="text-gray-400 uppercase tracking-wider text-[10px]"
              >Provincia</label
            >
            <input
              type="text"
              bind:value={nuevaDireccion.provincia}
              placeholder="Ej: Granada"
              class="p-3 bg-gray-50 dark:bg-[#1E2228] border border-gray-200 dark:border-[#232830] rounded-xl outline-none text-xs font-semibold focus:border-[#5C42FF] dark:focus:border-[#9A85FF] transition-colors"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col space-y-1.5">
            <label class="text-gray-400 uppercase tracking-wider text-[10px]"
              >Código Postal *</label
            >
            <input
              type="text"
              bind:value={nuevaDireccion.codigoPostal}
              placeholder="Ej: 18001"
              class="p-3 bg-gray-50 dark:bg-[#1E2228] border border-gray-200 dark:border-[#232830] rounded-xl outline-none text-xs font-semibold focus:border-[#5C42FF] dark:focus:border-[#9A85FF] transition-colors"
            />
          </div>
          <div class="flex flex-col space-y-1.5">
            <label class="text-gray-400 uppercase tracking-wider text-[10px]"
              >País</label
            >
            <input
              type="text"
              bind:value={nuevaDireccion.pais}
              placeholder="Ej: España"
              class="p-3 bg-gray-50 dark:bg-[#1E2228] border border-gray-200 dark:border-[#232830] rounded-xl outline-none text-xs font-semibold focus:border-[#5C42FF] dark:focus:border-[#9A85FF] transition-colors"
            />
          </div>
        </div>

        <div class="flex flex-col space-y-1.5">
          <label class="text-gray-400 uppercase tracking-wider text-[10px]"
            >Teléfono de Contacto</label
          >
          <input
            type="text"
            bind:value={nuevaDireccion.telefono}
            placeholder="Ej: +34 600 000 000"
            class="p-3 bg-gray-50 dark:bg-[#1E2228] border border-gray-200 dark:border-[#232830] rounded-xl outline-none text-xs font-semibold focus:border-[#5C42FF] dark:focus:border-[#9A85FF] transition-colors"
          />
        </div>

        <div class="flex flex-col space-y-1.5">
          <label class="text-gray-400 uppercase tracking-wider text-[10px]"
            >Notas o Instrucciones</label
          >
          <textarea
            bind:value={nuevaDireccion.notas}
            placeholder="Ej: Entregar por las mañanas..."
            rows="3"
            class="p-3 bg-gray-50 dark:bg-[#1E2228] border border-gray-200 dark:border-[#232830] rounded-xl outline-none text-xs font-semibold focus:border-[#5C42FF] dark:focus:border-[#9A85FF] transition-colors resize-none"
          ></textarea>
        </div>
      </div>

      <!-- Pie -->
      <div
        class="px-6 py-4 bg-gray-50 dark:bg-[#121418]/50 border-t border-gray-100 dark:border-[#232830] flex items-center justify-end gap-3"
      >
        <button
          type="button"
          on:click={cerrarModalNuevaDireccion}
          class="px-4 py-2.5 rounded-xl border border-[#E9EBF0] dark:border-[#232830] font-semibold text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer bg-transparent"
        >
          Cancelar
        </button>
        <button
          type="button"
          on:click={guardarNuevaDireccion}
          disabled={guardandoDireccion}
          class="bg-[#5C42FF] hover:bg-[#4a32e0] text-white px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wide shadow-md transition-all flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-50"
        >
          {#if guardandoDireccion}
            <span class="material-symbols-rounded animate-spin text-sm"
              >progress_activity</span
            >
            <span>Guardando...</span>
          {:else}
            <span>Guardar Dirección</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .walk-in-animation {
    will-change: transform, opacity;
  }
  .z-55 {
    z-index: 55;
  }
</style>
