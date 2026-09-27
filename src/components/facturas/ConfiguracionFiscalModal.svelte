<script lang="ts">
  import { X, Building2, ShieldCheck, Save } from "lucide-svelte";

  let {
    abierto = false,
    workspace = "produccion",
    configuracionInicial = null,
    onClose,
    onSaved
  }: {
    abierto: boolean;
    workspace: string;
    configuracionInicial: any;
    onClose: () => void;
    onSaved: () => void;
  } = $props();

  let razonSocial = $state(configuracionInicial?.razonSocial || "Gráficas Tolklo S.L.");
  let nif = $state(configuracionInicial?.nif || "B18928374");
  let direccion = $state(configuracionInicial?.direccion || "C/ Impresores, 14 - Pol. Ind. Juncaril");
  let codigoPostal = $state(configuracionInicial?.codigoPostal || "18220");
  let ciudad = $state(configuracionInicial?.ciudad || "Albolote");
  let provincia = $state(configuracionInicial?.provincia || "Granada");
  let pais = $state(configuracionInicial?.pais || "España");
  let telefono = $state(configuracionInicial?.telefono || "+34 958 123 456");
  let email = $state(configuracionInicial?.email || "administracion@tolklo.es");
  let iban = $state(configuracionInicial?.iban || "ES76 2100 0418 4502 0005 1234");
  let serieFacturaDefecto = $state(configuracionInicial?.serieFacturaDefecto || "F26");
  let seriePresupuestoDefecto = $state(configuracionInicial?.seriePresupuestoDefecto || "PRE26");
  let serieAlbaranDefecto = $state(configuracionInicial?.serieAlbaranDefecto || "ALB26");
  let ivaDefecto = $state(configuracionInicial?.ivaDefecto || 21);
  let modoVerifactu = $state(configuracionInicial?.modoVerifactu || "SIF_ENCADENAMIENTO");

  let guardando = $state(false);
  let mensaje = $state("");

  async function guardar() {
    guardando = true;
    mensaje = "";
    try {
      const res = await fetch("/api/facturas/configuracion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspace,
          razonSocial,
          nif,
          direccion,
          codigoPostal,
          ciudad,
          provincia,
          pais,
          telefono,
          email,
          iban,
          serieFacturaDefecto,
          seriePresupuestoDefecto,
          serieAlbaranDefecto,
          ivaDefecto,
          modoVerifactu
        })
      });

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        mensaje = "Error al guardar la configuración.";
      }
    } catch (e: any) {
      mensaje = e.message || "Error de red.";
    } finally {
      guardando = false;
    }
  }
</script>

{#if abierto}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-xs font-sans animate-fade-in">
    <div class="bg-card text-card-foreground border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative max-h-[92vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-border/80 pb-4 mb-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Building2 class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-bold tracking-tight text-foreground">Datos Fiscales de la Empresa</h2>
            <p class="text-xs text-muted-foreground">Emisor fiscal y parámetros normativos Veri*factu (RD 1007/2023)</p>
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

      {#if mensaje}
        <div class="mb-4 p-3 bg-destructive/10 text-destructive text-xs rounded-xl font-medium">
          {mensaje}
        </div>
      {/if}

      <div class="space-y-4 text-xs">
        <div class="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex items-start gap-3">
          <ShieldCheck class="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div class="text-[11px] text-emerald-950 dark:text-emerald-200">
            <span class="font-bold">Cumplimiento Normativo Veri*factu:</span> Todos los datos del emisor registrados aquí se utilizarán para la construcción de la huella digital SHA-256 encadenada y la URL del código QR de cotejo en la AEAT.
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Razón Social *</label>
            <input
              type="text"
              bind:value={razonSocial}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">NIF / CIF Emisor *</label>
            <input
              type="text"
              bind:value={nif}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="sm:col-span-2">
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dirección Fiscal</label>
            <input
              type="text"
              bind:value={direccion}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Código Postal</label>
            <input
              type="text"
              bind:value={codigoPostal}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ciudad / Población</label>
            <input
              type="text"
              bind:value={ciudad}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Provincia</label>
            <input
              type="text"
              bind:value={provincia}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">País</label>
            <input
              type="text"
              bind:value={pais}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">IBAN de Cobro Bancario</label>
            <input
              type="text"
              bind:value={iban}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-mono font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email Facturación</label>
            <input
              type="email"
              bind:value={email}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        <!-- Series y Sistema Verifactu -->
        <div class="border-t border-border pt-4 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Serie Facturas</label>
            <input
              type="text"
              bind:value={serieFacturaDefecto}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Modo Veri*factu</label>
            <select
              bind:value={modoVerifactu}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            >
              <option value="SIF_ENCADENAMIENTO">SIF con Hash Encriptado (Inalterable)</option>
              <option value="VERIFACTU_REMISIÓN">Veri*factu Remisión AEAT</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">IVA por Defecto (%)</label>
            <input
              type="number"
              bind:value={ivaDefecto}
              class="w-full bg-card border border-border rounded-xl px-3.5 py-2 font-medium text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

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
          onclick={guardar}
          disabled={guardando}
          class="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          <Save class="w-4 h-4" />
          <span>{guardando ? "Guardando..." : "Guardar Configuración"}</span>
        </button>
      </div>
    </div>
  </div>
{/if}
