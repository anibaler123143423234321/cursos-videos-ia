// Estudio de clases USS: interfaz web (sin frameworks).
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const app = $('#app');
let estado = null;   // lo que esta configurado (IA, voz, logo)
let editor = null;   // clase abierta
let sondeo = null;

const TIPOS = [['', '— sigue la diapositiva anterior —'], ['portada', 'Portada'], ['idea', 'Idea clave'], ['lista', 'Lista'],
  ['pasos', 'Pasos numerados'], ['codigo', 'Código'], ['comparacion', 'Comparación'], ['tarjetas', 'Tarjetas'], ['dato', 'Dato grande'], ['cierre', 'Cierre y reto']];
const MODO_TRABAJO = { video: 'Video final', borrador: 'Borrador rápido', voz: 'Vista previa (voz)', capturas: 'Revisión de diapositivas' };

// ---------------------------------------------------------------- utilidades
async function api(ruta, opciones = {}) {
  const r = await fetch(ruta, { ...opciones, headers: opciones.body ? { 'Content-Type': 'application/json' } : {} });
  if (r.status === 401 && ruta !== '/api/login') { mostrarLogin(); throw new Error('Inicia sesión'); }
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || `Error ${r.status}`);
  return datos;
}
let avisoT;
function aviso(msg, error = false) {
  const a = $('#aviso');
  a.textContent = msg;
  a.className = error ? 'error' : '';
  a.hidden = false;
  clearTimeout(avisoT);
  avisoT = setTimeout(() => { a.hidden = true; }, error ? 7000 : 3000);
}
const palabras = t => String(t || '').split(/\s+/).filter(Boolean).length;

// ---------------------------------------------------------------- navegacion
async function ir() {
  if (editor && editor.sucio) { try { await guardar(true); } catch { /* se avisa al guardar */ } }
  clearTimeout(sondeo);
  const h = location.hash.replace(/^#/, '') || '/';
  try { estado = await api('/api/estado'); } catch { return; }
  $('#barra').hidden = false;
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
$('#salir').onclick = async () => { await api('/api/salir', { method: 'POST' }).catch(() => {}); mostrarLogin(); };

function mostrarLogin() {
  editor = null;
  clearTimeout(sondeo);
  $('#barra').hidden = true;
  app.innerHTML = `<form class="login tarjeta" id="f-login">
    <div class="marca"><b>USS</b><span>Estudio de clases</span></div>
    <p class="gris">Escribe la clave del equipo.</p>
    <input type="password" id="clave" placeholder="Clave" autocomplete="current-password" autofocus>
    <button class="boton prim" style="width:100%;margin-top:10px;justify-content:center">Entrar</button></form>`;
  $('#f-login').onsubmit = async e => {
    e.preventDefault();
    try { await api('/api/login', { method: 'POST', body: JSON.stringify({ clave: $('#clave').value }) }); ir(); } catch (err) { aviso(err.message, true); }
  };
}

// ---------------------------------------------------------------- lista de clases
async function vistaLista() {
  editor = null;
  app.innerHTML = `<div class="encabezado"><div><h1>Clases</h1><p class="gris">Videos de 2 a 3 minutos con el avatar, la voz y las diapositivas animadas.</p></div>
    <a class="boton verde" href="#/nueva">＋ Nueva clase</a></div><div class="rejilla" id="lista"><p class="esperando">Cargando clases…</p></div>`;
  const clases = await api('/api/clases');
  $('#lista').innerHTML = clases.length ? clases.map(c => `
    <div class="tarjeta clase">
      <h3>${esc(c.tema)}</h3>
      <p class="gris pequeno">${esc(c.curso)} · ${c.bloques} bloques · ${c.duracion ? mmss(c.duracion) : `~${mmss(c.palabras / 2.4)}`}</p>
      <p>${c.video ? '<span class="etiq ok">Video listo</span>' : '<span class="etiq">Sin video</span>'}
         <span class="etiq mor">${c.diapositivas === 'codigo' ? 'Diapositivas programadas' : 'Plantillas'}</span></p>
      <div class="botones"><a class="boton prim" href="#/clase/${c.slug}">Abrir</a>
        ${c.video ? `<a class="boton" href="/api/clases/${c.slug}/video">⬇ Descargar MP4</a>` : ''}</div>
    </div>`).join('') : '<p class="gris">Aún no hay clases. <a href="#/nueva">Crea la primera</a>.</p>';
}

// ---------------------------------------------------------------- nueva clase
function vistaNueva() {
  editor = null;
  const modos = [
    ['manual', 'Pego mi guion', 'Gratis. Escribes o pegas el texto (un párrafo por bloque) y eliges las diapositivas.', true],
    ['gratis', 'IA gratis', estado.ia.gratis ? 'Un modelo abierto (Groq u Ollama) escribe guion y diapositivas.' : 'Configúrala en Ajustes.', estado.ia.gratis],
    ['claude', 'Claude (de pago)', estado.ia.claude ? 'La mejor calidad. Unos centavos de dólar por clase.' : 'Pon tu API key en Ajustes.', estado.ia.claude],
  ];
  app.innerHTML = `<div class="encabezado"><div><a href="#/" class="pequeno">← Clases</a><h1>Nueva clase</h1>
    <p class="gris">Llena la ficha. Después podrás corregir todo antes de crear el video.</p></div></div>
  <form id="f-nueva" class="tarjeta">
    <h3>¿Quién escribe el guion?</h3>
    <div class="modos">${modos.map(([v, t, d, ok], i) => `<label class="modo ${i === 0 ? 'activo' : ''} ${ok ? '' : 'apagado'}">
      <input type="radio" name="modo" value="${v}" ${i === 0 ? 'checked' : ''} ${ok ? '' : 'disabled'}><b>${t}</b><span class="pequeno gris">${d}</span></label>`).join('')}</div>
    <h2>Ficha de la clase</h2>
    <div class="campos2">
      <div><label>Tema *</label><input type="text" name="tema" required placeholder="Ej.: Flexbox: alinear y distribuir"></div>
      <div><label>Curso</label><input type="text" name="curso" value="Diseño Web"></div>
    </div>
    <div class="campos3">
      <div><label>Nivel</label><select name="nivel"><option>Básico</option><option>Intermedio</option><option>Avanzado</option></select></div>
      <div><label>Duración</label><select name="duracion"><option>2:00</option><option selected>2:30</option><option>3:00</option></select></div>
      <div><label>Docente que revisa</label><input type="text" name="docente" placeholder="Opcional"></div>
    </div>
    <div class="campos2">
      <div><label>Nombre del avatar</label><input type="text" name="avatar" value="SIPANCITOBOT"></div>
      <div><label>Rol del avatar</label><input type="text" name="rol_avatar" value="Asistente docente IA"></div>
    </div>
    <div id="campos-ia">
      <p class="ayuda" id="ayuda-ia" style="margin-top:14px">Con IA basta con el <b>tema</b>: si dejas vacío lo de abajo, la IA lo decide. Llénalo solo si quieres guiarla.</p>
      <label>Objetivo de aprendizaje</label><input type="text" name="objetivo" placeholder="Al terminar, el estudiante...">
      <label>Puntos que debe cubrir</label><textarea name="puntos" rows="2"></textarea>
      <div class="campos2"><div><label>Ejemplo o código a mostrar</label><input type="text" name="ejemplo"></div>
        <div><label>Reto o tarea final</label><input type="text" name="reto"></div></div>
    </div>
    <label id="lbl-guion">Guion <span class="ayuda">(un párrafo por bloque, separados por una línea en blanco; unas 340 palabras para 2:30)</span></label>
    <textarea name="guion" rows="12" placeholder="¡Hola! Soy SIPANCITOBOT y hoy...\n\nSegundo bloque...\n\nTercer bloque..."></textarea>
    <p class="ayuda" id="cuenta-guion"></p>
    <div class="botones" style="margin-top:16px"><button class="boton verde" id="b-crear">Crear clase</button><span id="esperando-ia"></span></div>
  </form>`;
  const f = $('#f-nueva');
  const actualizar = () => {
    const modo = f.modo.value;
    $$('.modo', f).forEach(m => m.classList.toggle('activo', m.querySelector('input').checked));
    $('#lbl-guion').firstChild.textContent = modo === 'manual' ? 'Guion ' : 'Guion (opcional: si ya lo tienes, la IA solo hace las diapositivas) ';
    $('#ayuda-ia').classList.toggle('oculto', modo === 'manual');
    const n = palabras(f.guion.value);
    $('#cuenta-guion').textContent = n ? `${n} palabras · unos ${mmss(n / 2.4)} de video` : '';
  };
  f.addEventListener('input', actualizar);
  f.addEventListener('change', actualizar);
  actualizar();
  f.onsubmit = async e => {
    e.preventDefault();
    const ficha = Object.fromEntries(new FormData(f));
    const { modo, guion } = ficha;
    delete ficha.modo; delete ficha.guion;
    $('#b-crear').disabled = true;
    $('#esperando-ia').innerHTML = `<span class="esperando">${modo === 'manual' ? 'Creando…' : 'La IA está escribiendo la clase por partes: guion y luego diapositivas (1 a 3 minutos)…'}</span>`;
    try {
      const r = await api('/api/clases', { method: 'POST', body: JSON.stringify({ ficha, modo, guion }) });
      location.hash = `#/clase/${r.slug}`;
      if (r.aviso) setTimeout(() => aviso(r.aviso, true), 800);
    } catch (err) {
      aviso(err.message, true);
      $('#b-crear').disabled = false;
      $('#esperando-ia').textContent = '';
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
  const e = $('#estimado');
  if (e) e.textContent = `${editor.items.length} bloques · ${n} palabras · unos ${mmss(n / 2.4)} de video${editor.sucio ? ' · cambios sin guardar' : ''}`;
}

function pintarEditor() {
  app.innerHTML = `
  <div class="encabezado">
    <div><a href="#/" class="pequeno">← Clases</a><h1>${esc(editor.clase.tema)}</h1><p class="gris pequeno" id="estimado"></p></div>
    <div class="botones">
      <button class="boton" id="b-guardar">Guardar</button>
      <button class="boton" id="b-vista">▶ Vista previa</button>
      <button class="boton" id="b-capturas">Revisar diapositivas</button>
      <button class="boton" id="b-borrador">Borrador rápido</button>
      <button class="boton verde" id="b-video">Crear video final</button>
    </div>
  </div>
  <div class="tarjeta"><div id="trabajos"><p class="gris pequeno">Guarda tus cambios y usa los botones de arriba. El video se crea en la PC del estudio (5 a 8 minutos).</p></div><div id="resultado"></div></div>
  <div class="pestanas">
    <button data-p="guion">Guion y diapositivas</button><button data-p="voz">Voz y avatar</button><button data-p="datos">Datos de la clase</button>
  </div>
  <div id="contenido"></div>`;
  $$('.pestanas button').forEach(b => { b.onclick = () => { editor.pestana = b.dataset.p; pintarPestana(); }; });
  $('#b-guardar').onclick = () => guardar().catch(e => aviso(e.message, true));
  $('#b-vista').onclick = () => lanzar('voz');
  $('#b-capturas').onclick = () => lanzar('capturas');
  $('#b-borrador').onclick = () => lanzar('borrador');
  $('#b-video').onclick = () => lanzar('video');
  pintarPestana();
  pintarResultado();
  estimar();
}

function pintarPestana() {
  $$('.pestanas button').forEach(b => b.classList.toggle('activa', b.dataset.p === editor.pestana));
  const c = $('#contenido');
  if (editor.pestana === 'voz') return pintarVoz(c);
  if (editor.pestana === 'datos') return pintarDatos(c);
  return pintarGuion(c);
}

// ----- pestaña: guion y diapositivas
function pintarGuion(cont) {
  const fijo = !editor.plantillas;
  cont.innerHTML = `
    ${fijo ? '<p class="tarjeta pequeno">Esta clase usa <b>diapositivas programadas</b> (código). Puedes corregir el texto de la voz, pero no agregar ni quitar bloques.</p>' : `
    <div class="botones" style="margin-bottom:14px">
      <button class="boton" id="ia-gratis" ${estado.ia.gratis ? '' : 'disabled'}>✨ Diapositivas con IA gratis</button>
      <button class="boton" id="ia-claude" ${estado.ia.claude ? '' : 'disabled'}>✨ Diapositivas con Claude</button>
      <span class="ayuda">La IA respeta tu guion y propone diapositivas, agenda y pronunciación.</span>
    </div>`}
    <div id="bloques"></div>
    ${fijo ? '' : '<button class="boton" id="mas-bloque">＋ Agregar bloque</button>'}
    <h2>Agenda <span class="ayuda">(columna derecha del video)</span></h2><div id="agenda"></div><button class="boton mini" id="mas-agenda">＋ Punto</button>
    <h2>Pronunciación <span class="ayuda">(cómo debe leer la voz siglas o palabras en inglés; no cambia lo que se ve)</span></h2>
    <div id="pron"></div><button class="boton mini" id="mas-pron">＋ Palabra</button>`;
  pintarBloques();
  pintarAgenda();
  pintarPron();
  if (!fijo) {
    $('#mas-bloque').onclick = () => { editor.items.push({ id: `n${Date.now()}`, texto: '', diapo: { tipo: 'idea', kicker: '', titulo: '', sub: '' } }); sucio(); pintarBloques(); pintarAgenda(); };
    $('#ia-gratis').onclick = () => rehacerConIa('gratis');
    $('#ia-claude').onclick = () => rehacerConIa('claude');
  }
  $('#mas-agenda').onclick = () => { editor.agenda.push({ titulo: '', desde: editor.items[0] && editor.items[0].id }); sucio(); pintarAgenda(); };
  $('#mas-pron').onclick = () => { editor.pron.push({ escrito: '', dice: '' }); sucio(); pintarPron(); };
}

function pintarBloques() {
  const fijo = !editor.plantillas;
  $('#bloques').innerHTML = editor.items.map((it, i) => `
    <div class="tarjeta bloque" data-i="${i}">
      <div class="cab"><span><span class="num">${String(i + 1).padStart(2, '0')}</span></span>
        ${fijo ? '' : `<span class="botones"><button class="boton mini" data-acc="subir" ${i ? '' : 'disabled'}>↑</button>
          <button class="boton mini" data-acc="bajar" ${i < editor.items.length - 1 ? '' : 'disabled'}>↓</button>
          <button class="boton mini peligro" data-acc="quitar">Quitar</button></span>`}</div>
      <div><label>Lo que dice la voz</label><textarea data-k="texto" rows="6">${esc(it.texto)}</textarea><p class="contador"></p></div>
      ${fijo ? '' : edDiapo(it.diapo, i)}
    </div>`).join('');
  $$('#bloques .bloque').forEach(el => {
    const i = +el.dataset.i;
    const contar = () => {
      const n = palabras(editor.items[i].texto);
      const p = $('.contador', el);
      p.textContent = `${n} palabras · ${Math.round(n / 2.4)} s${n > 60 ? ' · muy largo: divídelo en dos bloques' : ''}`;
      p.classList.toggle('mal', n > 60 || n === 0);
    };
    contar();
    $('[data-k=texto]', el).oninput = e => { editor.items[i].texto = e.target.value; contar(); sucio(); };
    $$('[data-acc]', el).forEach(b => { b.onclick = () => moverBloque(i, b.dataset.acc); });
    const ed = $('.diapo-ed', el);
    if (ed) {
      visibles(ed);
      ed.oninput = ed.onchange = () => { editor.items[i].diapo = leerDiapo(ed); visibles(ed); sucio(); };
    }
  });
}

function moverBloque(i, acc) {
  const it = editor.items;
  if (acc === 'quitar') {
    if (!confirm('¿Quitar este bloque?')) return;
    it.splice(i, 1);
  } else {
    const j = acc === 'subir' ? i - 1 : i + 1;
    [it[i], it[j]] = [it[j], it[i]];
  }
  sucio();
  pintarBloques();
  pintarAgenda();
}

function edDiapo(d, i) {
  d = d || {};
  const lineas = (arr, f) => (arr || []).map(f).join('\n');
  const campo = (tipos, html) => `<div data-tipos="${tipos}">${html}</div>`;
  const inp = (k, v, ph = '') => `<input type="text" data-k="${k}" value="${esc(v)}" placeholder="${esc(ph)}">`;
  return `<div class="diapo-ed">
    <label>Diapositiva</label>
    <select data-k="tipo">${TIPOS.map(([v, n]) => `<option value="${v}" ${v === (d.tipo || '') ? 'selected' : ''}>${n}</option>`).join('')}</select>
    ${campo('portada idea lista pasos codigo comparacion tarjetas dato cierre', `<label>Etiqueta superior</label>${inp('kicker', d.kicker, 'Ej.: Paso 1 · El DNS')}`)}
    ${campo('portada idea lista pasos codigo comparacion tarjetas dato cierre', `<label>Título <span class="ayuda">máx. 7 palabras · la palabra clave entre *asteriscos*</span></label>${inp('titulo', d.titulo, 'Ej.: Semántica = *significado*')}`)}
    ${campo('portada idea lista pasos codigo comparacion tarjetas dato', `<label>Subtítulo</label>${inp('sub', d.sub)}`)}
    ${campo('dato', `<label>Dato grande</label>${inp('dato', d.dato, 'Ej.: 404')}`)}
    ${campo('portada', `<label>Etiquetas <span class="ayuda">una por línea</span></label><textarea data-k="chips" rows="3">${esc(lineas(d.items, x => x.texto))}</textarea>`)}
    ${campo('lista pasos cierre', `<label>Puntos <span class="ayuda">uno por línea · opcional: «texto | palabra que dice la voz»</span></label>
      <textarea data-k="items" rows="4">${esc(lineas(d.items, x => x.cuando ? `${x.texto} | ${x.cuando}` : x.texto))}</textarea>`)}
    ${campo('codigo', `<label>Código <span class="ayuda">máx. 14 líneas</span></label><textarea class="mono" data-k="codigo" rows="7">${esc(d.codigo)}</textarea>`)}
    ${campo('comparacion', `<div class="campos2"><div><label>Izquierda: etiqueta</label>${inp('izq_etiqueta', d.izq && d.izq.etiqueta, 'SIN')}
      <label>Izquierda: título</label>${inp('izq_titulo', d.izq && d.izq.titulo)}<label>Izquierda: texto</label>${inp('izq_texto', d.izq && d.izq.texto)}</div>
      <div><label>Derecha: etiqueta</label>${inp('der_etiqueta', d.der && d.der.etiqueta, 'CON')}<label>Derecha: título</label>${inp('der_titulo', d.der && d.der.titulo)}
      <label>Derecha: texto</label>${inp('der_texto', d.der && d.der.texto)}</div></div>`)}
    ${campo('tarjetas', `<label>Tarjetas <span class="ayuda">una por línea: «título | texto | palabra que dice la voz»</span></label>
      <textarea data-k="tarjetas" rows="4">${esc(lineas(d.tarjetas, x => [x.titulo, x.texto, x.cuando].filter(Boolean).join(' | ')))}</textarea>`)}
    ${campo('cierre', `<label>Despedida</label>${inp('despedida', d.despedida, '¡Nos vemos en la próxima clase!')}`)}
    ${campo('idea lista pasos codigo comparacion tarjetas dato cierre', `<label>Nota al pie <span class="ayuda">opcional</span></label>${inp('nota', d.nota)}`)}
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

function opcionesBloques(sel) {
  return editor.items.map((it, i) => `<option value="${esc(it.id)}" ${it.id === sel ? 'selected' : ''}>${String(i + 1).padStart(2, '0')} · ${esc(it.texto.split(/\s+/).slice(0, 6).join(' '))}…</option>`).join('');
}
function pintarAgenda() {
  $('#agenda').innerHTML = editor.agenda.map((a, i) => `<div class="fila" data-i="${i}">
    <input type="text" data-k="titulo" value="${esc(a.titulo)}" placeholder="Título corto (máx. 24 letras)">
    <select data-k="desde">${opcionesBloques(a.desde)}</select><button class="boton mini peligro" data-acc="x">✕</button></div>`).join('') || '<p class="ayuda">Sin agenda: la columna derecha queda vacía.</p>';
  $$('#agenda .fila').forEach(f => {
    const a = editor.agenda[+f.dataset.i];
    f.oninput = f.onchange = () => { a.titulo = $('[data-k=titulo]', f).value; a.desde = $('[data-k=desde]', f).value; sucio(); };
    $('[data-acc]', f).onclick = () => { editor.agenda.splice(+f.dataset.i, 1); sucio(); pintarAgenda(); };
  });
}
function pintarPron() {
  $('#pron').innerHTML = editor.pron.map((p, i) => `<div class="fila" data-i="${i}">
    <input type="text" data-k="escrito" value="${esc(p.escrito)}" placeholder="Se escribe (ej.: CSS)">
    <input type="text" data-k="dice" value="${esc(p.dice)}" placeholder="Se dice (ej.: ce ese ese)"><button class="boton mini peligro" data-acc="x">✕</button></div>`).join('');
  $$('#pron .fila').forEach(f => {
    const p = editor.pron[+f.dataset.i];
    f.oninput = () => { p.escrito = $('[data-k=escrito]', f).value; p.dice = $('[data-k=dice]', f).value; sucio(); };
    $('[data-acc]', f).onclick = () => { editor.pron.splice(+f.dataset.i, 1); sucio(); pintarPron(); };
  });
}

async function rehacerConIa(modo) {
  if (!confirm('La IA reemplazará las diapositivas, la agenda y la pronunciación (tu guion no cambia). ¿Continuar?')) return;
  await guardar(true);
  const b = $(`#ia-${modo}`);
  b.disabled = true;
  b.textContent = 'La IA está trabajando…';
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
  const nombre = n => arch.find(a => a.nombre.replace(/\.[^.]+$/, '') === n);
  const fila = (n, titulo) => { const a = nombre(n); return a ? `<div class="archivo"><span>✔ ${esc(titulo)}: <b>${esc(a.nombre)}</b> (${(a.tam / 1048576).toFixed(1)} MB)</span><button class="boton mini peligro" data-borrar="${esc(a.nombre)}">Quitar</button></div>` : ''; };
  cont.innerHTML = `
  <div class="tarjeta">
    <h3>¿Con qué voz habla el avatar?</h3>
    <select id="v-prov">
      <option value="auto">Automático: tu grabación si la subiste → ElevenLabs → voz del sistema</option>
      <option value="elevenlabs">ElevenLabs (voz clonada o elegida)${estado.voz.elevenlabs ? '' : ' — configúrala en Ajustes'}</option>
      <option value="grabacion">Solo tu grabación</option>
      <option value="sistema">Voz del sistema (gratis, suena sintética)</option>
    </select>
    <label>Voice ID de ElevenLabs para esta clase <span class="ayuda">opcional: si lo dejas vacío usa el de Ajustes</span></label>
    <input type="text" id="v-id" value="${esc(v.elevenlabs_voz)}" placeholder="Ej.: JBFqnCBsd6RMkjVDRZzb">
  </div>
  <h2>Grabar tu propia voz <span class="ayuda">(no clona: tu grabación es la narración del video)</span></h2>
  <div class="tarjeta">
    <p class="pequeno">Lee el guion de corrido y <b>calla 2 segundos entre bloque y bloque</b>. El estudio corta la grabación sola.</p>
    <div class="botones"><button class="boton" id="b-guion">⬇ Descargar guion para grabar</button></div>
    ${fila('voz/completa', 'Grabación completa')}
    <label>Subir grabación completa (m4a, mp3, wav…)</label><input type="file" id="up-completa" accept="audio/*,video/mp4">
    <label>Corregir un solo bloque</label>
    <div class="campos2"><select id="up-bloque-id">${editor.items.map((it, i) => `<option value="${String(i + 1).padStart(2, '0')}">Bloque ${String(i + 1).padStart(2, '0')}</option>`).join('')}</select>
      <input type="file" id="up-bloque" accept="audio/*"></div>
    ${arch.filter(a => /^voz\/\d{2}\./.test(a.nombre)).map(a => fila(a.nombre.replace(/\.[^.]+$/, ''), `Bloque ${a.nombre.slice(4, 6)}`)).join('')}
  </div>
  <h2>Imagen del recuadro de cámara</h2>
  <div class="tarjeta">
    <p class="pequeno">Por defecto aparece el robot animado. Puedes reemplazarlo:</p>
    ${fila('camara', 'Tu video de cámara')}
    <label>Tu video de cámara leyendo el guion <span class="ayuda">(tu cara + tu voz; con pausas de 2 s entre bloques)</span></label><input type="file" id="up-camara" accept="video/*">
    ${fila('avatar', 'Avatar de HeyGen/Hedra')}
    <label>Video de avatar hecho en HeyGen o Hedra con el audio de esta clase</label><input type="file" id="up-avatar" accept="video/*">
  </div>
  <p id="subiendo" class="esperando oculto"></p>`;
  $('#v-prov').value = v.proveedor || 'auto';
  const guardarVoz = () => { editor.clase.voz = { proveedor: $('#v-prov').value, elevenlabs_voz: $('#v-id').value.trim() }; sucio(); };
  $('#v-prov').onchange = guardarVoz;
  $('#v-id').oninput = guardarVoz;
  $('#b-guion').onclick = descargarGuion;
  const ext = f => (f.name.split('.').pop() || 'm4a').toLowerCase();
  $('#up-completa').onchange = e => subir(e.target.files[0], f => `voz/completa.${ext(f)}`);
  $('#up-bloque').onchange = e => subir(e.target.files[0], f => `voz/${$('#up-bloque-id').value}.${ext(f)}`);
  $('#up-camara').onchange = e => subir(e.target.files[0], f => `camara.${ext(f)}`);
  $('#up-avatar').onchange = e => subir(e.target.files[0], f => `avatar.${ext(f)}`);
  $$('[data-borrar]', cont).forEach(b => {
    b.onclick = async () => {
      if (!confirm(`¿Quitar ${b.dataset.borrar}?`)) return;
      await api(`/api/clases/${editor.slug}/archivo?nombre=${encodeURIComponent(b.dataset.borrar)}`, { method: 'DELETE' });
      await recargarArchivos();
    };
  });
}

function subir(archivo, nombreDe) {
  if (!archivo) return;
  const nombre = nombreDe(archivo);
  const p = $('#subiendo');
  p.classList.remove('oculto');
  const x = new XMLHttpRequest();
  x.open('PUT', `/api/clases/${editor.slug}/archivo?nombre=${encodeURIComponent(nombre)}`);
  x.upload.onprogress = e => { if (e.lengthComputable) p.textContent = `Subiendo ${archivo.name}: ${Math.round((e.loaded / e.total) * 100)}%`; };
  x.onload = async () => {
    p.classList.add('oculto');
    if (x.status >= 200 && x.status < 300) { aviso('Archivo subido'); await recargarArchivos(); } else aviso(`No se pudo subir: ${x.responseText}`, true);
  };
  x.onerror = () => { p.classList.add('oculto'); aviso('Se cortó la subida', true); };
  x.send(archivo);
}
async function recargarArchivos() {
  const d = await api(`/api/clases/${editor.slug}`);
  editor.archivos = d.archivos;
  if (editor.pestana === 'voz') pintarVoz($('#contenido'));
}

function descargarGuion() {
  const lineas = [`GUION PARA GRABAR - ${editor.clase.tema}`, '', 'Lee de corrido. CALLA 2 SEGUNDOS entre bloque y bloque.', 'Lugar silencioso, micrófono a un palmo, voz de clase normal.', ''];
  editor.items.forEach((it, i) => { lineas.push(`[BLOQUE ${String(i + 1).padStart(2, '0')}]`, it.texto, '', '   . . . pausa de 2 segundos . . .', ''); });
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
  cont.innerHTML = `<div class="tarjeta"><div class="campos2">${campos.map(([k, n]) => `<div><label>${n}</label><input type="text" data-k="${k}" value="${esc(c[k])}"></div>`).join('')}</div>
    <p class="ayuda">El nombre del avatar aparece en el recuadro de cámara; el docente, abajo a la derecha del video.</p>
    <h2>Zona de peligro</h2><button class="boton peligro" id="b-borrar">Mover la clase a la papelera</button></div>`;
  $$('[data-k]', cont).forEach(i => { i.oninput = () => { c[i.dataset.k] = i.value; sucio(); }; });
  $('#b-borrar').onclick = async () => {
    if (!confirm('¿Mover esta clase a la papelera? (se guarda en la carpeta papelera del estudio)')) return;
    await api(`/api/clases/${editor.slug}`, { method: 'DELETE' });
    editor = null;
    location.hash = '#/';
  };
}

// ----- guardar y trabajos
async function guardar(silencioso = false) {
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
    aviso('Guardado');
  }
  estimar();
}

async function lanzar(modo) {
  try {
    if (editor.sucio) await guardar(true);
    if (modo === 'voz') editor.esperoVista = true;
    await api(`/api/clases/${editor.slug}/trabajo`, { method: 'POST', body: JSON.stringify({ modo }) });
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
  if (!mios.length && !otros) return;
  $('#trabajos').innerHTML = (otros ? `<p class="ayuda">Hay ${otros} trabajo(s) de otras clases en la cola: el tuyo empieza cuando terminen.</p>` : '') + mios.map(t => `
    <div class="trabajo ${t.estado}">
      <b style="min-width:170px">${MODO_TRABAJO[t.modo]}</b>
      <div class="barra-p"><i style="width:${t.progreso}%"></i></div>
      <span class="estado-t">${t.estado === 'en-cola' ? 'En cola' : esc(t.mensaje)}</span>
    </div>${t.estado === 'error' ? `<details class="log" open><summary>Detalle del error</summary><pre>${esc(t.log.join('\n'))}</pre></details>` : ''}`).join('');
  // cuando algo termina, mostrar el resultado
  for (const t of mios) {
    if (t.estado === 'listo' && ultimoEstado[t.id] && ultimoEstado[t.id] !== 'listo') {
      if (t.modo === 'voz' && editor.esperoVista) { editor.esperoVista = false; editor.mostrar = 'vista'; }
      if (t.modo === 'capturas') editor.mostrar = 'capturas';
      if (t.modo === 'video' || t.modo === 'borrador') editor.mostrar = t.modo;
      pintarResultado();
    }
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
    r.innerHTML = `<p style="margin-top:12px"><a class="boton verde" href="${urlVista}" target="_blank">▶ Abrir vista previa con sonido</a>
      <span class="ayuda">Se abre en otra pestaña con la voz recién generada.</span></p>`;
  } else if (editor.mostrar === 'capturas') {
    const imgs = await api(`/api/clases/${slug}/capturas`);
    r.innerHTML = `<h3 style="margin-top:14px">Diapositivas a mitad y al final de cada bloque</h3><div class="galeria">${imgs.map(u => `<a href="${u}" target="_blank"><img src="${u}" loading="lazy"></a>`).join('')}</div>`;
  } else {
    const d = await api(`/api/clases/${slug}`).catch(() => null);
    const res = d && d.resumen;
    if (editor.mostrar === 'borrador') {
      r.innerHTML = `<video class="reproductor" controls src="/api/clases/${slug}/video?borrador=1&ver=1&t=${Date.now()}"></video>
        <p class="botones"><a class="boton" href="/api/clases/${slug}/video?borrador=1">⬇ Descargar borrador</a></p>`;
    } else if (res && res.video) {
      r.innerHTML = `<video class="reproductor" controls src="/api/clases/${slug}/video?ver=1&t=${res.video.fecha}"></video>
        <p class="botones"><a class="boton verde" href="/api/clases/${slug}/video">⬇ Descargar video (${(res.video.tam / 1048576).toFixed(1)} MB)</a>
        <span class="ayuda">Creado el ${new Date(res.video.fecha).toLocaleString()}</span></p>`;
    }
  }
}

// ---------------------------------------------------------------- ajustes
async function vistaAjustes() {
  editor = null;
  const a = await api('/api/ajustes');
  const campo = (k, nombre, ayuda = '', tipo = 'text') => `<label>${nombre}</label><input type="${tipo}" name="${k}" value="${esc(a[k])}" autocomplete="off">${ayuda ? `<p class="ayuda">${ayuda}</p>` : ''}`;
  app.innerHTML = `<div class="encabezado"><div><h1>Ajustes</h1><p class="gris">Se guardan en el archivo .env de la PC del estudio. Las claves no se muestran completas.</p></div></div>
  <form id="f-aj">
    <div class="tarjeta"><h3>Voz: ElevenLabs</h3>
      ${campo('ELEVENLABS_API_KEY', 'API key', 'elevenlabs.io > Developers > API Keys (permiso: Text to Speech).')}
      ${campo('ELEVENLABS_VOICE_ID', 'Voice ID por defecto', 'Tu voz clonada o una voz «Default» (en el plan Free solo funcionan las Default).')}
      <label>Voz por defecto de las clases</label><select name="VOZ">
        <option value="auto">Automático (grabación → ElevenLabs → sistema)</option><option value="elevenlabs">ElevenLabs</option><option value="sistema">Voz del sistema</option></select>
    </div>
    <h2>IA para escribir clases</h2>
    <div class="tarjeta"><h3>Claude (de pago por uso)</h3>
      ${campo('ANTHROPIC_API_KEY', 'API key de Claude', 'platform.claude.com > API Keys. Se paga por uso (recarga prepagada).')}
      ${campo('CLAUDE_MODELO', 'Modelo', 'Vacío = claude-opus-5-5 (recomendado).')}
    </div>
    <div class="tarjeta" style="margin-top:14px"><h3>IA gratis (compatible con OpenAI)</h3>
      ${campo('IA_GRATIS_URL', 'Dirección', 'Groq: https://api.groq.com/openai/v1 · Ollama en esta PC: http://localhost:11434/v1')}
      ${campo('IA_GRATIS_KEY', 'API key', 'Groq: console.groq.com > API Keys (gratis). Ollama no necesita.')}
      ${campo('IA_GRATIS_MODELO', 'Modelo', 'Groq: openai/gpt-oss-120b o llama-3.3-70b-versatile · Ollama: qwen2.5:7b')}
    </div>
    <h2>Acceso a la web</h2>
    <div class="tarjeta">${campo('WEB_CLAVE', 'Nueva clave del equipo', 'Déjala así para no cambiarla. Mínimo 6 caracteres.', 'password')}</div>
    <p class="botones" style="margin-top:16px"><button class="boton verde">Guardar ajustes</button></p>
  </form>`;
  $('#f-aj').VOZ.value = a.VOZ || 'auto';
  $('#f-aj').onsubmit = async e => {
    e.preventDefault();
    try {
      await api('/api/ajustes', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
      aviso('Ajustes guardados');
      estado = await api('/api/estado');
    } catch (err) { aviso(err.message, true); }
  };
}

ir();
