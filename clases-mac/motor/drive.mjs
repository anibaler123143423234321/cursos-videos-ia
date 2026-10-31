#!/usr/bin/env node
// Google Drive: guarda cada video final y el codigo de su clase, ordenados por carpetas, dentro de una carpeta
// COMPARTIDA con el equipo (todos los que tienen acceso a ella ven los videos). Una carpeta por tipo de lamina:
//   <DRIVE_CARPETA_ID> / <DRIVE_CARPETA> / <AAAA-MM> / <Curso> / Video con HTML    / <Modulo> / <clase> /
//                                                            / Video con láminas / ...   (video, clase en HTML, clase.json, laminas)
//
// Uso:
//   node motor/drive.mjs conectar                 una sola vez: abre el navegador para dar permiso (CONECTAR-DRIVE)
//   node motor/drive.mjs subir <clase>            sube salidas/<clase>.mp4 y el codigo de la clase
//   node motor/drive.mjs subir <clase> --prueba   muestra que subiria y a donde, sin subir nada
//   node motor/drive.mjs estado                   dice si Drive esta conectado
//
// Dos formas (.env):
//   A) API de Google: DRIVE_CARPETA_ID = enlace o ID de la carpeta compartida. Necesita google-drive-cliente.json
//      (cliente OAuth "App de escritorio" de un proyecto de Google Cloud de la USS, ver LEEME) y CONECTAR-DRIVE una vez.
//      El permiso es "drive" (no "drive.file") porque la carpeta compartida no la creo este programa.
//      El permiso queda en drive-token.json. Ninguno de los dos archivos se sube a GitHub.
//   B) Google Drive para escritorio, sin token: DRIVE_RUTA_LOCAL = la carpeta compartida tal como aparece en la PC
//      (acceso directo en Mi unidad), p. ej. G:\Mi unidad\CINF GEX. Se copian ahi y Drive los sube solo.

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLIENTE_F = path.join(RAIZ, 'google-drive-cliente.json');
const TOKEN_F = path.join(RAIZ, 'drive-token.json');
const ALCANCE = 'https://www.googleapis.com/auth/drive';
const CARPETA = 'application/vnd.google-apps.folder';
const TIPOS = { '.mp4': 'video/mp4', '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.txt': 'text/plain', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
// tambien funciona si la carpeta esta en una unidad compartida (Shared Drive)
const TODAS = { supportsAllDrives: 'true' };
const texto = e => String((e && e.message) || e);

// "https://drive.google.com/drive/folders/1NRf...?usp=sharing" o solo "1NRf..." -> "1NRf..."
export function idCarpeta(v) {
  const s = String(v || '').trim();
  const m = /\/folders\/([A-Za-z0-9_-]{10,})/.exec(s) || /[?&]id=([A-Za-z0-9_-]{10,})/.exec(s) || /^([A-Za-z0-9_-]{10,})$/.exec(s);
  return m ? m[1] : '';
}
const rutaLocal = () => String(process.env.DRIVE_RUTA_LOCAL || '').trim();
export const modo = () => (rutaLocal() ? 'local' : 'api');
export const conectado = () => (rutaLocal() ? fs.existsSync(rutaLocal()) : fs.existsSync(CLIENTE_F) && fs.existsSync(TOKEN_F));
export const tieneCliente = () => fs.existsSync(CLIENTE_F);

function cargarEnv() {
  const f = path.join(RAIZ, '.env');
  if (!fs.existsSync(f)) return;
  for (const linea of fs.readFileSync(f, 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    if (/^\s*#/.test(linea)) continue;
    const m = linea.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    const v = m && m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (v && !(m[1] in process.env)) process.env[m[1]] = v;
  }
}

function cliente() {
  if (!fs.existsSync(CLIENTE_F)) {
    throw new Error('Falta google-drive-cliente.json en la carpeta del kit. Crealo en Google Cloud (LEEME, Google Drive) y guardalo con ese nombre.');
  }
  const j = JSON.parse(fs.readFileSync(CLIENTE_F, 'utf8'));
  const c = j.installed || j.web || j;
  if (!c.client_id || !c.client_secret) throw new Error('google-drive-cliente.json no parece un cliente OAuth (falta client_id o client_secret).');
  return { id: c.client_id, secreto: c.client_secret, tokenUri: c.token_uri || 'https://oauth2.googleapis.com/token' };
}

// ---------------------------------------------------------------- permiso (OAuth con PKCE y redireccion a esta PC)
export async function conectar() {
  const c = cliente();
  const verificador = crypto.randomBytes(48).toString('base64url');
  const reto = crypto.createHash('sha256').update(verificador).digest('base64url');
  const estado = crypto.randomBytes(16).toString('hex');
  let listo;
  const respuesta = new Promise((ok, mal) => { listo = { ok, mal }; });
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    if (u.pathname !== '/') { res.writeHead(404); return res.end(); }
    const pagina = (titulo, msg) => `<!doctype html><meta charset="utf-8"><title>${titulo}</title>
      <body style="font:18px system-ui;max-width:560px;margin:80px auto;color:#222"><h1>${titulo}</h1><p>${msg}</p></body>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    if (u.searchParams.get('state') !== estado) { res.end(pagina('Algo no cuadra', 'Vuelve a abrir CONECTAR-DRIVE.')); return; }
    if (u.searchParams.get('error')) {
      res.end(pagina('No se dio el permiso', 'Puedes cerrar esta pestaña y volver a intentarlo.'));
      listo.mal(new Error(`Google respondio: ${u.searchParams.get('error')}`));
      return;
    }
    res.end(pagina('Listo: Google Drive conectado', 'Ya puedes cerrar esta pestaña. Los videos finales se subiran solos a tu Drive.'));
    listo.ok(u.searchParams.get('code'));
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const redireccion = `http://127.0.0.1:${srv.address().port}`;
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: c.id, redirect_uri: redireccion, response_type: 'code', scope: ALCANCE, access_type: 'offline',
    prompt: 'consent', state: estado, code_challenge: reto, code_challenge_method: 'S256',
  });
  console.log('\nSe abre el navegador: entra con la cuenta de Google que tiene acceso (Editor) a la carpeta compartida.');
  console.log('Si no se abre, copia esta direccion en el navegador de ESTA PC:\n\n' + url + '\n');
  abrir(url);
  const espera = setTimeout(() => listo.mal(new Error('Pasaron 5 minutos sin respuesta. Vuelve a abrir CONECTAR-DRIVE.')), 5 * 60 * 1000);
  try {
    const codigo = await respuesta;
    const t = await pedirToken(c, { grant_type: 'authorization_code', code: codigo, redirect_uri: redireccion, code_verifier: verificador });
    if (!t.refresh_token) throw new Error('Google no devolvio un permiso duradero. Quita el acceso de la app en myaccount.google.com/permissions y vuelve a conectar.');
    guardarToken(t);
    console.log('[OK] Google Drive conectado. El permiso quedo en drive-token.json (no lo compartas).');
  } finally {
    clearTimeout(espera);
    srv.close();
  }
}

async function pedirToken(c, campos) {
  const r = await fetch(c.tokenUri, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: c.id, client_secret: c.secreto, ...campos }),
  }).catch(e => { throw new Error(`no hay conexion con Google (${texto(e.cause || e)})`); });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (j.error === 'invalid_grant') {
      throw new Error('El permiso de Google Drive vencio o fue retirado: vuelve a abrir CONECTAR-DRIVE.\n' +
        '    (Si tu proyecto de Google Cloud esta en modo "Prueba", el permiso dura 7 dias: pasalo a "En produccion".)');
    }
    throw new Error(`Google respondio ${r.status}: ${j.error_description || j.error || ''}`);
  }
  return j;
}

function guardarToken(t) {
  const previo = fs.existsSync(TOKEN_F) ? JSON.parse(fs.readFileSync(TOKEN_F, 'utf8')) : {};
  const nuevo = { ...previo, access_token: t.access_token, vence: Date.now() + (t.expires_in || 3600) * 1000 };
  if (t.refresh_token) nuevo.refresh_token = t.refresh_token;
  fs.writeFileSync(TOKEN_F, JSON.stringify(nuevo, null, 2));
  return nuevo;
}

async function token() {
  if (!fs.existsSync(TOKEN_F)) throw new Error('Google Drive no esta conectado: abre CONECTAR-DRIVE en la PC del estudio.');
  const t = JSON.parse(fs.readFileSync(TOKEN_F, 'utf8'));
  if (t.access_token && t.vence > Date.now() + 60000) return t.access_token;
  return guardarToken(await pedirToken(cliente(), { grant_type: 'refresh_token', refresh_token: t.refresh_token })).access_token;
}

// ---------------------------------------------------------------- API de Drive (v3)
async function api(metodo, url, { json, cuerpo, cabeceras = {} } = {}) {
  const r = await fetch(url.startsWith('http') ? url : `https://www.googleapis.com/drive/v3/${url}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${await token()}`, ...(json ? { 'Content-Type': 'application/json; charset=UTF-8' } : {}), ...cabeceras },
    body: json ? JSON.stringify(json) : cuerpo,
  }).catch(e => { throw new Error(`no hay conexion con Google Drive (${texto(e.cause || e)})`); });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    const msg = (j.error && j.error.message) || r.statusText;
    const pista = r.status === 403 && /storage|quota/i.test(msg) ? ' (el Drive esta lleno: libera espacio o usa otra cuenta)'
      : r.status === 403 && /has not been used|disabled/i.test(msg) ? ' (activa la "Google Drive API" en tu proyecto de Google Cloud)'
      : r.status === 403 && /scope|insufficient/i.test(msg) ? ' (el permiso guardado es antiguo: vuelve a abrir CONECTAR-DRIVE)'
      : r.status === 404 ? ' (no veo la carpeta: revisa DRIVE_CARPETA_ID y que tu cuenta sea Editor de esa carpeta)' : '';
    throw new Error(`Drive respondio ${r.status}${pista}: ${msg}`);
  }
  return r;
}

const comillas = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
async function buscar(nombre, padre, esCarpeta) {
  const q = `name='${comillas(nombre)}' and '${padre}' in parents and trashed=false and mimeType${esCarpeta ? '=' : '!='}'${CARPETA}'`;
  const r = await api('GET', `files?${new URLSearchParams({ q, fields: 'files(id,name)', pageSize: '10', includeItemsFromAllDrives: 'true', ...TODAS })}`);
  return ((await r.json()).files || [])[0] || null;
}
async function carpeta(nombre, padre) {
  const hay = await buscar(nombre, padre, true);
  if (hay) return hay.id;
  const r = await api('POST', `files?${new URLSearchParams({ fields: 'id', ...TODAS })}`, { json: { name: nombre, mimeType: CARPETA, parents: [padre] } });
  return (await r.json()).id;
}
// la carpeta compartida debe existir y la cuenta conectada debe poder agregar archivos (Editor)
async function revisarDestino(id) {
  const r = await api('GET', `files/${id}?${new URLSearchParams({ fields: 'id,name,mimeType,capabilities(canAddChildren)', ...TODAS })}`);
  const f = await r.json();
  if (f.mimeType !== CARPETA) throw new Error(`DRIVE_CARPETA_ID no es una carpeta (${f.name})`);
  if (f.capabilities && f.capabilities.canAddChildren === false) throw new Error(`Tu cuenta no puede agregar archivos en "${f.name}": pide permiso de Editor a su dueño.`);
  return f.name;
}
// sube un archivo; si ya existe uno con ese nombre en la carpeta, lo reemplaza (asi no se duplica al volver a renderizar)
async function subirArchivo(f, nombre, padre) {
  const tipo = TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream';
  const datos = fs.readFileSync(f);
  const hay = await buscar(nombre, padre, false);
  const inicio = await api(hay ? 'PATCH' : 'POST',
    `https://www.googleapis.com/upload/drive/v3/files${hay ? `/${hay.id}` : ''}?uploadType=resumable&fields=id&supportsAllDrives=true`,
    { json: hay ? {} : { name: nombre, parents: [padre] }, cabeceras: { 'X-Upload-Content-Type': tipo, 'X-Upload-Content-Length': String(datos.length) } });
  const destino = inicio.headers.get('location');
  if (!destino) throw new Error('Drive no devolvio la direccion de subida');
  const r = await fetch(destino, { method: 'PUT', headers: { 'Content-Type': tipo, 'Content-Length': String(datos.length) }, body: datos })
    .catch(e => { throw new Error(`se corto la subida de ${nombre} (${texto(e.cause || e)})`); });
  if (!r.ok) throw new Error(`Drive no acepto ${nombre}: ${r.status} ${(await r.text().catch(() => '')).slice(0, 200)}`);
  return (await r.json()).id;
}

// ---------------------------------------------------------------- subir una clase
const limpio = s => String(s || '').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim();

// Que se sube y a donde. El mes queda fijo en clases/<clase>/drive.json desde la primera subida,
// asi un video que se vuelve a crear en otro mes reemplaza al anterior en vez de duplicarse.
export function plan(slug) {
  const dir = path.join(RAIZ, 'clases', slug);
  const f = path.join(dir, 'clase.json');
  if (!fs.existsSync(f)) throw new Error(`No existe clases/${slug}/clase.json`);
  const clase = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
  const previo = fs.existsSync(path.join(dir, 'drive.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'drive.json'), 'utf8')) : {};
  const hoy = new Date();
  const mes = previo.mes || `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  // las dos opciones de la web van en carpetas separadas: laminas del docente (imagenes) o laminas HTML animadas
  const tipo = (clase.diapositivas || []).some(d => d.tipo === 'imagen') ? 'Video con láminas' : 'Video con HTML';
  const ruta = [limpio(process.env.DRIVE_CARPETA) || 'Videos de clases IA', mes, limpio(clase.curso) || 'Sin curso', tipo, limpio(clase.modulo) || 'Sin modulo', slug];
  const archivos = [];
  const agregar = (rel, nombre = path.basename(rel), sub = null) => { const a = path.join(RAIZ, rel); if (fs.existsSync(a)) archivos.push({ f: a, nombre, sub }); };
  agregar(path.join('salidas', `${slug}.mp4`));
  agregar(path.join('salidas', `${slug}.html`)); // la clase en un solo HTML (motor/exportar-html.mjs)
  for (const n of ['clase.json', 'diapositivas.js', 'ficha.json', 'ficha.txt']) agregar(path.join('clases', slug, n));
  const laminas = path.join(dir, 'laminas');
  if (fs.existsSync(laminas)) for (const n of fs.readdirSync(laminas).sort()) if (/\.(jpe?g|png|webp)$/i.test(n)) agregar(path.join('clases', slug, 'laminas', n), n, 'laminas');
  return { dir, mes, ruta, archivos, previo };
}

export async function subirClase(slug, { prueba = false } = {}) {
  cargarEnv();
  const p = plan(slug);
  const video = p.archivos.find(a => a.f.endsWith('.mp4'));
  const raiz = idCarpeta(process.env.DRIVE_CARPETA_ID);
  const local = rutaLocal();
  const inicio = local || (raiz ? `carpeta compartida ${raiz}` : 'Mi unidad');
  console.log(`[..] Google Drive: ${inicio} / ${p.ruta.join(' / ')}`);
  if (!video) console.log(`[!] Aun no hay video final (salidas/${slug}.mp4): subo solo el codigo de la clase.`);
  if (prueba) {
    for (const a of p.archivos) console.log(`   subiria: ${a.sub ? `${a.sub}/` : ''}${a.nombre}  (${(fs.statSync(a.f).size / 1048576).toFixed(1)} MB)`);
    return null;
  }

  // B) Google Drive para escritorio: copiar a la carpeta sincronizada
  if (local) {
    if (!fs.existsSync(local)) throw new Error(`No existe DRIVE_RUTA_LOCAL (${local}). ¿Esta abierto Google Drive para escritorio y la carpeta agregada a Mi unidad?`);
    const destino = path.join(local, ...p.ruta);
    for (const a of p.archivos) {
      const d = a.sub ? path.join(destino, a.sub) : destino;
      fs.mkdirSync(d, { recursive: true });
      process.stdout.write(`   drive: ${a.sub ? `${a.sub}/` : ''}${a.nombre}... `);
      fs.copyFileSync(a.f, path.join(d, a.nombre));
      console.log('ok');
    }
    fs.writeFileSync(path.join(p.dir, 'drive.json'), JSON.stringify({ mes: p.mes, ruta: p.ruta.join(' / '), local: destino, subido: new Date().toISOString() }, null, 2));
    console.log(`[OK] Copiado a ${destino}\n     Google Drive para escritorio lo sube solo (mira el icono de la nube).`);
    return destino;
  }

  // A) API de Google
  let padre = raiz || 'root';
  if (raiz) console.log(`   carpeta compartida: ${await revisarDestino(raiz)}`);
  for (const nombre of p.ruta) padre = await carpeta(nombre, padre);
  const subcarpetas = {};
  for (const a of p.archivos) {
    const destino = a.sub ? (subcarpetas[a.sub] ||= await carpeta(a.sub, padre)) : padre;
    process.stdout.write(`   drive: ${a.sub ? `${a.sub}/` : ''}${a.nombre}... `);
    await subirArchivo(a.f, a.nombre, destino);
    console.log('ok');
  }
  const enlace = `https://drive.google.com/drive/folders/${padre}`;
  fs.writeFileSync(path.join(p.dir, 'drive.json'), JSON.stringify({ mes: p.mes, ruta: p.ruta.join(' / '), carpeta: padre, enlace, subido: new Date().toISOString() }, null, 2));
  console.log(`[OK] En Google Drive: ${p.ruta.join(' / ')}\n     ${enlace}`);
  return enlace;
}

function abrir(url) {
  const [cmd, a] = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['rundll32', ['url.dll,FileProtocolHandler', url]]
    : ['xdg-open', [url]];
  spawn(cmd, a, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
}

// ---------------------------------------------------------------- linea de comandos
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  cargarEnv();
  const [orden, slug] = process.argv.slice(2).filter(a => !a.startsWith('--'));
  try {
    if (orden === 'conectar') await conectar();
    else if (orden === 'subir' && slug) await subirClase(slug, { prueba: process.argv.includes('--prueba') });
    else if (orden === 'estado') {
      console.log(modo() === 'local' ? (conectado() ? `[OK] Google Drive para escritorio: ${rutaLocal()}` : `[!] No existe DRIVE_RUTA_LOCAL: ${rutaLocal()}`)
        : conectado() ? '[OK] Google Drive conectado' : tieneCliente() ? '[!] Falta conectar: abre CONECTAR-DRIVE' : '[!] Falta google-drive-cliente.json (ver LEEME)');
    }
    else { console.log('Uso: node motor/drive.mjs conectar | subir <clase> [--prueba] | estado'); process.exit(1); }
  } catch (e) {
    console.error(`\n[X] ${texto(e)}`);
    process.exit(1);
  }
}
