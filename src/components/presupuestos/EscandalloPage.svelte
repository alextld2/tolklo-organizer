<!-- src/components/presupuestos/EscandalloPage.svelte -->
<script lang="ts">
  import { 
    Cpu, 
    Layers, 
    Zap, 
    Percent, 
    FileText, 
    Clock, 
    ArrowRight, 
    CheckCircle2, 
    Sparkles, 
    FoldHorizontal, 
    AlertTriangle, 
    RotateCcw,
    Table,
    Calculator,
    ArrowLeft
  } from "lucide-svelte";
  import { formatEuro } from "$lib/fiscal-utils";
  import { 
    PAPELES_CATALOGO, 
    CATALOGO_ACABADOS, 
    TIPOS_PLEGADO,
    calcularGeometriaDesplegable,
    calcularEscandalloCompleto,
    calcularEscaladoCantidades,
    type ParametrosCalculo
  } from "$lib/escandallo-imprenta";
  import NuevoPresupuestoModal from "./NuevoPresupuestoModal.svelte";

  let { workspace = "facturacion" }: { workspace?: string } = $props();

  // 1. Tipo de producto y plegado
  let tipoPlegadoId = $state("triptico_envolvente");
  let modoDefinicion = $state<"cerrado" | "abierto">("cerrado");
  let anchoBaseMm = $state(100);
  let altoBaseMm = $state(210);
  let sangreMm = $state(2);

  // 2. Tirada y soportes
  let cantidadTirada = $state(2500);
  let papelId = $state("estucado-mate");
  let gramaje = $state(150);
  let colorImpresion = $state<"4+4" | "4+0" | "1+1" | "1+0">("4+4");
  let acabadosSeleccionados = $state<string[]>(["plegado_triptico"]);
  let margenBeneficio = $state(35); // 35% de markup comercial

  // Máquina forzada manualmente o automática
  let maquinaSeleccionadaId = $state<string | null>(null);

  // Modal para crear presupuesto oficial desde este cálculo
  let modalPresupuestoAbierto = $state(false);
  let datosParaPresupuesto = $state<any>(null);

  // Cálculo de geometría del desplegable (palas y ventanas)
  let geometria = $derived(
    calcularGeometriaDesplegable(
      tipoPlegadoId,
      modoDefinicion,
      Number(anchoBaseMm) || 100,
      Number(altoBaseMm) || 210,
      Number(gramaje) || 150
    )
  );

  // Auto-sugerir hendido si gramaje >= 170g
  $effect(() => {
    if (geometria.requiereHendidoSugerido && !acabadosSeleccionados.includes("hendido")) {
      acabadosSeleccionados = [...acabadosSeleccionados, "hendido"];
    }
  });

  function toggleAcabado(id: string) {
    if (acabadosSeleccionados.includes(id)) {
      acabadosSeleccionados = acabadosSeleccionados.filter(a => a !== id);
    } else {
      acabadosSeleccionados = [...acabadosSeleccionados, id];
    }
  }

  // Preajustes rápidos de tamaño
  function setFormatoRapido(ancho: number, alto: number, modo: "cerrado" | "abierto") {
    modoDefinicion = modo;
    anchoBaseMm = ancho;
    altoBaseMm = alto;
  }

  // Parámetros completos pasados al motor de escandallo (usando las dimensiones abiertas del trabajo)
  let parametrosCalculo = $derived<ParametrosCalculo>({
    cantidadTirada: Math.max(1, Number(cantidadTirada) || 100),
    anchoMm: geometria.anchoAbierto,
    altoMm: geometria.altoAbierto,
    sangreMm: Number(sangreMm) || 2,
    papelId,
    gramaje: Number(gramaje) || 150,
    colorImpresion,
    acabadosIds: acabadosSeleccionados,
    margenBeneficioPorcentaje: Number(margenBeneficio) || 35
  });

  // Ejecución del motor para la cantidad actual
  let calculo = $derived(calcularEscandalloCompleto(parametrosCalculo));

  // Máquina activa para inspección
  let maquinaActiva = $derived(
    maquinaSeleccionadaId
      ? (calculo.opcionesMaquinas.find(m => m.maquina.id === maquinaSeleccionadaId) || calculo.maquinaOptima)
      : calculo.maquinaOptima
  );

  // Escalado de precios en tiempo real para 6 tramos de volumen
  let tramosEscalado = $derived(() => {
    const base = Number(cantidadTirada) || 1000;
    // Generar tramos inteligentes basados en la cantidad elegida
    const lista = [
      Math.max(100, Math.round(base * 0.2 / 50) * 50),
      Math.max(250, Math.round(base * 0.5 / 50) * 50),
      base,
      Math.round(base * 2 / 100) * 100,
      Math.round(base * 4 / 250) * 250,
      Math.round(base * 8 / 500) * 500
    ];
    // Eliminar duplicados y ordenar
    const unicos = Array.from(new Set(lista)).sort((a, b) => a - b);
    return calcularEscaladoCantidades(parametrosCalculo, unicos);
  });

  function transferirPresupuesto(opcion?: any) {
    const maq = opcion ? (calculo.opcionesMaquinas.find(m => m.maquina.id === opcion.maquinaOptimaNombre) || maquinaActiva) : maquinaActiva;
    const cant = opcion ? opcion.cantidad : cantidadTirada;
    const pvpUnit = opcion ? opcion.precioUnitario : maq.precioUnitarioSugerido;
    const costeTot = opcion ? opcion.costeTotal : maq.costeTotalEmpresa;

    const papelActual = calculo.papel;
    const acabadosTxt = acabadosSeleccionados.length > 0
      ? ` + ${acabadosSeleccionados.map(id => CATALOGO_ACABADOS[id]?.nombre).join(", ")}`
      : "";

    const descripcion = `${geometria.nombre} — Cerrado ${geometria.anchoCerrado}x${geometria.altoCerrado} mm (Abierto ${geometria.anchoAbierto}x${geometria.altoAbierto} mm), ${papelActual.nombre} ${gramaje}g, Impresión ${colorImpresion}${acabadosTxt}.`;

    const detalles = `[ESCANDALLO TÉCNICO INDUSTRIAL]
• Producto: ${geometria.descripcionTecnica}
• Máquina seleccionada: ${maq.maquina.nombre} (${maq.maquina.tecnologia.toUpperCase()})
• Pliego de máquina: ${maq.maquina.pliegoAncho}x${maq.maquina.pliegoAlto} mm
• Imposición: ${maq.imposicion.totalPosesPorPliego} poses/pliego (${maq.imposicion.posesColumnas} col x ${maq.imposicion.posesFilas} filas${maq.imposicion.rotada90 ? ', rotada 90º' : ''})
• Aprovechamiento de pliego: ${maq.imposicion.aprovechamientoPorcentaje}%
• Pliegos netos: ${maq.pliegosNetos.toLocaleString()} | Mermas totales: ${maq.mermasArranque + maq.mermasTirada + maq.mermasAcabados} pl.
• Total papel bruto: ${maq.totalPliegosBrutos.toLocaleString()} pliegos (${maq.pesoPapelKg.toFixed(1)} kg - ${formatEuro(maq.costePapel)})
• Coste fabricación: ${formatEuro(costeTot)} | Margen: ${margenBeneficio}% | PVP: ${formatEuro(pvpUnit * cant)}`;

    datosParaPresupuesto = {
      descripcion,
      cantidad: cant,
      precioUnitario: pvpUnit,
      detallesTecnicos: detalles
    };

    modalPresupuestoAbierto = true;
  }
</script>

<div class="space-y-6 max-w-7xl mx-auto pb-16">
  
  <!-- CABECERA DE LA PÁGINA -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
    <div>
      <div class="flex items-center gap-2.5 mb-1.5">
        <a
          href={`/w/${workspace}/presupuestos`}
          class="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          title="Volver a Presupuestos"
        >
          <ArrowLeft class="w-4 h-4" />
        </a>
        <h1 class="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span>Escandallo Técnico e Imposición</span>
        </h1>
        <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 uppercase tracking-wider">
          Motor MIS / ERP Gráfico
        </span>
      </div>
      <p class="text-xs text-muted-foreground">
        Cálculo paramétrico de desplegables, desglose de palas, imposición 2D en pliego, mermas industriales y comparativa de máquinas con punto de corte.
      </p>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        onclick={() => transferirPresupuesto()}
        class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xs cursor-pointer select-none"
      >
        <span>Crear Presupuesto con este cálculo</span>
        <ArrowRight class="w-4 h-4" />
      </button>
    </div>
  </div>

  <!-- GRID PRINCIPAL DE 3 BLOQUES -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

    <!-- COLUMNA 1: CONFIGURACIÓN GEOMÉTRICA, PLEGADO Y MATERIALES (4 cols) -->
    <div class="lg:col-span-4 space-y-4">
      
      <!-- 1. Tipo de Desplegable / Plegado -->
      <div class="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FoldHorizontal class="w-3.5 h-3.5 text-primary" />
            Estructura & Plegado
          </label>
          <span class="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
            {geometria.numPalas} palas • {geometria.numPaginas} págs
          </span>
        </div>

        <select
          bind:value={tipoPlegadoId}
          class="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
        >
          {#each TIPOS_PLEGADO as t}
            <option value={t.id}>{t.nombre}</option>
          {/each}
        </select>

        <!-- Toggle Modo de Definición (Cerrado vs Abierto) -->
        <div class="flex rounded-xl bg-muted/60 p-1 border border-border">
          <button
            type="button"
            onclick={() => (modoDefinicion = "cerrado")}
            class="flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer {modoDefinicion === 'cerrado' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'}"
          >
            Definir por Cerrado
          </button>
          <button
            type="button"
            onclick={() => (modoDefinicion = "abierto")}
            class="flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all cursor-pointer {modoDefinicion === 'abierto' ? 'bg-card text-foreground shadow-2xs' : 'text-muted-foreground hover:text-foreground'}"
          >
            Definir por Abierto
          </button>
        </div>

        <!-- Inputs de dimensiones base -->
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              {modoDefinicion === 'cerrado' ? 'Ancho Cerrado' : 'Ancho Abierto'} (mm)
            </label>
            <input
              type="number"
              bind:value={anchoBaseMm}
              min="30"
              max="1400"
              class="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Alto (mm)
            </label>
            <input
              type="number"
              bind:value={altoBaseMm}
              min="30"
              max="1000"
              class="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Sangre (mm)
            </label>
            <input
              type="number"
              bind:value={sangreMm}
              min="0"
              max="10"
              class="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <!-- Preajustes rápidos -->
        <div class="pt-1 flex items-center gap-1.5 flex-wrap">
          <span class="text-[9px] font-semibold text-muted-foreground uppercase">Atajos:</span>
          <button
            type="button"
            onclick={() => setFormatoRapido(100, 210, "cerrado")}
            class="text-[10px] px-2 py-0.5 rounded-lg border border-border hover:bg-accent text-muted-foreground font-medium"
          >
            Tríptico 10x21 cm
          </button>
          <button
            type="button"
            onclick={() => setFormatoRapido(148, 210, "cerrado")}
            class="text-[10px] px-2 py-0.5 rounded-lg border border-border hover:bg-accent text-muted-foreground font-medium"
          >
            Cerrado A5
          </button>
          <button
            type="button"
            onclick={() => setFormatoRapido(210, 297, "cerrado")}
            class="text-[10px] px-2 py-0.5 rounded-lg border border-border hover:bg-accent text-muted-foreground font-medium"
          >
            Cerrado A4
          </button>
          <button
            type="button"
            onclick={() => setFormatoRapido(297, 210, "abierto")}
            class="text-[10px] px-2 py-0.5 rounded-lg border border-border hover:bg-accent text-muted-foreground font-medium"
          >
            Abierto A4
          </button>
        </div>

        <!-- ESQUEMA VISUAL DE PALAS Y VENTANAS CALCULADAS -->
        <div class="p-3 bg-muted/30 border border-border/80 rounded-xl space-y-2">
          <div class="flex items-center justify-between text-[10px]">
            <span class="font-bold text-foreground uppercase tracking-wider">Desglose de Ventanas / Palas:</span>
            <span class="font-mono text-muted-foreground">Total: {geometria.anchoAbierto} x {geometria.altoAbierto} mm</span>
          </div>

          <!-- Representación de las palas en barra horizontal -->
          <div class="flex w-full h-11 border border-border rounded-lg overflow-hidden bg-background divide-x divide-border">
            {#each geometria.palas as pala}
              {@const pct = (pala.ancho / geometria.anchoAbierto) * 100}
              <div
                style="width: {pct}%"
                class="flex flex-col items-center justify-center p-1 text-center relative {pala.reduccionMm > 0 ? 'bg-amber-500/10' : 'bg-primary/5'}"
                title="{pala.nombre}: {pala.ancho} mm {pala.reduccionMm > 0 ? `(-${pala.reduccionMm}mm para plegado)` : ''}"
              >
                <span class="text-[9px] font-bold text-foreground truncate w-full">{pala.ancho}mm</span>
                <span class="text-[8px] text-muted-foreground truncate w-full">
                  {pala.tipo === 'solapa' ? 'Solapa (-3)' : pala.nombre.split(" ")[0]}
                </span>
              </div>
            {/each}
          </div>

          {#if geometria.requiereHendidoSugerido}
            <div class="flex items-center gap-1.5 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-700 dark:text-amber-300">
              <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0" />
              <span>Por gramaje ({gramaje}g), se incluye automáticamente <strong>hendido</strong> para evitar rotura de fibra.</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- 2. Papel, Gramaje y Tintas -->
      <div class="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
          Materia Prima & Tintas
        </label>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Papel / Soporte
            </label>
            <select
              bind:value={papelId}
              class="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              {#each PAPELES_CATALOGO as p}
                <option value={p.id}>{p.nombre} ({p.precioKg} €/kg)</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Gramaje
            </label>
            <select
              bind:value={gramaje}
              class="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              {#each [90, 115, 135, 150, 170, 200, 250, 300, 350] as g}
                <option value={g}>{g} g/m²</option>
              {/each}
            </select>
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Tintas / Caras
          </label>
          <div class="grid grid-cols-4 gap-1.5">
            {#each [
              { id: "4+4", label: "4+4 Color" },
              { id: "4+0", label: "4+0 Color" },
              { id: "1+1", label: "1+1 B/N" },
              { id: "1+0", label: "1+0 B/N" }
            ] as tint}
              <button
                type="button"
                onclick={() => (colorImpresion = tint.id as any)}
                class="py-1.5 px-1 rounded-xl text-[11px] font-semibold text-center border transition-all cursor-pointer {colorImpresion === tint.id ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-muted/40 border-border text-foreground hover:bg-accent'}"
              >
                {tint.label}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- 3. Acabados y Manipulados -->
      <div class="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-2">
        <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
          Acabados y Procesos
        </label>
        <div class="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {#each Object.values(CATALOGO_ACABADOS) as ac}
            <label class="flex items-center justify-between p-2 rounded-xl border border-border/70 hover:bg-accent/60 cursor-pointer text-xs transition-colors">
              <div class="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={acabadosSeleccionados.includes(ac.id)}
                  onchange={() => toggleAcabado(ac.id)}
                  class="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span class="font-medium text-foreground text-[11px]">{ac.nombre}</span>
              </div>
              <span class="text-[10px] font-mono text-muted-foreground font-semibold">+{ac.tarifaFijaArranque}€</span>
            </label>
          {/each}
        </div>
      </div>

      <!-- 4. Margen Comercial y Tirada Base -->
      <div class="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Tirada Base de Cálculo
            </label>
            <span class="text-xs font-bold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
              {cantidadTirada.toLocaleString()} uds
            </span>
          </div>
          <input
            type="number"
            bind:value={cantidadTirada}
            min="10"
            step="100"
            class="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-sm font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <Percent class="w-3.5 h-3.5 text-primary" />
              Margen Comercial (Markup)
            </span>
            <span class="text-xs font-bold text-primary font-mono">{margenBeneficio}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            bind:value={margenBeneficio}
            class="w-full accent-primary cursor-pointer"
          />
        </div>
      </div>

    </div>

    <!-- COLUMNA 2 Y 3: IMPOSICIÓN TÉCNICA 2D, COMPARADOR DE MÁQUINAS Y ESCALADO (8 cols) -->
    <div class="lg:col-span-8 space-y-5">
      
      <!-- COMPARADOR DE MÁQUINAS Y PUNTO DE CORTE -->
      <div class="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 class="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Zap class="w-4 h-4 text-amber-500" />
            Enrutamiento Automático de Máquinas (Digital vs Offset)
          </h2>
          <span class="text-[10px] text-muted-foreground italic font-medium">
            {calculo.puntoCorteCrossover}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {#each calculo.opcionesMaquinas as opcion}
            {@const esActiva = maquinaActiva.maquina.id === opcion.maquina.id}
            <button
              type="button"
              onclick={() => (maquinaSeleccionadaId = opcion.maquina.id)}
              class="text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between {opcion.esRecomendada ? 'border-emerald-500/60 bg-emerald-500/5 shadow-xs' : 'border-border bg-card hover:bg-accent/40'} {esActiva ? 'ring-2 ring-primary' : ''}"
            >
              {#if opcion.esRecomendada}
                <span class="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <Sparkles class="w-2.5 h-2.5" />
                  Más Rentable
                </span>
              {/if}

              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider {opcion.maquina.tecnologia === 'digital' ? 'text-blue-500' : 'text-purple-500'}">
                  {opcion.maquina.tecnologia.toUpperCase()}
                </span>
                <h3 class="text-xs font-bold text-foreground leading-tight mt-0.5">
                  {opcion.maquina.id.includes("b1") ? "Offset 70x100" : opcion.maquina.id.includes("b2") ? "Offset 50x70" : "Prensa Digital SRA3"}
                </h3>
                <p class="text-[10px] text-muted-foreground mt-1">
                  Pliego: {opcion.maquina.pliegoAncho}x{opcion.maquina.pliegoAlto} mm • <strong>{opcion.imposicion.totalPosesPorPliego} poses</strong>
                </p>
              </div>

              <div class="mt-3 pt-2.5 border-t border-border/60">
                <div class="flex items-baseline justify-between">
                  <span class="text-[9px] text-muted-foreground uppercase font-semibold">Coste Total:</span>
                  <span class="text-xs font-bold text-foreground">{formatEuro(opcion.costeTotalEmpresa)}</span>
                </div>
                <div class="flex items-baseline justify-between mt-1">
                  <span class="text-[9px] text-muted-foreground font-semibold">PVP Sugerido:</span>
                  <span class="text-sm font-extrabold text-primary">{formatEuro(opcion.precioVentaSugerido)}</span>
                </div>
                <div class="text-[10px] font-mono text-muted-foreground text-right mt-0.5">
                  {opcion.precioUnitarioSugerido.toFixed(3)} €/ud
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- VISUALIZADOR 2D DEL PLIEGO DE IMPOSICIÓN -->
      <div class="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span class="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers class="w-4 h-4 text-primary" />
              Imposición Técnica en Pliego ({maquinaActiva.maquina.nombre})
            </span>
            <p class="text-[11px] text-muted-foreground">
              Formato pliego: {maquinaActiva.maquina.pliegoAncho} x {maquinaActiva.maquina.pliegoAlto} mm • Poses: {maquinaActiva.imposicion.posesColumnas} col x {maquinaActiva.imposicion.posesFilas} filas {maquinaActiva.imposicion.rotada90 ? '(Rotadas 90º)' : ''}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Aprovechamiento: {maquinaActiva.imposicion.aprovechamientoPorcentaje}%
            </span>
          </div>
        </div>

        <!-- Canvas SVG interactivo -->
        <div class="w-full flex items-center justify-center p-4 bg-muted/40 border border-border rounded-xl min-h-[200px] overflow-hidden">
          <svg
            viewBox={`0 0 ${maquinaActiva.maquina.pliegoAncho} ${maquinaActiva.maquina.pliegoAlto}`}
            class="w-full max-h-[220px] drop-shadow-md select-none transition-all"
          >
            <!-- Pliego de papel (Fondo blanco) -->
            <rect
              x="0"
              y="0"
              width={maquinaActiva.maquina.pliegoAncho}
              height={maquinaActiva.maquina.pliegoAlto}
              fill="white"
              stroke="#94a3b8"
              stroke-width="2"
            />

            <!-- Franja técnica de Pinza de arrastre (Área no imprimible) -->
            {#if maquinaActiva.maquina.pinzaMm > 0}
              <rect
                x="0"
                y={maquinaActiva.maquina.pliegoAlto - maquinaActiva.maquina.pinzaMm}
                width={maquinaActiva.maquina.pliegoAncho}
                height={maquinaActiva.maquina.pinzaMm}
                fill="rgba(239, 68, 68, 0.15)"
                stroke="rgba(239, 68, 68, 0.4)"
                stroke-width="1"
                stroke-dasharray="4"
              />
              <text
                x="15"
                y={maquinaActiva.maquina.pliegoAlto - 3}
                font-size="10"
                fill="#ef4444"
                font-weight="bold"
              >
                PINZA DE MÁQUINA ({maquinaActiva.maquina.pinzaMm} mm)
              </text>
            {/if}

            <!-- Poses montadas -->
            {#each Array(maquinaActiva.imposicion.posesFilas) as _, fila}
              {#each Array(maquinaActiva.imposicion.posesColumnas) as _, col}
                {@const posX = maquinaActiva.maquina.margenLateralMm + col * (maquinaActiva.imposicion.anchoPoseConSangre + 3)}
                {@const posY = 6 + fila * (maquinaActiva.imposicion.altoPoseConSangre + 3)}
                <g>
                  <!-- Sangre -->
                  <rect
                    x={posX}
                    y={posY}
                    width={maquinaActiva.imposicion.anchoPoseConSangre}
                    height={maquinaActiva.imposicion.altoPoseConSangre}
                    fill="rgba(59, 130, 246, 0.12)"
                    stroke="#3b82f6"
                    stroke-width="1.5"
                    rx="1"
                  />
                  <!-- Línea de corte neta -->
                  <rect
                    x={posX + sangreMm}
                    y={posY + sangreMm}
                    width={geometria.anchoAbierto}
                    height={geometria.altoAbierto}
                    fill="none"
                    stroke="#1d4ed8"
                    stroke-width="0.8"
                    stroke-dasharray="2"
                  />
                </g>
              {/each}
            {/each}
          </svg>
        </div>

        <!-- Ficha técnica rápida del pliego -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/20 border border-border/70 rounded-xl text-xs">
          <div>
            <span class="text-muted-foreground text-[10px] block">Pliegos Netos:</span>
            <span class="font-bold text-foreground">{maquinaActiva.pliegosNetos.toLocaleString()} pl.</span>
          </div>
          <div>
            <span class="text-muted-foreground text-[10px] block">Mermas (Arranque + Tirada):</span>
            <span class="font-bold text-amber-600">{maquinaActiva.mermasArranque + maquinaActiva.mermasTirada + maquinaActiva.mermasAcabados} pl.</span>
          </div>
          <div>
            <span class="text-muted-foreground text-[10px] block">Total Pliegos Brutos:</span>
            <span class="font-bold text-foreground">{maquinaActiva.totalPliegosBrutos.toLocaleString()} pl.</span>
          </div>
          <div>
            <span class="text-muted-foreground text-[10px] block">Consumo de Papel:</span>
            <span class="font-bold text-foreground">{maquinaActiva.pesoPapelKg.toFixed(1)} kg ({formatEuro(maquinaActiva.costePapel)})</span>
          </div>
        </div>
      </div>

      <!-- TABLA DE ESCALADO DE PRECIOS POR VOLUMEN -->
      <div class="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Table class="w-4 h-4 text-primary" />
            <h3 class="text-xs font-bold uppercase tracking-wider text-foreground">
              Escalado de Precios por Volumen
            </h3>
          </div>
          <span class="text-[10px] text-muted-foreground">
            Curva de amortización unitaria en función de la tirada
          </span>
        </div>

        <div class="overflow-x-auto border border-border rounded-xl">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-muted/60 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <th class="p-2.5 pl-4">Cantidad</th>
                <th class="p-2.5">Máquina Óptima</th>
                <th class="p-2.5 text-right">Coste Fabril</th>
                <th class="p-2.5 text-right">Margen</th>
                <th class="p-2.5 text-right font-extrabold text-foreground">P.V.P. Total</th>
                <th class="p-2.5 text-right font-bold text-primary">Precio Unit.</th>
                <th class="p-2.5 text-center pr-4">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each tramosEscalado() as tramo}
                {@const esSeleccionado = tramo.cantidad === cantidadTirada}
                <tr class="hover:bg-accent/40 transition-colors {esSeleccionado ? 'bg-primary/5 font-semibold' : ''}">
                  <td class="p-2.5 pl-4 font-bold text-foreground">
                    {tramo.cantidad.toLocaleString()} uds
                  </td>
                  <td class="p-2.5">
                    <span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md {tramo.tecnologia === 'digital' ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'}">
                      {tramo.tecnologia}
                    </span>
                  </td>
                  <td class="p-2.5 text-right font-mono text-muted-foreground">
                    {formatEuro(tramo.costeTotal)}
                  </td>
                  <td class="p-2.5 text-right font-mono text-emerald-600">
                    +{formatEuro(tramo.margenEuros)}
                  </td>
                  <td class="p-2.5 text-right font-bold text-foreground font-mono">
                    {formatEuro(tramo.precioVentaSugerido)}
                  </td>
                  <td class="p-2.5 text-right font-extrabold text-primary font-mono text-sm">
                    {tramo.precioUnitario.toFixed(3)} €
                  </td>
                  <td class="p-2.5 text-center pr-4">
                    <button
                      type="button"
                      onclick={() => transferirPresupuesto(tramo)}
                      class="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors cursor-pointer"
                    >
                      Presupuestar
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- DESGLOSE INDUSTRIAL DETALLADO DE COSTES -->
      <div class="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs space-y-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Escandallo Detallado de Costes Fabriles ({maquinaActiva.maquina.nombre})
        </h3>

        <div class="space-y-2 text-xs divide-y divide-border/60">
          <div class="flex justify-between items-center pt-1.5 text-muted-foreground">
            <span>Materia prima (Papel {calculo.papel.nombre} {gramaje}g, {maquinaActiva.pesoPapelKg.toFixed(1)} kg):</span>
            <span class="font-bold text-foreground font-mono">{formatEuro(maquinaActiva.costePapel)}</span>
          </div>

          {#if maquinaActiva.maquina.tecnologia === "offset"}
            <div class="flex justify-between items-center pt-1.5 text-muted-foreground">
              <span>Preimpresión CTP ({colorImpresion === '4+4' ? 8 : 4} planchas térmicas):</span>
              <span class="font-bold text-foreground font-mono">{formatEuro(maquinaActiva.costePreimpresionPlanchas)}</span>
            </div>
            <div class="flex justify-between items-center pt-1.5 text-muted-foreground">
              <span>Puesta a punto / Ajuste de tinteros y registro ({maquinaActiva.maquina.tiempoArregloMinutos} min):</span>
              <span class="font-bold text-foreground font-mono">{formatEuro(maquinaActiva.costeArranqueMaquina)}</span>
            </div>
            <div class="flex justify-between items-center pt-1.5 text-muted-foreground">
              <span>Tirada Offset ({maquinaActiva.totalPliegosBrutos.toLocaleString()} pl. a {maquinaActiva.maquina.velocidadPliegosHora} pl/h + tinta):</span>
              <span class="font-bold text-foreground font-mono">{formatEuro(maquinaActiva.costeTiradaMaquina)}</span>
            </div>
          {:else}
            <div class="flex justify-between items-center pt-1.5 text-muted-foreground">
              <span>Clics de impresión digital ({maquinaActiva.totalPliegosBrutos.toLocaleString()} pl. SRA3):</span>
              <span class="font-bold text-foreground font-mono">{formatEuro(maquinaActiva.costeClicsDigital)}</span>
            </div>
            <div class="flex justify-between items-center pt-1.5 text-muted-foreground">
              <span>Arranque y RIP digital:</span>
              <span class="font-bold text-foreground font-mono">{formatEuro(maquinaActiva.costeArranqueMaquina + maquinaActiva.costeTiradaMaquina)}</span>
            </div>
          {/if}

          <div class="flex justify-between items-center pt-1.5 text-muted-foreground">
            <span>Corte y escuadrado en guillotina:</span>
            <span class="font-bold text-foreground font-mono">{formatEuro(maquinaActiva.costeGuillotinaCorte)}</span>
          </div>

          {#if maquinaActiva.costeAcabados > 0}
            <div class="flex justify-between items-center pt-1.5 text-muted-foreground">
              <span>Acabados y manipulados ({acabadosSeleccionados.length} procesos):</span>
              <span class="font-bold text-foreground font-mono">{formatEuro(maquinaActiva.costeAcabados)}</span>
            </div>
          {/if}

          <div class="flex justify-between items-center pt-2 text-muted-foreground">
            <span>Gastos Generales / Estructura (12%):</span>
            <span class="font-bold text-foreground font-mono">{formatEuro(maquinaActiva.gastosGenerales)}</span>
          </div>

          <div class="flex justify-between items-center pt-2 font-bold text-sm">
            <span class="text-foreground">Coste Total de Fabricación:</span>
            <span class="font-mono text-foreground">{formatEuro(maquinaActiva.costeTotalEmpresa)}</span>
          </div>

          <div class="flex justify-between items-center pt-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <span>Margen Comercial ({margenBeneficio}%):</span>
            <span class="font-mono">+{formatEuro(maquinaActiva.margenBeneficioEuros)}</span>
          </div>

          <div class="flex justify-between items-center pt-3 font-extrabold text-base text-primary border-t-2 border-primary/20">
            <span>PRECIO DE VENTA SUGERIDO (PVP):</span>
            <div class="text-right">
              <span class="font-mono text-xl">{formatEuro(maquinaActiva.precioVentaSugerido)}</span>
              <span class="text-xs text-muted-foreground block font-mono font-normal">({maquinaActiva.precioUnitarioSugerido.toFixed(3)} €/ud)</span>
            </div>
          </div>
        </div>
      </div>

    </div>

  </div>

</div>

<!-- Modal para emitir presupuesto a partir de los datos calculados -->
<NuevoPresupuestoModal
  abierto={modalPresupuestoAbierto}
  {workspace}
  datosIniciales={datosParaPresupuesto}
  onClose={() => {
    modalPresupuestoAbierto = false;
    datosParaPresupuesto = null;
  }}
  onCreated={() => {
    window.location.href = `/w/${workspace}/presupuestos`;
  }}
/>
