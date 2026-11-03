// Diapositivas por PLANTILLAS: se describen en clase.json ("diapositivas": [...]) sin escribir codigo.
// Las llena el docente desde la web, una IA gratis o Claude. Cada elemento puede aparecer cuando
// la voz dice una palabra ("cuando"); si no, aparece escalonado dentro de su bloque.
//
// Tipos: portada | pregunta | idea | definicion | temario | lista | pasos | flujo | codigo | comparacion | tarjetas | ruta | dato | cierre | logo
//        imagen (una lamina subida por el docente: clases/<clase>/laminas/01.jpg, en el campo "imagen")
// Campos comunes: bloque (id donde empieza), kicker, titulo (la palabra clave entre *asteriscos*), sub, nota, icono
//
// htmlDiapo() arma el HTML final de cada diapositiva (sin animar): lo usan el video y la vista «Así se verá» de la web,
// asi las dos se ven igual. construirAuto() lo anima en la linea de tiempo del video.

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// *palabra* -> <em>palabra</em> (acento serif morado)
const conAcento = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');
const plano = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const TIPOS = ['portada', 'pregunta', 'idea', 'definicion', 'temario', 'lista', 'pasos', 'flujo', 'codigo', 'comparacion', 'tarjetas', 'ruta', 'dato', 'cierre', 'logo', 'imagen'];

// ---------------------------------------------------------------- iconos (trazos de 24 px, dibujados para este motor)
export const ICONOS = {
  correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  carpeta: '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.2h7.5A2.5 2.5 0 0 1 21 9.7v7.8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/>',
  documento: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  tabla: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16"/>',
  presentacion: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8M7 12l3-3 3 2 4-4"/>',
  nube: '<path d="M7 18a4 4 0 0 1-.6-7.95A6 6 0 0 1 17.8 9 4.5 4.5 0 0 1 17.5 18z"/>',
  usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  equipo: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 4.8"/>',
  chat: '<path d="M4 5h16v11H9.5L4 20z"/><path d="M8 9.5h8M8 12.5h5"/>',
  candado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><circle cx="12" cy="16" r="1.2"/>',
  escudo: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  engranaje: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  rayo: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  grafico: '<path d="M4 20V11M10 20V5M16 20v-7M21 20H3"/>',
  codigo: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  navegador: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><circle cx="6" cy="6.5" r=".6"/><circle cx="8.5" cy="6.5" r=".6"/>',
  servidor: '<rect x="4" y="3" width="16" height="7" rx="1.5"/><rect x="4" y="14" width="16" height="7" rx="1.5"/><path d="M8 6.5h.01M8 17.5h.01M12 10v4"/>',
  datos: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  celular: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 19l2-4h14l2 4z"/>',
  buscar: '<circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/>',
  estrella: '<path d="M12 3l2.8 6 6.2.5-4.7 4.2 1.5 6.3L12 16.6 6.2 20l1.5-6.3L3 9.5 9.2 9z"/>',
  check: '<path d="M4 12.5l5 5L20 6"/>',
  alerta: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5h.01"/>',
  idea: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  libro: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  birrete: '<path d="M12 4l10 5-10 5L2 9z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v5"/>',
  enlace: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  compartir: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6"/>',
  editar: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
  mundo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  objetivo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  cohete: '<path d="M12 3c3.5 2 5.5 6 5.5 10l-2.5 3H9l-2.5-3C6.5 9 8.5 5 12 3z"/><circle cx="12" cy="10" r="1.8"/><path d="M9.5 16L8 21M14.5 16l1.5 5"/>',
  pregunta: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7v.5M12 17h.01"/>',
  imagen: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-6-6L5 20"/>',
  video: '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>',
  subir: '<path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>',
  lista: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  clic: '<path d="M6 3l13 7-6 2-2 6z"/>',
  campana: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  etiqueta: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  llave: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>',
  idioma: '<path d="M4 5h8M8 3v2M5 11c2-1 4-3.5 5-6M7 8c1 2 3 3.5 5 4"/><path d="M13 21l4-9 4 9M14.5 18h5"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  robot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M10 15.5h4"/><circle cx="12" cy="3.5" r="1"/><circle cx="9.5" cy="12.5" r="1.1"/><circle cx="14.5" cy="12.5" r="1.1"/>',
  filtro: '<path d="M3 4h18l-7 8.5V20l-4-2v-5.5z"/>',
  casa: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/>',
  trofeo: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3M12 13v4M8 21h8M9 17h6"/>',
};
export const NOMBRES_ICONOS = Object.keys(ICONOS);

// Icono de respaldo segun las palabras del texto (sin tildes ni mayusculas), cuando la IA no eligio uno
const REGLAS_ICONO = [
  [/inteligencia artificial|\bia\b|algoritmo|machine learning/, 'chip'], [/chatbot|\bbot\b|robot|asistente virtual/, 'robot'],
  [/correo|gmail|e-?mail|bandeja|outlook/, 'correo'], [/contrasen|candado|https|cifra|privacid|permiso/, 'candado'],
  [/segur|virus|phishing|spam|proteg/, 'escudo'], [/\bsheets\b|hoja de calculo|excel|celda|formula|tabla/, 'tabla'],
  [/\bslides\b|presentaci|diapositiva|powerpoint|exposici/, 'presentacion'], [/\bdocs\b|documento|informe|\bword\b|redacci/, 'documento'],
  [/\bdrive\b|carpeta|archivo/, 'carpeta'], [/calendar|calendario|fecha|cronograma/, 'calendario'], [/\bmeet\b|videollamada|video|grabaci|youtube/, 'video'],
  [/base de datos|\bsql\b|registro/, 'datos'], [/servidor|hosting/, 'servidor'], [/navegador|pagina web|sitio|chrome|\burl\b|\bweb\b/, 'navegador'],
  [/codigo|html|\bcss\b|javascript|program|script|etiqueta html/, 'codigo'], [/traduc|idioma|vocabulario|gramatic|pronunci|ingles/, 'idioma'],
  [/emprend|startup|negocio|lanza|innovaci/, 'cohete'], [/coment|chat|conversa|feedback|opinion|mensaje|instrucci|prompt|pedido|consulta/, 'chat'],
  [/equipo|colabor|companer|grupo/, 'equipo'], [/usuario|perfil|cuenta|cliente|persona/, 'usuario'], [/compart|difund|publica/, 'compartir'],
  [/enlace|link|vincul|conect/, 'enlace'], [/nube|cloud|en linea|online|internet/, 'nube'], [/notifica|aviso/, 'campana'],
  [/busca|busqueda|investig|encontrar/, 'buscar'], [/configur|ajuste|automatiz|proceso/, 'engranaje'], [/rapid|veloc|agil|instant|tiempo real/, 'rayo'],
  [/tiempo|hora|minuto|historial|plazo/, 'reloj'], [/grafic|estadistic|metrica|resultado|crecim/, 'grafico'], [/celular|movil|smartphone/, 'celular'],
  [/laptop|computador|\bpc\b|escritorio/, 'laptop'], [/error|cuidado|riesgo|problema|evita|falla/, 'alerta'], [/objetivo|meta|proposito/, 'objetivo'],
  [/universidad|academic|carrera|estudiante/, 'birrete'], [/aprend|estudi|libro|lectura|teoria|curso/, 'libro'], [/idea|creativ|consejo|\btip\b/, 'idea'],
  [/edita|escrib|redacta|modific/, 'editar'], [/subir|cargar|descarg/, 'subir'], [/imagen|foto|diseno/, 'imagen'], [/filtr/, 'filtro'],
  [/etiqueta|categor|clasific/, 'etiqueta'], [/acceso|llave|iniciar sesion/, 'llave'], [/clic|pulsa|presiona|boton|menu/, 'clic'],
  [/logro|premio|exito|reto|desafio/, 'trofeo'], [/importante|clave|destac|calidad/, 'estrella'], [/listo|correct|verific|cumpl/, 'check'],
  [/inicio|principal/, 'casa'], [/mundo|global|internacional/, 'mundo'], [/pregunta|duda|\?/, 'pregunta'],
];
export function iconoPara(...textos) {
  const t = plano(textos.filter(Boolean).join(' '));
  if (!t.trim()) return '';
  const r = REGLAS_ICONO.find(([re]) => re.test(t));
  return r ? r[1] : '';
}
const elegirIcono = (pedido, ...textos) => (ICONOS[pedido] ? pedido : iconoPara(...textos));
const svg = (n, clase = '') => (ICONOS[n] ? `<svg class="ico ${clase}" viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n]}</svg>` : '');
// ---------------------------------------------------------------- diseño: estilo de la clase y variante de cada plantilla
// Las clases nuevas traen una "semilla" (la pone la web al crearlas o al pulsar «Otro diseño»): con ella se elige el
// estilo visual de toda la clase y una variante de cada plantilla. Asi dos clases no se ven iguales y dos diapositivas
// seguidas del mismo tipo tampoco. El docente puede fijar el estilo ("estilo") o la variante de una diapositiva
// ("variante"). Las clases sin semilla (las de antes) se ven como siempre: estilo vibrante y la primera variante.
export const ESTILOS = { vibrante: 'Vibrante', editorial: 'Editorial', noche: 'Noche', pastel: 'Pastel' };
export const VARIANTES = {
  portada: { icono: 'Icono grande', panel: 'Panel de color', centrada: 'Centrada', tipografica: 'Tipográfica' },
  pregunta: { oscura: 'Fondo oscuro', luz: 'Fondo claro' },
  idea: { icono: 'Con icono', cita: 'Cita', banda: 'Banda de color' },
  definicion: { tarjeta: 'Tarjeta', diccionario: 'Diccionario' },
  temario: { columnas: 'Dos columnas', mosaico: 'Mosaico' },
  lista: { filas: 'Filas', cuadricula: 'Cuadrícula' },
  tarjetas: { numeradas: 'Numeradas', iconos: 'Iconos grandes' },
  dato: { anillo: 'Anillo', gigante: 'Número gigante' },
  cierre: { reto: 'Columnas', tablero: 'Tablero' },
};
const mezcla = t => { let h = 2166136261; for (const c of String(t)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export function elegirDiseno(clase) {
  const lista = (clase && clase.diapositivas) || [];
  const conSemilla = clase && clase.semilla != null && clase.semilla !== '' && Number.isFinite(+clase.semilla);
  const semilla = conSemilla ? Math.abs(Math.floor(+clase.semilla)) : 0;
  const nombres = Object.keys(ESTILOS);
  const estilo = ESTILOS[clase && clase.estilo] ? clase.estilo : conSemilla ? nombres[mezcla(`estilo${semilla}`) % nombres.length] : 'vibrante';
  const vistos = {};
  const variantes = lista.map(d => {
    const ops = d && VARIANTES[d.tipo] ? Object.keys(VARIANTES[d.tipo]) : null;
    if (!ops) return '';
    const n = (vistos[d.tipo] = (vistos[d.tipo] || 0) + 1);
    if (ops.includes(d.variante)) return d.variante;
    return conSemilla ? ops[(mezcla(`${semilla}:${d.tipo}`) + n - 1) % ops.length] : ops[0];
  });
  return { estilo, variantes, tinte: semilla % 4 };
}

const FLECHA = '<svg class="a-flecha-svg" viewBox="0 0 48 24" aria-hidden="true"><path d="M3 12h38M33 5l8 7-8 7"/></svg>';

// ---------------------------------------------------------------- resaltado de codigo (HTML, CSS y JavaScript)
function resaltarCodigo(codigo) {
  const c = String(codigo || '').replace(/^\n/, '').replace(/\s+$/, '');
  const e = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const span = (cl, s) => `<span class="${cl}">${e(s)}</span>`;
  if (/<\/?[a-zA-Z!]/.test(c)) {
    return c.split(/(<!--[\s\S]*?-->|<\/?[A-Za-z!][^>]*>)/g).map(parte => {
      if (!parte) return '';
      if (parte.startsWith('<!--')) return span('c-com', parte);
      const m = parte.match(/^<(\/?)([A-Za-z!][\w-]*)([\s\S]*?)(\/?)>$/);
      if (!m) return e(parte);
      const attrs = m[3].replace(/([\w:-]+)(?:(=)("[^"]*"|'[^']*'|[^\s"']+))?/g, (_, n, eq, v) =>
        `<span class="c-atr">${n}</span>${eq ? `<span class="c-sig">=</span><span class="c-val">${e(v)}</span>` : ''}`);
      return `<span class="c-sig">&lt;${m[1]}</span><span class="c-tag">${m[2]}</span>${attrs}<span class="c-sig">${m[4]}&gt;</span>`;
    }).join('');
  }
  const esJs = /\b(const|let|var|function|return|=>|console\.|document\.|if\s*\()/.test(c);
  const esCss = !esJs && /[^{}]+\{[\s\S]*?[\w-]+\s*:[^;{}]+;?[\s\S]*?\}/.test(c);
  if (esCss) {
    return c.split(/(\/\*[\s\S]*?\*\/|\{|\}|[\w-]+\s*:[^;{}\n]*;?)/g).map(parte => {
      if (!parte) return '';
      if (parte.startsWith('/*')) return span('c-com', parte);
      if (parte === '{' || parte === '}') return span('c-sig', parte);
      const m = parte.match(/^([\w-]+)(\s*:)([^;]*)(;?)$/);
      if (m) return `${span('c-atr', m[1])}${span('c-sig', m[2])}${span('c-val', m[3])}${span('c-sig', m[4])}`;
      return parte.trim() ? parte.replace(/^(\s*)([\s\S]*?)(\s*)$/, (_, a, s, z) => `${e(a)}${span('c-tag', s)}${e(z)}`) : e(parte);
    }).join('');
  }
  if (esJs) {
    const PAL = /^(const|let|var|function|return|if|else|for|while|new|class|import|export|from|await|async|true|false|null|undefined|of|in)$/;
    return c.split(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/|"[^"\n]*"|'[^'\n]*'|`[^`]*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_$][\w$]*\b)/g).map(parte => {
      if (!parte) return '';
      if (/^(\/\/|\/\*)/.test(parte)) return span('c-com', parte);
      if (/^["'`]/.test(parte)) return span('c-val', parte);
      if (/^\d/.test(parte)) return span('c-atr', parte);
      if (PAL.test(parte)) return span('c-tag', parte);
      return e(parte);
    }).join('');
  }
  return e(c);
}
const archivoDe = (d) => {
  if (d.archivo) return d.archivo;
  const c = String(d.codigo || '');
  if (/<\/?[a-zA-Z!]/.test(c)) return 'index.html';
  if (/\b(const|let|var|function|=>|console\.|document\.)/.test(c)) return 'app.js';
  if (/[^{}]+\{[\s\S]*?:[\s\S]*?\}/.test(c)) return 'estilos.css';
  return '';
};

// ---------------------------------------------------------------- estilos de las plantillas
export const ESTILO_AUTO = `
  .diapo::after { content: ''; position: absolute; right: -140px; top: -160px; width: 460px; height: 460px; border-radius: 50%;
    background: radial-gradient(circle, rgba(166,198,26,.20), transparent 68%); pointer-events: none; }
  .titulo.mini { font-size: 44px; line-height: 1.08; letter-spacing: -0.03em; }
  .diapo.oscura { background: var(--tinta); color: #fff; }
  .diapo.oscura::after { background: radial-gradient(circle, rgba(166,198,26,.26), transparent 68%); }
  .diapo.oscura .kicker { color: var(--verde); }
  .diapo.oscura .titulo em { color: var(--verde); }
  .diapo.oscura .sub { color: #c4c4d0; }
  .diapo.oscura .nota { color: #8d8d9c; }
  .ico { width: 1em; height: 1em; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex: none; display: block; }
  .a-col { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
  .a-2col { display: grid; grid-template-columns: minmax(0, 1fr) 440px; gap: 72px; align-items: center; }
  .a-2col.ancha { grid-template-columns: minmax(0, 1fr) 560px; gap: 60px; }
  .a-tile { width: 76px; height: 76px; border-radius: 22px; display: grid; place-items: center; font-size: 40px; flex: none;
    background: var(--morado-claro); color: var(--morado); }
  .a-tile.chico { width: 58px; height: 58px; border-radius: 17px; font-size: 30px; }
  .a-tile.verde { background: var(--verde-claro); color: var(--verde-osc); }
  .a-tile .ico { stroke-width: 1.7; }
  .auto-chips { display: flex; gap: 14px; flex-wrap: wrap; }
  .chip .ico { font-size: 24px; }
  .auto-despedida { display: inline-flex; align-self: flex-start; align-items: center; gap: 12px; padding: 14px 22px; border-radius: 14px;
    background: var(--verde-claro); color: var(--verde-osc); font-size: 26px; font-weight: 700; }

  /* visual grande: portada e idea */
  .a-visual { position: relative; width: 440px; height: 440px; display: grid; place-items: center; }
  .a-anillo { position: absolute; inset: 0; border-radius: 50%; border: 2px dashed #d9d7f6; }
  .a-anillo.dos { inset: 58px; border: 2px solid #efeefe; }
  .a-disco { position: relative; width: 236px; height: 236px; border-radius: 68px; display: grid; place-items: center; font-size: 124px; color: #fff;
    background: linear-gradient(145deg, #6a60f4, var(--morado) 58%, #281f9e); box-shadow: 0 34px 70px rgba(62, 50, 212, .34); transform: rotate(-6deg); }
  .a-disco .ico { transform: rotate(6deg); stroke-width: 1.45; }
  .a-disco.verde { background: linear-gradient(145deg, #cde34d, var(--verde) 55%, #84a00b); color: #1d2205; box-shadow: 0 34px 70px rgba(120, 150, 10, .32); }
  .a-orbita { position: absolute; width: 86px; height: 86px; border-radius: 26px; display: grid; place-items: center; font-size: 42px;
    background: #fff; color: var(--verde-osc); box-shadow: 0 16px 36px rgba(27, 27, 34, .14); }
  .a-orbita.o1 { left: 4px; top: 66px; }
  .a-orbita.o2 { right: -6px; top: 168px; color: var(--morado); }
  .a-orbita.o3 { left: 76px; bottom: 6px; }

  /* pregunta (diapositiva oscura) */
  .a-pregunta { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 56px; align-items: center; }
  .a-q { font: italic 400 430px/0.78 var(--serif); color: var(--verde); text-align: center; text-shadow: 0 30px 80px rgba(166, 198, 26, .25); }

  /* definicion */
  .a-def { position: relative; display: flex; flex-direction: column; gap: 22px; padding: 46px 56px 48px 64px; border-radius: 30px;
    background: #f6f6fa; border: 2px solid #ebebf2; }
  .a-def::before { content: ''; position: absolute; left: -2px; top: 40px; bottom: 40px; width: 9px; border-radius: 0 6px 6px 0; background: var(--verde); }
  .a-def .titulo { padding-right: 120px; }
  .a-def .a-tile { position: absolute; right: 46px; top: 44px; }
  .a-def-texto { font-size: 33px; line-height: 1.42; font-weight: 500; color: #34343f; max-width: 1040px; }

  /* lista */
  .a-lista { display: grid; grid-template-columns: 460px minmax(0, 1fr); gap: 60px; align-items: center; }
  .a-filas { display: flex; flex-direction: column; gap: 14px; }
  .a-fila { display: flex; align-items: center; gap: 22px; padding: 16px 26px 16px 16px; border-radius: 20px; background: #fff;
    border: 2px solid #ececf3; box-shadow: 0 10px 26px rgba(27, 27, 34, .05); font-size: 27px; line-height: 1.3; font-weight: 500; color: #2c2c36; }
  .a-punto { width: 58px; height: 58px; border-radius: 17px; background: var(--verde-claro); display: grid; place-items: center; flex: none; }
  .a-punto::after { content: ''; width: 14px; height: 14px; border-radius: 50%; background: var(--verde); }

  /* pasos: linea de tiempo horizontal */
  .a-pasos { --g: 28px; position: relative; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: var(--g); margin-top: 16px; }
  .a-pasos-linea { position: absolute; top: 42px; height: 5px; border-radius: 3px; background: #e7e7ef;
    left: calc((100% - (var(--n) - 1) * var(--g)) / var(--n) / 2); right: calc((100% - (var(--n) - 1) * var(--g)) / var(--n) / 2); }
  .a-pasos-linea i { position: absolute; inset: 0; border-radius: 3px; background: var(--verde); transform-origin: left center; }
  .a-paso { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 22px; }
  .a-paso-n { width: 88px; height: 88px; border-radius: 50%; display: grid; place-items: center; background: var(--morado); color: #fff;
    font: 800 34px var(--mono); box-shadow: 0 0 0 10px #fff, 0 16px 32px rgba(62, 50, 212, .3); }
  .a-paso p { font-size: 26px; line-height: 1.34; font-weight: 500; color: #2c2c36; max-width: 330px; }

  /* flujo: nodos unidos por flechas */
  .a-flujo { display: flex; align-items: stretch; margin-top: 12px; }
  .a-nodo { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px;
    padding: 34px 22px 32px; border-radius: 26px; background: #f6f6fa; border: 2px solid #ebebf2; }
  .a-nodo h3 { font-size: 31px; line-height: 1.1; font-weight: 800; letter-spacing: -0.03em; }
  .a-nodo p { font-size: 22px; line-height: 1.4; color: var(--gris); }
  .a-nodo.fin { background: var(--tinta); border-color: var(--tinta); color: #fff; }
  .a-nodo.fin p { color: #c4c4d0; }
  .a-nodo.fin .a-tile { background: #2d2d39; color: var(--verde); }
  .a-flecha { flex: 0 0 62px; display: grid; place-items: center; color: var(--verde-osc); }
  .a-flecha-svg { width: 46px; height: 24px; fill: none; stroke: currentColor; stroke-width: 3.2; stroke-linecap: round; stroke-linejoin: round; }

  /* tarjetas */
  .a-tarjetas { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 26px; }
  .a-tarjetas .tarjeta { gap: 14px; }
  .a-tarj-cab { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
  .tarjeta.oscura .a-tile { background: #2d2d39; color: var(--verde); }
  .tarjeta.oscura .num { color: var(--verde); }

  /* comparacion */
  .a-comp { display: grid; grid-template-columns: minmax(0, 1fr) 0 minmax(0, 1fr); gap: 0 34px; align-items: stretch; }
  .a-comp .tarjeta { padding: 34px 38px 38px; gap: 14px; }
  .a-comp .tarjeta h3 { font-size: 40px; }
  .a-comp .tarjeta p { font-size: 25px; }
  .a-lado-cab { display: flex; align-items: center; justify-content: space-between; min-height: 58px; }
  .a-vs { align-self: center; justify-self: center; width: 78px; height: 78px; border-radius: 50%; display: grid; place-items: center; z-index: 1;
    background: var(--verde); color: #17180f; font: 800 24px var(--mono); box-shadow: 0 0 0 10px #fff; }

  /* codigo en una ventana de editor */
  .a-codigo { display: grid; grid-template-columns: 400px minmax(0, 1fr); gap: 56px; align-items: center; }
  .a-ventana { border-radius: 22px; overflow: hidden; background: #16142c; box-shadow: 0 30px 60px rgba(22, 20, 44, .28); }
  .a-barra { height: 54px; display: flex; align-items: center; gap: 9px; padding: 0 22px; background: #221f3d; }
  .a-barra i { width: 13px; height: 13px; border-radius: 50%; background: #ff6b6b; }
  .a-barra i:nth-child(2) { background: #ffc145; }
  .a-barra i:nth-child(3) { background: #5dd37a; }
  .a-barra span { margin-left: 12px; font: 600 18px var(--mono); color: #a9a6cf; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .a-ventana .codigo { border-radius: 0; box-shadow: none; font-size: 22px; max-height: 540px; overflow: hidden; padding: 26px 32px 30px; }

  /* ruta: los clics dentro de una aplicacion */
  .a-app { position: relative; border-radius: 22px; overflow: hidden; background: #fff; border: 2px solid #e6e6ef; box-shadow: 0 30px 60px rgba(27, 27, 34, .13); }
  .a-app .a-barra { background: #f3f3f7; }
  .a-app .a-barra span { color: #6b6b7b; }
  .a-menu { padding: 26px; display: flex; flex-direction: column; gap: 14px; }
  .a-op { height: 78px; display: flex; align-items: center; gap: 18px; padding: 0 22px; border-radius: 16px; background: #f6f6fa;
    border: 2px solid transparent; font-size: 26px; font-weight: 600; color: #2c2c36; white-space: nowrap; overflow: hidden; }
  .a-op > span { overflow: hidden; text-overflow: ellipsis; }
  .a-op b { flex: none; width: 42px; height: 42px; border-radius: 12px; display: grid; place-items: center; background: #e6e6ef; color: #6b6b7b; font: 700 18px var(--mono); }
  .a-op .ico { margin-left: auto; font-size: 26px; color: #a0a0b0; }
  .a-op[data-ok="1"] b { background: var(--verde); color: #17180f; }
  .a-op[data-on="1"] { background: var(--morado-claro); border-color: var(--morado); color: var(--morado); }
  .a-op[data-on="1"] b { background: var(--morado); color: #fff; }
  .a-op[data-on="1"] .ico { color: var(--morado); }
  .a-cursor { position: absolute; left: 0; top: 0; width: 46px; height: 46px; fill: #1b1b22; stroke: #fff; stroke-width: 1.6; stroke-linejoin: round;
    filter: drop-shadow(0 5px 8px rgba(0, 0, 0, .3)); }

  /* dato grande dentro de un anillo */
  .a-dato { display: grid; grid-template-columns: 460px minmax(0, 1fr); gap: 72px; align-items: center; }
  .a-cifra { position: relative; width: 460px; height: 460px; display: grid; place-items: center; }
  .a-cifra svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
  .a-cifra circle { fill: none; stroke-width: 18; }
  .a-cifra .fondo { stroke: #f0f0f5; }
  .a-cifra .arco { stroke: var(--verde); stroke-linecap: round; }
  .auto-dato { position: relative; font: 900 150px/0.9 var(--sans); letter-spacing: -0.06em; color: var(--tinta); text-align: center; }
  .auto-dato em { font-family: var(--serif); font-weight: 400; color: var(--morado); }
  .auto-dato.l4 { font-size: 118px; }
  .auto-dato.l6 { font-size: 86px; }
  .auto-dato.l9 { font-size: 62px; }

  /* cierre: resumen + reto */
  .a-cierre { display: grid; grid-template-columns: minmax(0, 1fr) 470px; gap: 56px; align-items: center; }
  .a-cierre.visual { grid-template-columns: minmax(0, 1fr) 440px; gap: 72px; }
  .a-checks { display: flex; flex-direction: column; gap: 16px; }
  .a-check { display: flex; gap: 18px; align-items: flex-start; font-size: 27px; line-height: 1.34; font-weight: 500; color: #2c2c36; }
  .a-check i { flex: none; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; margin-top: -3px;
    background: var(--verde); color: #17180f; font-size: 24px; }
  .a-check i .ico { stroke-width: 3; }
  .a-reto { display: flex; flex-direction: column; gap: 18px; padding: 40px 40px 44px; border-radius: 28px; background: var(--tinta); color: #fff;
    box-shadow: 0 30px 60px rgba(27, 27, 34, .25); }
  .a-reto-k { display: inline-flex; align-items: center; gap: 12px; font-size: 20px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--verde); }
  .a-reto-k .ico { font-size: 30px; }
  .a-reto p { font-size: 28px; line-height: 1.42; font-weight: 500; color: #ececf3; }

  /* temario: hasta 8 temas numerados en dos columnas */
  .a-temario { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(var(--filas), auto); grid-auto-flow: column; gap: 14px 26px; }
  .a-temario.una { grid-template-columns: minmax(0, 1fr); max-width: 860px; }
  .a-tema { display: flex; align-items: center; gap: 18px; padding: 12px 22px 12px 14px; border-radius: 18px; background: #fff; border: 2px solid #ececf3;
    box-shadow: 0 8px 22px rgba(27, 27, 34, .05); font-size: 26px; line-height: 1.25; font-weight: 600; color: #2c2c36; }
  .a-tema > b { flex: none; width: 40px; font: 700 20px var(--mono); color: var(--morado); text-align: center; }

  /* cierre con el logo al centro */
  .a-final { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 30px; }
  .a-final-logo { height: 190px; width: auto; mix-blend-mode: multiply; }
  .a-final-marca { display: flex; align-items: center; gap: 26px; color: #2b2b2b; }
  .a-final-marca b { font-size: 170px; font-weight: 900; letter-spacing: -0.04em; line-height: .9; }
  .a-final-marca span { font-size: 40px; line-height: 1.1; text-align: left; font-weight: 500; }
  .a-final-linea { width: 140px; height: 7px; border-radius: 4px; background: var(--verde); }
  .a-final-desp { font-size: 46px; line-height: 1.15; font-weight: 800; letter-spacing: -0.03em; color: var(--tinta); }
  .a-final-desp em { font-family: var(--serif); font-style: italic; font-weight: 400; color: var(--morado); font-size: 1.1em; }
  .a-final-firma { font-size: 24px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--gris); }

  /* ===== variantes ===== */
  .titulo.gigante { font-size: 106px; line-height: .94; letter-spacing: -0.05em; }
  /* portada: panel de color */
  .diapo.v-panel::after { display: none; }
  .a-ancho-panel { max-width: 740px; }
  .a-panel { position: absolute; right: 0; top: 0; bottom: 0; width: 500px; overflow: hidden; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 40px; color: #fff; background: var(--a-panel, linear-gradient(160deg, #6a60f4, var(--morado) 55%, #261d9a)); }
  .a-panel-aro { position: absolute; width: 640px; height: 640px; right: -190px; top: -150px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, .16); }
  .a-panel-aro.dos { width: 380px; height: 380px; right: auto; top: auto; left: -150px; bottom: -150px; }
  .a-panel-ico { font-size: 176px; line-height: 0; }
  .a-panel-ico .ico { stroke-width: 1.15; }
  .a-panel-lista { position: relative; display: flex; flex-direction: column; gap: 14px; }
  .a-panel-lista span { display: flex; align-items: center; gap: 12px; font: 600 22px var(--mono); color: rgba(255, 255, 255, .94); }
  .a-panel-lista .ico { font-size: 24px; color: var(--a-panel-acento, var(--verde)); }
  /* portada: centrada */
  .a-centro { position: relative; display: flex; flex-direction: column; align-items: center; gap: 26px; max-width: 1120px; }
  .a-centro .auto-chips { justify-content: center; }
  .a-marca-agua { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%); font-size: 600px; line-height: 0; color: var(--morado); opacity: .07; }
  .a-marca-agua .ico { stroke-width: .9; }
  .diapo.v-centrada::before { content: ''; position: absolute; left: 50%; top: 46%; width: 880px; height: 880px; transform: translate(-50%, -50%);
    border-radius: 50%; border: 2px dashed rgba(62, 50, 212, .12); pointer-events: none; }
  /* portada: tipografica */
  .a-tipo-cab { display: flex; align-items: center; justify-content: space-between; }
  .a-tipo-pie { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; padding-top: 26px; border-top: 3px solid var(--verde); }
  .a-tipo-pie .sub { max-width: 660px; }
  /* pregunta: fondo claro */
  .a-q-luz { position: absolute; right: 70px; top: 50%; transform: translateY(-54%); font: italic 400 640px/1 var(--serif); text-shadow: none;
    color: transparent; -webkit-text-stroke: 3px rgba(62, 50, 212, .2); }
  .a-pregunta-luz { position: relative; max-width: 880px; }
  .v-luz .titulo em { background: linear-gradient(transparent 64%, rgba(166, 198, 26, .45) 64%); padding: 0 .06em; }
  /* idea: cita */
  .a-cita { position: relative; max-width: 1200px; padding-left: 150px; }
  .a-comillas { position: absolute; left: -6px; top: -96px; font: italic 400 320px/1 var(--serif); color: var(--morado); }
  .a-cita .a-col { border-left: 6px solid var(--verde); padding-left: 36px; }
  /* idea: banda */
  .a-banda-idea { display: flex; align-items: center; gap: 44px; margin: 0 -96px; padding: 50px 96px; background: var(--a-banda, var(--verde-claro)); }
  .a-banda-idea .a-tile { width: 136px; height: 136px; border-radius: 38px; font-size: 72px; background: #fff; color: var(--verde-osc); }
  .v-banda > .sub { margin-top: 8px; }
  /* definicion: diccionario */
  .a-dicc { display: grid; grid-template-columns: 500px minmax(0, 1fr); gap: 64px; align-items: center; }
  .a-dicc .a-tile { margin-bottom: 4px; }
  .a-def.a-dicc-def { padding: 10px 0 10px 44px; background: none; border: 0; border-left: 6px solid var(--verde); border-radius: 0; }
  .a-def.a-dicc-def::before { display: none; }
  /* temario: mosaico */
  .a-mosaico { display: grid; grid-template-columns: repeat(var(--c), minmax(0, 1fr)); gap: 18px; }
  .a-tema.a-tema-m { flex-direction: column; align-items: flex-start; gap: 14px; padding: 22px 24px 24px; }
  .a-tema.a-tema-m > b { width: auto; font-size: 30px; text-align: left; }
  /* lista: cuadricula */
  .a-cuadricula { display: grid; grid-template-columns: repeat(var(--c), minmax(0, 1fr)); gap: 18px; }
  .a-fila.a-fila-c { flex-direction: column; align-items: flex-start; gap: 18px; padding: 28px 28px 30px; }
  /* tarjetas: iconos grandes */
  .a-tarj-i .tarjeta { align-items: center; text-align: center; padding: 42px 28px 38px; }
  .a-tile.a-tile-g { width: 106px; height: 106px; border-radius: 50%; font-size: 52px; margin-bottom: 8px; }
  /* dato: numero gigante */
  .a-dato-g { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 64px; align-items: center; }
  .a-cifra-g .auto-dato { text-align: left; font-size: 210px; }
  .a-cifra-g .auto-dato.l4 { font-size: 168px; }
  .a-cifra-g .auto-dato.l6 { font-size: 124px; }
  .a-cifra-g .auto-dato.l9 { font-size: 86px; }
  .a-barra-dato { display: block; width: 190px; height: 12px; margin-top: 26px; border-radius: 6px; background: var(--verde); transform-origin: left center; }
  /* cierre: tablero */
  .a-tablero { display: grid; grid-template-columns: repeat(var(--c), minmax(0, 1fr)); gap: 16px; }
  .a-check.a-check-t { padding: 22px 24px; border-radius: 20px; background: #f6f6fa; border: 2px solid #ebebf2; }
  .a-reto.a-reto-barra { flex-direction: row; align-items: center; gap: 30px; padding: 26px 34px; }
  .a-reto-barra .a-reto-k { flex: none; }

  /* ===== estilos de clase ===== */
  /* editorial: papel, titulos serif, lineas finas, sin brillos */
  .diapo.e-editorial { background: #fbfaf6; --a-panel: var(--tinta); --a-banda: #f0ede4; }
  .diapo.e-editorial::after { display: none; }
  .diapo.e-editorial:not(.oscura)::before { content: ''; position: absolute; left: 96px; right: 96px; top: 40px; height: 1px; background: #d9d5c8; }
  .diapo.e-editorial.v-centrada::before, .diapo.e-editorial.v-panel::before { display: none; }
  .e-editorial .titulo { font-family: var(--serif); font-weight: 400; letter-spacing: -0.02em; line-height: 1; }
  .e-editorial .titulo em { color: var(--verde-osc); font-size: 1em; }
  .e-editorial .titulo.gigante { font-size: 120px; }
  .e-editorial .kicker { color: var(--tinta); letter-spacing: .22em; }
  .e-editorial .kicker::before { width: 26px; height: 2px; background: var(--tinta); }
  .e-editorial .tarjeta, .e-editorial .a-fila, .e-editorial .a-tema, .e-editorial .a-nodo, .e-editorial .a-def, .e-editorial .a-op,
  .e-editorial .a-app, .e-editorial .a-check-t { background: transparent; border: 1.5px solid #d9d5c8; box-shadow: none; border-radius: 6px; }
  .e-editorial .a-def.a-dicc-def { border: 0; border-left: 3px solid var(--tinta); }
  .e-editorial .tarjeta.oscura, .e-editorial .a-nodo.fin { background: var(--tinta); border-color: var(--tinta); }
  .e-editorial .a-tile { background: transparent; border: 1.5px solid currentColor; border-radius: 50%; color: var(--tinta); }
  .e-editorial .tarjeta.oscura .a-tile, .e-editorial .a-nodo.fin .a-tile { color: #fff; }
  .e-editorial .a-banda-idea .a-tile { background: #fbfaf6; }
  .e-editorial .a-disco { border-radius: 50%; transform: none; box-shadow: none; background: var(--tinta); }
  .e-editorial .a-disco .ico { transform: none; }
  .e-editorial .a-disco.verde { background: var(--verde); }
  .e-editorial .a-orbita { border-radius: 50%; box-shadow: none; border: 1.5px solid #d9d5c8; background: #fbfaf6; }
  .e-editorial .chip { background: transparent; border: 1.5px solid var(--tinta); color: var(--tinta); border-radius: 99px; }
  .e-editorial .chip.verde { border-color: var(--verde-osc); color: var(--verde-osc); }
  .e-editorial .a-paso-n { background: var(--tinta); box-shadow: 0 0 0 10px #fbfaf6; }
  .e-editorial .a-pasos-linea i, .e-editorial .a-tipo-pie { background: var(--tinta); }
  .e-editorial .a-tipo-pie { background: none; border-top-color: var(--tinta); border-top-width: 1.5px; }
  .e-editorial .a-vs { background: var(--tinta); color: #fff; box-shadow: 0 0 0 10px #fbfaf6; }
  .e-editorial .auto-dato { font-family: var(--serif); font-weight: 400; letter-spacing: -0.03em; }
  .e-editorial .a-cifra .arco { stroke: var(--tinta); stroke-width: 6; }
  .e-editorial .a-cifra .fondo { stroke: #ece9df; stroke-width: 6; }
  .e-editorial .a-check i { background: var(--tinta); color: #fff; }
  .e-editorial .a-comillas, .e-editorial .a-marca-agua { color: var(--tinta); }
  .e-editorial .a-q-luz { -webkit-text-stroke-color: rgba(27, 27, 34, .16); }
  .e-editorial .a-final-desp { font-family: var(--serif); font-weight: 400; font-size: 58px; letter-spacing: -0.01em; }
  /* noche: fondo oscuro con brillo violeta, tarjetas de vidrio */
  .diapo.e-noche { background: radial-gradient(1100px 620px at 85% -10%, #2c2563 0%, #16141f 58%); color: #f3f3f8;
    --a-panel: linear-gradient(160deg, #a6c61a, #6f8a07); --a-panel-acento: #16141f; --a-banda: #201d33; }
  .e-noche .kicker { color: var(--verde); }
  .e-noche .titulo em { color: #b9b0ff; }
  .e-noche .sub, .e-noche .a-def-texto, .e-noche .a-tipo-pie .sub { color: #c6c5d6; }
  .e-noche .nota { color: #8f8ea3; }
  .e-noche .tarjeta, .e-noche .a-fila, .e-noche .a-tema, .e-noche .a-nodo, .e-noche .a-def, .e-noche .a-op, .e-noche .a-app, .e-noche .a-check-t {
    background: rgba(255, 255, 255, .05); border-color: rgba(255, 255, 255, .1); color: #ececf3; box-shadow: none; }
  .e-noche .tarjeta p, .e-noche .a-nodo p, .e-noche .a-fila, .e-noche .a-tema, .e-noche .a-paso p, .e-noche .a-check { color: #dcdbe8; }
  .e-noche .tarjeta.oscura, .e-noche .a-nodo.fin { background: var(--morado); border-color: var(--morado); }
  .e-noche .a-tile { background: rgba(185, 176, 255, .14); color: #c9c2ff; }
  .e-noche .a-tile.verde, .e-noche .a-punto { background: rgba(166, 198, 26, .16); color: var(--verde); }
  .e-noche .chip { background: rgba(185, 176, 255, .14); color: #d6d1ff; }
  .e-noche .chip.verde { background: rgba(166, 198, 26, .16); color: var(--verde); }
  .e-noche .a-paso-n { box-shadow: 0 0 0 10px #17151f, 0 0 34px rgba(62, 50, 212, .6); }
  .e-noche .a-pasos-linea { background: rgba(255, 255, 255, .12); }
  .e-noche .a-vs { box-shadow: 0 0 0 10px #17151f; }
  .e-noche .a-anillo { border-color: rgba(185, 176, 255, .25); }
  .e-noche .a-anillo.dos { border-color: rgba(185, 176, 255, .12); }
  .e-noche .a-orbita { background: #24213a; color: var(--verde); box-shadow: 0 16px 36px rgba(0, 0, 0, .4); }
  .e-noche .a-cifra .fondo { stroke: rgba(255, 255, 255, .08); }
  .e-noche .auto-dato { color: #fff; }
  .e-noche .auto-dato em { color: #b9b0ff; }
  .e-noche .a-reto { background: var(--morado); }
  .e-noche .a-op b { background: rgba(255, 255, 255, .1); color: #c6c5d6; }
  .e-noche .a-op[data-on="1"] { background: rgba(62, 50, 212, .35); color: #fff; }
  .e-noche .a-app .a-barra { background: rgba(255, 255, 255, .06); }
  .e-noche .a-app .a-barra span { color: #b0afc4; }
  .e-noche .a-cursor { fill: #fff; stroke: #16141f; }
  .e-noche .a-comillas, .e-noche .a-marca-agua { color: #b9b0ff; }
  .e-noche .a-banda-idea .a-tile { background: #2c2847; color: var(--verde); }
  .e-noche .a-q-luz { -webkit-text-stroke-color: rgba(185, 176, 255, .28); }
  .e-noche .auto-despedida { background: rgba(166, 198, 26, .16); color: var(--verde); }
  .e-noche .a-temario .a-tema > b, .e-noche .a-tema > b { color: #b9b0ff; }
  .e-noche .a-final-desp, .e-noche .a-final-marca { color: #fff; }
  .e-noche .a-final-logo { filter: invert(1); mix-blend-mode: screen; }
  .e-noche .a-final-firma { color: #a9a8bc; }
  .diapo.e-noche.v-centrada::before { border-color: rgba(185, 176, 255, .18); }
  /* pastel: fondo de color suave (cambia en cada diapositiva) y tarjetas blancas */
  .diapo.e-pastel { background: var(--tinte); --a-panel: var(--acento); --a-banda: #fff; }
  .diapo.e-pastel.t1 { --tinte: #f1efff; --acento: var(--morado); }
  .diapo.e-pastel.t2 { --tinte: #eef6df; --acento: var(--verde-osc); }
  .diapo.e-pastel.t3 { --tinte: #e8f1ff; --acento: #1f5fd1; }
  .diapo.e-pastel.t4 { --tinte: #fff0e4; --acento: #c2410c; }
  .diapo.e-pastel::after { background: radial-gradient(circle, rgba(255, 255, 255, .8), transparent 68%); }
  .e-pastel .titulo em, .e-pastel .kicker, .e-pastel .a-tema > b, .e-pastel .a-comillas, .e-pastel .a-marca-agua { color: var(--acento); }
  .e-pastel .kicker::before { background: var(--acento); }
  .e-pastel .tarjeta, .e-pastel .a-fila, .e-pastel .a-tema, .e-pastel .a-nodo, .e-pastel .a-def, .e-pastel .a-op, .e-pastel .a-app, .e-pastel .a-check-t {
    background: #fff; border-color: transparent; box-shadow: 0 14px 34px rgba(27, 27, 34, .07); border-radius: 26px; }
  .e-pastel .a-def.a-dicc-def { background: none; box-shadow: none; border-left-color: var(--acento); border-radius: 0; }
  .e-pastel .tarjeta.oscura, .e-pastel .a-nodo.fin { background: var(--acento); color: #fff; }
  .e-pastel .tarjeta.oscura p, .e-pastel .a-nodo.fin p { color: rgba(255, 255, 255, .86); }
  .e-pastel .tarjeta.oscura .num { color: #fff; }
  .e-pastel .a-tile, .e-pastel .a-tile.verde { background: var(--tinte); color: var(--acento); }
  .e-pastel .tarjeta.oscura .a-tile, .e-pastel .a-nodo.fin .a-tile { background: rgba(255, 255, 255, .2); color: #fff; }
  .e-pastel .chip, .e-pastel .chip.verde { background: #fff; color: var(--acento); }
  .e-pastel .a-disco, .e-pastel .a-disco.verde { background: var(--acento); color: #fff; box-shadow: 0 30px 60px rgba(27, 27, 34, .18); }
  .e-pastel .a-orbita { color: var(--acento); }
  .e-pastel .a-anillo { border-color: rgba(27, 27, 34, .12); }
  .e-pastel .a-paso-n { background: var(--acento); box-shadow: 0 0 0 10px var(--tinte); }
  .e-pastel .a-pasos-linea { background: rgba(27, 27, 34, .08); }
  .e-pastel .a-pasos-linea i, .e-pastel .a-barra-dato { background: var(--acento); }
  .e-pastel .a-vs { background: var(--acento); color: #fff; box-shadow: 0 0 0 10px var(--tinte); }
  .e-pastel .a-cifra .fondo { stroke: #fff; }
  .e-pastel .a-cifra .arco { stroke: var(--acento); }
  .e-pastel .a-check i { background: var(--acento); color: #fff; }
  .e-pastel .a-reto { background: var(--acento); }
  .e-pastel .a-op[data-on="1"] { border-color: var(--acento); color: var(--acento); background: var(--tinte); }
  .e-pastel .a-op[data-on="1"] b { background: var(--acento); }
  .e-pastel .a-banda-idea .a-tile { color: var(--acento); background: var(--tinte); }
  .e-pastel .a-q-luz { -webkit-text-stroke-color: color-mix(in srgb, var(--acento) 30%, transparent); }
  .e-pastel .a-tipo-pie { border-top-color: var(--acento); }
  .e-pastel .auto-despedida { background: #fff; color: var(--acento); }

  /* la pregunta en fondo oscuro sigue oscura en todos los estilos */
  .diapo.e-editorial.oscura, .diapo.e-pastel.oscura { background: var(--tinta); color: #fff; }
  .e-editorial.oscura .titulo em, .e-pastel.oscura .titulo em, .e-pastel.oscura .kicker, .e-editorial.oscura .kicker { color: var(--verde); }
  .e-pastel.oscura .kicker::before, .e-editorial.oscura .kicker::before { background: var(--verde); }
  .diapo.e-pastel.oscura::after { background: radial-gradient(circle, rgba(166, 198, 26, .26), transparent 68%); }
  .e-noche .a-final-desp em { color: #b9b0ff; }
  .e-editorial .a-final-desp em { color: var(--verde-osc); }
  .e-pastel .a-final-desp em { color: var(--acento); }
  .e-noche .a-ventana { box-shadow: 0 0 0 1px rgba(255, 255, 255, .1), 0 30px 60px rgba(0, 0, 0, .45); }

  /* lamina del docente */
  .diapo.lamina { padding: 0; align-items: center; justify-content: center; background: #f3f3f6; }
  .diapo.lamina::after { display: none; }
  .lamina-fondo { position: absolute; inset: -60px; width: calc(100% + 120px); height: calc(100% + 120px); object-fit: cover; filter: blur(36px) saturate(1.1); opacity: .45; }
  .lamina-kb, .lamina-zoom { position: relative; height: 100%; }
  .lamina-img { display: block; height: 100%; width: auto; box-shadow: 0 0 40px rgba(27, 27, 34, .16); }
  .lamina-foco { position: absolute; border: 4px solid var(--verde); border-radius: 14px;
    box-shadow: 0 0 0 3px rgba(255, 255, 255, .85), 0 0 22px rgba(166, 198, 26, .6), 0 0 0 3000px rgba(16, 20, 40, .28); }
  .lamina-num { position: absolute; width: 52px; height: 52px; margin: -26px 0 0 -40px; border-radius: 50%; background: var(--verde);
    color: #17180f; font: 800 26px/52px var(--sans); text-align: center; box-shadow: 0 4px 14px rgba(0, 0, 0, .28); }
  .lamina-resalta { position: absolute; border-radius: 6px; background: rgba(166, 198, 26, .32); border-bottom: 5px solid var(--verde);
    transform-origin: left center; mix-blend-mode: multiply; }
`;

// ---------------------------------------------------------------- HTML de cada plantilla
// Tamano del titulo segun su largo y el ancho de su columna, para que nunca se salga de la diapositiva
const largo = t => String(t || '').replace(/\*/g, '').length;
const ESCALAS = {
  portada: [[24, ''], [44, 'mediano'], [70, 'chico']],
  ancho: [[44, 'mediano'], [70, 'chico']],
  media: [[30, 'mediano'], [54, 'chico']],
  angosta: [[26, 'chico']],
};
const tamTitulo = (t, escala) => (ESCALAS[escala].find(([n]) => largo(t) <= n) || [0, 'mini'])[1];
const lleno = x => x && String(x.titulo || x.texto || '').trim();
const RETO = /^\s*(tu\s+)?(reto|desaf[ií]o|tarea)\s*[:·.-]\s*/i;

// Reto del cierre: el campo "reto" o el punto que empieza con "Reto:" (clases hechas antes de existir el campo)
export function partesCierre(d) {
  const items = (d.items || []).filter(x => x && x.texto);
  if (d.reto) return { items, reto: d.reto };
  const k = items.findIndex(x => RETO.test(x.texto));
  if (k < 0) return { items, reto: '' };
  return { items: items.filter((_, i) => i !== k), reto: items[k].texto.replace(RETO, '').replace(/^./, c => c.toUpperCase()) };
}

// Devuelve { html, clase } con todos los elementos en su estado final (visibles), o null para "imagen".
// logo: URL de marca/logo.png (si existe) para el tipo "logo"; si no hay, se escribe la institucion.
// estilo, variante, indice y tinte salen de elegirDiseno(clase).
export function htmlDiapo(d, opciones = {}) {
  if (!d || !d.tipo || d.tipo === 'imagen') return null;
  const { estilo = 'vibrante', indice = 0, tinte = 0 } = opciones;
  const ops = VARIANTES[d.tipo] ? Object.keys(VARIANTES[d.tipo]) : [];
  const v = ops.includes(opciones.variante) ? opciones.variante : ops[0] || '';
  const r = armarDiapo(d, v, opciones);
  const e = ESTILOS[estilo] ? estilo : 'vibrante';
  const extra = [`e-${e}`, v && `v-${v}`, e === 'pastel' && `t${((indice + tinte) % 4) + 1}`].filter(Boolean).join(' ');
  return { html: r.html, clase: `${r.clase} ${extra}`.trim() };
}

function armarDiapo(d, v, { logo = '', institucion = '' }) {
  const kicker = d.kicker ? `<div class="kicker">${esc(d.kicker)}</div>` : '';
  const sub = d.sub ? `<p class="sub">${conAcento(d.sub)}</p>` : '';
  const nota = d.nota ? `<p class="nota">${esc(d.nota)}</p>` : '';
  const h = (etiqueta, escala) => (d.titulo ? `<${etiqueta} class="titulo ${tamTitulo(d.titulo, escala)}">${conAcento(d.titulo)}</${etiqueta}>` : '');
  const items = (d.items || []).filter(x => x && x.texto);
  const tarjetas = (d.tarjetas || []).filter(lleno);

  switch (d.tipo) {
    case 'portada': {
      const ico = elegirIcono(d.icono, d.titulo, d.sub) || 'birrete';
      const extras = [...new Set(items.map(x => iconoPara(x.texto)).filter(n => n && n !== ico))];
      const orbitas = [...extras, 'idea', 'libro', 'estrella'].filter((n, i, a) => n !== ico && a.indexOf(n) === i).slice(0, 3);
      const chips = items.map(x => `<span class="chip">${esc(x.texto)}</span>`).join('');
      const fila = chips ? `<div class="auto-chips">${chips}</div>` : '';
      if (v === 'panel') {
        return { clase: '', html: `<div class="a-col a-ancho-panel">${kicker}${h('h1', 'media')}${sub}</div>
          <div class="a-panel"><i class="a-panel-aro"></i><i class="a-panel-aro dos"></i><div class="a-panel-ico">${svg(ico)}</div>
          ${items.length ? `<div class="a-panel-lista">${items.slice(0, 4).map(x => `<span>${svg(iconoPara(x.texto) || 'check')}${esc(x.texto)}</span>`).join('')}</div>` : ''}</div>${nota}` };
      }
      if (v === 'centrada') {
        return { clase: 'centro', html: `<div class="a-marca-agua">${svg(ico)}</div><div class="a-centro">${kicker}${h('h1', 'portada')}${sub}${fila}</div>${nota}` };
      }
      if (v === 'tipografica') {
        const t = largo(d.titulo) <= 34 ? 'gigante' : tamTitulo(d.titulo, 'portada');
        return { clase: '', html: `<div class="a-tipo-cab">${kicker}<span class="a-tile">${svg(ico)}</span></div>
          ${d.titulo ? `<h1 class="titulo ${t}">${conAcento(d.titulo)}</h1>` : ''}<div class="a-tipo-pie">${sub}${fila}</div>${nota}` };
      }
      return { clase: '', html: `<div class="a-2col"><div class="a-col">${kicker}${h('h1', 'portada')}${sub}
        ${chips ? `<div class="auto-chips">${chips}</div>` : ''}</div>
        <div class="a-visual"><i class="a-anillo"></i><i class="a-anillo dos"></i><div class="a-disco">${svg(ico)}</div>
        ${orbitas.map((n, i) => `<span class="a-orbita o${i + 1}">${svg(n)}</span>`).join('')}</div></div>${nota}` };
    }
    case 'pregunta':
      if (v === 'luz') return { clase: '', html: `<div class="a-q a-q-luz">?</div><div class="a-col a-pregunta-luz">${kicker}${h('h2', 'media')}${sub}</div>${nota}` };
      return { clase: 'oscura', html: `<div class="a-pregunta"><div class="a-q">?</div><div class="a-col">${kicker}${h('h2', 'media')}${sub}</div></div>${nota}` };
    case 'idea': {
      const ico = elegirIcono(d.icono, d.titulo, d.sub) || 'idea';
      if (v === 'cita') return { clase: '', html: `<div class="a-cita"><span class="a-comillas">“</span><div class="a-col">${kicker}${h('h2', 'ancho')}${sub}</div></div>${nota}` };
      if (v === 'banda') {
        return { clase: '', html: `<div class="a-banda-idea"><span class="a-tile">${svg(ico)}</span><div class="a-col">${kicker}${h('h2', 'ancho')}</div></div>${sub}${nota}` };
      }
      return { clase: '', html: `<div class="a-2col"><div class="a-col">${kicker}${h('h2', 'media')}${sub}</div>
        <div class="a-visual"><i class="a-anillo"></i><i class="a-anillo dos"></i><div class="a-disco verde">${svg(ico)}</div></div></div>${nota}` };
    }
    case 'definicion': {
      const ico = elegirIcono(d.icono, d.titulo) || 'libro';
      const chips = items.map(x => `<span class="chip verde">${esc(x.texto)}</span>`).join('');
      if (v === 'diccionario') {
        return { clase: '', html: `<div class="a-dicc"><div class="a-col"><span class="a-tile">${svg(ico)}</span>${kicker}${h('h2', 'media')}</div>
          <div class="a-def a-dicc-def">${d.sub ? `<p class="a-def-texto">${conAcento(d.sub)}</p>` : ''}${chips ? `<div class="auto-chips">${chips}</div>` : ''}</div></div>${nota}` };
      }
      return { clase: '', html: `${kicker}<div class="a-def"><div class="a-tile">${svg(ico)}</div>${h('h2', 'ancho')}
        ${d.sub ? `<p class="a-def-texto">${conAcento(d.sub)}</p>` : ''}${chips ? `<div class="auto-chips">${chips}</div>` : ''}</div>${nota}` };
    }
    case 'temario': {
      const temas = items.slice(0, 8);
      const html = temas.map((x, i) => {
        const ico = elegirIcono(x.icono, x.texto) || 'check'; // todos con icono: si uno falta, la fila queda desalineada
        return `<div class="a-tema${v === 'mosaico' ? ' a-tema-m' : ''}"><b>${String(i + 1).padStart(2, '0')}</b><span class="a-tile chico verde">${svg(ico)}</span><span>${conAcento(x.texto)}</span></div>`;
      }).join('');
      if (v === 'mosaico') {
        const cols = temas.length <= 4 ? Math.max(2, temas.length) : temas.length <= 6 ? 3 : 4;
        return { clase: '', html: `${kicker}${h('h2', 'ancho')}${sub}<div class="a-mosaico" style="--c:${cols}">${html}</div>${nota}` };
      }
      return { clase: '', html: `${kicker}${h('h2', 'ancho')}${sub}
        <div class="a-temario${temas.length <= 4 ? ' una' : ''}" style="--filas:${temas.length <= 4 ? temas.length : Math.ceil(temas.length / 2)}">${html}</div>${nota}` };
    }
    case 'logo': {
      const marca = logo ? `<img class="a-final-logo" src="${esc(logo)}" alt="">`
        : `<div class="a-final-marca"><b>USS</b><span>${esc(institucion || 'Universidad Señor de Sipán').replace(/ (?=\S+$)/, '<br>')}</span></div>`;
      return { clase: 'centro', html: `<div class="a-final">${marca}<i class="a-final-linea"></i>
        <p class="a-final-desp">${conAcento(d.titulo || d.despedida || '¡Nos vemos en la *próxima sesión*!')}</p>
        ${d.sub ? `<span class="a-final-firma">${esc(d.sub)}</span>` : ''}</div>${nota}` };
    }
    case 'lista': {
      const filas = items.map(x => {
        const ico = elegirIcono(x.icono, x.texto) || (v === 'cuadricula' ? 'check' : '');
        return `<div class="a-fila${v === 'cuadricula' ? ' a-fila-c' : ''}">${ico ? `<span class="a-tile chico verde">${svg(ico)}</span>` : '<span class="a-punto"></span>'}<span>${conAcento(x.texto)}</span></div>`;
      }).join('');
      if (v === 'cuadricula') {
        const cols = items.length === 4 || items.length <= 2 ? 2 : 3;
        return { clase: '', html: `${kicker}${h('h2', 'ancho')}${sub}<div class="a-cuadricula" style="--c:${cols}">${filas}</div>${nota}` };
      }
      return { clase: '', html: `<div class="a-lista"><div class="a-col">${kicker}${h('h2', 'angosta')}${sub}</div><div class="a-filas">${filas}</div></div>${nota}` };
    }
    case 'pasos': {
      const pasos = items.slice(0, 5);
      return { clase: '', html: `${kicker}${h('h2', 'ancho')}${sub}
        <div class="a-pasos" style="--n:${Math.max(1, pasos.length)}">${pasos.length > 1 ? '<div class="a-pasos-linea"><i></i></div>' : ''}
        ${pasos.map((x, i) => `<div class="a-paso"><b class="a-paso-n">${i + 1}</b><p>${conAcento(x.texto)}</p></div>`).join('')}</div>${nota}` };
    }
    case 'flujo': {
      const nodos = tarjetas.slice(0, 5);
      const html = nodos.map((x, i) => {
        const ico = elegirIcono(x.icono, x.titulo, x.texto) || 'check';
        return `${i ? `<div class="a-flecha">${FLECHA}</div>` : ''}<div class="a-nodo${i === nodos.length - 1 && nodos.length > 1 ? ' fin' : ''}">
          <span class="a-tile">${svg(ico)}</span><h3>${conAcento(x.titulo)}</h3>${x.texto ? `<p>${conAcento(x.texto)}</p>` : ''}</div>`;
      }).join('');
      return { clase: '', html: `${kicker}${h('h2', 'ancho')}${sub}<div class="a-flujo">${html}</div>${nota}` };
    }
    case 'codigo': {
      const archivo = archivoDe(d);
      return { clase: '', html: `<div class="a-codigo"><div class="a-col">${kicker}${h('h2', 'angosta')}${sub}</div>
        <div class="a-ventana"><div class="a-barra"><i></i><i></i><i></i>${archivo ? `<span>${esc(archivo)}</span>` : ''}</div>
        <pre class="codigo">${resaltarCodigo(d.codigo)}</pre></div></div>${nota}` };
    }
    case 'comparacion': {
      const lado = (x, oscura) => {
        const ico = elegirIcono(x && x.icono, x && x.titulo, x && x.texto);
        return `<div class="tarjeta${oscura ? ' oscura' : ''}"><div class="a-lado-cab"><span class="num">${esc(x && x.etiqueta)}</span>
          ${ico ? `<span class="a-tile chico">${svg(ico)}</span>` : ''}</div><h3>${conAcento(x && x.titulo)}</h3><p>${conAcento(x && x.texto)}</p></div>`;
      };
      return { clase: '', html: `${kicker}${h('h2', 'ancho')}${sub}<div class="a-comp">${lado(d.izq)}<div class="a-vs">VS</div>${lado(d.der, true)}</div>${nota}` };
    }
    case 'tarjetas': {
      const ts = tarjetas.slice(0, 4);
      if (v === 'iconos') {
        const grandes = ts.map(x => `<div class="tarjeta"><span class="a-tile a-tile-g">${svg(elegirIcono(x.icono, x.titulo, x.texto) || 'estrella')}</span>
          <h3>${conAcento(x.titulo)}</h3>${x.texto ? `<p>${conAcento(x.texto)}</p>` : ''}</div>`).join('');
        return { clase: '', html: `${kicker}${h('h2', 'ancho')}${sub}<div class="a-tarjetas a-tarj-i" style="--n:${Math.max(1, ts.length)}">${grandes}</div>${nota}` };
      }
      const html = ts.map((x, i) => {
        const ico = elegirIcono(x.icono, x.titulo, x.texto);
        const ultima = i === ts.length - 1 && ts.length > 1;
        return `<div class="tarjeta${ultima ? ' oscura' : ''}"><div class="a-tarj-cab">${ico ? `<span class="a-tile chico">${svg(ico)}</span>` : '<span></span>'}
          <span class="num">${String(i + 1).padStart(2, '0')}</span></div><h3>${conAcento(x.titulo)}</h3>${x.texto ? `<p>${conAcento(x.texto)}</p>` : ''}</div>`;
      }).join('');
      return { clase: '', html: `${kicker}${h('h2', 'ancho')}${sub}<div class="a-tarjetas" style="--n:${Math.max(1, ts.length)}">${html}</div>${nota}` };
    }
    case 'ruta': {
      const ops = items.slice(0, 5);
      const n = ops.length;
      const pos = posCursor(Math.max(0, n - 1));
      return { clase: '', html: `<div class="a-2col ancha"><div class="a-col">${kicker}${h('h2', 'media')}${sub}</div>
        <div class="a-app"><div class="a-barra"><i></i><i></i><i></i><span>${esc(d.app || 'Aplicación')}</span></div>
        <div class="a-menu">${ops.map((x, i) => `<div class="a-op" ${i === n - 1 ? 'data-on="1"' : 'data-ok="1"'}><b>${i + 1}</b><span>${esc(x.texto)}</span>
          <svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></div>`).join('')}</div>
        <svg class="a-cursor" viewBox="0 0 24 24" aria-hidden="true" style="transform:translate(${pos.x}px,${pos.y}px)"><path d="M5 3l14 7-6 2-2 6z"/></svg></div></div>${nota}` };
    }
    case 'dato': {
      const n = largo(d.dato);
      const clase = n >= 9 ? 'l9' : n >= 6 ? 'l6' : n >= 4 ? 'l4' : '';
      if (v === 'gigante') {
        return { clase: '', html: `<div class="a-dato-g"><div class="a-cifra-g"><div class="auto-dato ${clase}">${conAcento(d.dato)}</div><i class="a-barra-dato"></i></div>
          <div class="a-col">${kicker}${h('h2', 'media')}${sub}</div></div>${nota}` };
      }
      return { clase: '', html: `<div class="a-dato"><div class="a-cifra"><svg viewBox="0 0 460 460" aria-hidden="true"><circle class="fondo" cx="230" cy="230" r="200"/>
        <circle class="arco" cx="230" cy="230" r="200"/></svg><div class="auto-dato ${clase}">${conAcento(d.dato)}</div></div>
        <div class="a-col">${kicker}${h('h2', 'media')}${sub}</div></div>${nota}` };
    }
    case 'cierre': {
      const { items: puntos, reto } = partesCierre(d);
      const checks = puntos.map(x => `<div class="a-check"><i>${svg('check')}</i><span>${conAcento(x.texto)}</span></div>`).join('');
      const desp = d.despedida ? `<div class="auto-despedida">${esc(d.despedida)}</div>` : '';
      if (v === 'tablero') {
        const cols = puntos.length === 3 ? 3 : 2;
        return { clase: '', html: `${kicker}${h('h2', 'ancho')}${sub}<div class="a-tablero" style="--c:${cols}">${checks.replace(/class="a-check"/g, 'class="a-check a-check-t"')}</div>
          ${reto ? `<div class="a-reto a-reto-barra"><span class="a-reto-k">${svg('objetivo')}Tu reto</span><p>${conAcento(reto)}</p></div>` : ''}${desp}${nota}` };
      }
      // sin reto, a la derecha va el visual grande (trofeo): la diapositiva no queda vacia
      const derecha = reto ? `<div class="a-reto"><span class="a-reto-k">${svg('objetivo')}Tu reto</span><p>${conAcento(reto)}</p></div>`
        : `<div class="a-visual"><i class="a-anillo"></i><i class="a-anillo dos"></i><div class="a-disco verde">${svg(elegirIcono(d.icono) || 'trofeo')}</div></div>`;
      return { clase: '', html: `<div class="a-cierre${reto ? '' : ' visual'}"><div class="a-col">${kicker}${h('h2', 'media')}
        ${sub}${checks ? `<div class="a-checks">${checks}</div>` : ''}</div>${derecha}</div>${desp}${nota}` };
    }
    default:
      return { clase: '', html: `${kicker}${h('h2', 'ancho')}${sub}${nota}` };
  }
}

// Donde queda la punta del cursor sobre la opcion i del menu de "ruta" (filas de alto fijo: barra 54 + margen 26 + 92 por fila)
function posCursor(i) {
  return { x: 400, y: 54 + 26 + i * 92 + 30 };
}

// ---------------------------------------------------------------- animacion en la linea de tiempo del video
export function construirAuto({ b, p, u, tl, gsap, clase, tiempos, archivo, logo = '' }) {
  u.estilo(ESTILO_AUTO);

  const lista = clase.diapositivas || [];
  const ids = clase.bloques.map(x => x.id);
  const texto = id => (clase.bloques.find(x => x.id === id) || {}).texto || '';
  // segundo en que aparece un elemento: la palabra "cuando" (sin importar tildes ni mayusculas) o escalonado en el bloque
  const momento = (bloque, cuando, i, n, desde = 0.12) => {
    const t = plano(texto(bloque));
    const k = cuando ? t.indexOf(plano(cuando)) : -1;
    if (k >= 0) return b(bloque, k / t.length);
    return b(bloque, Math.min(0.85, desde + (i / Math.max(1, n)) * 0.7));
  };

  // en ruta, pasos y flujo el orden importa: si la voz nombra un paso antes que el anterior, se corre un poco despues
  const enOrden = (bloque, lista) => lista.reduce((ts, t, i) => [...ts, i ? Math.min(Math.max(t, ts[i - 1] + 0.6), b(bloque, 0.97)) : t], []);
  const bloqueDe = (d, k) => (ids.includes(d.bloque) ? d.bloque : ids[Math.min(k, ids.length - 1)]);
  const inicios = lista.map((d, k) => (k === 0 ? 0 : b(bloqueDe(d, k))));

  const diseno = elegirDiseno(clase);
  lista.forEach((d, k) => {
    const bloque = bloqueDe(d, k);
    const t0 = inicios[k];
    const items = (d.items || []).filter(x => x && x.texto);
    const tarjetas = (d.tarjetas || []).filter(lleno);
    if (d.tipo === 'imagen') return lamina(d, k, bloque, t0);
    const { html, clase: extra } = htmlDiapo(d, { logo, institucion: clase.institucion, estilo: diseno.estilo, variante: diseno.variantes[k], indice: k, tinte: diseno.tinte });
    const s = u.diapo(html, { clase: extra });
    u.mostrar(s, t0);
    const $ = sel => u.$(s, sel);
    const $$ = sel => u.$$(s, sel);
    const kicker = $('.kicker');
    const sub = $('.sub, .a-def-texto');
    const entradaTitulo = (dt = 0.25) => {
      if (kicker) u.entrar(kicker, t0 + 0.2);
      const t = $('.titulo');
      if (t) u.letras(t, t0 + dt);
    };

    switch (d.tipo) {
      case 'portada':
        if ($('.a-visual')) u.entrar($('.a-visual'), t0 + 0.1, { y: 0, escala: 0.88, desenfoque: 20, dur: 1.2 });
        if ($$('.a-orbita').length) u.entrar($$('.a-orbita'), t0 + 0.9, { y: 24, escala: 0.6, stagger: 0.18 });
        if ($('.a-panel')) { gsap.set($('.a-panel'), { xPercent: 100 }); tl.to($('.a-panel'), { xPercent: 0, duration: 0.9, ease: 'power3.out' }, t0 + 0.05); }
        if ($('.a-panel-ico')) u.entrar($('.a-panel-ico'), t0 + 0.6, { y: 0, escala: 0.7, desenfoque: 12 });
        if ($$('.a-panel-lista span').length) u.entrar($$('.a-panel-lista span'), t0 + 1, { x: 20, y: 0, stagger: 0.15 });
        if ($('.a-marca-agua')) u.entrar($('.a-marca-agua'), t0 + 0.1, { y: 0, escala: 0.8, desenfoque: 30, dur: 1.6 });
        if ($('.a-tipo-pie')) u.entrar($('.a-tipo-pie'), momento(bloque, null, 1, 3, 0.3), { y: 20, desenfoque: 0 });
        entradaTitulo(0.35);
        if (sub && !$('.a-tipo-pie')) u.entrar(sub, momento(bloque, null, 1, 3, 0.25));
        if ($$('.chip').length) u.entrar($$('.chip'), momento(bloque, null, 2, 3, 0.25), { stagger: 0.1, y: 20 });
        break;
      case 'pregunta':
        u.entrar($('.a-q'), t0 + 0.15, { y: 40, escala: 0.7, desenfoque: 16, dur: 1 });
        entradaTitulo(0.4);
        if (sub) u.entrar(sub, b(bloque, 0.35));
        break;
      case 'idea':
        entradaTitulo();
        if ($('.a-visual')) u.entrar($('.a-visual'), t0 + 0.45, { y: 0, escala: 0.85, desenfoque: 16, dur: 1 });
        if ($('.a-comillas')) u.entrar($('.a-comillas'), t0 + 0.1, { y: 30, escala: 0.7, desenfoque: 10 });
        if ($('.a-banda-idea')) { gsap.set($('.a-banda-idea'), { scaleX: 0, transformOrigin: 'left center' }); tl.to($('.a-banda-idea'), { scaleX: 1, duration: 0.7, ease: 'power3.out' }, t0 + 0.05); }
        if (sub) u.entrar(sub, b(bloque, 0.3));
        break;
      case 'definicion':
        if (kicker) u.entrar(kicker, t0 + 0.2);
        u.entrar($('.a-def'), t0 + 0.25, { y: 30, desenfoque: 0 });
        if ($('.titulo')) u.letras($('.titulo'), t0 + 0.5);
        if ($('.a-def .a-tile, .a-dicc .a-tile')) u.entrar($('.a-def .a-tile, .a-dicc .a-tile'), t0 + 0.8, { y: 0, escala: 0.6 });
        if (sub) u.entrar(sub, b(bloque, 0.22));
        if ($$('.chip').length) u.entrar($$('.chip'), momento(bloque, items[0] && items[0].cuando, 0, 1, 0.55), { stagger: 0.12, y: 16 });
        break;
      case 'temario':
        entradaTitulo();
        if (sub) u.entrar(sub, t0 + 0.6);
        $$('.a-tema').forEach((el, i) => u.entrar(el, momento(bloque, items[i].cuando, i, Math.min(8, items.length)), { y: 18 }));
        break;
      case 'logo':
        // sin desenfoque: u.entrar le pondria su propio "filter" y borraria el que invierte el logo en el estilo Noche
        gsap.set($('.a-final-logo, .a-final-marca'), { autoAlpha: 0, scale: 0.9 });
        tl.to($('.a-final-logo, .a-final-marca'), { autoAlpha: 1, scale: 1, duration: 1.1, ease: 'power3.out' }, t0 + 0.15);
        gsap.set($('.a-final-linea'), { scaleX: 0 });
        tl.to($('.a-final-linea'), { scaleX: 1, duration: 0.6, ease: 'power2.out' }, t0 + 0.8);
        u.entrar($('.a-final-desp'), t0 + 1, { y: 20 });
        if ($('.a-final-firma')) u.entrar($('.a-final-firma'), t0 + 1.4, { y: 10 });
        break;
      case 'lista':
        entradaTitulo();
        if (sub) u.entrar(sub, t0 + 0.6);
        $$('.a-fila').forEach((el, i) => u.entrar(el, momento(bloque, items[i].cuando, i, items.length), { x: 30, y: 0 }));
        break;
      case 'pasos': {
        entradaTitulo();
        if (sub) u.entrar(sub, t0 + 0.6);
        const pasos = $$('.a-paso');
        const linea = $('.a-pasos-linea i');
        if (linea) gsap.set(linea, { scaleX: 0 });
        const ts = enOrden(bloque, pasos.map((_, i) => momento(bloque, items[i].cuando, i, pasos.length)));
        pasos.forEach((el, i) => {
          const t = ts[i];
          u.entrar(el, t, { y: 30 });
          if (linea && i) tl.to(linea, { scaleX: i / (pasos.length - 1), duration: 0.5, ease: 'power2.inOut' }, t - 0.15);
        });
        break;
      }
      case 'flujo': {
        entradaTitulo();
        if (sub) u.entrar(sub, t0 + 0.6);
        const flechas = $$('.a-flecha path');
        const nodos = $$('.a-nodo');
        const ts = enOrden(bloque, nodos.map((_, i) => momento(bloque, tarjetas[i].cuando, i, tarjetas.length)));
        nodos.forEach((el, i) => {
          const t = ts[i];
          if (i && flechas[i - 1]) u.dibujar(flechas[i - 1], t - 0.35, { dur: 0.4 });
          u.entrar(el, t, { y: 30, escala: 0.96 });
        });
        break;
      }
      case 'tarjetas':
        entradaTitulo();
        if (sub) u.entrar(sub, t0 + 0.6);
        $$('.a-tarjetas .tarjeta').forEach((el, i) => u.entrar(el, momento(bloque, tarjetas[i].cuando, i, tarjetas.length), { y: 40 }));
        break;
      case 'comparacion': {
        entradaTitulo();
        if (sub) u.entrar(sub, t0 + 0.6);
        const [a, z] = $$('.a-comp .tarjeta');
        const ta = momento(bloque, d.izq && d.izq.cuando, 0, 2);
        const tz = Math.max(ta + 0.5, momento(bloque, d.der && d.der.cuando, 1, 2));
        u.entrar(a, ta, { x: -30, y: 0 });
        u.entrar($('.a-vs'), (ta + tz) / 2, { y: 0, escala: 0.4, desenfoque: 0 });
        u.entrar(z, tz, { x: 30, y: 0 });
        break;
      }
      case 'codigo': {
        entradaTitulo();
        u.entrar($('.a-ventana'), t0 + 0.3, { y: 20, desenfoque: 0 });
        const largoCodigo = String(d.codigo || '').replace(/\s/g, '').length || 1;
        const disponible = Math.max(2, (b(bloque, 1) - b(bloque)) * 0.6);
        u.teclear($('.codigo'), t0 + 0.6, { cps: Math.max(25, Math.min(90, largoCodigo / disponible)) });
        if (sub) u.entrar(sub, b(bloque, 0.5));
        break;
      }
      case 'ruta': {
        entradaTitulo();
        if (sub) u.entrar(sub, t0 + 0.6);
        u.entrar($('.a-app'), t0 + 0.3, { y: 30, desenfoque: 0 });
        const ops = $$('.a-op');
        const cursor = $('.a-cursor');
        gsap.set(ops, { attr: { 'data-on': '0', 'data-ok': '0' } });
        const inicio = posCursor(ops.length);
        gsap.set(cursor, { x: inicio.x + 60, y: inicio.y + 20, autoAlpha: 0 });
        const ts = enOrden(bloque, ops.map((_, i) => momento(bloque, items[i].cuando, i, ops.length)));
        ops.forEach((el, i) => {
          const t = ts[i];
          const { x, y } = posCursor(i);
          u.entrar(el, t - 0.45, { x: 20, y: 0, desenfoque: 0, dur: 0.4 });
          tl.to(cursor, { x, y, autoAlpha: 1, duration: 0.5, ease: 'power2.inOut' }, t - 0.5);
          tl.to(cursor, { scale: 0.82, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.inOut' }, t);
          if (i) u.activar(ops[i - 1], t, 'on', '0');
          if (i) u.activar(ops[i - 1], t, 'ok', '1');
          u.activar(el, t, 'on', '1');
        });
        break;
      }
      case 'dato': {
        if (kicker) u.entrar(kicker, t0 + 0.2);
        if ($('.a-cifra .arco')) u.dibujar($('.a-cifra .arco'), t0 + 0.2, { dur: 1.4 });
        if ($('.a-barra-dato')) { gsap.set($('.a-barra-dato'), { scaleX: 0 }); tl.to($('.a-barra-dato'), { scaleX: 1, duration: 0.8, ease: 'power2.out' }, t0 + 0.9); }
        const cifra = $('.auto-dato');
        u.entrar(cifra, t0 + 0.3, { escala: 0.85, y: 0 });
        if (/^\d{1,4}$/.test(String(d.dato).trim()) && +d.dato > 9) u.contar(cifra, t0 + 0.3, +d.dato, { dur: 1.3 });
        if ($('.titulo')) u.entrar($('.titulo'), b(bloque, 0.3));
        if (sub) u.entrar(sub, b(bloque, 0.5));
        break;
      }
      case 'cierre': {
        entradaTitulo();
        const { items: puntos } = partesCierre(d);
        $$('.a-check').forEach((el, i) => u.entrar(el, momento(bloque, puntos[i] && puntos[i].cuando, i, puntos.length + 1), { x: -24, y: 0 }));
        const reto = $('.a-reto');
        if (reto) u.entrar(reto, Math.min(b(bloque, 0.8), momento(bloque, 'reto', puntos.length, puntos.length + 1)), { x: 30, y: 0 });
        else if ($('.a-visual')) u.entrar($('.a-visual'), t0 + 0.5, { y: 0, escala: 0.85, desenfoque: 16, dur: 1 });
        if ($('.auto-despedida')) u.entrar($('.auto-despedida'), b(bloque, 0.85), { escala: 0.9 });
        break;
      }
      default: // idea sin visual (tipos desconocidos)
        entradaTitulo();
        if (sub) u.entrar(sub, b(bloque, 0.3));
    }
    const nota = $(':scope > .nota');
    if (nota) u.entrar(nota, b(bloque, 0.75), { y: 10 });
  });

  // la lamina entera (sin recortar) sobre un fondo desenfocado de si misma, con un acercamiento lento mientras dura.
  // "efectos" (los propone la IA que lee la lamina; caja en % de la imagen) aparecen cuando la voz los nombra:
  //   numero = enumera un punto y lo enmarca · foco = enmarca y oscurece lo demas · resaltar = plumon · zoom = acerca
  function lamina(d, k, bloque, t0) {
    const src = archivo(d.imagen || '');
    const fin = k + 1 < inicios.length ? inicios[k + 1] : tiempos.total;
    const efs = (d.efectos || []).filter(e => e && Array.isArray(e.caja) && e.caja.length === 4)
      .map((e, i, todos) => ({ ...e, t: momento(ids.includes(e.bloque) ? e.bloque : bloque, e.cuando, i, todos.length, 0.15) }))
      .sort((a, z) => a.t - z.t);
    const pos = ([x, y, w, h]) => ({ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` });
    let n = 0;
    const capas = efs.map((e, i) => (e.tipo === 'numero' ? `<b class="lamina-num" data-e="${i}" style="left:${e.caja[0]}%;top:${e.caja[1] + e.caja[3] / 2}%">${++n}</b>`
      : e.tipo === 'resaltar' ? `<i class="lamina-resalta" data-e="${i}"></i>` : '')).join('');
    const focos = efs.filter(e => e.tipo === 'foco' || e.tipo === 'numero');
    const s = u.diapo(`<img class="lamina-fondo" src="${esc(src)}" alt="">
      <div class="lamina-kb"><div class="lamina-zoom"><img class="lamina-img" src="${esc(src)}" alt="" data-lamina="${esc(d.imagen)}">
      ${focos.length ? '<div class="lamina-foco"></div>' : ''}${capas}</div></div>`, { clase: 'lamina' });
    u.mostrar(s, t0);
    const kb = u.$(s, '.lamina-kb');
    gsap.set(kb, { scale: 1, transformOrigin: '50% 50%' });
    tl.to(kb, { scale: 1.035, duration: Math.max(1, fin - t0), ease: 'none' }, t0);
    // el foco salta de zona en zona (se oculta mientras hay un zoom y vuelve en el punto siguiente)
    const foco = focos.length ? u.$(s, '.lamina-foco') : null;
    if (foco) {
      gsap.set(foco, { autoAlpha: 0, ...pos(focos[0].caja) });
      tl.to(foco, { autoAlpha: 1, duration: 0.35 }, focos[0].t);
      focos.slice(1).forEach(e => tl.to(foco, { ...pos(e.caja), autoAlpha: 1, duration: 0.45, ease: 'power2.inOut' }, e.t));
    }
    efs.forEach((e, i) => {
      if (e.tipo === 'numero') u.entrar(u.$(s, `.lamina-num[data-e="${i}"]`), e.t, { y: 0, escala: 0.4 });
      if (e.tipo === 'resaltar') {
        const el = u.$(s, `.lamina-resalta[data-e="${i}"]`);
        gsap.set(el, { ...pos(e.caja), scaleX: 0 });
        tl.to(el, { scaleX: 1, duration: 0.55, ease: 'power2.out' }, e.t);
      }
      if (e.tipo === 'zoom') {
        // acerca hasta que la zona ocupe ~3/4 de la lamina y vuelve antes del siguiente efecto
        const [x, y, w, h] = e.caja;
        const z = Math.max(1.3, Math.min(2.4, 75 / w, 75 / h));
        const cx = x + w / 2 - 50;
        const cy = y + h / 2 - 50;
        const zona = u.$(s, '.lamina-zoom');
        const vuelta = Math.min(efs[i + 1] ? efs[i + 1].t - 0.1 : fin - 0.6, e.t + 5);
        gsap.set(zona, { transformOrigin: '50% 50%' });
        if (foco) tl.to(foco, { autoAlpha: 0, duration: 0.3 }, e.t);
        tl.to(zona, { scale: z, xPercent: -cx * z, yPercent: -cy * z, duration: 0.8, ease: 'power2.inOut' }, e.t);
        if (vuelta > e.t + 1) tl.to(zona, { scale: 1, xPercent: 0, yPercent: 0, duration: 0.7, ease: 'power2.inOut' }, vuelta);
      }
    });
  }
}
