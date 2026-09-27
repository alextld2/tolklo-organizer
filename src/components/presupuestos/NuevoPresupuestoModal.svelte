<script lang="ts">
  import { Plus, Trash2, X, Calculator, Calendar, User, FileText, Cpu } from "lucide-svelte";
  import { formatEuro } from "$lib/fiscal-utils";
  import CalculadorEscandalloModal from "./CalculadorEscandalloModal.svelte";

  let {
    abierto = false,
    workspace = "produccion",
    datosIniciales = null,
    onClose,
    onCreated
  }: {
    abierto: boolean;
    workspace: string;
    datosIniciales?: any;
    onClose: () => void;
    onCreated: () => void;
  } = $props();

  let cliente = $state("");
  let clienteNif = $state("");
  let clienteEmail = $state("");
  let clienteTelefono = $state("");
  let clienteDireccion = $state("");
  let serie = $state("PRE26");
  let fechaEmision = $state(new Date().toISOString().split("T")[0]);
  
  // Fecha de validez a 30 días
  const fecha30Dias = new Date();
  fecha30Dias.setDate(fecha30Dias.getDate() + 30);
  let fechaValidez = $state(fecha30Dias.toISOString().split("T")[0]);

  let descripcionGeneral = $state("");
  let notas = $state("");
  let condiciones = $state("Validez de la oferta: 30 días naturales. Forma de pago a convenir.");
  let tipoIvaDefecto = $state(21);
  let modalEscandalloAbierto = $state(false);

  let lineas = $state([
    { descripcion: "Impresión y acabado estándar", cantidad: 1, precioUnitario: 100, descuentoPorcentaje: 0, tipoIva: 21 }
  ]);

  $effect(() => {
    if (datosIniciales) {
      lineas = [
        {
          descripcion: datosIniciales.descripcion,
          cantidad: datosIniciales.cantidad,
          precioUnitario: datosIniciales.precioUnitario,
          descuentoPorcentaje: 0,
          tipoIva: tipoIvaDefecto
        }
      ];
      descripcionGeneral = datosIniciales.descripcion;
      notas = (notas ? notas + "\n\n" : "") + datosIniciales.detallesTecnicos;
    }
  });

  function aplicarCalculoEscandallo(datos: any) {
    lineas = [
      {
        descripcion: datos.descripcion,
        cantidad: datos.cantidad,
        precioUnitario: datos.precioUnitario,
        descuentoPorcentaje: 0,
        tipoIva: tipoIvaDefecto
      }
    ];
    if (!descripcionGeneral) {
      descripcionGeneral = datos.descripcion;
    }
    notas = (notas ? notas + "\n\n" : "") + datos.detallesTecnicos;
  }

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

  // Cálculos en vivo
  let baseImponible = $derived(
    lineas.reduce((acc, l) => {
      const cant = Number(l.cantidad) || 0;
      const precio = Number(l.precioUnitario) || 0;
      const desc = Number(l.descuentoPorcentaje) || 0;
      return acc + (cant * precio * (1 - desc / 100));
    }, 0)
  );

  let cuotaIva = $derived(Math.round((baseImponible * tipoIvaDefecto / 100) * 100) / 100);
  let totalPresupuesto = $derived(Math.round((baseImponible + cuotaIva) * 100) / 100);

  async function guardarPresupuesto() {
    if (!cliente.trim()) {
      errorMsg = "Por favor, introduce el nombre del cliente.";
      return;
    }
    if (lineas.length === 0 || !lineas[0].descripcion.trim()) {
      errorMsg = "Añade al menos una línea con descripción al presupuesto.";
      return;
    }

    errorMsg = "";
    guardando = true;

    try {
      const res = await fetch("/api/presupuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace,
          serie,
          cliente,
          clienteNif,
          clienteEmail,
          clienteTelefono,
          clienteDireccion,
          fechaEmision,
          fechaValidez,
          estado: "Borrador",
          descripcionGeneral,
          notas,
          condiciones,
          lineas,
          tipoIvaDefecto
        })
      });

      const data = await res.json();
      if (res.ok) {
        onCreated();
        onClose();
      } else {
        errorMsg = data.error || "Ocurrió un error al guardar el presupuesto.";
      }
    } catch (e: any) {
      errorMsg = e.message || "Error de conexión con el servidor.";
    } finally {
      guardando = false;
    }
  }
</script>

{#if abierto}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-xs font-sans animate-fade-in">
    <div class="bg-card text-card-foreground border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl relative max-h-[92vh] overflow-y-auto">
      <!-- Cabecera modal -->
      <div class="flex items-center justify-between border-b border-border/80 pb-4 mb-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Calculator class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-bold tracking-tight text-foreground">Nuevo Presupuesto</h2>
            <p class="text-xs text-muted-foreground">Emisión de cotización comercial para el cliente</p>
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

      {#if errorMsg}
        <div class="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl font-medium">
          {errorMsg}
        </div>
      {/if}

      <div class="space-y-5">
        <!-- Datos de Serie y Fechas -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/60">
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Serie</label>
            <input
              type="text"
              bind:value={serie}
              class="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fecha Emisión</label>
            <input
              type="date"
              bind:value={fechaEmision}
              class="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fecha Validez</label>
            <input
              type="date"
              bind:value={fechaValidez}
              class="w-full bg-card border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        <!-- Datos del Cliente -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Cliente *</label>
            <input
              type="text"
              placeholder="Nombre o Razón Social"
              bind:value={cliente}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">NIF / CIF</label>
            <input
              type="text"
              placeholder="Ej. B12345678"
              bind:value={clienteNif}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              placeholder="contacto@cliente.com"
              bind:value={clienteEmail}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Teléfono</label>
            <input
              type="text"
              placeholder="Ej. 600 000 000"
              bind:value={clienteTelefono}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dirección fiscal / Entrega</label>
          <input
            type="text"
            placeholder="Calle, número, código postal, población"
            bind:value={clienteDireccion}
            class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
          />
        </div>

        <!-- Líneas de Conceptos -->
        <div class="border border-border rounded-2xl p-4 bg-muted/20">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText class="w-3.5 h-3.5" />
              Líneas del Presupuesto
            </h3>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={() => (modalEscandalloAbierto = true)}
                class="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/25 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Calcular precio según máquina, papel, imposición y mermas"
              >
                <Cpu class="w-3.5 h-3.5" />
                <span>⚡ Escandallo Técnico</span>
              </button>

              <button
                type="button"
                onclick={agregarLinea}
                class="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl border border-primary/20 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                Añadir línea
              </button>
            </div>
          </div>

          <div class="space-y-2">
            {#each lineas as linea, idx}
              <div class="grid grid-cols-12 gap-2 items-center bg-card p-2.5 rounded-xl border border-border">
                <div class="col-span-12 sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Descripción del concepto / producto"
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

          <!-- Resumen de Totales -->
          <div class="mt-4 pt-3 border-t border-border flex flex-col items-end space-y-1 text-xs">
            <div class="flex items-center gap-6 text-muted-foreground font-medium">
              <span>Base Imponible:</span>
              <span class="w-24 text-right font-semibold text-foreground">{formatEuro(baseImponible)}</span>
            </div>
            <div class="flex items-center gap-6 text-muted-foreground font-medium">
              <span>IVA ({tipoIvaDefecto}%):</span>
              <span class="w-24 text-right font-semibold text-foreground">{formatEuro(cuotaIva)}</span>
            </div>
            <div class="flex items-center gap-6 text-sm font-bold text-primary pt-1 border-t border-border/80">
              <span>Total Presupuesto:</span>
              <span class="w-24 text-right">{formatEuro(totalPresupuesto)}</span>
            </div>
          </div>
        </div>

        <!-- Condiciones y notas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Condiciones comerciales</label>
            <textarea
              rows="2"
              bind:value={condiciones}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary resize-none"
            ></textarea>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notas internas / Observaciones</label>
            <textarea
              rows="2"
              placeholder="Notas opcionales..."
              bind:value={notas}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary resize-none"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Footer con botones -->
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
          onclick={guardarPresupuesto}
          disabled={guardando}
          class="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Crear Presupuesto"}
        </button>
      </div>
    </div>
  </div>

  <CalculadorEscandalloModal
    abierto={modalEscandalloAbierto}
    onClose={() => (modalEscandalloAbierto = false)}
    onAplicar={aplicarCalculoEscandallo}
  />
{/if}
