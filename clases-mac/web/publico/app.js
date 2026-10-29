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

const TIPOS = [['', '— Sigue la diapositiva anterior —'], ['portada', 'Portada'], ['idea', 'Idea clave'], ['lista', 'Lista'],
  ['pasos', 'Pasos numerados'], ['codigo', 'Código'], ['comparacion', 'Comparación'], ['tarjetas', 'Tarjetas'], ['dato', 'Dato grande'], ['cierre', 'Cierre y reto']];
const TRABAJOS = {
  voz: { nombre: 'Vista previa con voz', icono: 'volumen', desc: 'Escucha la clase en el navegador', dura: '≈ 1 min' },
  capturas: { nombre: 'Revisar diapositivas', icono: 'imagen', desc: 'Fotos de cada diapositiva', dura: '≈ 1 min' },
  borrador: { nombre: 'Borrador rápido', icono: 'ojo', desc: 'Video liviano para ver el ritmo', dura: '2–3 min' },
  video: { nombre: 'Video final', icono: 'pelicula', desc: 'MP4 en alta calidad, 1920 × 1080', dura: '5–8 min' },
};
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
  $('#servicios').innerHTML = [['IA gratis', estado.ia.gratis], ['Claude', estado.ia.claude], ['ElevenLabs', estado.voz.elevenlabs]]
    .map(([n, ok]) => `<li><a href="#/ajustes"><i class="punto ${ok ? 'on' : ''}"></i>${n}<span>${ok ? 'Configurado' : 'Sin configurar'}</span></a></li>`).join('');
  $('#salir').innerHTML = `${ico('salir', 18)}<span>Salir</span>`;
}
$('#salir').onclick = async () => { await api('/api/salir', { method: 'POST' }).catch(() => {}); mostrarLogin(); };

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
    <div class="rejilla" id="lista">${'<div class="esqueleto"></div>'.repeat(3)}</div></div>`;
  const clases = (await api('/api/clases')).sort((a, b) => (b.editada || 0) - (a.editada || 0));
  const minutos = clases.reduce((t, c) => t + (c.duracion || c.palabras / 2.4), 0);
  $('#cifras').innerHTML = [
    ['clases', clases.length, clases.length === 1 ? 'clase creada' : 'clases creadas'],
    ['pelicula', clases.filter(c => c.video).length, 'con video final'],
    ['reloj', mmss(minutos), 'minutos de contenido'],
  ].map(([i, n, t]) => `<div class="cifra"><span class="ico-caja">${ico(i, 20)}</span><div><b>${n}</b><span>${t}</span></div></div>`).join('');
  const pintar = filtro => {
    const f = filtro.trim().toLowerCase();
    const vis = clases.filter(c => !f || `${c.tema} ${c.curso}`.toLowerCase().includes(f));
    if (!clases.length) {
      $('#lista').innerHTML = `<div class="vacio" style="grid-column:1/-1"><span class="icono-grande">${ico('pelicula', 26)}</span>
        <h3>Aún no hay clases</h3><p>Escribe un tema y la IA prepara el guion y las diapositivas. Después lo revisas y creas el video.</p>
        <a class="boton prim" href="#/nueva">${ico('mas')}Crear la primera clase</a></div>`;
      return;
    }
    $('#lista').innerHTML = vis.map(c => {
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
  const modos = [
    ['manual', 'texto', 'Pego mi guion', 'Escribes o pegas el texto y eliges las diapositivas.', 'Gratis', true],
    ['gratis', 'chispas', 'IA gratis', estado.ia.gratis ? 'Un modelo abierto escribe guion y diapositivas.' : 'Necesita una API key gratuita.', 'Gratis', estado.ia.gratis],
    ['claude', 'rayo', 'Claude', estado.ia.claude ? 'La mejor calidad de redacción y exactitud.' : 'Necesita una API key de Claude.', 'De pago', estado.ia.claude],
  ];
  const elegido = estado.ia.gratis ? 'gratis' : 'manual';
  const seg = (nombre, valores, def) => `<div class="segmentado" role="radiogroup">${valores.map(v => `<label><input type="radio" name="${nombre}" value="${v}" ${v === def ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div>`;
  app.innerHTML = `<div class="vista">
  <header class="cabecera"><div><nav class="migas"><a href="#/">Clases</a>${ico('der', 14)}<span>Nueva clase</span></nav>
    <h1>Nueva clase</h1><p class="muted">Completa lo esencial. Podrás corregir todo antes de crear el video.</p></div></header>
  <form id="f-nueva" class="nueva" novalidate>
    <fieldset id="fs-nueva">
      <section class="panel">
        <div class="panel-cab"><span class="paso">1</span><div><h2>¿Quién escribe el guion?</h2><p class="muted">Siempre podrás editarlo después.</p></div></div>
        <div class="modos">${modos.map(([v, i, t, d, insignia, ok]) => `
          <label class="modo ${ok ? '' : 'apagado'}">
            <input type="radio" name="modo" value="${v}" ${v === elegido ? 'checked' : ''} ${ok ? '' : 'disabled'}>
            <span class="modo-cab"><span class="modo-ico">${ico(i, 18)}</span><span class="pildora ${insignia === 'Gratis' ? 'lima' : ''}">${insignia}</span></span>
            <span><b>${t}</b><small>${d}</small></span>
            ${ok ? '' : '<a href="#/ajustes">Configurar en Ajustes →</a>'}
          </label>`).join('')}</div>
      </section>
      <section class="panel">
        <div class="panel-cab"><span class="paso">2</span><div><h2>La clase</h2><p class="muted">Con IA basta con el tema.</p></div></div>
        <label for="n-tema">Tema <span class="req">obligatorio</span></label>
        <input type="text" id="n-tema" name="tema" class="grande" required placeholder="Ej.: Flexbox: alinear y distribuir elementos" autocomplete="off">
        <div class="campos2" style="margin-top:4px">
          <div><span class="etiqueta">Nivel</span>${seg('nivel', ['Básico', 'Intermedio', 'Avanzado'], 'Básico')}</div>
          <div><span class="etiqueta">Duración</span>${seg('duracion', ['2:00', '2:30', '3:00'], '2:30')}</div>
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
          <summary>${ico('bot')}Curso y avatar <span class="muted" id="resumen-avatar"></span>${ico('abajo')}</summary>
          <div>
            <div class="campos2">
              <div><label for="n-cur">Curso</label><input type="text" id="n-cur" name="curso" value="Diseño Web"></div>
              <div><label for="n-doc">Docente que revisa</label><input type="text" id="n-doc" name="docente" placeholder="Opcional"></div>
              <div><label for="n-ava">Nombre del avatar</label><input type="text" id="n-ava" name="avatar" value="SIPANCITOBOT"></div>
              <div><label for="n-rol">Rol del avatar</label><input type="text" id="n-rol" name="rol_avatar" value="Asistente docente IA"></div>
            </div>
          </div>
        </details>
      </section>
      <section class="panel">
        <div class="panel-cab"><span class="paso">3</span><div><h2 id="t-guion">Guion</h2><p class="muted" id="d-guion"></p></div></div>
        <textarea name="guion" rows="12" aria-labelledby="t-guion" placeholder="¡Hola! Soy SIPANCITOBOT y hoy vamos a…&#10;&#10;Segundo bloque…&#10;&#10;Tercer bloque…"></textarea>
        <div class="medidor"><div class="medidor-barra"><i id="medidor"></i></div><span id="cuenta-guion"></span></div>
      </section>
    </fieldset>
    <aside class="nueva-lado"><div class="panel" id="lado-nueva"></div></aside>
  </form></div>`;
  const f = $('#f-nueva');
  // el resumen se dibuja una sola vez y luego solo cambian sus textos (si se redibujara el boton,
  // el clic en «Crear» se perderia al salir del guion, porque el cambio redibuja antes del clic)
  const lado = () => {
    $('#lado-nueva').innerHTML = `<h3>Resumen</h3>
      <dl class="resumen-lista">
        <div><dt>Guion</dt><dd id="r-modo"></dd></div>
        <div><dt>Duración</dt><dd id="r-dur"></dd></div>
        <div><dt>Palabras sugeridas</dt><dd id="r-pal"></dd></div>
        <div><dt>Tiempo de creación</dt><dd id="r-tiempo"></dd></div>
      </dl>
      <button class="boton prim ancho grande" id="b-crear"></button>
      <div class="nota-lima">${ico('info')}<span id="r-nota"></span></div>`;
  };
  const resumen = () => {
    const modo = f.modo.value;
    const dur = f.duracion.value;
    const manual = modo === 'manual';
    $('#r-modo').textContent = manual ? 'Tu texto' : modo === 'gratis' ? 'IA gratis' : 'Claude';
    $('#r-dur').textContent = `${dur} min`;
    $('#r-pal').textContent = `≈ ${OBJETIVO_PALABRAS[dur]}`;
    $('#r-tiempo').textContent = manual ? 'Al instante' : '1 a 3 min';
    const etiqueta = manual ? 'Crear clase' : 'Crear clase con IA';
    if ($('#b-crear').dataset.etiqueta !== etiqueta) {
      $('#b-crear').dataset.etiqueta = etiqueta;
      $('#b-crear').innerHTML = `${ico(manual ? 'check' : 'chispas')}${etiqueta}`;
    }
    $('#r-nota').textContent = manual
      ? 'Separa los bloques con una línea en blanco. Luego eliges una diapositiva para cada bloque.'
      : 'La IA escribe el guion y las diapositivas. Después revisas el texto antes de crear el video.';
  };
  const actualizar = () => {
    const modo = f.modo.value;
    const obj = OBJETIVO_PALABRAS[f.duracion.value];
    $('#t-guion').textContent = modo === 'manual' ? 'Guion' : 'Guion · opcional';
    $('#d-guion').textContent = modo === 'manual'
      ? 'Un párrafo por bloque, separados por una línea en blanco.'
      : 'Si ya tienes tu guion, pégalo: la IA solo hará las diapositivas.';
    $('#guiar-ia').classList.toggle('oculto', modo === 'manual');
    $('#resumen-avatar').textContent = `· ${f.curso.value || 'Sin curso'} · ${f.avatar.value || 'SIPANCITOBOT'}`;
    const n = palabras(f.guion.value);
    const m = $('#medidor');
    m.style.width = `${Math.min(100, (n / obj) * 100)}%`;
    m.className = n > obj * 1.15 ? 'largo' : n >= obj * 0.85 ? 'bien' : '';
    $('#cuenta-guion').textContent = n ? `${n} / ${obj} palabras · ≈ ${mmss(n / 2.4)}` : `Sugerido: ≈ ${obj} palabras`;
    resumen();
  };
  f.addEventListener('input', actualizar);
  f.addEventListener('change', actualizar);
  lado();
  actualizar();
  f.onsubmit = async e => {
    e.preventDefault();
    const ficha = Object.fromEntries(new FormData(f));
    const { modo, guion } = ficha;
    delete ficha.modo; delete ficha.guion;
    if (!String(ficha.tema || '').trim()) { aviso('Escribe el tema de la clase', true); $('#n-tema').focus(); return; }
    if (modo === 'manual' && !palabras(guion)) { aviso('Pega el guion: un párrafo por bloque', true); f.guion.focus(); return; }
    $('#fs-nueva').disabled = true;
    const inicio = Date.now();
    $('#lado-nueva').innerHTML = modo === 'manual' ? '<div class="generando"><div class="orbita"></div><h3>Creando la clase…</h3></div>'
      : `<div class="generando"><div class="orbita"></div><h3>La IA está escribiendo tu clase</h3>
        <p>Trabaja por partes y completa lo que falte. Suele tardar de 1 a 3 minutos.</p>
        <div class="cronometro" id="crono">0:00</div>
        <ol class="pasos-ia"><li><b>1</b>Guion, agenda y pronunciación</li><li><b>2</b>Una diapositiva por bloque</li><li><b>3</b>Se abre el editor para que revises</li></ol>
        <p class="ayuda" style="margin-top:14px">No cierres esta pestaña.</p></div>`;
    const reloj = setInterval(() => { const c = $('#crono'); if (c) c.textContent = mmss((Date.now() - inicio) / 1000); else clearInterval(reloj); }, 500);
    try {
      const r = await api('/api/clases', { method: 'POST', body: JSON.stringify({ ficha, modo, guion }) });
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
  prepararItems();
  pintarEditor();
  actualizarTrabajos();
}

function prepararItems() {
  const c = editor.clase;
  const diapos = c.diapositivas || [];
  editor.plantillas = diapos.length > 0 || !editor.codigo;
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
    e.innerHTML = `<span>${ico('capas', 14)}${editor.items.length} bloques</span><span>${ico('texto', 14)}${n} palabras</span>
      <span class="${Math.abs(seg - obj) / obj > 0.15 ? 'fuera' : ''}">${ico('reloj', 14)}≈ ${mmss(seg)} <small>/ objetivo ${mmss(obj)}</small></span>`;
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
      <nav class="pestanas" role="tablist">
        <button data-p="guion" role="tab">${ico('capas')}<span>Guion y diapositivas</span><span class="cuenta">${editor.items.length}</span></button>
        <button data-p="agenda" role="tab">${ico('lista')}<span>Agenda y pronunciación</span></button>
        <button data-p="voz" role="tab">${ico('mic')}<span>Voz y avatar</span></button>
        <button data-p="datos" role="tab">${ico('texto')}<span>Datos</span></button>
      </nav>
      <div id="contenido"></div>
    </div>
    <aside class="ed-lado">
      <section class="panel">
        <div class="panel-cab" style="margin-bottom:14px"><div><h2>Producción</h2><p class="muted">Los videos se crean en la PC del estudio, de uno en uno.</p></div></div>
        <div class="prod-acciones">
          ${['voz', 'capturas', 'borrador'].map(m => `<button class="prod-accion" id="b-${m === 'voz' ? 'vista' : m}">
            <span class="modo-ico">${ico(TRABAJOS[m].icono, 17)}</span><span><b>${TRABAJOS[m].nombre}</b><small>${TRABAJOS[m].desc}</small></span><span class="pildora">${TRABAJOS[m].dura}</span></button>`).join('')}
        </div>
        <div class="trabajos" id="trabajos"></div>
        <div class="resultado" id="resultado"></div>
      </section>
      <section class="panel ficha-lado">
        <h3 style="margin-bottom:6px">Ficha</h3>
        <dl>
          <div><dt>Curso</dt><dd>${esc(c.curso || '—')}</dd></div>
          <div><dt>Nivel</dt><dd>${esc(c.nivel || '—')}</dd></div>
          <div><dt>Avatar</dt><dd>${esc(c.avatar || '—')}</dd></div>
          <div><dt>Voz</dt><dd id="ficha-voz"></dd></div>
        </dl>
      </section>
    </aside>
  </div>`;
  $$('.pestanas button').forEach(b => { b.onclick = () => { editor.pestana = b.dataset.p; pintarPestana(); }; });
  $('#b-guardar').onclick = () => guardar().catch(e => aviso(e.message, true));
  $('#b-vista').onclick = () => lanzar('voz');
  $('#b-capturas').onclick = () => lanzar('capturas');
  $('#b-borrador').onclick = () => lanzar('borrador');
  $('#b-video').onclick = () => lanzar('video');
  pintarPestana();
  pintarResultado();
  estimar();
  fichaVoz();
}

function fichaVoz() {
  const p = (editor.clase.voz && editor.clase.voz.proveedor) || 'auto';
  const el = $('#ficha-voz');
  if (el) el.textContent = { auto: 'Automática', elevenlabs: 'ElevenLabs', grabacion: 'Tu grabación', sistema: 'Del sistema' }[p] || p;
}

function pintarPestana() {
  $$('.pestanas button').forEach(b => { const a = b.dataset.p === editor.pestana; b.classList.toggle('activa', a); b.setAttribute('aria-selected', a); });
  const c = $('#contenido');
  if (editor.pestana === 'voz') return pintarVoz(c);
  if (editor.pestana === 'datos') return pintarDatos(c);
  if (editor.pestana === 'agenda') return pintarAgendaPron(c);
  return pintarGuion(c);
}

// ----- pestaña: guion y diapositivas
function pintarGuion(cont) {
  const fijo = !editor.plantillas;
  cont.innerHTML = `
    ${fijo ? `<div class="aviso-caja">${ico('info')}<span>Esta clase usa <b>diapositivas programadas</b> (código). Puedes corregir lo que dice la voz, pero no agregar ni quitar bloques.</span></div>` : `
    <div class="barra-ia">
      <span class="ico-caja">${ico('chispas', 18)}</span>
      <div><b>Diapositivas con IA</b><span>Respeta tu guion y propone diapositivas, agenda y pronunciación.</span></div>
      <button class="boton chico" id="ia-gratis" ${estado.ia.gratis ? '' : 'disabled'}>IA gratis</button>
      <button class="boton chico" id="ia-claude" ${estado.ia.claude ? '' : 'disabled'}>Claude</button>
    </div>`}
    <div id="bloques" class="bloques"></div>
    ${fijo ? '' : `<button class="agregar" id="mas-bloque">${ico('mas')}Agregar bloque</button>`}`;
  pintarBloques();
  if (!fijo) {
    $('#mas-bloque').onclick = () => {
      editor.items.push({ id: `n${Date.now()}`, texto: '', diapo: { tipo: 'idea', kicker: '', titulo: '', sub: '' } });
      sucio();
      pintarBloques();
      const ultimo = $$('#bloques .bloque').pop();
      ultimo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      $('textarea', ultimo).focus();
    };
    $('#ia-gratis').onclick = () => rehacerConIa('gratis');
    $('#ia-claude').onclick = () => rehacerConIa('claude');
  }
}

// segundo en que empieza y termina cada bloque (2,4 palabras por segundo + pausa)
function tiempos() {
  let t = 0;
  return editor.items.map(it => { const ini = t; t += palabras(it.texto) / 2.4 + 0.45; return [ini, t - 0.45]; });
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
          ${fijo ? '' : `<div class="vista-tit"><span>Así se verá</span><span>${esc(nombreTipo(it.diapo))}</span></div><div data-vista>${miniDiapo(it.diapo)}</div>`}
        </div>
        ${fijo ? '' : edDiapo(it.diapo, i)}
      </div>
    </article>`).join('');
  requestAnimationFrame(() => $$('#bloques textarea').forEach(crecer));
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
    if (ed) {
      visibles(ed);
      ed.oninput = ed.onchange = () => {
        if (!ed.isConnected) return; // evento de un campo que se acaba de redibujar
        editor.items[i].diapo = leerDiapo(ed);
        visibles(ed);
        $$('textarea', ed).forEach(crecer);
        $('[data-vista]', el).innerHTML = miniDiapo(editor.items[i].diapo);
        $('.vista-tit span:last-child', el).textContent = nombreTipo(editor.items[i].diapo);
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

// Vista aproximada de la diapositiva (mismo diseño que el video)
function miniDiapo(d) {
  if (!d || !d.tipo) return `<div class="md md-vacia"><span>${ico('capas')}Continúa la diapositiva anterior</span></div>`;
  const banda = esc(editor.clase.banda || editor.clase.curso || '');
  const k = d.kicker ? `<span class="md-k">${esc(d.kicker)}</span>` : '';
  const t = d.titulo ? `<b class="md-t">${acento(d.titulo)}</b>` : '<b class="md-t md-falta">Título de la diapositiva</b>';
  const s = d.sub ? `<span class="md-s">${acento(d.sub)}</span>` : '';
  const items = (d.items || []).filter(x => x && x.texto);
  const lado = (x, oscura) => `<span class="${oscura ? 'oscura' : ''}"><small>${esc((x && x.etiqueta) || '')}</small><b>${acento((x && x.titulo) || '')}</b>${acento((x && x.texto) || '')}</span>`;
  let cuerpo;
  switch (d.tipo) {
    case 'portada': cuerpo = `${k}${t}${s}${items.length ? `<span class="md-chips">${items.map(x => `<i>${esc(x.texto)}</i>`).join('')}</span>` : ''}`; break;
    case 'lista': case 'pasos': case 'cierre':
      cuerpo = `${k}${t}${s}<span class="md-items ${d.tipo === 'pasos' ? 'num' : ''}">${items.map((x, j) => `<span><i>${d.tipo === 'pasos' ? j + 1 : ''}</i>${acento(x.texto)}</span>`).join('')}</span>
        ${d.tipo === 'cierre' && d.despedida ? `<span class="md-desp">${esc(d.despedida)}</span>` : ''}`; break;
    case 'codigo': cuerpo = `<span class="md-dos"><span>${k}${t}${s}</span><code class="md-code">${esc(d.codigo || '')}</code></span>`; break;
    case 'comparacion': cuerpo = `${k}${t}${s}<span class="md-comp">${lado(d.izq)}${lado(d.der, true)}</span>`; break;
    case 'tarjetas': {
      const ts = (d.tarjetas || []).filter(x => x && (x.titulo || x.texto)).slice(0, 4);
      cuerpo = `${k}${t}${s}<span class="md-tarj t${Math.max(2, ts.length)}">${ts.map((x, j) => lado({ etiqueta: dos(j + 1), titulo: x.titulo, texto: x.texto }, j === ts.length - 1 && ts.length > 1)).join('')}</span>`; break;
    }
    case 'dato': cuerpo = `${k}<b class="md-dato-n">${acento(d.dato || '—')}</b>${t}${s}`; break;
    default: cuerpo = `${k}${t}${s}`;
  }
  return `<div class="md md-${d.tipo}"><div class="md-area">${cuerpo}</div><div class="md-banda"><b>USS</b><span>${banda}</span></div></div>`;
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

function edDiapo(d, i) {
  d = d || {};
  const lineas = (arr, f) => (arr || []).map(f).join('\n');
  const campo = (tipos, html) => `<div data-tipos="${tipos}">${html}</div>`;
  const inp = (k, v, ph = '') => `<input type="text" id="${k}-${i}" data-k="${k}" value="${esc(v)}" placeholder="${esc(ph)}">`;
  const lbl = (k, texto, ayuda = '') => `<label for="${k}-${i}">${texto}${ayuda ? ` <span class="ayuda">${ayuda}</span>` : ''}</label>`;
  return `<div class="diapo-ed">
    ${lbl('tipo', 'Diapositiva')}
    <select id="tipo-${i}" data-k="tipo">${TIPOS.map(([v, n]) => `<option value="${v}" ${v === (d.tipo || '') ? 'selected' : ''}>${n}</option>`).join('')}</select>
    ${campo('portada idea lista pasos codigo comparacion tarjetas dato cierre', `${lbl('kicker', 'Etiqueta superior')}${inp('kicker', d.kicker, 'Ej.: Paso 1 · El DNS')}`)}
    ${campo('portada idea lista pasos codigo comparacion tarjetas dato cierre', `${lbl('titulo', 'Título', 'máx. 7 palabras · *clave* en morado')}${inp('titulo', d.titulo, 'Ej.: Semántica = *significado*')}`)}
    ${campo('portada idea lista pasos codigo comparacion tarjetas dato', `${lbl('sub', 'Subtítulo')}${inp('sub', d.sub)}`)}
    ${campo('dato', `${lbl('dato', 'Dato grande')}${inp('dato', d.dato, 'Ej.: 404')}`)}
    ${campo('portada', `${lbl('chips', 'Etiquetas', 'una por línea')}<textarea id="chips-${i}" data-k="chips" rows="3">${esc(lineas(d.items, x => x.texto))}</textarea>`)}
    ${campo('lista pasos cierre', `${lbl('items', 'Puntos', 'uno por línea · «texto | palabra que dice la voz»')}
      <textarea id="items-${i}" data-k="items" rows="4">${esc(lineas(d.items, x => x.cuando ? `${x.texto} | ${x.cuando}` : x.texto))}</textarea>`)}
    ${campo('codigo', `${lbl('codigo', 'Código', 'máx. 14 líneas')}<textarea id="codigo-${i}" class="mono" data-k="codigo" rows="7" spellcheck="false">${esc(d.codigo)}</textarea>`)}
    ${campo('comparacion', `<div class="campos2"><div>${lbl('izq_etiqueta', 'Izquierda · etiqueta')}${inp('izq_etiqueta', d.izq && d.izq.etiqueta, 'SIN')}
      ${lbl('izq_titulo', 'Izquierda · título')}${inp('izq_titulo', d.izq && d.izq.titulo)}${lbl('izq_texto', 'Izquierda · texto')}${inp('izq_texto', d.izq && d.izq.texto)}</div>
      <div>${lbl('der_etiqueta', 'Derecha · etiqueta')}${inp('der_etiqueta', d.der && d.der.etiqueta, 'CON')}${lbl('der_titulo', 'Derecha · título')}${inp('der_titulo', d.der && d.der.titulo)}
      ${lbl('der_texto', 'Derecha · texto')}${inp('der_texto', d.der && d.der.texto)}</div></div>`)}
    ${campo('tarjetas', `${lbl('tarjetas', 'Tarjetas', 'una por línea: «título | texto | palabra»')}
      <textarea id="tarjetas-${i}" data-k="tarjetas" rows="4">${esc(lineas(d.tarjetas, x => [x.titulo, x.texto, x.cuando].filter(Boolean).join(' | ')))}</textarea>`)}
    ${campo('cierre', `${lbl('despedida', 'Despedida')}${inp('despedida', d.despedida, '¡Nos vemos en la próxima clase!')}`)}
    ${campo('idea lista pasos codigo comparacion tarjetas dato cierre', `${lbl('nota', 'Nota al pie', 'opcional')}${inp('nota', d.nota)}`)}
  </div>`;
}

function visibles(ed) {
  const tipo = $('[data-k=tipo]', ed).value;
  $$('[data-tipos]', ed).forEach(x => x.classList.toggle('oculto', !tipo || !x.dataset.tipos.split(' ').includes(tipo)));
}

function leerDiapo(ed) {
  const v = k => { const el = $(`[data-k=${k}]`, ed); return el ? el.value.trim() : ''; };
  const tipo = v('tipo');
  if (!tipo) return null;
  const partes = l => l.split('|').map(x => x.trim());
  const filas = k => v(k).split('\n').map(x => x.trim()).filter(Boolean);
  const d = { tipo, kicker: v('kicker'), titulo: v('titulo'), sub: v('sub'), nota: v('nota'), dato: v('dato'), despedida: v('despedida'), codigo: $('[data-k=codigo]', ed).value };
  d.items = tipo === 'portada' ? filas('chips').map(texto => ({ texto, cuando: '' })) : filas('items').map(l => { const [texto, cuando = ''] = partes(l); return { texto, cuando }; });
  d.tarjetas = filas('tarjetas').map(l => { const [titulo, texto = '', cuando = ''] = partes(l); return { titulo, texto, cuando }; });
  d.izq = { etiqueta: v('izq_etiqueta'), titulo: v('izq_titulo'), texto: v('izq_texto'), cuando: '' };
  d.der = { etiqueta: v('der_etiqueta'), titulo: v('der_titulo'), texto: v('der_texto'), cuando: '' };
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
  if (!await confirmar({ titulo: 'Rehacer las diapositivas con IA', texto: 'La IA reemplaza las diapositivas, la agenda y la pronunciación. Tu guion no cambia.', boton: 'Rehacer diapositivas' })) return;
  try { await guardar(true); } catch (e) { aviso(e.message, true); return; }
  const b = $(`#ia-${modo}`);
  b.disabled = true;
  b.innerHTML = '<span class="anillo-carga" style="width:14px;height:14px;border-width:2px"></span>Trabajando…';
  try {
    const r = await api(`/api/clases/${editor.slug}/ia`, { method: 'POST', body: JSON.stringify({ modo }) });
    editor.clase = r.clase;
    prepararItems();
    editor.sucio = false;
    pintarPestana();
    estimar();
    aviso(r.aviso || 'Diapositivas nuevas listas: revísalas', !!r.aviso);
  } catch (e) { aviso(e.message, true); pintarPestana(); }
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
      ${opcion('auto', 'rayo', 'Automática', 'Tu grabación si existe; si no, ElevenLabs; si no, la del sistema.')}
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
  const campos = [['tema', 'Tema'], ['curso', 'Curso'], ['banda', 'Texto de la franja verde'], ['nivel', 'Nivel'],
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
      r.innerHTML = `<h4>Video final</h4><video class="reproductor" controls preload="metadata" src="/api/clases/${slug}/video?ver=1&t=${res.video.fecha}"></video>
        <div class="acciones"><a class="boton lima ancho" href="/api/clases/${slug}/video">${ico('descargar')}Descargar MP4 · ${MB(res.video.tam)}</a></div>
        <p class="ayuda" style="margin-top:8px;text-align:center">Creado ${hace(res.video.fecha)}</p>`;
    }
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
  const pild = ok => `<span class="pildora ${ok ? 'ok' : ''}"><i class="punto ${ok ? 'on' : ''}"></i>${ok ? 'Configurado' : 'Sin configurar'}</span>`;
  app.innerHTML = `<div class="vista">
  <header class="cabecera"><div><h1>Ajustes</h1><p class="muted">Se guardan solo en la PC del estudio (archivo .env). Las claves nunca se muestran completas.</p></div></header>
  <form id="f-aj" class="ajustes" autocomplete="off">
    <section class="ajuste">
      <div class="ajuste-info"><h2>${ico('ondas', 18)}Voz · ElevenLabs</h2><p>Voz natural para el avatar: tu voz clonada o una voz de la biblioteca.</p>${pild(estado.voz.elevenlabs)}</div>
      <div class="panel">
        ${campo('ELEVENLABS_API_KEY', 'API key', 'elevenlabs.io › Developers › API Keys (permiso: Text to Speech).', { secreto: true })}
        ${campo('ELEVENLABS_VOICE_ID', 'Voice ID por defecto', 'Tu voz clonada o una voz «Default» (en el plan Free solo funcionan las Default).', { mono: true })}
        <label for="aj-VOZ">Voz por defecto de las clases</label>
        <select id="aj-VOZ" name="VOZ"><option value="auto">Automática (grabación → ElevenLabs → sistema)</option><option value="elevenlabs">ElevenLabs</option><option value="sistema">Voz del sistema</option></select>
      </div>
    </section>
    <section class="ajuste">
      <div class="ajuste-info"><h2>${ico('chispas', 18)}IA gratis</h2><p>Un modelo abierto escribe guion y diapositivas. Groq (gratis con cuenta) u Ollama en esta PC.</p>${pild(estado.ia.gratis)}</div>
      <div class="panel">
        ${campo('IA_GRATIS_URL', 'Dirección', 'Groq: https://api.groq.com/openai/v1 · Ollama: http://localhost:11434/v1', { mono: true, ph: 'https://api.groq.com/openai/v1' })}
        ${campo('IA_GRATIS_KEY', 'API key', 'Groq: console.groq.com › API Keys (gratis). Ollama no necesita.', { secreto: true })}
        ${campo('IA_GRATIS_MODELO', 'Modelo', 'Groq: openai/gpt-oss-120b o qwen/qwen3.8-27b · Ollama: qwen2.5:7b', { mono: true, ph: 'openai/gpt-oss-120b' })}
      </div>
    </section>
    <section class="ajuste">
      <div class="ajuste-info"><h2>${ico('rayo', 18)}Claude</h2><p>La mejor calidad de redacción. Se paga por uso: unos centavos de dólar por clase.</p>${pild(estado.ia.claude)}</div>
      <div class="panel">
        ${campo('ANTHROPIC_API_KEY', 'API key de Claude', 'platform.claude.com › API Keys. Recarga prepagada.', { secreto: true })}
        ${campo('CLAUDE_MODELO', 'Modelo', 'Vacío = claude-opus-5-5 (recomendado).', { mono: true, ph: 'claude-opus-5-5' })}
      </div>
    </section>
    <section class="ajuste">
      <div class="ajuste-info"><h2>${ico('candado', 18)}Acceso a la web</h2><p>Una sola clave para todo el equipo. Quien la tenga también puede cambiar estos ajustes.</p></div>
      <div class="panel">${campo('WEB_CLAVE', 'Nueva clave del equipo', 'Déjala vacía para no cambiarla. Mínimo 6 caracteres.', { secreto: true })}</div>
    </section>
    <div class="barra-guardar"><span class="muted">Los cambios se aplican al guardar.</span><button class="boton prim">${ico('guardar')}Guardar ajustes</button></div>
  </form></div>`;
  $('#f-aj').VOZ.value = a.VOZ || 'auto';
  $('#f-aj').onsubmit = async e => {
    e.preventDefault();
    try {
      await api('/api/ajustes', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
      aviso('Ajustes guardados');
      estado = await api('/api/estado');
      await vistaAjustes();
      pintarLateral('/ajustes');
    } catch (err) { aviso(err.message, true); }
  };
}

ir();
