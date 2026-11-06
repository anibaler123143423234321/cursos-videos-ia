// Genera toda la documentación del Estudio de clases: guías en PDF y Word, presentación y portal.
// Uso, desde la carpeta del repositorio:  node guias/fuente/manual/generar.mjs
// Antes, una sola vez: npm install dentro de guias/fuente/manual. Mapa de carpetas: guias/LEEME.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FLUJOS, GRUPOS, PARTES, VERSION } from './datos.mjs';
import { clasesAlMes, encabezado, html, necesita, nombreDe, pie, viaDe } from './plantilla.mjs';
import { crearPortal } from './portal.mjs';
import { crearGuiaDocente } from '../guia-docente/generar.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '..', '..', '..');
const GUIAS = path.join(REPO, 'guias');
const DIR_HTML = path.join(AQUI, 'html');
const LOGO = path.join(REPO, 'clases-mac', 'marca', 'logo-transparente.png');

const salidaDe = (via, formato, nombre) => {
  const d = path.join(GUIAS, via, formato);
  fs.mkdirSync(d, { recursive: true });
  return path.join(d, `${nombre}.${formato === 'pdf' ? 'pdf' : 'docx'}`);
};
const listo = f => console.log(`[OK] ${path.relative(process.cwd(), f)}`);

async function playwright() {
  for (const kit of ['clases-mac', 'clases-windows']) {
    const f = path.join(REPO, kit, 'node_modules', 'playwright', 'index.mjs');
    if (fs.existsSync(f)) return import(pathToFileURL(f).href);
  }
  throw new Error('Falta Playwright: instala el kit (clases-mac o clases-windows) con INSTALAR-TODO.');
}

fs.mkdirSync(DIR_HTML, { recursive: true });
const { crearWord, crearWordDocente } = await import('./word.mjs').catch(() => ({}));
if (!crearWord) console.log('[!] Sin Word: ejecuta npm install en guias/fuente/manual');
const { crearPresentacion } = await import('./presentacion.mjs').catch(e => { console.log(`[!] Sin presentación: ${e.message}`); return {}; });

const { chromium } = await playwright();
const navegador = await chromium.launch();
try {
  const pagina = await navegador.newPage();
  for (const f of FLUJOS) {
    const archivoHtml = path.join(DIR_HTML, `${f.archivo}.html`);
    fs.writeFileSync(archivoHtml, html(f));
    await pagina.goto(pathToFileURL(archivoHtml).href, { waitUntil: 'load' });
    await pagina.evaluate(() => document.fonts.ready);
    const salida = salidaDe(viaDe(f), 'pdf', f.archivo);
    await pagina.pdf({ path: salida, format: 'A4', printBackground: true, displayHeaderFooter: true, outline: true, tagged: true,
      headerTemplate: encabezado(f), footerTemplate: pie(f), margin: { top: '20mm', bottom: '16mm', left: '16mm', right: '16mm' } });
    listo(salida);
  }
  const docente = await crearGuiaDocente({ navegador, salidaPdf: salidaDe('por-web', 'pdf', 'Guia-docente-crear-un-video') });
  listo(salidaDe('por-web', 'pdf', 'Guia-docente-crear-un-video'));

  if (crearWord) {
    // El Word usa los diagramas y las capturas ya dibujados, con sus marcas.
    const nitida = await navegador.newPage({ deviceScaleFactor: 3 });
    for (const f of FLUJOS) {
      const salida = salidaDe(viaDe(f), 'word', f.archivo);
      await crearWord({ f, via: viaDe(f), flujos: FLUJOS, partes: PARTES, nombreDe, necesita, clasesAlMes, pagina: nitida, archivoHtml: path.join(DIR_HTML, `${f.archivo}.html`), salida, version: VERSION, rutaLogo: LOGO });
      listo(salida);
    }
    const salida = salidaDe('por-web', 'word', 'Guia-docente-crear-un-video');
    await crearWordDocente({ datos: docente, salida, version: VERSION, rutaLogo: LOGO, dir: path.join(GUIAS, 'fuente', 'guia-docente') });
    listo(salida);
  }

  if (crearPresentacion) {
    const salida = path.join(GUIAS, 'presentaciones', 'Las-4-formas-de-crear-el-video.pptx');
    await crearPresentacion({ salida, capturas: path.join(AQUI, 'capturas'), logo: LOGO });
    listo(salida);
  }

  const portal = path.join(GUIAS, 'index.html');
  crearPortal({ salida: portal, guias: GUIAS, flujos: FLUJOS, grupos: GRUPOS, version: VERSION, viaDe, logo: LOGO });
  listo(portal);
} finally {
  await navegador.close();
}
