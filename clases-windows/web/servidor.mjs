#!/usr/bin/env node
// Estudio de clases USS: la web para que el equipo cree clases en video desde el navegador.
// Uso: node web/servidor.mjs   (o INICIAR-WEB). Se entra desde cualquier PC de la red con la clave de .env (WEB_CLAVE).

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generarClase, normalizar } from './ia.mjs';

const WEB = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(WEB, '..');
const PUBLICO = path.join(WEB, 'publico');
const CLASES = path.join(RAIZ, 'clases');
const ENV_F = path.join(RAIZ, '.env');
const texto = e => String((e && e.message) || e);

// ---------------------------------------------------------------- .env
function leerEnv() {
  const env = {};
  if (!fs.existsSync(ENV_F)) return env;
  for (const linea of fs.readFileSync(ENV_F, 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !/^\s*#/.test(linea)) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return env;
}
function guardarEnv(cambios) {
  const lineas = fs.existsSync(ENV_F) ? fs.readFileSync(ENV_F, 'utf8').replace(/^﻿/, '').split(/\r?\n/) : [];
  const pendientes = { ...cambios };
  const nuevas = lineas.map(l => {
    const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=/);
    if (m && !/^\s*#/.test(l) && m[1] in pendientes) {
      const v = pendientes[m[1]];
      delete pendientes[m[1]];
      return `${m[1]}=${v}`;
    }
    return l;
  });
  for (const [k, v] of Object.entries(pendientes)) nuevas.push(`${k}=${v}`);
  fs.writeFileSync(ENV_F, nuevas.join(os.EOL).replace(/(\r?\n)*$/, os.EOL));
}
let ENV = leerEnv();
if (!ENV.WEB_CLAVE) {
  ENV.WEB_CLAVE = crypto.randomBytes(5).toString('hex');
  guardarEnv({ WEB_CLAVE: ENV.WEB_CLAVE });
  console.log(`[i] Se creo una clave para la web y se guardo en .env (WEB_CLAVE): ${ENV.WEB_CLAVE}`);
}
const PUERTO = parseInt(process.env.WEB_PUERTO || ENV.WEB_PUERTO || '8080', 10);

// ---------------------------------------------------------------- sesiones (clave compartida)
const sesiones = new Map(); // token -> vence (ms)
const intentos = new Map(); // ip -> [ms...]
function sesionValida(req) {
  const m = /(?:^|;\s*)sesion=([a-f0-9]{48})/.exec(req.headers.cookie || '');
  if (!m) return false;
  const vence = sesiones.get(m[1]);
  if (!vence || vence < Date.now()) { sesiones.delete(m[1]); return false; }
  return true;
}
function claveCorrecta(c) {
  const a = Buffer.from(String(c || ''));
  const b = Buffer.from(ENV.WEB_CLAVE);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---------------------------------------------------------------- utilidades HTTP
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.opus': 'audio/ogg',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8',
};
function json(res, codigo, datos) {
  const cuerpo = JSON.stringify(datos);
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(cuerpo);
}
function leerJson(req, limite = 2 << 20) {
  return new Promise((resolve, reject) => {
    let tam = 0;
    const partes = [];
    req.on('data', d => { tam += d.length; if (tam > limite) { reject(new Error('Petición demasiado grande')); req.destroy(); } else partes.push(d); });
    req.on('end', () => { try { resolve(partes.length ? JSON.parse(Buffer.concat(partes).toString('utf8')) : {}); } catch { reject(new Error('JSON inválido')); } });
    req.on('error', reject);
  });
}
function enviarArchivo(req, res, f, { descarga } = {}) {
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end(); }
  const tam = fs.statSync(f).size;
  const tipo = TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream';
  const cab = { 'Content-Type': tipo, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
  if (descarga) cab['Content-Disposition'] = `attachment; filename="${descarga}"`;
  const rango = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (rango) {
    const a = rango[1] ? parseInt(rango[1], 10) : 0;
    const z = rango[2] ? Math.min(parseInt(rango[2], 10), tam - 1) : tam - 1;
    res.writeHead(206, { ...cab, 'Content-Range': `bytes ${a}-${z}/${tam}`, 'Content-Length': z - a + 1 });
    fs.createReadStream(f, { start: a, end: z }).pipe(res);
  } else {
    res.writeHead(200, { ...cab, 'Content-Length': tam });
    fs.createReadStream(f).pipe(res);
  }
}
const slugValido = s => /^[a-z0-9][a-z0-9-]{0,60}$/.test(String(s || ''));
const dirClase = s => path.join(CLASES, s);
function slugDe(tema) {
  const base = String(tema || 'clase').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').concat('-').slice(0, 41).replace(/-[^-]*$/, '') || 'clase';
  let s = base;
  for (let i = 2; fs.existsSync(dirClase(s)); i++) s = `${base}-${i}`;
  return s;
}
function leerClase(slug) {
  const f = path.join(dirClase(slug), 'clase.json');
  if (!slugValido(slug) || !fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
}
function guardarClase(slug, clase) {
  fs.mkdirSync(dirClase(slug), { recursive: true });
  clase.slug = slug;
  fs.writeFileSync(path.join(dirClase(slug), 'clase.json'), JSON.stringify(clase, null, 2));
}
const EXT_AUDIO = ['m4a', 'mp3', 'wav', 'ogg', 'opus', 'aac', 'flac', 'webm', 'mp4', 'mov', 'aiff'];
const EXT_VIDEO = ['mp4', 'mov', 'webm', 'm4v'];
function archivosDe(slug) {
  const d = dirClase(slug);
  const lista = [];
  const agregar = (rel) => { const f = path.join(d, rel); if (fs.existsSync(f)) lista.push({ nombre: rel.replace(/\\/g, '/'), tam: fs.statSync(f).size }); };
  for (const e of EXT_VIDEO) { agregar(`camara.${e}`); agregar(`avatar.${e}`); }
  const voz = path.join(d, 'voz');
  if (fs.existsSync(voz)) for (const f of fs.readdirSync(voz)) if (EXT_AUDIO.includes(path.extname(f).slice(1).toLowerCase())) agregar(path.join('voz', f));
  return lista;
}
function resumen(slug) {
  const c = leerClase(slug);
  if (!c) return null;
  const tiempos = path.join(dirClase(slug), 'salida', 'tiempos.json');
  const video = path.join(RAIZ, 'salidas', `${slug}.mp4`);
  return {
    slug, tema: c.tema || slug, curso: c.curso || '', avatar: c.avatar || '',
    bloques: (c.bloques || []).length,
    palabras: (c.bloques || []).reduce((n, b) => n + String(b.texto || '').split(/\s+/).filter(Boolean).length, 0),
    duracion: fs.existsSync(tiempos) ? JSON.parse(fs.readFileSync(tiempos, 'utf8')).total : null,
    video: fs.existsSync(video) ? { tam: fs.statSync(video).size, fecha: fs.statSync(video).mtimeMs } : null,
    diapositivas: Array.isArray(c.diapositivas) && c.diapositivas.length ? 'plantillas' : fs.existsSync(path.join(dirClase(slug), 'diapositivas.js')) ? 'codigo' : 'ninguna',
  };
}

// ---------------------------------------------------------------- trabajos (videos, uno a la vez)
const trabajos = [];
let ocupado = false;
const MODOS = { video: [], borrador: ['--rapido'], voz: ['--solo-voz'], capturas: ['--capturas'] };
function encolar(slug, modo) {
  const ya = trabajos.find(t => t.slug === slug && t.modo === modo && (t.estado === 'en-cola' || t.estado === 'trabajando'));
  if (ya) return ya;
  const t = { id: crypto.randomBytes(4).toString('hex'), slug, modo, estado: 'en-cola', progreso: 0, mensaje: 'En cola', log: [], inicio: Date.now(), fin: null };
  trabajos.unshift(t);
  trabajos.splice(40);
  siguiente();
  return t;
}
function siguiente() {
  if (ocupado) return;
  const t = [...trabajos].reverse().find(x => x.estado === 'en-cola');
  if (!t) return;
  ocupado = true;
  t.estado = 'trabajando';
  t.mensaje = 'Preparando la voz...';
  const env = { ...process.env, ...leerEnv() };
  const hijo = spawn(process.execPath, [path.join(RAIZ, 'motor', 'crear-video.mjs'), t.slug, ...MODOS[t.modo]], { cwd: RAIZ, env, windowsHide: true });
  let resto = '';
  const leer = d => {
    resto += d.toString();
    const partes = resto.split(/[\r\n]+/);
    resto = partes.pop();
    for (const l of partes.map(x => x.trimEnd()).filter(Boolean)) {
      const m = /cuadro (\d+)\/(\d+)/.exec(l);
      if (m) { t.progreso = Math.round(15 + (85 * +m[1]) / +m[2]); t.mensaje = `Dibujando el video: ${m[1]}/${m[2]} cuadros`; continue; }
      t.log.push(l);
      t.log.splice(0, Math.max(0, t.log.length - 60));
      if (/^\s*voz (\d+)/.test(l)) { t.mensaje = `Generando la voz (bloque ${/voz (\d+)/.exec(l)[1]})`; t.progreso = Math.max(t.progreso, 5); }
      if (/\[OK\] Voz:/.test(l)) { t.progreso = Math.max(t.progreso, 15); t.mensaje = l.replace(/^\[OK\]\s*/, ''); }
      if (/\[X\]/.test(l)) t.mensaje = l.replace(/^\[X\]\s*/, '');
    }
  };
  hijo.stdout.on('data', leer);
  hijo.stderr.on('data', leer);
  hijo.on('close', codigo => {
    if (resto.trim()) leer('\n');
    t.fin = Date.now();
    t.estado = codigo === 0 ? 'listo' : 'error';
    t.progreso = codigo === 0 ? 100 : t.progreso;
    if (codigo === 0) t.mensaje = { video: 'Video listo', borrador: 'Borrador listo', voz: 'Voz lista: ya puedes ver la vista previa', capturas: 'Capturas listas' }[t.modo];
    else if (!/\w/.test(t.mensaje) || t.mensaje === 'Preparando la voz...') t.mensaje = 'Falló: revisa el detalle';
    ocupado = false;
    siguiente();
  });
  hijo.on('error', e => { t.estado = 'error'; t.mensaje = texto(e); ocupado = false; siguiente(); });
}

// ---------------------------------------------------------------- ajustes permitidos desde la web
const AJUSTES = {
  ELEVENLABS_API_KEY: { secreto: true }, ELEVENLABS_VOICE_ID: {}, ANTHROPIC_API_KEY: { secreto: true }, CLAUDE_MODELO: {},
  IA_GRATIS_URL: {}, IA_GRATIS_KEY: { secreto: true }, IA_GRATIS_MODELO: {}, VOZ: {}, VOZ_SISTEMA: {}, WEB_CLAVE: { secreto: true },
};
const enmascarar = v => (v ? `${'•'.repeat(6)}${String(v).slice(-4)}` : '');

// ---------------------------------------------------------------- rutas
async function rutaApi(req, res, url) {
  const p = url.pathname;
  const m = (patron) => patron.exec(p);
  let r;

  if (p === '/api/login' && req.method === 'POST') {
    const ip = req.socket.remoteAddress || '';
    const recientes = (intentos.get(ip) || []).filter(x => x > Date.now() - 60000);
    if (recientes.length >= 8) return json(res, 429, { error: 'Demasiados intentos. Espera un minuto.' });
    const { clave } = await leerJson(req);
    if (!claveCorrecta(clave)) { recientes.push(Date.now()); intentos.set(ip, recientes); return json(res, 401, { error: 'Clave incorrecta' }); }
    const token = crypto.randomBytes(24).toString('hex');
    sesiones.set(token, Date.now() + 12 * 3600e3);
    res.setHeader('Set-Cookie', `sesion=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200`);
    return json(res, 200, { ok: true });
  }
  if (!sesionValida(req)) return json(res, 401, { error: 'Inicia sesión' });

  if (p === '/api/salir' && req.method === 'POST') {
    const t = /(?:^|;\s*)sesion=([a-f0-9]{48})/.exec(req.headers.cookie || '');
    if (t) sesiones.delete(t[1]);
    res.setHeader('Set-Cookie', 'sesion=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    return json(res, 200, { ok: true });
  }
  if (p === '/api/estado') {
    const env = leerEnv();
    return json(res, 200, {
      ia: { claude: !!env.ANTHROPIC_API_KEY, gratis: !!(env.IA_GRATIS_KEY || /localhost|127\.0\.0\.1/.test(env.IA_GRATIS_URL || '')) },
      voz: { elevenlabs: !!(env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID) },
      logo: fs.existsSync(path.join(RAIZ, 'marca', 'logo.png')),
    });
  }
  if (p === '/api/clases' && req.method === 'GET') {
    const lista = fs.existsSync(CLASES) ? fs.readdirSync(CLASES).filter(slugValido).map(resumen).filter(Boolean) : [];
    lista.sort((a, b) => ((b.video && b.video.fecha) || 0) - ((a.video && a.video.fecha) || 0) || a.tema.localeCompare(b.tema));
    return json(res, 200, lista);
  }
  if (p === '/api/clases' && req.method === 'POST') {
    const { ficha = {}, modo = 'manual', guion = '' } = await leerJson(req);
    if (!String(ficha.tema || '').trim()) return json(res, 400, { error: 'Escribe el tema de la clase' });
    const { clase, uso, aviso } = await generarClase({ ficha, modo, guion, env: leerEnv() });
    const slug = slugDe(clase.tema);
    guardarClase(slug, clase);
    fs.writeFileSync(path.join(dirClase(slug), 'ficha.json'), JSON.stringify({ ...ficha, modo, creada: new Date().toISOString() }, null, 2));
    return json(res, 200, { slug, uso, aviso });
  }
  if ((r = m(/^\/api\/clases\/([a-z0-9-]+)$/))) {
    const slug = r[1];
    const clase = leerClase(slug);
    if (!clase) return json(res, 404, { error: 'No existe esa clase' });
    if (req.method === 'GET') return json(res, 200, { clase, resumen: resumen(slug), archivos: archivosDe(slug), codigo: fs.existsSync(path.join(dirClase(slug), 'diapositivas.js')) });
    if (req.method === 'PUT') {
      const { clase: nueva } = await leerJson(req);
      const conCodigo = fs.existsSync(path.join(dirClase(slug), 'diapositivas.js')) && !(nueva.diapositivas || []).length;
      // revalida estructura (ids, tipos, largos) sin cambiar los textos que escribio el docente
      const limpia = normalizar({ ...nueva, pronunciacion: Object.entries(nueva.pronunciacion || {}).map(([escrito, dice]) => ({ escrito, dice })) }, nueva, nueva);
      if (conCodigo) delete limpia.diapositivas;
      guardarClase(slug, limpia);
      return json(res, 200, { ok: true, clase: limpia });
    }
    if (req.method === 'DELETE') {
      const papelera = path.join(RAIZ, 'papelera');
      fs.mkdirSync(papelera, { recursive: true });
      fs.renameSync(dirClase(slug), path.join(papelera, `${slug}-${Date.now()}`));
      return json(res, 200, { ok: true });
    }
  }
  if ((r = m(/^\/api\/clases\/([a-z0-9-]+)\/ia$/)) && req.method === 'POST') {
    const clase = leerClase(r[1]);
    if (!clase) return json(res, 404, { error: 'No existe esa clase' });
    const { modo = 'gratis' } = await leerJson(req);
    const ficha = fs.existsSync(path.join(dirClase(r[1]), 'ficha.json')) ? JSON.parse(fs.readFileSync(path.join(dirClase(r[1]), 'ficha.json'), 'utf8')) : {};
    const { clase: nueva, uso, aviso } = await generarClase({ ficha: { ...ficha, ...clase }, modo, guion: clase.bloques, env: leerEnv(), base: clase });
    guardarClase(r[1], nueva);
    return json(res, 200, { ok: true, clase: nueva, uso, aviso });
  }
  if ((r = m(/^\/api\/clases\/([a-z0-9-]+)\/archivo$/))) {
    const slug = r[1];
    if (!leerClase(slug)) return json(res, 404, { error: 'No existe esa clase' });
    const nombre = String(url.searchParams.get('nombre') || '');
    const valido = /^(voz\/(completa|\d{2})\.(m4a|mp3|wav|ogg|opus|aac|flac|webm|mp4|mov|aiff)|(camara|avatar)\.(mp4|mov|webm|m4v))$/i.test(nombre);
    if (!valido) return json(res, 400, { error: 'Nombre de archivo no permitido' });
    const destino = path.join(dirClase(slug), ...nombre.split('/'));
    if (req.method === 'DELETE') { fs.rmSync(destino, { force: true }); return json(res, 200, { ok: true }); }
    if (req.method === 'PUT') {
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      // un solo archivo por tipo: borra las otras extensiones del mismo nombre
      const baseNom = path.basename(destino).replace(/\.[^.]+$/, '');
      for (const f of fs.readdirSync(path.dirname(destino))) if (f.replace(/\.[^.]+$/, '') === baseNom) fs.rmSync(path.join(path.dirname(destino), f), { force: true });
      const tmp = destino + '.subiendo';
      const salida = fs.createWriteStream(tmp);
      let tam = 0;
      await new Promise((resolve, reject) => {
        req.on('data', d => { tam += d.length; if (tam > 2 * 1024 ** 3) { req.destroy(); reject(new Error('Archivo de más de 2 GB')); } });
        req.pipe(salida);
        salida.on('finish', resolve);
        req.on('error', reject);
        salida.on('error', reject);
      });
      fs.renameSync(tmp, destino);
      return json(res, 200, { ok: true, archivos: archivosDe(slug) });
    }
  }
  if ((r = m(/^\/api\/clases\/([a-z0-9-]+)\/trabajo$/)) && req.method === 'POST') {
    if (!leerClase(r[1])) return json(res, 404, { error: 'No existe esa clase' });
    const { modo } = await leerJson(req);
    if (!MODOS[modo]) return json(res, 400, { error: 'Modo inválido' });
    return json(res, 200, encolar(r[1], modo));
  }
  if (p === '/api/trabajos') return json(res, 200, trabajos);
  if ((r = m(/^\/api\/clases\/([a-z0-9-]+)\/video$/))) {
    const borrador = url.searchParams.get('borrador') === '1';
    const f = path.join(RAIZ, 'salidas', `${r[1]}${borrador ? '-borrador' : ''}.mp4`);
    return enviarArchivo(req, res, f, { descarga: url.searchParams.get('ver') === '1' ? null : path.basename(f) });
  }
  if ((r = m(/^\/api\/clases\/([a-z0-9-]+)\/capturas$/))) {
    const d = path.join(dirClase(r[1]), 'salida', 'capturas');
    const lista = fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.jpg')).sort() : [];
    return json(res, 200, lista.map(f => `/clases/${r[1]}/salida/capturas/${f}?t=${fs.statSync(path.join(d, f)).mtimeMs}`));
  }
  if (p === '/api/ajustes' && req.method === 'GET') {
    const env = leerEnv();
    return json(res, 200, Object.fromEntries(Object.entries(AJUSTES).map(([k, o]) => [k, o.secreto ? enmascarar(env[k]) : env[k] || ''])));
  }
  if (p === '/api/ajustes' && req.method === 'POST') {
    const datos = await leerJson(req);
    const cambios = {};
    for (const [k, v] of Object.entries(datos)) {
      if (!(k in AJUSTES)) continue;
      const valor = String(v == null ? '' : v).replace(/[\r\n]/g, '').trim();
      if (AJUSTES[k].secreto && (valor === '' || valor.startsWith('••'))) continue; // sin cambios
      if (k === 'WEB_CLAVE' && valor.length < 6) return json(res, 400, { error: 'La clave de la web debe tener al menos 6 caracteres' });
      cambios[k] = valor;
    }
    guardarEnv(cambios);
    ENV = leerEnv();
    return json(res, 200, { ok: true });
  }
  return json(res, 404, { error: 'No encontrado' });
}

// archivos estaticos que usa la plantilla del video (vista previa) y la web
function rutaEstatica(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const publico = path.join(PUBLICO, path.normalize(p));
  if (publico.startsWith(PUBLICO + path.sep) && fs.existsSync(publico) && fs.statSync(publico).isFile()) return enviarArchivo(req, res, publico);
  if (!sesionValida(req)) { res.writeHead(401); return res.end(); }
  const f = path.join(RAIZ, path.normalize(p));
  const rel = path.relative(RAIZ, f).split(path.sep);
  const permitido = rel[0] === 'motor' || rel[0] === 'marca' || (rel[0] === 'clases' && slugValido(rel[1])) ||
    (rel[0] === 'node_modules' && (rel[1] === 'gsap' || rel[1] === '@fontsource'));
  if (!permitido || rel.some(x => x.startsWith('.') || x === '..')) { res.writeHead(403); return res.end(); }
  return enviarArchivo(req, res, f);
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) await rutaApi(req, res, url);
    else rutaEstatica(req, res, url);
  } catch (e) {
    console.error('[!]', texto(e));
    if (!res.headersSent) json(res, 500, { error: texto(e) });
    else res.end();
  }
});
servidor.requestTimeout = 15 * 60 * 1000; // generar con IA o subir videos grandes puede tardar
servidor.listen(PUERTO, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('\n==================================================');
  console.log('  ESTUDIO DE CLASES USS - la web esta encendida');
  console.log('==================================================');
  console.log(`  En esta PC:        http://localhost:${PUERTO}`);
  for (const ip of ips) console.log(`  Desde otra PC:     http://${ip}:${PUERTO}`);
  console.log('  Clave:             la de WEB_CLAVE en el archivo .env');
  console.log('  Deja esta ventana abierta mientras tu equipo la use (Ctrl+C para apagar).\n');
});
