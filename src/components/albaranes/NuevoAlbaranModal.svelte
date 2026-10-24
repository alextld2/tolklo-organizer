<script lang="ts">
  import { Plus, Trash2, X, Truck, PackageCheck, MapPin, User, FileText, Sparkles } from "lucide-svelte";

  let {
    abierto = false,
    workspace = "produccion",
    onClose,
    onCreated
  }: {
    abierto: boolean;
    workspace: string;
    onClose: () => void;
    onCreated: () => void;
  } = $props();

  let cliente = $state("");
  let clienteNif = $state("");
  let clienteDireccion = $state("");
  let serie = $state("ALB26");
  let fecha = $state(new Date().toISOString().split("T")[0]);
  let estado = $state("Pendiente");
  let transportista = $state("");
  let numeroSeguimiento = $state("");
  let bultos = $state(1);
  let personaContacto = $state("");
  let notas = $state("");

  let lineas = $state([
    { descripcion: "Material impreso y empaquetado", cantidad: 1, precioUnitario: 0 }
  ]);

  const CLAVE_BORRADOR_ALB = `tolklo_draft_albaran_${workspace}`;
  let borradorModal = $state<any>(null);

  // Al abrir el modal, comprobar si existe un borrador previo guardado
  $effect(() => {
    if (abierto) {
      try {
        const guardado = localStorage.getItem(CLAVE_BORRADOR_ALB);
        if (guardado) {
          const parsed = JSON.parse(guardado);
          if (parsed && (parsed.cliente || (parsed.lineas && parsed.lineas[0]?.descripcion))) {
            borradorModal = parsed;
          }
        }
      } catch {}
    } else {
      borradorModal = null;
    }
  });

  function restaurarBorradorModal() {
    if (!borradorModal) return;
    cliente = borradorModal.cliente || "";
    clienteNif = borradorModal.clienteNif || "";
    clienteDireccion = borradorModal.clienteDireccion || "";
    serie = borradorModal.serie || "ALB26";
    fecha = borradorModal.fecha || new Date().toISOString().split("T")[0];
    estado = borradorModal.estado || "Pendiente";
    transportista = borradorModal.transportista || "";
    numeroSeguimiento = borradorModal.numeroSeguimiento || "";
    bultos = borradorModal.bultos || 1;
    personaContacto = borradorModal.personaContacto || "";
    notas = borradorModal.notas || "";
    if (Array.isArray(borradorModal.lineas) && borradorModal.lineas.length > 0) {
      lineas = borradorModal.lineas;
    }
    borradorModal = null;
  }

  function descartarBorradorModal() {
    try {
      localStorage.removeItem(CLAVE_BORRADOR_ALB);
    } catch {}
    borradorModal = null;
  }

  function guardarBorradorAlbaran() {
    if (!cliente && !transportista && lineas.every(l => !l.descripcion)) return;
    try {
      localStorage.setItem(CLAVE_BORRADOR_ALB, JSON.stringify({
        timestamp: Date.now(),
        fechaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cliente,
        clienteNif,
        clienteDireccion,
        serie,
        fecha,
        estado,
        transportista,
        numeroSeguimiento,
        bultos,
        personaContacto,
        notas,
        lineas
      }));
    } catch {}
  }

  $effect(() => {
    if (abierto && (cliente || transportista || lineas.length > 0)) {
      guardarBorradorAlbaran();
    }
  });

  let guardando = $state(false);
  let errorMsg = $state("");

  function agregarLinea() {
    lineas = [
      ...lineas,
      { descripcion: "", cantidad: 1, precioUnitario: 0 }
    ];
  }

  function eliminarLinea(index: number) {
    if (lineas.length > 1) {
      lineas = lineas.filter((_, i) => i !== index);
    }
  }

  async function guardarAlbaran() {
    if (!cliente.trim()) {
      errorMsg = "Por favor, introduce el nombre del cliente destinatario.";
      return;
    }
    if (lineas.length === 0 || !lineas[0].descripcion.trim()) {
      errorMsg = "Añade al menos un concepto o bulto de entrega.";
      return;
    }

    errorMsg = "";
    guardando = true;

    try {
      const res = await fetch("/api/albaranes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace,
          serie,
          cliente,
          clienteNif,
          clienteDireccion,
          fecha,
          estado,
          transportista,
          numeroSeguimiento,
          bultos: Number(bultos) || 1,
          personaContacto,
          notas,
          lineas
        })
      });

      const data = await res.json();
      if (res.ok) {
        try {
          localStorage.removeItem(CLAVE_BORRADOR_ALB);
          borradorModal = null;
        } catch {}
        onCreated();
        onClose();
      } else {
        errorMsg = data.error || "Ocurrió un error al guardar el albarán.";
      }
    } catch (e: any) {
      guardarBorradorAlbaran();
      const esOffline = typeof navigator !== 'undefined' && (!navigator.onLine || e.name === 'TypeError' || String(e.message).includes('fetch'));
      if (esOffline) {
        errorMsg = "⚠️ Sin conexión a internet: El albarán y sus líneas están guardados en tu equipo. Espera a recuperar la conexión y vuelve a pulsar Guardar.";
      } else {
        errorMsg = e.message || "Error de conexión con el servidor.";
      }
    } finally {
      guardando = false;
    }
  }
</script>

{#if abierto}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-xs font-sans animate-fade-in">
    <div class="bg-card text-card-foreground border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative max-h-[92vh] overflow-y-auto">
      <!-- Cabecera modal -->
      <div class="flex items-center justify-between border-b border-border/80 pb-4 mb-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Truck class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-bold tracking-tight text-foreground">Nuevo Albarán de Entrega</h2>
            <p class="text-xs text-muted-foreground">Documento de transporte, expedición y entrega de mercancía</p>
          </div>
        </div>

        <button
          type="button"
          onclick={onClose}
          class="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors cursor-pointer"
          title="Cerrar ventana"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      {#if borradorModal}
        <div class="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
              <Sparkles class="w-4 h-4" />
            </div>
            <span>Hay un borrador guardado a las {borradorModal.fechaHora || 'recientemente'}{borradorModal.cliente ? ` para ${borradorModal.cliente}` : ''}.</span>
          </div>
          <div class="flex items-center gap-2 self-end sm:self-auto">
            <button type="button" class="underline hover:text-foreground text-xs cursor-pointer px-2 py-1" onclick={descartarBorradorModal}>Descartar</button>
            <button type="button" class="font-bold bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1 rounded-lg cursor-pointer" onclick={restaurarBorradorModal}>Recuperar</button>
          </div>
        </div>
      {/if}

      {#if errorMsg}
        <div class="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl font-medium">
          {errorMsg}
        </div>
      {/if}

      <div class="space-y-4">
        <!-- Serie y Fecha -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/60">
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Serie Albarán</span>
            <input
              type="text"
              bind:value={serie}
              class="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fecha Entrega</span>
            <input
              type="date"
              bind:value={fecha}
              class="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Estado</span>
            <select
              bind:value={estado}
              class="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En preparación">En preparación</option>
              <option value="En reparto">En reparto</option>
              <option value="Entregado">Entregado</option>
            </select>
          </label>
        </div>

        <!-- Cliente y Destino -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Destinatario / Cliente *</span>
            <input
              type="text"
              placeholder="Nombre de la empresa o particular"
              bind:value={cliente}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">NIF / CIF Receptor</span>
            <input
              type="text"
              placeholder="Ej. B12345678"
              bind:value={clienteNif}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </label>
        </div>

        <label class="block">
          <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dirección de Entrega</span>
          <input
            type="text"
            placeholder="Dirección completa del muelle o punto de descarga"
            bind:value={clienteDireccion}
            class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
          />
        </label>

        <!-- Logística y Transporte -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Transportista / Agencia</span>
            <input
              type="text"
              placeholder="Ej. Reparto Propio / Seur"
              bind:value={transportista}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nº Expedición / Tracking</span>
            <input
              type="text"
              placeholder="Código seguimiento"
              bind:value={numeroSeguimiento}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nº Bultos</span>
            <input
              type="number"
              min="1"
              bind:value={bultos}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </label>
        </div>

        <!-- Líneas de Expedición -->
        <div class="border border-border rounded-2xl p-4 bg-muted/20">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <PackageCheck class="w-3.5 h-3.5" />
              Contenido del Envío / Mercancía
            </h3>
            <button
              type="button"
              onclick={agregarLinea}
              class="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl border border-primary/20 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              Añadir bulto
            </button>
          </div>

          <div class="space-y-2">
            {#each lineas as linea, idx}
              <div class="grid grid-cols-12 gap-2 items-center bg-card p-2.5 rounded-xl border border-border">
                <div class="col-span-8">
                  <input
                    type="text"
                    placeholder="Descripción del material / producto"
                    bind:value={linea.descripcion}
                    class="w-full bg-transparent border-none text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div class="col-span-3">
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-muted-foreground">Uds:</span>
                    <input
                      type="number"
                      min="1"
                      bind:value={linea.cantidad}
                      class="w-full bg-muted/50 border border-border rounded-lg px-2 py-1 text-xs text-right font-medium text-foreground outline-none"
                    />
                  </div>
                </div>
                <div class="col-span-1 text-center">
                  <button
                    type="button"
                    onclick={() => eliminarLinea(idx)}
                    disabled={lineas.length <= 1}
                    class="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors p-1 cursor-pointer"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <label class="block">
          <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notas para el transportista o cliente</span>
          <textarea
            rows="2"
            placeholder="Instrucciones de descarga, horario de entrega, etc."
            bind:value={notas}
            class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary resize-none"
          ></textarea>
        </label>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
        <button
          type="button"
          onclick={onClose}
          class="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onclick={guardarAlbaran}
          disabled={guardando}
          class="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {guardando ? "Generando..." : "Emitir Albarán"}
        </button>
      </div>
    </div>
  </div>
{/if}
