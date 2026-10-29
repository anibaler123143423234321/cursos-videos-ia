#!/usr/bin/env node
// Motor de clases en video (USS): voz -> tiempos -> cuadros (Playwright) -> MP4 (ffmpeg).
//
// Uso:
//   node motor/crear-video.mjs <nombre-corto>              video final 1920x1080 a 30 fps
//   node motor/crear-video.mjs <nombre-corto> --rapido     borrador liviano (960x540, 12 fps)
//   node motor/crear-video.mjs <nombre-corto> --capturas   solo imagenes de cada bloque (para revisar)
//   node motor/crear-video.mjs <nombre-corto> --vista      vista previa con sonido en el navegador
//   node motor/crear-video.mjs <nombre-corto> --solo-voz   solo genera la voz (voz-completa.mp3)
//   node motor/crear-video.mjs <nombre-corto> --guion      escribe GUION-PARA-GRABAR.txt para grabar tu voz
//   Opcional: --voz=elevenlabs | --voz=sistema   (por defecto: auto)
//
// Voz, en este orden (modo auto):
//   1. clases/<clase>/camara.mp4        tu video de camara: tu cara en el recuadro + tu voz
//   2. clases/<clase>/voz/completa.m4a  una sola grabacion con pausas de 2 s entre bloques (se corta sola)
//   3. clases/<clase>/voz/01.m4a ...    grabaciones por bloque (reemplazan al bloque de la grabacion completa)
//   4. ElevenLabs (voz clonada) si .env tiene ELEVENLABS_API_KEY y ELEVENLABS_VOICE_ID
//   5. voz del sistema (macOS / Windows)
//
// NO editar para una clase concreta: cada clase vive en clases/<nombre-corto>/.

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { once } from 'node:events';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MOTOR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(MOTOR, '..');
const ANCHO = 1920;
const ALTO = 1080;
const INICIO = 0.8;   // silencio antes de la primera frase
const PAUSA = 0.45;   // pausa por defecto entre bloques
const COLA = 2.0;     // segundos finales despues de la ultima frase
const FPS_BOCA = 30;  // resolucion de la envolvente de voz (boca del robot)

const texto = e => String((e && e.message) || e);
let FFMPEG = null;   // ruta de ffmpeg (la busca programa())
let FFPROBE = null;  // opcional
const PROBADOS = {};
const r3 = n => Math.round(n * 1000) / 1000;

// ---------------------------------------------------------------- argumentos
const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--') && !a.includes('=')));
const opcion = n => {
  const a = args.find(x => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : null;
};
const RAPIDO = flags.has('--rapido');
const CAPTURAS = flags.has('--capturas');
const VISTA = flags.has('--vista');
const SOLO_VOZ = flags.has('--solo-voz');
const GUION = flags.has('--guion');
const EXT_AUDIO = ['m4a', 'mp3', 'wav', 'aiff', 'aif', 'ogg', 'opus', 'flac', 'aac', 'webm', 'mp4', 'mov'];
const LIMPIAR_GRABACION = 'highpass=f=70,afftdn=nr=10:nf=-45';

cargarEnv();

let slug = args.find(a => !a.startsWith('--'));
const dirClases = path.join(RAIZ, 'clases');
if (!slug) {
  const lista = fs.existsSync(dirClases)
    ? fs.readdirSync(dirClases).filter(d => fs.existsSync(path.join(dirClases, d, 'clase.json')))
    : [];
  if (lista.length === 1) slug = lista[0];
  else {
    console.log('Uso: node motor/crear-video.mjs <nombre-corto> [--rapido|--capturas|--vista|--solo-voz]');
    console.log('Clases disponibles:\n  ' + (lista.join('\n  ') || '(ninguna)'));
    process.exit(1);
  }
}
const DIR = path.join(dirClases, slug);
const SAL = path.join(DIR, 'salida');

try {
  await principal();
} catch (e) {
  console.error('\n[X] ' + texto(e));
  process.exit(1);
}

// ---------------------------------------------------------------- flujo
async function principal() {
  if (!fs.existsSync(path.join(DIR, 'clase.json'))) throw new Error(`No existe clases/${slug}/clase.json`);
  const clase = JSON.parse(fs.readFileSync(path.join(DIR, 'clase.json'), 'utf8').replace(/^\uFEFF/, ''));
  validar(clase);
  if (GUION) return escribirGuion(clase);
  if (!fs.existsSync(path.join(DIR, 'diapositivas.js'))) throw new Error(`No existe clases/${slug}/diapositivas.js`);
  FFMPEG = programa('ffmpeg');
  if (!FFMPEG) {
    throw new Error(`No puedo usar ffmpeg. Probe: ${PROBADOS.ffmpeg.join(' | ')}\n` +
      '    Instalalo (Windows: winget install -e --id Gyan.FFmpeg / Mac: brew install ffmpeg), cierra la ventana y vuelve a abrirla.\n' +
      '    Si ya lo tienes en otra carpeta, pon su ruta en .env:  FFMPEG_PATH=C:\\ruta\\a\\ffmpeg.exe');
  }
  FFPROBE = programa('ffprobe'); // opcional: si falta, la duracion se lee con ffmpeg
  fs.mkdirSync(SAL, { recursive: true });

  console.log(`\n== Clase: ${clase.tema || slug}  (${clase.bloques.length} bloques)`);
  const { tiempos, proveedor } = await prepararVoz(clase);
  console.log(`[OK] Voz: ${proveedor}  ·  duracion total ${formatoMin(tiempos.total)}`);
  if (SOLO_VOZ) {
    console.log(`[OK] Audio listo: clases/${slug}/salida/voz-completa.mp3`);
    return;
  }

  const avatar = tiempos.camara ? path.join(DIR, tiempos.camara) : buscarAvatar(tiempos.total);
  if (tiempos.camara) console.log(`[OK] Recuadro de camara: ${tiempos.camara} (tu video)`);

  if (VISTA) {
    const srv = await servidor();
    const url = `http://127.0.0.1:${srv.address().port}/motor/plantilla.html?clase=${encodeURIComponent(slug)}&modo=vista${paramAvatar(avatar)}`;
    console.log(`\n[OK] Vista previa: ${url}\n     Se abrio en tu navegador. Presiona Enter aqui para cerrarla.`);
    abrir(url);
    await new Promise(r => { process.stdin.resume(); process.stdin.once('data', r); process.stdin.once('end', r); });
    process.stdin.pause();
    srv.close();
    return;
  }

  const { chromium } = await import('playwright');
  const srv = await servidor();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const navegador = await chromium.launch();
  try {
    const pagina = await navegador.newPage({ viewport: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1 });
    const erroresPagina = [];
    pagina.on('pageerror', e => erroresPagina.push(texto(e)));
    pagina.on('console', m => { if (m.type() === 'error') erroresPagina.push(m.text()); });
    const q = `clase=${encodeURIComponent(slug)}&modo=render${paramAvatar(avatar)}`;
    await pagina.goto(`${base}/motor/plantilla.html?${q}`);
    await pagina.waitForFunction(() => window.__listo === true || !!window.__error, null, { timeout: 60000 });
    const fallo = await pagina.evaluate(() => window.__error || null);
    if (fallo) throw new Error(`Error en diapositivas.js / plantilla: ${fallo}`);
    await pagina.evaluate(() => document.fonts.ready.then(() => true));

    if (CAPTURAS) return await hacerCapturas(pagina, tiempos);

    const fps = RAPIDO ? 12 : 30;
    const salidaMp4 = path.join(RAIZ, 'salidas', `${slug}${RAPIDO ? '-borrador' : ''}.mp4`);
    fs.mkdirSync(path.dirname(salidaMp4), { recursive: true });

    let capa = null;
    let camara = null;
    if (avatar) {
      camara = await pagina.evaluate(() => window.__camara());
      await pagina.evaluate(() => window.__capa(true));
      capa = path.join(SAL, 'capa-camara.png');
      await pagina.screenshot({ path: capa, type: 'png', omitBackground: true });
      await pagina.evaluate(() => window.__capa(false));
    }

    await renderizar(pagina, tiempos.total, fps, salidaMp4, avatar, camara, capa);
    if (erroresPagina.length) console.log('[!] Avisos de la pagina:\n    ' + [...new Set(erroresPagina)].slice(0, 5).join('\n    '));
    console.log(`\n==================================================\n  LISTO: salidas/${path.basename(salidaMp4)}\n==================================================`);
  } finally {
    await navegador.close().catch(() => {});
    srv.close();
  }
}

// ---------------------------------------------------------------- validacion
function validar(clase) {
  if (!Array.isArray(clase.bloques) || !clase.bloques.length) throw new Error('clase.json no tiene "bloques".');
  const ids = new Set();
  for (const b of clase.bloques) {
    if (!b.id || typeof b.texto !== 'string' || !b.texto.trim()) throw new Error(`Bloque invalido en clase.json: ${JSON.stringify(b).slice(0, 120)}`);
    if (ids.has(b.id)) throw new Error(`Id de bloque repetido: ${b.id}`);
    ids.add(b.id);
  }
}

// ---------------------------------------------------------------- voz
async function prepararVoz(clase) {
  const dirVoz = path.join(SAL, 'voz');
  fs.mkdirSync(dirVoz, { recursive: true });
  // limpia lo temporal de corridas anteriores (se conserva la cache de ElevenLabs)
  for (const f of fs.readdirSync(dirVoz)) {
    if (!/\.elevenlabs\.mp3$|^firmas-elevenlabs\.json$/.test(f)) fs.rmSync(path.join(dirVoz, f), { force: true });
  }
  const pref = (opcion('voz') || process.env.VOZ || 'auto').toLowerCase();
  const usarGrabaciones = pref === 'auto' || pref === 'grabacion';
  const hayEleven = !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);
  if (pref === 'elevenlabs' && !hayEleven) {
    console.log('[!] Pediste ElevenLabs pero falta ELEVENLABS_API_KEY o ELEVENLABS_VOICE_ID en .env');
  }

  // 1) tu video de camara: se respeta su linea de tiempo (imagen y voz quedan sincronizadas)
  const camara = ['camara.mp4', 'camara.mov', 'camara.m4v', 'camara.webm'].map(n => path.join(DIR, n)).find(f => fs.existsSync(f));
  if (camara && usarGrabaciones) return vozDeCamara(clase, camara, dirVoz);

  // 2) tus grabaciones: voz/completa.* (se corta sola) y/o voz/<id>.* por bloque
  const propias = {};
  const dirGrab = path.join(DIR, 'voz');
  if (usarGrabaciones) {
    const completa = buscarAudio(dirGrab, 'completa');
    if (completa) {
      console.log(`   tu grabacion completa: ${path.basename(completa)} (la corto en ${clase.bloques.length} bloques por las pausas)`);
      Object.assign(propias, cortarGrabacion(clase, completa, dirVoz));
    }
    for (const b of clase.bloques) {
      const f = buscarAudio(dirGrab, b.id);
      if (f) propias[b.id] = f;
    }
  }
  const faltan = clase.bloques.filter(b => !propias[b.id]);
  if (Object.keys(propias).length && faltan.length) {
    console.log(`[!] No hay grabacion tuya para los bloques ${faltan.map(b => b.id).join(', ')}: esos usaran voz sintetica.`);
  }

  // 3) voz sintetica para lo que falte
  let proveedor = Object.keys(propias).length ? 'tu voz grabada' : '';
  let fuentes = { ...propias };
  if (faltan.length) {
    let usado = null;
    if ((pref === 'auto' || pref === 'elevenlabs') && hayEleven) {
      try {
        Object.assign(fuentes, await vozElevenLabs(clase, faltan, dirVoz));
        usado = 'ElevenLabs (' + (process.env.ELEVENLABS_MODELO || 'eleven_multilingual_v2') + ')';
      } catch (e) {
        console.log(`[!] ElevenLabs fallo: ${texto(e)}\n    Uso la voz del sistema para TODA la clase (para que no se mezclen voces).`);
      }
    }
    if (!usado) {
      try {
        Object.assign(fuentes, vozSistema(clase, faltan, dirVoz));
        usado = 'voz del sistema';
      } catch (e) {
        console.log(`[!] Voz del sistema no disponible: ${texto(e)}\n    Genero SILENCIO con la duracion estimada (solo sirve para probar la imagen).`);
        Object.assign(fuentes, vozSilencio(clase, faltan, dirVoz));
        usado = 'silencio (sin voz)';
      }
    }
    proveedor = proveedor ? `${proveedor} + ${usado}` : usado;
  }

  // normaliza cada bloque a WAV 48 kHz mono y mide duraciones
  const dur = {};
  for (const b of clase.bloques) {
    const wav = path.join(dirVoz, `${b.id}.norm.wav`);
    const limpiar = propias[b.id] ? ['-af', LIMPIAR_GRABACION] : [];
    ff('-i', fuentes[b.id], '-vn', ...limpiar, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', wav);
    dur[b.id] = duracion(wav);
  }

  // linea de tiempo
  const bloques = {};
  let t = INICIO;
  const lista = [];
  lista.push(silencio(dirVoz, 'sil-inicio', INICIO));
  clase.bloques.forEach((b, i) => {
    bloques[b.id] = { inicio: r3(t), fin: r3(t + dur[b.id]) };
    t += dur[b.id];
    lista.push(`${b.id}.norm.wav`);
    const esUltimo = i === clase.bloques.length - 1;
    const pausa = esUltimo ? COLA : (typeof b.pausa === 'number' ? b.pausa : PAUSA);
    if (pausa > 0) lista.push(silencio(dirVoz, `sil-${b.id}`, pausa));
    t += pausa;
  });
  const total = r3(t);

  fs.writeFileSync(path.join(dirVoz, 'lista.txt'), lista.map(f => `file '${f}'`).join('\n'));
  const crudo = path.join(dirVoz, 'voz-cruda.wav');
  ff('-f', 'concat', '-safe', '0', '-i', path.join(dirVoz, 'lista.txt'), '-c', 'copy', crudo);
  const final = path.join(SAL, 'voz-completa.wav');
  const filtro = proveedor.startsWith('silencio') ? 'anull' : 'loudnorm=I=-16:TP=-1.5:LRA=11';
  ff('-i', crudo, '-af', filtro, '-ar', '48000', '-ac', '1', '-t', String(total), final);
  ff('-i', final, '-c:a', 'libmp3lame', '-b:a', '192k', path.join(SAL, 'voz-completa.mp3'));

  const tiempos = { total, fps_boca: FPS_BOCA, proveedor, bloques };
  fs.writeFileSync(path.join(SAL, 'tiempos.json'), JSON.stringify(tiempos, null, 2));
  fs.writeFileSync(path.join(SAL, 'boca.json'), JSON.stringify(envolvente(final)));
  return { tiempos, proveedor };
}

function buscarAudio(dir, nombre) {
  for (const ext of EXT_AUDIO) {
    const f = path.join(dir, `${nombre}.${ext}`);
    if (fs.existsSync(f)) return f;
  }
  return null;
}

// Encuentra los bloques en una grabacion de corrido: las N-1 pausas mas largas separan los N bloques.
function detectarBloques(wav, clase) {
  const n = clase.bloques.length;
  const r = spawnSync(FFMPEG, ['-v', 'error', '-i', wav, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], { maxBuffer: 1 << 30, windowsHide: true });
  if (r.status !== 0) throw new Error('No pude leer tu grabacion');
  const pcm = r.stdout;
  const muestras = pcm.length >> 1;
  const db = [];
  for (let a = 0; a + 160 <= muestras; a += 160) { // ventanas de 10 ms
    let s = 0;
    for (let i = a; i < a + 160; i++) { const v = pcm.readInt16LE(i * 2) / 32768; s += v * v; }
    db.push(10 * Math.log10(s / 160 + 1e-12));
  }
  // Windows (supresion de ruido) deja silencio digital absoluto: no cuenta como "ruido de fondo"
  const orden = db.filter(v => v > -100).sort((x, y) => x - y);
  if (orden.length < 100) throw new Error('Tu grabacion esta en silencio: revisa que el microfono correcto este elegido.');
  const ruido = orden[Math.floor(orden.length * 0.1)];
  const voz = orden[Math.floor(orden.length * 0.95)];
  if (!(voz - ruido >= 12)) throw new Error('No distingo tu voz del ruido de fondo: graba mas cerca del microfono o en un lugar mas silencioso.');
  if (voz < -40) {
    console.log('[!] Tu grabacion esta MUY BAJA de volumen. Para la proxima sube el microfono:\n' +
      '    Windows: Configuracion > Sistema > Sonido > Entrada > Volumen (80-100).  Mac: Ajustes > Sonido > Entrada.');
  }
  // una pausa esta claramente por debajo del ruido + 8 dB y a mas de 25 dB por debajo de la voz
  const umbral = Math.max(ruido + 8, voz - 25);
  const activo = db.map(v => v > umbral);
  const primero = activo.indexOf(true);
  const ultimo = activo.lastIndexOf(true);
  // ¿la grabacion corresponde al guion? (la opcion de grabar NO clona: usa tu voz tal cual)
  const palabrasGuion = clase.bloques.reduce((t, b) => t + b.texto.split(/\s+/).filter(Boolean).length, 0);
  const esperado = palabrasGuion / 2.4;
  const hablado = (ultimo - primero) / 100;
  if (hablado < esperado * 0.75) {
    throw new Error(`Tu grabacion dura ${formatoMin(hablado)} pero leer el guion de esta clase toma unos ${formatoMin(esperado)}.\n` +
      '    ¿Grabaste otro texto (por ejemplo TEXTO-PARA-CLONAR-VOZ)? Esta opcion NO clona tu voz: usa tu\n' +
      '    grabacion tal cual, asi que tienes que leer GUION-PARA-GRABAR.txt completo (opcion 5 del menu).\n' +
      '    Para que la IA hable con tu voz sin leer cada clase, usa ElevenLabs (LEEME, PASO 4B) y borra voz/completa.');
  }
  if (hablado > esperado * 2.2) {
    console.log(`[!] Tu grabacion (${formatoMin(hablado)}) es mucho mas larga que el guion (~${formatoMin(esperado)}): ¿leiste el texto correcto?`);
  }
  const pausas = [];
  for (let i = primero; i <= ultimo;) {
    if (activo[i]) { i++; continue; }
    let j = i;
    while (j <= ultimo && !activo[j]) j++;
    if (j - i >= 25) pausas.push({ a: i / 100, z: j / 100, dur: (j - i) / 100 });
    i = j;
  }
  if (pausas.length < n - 1) {
    throw new Error(`Tu grabacion tiene ${pausas.length + 1} partes y la clase ${n} bloques. Graba otra vez con una pausa de 2 segundos entre bloque y bloque (ver GUION-PARA-GRABAR.txt).`);
  }
  const porLargo = [...pausas].sort((x, y) => y.dur - x.dur);
  const elegidas = porLargo.slice(0, n - 1).sort((x, y) => x.a - y.a);
  const menor = Math.min(...elegidas.map(p => p.dur), Infinity);
  const siguiente = porLargo[n - 1];
  if (n > 1 && (menor < 0.8 || (siguiente && siguiente.dur > menor * 0.8))) {
    console.log('[!] Las pausas entre bloques no son muy claras: revisa con --capturas que cada diapositiva cambie a tiempo.\n    Lo ideal es callar 2 segundos entre bloque y bloque.');
  }
  const fin = ultimo / 100 + 0.01;
  const segs = [];
  let ini = primero / 100;
  elegidas.forEach(p => { segs.push([ini, p.a]); ini = p.z; });
  segs.push([ini, fin]);
  // margen para no cortar consonantes, sin pasar de la mitad de la pausa vecina
  const res = segs.map(([a, z], k) => ({
    inicio: r3(Math.max(a - 0.12, k > 0 ? (elegidas[k - 1].a + elegidas[k - 1].z) / 2 : 0)),
    fin: r3(Math.min(z + 0.18, k < n - 1 ? (elegidas[k].a + elegidas[k].z) / 2 : z + 0.18)),
  }));
  // control: la duracion de cada parte deberia parecerse a lo largo de su texto
  const palabras = clase.bloques.map(b => b.texto.split(/\s+/).filter(Boolean).length);
  const totP = palabras.reduce((x, y) => x + y, 0);
  const totD = res.reduce((x, s) => x + (s.fin - s.inicio), 0);
  const raros = [];
  res.forEach((s, k) => {
    const razon = ((s.fin - s.inicio) / totD) / (palabras[k] / totP);
    if (razon < 0.45 || razon > 2.2) raros.push(`${clase.bloques[k].id} (${(s.fin - s.inicio).toFixed(1)} s)`);
  });
  if (raros.length >= Math.max(3, Math.ceil(n / 3))) {
    throw new Error(`No pude ubicar bien los bloques en tu grabacion: ${raros.length} bloques salen con duraciones raras (${raros.join(', ')}).\n` +
      '    Revisa que leiste GUION-PARA-GRABAR.txt completo, en orden, y que callaste 2 segundos entre bloque y bloque.\n' +
      '    Tambien puedes grabar cada bloque por separado: voz/01.m4a, voz/02.m4a ...');
  }
  for (const r of raros) console.log(`[!] El bloque ${r} dura raro para su texto: ¿pausa larga a mitad de bloque o bloque saltado?`);
  return res;
}

function cortarGrabacion(clase, archivo, dirVoz) {
  const base = path.join(dirVoz, 'completa.wav');
  ff('-i', archivo, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', base);
  const segs = detectarBloques(base, clase);
  const archivos = {};
  clase.bloques.forEach((b, i) => {
    const f = path.join(dirVoz, `${b.id}.grabacion.wav`);
    ff('-ss', String(segs[i].inicio), '-t', String(r3(segs[i].fin - segs[i].inicio)), '-i', base, '-c:a', 'pcm_s16le', f);
    archivos[b.id] = f;
  });
  return archivos;
}

function vozDeCamara(clase, archivo, dirVoz) {
  console.log(`   tu video de camara: ${path.basename(archivo)} (tu imagen + tu voz; los bloques salen de las pausas)`);
  const base = path.join(dirVoz, 'completa.wav');
  ff('-i', archivo, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', base);
  const segs = detectarBloques(base, clase);
  const total = r3(Math.min(duracion(archivo), segs[segs.length - 1].fin + COLA));
  const bloques = {};
  clase.bloques.forEach((b, i) => { bloques[b.id] = segs[i]; });
  const final = path.join(SAL, 'voz-completa.wav');
  ff('-i', base, '-af', `${LIMPIAR_GRABACION},loudnorm=I=-16:TP=-1.5:LRA=11`, '-ar', '48000', '-ac', '1', '-t', String(total), final);
  ff('-i', final, '-c:a', 'libmp3lame', '-b:a', '192k', path.join(SAL, 'voz-completa.mp3'));
  const proveedor = 'tu video de camara';
  const tiempos = { total, fps_boca: FPS_BOCA, proveedor, camara: path.basename(archivo), bloques };
  fs.writeFileSync(path.join(SAL, 'tiempos.json'), JSON.stringify(tiempos, null, 2));
  fs.writeFileSync(path.join(SAL, 'boca.json'), JSON.stringify(envolvente(final)));
  return { tiempos, proveedor };
}

// Guion para que el docente grabe su voz (o se grabe en video) de corrido.
function escribirGuion(clase) {
  const envolver = (t, ancho = 78) => {
    const lineas = [];
    let l = '';
    for (const w of t.split(/\s+/)) {
      if ((l + ' ' + w).trim().length > ancho) { lineas.push(l); l = w; } else l = (l + ' ' + w).trim();
    }
    if (l) lineas.push(l);
    return lineas.map(x => '    ' + x);
  };
  const palabras = clase.bloques.reduce((n, b) => n + b.texto.split(/\s+/).length, 0);
  const salida = [
    `GUION PARA GRABAR TU VOZ - ${clase.tema || slug}`,
    '='.repeat(70),
    `${clase.bloques.length} bloques, ${palabras} palabras (unos ${formatoMin(palabras / 2.4)} minutos).`,
    '',
    'COMO GRABAR (una sola toma, de corrido)',
    '  1. Lugar silencioso, sin musica ni ventilador; microfono o celular a un palmo.',
    '  2. Lee cada bloque con tu tono de clase normal, sin apurarte.',
    '  3. ENTRE BLOQUE Y BLOQUE CALLA 2 SEGUNDOS (cuenta mentalmente "uno, dos").',
    '     Asi el programa sabe donde cambia cada diapositiva.',
    '  4. Si un bloque te sale mal, sigue igual hasta el final. Despues graba SOLO ese',
    `     bloque y guardalo como clases/${slug}/voz/<numero>.m4a (ej.: voz/05.m4a).`,
    '',
    'DONDE GUARDARLA',
    `  Solo audio (tu grabacion es la voz del video):  clases/${slug}/voz/completa.m4a`,
    '  OJO: esto NO clona tu voz. Se usa tu grabacion tal cual, por eso debes leer ESTE guion.',
    `  Video con tu camara (tu cara en el recuadro): clases/${slug}/camara.mp4`,
    '  (sirven .m4a, .mp3, .wav, .opus, .mp4, .mov ...)',
    '  Luego crea el video como siempre (menu CREAR-VIDEO, opcion 1).',
    '',
    '-'.repeat(70),
  ];
  clase.bloques.forEach((b, i) => {
    const seg = Math.round(b.texto.split(/\s+/).length / 2.4);
    salida.push('', `[BLOQUE ${b.id}]  (~${seg} s)`, ...envolver(b.texto));
    if (i < clase.bloques.length - 1) salida.push('', '        . . .  pausa de 2 segundos  . . .');
  });
  salida.push('', '-'.repeat(70), 'FIN', '');
  const f = path.join(DIR, 'GUION-PARA-GRABAR.txt');
  fs.writeFileSync(f, salida.join(process.platform === 'win32' ? '\r\n' : '\n'), 'utf8');
  console.log(`[OK] Guion listo: clases/${slug}/GUION-PARA-GRABAR.txt`);
}

function textoVoz(clase, t) {
  let s = t;
  const dic = clase.pronunciacion || {};
  for (const k of Object.keys(dic).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'gu');
    s = s.replace(re, dic[k]);
  }
  return s;
}

async function vozElevenLabs(clase, bloques, dirVoz) {
  const clave = process.env.ELEVENLABS_API_KEY;
  const vozId = process.env.ELEVENLABS_VOICE_ID;
  const modelo = process.env.ELEVENLABS_MODELO || 'eleven_multilingual_v2';
  const ajustes = {
    stability: num(process.env.ELEVENLABS_ESTABILIDAD, 0.5),
    similarity_boost: num(process.env.ELEVENLABS_SIMILITUD, 0.8),
    style: num(process.env.ELEVENLABS_ESTILO, 0),
    use_speaker_boost: true,
  };
  const firmasF = path.join(dirVoz, 'firmas-elevenlabs.json');
  const firmas = fs.existsSync(firmasF) ? JSON.parse(fs.readFileSync(firmasF, 'utf8')) : {};
  const todos = clase.bloques;
  const salida = {};
  for (const b of bloques) {
    const i = todos.indexOf(b);
    const t = textoVoz(clase, b.texto);
    const destino = path.join(dirVoz, `${b.id}.elevenlabs.mp3`);
    const firma = crypto.createHash('sha1').update(JSON.stringify({ vozId, modelo, ajustes, t })).digest('hex');
    if (firmas[b.id] === firma && fs.existsSync(destino)) {
      console.log(`   voz ${b.id}: reutilizada (sin gastar creditos)`);
      salida[b.id] = destino;
      continue;
    }
    process.stdout.write(`   voz ${b.id}: generando con ElevenLabs... `);
    const cuerpo = { text: t, model_id: modelo, voice_settings: ajustes };
    if (i > 0) cuerpo.previous_text = textoVoz(clase, todos[i - 1].texto);
    if (i < todos.length - 1) cuerpo.next_text = textoVoz(clase, todos[i + 1].texto);
    let r;
    try {
      r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(vozId)}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'xi-api-key': clave, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify(cuerpo),
      });
    } catch (e) {
      console.log('');
      throw new Error(`no hay conexion con api.elevenlabs.io (${texto(e.cause || e)}). Revisa tu internet.`);
    }
    if (!r.ok) {
      console.log('');
      const detalle = (await r.text().catch(() => '')).slice(0, 300);
      const pista = /library|free.?users?/i.test(detalle) ? ' (en el plan Free solo funcionan las voces "Default" de ElevenLabs, no las de la biblioteca: elige otra voz o pasa a Starter)'
        : r.status === 401 ? ' (API key invalida o sin permiso de Text to Speech)'
        : r.status === 404 ? ' (ELEVENLABS_VOICE_ID no existe en tu cuenta)'
        : r.status === 402 || /quota/i.test(detalle) ? ' (sin creditos en tu plan)' : '';
      throw new Error(`HTTP ${r.status}${pista}: ${detalle}`);
    }
    fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
    firmas[b.id] = firma;
    fs.writeFileSync(firmasF, JSON.stringify(firmas, null, 2));
    console.log('ok');
    salida[b.id] = destino;
  }
  return salida;
}

function vozSistema(clase, bloques, dirVoz) {
  const salida = {};
  if (process.platform === 'darwin') {
    const voz = elegirVozMac();
    console.log(`   voz del sistema (macOS): ${voz}`);
    for (const b of bloques) {
      const destino = path.join(dirVoz, `${b.id}.sistema.aiff`);
      correr('say', ['-v', voz, '-o', destino, textoVoz(clase, b.texto)]);
      salida[b.id] = destino;
    }
  } else if (process.platform === 'win32') {
    console.log('   voz del sistema (Windows)');
    const ps = [
      "$ErrorActionPreference='Stop'",
      'Add-Type -AssemblyName System.Speech',
      '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
      "$v = $s.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -like 'es-*' } | Select-Object -First 1",
      "if ($v) { $s.SelectVoice($v.VoiceInfo.Name) } else { Write-Output 'SIN_VOZ_ES' }",
      '$s.Rate = [int]$env:VOZ_VELOCIDAD',
      '$s.SetOutputToWaveFile($env:VOZ_SALIDA)',
      '$s.Speak([IO.File]::ReadAllText($env:VOZ_TEXTO, [Text.Encoding]::UTF8))',
      '$s.Dispose()',
    ].join('; ');
    let avisado = false;
    for (const b of bloques) {
      const destino = path.join(dirVoz, `${b.id}.sistema.wav`);
      const txt = path.join(dirVoz, `${b.id}.txt`);
      fs.writeFileSync(txt, textoVoz(clase, b.texto), 'utf8');
      const r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps], {
        encoding: 'utf8',
        env: { ...process.env, VOZ_SALIDA: destino, VOZ_TEXTO: txt, VOZ_VELOCIDAD: process.env.VOZ_SISTEMA_VELOCIDAD || '0' },
      });
      if (r.status !== 0 || !fs.existsSync(destino)) throw new Error((r.stderr || r.stdout || 'PowerShell fallo').trim().split('\n').slice(-3).join(' '));
      if (!avisado && /SIN_VOZ_ES/.test(r.stdout || '')) {
        console.log('[!] Windows no tiene voz en espanol: se usara la voz por defecto. Ver LEEME (Agregar voces > Espanol).');
        avisado = true;
      }
      salida[b.id] = destino;
    }
  } else {
    // Linux (servidores de prueba): SVOX Pico suena mejor que espeak
    const pico = spawnSync('pico2wave', ['--help'], { stdio: 'ignore' }).error ? null : 'pico2wave';
    const motor = pico || ['espeak-ng', 'espeak'].find(c => hay(c, '--version'));
    if (!motor) throw new Error('este sistema no tiene voz (ni macOS ni Windows)');
    console.log(`   voz del sistema (Linux): ${motor}`);
    for (const b of bloques) {
      const destino = path.join(dirVoz, `${b.id}.sistema.wav`);
      const args = pico ? ['-l', 'es-ES', '-w', destino, textoVoz(clase, b.texto)] : ['-v', 'es-419', '-w', destino, textoVoz(clase, b.texto)];
      correr(motor, args);
      salida[b.id] = destino;
    }
  }
  return salida;
}

function elegirVozMac() {
  if (process.env.VOZ_SISTEMA) return process.env.VOZ_SISTEMA;
  const lineas = correr('say', ['-v', '?']).split('\n');
  const voces = lineas.map(l => l.match(/^(.+?)\s+([a-z]{2}[_-][A-Z0-9]{2,3})\s+#/)).filter(Boolean)
    .map(m => ({ nombre: m[1].trim(), idioma: m[2].replace('-', '_') }))
    .filter(v => v.idioma.startsWith('es'));
  // Eddy, Flo, Rocko, Abuela... suenan muy roboticas: solo como ultimo recurso
  const robotica = /^(Eddy|Flo|Grandma|Grandpa|Abuela|Abuelo|Reed|Rocko|Sandy|Shelley)\b/i;
  const puntaje = v => (/premium/i.test(v.nombre) ? 100 : /enhanced|mejorad/i.test(v.nombre) ? 80 : 0)
    - (robotica.test(v.nombre) ? 200 : 0)
    + ({ es_MX: 5, es_US: 4, es_419: 4, es_ES: 3 }[v.idioma] || 1);
  const mejor = voces.sort((a, b) => puntaje(b) - puntaje(a))[0];
  if (!mejor) throw new Error('macOS no tiene voces en espanol (Ajustes > Accesibilidad > Contenido leido > Voz del sistema > Gestionar voces)');
  if (puntaje(mejor) < 80) {
    console.log('   Consejo: para una voz mas natural descarga "Paulina (Premium)" o "Monica (Premium)" en Ajustes del Sistema >\n' +
      '   Accesibilidad > Contenido leido > Voz del sistema > Gestionar voces > Espanol. O mejor: usa tu voz (LEEME, PASO 4).');
  }
  return mejor.nombre;
}

function vozSilencio(clase, bloques, dirVoz) {
  const salida = {};
  for (const b of bloques) {
    const palabras = textoVoz(clase, b.texto).split(/\s+/).filter(Boolean).length;
    const destino = path.join(dirVoz, `${b.id}.silencio.wav`);
    ff('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', String(Math.max(1, palabras / 2.4)), '-c:a', 'pcm_s16le', destino);
    salida[b.id] = destino;
  }
  return salida;
}

function silencio(dirVoz, nombre, seg) {
  const f = `${nombre}.wav`;
  ff('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', String(seg), '-c:a', 'pcm_s16le', path.join(dirVoz, f));
  return f;
}

// volumen de la voz cuadro a cuadro (mueve la boca del robot y el borde "hablando")
function envolvente(wav) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-i', wav, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], { maxBuffer: 1 << 30, windowsHide: true });
  if (r.status !== 0) throw new Error('No pude analizar el audio de la voz');
  const pcm = r.stdout;
  const n = pcm.length >> 1;
  const porCuadro = 16000 / FPS_BOCA;
  const cuadros = Math.ceil(n / porCuadro);
  const rms = new Array(cuadros).fill(0);
  for (let c = 0; c < cuadros; c++) {
    const a = Math.floor(c * porCuadro);
    const z = Math.min(n, Math.floor((c + 1) * porCuadro));
    let s = 0;
    for (let i = a; i < z; i++) { const v = pcm.readInt16LE(i * 2) / 32768; s += v * v; }
    rms[c] = z > a ? Math.sqrt(s / (z - a)) : 0;
  }
  const activos = rms.filter(v => v > 0.005).sort((x, y) => x - y);
  const ref = activos.length ? activos[Math.floor(activos.length * 0.95)] : 1;
  const valores = [];
  let prev = 0;
  for (const v of rms) {
    let x = Math.min(1, v / (ref || 1));
    x = x < 0.06 ? 0 : x;
    prev = x > prev ? x : prev * 0.55 + x * 0.45; // abre rapido, cierra suave
    valores.push(Math.round(prev * 100) / 100);
  }
  return { fps: FPS_BOCA, valores };
}

// ---------------------------------------------------------------- avatar externo
function buscarAvatar(total) {
  const f = ['avatar.mp4', 'avatar.mov', 'avatar.webm'].map(n => path.join(DIR, n)).find(x => fs.existsSync(x));
  if (!f) {
    console.log('[OK] Avatar: robot animado incluido (para usar un avatar de HeyGen/Hedra pon avatar.mp4 en la carpeta de la clase)');
    return null;
  }
  const d = duracion(f);
  console.log(`[OK] Avatar: ${path.basename(f)} (${formatoMin(d)})`);
  if (Math.abs(d - total) > 1.5) {
    console.log(`[!] El avatar dura ${d.toFixed(1)} s y la clase ${total.toFixed(1)} s: genera el avatar con salida/voz-completa.mp3 para que los labios coincidan.`);
  }
  return f;
}

function paramAvatar(f) {
  const logo = fs.existsSync(path.join(RAIZ, 'marca', 'logo.png')) ? '&logo=1' : '';
  return (f ? `&avatar=${encodeURIComponent(path.basename(f))}` : '') + logo;
}

// ---------------------------------------------------------------- capturas para revisar
async function hacerCapturas(pagina, tiempos) {
  const dir = path.join(SAL, 'capturas');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const ids = Object.keys(tiempos.bloques);
  const puntos = [];
  for (const id of ids) {
    const { inicio, fin } = tiempos.bloques[id];
    puntos.push([`${id}-a`, inicio + 0.25 * (fin - inicio)]);
    puntos.push([`${id}-b`, inicio + 0.85 * (fin - inicio)]);
  }
  puntos.push(['fin', tiempos.total - 0.05]);
  for (const [nombre, t] of puntos) {
    await pagina.evaluate(x => window.__ir(x), t);
    await pagina.screenshot({ path: path.join(dir, `${nombre}.jpg`), type: 'jpeg', quality: 80 });
  }
  console.log(`[OK] ${puntos.length} capturas en clases/${slug}/salida/capturas/`);
}

// ---------------------------------------------------------------- render
async function renderizar(pagina, total, fps, salidaMp4, avatar, camara, capa) {
  const N = Math.ceil(total * fps);
  const escala = RAPIDO ? ',scale=960:540' : '';
  const entradas = ['-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', '-i', path.join(SAL, 'voz-completa.wav')];
  let grafo;
  if (avatar) {
    entradas.push('-i', avatar, '-loop', '1', '-i', capa);
    const { x, y, w, h } = camara;
    grafo = `[2:v]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1,fps=${fps},tpad=stop_mode=clone:stop_duration=3600[av];` +
      `[0:v][av]overlay=${x}:${y}:shortest=1[b];[b][3:v]overlay=0:0:shortest=1,format=yuv420p${escala}[v]`;
  } else {
    grafo = `[0:v]format=yuv420p${escala}[v]`;
  }
  const ffArgs = ['-hide_banner', '-loglevel', 'error', '-y', ...entradas,
    '-filter_complex', grafo, '-map', '[v]', '-map', '1:a',
    '-c:v', 'libx264', '-preset', RAPIDO ? 'veryfast' : 'medium', '-crf', RAPIDO ? '26' : '18', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '192k', '-t', String(total), '-movflags', '+faststart', salidaMp4];

  const proc = spawn(FFMPEG, ffArgs, { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true });
  let errFF = '';
  proc.stderr.on('data', d => { errFF += d; });
  let cerrado = false;
  const fin = new Promise(res => proc.on('close', code => { cerrado = true; res(code); }));
  proc.stdin.on('error', () => {});

  console.log(`[..] Dibujando ${N} cuadros (${fps} fps)${RAPIDO ? ' — modo rapido' : ''}...`);
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    if (cerrado) break;
    await pagina.evaluate(t => window.__ir(t), i / fps);
    const img = await pagina.screenshot({ type: 'jpeg', quality: RAPIDO ? 70 : 94 });
    if (!proc.stdin.write(img)) await Promise.race([once(proc.stdin, 'drain'), fin]);
    if (i % fps === 0 || i === N - 1) {
      const pct = Math.round(((i + 1) / N) * 100);
      const seg = (Date.now() - t0) / 1000;
      const resta = i > 0 ? Math.round((seg / (i + 1)) * (N - i - 1)) : 0;
      process.stdout.write(`\r     cuadro ${i + 1}/${N}  (${pct}%)  faltan ~${formatoMin(resta)}   `);
    }
  }
  proc.stdin.end();
  const code = await fin;
  process.stdout.write('\n');
  if (code !== 0) throw new Error(`ffmpeg no pudo crear el video:\n${errFF.split('\n').slice(-10).join('\n')}`);
}

// ---------------------------------------------------------------- servidor local
function servidor() {
  const tipos = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
    '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
  };
  const srv = http.createServer((req, res) => {
    try {
      const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const f = path.join(RAIZ, path.normalize(ruta));
      const rel = path.relative(RAIZ, f);
      if (rel.startsWith('..') || path.isAbsolute(rel) || rel.split(path.sep).some(p => p.startsWith('.'))) {
        res.writeHead(403); return res.end();
      }
      if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end(); }
      const tam = fs.statSync(f).size;
      const tipo = tipos[path.extname(f).toLowerCase()] || 'application/octet-stream';
      const rango = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
      if (rango) {
        const a = rango[1] ? parseInt(rango[1], 10) : 0;
        const z = rango[2] ? Math.min(parseInt(rango[2], 10), tam - 1) : tam - 1;
        res.writeHead(206, { 'Content-Type': tipo, 'Content-Range': `bytes ${a}-${z}/${tam}`, 'Accept-Ranges': 'bytes', 'Content-Length': z - a + 1, 'Cache-Control': 'no-store' });
        fs.createReadStream(f, { start: a, end: z }).pipe(res);
      } else {
        res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': tam, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
        fs.createReadStream(f).pipe(res);
      }
    } catch {
      res.writeHead(500); res.end();
    }
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

// ---------------------------------------------------------------- utilidades
function cargarEnv() {
  const f = path.join(RAIZ, '.env');
  if (!fs.existsSync(f)) return;
  for (const linea of fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (/^\s*#/.test(linea)) continue;
    const m = linea.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const v = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (v && !(m[1] in process.env)) process.env[m[1]] = v;
  }
}

function hay(cmd, flag = '-version') {
  const r = spawnSync(cmd, [flag], { stdio: 'ignore' });
  return !r.error && r.status === 0;
}

function correr(cmd, a) {
  const r = spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 1 << 28, windowsHide: true });
  const nombre = path.basename(cmd);
  if (r.error) throw new Error(`${nombre}: ${texto(r.error)}`);
  if (r.status !== 0) throw new Error(`${nombre} fallo:\n${(r.stderr || '').trim().split('\n').slice(-8).join('\n')}`);
  return r.stdout;
}

// Encuentra un programa (ffmpeg/ffprobe) aunque no este bien en el PATH.
// Orden: .env (FFMPEG_PATH / FFPROBE_PATH), PATH, where.exe, carpeta de winget, rutas tipicas.
function programa(nombre) {
  const exe = process.platform === 'win32' ? `${nombre}.exe` : nombre;
  const candidatos = [];
  const delEnv = process.env[`${nombre.toUpperCase()}_PATH`];
  if (delEnv) candidatos.push(delEnv);
  if (FFMPEG && path.isAbsolute(FFMPEG)) candidatos.push(path.join(path.dirname(FFMPEG), exe)); // junto a ffmpeg
  candidatos.push(nombre);
  if (process.platform === 'win32') {
    const w = spawnSync('where.exe', [nombre], { encoding: 'utf8', windowsHide: true });
    if (w.status === 0) candidatos.push(...w.stdout.split(/\r?\n/).map(x => x.trim()).filter(Boolean));
    const paquetes = path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages');
    try {
      for (const d of fs.readdirSync(paquetes).filter(d => /ffmpeg/i.test(d))) {
        for (const sub of fs.readdirSync(path.join(paquetes, d))) candidatos.push(path.join(paquetes, d, sub, 'bin', exe));
      }
    } catch { /* winget no instalo ffmpeg ahi */ }
    candidatos.push(path.join('C:\\ffmpeg', 'bin', exe),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'ffmpeg', 'bin', exe),
      path.join(process.env.ChocolateyInstall || 'C:\\ProgramData\\chocolatey', 'bin', exe));
  } else {
    candidatos.push(`/opt/homebrew/bin/${nombre}`, `/usr/local/bin/${nombre}`);
  }
  PROBADOS[nombre] = [];
  for (const c of [...new Set(candidatos)]) {
    if (path.isAbsolute(c) && !fs.existsSync(c)) continue;
    const r = spawnSync(c, ['-version'], { encoding: 'utf8', windowsHide: true });
    if (!r.error && r.status === 0) return c;
    PROBADOS[nombre].push(`${c} -> ${r.error ? texto(r.error) : `codigo ${r.status} ${(r.stderr || '').trim().split('\n').pop() || ''}`}`);
  }
  return null;
}

function ff(...a) {
  return correr(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...a]);
}

function duracion(f) {
  let d;
  if (FFPROBE) {
    d = parseFloat(correr(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', f]));
  } else {
    // sin ffprobe: ffmpeg imprime "Duration: 00:02:21.70" al leer el archivo
    const r = spawnSync(FFMPEG, ['-hide_banner', '-i', f], { encoding: 'utf8', windowsHide: true });
    const m = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(r.stderr || '');
    if (m) d = (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
  }
  if (!isFinite(d)) throw new Error(`No pude medir la duracion de ${path.basename(f)}`);
  return d;
}

function num(v, porDefecto) {
  const n = parseFloat(v);
  return isFinite(n) ? n : porDefecto;
}

function formatoMin(s) {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function abrir(url) {
  const [cmd, a] = process.platform === 'darwin' ? ['open', [url]]
    : process.platform === 'win32' ? ['rundll32', ['url.dll,FileProtocolHandler', url]] // sin cmd: la URL lleva "&"
    : ['xdg-open', [url]];
  spawn(cmd, a, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
}
