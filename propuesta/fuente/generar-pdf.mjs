// Genera ../Propuesta-Cursos-IA-Diseno-Web-USS.pdf a partir de propuesta.html (usa el Playwright del kit de Windows).
// Uso (desde la carpeta del repositorio):  node propuesta/fuente/generar-pdf.mjs
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = await import(pathToFileURL(path.join(AQUI, '..', '..', 'clases-windows', 'node_modules', 'playwright', 'index.mjs')).href);
const salida = path.join(AQUI, '..', 'Propuesta-Cursos-IA-Diseno-Web-USS.pdf');
const navegador = await chromium.launch();
try {
  const pagina = await navegador.newPage();
  await pagina.goto(pathToFileURL(path.join(AQUI, 'propuesta.html')).href, { waitUntil: 'load' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({ path: salida, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(`[OK] ${path.relative(process.cwd(), salida)}`);
} finally {
  await navegador.close();
}
