<script lang="ts">
  import { X, Mail, Send, Copy, Check, ExternalLink, FileText } from "lucide-svelte";
  import { formatEuro, formatFechaES } from "$lib/fiscal-utils";

  let {
    abierto = false,
    presupuesto = null,
    onClose,
    onEnviado
  }: {
    abierto: boolean;
    presupuesto: any;
    onClose: () => void;
    onEnviado: () => void;
  } = $props();

  let emailDestino = $state("");
  let asunto = $state("");
  let mensaje = $state("");
  let copiado = $state(false);
  let enviando = $state(false);

  $effect(() => {
    if (abierto && presupuesto) {
      emailDestino = presupuesto.clienteEmail || "";
      asunto = `Presupuesto ${presupuesto.codigo} - ${presupuesto.cliente}`;
      
      const validezTxt = presupuesto.fechaValidez
        ? `Válido hasta el ${formatFechaES(presupuesto.fechaValidez)}.`
        : "Válido durante 30 días naturales.";

      mensaje = `Estimado/a ${presupuesto.cliente},\n\nLe remitimos la cotización oficial correspondiente a su solicitud:\n\n${presupuesto.descripcionGeneral || 'Servicios de imprenta y producción gráfica'}\n\n• Código de oferta: ${presupuesto.codigo}\n• Base imponible: ${formatEuro(presupuesto.baseImponible)}\n• Total presupuesto: ${formatEuro(presupuesto.total)} (IVA incluido)\n• ${validezTxt}\n\nCondiciones comerciales:\n${presupuesto.condiciones || 'Forma de pago a convenir.'}\n\nQuedamos a su entera disposición para cualquier consulta o para dar comienzo a la producción.\n\nAtentamente,\nEquipo de Producción e Imprenta`;
      copiado = false;
    }
  });

  function copiarTexto() {
    navigator.clipboard.writeText(mensaje);
    copiado = true;
    setTimeout(() => {
      copiado = false;
    }, 2500);
  }

  async function marcarComoEnviado(abrirMailto: boolean = false) {
    if (!presupuesto) return;
    enviando = true;

    try {
      const res = await fetch("/api/presupuestos/estado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presupuestoId: presupuesto.id,
          nuevoEstado: "Enviado"
        })
      });

      if (res.ok) {
        if (abrirMailto) {
          const mailtoUrl = `mailto:${encodeURIComponent(emailDestino)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
          window.open(mailtoUrl, "_blank");
        }
        onEnviado();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Error al actualizar estado");
      }
    } catch (e: any) {
      alert(e.message || "Error en la conexión");
    } finally {
      enviando = false;
    }
  }
</script>

{#if abierto && presupuesto}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-xs font-sans animate-fade-in">
    <div class="bg-card text-card-foreground border border-border rounded-2xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl relative max-h-[92vh] overflow-y-auto">
      
      <!-- Cabecera -->
      <div class="flex items-center justify-between border-b border-border/80 pb-4 mb-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Mail class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-bold tracking-tight text-foreground">Enviar Presupuesto por Correo</h2>
            <p class="text-xs text-muted-foreground">{presupuesto.codigo} — {presupuesto.cliente}</p>
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

      <div class="space-y-4">
        <!-- Destinatario -->
        <div>
          <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Email Destinatario
          </label>
          <input
            type="email"
            placeholder="contacto@cliente.com"
            bind:value={emailDestino}
            class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors"
          />
          {#if !emailDestino}
            <p class="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              * El cliente no tenía email registrado. Puedes escribirlo aquí para abrir tu cliente de correo.
            </p>
          {/if}
        </div>

        <!-- Asunto -->
        <div>
          <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Asunto
          </label>
          <input
            type="text"
            bind:value={asunto}
            class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        <!-- Cuerpo del Mensaje -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Contenido de la Propuesta Comercial
            </label>
            <button
              type="button"
              onclick={copiarTexto}
              class="text-[10px] text-primary hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              {#if copiado}
                <Check class="w-3 h-3 text-emerald-500" />
                <span>¡Copiado!</span>
              {:else}
                <Copy class="w-3 h-3" />
                <span>Copiar texto</span>
              {/if}
            </button>
          </div>
          <textarea
            rows="9"
            bind:value={mensaje}
            class="w-full bg-muted/30 border border-border rounded-xl p-3 text-xs font-mono text-foreground outline-none focus:border-primary resize-none leading-relaxed"
          ></textarea>
        </div>
      </div>

      <!-- Footer botones -->
      <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mt-6 pt-4 border-t border-border">
        <button
          type="button"
          onclick={onClose}
          class="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer text-center"
        >
          Cancelar
        </button>

        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={() => marcarComoEnviado(false)}
            disabled={enviando}
            class="px-3.5 py-2 text-xs font-semibold text-foreground bg-muted hover:bg-accent border border-border rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Actualiza el estado a Enviado sin abrir el gestor de correo"
          >
            Marcar como Enviado
          </button>

          <button
            type="button"
            onclick={() => marcarComoEnviado(true)}
            disabled={enviando}
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            <span>Abrir en Email y Marcar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
