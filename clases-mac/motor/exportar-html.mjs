#!/usr/bin/env node
// Exporta una clase a UN solo archivo HTML (salidas/<clase>.html): las diapositivas animadas, la voz, la agenda
// y el robot, para verla en cualquier navegador sin instalar nada. Se guarda tambien en Google Drive junto al video.
// (Si la clase usa camara.mp4 o avatar.mp4, en el HTML se ve el robot.)
//
// Uso: node motor/exportar-html.mjs <clase>      necesita la voz ya generada (salida/tiempos.json)
// El motor lo hace solo despues de cada video final.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MOTOR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(MOTOR, '..');
const FS = path.join(RAIZ, 'node_modules', '@fontsource');
// solo el subconjunto latino: alcanza para el espanol y pesa poco
const FUENTES = [
  ...[400, 500, 600, 700, 800, 900].map(p => ['Inter', p, 'normal', `inter/files/inter-latin-${p}-normal.woff2`]),
  ['Instrument Serif', 400, 'normal', 'instrument-serif/files/instrument-serif-latin-400-normal.woff2'],
  ['Instrument Serif', 400, 'italic', 'instrument-serif/files/instrument-serif-latin-400-italic.woff2'],
  ['JetBrains Mono', 400, 'normal', 'jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'],
  ['JetBrains Mono', 600, 'normal', 'jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2'],
];
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

const leer = f => fs.readFileSync(f, 'utf8').replace(/^﻿/, '');
const datoUrl = f => `data:${MIME[path.extname(f).toLowerCase()] || 'application/octet-stream'};base64,${fs.readFileSync(f).toString('base64')}`;
const moduloUrl = src => `data:text/javascript;base64,${Buffer.from(src).toString('base64')}`;
// el codigo que va dentro de <script> no puede contener "</script"
const enScript = (src, nombre) => {
  if (/<\/script/i.test(src)) throw new Error(`${nombre} contiene "</script": no se puede incrustar`);
  return src;
};
function cambiar(src, a, b, nombre) {
  if (!src.includes(a)) throw new Error(`No encontre ${a} en ${nombre}: revisa exportar-html.mjs`);
  return src.split(a).join(b);
}

export function exportarHtml(slug) {
  const dir = path.join(RAIZ, 'clases', slug);
  const sal = path.join(dir, 'salida');
  const clase = JSON.parse(leer(path.join(dir, 'clase.json')));
  for (const f of ['tiempos.json', 'boca.json', 'voz-completa.mp3']) {
    if (!fs.existsSync(path.join(sal, f))) throw new Error(`Falta clases/${slug}/salida/${f}: crea primero la voz o el video`);
  }
  const plantillas = Array.isArray(clase.diapositivas) && clase.diapositivas.length > 0;

  // modulos del motor como data: URL con nombres fijos (mapa de importacion)
  const imports = {
    '@clase/util': moduloUrl(leer(path.join(MOTOR, 'util.js'))),
    '@clase/robot': moduloUrl(leer(path.join(MOTOR, 'robot.js'))),
  };
  if (plantillas) imports['@clase/auto'] = moduloUrl(leer(path.join(MOTOR, 'diapos-auto.js')));
  else imports['@clase/diapositivas'] = moduloUrl(leer(path.join(dir, 'diapositivas.js')));
  let principal = leer(path.join(MOTOR, 'plantilla.js'));
  principal = cambiar(principal, "from './util.js'", "from '@clase/util'", 'plantilla.js');
  principal = cambiar(principal, "from './robot.js'", "from '@clase/robot'", 'plantilla.js');
  principal = cambiar(principal, "import('./diapos-auto.js')", "import('@clase/auto')", 'plantilla.js');

  // datos y archivos de la clase
  const archivos = { voz: datoUrl(path.join(sal, 'voz-completa.mp3')) };
  const logo = path.join(RAIZ, 'marca', 'logo.png');
  if (fs.existsSync(logo)) archivos.logo = datoUrl(logo);
  for (const d of clase.diapositivas || []) {
    if (d.tipo === 'imagen' && d.imagen && !archivos[d.imagen]) archivos[d.imagen] = datoUrl(path.join(dir, ...d.imagen.split('/')));
  }
  const datos = {
    'clase.json': clase,
    'tiempos.json': JSON.parse(leer(path.join(sal, 'tiempos.json'))),
    'boca.json': JSON.parse(leer(path.join(sal, 'boca.json'))),
  };
  const embebida = JSON.stringify({ slug, datos, archivos }).replace(/</g, '\\u003c');

  const fuentes = FUENTES.map(([familia, peso, estilo, f]) =>
    `@font-face{font-family:'${familia}';font-weight:${peso};font-style:${estilo};font-display:block;src:url(${datoUrl(path.join(FS, f))}) format('woff2')}`).join('\n');
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  let html = leer(path.join(MOTOR, 'plantilla.html'));
  html = html.replace(/^\s*<link rel="stylesheet"[^>]*>\s*$/gm, '').replace(/^\s*<script src="[^"]*gsap[^"]*"><\/script>\s*$/m, '');
  html = cambiar(html, '<script type="module" src="/motor/plantilla.js"></script>',
    `<script type="module">\n${enScript(principal, 'plantilla.js')}\n</script>`, 'plantilla.html');
  html = cambiar(html, '<title>Clase en video</title>', `<title>${esc(clase.tema || slug)} · Clase en video</title>`, 'plantilla.html');
  html = cambiar(html, '</head>', [
    `<style>\n${fuentes}\n${enScript(leer(path.join(MOTOR, 'plantilla.css')), 'plantilla.css')}\n</style>`,
    `<script>\n${enScript(leer(path.join(RAIZ, 'node_modules', 'gsap', 'dist', 'gsap.min.js')), 'gsap')}\n</script>`,
    `<script>window.__CLASE = ${embebida};</script>`,
    `<script type="importmap">${JSON.stringify({ imports })}</script>`,
    '</head>',
  ].join('\n'), 'plantilla.html');

  const salida = path.join(RAIZ, 'salidas', `${slug}.html`);
  fs.mkdirSync(path.dirname(salida), { recursive: true });
  fs.writeFileSync(salida, html);
  console.log(`[OK] Clase en HTML: salidas/${slug}.html (${(fs.statSync(salida).size / 1048576).toFixed(1)} MB; se abre con doble clic)`);
  return salida;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const slug = process.argv.slice(2).find(a => !a.startsWith('--'));
  try {
    if (!slug) throw new Error('Uso: node motor/exportar-html.mjs <clase>');
    exportarHtml(slug);
  } catch (e) {
    console.error(`\n[X] ${(e && e.message) || e}`);
    process.exit(1);
  }
}
