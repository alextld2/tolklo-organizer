<script lang="ts">
  import {
    Plus,
    Trash2,
    X,
    Calculator,
    Calendar,
    User,
    FileText,
    Cpu,
    Building2,
    MapPin,
    AlertTriangle,
    Check,
    Loader2
  } from "lucide-svelte";
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

  let idEdicion = $state<number | null>(null);
  let codigoEdicion = $state<string>("");
  let parametrosEscandallo = $state<any>(null);

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

  // --- CLIENTES PREDICTIVO Y MULTI-DIRECCIÓN ---
  let listaClientes = $state<any[]>([]);
  let cargandoClientes = $state(false);
  let mostrarSugerenciasCliente = $state(false);
  let direccionesDisponibles = $state<any[]>([]);
  let clienteSeleccionado = $state<any>(null);

  async function cargarClientes() {
    if (listaClientes.length > 0) return;
    cargandoClientes = true;
    try {
      const res = await fetch("/api/clientes");
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.clientes)) {
          listaClientes = data.clientes;
        }
      }
    } catch (e) {
      console.error("Error al cargar lista de clientes:", e);
    } finally {
      cargandoClientes = false;
    }
  }

  let sugerenciasClientes = $derived.by(() => {
    const term = cliente.trim().toLowerCase();
    if (!term || term.length < 1) return [];
    return listaClientes
      .filter((c: any) =>
        c.nombre.toLowerCase().includes(term) ||
        (c.nif && c.nif.toLowerCase().includes(term))
      )
      .slice(0, 8);
  });

  async function seleccionarCliente(c: any) {
    cliente = c.nombre;
    clienteNif = c.nif || "";
    clienteEmail = c.email || "";
    clienteTelefono = c.telefono || "";
    
    // Asignar dirección predeterminada
    const dirPred = c.direccionPredeterminada || (c.direcciones && c.direcciones[0]?.formateada) || "";
    clienteDireccion = dirPred;

    direccionesDisponibles = Array.isArray(c.direcciones) ? [...c.direcciones] : [];
    clienteSeleccionado = c;
    mostrarSugerenciasCliente = false;

    // Consultar si hay direcciones adicionales en DireccionCliente
    try {
      const resp = await fetch(`/api/direcciones/list?cliente=${encodeURIComponent(c.nombre)}`);
      if (resp.ok) {
        const dirsDB = await resp.json();
        if (Array.isArray(dirsDB) && dirsDB.length > 0) {
          dirsDB.forEach((d: any) => {
            const formateada = `${d.calle}, ${d.codigoPostal} ${d.ciudad}${d.provincia ? ` (${d.provincia})` : ''}, ${d.pais || 'España'}`.trim();
            const yaExiste = direccionesDisponibles.some((ex: any) => 
              (ex.formateada && ex.formateada.toLowerCase() === formateada.toLowerCase()) ||
              (ex.calle && ex.calle.toLowerCase() === d.calle.toLowerCase())
            );
            if (!yaExiste) {
              direccionesDisponibles = [
                ...direccionesDisponibles,
                {
                  id: d.id,
                  calle: d.calle,
                  ciudad: d.ciudad,
                  provincia: d.provincia,
                  codigoPostal: d.codigoPostal,
                  pais: d.pais,
                  notas: d.notas,
                  formateada
                }
              ];
            }
          });
        }
      }
    } catch (e) {
      console.error("Error al refrescar direcciones de cliente:", e);
    }
  }

  // Rastreo para evitar loops reactivos infinitos con $effect
  let ultimoDatosIniciales = $state<any>(null);

  $effect(() => {
    if (abierto) {
      cargarClientes();
      if (datosIniciales && datosIniciales !== ultimoDatosIniciales) {
        ultimoDatosIniciales = datosIniciales;
        idEdicion = datosIniciales.id || null;
        codigoEdicion = datosIniciales.codigo || "";
        parametrosEscandallo = datosIniciales.parametrosEscandallo || null;

        if (datosIniciales.cliente) cliente = datosIniciales.cliente;
        if (datosIniciales.clienteNif) clienteNif = datosIniciales.clienteNif;
        if (datosIniciales.clienteEmail) clienteEmail = datosIniciales.clienteEmail;
        if (datosIniciales.clienteTelefono) clienteTelefono = datosIniciales.clienteTelefono;
        if (datosIniciales.clienteDireccion) clienteDireccion = datosIniciales.clienteDireccion;
        if (datosIniciales.serie) serie = datosIniciales.serie;
        if (datosIniciales.fechaEmision) fechaEmision = datosIniciales.fechaEmision;
        if (datosIniciales.fechaValidez) fechaValidez = datosIniciales.fechaValidez;
        if (datosIniciales.condiciones) condiciones = datosIniciales.condiciones;
        if (datosIniciales.tipoIvaDefecto !== undefined) tipoIvaDefecto = datosIniciales.tipoIvaDefecto;
        if (datosIniciales.tipoIva !== undefined) tipoIvaDefecto = datosIniciales.tipoIva;

        if (Array.isArray(datosIniciales.articulos) && datosIniciales.articulos.length > 0) {
          lineas = datosIniciales.articulos.map((art: any) => ({
            descripcion: `${art.nombre} (${art.cantidad.toLocaleString()} uds) — ${art.anchoMm}x${art.altoMm}mm, ${art.papelNombre} ${art.gramaje}g`.trim(),
            cantidad: art.cantidad,
            precioUnitario: art.precioUnitario,
            descuentoPorcentaje: 0,
            tipoIva: tipoIvaDefecto
          }));
          descripcionGeneral = `Presupuesto combinado (${datosIniciales.articulos.length} partidas): ${datosIniciales.articulos.map((a: any) => a.nombre).join(", ")}`;
          notas = datosIniciales.articulos.map((a: any, idx: number) => 
            `[Partida ${idx + 1}] ${a.nombre} (${a.cantidad.toLocaleString()} uds):\n${a.detallesTecnicos}\nProducción: ${a.maquinaOptimaNombre || a.maquinaNombre || ''} (${(a.tecnologia || '').toUpperCase()})`
          ).join("\n\n");
        } else if (Array.isArray(datosIniciales.lineas) && datosIniciales.lineas.length > 0) {
          // Edición desde listado con líneas persistidas
          lineas = datosIniciales.lineas.map((l: any) => ({
            descripcion: l.descripcion,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            descuentoPorcentaje: l.descuentoPorcentaje || 0,
            tipoIva: l.tipoIva || tipoIvaDefecto
          }));
          descripcionGeneral = datosIniciales.descripcionGeneral || "";
          notas = datosIniciales.notas || "";
        } else {
          lineas = [
            {
              descripcion: datosIniciales.descripcion || datosIniciales.nombre || "Impresión técnica",
              cantidad: datosIniciales.cantidad || 1,
              precioUnitario: datosIniciales.precioUnitario || 0,
              descuentoPorcentaje: 0,
              tipoIva: tipoIvaDefecto
            }
          ];
          descripcionGeneral = datosIniciales.descripcion || datosIniciales.nombre || "";
          notas = datosIniciales.detallesTecnicos || datosIniciales.notas || "";
        }
      }
    } else {
      ultimoDatosIniciales = null;
      idEdicion = null;
      codigoEdicion = "";
      parametrosEscandallo = null;
      mostrarSugerenciasCliente = false;
      errorMsg = "";
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
    notas = datos.detallesTecnicos || "";
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
      const url = "/api/presupuestos";
      const method = idEdicion ? "PUT" : "POST";
      const payload: any = {
        workspaceId: workspace,
        serie,
        cliente,
        clienteNif,
        clienteEmail,
        clienteTelefono,
        clienteDireccion,
        fechaEmision,
        fechaValidez,
        estado: idEdicion ? (datosIniciales?.estado || "Borrador") : "Borrador",
        descripcionGeneral,
        notas,
        condiciones,
        lineas,
        tipoIvaDefecto,
        parametrosEscandalloJson: parametrosEscandallo ? JSON.stringify(parametrosEscandallo) : null
      };

      if (idEdicion) {
        payload.id = idEdicion;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
          <div class="w-10 h-10 rounded-xl {idEdicion ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-primary/10 text-primary'} flex items-center justify-center flex-shrink-0">
            <Calculator class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold tracking-tight text-foreground">
                {idEdicion ? `Modificar Presupuesto ${codigoEdicion}` : "Nuevo Presupuesto"}
              </h2>
              {#if idEdicion}
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 uppercase">
                  Modo Edición
                </span>
              {/if}
            </div>
            <p class="text-xs text-muted-foreground">
              {idEdicion ? "Ajusta las calidades, partidas comerciales o importes de este presupuesto" : "Emisión de cotización comercial para el cliente"}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          {#if idEdicion}
            <a
              href={`/w/${workspace}/escandallo?editarPresupuestoId=${idEdicion}`}
              class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 transition-all no-underline"
              title="Abrir este presupuesto en el calculador industrial de escandallo"
            >
              <Cpu class="w-3.5 h-3.5" />
              <span>⚡ Modificar en Escandallo</span>
            </a>
          {/if}

          <button
            type="button"
            onclick={onClose}
            class="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
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

        <!-- Datos del Cliente (con predictivo y autocompletado inteligente) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Campo Cliente Predictivo -->
          <div class="relative">
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Cliente *
              </label>
              {#if cargandoClientes}
                <span class="text-[10px] text-muted-foreground flex items-center gap-1 font-normal">
                  <Loader2 class="w-3 h-3 animate-spin text-primary" /> Buscando...
                </span>
              {:else if clienteSeleccionado}
                <span class="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <Check class="w-3 h-3" /> Vinculado
                </span>
              {/if}
            </div>

            <div class="relative">
              <input
                type="text"
                placeholder="Escribe para buscar cliente..."
                bind:value={cliente}
                onfocus={() => {
                  if (sugerenciasClientes.length > 0) mostrarSugerenciasCliente = true;
                }}
                oninput={() => {
                  mostrarSugerenciasCliente = true;
                  if (clienteSeleccionado && cliente.trim().toLowerCase() !== clienteSeleccionado.nombre.toLowerCase()) {
                    clienteSeleccionado = null;
                  }
                }}
                onblur={() => {
                  setTimeout(() => {
                    mostrarSugerenciasCliente = false;
                  }, 200);
                }}
                class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <!-- Desplegable flotante de clientes encontrados -->
            {#if mostrarSugerenciasCliente && sugerenciasClientes.length > 0}
              <div
                class="absolute top-full left-0 mt-1 w-full bg-popover text-popover-foreground border border-border rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-border/60"
              >
                {#each sugerenciasClientes as sug}
                  <button
                    type="button"
                    onmousedown={(e) => {
                      e.preventDefault();
                      seleccionarCliente(sug);
                    }}
                    class="w-full text-left px-3.5 py-2.5 text-xs hover:bg-accent/80 transition-colors flex items-center justify-between gap-2 group cursor-pointer border-none bg-transparent"
                  >
                    <div class="flex items-center gap-2 truncate">
                      <Building2 class="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                      <div class="truncate">
                        <span class="font-semibold text-foreground">{sug.nombre}</span>
                        {#if sug.nif}
                          <span class="ml-1.5 text-[10px] text-muted-foreground font-mono">({sug.nif})</span>
                        {/if}
                        {#if sug.direccionPredeterminada}
                          <div class="text-[10px] text-muted-foreground truncate">{sug.direccionPredeterminada}</div>
                        {/if}
                      </div>
                    </div>
                    <span class="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 font-medium">
                      Seleccionar
                    </span>
                  </button>
                {/each}
              </div>
            {/if}
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

        <!-- Dirección y Advertencia Multi-dirección -->
        <div>
          <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Dirección fiscal / Entrega
          </label>
          <input
            type="text"
            placeholder="Calle, número, código postal, población"
            bind:value={clienteDireccion}
            class="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-xs font-medium text-foreground outline-none focus:border-primary transition-colors"
          />

          <!-- ADVERTENCIA Y SELECTOR RÁPIDO DE MÚLTIPLES DIRECCIONES -->
          {#if direccionesDisponibles.length > 1}
            <div class="mt-2.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-2 animate-in fade-in">
              <div class="flex items-start gap-2">
                <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <div class="font-bold text-amber-800 dark:text-amber-300">
                    Aviso: Este cliente tiene {direccionesDisponibles.length} direcciones registradas
                  </div>
                  <div class="text-[11px] text-muted-foreground mt-0.5">
                    Se ha asignado la predeterminada. Haz clic en cualquiera de las siguientes para cambiarla en este presupuesto:
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {#each direccionesDisponibles as dir, idx}
                  {@const dirTexto = dir.formateada || `${dir.calle}, ${dir.codigoPostal || ''} ${dir.ciudad || ''}${dir.provincia ? ` (${dir.provincia})` : ''}`.trim()}
                  {@const esActiva = clienteDireccion.trim().toLowerCase() === dirTexto.trim().toLowerCase() || clienteDireccion.trim().toLowerCase() === (dir.calle || '').trim().toLowerCase()}
                  <button
                    type="button"
                    onclick={() => { clienteDireccion = dirTexto; }}
                    class={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      esActiva
                        ? 'bg-amber-500/20 border-amber-500 text-foreground font-medium ring-1 ring-amber-500/40 shadow-2xs'
                        : 'bg-card border-border hover:bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div class="flex items-center justify-between gap-1">
                      <span class="font-semibold text-[11px] truncate flex items-center gap-1.5">
                        <MapPin class="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        {dir.calle || `Dirección #${idx + 1}`}
                      </span>
                      {#if esActiva}
                        <span class="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-800 dark:text-amber-200 font-bold flex-shrink-0">
                          Asignada
                        </span>
                      {/if}
                    </div>
                    {#if dir.codigoPostal || dir.ciudad}
                      <div class="text-[10px] text-muted-foreground truncate pl-5">
                        {dir.codigoPostal || ''} {dir.ciudad || ''} {dir.provincia ? `(${dir.provincia})` : ''}
                      </div>
                    {/if}
                    {#if dir.notas}
                      <div class="text-[10px] text-amber-600 dark:text-amber-400 italic truncate pl-5 mt-0.5">
                        *{dir.notas}
                      </div>
                    {/if}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- Líneas de Conceptos -->
        <div class="border border-border rounded-2xl p-4 bg-muted/20">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText class="w-3.5 h-3.5" />
              Líneas del Presupuesto
            </h3>
            <div class="flex items-center gap-2">
              {#if idEdicion}
                <a
                  href={`/w/${workspace}/escandallo?editarPresupuestoId=${idEdicion}`}
                  class="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/25 flex items-center gap-1.5 transition-colors no-underline"
                  title="Calcular precio industrial en Escandallo"
                >
                  <Cpu class="w-3.5 h-3.5" />
                  <span>⚡ Escandallo Técnico</span>
                </a>
              {:else}
                <button
                  type="button"
                  onclick={() => (modalEscandalloAbierto = true)}
                  class="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/25 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Calcular precio según máquina, papel, imposición y mermas"
                >
                  <Cpu class="w-3.5 h-3.5" />
                  <span>⚡ Escandallo Técnico</span>
                </button>
              {/if}

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
                    title="Eliminar línea"
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
      <div class="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border">
        {#if idEdicion}
          <a
            href={`/w/${workspace}/escandallo?editarPresupuestoId=${idEdicion}`}
            class="sm:hidden text-xs font-semibold text-amber-600 dark:text-amber-400 underline no-underline"
          >
            ⚡ Modificar en Escandallo
          </a>
        {:else}
          <div></div>
        {/if}

        <div class="flex items-center gap-2">
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
            {guardando ? (idEdicion ? "Actualizando..." : "Guardando...") : (idEdicion ? "Guardar Cambios" : "Crear Presupuesto")}
          </button>
        </div>
      </div>
    </div>
  </div>

  <CalculadorEscandalloModal
    abierto={modalEscandalloAbierto}
    onClose={() => (modalEscandalloAbierto = false)}
    onAplicar={aplicarCalculoEscandallo}
  />
{/if}
