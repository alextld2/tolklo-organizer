<script lang="ts">
  import { slide, fade } from 'svelte/transition';

  export let workspace: string = "";
  export let clientesExistentes: string[] = [];
  export let proximoNumParte: string = ""; 

  // --- ESTADO INTERNO DEL WIZARD Y NOTIFICACIONES ---
  let pasoActual = 1;
  let mensajeNotificacion = "";
  let tipoNotificacion = ""; // 'success' o 'error'
  let guardandoDato = false;

  // --- PASO 1: ADM & LOGÍSTICA ---
  $: numParte = proximoNumParte; 
  let cliente = "";
  let comercial = "Marcos"; 
  let fechaSalida = "";
  let tipoEntrega = "taller"; 
  let direccionEntrega = "";
  let albaranAnonimo = false;

  // Buscador predictivo de clientes
  let mostrarSugerencias = false;
  $: sugerenciasFiltradas = cliente.trim() !== "" 
    ? clientesExistentes.filter(c => c.toLowerCase().includes(cliente.toLowerCase()) && c.toLowerCase() !== cliente.toLowerCase())
    : [];

  function seleccionarCliente(nombre: string) {
    cliente = nombre;
    mostrarSugerencias = false;
  }

  const comerciales = ["Marcos", "Maria Jesus", "Jesus", "Alfonso"];

  // --- PASO 2: PRODUCCIÓN & DESGLOSE ---
  let area = "DIGITAL"; 
  let descripcionGeneral = "";
  let desgloses: Array<{ descripcionProducto: string; cantidad: number | null }> = [
    { descripcionProducto: "", cantidad: null }
  ];

  function agregarFilaDesglose() {
    desgloses = [...desgloses, { descripcionProducto: "", cantidad: null }];
  }
  function eliminarFilaDesglose(index: number) {
    if (desgloses.length > 1) desgloses = desgloses.filter((_, i) => i !== index);
  }

  // --- PASO 3: FICHA TÉCNICA (CAMPOS LIMPIOS POR DEFECTO) ---
  let papelPortada = "";
  let colorPortada = "";
  let papelInterior = "";
  let colorInterior = "";

  let tipoTintaPortada = "estandar"; 
  let listaPantonesPortada: string[] = [];
  let inputPantonePortada = "";

  let tipoTintaInterior = "estandar"; 
  let listaPantonesInterior: string[] = [];
  let inputPantoneInterior = "";

  $: requiereConfigurarTintasPortada = ["1+0", "1+1", "2+2", "4+1"].includes(colorPortada);
  $: requiereConfigurarTintasInterior = ["1+1", "2+2", "4+1"].includes(colorPortada) || colorInterior === "Pantone";

  function añadirPantonePortada() {
    if (inputPantonePortada.trim() !== "") {
      listaPantonesPortada = [...listaPantonesPortada, inputPantonePortada.trim().toUpperCase()];
      inputPantonePortada = "";
    }
  }
  function eliminarPantonePortada(idx: number) {
    listaPantonesPortada = listaPantonesPortada.filter((_, i) => i !== idx);
  }

  function añadirPantoneInterior() {
    if (inputPantoneInterior.trim() !== "") {
      listaPantonesInterior = [...listaPantonesInterior, inputPantoneInterior.trim().toUpperCase()];
      inputPantoneInterior = "";
    }
  }
  function eliminarPantoneInterior(idx: number) {
    listaPantonesInterior = listaPantonesInterior.filter((_, i) => i !== idx);
  }

  let encuadernacion = { rustica: false, cosida: false, contracolado: false, fresada: false, colapur: false, solapa: false };
  let espiralColor = "";
  let wireOColor = "";
  let acabados = { hendido: false, troquelado: false, goma: false, plegado: false, perforado: false, pegado: false, agujero: false, enumerado: false };
  
  let grapadoTipo = "Normal";
  let barnizUVTipo = "No requiere";
  let estampingTipo = "No requiere";

  let laminadoTipo = "1 cara"; 
  let tipoLaminadoCara1 = { brillo: false, sandy: false, softTouch: false, antiAranazos: false, mate: false };
  let tipoLaminadoCara2 = { brillo: false, sandy: false, softTouch: false, antiAranazos: false, mate: false };

  const areasImpresion = ["DIGITAL", "PLOTTER", "MIMAKI", "DISEÑO", "OFFSET", "OPX", "DTF", "SUBCONTRATA"];
  const opcionesColor = ["4+0", "4+4", "1+0", "1+1", "2+2", "4+1"];
  const opcionesGramaje = ["90 gr Offset", "115 gr Brillo", "135 gr MATE", "135 gr Brillo", "170 gr MATE", "250 gr MATE", "300 gr Brillo", "350 gr MATE"];

  function irAlSiguiente() { if (pasoActual < 3) pasoActual += 1; }
  function irAlAnterior() { if (pasoActual > 1) pasoActual -= 1; }

  // PROCESAR ENVÍO CON INCREMENTO REACTIVO AUTOMÁTICO (RUTA EXACTA /api/tarea/create)
  async function procesarEnvio() {
    if (!cliente || !fechaSalida) {
      mensajeNotificacion = "Faltan campos obligatorios por rellenar (Cliente o Fecha Salida).";
      tipoNotificacion = "error";
      pasoActual = 1;
      return;
    }

    guardandoDato = true;
    mensajeNotificacion = "";

    try {
      // 1. Enviamos el objeto completo incluyendo la Ficha Técnica del Paso 3
      const response = await fetch(`/api/tarea/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numParte, workspaceId: workspace, cliente, descripcionGeneral,
          comercial, fechaSalida, area, desgloses,
          papelPortada, colorPortada, papelInterior, colorInterior, espiralColor, wireOColor,
          grapadoTipo, barnizUVTipo, estampingTipo, laminadoTipo,
          encuadernacion, acabados, tipoLaminadoCara1, tipoLaminadoCara2
        })
      });

      if (!response.ok) {
        const datosError = await response.json().catch(() => ({}));
        throw new Error(datosError.error || "Error indeterminado en el servidor.");
      }

      // 2. 🔥 EL NUEVO FLUJO MÁSTER: Abrimos la ruta del PDF real dinámico
      window.open(`/w/${workspace}/parte/${numParte}/print`, '_blank');

      mensajeNotificacion = `¡Parte #${numParte} guardado con éxito en Turso!`;
      tipoNotificacion = "success";

      // 3. Incrementamos el contador reactivo en caliente
      const fragmentos = numParte.split('-');
      if (fragmentos[1]) {
        const numeroActual = parseInt(fragmentos[1], 10);
        const proximoNumero = numeroActual + 1;
        proximoNumParte = `${fragmentos[0]}-${proximoNumero.toString().padStart(4, '0')}`;
      }

      // 4. Reseteamos el formulario a virgen
      cliente = ""; descripcionGeneral = ""; fechaSalida = ""; direccionEntrega = ""; albaranAnonimo = false; tipoEntrega = "taller"; area = "DIGITAL";
      desgloses = [{ descripcionProducto: "", cantidad: null }];
      papelPortada = ""; colorPortada = ""; papelInterior = ""; colorInterior = "";
      listaPantonesPortada = []; listaPantonesInterior = [];
      encuadernacion = { rustica: false, cosida: false, contracolado: false, fresada: false, colapur: false, solapa: false };
      acabados = { hendido: false, troquelado: false, goma: false, plegado: false, perforado: false, pegado: false, agujero: false, enumerado: false };
      espiralColor = ""; wireOColor = ""; grapadoTipo = "Normal"; barnizUVTipo = "No requiere"; estampingTipo = "No requiere"; laminadoTipo = "1 cara";

      pasoActual = 1;

    } catch (err: any) {
      mensajeNotificacion = `${err.message}`;
      tipoNotificacion = "error";
    } finally {
      guardandoDato = false;
      setTimeout(() => { mensajeNotificacion = ""; }, 5000);
    }
  }

  function lanzarVentanaImpresionA3() {
    const ventanaImpresion = window.open("", "_blank");
    if (!ventanaImpresion) return;

    const colorBoli = "#0038a8";
    const txtColorPortadaPrint = tipoTintaPortada === 'pantone' && listaPantonesPortada.length > 0
      ? `PANTONE (${listaPantonesPortada.join(' / ')})` : (colorPortada || '_________________');

    const txtColorInteriorPrint = tipoTintaInterior === 'pantone' && listaPantonesInterior.length > 0
      ? `PANTONE (${listaPantonesInterior.join(' / ')})` : (colorInterior || '_________________');

    const filasDesgloseHTML = desgloses
      .map(d => d.descripcionProducto ? `
        <div style="display: grid; grid-template-columns: 1fr 140px; border-bottom: 1px solid #000; padding: 5px 8px; font-weight: bold; text-transform: uppercase; color: ${colorBoli};">
          <div>${d.descripcionProducto}</div>
          <div style="text-align: right; font-family: monospace; font-size:13px;">${d.cantidad ? d.cantidad.toLocaleString() : '0'}</div>
        </div>
      ` : '')
      .join('');

    ventanaImpresion.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Parte Aeroprint #${numParte}</title>
        <style>
          @page { size: A3 landscape; margin: 0; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 8mm; color: black; background: white; font-size: 11px; box-sizing: border-box; }
          .documento-a3 { display: grid; grid-template-columns: 1fr 1fr; gap: 14mm; width: 100%; height: 100%; }
          .hoja-taller { display: flex; flex-direction: column; justify-content: flex-start; gap: 9px; height: 280mm; box-sizing: border-box; }
          .box-borde { border: 1.5px solid black; padding: 7px; box-sizing: border-box; }
          .label-mini { font-size: 8.5px; font-weight: bold; text-transform: uppercase; color: #444; display: block; margin-bottom: 2px; }
          .box-pliegos-lineal { border: 1.5px solid black; padding: 6px 10px; background: white; }
          .grid-pliegos { display: grid; grid-template-columns: 1fr 1fr; gap-x: 25px; gap-y: 2px; }
          .fila-pliego-linea { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e5e5; padding: 2px 0; font-size: 9px; font-weight: bold; }
          .chk-item { display: flex; align-items: center; gap: 5px; font-weight: bold; font-size: 9.5px; text-transform: uppercase; }
          .chk-box { width: 13px; height: 13px; border: 1.5px solid black; display: inline-block; text-align: center; line-height: 11px; font-weight: 900; font-size: 10px; background: white; flex-shrink: 0; }
          .flex-row-box { display: flex; gap: 8px; width: 100%; }
          .flex-1 { flex: 1; }
          .tabla-prod { border: 1.5px solid black; flex: 1; min-height: 140px; display: flex; flex-direction: column; }
          .tab-header { display: grid; grid-template-columns: 1fr 140px; background: #f2f2f2; font-weight: bold; font-size: 9.5px; padding: 5px 8px; border-bottom: 1.5px solid black; text-transform: uppercase; }
          .tab-operarios { width: 100%; border-collapse: collapse; border: 1.5px solid black; }
          .tab-operarios th { background: #f2f2f2; font-size: 8.5px; font-weight: bold; border: 1px solid black; padding: 4.5px; text-transform: uppercase; }
          .tab-operarios td { border: 1px solid black; padding: 4.5px; text-align: center; font-weight: bold; font-size: 9.5px; }
          .box-cajas-matriz-taller { border: 1.5px solid black; padding: 8px 12px; background: white; }
          .caja-vacia-escribir { border: 1px solid black; width: 35px; height: 16px; display: inline-block; background: white; }
          .caja-vacia-unids { border: 1px solid black; width: 75px; height: 16px; display: inline-block; background: white; }
          .fila-matriz-cajas { display: flex; align-items: center; gap: 5px; font-size: 9.5px; font-weight: bold; color: #333; }
          .box-observaciones-gigante { border: 1.5px solid black; padding: 10px; flex: 1; background: white; }
        </style>
      </head>
      <body>
        <div class="documento-a3">
          <div class="hoja-taller">
            <div style="border-bottom: 2px solid black; padding-bottom: 3px; display: flex; justify-content: space-between; align-items: end;">
              <div>
                <h2 style="font-size: 11.5px; font-weight: 900; text-transform: uppercase; margin: 0;">HOJA DE MANIPULADO Y CONTROL</h2>
                <p style="font-size: 7.5px; font-weight: bold; text-transform: uppercase; color: #555; margin: 1px 0 0 0;">Uso exclusivo para operarios de planta de producción</p>
              </div>
              <span style="font-size: 8px; font-weight: bold; border: 1px dashed black; padding: 1px 5px;">Mesa Técnica</span>
            </div>
            <div class="box-pliegos-lineal">
              <span class="label-mini" style="font-weight: 900; border-bottom: 1.5px solid black; padding-bottom: 2px; margin-bottom: 4px;">Control de Pliegos de Folletos / Portadas</span>
              <div class="grid-pliegos">
                ${Array.from({ length: 16 }).map((_, i) => `<div class="fila-pliego-linea"><span style="color: #000; width: 55px; font-size:8.5px;">PLIEGO ${i + 1}</span><span style="color: #666; font-size: 8.5px; flex-grow: 1; text-align: right; padding-right: 5px;">Tamaño: _______________________ mm</span><span style="color: #666; font-size: 8.5px; width: 65px; text-align: right;">Págs: ________</span></div>`).join('')}
              </div>
            </div>
            <table class="tab-operarios">
              <thead><tr><th style="width: 35%; text-align: left; padding-left: 8px;">Fase de Acabado</th><th style="width: 30%;">Cantidad Confección</th><th style="width: 35%;">Operario / Firma</th></tr></thead>
              <tbody>
                <tr><td style="text-align: left; padding-left: 8px; font-weight: bold; color: #333; font-size:8.5px;">PLASTIFICADORA</td><td style="color: #ddd;">___________________________</td><td style="color: #ddd;">___________________________</td></tr>
                <tr><td style="text-align: left; padding-left: 8px; font-weight: bold; color: #333; font-size:8.5px;">TROQUELADORA</td><td style="color: #ddd;">___________________________</td><td style="color: #ddd;">___________________________</td></tr>
                <tr><td style="text-align: left; padding-left: 8px; font-weight: bold; color: #333; font-size:8.5px;">GUILLOTINA</td><td style="color: #ddd;">___________________________</td><td style="color: #ddd;">___________________________</td></tr>
                <tr><td style="text-align: left; padding-left: 8px; font-weight: bold; color: #333; font-size:8.5px;">TREN DE ALZADO</td><td style="color: #ddd;">___________________________</td><td style="color: #ddd;">___________________________</td></tr>
              </tbody>
            </table>
            <div class="box-borde" style="padding: 5px 8px;"><span class="label-mini" style="font-weight: 700;">Tren y Encolado Manual</span><div style="display: flex; gap: 30px; font-size: 8.5px; color: #444; font-weight: bold; margin-top: 1px;"><div>Operario Ajuste: ____________________________________</div><div>Velocidad Tren: ___________________________________</div></div></div>
            <div class="box-cajas-matriz-taller">
              <span class="label-mini" style="font-weight: 900; border-bottom: 1px solid black; padding-bottom: 2px; margin-bottom: 6px;">Logística de Desglose de Cajas</span>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap-x: 25px; gap-y: 6px; align-items: center;">
                ${Array(6).fill(0).map(() => `<div class="fila-matriz-cajas"><span>Nº CAJAS</span> <span class="caja-vacia-escribir"></span><span style="margin-left: 4px;">UNIDS.</span> <span class="caja-vacia-unids"></span></div>`).join('')}
              </div>
            </div>
            <div class="box-observaciones-gigante"><span class="label-mini" style="font-weight: 900; border-bottom: 1.5px solid #000; padding-bottom: 2px;">Observaciones e Incidencias Técnicas de Planta</span></div>
          </div>
          <div class="hoja-taller" style="gap: 7.5px;">
            <div style="display: flex; flex-direction: column; gap: 7.5px; height: 100%; width: 100%;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid black; padding-bottom: 4px;">
                <div style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 26px; font-weight: 900; text-transform: lowercase; letter-spacing: -1px;">aeroprint</span><span style="font-size: 18px; font-weight: bold; color: ${colorBoli}; text-transform: uppercase; margin-left: 5px;">${cliente || 'NOMBRE DEL CLIENTE'}</span></div>
                <div style="border: 1.5px solid black; padding: 4px 10px; font-weight: bold; font-size: 11px; text-align: center; background: white;">Nº PARTE: <span style="color: ${colorBoli}; font-family: monospace; font-size: 12px; font-weight: 900;">${numParte || '26-0000'}</span></div>
              </div>
              <div class="box-borde"><span class="label-mini">Descripción General del Trabajo</span><div style="font-size: 12px; font-weight: bold; color: ${colorBoli}; text-transform: uppercase;">${descripcionGeneral || 'Nombre del trabajo'}</div></div>
              <div class="tabla-prod">
                <div class="tab-header"><div>Concepto del producto</div><div style="text-align: right;">Cantidad</div></div>
                <div style="padding: 0 8px; flex: 1; background: white;">${filasDesgloseHTML || '<div style="color:#ccc; padding: 10px 0;">No se añadieron desgloses dinámicos.</div>'}</div>
              </div>
              <div class="flex-row-box">
                <div class="box-borde" style="width: 150px; background: white;"><span class="label-mini">Comercial</span><div style="font-size: 13px; font-weight: bold; color: ${colorBoli}; text-transform: uppercase; margin-top: 2px;">${comercial || 'Marcos'}</div></div>
                <div class="box-borde flex-1" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; align-items: center; padding-left: 10px; background: white;">
                  ${areasImpresion.map(item => `<div class="chk-item"><span class="chk-box">${area === item ? 'X' : ''}</span><span>${item}</span></div>`).join('')}
                </div>
              </div>
              <div class="flex-row-box">
                <div class="box-borde flex-1" style="display: flex; align-items: center; gap: 35px; padding-left: 10px; background: white;">
                  <div class="chk-item" style="font-size: 10px; font-weight: normal;"><span class="chk-box" style="width:13px; height:13px; line-height:11px; font-weight: bold;">${tipoEntrega === 'almacen' ? 'X' : ''}</span><span>Recogida en almacén</span></div>
                  <div class="chk-item" style="font-size: 10px; font-weight: normal;"><span class="chk-box" style="width:13px; height:13px; line-height:11px; font-weight: bold;">${albaranAnonimo ? 'X' : ''}</span><span>Albarán Anónimo</span></div>
                </div>
                <div class="box-borde text-center font-semibold" style="width: 130px; background: white;"><span class="label-mini">Entrada</span><span style="color: ${colorBoli}; font-size: 10px;">${new Date().toLocaleDateString('es-ES')}</span></div>
                <div class="box-borde text-center font-semibold" style="width: 130px; background: white;"><span class="label-mini">Salida</span><span style="color: ${colorBoli}; font-size: 10px;">${fechaSalida ? new Date(fechaSalida).toLocaleDateString('es-ES') : '___/___/___'}</span></div>
              </div>
              <div class="box-borde" style="min-height: 35px;"><span class="label-mini">Dirección de entrega</span><div style="font-size: 10px; font-weight: bold; color: ${colorBoli}; text-transform: uppercase; margin-top: 1px;">${tipoEntrega === 'envio' ? (direccionEntrega || 'Dirección de envío') : 'RECOGIDA EN TALLER / ALMACÉN'}</div></div>
              <div class="flex-row-box">
                <div class="box-borde flex-1"><span class="label-mini">Color de portada</span><div style="font-weight: bold; color: ${colorBoli}; font-size: 11px;">${papelPortada ? txtColorPortadaPrint : '_________________'}</div></div>
                <div class="box-borde flex-1"><span class="label-mini">Color del interior</span><div style="font-weight: bold; color: ${colorBoli}; font-size: 11px; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${papelInterior ? txtColorInteriorPrint : '_________________'}</div></div>
              </div>
              <div class="flex-row-box">
                <div class="box-borde flex-1"><span class="label-mini">Papel portada</span><div style="font-weight: bold; color: ${colorBoli}; font-size: 11px;">${papelPortada || '_________________'}</div></div>
                <div class="box-borde flex-1"><span class="label-mini">Papel interior</span><div style="font-weight: bold; color: ${colorBoli}; font-size: 11px;">${papelInterior || '_________________'}</div></div>
              </div>
              <div class="flex-row-box">
                <div class="box-borde flex-1" style="display: grid; grid-template-columns: repeat(3, 1fr); gap-y: 3px; padding-left: 8px; background: white;">
                  ${Object.keys(encuadernacion).map(k => `<div class="chk-item"><span class="chk-box">${encuadernacion[k] ? 'X' : ''}</span><span>${k}</span></div>`).join('')}
                </div>
                <div class="box-borde" style="width: 200px; display: flex; flex-direction: column; gap: 3px; justify-content: center; padding-left: 10px; background: white;">
                  <div style="font-weight: bold; font-size: 9px;">Espiral: <span style="color:${colorBoli}; font-weight:bold; margin-left:4px;">${espiralColor || '___________'}</span></div>
                  <div style="font-weight: bold; font-size: 9px;">Wire-o: <span style="color:${colorBoli}; font-weight:bold; margin-left:8px;">${wireOColor || '___________'}</span></div>
                </div>
              </div>
              <div class="box-borde" style="display: grid; grid-template-columns: repeat(4, 1fr); gap-y: 4px; padding-left: 8px; background: white;">
                ${Object.keys(acabados).map(k => `<div class="chk-item"><span class="chk-box">${acabados[k] ? 'X' : ''}</span><span>${k}</span></div>`).join('')}
              </div>
              <div class="flex-row-box">
                <div class="box-borde flex-1"><span class="label-mini">Grapado</span><div style="color: ${colorBoli}; font-weight: bold; margin-top: 1px;">${grapadoTipo}</div></div>
                <div class="box-borde flex-1"><span class="label-mini">Barniz UV</span><div style="color: ${colorBoli}; font-weight: bold; margin-top: 1px;">${barnizUVTipo}</div></div>
                <div class="box-borde flex-1"><span class="label-mini">Estamping</span><div style="color: ${colorBoli}; font-weight: bold; margin-top: 1px;">${grapadoTipo}</div></div>
              </div>
              <div class="box-borde" style="display: flex; flex-direction: column; gap: 5px; background: white;">
                <div class="flex-row-box" style="justify-content: space-between; align-items: center; padding-right: 20px;">
                  <span class="label-mini" style="display:inline; margin: 0;">Laminado:</span>
                  <div class="chk-item"><span class="chk-box">${laminadoTipo === '1 cara' ? 'X' : ''}</span><span>1 cara</span></div>
                  <div class="chk-item"><span class="chk-box">${laminadoTipo === '2 caras' ? 'X' : ''}</span><span>2 caras</span></div>
                  <div class="chk-item"><span class="chk-box">${laminadoTipo === '2 caras diferentes' ? 'X' : ''}</span><span>2 caras diferentes</span></div>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 9.5px; font-weight: bold; border-top: 1px solid #000; padding-top: 5px; width: 100%;">
                  <span style="color:#666; font-size: 8.5px; width: 95px; flex-shrink: 0;">TIPO LAMINADO 1:</span>
                  ${Object.keys(tipoLaminadoCara1).map(k => `<div class="chk-item"><span class="chk-box">${tipoLaminadoCara1[k] ? 'X' : ''}</span><span>${k.replace('S',' S').replace('A',' A')}</span></div>`).join('')}
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 9.5px; font-weight: bold; padding-top: 2px; width: 100%;">
                  <span style="color:#666; font-size: 8.5px; width: 95px; flex-shrink: 0;">TIPO LAMINADO 2:</span>
                  ${Object.keys(tipoLaminadoCara2).map(k => `<div class="chk-item"><span class="chk-box">${tipoLaminadoCara2[k] ? 'X' : ''}</span><span>${k.replace('S',' S').replace('A',' A')}</span></div>`).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    setTimeout(() => { ventanaImpresion.print(); }, 350);
  }
</script>

{#if mensajeNotificacion}
  <div transition:slide class="w-full p-4 rounded-2xl text-xs font-semibold tracking-wide shadow-md flex items-center gap-2 mb-4 animate-pulse
    {tipoNotificacion === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'}">
    <span class="material-symbols-rounded text-base">{tipoNotificacion === 'success' ? 'check_circle' : 'error'}</span>
    <span>{mensajeNotificacion}</span>
  </div>
{/if}

<div class="w-full font-sans flex flex-col h-full space-y-6 text-[#1A1D21] dark:text-[#EDF0F3] px-1">
  
  <div class="flex items-center justify-between select-none py-1">
    <div class="flex items-center gap-6 md:gap-14 mx-auto">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-xl font-semibold text-xs flex items-center justify-center transition-all {pasoActual >= 1 ? 'bg-[#5C42FF] text-white shadow-md' : 'bg-gray-200 text-gray-400'}">1</div>
        <span class="text-xs font-semibold {pasoActual === 1 ? 'text-[#1A1D21] dark:text-[#EDF0F3]' : 'text-gray-400'}">Administrativo</span>
      </div>
      <div class="h-px w-10 bg-gray-300 dark:bg-gray-700"></div>
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-xl font-semibold text-xs flex items-center justify-center transition-all {pasoActual >= 2 ? 'bg-[#5C42FF] text-white shadow-md' : 'bg-gray-200 text-gray-400'}">2</div>
        <span class="text-xs font-semibold {pasoActual === 2 ? 'text-[#1A1D21] dark:text-[#EDF0F3]' : 'text-gray-400'}">Producción</span>
      </div>
      <div class="h-px w-10 bg-gray-300 dark:bg-gray-700"></div>
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-xl font-semibold text-xs flex items-center justify-center transition-all {pasoActual >= 3 ? 'bg-[#5C42FF] text-white shadow-md' : 'bg-gray-200 text-gray-400'}">3</div>
        <span class="text-xs font-semibold {pasoActual === 3 ? 'text-[#1A1D21] dark:text-[#EDF0F3]' : 'text-gray-400'}">Ficha Técnica</span>
      </div>
    </div>
  </div>

  <div class="flex-1 bg-white dark:bg-[#16191D] border border-[#E9EBF0] dark:border-[#232830] rounded-3xl p-8 shadow-xs overflow-y-auto min-h-0">
    
    {#if pasoActual === 1}
      <div class="space-y-6" in:fade={{ duration: 150 }}>
        <div>
          <h2 class="text-xl font-semibold tracking-tight">Paso 1: Identificación y Plazos</h2>
          <p class="text-xs text-gray-400 mt-0.5">Apertura técnica comercial y logística de la orden.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
          <div class="flex flex-col space-y-2">
            <label for="numParte" class="text-gray-400 uppercase tracking-wider text-[10px]">Número de Parte (Automático)</label>
            <input id="numParte" type="text" bind:value={numParte} readonly class="p-3 bg-gray-100 dark:bg-gray-800 border border-transparent rounded-xl font-mono text-xs font-semibold text-gray-500 cursor-not-allowed select-none" />
          </div>
          <div class="flex flex-col space-y-2">
            <label for="comercial" class="text-gray-400 uppercase tracking-wider text-[10px]">Comercial Asignado</label>
            <select id="comercial" bind:value={comercial} class="p-3 bg-gray-50 dark:bg-[#1E2228] border border-gray-100 rounded-xl outline-none text-xs font-semibold text-black dark:text-white">
              {#each comerciales as c}<option value={c}>{c}</option>{/each}
            </select>
          </div>
          <div class="flex flex-col space-y-2 relative">
            <label for="cliente" class="text-gray-400 uppercase tracking-wider text-[10px]">Cliente Corporativo *</label>
            <input id="cliente" type="text" bind:value={cliente} on:focus={() => mostrarSugerencias = true} on:blur={() => setTimeout(() => mostrarSugerencias = false, 200)} placeholder="Escribe el nombre del cliente..." class="p-3 bg-gray-50 dark:bg-[#1E2228] border rounded-xl outline-none text-xs font-semibold" />
            {#if mostrarSugerencias && sugerenciasFiltradas.length > 0}
              <div class="absolute top-[68px] left-0 w-full bg-white dark:bg-[#1E2228] border rounded-xl max-h-40 overflow-y-auto shadow-lg z-50 divide-y">
                {#each sugerenciasFiltradas as sug}
                  <button type="button" on:click={() => seleccionarCliente(sug)} class="w-full text-left p-2.5 text-xs font-semibold hover:bg-gray-50 transition-colors block border-none">{sug}</button>
                {/each}
              </div>
            {/if}
          </div>
          <div class="flex flex-col space-y-2">
            <label for="fechaSalida" class="text-gray-400 uppercase tracking-wider text-[10px]">Fecha Límite de Salida *</label>
            <input id="fechaSalida" type="date" bind:value={fechaSalida} class="p-3 bg-gray-50 dark:bg-[#1E2228] border rounded-xl outline-none text-xs font-semibold" />
          </div>
        </div>
        <div class="border-t border-gray-100 dark:border-[#232830] pt-5 space-y-4 text-xs font-semibold">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex flex-col space-y-2">
              <span class="text-gray-400 uppercase tracking-wider text-[10px]">Modalidad de Distribución</span>
              <div class="flex gap-1 bg-gray-50 dark:bg-[#1E2228] p-1.5 rounded-xl border">
                <button type="button" on:click={() => tipoEntrega = "taller"} class="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all {tipoEntrega === 'taller' ? 'bg-white dark:bg-[#16191D] text-[#5C42FF] shadow-xs' : 'text-gray-400'}">Entrega en Taller</button>
                <button type="button" on:click={() => tipoEntrega = "almacen"} class="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all {tipoEntrega === 'almacen' ? 'bg-white dark:bg-[#16191D] text-[#5C42FF] shadow-xs' : 'text-gray-400'}">Recogida Almacén</button>
                <button type="button" on:click={() => tipoEntrega = "envio"} class="flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all {tipoEntrega === 'envio' ? 'bg-white dark:bg-[#16191D] text-[#5C42FF] shadow-xs' : 'text-gray-400'}">Se Envía Fuera</button>
              </div>
            </div>
            <div class="flex items-center pt-6">
              <label class="flex items-center gap-3 cursor-pointer text-gray-400 select-none font-semibold text-xs">
                <input type="checkbox" bind:checked={albaranAnonimo} class="w-4 h-4 rounded accent-[#5C42FF]" />
                <span>Albarán Anónimo</span>
              </label>
            </div>
          </div>
          {#if tipoEntrega === 'envio'}
            <div class="flex flex-col space-y-2" transition:slide>
              <label for="direccion" class="text-gray-400 uppercase tracking-wider text-[10px]">Dirección de Entrega Completa</label>
              <input id="direccion" type="text" bind:value={direccionEntrega} placeholder="Calle, Número, Localidad..." class="p-3 bg-gray-50 dark:bg-[#1E2228] border rounded-xl outline-none" />
            </div>
          {/if}
        </div>
      </div>
    {/if}

    {#if pasoActual === 2}
      <div class="space-y-6" in:fade={{ duration: 150 }}>
        <div>
          <h2 class="text-xl font-semibold tracking-tight">Paso 2: Maquinaria y Líneas de Producto</h2>
          <p class="text-xs text-gray-400 mt-0.5">Asignación de maquinaria y desglose de volúmenes.</p>
        </div>
        <div class="flex flex-col space-y-2 text-xs font-semibold w-full">
          <span class="text-gray-400 uppercase tracking-wider text-[10px]">Área / Maquinaria Principal</span>
          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 bg-gray-50 dark:bg-[#1E2228] p-2 rounded-2xl border w-full">
            {#each areasImpresion as item}
              <button type="button" on:click={() => area = item} class="py-3 rounded-xl text-xs font-semibold transition-all text-center {area === item ? 'bg-[#5C42FF] text-white shadow-md scale-102' : 'text-gray-400 hover:bg-white dark:hover:bg-gray-800'}">{item}</button>
            {/each}
          </div>
        </div>
        <div class="flex flex-col space-y-2 text-xs font-semibold">
          <label for="descripcionGeneral" class="text-gray-400 uppercase tracking-wider text-[10px]">Descripción General del Trabajo</label>
          <input id="descripcionGeneral" type="text" bind:value={descripcionGeneral} placeholder="Ej: BOLSA DELUXE" class="p-3 bg-gray-50 dark:bg-[#1E2228] border rounded-xl outline-none" />
        </div>
        
        <div class="space-y-4 w-full">
          <div class="flex justify-between items-center border-b pb-2 border-gray-100 dark:border-gray-800">
            <span class="text-[10px] font-semibold uppercase text-gray-400">Unidades y Conceptos del Parte</span>
            <button type="button" on:click={agregarFilaDesglose} class="text-xs font-semibold text-[#5C42FF] flex items-center gap-1 hover:underline cursor-pointer bg-transparent border-none p-0">
              <span class="material-symbols-rounded text-sm">add_circle</span> Añadir Línea
            </button>
          </div>
          
          <div class="space-y-2.5 w-full">
            {#each desgloses as item, idx}
              <div class="flex items-center gap-3 bg-gray-50 dark:bg-[#1E2228] p-3 rounded-xl border border-gray-100 dark:border-transparent" transition:slide={{ duration: 150 }}>
                <input type="text" bind:value={item.descripcionProducto} placeholder="Concepto del producto" class="flex-1 bg-white dark:bg-[#16191D] p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 outline-none text-xs font-semibold focus:border-[#5C42FF]" />
                <input type="number" bind:value={item.cantidad} placeholder="Cantidad" class="w-32 bg-white dark:bg-[#16191D] p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-center font-semibold text-xs focus:border-[#5C42FF]" />
                <button type="button" on:click={() => eliminarFilaDesglose(idx)} disabled={desgloses.length === 1} class="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:pointer-events-none bg-transparent border-none">
                  <span class="material-symbols-rounded text-base">delete</span>
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    {#if pasoActual === 3}
      <div class="space-y-8 text-sm" in:fade={{ duration: 150 }}>
        <div>
          <h2 class="text-xl font-semibold tracking-tight">Paso 3: Parámetros del Soporte Técnico y Tintas</h2>
          <p class="text-xs text-gray-400 mt-0.5">Especificaciones industriales de soportes, acabados y laminación de planta.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-6">
          <div class="space-y-4 bg-gray-50/50 dark:bg-[#1E2228]/40 p-6 rounded-2xl border text-xs font-semibold">
            <span class="text-[11px] font-semibold uppercase text-[#5C42FF] tracking-wider block border-b pb-1">Configuración Portada</span>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col space-y-2">
                <span class="text-gray-400 uppercase text-[9px]">Papel Portada</span>
                <select bind:value={papelPortada} class="p-3 bg-white dark:bg-[#16191D] border border-gray-100 rounded-xl outline-none font-semibold text-black dark:text-white">
                  <option value="">-- Seleccionar gramaje --</option>
                  {#each opcionesGramaje as g}<option value={g}>{g}</option>{/each}
                </select>
              </div>
              <div class="flex flex-col space-y-2">
                <span class="text-gray-400 uppercase text-[9px]">Color Portada</span>
                <select bind:value={colorPortada} class="p-3 bg-white dark:bg-[#16191D] border border-gray-100 rounded-xl outline-none font-semibold text-black dark:text-white">
                  <option value="">-- Seleccionar tintas --</option>
                  {#each opcionesColor as c}<option value={c}>{c}</option>{/each}
                </select>
              </div>
            </div>

            {#if requiereConfigurarTintasPortada}
              <div class="flex flex-col space-y-2 mt-3" transition:slide>
                <span class="text-gray-400 uppercase text-[9px]">Tipo Tinta Portada</span>
                <select bind:value={tipoTintaPortada} class="p-3 bg-white dark:bg-[#16191D] border rounded-xl outline-none font-semibold">
                  <option value="estandar">Tinta Estándar</option>
                  <option value="pantone">Color Pantone Especial</option>
                </select>
                {#if tipoTintaPortada === 'pantone'}
                  <div class="space-y-2 mt-2">
                    <div class="flex gap-2">
                      <input type="text" bind:value={inputPantonePortada} placeholder="Código (Ej: 485)" class="flex-1 p-2.5 bg-white dark:bg-[#16191D] border rounded-xl font-mono" />
                      <button type="button" on:click={añadirPantonePortada} class="px-4 bg-[#5C42FF] text-white font-semibold rounded-xl">Añadir</button>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      {#each listaPantonesPortada as p, idx}
                        <span class="bg-blue-500/10 text-blue-500 border font-mono text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1">P. {p} <button type="button" on:click={() => eliminarPantonePortada(idx)} class="font-semibold">×</button></span>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>

          <div class="space-y-4 bg-gray-50/50 dark:bg-[#1E2228]/40 p-6 rounded-2xl border text-xs font-semibold">
            <span class="text-[11px] font-semibold uppercase text-[#5C42FF] tracking-wider block border-b pb-1">Configuración Interior</span>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col space-y-2">
                <span class="text-gray-400 uppercase text-[9px]">Papel Interior</span>
                <select bind:value={papelInterior} class="p-3 bg-white dark:bg-[#16191D] border border-gray-100 rounded-xl outline-none font-semibold text-black dark:text-white">
                  <option value="">-- Seleccionar gramaje --</option>
                  {#each opcionesGramaje as g}<option value={g}>{g}</option>{/each}
                </select>
              </div>
              <div class="flex flex-col space-y-2">
                <span class="text-gray-400 uppercase text-[9px]">Color Interior</span>
                <select bind:value={colorInterior} class="p-3 bg-white dark:bg-[#16191D] border border-gray-100 rounded-xl outline-none font-semibold text-black dark:text-white">
                  <option value="">-- Seleccionar tintas --</option>
                  {#each opcionesColor as c}<option value={c}>{c}</option>{/each}
                  <option value="Pantone">Pantone Especial</option>
                </select>
              </div>
            </div>

            {#if requiereConfigurarTintasInterior}
              <div class="flex flex-col space-y-2 mt-3" transition:slide>
                <span class="text-gray-400 uppercase text-[9px]">Tipo Tinta Interior</span>
                <select bind:value={tipoTintaInterior} class="p-3 bg-white dark:bg-[#16191D] border rounded-xl outline-none font-semibold">
                  <option value="estandar">Tinta Estándar</option>
                  <option value="pantone">Color Pantone Especial</option>
                </select>
                {#if tipoTintaInterior === 'pantone'}
                  <div class="space-y-2 mt-2">
                    <div class="flex gap-2">
                      <input type="text" bind:value={inputPantoneInterior} placeholder="Código (Ej: 7241)" class="flex-1 p-2.5 bg-white dark:bg-[#16191D] border rounded-xl font-mono" />
                      <button type="button" on:click={añadirPantoneInterior} class="px-4 bg-[#5C42FF] text-white font-semibold rounded-xl">Añadir</button>
                    </div>
                    <div class="flex flex-wrap gap-1">
                      {#each listaPantonesInterior as p, idx}
                        <span class="bg-blue-500/10 text-blue-500 border font-mono text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1">P. {p} <button type="button" on:click={() => eliminarPantoneInterior(idx)} class="font-semibold">×</button></span>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs font-semibold text-gray-500">
          <div class="space-y-3 bg-gray-50/30 dark:bg-[#1E2228]/20 p-5 rounded-2xl border">
            <span class="text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] uppercase block border-b pb-1 mb-2">1. Encuadernación</span>
            <div class="grid grid-cols-2 gap-3">
              {#each Object.keys(encuadernacion) as k}
                <label class="flex items-center gap-2 capitalize cursor-pointer"><input type="checkbox" bind:checked={encuadernacion[k]} class="w-4 h-4 rounded accent-[#5C42FF]" /> {k}</label>
              {/each}
            </div>
            <div class="pt-3 space-y-2 mt-3 border-t">
              <input type="text" bind:value={espiralColor} placeholder="Color de espiral" class="w-full p-3 bg-white dark:bg-[#16191D] border rounded-xl text-xs" />
              <input type="text" bind:value={wireOColor} placeholder="Color de wire-o" class="w-full p-3 bg-white dark:bg-[#16191D] border rounded-xl text-xs" />
            </div>
          </div>

          <div class="space-y-3 bg-gray-50/30 dark:bg-[#1E2228]/20 p-5 rounded-2xl border">
            <span class="text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] uppercase block border-b pb-1 mb-2">2. Mecanizado</span>
            <div class="grid grid-cols-2 gap-3">
              {#each Object.keys(acabados) as k}
                <label class="flex items-center gap-2 capitalize cursor-pointer"><input type="checkbox" bind:checked={acabados[k]} class="w-4 h-4 rounded accent-[#5C42FF]" /> {k}</label>
              {/each}
            </div>
          </div>

          <div class="space-y-3 bg-gray-50/30 dark:bg-[#1E2228]/20 p-5 rounded-2xl border">
            <span class="text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] uppercase block border-b pb-1 mb-2">3. Triplete Industrial</span>
            <div class="space-y-3">
              <div class="flex flex-col space-y-1"><span class="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Grapado</span><input type="text" bind:value={grapadoTipo} class="p-3 bg-white dark:bg-[#16191D] border rounded-xl font-semibold text-black" /></div>
              <div class="flex flex-col space-y-1"><span class="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Barniz UV</span><input type="text" bind:value={barnizUVTipo} class="p-3 bg-white dark:bg-[#16191D] border rounded-xl font-semibold text-black" /></div>
              <div class="flex flex-col space-y-1"><span class="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">Estamping</span><input type="text" bind:value={estampingTipo} class="p-3 bg-white dark:bg-[#16191D] border rounded-xl font-semibold text-black" /></div>
            </div>
          </div>
        </div>

        <div class="p-5 bg-gray-50/30 dark:bg-[#1E2228]/20 rounded-2xl border text-xs font-semibold text-gray-500">
          <span class="text-[11px] font-semibold text-[#1A1D21] dark:text-[#EDF0F3] uppercase block border-b pb-1 mb-3">4. Laminadora de Planta</span>
          <div class="flex gap-6 mb-4 font-semibold">
            <label class="cursor-pointer flex items-center gap-1.5"><input type="radio" bind:group={laminadoTipo} value="1 cara" class="accent-[#5C42FF]" /> 1 cara</label>
            <label class="cursor-pointer flex items-center gap-1.5"><input type="radio" bind:group={laminadoTipo} value="2 caras" class="accent-[#5C42FF]" /> 2 caras</label>
            <label class="cursor-pointer flex items-center gap-1.5"><input type="radio" bind:group={laminadoTipo} value="2 caras diferentes" class="accent-[#5C42FF]" /> 2 caras diferentes</label>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t">
            <div class="space-y-2">
              <span class="text-[10px] text-gray-400 font-semibold block uppercase">Cara 1</span>
              <div class="flex flex-wrap gap-3">
                {#each Object.keys(tipoLaminadoCara1) as k}
                  <label class="flex items-center gap-1.5 cursor-pointer capitalize"><input type="checkbox" bind:checked={tipoLaminadoCara1[k]} class="accent-[#5C42FF]" /> {k}</label>
                {/each}
              </div>
            </div>
            {#if laminadoTipo !== '1 cara'}
              <div class="space-y-2" transition:slide>
                <span class="text-[10px] text-gray-400 font-semibold block uppercase">Cara 2</span>
                <div class="flex flex-wrap gap-3">
                  {#each Object.keys(tipoLaminadoCara2) as k}
                    <label class="flex items-center gap-1.5 cursor-pointer capitalize"><input type="checkbox" bind:checked={tipoLaminadoCara2[k]} class="accent-[#5C42FF]" /> {k}</label>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>

  <div class="flex items-center justify-between flex-shrink-0 px-2 py-1">
    <button type="button" on:click={irAlAnterior} disabled={pasoActual === 1 || guardandoDato} class="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-[#1A1D21] dark:hover:text-[#EDF0F3] bg-transparent hover:bg-gray-200 transition-all cursor-pointer">Atrás</button>
    {#if pasoActual < 3}
      <button type="button" on:click={irAlSiguiente} class="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#5C42FF] text-white hover:bg-[#4730D9] shadow-xs cursor-pointer">Continuar</button>
    {:else}
      <button type="button" on:click={procesarEnvio} disabled={guardandoDato} class="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#5C42FF] text-white hover:bg-[#4730D9] shadow-md cursor-pointer">
        {guardandoDato ? 'Guardando en Turso...' : 'Guardar y Generar A3'}
      </button>
    {/if}
  </div>
</div>