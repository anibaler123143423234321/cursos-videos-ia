// Plantilla del manual: convierte una entrada de datos.mjs en la página HTML que se imprime como PDF.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FLUJOS, FUERA_DE_LA_WEB, PARTES, VERSION } from './datos.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const LOGO = `data:image/png;base64,${fs.readFileSync(path.join(REPO, 'clases-mac', 'marca', 'logo-transparente.png')).toString('base64')}`;
export const viaDe = f => (FUERA_DE_LA_WEB.has(f.codigo) ? 'por-terminal' : 'por-web');

// ---------------------------------------------------------------- diagrama por carriles (SVG)
export const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const COLORES = [
  ['#eef6cf', '#7d9a0c'], ['#ecebff', '#3e32d4'], ['#fff1e6', '#c2410c'], ['#e8f1ff', '#1f5fd1'], ['#f3f3f6', '#5b5b6b'],
];
function partirTexto(t, max) {
  const lineas = [];
  let actual = '';
  for (const p of String(t).split(/\s+/)) {
    if ((actual + ' ' + p).trim().length > max && actual) { lineas.push(actual); actual = p; } else actual = (actual + ' ' + p).trim();
  }
  if (actual) lineas.push(actual);
  if (lineas.length > 3) console.warn(`[!] Texto largo para el diagrama (se corta): ${t}`);
  return lineas.slice(0, 3);
}
function diagrama(f) {
  const W = 680;
  const n = f.carriles.length;
  const ancho = W / n;
  const CAB = 34;
  const FILA = f.pasos.length > 12 ? 38 : 42;
  const ALTO = FILA - 7;
  const H = CAB + 12 + f.pasos.length * FILA + 6;
  const max = Math.floor((ancho - 40) / 5.3);
  const partes = [];
  partes.push(`<defs><marker id="punta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0 0L10 5L0 10z" fill="#1d1d22"/></marker></defs>`);
  f.carriles.forEach((c, i) => {
    const [fondo] = COLORES[i % COLORES.length];
    partes.push(`<rect x="${i * ancho}" y="0" width="${ancho}" height="${H}" fill="${i % 2 ? '#fbfbfd' : '#ffffff'}"/>`);
    partes.push(`<rect x="${i * ancho + 3}" y="3" width="${ancho - 6}" height="${CAB - 6}" rx="6" fill="${fondo}"/>`);
    partes.push(`<text x="${i * ancho + ancho / 2}" y="${CAB / 2 + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#1d1d22">${esc(c)}</text>`);
    if (i) partes.push(`<line x1="${i * ancho}" y1="0" x2="${i * ancho}" y2="${H}" stroke="#d9dbe2" stroke-dasharray="3 4"/>`);
  });
  const caja = (k) => {
    const [c] = f.pasos[k];
    return { x: c * ancho + 8, y: CAB + 12 + k * FILA, w: ancho - 16, cx: c * ancho + ancho / 2 };
  };
  f.pasos.forEach(([c, texto, , decision], k) => {
    if (k + 1 < f.pasos.length) {
      const a = caja(k), z = caja(k + 1);
      const y1 = a.y + ALTO, y2 = z.y;
      const medio = y1 + (y2 - y1) / 2;
      const d = a.cx === z.cx ? `M${a.cx} ${y1} V${y2 - 1}` : `M${a.cx} ${y1} V${medio} H${z.cx} V${y2 - 1}`;
      partes.push(`<path d="${d}" fill="none" stroke="#1d1d22" stroke-width="1.3" marker-end="url(#punta)"/>`);
      if (decision) partes.push(`<text x="${a.cx + 6}" y="${y1 + 10}" font-size="8.5" font-weight="700" fill="#5b6e00">Sí</text>`);
    }
    const { x, y, w } = caja(k);
    const [fondo, borde] = COLORES[c % COLORES.length];
    partes.push(`<rect x="${x}" y="${y}" width="${w}" height="${ALTO}" rx="${decision ? 18 : 7}" fill="${decision ? '#fffbe6' : '#fff'}" stroke="${decision ? '#c9a400' : borde}"
      stroke-width="1.4" ${decision ? 'stroke-dasharray="4 3"' : ''}/>`);
    partes.push(`<rect x="${x}" y="${y}" width="5" height="${ALTO}" rx="2" fill="${decision ? '#c9a400' : borde}"/>`);
    partes.push(`<circle cx="${x + 18}" cy="${y + ALTO / 2}" r="9" fill="${decision ? '#c9a400' : borde}"/>`);
    partes.push(`<text x="${x + 18}" y="${y + ALTO / 2 + 3.5}" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">${k + 1}</text>`);
    const lineas = partirTexto(texto, max);
    const y0 = y + ALTO / 2 - (lineas.length - 1) * 5.2 + 3.3;
    lineas.forEach((l, i) => partes.push(`<text x="${x + 32}" y="${y0 + i * 10.4}" font-size="9.2" font-weight="600" fill="#1d1d22">${esc(l)}</text>`));
    void fondo;
  });
  return `<svg class="diagrama" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Inter, Arial, sans-serif">${partes.join('')}</svg>`;
}

// ---------------------------------------------------------------- pagina HTML de un flujo
const KIT = ['clases-mac', 'clases-windows'].find(k => fs.existsSync(path.join(REPO, k, 'node_modules', '@fontsource')));
const fuente = archivo => `../../../../${KIT}/node_modules/@fontsource/${archivo}`; // relativo: el HTML no guarda rutas de una PC
const CSS = `
  @media screen {
    html body { max-width: 960px; margin: 24px auto; padding: 0 24px; }
    .volver { display: inline-block; margin-bottom: 12px; font: 600 14px Arial, sans-serif; color: #4f5f00; }
  }
  @media print { .volver { display: none; } }
  @font-face { font-family: Inter; font-weight: 400; src: url(${fuente('inter/files/inter-latin-400-normal.woff2')}); }
  @font-face { font-family: Inter; font-weight: 600; src: url(${fuente('inter/files/inter-latin-600-normal.woff2')}); }
  @font-face { font-family: Inter; font-weight: 700; src: url(${fuente('inter/files/inter-latin-700-normal.woff2')}); }
  @font-face { font-family: Inter; font-weight: 800; src: url(${fuente('inter/files/inter-latin-800-normal.woff2')}); }
  @font-face { font-family: Inter; font-weight: 900; src: url(${fuente('inter/files/inter-latin-900-normal.woff2')}); }
  @font-face { font-family: Serif; font-style: italic; src: url(${fuente('instrument-serif/files/instrument-serif-latin-400-italic.woff2')}); }
  :root { --verde: #a6c61a; --verde-osc: #5b6e00; --verde-50: #f3f8dc; --tinta: #121214; --gris: #5d616c; --linea: #e3e4e8; --caja: #f4f4f7; --morado: #3e32d4; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 400 9.6pt/1.5 Inter, sans-serif; color: var(--tinta); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .etiqueta { font-size: 7.4pt; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: var(--verde-osc); margin: 0 0 2mm; }
  h1 { display: flex; align-items: center; gap: 4mm; font-size: 18pt; line-height: 1.05; letter-spacing: -0.035em; font-weight: 900; margin: 0 0 2.5mm; }
  h1 .cod { flex: none; font: 800 12pt/1 Inter; letter-spacing: .02em; color: #fff; background: var(--tinta); border-radius: 2mm; padding: 2mm 3mm; }
  .proposito { font-size: 9.8pt; color: #34343f; margin: 0 0 4mm; max-width: 172mm; }
  h2 { font-size: 11.5pt; font-weight: 800; letter-spacing: -0.01em; margin: 5mm 0 2mm; display: flex; align-items: center; gap: 2.5mm; }
  h2::before { content: ''; width: 5mm; height: 1.4mm; border-radius: 1mm; background: var(--verde); }
  .ficha { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--linea); border: 1px solid var(--linea); border-radius: 2.5mm; overflow: hidden; }
  .ficha div { background: #fff; padding: 1.3mm 3mm; }
  .ficha div.c2 { grid-column: span 2; }
  .ficha div.c4 { grid-column: 1 / -1; }
  .bloque-diagrama { break-inside: avoid; }
  .ficha b { display: block; font-size: 7pt; letter-spacing: .12em; text-transform: uppercase; color: var(--gris); margin-bottom: .4mm; }
  .ficha span { font-size: 8.9pt; line-height: 1.4; }
  .diagrama { width: 100%; height: auto; border: 1px solid var(--linea); border-radius: 2.5mm; }
  .leyenda { font-size: 7.8pt; color: var(--gris); margin: 1.5mm 0 0; }
  .salto { break-before: page; }
  table { width: 100%; border-collapse: collapse; font-size: 8.7pt; }
  th { text-align: left; font-size: 7pt; letter-spacing: .12em; text-transform: uppercase; color: var(--gris); padding: 1.6mm 2mm; border-bottom: 1.5px solid var(--tinta); }
  td { padding: 1.5mm 2mm; border-bottom: 1px solid var(--linea); vertical-align: top; line-height: 1.42; }
  tr { break-inside: avoid; }
  td.n { width: 9mm; font-weight: 800; color: var(--verde-osc); }
  td.actor { width: 33mm; font-weight: 700; }
  td.paso { width: 52mm; font-weight: 600; }
  .dec td.n { color: #a08300; }
  ul.reglas { margin: 0; padding-left: 4.5mm; } ul.reglas li { margin-bottom: .8mm; }
  .chips { display: flex; flex-wrap: wrap; gap: 2mm; } .chips span { font: 600 8.4pt Consolas, monospace; background: var(--caja); border-radius: 1.5mm; padding: .8mm 2.2mm; }
  .rel span { font-family: Inter; font-weight: 800; background: var(--verde-50); color: var(--verde-osc); }
  .indice td.cod { width: 14mm; font-weight: 900; }
  .sin-corte { break-inside: avoid; }
  .ejemplo { font: 500 8.2pt/1.5 Consolas, monospace; background: var(--caja); border-radius: 2mm; padding: 2.5mm 3mm; margin: 0; }
  mark { background: #ffe14d; color: var(--tinta); border-radius: .6mm; padding: 0 .5mm; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .aviso { margin: 0 0 2mm; font-size: 8.6pt; color: var(--tinta); }
  .cambios { margin-top: 2mm; }
  .cambios td { padding: 1mm 2mm; }
  .cambios td.que { width: 44mm; font-weight: 800; color: #d0021b; }
  td.calc { font-size: 8.3pt; line-height: 1.32; }
  .porcuenta th.cuenta { text-align: center; border-left: 1.5px solid var(--linea); letter-spacing: .06em; }
  .porcuenta .num { text-align: center; width: 12mm; font-weight: 700; padding-left: 1mm; padding-right: 1mm; }
  .porcuenta .no { color: #d0021b; }
  .porcuenta td.num:nth-child(3n+2), .porcuenta tr:nth-child(2) th.num:nth-child(3n+1) { border-left: 1.5px solid var(--linea); }
  td .detalle { display: block; font-weight: 400; font-size: 8pt; color: var(--gris); }
  .reutilizar { display: grid; grid-template-columns: 66mm 1fr; gap: 5mm; align-items: center; }
  .reutilizar .pantalla { width: 66mm; margin: 0; }
  .reutilizar ol { margin: 0; padding-left: 5mm; font-size: 9pt; } .reutilizar li { margin-bottom: 1.2mm; }
  .capturas { display: grid; grid-template-columns: repeat(6, 1fr); gap: 3mm; }
  .captura { grid-column: span 3; display: flex; flex-direction: column; break-inside: avoid; border: 1px solid var(--linea); border-radius: 2.5mm; padding: 2mm; }
  .captura.texto { grid-column: span 2; }
  .captura.texto.mitad { grid-column: span 3; }
  .captura h3 { display: flex; align-items: flex-start; gap: 1.8mm; font-size: 9pt; line-height: 1.25; font-weight: 800; margin: 0 0 1.6mm; min-height: 6mm; }
  .captura h3 b { flex: none; min-width: 5.4mm; text-align: center; font-size: 8pt; line-height: 1; color: #fff; background: var(--tinta); border-radius: 1.2mm; padding: 1mm 1.1mm; }
  .captura p { font-size: 8pt; line-height: 1.35; color: #34343f; margin: 1.5mm 0 0; }
  .pantalla { position: relative; width: 72mm; margin: 0 auto; border: 1px solid var(--linea); border-radius: 1.5mm; overflow: hidden; }
  .pantalla img { display: block; width: 100%; }
  .pantalla i { position: absolute; border: 1.6pt solid #e01f3d; border-radius: 1.2mm; }
  .consola { flex: 1; margin: 0; padding: 2mm 2.4mm; border-radius: 1.5mm; background: #121214; color: #e9eaee; font: 500 6.6pt/1.45 Consolas, Menlo, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
`;
export const nombreDe = c => (FLUJOS.find(f => f.codigo === c) || {}).nombre || c;
// Secciones opcionales de un flujo: tablas de datos y un ejemplo para copiar
const tablaHtml = t => `<div class="sin-corte"><h2>${esc(t.titulo)}</h2><table><tr>${t.columnas.map(c => `<th>${esc(c)}</th>`).join('')}</tr>
    ${t.filas.map(fila => `<tr>${fila.map((c, i) => `<td class="${i ? '' : 'paso'}">${esc(c)}</td>`).join('')}</tr>`).join('')}</table>
    <p class="leyenda">${esc(t.nota)}</p></div>`;
// Casuística de duración: se calcula para que las cifras no se desalineen si cambia un caso o un cupo.
export function necesita(k, minutos) {
  const segundos = minutos * 60;
  const laminas = Math.ceil(segundos / k.lamina);
  const escenas = Math.ceil(segundos / k.escena);
  const avatares = k.soloAvatares || escenas;
  return { laminas, imagenes: laminas * k.intentos, avatares, voces: escenas - avatares };
}
export function clasesAlMes(cuenta, n) {
  const porImagen = cuenta.creditos ? cuenta.creditos / (n.imagenes + n.voces) : cuenta.imagenes / n.imagenes;
  return Math.min(Math.floor(porImagen), Math.floor(cuenta.avatares / n.avatares));
}
function celdaCaso(k, minutos) {
  const n = necesita(k, minutos);
  const voces = n.voces ? `<br>${n.voces} ${n.voces === 1 ? 'voz' : 'voces'} en off` : '';
  return `<td class="calc"><b>${n.laminas} láminas</b><br>${n.imagenes} imágenes<br>${n.avatares} avatares${voces}</td>`;
}
const celdaCuenta = (cuenta, k, minutos) => {
  const clases = clasesAlMes(cuenta, necesita(k, minutos));
  return clases ? `<td class="num">${clases}</td>` : '<td class="num no">No</td>';
};
function casuisticaDe(f) {
  const c = f.casuistica;
  if (!c) return '';
  const minutos = [1, 2, 3];
  const nombre = k => `<td class="paso">${esc(k.nombre)}<span class="detalle">${esc(k.detalle)}</span></td>`;
  const filas = c.casos.map(k => `<tr>${nombre(k)}${minutos.map(m => celdaCaso(k, m)).join('')}</tr>`).join('');
  const porCuenta = c.casos.map(k => `<tr><td class="paso">${esc(k.nombre)}</td>${c.cuentas.map(q => minutos.map(m => celdaCuenta(q, k, m)).join('')).join('')}</tr>`).join('');
  const r = f.reutilizar;
  return `<div class="salto"></div><div class="sin-corte"><h2>${esc(c.titulo)}</h2><table><tr><th>Caso</th>${minutos.map(m => `<th>${m} ${m === 1 ? 'minuto' : 'minutos'}</th>`).join('')}</tr>${filas}</table>
    <p class="leyenda">${esc(c.nota)}</p></div>
    <div class="sin-corte"><h2>${esc(c.tituloCuentas)}</h2><table class="porcuenta"><tr><th rowspan="2">Caso</th>${c.cuentas.map(q => `<th colspan="3" class="cuenta">${esc(q.nombre)}</th>`).join('')}</tr>
      <tr>${c.cuentas.map(() => minutos.map(m => `<th class="num">${m} min</th>`).join('')).join('')}</tr>${porCuenta}</table>
    <p class="leyenda">${esc(c.notaCuentas)}</p></div>
    ${tablaHtml(f.casosEjemplo)}
    <div class="sin-corte"><h2>${esc(r.titulo)}</h2><div class="reutilizar">${pantallaHtml(r, r.titulo)}<ol>${r.pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol></div></div>`;
}
function tablasExtra(f) {
  const tablas = (f.tablas || []).map(tablaHtml).join('');
  const ejemplos = (f.ejemplos || []).map(e => `<div class="sin-corte"><h2>${esc(e.titulo)}</h2><p class="leyenda aviso">Copia el prompt y cambia solo lo que está en <mark>amarillo</mark>. Si va entre comillas, deja las comillas: la IA copia ese texto en la lámina. Lo demás guarda el estilo del curso.</p>
    <p class="ejemplo">${esc(e.texto).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>')}</p>
    <table class="cambios"><tr><th>Aquí cambias</th><th>En este ejemplo dice</th></tr>${e.cambios.map(([q, v]) => `<tr><td class="que">${esc(q)}</td><td><mark>${esc(v)}</mark></td></tr>`).join('')}</table></div>`).join('');
  return tablas + casuisticaDe(f) + ejemplos;
}
// Sección opcional: una captura o salida de comando por paso; las marcas van en píxeles de la captura original
const CAPTURA = { ancho: 800, alto: 677 };
function pantallaHtml(c, titulo) {
  const { ancho, alto } = { ...CAPTURA, ...c };
  const marcas = (c.marcas || []).map(([x, y, a, h]) => `<i style="left:${x / ancho * 100}%;top:${y / alto * 100}%;width:${a / ancho * 100}%;height:${h / alto * 100}%"></i>`).join('');
  return `<div class="pantalla"><img src="../capturas/${c.imagen}" alt="${esc(titulo)}">${marcas}</div>`;
}
function pasoConCaptura(f, c) {
  const titulo = f.pasos[c.paso - 1][1];
  const vista = c.consola ? `<pre class="consola">${esc(c.consola)}</pre>` : pantallaHtml(c, titulo);
  return `<div class="captura${c.consola ? ' texto' : ''}${c.mitad ? ' mitad' : ''}"><h3><b>${c.paso}</b>${esc(titulo)}</h3>${vista}<p>${esc(c.pie)}</p></div>`;
}
function capturasDe(f) {
  if (!f.capturas) return '';
  return `<div class="salto"></div><h2>Paso a paso con capturas</h2><div class="capturas">${f.capturas.map(c => pasoConCaptura(f, c)).join('')}</div><div class="salto"></div>`;
}
export function html(f) {
  const ficha = Object.entries({ Código: f.codigo, ...f.ficha });
  // datos cortos en una celda; los largos en media fila; el ultimo largo sin pareja, en la fila completa
  const cortos = new Set(['Código', 'Responsable', 'Frecuencia', 'Tiempo', 'Tiempo total']);
  const largos = ficha.filter(([k]) => !cortos.has(k)).map(([k]) => k);
  const ancho = k => (cortos.has(k) ? '' : largos.length % 2 && k === largos[largos.length - 1] ? 'c4' : 'c2');
  const filas = f.pasos.map(([c, texto, detalle, decision], k) => `<tr class="${decision ? 'dec' : ''}"><td class="n">${k + 1}${decision ? ' ◆' : ''}</td>
    <td class="actor">${esc(f.carriles[c])}</td><td class="paso">${esc(texto)}</td><td>${esc(detalle)}</td></tr>`).join('');
  const indice = f.indice ? `<h2>Índice de flujos</h2><table class="indice"><tr><th>Código</th><th>Flujo</th><th>Para qué sirve</th></tr>
    ${FLUJOS.filter(x => !x.indice).map(x => `<tr><td class="cod">${x.codigo}</td><td class="paso">${esc(x.nombre)}</td><td>${esc(x.proposito)}</td></tr>`).join('')}</table>
    <h2>Dónde vive cada parte</h2><table><tr><th>Parte</th><th>Qué hace</th><th>Archivos</th></tr>
    ${PARTES.map(([a, b, c]) => `<tr><td class="paso">${esc(a)}</td><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}</table>` : '';
  const resto = f.indice ? indice : `
    <h2>Pasos del flujo</h2><table><tr><th>N.°</th><th>Actor</th><th>Paso</th><th>Qué pasa</th></tr>${filas}</table>
    ${capturasDe(f)}
    ${tablasExtra(f)}
    <h2>Reglas del negocio</h2><ul class="reglas">${f.reglas.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
    <div class="sin-corte"><h2>Errores frecuentes</h2><table><tr><th>Lo que ves</th><th>Por qué pasa</th><th>Qué hacer</th></tr>
      ${f.errores.map(([a, b, c]) => `<tr><td class="paso">${esc(a)}</td><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}</table></div>
    <h2>Archivos y datos</h2><div class="chips">${f.datos.map(d => `<span>${esc(d)}</span>`).join('')}</div>
    <h2>Flujos relacionados</h2><div class="chips rel">${f.relacionados.map(r => `<span>${r} · ${esc(nombreDe(r))}</span>`).join('')}</div>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${f.codigo} · ${esc(f.nombre)}</title><style>${CSS}</style></head><body>
    <a class="volver" href="../../../index.html">Volver al portal</a>
    <p class="etiqueta">Manual de flujos · Estudio de clases USS · ${viaDe(f) === 'por-web' ? 'Por web' : 'Por terminal'}</p>
    <h1><span class="cod">${f.codigo}</span>${esc(f.nombre)}</h1>
    <p class="proposito">${esc(f.proposito)}</p>
    <div class="ficha">${ficha.map(([k, v]) => `<div class="${ancho(k)}"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}</div>
    <div class="bloque-diagrama"><h2>Diagrama del flujo</h2>${diagrama(f)}
    <p class="leyenda">Cada carril es un actor y los pasos van de arriba abajo. Las cajas punteadas son decisiones: «Sí» sigue la flecha; la otra salida está en la tabla de pasos (◆).</p></div>
    <div class="salto"></div>${resto}
  </body></html>`;
}

// ---------------------------------------------------------------- PDF con encabezado y pie de la USS
export const encabezado = f => `<div style="width:100%;margin:0 16mm;padding-bottom:2mm;border-bottom:1px solid #e3e4e8;display:flex;justify-content:space-between;
  align-items:center;font-family:Arial,sans-serif;font-size:7pt;color:#5d616c;-webkit-print-color-adjust:exact">
  <img src="${LOGO}" alt="USS Centro de Informática" style="height:7mm"><span>Estudio de clases · ${f.codigo}</span></div>`;
export const pie = f => `<div style="width:100%;margin:0 16mm;padding-top:2mm;border-top:1px solid #e3e4e8;display:flex;justify-content:space-between;
  font-family:Arial,sans-serif;font-size:6.8pt;color:#5d616c"><span>${esc(f.codigo)} · ${esc(f.nombre)}</span>
  <span>${VERSION} · <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
