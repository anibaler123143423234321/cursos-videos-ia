#!/usr/bin/env node
// Láminas de Google Vids: node web/vids-prompts.mjs <clase> [bloques] [--contexto]
// Con --contexto escribe clases/<clase>/vids-pedido.txt: pégalo en Claude o ChatGPT y guarda su respuesta en
// clases/<clase>/vids-contenido.json. Lo que falte en ese archivo lo escribe la IA gratis de .env.
// El resultado queda en clases/<clase>/vids.json. Con bloques (por ejemplo 01 02 03) solo prepara esas láminas.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contextoVids, promptsVids } from './ia.mjs';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function leerEnv() {
  const f = path.join(RAIZ, '.env');
  if (!fs.existsSync(f)) return {};
  const env = {};
  for (const linea of fs.readFileSync(f, 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !/^\s*#/.test(linea)) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}

const slug = process.argv[2];
if (!slug) {
  console.error('Uso: node web/vids-prompts.mjs <clase>');
  process.exit(1);
}
const dir = path.join(RAIZ, 'clases', slug);
const claseF = path.join(dir, 'clase.json');
if (!fs.existsSync(claseF)) {
  console.error(`No existe la clase ${slug}.`);
  process.exit(1);
}

try {
  const clase = JSON.parse(fs.readFileSync(claseF, 'utf8'));
  const opciones = process.argv.slice(3);
  const bloques = opciones.filter(o => !o.startsWith('--'));
  if (opciones.includes('--contexto')) {
    fs.writeFileSync(path.join(dir, 'vids-pedido.txt'), contextoVids(clase, bloques));
    console.log(`Pedido listo: clases/${slug}/vids-pedido.txt`);
    process.exit(0);
  }
  const contenidoF = path.join(dir, 'vids-contenido.json');
  const escritas = fs.existsSync(contenidoF) ? JSON.parse(fs.readFileSync(contenidoF, 'utf8')).laminas : [];
  const contenido = Object.fromEntries(escritas.map(c => [String(c.lamina).padStart(2, '0'), c]));
  const resultado = await promptsVids({ clase, env: { ...process.env, ...leerEnv() }, bloques, contenido });
  fs.writeFileSync(path.join(dir, 'vids.json'), `${JSON.stringify(resultado, null, 2)}\n`);
  for (const l of resultado.laminas) console.log(`\n${l.id} · ${l.parte} · ${l.plantilla}\nPROMPT: ${l.prompt}\nGUION: ${l.guion}`);
  console.log(`\n${resultado.laminas.length} láminas guardadas en clases/${slug}/vids.json`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
