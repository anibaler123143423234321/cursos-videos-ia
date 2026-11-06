#!/usr/bin/env node
// Láminas animadas para Hyperframes: node web/hyperframes.mjs <clase> [bloques]
// Deja un proyecto en clases/<clase>/hyperframes/: index.html, una subcomposición por lámina, assets/ e imagenes.json.
// Si existe clases/<clase>/hyperframes-contenido.json (escrito por Claude o ChatGPT con web/pedido.mjs), se usa primero.
// Con --reconstruir vuelve a armar sin gastar IA. La voz y el avatar van aparte.
// Validar y renderizar: cd clases/<clase>/hyperframes && npx hyperframes lint && npx hyperframes render
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generarProyecto } from './hf-proyecto.mjs';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
function leerEnv() {
  const f = path.join(RAIZ, '.env');
  if (!fs.existsSync(f)) return {};
  const env = {};
  for (const linea of fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !/^\s*#/.test(linea)) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}

const argumentos = process.argv.slice(2);
const [slug, ...resto] = argumentos.filter(a => !a.startsWith('--'));
if (!slug) {
  console.error('Uso: node web/hyperframes.mjs <clase> [bloques] [--reconstruir]');
  process.exit(1);
}
if (!fs.existsSync(path.join(RAIZ, 'clases', slug, 'clase.json'))) {
  console.error(`No existe la clase ${slug}.`);
  process.exit(1);
}
try {
  const r = await generarProyecto({ slug, env: { ...process.env, ...leerEnv() }, bloques: resto, reconstruir: argumentos.includes('--reconstruir') });
  const faltan = r.imagenes.filter(i => !i.archivo);
  console.log(`${r.laminas} láminas y ${r.segundos} segundos en clases/${slug}/hyperframes/index.html`);
  if (faltan.length) console.log(`Faltan ${faltan.length} imágenes: súbelas en la web, pestaña Imágenes. Sus prompts están en imagenes.json.`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
