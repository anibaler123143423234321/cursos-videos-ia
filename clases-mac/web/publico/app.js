// Estudio de clases USS: interfaz web (sin frameworks).
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const acento = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>'); // *palabra* -> serif morado, como en el video
const mmss = s => { const t = Math.max(0, Math.round(s || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const dos = n => String(n).padStart(2, '0');
const palabras = t => String(t || '').split(/\s+/).filter(Boolean).length;
const MB = b => `${(b / 1048576).toFixed(1)} MB`;
const app = $('#app');
let estado = null;   // lo que esta configurado (IA, voz, logo)
let editor = null;   // clase abierta
let sondeo = null;


const TIPOS = [['', '— Sigue la diapositiva anterior —'], ['portada', 'Portada'], ['pregunta', 'Pregunta (fondo oscuro)'], ['idea', 'Idea clave'],
['definicion', 'Definición o logro'], ['temario', 'Temario'], ['lista', 'Lista'], ['pasos', 'Pasos en línea'], ['ruta', 'Clics en una app'],
['flujo', 'Flujo con flechas'], ['codigo', 'Código o texto modelo'], ['comparacion', 'Comparación'], ['tarjetas', 'Tarjetas'], ['dato', 'Dato grande'],
['cierre', 'Cierre y reto'], ['logo', 'Despedida con logo'], ['imagen', 'Lámina (imagen)']];
const TRABAJOS = {
  voz: { nombre: 'Vista previa con voz', icono: 'volumen', desc: 'Escucha la clase en el navegador', dura: '≈ 1 min' },
  capturas: { nombre: 'Revisar diapositivas', icono: 'imagen', desc: 'Fotos de cada diapositiva', dura: '≈ 1 min' },
  borrador: { nombre: 'Borrador rápido', icono: 'ojo', desc: 'Video liviano para ver el ritmo', dura: '2–3 min' },
  video: { nombre: 'Video final', icono: 'pelicula', desc: 'MP4 en alta calidad, 1920 × 1080', dura: '5–8 min' },
  drive: { nombre: 'Subir a Google Drive', icono: 'subir', desc: 'Video y código a la carpeta compartida', dura: '≈ 1 min' },
  hyperframes: { nombre: 'Video animado', icono: 'pelicula', desc: 'Láminas animadas en MP4', dura: '≈ 1 min por minuto' },
};
const VOCES = { auto: 'Automática', local: 'Voz local gratis', azure: 'Azure', elevenlabs: 'ElevenLabs', grabacion: 'Tu grabación', sistema: 'Del sistema' };
const ESTADO_TRABAJO = { 'en-cola': 'En cola', trabajando: 'En curso', listo: 'Listo', error: 'Error' };
const OBJETIVO_PALABRAS = { '2:00': 270, '2:30': 345, '3:00': 420 };

// ---------------------------------------------------------------- iconos (trazos de 24 px)
const ICONOS = {
  clases: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  mas: '<path d="M12 5v14M5 12h14"/>',
  ajustes: '<path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h11M21 18h-1"/><circle cx="16" cy="6" r="2.5"/><circle cx="10" cy="12" r="2.5"/><circle cx="18" cy="18" r="2.5"/>',
  salir: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  play: '<path fill="currentColor" d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/>',
  descargar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  subir: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  chispas: '<path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.5l-1.8-5L5 9.7l5.2-1.8z"/><path d="M19 15v4M17 17h4"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/>',
  camara: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m22 8-6 4 6 4z"/>',
  imagen: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
  basura: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
  arriba: '<path d="m18 15-6-6-6 6"/>',
  abajo: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  alerta: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  reloj: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  texto: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  ojo: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  guardar: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  buscar: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  der: '<path d="m9 18 6-6-6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  capas: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  bot: '<rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4M9 4h6M9 13v2M15 13v2"/>',
  pelicula: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 3v18M17 3v18M2 8h5M2 16h5M17 8h5M17 16h5M2 12h20"/>',
  candado: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  volumen: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  ondas: '<path d="M3 12h1M7 8v8M11 5v14M15 8v8M19 10v4"/>',
  lapiz: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  rayo: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
};
const ico = (n, t = 16) => `<svg class="ico" width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n] || ''}</svg>`;

// ---------------------------------------------------------------- utilidades
async function api(ruta, opciones = {}) {
  const r = await fetch(ruta, { ...opciones, headers: opciones.body ? { 'Content-Type': 'application/json' } : {} });
  if (r.status === 401 && ruta !== '/api/login') { mostrarLogin(); throw new Error('Inicia sesión'); }
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || `Error ${r.status}`);
  return datos;
}

function aviso(msg, error = false) {
  const t = document.createElement('div');
  t.className = `toast ${error ? 'error' : 'ok'}`;
  t.setAttribute('role', error ? 'alert' : 'status');
  t.innerHTML = `${ico(error ? 'alerta' : 'check', 18)}<span>${esc(msg)}</span><button class="toast-x" type="button" aria-label="Cerrar">${ico('x', 14)}</button>`;
  $('#avisos').append(t);
  const quitar = () => { t.classList.add('sale'); setTimeout(() => t.remove(), 200); };
  $('.toast-x', t).onclick = quitar;
  setTimeout(quitar, error ? 9000 : 3500);
}

function confirmar({ titulo, texto = '', boton = 'Confirmar', peligro = false }) {
  return new Promise(listo => {
    const d = document.createElement('dialog');
    d.className = 'modal';
    d.innerHTML = `<form method="dialog"><h3>${esc(titulo)}</h3>${texto ? `<p>${esc(texto)}</p>` : ''}
      <div class="modal-pie"><button class="boton" value="no">Cancelar</button><button class="boton ${peligro ? 'peligro-lleno' : 'prim'}" value="si">${esc(boton)}</button></div></form>`;
    document.body.append(d);
    d.addEventListener('close', () => { listo(d.returnValue === 'si'); d.remove(); });
    d.showModal();
    $('button[value=si]', d).focus();
  });
}

function abrirGaleria(imgs) {
  const d = document.createElement('dialog');
  d.className = 'modal galeria-modal';
  const leyenda = u => { const m = /(\d{2})-([ab])\.jpg/.exec(u); return m ? `Bloque ${m[1]} · ${m[2] === 'a' ? 'a la mitad' : 'al final'}` : 'Final'; };
  d.innerHTML = `<div class="galeria-cab"><h3>Diapositivas (${imgs.length} capturas)</h3><button class="icono-boton" aria-label="Cerrar">${ico('x', 18)}</button></div>
    <div class="galeria">${imgs.map(u => `<figure><a href="${u}" target="_blank" rel="noopener"><img src="${u}" loading="lazy" alt="${leyenda(u)}"></a><figcaption>${leyenda(u)}</figcaption></figure>`).join('')}</div>`;
  document.body.append(d);
  $('.galeria-cab button', d).onclick = () => d.close();
  d.addEventListener('close', () => d.remove());
  d.showModal();
}

const relativo = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
function hace(ms) {
  const s = (ms - Date.now()) / 1000;
  for (const [u, n] of [['day', 86400], ['hour', 3600], ['minute', 60]]) if (Math.abs(s) >= n) return relativo.format(Math.round(s / n), u);
  return 'hace un momento';
}

// ---------------------------------------------------------------- laminas (imagenes o PDF -> JPG de hasta 1920 x 1080)
const MAX_W = 1920, MAX_H = 1080;
function lienzo(w, h) {
  const k = Math.min(1, MAX_W / w, MAX_H / h);
  const c = document.createElement('canvas');
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; // un PNG transparente queda sobre blanco, como en la presentacion
  g.fillRect(0, 0, c.width, c.height);
  return { c, g };
}
async function imagenAJpg(archivo) {
  const bmp = await createImageBitmap(archivo);
  const { c, g } = lienzo(bmp.width, bmp.height);
  g.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.9);
}
async function pdfAJpgs(archivo, avance) {
  const pdfjs = await import('/node_modules/pdfjs-dist/build/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.mjs';
  const doc = await pdfjs.getDocument({
    data: await archivo.arrayBuffer(), cMapUrl: '/node_modules/pdfjs-dist/cmaps/', cMapPacked: true,
    standardFontDataUrl: '/node_modules/pdfjs-dist/standard_fonts/'
  }).promise;
  const res = [];
  for (let i = 1; i <= doc.numPages; i++) {
    avance(`${archivo.name}: página ${i} de ${doc.numPages}`);
    const pag = await doc.getPage(i);
    const v0 = pag.getViewport({ scale: 1 });
    const v = pag.getViewport({ scale: Math.min(MAX_W / v0.width, MAX_H / v0.height) }); // las paginas de PowerPoint miden 960 x 540: se amplian
    const { c, g } = lienzo(v.width, v.height);
    await pag.render({ canvasContext: g, viewport: v }).promise;
    res.push({ nombre: `${archivo.name} · pág. ${i}`, url: c.toDataURL('image/jpeg', 0.9) });
  }
  return res;
}
// varias imagenes (en orden de nombre: 1.png, 2.png ... 10.png) y/o PDF -> laminas
async function aLaminas(archivos, avance = () => { }) {
  const lista = [...archivos].sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }));
  const res = [];
  for (const f of lista) {
    if (f.type === 'application/pdf' || /\.pdf$/i.test(f.name)) res.push(...await pdfAJpgs(f, avance));
    else if (/^image\//.test(f.type)) { avance(f.name); res.push({ nombre: f.name, url: await imagenAJpg(f) }); }
  }
  return res;
}
const blobDe = url => fetch(url).then(r => r.blob());

// Cuadro del video en miniatura (para la lista de clases y la entrada)
function miniatura({ titulo, kicker = '', banda = '', avatar = 'SIPANCITOBOT' }) {
  return `<div class="mini-frame" aria-hidden="true"><div class="mf-in">
    <div class="mf-top"><b>USS</b><span>Aula virtual</span><i></i></div>
    <div class="mf-cuerpo">
      <div class="mf-diapo"><div class="mf-contenido">${kicker ? `<span class="mf-kicker">${esc(kicker)}</span>` : ''}<strong>${acento(titulo)}</strong></div>
        <div class="mf-banda"><b>USS</b><span>${esc(banda)}</span></div></div>
      <div class="mf-lado"><div class="mf-cam"><span class="robot"><i></i></span><span class="mf-nombre">${esc(avatar)}</span></div><div class="mf-agenda"><i></i><i></i><i></i></div></div>
    </div></div></div>`;
}

// ---------------------------------------------------------------- navegacion
async function ir() {
  if (editor && editor.sucio) { try { await guardar(true); } catch { /* se avisa al guardar */ } }
  clearTimeout(sondeo);
  const h = location.hash.replace(/^#/, '') || '/';
  try { estado = await api('/api/estado'); } catch { return; }
  pintarLateral(h);
  window.scrollTo(0, 0);
  try {
    titulo(h === '/nueva' ? 'Nueva clase' : h === '/ajustes' ? 'Ajustes' : h === '/' ? 'Clases' : 'Editor');
    if (h === '/') return await vistaLista();
    if (h === '/nueva') return vistaNueva();
    if (h === '/ajustes') return await vistaAjustes();
    const m = /^\/clase\/([a-z0-9-]+)$/.exec(h);
    if (m) return await vistaEditor(m[1]);
    location.hash = '#/';
  } catch (e) { aviso(e.message, true); }
}
window.addEventListener('hashchange', ir);
window.addEventListener('beforeunload', e => { if (editor && editor.sucio) { e.preventDefault(); e.returnValue = ''; } });
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && editor && $('#b-guardar')) {
    e.preventDefault();
    guardar().catch(err => aviso(err.message, true));
  }
});

function pintarLateral(h) {
  document.body.classList.add('con-sesion');
  $('#barra').hidden = false;
  const actual = h.startsWith('/clase/') ? '/' : h;
  $('#menu').innerHTML = [['/', 'clases', 'Clases'], ['/nueva', 'mas', 'Nueva clase'], ['/ajustes', 'ajustes', 'Ajustes']]
    .map(([r, i, n]) => `<a class="menu-item ${r === actual ? 'activo' : ''}" href="#${r}" ${r === actual ? 'aria-current="page"' : ''}>${ico(i, 18)}<span>${n}</span></a>`).join('');
  $('#servicios').innerHTML = [['IA gratis', estado.ia.gratis], ['IA que lee láminas', estado.ia.vision], ['Claude', estado.ia.claude],
  ['Voz local gratis', estado.voz.local], ['Azure', estado.voz.azure], ['ElevenLabs', estado.voz.elevenlabs], ['Google Drive', estado.drive.conectado]]
    .map(([n, ok]) => `<li><a href="#/ajustes"><i class="punto ${ok ? 'on' : ''}"></i>${n}<span>${ok ? 'Configurado' : 'Sin configurar'}</span></a></li>`).join('');
  $('#salir').innerHTML = `${ico('salir', 18)}<span>Salir</span>`;
}
$('#salir').onclick = async () => { await api('/api/salir', { method: 'POST' }).catch(() => { }); mostrarLogin(); };

function mostrarLogin() {
  editor = null;
  clearTimeout(sondeo);
  document.body.classList.remove('con-sesion');
  $('#barra').hidden = true;
  app.innerHTML = `<div class="login">
    <section class="login-arte">
      <a class="marca" href="#/"><b>USS</b><span>Estudio de clases<small>Universidad Señor de Sipán</small></span></a>
      <h1>Clases en video,<br><em>listas en minutos.</em></h1>
      <p>Guion, diapositivas animadas, voz y avatar en un solo lugar. Tu equipo crea cada clase desde el navegador.</p>
      ${miniatura({ titulo: 'Estructura *semántica* en HTML', kicker: 'Diseño Web · Básico', banda: 'Diseño Web' })}
      <footer>Escuela de Diseño Web · Universidad Señor de Sipán</footer>
    </section>
    <section class="login-form">
      <form id="f-login">
        <h2>Iniciar sesión</h2>
        <p class="muted">Escribe la clave del equipo para entrar al estudio.</p>
        <label for="clave">Clave del equipo</label>
        <input type="password" id="clave" autocomplete="current-password" autofocus required>
        <button class="boton prim ancho grande">Entrar ${ico('flecha')}</button>
        <p class="ayuda">¿No tienes la clave? Pídela a quien administra la PC del estudio.</p>
      </form>
    </section></div>`;
  $('#f-login').onsubmit = async e => {
    e.preventDefault();
    const b = $('#f-login button');
    b.disabled = true;
    try { await api('/api/login', { method: 'POST', body: JSON.stringify({ clave: $('#clave').value }) }); ir(); } catch (err) { aviso(err.message, true); b.disabled = false; $('#clave').select(); }
  };
}

// El título de la pestaña del navegador dice en qué página estás.
function titulo(pagina) { document.title = `${pagina} · Estudio de clases USS`; }

// ---------------------------------------------------------------- paginador común
// No pinta nada si todo cabe en una página. ir(n) recibe la página elegida.
function paginador(cont, total, porPagina, actual, ir) {
  const paginas = Math.ceil(total / porPagina);
  const boton = (n, texto, activo = false, apagado = false) => `<button type="button" class="boton chico ${activo ? 'prim' : ''}" data-ir="${n}" ${activo ? 'aria-current="page"' : ''} ${apagado ? 'disabled' : ''}>${texto}</button>`;
  cont.innerHTML = paginas < 2 ? '' : `<nav class="paginas" aria-label="Páginas">
    ${boton(actual - 1, 'Anterior', false, actual === 1)}
    ${Array.from({ length: paginas }, (_, i) => boton(i + 1, i + 1, i + 1 === actual)).join('')}
    ${boton(actual + 1, 'Siguiente', false, actual === paginas)}
  </nav>`;
  cont.querySelectorAll('[data-ir]').forEach(b => { b.onclick = () => ir(+b.dataset.ir); });
}
const paginaValida = (pagina, total, porPagina) => Math.min(Math.max(1, pagina), Math.max(1, Math.ceil(total / porPagina)));

// ---------------------------------------------------------------- lista de clases
async function vistaLista() {
  editor = null;
  app.innerHTML = `<div class="vista">
    <header class="cabecera">
      <div><h1>Clases</h1><p class="muted">Videos de 2 a 3 minutos con avatar, voz y diapositivas animadas.</p></div>
      <div class="acciones">
        <label class="buscar"><span class="sr">Buscar clase</span>${ico('buscar')}<input type="search" id="buscar" placeholder="Buscar por tema o curso…"></label>
        <a class="boton prim" href="#/nueva">${ico('mas')}Nueva clase</a>
      </div>
    </header>
    <div class="cifras" id="cifras"></div>
    <div class="rejilla" id="lista">${'<div class="esqueleto"></div>'.repeat(3)}</div>
    <div id="paginas-lista"></div></div>`;
  const clases = (await api('/api/clases')).sort((a, b) => (b.editada || 0) - (a.editada || 0));
  const minutos = clases.reduce((t, c) => t + (c.duracion || c.palabras / 2.4), 0);
  $('#cifras').innerHTML = [
    ['clases', clases.length, clases.length === 1 ? 'clase creada' : 'clases creadas'],
    ['pelicula', clases.filter(c => c.video).length, 'con video final'],
    ['reloj', mmss(minutos), 'minutos de contenido'],
  ].map(([i, n, t]) => `<div class="cifra"><span class="ico-caja">${ico(i, 20)}</span><div><b>${n}</b><span>${t}</span></div></div>`).join('');
  const POR_PAGINA = 6;
  const pintar = (filtro, pagina = 1) => {
    const f = filtro.trim().toLowerCase();
    const vis = clases.filter(c => !f || `${c.tema} ${c.curso}`.toLowerCase().includes(f));
    const actual = paginaValida(pagina, vis.length, POR_PAGINA);
    paginador($('#paginas-lista'), vis.length, POR_PAGINA, actual, n => { pintar(filtro, n); window.scrollTo(0, 0); });
    if (!clases.length) {
      $('#lista').innerHTML = `<div class="vacio" style="grid-column:1/-1"><span class="icono-grande">${ico('pelicula', 26)}</span>
        <h3>Aún no hay clases</h3><p>Escribe un tema y la IA prepara el guion y las diapositivas. Después lo revisas y creas el video.</p>
        <a class="boton prim" href="#/nueva">${ico('mas')}Crear la primera clase</a></div>`;
      return;
    }
    $('#lista').innerHTML = vis.slice((actual - 1) * POR_PAGINA, actual * POR_PAGINA).map(c => {
      const dur = c.duracion ? mmss(c.duracion) : `≈ ${mmss(c.palabras / 2.4)}`;
      return `<article class="clase-card">
        <a class="cc-enlace" href="#/clase/${c.slug}" aria-label="Abrir ${esc(c.tema)}"></a>
        ${miniatura({ titulo: c.portada && c.portada.titulo ? c.portada.titulo : c.tema, kicker: c.portada ? c.portada.kicker : c.curso, banda: c.banda, avatar: c.avatar })}
        ${c.video ? `<a class="cc-descargar" href="/api/clases/${c.slug}/video" title="Descargar MP4" aria-label="Descargar MP4">${ico('descargar')}</a>` : ''}
        <div class="cc-cuerpo">
          <div class="cc-fila"><span class="estado ${c.video ? 'ok' : ''}"><i></i>${c.video ? 'Video listo' : 'En preparación'}</span>
            <span class="cc-curso">· ${esc(c.curso || 'Sin curso')}${c.nivel ? ` · ${esc(c.nivel)}` : ''}</span></div>
          <h3>${esc(c.tema)}</h3>
          <div class="cc-datos"><span>${ico('reloj', 14)}${dur}</span><span>${ico('capas', 14)}${c.bloques} bloques</span>${c.editada ? `<span>${ico('lapiz', 14)}${hace(c.editada)}</span>` : ''}</div>
        </div></article>`;
    }).join('') || `<p class="nada">Ninguna clase coincide con «${esc(filtro)}».</p>`;
  };
  pintar('');
  $('#buscar').oninput = e => pintar(e.target.value);
}

// ---------------------------------------------------------------- nueva clase
function vistaNueva() {
  editor = null;
  let laminas = []; // [{ nombre, url }] ya convertidas a JPG en el navegador
  const seg = (nombre, valores, def) => `<div class="segmentado" role="radiogroup">${valores.map(v => `<label><input type="radio" name="${nombre}" value="${v}" ${v === def ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div>`;
  const tipoLamina = (v, icono, opcion, titulo, detalle) => `<label class="modo"><input type="radio" name="laminas" value="${v}" ${v === 'html' ? 'checked' : ''}>
    <span class="modo-cab"><span class="modo-ico">${ico(icono, 18)}</span><span class="pildora">${opcion}</span></span>
    <span><b>${titulo}</b><small>${detalle}</small></span></label>`;
  app.innerHTML = `<div class="vista">
  <header class="cabecera"><div><nav class="migas"><a href="#/">Clases</a>${ico('der', 14)}<span>Nueva clase</span></nav>
    <h1>Nueva clase</h1><p class="muted">Completa lo esencial. Podrás corregir todo antes de crear el video.</p></div></header>
  <form id="f-nueva" class="nueva" novalidate>
    <fieldset id="fs-nueva">
      <ol class="pasos-nueva" id="pasos-nueva"></ol>
      <section class="panel" data-paso="1">
        <div class="panel-cab"><span class="paso">1</span><div><h2>¿Cómo son tus láminas?</h2><p class="muted">Se elige antes de crear la voz.</p></div></div>
        <div class="modos dos">
          ${tipoLamina('imagen', 'imagen', 'Opción 1', 'Mis láminas (imágenes)', 'Subes PNG, JPG o un PDF de PowerPoint o Canva. La IA las lee y escribe lo que dice la voz.')}
          ${tipoLamina('html', 'capas', 'Opción 2', 'Láminas HTML animadas', 'La IA crea diapositivas con animaciones a partir del tema. Se editan en la web.')}
        </div>
        <div id="zona-laminas" class="oculto">
          <label class="soltar" id="soltar-laminas" style="margin-top:14px"><input type="file" id="up-laminas" multiple accept="image/png,image/jpeg,image/webp,application/pdf,.pdf">
            <span class="modo-ico">${ico('subir', 17)}</span><span><b>Subir láminas</b><small>Arrastra aquí o elige · PNG, JPG o PDF · se ordenan por nombre (1, 2, 3…)</small></span></label>
          <div class="laminas-cab"><span id="laminas-estado" class="ayuda"></span><button type="button" class="boton chico oculto" id="b-quitar-laminas">${ico('basura', 14)}Quitar todas</button></div>
          <div class="laminas-rejilla" id="laminas-rejilla"></div>
        </div>
      </section>
      <section class="panel" data-paso="2">
        <div class="panel-cab"><span class="paso">2</span><div><h2>¿Quién escribe el guion?</h2><p class="muted">Siempre podrás editarlo después.</p></div></div>
        <div class="modos" id="modos"></div>
      </section>
      <section class="panel" data-paso="3">
        <div class="panel-cab"><span class="paso">3</span><div><h2>La clase</h2><p class="muted" id="d-clase">Con IA basta con el tema.</p></div></div>
        <label for="n-tema">Tema <span class="req" id="req-tema">obligatorio</span></label>
        <input type="text" id="n-tema" name="tema" class="grande" required placeholder="Ej.: Flexbox: alinear y distribuir elementos" autocomplete="off">
        <div class="campos2" style="margin-top:4px">
          <div><span class="etiqueta">Nivel</span>${seg('nivel', ['Básico', 'Intermedio', 'Avanzado'], 'Básico')}</div>
          <div id="c-duracion"><span class="etiqueta">Duración</span>${seg('duracion', ['2:00', '2:30', '3:00'], '2:30')}</div>
        </div>
        <details class="plegable" id="guiar-ia">
          <summary>${ico('chispas')}Guiar a la IA <span class="muted">· opcional</span>${ico('abajo')}</summary>
          <div>
            <p class="ayuda" id="ayuda-ia" style="margin:4px 0 4px">Si lo dejas vacío, la IA decide el objetivo, las ideas clave, el ejemplo y el reto.</p>
            <label for="n-obj">Objetivo de aprendizaje</label><input type="text" id="n-obj" name="objetivo" placeholder="Al terminar, el estudiante podrá…">
            <label for="n-pun">Puntos que debe cubrir</label><textarea id="n-pun" name="puntos" rows="3" placeholder="Uno por línea"></textarea>
            <div class="campos2"><div><label for="n-eje">Ejemplo o código a mostrar</label><input type="text" id="n-eje" name="ejemplo"></div>
              <div><label for="n-ret">Reto o tarea final</label><input type="text" id="n-ret" name="reto"></div></div>
          </div>
        </details>
        <details class="plegable">
          <summary>${ico('bot')}Curso, módulo y avatar <span class="muted" id="resumen-avatar"></span>${ico('abajo')}</summary>
          <div>
            <div class="campos2">
              <div><label for="n-cur">Curso</label><input type="text" id="n-cur" name="curso" placeholder="Ej. Herramientas Digitales"></div>
              <div><label for="n-mod">Módulo <span class="ayuda">carpeta en Google Drive</span></label><input type="text" id="n-mod" name="modulo" placeholder="Ej.: Módulo 1 · HTML"></div>
              <div><label for="n-ava">Nombre del avatar</label><input type="text" id="n-ava" name="avatar" value="SIPANCITOBOT"></div>
              <div><label for="n-rol">Rol del avatar</label><input type="text" id="n-rol" name="rol_avatar" value="Asistente docente IA"></div>
              <div><label for="n-doc">Docente que revisa</label><input type="text" id="n-doc" name="docente" placeholder="Opcional"></div>
            </div>
          </div>
        </details>
      </section>
      <section class="panel" id="p-guion" data-paso="4">
        <div class="panel-cab"><span class="paso">4</span><div><h2 id="t-guion">Guion</h2><p class="muted" id="d-guion"></p></div></div>
        <textarea name="guion" rows="8" aria-labelledby="t-guion" placeholder="¡Hola! Soy SIPANCITOBOT y hoy vamos a…&#10;&#10;Segundo bloque…&#10;&#10;Tercer bloque…"></textarea>
        <div class="medidor"><div class="medidor-barra"><i id="medidor"></i></div><span id="cuenta-guion"></span></div>
      </section>
      <div class="nav-pasos">
        <button type="button" class="boton" id="paso-atras">Atrás</button>
        <button type="button" class="boton prim" id="paso-sigue">Siguiente</button>
      </div>
    </fieldset>
    <aside class="nueva-lado"><div class="panel" id="lado-nueva"></div></aside>
  </form></div>`;
  const f = $('#f-nueva');
  const conImagenes = () => f.laminas.value === 'imagen';
  const parrafos = t => String(t || '').split(/\n\s*\n/).filter(x => x.trim()).length;

  // Un paso a la vez: el paso 4 solo existe cuando hay guion que escribir.
  const NOMBRES_PASO = { 1: 'Láminas', 2: 'Guion', 3: 'La clase', 4: 'Texto' };
  let paso = 1;
  const visibles = () => [1, 2, 3, ...($('#p-guion').classList.contains('oculto') ? [] : [4])];
  const irPaso = n => {
    const lista = visibles();
    paso = lista.includes(n) ? n : lista[lista.length - 1];
    f.querySelectorAll('[data-paso]').forEach(x => x.classList.toggle('fuera-de-paso', +x.dataset.paso !== paso));
    $('#pasos-nueva').innerHTML = lista.map(k => `<li><button type="button" class="${k === paso ? 'activo' : ''}" data-paso-ir="${k}" ${k === paso ? 'aria-current="step"' : ''}><b>${k}</b>${NOMBRES_PASO[k]}</button></li>`).join('');
    $('#pasos-nueva').querySelectorAll('[data-paso-ir]').forEach(b => { b.onclick = () => { if (+b.dataset.pasoIr < paso || pasoListo()) irPaso(+b.dataset.pasoIr); }; });
    $('#paso-atras').classList.toggle('oculto', paso === lista[0]);
    $('#paso-sigue').classList.toggle('oculto', paso === lista[lista.length - 1]);
  };
  const pasoListo = () => {
    const img = conImagenes();
    if (paso === 1 && img && !laminas.length) { aviso('Sube tus láminas (PNG, JPG o PDF)', true); return false; }
    if (paso === 3 && (!img || f.modo.value === 'manual') && !f.tema.value.trim()) { aviso('Escribe el tema de la clase', true); $('#n-tema').focus(); return false; }
    return true;
  };
  $('#paso-sigue').onclick = () => { if (pasoListo()) irPaso(paso + 1); };
  $('#paso-atras').onclick = () => irPaso(paso - 1);
  f.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); $('#paso-sigue').click(); }
  });

  // quien escribe: cambia segun el tipo de lamina (con imagenes la IA tiene que poder leerlas)
  const pintarModos = () => {
    const img = conImagenes();
    const antes = f.modo ? f.modo.value : '';
    const lista = img ? [
      ['manual', 'texto', 'Escribo la voz', 'Un párrafo por lámina, en el mismo orden.', 'Gratis', true],
      ['gratis', 'chispas', 'IA gratis lee las láminas', estado.ia.vision ? `Mira cada lámina y escribe la voz (${estado.ia.modeloVision}).` : 'Configura «IA que lee láminas» en Ajustes.', 'Gratis', estado.ia.vision],
      ['claude', 'rayo', 'Claude lee las láminas', estado.ia.claude ? 'La mejor redacción. Unos centavos por clase.' : 'Necesita una API key de Claude.', 'De pago', estado.ia.claude],
    ] : [
      ['manual', 'texto', 'Pego mi guion', 'Escribes o pegas el texto y eliges las diapositivas.', 'Gratis', true],
      ['gratis', 'chispas', 'IA gratis', estado.ia.gratis ? 'Un modelo abierto escribe guion y diapositivas.' : 'Necesita una API key gratuita.', 'Gratis', estado.ia.gratis],
      ['claude', 'rayo', 'Claude', estado.ia.claude ? 'La mejor calidad de redacción y exactitud.' : 'Necesita una API key de Claude.', 'De pago', estado.ia.claude],
    ];
    const disponible = v => (lista.find(x => x[0] === v) || [])[5];
    const elegido = disponible(antes) ? antes : disponible('gratis') ? 'gratis' : 'manual';
    $('#modos').innerHTML = lista.map(([v, i, t, d, insignia, ok]) => `
      <label class="modo ${ok ? '' : 'apagado'}">
        <input type="radio" name="modo" value="${v}" ${v === elegido ? 'checked' : ''} ${ok ? '' : 'disabled'}>
        <span class="modo-cab"><span class="modo-ico">${ico(i, 18)}</span><span class="pildora ${insignia === 'Gratis' ? 'lima' : ''}">${insignia}</span></span>
        <span><b>${t}</b><small>${d}</small></span>
        ${ok ? '' : '<a href="#/ajustes">Configurar en Ajustes →</a>'}
      </label>`).join('');
  };

  const pintarLaminas = () => {
    $('#laminas-rejilla').innerHTML = laminas.map((l, i) => `<figure><img src="${l.url}" alt=""><figcaption><b>${dos(i + 1)}</b>${esc(l.nombre)}</figcaption></figure>`).join('');
    $('#laminas-estado').textContent = laminas.length ? `${laminas.length} lámina${laminas.length === 1 ? '' : 's'} · cada una será un bloque del video` : 'Aún no subes láminas.';
    $('#b-quitar-laminas').classList.toggle('oculto', !laminas.length);
    actualizar();
  };
  const agregarLaminas = async archivos => {
    if (!archivos || !archivos.length) return;
    const caja = $('#laminas-estado');
    try {
      const nuevas = await aLaminas(archivos, txt => { caja.textContent = `Preparando ${txt}…`; });
      if (!nuevas.length) { aviso('Sube imágenes PNG o JPG, o un PDF', true); return pintarLaminas(); }
      laminas = [...laminas, ...nuevas].slice(0, 40);
      if (laminas.length === 40) aviso('Máximo 40 láminas por clase');
    } catch (e) { aviso(`No pude leer el archivo: ${e.message}`, true); }
    pintarLaminas();
  };
  $('#up-laminas').onchange = e => { agregarLaminas(e.target.files); e.target.value = ''; };
  const zona = $('#soltar-laminas');
  zona.ondragover = e => { e.preventDefault(); zona.classList.add('encima'); };
  zona.ondragleave = () => zona.classList.remove('encima');
  zona.ondrop = e => { e.preventDefault(); zona.classList.remove('encima'); agregarLaminas(e.dataTransfer.files); };
  $('#b-quitar-laminas').onclick = () => { laminas = []; pintarLaminas(); };

  // el resumen se dibuja una sola vez y luego solo cambian sus textos (si se redibujara el boton,
  // el clic en «Crear» se perderia al salir del guion, porque el cambio redibuja antes del clic)
  const lado = () => {
    $('#lado-nueva').innerHTML = `<h3>Resumen</h3>
      <dl class="resumen-lista">
        <div><dt>Láminas</dt><dd id="r-laminas"></dd></div>
        <div><dt>Guion</dt><dd id="r-modo"></dd></div>
        <div><dt id="r-dur-t">Duración</dt><dd id="r-dur"></dd></div>
        <div><dt>Tiempo de creación</dt><dd id="r-tiempo"></dd></div>
      </dl>
      <button class="boton prim ancho grande" id="b-crear"></button>
      <div class="nota-lima">${ico('info')}<span id="r-nota"></span></div>`;
  };
  const resumen = () => {
    const modo = f.modo.value;
    const img = conImagenes();
    const manual = modo === 'manual';
    const n = laminas.length;
    $('#r-laminas').textContent = img ? `${n} imagen${n === 1 ? '' : 'es'}` : 'HTML animadas';
    $('#r-modo').textContent = manual ? 'Tu texto' : modo === 'gratis' ? 'IA gratis' : 'Claude';
    $('#r-dur-t').textContent = img ? 'Duración' : 'Duración · palabras';
    $('#r-dur').textContent = img ? (n ? `≈ ${mmss(n * 17)} (≈ 17 s por lámina)` : '—') : `${f.duracion.value} min · ≈ ${OBJETIVO_PALABRAS[f.duracion.value]}`;
    $('#r-tiempo').textContent = manual ? 'Al instante' : img ? `≈ ${Math.max(1, Math.ceil(n * 0.5))}–${Math.max(2, n)} min` : '1 a 3 min';
    const etiqueta = manual ? 'Crear clase' : img ? 'Crear clase: la IA lee las láminas' : 'Crear clase con IA';
    if ($('#b-crear').dataset.etiqueta !== etiqueta) {
      $('#b-crear').dataset.etiqueta = etiqueta;
      $('#b-crear').innerHTML = `${ico(manual ? 'check' : 'chispas')}${etiqueta}`;
    }
    $('#r-nota').textContent = img
      ? (manual ? 'Escribe un párrafo por lámina. Cada lámina se ve mientras la voz dice su párrafo.'
        : 'La IA mira cada lámina y escribe lo que dice la voz. Después lo revisas antes de crear el video.')
      : manual ? 'Separa los bloques con una línea en blanco. Luego eliges una diapositiva para cada bloque.'
        : 'La IA escribe el guion y las diapositivas. Después revisas el texto antes de crear el video.';
  };
  const actualizar = () => {
    const modo = f.modo.value;
    const img = conImagenes();
    const manual = modo === 'manual';
    const obj = OBJETIVO_PALABRAS[f.duracion.value];
    $('#zona-laminas').classList.toggle('oculto', !img);
    $('#c-duracion').classList.toggle('oculto', img);
    $('#guiar-ia').classList.toggle('oculto', manual || img);
    $('#p-guion').classList.toggle('oculto', img && !manual);
    if ($('#pasos-nueva').childElementCount !== visibles().length) irPaso(paso);
    $('#req-tema').textContent = img && !manual ? 'opcional: la IA lo lee de la primera lámina' : 'obligatorio';
    $('#d-clase').textContent = img ? 'El tema es el título de la clase.' : 'Con IA basta con el tema.';
    $('#t-guion').textContent = img ? 'Lo que dice la voz' : manual ? 'Guion' : 'Guion · opcional';
    $('#d-guion').textContent = img ? 'Un párrafo por lámina, en el mismo orden, separados por una línea en blanco.'
      : manual ? 'Un párrafo por bloque, separados por una línea en blanco.' : 'Si ya tienes tu guion, pégalo: la IA solo hará las diapositivas.';
    $('#resumen-avatar').textContent = `· ${f.curso.value || 'Sin curso'}${f.modulo.value ? ` · ${f.modulo.value}` : ''} · ${f.avatar.value || 'SIPANCITOBOT'}`;
    const m = $('#medidor');
    if (img) {
      const p = parrafos(f.guion.value);
      m.style.width = `${laminas.length ? Math.min(100, (p / laminas.length) * 100) : 0}%`;
      m.className = laminas.length && p === laminas.length ? 'bien' : p > laminas.length ? 'largo' : '';
      $('#cuenta-guion').textContent = `${p} párrafo${p === 1 ? '' : 's'} / ${laminas.length} lámina${laminas.length === 1 ? '' : 's'}`;
    } else {
      const n = palabras(f.guion.value);
      m.style.width = `${Math.min(100, (n / obj) * 100)}%`;
      m.className = n > obj * 1.15 ? 'largo' : n >= obj * 0.85 ? 'bien' : '';
      $('#cuenta-guion').textContent = n ? `${n} / ${obj} palabras · ≈ ${mmss(n / 2.4)}` : `Sugerido: ≈ ${obj} palabras`;
    }
    resumen();
  };
  f.addEventListener('input', actualizar);
  f.addEventListener('change', e => { if (e.target.name === 'laminas') pintarModos(); actualizar(); });
  pintarModos();
  lado();
  pintarLaminas();
  irPaso(1);
  f.onsubmit = async e => {
    e.preventDefault();
    const ficha = Object.fromEntries(new FormData(f));
    const { modo, guion } = ficha;
    const img = ficha.laminas === 'imagen';
    delete ficha.modo; delete ficha.guion; delete ficha.laminas;
    if (img && !laminas.length) { aviso('Sube tus láminas (PNG, JPG o PDF)', true); irPaso(1); return; }
    if ((!img || modo === 'manual') && !String(ficha.tema || '').trim()) { aviso('Escribe el tema de la clase', true); irPaso(3); $('#n-tema').focus(); return; }
    if (img && modo === 'manual' && parrafos(guion) !== laminas.length) { aviso(`Escribe un párrafo por lámina: tienes ${parrafos(guion)} párrafos y ${laminas.length} láminas`, true); irPaso(4); f.guion.focus(); return; }
    if (!img && modo === 'manual' && !palabras(guion)) { aviso('Pega el guion: un párrafo por bloque', true); irPaso(4); f.guion.focus(); return; }
    $('#fs-nueva').disabled = true;
    const inicio = Date.now();
    $('#lado-nueva').innerHTML = modo === 'manual' ? '<div class="generando"><div class="orbita"></div><h3>Creando la clase…</h3></div>'
      : img ? `<div class="generando"><div class="orbita"></div><h3>La IA está mirando tus láminas</h3>
        <p>Lee una lámina a la vez y escribe lo que dice la voz. Con la IA gratis, unos 20 a 40 segundos por lámina.</p>
        <div class="cronometro" id="crono">0:00</div>
        <ol class="pasos-ia"><li><b>1</b>Lo que dice la voz en cada lámina</li><li><b>2</b>Agenda y pronunciación</li><li><b>3</b>Se abre el editor para que revises</li></ol>
        <p class="ayuda" style="margin-top:14px">No cierres esta pestaña.</p></div>`
        : `<div class="generando"><div class="orbita"></div><h3>La IA está escribiendo tu clase</h3>
        <p>Trabaja por partes y completa lo que falte. Suele tardar de 1 a 3 minutos.</p>
        <div class="cronometro" id="crono">0:00</div>
        <ol class="pasos-ia"><li><b>1</b>Guion, agenda y pronunciación</li><li><b>2</b>Una diapositiva por bloque</li><li><b>3</b>Se abre el editor para que revises</li></ol>
        <p class="ayuda" style="margin-top:14px">No cierres esta pestaña.</p></div>`;
    const reloj = setInterval(() => { const c = $('#crono'); if (c) c.textContent = mmss((Date.now() - inicio) / 1000); else clearInterval(reloj); }, 500);
    try {
      const cuerpo = { ficha, modo, guion };
      if (img) cuerpo.laminas = laminas.map(l => l.url);
      const r = await api('/api/clases', { method: 'POST', body: JSON.stringify(cuerpo) });
      clearInterval(reloj);
      location.hash = `#/clase/${r.slug}`;
      setTimeout(() => aviso(r.aviso || 'Clase creada: revisa el guion y las diapositivas', !!r.aviso), 600);
    } catch (err) {
      clearInterval(reloj);
      aviso(err.message, true);
      $('#fs-nueva').disabled = false;
      lado();
      resumen();
    }
  };
}

// ---------------------------------------------------------------- editor
async function vistaEditor(slug) {
  const d = await api(`/api/clases/${slug}`);
  const pestana = editor && editor.slug === slug ? editor.pestana : 'guion';
  editor = { slug, ...d, sucio: false, pestana, esperoVista: false };
  titulo(d.clase.tema || 'Editor');
  prepararItems();
  pintarEditor();
  actualizarTrabajos();
}

function prepararItems() {
  const c = editor.clase;
  const diapos = c.diapositivas || [];
  editor.plantillas = diapos.length > 0 || !editor.codigo;
  editor.laminas = diapos.some(d => d.tipo === 'imagen');
  editor.version = editor.version || Date.now(); // cambia al reemplazar una lamina (para no ver la imagen vieja)
  editor.items = (c.bloques || []).map(b => ({ id: b.id, texto: b.texto, diapo: diapos.find(x => x.bloque === b.id) || null }));
  editor.agenda = (c.agenda || []).map(a => ({ ...a }));
  editor.pron = Object.entries(c.pronunciacion || {}).map(([escrito, dice]) => ({ escrito, dice }));
}

function sucio() { editor.sucio = true; estimar(); }
function estimar() {
  const n = editor.items.reduce((t, it) => t + palabras(it.texto), 0);
  const seg = n / 2.4;
  const obj = editor.clase.duracion_objetivo || 150;
  const e = $('#estimado');
  if (e) {
    // con laminas propias la duracion la marcan las laminas: no hay objetivo que cumplir
    const objetivo = editor.laminas ? '' : `<small>/ objetivo ${mmss(obj)}</small>`;
    e.innerHTML = `<span>${ico('capas', 14)}${editor.items.length} bloques</span><span>${ico('texto', 14)}${n} palabras</span>
      <span class="${!editor.laminas && Math.abs(seg - obj) / obj > 0.15 ? 'fuera' : ''}">${ico('reloj', 14)}≈ ${mmss(seg)} ${objetivo}</span>`;
  }
  const g = $('#guardado');
  if (g) g.innerHTML = editor.sucio ? '<i class="punto ambar"></i>Cambios sin guardar' : `${ico('check', 14)}Guardado`;
  const cuenta = $('[data-p=guion] .cuenta');
  if (cuenta) cuenta.textContent = editor.items.length;
}

function pintarEditor() {
  const c = editor.clase;
  app.innerHTML = `
  <header class="ed-cabecera"><div class="ed-cabecera-in">
    <div style="min-width:0">
      <nav class="migas"><a href="#/">Clases</a>${ico('der', 14)}<span>Editor</span></nav>
      <h1>${esc(c.tema)}</h1>
      <div class="ed-meta" id="estimado"></div>
    </div>
    <div class="acciones">
      <span class="guardado" id="guardado"></span>
      <button class="boton" id="b-guardar" title="Guardar (Ctrl+S)">${ico('guardar')}Guardar</button>
      <button class="boton prim" id="b-video">${ico('pelicula')}Crear video final</button>
    </div>
  </div></header>
  <div class="ed-cuerpo">
    <div style="min-width:0">
      <nav class="pestanas" aria-label="Secciones de la clase">
        <button data-p="guion">${ico('capas')}<span>Guion y diapositivas</span><span class="cuenta">${editor.items.length}</span></button>
        <button data-p="agenda">${ico('lista')}<span>Agenda y pronunciación</span></button>
        <button data-p="voz">${ico('mic')}<span>Voz y avatar</span></button>
        <button data-p="imagenes">${ico('imagen')}<span>Imágenes y avatar</span></button>
        <button data-p="datos">${ico('texto')}<span>Datos</span></button>
      </nav>
      <div id="contenido"></div>
    </div>
    <aside class="ed-lado">
      <section class="panel">
        <div class="panel-cab" style="margin-bottom:14px"><div><h2>Producción</h2><p class="muted">Los videos se crean en la PC del estudio, de uno en uno.</p></div></div>
        <div class="prod-acciones">
          ${['voz', 'capturas', 'borrador', ...(estado.drive.conectado ? ['drive'] : [])].map(m => `<button class="prod-accion" id="b-${m === 'voz' ? 'vista' : m}">
            <span class="modo-ico">${ico(TRABAJOS[m].icono, 17)}</span><span><b>${TRABAJOS[m].nombre}</b><small>${TRABAJOS[m].desc}</small></span><span class="pildora">${TRABAJOS[m].dura}</span></button>`).join('')}
        </div>
        <div class="trabajos" id="trabajos"></div>
        <div class="resultado" id="resultado"></div>
      </section>
      <section class="panel ficha-lado">
        <h3 style="margin-bottom:6px">Ficha</h3>
        <dl>
          <div><dt>Curso</dt><dd>${esc(c.curso || '—')}</dd></div>
          <div><dt>Módulo</dt><dd>${esc(c.modulo || '—')}</dd></div>
          <div><dt>Láminas</dt><dd>${editor.laminas ? 'Imágenes' : editor.plantillas ? 'HTML animadas' : 'Código'}</dd></div>
          <div><dt>Nivel</dt><dd>${esc(c.nivel || '—')}</dd></div>
          <div><dt>Avatar</dt><dd>${esc(c.avatar || '—')}</dd></div>
          <div><dt>Voz</dt><dd id="ficha-voz"></dd></div>
          <div><dt>Google Drive</dt><dd id="ficha-drive"></dd></div>
        </dl>
      </section>
    </aside>
  </div>`;
  $$('.pestanas button').forEach(b => { b.onclick = () => { editor.pestana = b.dataset.p; pintarPestana(); }; });
  $('#b-guardar').onclick = () => guardar().catch(e => aviso(e.message, true));
  $('#b-vista').onclick = () => lanzar('voz');
  $('#b-capturas').onclick = () => lanzar('capturas');
  $('#b-borrador').onclick = () => lanzar('borrador');
  if ($('#b-drive')) $('#b-drive').onclick = () => lanzar('drive');
  $('#b-video').onclick = () => lanzar('video');
  pintarPestana();
  pintarResultado();
  estimar();
  fichaVoz();
  fichaDrive();
}

function fichaVoz() {
  const p = (editor.clase.voz && editor.clase.voz.proveedor) || 'auto';
  const el = $('#ficha-voz');
  if (el) el.textContent = VOCES[p] || p;
}
function fichaDrive() {
  const el = $('#ficha-drive');
  const d = editor.resumen && editor.resumen.drive;
  if (!el) return;
  if (d) el.innerHTML = d.enlace ? `<a href="${esc(d.enlace)}" target="_blank" rel="noopener" title="${esc(d.ruta)}">Abrir carpeta</a>` : `<span title="${esc(d.local || d.ruta)}">Copiado</span>`;
  else el.textContent = estado.drive.conectado ? 'Se sube con el video final' : 'Sin conectar';
}

function pintarPestana() {
  $$('.pestanas button').forEach(b => { const a = b.dataset.p === editor.pestana; b.classList.toggle('activa', a); if (a) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const c = $('#contenido');
  if (editor.pestana === 'voz') return pintarVoz(c);
  if (editor.pestana === 'imagenes') return pintarImagenes(c);
  if (editor.pestana === 'datos') return pintarDatos(c);
  if (editor.pestana === 'agenda') return pintarAgendaPron(c);
  return pintarGuion(c);
}

// ----- pestaña: imágenes y avatar de las láminas de Hyperframes
// Íconos y logos los pone el programa. Lo que ninguna IA de texto dibuja se pide aquí: cada hueco trae su prompt.
// El avatar llega de afuera (Google Vids, HeyGen, cámara): un clip por lámina o un video completo.
let errorHf = '';
const IMAGENES_POR_PAGINA = 3;
const CLIPS_POR_PAGINA = 5;
async function pintarImagenes(cont) {
  const url = `/api/clases/${editor.slug}/hyperframes`;
  cont.innerHTML = '<section class="panel"><p class="muted">Cargando…</p></section>';
  const estado = await api(url);
  if (editor.pestana !== 'imagenes') return;
  const vista = editor.vistaHf || 'imagenes';
  const faltan = estado.imagenes.filter(i => !i.archivo).length;
  const subir = async (archivo, nombre) => {
    aviso('Subiendo…');
    const r = await fetch(`/api/clases/${editor.slug}/archivo?nombre=${encodeURIComponent(nombre)}`, { method: 'PUT', body: archivo });
    if (!r.ok) return aviso('No se pudo subir el archivo', true);
    await api(url, { method: 'POST', body: JSON.stringify({ reconstruir: true }) });
    aviso('Archivo agregado a las láminas');
    pintarImagenes(cont);
  };
  const quitar = async nombre => {
    await fetch(`/api/clases/${editor.slug}/archivo?nombre=${encodeURIComponent(nombre)}`, { method: 'DELETE' });
    await api(url, { method: 'POST', body: JSON.stringify({ reconstruir: true }) });
    aviso('Avatar quitado');
    pintarImagenes(cont);
  };

  const tarjeta = i => `<article class="hueco ${i.archivo ? 'listo' : ''}">
    <div class="hueco-vista">${i.archivo ? `<img src="${url}/imagen/${i.id}?v=${Date.now()}" alt="${esc(i.titulo)}">` : `${ico('imagen', 28)}<b>Inserta aquí la imagen</b>`}</div>
    <div class="hueco-datos">
      <h3>Lámina ${esc(i.lamina)}</h3>
      <p>${esc(i.titulo)}</p>
      <details><summary>Ver el prompt</summary><p class="muted">${esc(i.prompt)}</p></details>
      <div class="hueco-acciones">
        <button class="boton" data-copiar="${esc(i.id)}">Copiar prompt</button>
        <label class="boton ${i.archivo ? '' : 'prim'}">${i.archivo ? 'Cambiar imagen' : 'Subir imagen'}<input type="file" accept="image/jpeg,image/png,image/webp" data-subir="${esc(i.id)}" hidden></label>
      </div>
    </div>
  </article>`;
  const fila = l => {
    const tiene = estado.avatar.clips.includes(l.id);
    return `<article class="clip-fila">
      <div><b>Lámina ${esc(l.id)}</b><span class="muted">${esc(l.parte)} · ${mmss(l.duracion)}</span></div>
      <div class="hueco-acciones">
        <button class="boton chico" data-guion="${esc(l.id)}">Copiar guion</button>
        <label class="boton chico ${tiene ? '' : 'prim'}">${tiene ? 'Cambiar clip' : 'Subir clip'}<input type="file" accept="video/mp4,video/webm" data-clip="${esc(l.id)}" hidden></label>
        ${tiene ? `<button class="boton chico" data-quitar="hyperframes/assets/l${esc(l.id)}-avatar.${estado.avatar.extension[l.id]}">Quitar</button>` : ''}
      </div>
    </article>`;
  };
  const conClip = estado.avatar ? estado.avatar.clips.length : 0;

  cont.innerHTML = `<section class="panel">
    <div class="panel-cab"><div><h2>Video animado</h2>
      <p class="muted">${estado.existe ? (faltan ? `Faltan ${faltan} de ${estado.imagenes.length} imágenes. Copia el prompt, crea la imagen en Google Vids o Gemini y súbela aquí.` : 'Todas las imágenes están listas.') : 'Primero genera las láminas. Los íconos y los logos salen solos.'}</p></div>
      <button class="boton ${estado.existe ? '' : 'prim'}" id="hf-generar">${estado.existe ? 'Volver a armar' : 'Generar láminas'}</button></div>
    ${errorHf ? `<p class="hf-error">${esc(errorHf)}</p>` : ''}
    ${estado.existe && !faltan ? `<div class="hf-video">
      <div class="hueco-acciones">
        <button class="boton prim" id="hf-crear">${estado.video ? 'Crear el video otra vez' : 'Crear video'}</button>
        ${estado.video ? `<a class="boton" href="${url}/video?descargar=1">Descargar video</a>` : ''}
        <span class="muted" id="hf-avance"></span>
      </div>
      ${estado.video ? `<video class="reproductor" controls preload="metadata" src="${url}/video?v=${estado.video}"></video>` : ''}
    </div>` : ''}
    ${estado.existe ? `<div class="segmentado hf-vistas" role="radiogroup" aria-label="Qué quieres revisar">
      <label><input type="radio" name="hf-vista" value="imagenes" ${vista === 'imagenes' ? 'checked' : ''}><span>Imágenes (${estado.imagenes.length})</span></label>
      <label><input type="radio" name="hf-vista" value="avatar" ${vista === 'avatar' ? 'checked' : ''}><span>Avatar que habla</span></label>
    </div>` : ''}
    <div id="hf-lista"></div><div id="hf-paginas"></div>
  </section>`;

  const enlazar = () => {
    cont.querySelectorAll('[data-copiar]').forEach(b => {
      b.onclick = async () => {
        await navigator.clipboard.writeText(estado.imagenes.find(i => i.id === b.dataset.copiar).prompt);
        aviso('Prompt copiado');
      };
    });
    cont.querySelectorAll('[data-guion]').forEach(b => {
      b.onclick = async () => {
        await navigator.clipboard.writeText(estado.lista.find(l => l.id === b.dataset.guion).guion);
        aviso('Guion copiado');
      };
    });
    cont.querySelectorAll('[data-subir]').forEach(entrada => {
      entrada.onchange = () => {
        const archivo = entrada.files[0];
        if (!archivo) return;
        const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[archivo.type];
        if (!ext) return aviso('Usa una imagen JPG, PNG o WebP', true);
        subir(archivo, `hyperframes/assets/${entrada.dataset.subir}.${ext}`);
      };
    });
    cont.querySelectorAll('[data-clip], #hf-completo').forEach(entrada => {
      entrada.onchange = () => {
        const archivo = entrada.files[0];
        if (!archivo) return;
        const ext = { 'video/mp4': 'mp4', 'video/webm': 'webm' }[archivo.type];
        if (!ext) return aviso('Usa un video MP4 o WebM', true);
        subir(archivo, `hyperframes/assets/${entrada.dataset.clip ? `l${entrada.dataset.clip}-avatar` : 'avatar'}.${ext}`);
      };
    });
    cont.querySelectorAll('[data-quitar]').forEach(b => { b.onclick = () => quitar(b.dataset.quitar); });
  };
  const pintarLista = (pagina = 1) => {
    const lista = $('#hf-lista');
    if (vista === 'avatar' && estado.existe) {
      const actual = paginaValida(pagina, estado.lista.length, CLIPS_POR_PAGINA);
      const completo = estado.avatar.completo;
      lista.innerHTML = `<div class="avatar-completo">
          <div><b>Un solo video con toda la clase</b><p class="muted">${completo ? 'Listo: las láminas siguen el tiempo de este video y los clips de abajo no se usan.' : 'Por ejemplo, de HeyGen, de tu cámara o de Google Vids con todas sus escenas.'}</p></div>
          <div class="hueco-acciones">
            <label class="boton chico ${completo ? '' : 'prim'}">${completo ? 'Cambiar video' : 'Subir video'}<input type="file" accept="video/mp4,video/webm" id="hf-completo" hidden></label>
            ${completo ? `<button class="boton chico" data-quitar="hyperframes/${esc(completo)}">Quitar</button>` : ''}
          </div>
        </div>
        <h3 class="clips-titulo">O un clip por lámina <span class="muted">· ${conClip} de ${estado.lista.length}</span></h3>
        <p class="muted">Copia el guion, crea el avatar y sube su video. Cada lámina dura lo que dure su clip.</p>
        <div class="clips">${estado.lista.length ? "" : "<p class=\"muted\">Pulsa Volver a armar para ver las láminas.</p>"}${estado.lista.slice((actual - 1) * CLIPS_POR_PAGINA, actual * CLIPS_POR_PAGINA).map(fila).join('')}</div>`;
      paginador($('#hf-paginas'), estado.lista.length, CLIPS_POR_PAGINA, actual, pintarLista);
    } else {
      const actual = paginaValida(pagina, estado.imagenes.length, IMAGENES_POR_PAGINA);
      lista.innerHTML = `<div class="huecos">${estado.imagenes.slice((actual - 1) * IMAGENES_POR_PAGINA, actual * IMAGENES_POR_PAGINA).map(tarjeta).join('')}</div>`;
      paginador($('#hf-paginas'), estado.imagenes.length, IMAGENES_POR_PAGINA, actual, pintarLista);
    }
    enlazar();
  };
  pintarLista();

  cont.querySelectorAll('[name="hf-vista"]').forEach(r => { r.onchange = () => { editor.vistaHf = r.value; pintarImagenes(cont); }; });
  if ($('#hf-crear')) $('#hf-crear').onclick = () => lanzar('hyperframes');
  $('#hf-generar').onclick = async e => {
    e.target.disabled = true;
    e.target.textContent = estado.existe ? 'Trabajando…' : 'Generando: puede tardar varios minutos…';
    errorHf = '';
    try {
      await api(url, { method: 'POST', body: JSON.stringify({ reconstruir: estado.existe }) });
      aviso('Láminas listas');
    } catch (err) { errorHf = err.message; aviso('No se terminaron las láminas', true); }
    pintarImagenes(cont);
  };
}

// ----- pestaña: guion y diapositivas
function pintarGuion(cont) {
  const fijo = !editor.plantillas;
  // la vista «Así se verá» usa el mismo dibujo del video: cuando termina de cargar, se redibujan los bloques
  if (!fijo && !motor) cargarMotor().then(() => { if (editor && editor.pestana === 'guion' && $('#bloques')) pintarGuion($('#contenido')); }).catch(() => { });
  cont.innerHTML = `
    ${fijo ? `<div class="aviso-caja">${ico('info')}<span>Esta clase usa <b>diapositivas programadas</b> (código). Puedes corregir lo que dice la voz, pero no agregar ni quitar bloques.</span></div>` : editor.laminas ? `
    <div class="barra-ia">
      <span class="ico-caja">${ico('imagen', 18)}</span>
      <div><b>Voz con IA leyendo tus láminas</b><span>La IA vuelve a mirar cada lámina y reescribe lo que dice la voz, la agenda y la pronunciación.</span></div>
      <button class="boton chico" id="ia-gratis" ${estado.ia.vision ? '' : 'disabled'}>IA gratis</button>
      <button class="boton chico" id="ia-claude" ${estado.ia.claude ? '' : 'disabled'}>Claude</button>
    </div>` : `
    <div class="barra-ia">
      <span class="ico-caja">${ico('chispas', 18)}</span>
      <div><b>Diapositivas con IA</b><span>Respeta tu guion y propone diapositivas, agenda y pronunciación.</span></div>
      <button class="boton chico" id="ia-gratis" ${estado.ia.gratis ? '' : 'disabled'}>IA gratis</button>
      <button class="boton chico" id="ia-claude" ${estado.ia.claude ? '' : 'disabled'}>Claude</button>
    </div>`}
    ${fijo || !motor ? '' : `<div class="barra-ia">
      <span class="ico-caja">${ico('capas', 18)}</span>
      <div><b>Diseño de la clase</b><span>El estilo visual de todas las diapositivas. «Otro diseño» cambia el estilo y la variante de cada una.</span></div>
      <select id="estilo-clase" class="chico" aria-label="Estilo visual"><option value="">Estilo automático</option>
        ${Object.entries(motor.ESTILOS).map(([v, n]) => `<option value="${v}" ${editor.clase.estilo === v ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <button class="boton chico" id="otro-diseno">${ico('chispas', 14)}Otro diseño</button>
    </div>`}
    <div id="bloques" class="bloques"></div>
    <div id="paginas-bloques"></div>
    ${fijo ? '' : `<button class="agregar" id="mas-bloque">${ico('mas')}Agregar bloque</button>`}`;
  pintarBloques();
  if (!fijo) {
    $('#mas-bloque').onclick = () => {
      editor.items.push({ id: `n${Date.now()}`, texto: '', diapo: { tipo: 'idea', kicker: '', titulo: '', sub: '' } });
      editor.paginaBloques = Math.ceil(editor.items.length / BLOQUES_POR_PAGINA);
      sucio();
      pintarBloques();
      const ultimo = $$('#bloques .bloque').pop();
      ultimo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('textarea', ultimo).focus();
    };
    $('#ia-gratis').onclick = () => rehacerConIa('gratis');
    $('#ia-claude').onclick = () => rehacerConIa('claude');
    if ($('#estilo-clase')) {
      $('#estilo-clase').onchange = e => { editor.clase.estilo = e.target.value; sucio(); pintarVistas(); };
      // nueva semilla: otro estilo (si esta en automatico) y otra variante en cada diapositiva que no tenga una fija
      $('#otro-diseno').onclick = () => {
        editor.clase.semilla = Math.floor(Math.random() * 1e6);
        sucio();
        pintarVistas();
        aviso(`Diseño nuevo: ${motor.ESTILOS[motor.elegirDiseno(editor.clase).estilo]}. Guarda si te gusta.`);
      };
    }
  }
}

// segundo en que empieza y termina cada bloque (2,4 palabras por segundo + pausa)
function tiempos() {
  let t = 0;
  return editor.items.map(it => { const ini = t; t += palabras(it.texto) / 2.4 + 0.45; return [ini, t - 0.45]; });
}

const BLOQUES_POR_PAGINA = 5;
function paginarBloques(pagina = editor.paginaBloques || 1) {
  const cont = $('#paginas-bloques');
  if (!cont) return;
  const total = editor.items.length;
  const actual = paginaValida(pagina, total, BLOQUES_POR_PAGINA);
  editor.paginaBloques = actual;
  document.querySelectorAll('#bloques .bloque').forEach((b, i) => { b.classList.toggle('oculto', Math.ceil((i + 1) / BLOQUES_POR_PAGINA) !== actual); });
  paginador(cont, total, BLOQUES_POR_PAGINA, actual, n => { paginarBloques(n); $('#bloques').scrollIntoView({ block: 'start' }); });
}
function pintarBloques() {
  const fijo = !editor.plantillas;
  const ts = tiempos();
  $('#bloques').innerHTML = editor.items.map((it, i) => `
    <article class="bloque ${fijo ? 'fijo' : ''}" data-i="${i}">
      <header class="bloque-cab">
        <span class="bloque-num">${dos(i + 1)}</span>
        <span class="bloque-tiempo">${ico('reloj', 13)}<span data-t>${mmss(ts[i][0])} – ${mmss(ts[i][1])}</span></span>
        <span class="pildora contador"></span>
        <span class="espacio"></span>
        ${fijo ? '' : `<button class="icono-boton" data-acc="subir" ${i ? '' : 'disabled'} aria-label="Subir bloque" title="Subir">${ico('arriba')}</button>
          <button class="icono-boton" data-acc="bajar" ${i < editor.items.length - 1 ? '' : 'disabled'} aria-label="Bajar bloque" title="Bajar">${ico('abajo')}</button>
          <button class="icono-boton peligro" data-acc="quitar" aria-label="Quitar bloque" title="Quitar">${ico('basura')}</button>`}
      </header>
      <div class="bloque-cuerpo">
        <div class="bloque-voz">
          <label for="tx-${i}" style="margin:0">Lo que dice la voz</label>
          <textarea id="tx-${i}" data-k="texto" rows="5">${esc(it.texto)}</textarea>
          ${fijo ? '' : `<div class="vista-tit"><span>Así se verá</span><span>${esc(nombreTipo(it.diapo))}</span></div><div data-vista></div>`}
        </div>
        ${fijo ? '' : edDiapo(it.diapo, i)}
      </div>
    </article>`).join('');
  requestAnimationFrame(() => { $$('#bloques textarea').forEach(crecer); paginarBloques(); });
  if (!fijo) pintarVistas();
  $$('#bloques .bloque').forEach(el => {
    const i = +el.dataset.i;
    const contar = () => {
      const n = palabras(editor.items[i].texto);
      const p = $('.contador', el);
      p.textContent = n ? `${n} palabras · ${Math.round(n / 2.4)} s${n > 60 ? ' · muy largo' : ''}` : 'Vacío';
      p.className = `pildora contador ${n > 60 || n === 0 ? 'mal' : n < 15 ? 'aviso' : ''}`;
      p.title = n > 60 ? 'Divide este bloque en dos' : '';
    };
    contar();
    $('[data-k=texto]', el).oninput = e => { editor.items[i].texto = e.target.value; contar(); actualizarTiempos(); sucio(); };
    $$('[data-acc]', el).forEach(b => { b.onclick = () => moverBloque(i, b.dataset.acc); });
    const ed = $('.diapo-ed', el);
    const cambiarLamina = ed && $('[data-lamina]', ed);
    if (cambiarLamina) cambiarLamina.onchange = e => reemplazarLamina(i, e.target.files[0]);
    const quitarEfectos = ed && $('[data-quitar-efectos]', ed);
    if (quitarEfectos) {
      quitarEfectos.onclick = () => {
        if (editor.items[i].diapo) delete editor.items[i].diapo.efectos;
        sucio();
        pintarBloques();
      };
    }
    if (ed) {
      visibles(ed);
      ed.oninput = ed.onchange = () => {
        if (!ed.isConnected) return; // evento de un campo que se acaba de redibujar
        editor.items[i].diapo = leerDiapo(ed);
        visibles(ed);
        $$('textarea', ed).forEach(crecer);
        pintarVistas();
        sucio();
      };
    }
  });
}

function actualizarTiempos() {
  const ts = tiempos();
  $$('#bloques [data-t]').forEach((s, i) => { s.textContent = `${mmss(ts[i][0])} – ${mmss(ts[i][1])}`; });
}

// las cajas de texto del editor crecen con su contenido (sin barras de desplazamiento)
function crecer(t) { t.style.height = 'auto'; t.style.height = `${t.scrollHeight + 2}px`; }
document.addEventListener('input', e => { if (e.target.matches('.bloque textarea')) crecer(e.target); });

const nombreTipo = d => (TIPOS.find(([v]) => v === ((d && d.tipo) || '')) || ['', ''])[1].replace(/—/g, '').trim();

// Vista «Así se verá»: el mismo HTML y CSS que dibujan el video (motor/diapos-auto.js y motor/plantilla.css), a escala
// y con todo visible (sin animar). Va en un shadow DOM para que los estilos del video y los de la web no se mezclen.
let motor = null;   // { htmlDiapo, NOMBRES_ICONOS, hoja } cuando ya cargo
let cargandoMotor = null;
function cargarMotor() {
  cargandoMotor = cargandoMotor || Promise.all([import('/motor/diapos-auto.js'), fetch('/motor/plantilla.css').then(r => r.text())])
    .then(([m, css]) => {
      const hoja = new CSSStyleSheet();
      hoja.replaceSync(css.replace(/:root\b/g, ':host') + m.ESTILO_AUTO + `
        :host { display: block; position: relative; }
        .escena { position: absolute; left: 0; top: 0; width: 1440px; height: 810px; transform-origin: 0 0; transform: scale(var(--k, .3));
          background: var(--papel); overflow: hidden; font-family: var(--sans); color: var(--tinta); }
        .sin-titulo .titulo { opacity: .3; }`);
      motor = { ...m, hoja };
      return motor;
    })
    .catch(e => { cargandoMotor = null; throw e; });
  return cargandoMotor;
}
const escalas = new ResizeObserver(lista => lista.forEach(e => e.target.style.setProperty('--k', e.contentRect.width / 1440)));
const urlLamina = rel => `/clases/${editor.slug}/${rel}?v=${editor.version}`;

// Todas las vistas, con el estilo de la clase y la variante de cada diapositiva (como en el video)
function pintarVistas() {
  const lista = editor.items.map(it => it.diapo).filter(Boolean);
  const diseno = motor ? motor.elegirDiseno({ estilo: editor.clase.estilo, semilla: editor.clase.semilla, diapositivas: lista }) : null;
  let k = 0;
  $$('#bloques .bloque').forEach(el => {
    const d = editor.items[+el.dataset.i].diapo;
    const j = d ? k++ : -1;
    const v = diseno && j >= 0 ? diseno.variantes[j] : '';
    const opciones = diseno && j >= 0 ? { estilo: diseno.estilo, variante: v, indice: j, tinte: diseno.tinte } : {};
    const titulo = $('.vista-tit span:last-child', el);
    if (titulo) titulo.textContent = [nombreTipo(d), v && motor.VARIANTES[d.tipo] ? motor.VARIANTES[d.tipo][v] : ''].filter(Boolean).join(' · ');
    if ($('[data-vista]', el)) pintarVista($('[data-vista]', el), d, opciones);
  });
}

function pintarVista(cont, d, diseno = {}) {
  if (!d || !d.tipo) { cont.innerHTML = `<div class="md md-vacia"><span>${ico('capas')}Continúa ${editor.laminas ? 'la lámina' : 'la diapositiva'} anterior</span></div>`; return; }
  const banda = esc(editor.clase.banda || editor.clase.curso || '');
  if (d.tipo === 'imagen') {
    cont.innerHTML = `<div class="md md-imagen"><div class="md-area">${d.imagen ? `<img src="${esc(urlLamina(d.imagen))}" alt="" loading="lazy">` : ''}</div>
      <div class="md-banda"><b>USS</b><span>${banda}</span></div></div>`;
    return;
  }
  if (!motor) { cont.innerHTML = '<div class="md md-vacia"><span>Preparando la vista…</span></div>'; return; }
  let host = cont.querySelector('.md-vivo');
  if (!host) {
    cont.innerHTML = '<div class="md md-vivo"></div>';
    host = cont.firstChild;
    host.attachShadow({ mode: 'open' }).adoptedStyleSheets = [motor.hoja];
    escalas.observe(host);
  }
  const logo = estado.logo ? '/marca/logo.png' : '';
  const sinTitulo = !d.titulo && d.tipo !== 'logo';
  const r = motor.htmlDiapo(sinTitulo ? { ...d, titulo: 'Título de la diapositiva' } : d, { logo, institucion: editor.clase.institucion, ...diseno });
  host.shadowRoot.innerHTML = `<div class="escena${sinTitulo ? ' sin-titulo' : ''}"><div id="diapos"><section class="diapo ${r.clase}">${r.html}</section></div>
    <div id="banda"><div class="banda-logo">${logo ? `<img id="logo" src="${logo}" alt="">` : '<span class="logo-texto"><b>USS</b><small>Universidad<br>Señor de Sipán</small></span>'}</div>
    <div id="banda-der">${banda}</div></div></div>`;
}

async function moverBloque(i, acc) {
  const it = editor.items;
  if (acc === 'quitar') {
    if (!await confirmar({ titulo: `¿Quitar el bloque ${dos(i + 1)}?`, texto: 'Se quitan su texto y su diapositiva.', boton: 'Quitar bloque', peligro: true })) return;
    it.splice(i, 1);
  } else {
    const j = acc === 'subir' ? i - 1 : i + 1;
    [it[i], it[j]] = [it[j], it[i]];
  }
  sucio();
  pintarBloques();
}

// tipos con etiqueta superior, titulo y subtitulo (todos menos "logo" e "imagen")
const CON_TEXTO = 'portada pregunta idea definicion temario lista pasos ruta flujo codigo comparacion tarjetas dato cierre';
function edDiapo(d, i) {
  d = d || {};
  const lineas = (arr, f) => (arr || []).map(f).join('\n');
  const campo = (tipos, html) => `<div data-tipos="${tipos}">${html}</div>`;
  const inp = (k, v, ph = '') => `<input type="text" id="${k}-${i}" data-k="${k}" value="${esc(v)}" placeholder="${esc(ph)}">`;
  const lbl = (k, texto, ayuda = '') => `<label for="${k}-${i}">${texto}${ayuda ? ` <span class="ayuda">${ayuda}</span>` : ''}</label>`;
  // "Lámina (imagen)" solo aparece en los bloques que tienen una lamina subida
  const tipos = TIPOS.filter(([v]) => v !== 'imagen' || d.tipo === 'imagen');
  return `<div class="diapo-ed">
    ${lbl('tipo', editor.laminas ? 'Lámina o diapositiva' : 'Diapositiva')}
    <select id="tipo-${i}" data-k="tipo">${tipos.map(([v, n]) => `<option value="${v}" ${v === (d.tipo || '') ? 'selected' : ''}>${n}</option>`).join('')}</select>
    ${d.tipo === 'imagen' ? campo('imagen', `<input type="hidden" data-k="imagen" value="${esc(d.imagen)}">
      <input type="hidden" data-k="efectos" value="${esc(JSON.stringify(d.efectos || []))}">
      <p class="ayuda" style="margin:10px 0 0" data-resumen-efectos>${resumenEfectos(d.efectos)}</p>
      ${(d.efectos || []).length ? `<button type="button" class="boton chico" data-quitar-efectos style="margin-top:6px">${ico('x', 14)}Quitar efectos</button>` : ''}
      <label class="soltar chico" style="margin-top:12px"><input type="file" data-lamina accept="image/png,image/jpeg,image/webp">
        <span class="modo-ico">${ico('imagen', 16)}</span><span><b>Reemplazar esta lámina</b><small>${esc(d.imagen)} · PNG o JPG</small></span></label>`) : ''}
    ${campo(CON_TEXTO, `${lbl('kicker', 'Etiqueta superior')}${inp('kicker', d.kicker, 'Ej.: Paso 1 · El DNS')}`)}
    ${campo(`${CON_TEXTO} logo`, `${lbl('titulo', d.tipo === 'logo' ? 'Despedida' : 'Título', 'máx. 7 palabras · *clave* en morado')}${inp('titulo', d.titulo, d.tipo === 'logo' ? '¡Nos vemos en la *próxima sesión*!' : 'Ej.: Semántica = *significado*')}`)}
    ${campo(`${CON_TEXTO} logo`, `${lbl('sub', d.tipo === 'logo' ? 'Firma' : d.tipo === 'definicion' ? 'Definición o logro' : 'Subtítulo')}${inp('sub', d.sub, d.tipo === 'logo' ? 'SIPANCITOBOT · Asistente docente IA' : '')}`)}
    ${campo('portada idea definicion cierre', `${lbl('icono', 'Icono', 'vacío = lo elige según el texto')}<select id="icono-${i}" data-k="icono">
      <option value="">Automático</option>${(motor ? motor.NOMBRES_ICONOS : d.icono ? [d.icono] : []).map(n => `<option value="${n}" ${n === d.icono ? 'selected' : ''}>${n}</option>`).join('')}</select>`)}
    ${motor ? Object.entries(motor.VARIANTES).map(([t, vs]) => campo(t, `${lbl(`variante-${t}`, 'Variante', 'automática = la elige «Otro diseño»')}
      <select id="variante-${t}-${i}" data-k="variante-${t}"><option value="">Automática</option>${Object.entries(vs).map(([v, n]) =>
    `<option value="${v}" ${d.tipo === t && d.variante === v ? 'selected' : ''}>${n}</option>`).join('')}</select>`)).join('') : ''}
    ${campo('dato', `${lbl('dato', 'Dato grande')}${inp('dato', d.dato, 'Ej.: 404')}`)}
    ${campo('portada definicion', `${lbl('chips', 'Etiquetas', 'una por línea')}<textarea id="chips-${i}" data-k="chips" rows="3">${esc(lineas(d.items, x => x.texto))}</textarea>`)}
    ${campo('ruta', `${lbl('app', 'Aplicación', 'se ve en la barra de la ventana')}${inp('app', d.app, 'Ej.: Gmail · Configuración')}`)}
    ${campo('lista pasos temario ruta cierre', `${lbl('items', d.tipo === 'ruta' ? 'Botones o menús, en orden' : 'Puntos', 'uno por línea · «texto | palabra que dice la voz | icono»')}
      <textarea id="items-${i}" data-k="items" rows="4">${esc(lineas(d.items, x => [x.texto, x.cuando, x.icono].join(' | ').replace(/( \| )+$/, '')))}</textarea>`)}
    ${campo('codigo', `${lbl('archivo', 'Nombre de la ventana', 'opcional')}${inp('archivo', d.archivo, 'Ej.: index.html · Buscar en Gmail')}
      ${lbl('codigo', 'Código o texto', 'máx. 14 líneas')}<textarea id="codigo-${i}" class="mono" data-k="codigo" rows="7" spellcheck="false">${esc(d.codigo)}</textarea>`)}
    ${campo('comparacion', `<div class="campos2"><div>${lbl('izq_etiqueta', 'Izquierda · etiqueta')}${inp('izq_etiqueta', d.izq && d.izq.etiqueta, 'SIN')}
      ${lbl('izq_titulo', 'Izquierda · título')}${inp('izq_titulo', d.izq && d.izq.titulo)}${lbl('izq_texto', 'Izquierda · texto')}${inp('izq_texto', d.izq && d.izq.texto)}</div>
      <div>${lbl('der_etiqueta', 'Derecha · etiqueta')}${inp('der_etiqueta', d.der && d.der.etiqueta, 'CON')}${lbl('der_titulo', 'Derecha · título')}${inp('der_titulo', d.der && d.der.titulo)}
      ${lbl('der_texto', 'Derecha · texto')}${inp('der_texto', d.der && d.der.texto)}</div></div>
      ${['izq', 'der'].flatMap(l => ['cuando', 'icono'].map(k => `<input type="hidden" data-k="${l}_${k}" value="${esc((d[l] && d[l][k]) || '')}">`)).join('')}`)}
    ${campo('tarjetas flujo', `${lbl('tarjetas', d.tipo === 'flujo' ? 'Etapas, en orden' : 'Tarjetas', 'una por línea: «título | texto | palabra | icono»')}
      <textarea id="tarjetas-${i}" data-k="tarjetas" rows="4">${esc(lineas(d.tarjetas, x => [x.titulo, x.texto, x.cuando, x.icono].join(' | ').replace(/( \| )+$/, '')))}</textarea>`)}
    ${campo('cierre', `${lbl('reto', 'Reto', 'opcional · se ve en una tarjeta oscura')}${inp('reto', d.reto, 'Ej.: Crea tu firma y dos etiquetas')}`)}
    ${campo('cierre', `${lbl('despedida', 'Despedida')}${inp('despedida', d.despedida, '¡Nos vemos en la próxima clase!')}`)}
    ${campo('pregunta idea definicion temario lista pasos ruta flujo codigo comparacion tarjetas dato cierre logo', `${lbl('nota', 'Nota al pie', 'opcional')}${inp('nota', d.nota)}`)}
  </div>`;
}

// "3 efectos: 2 números y 1 foco, cuando la voz dice «primero», «segundo»…"
function resumenEfectos(efectos) {
  const lista = efectos || [];
  if (!lista.length) return 'Sin efectos: la lámina se ve completa con un acercamiento lento.';
  const nombres = { numero: ['número', 'números'], foco: ['foco', 'focos'], resaltar: ['resaltado', 'resaltados'], zoom: ['zoom', 'zooms'] };
  const cuenta = {};
  for (const e of lista) cuenta[e.tipo] = (cuenta[e.tipo] || 0) + 1;
  const partes = Object.entries(cuenta).map(([t, n]) => `${n} ${(nombres[t] || [t, t])[n === 1 ? 0 : 1]}`);
  const cuando = lista.map(e => e.cuando).filter(Boolean).slice(0, 4).map(c => `«${c}»`).join(', ');
  return `${lista.length} efecto${lista.length === 1 ? '' : 's'}: ${partes.join(', ')}${cuando ? `, cuando la voz dice ${cuando}` : ''}.`;
}

function visibles(ed) {
  const tipo = $('[data-k=tipo]', ed).value;
  $$('[data-tipos]', ed).forEach(x => x.classList.toggle('oculto', !tipo || !x.dataset.tipos.split(' ').includes(tipo)));
}

function leerDiapo(ed) {
  const v = k => { const el = $(`[data-k=${k}]`, ed); return el ? el.value.trim() : ''; };
  const tipo = v('tipo');
  if (!tipo) return null;
  if (tipo === 'imagen') {
    let efectos = [];
    try { efectos = JSON.parse(v('efectos') || '[]'); } catch { /* sin efectos */ }
    return { tipo, imagen: v('imagen'), ...(efectos.length ? { efectos } : {}) };
  }
  const partes = l => l.split('|').map(x => x.trim());
  const filas = k => v(k).split('\n').map(x => x.trim()).filter(Boolean);
  const d = {
    tipo, variante: v(`variante-${tipo}`), kicker: v('kicker'), titulo: v('titulo'), sub: v('sub'), nota: v('nota'), icono: v('icono'), dato: v('dato'), reto: v('reto'),
    despedida: v('despedida'), archivo: v('archivo'), app: v('app'), codigo: $('[data-k=codigo]', ed).value
  };
  const conIcono = icono => (icono ? { icono } : {});
  d.items = ['portada', 'definicion'].includes(tipo) ? filas('chips').map(texto => ({ texto, cuando: '' }))
    : filas('items').map(l => { const [texto, cuando = '', icono = ''] = partes(l); return { texto, cuando, ...conIcono(icono) }; });
  d.tarjetas = filas('tarjetas').map(l => { const [titulo, texto = '', cuando = '', icono = ''] = partes(l); return { titulo, texto, cuando, ...conIcono(icono) }; });
  const lado = l => ({ etiqueta: v(`${l}_etiqueta`), titulo: v(`${l}_titulo`), texto: v(`${l}_texto`), cuando: v(`${l}_cuando`), ...conIcono(v(`${l}_icono`)) });
  d.izq = lado('izq');
  d.der = lado('der');
  return d;
}

// ----- pestaña: agenda y pronunciacion
function pintarAgendaPron(cont) {
  cont.innerHTML = `
    <section class="panel">
      <div class="panel-cab"><div><h2>Agenda</h2><p class="muted">Aparece en la columna derecha del video y avanza sola. De 3 a 6 puntos cortos.</p></div>
        <div class="acciones"><button class="boton chico" id="mas-agenda">${ico('mas', 14)}Punto</button></div></div>
      <div id="agenda" class="filas"></div>
    </section>
    <section class="panel">
      <div class="panel-cab"><div><h2>Pronunciación</h2><p class="muted">Cómo debe leer la voz las siglas o palabras en inglés. No cambia lo que se ve.</p></div>
        <div class="acciones"><button class="boton chico" id="mas-pron">${ico('mas', 14)}Palabra</button></div></div>
      <div id="pron" class="filas"></div>
    </section>`;
  pintarAgenda();
  pintarPron();
  $('#mas-agenda').onclick = () => { editor.agenda.push({ titulo: '', desde: editor.items[0] && editor.items[0].id }); sucio(); pintarAgenda(); $$('#agenda input').pop().focus(); };
  $('#mas-pron').onclick = () => { editor.pron.push({ escrito: '', dice: '' }); sucio(); pintarPron(); $$('#pron input').at(-2).focus(); };
}

function opcionesBloques(sel) {
  return editor.items.map((it, i) => `<option value="${esc(it.id)}" ${it.id === sel ? 'selected' : ''}>Bloque ${dos(i + 1)} · ${esc(it.texto.split(/\s+/).slice(0, 4).join(' '))}…</option>`).join('');
}
function pintarAgenda() {
  $('#agenda').innerHTML = editor.agenda.map((a, i) => `<div class="fila" data-i="${i}">
    <span class="n">${i + 1}</span>
    <input type="text" data-k="titulo" value="${esc(a.titulo)}" placeholder="Título corto (máx. 24 letras)" maxlength="30" aria-label="Punto ${i + 1} de la agenda">
    <select data-k="desde" aria-label="Bloque donde empieza">${opcionesBloques(a.desde)}</select>
    <button class="icono-boton peligro" data-acc="x" aria-label="Quitar punto">${ico('basura')}</button></div>`).join('')
    || '<div class="sin-filas">Sin agenda: la columna derecha del video queda vacía.</div>';
  $$('#agenda .fila').forEach(f => {
    const a = editor.agenda[+f.dataset.i];
    f.oninput = f.onchange = () => { if (!f.isConnected) return; a.titulo = $('[data-k=titulo]', f).value; a.desde = $('[data-k=desde]', f).value; sucio(); };
    $('[data-acc]', f).onclick = () => { editor.agenda.splice(+f.dataset.i, 1); sucio(); pintarAgenda(); };
  });
}
function pintarPron() {
  $('#pron').innerHTML = editor.pron.map((p, i) => `<div class="fila pron" data-i="${i}">
    <input type="text" class="mono" data-k="escrito" value="${esc(p.escrito)}" placeholder="Se escribe (ej.: CSS)" aria-label="Se escribe">
    <span class="flecha">${ico('flecha')}</span>
    <input type="text" data-k="dice" value="${esc(p.dice)}" placeholder="Se dice (ej.: ce ese ese)" aria-label="Se dice">
    <button class="icono-boton peligro" data-acc="x" aria-label="Quitar palabra">${ico('basura')}</button></div>`).join('')
    || '<div class="sin-filas">Sin palabras especiales.</div>';
  $$('#pron .fila').forEach(f => {
    const p = editor.pron[+f.dataset.i];
    f.oninput = () => { p.escrito = $('[data-k=escrito]', f).value; p.dice = $('[data-k=dice]', f).value; sucio(); };
    $('[data-acc]', f).onclick = () => { editor.pron.splice(+f.dataset.i, 1); sucio(); pintarPron(); };
  });
}

async function rehacerConIa(modo) {
  const conLaminas = editor.laminas;
  const ok = await confirmar(conLaminas
    ? { titulo: 'Reescribir la voz leyendo las láminas', texto: 'La IA vuelve a mirar cada lámina y reemplaza lo que dice la voz, la agenda y la pronunciación. Tus láminas no cambian.', boton: 'Reescribir la voz' }
    : { titulo: 'Rehacer las diapositivas con IA', texto: 'La IA reemplaza las diapositivas, la agenda y la pronunciación. Tu guion no cambia.', boton: 'Rehacer diapositivas' });
  if (!ok) return;
  try { await guardar(true); } catch (e) { aviso(e.message, true); return; }
  const b = $(`#ia-${modo}`);
  b.disabled = true;
  b.innerHTML = '<span class="anillo-carga" style="width:14px;height:14px;border-width:2px"></span>Trabajando…';
  try {
    const r = await api(`/api/clases/${editor.slug}/ia`, { method: 'POST', body: JSON.stringify({ modo, laminas: conLaminas }) });
    editor.clase = r.clase;
    prepararItems();
    editor.sucio = false;
    pintarPestana();
    estimar();
    aviso(r.aviso || (conLaminas ? 'Voz nueva lista: revísala' : 'Diapositivas nuevas listas: revísalas'), !!r.aviso);
  } catch (e) { aviso(e.message, true); pintarPestana(); }
}

// Reemplaza la imagen de una lamina (se manda en JPG, como las que se suben al crear la clase)
async function reemplazarLamina(i, archivo) {
  const it = editor.items[i];
  if (!archivo || !it || !it.diapo || it.diapo.tipo !== 'imagen') return;
  try {
    const nombre = it.diapo.imagen.replace(/\.(png|webp)$/, '.jpg');
    const r = await fetch(`/api/clases/${editor.slug}/archivo?nombre=${encodeURIComponent(nombre)}`, { method: 'PUT', body: await blobDe(await imagenAJpg(archivo)) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Error ${r.status}`);
    if (nombre !== it.diapo.imagen) { it.diapo.imagen = nombre; sucio(); }
    editor.version = Date.now();
    pintarBloques();
    aviso('Lámina reemplazada');
  } catch (e) { aviso(`No se pudo reemplazar la lámina: ${e.message}`, true); }
}

// ----- pestaña: voz y avatar
function pintarVoz(cont) {
  const v = editor.clase.voz || { proveedor: 'auto', elevenlabs_voz: '' };
  const arch = editor.archivos;
  const buscar = n => arch.find(a => a.nombre.replace(/\.[^.]+$/, '') === n);
  const fila = (n, titulo, icono) => {
    const a = buscar(n);
    return a ? `<div class="archivo"><span class="modo-ico">${ico(icono, 16)}</span><div><b>${esc(titulo)}</b><small>${esc(a.nombre)} · ${MB(a.tam)}</small></div>
      <button class="icono-boton peligro" data-borrar="${esc(a.nombre)}" aria-label="Quitar ${esc(titulo)}">${ico('basura')}</button></div>` : '';
  };
  const soltar = (id, titulo, detalle, acepta) => `<label class="soltar" data-soltar="${id}"><input type="file" id="${id}" accept="${acepta}">
    <span class="modo-ico">${ico('subir', 17)}</span><span><b>${titulo}</b><small>${detalle}</small></span></label>`;
  const opcion = (valor, icono, titulo, detalle) => `<label class="opcion"><input type="radio" name="v-prov" value="${valor}" ${(v.proveedor || 'auto') === valor ? 'checked' : ''}>
    <span class="modo-ico">${ico(icono, 16)}</span><span><b>${titulo}</b><small>${detalle}</small></span></label>`;
  cont.innerHTML = `
  <section class="panel">
    <div class="panel-cab"><div><h2>Voz del avatar</h2><p class="muted">Con qué voz habla el avatar en esta clase.</p></div></div>
    <div class="opciones">
      ${opcion('auto', 'rayo', 'Automática', 'Tu grabación si existe; si no, la mejor voz configurada (ElevenLabs › Azure › local › sistema).')}
      ${opcion('local', 'volumen', 'Voz local gratis', estado.voz.local ? 'Piper en la PC del estudio: sin internet, sin cuenta, sin límite.' : 'Instálala con INSTALAR-VOZ-LOCAL en la PC del estudio.')}
      ${opcion('azure', 'ondas', 'Azure', estado.voz.azure ? 'Voces neurales de Perú y México. 0,5 M caracteres gratis al mes.' : 'Configúrala en Ajustes.')}
      ${opcion('elevenlabs', 'ondas', 'ElevenLabs', estado.voz.elevenlabs ? 'Voz natural (clonada o elegida).' : 'Configúrala en Ajustes.')}
      ${opcion('grabacion', 'mic', 'Solo mi grabación', 'Tu propia voz grabada (abajo).')}
      ${opcion('sistema', 'volumen', 'Voz del sistema', 'Gratis y sin internet; suena sintética.')}
    </div>
    <label for="v-id">Voice ID de ElevenLabs para esta clase <span class="ayuda">opcional: vacío usa el de Ajustes</span></label>
    <input type="text" id="v-id" class="mono" value="${esc(v.elevenlabs_voz)}" placeholder="Ej.: JBFqnCBsd6RMkjVDRZzb">
  </section>
  <section class="panel">
    <div class="panel-cab"><div><h2>Grabar tu propia voz</h2><p class="muted">Tu grabación es la narración del video (no clona tu voz).</p></div>
      <div class="acciones"><button class="boton chico" id="b-guion">${ico('descargar', 14)}Guion para grabar</button></div></div>
    <div class="pasos-voz">
      <div><b>Descarga el guion</b>Tiene cada bloque separado.</div>
      <div><b>Graba de corrido</b>Calla 2 segundos entre bloques.</div>
      <div><b>Sube el audio</b>El estudio lo corta solo.</div>
    </div>
    ${fila('voz/completa', 'Grabación completa', 'mic')}
    ${soltar('up-completa', 'Subir grabación completa', 'Arrastra aquí o elige · m4a, mp3, wav', 'audio/*,video/mp4')}
    <label for="up-bloque-id">Corregir un solo bloque</label>
    <div class="campos2"><select id="up-bloque-id">${editor.items.map((it, i) => `<option value="${dos(i + 1)}">Bloque ${dos(i + 1)}</option>`).join('')}</select>
      ${soltar('up-bloque', 'Subir audio del bloque', 'Reemplaza solo ese bloque', 'audio/*')}</div>
    ${arch.filter(a => /^voz\/\d{2}\./.test(a.nombre)).map(a => fila(a.nombre.replace(/\.[^.]+$/, ''), `Bloque ${a.nombre.slice(4, 6)}`, 'mic')).join('')}
  </section>
  <section class="panel">
    <div class="panel-cab"><div><h2>Recuadro de cámara</h2><p class="muted">Por defecto aparece el robot animado. Puedes reemplazarlo.</p></div></div>
    ${fila('camara', 'Tu video de cámara', 'camara')}
    ${soltar('up-camara', 'Tu video de cámara leyendo el guion', 'Tu cara y tu voz · con pausas de 2 s entre bloques', 'video/*')}
    <div style="height:10px"></div>
    ${fila('avatar', 'Avatar de HeyGen o Hedra', 'bot')}
    ${soltar('up-avatar', 'Video de avatar (HeyGen o Hedra)', 'Hecho con el audio de esta clase', 'video/*')}
    <div class="subida oculto" id="subiendo"><div class="medidor"><div class="medidor-barra"><i id="subida-barra"></i></div><span id="subida-txt"></span></div></div>
  </section>`;
  const guardarVoz = () => {
    editor.clase.voz = { proveedor: (cont.querySelector('[name=v-prov]:checked') || {}).value || 'auto', elevenlabs_voz: $('#v-id').value.trim() };
    fichaVoz();
    sucio();
  };
  $$('[name=v-prov]', cont).forEach(r => { r.onchange = guardarVoz; });
  $('#v-id').oninput = guardarVoz;
  $('#b-guion').onclick = descargarGuion;
  const ext = f => (f.name.split('.').pop() || 'm4a').toLowerCase();
  const destino = {
    'up-completa': f => `voz/completa.${ext(f)}`,
    'up-bloque': f => `voz/${$('#up-bloque-id').value}.${ext(f)}`,
    'up-camara': f => `camara.${ext(f)}`,
    'up-avatar': f => `avatar.${ext(f)}`,
  };
  $$('[data-soltar]', cont).forEach(z => {
    const id = z.dataset.soltar;
    $('input', z).onchange = e => subir(e.target.files[0], destino[id]);
    z.ondragover = e => { e.preventDefault(); z.classList.add('encima'); };
    z.ondragleave = () => z.classList.remove('encima');
    z.ondrop = e => { e.preventDefault(); z.classList.remove('encima'); subir(e.dataTransfer.files[0], destino[id]); };
  });
  $$('[data-borrar]', cont).forEach(b => {
    b.onclick = async () => {
      if (!await confirmar({ titulo: '¿Quitar este archivo?', texto: b.dataset.borrar, boton: 'Quitar', peligro: true })) return;
      await api(`/api/clases/${editor.slug}/archivo?nombre=${encodeURIComponent(b.dataset.borrar)}`, { method: 'DELETE' });
      await recargarArchivos();
    };
  });
}

function subir(archivo, nombreDe) {
  if (!archivo) return;
  const nombre = nombreDe(archivo);
  const caja = $('#subiendo');
  caja.classList.remove('oculto');
  const x = new XMLHttpRequest();
  x.open('PUT', `/api/clases/${editor.slug}/archivo?nombre=${encodeURIComponent(nombre)}`);
  x.upload.onprogress = e => {
    if (!e.lengthComputable) return;
    const p = Math.round((e.loaded / e.total) * 100);
    $('#subida-barra').style.width = `${p}%`;
    $('#subida-txt').textContent = `Subiendo ${archivo.name} · ${p}%`;
  };
  x.onload = async () => {
    caja.classList.add('oculto');
    if (x.status >= 200 && x.status < 300) { aviso('Archivo subido'); await recargarArchivos(); } else aviso(`No se pudo subir: ${x.responseText}`, true);
  };
  x.onerror = () => { caja.classList.add('oculto'); aviso('Se cortó la subida', true); };
  x.send(archivo);
}
async function recargarArchivos() {
  const d = await api(`/api/clases/${editor.slug}`);
  editor.archivos = d.archivos;
  if (editor.pestana === 'voz') pintarVoz($('#contenido'));
}

function descargarGuion() {
  const lineas = [`GUION PARA GRABAR - ${editor.clase.tema}`, '', 'Lee de corrido. CALLA 2 SEGUNDOS entre bloque y bloque.', 'Lugar silencioso, micrófono a un palmo, voz de clase normal.', ''];
  editor.items.forEach((it, i) => { lineas.push(`[BLOQUE ${dos(i + 1)}]`, it.texto, '', '   . . . pausa de 2 segundos . . .', ''); });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([lineas.join('\r\n')], { type: 'text/plain;charset=utf-8' }));
  a.download = `guion-${editor.slug}.txt`;
  a.click();
}

// ----- pestaña: datos
function pintarDatos(cont) {
  const c = editor.clase;
  const campos = [['tema', 'Tema'], ['curso', 'Curso'], ['modulo', 'Módulo (carpeta en Google Drive)'], ['banda', 'Texto de la franja verde'], ['nivel', 'Nivel'],
  ['avatar', 'Nombre del avatar'], ['rol_avatar', 'Rol del avatar'], ['docente', 'Docente que revisó'], ['institucion', 'Institución']];
  cont.innerHTML = `
    <section class="panel">
      <div class="panel-cab"><div><h2>Datos de la clase</h2><p class="muted">El avatar aparece en el recuadro de cámara; el docente, abajo a la derecha del video.</p></div></div>
      <div class="campos2">${campos.map(([k, n]) => `<div><label for="d-${k}">${n}</label><input type="text" id="d-${k}" data-k="${k}" value="${esc(c[k])}"></div>`).join('')}</div>
    </section>
    <section class="panel peligro-zona">
      <div class="panel-cab"><div><h2>Zona de peligro</h2><p class="muted">La clase se mueve a la carpeta «papelera» de la PC del estudio; no se borra del todo.</p></div>
        <div class="acciones"><button class="boton peligro" id="b-borrar">${ico('basura')}Mover a la papelera</button></div></div>
    </section>`;
  $$('[data-k]', cont).forEach(i => { i.oninput = () => { c[i.dataset.k] = i.value; sucio(); }; });
  $('#b-borrar').onclick = async () => {
    if (!await confirmar({ titulo: '¿Mover esta clase a la papelera?', texto: c.tema, boton: 'Mover a la papelera', peligro: true })) return;
    await api(`/api/clases/${editor.slug}`, { method: 'DELETE' });
    editor = null;
    aviso('Clase movida a la papelera');
    location.hash = '#/';
  };
}

// ----- guardar y trabajos
async function guardar(silencioso = false) {
  // se confirma el campo que se esta editando (dispara su cambio ahora) y despues se le devuelve el foco
  const foco = document.activeElement;
  const idFoco = foco && foco.id && $('#contenido') && $('#contenido').contains(foco) ? foco.id : '';
  if (idFoco) foco.blur();
  const c = editor.clase;
  c.bloques = editor.items.map(it => ({ id: it.id, texto: it.texto }));
  c.diapositivas = editor.plantillas ? editor.items.map(it => (it.diapo ? { ...it.diapo, bloque: it.id } : null)).filter(Boolean) : [];
  if (editor.plantillas && !c.diapositivas.length) throw new Error('Elige una diapositiva para el primer bloque');
  c.agenda = editor.agenda.filter(a => a.titulo.trim()).map(a => ({ titulo: a.titulo.trim(), desde: a.desde }));
  c.pronunciacion = Object.fromEntries(editor.pron.filter(p => p.escrito.trim() && p.dice.trim()).map(p => [p.escrito.trim(), p.dice.trim()]));
  if (editor.items.some(it => !it.texto.trim())) throw new Error('Hay un bloque vacío: escribe su texto o quítalo');
  const r = await api(`/api/clases/${editor.slug}`, { method: 'PUT', body: JSON.stringify({ clase: c }) });
  editor.clase = r.clase;
  editor.sucio = false;
  if (!silencioso) {
    prepararItems();
    pintarPestana();
    aviso('Cambios guardados');
  }
  if (idFoco && document.getElementById(idFoco)) document.getElementById(idFoco).focus();
  estimar();
}

async function lanzar(modo) {
  try {
    if (editor.sucio) await guardar(true);
    if (modo === 'voz') editor.esperoVista = true;
    await api(`/api/clases/${editor.slug}/trabajo`, { method: 'POST', body: JSON.stringify({ modo }) });
    aviso(`${TRABAJOS[modo].nombre}: en marcha`);
    actualizarTrabajos();
  } catch (e) { aviso(e.message, true); }
}

// Mientras un video se crea, se pregunta cada 2 s; si no hay nada en marcha, cada 30 s
// (por si alguien del equipo lanza uno) y nada mientras la pestaña está oculta.
let ultimoEstado = {};
function programarSondeo(ms) { clearTimeout(sondeo); sondeo = setTimeout(actualizarTrabajos, ms); }
document.addEventListener('visibilitychange', () => { if (!document.hidden && editor && $('#trabajos')) actualizarTrabajos(); });
async function actualizarTrabajos() {
  if (!editor || !$('#trabajos')) return;
  if (document.hidden) return clearTimeout(sondeo);
  let lista;
  try { lista = await api('/api/trabajos'); } catch { return programarSondeo(10000); }
  if (!editor || !$('#trabajos')) return;
  programarSondeo(lista.some(t => t.estado === 'trabajando' || t.estado === 'en-cola') ? 2000 : 30000);
  const mios = lista.filter(t => t.slug === editor.slug).slice(0, 4);
  const otros = lista.filter(t => t.slug !== editor.slug && (t.estado === 'trabajando' || t.estado === 'en-cola')).length;
  const enCurso = mios.some(t => t.estado === 'trabajando' || t.estado === 'en-cola');
  const hf = mios.find(t => t.modo === 'hyperframes' && (t.estado === 'trabajando' || t.estado === 'en-cola'));
  if ($('#hf-avance')) $('#hf-avance').textContent = hf ? `${hf.mensaje}${hf.progreso ? `: ${hf.progreso}%` : ''}` : '';
  $('#trabajos').innerHTML = (otros && enCurso ? `<p class="nota-cola">${ico('reloj', 14)}Hay ${otros} trabajo(s) de otras clases antes que el tuyo.</p>` : '') + mios.map(t => {
    const info = TRABAJOS[t.modo] || { nombre: t.modo, icono: 'pelicula' };
    const seg = ((t.fin || Date.now()) - t.inicio) / 1000;
    const p = t.estado === 'listo' ? 100 : t.estado === 'en-cola' ? 0 : t.progreso;
    return `<div class="trabajo ${t.estado}">
      <div class="trabajo-cab">${ico(info.icono)}<b>${info.nombre}</b><span class="pildora ${t.estado}">${ESTADO_TRABAJO[t.estado] || t.estado}</span></div>
      <div class="progreso"><i style="width:${p}%"></i></div>
      <div class="trabajo-pie"><span>${t.estado === 'en-cola' ? 'Esperando turno' : esc(t.mensaje)}</span><span>${t.estado === 'trabajando' && t.progreso ? `${t.progreso}% · ` : ''}${mmss(seg)}</span></div>
      ${t.estado === 'error' ? `<details class="log"><summary>Ver detalle del error</summary><pre>${esc(t.log.join('\n'))}</pre></details>` : ''}
    </div>`;
  }).join('');
  // cuando algo termina, mostrar el resultado
  for (const t of mios) {
    const antes = ultimoEstado[t.id];
    if (t.estado === 'listo' && antes && antes !== 'listo') {
      if (t.modo === 'voz' && editor.esperoVista) { editor.esperoVista = false; editor.mostrar = 'vista'; }
      if (t.modo === 'capturas') editor.mostrar = 'capturas';
      if (t.modo === 'video' || t.modo === 'borrador') editor.mostrar = t.modo;
      if (t.modo === 'drive') editor.mostrar = 'video';
      if (t.modo === 'hyperframes' && editor.pestana === 'imagenes') pintarImagenes($('#contenido'));
      aviso(`${(TRABAJOS[t.modo] || {}).nombre || t.modo}: listo`);
      pintarResultado();
    }
    if (t.estado === 'error' && antes && antes !== 'error') aviso(`${(TRABAJOS[t.modo] || {}).nombre || t.modo}: falló. Mira el detalle en Producción.`, true);
    ultimoEstado[t.id] = t.estado;
  }
}

async function pintarResultado() {
  const r = $('#resultado');
  if (!r) return;
  const slug = editor.slug;
  const arch = editor.archivos || [];
  const cam = arch.find(a => /^camara\./.test(a.nombre)) || arch.find(a => /^avatar\./.test(a.nombre));
  const urlVista = `/motor/plantilla.html?clase=${slug}&modo=vista${cam ? `&avatar=${encodeURIComponent(cam.nombre)}` : ''}${estado.logo ? '&logo=1' : ''}`;
  if (editor.mostrar === 'vista') {
    r.innerHTML = `<h4>Vista previa lista</h4><a class="boton lima ancho" href="${urlVista}" target="_blank" rel="noopener">${ico('play')}Abrir vista previa con sonido</a>
      <p class="ayuda" style="margin-top:8px">Se abre en otra pestaña con la voz recién generada.</p>`;
  } else if (editor.mostrar === 'capturas') {
    const imgs = await api(`/api/clases/${slug}/capturas`);
    r.innerHTML = `<h4>Diapositivas (${imgs.length})</h4><div class="miniaturas">${imgs.slice(0, 4).map(u => `<img src="${u}" alt="" loading="lazy">`).join('')}</div>
      <button class="boton ancho" id="b-galeria">${ico('imagen')}Ver las ${imgs.length} capturas</button>`;
    $('#b-galeria').onclick = () => abrirGaleria(imgs);
  } else {
    const d = await api(`/api/clases/${slug}`).catch(() => null);
    const res = d && d.resumen;
    if (editor.mostrar === 'borrador') {
      r.innerHTML = `<h4>Borrador</h4><video class="reproductor" controls preload="metadata" src="/api/clases/${slug}/video?borrador=1&ver=1&t=${Date.now()}"></video>
        <div class="acciones"><a class="boton ancho" href="/api/clases/${slug}/video?borrador=1">${ico('descargar')}Descargar borrador</a></div>`;
    } else if (res && res.video) {
      const dr = res.drive;
      r.innerHTML = `<h4>Video final</h4><video class="reproductor" controls preload="metadata" src="/api/clases/${slug}/video?ver=1&t=${res.video.fecha}"></video>
        <div class="acciones"><a class="boton lima ancho" href="/api/clases/${slug}/video">${ico('descargar')}Descargar MP4 · ${MB(res.video.tam)}</a></div>
        ${res.html ? `<div class="acciones" style="margin-top:8px"><a class="boton ancho" href="/api/clases/${slug}/html" title="Se abre con doble clic en cualquier navegador">${ico('texto')}Clase en HTML · ${MB(res.html.tam)}</a></div>` : ''}
        ${dr && dr.enlace ? `<div class="acciones" style="margin-top:8px"><a class="boton ancho" href="${esc(dr.enlace)}" target="_blank" rel="noopener">${ico('subir')}Abrir en Google Drive</a></div>` : ''}
        <p class="ayuda" style="margin-top:8px;text-align:center">Creado ${hace(res.video.fecha)}${dr ? ` · en Drive: ${esc(dr.ruta)}` : ''}</p>`;
    }
    if (d) { editor.resumen = d.resumen; fichaDrive(); }
  }
}

// ---------------------------------------------------------------- ajustes
async function vistaAjustes() {
  editor = null;
  const a = await api('/api/ajustes');
  const campo = (k, nombre, ayuda = '', { secreto = false, mono = false, ph = '' } = {}) => `<label for="aj-${k}">${nombre}</label>
    <input type="${secreto ? 'password' : 'text'}" id="aj-${k}" name="${k}" value="${secreto ? '' : esc(a[k])}" autocomplete="off" spellcheck="false" class="${mono || secreto ? 'mono' : ''}"
      placeholder="${esc(secreto ? (a[k] ? `${a[k]}  (guardada)` : 'Pega aquí tu clave') : ph)}">
    ${ayuda ? `<p class="ayuda" style="margin-top:6px">${ayuda}</p>` : ''}`;
  const pild = (ok, si = 'Configurado', no = 'Sin configurar') => `<span class="pildora ${ok ? 'ok' : ''}"><i class="punto ${ok ? 'on' : ''}"></i>${ok ? si : no}</span>`;
  const dr = estado.drive;
  const recargar = async () => { estado = await api('/api/estado'); await vistaAjustes(); pintarLateral('/ajustes'); };

  app.innerHTML = `<div class="vista">
  <div class="ajustes-hero">
    <div>
      <h1>Ajustes y Conexiones del Estudio</h1>
      <p>Administra los proveedores de Voz Neural, Inteligencia Artificial Multimodal (Gemini, Groq, Claude) y Google Drive para la Universidad Señor de Sipán.</p>
    </div>
    <div class="ajustes-badges">
      <span class="ajustes-badge-pill ${estado.voz.elevenlabs || estado.voz.azure || estado.voz.local ? 'on' : ''}">
        ${ico('mic', 14)} Voz: ${estado.voz.elevenlabs ? 'ElevenLabs' : estado.voz.azure ? 'Azure' : estado.voz.local ? 'Local' : 'Sistema'}
      </span>
      <span class="ajustes-badge-pill ${estado.ia.gratis || estado.ia.claude ? 'on' : ''}">
        ${ico('chispas', 14)} IA: ${estado.ia.vision ? 'Visión Activa' : 'Texto'}
      </span>
      <span class="ajustes-badge-pill ${dr.conectado ? 'on' : ''}">
        ${ico('subir', 14)} Drive: ${dr.conectado ? 'Conectado' : 'Sin conectar'}
      </span>
    </div>
  </div>

  <!-- Pestañas de Cuadros Comparativos -->
  <div class="comp-tabs">
    <button type="button" class="comp-tab activo" id="tab-comp-voces">${ico('volumen', 15)}<span>Cuadro Comparativo: Voces y Audio</span></button>
    <button type="button" class="comp-tab" id="tab-comp-ia">${ico('chispas', 15)}<span>Cuadro Comparativo: Motores de IA y Visión</span></button>
  </div>

  <!-- Cuadro 1: Voces y Audio -->
  <div class="comp-box" id="box-comp-voces">
    <table class="comp-tabla">
      <thead>
        <tr>
          <th>Proveedor</th>
          <th>Calidad y Naturalidad</th>
          <th>Costo y Cuota</th>
          <th>Ideal Para</th>
          <th>Estado Actual</th>
          <th>Configuración</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="comp-serv">
              <span class="ico-wrap">${ico('ondas', 16)}</span>
              <div><b>ElevenLabs</b><small style="display:block;color:var(--gris)">Voz humana clonada</small></div>
            </div>
          </td>
          <td><b style="color:#073299">Ultra Realista</b> <span class="badge-tag pro">Humana</span></td>
          <td>Plan Free (George/Sarah) o Starter ($5/mes)</td>
          <td>Video final institucional de alta gama</td>
          <td>${pild(estado.voz.elevenlabs)}</td>
          <td><button type="button" class="boton chico" data-ajuste="elevenlabs">${ico('ajustes', 13)} Ver detalles</button></td>
        </tr>
        <tr>
          <td>
            <div class="comp-serv">
              <span class="ico-wrap">${ico('volumen', 16)}</span>
              <div><b>Azure Speech</b><small style="display:block;color:var(--gris)">Microsoft Cognitive</small></div>
            </div>
          </td>
          <td><b>Muy Natural</b> <span class="badge-tag rec">Acento Perú</span></td>
          <td>Gratis 500k car/mes (~240 clases)</td>
          <td>Producción académica diaria en Perú</td>
          <td>${pild(estado.voz.azure)}</td>
          <td><button type="button" class="boton chico" data-ajuste="azure">${ico('ajustes', 13)} Ver detalles</button></td>
        </tr>
        <tr>
          <td>
            <div class="comp-serv">
              <span class="ico-wrap">${ico('mic', 16)}</span>
              <div><b>Piper (Voz Local)</b><small style="display:block;color:var(--gris)">Motor local offline</small></div>
            </div>
          </td>
          <td>Sintética clara <span class="badge-tag local">Sin internet</span></td>
          <td>100% Gratis e ilimitada</td>
          <td>Borradores y trabajo sin conexión</td>
          <td>${pild(estado.voz.local, 'Instalada', 'Sin instalar')}</td>
          <td><button type="button" class="boton chico" data-ajuste="piper">${ico('ajustes', 13)} Ver detalles</button></td>
        </tr>
        <tr>
          <td>
            <div class="comp-serv">
              <span class="ico-wrap">${ico('texto', 16)}</span>
              <div><b>Voz del Sistema</b><small style="display:block;color:var(--gris)">macOS Speech</small></div>
            </div>
          </td>
          <td>Robótica básica</td>
          <td>100% Gratis</td>
          <td>Pruebas de emergencia y respaldo</td>
          <td><span class="pildora ok"><i class="punto on"></i>Disponible</span></td>
          <td><button type="button" class="boton chico" data-ajuste="sistema">${ico('ajustes', 13)} Ver detalles</button></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Cuadro 2: Motores de IA y Visión -->
  <div class="comp-box" id="box-comp-ia" style="display:none">
    <table class="comp-tabla">
      <thead>
        <tr>
          <th>Modelo / Proveedor</th>
          <th>Capacidad</th>
          <th>Costo y Límites</th>
          <th>Mejor Uso</th>
          <th>Estado Actual</th>
          <th>Configuración</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="comp-serv">
              <span class="ico-wrap" style="background:#eff6ff;color:#073299">${ico('imagen', 16)}</span>
              <div><b>Google Gemini</b><small style="display:block;color:var(--gris)">Flash 2.0 / AI Studio</small></div>
            </div>
          </td>
          <td><b style="color:#073299">Visión Multimodal HD</b> <span class="badge-tag rec">Opción 1</span></td>
          <td>Gratis 1.500 clases/día (AI Studio)</td>
          <td>Lectura de láminas Nano Banana/PDF y efectos de cámara</td>
          <td>${pild(estado.ia.vision)}</td>
          <td><button type="button" class="boton chico" data-ajuste="gemini">${ico('ajustes', 13)} Ver detalles</button></td>
        </tr>
        <tr>
          <td>
            <div class="comp-serv">
              <span class="ico-wrap">${ico('chispas', 16)}</span>
              <div><b>Groq (OpenAI / Qwen)</b><small style="display:block;color:var(--gris)">LPU ultrarrápida</small></div>
            </div>
          </td>
          <td>Redacción de guion instantánea</td>
          <td>100% Gratis con límites por minuto</td>
          <td>Clases rápidas en HTML animadas</td>
          <td>${pild(estado.ia.gratis)}</td>
          <td><button type="button" class="boton chico" data-ajuste="groq">${ico('ajustes', 13)} Ver detalles</button></td>
        </tr>
        <tr>
          <td>
            <div class="comp-serv">
              <span class="ico-wrap">${ico('rayo', 16)}</span>
              <div><b>Anthropic Claude</b><small style="display:block;color:var(--gris)">Opus 5.5 / Sonnet</small></div>
            </div>
          </td>
          <td>Máxima pedagogía y análisis profundo</td>
          <td>Pago por uso (~$0.30 por clase)</td>
          <td>Syllabus complejos y clases magistrales</td>
          <td>${pild(estado.ia.claude)}</td>
          <td><button type="button" class="boton chico" data-ajuste="claude">${ico('ajustes', 13)} Ver detalles</button></td>
        </tr>
        <tr>
          <td>
            <div class="comp-serv">
              <span class="ico-wrap">${ico('candado', 16)}</span>
              <div><b>Ollama (Local)</b><small style="display:block;color:var(--gris)">Modelos en tu Mac</small></div>
            </div>
          </td>
          <td>100% privado y sin internet</td>
          <td>100% Gratis (consume CPU/GPU local)</td>
          <td>Trabajo confidencial desconectado</td>
          <td><span class="badge-tag local">Local</span></td>
          <td><button type="button" class="boton chico" data-ajuste="ollama">${ico('ajustes', 13)} Ver detalles</button></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Servicios Adicionales en Tarjetas Compactas -->
  <div class="ajustes-seccion-tit">
    ${ico('ajustes', 18)} Servicios Adicionales del Estudio <small>· Voz por defecto, almacenamiento y seguridad</small>
  </div>
  <div class="ajustes-cards-grid">
    <div class="ajuste-card-mini">
      <div class="ajuste-card-mini-top">
        <span class="ico-wrap">${ico('volumen', 20)}</span>
        <div>
          <h4>Voz Predeterminada</h4>
          <p>Motor asignado automáticamente a las nuevas clases del estudio.</p>
          <div style="margin-top:8px">
            <span class="pildora ok"><i class="punto on"></i>Activa: <b class="mono" style="margin-left:4px">${esc(a.VOZ || 'auto')}</b></span>
          </div>
        </div>
      </div>
      <div class="ajuste-card-mini-footer">
        <span class="muted" style="font-size:12px">Configurable por clase</span>
        <button type="button" class="boton chico" data-ajuste="voz_defecto">${ico('ajustes', 13)} Ver detalles</button>
      </div>
    </div>

    <div class="ajuste-card-mini">
      <div class="ajuste-card-mini-top">
        <span class="ico-wrap" style="background:#eff6ff;color:#073299">${ico('subir', 20)}</span>
        <div>
          <h4>Google Drive USS</h4>
          <p>Sincronización y respaldo automático en la nube compartida de la universidad.</p>
          <div style="margin-top:8px">
            ${pild(dr.conectado && dr.carpeta, 'Conectado a USS', dr.conectado ? 'Falta carpeta' : 'Sin conectar')}
          </div>
        </div>
      </div>
      <div class="ajuste-card-mini-footer">
        <span class="muted" style="font-size:12px">${dr.conectado ? 'Sincronización activa' : 'Requiere vincular'}</span>
        <button type="button" class="boton chico ${dr.conectado ? '' : 'prim'}" data-ajuste="drive">${ico('subir', 13)} Ver detalles</button>
      </div>
    </div>

    <div class="ajuste-card-mini">
      <div class="ajuste-card-mini-top">
        <span class="ico-wrap">${ico('candado', 20)}</span>
        <div>
          <h4>Seguridad y Clave</h4>
          <p>Control de acceso a la plataforma web para docentes y diseñadores del equipo.</p>
          <div style="margin-top:8px">
            <span class="pildora ok"><i class="punto on"></i>Protegido</span>
          </div>
        </div>
      </div>
      <div class="ajuste-card-mini-footer">
        <span class="muted" style="font-size:12px">Mínimo 6 caracteres</span>
        <button type="button" class="boton chico" data-ajuste="seguridad">${ico('candado', 13)} Ver detalles</button>
      </div>
    </div>
  </div>
  </div>`;

  // Control de pestañas
  const btnVoces = $('#tab-comp-voces');
  const btnIA = $('#tab-comp-ia');
  const boxVoces = $('#box-comp-voces');
  const boxIA = $('#box-comp-ia');
  if (btnVoces && btnIA) {
    btnVoces.onclick = () => {
      btnVoces.classList.add('activo');
      btnIA.classList.remove('activo');
      boxVoces.style.display = '';
      boxIA.style.display = 'none';
    };
    btnIA.onclick = () => {
      btnIA.classList.add('activo');
      btnVoces.classList.remove('activo');
      boxIA.style.display = '';
      boxVoces.style.display = 'none';
    };
  }

  // Modal para cada ajuste
  function abrirModalAjuste(id) {
    const d = document.createElement('dialog');
    d.className = 'modal modal-ajustes';

    let titulo = '';
    let descripcion = '';
    let cuerpoHtml = '';
    let onRender = () => { };

    if (id === 'elevenlabs') {
      titulo = `${ico('ondas', 18)} ElevenLabs · Voz Humana Neural`;
      descripcion = `Voz de máxima naturalidad y realismo. Puedes clonar tu propia voz o usar voces oficiales del catálogo. En el plan gratuito (Free), usa los Voice ID predeterminados: <b>JBFqnCBsd6RMkjVDRZzb</b> (George) o <b>EXAVITQu4vr4xnSDxMaL</b> (Sarah).`;
      cuerpoHtml = `
        ${campo('ELEVENLABS_API_KEY', 'API Key de ElevenLabs', 'elevenlabs.io › Developers › API Keys (permiso: Text-to-Speech).', { secreto: true })}
        ${campo('ELEVENLABS_VOICE_ID', 'Voice ID por defecto', 'Recomendado para cuenta Free: JBFqnCBsd6RMkjVDRZzb (George). En Starter: tu voz clonada.', { mono: true, ph: 'JBFqnCBsd6RMkjVDRZzb' })}
      `;
    } else if (id === 'azure') {
      titulo = `${ico('volumen', 18)} Microsoft Azure Speech`;
      descripcion = `Voces neurales con acento de Perú (<b>es-PE-CamilaNeural</b> y <b>es-PE-AlexNeural</b>). El plan gratuito F0 incluye <b>500.000 caracteres gratis al mes</b> (~240 clases académicas).`;
      cuerpoHtml = `
        ${campo('AZURE_SPEECH_KEY', 'Clave de Azure (Key 1)', 'portal.azure.com › crea recurso «Speech» plan F0 gratis › Keys and Endpoint.', { secreto: true })}
        ${campo('AZURE_SPEECH_REGION', 'Región de Azure', 'En minúsculas: eastus, brazilsouth, westeurope…', { mono: true, ph: 'eastus' })}
        ${campo('AZURE_VOZ', 'Voz por defecto', 'Perú: es-PE-CamilaNeural (mujer) o es-PE-AlexNeural (hombre).', { mono: true, ph: 'es-PE-CamilaNeural' })}
      `;
    } else if (id === 'piper') {
      titulo = `${ico('mic', 18)} Piper · Voz Local Gratis (Offline)`;
      descripcion = `Sintetizador neural que funciona directamente en tu Mac. Sin internet, sin límites de caracteres y sin costo alguno. Ideal para trabajar sin conexión.`;
      cuerpoHtml = `
        <div style="background:#f1f5f9;padding:10px 14px;border-radius:8px;font-size:12.5px;color:#334155;margin-bottom:8px">
          💡 Para instalarla en Mac: ejecuta en la terminal <code>./INSTALAR-VOZ-LOCAL.command</code> en la carpeta del estudio.
        </div>
        ${campo('PIPER_VOZ', 'Modelo de voz de Piper', 'Vacío = es_MX-claude-high. Otras: es_MX-ald-medium, es_AR-daniela-high.', { mono: true, ph: 'es_MX-claude-high' })}
        ${campo('VOZ_LOCAL_URL', 'Servidor alternativo (Docker / OpenAI TTS)', 'Opcional. Ej: http://localhost:8880/v1', { mono: true, ph: 'http://localhost:8880/v1' })}
        ${campo('VOZ_LOCAL_VOZ', 'Voz del servidor alternativo', 'Ej: ef_dora o em_alex.', { mono: true, ph: 'ef_dora' })}
      `;
    } else if (id === 'sistema') {
      titulo = `${ico('texto', 18)} Voz del Sistema (macOS)`;
      descripcion = `Utiliza el motor nativo de síntesis de voz de macOS ('say'). Es 100% gratuita, inmediata y funciona sin conexión. Su pronunciación es sintética estándar, recomendada para pruebas de emergencia o respaldo.`;
      cuerpoHtml = `
        <div style="background:#f8fafc;border:1px solid var(--linea);padding:14px;border-radius:8px;font-size:13px;line-height:1.5">
          <p style="margin:0 0 8px"><b>Estado:</b> Disponible de fábrica en tu Mac (no requiere clave ni instalación).</p>
          <p style="margin:0;color:var(--gris)">Si deseas que sea la voz predeterminada para nuevas clases, selecciónala en la tarjeta <b>«Voz Predeterminada»</b>.</p>
        </div>
      `;
    } else if (id === 'gemini') {
      titulo = `${ico('imagen', 18)} Google Gemini · Visión de Láminas (Opción 1)`;
      descripcion = `Motor multimodal de alta resolución para la <b>Opción 1 (Láminas con imágenes)</b>. Analiza las diapositivas generadas con Nano Banana, capturas de PowerPoint o Canva, y redacta la narración docente sincronizada.`;
      cuerpoHtml = `
        ${campo('IA_VISION_URL', 'Dirección del endpoint API', 'Gemini: https://generativelanguage.googleapis.com/v1beta/openai · Groq: https://api.groq.com/openai/v1', { mono: true, ph: 'https://generativelanguage.googleapis.com/v1beta/openai' })}
        ${campo('IA_VISION_KEY', 'API Key de Gemini (Google AI Studio)', 'aistudio.google.com › Get API Key (gratis hasta 1.500 clases diarias con cuenta Google).', { secreto: true })}
        ${campo('IA_VISION_MODELO', 'Modelo Multimodal', 'Gemini: gemini-2.0-flash o gemini-1.5-flash · Groq: qwen/qwen3.8-27b', { mono: true, ph: estado.ia.modeloVision || 'gemini-2.0-flash' })}
      `;
    } else if (id === 'groq') {
      titulo = `${ico('chispas', 18)} Groq · IA Ultrarrápida (Texto y Guion)`;
      descripcion = `Acelerador LPU que redacta guiones docentes y genera diapositivas interactivas en HTML en 2 a 3 segundos a costo cero.`;
      cuerpoHtml = `
        ${campo('IA_GRATIS_URL', 'Dirección de la API', 'Groq: https://api.groq.com/openai/v1 · Ollama: http://localhost:11434/v1', { mono: true, ph: 'https://api.groq.com/openai/v1' })}
        ${campo('IA_GRATIS_KEY', 'API Key de Groq', 'console.groq.com › API Keys (gratis).', { secreto: true })}
        ${campo('IA_GRATIS_MODELO', 'Modelo de Lenguaje', 'Recomendado: openai/gpt-oss-120b o qwen/qwen3.8-27b', { mono: true, ph: 'openai/gpt-oss-120b' })}
      `;
    } else if (id === 'claude') {
      titulo = `${ico('rayo', 18)} Anthropic Claude`;
      descripcion = `Modelo de lenguaje con máxima calidad y pedagogía universitaria. Ideal para asignaturas complejas, análisis profundo y explicaciones estructuradas.`;
      cuerpoHtml = `
        ${campo('ANTHROPIC_API_KEY', 'API Key de Anthropic', 'platform.claude.com › API Keys.', { secreto: true })}
        ${campo('CLAUDE_MODELO', 'Modelo de Claude', 'Vacío = claude-opus-5-5 (máxima calidad). Otras opciones: claude-3-5-sonnet-20241022.', { mono: true, ph: 'claude-opus-5-5' })}
      `;
    } else if (id === 'ollama') {
      titulo = `${ico('candado', 18)} Ollama (Modelos Locales en Mac)`;
      descripcion = `Ejecuta modelos LLM abiertos (Llama 3, Mistral, Qwen) 100% de manera local y privada en tu Mac, sin consumir datos en la nube.`;
      cuerpoHtml = `
        <div style="background:#f1f5f9;padding:10px 14px;border-radius:8px;font-size:12.5px;color:#334155;margin-bottom:8px">
          💡 Requiere tener instalada la aplicación <b>Ollama</b> (<a href="https://ollama.com" target="_blank" rel="noopener">ollama.com</a>) en tu Mac.
        </div>
        ${campo('IA_GRATIS_URL', 'Dirección del servidor local de Ollama', 'Por defecto: http://localhost:11434/v1', { mono: true, ph: 'http://localhost:11434/v1' })}
        ${campo('IA_GRATIS_MODELO', 'Nombre del modelo en Ollama', 'Ej: llama3.2, qwen2.5, mistral', { mono: true, ph: 'llama3.2' })}
      `;
    } else if (id === 'voz_defecto') {
      titulo = `${ico('volumen', 18)} Voz Predeterminada de las Clases`;
      descripcion = `Elige el motor de voz con el que se generarán por defecto los videos de las nuevas clases creadas en el estudio.`;
      cuerpoHtml = `
        <label for="modal-VOZ">Voz por defecto para nuevas clases</label>
        <select id="modal-VOZ" name="VOZ" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--linea);font-size:14px;background:var(--panel);color:var(--tinta)">
          <option value="auto">Automática (Grabación › ElevenLabs › Azure › Local › Sistema)</option>
          <option value="elevenlabs">ElevenLabs (Voz humana clonada o George / Sarah)</option>
          <option value="azure">Azure Speech (Voces peruanas Camila / Alex)</option>
          <option value="local">Voz local gratis (Piper offline en tu Mac)</option>
          <option value="sistema">Voz del sistema (macOS)</option>
        </select>
      `;
      onRender = () => {
        const sel = $('#modal-VOZ', d);
        if (sel) sel.value = a.VOZ || 'auto';
      };
    } else if (id === 'drive') {
      titulo = `${ico('subir', 18)} Google Drive USS · Almacenamiento`;
      descripcion = `Sube y organiza automáticamente los videos finales (.mp4) y las láminas interactivas (.html) directamente en la carpeta institucional compartida de Google Drive.`;
      cuerpoHtml = `
        ${campo('DRIVE_CARPETA_ID', 'Enlace de la carpeta compartida en Drive', 'Pega el enlace de la carpeta compartida de Google Drive (debes ser Editor).', { mono: true, ph: 'https://drive.google.com/drive/folders/…' })}
        ${campo('DRIVE_CARPETA', 'Subcarpeta interna', 'Vacío = «Videos de clases IA».', { ph: 'Videos de clases IA' })}
        
        <details class="plegable" ${dr.cliente ? '' : 'open'} style="margin-top:12px">
          <summary>${ico('candado')} 1 · Credenciales OAuth (Google Cloud) ${dr.cliente ? '<span class="muted">· guardado</span>' : ''} ${ico('abajo')}</summary>
          <div style="padding-top:10px">
            <p class="ayuda" style="margin:0 0 8px">console.cloud.google.com › Activa Google Drive API › Credenciales › ID OAuth tipo «App de escritorio» › Descargar JSON y pega su contenido aquí:</p>
            <textarea id="modal-drive-json" rows="4" class="mono" spellcheck="false" placeholder='{"installed":{"client_id":"…","client_secret":"…"}}' style="width:100%"></textarea>
            <div class="acciones" style="margin-top:8px">
              <button type="button" class="boton chico" id="b-modal-drive-json">${ico('guardar', 14)} Guardar cliente OAuth</button>
            </div>
          </div>
        </details>

        <div class="acciones" style="margin-top:14px;display:flex;align-items:center;gap:10px">
          <button type="button" class="boton chico ${dr.conectado ? '' : 'prim'}" id="b-modal-drive-conectar" ${dr.cliente && dr.local && dr.modo === 'api' ? '' : 'disabled'}>
            ${ico('flecha', 14)} ${dr.conectado ? '2 · Volver a conectar' : '2 · Conectar Google Drive'}
          </button>
          ${dr.local ? '' : '<span class="ayuda">Se conecta desde la PC del estudio (http://localhost).</span>'}
        </div>
      `;
      onRender = () => {
        const bJson = $('#b-modal-drive-json', d);
        if (bJson) {
          bJson.onclick = async () => {
            try {
              await api('/api/drive/cliente', { method: 'POST', body: JSON.stringify({ json: $('#modal-drive-json', d).value }) });
              aviso('Cliente de Google guardado correctamente. Ahora pulsa «Conectar Google Drive».');
              await recargar();
              d.close();
            } catch (err) { aviso(err.message, true); }
          };
        }
        const bCon = $('#b-modal-drive-conectar', d);
        if (bCon) {
          bCon.onclick = async () => {
            try {
              await api('/api/drive/conectar', { method: 'POST' });
              aviso('Se abrió el navegador de esta PC: inicia sesión con la cuenta de Google autorizada.');
              const fin = Date.now() + 5 * 60 * 1000;
              const mirar = async () => {
                const s = await api('/api/estado').catch(() => null);
                if (!s) return;
                if (s.drive.conectando && Date.now() < fin) return setTimeout(mirar, 3000);
                estado = s;
                aviso(s.drive.conectado ? 'Google Drive conectado correctamente' : 'No se completó la conexión', !s.drive.conectado);
                await recargar();
                d.close();
              };
              setTimeout(mirar, 3000);
            } catch (err) { aviso(err.message, true); }
          };
        }
      };
    } else if (id === 'seguridad') {
      titulo = `${ico('candado', 18)} Seguridad y Clave del Estudio`;
      descripcion = `Configura la clave de acceso web para el equipo docente y de diseño multimedia.`;
      cuerpoHtml = `
        ${campo('WEB_CLAVE', 'Nueva clave del equipo', 'Déjala vacía para conservar la actual. Mínimo 6 caracteres.', { secreto: true })}
      `;
    }

    const esSoloInformativo = id === 'sistema';

    d.innerHTML = `
      <div class="modal-cab">
        <h3>${titulo}</h3>
        <button type="button" class="icono-boton modal-cerrar-x" aria-label="Cerrar">${ico('x', 18)}</button>
      </div>
      <form id="f-modal-ajuste">
        <div class="modal-desc-box">${descripcion}</div>
        ${cuerpoHtml}
        <div class="modal-pie">
          <button type="button" class="boton modal-cancelar">Cerrar</button>
          ${esSoloInformativo ? '' : `<button type="submit" class="boton prim">${ico('guardar', 14)} Guardar ajustes</button>`}
        </div>
      </form>
    `;

    document.body.append(d);
    d.addEventListener('close', () => d.remove());
    $('.modal-cerrar-x', d).onclick = () => d.close();
    $('.modal-cancelar', d).onclick = () => d.close();

    onRender();

    const fm = $('#f-modal-ajuste', d);
    if (fm && !esSoloInformativo) {
      fm.onsubmit = async (e) => {
        e.preventDefault();
        try {
          const datos = Object.fromEntries(new FormData(e.target));
          await api('/api/ajustes', { method: 'POST', body: JSON.stringify(datos) });
          aviso('Ajustes guardados correctamente');
          d.close();
          await recargar();
        } catch (err) {
          aviso(err.message, true);
        }
      };
    }

    d.showModal();
  }

  // Asignar clicks a todos los botones "Ver detalles"
  app.querySelectorAll('[data-ajuste]').forEach(btn => {
    btn.onclick = () => abrirModalAjuste(btn.dataset.ajuste);
  });
}

ir();
