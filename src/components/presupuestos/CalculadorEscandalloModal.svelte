<!-- src/components/presupuestos/CalculadorEscandalloModal.svelte -->
<script lang="ts">
  import { 
    Cpu, 
    X, 
    Layers, 
    Check, 
    Sparkles, 
    Zap, 
    Percent, 
    FileText, 
    Clock, 
    ArrowRight,
    HelpCircle,
    Info,
    CheckCircle2
  } from "lucide-svelte";
  import { formatEuro } from "$lib/fiscal-utils";
  import { 
    PRODUCTOS_PRESET, 
    PAPELES_CATALOGO, 
    CATALOGO_ACABADOS, 
    calcularEscandalloCompleto,
    type ParametrosCalculo,
    type DesgloseCosteMaquina
  } from "$lib/escandallo-imprenta";

  let {
    abierto = false,
    onClose,
    onAplicar
  }: {
    abierto: boolean;
    onClose: () => void;
    onAplicar: (datos: {
      descripcion: string;
      cantidad: number;
      precioUnitario: number;
      costeEstimado: number;
      margenPorcentaje: number;
      maquinaSeleccionada: string;
      detallesTecnicos: string;
    }) => void;
  } = $props();

  // Estados del configurador
  let presetSeleccionadoId = $state("flyer-a5");
  let anchoMm = $state(148);
  let altoMm = $state(210);
  let sangreMm = $state(2);
  let cantidadTirada = $state(2500);
  let papelId = $state("estucado-mate");
  let gramaje = $state(135);
  let colorImpresion = $state<"4+4" | "4+0" | "1+1" | "1+0">("4+4");
  let acabadosSeleccionados = $state<string[]>([]);
  let margenBeneficio = $state(35); // 35% de markup

  // Máquina forzada manualmente o automática
  let maquinaSeleccionadaId = $state<string | null>(null);

  // Al cambiar preset de producto
  function seleccionarPreset(presetId: string) {
    presetSeleccionadoId = presetId;
    const preset = PRODUCTOS_PRESET.find(p => p.id === presetId);
    if (preset) {
      anchoMm = preset.ancho;
      altoMm = preset.alto;
      sangreMm = preset.sangre;
      if (!preset.gramajesSugeridos.includes(gramaje)) {
        gramaje = preset.gramajesSugeridos[0] || 135;
      }
    }
  }

  function toggleAcabado(id: string) {
    if (acabadosSeleccionados.includes(id)) {
      acabadosSeleccionados = acabadosSeleccionados.filter(a => a !== id);
    } else {
      acabadosSeleccionados = [...acabadosSeleccionados, id];
    }
  }

  // Ejecución reactiva del motor de cálculo en tiempo real
  let calculo = $derived(
    calcularEscandalloCompleto({
      cantidadTirada: Math.max(1, Number(cantidadTirada) || 100),
      anchoMm: Number(anchoMm) || 148,
      altoMm: Number(altoMm) || 210,
      sangreMm: Number(sangreMm) || 2,
      papelId,
      gramaje: Number(gramaje) || 135,
      colorImpresion,
      acabadosIds: acabadosSeleccionados,
      margenBeneficioPorcentaje: Number(margenBeneficio) || 35
    })
  );

  // Máquina activa para visualizar imposición y desglose
  let maquinaActiva = $derived(
    maquinaSeleccionadaId 
      ? (calculo.opcionesMaquinas.find(m => m.maquina.id === maquinaSeleccionadaId) || calculo.maquinaOptima)
      : calculo.maquinaOptima
  );

  function aplicarAlPresupuesto() {
    const maq = maquinaActiva;
    const papelActual = calculo.papel;
    const presetActual = PRODUCTOS_PRESET.find(p => p.id === presetSeleccionadoId);
    const nombreProd = presetActual ? presetActual.nombre.split("(")[0].trim() : "Trabajo Gráfico a Medida";

    const acabadosTxt = acabadosSeleccionados.length > 0
      ? ` + ${acabadosSeleccionados.map(id => CATALOGO_ACABADOS[id]?.nombre).join(", ")}`
      : "";

    const descripcion = `${nombreProd} — ${anchoMm}x${altoMm} mm, ${papelActual.nombre} ${gramaje}g, Impresión ${colorImpresion}${acabadosTxt}.`;

    const detalles = `[ESCANDALLO TÉCNICO]
• Máquina: ${maq.maquina.nombre} (${maq.maquina.tecnologia.toUpperCase()})
• Pliego de máquina: ${maq.maquina.pliegoAncho}x${maq.maquina.pliegoAlto} mm
• Imposición: ${maq.imposicion.totalPosesPorPliego} poses/pliego (${maq.imposicion.posesColumnas}x${maq.imposicion.posesFilas}${maq.imposicion.rotada90 ? ', rotada 90º' : ''})
• Aprovechamiento pliego: ${maq.imposicion.aprovechamientoPorcentaje}%
• Pliegos netos: ${maq.pliegosNetos.toLocaleString()} | Mermas: ${maq.mermasArranque + maq.mermasTirada + maq.mermasAcabados} | Total pliegos: ${maq.totalPliegosBrutos.toLocaleString()}
• Peso papel: ${maq.pesoPapelKg.toFixed(1)} kg (${formatEuro(maq.costePapel)})
• Coste Industrial: ${formatEuro(maq.costeIndustrialTotal)} | Margen: ${maq.margenBeneficioEuros.toFixed(2)}€ (${margenBeneficio}%)`;

    onAplicar({
      descripcion,
      cantidad: cantidadTirada,
      precioUnitario: maq.precioUnitarioSugerido,
      costeEstimado: maq.costeTotalEmpresa,
      margenPorcentaje: margenBeneficio,
      maquinaSeleccionada: maq.maquina.nombre,
      detallesTecnicos: detalles
    });

    onClose();
  }
</script>

{#if abierto}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/80 backdrop-blur-xs font-sans animate-fade-in">
    <div class="bg-card text-card-foreground border border-border rounded-2xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-5xl shadow-2xl relative max-h-[94vh] overflow-y-auto">
      
      <!-- Cabecera -->
      <div class="flex items-center justify-between border-b border-border/80 pb-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Cpu class="w-5 h-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold tracking-tight text-foreground">Motor de Escandallo e Imposición Técnica</h2>
              <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                MIS / ERP Gráfico
              </span>
            </div>
            <p class="text-xs text-muted-foreground">
              Algoritmo de imposición 2D, optimización de pliegos, cálculo de mermas y punto de corte Offset vs Digital.
            </p>
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

      <!-- Grid de 2 Columnas: Izquierda Controles / Derecha Visualización & Comparador -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- COLUMNA IZQUIERDA: PARÁMETROS DE FABRICACIÓN (5 columnas) -->
        <div class="lg:col-span-5 space-y-4 pr-0 lg:pr-2">
          
          <!-- 1. Preset de Producto -->
          <div>
            <label class="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Producto Gráfico
            </label>
            <div class="grid grid-cols-2 gap-1.5">
              {#each PRODUCTOS_PRESET as preset}
                <button
                  type="button"
                  onclick={() => seleccionarPreset(preset.id)}
                  class="text-left px-2.5 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer truncate {presetSeleccionadoId === preset.id ? 'bg-primary/10 border-primary text-primary font-semibold shadow-xs' : 'bg-muted/40 border-border hover:bg-accent text-foreground'}"
                >
                  {preset.nombre.split("(")[0]}
                </button>
              {/each}
            </div>
          </div>

          <!-- 2. Dimensiones y Sangrado -->
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Ancho (mm)
              </label>
              <input
                type="number"
                bind:value={anchoMm}
                min="30"
                max="1000"
                class="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Alto (mm)
              </label>
              <input
                type="number"
                bind:value={altoMm}
                min="30"
                max="1400"
                class="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
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
                class="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <!-- 3. Cantidad de Tirada -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tirada / Ejemplares
              </label>
              <span class="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                {cantidadTirada.toLocaleString()} uds
              </span>
            </div>
            <input
              type="number"
              bind:value={cantidadTirada}
              min="1"
              step="100"
              class="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-sm font-bold text-foreground focus:ring-1 focus:ring-primary outline-none mb-2"
            />
            <div class="flex items-center gap-1.5 flex-wrap">
              {#each [250, 500, 1000, 2500, 5000, 10000] as rapido}
                <button
                  type="button"
                  onclick={() => (cantidadTirada = rapido)}
                  class="text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all cursor-pointer {cantidadTirada === rapido ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground'}"
                >
                  {rapido.toLocaleString()}
                </button>
              {/each}
            </div>
          </div>

          <!-- 4. Papel & Gramaje -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Soporte / Papel
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
                Gramaje (g/m²)
              </label>
              <select
                bind:value={gramaje}
                class="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                {#each [90, 115, 135, 150, 170, 200, 250, 300, 350] as g}
                  <option value={g}>{g} g/m²</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- 5. Tintas / Color -->
          <div>
            <label class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Colores & Caras
            </label>
            <div class="grid grid-cols-4 gap-1.5">
              {#each [
                { id: "4+4", label: "4+4 (Color 2C)" },
                { id: "4+0", label: "4+0 (Color 1C)" },
                { id: "1+1", label: "1+1 (BN 2C)" },
                { id: "1+0", label: "1+0 (BN 1C)" }
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

          <!-- 6. Acabados y Manipulados -->
          <div>
            <label class="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Acabados Opcionales
            </label>
            <div class="space-y-1 max-h-32 overflow-y-auto pr-1">
              {#each Object.values(CATALOGO_ACABADOS) as ac}
                <label class="flex items-center justify-between p-1.5 rounded-lg border border-border/70 hover:bg-accent cursor-pointer text-xs">
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={acabadosSeleccionados.includes(ac.id)}
                      onchange={() => toggleAcabado(ac.id)}
                      class="rounded border-border text-primary focus:ring-primary"
                    />
                    <span class="font-medium text-foreground text-[11px]">{ac.nombre}</span>
                  </div>
                  <span class="text-[10px] text-muted-foreground font-mono">+{ac.tarifaFijaArranque}€</span>
                </label>
              {/each}
            </div>
          </div>

          <!-- 7. Margen Comercial (Markup) -->
          <div class="bg-muted/30 border border-border p-3 rounded-2xl">
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
            <div class="flex justify-between text-[9px] text-muted-foreground mt-0.5">
              <span>10% (Coste mínimo)</span>
              <span>35% (Estándar)</span>
              <span>70%+ (Alta rentabilidad)</span>
            </div>
          </div>

        </div>

        <!-- COLUMNA DERECHA: RESULTADOS, IMPOSICIÓN VISUAL Y COMPARADOR (7 columnas) -->
        <div class="lg:col-span-7 space-y-4">
          
          <!-- Comparativa de Máquinas y Crossover -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap class="w-3.5 h-3.5 text-amber-500" />
                Punto de Corte & Enrutamiento de Máquina
              </h3>
              <span class="text-[10px] font-medium text-muted-foreground italic">
                {calculo.puntoCorteCrossover}
              </span>
            </div>

            <!-- Tarjetas de Máquinas -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {#each calculo.opcionesMaquinas as opcion}
                {@const esActiva = maquinaActiva.maquina.id === opcion.maquina.id}
                <button
                  type="button"
                  onclick={() => (maquinaSeleccionadaId = opcion.maquina.id)}
                  class="text-left p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between {opcion.esRecomendada ? 'border-emerald-500/50 bg-emerald-500/5 shadow-xs' : 'border-border bg-card hover:bg-accent/40'} {esActiva ? 'ring-2 ring-primary' : ''}"
                >
                  {#if opcion.esRecomendada}
                    <span class="absolute -top-2.5 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider shadow-xs flex items-center gap-1">
                      <Sparkles class="w-2.5 h-2.5" />
                      Óptima
                    </span>
                  {/if}

                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider {opcion.maquina.tecnologia === 'digital' ? 'text-blue-500' : 'text-purple-500'}">
                      {opcion.maquina.tecnologia.toUpperCase()}
                    </span>
                    <h4 class="text-xs font-bold text-foreground leading-tight mt-0.5">
                      {opcion.maquina.id.includes("b1") ? "Offset 70x100" : opcion.maquina.id.includes("b2") ? "Offset 50x70" : "Digital SRA3"}
                    </h4>
                    <p class="text-[10px] text-muted-foreground mt-1">
                      {opcion.imposicion.totalPosesPorPliego} poses/pliego • {opcion.imposicion.aprovechamientoPorcentaje}%
                    </p>
                  </div>

                  <div class="mt-3 pt-2 border-t border-border/60">
                    <div class="flex items-baseline justify-between">
                      <span class="text-[9px] text-muted-foreground uppercase font-semibold">Coste Total:</span>
                      <span class="text-sm font-bold text-foreground">{formatEuro(opcion.costeTotalEmpresa)}</span>
                    </div>
                    <div class="flex items-baseline justify-between mt-0.5">
                      <span class="text-[9px] text-muted-foreground">PVP sugerido:</span>
                      <span class="text-xs font-semibold text-primary">{formatEuro(opcion.precioVentaSugerido)}</span>
                    </div>
                    <div class="text-[9px] text-muted-foreground mt-0.5 text-right font-mono">
                      {opcion.precioUnitarioSugerido.toFixed(3)} €/ud
                    </div>
                  </div>
                </button>
              {/each}
            </div>
          </div>

          <!-- ESQUEMA VISUAL DE IMPOSICIÓN 2D EN PLIEGO -->
          <div class="bg-muted/40 border border-border p-4 rounded-2xl">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <Layers class="w-4 h-4 text-primary" />
                Imposición Técnica en Pliego ({maquinaActiva.maquina.pliegoAncho}x{maquinaActiva.maquina.pliegoAlto} mm)
              </span>
              <span class="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                Aprovechamiento: {maquinaActiva.imposicion.aprovechamientoPorcentaje}% ({maquinaActiva.imposicion.totalPosesPorPliego} poses)
              </span>
            </div>

            <!-- Canvas SVG del Pliego a Escala -->
            <div class="w-full flex items-center justify-center p-3 bg-background border border-border rounded-xl overflow-hidden min-h-[140px]">
              <svg
                viewBox={`0 0 ${maquinaActiva.maquina.pliegoAncho} ${maquinaActiva.maquina.pliegoAlto}`}
                class="w-full max-h-[170px] drop-shadow-sm select-none"
              >
                <!-- Pliego Matriz (Fondo Blanco de Papel) -->
                <rect
                  x="0"
                  y="0"
                  width={maquinaActiva.maquina.pliegoAncho}
                  height={maquinaActiva.maquina.pliegoAlto}
                  fill="white"
                  stroke="#cbd5e1"
                  stroke-width="2"
                />

                <!-- Zona de Pinza de Máquina (Área no imprimible / Técnica en rojo claro) -->
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
                    x="10"
                    y={maquinaActiva.maquina.pliegoAlto - 3}
                    font-size="10"
                    fill="#ef4444"
                    font-weight="bold"
                  >
                    PINZA MÁQUINA ({maquinaActiva.maquina.pinzaMm} mm)
                  </text>
                {/if}

                <!-- Cuadrícula de Poses Imprecisas/Montadas -->
                {#each Array(maquinaActiva.imposicion.posesFilas) as _, fila}
                  {#each Array(maquinaActiva.imposicion.posesColumnas) as _, col}
                    {@const posX = maquinaActiva.maquina.margenLateralMm + col * (maquinaActiva.imposicion.anchoPoseConSangre + 3)}
                    {@const posY = 5 + fila * (maquinaActiva.imposicion.altoPoseConSangre + 3)}
                    <g>
                      <!-- Pose con Sangre -->
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
                      <!-- Línea de corte interior sin sangre -->
                      <rect
                        x={posX + sangreMm}
                        y={posY + sangreMm}
                        width={anchoMm}
                        height={altoMm}
                        fill="none"
                        stroke="#2563eb"
                        stroke-width="0.8"
                        stroke-dasharray="2"
                      />
                    </g>
                  {/each}
                {/each}
              </svg>
            </div>

            <!-- Datos técnicos del pliego -->
            <div class="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground mt-2">
              <div>
                <span class="font-semibold text-foreground">Pliegos netos:</span> {maquinaActiva.pliegosNetos.toLocaleString()}
              </div>
              <div>
                <span class="font-semibold text-foreground">Mermas:</span> {maquinaActiva.mermasArranque + maquinaActiva.mermasTirada + maquinaActiva.mermasAcabados} pl.
              </div>
              <div>
                <span class="font-semibold text-foreground">Total papel:</span> {maquinaActiva.totalPliegosBrutos.toLocaleString()} pl.
              </div>
              <div>
                <span class="font-semibold text-foreground">Peso:</span> {maquinaActiva.pesoPapelKg.toFixed(1)} kg
              </div>
            </div>
          </div>

          <!-- TABLA DE ESCANDALLO DE COSTES INDUSTRIALES -->
          <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div class="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Desglose Industrial de Costes ({maquinaActiva.maquina.nombre})
              </span>
              <span class="text-[10px] font-bold text-foreground">
                Tiempo estimado: ~{maquinaActiva.tiempoTotalProduccionMinutos} min
              </span>
            </div>

            <div class="p-3.5 space-y-1.5 text-xs">
              <div class="flex justify-between items-center text-muted-foreground">
                <span>Materia prima (Papel {calculo.papel.nombre} {gramaje}g, {maquinaActiva.pesoPapelKg.toFixed(1)} kg):</span>
                <span class="font-medium text-foreground">{formatEuro(maquinaActiva.costePapel)}</span>
              </div>

              {#if maquinaActiva.maquina.tecnologia === "offset"}
                <div class="flex justify-between items-center text-muted-foreground">
                  <span>Preimpresión CTP ({colorImpresion === '4+4' ? 8 : 4} planchas térmicas):</span>
                  <span class="font-medium text-foreground">{formatEuro(maquinaActiva.costePreimpresionPlanchas)}</span>
                </div>
                <div class="flex justify-between items-center text-muted-foreground">
                  <span>Puesta a punto y calibración de máquina ({maquinaActiva.maquina.tiempoArregloMinutos} min):</span>
                  <span class="font-medium text-foreground">{formatEuro(maquinaActiva.costeArranqueMaquina)}</span>
                </div>
                <div class="flex justify-between items-center text-muted-foreground">
                  <span>Tirada Offset ({maquinaActiva.totalPliegosBrutos.toLocaleString()} pl. a {maquinaActiva.maquina.velocidadPliegosHora} pl/h + tintas):</span>
                  <span class="font-medium text-foreground">{formatEuro(maquinaActiva.costeTiradaMaquina)}</span>
                </div>
              {:else}
                <div class="flex justify-between items-center text-muted-foreground">
                  <span>Clics de impresión digital ({maquinaActiva.totalPliegosBrutos.toLocaleString()} pl. SRA3):</span>
                  <span class="font-medium text-foreground">{formatEuro(maquinaActiva.costeClicsDigital)}</span>
                </div>
                <div class="flex justify-between items-center text-muted-foreground">
                  <span>Puesta en marcha y RIP digital:</span>
                  <span class="font-medium text-foreground">{formatEuro(maquinaActiva.costeArranqueMaquina + maquinaActiva.costeTiradaMaquina)}</span>
                </div>
              {/if}

              <div class="flex justify-between items-center text-muted-foreground">
                <span>Corte y escuadrado en guillotina:</span>
                <span class="font-medium text-foreground">{formatEuro(maquinaActiva.costeGuillotinaCorte)}</span>
              </div>

              {#if maquinaActiva.costeAcabados > 0}
                <div class="flex justify-between items-center text-muted-foreground">
                  <span>Acabados y manipulados ({acabadosSeleccionados.length} procesos):</span>
                  <span class="font-medium text-foreground">{formatEuro(maquinaActiva.costeAcabados)}</span>
                </div>
              {/if}

              <div class="flex justify-between items-center text-muted-foreground pt-1 border-t border-border/50">
                <span>Gastos Generales / Estructura (12%):</span>
                <span class="font-medium text-foreground">{formatEuro(maquinaActiva.gastosGenerales)}</span>
              </div>

              <div class="flex justify-between items-center pt-2 border-t border-border font-bold">
                <span class="text-foreground">Coste Total de Fabricación:</span>
                <span class="text-foreground font-mono">{formatEuro(maquinaActiva.costeTotalEmpresa)}</span>
              </div>

              <div class="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Margen de Ganancia Comercial ({margenBeneficio}%):</span>
                <span class="font-mono">+{formatEuro(maquinaActiva.margenBeneficioEuros)}</span>
              </div>
            </div>

            <!-- RESULTADO COMERCIAL FINAL (PVP) -->
            <div class="p-4 bg-primary/10 border-t border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span class="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  Precio de Venta Sugerido (P.V.P.)
                </span>
                <div class="flex items-baseline gap-2">
                  <span class="text-2xl font-black text-foreground">
                    {formatEuro(maquinaActiva.precioVentaSugerido)}
                  </span>
                  <span class="text-xs text-muted-foreground font-mono">
                    ({maquinaActiva.precioUnitarioSugerido.toFixed(3)} €/ud)
                  </span>
                </div>
                <span class="text-[10px] text-muted-foreground">
                  Coste unitario: {maquinaActiva.costeUnitario.toFixed(3)} €/ud • Beneficio estimado: {formatEuro(maquinaActiva.margenBeneficioEuros)}
                </span>
              </div>

              <button
                type="button"
                onclick={aplicarAlPresupuesto}
                class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow-xs cursor-pointer select-none"
              >
                <span>Volcar a Presupuesto</span>
                <ArrowRight class="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  </div>
{/if}
