<script lang="ts">
  import { Plus, Trash2, X, Receipt, ShieldCheck, FileText, AlertCircle, Sparkles } from "lucide-svelte";
  import { formatEuro, validarNifCifNie } from "$lib/fiscal-utils";

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

  let serie = $state("F26");
  let tipoFactura = $state("F1");
  let cliente = $state("");
  let clienteNif = $state("");
  let clienteDireccion = $state("");
  let clienteCodigoPostal = $state("");
  let clienteCiudad = $state("");
  let clienteEmail = $state("");
  let fechaExpedicion = $state(new Date().toISOString().split("T")[0]);
  
  const vencimiento30 = new Date();
  vencimiento30.setDate(vencimiento30.getDate() + 30);
  let fechaVencimiento = $state(vencimiento30.toISOString().split("T")[0]);

  let formaPago = $state("Transferencia bancaria");
  let notas = $state("");
  let tipoIvaDefecto = $state(21);
  let tipoRetencionIrpf = $state(0);
  let emitirDirectamente = $state(true);

  let lineas = $state([
    { descripcion: "Servicios de impresión gráfica y artes finales", cantidad: 1, precioUnitario: 150, descuentoPorcentaje: 0, tipoIva: 21 }
  ]);

  const CLAVE_BORRADOR_FAC = `tolklo_draft_factura_${workspace}`;
  let borradorModal = $state<any>(null);

  // Al abrir el modal, comprobar si existe un borrador previo guardado
  $effect(() => {
    if (abierto) {
      try {
        const guardado = localStorage.getItem(CLAVE_BORRADOR_FAC);
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
    clienteCodigoPostal = borradorModal.clienteCodigoPostal || "";
    clienteCiudad = borradorModal.clienteCiudad || "";
    clienteEmail = borradorModal.clienteEmail || "";
    serie = borradorModal.serie || "F26";
    tipoFactura = borradorModal.tipoFactura || "F1";
    fechaExpedicion = borradorModal.fechaExpedicion || new Date().toISOString().split("T")[0];
    fechaVencimiento = borradorModal.fechaVencimiento || "";
    formaPago = borradorModal.formaPago || "Transferencia bancaria";
    notas = borradorModal.notas || "";
    tipoIvaDefecto = borradorModal.tipoIvaDefecto ?? 21;
    tipoRetencionIrpf = borradorModal.tipoRetencionIrpf ?? 0;
    emitirDirectamente = borradorModal.emitirDirectamente ?? true;
    if (Array.isArray(borradorModal.lineas) && borradorModal.lineas.length > 0) {
      lineas = borradorModal.lineas;
    }
    borradorModal = null;
  }

  function descartarBorradorModal() {
    try {
      localStorage.removeItem(CLAVE_BORRADOR_FAC);
    } catch {}
    borradorModal = null;
  }

  function guardarBorradorFactura() {
    if (!cliente && !clienteNif && lineas.every(l => !l.descripcion)) return;
    try {
      localStorage.setItem(CLAVE_BORRADOR_FAC, JSON.stringify({
        timestamp: Date.now(),
        fechaHora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cliente,
        clienteNif,
        clienteDireccion,
        clienteCodigoPostal,
        clienteCiudad,
        clienteEmail,
        serie,
        tipoFactura,
        fechaExpedicion,
        fechaVencimiento,
        formaPago,
        notas,
        tipoIvaDefecto,
        tipoRetencionIrpf,
        emitirDirectamente,
        lineas
      }));
    } catch {}
  }

  $effect(() => {
    if (abierto && (cliente || clienteNif || lineas.length > 0)) {
      guardarBorradorFactura();
    }
  });

  let guardando = $state(false);
  let errorMsg = $state("");

  function agregarLinea() {
    lineas = [
      ...lineas,
      { descripcion: "", cantidad: 1, precioUnitario: 0, descuentoPorcentaje: 0, tipoIva: tipoIvaDefecto }
    ];
  }

  function eliminarLinea(index: number) {
    if (lineas.length > 1) {
      lineas = lineas.filter((_, i) => i !== index);
    }
  }

  let baseImponible = $derived(
    lineas.reduce((acc, l) => {
      const cant = Number(l.cantidad) || 0;
      const precio = Number(l.precioUnitario) || 0;
      const desc = Number(l.descuentoPorcentaje) || 0;
      return acc + (cant * precio * (1 - desc / 100));
    }, 0)
  );

  let cuotaIva = $derived(Math.round((baseImponible * tipoIvaDefecto / 100) * 100) / 100);
  let cuotaIrpf = $derived(tipoRetencionIrpf > 0 ? Math.round((baseImponible * tipoRetencionIrpf / 100) * 100) / 100 : 0);
  let totalFactura = $derived(Math.round((baseImponible + cuotaIva - cuotaIrpf) * 100) / 100);

  async function guardarFactura() {
    if (!cliente.trim()) {
      errorMsg = "Introduce el nombre del cliente.";
      return;
    }
    if (!clienteNif.trim()) {
      errorMsg = "El NIF/CIF del cliente es obligatorio según la normativa de facturación española.";
      return;
    }
    if (lineas.length === 0 || !lineas[0].descripcion.trim()) {
      errorMsg = "Añade al menos una línea de producto o servicio.";
      return;
    }

    errorMsg = "";
    guardando = true;

    try {
      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace,
          serie,
          tipoFactura,
          cliente,
          clienteNif,
          clienteDireccion,
          clienteCodigoPostal,
          clienteCiudad,
          clienteEmail,
          fechaExpedicion,
          fechaVencimiento,
          formaPago,
          notas,
          tipoIvaDefecto,
          tipoRetencionIrpf,
          emitirDirectamente,
          lineas
        })
      });

      const data = await res.json();
      if (res.ok) {
        try {
          localStorage.removeItem(CLAVE_BORRADOR_FAC);
          borradorModal = null;
        } catch {}
        onCreated();
        onClose();
      } else {
        errorMsg = data.error || "Ocurrió un error al generar la factura.";
      }
    } catch (e: any) {
      guardarBorradorFactura();
      const esOffline = typeof navigator !== 'undefined' && (!navigator.onLine || e.name === 'TypeError' || String(e.message).includes('fetch'));
      if (esOffline) {
        errorMsg = "⚠️ Sin conexión a internet: Los datos de tu factura y sus líneas están guardados a salvo en este navegador. Espera a recuperar la conexión y vuelve a pulsar Guardar.";
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
    <div class="bg-card text-card-foreground border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl relative max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-border/80 pb-4 mb-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Receipt class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-bold tracking-tight text-foreground">Nueva Factura</h2>
            <p class="text-xs text-muted-foreground">Emisión de factura reglamentaria con encadenamiento criptográfico Veri*factu</p>
          </div>
        </div>

        <button
          type="button"
          onclick={onClose}
          class="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors cursor-pointer"
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

      <div class="space-y-4 text-xs">
        <!-- Parámetros fiscales de la factura -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/60">
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Serie</span>
            <input
              type="text"
              bind:value={serie}
              class="w-full bg-card border border-border rounded-lg px-3 py-1.5 font-medium text-foreground outline-none focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tipo Factura</span>
            <select
              bind:value={tipoFactura}
              class="w-full bg-card border border-border rounded-lg px-3 py-1.5 font-medium text-foreground outline-none focus:border-primary"
            >
              <option value="F1">F1 - Factura Ordinaria</option>
              <option value="F2">F2 - Factura Simplificada</option>
              <option value="R1">R1 - Rectificativa (Art. 80 LIVA)</option>
              <option value="R4">R4 - Otras Rectificativas</option>
            </select>
          </label>
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fecha Expedición</span>
            <input
              type="date"
              bind:value={fechaExpedicion}
              class="w-full bg-card border border-border rounded-lg px-3 py-1.5 font-medium text-foreground outline-none focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Vencimiento</span>
            <input
              type="date"
              bind:value={fechaVencimiento}
              class="w-full bg-card border border-border rounded-lg px-3 py-1.5 font-medium text-foreground outline-none focus:border-primary"
            />
          </label>
        </div>

        <!-- Cliente / Receptor -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cliente / Razón Social *</span>
            <input
              type="text"
              placeholder="Nombre fiscal o empresa"
              bind:value={cliente}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            />
          </label>
          <label class="block">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">NIF / CIF Receptor *</span>
            <input
              type="text"
              placeholder="B12345678 / 12345678Z"
              bind:value={clienteNif}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary uppercase"
            />
          </label>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label class="block sm:col-span-2">
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dirección Receptor</span>
            <input
              type="text"
              placeholder="Calle, plaza, número"
              bind:value={clienteDireccion}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            />
          </label>
          <div>
            <span class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">C.P. / Población</span>
            <div class="flex gap-1.5">
              <input
                type="text"
                placeholder="C.P."
                aria-label="Código Postal"
                bind:value={clienteCodigoPostal}
                class="w-20 bg-card border border-border rounded-xl px-2.5 py-2 font-medium text-foreground outline-none focus:border-primary text-center"
              />
              <input
                type="text"
                placeholder="Ciudad"
                bind:value={clienteCiudad}
                class="flex-1 bg-card border border-border rounded-xl px-3 py-2 font-medium text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <!-- Líneas de Factura -->
        <div class="border border-border rounded-2xl p-4 bg-muted/20">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText class="w-3.5 h-3.5" />
              Conceptos Facturados
            </h3>
            <button
              type="button"
              onclick={agregarLinea}
              class="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl border border-primary/20 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5" />
              Añadir concepto
            </button>
          </div>

          <div class="space-y-2">
            {#each lineas as linea, idx}
              <div class="grid grid-cols-12 gap-2 items-center bg-card p-2.5 rounded-xl border border-border">
                <div class="col-span-12 sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Descripción del trabajo / producto"
                    bind:value={linea.descripcion}
                    class="w-full bg-transparent border-none text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <div class="col-span-4 sm:col-span-2">
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-muted-foreground">Cant:</span>
                    <input
                      type="number"
                      min="1"
                      bind:value={linea.cantidad}
                      class="w-full bg-muted/50 border border-border rounded-lg px-2 py-1 text-xs text-right font-medium text-foreground outline-none"
                    />
                  </div>
                </div>
                <div class="col-span-4 sm:col-span-2">
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-muted-foreground">€/ud:</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      bind:value={linea.precioUnitario}
                      class="w-full bg-muted/50 border border-border rounded-lg px-2 py-1 text-xs text-right font-medium text-foreground outline-none"
                    />
                  </div>
                </div>
                <div class="col-span-3 sm:col-span-2 text-right pr-1">
                  <span class="text-xs font-bold text-foreground">
                    {formatEuro((Number(linea.cantidad) || 0) * (Number(linea.precioUnitario) || 0))}
                  </span>
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

          <!-- Resumen con impuestos y retenciones -->
          <div class="mt-4 pt-3 border-t border-border flex flex-col items-end space-y-1">
            <div class="flex items-center gap-6 text-muted-foreground font-medium">
              <span>Base Imponible:</span>
              <span class="w-24 text-right font-semibold text-foreground">{formatEuro(baseImponible)}</span>
            </div>
            <div class="flex items-center gap-6 text-muted-foreground font-medium">
              <div class="flex items-center gap-1">
                <span>IVA:</span>
                <select bind:value={tipoIvaDefecto} class="bg-card border border-border rounded px-1 py-0.5 text-[10px]">
                  <option value={21}>21%</option>
                  <option value={10}>10%</option>
                  <option value={4}>4%</option>
                  <option value={0}>0%</option>
                </select>
              </div>
              <span class="w-24 text-right font-semibold text-foreground">{formatEuro(cuotaIva)}</span>
            </div>
            {#if tipoRetencionIrpf > 0}
              <div class="flex items-center gap-6 text-rose-600 font-medium">
                <span>Retención IRPF ({tipoRetencionIrpf}%):</span>
                <span class="w-24 text-right font-semibold">-{formatEuro(cuotaIrpf)}</span>
              </div>
            {/if}
            <div class="flex items-center gap-6 text-sm font-bold text-primary pt-1 border-t border-border/80">
              <span>Total Factura:</span>
              <span class="w-24 text-right">{formatEuro(totalFactura)}</span>
            </div>
          </div>
        </div>

        <!-- Bloque Veri*factu de Sello -->
        <div class="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <ShieldCheck class="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p class="text-xs font-bold text-emerald-950 dark:text-emerald-200">Sello Criptográfico Veri*factu (Ley Antifraude 11/2021)</p>
              <p class="text-[11px] text-emerald-800 dark:text-emerald-300">Genera la huella SHA-256 encadenada, el QR de cotejo y bloquea la factura contra alteración.</p>
            </div>
          </div>

          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" bind:checked={emitirDirectamente} class="w-4 h-4 rounded text-primary" />
            <span class="text-xs font-semibold text-foreground">Emitir & Sellar</span>
          </label>
        </div>
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
          onclick={guardarFactura}
          disabled={guardando}
          class="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {guardando ? "Procesando..." : (emitirDirectamente ? "Emitir Factura Veri*factu" : "Guardar Borrador")}
        </button>
      </div>
    </div>
  </div>
{/if}
