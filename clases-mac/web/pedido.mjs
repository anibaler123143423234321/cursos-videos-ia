#!/usr/bin/env node
// Pedido con todo el contexto, para pegarlo en Claude, ChatGPT o cualquier modelo: node web/pedido.mjs <clase> guion|vids|hyperframes [bloques]
// Queda en clases/<clase>/pedido-<tipo>.txt. Las reglas salen de web/skills, así que todos los modelos siguen la misma guía.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contextoGuion, contextoHyperframes, contextoVids } from './ia.mjs';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS = { guion: c => contextoGuion(c), vids: contextoVids, hyperframes: contextoHyperframes };
const [slug, tipo, ...bloques] = process.argv.slice(2);
if (!slug || !TIPOS[tipo]) {
  console.error('Uso: node web/pedido.mjs <clase> guion|vids|hyperframes [bloques]');
  process.exit(1);
}
const dir = path.join(RAIZ, 'clases', slug);
const claseF = path.join(dir, 'clase.json');
if (!fs.existsSync(claseF)) {
  console.error(`No existe la clase ${slug}.`);
  process.exit(1);
}
const salida = path.join(dir, `pedido-${tipo}.txt`);
fs.writeFileSync(salida, TIPOS[tipo](JSON.parse(fs.readFileSync(claseF, 'utf8')), bloques));
console.log(`Pedido listo: clases/${slug}/pedido-${tipo}.txt`);
