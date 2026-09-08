<script lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
  } from "./ui/dialog";
  import { Button } from "./ui/button";
  import { Input } from "./ui/input";
  import { toast } from "./ui/sonner";
  import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
  } from "./ui/select";
  import {
    User,
    Calendar,
    FileText,
    Layers,
    Tag,
    Handshake,
    Plus,
    Trash2,
    Loader2,
    CheckCircle2,
    Printer,
    Package,
    Flame,
    Circle,
    Check,
    Boxes,
  } from "lucide-svelte";
  import {
    LISTA_COMERCIALES,
    LISTA_ESTADOS,
    LISTA_AREAS,
  } from "../utils/constants";

  type Desglose = {
    descripcionProducto: string;
    cantidad: number | null;
  };

  type Tarea = {
    numParte: number | string;
    cliente: string;
    descripcionGeneral: string;
    comercial: string | null;
    estado: string;
    area: string;
    fechaSalida: string;
    subcontrata: string | null;
    desgloses?: Desglose[];
  };

  let {
    open = $bindable(false),
    tarea = null,
    listaComerciales = LISTA_COMERCIALES,
    listaAreas = LISTA_AREAS,
    listaEstados = LISTA_ESTADOS,
    onGuardado = (_tareaActualizada: Tarea) => {},
  }: {
    open?: boolean;
    tarea?: Tarea | null;
    listaComerciales?: string[];
    listaAreas?: string[];
    listaEstados?: string[];
    onGuardado?: (tareaActualizada: Tarea) => void;
  } = $props();

  // Estado local editable
  let cliente = $state("");
  let fechaSalida = $state("");
  let descripcionGeneral = $state("");
  let area = $state("Digital");
  let estado = $state("Por hacer");
  let comercial = $state("");
  let subcontrata = $state("");
  let desgloses = $state<Desglose[]>([{ descripcionProducto: "", cantidad: null }]);
  let guardando = $state(false);
  let cargandoDetalles = $state(false);

  // Mapa de iconos y colores por estado
  const ICONOS_ESTADO: Record<string, any> = {
    "Terminado": CheckCircle2,
    "Imprimiendo": Printer,
    "Manipulado": Package,
    "Urgente": Flame,
    "Por hacer": Circle,
  };

  const ESTILOS_BADGE_ESTADO: Record<string, string> = {
    "Terminado": "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20",
    "Imprimiendo": "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20",
    "Manipulado": "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20",
    "Urgente": "text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20",
    "Por hacer": "text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40",
  };

  // Inicializar estado cuando cambia la tarea o se abre el diálogo
  $effect(() => {
    if (open && tarea) {
      cliente = tarea.cliente || "";
      fechaSalida = tarea.fechaSalida || "";
      descripcionGeneral = tarea.descripcionGeneral || "";
      area = tarea.area || (listaAreas[0] || "Digital");
      estado = tarea.estado || "Por hacer";
      comercial = tarea.comercial || "";
      subcontrata = tarea.subcontrata || "";

      if (tarea.desgloses && tarea.desgloses.length > 0) {
        desgloses = tarea.desgloses.map((d) => ({
          descripcionProducto: d.descripcionProducto || "",
          cantidad: d.cantidad,
        }));
      } else {
        desgloses = [{ descripcionProducto: "", cantidad: null }];
        // Intentar cargar desgloses frescos desde la API si la tarea tiene numParte
        cargarDesglosesDesdeApi(tarea.numParte);
      }
    }
  });

  async function cargarDesglosesDesdeApi(numParte: number | string) {
    if (!numParte) return;
    cargandoDetalles = true;
    try {
      const res = await fetch(`/api/tarea/${numParte}.json`);
      if (res.ok) {
        const datos = await res.json();
        if (datos.desgloses && datos.desgloses.length > 0) {
          desgloses = datos.desgloses.map((d: any) => ({
            descripcionProducto: d.descripcionProducto || "",
            cantidad: d.cantidad,
          }));
        }
      }
    } catch {
      // Si falla, se mantiene el desglose existente
    } finally {
      cargandoDetalles = false;
    }
  }

  function añadirFilaDesglose() {
    desgloses = [...desgloses, { descripcionProducto: "", cantidad: null }];
  }

  function eliminarFilaDesglose(index: number) {
    if (desgloses.length > 1) {
      desgloses = desgloses.filter((_, i) => i !== index);
    } else {
      desgloses = [{ descripcionProducto: "", cantidad: null }];
    }
  }

  async function guardarCambios(e?: Event) {
    if (e) e.preventDefault();
    if (!tarea) return;

    if (!cliente.trim()) {
      toast.error("El nombre del cliente es obligatorio");
      return;
    }

    guardando = true;

    // Filtrar desgloses limpios
    const desglosesLimpios = desgloses
      .map((d) => ({
        descripcionProducto: (d.descripcionProducto || "").trim(),
        cantidad: d.cantidad !== null && d.cantidad !== undefined ? Number(d.cantidad) : null,
      }))
      .filter((d) => d.descripcionProducto !== "");

    const payload = {
      id: tarea.numParte,
      numParte: tarea.numParte,
      cliente: cliente.trim(),
      descripcionGeneral: descripcionGeneral.trim(),
      fechaSalida: fechaSalida || "",
      area,
      estado,
      comercial: comercial || null,
      subcontrata: subcontrata.trim() || null,
      desgloses: desglosesLimpios.length > 0 ? desglosesLimpios : [],
    };

    try {
      const response = await fetch("/api/actualizar-tarea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo guardar la tarea en el servidor");
      }

      const tareaActualizada: Tarea = {
        ...tarea,
        ...payload,
        desgloses: desglosesLimpios.length > 0 ? desglosesLimpios : [{ descripcionProducto: "", cantidad: null }],
      };

      onGuardado(tareaActualizada);
      toast.success(`Orden #${tarea.numParte} guardada correctamente`);
      open = false;
    } catch (err: any) {
      console.error("Error al actualizar la orden de trabajo:", err);
      toast.error(err.message || "Error al intentar guardar los cambios");
    } finally {
      guardando = false;
    }
  }
</script>

<Dialog bind:open>
  <DialogContent class="max-w-2xl sm:max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl rounded-3xl">
    <!-- Cabecera -->
    <div class="px-6 py-5 border-b border-border bg-muted/20 flex-shrink-0">
      <DialogHeader>
        <div class="flex items-center gap-2.5">
          <DialogTitle class="text-xl font-bold tracking-tight text-foreground">
            Editar Orden de Trabajo
          </DialogTitle>
          {#if tarea}
            <span class="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
              #{tarea.numParte}
            </span>
          {/if}
        </div>
        <DialogDescription class="text-xs text-muted-foreground mt-1">
          Modifica los datos del cliente, logística, fechas y líneas de producto desglosadas.
        </DialogDescription>
      </DialogHeader>
    </div>

    <!-- Cuerpo con Scroll -->
    <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-xs">
      <!-- Fila 1: Cliente & Fecha de Salida -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label for="edit-cliente" class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <User size={13} class="text-primary" /> Cliente
          </label>
          <div class="relative">
            <input
              id="edit-cliente"
              type="text"
              bind:value={cliente}
              placeholder="Nombre del cliente o empresa..."
              class="w-full flex h-10 rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
            />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="edit-fecha" class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={13} class="text-primary" /> Fecha de Salida
          </label>
          <input
            id="edit-fecha"
            type="date"
            bind:value={fechaSalida}
            class="w-full flex h-10 rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-medium text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
          />
        </div>
      </div>

      <!-- Fila 2: Descripción General -->
      <div class="space-y-1.5">
        <label for="edit-descripcion" class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <FileText size={13} class="text-primary" /> Descripción General
        </label>
        <input
          id="edit-descripcion"
          type="text"
          bind:value={descripcionGeneral}
          placeholder="Descripción del trabajo general (ej: Folletos publicitarios, Revistas...)"
          class="w-full flex h-10 rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
        />
      </div>

      <!-- Fila 3: Selectores con estilo Shadcn (Área, Estado, Comercial) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <!-- Área -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Layers size={13} class="text-primary" /> Área
          </label>
          <Select bind:value={area}>
            <SelectTrigger class="h-10 rounded-xl">
              <SelectValue placeholder="Seleccionar área..." />
            </SelectTrigger>
            <SelectContent>
              {#each listaAreas as a}
                <SelectItem value={a} label={a}>
                  <div class="flex items-center gap-2">
                    <Layers size={13} class="text-muted-foreground" />
                    <span>{a}</span>
                  </div>
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>

        <!-- Estado -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={13} class="text-primary" /> Estado
          </label>
          <Select bind:value={estado}>
            <SelectTrigger class="h-10 rounded-xl">
              <SelectValue placeholder="Seleccionar estado..." />
            </SelectTrigger>
            <SelectContent>
              {#each listaEstados as est}
                <SelectItem value={est} label={est}>
                  <div class="flex items-center gap-2">
                    <svelte:component
                      this={ICONOS_ESTADO[est] || Circle}
                      size={13}
                      class="flex-shrink-0"
                    />
                    <span>{est}</span>
                  </div>
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>

        <!-- Comercial -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Tag size={13} class="text-primary" /> Comercial
          </label>
          <Select bind:value={comercial}>
            <SelectTrigger class="h-10 rounded-xl">
              <SelectValue placeholder="Seleccionar comercial..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="" label="(Sin asignar)">
                <span class="text-muted-foreground">(Sin asignar)</span>
              </SelectItem>
              {#each listaComerciales as c}
                <SelectItem value={c} label={c}>
                  <div class="flex items-center gap-2">
                    <User size={13} class="text-muted-foreground" />
                    <span>{c}</span>
                  </div>
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
      </div>

      <!-- Fila 4: Subcontrata / Taller externo -->
      <div class="space-y-1.5">
        <label for="edit-subcontrata" class="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Handshake size={13} class="text-amber-500" /> Taller Externo (Subcontrata)
        </label>
        <input
          id="edit-subcontrata"
          type="text"
          bind:value={subcontrata}
          placeholder="Dejar vacío si es fabricación interna de Aeroprint..."
          class="w-full flex h-10 rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
        />
      </div>

      <!-- Fila 5: Líneas de Producción / Desglose de Productos -->
      <div class="space-y-3 pt-2 border-t border-border">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Boxes size={14} class="text-primary" />
            <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Líneas de Producción / Productos
            </span>
            {#if cargandoDetalles}
              <Loader2 size={12} class="animate-spin text-muted-foreground" />
            {/if}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onclick={añadirFilaDesglose}
            class="h-7 text-[11px] gap-1 rounded-lg border-border hover:bg-accent"
          >
            <Plus size={12} /> Añadir producto
          </Button>
        </div>

        <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
          {#each desgloses as fila, index}
            <div class="flex items-center gap-2 p-2 rounded-xl border border-border/70 bg-muted/20">
              <input
                type="text"
                placeholder="Descripción del producto (ej: Revistas grapadas 32pp...)"
                bind:value={fila.descripcionProducto}
                class="flex-1 h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs font-medium text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
              />
              <input
                type="number"
                placeholder="Cant."
                bind:value={fila.cantidad}
                min="0"
                class="w-24 h-9 rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-right text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
              />
              {#if desgloses.length > 1}
                <button
                  type="button"
                  onclick={() => eliminarFilaDesglose(index)}
                  class="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  title="Eliminar producto"
                >
                  <Trash2 size={14} />
                </button>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Pie de Acciones -->
    <div class="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between flex-shrink-0">
      <Button
        type="button"
        variant="ghost"
        onclick={() => (open = false)}
        disabled={guardando}
        class="text-xs h-9 px-4 rounded-xl"
      >
        Cancelar
      </Button>

      <Button
        type="button"
        onclick={guardarCambios}
        disabled={guardando}
        class="text-xs h-9 px-5 rounded-xl gap-2 font-semibold shadow-xs"
      >
        {#if guardando}
          <Loader2 size={14} class="animate-spin" />
          <span>Guardando...</span>
        {:else}
          <Check size={14} strokeWidth={2.5} />
          <span>Guardar Cambios</span>
        {/if}
      </Button>
    </div>
  </DialogContent>
</Dialog>
