// Arma el marco de la clase, carga diapositivas.js de la clase y expone window.__ir(t)
// para que el motor dibuje cada cuadro (modo=render) o para reproducir con sonido (modo=vista).
import { crearUtil } from './util.js';
import { crearRobot } from './robot.js';

const q = new URLSearchParams(location.search);
const slug = q.get('clase');
const modo = q.get('modo') || 'vista';
const archivoAvatar = q.get('avatar');
const base = `/clases/${encodeURIComponent(slug || '')}`;
const $ = s => document.querySelector(s);

async function json(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`No pude leer ${url} (${r.status}). ¿Ya corriste el motor para generar la voz?`);
  return r.json();
}

const mmss = s => {
  s = Math.max(0, Math.floor(s));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

try {
  if (!slug) throw new Error('Falta ?clase=<nombre-corto> en la URL');
  const [clase, tiempos, boca] = await Promise.all([
    json(`${base}/clase.json`),
    json(`${base}/salida/tiempos.json`),
    json(`${base}/salida/boca.json`),
  ]);

  await armarMarco(clase);
  const robot = crearRobot($('#robot'));
  if (archivoAvatar) document.body.classList.add('con-avatar');

  // ----- linea de tiempo de las diapositivas
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  const b = (id, frac = 0) => {
    const x = tiempos.bloques[id];
    if (!x) throw new Error(`b("${id}"): ese bloque no existe en clase.json`);
    return x.inicio + (x.fin - x.inicio) * frac;
  };
  const fin = id => b(id, 1);
  const textos = Object.fromEntries(clase.bloques.map(x => [x.id, x.texto]));
  // momento aproximado en que la voz dice una palabra (proporcional a su posicion en el texto)
  const p = (id, palabra, extra = 0) => {
    const t = textos[id];
    if (t == null) throw new Error(`p("${id}", ...): ese bloque no existe en clase.json`);
    const i = t.toLowerCase().indexOf(String(palabra).toLowerCase());
    if (i < 0) {
      console.warn(`p("${id}", "${palabra}"): no encontre esa palabra en el texto; uso el inicio del bloque`);
      return b(id) + extra;
    }
    return b(id, i / t.length) + extra;
  };
  const escena = $('#diapos');
  const u = crearUtil({ tl, gsap, escena });
  const mod = await import(`${base}/diapositivas.js`);
  if (typeof mod.default !== 'function') throw new Error('diapositivas.js debe tener "export default function ({ tl, b, p, u, ... }) { ... }"');
  await mod.default({ tl, gsap, escena, b, fin, p, u, clase, tiempos });
  tl.set({}, {}, tiempos.total);

  // ----- agenda (columna derecha)
  const items = (clase.agenda || []).map(a => ({ ...a, t: tiempos.bloques[a.desde] ? tiempos.bloques[a.desde].inicio : Infinity }));
  const lis = items.map((a, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<i>${i + 1}</i><span></span>`;
    li.querySelector('span').textContent = a.titulo;
    $('#ag-lista').appendChild(li);
    return li;
  });
  if (!items.length) $('#agenda').style.visibility = 'hidden';

  const vals = boca.valores;
  function ir(t) {
    tl.seek(t, false);
    const i = Math.min(vals.length - 1, Math.max(0, Math.floor(t * boca.fps)));
    const nivel = vals[i] || 0;
    let hablando = false;
    for (let k = i - 8; k <= i + 8; k++) if ((vals[k] || 0) > 0.12) { hablando = true; break; }
    robot.actualizar(t, nivel, hablando);
    $('#camara').classList.toggle('hablando', hablando);
    let actual = -1;
    items.forEach((a, k) => { if (t + 0.05 >= a.t) actual = k; });
    lis.forEach((li, k) => {
      li.classList.toggle('actual', k === actual);
      li.classList.toggle('hecho', k < actual);
      li.querySelector('i').textContent = k < actual ? '✓' : String(k + 1);
    });
    $('#reloj').textContent = mmss(t);
    $('#ag-tiempo').textContent = `${mmss(t).replace(/^0/, '')} / ${mmss(tiempos.total).replace(/^0/, '')}`;
    $('#ag-fill').style.width = `${Math.min(100, (t / tiempos.total) * 100)}%`;
  }

  window.__ir = ir;
  window.__camara = () => {
    const r = $('#camara').getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  window.__capa = on => {
    document.documentElement.classList.toggle('capa', on);
    document.body.classList.toggle('capa', on);
  };
  ir(0);
  if (modo === 'vista') prepararVista(ir, tiempos);
  window.__listo = true;
} catch (e) {
  window.__error = String((e && e.message) || e);
  console.error(e);
  const box = $('#error');
  box.textContent = 'Error al preparar la clase:\n\n' + window.__error;
  box.hidden = false;
}

async function armarMarco(clase) {
  const nombre = clase.avatar || 'Avatar';
  document.querySelectorAll('.nombre-avatar').forEach(n => { n.textContent = nombre; });
  $('#rol').textContent = clase.rol_avatar || '';
  $('#curso').textContent = clase.curso || '';
  $('#tema').textContent = clase.tema || '';
  $('#banda-der').textContent = clase.banda || clase.curso || '';
  if (clase.institucion) $('#pie-inst').textContent = clase.institucion;
  $('#pie-der').textContent = clase.docente ? `Clase generada con IA · Revisó: ${clase.docente}` : 'Clase generada con IA';
  document.title = `${clase.tema || 'Clase'} · ${nombre}`;
  // logo opcional: marca/logo.png (el motor avisa con ?logo=1 si existe)
  if (q.get('logo') === '1') {
    const img = $('#logo');
    img.src = '/marca/logo.png';
    await img.decode().catch(() => {});
    img.hidden = false;
    $('.logo-texto').style.display = 'none';
  }
}

function prepararVista(ir, tiempos) {
  document.documentElement.classList.add('vista');
  document.body.classList.add('vista');
  const lienzo = $('#lienzo');
  const ajustar = () => {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    lienzo.style.transform = `translate(-50%, -50%) scale(${k})`;
  };
  ajustar();
  addEventListener('resize', ajustar);

  const audio = new Audio(`${base}/salida/voz-completa.wav`);
  let video = null;
  if (archivoAvatar) {
    video = $('#avatar-video');
    video.src = `${base}/${encodeURIComponent(archivoAvatar)}`;
    video.hidden = false;
  }
  const play = $('#play');
  play.hidden = false;
  const bucle = () => {
    const t = audio.currentTime;
    ir(t);
    if (video && Math.abs(video.currentTime - t) > 0.2) video.currentTime = t;
    if (!audio.paused) requestAnimationFrame(bucle);
  };
  const alternar = () => {
    if (audio.paused) {
      if (audio.ended || audio.currentTime >= tiempos.total) audio.currentTime = 0;
      audio.play();
      if (video) video.play().catch(() => {});
      play.hidden = true;
      requestAnimationFrame(bucle);
    } else {
      audio.pause();
      if (video) video.pause();
      play.textContent = '▶  Continuar';
      play.hidden = false;
    }
  };
  play.addEventListener('click', alternar);
  addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); alternar(); } });
  lienzo.addEventListener('click', () => { if (!audio.paused) alternar(); });
  audio.addEventListener('ended', () => { play.textContent = '↻  Ver de nuevo'; play.hidden = false; if (video) video.pause(); });
}
