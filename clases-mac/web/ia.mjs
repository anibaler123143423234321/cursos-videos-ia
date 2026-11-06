// Genera el guion y las diapositivas (plantillas) de una clase a partir de la ficha del docente.
// Modos: "manual" (el docente pega su guion, sin IA), "gratis" (API compatible con OpenAI: Groq,
// Ollama, OpenRouter...) y "claude" (API de Anthropic, de pago por uso).
// Con LAMINAS (imagenes de las diapositivas del docente) la IA las mira y escribe lo que dice la voz en cada una.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TIPOS as TIPOS_MOTOR, NOMBRES_ICONOS } from '../motor/diapos-auto.js';

export const TIPOS = TIPOS_MOTOR.filter(t => t !== 'imagen');
const TIPOS_VALIDOS = TIPOS_MOTOR; // "imagen" = una lamina subida; la IA no la elige
const texto = e => String((e && e.message) || e);
export const rutaLamina = v => (/^laminas\/\d{2}\.(jpg|png|webp)$/.test(String(v || '')) ? String(v) : '');

// ---------------------------------------------------------------- prompt (skills)
// Las guias que lee la IA estan en web/skills/*.md y las mejora el equipo. Se leen en cada pedido: una mejora se usa
// en la siguiente clase sin reiniciar la web. Las notas <!-- ... --> son para el equipo y no se envian a la IA.
const DIR_SKILLS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'skills');
function skill(nombre, vars = {}) {
  const t = fs.readFileSync(path.join(DIR_SKILLS, `${nombre}.md`), 'utf8');
  const todas = { ICONOS: NOMBRES_ICONOS.join(', '), ...vars };
  return t.replace(/<!--[\s\S]*?-->/g, '').replace(/\{\{(\w+)\}\}/g, (m, k) => (k in todas ? todas[k] : m)).trim();
}

// Clases modelo ya revisadas (web/skills/ejemplos/*.json). En cada pedido se le muestra a la IA la mas parecida al
// tema (por curso, tema y palabras clave): los modelos gratis imitan un ejemplo completo mucho mejor que una regla.
const DIR_EJEMPLOS = path.join(DIR_SKILLS, 'ejemplos');
export function ejemploPara(ficha) {
  let lista = [];
  try {
    lista = fs.readdirSync(DIR_EJEMPLOS).filter(f => f.endsWith('.json')).sort()
      .map(f => { try { return JSON.parse(fs.readFileSync(path.join(DIR_EJEMPLOS, f), 'utf8')); } catch { return null; } })
      .filter(e => e && Array.isArray(e.bloques) && Array.isArray(e.diapositivas));
  } catch { /* sin carpeta de ejemplos */ }
  const palabras = t => new Set(planoTxt(t).match(/[a-z0-9ñ]{4,}/g) || []);
  const buscadas = palabras([ficha.tema, ficha.curso, ficha.modulo, ficha.puntos].join(' '));
  let mejor = lista.find(e => e.predeterminado) || lista[0] || null; // si ninguno se parece al tema
  let puntos = 0;
  for (const e of lista) {
    const p = [...palabras([e.tema, e.curso, e.centro, ...(e.palabras || [])].join(' '))].filter(w => buscadas.has(w)).length;
    if (p > puntos) { mejor = e; puntos = p; }
  }
  return mejor;
}
const guionDeEjemplo = e => (e ? `EJEMPLO DE GUION YA REVISADO (otra clase: ${e.curso} · ${e.tema}). Imita su estructura, su tono, su largo y lo concreto que es; no copies su contenido:
${e.bloques.map(b => `${b.id} [${b.parte}] ${b.texto}`).join('\n')}` : '');
const diapositivasDeEjemplo = e => (e ? { EJEMPLO_TEMA: `${e.curso} · ${e.tema}`, EJEMPLO: `{"diapositivas": [\n${e.diapositivas.map(d => ` ${JSON.stringify(d)}`).join(',\n')}\n]}` }
  : { EJEMPLO_TEMA: 'sin ejemplo', EJEMPLO: '' });
const INTRO = () => skill('rol');
const REGLAS_PLAN = () => skill('agenda');
const REGLAS_GUION = () => `${skill('guion')}\n${REGLAS_PLAN()}`;
const REGLAS_DIAPOS = ficha => skill('diapositivas', diapositivasDeEjemplo(ejemploPara(ficha || {})));
const REGLAS_LAMINAS = () => skill('laminas'); // incluye los efectos

const CAJA_CLAUDE = `- "caja": [x1, y1, x2, y2] del elemento, de 0 a 1000 sobre el cuadrado blanco (0,0 = arriba a la izquierda;
  1000,1000 = abajo a la derecha). Debe encerrar el elemento completo, con poco margen.`;
const FORMATO_LAMINA = `Responde SOLO con un objeto JSON, sin texto antes ni después:
{"titulo": "el título tal como se lee en la lámina", "texto": "lo que dice la voz", "pronunciacion": [{"escrito": "CSS", "dice": "ce ese ese"}],
 "efectos": [{"tipo": "foco", "que": "fila 1: Gmail en el entorno académico", "cuando": "entorno académico"}]}`;
const TIPOS_EFECTO = ['numero', 'foco', 'resaltar', 'zoom'];
// Segundo paso, solo para ubicar: la IA es mucho mas precisa si no tiene que escribir el guion a la vez.
const PEDIDO_CAJAS = lista => `Ubica en la imagen cada uno de estos elementos:
${lista.map((e, k) => `${k + 1}. ${e.que}`).join('\n')}
Para cada uno da su caja [x1, y1, x2, y2] en escala de 0 a 1000 (0,0 = arriba a la izquierda de la imagen; 1000,1000 = abajo
a la derecha). Encierra el elemento completo. La lámina va arriba a la izquierda de un cuadrado blanco.
Responde SOLO JSON: {"cajas": [{"n": 1, "caja": [x1, y1, x2, y2]}]}`;

// La IA ve la lamina dentro de un cuadrado blanco (ver laminasCuadradas), asi sus cajas de 0 a 1000 tienen la misma
// escala en los dos ejes. Caja [x1, y1, x2, y2] del cuadrado -> [x, y, ancho, alto] en % de la lamina real (w x h).
// Las raras (diminutas, fuera de la lamina o casi toda la lamina) se descartan.
function cajaDe(c, w = 1, h = 1) {
  if (!Array.isArray(c) || c.length !== 4 || !c.every(v => Number.isFinite(+v))) return null;
  const lado = Math.max(w, h);
  let [x1, y1, x2, y2] = c.map(v => Math.max(0, Math.min(1000, +v)) / 10);
  [x1, x2] = [x1, x2].map(v => Math.min(100, (v * lado) / w));
  [y1, y2] = [y1, y2].map(v => Math.min(100, (v * lado) / h));
  if (x2 < x1) [x1, x2] = [x2, x1];
  if (y2 < y1) [y1, y2] = [y2, y1];
  const an = x2 - x1, al = y2 - y1;
  if (an < 2 || al < 2 || an * al > 6000) return null;
  const r = v => Math.round(v * 10) / 10;
  return [r(x1), r(y1), r(an), r(al)];
}
function efectosDe(lista, w, h) {
  return (Array.isArray(lista) ? lista : [])
    .map(e => ({ tipo: TIPOS_EFECTO.includes(e && e.tipo) ? e.tipo : 'foco', caja: cajaDe(e && e.caja, w, h), cuando: corto(e && e.cuando, 40) }))
    .filter(e => e.caja).slice(0, 6);
}
// IA gratis: con lo que quiere senalar ("que"), una peticion aparte le pide solo las cajas
async function ubicar(pedir, url, lista, w, h) {
  const pedidos = (Array.isArray(lista) ? lista : []).filter(e => e && String(e.que || '').trim()).slice(0, 6)
    .map(e => ({ tipo: TIPOS_EFECTO.includes(e.tipo) ? e.tipo : 'foco', que: corto(e.que, 120), cuando: corto(e.cuando, 40) }));
  if (!pedidos.length) return [];
  try {
    const { datos } = await pedir('Ubicas elementos en imágenes con precisión.', [{ type: 'text', text: PEDIDO_CAJAS(pedidos) }, { type: 'image_url', image_url: { url } }]);
    const cajas = Array.isArray(datos.cajas) ? datos.cajas : [];
    return pedidos.map((e, k) => {
      const c = cajas.find(x => x && +x.n === k + 1) || cajas[k];
      return { tipo: e.tipo, caja: cajaDe(c && c.caja, w, h), cuando: e.cuando };
    }).filter(e => e.caja);
  } catch (err) {
    console.warn(`[!] No se pudieron ubicar los efectos de una lámina (${texto(err).slice(0, 120)}): queda sin efectos.`);
    return [];
  }
}

// Cada lamina dentro de un cuadrado blanco (arriba a la izquierda), de hasta 1280 px, para la IA con vision.
// Sin esto, el modelo gratis mide el alto con la escala del ancho y las cajas caen corridas hacia arriba.
// Lo dibuja el Chromium de Playwright, el mismo que usa el motor para los videos.
async function laminasCuadradas(dir, laminas) {
  const { chromium } = await import('playwright');
  const nav = await chromium.launch();
  try {
    const pag = await nav.newPage();
    const res = [];
    for (const rel of laminas) {
      const fuente = `data:${MIME[path.extname(rel)]};base64,${leerLamina(dir, rel)}`;
      res.push(await pag.evaluate(async src => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const w = img.naturalWidth, h = img.naturalHeight;
        const k = Math.min(1, 1280 / Math.max(w, h));
        const c = document.createElement('canvas');
        c.width = c.height = Math.round(Math.max(w, h) * k);
        const g = c.getContext('2d');
        g.fillStyle = '#fff';
        g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, w * k, h * k);
        return { url: c.toDataURL('image/jpeg', 0.9), w, h };
      }, fuente));
    }
    return res;
  } finally {
    await nav.close();
  }
}

// Siglas frecuentes en los cursos y como se dicen en espanol. Ganan sobre lo que proponga la IA: los modelos
// gratis a veces las escriben en ingles ("aitch ti ti pi") y la voz las diria mal.
const PRONUNCIACION_BASE = {
  HTML: 'hache te eme ele', HTML5: 'hache te eme ele cinco', CSS: 'ce ese ese', HTTP: 'hache te te pe', HTTPS: 'hache te te pe ese',
  DNS: 'de ene ese', IP: 'i pe', URL: 'u erre ele', API: 'a pe i', JSON: 'yeison', SQL: 'ese cu ele', PHP: 'pe hache pe',
  JavaScript: 'yavascript', JS: 'jota ese', W3C: 'doble u tres ce', USS: 'u ese ese', 'uss.edu.pe': 'u ese ese punto edu punto pe',
  F12: 'efe doce', GET: 'guet', PDF: 'pe de efe', UX: 'u equis', UI: 'u i', SEO: 'seo', WWW: 'doble u doble u doble u',
  SIPANCITOBOT: 'sipancitobot', Gmail: 'yi meil', Gemini: 'yéminai', Word: 'uord', Excel: 'éksel', PowerPoint: 'páuer póint',
  Office: 'ófis', Microsoft: 'maicrosoft', Canva: 'canva', Teams: 'tims', Outlook: 'áutluk', Zoom: 'zum', ChatGPT: 'chat yi pi ti', Google: 'gúgol', Workspace: 'uórkspeis', Drive: 'draiv', Classroom: 'clásrum',
};
export function pronunciacionBase(clase) {
  const texto = clase.bloques.map(b => b.texto).join(' ');
  // se quita lo que la IA propuso para palabras que la voz no dice ("AI" en una clase sin "AI") o que no cambia nada
  for (const [escrito, dice] of Object.entries(clase.pronunciacion)) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escrito.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u');
    if (!re.test(texto) || dice.trim().toLowerCase() === escrito.trim().toLowerCase()) delete clase.pronunciacion[escrito];
  }
  const base = Object.fromEntries(Object.entries(PRONUNCIACION_BASE).map(([k, v]) => [k.toLowerCase(), v]));
  for (const url of new Set(texto.match(/\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|pe|org|net|edu|io|app|dev)\b/gi) || [])) {
    if (!base[url.toLowerCase()]) clase.pronunciacion[url] = url.split('.').map(p => base[p.toLowerCase()] || p).join(' punto ');
  }
  for (const [escrito, dice] of Object.entries(PRONUNCIACION_BASE)) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escrito.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u');
    if (re.test(texto)) clase.pronunciacion[escrito] = dice;
  }
}

// Claude lo hace todo en una sola respuesta (salida estructurada, sin tope corto)
const REGLAS = ficha => `${INTRO()}
Escribe el GUION y las DIAPOSITIVAS (plantillas) de la clase.

${REGLAS_GUION()}

${guionDeEjemplo(ejemploPara(ficha))}

${REGLAS_DIAPOS(ficha)}`;

// La IA gratis trabaja POR PARTES (guion, luego diapositivas) y cada diapositiva lleva solo los campos de su
// tipo: asi cada respuesta es corta. Si aun asi se corta por el tope de tokens, se pide la parte que falta.
const FORMATO_GUION = `Responde SOLO con un objeto JSON, sin texto antes ni después, con esta forma:
{"tema": "...", "agenda": [{"titulo": "...", "desde": "02"}], "pronunciacion": [{"escrito": "CSS", "dice": "ce ese ese"}],
 "bloques": [{"id": "01", "parte": "portada", "texto": "..."}, {"id": "02", "parte": "logro", "texto": "..."}]}\nDentro de los textos no uses comillas dobles: si citas algo, usa «comillas latinas».`;
const FORMATO_SIGUE = `Responde SOLO con un objeto JSON, sin texto antes ni después: {"bloques": [{"id": "07", "parte": "desarrollo", "texto": "..."}]}\nDentro de los textos no uses comillas dobles: si citas algo, usa «comillas latinas».`;

// Estructura de sesion USS (web/skills/guion.md): cada bloque trae su "parte" y algunas partes tienen su diapositiva fija.
// La del cierre (la despedida con el logo al centro) la arma el programa: no se le pide a la IA.
export const PARTES = ['portada', 'logro', 'motivacion', 'temario', 'desarrollo', 'practica', 'conclusiones', 'cierre'];
const TIPO_DE_PARTE = { portada: 'portada', logro: 'definicion', motivacion: 'pregunta', temario: 'temario', practica: 'tarjetas', conclusiones: 'cierre' };
const parteDe = v => { const t = String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); return PARTES.includes(t) ? t : ''; };
const FORMATO_PLAN = `Responde SOLO con un objeto JSON, sin texto antes ni después:
{"agenda": [{"titulo": "...", "desde": "02"}], "pronunciacion": [{"escrito": "CSS", "dice": "ce ese ese"}]}`;
const FORMATO_DIAPOS = `Responde SOLO con un objeto JSON, sin texto antes ni después, con esta forma:
{"diapositivas": [
  {"bloque": "01", "tipo": "portada", "kicker": "...", "titulo": "... *clave*", "sub": "...", "icono": "...", "items": [{"texto": "...", "cuando": ""}]},
  {"bloque": "02", "tipo": "comparacion", "kicker": "...", "titulo": "...", "izq": {"etiqueta": "...", "titulo": "...", "texto": "...", "icono": "...", "cuando": "..."}, "der": {"etiqueta": "...", "titulo": "...", "texto": "...", "icono": "...", "cuando": "..."}},
  {"bloque": "03", "tipo": "ruta", "kicker": "...", "titulo": "...", "app": "...", "items": [{"texto": "...", "cuando": "..."}]},
  {"bloque": "04", "tipo": "codigo", "kicker": "...", "titulo": "...", "sub": "...", "archivo": "estilos.css", "codigo": "p {\n  color: blue;\n}"}]}
En cada diapositiva escribe SOLO los campos que usa su tipo; no pongas campos vacíos.\nDentro de los textos no uses comillas dobles: si citas algo, usa «comillas latinas».`;

// "extension": cuantas palabras y bloques debe tener el guion (los modelos gratis siguen mejor un numero que una regla)
function fichaTexto(ficha, { extension = true } = {}) {
  const f = k => (ficha[k] || '').toString().trim();
  const objetivo = palabrasObjetivo(ficha);
  return [
    'FICHA DE LA CLASE',
    `Nombre del avatar: ${f('avatar') || 'SIPANCITOBOT'}`,
    `Rol del avatar: ${f('rol_avatar') || 'Asistente docente IA'}`,
    `Universidad: ${f('institucion') || 'Universidad Señor de Sipán'}`,
    `Curso: ${f('curso')}`,
    `Módulo: ${f('modulo')}`,
    `Tema: ${f('tema')}`,
    `Nivel: ${f('nivel') || 'Básico'}`,
    `Duración: ${f('duracion') || '2:30'}`,
    `Objetivo de aprendizaje: ${f('objetivo')}`,
    `Puntos que debe cubrir: ${f('puntos')}`,
    `Ejemplo o código a mostrar: ${f('ejemplo')}`,
    `Reto o tarea final: ${f('reto')}`,
    `Notas: ${f('notas')}`,
    extension ? `Extensión del guion: unas ${objetivo} palabras en total (entre ${Math.round(objetivo * 0.95)} y ${Math.round(objetivo * 1.05)}), repartidas en las partes de la sesión.` : '',
  ].filter(Boolean).join('\n');
}
const palabrasObjetivo = ficha => Math.round((segundos(ficha.duracion) || 150) * 2.3);

function pedido(ficha, bloquesFijos) {
  const lineas = [fichaTexto(ficha)];
  if (bloquesFijos) {
    lineas.push('', 'EL GUION YA ESTÁ ESCRITO (abajo). No lo cambies ni lo repitas: devuelve "bloques": [] y crea solo',
      'agenda, pronunciacion y diapositivas (una por bloque, con los mismos id) para estos bloques:', JSON.stringify(bloquesFijos, null, 1));
  }
  return lineas.join('\n');
}

// ---------------------------------------------------------------- esquema (salida estructurada de Claude)
const str = { type: 'string' };
const obj = (props) => ({ type: 'object', properties: props, required: Object.keys(props), additionalProperties: false });
const ICONO = { type: 'string', enum: ['', ...NOMBRES_ICONOS] };
const ITEM = obj({ texto: str, cuando: str, icono: ICONO });
const LADO = obj({ etiqueta: str, titulo: str, texto: str, cuando: str, icono: ICONO });
const TARJETA = obj({ titulo: str, texto: str, cuando: str, icono: ICONO });
const DIAPO = obj({
  bloque: str, tipo: { type: 'string', enum: TIPOS }, kicker: str, titulo: str, sub: str, nota: str, icono: ICONO,
  items: { type: 'array', items: ITEM }, codigo: str, archivo: str, app: str, izq: LADO, der: LADO,
  tarjetas: { type: 'array', items: TARJETA }, dato: str, reto: str, despedida: str,
});
export const ESQUEMA_CLASE = obj({
  tema: str,
  agenda: { type: 'array', items: obj({ titulo: str, desde: str }) },
  pronunciacion: { type: 'array', items: obj({ escrito: str, dice: str }) },
  bloques: { type: 'array', items: obj({ id: str, parte: { type: 'string', enum: ['', ...PARTES] }, texto: str }) },
  diapositivas: { type: 'array', items: DIAPO },
});
// con laminas: un texto por lamina, en orden ("desde" de la agenda = numero de lamina con dos digitos)
const EFECTO = obj({ tipo: { type: 'string', enum: ['numero', 'foco', 'resaltar', 'zoom'] }, que: str, caja: { type: 'array', items: { type: 'number' } }, cuando: str });
const ESQUEMA_LAMINAS = obj({
  tema: str,
  agenda: { type: 'array', items: obj({ titulo: str, desde: str }) },
  pronunciacion: { type: 'array', items: obj({ escrito: str, dice: str }) },
  laminas: { type: 'array', items: obj({ titulo: str, texto: str, efectos: { type: 'array', items: EFECTO } }) },
});

// ---------------------------------------------------------------- proveedores
async function conClaude(ficha, bloquesFijos, env) {
  return claudeJson(env, `${REGLAS(ficha)}\n- Rellena con "" o [] los campos que no use el tipo elegido.`, pedido(ficha, bloquesFijos), ESQUEMA_CLASE);
}

// Una peticion a Claude con salida JSON segun el esquema. "contenido" puede llevar imagenes (laminas).
async function claudeJson(env, sistema, contenido, esquema) {
  if (!env.ANTHROPIC_API_KEY) throw new Error('Falta la API key de Claude (Ajustes).');
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const stream = client.beta.messages.stream({
      model: env.CLAUDE_MODELO || 'claude-opus-5-5',
      max_tokens: 64000,
      // si un filtro de seguridad rechaza la peticion, la API la reintenta con el modelo recomendado
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: esquema } },
      system: sistema,
      messages: [{ role: 'user', content: contenido }],
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') throw new Error('Claude no quiso generar esta clase (filtro de seguridad). Cambia la ficha e intenta de nuevo.');
    if (msg.stop_reason === 'max_tokens') throw new Error('La respuesta de Claude quedó incompleta. Intenta de nuevo.');
    const t = msg.content.filter(c => c.type === 'text').map(c => c.text).join('');
    return { datos: JSON.parse(t), uso: msg.usage };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw new Error('La API key de Claude no es válida (Ajustes).');
    if (e instanceof Anthropic.PermissionDeniedError) throw new Error('Tu cuenta de Claude no tiene permiso para este modelo.');
    if (e instanceof Anthropic.RateLimitError) throw new Error('Claude está limitando las peticiones: espera un minuto e intenta de nuevo.');
    if (e instanceof Anthropic.APIError) throw new Error(`Claude respondió con error ${e.status}: ${e.message}`);
    throw e;
  }
}

// ---------------------------------------------------------------- IA gratis por partes
const dormir = ms => new Promise(r => setTimeout(r, ms));
const contarPalabras = bloques => bloques.reduce((t, b) => t + String(b.texto).split(/\s+/).filter(Boolean).length, 0);
const dosDigitos = n => String(n).padStart(2, '0');

async function conIaGratis(ficha, bloquesFijos, env) {
  const usos = [];
  const pedir = clienteGratis(env, usos);
  // 1) guion (o el del docente) con agenda y pronunciacion
  const guion = bloquesFijos ? { bloques: bloquesFijos } : await guionPorPartes(pedir, ficha);
  if (!bloquesFijos) guion.bloques = await revisarGuion(pedir, ficha, await alargarGuion(pedir, ficha, await completarPartes(pedir, ficha, guion.bloques)));
  if (!(Array.isArray(guion.agenda) && guion.agenda.length)) {
    const { datos } = await pedir(`${INTRO()}\n\n${REGLAS_PLAN()}\n\n${FORMATO_PLAN}`,
      `${fichaTexto(ficha, { extension: false })}\n\nGUION:\n${JSON.stringify(guion.bloques)}\n\nCrea solo la agenda y la pronunciación de este guion.`);
    guion.agenda = datos.agenda;
    if (!(Array.isArray(guion.pronunciacion) && guion.pronunciacion.length)) guion.pronunciacion = datos.pronunciacion;
  }
  // 2) diapositivas: se piden las que falten hasta tenerlas todas completas
  const diapositivas = await diapositivasPorPartes(pedir, ficha, guion.bloques);
  // 3) ortografia de todo lo que se oye y se ve
  await corregirOrtografia(pedir, guion.bloques, bloquesFijos ? [] : diapositivas, !bloquesFijos);
  const uso = {
    partes: usos.length,
    prompt_tokens: usos.reduce((t, u) => t + (u.prompt_tokens || 0), 0),
    completion_tokens: usos.reduce((t, u) => t + (u.completion_tokens || 0), 0),
    fin: usos.map(u => u.fin),
  };
  return { datos: { ...guion, diapositivas }, uso };
}

async function guionPorPartes(pedir, ficha) {
  const objetivo = palabrasObjetivo(ficha);
  let plan = {};
  let bloques = [];
  let sinAvance = 0;
  for (let parte = 0; parte < 6 && bloques.length < 16; parte++) {
    const sigue = bloques.length > 0;
    const usuario = sigue
      ? [fichaTexto(ficha), '', 'TU RESPUESTA ANTERIOR SE CORTÓ. Estos bloques ya están escritos (no los repitas ni los cambies):',
        JSON.stringify(bloques), '',
        `Escribe SOLO los bloques que faltan, desde el "${dosDigitos(bloques.length + 1)}", siguiendo la estructura de la sesión hasta la práctica, las conclusiones y el cierre.`,
        `Van ${contarPalabras(bloques)} palabras; el guion completo debe tener unas ${objetivo}.`].join('\n')
      : `${fichaTexto(ficha)}\n\n${guionDeEjemplo(ejemploPara(ficha))}`;
    const { datos, cortada } = await pedir(`${INTRO()}\n\n${REGLAS_GUION()}\n\n${sigue ? FORMATO_SIGUE : FORMATO_GUION}`, usuario);
    if (!sigue) plan = { tema: datos.tema, agenda: datos.agenda, pronunciacion: datos.pronunciacion };
    const nuevos = (Array.isArray(datos.bloques) ? datos.bloques : []).filter(b => b && String(b.texto || '').trim());
    bloques = [...bloques, ...nuevos].slice(0, 16).map((b, i) => ({ id: dosDigitos(i + 1), parte: parteDe(b.parte), texto: String(b.texto).replace(/\s+/g, ' ').trim() }));
    if (bloques.length && !cortada) break;
    if (!nuevos.length && ++sinAvance >= 2) break;
  }
  if (bloques.length < 3) throw new Error('La IA gratis no logró escribir el guion. Intenta de nuevo o usa otro modelo.');
  return { ...plan, bloques };
}

// Los modelos gratis suelen quedarse cortos (2:00 en vez de 2:30): se alargan los bloques mas cortos con un
// detalle concreto. Si falla, queda el guion como vino.
async function alargarGuion(pedir, ficha, bloques) {
  const objetivo = palabrasObjetivo(ficha);
  const total = contarPalabras(bloques);
  if (total >= objetivo * 0.88 || bloques.length < 4) return bloques;
  const n = b => String(b.texto).split(/\s+/).filter(Boolean).length;
  const cortos = bloques.slice(1, -1).filter(b => n(b) < 45 && !['portada', 'logro', 'temario', 'cierre'].includes(b.parte)).sort((a, z) => n(a) - n(z))
    .slice(0, Math.min(6, Math.ceil((objetivo - total) / 12))).map(b => b.id).sort();
  if (!cortos.length) return bloques;
  try {
    const { datos } = await pedir(`${INTRO()}\n\n${REGLAS_GUION()}\n\n${FORMATO_SIGUE}`, [
      fichaTexto(ficha, { extension: false }), '', 'GUION COMPLETO:', JSON.stringify(bloques), '',
      `El guion tiene ${total} palabras y debe tener unas ${objetivo}. Reescribe SOLO los bloques ${cortos.join(', ')}.`,
      'Mantén la idea de cada uno y agrégale un detalle concreto (un ejemplo, un paso con el nombre real del menú o un error común)',
      'hasta que tenga entre 35 y 50 palabras. No repitas lo que dicen los otros bloques.'].join('\n'));
    const nuevos = Object.fromEntries((Array.isArray(datos.bloques) ? datos.bloques : []).filter(b => b && b.texto).map(b => [dosDigitos(parseInt(b.id, 10) || 0), String(b.texto).replace(/\s+/g, ' ').trim()]));
    return bloques.map(b => (cortos.includes(b.id) && nuevos[b.id] && n({ texto: nuevos[b.id] }) > n(b) && n({ texto: nuevos[b.id] }) <= 70 ? { ...b, texto: nuevos[b.id] } : b));
  } catch (e) {
    console.warn(`[!] No se pudo alargar el guion (${texto(e).slice(0, 120)}): queda como vino.`);
    return bloques;
  }
}

// Si el guion se salto una parte de la sesion (suele faltar el temario), se pide solo esa parte y se pone en su lugar.
// Si la IA tampoco la escribe, el temario se arma con los puntos de la ficha ("Qué es Gemini: ..." -> "qué es Gemini").
export async function completarPartes(pedir, ficha, bloques) {
  if (!bloques.some(b => b.parte)) return bloques;
  const faltantes = () => PARTES.filter(p => p !== 'desarrollo' && !lista.some(b => b.parte === p));
  const poner = nb => {
    const orden = PARTES.indexOf(nb.parte);
    let k = -1;
    lista.forEach((b, i) => { const o = PARTES.indexOf(b.parte); if (o >= 0 && o < orden) k = i; });
    lista.splice(k + 1, 0, nb);
  };
  let lista = [...bloques];
  const faltan = faltantes();
  if (faltan.length) {
    try {
      const { datos } = await pedir(`${INTRO()}\n\n${REGLAS_GUION()}\n\n${FORMATO_SIGUE}`, [fichaTexto(ficha, { extension: false }), '',
        'GUION (le faltan partes):', JSON.stringify(lista), '',
        `Faltan estas partes de la sesión: ${faltan.join(', ')}. Escribe SOLO esos bloques, uno por parte y con su "parte", coherentes con el resto.`,
        faltan.includes('temario') ? 'El temario nombra, en una frase y en orden, los temas de los bloques de desarrollo.' : ''].filter(Boolean).join('\n'));
      for (const b of Array.isArray(datos.bloques) ? datos.bloques : []) {
        const parte = parteDe(b && b.parte);
        const t = String((b && b.texto) || '').replace(/\s+/g, ' ').trim();
        if (t && faltantes().includes(parte)) poner({ parte, texto: t });
      }
    } catch (e) {
      console.warn(`[!] No se pudieron completar las partes del guion (${texto(e).slice(0, 120)}).`);
    }
  }
  const temas = String(ficha.puntos || '').split('\n').map(l => l.split(':')[0].trim()).filter(t => t && t.split(/\s+/).length <= 6);
  if (faltantes().includes('temario') && temas.length >= 2) {
    const nombres = temas.map(t => (PROPIOS.includes(t.split(/\s+/)[0]) ? t : t.replace(/^./, c => c.toLowerCase()))); // "Gemini en Gmail" queda igual
    poner({ parte: 'temario', texto: `Hoy veremos: ${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}.` });
  }
  // en el orden de la sesion: a veces la IA pone un tema despues de la practica (los temas conservan su orden)
  const orden = b => (PARTES.includes(b.parte) ? PARTES.indexOf(b.parte) : -1);
  const ordenada = lista.map((b, i) => ({ b, i, o: orden(b) })).sort((x, y) => (x.o < 0 || y.o < 0 ? x.i - y.i : x.o - y.o || x.i - y.i)).map(x => x.b);
  return ordenada.map((b, i) => ({ ...b, id: dosDigitos(i + 1) }));
}

// Segundo pedido que corrige el guion ya escrito (web/skills/revision.md): erratas, "identificó" en vez de "identificaste",
// menus o direcciones inventados. Solo se aceptan cambios que no alteren mucho el largo del bloque.
async function revisarGuion(pedir, ficha, bloques) {
  const n = t => String(t).split(/\s+/).filter(Boolean).length;
  try {
    const { datos } = await pedir(`${INTRO()}\n\n${skill('revision')}\n\n${FORMATO_SIGUE}`, [
      fichaTexto(ficha, { extension: false }), '', 'GUION:', JSON.stringify(bloques.map(b => ({ id: b.id, parte: b.parte, texto: b.texto })))].join('\n'));
    const nuevos = Object.fromEntries((Array.isArray(datos.bloques) ? datos.bloques : []).filter(b => b && b.texto)
      .map(b => [dosDigitos(parseInt(b.id, 10) || 0), String(b.texto).replace(/\s+/g, ' ').trim()]));
    return bloques.map(b => {
      const t = nuevos[b.id];
      return t && n(t) >= n(b.texto) * 0.7 && n(t) <= n(b.texto) * 1.4 + 3 ? { ...b, texto: t } : b;
    });
  } catch (e) {
    console.warn(`[!] No se pudo revisar el guion (${texto(e).slice(0, 120)}): queda como vino.`);
    return bloques;
  }
}

// Textos de una diapositiva que se ven en pantalla (y sus "cuando"), para revisarlos o corregirlos todos juntos
const CAMPOS_TEXTO = ['kicker', 'titulo', 'sub', 'nota', 'reto', 'despedida'];
function cambiarTextos(d, f, { cuando = true } = {}) {
  for (const k of CAMPOS_TEXTO) if (d[k]) d[k] = f(d[k]);
  for (const x of [...(Array.isArray(d.items) ? d.items : []), ...(Array.isArray(d.tarjetas) ? d.tarjetas : []), d.izq, d.der]) {
    if (!x || typeof x !== 'object') continue;
    for (const k of ['etiqueta', 'titulo', 'texto', ...(cuando ? ['cuando'] : [])]) if (x[k]) x[k] = f(x[k]);
  }
}
const FORMATO_ORTOGRAFIA = `Responde SOLO con un objeto JSON, sin texto antes ni después: {"errores": [{"mal": "resumentes", "bien": "resumir"}]}
Si no hay ningún error: {"errores": []}`;

// Ultimo pedido (web/skills/ortografia.md): la IA solo LISTA lo mal escrito o mal usado y el programa lo cambia en el
// guion y en las diapositivas (tambien en "cuando"). Es una tarea corta: los modelos gratis la hacen mejor que reescribir.
// Con el guion del docente (fijo) solo se corrigen las diapositivas.
async function corregirOrtografia(pedir, bloques, diapositivas, conGuion) {
  const textos = [];
  if (conGuion) textos.push(...bloques.map(b => b.texto));
  for (const d of diapositivas) cambiarTextos(d, t => { textos.push(t); return t; }, { cuando: false });
  const todo = textos.join('\n');
  if (!todo.trim()) return;
  try {
    const pedido = [`${INTRO()}\n\n${skill('ortografia')}\n\n${FORMATO_ORTOGRAFIA}`, `TEXTOS DE LA CLASE (uno por línea):\n${todo}`];
    let { datos, cortada } = await pedir(...pedido, { pensar: true });
    if (cortada && !Array.isArray(datos.errores)) ({ datos } = await pedir(...pedido)); // penso tanto que no alcanzo a responder
    const errores = (Array.isArray(datos.errores) ? datos.errores : [])
      .map(e => ({ mal: String((e && e.mal) || '').trim(), bien: String((e && e.bien) || '').trim() }))
      .filter(e => e.mal && e.bien && e.mal !== e.bien && e.mal.length <= 60 && e.mal.split(/\s+/).length <= 8 && todo.includes(e.mal)
        && !/[.:/]\w/.test(e.mal)); // nunca direcciones ni comandos
    if (!errores.length) return;
    const arreglar = t => errores.reduce((s, e) => s.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escRe(e.mal)}(?![\\p{L}\\p{N}])`, 'gu'), e.bien), String(t));
    if (conGuion) for (const b of bloques) b.texto = arreglar(b.texto);
    for (const d of diapositivas) cambiarTextos(d, arreglar);
  } catch (e) {
    console.warn(`[!] No se pudo revisar la ortografía (${texto(e).slice(0, 120)}): queda como vino.`);
  }
}

// Una diapositiva cuenta solo si tiene todo lo que su tipo necesita (una comparacion sin lado derecho no sirve)
function diapositivaCompleta(d) {
  if (!d || !TIPOS.includes(d.tipo) || (d.tipo !== 'logo' && !String(d.titulo || '').trim())) return false;
  const lleno = x => x && String(x.titulo || x.texto || '').trim();
  const cuantos = a => (Array.isArray(a) ? a.filter(lleno).length : 0);
  switch (d.tipo) {
    case 'lista': case 'pasos': case 'temario': case 'ruta': return cuantos(d.items) >= 2;
    case 'cierre': return cuantos(d.items) >= 1 || !!String(d.despedida || d.reto || '').trim();
    case 'codigo': return !!String(d.codigo || '').trim();
    case 'comparacion': return !!(lleno(d.izq) && lleno(d.der));
    case 'tarjetas': case 'flujo': return cuantos(d.tarjetas) >= 2;
    case 'definicion': return !!String(d.sub || '').trim();
    case 'dato': return !!String(d.dato || '').trim();
    default: return true;
  }
}

async function diapositivasPorPartes(pedir, ficha, bloques) {
  const conPartes = bloques.some(b => b.parte);
  const ids = bloques.filter(b => b.parte !== 'cierre').map(b => b.id); // la del cierre la arma el programa
  const ultimo = ids[ids.length - 1];
  const tipoPedido = b => (TIPO_DE_PARTE[b.parte] ? `${b.id} ${TIPO_DE_PARTE[b.parte]} (${b.parte})` : `${b.id} ${b.parte || 'libre'}`);
  const hechas = {};
  let sinAvance = 0;
  let porParte = ids.length; // si una respuesta se corta, las siguientes piden menos diapositivas a la vez
  for (let parte = 0; parte < 12; parte++) {
    const faltan = ids.filter(id => !hechas[id]).slice(0, porParte);
    if (!faltan.length) break;
    const listas = ids.filter(id => hechas[id]).map(id => `${id} (${hechas[id].tipo})`);
    const usuario = [
      fichaTexto(ficha, { extension: false }), '',
      'GUION COMPLETO (cada diapositiva acompaña a su bloque):', JSON.stringify(bloques), '',
      listas.length ? `Ya están hechas las diapositivas de los bloques ${listas.join(', ')}: no las repitas y varía los tipos.` : '',
      `Crea las diapositivas SOLO para estos bloques, una por bloque y en orden: ${faltan.join(', ')}.`,
      conPartes ? `Tipo de cada bloque (los de "desarrollo" los eliges tú): ${bloques.filter(b => faltan.includes(b.id)).map(tipoPedido).join(' · ')}.`
        : faltan.includes(ultimo) ? `La del bloque ${ultimo} es de tipo cierre.` : '',
    ].filter(Boolean).join('\n');
    const { datos, cortada } = await pedir(`${INTRO()}\n\n${REGLAS_DIAPOS(ficha)}\n\n${FORMATO_DIAPOS}`, usuario);
    let lista = (Array.isArray(datos.diapositivas) ? datos.diapositivas : []).filter(d => d && typeof d === 'object');
    if (cortada) lista = lista.slice(0, -1); // la ultima pudo quedar a medias: se vuelve a pedir
    let nuevas = 0;
    lista.forEach((d, k) => {
      const v = String(d.bloque == null ? '' : d.bloque).trim();
      const id = /^\d+$/.test(v) ? dosDigitos(+v) : d.bloque == null ? faltan[k] : null;
      if (id && faltan.includes(id) && !hechas[id] && diapositivaCompleta(d)) { hechas[id] = { ...d, bloque: id }; nuevas++; }
    });
    if (cortada) porParte = Math.max(2, nuevas + 1);
    if (!nuevas && ++sinAvance >= 2) break;
  }
  return ids.filter(id => hechas[id]).map(id => hechas[id]);
}

// La IA que lee laminas (vision). Por defecto la misma de la IA gratis; si su modelo no lee imagenes se usa
// uno que si: Groq qwen/qwen3.8-27b, Gemini gemini-3.8-flash (capa gratis) u Ollama local (qwen2.5vl, gemma3).
export function configVision(env) {
  const propia = !!env.IA_VISION_URL;
  const url = String(propia ? env.IA_VISION_URL : env.IA_GRATIS_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
  const modelo = env.IA_VISION_MODELO || (/groq\.com/.test(url) ? 'qwen/qwen3.8-27b' : /generativelanguage\.googleapis/.test(url) ? 'gemini-3.8-flash' : env.IA_GRATIS_MODELO);
  return { IA_GRATIS_URL: url, IA_GRATIS_KEY: propia ? env.IA_VISION_KEY : env.IA_GRATIS_KEY, IA_GRATIS_MODELO: modelo, IA_GRATIS_MAX_TOKENS: env.IA_GRATIS_MAX_TOKENS };
}

// Cliente para APIs compatibles con OpenAI (Groq, Ollama, OpenRouter...). Ajusta max_tokens si el servicio
// dice cuanto permite y espera cuando el plan gratis pide "intenta de nuevo en 20 s".
// "usuario" puede ser texto o una lista de partes (texto + imagenes) para los modelos con vision.
function clienteGratis(env, usos, { vision = false } = {}) {
  const url = (env.IA_GRATIS_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
  const modelo = env.IA_GRATIS_MODELO || 'openai/gpt-oss-120b';
  const cabeceras = { 'Content-Type': 'application/json' };
  if (env.IA_GRATIS_KEY) cabeceras.Authorization = `Bearer ${env.IA_GRATIS_KEY}`;
  else if (!/localhost|127\.0\.0\.1/.test(url)) throw new Error(`Falta la API key de la IA ${vision ? 'que lee láminas' : 'gratis'} (Ajustes).`);
  let maximo = Number(env.IA_GRATIS_MAX_TOKENS) || 8000;
  let formatoJson = true; // algunos servicios no aceptan response_format: se quita y se pide JSON en el texto
  // Qwen3 en Groq "piensa" antes de responder y ese razonamiento gasta el tope de tokens de salida por minuto
  // (en el plan gratis puede ser de solo 1000): se apaga. Si el servicio no lo acepta, se quita.
  let razonar = /groq\.com/.test(url) && /qwen3/i.test(modelo) ? 'none' : null;

  // pensar: para tareas cortas que piden atencion (la ortografia) se deja razonar al modelo, con el razonamiento oculto
  return async function pedir(sistema, usuario, { pensar = false } = {}) {
    let r, cuerpo, esperas = 0, malFormados = 0;
    let esfuerzo = pensar && razonar === 'none' ? 'default' : razonar;
    for (let intento = 0; intento < 10; intento++) {
      const peticion = { model: modelo, messages: [{ role: 'system', content: sistema }, { role: 'user', content: usuario }] };
      if (formatoJson) peticion.response_format = { type: 'json_object' };
      if (maximo) peticion.max_tokens = maximo;
      if (esfuerzo) peticion.reasoning_effort = esfuerzo;
      if (esfuerzo && esfuerzo !== 'none') peticion.reasoning_format = 'hidden';
      try {
        r = await fetch(`${url}/chat/completions`, { method: 'POST', headers: cabeceras, body: JSON.stringify(peticion) });
      } catch (e) {
        throw new Error(`No hay conexión con la IA gratis (${url}): ${texto(e.cause || e)}`);
      }
      cuerpo = await r.text();
      if (r.ok) break;
      // "Request too large ... (OTPM): Limit 1000, Requested 1039": pedir menos tokens por respuesta
      const muyGrande = /request too large|max_(completion_)?tokens/i.test(cuerpo);
      if (r.status === 429 && !muyGrande) {
        const s = esperaDe(r, cuerpo);
        if (s != null && s <= 65 && esperas < 5) { esperas++; await dormir((s + 1) * 1000); continue; }
        break;
      }
      // Groq rechaza el JSON mal formado ("json_validate_failed") pero devuelve lo que el modelo escribio: casi siempre se
      // rescata (eran comillas sueltas dentro de un texto). Si no, se pide de nuevo: cada intento sale distinto.
      if (r.status === 400 && /json_validate_failed/i.test(cuerpo)) {
        let generado = '';
        try { generado = JSON.parse(cuerpo).error.failed_generation || ''; } catch { /* sin texto */ }
        const rescate = rescatarJson(generado);
        if (rescate) { usos.push({ fin: 'rescatado' }); return rescate; }
        if (malFormados++ >= 1) formatoJson = false; // al segundo fallo, sin modo JSON (extraerJson limpia el texto)
        continue;
      }
      if (r.status === 400 && formatoJson && /response_format|json_object/i.test(cuerpo)) { formatoJson = false; continue; }
      if (r.status === 400 && esfuerzo && /reasoning/i.test(cuerpo)) { if (esfuerzo === razonar) razonar = null; esfuerzo = razonar; continue; }
      if (([400, 413].includes(r.status) || muyGrande) && maximo) {
        const { nuevo, esperar } = maximoPermitido(cuerpo, maximo);
        if (nuevo !== maximo || (esperar && esperas < 5)) {
          maximo = nuevo;
          // el tope es por minuto y este minuto ya se gasto en otras partes de la clase: se espera a que se renueve
          if (esperar) { esperas++; await dormir(61000); }
          continue;
        }
      }
      break;
    }
    if (!r.ok) {
      const sinVision = vision && r.status >= 400 && r.status < 500 && /image|vision|multimodal|image_url|content type/i.test(cuerpo);
      const otpm = /output tokens per minute|\(OTPM\): Limit (\d+)/i.exec(cuerpo);
      const pista = r.status === 401 ? ' (API key inválida)'
        : sinVision ? ` (el modelo ${modelo} no lee imágenes: en Ajustes › IA que lee láminas usa qwen/qwen3.8-27b en Groq o gemini-3.8-flash en Gemini)`
        : otpm ? ` (tu plan gratis de ${modelo} solo deja escribir ${otpm[1] || 'pocos'} tokens por minuto: en Ajustes › IA gratis usa openai/gpt-oss-120b, que escribe la clase de una vez)`
        : r.status === 413 || r.status === 429 ? ' (límite del plan gratis: espera un minuto o usa otro modelo)' : '';
      throw new Error(`La IA ${vision ? 'que lee láminas' : 'gratis'} respondió ${r.status}${pista}: ${cuerpo.slice(0, 300)}`);
    }
    const j = JSON.parse(cuerpo);
    const eleccion = (j.choices && j.choices[0]) || {};
    const contenido = eleccion.message && eleccion.message.content;
    const cortada = eleccion.finish_reason === 'length';
    usos.push({ ...j.usage, fin: eleccion.finish_reason });
    if (!contenido) {
      if (cortada) return { datos: {}, cortada }; // gasto todo pensando: la siguiente parte lo reintenta
      throw new Error('La IA gratis no devolvió contenido.');
    }
    try {
      return { datos: extraerJson(contenido, cortada), cortada };
    } catch (e) {
      if (cortada) return { datos: {}, cortada };
      throw e;
    }
  };
}

// Segundos que pide esperar el servicio (cabecera retry-after o "try again in 1m2.5s")
function esperaDe(r, cuerpo) {
  const h = Number(r.headers.get('retry-after'));
  if (Number.isFinite(h) && h > 0) return h;
  const m = /try again in (?:(\d+)m)?([\d.]+)s/i.exec(cuerpo);
  return m ? (+(m[1] || 0)) * 60 + Math.ceil(+m[2]) : null;
}

// "...tokens per minute (TPM): Limit 6000, Requested 10098" -> pedir menos para entrar en el limite.
// Con un tope por minuto muy chico (OTPM 1000) cada respuesta pide a lo mas el 90 % del tope; si aun asi no entra
// es que el minuto ya se gasto: hay que esperar ("esperar"). Con poco espacio por respuesta la clase sale en mas partes.
// "max_tokens must be less than or equal to 4096" -> pedir ese maximo. Si no acepta max_tokens, sin limite (0).
function maximoPermitido(cuerpo, maximo) {
  let m = /Limit (\d+), Requested (\d+)/i.exec(cuerpo);
  if (m) {
    const limite = +m[1];
    const n = Math.min(maximo - (+m[2] - limite) - 100, Math.floor(limite * 0.9));
    if (n >= 300) return { nuevo: n, esperar: false };
    return { nuevo: Math.min(maximo, Math.floor(limite * 0.9)), esperar: /per minute|\b[OT]PM\b/i.test(cuerpo) };
  }
  m = /max_(?:completion_)?tokens\D*?(?:less than or equal to|at most|<=)\D*(\d+)/i.exec(cuerpo);
  if (m && +m[1] < maximo) return { nuevo: +m[1], esperar: false };
  if (/max_(?:completion_)?tokens/i.test(cuerpo)) return { nuevo: 0, esperar: false };
  return { nuevo: maximo, esperar: false };
}

// Algunos modelos abiertos (Qwen, DeepSeek...) escriben su razonamiento en <think>...</think> o envuelven el
// JSON en ```json: nos quedamos solo con el objeto JSON.
function extraerJson(contenido, cortada = false) {
  const limpio = String(contenido).replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').replace(/```(?:json)?/gi, '').trim();
  try { return JSON.parse(limpio); } catch { /* sigue */ }
  const a = limpio.indexOf('{');
  const z = limpio.lastIndexOf('}');
  if (a >= 0 && z > a) {
    try { return JSON.parse(limpio.slice(a, z + 1)); } catch { /* sigue */ }
  }
  if (a >= 0 && z > a) {
    try { return JSON.parse(repararComillas(limpio.slice(a, z + 1))); } catch { /* sigue */ }
  }
  // respuesta cortada a la mitad: se aprovecha hasta el ultimo elemento completo
  const rescatado = a >= 0 ? cerrarJson(repararComillas(limpio.slice(a))) : null;
  if (rescatado) return rescatado;
  throw new Error(cortada
    ? 'La respuesta de la IA gratis se cortó (límite de tokens). Intenta de nuevo o usa otro modelo.'
    : 'La IA gratis no devolvió un JSON válido. Intenta de nuevo o usa otro modelo.');
}

// Lo que escribio el modelo cuando el servicio lo rechazo por JSON mal formado: { datos, cortada } o null.
// Si solo se salva una parte, va como "cortada" para que se pida lo que falta.
export function rescatarJson(t) {
  const limpio = String(t || '').replace(/<think>[\s\S]*?(?:<\/think>|$)/gi, '').replace(/```(?:json)?/gi, '').trim();
  const a = limpio.indexOf('{');
  if (a < 0) return null;
  const z = limpio.lastIndexOf('}');
  for (const intento of z > a ? [limpio.slice(a, z + 1), repararComillas(limpio.slice(a, z + 1))] : []) {
    try { const v = JSON.parse(intento); if (v && typeof v === 'object' && !Array.isArray(v)) return { datos: v, cortada: false }; } catch { /* sigue */ }
  }
  const parcial = cerrarJson(repararComillas(limpio.slice(a)));
  return parcial ? { datos: parcial, cortada: true } : null;
}

// Comillas dobles sueltas dentro de un texto ("puedes pedir: "Resume esto"...") -> «Resume esto». Una comilla cierra
// el texto solo si despues viene : } ] o una coma seguida de otra clave o valor; si no, es parte del texto.
function repararComillas(s) {
  let out = '';
  let enTexto = false;
  let abierta = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (enTexto && c === '\\') { out += c + (s[i + 1] || ''); i++; continue; }
    if (c !== '"') { out += c; continue; }
    if (!enTexto) { enTexto = true; abierta = false; out += c; continue; }
    if (/^\s*(?:$|[}\]:]|,\s*["{[\]}\d\-tfn])/.test(s.slice(i + 1, i + 40))) { enTexto = false; out += c; continue; }
    out += abierta ? '»' : '«';
    abierta = !abierta;
  }
  return out;
}

// Cierra un JSON cortado: prueba a cortar despues de cada } o ] (del final hacia atras) y cerrar lo que quede abierto.
function cerrarJson(s) {
  const pila = [];
  const cortes = [];
  let enTexto = false, escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (enTexto) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') enTexto = false;
    } else if (c === '"') enTexto = true;
    else if (c === '{' || c === '[') pila.push(c === '{' ? '}' : ']');
    else if (c === '}' || c === ']') { pila.pop(); cortes.push([i + 1, pila.slice().reverse().join('')]); }
  }
  for (let k = cortes.length - 1; k >= 0 && k >= cortes.length - 400; k--) {
    try {
      const v = JSON.parse(s.slice(0, cortes[k][0]) + cortes[k][1]);
      if (v && typeof v === 'object' && !Array.isArray(v)) return v;
    } catch { /* sigue */ }
  }
  return null;
}

// ---------------------------------------------------------------- laminas (imagenes de las diapositivas del docente)
const MIME = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const leerLamina = (dir, rel) => fs.readFileSync(path.join(dir, ...rel.split('/'))).toString('base64');

// IA gratis con vision: una lamina por peticion (los planes gratis aceptan pocas imagenes y pocos tokens a la vez),
// cada una sabiendo lo que se dijo en la anterior. Al final, agenda y pronunciacion con el guion ya escrito.
async function laminasConIaGratis(ficha, laminas, dir, env) {
  const usos = [];
  const pedir = clienteGratis(configVision(env), usos, { vision: true });
  const n = laminas.length;
  const hechas = [];
  const pronunciacion = [];
  const cuadradas = await laminasCuadradas(dir, laminas);
  for (let i = 0; i < n; i++) {
    const anterior = hechas[i - 1];
    const indicaciones = [
      fichaTexto(ficha, { extension: false }), '',
      `LÁMINA ${i + 1} DE ${n} (la imagen va adjunta).`,
      i === 0 ? 'Es la primera lámina: saludo; el avatar se presenta por su nombre y dice el tema.' : '',
      i === n - 1 && n > 1 ? 'Es la última lámina: resumen o reto práctico y despedida.' : '',
      anterior ? `La voz acaba de decir, en la lámina anterior (no lo repitas, continúa la clase): ${anterior.texto}` : '',
    ].filter(Boolean).join('\n');
    const { url, w, h } = cuadradas[i];
    const { datos } = await pedir(`${INTRO()}\n\n${REGLAS_LAMINAS()}\n\n${FORMATO_LAMINA}`,
      [{ type: 'text', text: `${indicaciones}\n(La lámina va arriba a la izquierda de un cuadrado blanco: ignora el blanco de relleno.)` },
        { type: 'image_url', image_url: { url } }]);
    const t = String(datos.texto || '').replace(/\s+/g, ' ').trim();
    if (!t) throw new Error(`La IA no escribió el texto de la lámina ${i + 1}. Intenta de nuevo o usa otro modelo.`);
    hechas.push({ titulo: corto(datos.titulo, 60), texto: t, efectos: i === 0 ? [] : await ubicar(pedir, url, datos.efectos, w, h) });
    // los modelos gratis escriben mal la pronunciacion de palabras comunes ("to" -> "tot"): solo se aceptan siglas
    if (Array.isArray(datos.pronunciacion)) pronunciacion.push(...datos.pronunciacion.filter(p => p && /^[A-Z0-9.]{2,}$/.test(String(p.escrito || '').trim())));
  }
  const bloques = hechas.map((x, i) => ({ id: dosDigitos(i + 1), texto: x.texto }));
  let agenda = [];
  try {
    const { datos } = await pedir(`${INTRO()}\n\n${REGLAS_PLAN()}\n\n${FORMATO_PLAN}`,
      `${fichaTexto(ficha, { extension: false })}\n\nTÍTULOS DE LAS LÁMINAS: ${JSON.stringify(hechas.map(x => x.titulo))}\n\nGUION (un bloque por lámina):\n${JSON.stringify(bloques)}\n\nCrea solo la agenda y la pronunciación de este guion.`);
    agenda = Array.isArray(datos.agenda) ? datos.agenda : [];
    if (Array.isArray(datos.pronunciacion)) pronunciacion.push(...datos.pronunciacion.filter(p => p && /^[A-Z0-9.]{2,}$/.test(String(p.escrito || '').trim())));
  } catch (e) {
    console.warn(`[!] La IA no armó la agenda (${texto(e).slice(0, 160)}): uso los títulos de las láminas.`);
  }
  const uso = { partes: usos.length, prompt_tokens: usos.reduce((t, u) => t + (u.prompt_tokens || 0), 0), completion_tokens: usos.reduce((t, u) => t + (u.completion_tokens || 0), 0) };
  return { tema: ficha.tema || hechas[0].titulo, agenda, pronunciacion, textos: hechas.map(x => x.texto), titulos: hechas.map(x => x.titulo),
    efectos: hechas.map(x => x.efectos), uso };
}

// Agenda de respaldo: hasta 5 laminas repartidas (sin la portada), con su titulo como punto de la agenda
function agendaDeTitulos(titulos) {
  const candidatas = titulos.map((t, i) => ({ titulo: corto(t, 30), desde: dosDigitos(i + 1) })).slice(1).filter(a => a.titulo);
  if (candidatas.length <= 5) return candidatas;
  return [0, 1, 2, 3, 4].map(k => candidatas[Math.round((k * (candidatas.length - 1)) / 4)]);
}

// Claude: todas las laminas en una sola peticion
async function laminasConClaude(ficha, laminas, dir, env) {
  const n = laminas.length;
  const contenido = [{ type: 'text', text: `${fichaTexto(ficha, { extension: false })}\n\nSon ${n} láminas, en orden. Escribe EXACTAMENTE ${n} textos en "laminas" (uno por lámina, en el mismo orden). ` +
    'En la agenda, "desde" es el número de la lámina donde empieza cada punto, con dos dígitos ("01", "02"...).' }];
  const cuadradas = await laminasCuadradas(dir, laminas);
  cuadradas.forEach((c, i) => contenido.push({ type: 'text', text: `Lámina ${i + 1} (arriba a la izquierda de un cuadrado blanco):` },
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: c.url.split(',')[1] } }));
  const { datos, uso } = await claudeJson(env, `${INTRO()}\n\n${REGLAS_LAMINAS()}\n${CAJA_CLAUDE}\n${REGLAS_PLAN()}`, contenido, ESQUEMA_LAMINAS);
  const textos = (datos.laminas || []).map(x => String(x.texto || '').replace(/\s+/g, ' ').trim());
  if (textos.length !== n || textos.some(t => !t)) throw new Error(`Claude devolvió ${textos.filter(Boolean).length} textos para ${n} láminas. Intenta de nuevo.`);
  const efectos = (datos.laminas || []).map((x, i) => (i === 0 ? [] : efectosDe(x.efectos, cuadradas[i].w, cuadradas[i].h)));
  return { tema: ficha.tema || datos.tema, agenda: datos.agenda, pronunciacion: datos.pronunciacion, textos,
    titulos: (datos.laminas || []).map(x => x.titulo), efectos, uso };
}

// El docente escribe un parrafo por lamina
function textosManuales(guion, n) {
  const parrafos = String(guion || '').replace(/\r/g, '').split(/\n\s*\n/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (parrafos.length !== n) throw new Error(`Tienes ${n} láminas y ${parrafos.length} párrafos: escribe un párrafo por lámina, separados por una línea en blanco.`);
  return parrafos;
}

// Un texto por lamina -> bloques y diapositivas "imagen". Un texto muy largo se parte en varios bloques
// (la lamina sigue en pantalla). La agenda llega con el numero de lamina y se pasa al bloque donde empieza.
async function claseDeLaminas({ ficha, modo, guion, env, laminas, dir, base }) {
  const r = modo === 'manual' ? { tema: ficha.tema, agenda: [], pronunciacion: [], textos: textosManuales(guion, laminas.length), uso: null }
    : modo === 'claude' ? await laminasConClaude(ficha, laminas, dir, env)
    : await laminasConIaGratis(ficha, laminas, dir, env);
  const bloques = [];
  const diapositivas = [];
  const primerBloque = {};
  const plano = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  r.textos.forEach((t, i) => {
    const desde = bloques.length;
    guionManual(t).forEach((p, k) => {
      const id = dosDigitos(bloques.length + 1);
      bloques.push({ id, texto: p.texto });
      if (k === 0) { diapositivas.push({ bloque: id, tipo: 'imagen', imagen: laminas[i] }); primerBloque[dosDigitos(i + 1)] = id; }
    });
    // cada efecto va al bloque de esta lamina donde la voz dice su "cuando" (si no lo dice, aparece escalonado)
    const propios = bloques.slice(desde);
    const efectos = ((r.efectos || [])[i] || []).map(e => {
      const donde = e.cuando && propios.find(b => plano(b.texto).includes(plano(e.cuando)));
      return { ...e, cuando: donde ? e.cuando : '', bloque: donde ? donde.id : propios[0].id };
    });
    if (efectos.length) diapositivas[diapositivas.length - 1].efectos = efectos;
  });
  const aBloques = lista => (Array.isArray(lista) ? lista : []).map(a => ({ ...a, desde: primerBloque[dosDigitos(parseInt(a && a.desde, 10) || 0)] }))
    .filter(a => a.titulo && a.desde);
  // la agenda sirve si avanza: cada punto empieza en una lamina posterior a la del anterior (y no en la portada)
  const avanza = ag => ag.length >= 2 && ag.every((a, k) => a.desde !== bloques[0].id && (k === 0 || a.desde > ag[k - 1].desde));
  let agenda = aBloques(r.agenda);
  if (!avanza(agenda) && r.titulos) agenda = aBloques(agendaDeTitulos(r.titulos));
  const clase = normalizar({ tema: r.tema, agenda, pronunciacion: r.pronunciacion, bloques, diapositivas }, { ...ficha, tema: ficha.tema || r.tema }, base);
  if (modo !== 'manual') sinDeletreos(clase);
  pulir(clase);
  pronunciacionBase(clase);
  conSemilla(clase);
  return { clase, uso: r.uso, aviso: '' };
}

// ---------------------------------------------------------------- modo manual (sin IA)
export function guionManual(textoGuion) {
  const parrafos = String(textoGuion || '').replace(/\r/g, '').split(/\n\s*\n/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const bloques = [];
  for (const p of parrafos) {
    // un parrafo muy largo se parte por oraciones en trozos de ~45 palabras
    // una oracion termina en . ! ? seguido de espacio o del final (asi "index.html" o "3.5" no se parten)
    const oraciones = p.match(/.+?[.!?]+["»”]?(?=\s|$)|.+$/g) || [p];
    let actual = '';
    for (const o of oraciones.map(x => x.trim()).filter(Boolean)) {
      if (actual && (actual + ' ' + o).split(' ').length > 55) { bloques.push(actual); actual = o; } else actual = (actual + ' ' + o).trim();
    }
    if (actual) bloques.push(actual);
  }
  return bloques.map((t, i) => ({ id: String(i + 1).padStart(2, '0'), texto: t }));
}

function diapositivasBasicas(ficha, bloques, agenda = []) {
  return bloques.map((bl, i) => {
    if (i === 0) return { bloque: bl.id, tipo: 'portada', kicker: [ficha.curso, ficha.nivel].filter(Boolean).join(' · '), titulo: ficha.tema || 'Nueva clase', sub: ficha.objetivo || '', items: [] };
    const oracion = (bl.texto.match(/^.*?[.!?](?=\s|$)/) || [bl.texto])[0].trim().replace(/^[¡¿]/, '').replace(/[.!?]$/, '');
    const primera = oracion.split(/\s+/).slice(0, 7).join(' ').replace(/[,;:]$/, '');
    const seccion = agenda.filter(a => a.desde <= bl.id).pop();
    if (i < bloques.length - 1) {
      // "Tu reto: toma un párrafo" -> título "Tu reto" y subtítulo "Toma un párrafo"
      const [antes, ...resto] = oracion.split(':');
      const n = antes.split(/\s+/).length;
      const partido = resto.length && n >= 2 && n <= 7;
      const sub = partido ? resto.join(':').trim().split(/\s+/).slice(0, 14).join(' ').replace(/[,;:]$/, '') : '';
      return { bloque: bl.id, tipo: 'idea', kicker: seccion ? seccion.titulo : `Parte ${i}`,
        titulo: partido ? antes.trim() : primera, sub: sub && sub[0].toUpperCase() + sub.slice(1) };
    }
    return {
      bloque: bl.id, tipo: 'cierre', kicker: 'Resumen y reto',
      titulo: agenda.length ? 'Lo que *aprendiste* hoy' : primera,
      items: agenda.slice(0, 4).map(a => ({ texto: a.titulo, cuando: '' })),
      despedida: `¡Nos vemos en la próxima clase! · ${ficha.avatar || 'SIPANCITOBOT'}`,
    };
  });
}

// Ultimo recurso: si despues de pedir por partes aun falta alguna diapositiva (o Claude dejo una plantilla
// a medias), se pone una simple para que el video no se quede medio minuto en la misma. Devuelve sus bloques.
function completarDiapositivas(clase, ficha) {
  const basicas = diapositivasBasicas(ficha, clase.bloques, clase.agenda);
  const propias = {};
  for (const d of clase.diapositivas) if (!propias[d.bloque]) propias[d.bloque] = arreglarPlantilla(d);
  clase.diapositivas = clase.bloques.map((bl, i) => propias[bl.id] || basicas[i]);
  return clase.bloques.filter(bl => !propias[bl.id]).map(bl => bl.id);
}

function arreglarPlantilla(d) {
  const lleno = x => x && (x.titulo || x.texto);
  const pareceCodigo = s => /[<{};]/.test(s || '');
  if (d.tipo === 'comparacion' && !(lleno(d.izq) && lleno(d.der))) {
    const lado = lleno(d.izq) ? d.izq : lleno(d.der) ? d.der : null;
    if (lado && pareceCodigo(lado.texto)) return { ...d, tipo: 'codigo', codigo: lado.texto, sub: d.sub || lado.titulo };
    return { ...d, tipo: 'idea', sub: d.sub || (lado ? [lado.titulo, lado.texto].filter(Boolean).join(': ') : '') };
  }
  if (['lista', 'pasos', 'temario', 'ruta', 'cierre'].includes(d.tipo) && !d.items.length && !(d.tipo === 'cierre' && (d.despedida || d.reto))) return { ...d, tipo: 'idea' };
  if (['tarjetas', 'flujo'].includes(d.tipo) && !d.tarjetas.length) return { ...d, tipo: 'idea' };
  if (d.tipo === 'definicion' && !d.sub) return { ...d, tipo: 'idea' };
  if (d.tipo === 'codigo' && !d.codigo.trim()) return { ...d, tipo: 'idea' };
  if (d.tipo === 'dato' && !d.dato) return { ...d, tipo: 'idea' };
  return d;
}

// ---------------------------------------------------------------- normalizacion
const corto = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const icono = v => (NOMBRES_ICONOS.includes(v) ? v : '');
const conIcono = x => (icono(x && x.icono) ? { icono: x.icono } : {});
const items = (arr, n, largo) => (Array.isArray(arr) ? arr : []).filter(x => x && (x.texto || x.titulo))
  .slice(0, n).map(x => ({ texto: corto(x.texto, largo), cuando: corto(x.cuando, 40), ...conIcono(x) }));

export function normalizar(datos, ficha, base = {}) {
  const bloquesIn = (Array.isArray(datos.bloques) ? datos.bloques : []).filter(x => x && String(x.texto || '').trim());
  if (!bloquesIn.length) throw new Error('La IA no devolvió bloques de guion.');
  const mapa = {};
  const bloques = bloquesIn.slice(0, 40).map((x, i) => { // con laminas puede haber muchas
    const id = String(i + 1).padStart(2, '0');
    mapa[String(x.id)] = id;
    return { id, texto: String(x.texto).replace(/\s+/g, ' ').trim() };
  });
  const ids = bloques.map(x => x.id);
  const idOk = v => mapa[String(v)] || (ids.includes(String(v)) ? String(v) : null);

  const diapositivas = (Array.isArray(datos.diapositivas) ? datos.diapositivas : []).filter(d => d && (d.tipo !== 'imagen' || rutaLamina(d.imagen))).map((d, k) => {
    const tipo = TIPOS_VALIDOS.includes(d && d.tipo) ? d.tipo : 'idea';
    const bloque = idOk(d && d.bloque) || ids[Math.min(k, ids.length - 1)];
    if (tipo === 'imagen') {
      // efectos ya en % de la imagen (los arma claseDeLaminas o los guarda el editor tal cual)
      const efectos = (Array.isArray(d.efectos) ? d.efectos : []).filter(e => e && Array.isArray(e.caja) && e.caja.length === 4 && e.caja.every(Number.isFinite))
        .slice(0, 8).map(e => ({ tipo: TIPOS_EFECTO.includes(e.tipo) ? e.tipo : 'foco', caja: e.caja.map(v => Math.max(0, Math.min(100, v))),
          cuando: corto(e.cuando, 40), bloque: idOk(e.bloque) || bloque }));
      return { bloque, tipo, imagen: rutaLamina(d.imagen), ...(efectos.length ? { efectos } : {}) };
    }
    const lado = x => ({ etiqueta: corto(x && x.etiqueta, 24), titulo: corto(x && x.titulo, 60), texto: corto(x && x.texto, 140), cuando: corto(x && x.cuando, 40), ...conIcono(x) });
    return {
      bloque,
      tipo,
      variante: corto(d.variante, 20), kicker: corto(d.kicker, 40), titulo: corto(d.titulo, 90), sub: corto(d.sub, 200), nota: corto(d.nota, 180), icono: icono(d.icono),
      items: items(d.items, 8, 110),
      codigo: String(d.codigo || '').split('\n').slice(0, 18).map(l => l.slice(0, 72)).join('\n'), archivo: corto(d.archivo, 40), app: corto(d.app, 40),
      izq: lado(d.izq), der: lado(d.der),
      tarjetas: (Array.isArray(d.tarjetas) ? d.tarjetas : []).filter(x => x && (x.titulo || x.texto)).slice(0, 5)
        .map(x => ({ titulo: corto(x.titulo, 40), texto: corto(x.texto, 110), cuando: corto(x.cuando, 40), ...conIcono(x) })),
      dato: corto(d.dato, 12), reto: corto(d.reto, 220), despedida: corto(d.despedida, 80),
    };
  });
  if (!diapositivas.length) diapositivas.push(...diapositivasBasicas(ficha, bloques));

  const pronunciacion = {};
  for (const x of Array.isArray(datos.pronunciacion) ? datos.pronunciacion : []) {
    if (x && x.escrito && x.dice) pronunciacion[corto(x.escrito, 40)] = corto(x.dice, 80);
  }
  const agenda = (Array.isArray(datos.agenda) ? datos.agenda : [])
    .map(a => ({ titulo: corto(a && a.titulo, 30), desde: idOk(a && a.desde) }))
    .filter(a => a.titulo && a.desde).slice(0, 6);

  return {
    ...base,
    avatar: ficha.avatar || base.avatar || 'SIPANCITOBOT',
    rol_avatar: ficha.rol_avatar || base.rol_avatar || 'Asistente docente IA',
    docente: ficha.docente || base.docente || '',
    institucion: ficha.institucion || base.institucion || 'Universidad Señor de Sipán',
    curso: ficha.curso || base.curso || '',
    modulo: corto(ficha.modulo != null ? ficha.modulo : base.modulo, 60),
    banda: ficha.banda || ficha.curso || base.banda || '',
    tema: corto(ficha.tema || datos.tema || base.tema, 120),
    nivel: ficha.nivel || base.nivel || 'Básico',
    duracion_objetivo: segundos(ficha.duracion) || base.duracion_objetivo || 150,
    voz: base.voz || { proveedor: 'auto', elevenlabs_voz: '' },
    pronunciacion,
    agenda,
    bloques,
    diapositivas,
  };
}

export function segundos(d) {
  const m = /^(\d+)(?::(\d{1,2}))?$/.exec(String(d || '').trim());
  return m ? (+m[1]) * (m[2] != null ? 60 : 1) + (m[2] != null ? +m[2] : 0) : 0;
}

// ---------------------------------------------------------------- entrada principal
export async function generarClase({ ficha, modo, guion, env, base, laminas, dir }) {
  if (laminas && laminas.length) return claseDeLaminas({ ficha, modo, guion, env, laminas, dir, base });
  if (modo === 'manual') {
    const bloques = guionManual(guion);
    if (!bloques.length) throw new Error('Pega el guion: un párrafo por bloque, separados por una línea en blanco.');
    return { clase: conSemilla(normalizar({ bloques, diapositivas: diapositivasBasicas(ficha, bloques) }, ficha, base)), uso: null };
  }
  const bloquesFijos = guion ? (Array.isArray(guion) ? guion : guionManual(guion)) : null;
  const { datos, uso } = modo === 'claude' ? await conClaude(ficha, bloquesFijos, env) : await conIaGratis(ficha, bloquesFijos, env);
  if (bloquesFijos) datos.bloques = bloquesFijos; // el guion del docente no se toca
  else aplicarEstructura(datos, ficha);
  const clase = normalizar(datos, ficha, base);
  if (!bloquesFijos) sinDeletreos(clase);
  pronunciacionBase(clase);
  const simples = completarDiapositivas(clase, ficha);
  pulir(clase);
  conSemilla(clase);
  const aviso = simples.length
    ? `La IA no completó las diapositivas de los bloques ${simples.join(', ')}: puse unas simples. Revísalas o pulsa «Diapositivas con IA».`
    : '';
  return { clase, uso, aviso };
}

// Estructura de sesion: cada parte con su diapositiva (si la IA eligio otro tipo y se puede, se cambia) y, al final,
// la despedida con el logo al centro, que arma el programa.
const OTROS_VALIDOS = { practica: ['pasos', 'lista'] };
export function aplicarEstructura(datos, ficha) {
  const bloques = Array.isArray(datos.bloques) ? datos.bloques : [];
  const parte = Object.fromEntries(bloques.map(b => [String(b.id), parteDe(b.parte)]));
  if (!Object.values(parte).some(Boolean)) return;
  const diapos = (Array.isArray(datos.diapositivas) ? datos.diapositivas : []).filter(d => d && parte[String(d.bloque)] !== 'cierre');
  for (const d of diapos) {
    const p = parte[String(d.bloque)];
    const fijo = TIPO_DE_PARTE[p];
    if (!fijo || d.tipo === fijo || (OTROS_VALIDOS[p] || []).includes(d.tipo)) continue;
    const items = Array.isArray(d.items) && d.items.length ? d.items : (d.tarjetas || []).map(x => ({ texto: x.titulo, cuando: x.cuando, icono: x.icono }));
    const tarjetas = Array.isArray(d.tarjetas) && d.tarjetas.length ? d.tarjetas : (d.items || []).map(x => ({ titulo: x.texto, texto: '', cuando: x.cuando, icono: x.icono }));
    if (['temario', 'cierre'].includes(fijo) && items.length >= 2) Object.assign(d, { tipo: fijo, items });
    else if (fijo === 'tarjetas' && tarjetas.length >= 2) Object.assign(d, { tipo: fijo, tarjetas: tarjetas.slice(0, 4) });
    else if ((fijo === 'definicion' && d.sub) || (fijo === 'pregunta' && /\?/.test(d.titulo || '')) || fijo === 'portada') d.tipo = fijo;
  }
  // el logro en pantalla es el mismo del guion ("al finalizar la sesión, configuras...") con su titulo fijo
  for (const d of diapos) {
    if (parte[String(d.bloque)] !== 'logro' || d.tipo !== 'definicion') continue;
    const b = bloques.find(x => String(x.id) === String(d.bloque));
    const m = /al finalizar la sesi[oó]n,?\s*(.+)$/i.exec((b && b.texto) || '');
    if (m && m[1].length <= 200) Object.assign(d, { titulo: 'Al finalizar la *sesión*', sub: m[1].replace(/^./, c => c.toUpperCase()) });
  }
  // las conclusiones no se despiden: despues viene la diapositiva con el logo
  for (const d of diapos) if (parte[String(d.bloque)] === 'conclusiones') Object.assign(d, { despedida: '', reto: '' });
  const agenda = agendaDeEstructura(bloques, parte, diapos);
  if (agenda.length >= 2) datos.agenda = agenda;
  const fin = bloques[bloques.length - 1];
  if (fin && parte[String(fin.id)] === 'cierre') {
    diapos.push({ bloque: fin.id, tipo: 'logo', titulo: '¡Nos vemos en la *próxima sesión*!', sub: `${ficha.avatar || 'SIPANCITOBOT'} · ${ficha.rol_avatar || 'Asistente docente IA'}` });
  }
  datos.diapositivas = diapos;
}

// Cada clase nueva trae su semilla de diseño (motor/diapos-auto.js: estilo de la clase y variante de cada plantilla),
// asi no todas se ven iguales. Las que ya tenian una (o se rehacen desde el editor) la conservan.
function conSemilla(clase) {
  if (clase.semilla == null) clase.semilla = Math.floor(Math.random() * 1e6);
  return clase;
}

// Agenda de la columna derecha: un punto por tema del temario (desde su bloque de desarrollo), mas el logro y la
// practica, hasta 6 puntos. La IA suele contar mal los bloques ("desde"), asi que se arma con la estructura.
function agendaDeEstructura(bloques, parte, diapos) {
  const de = p => bloques.filter(b => parte[String(b.id)] === p);
  const desarrollo = de('desarrollo');
  if (!desarrollo.length) return [];
  const temario = diapos.find(d => parte[String(d.bloque)] === 'temario' && Array.isArray(d.items)) || { items: [] };
  // hasta 24 letras sin cortar palabras ni dejar "de", "del"... al final ("Uso responsable del" -> "Uso responsable")
  const corta = t => {
    let s = String(t || '').replace(/\*/g, '').split(/:\s/)[0].replace(/[.:;]\s*$/, '').trim();
    if (s.length > 24) s = s.slice(0, 25).replace(/\s+\S*$/, '');
    while (/\s(\S+)$/.test(s) && MENORES.has(planoTxt(/\s(\S+)$/.exec(s)[1]))) s = s.replace(/\s+\S+$/, '');
    return s;
  };
  let temas = desarrollo.map((b, i) => {
    const d = diapos.find(x => String(x.bloque) === String(b.id)) || {};
    return { titulo: corta((temario.items[i] && temario.items[i].texto) || d.titulo), desde: b.id };
  }).filter(a => a.titulo);
  if (temas.length === 6) return temas; // justo 6: un punto por tema
  if (temas.length >= 7) { // de dos en dos: "Etiquetas y filtros"
    temas = temas.reduce((r, a, i) => (i % 2 ? r : [...r, { titulo: temas[i + 1] && `${a.titulo} y ${temas[i + 1].titulo.toLowerCase()}`.length <= 26 ? `${a.titulo} y ${temas[i + 1].titulo.toLowerCase()}` : a.titulo, desde: a.desde }]), []);
  }
  const practica = de('practica')[0];
  const agenda = [...temas, ...(practica ? [{ titulo: 'Práctica y cierre', desde: practica.id }] : [])];
  const logro = de('logro')[0];
  if (logro && agenda.length < 6) agenda.unshift({ titulo: 'Logro y motivación', desde: logro.id });
  return agenda.slice(0, 6);
}

// Algunos modelos escriben "Ce Ese Ese" en el texto en vez de "CSS": se deja la sigla y la voz la lee
// con "pronunciacion" (asi el texto queda limpio y "cuando" encuentra la palabra).
function sinDeletreos(clase) {
  for (const [escrito, dice] of Object.entries(clase.pronunciacion || {})) {
    if (dice.trim().split(/\s+/).length < 2) continue; // solo deletreos ("ce ese ese"), no palabras sueltas
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${dice.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'giu');
    for (const bl of clase.bloques) bl.texto = bl.texto.replace(re, escrito);
  }
}

// ---------------------------------------------------------------- pulido final
// Lo que los modelos gratis suelen hacer mal en pantalla y se arregla sin otra peticion: Title Case ("Tres Niveles
// De Acceso"), puntos finales en titulos y viñetas, titulo sin palabra clave marcada y "cuando" que la voz no dice
// (el elemento apareceria a destiempo). Tambien la despedida del cierre.
const MENORES = new Set(['a', 'al', 'ante', 'con', 'de', 'del', 'el', 'en', 'es', 'la', 'las', 'lo', 'los', 'o', 'para', 'por', 'que', 'se',
  'sin', 'su', 'sus', 'tu', 'tus', 'un', 'una', 'unos', 'unas', 'y', 'e', 'u', 'mi', 'mis', 'como', 'mas', 'menos', 'muy', 'este', 'esta', 'esto', 'cada', 'entre']);
const PROPIOS = ['Google', 'Gmail', 'Drive', 'Docs', 'Sheets', 'Slides', 'Meet', 'Classroom', 'Workspace', 'Calendar', 'Contactos', 'Word', 'Excel',
  'PowerPoint', 'Outlook', 'Teams', 'Microsoft', 'Canva', 'Chrome', 'Windows', 'Zoom', 'WhatsApp', 'YouTube', 'JavaScript', 'Python', 'Internet',
  'Universidad', 'Señor', 'Sipán', 'Perú', 'Chiclayo', 'Lambayeque'];
const planoTxt = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const PALABRA = /\p{L}[\p{L}\p{N}'-]*/gu;
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function pulir(clase) {
  const textoDe = Object.fromEntries(clase.bloques.map(b => [b.id, b.texto]));
  // nombres propios: los de la lista y las palabras que el guion escribe con mayuscula a mitad de oracion
  const propios = new Set(PROPIOS);
  for (const b of clase.bloques) {
    const pal = b.texto.split(/\s+/);
    pal.forEach((w, i) => {
      const limpia = w.replace(/^[¡¿"«(]+|[.,;:!?"»)]+$/g, '');
      if (i > 0 && /^\p{Lu}/u.test(limpia) && !/[.!?:]$/.test(pal[i - 1])) propios.add(limpia);
    });
  }
  // "Tres Niveles De Acceso" -> "Tres niveles de acceso" (respeta siglas, nombres propios y palabras como JavaScript)
  const sinTitleCase = s => {
    const t = String(s || '');
    const resto = (t.match(PALABRA) || []).slice(1).filter(w => w.length > 3 && !propios.has(w) && !/^\p{Lu}{2,}/u.test(w));
    if (!resto.length || resto.some(w => !/^\p{Lu}\p{Ll}/u.test(w))) return t;
    let primera = true;
    return t.replace(PALABRA, w => {
      if (primera) { primera = false; return w; }
      return propios.has(w) || !/^\p{Lu}\p{Ll}+$/u.test(w) ? w : w.toLowerCase();
    });
  };
  const sinPunto = s => String(s || '').replace(/(\.{3}|…)\s*$/, '').replace(/(?<!\.)\.\s*$/, '').replace(/[:;,]\s*$/, '').trim();
  const corta = s => sinPunto(sinTitleCase(s));
  // sin *palabra clave*: se marca la ultima palabra con peso ("¿Cómo organizas tu *proyecto*?")
  const conAcento = s => {
    const t = String(s || '');
    if (!t || t.includes('*')) return t;
    const pal = [...t.matchAll(PALABRA)].filter(m => m[0].length >= 4 && !MENORES.has(planoTxt(m[0])));
    const m = pal[pal.length - 1];
    return m ? `${t.slice(0, m.index)}*${m[0]}*${t.slice(m.index + m[0].length)}` : t;
  };
  // "cuando" que no esta en el texto del bloque: se busca una palabra del elemento que la voz si diga
  const dice = (c, id) => c && planoTxt(textoDe[id]).includes(planoTxt(c));
  const cuandoDe = (x, id, ...campos) => {
    if (dice(x.cuando, id)) return x.cuando;
    const t = planoTxt(textoDe[id]);
    const pal = campos.flatMap(c => String(x[c] || '').match(PALABRA) || []).filter(w => w.length >= 3 && !MENORES.has(planoTxt(w)));
    const esta = r => new RegExp(`(?<![\\p{L}\\p{N}])${escRe(r)}`, 'u').test(t);
    const largas = [...pal].sort((a, z) => z.length - a.length);
    if (largas.find(w => esta(planoTxt(w)))) return largas.find(w => esta(planoTxt(w))); // la palabra tal cual
    // o su raiz, cada vez mas corta ("verificación" -> "verifica"), sin bajar de 5 letras
    for (const w of largas) for (let n = w.length - 1; n >= Math.max(5, w.length - 4); n--) if (esta(planoTxt(w).slice(0, n))) return planoTxt(w).slice(0, n);
    return '';
  };

  for (const d of clase.diapositivas) {
    if (!d || d.tipo === 'imagen') continue;
    d.kicker = sinPunto(d.kicker);
    if (d.titulo) d.titulo = d.tipo === 'logo' ? d.titulo : conAcento(corta(d.titulo).replace(/^(.)/, c => c.toUpperCase()));
    if (d.sub) d.sub = sinTitleCase(d.sub);
    (d.items || []).forEach(x => { x.texto = corta(x.texto); if (d.tipo !== 'portada') x.cuando = cuandoDe(x, d.bloque, 'texto'); });
    (d.tarjetas || []).forEach(x => { x.titulo = corta(x.titulo); x.texto = sinTitleCase(x.texto); x.cuando = cuandoDe(x, d.bloque, 'titulo', 'texto'); });
    for (const lado of [d.izq, d.der]) {
      if (!lado || !(lado.titulo || lado.texto)) continue;
      lado.titulo = corta(lado.titulo);
      lado.texto = sinTitleCase(lado.texto);
      lado.cuando = cuandoDe(lado, d.bloque, 'titulo', 'texto', 'etiqueta');
    }
    if (d.tipo === 'cierre' && !d.despedida && d === clase.diapositivas[clase.diapositivas.length - 1]) d.despedida = `¡Nos vemos en la próxima clase! · ${clase.avatar || 'SIPANCITOBOT'}`;
  }
}

// ---------------------------------------------------------------- Google Vids
// Una lámina por bloque, al nivel de marca/modelos/laminas-gmail/. La IA gratis escribe el contenido
// (web/skills/vids.md) y el programa arma el prompt: así estilo, barra, textos fijos y zona del avatar salen iguales.
// El avatar va pegado al borde derecho (X + ancho = 1920). El logo va igual en todas las láminas, con 20 px de margen arriba y a la derecha.
export const AVATAR_VIDS = { ancho: 600, altura: 337.5, angulo: 0, x: 1320, y: 371 };
export const LOGO_VIDS = { ancho: 300, x: 1600, y: 20 };
const PARTE_DE_DIAPO = { portada: 'portada', pregunta: 'motivacion', temario: 'temario', cierre: 'conclusiones', logo: 'cierre' };
const PLANTILLAS_VIDS = ['tarjetas', 'pasos', 'tabla', 'lista'];
const PLANTILLA_DE_DIAPO = { ruta: 'pasos', pasos: 'pasos', flujo: 'pasos', comparacion: 'tarjetas', tarjetas: 'tarjetas', lista: 'lista' };
const BARRAS_VIDS = {
  logro: ['Logro de aprendizaje', 'una diana con flecha'],
  motivacion: ['Motivación', 'un signo de pregunta'],
  temario: ['Temario de la sesión', 'una lista en un portapapeles'],
  practica: ['Tarea de la sesión', 'un portapapeles con checks'],
};
const TEXTO_PRACTICA = 'Revisa las pautas y actividades que tu docente asignará en el aula virtual.';
const ESTILO_VIDS = 'Lámina horizontal 16:9 de un curso universitario, estilo infografía corporativa moderna y muy pulida. '
  + 'Fondo blanco con degradado azul muy pálido y formas suaves. Paleta: azul marino, azul brillante, verde y amarillo suave como acento. '
  + 'Tipografía sans serif clara, títulos en negrita. Tarjetas blancas o azul pálido con esquinas redondeadas y sombra suave. '
  + 'Íconos de línea azul. Todo el texto es grande y se lee a distancia, y el contenido llena todo el alto de la lámina.';
const ZONA_AVATAR_VIDS = 'Divide la lámina en tres columnas iguales. La columna derecha queda completamente vacía de arriba abajo, solo con el fondo: nada de texto, íconos, tarjetas, ilustraciones ni personas. Todo el contenido cabe dentro de las dos columnas izquierdas y ningún elemento cruza a la columna derecha.';
const CIERRE_VIDS = 'Usa exactamente los textos entre comillas, con todas sus tildes, sin agregar ni repetir palabras y sin escribir las comillas en la lámina. Sin personas ni personajes dibujados, sin logotipos y sin marcas de agua.';
const CIERRE_PANTALLA_VIDS = 'Usa exactamente los textos entre comillas, con todas sus tildes, sin agregar ni repetir palabras y sin escribir las comillas en la lámina. No dibujes personas, personajes, muñecos, mascotas ni ilustraciones decorativas: la única imagen es la captura. Sin marcas de agua. Los únicos logotipos son los propios de la aplicación dentro de la captura.';
// Software con guía propia en web/skills/pantallas/<clave>.md: sus láminas muestran la interfaz real.
const APPS_VIDS = [
  { clave: 'gmail', nombre: 'Gmail', patron: /\bgmail\b/i, web: true },
  { clave: 'drive', nombre: 'Google Drive', patron: /\b(google )?drive\b/i, web: true },
  { clave: 'documentos', nombre: 'Documentos de Google', patron: /google docs|documentos de google/i, web: true },
  { clave: 'hojas', nombre: 'Hojas de cálculo de Google', patron: /google sheets|hojas de c[aá]lculo de google/i, web: true },
  { clave: 'presentaciones', nombre: 'Presentaciones de Google', patron: /google slides|presentaciones de google/i, web: true },
  { clave: 'meet', nombre: 'Google Meet', patron: /google meet/i, web: true },
  { clave: 'calendario', nombre: 'Calendario de Google', patron: /google calendar|calendario de google/i, web: true },
  { clave: 'gemini', nombre: 'Gemini', patron: /\bgemini\b/i, web: true, marca: 'Google Gemini' },
  { clave: 'word', nombre: 'Microsoft Word', patron: /\bword\b/i },
  { clave: 'excel', nombre: 'Microsoft Excel', patron: /\bexcel\b/i },
  { clave: 'powerpoint', nombre: 'Microsoft PowerPoint', patron: /\bpowerpoint\b/i },
];
const VISTAS_VIDS = {
  general: 'Se ve la ventana completa de la aplicación',
  menu: 'El menú está abierto y la captura se acerca a esa zona',
  dialogo: 'Un cuadro de diálogo está abierto en primer plano y la ventana queda atenuada detrás',
  detalle: 'Es un acercamiento nítido a esa parte de la aplicación, con letras grandes y legibles',
  resultado: 'Se ve el trabajo ya terminado dentro de la aplicación',
};
const appVids = clase => APPS_VIDS.find(a => a.patron.test(`${clase.tema} ${clase.modulo} ${clase.curso}`));
const capturaVids = (app, c) => {
  const ventana = app.web ? 'dentro de una ventana de navegador' : 'en su ventana de programa de escritorio';
  const resaltado = c.resalta ? `. Un rectángulo rojo redondeado resalta ${String(c.resalta).replace(/[.\s]+$/, '')} y un cursor de flecha lo señala` : '';
  return `una captura de pantalla real de ${app.nombre} en computadora, en español, ${ventana}, plana y de frente, sin inclinación ni perspectiva, con la interfaz, los colores, los íconos y la tipografía originales: ${String(c.pantalla).replace(/[.\s]+$/, '')}. ${VISTAS_VIDS[c.vista] || VISTAS_VIDS.general}${resaltado}`;
};
const FORMATO_VIDS = `Responde SOLO con un objeto JSON, sin texto antes ni después:
{"laminas": [{"lamina": "02", "plantilla": "tarjetas", "barra": "...", "frase": "...", "ilustracion": "...", "pantalla": "...", "vista": "general", "resalta": "...", "experiencia": "...", "icono": "...", "items": [{"titulo": "...", "texto": "..."}]}]}
Escribe solo los campos que usa cada lámina. Dentro de los textos no uses comillas dobles.`;

const comillas = t => `"${String(t || '').replace(/"/g, '').trim()}"`;
const barraVids = (icono, texto, color = 'azul marino') => `Arriba, dentro de las dos columnas izquierdas, una barra ${color} con esquinas redondeadas; en su extremo izquierdo un cuadrado azul brillante con ${icono} en blanco; dentro de la barra, en blanco y negrita: ${comillas(texto)}.`;
const lista = items => items.map(i => (i.texto ? `${comillas(i.titulo)} con ${comillas(i.texto)}` : comillas(i.titulo))).join('; ');

// Las clases antiguas no guardan "parte" en sus bloques: se deduce de su diapositiva.
function parteParaVids(bloque, diapo) {
  const propia = parteDe(bloque.parte);
  if (propia) return propia;
  const kicker = String((diapo && diapo.kicker) || '').toLowerCase();
  if (/logro/.test(kicker)) return 'logro';
  if (/pr[aá]ctica/.test(kicker)) return 'practica';
  return PARTE_DE_DIAPO[diapo && diapo.tipo] || 'desarrollo';
}

export function laminasVids(clase, bloques = []) {
  const diapos = Object.fromEntries((clase.diapositivas || []).map(d => [String(d.bloque), d]));
  let tema = 0;
  return (clase.bloques || []).map(b => {
    const parte = parteParaVids(b, diapos[String(b.id)]);
    if (parte === 'desarrollo') tema++;
    return { id: String(b.id), parte, tema: parte === 'desarrollo' ? tema : 0, voz: b.texto, diapo: diapos[String(b.id)] || {} };
  }).filter(l => !bloques.length || bloques.includes(l.id));
}

// Los puntos de la diapositiva ya están revisados: se copian tal cual y la IA solo escribe los que faltan.
function itemsDeDiapo(d) {
  if (d.izq && d.der) return [d.izq, d.der].map(x => ({ titulo: String(x.etiqueta || x.titulo || '').toLowerCase().replace(/^./, m => m.toUpperCase()), texto: x.texto }));
  if (Array.isArray(d.tarjetas)) return d.tarjetas.map(x => ({ titulo: x.titulo, texto: x.texto }));
  return (Array.isArray(d.items) ? d.items : []).map(x => ({ titulo: typeof x === 'string' ? x : x.texto }));
}
const plantillaLamina = (l, c) => {
  if (l.parte !== 'desarrollo') return l.parte;
  if (c.pantalla) return 'pantalla';
  return PLANTILLA_DE_DIAPO[l.diapo.tipo] || (PLANTILLAS_VIDS.includes(c.plantilla) ? c.plantilla : 'tarjetas');
};
const itemsLamina = (l, c) => {
  const revisados = itemsDeDiapo(l.diapo).filter(i => i.titulo);
  return revisados.length >= 2 ? revisados : (Array.isArray(c.items) ? c.items : []).filter(i => i && i.titulo);
};

// El guion del avatar: el saludo usa «profesor virtual» en vez del nombre del asistente de la ficha.
function guionVids(texto, clase, experiencia) {
  const nombre = String(clase.avatar || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const base = nombre ? texto.replace(new RegExp(`Soy ${nombre}, tu [^.]*? de la`), 'Soy tu profesor virtual de la') : texto;
  return [base, String(experiencia || '').trim()].filter(Boolean).join(' ');
}

// La portada sigue la lámina modelo marca/modelos/laminas-gmail/01.png: texto a la izquierda y foto a la derecha.
function portadaVids(clase, sesion, app) {
  const icono = app ? ` En la parte alta de la fotografía, cerca del borde derecho, el ícono oficial de ${app.nombre} dentro de un globo de chat blanco con esquinas redondeadas y sombra suave.` : '';
  const marca = app ? `; al pie, el logotipo a todo color de ${app.marca || (app.web ? 'Google Workspace' : 'Microsoft 365')}` : '';
  return [
    'Portada horizontal 16:9 de un curso universitario, con acabado de publicidad corporativa, muy luminosa y pulida.',
    `La lámina tiene dos mitades. La mitad izquierda es blanca con un degradado azul muy pálido. La mitad derecha es una fotografía real y luminosa de una oficina moderna con ventanales, estantes y plantas, suavemente desenfocada y sin personas, que se funde con la mitad blanca por un borde diagonal suave. En la esquina inferior derecha, un triángulo verde brillante.${icono}`,
    `En la mitad izquierda, alineado a la izquierda y ocupando toda la altura, de arriba abajo: el texto azul marino de peso normal ${comillas(clase.programa || clase.curso)}; una barra con degradado de azul marino a azul brillante, esquinas redondeadas y texto blanco en negrita ${comillas(clase.modulo_programa || clase.modulo)}; una etiqueta verde brillante con esquinas redondeadas y texto blanco en negrita ${comillas(sesion)}; el título muy grande en negrita gruesa azul marino, directamente sobre el fondo blanco, sin tarjeta ni recuadro detrás, ${comillas(clase.tema)}${marca}.`,
    'Usa exactamente los textos entre comillas, con todas sus tildes, sin agregar ni repetir palabras y sin escribir las comillas en la lámina. Sin tarjetas, sobres ni ilustraciones dibujadas. Sin personas ni personajes. Sin marcas de agua. No escribas el nombre de la universidad ni otros logotipos.',
  ].join(' ');
}

// Hasta 5 temas van en una columna, como la lámina modelo 03.png. Con más, dos columnas de píldoras grandes.
function temarioVids(barra, items) {
  const solo = 'Nada más debajo de la barra: sin íconos, sin tarjetas y sin píldoras adicionales.';
  if (items.length <= 5) return `${barra} Debajo, ${items.length} píldoras blancas grandes con sombra, una por fila, cada una con un círculo azul a su izquierda con su número blanco, en este orden: ${lista(items)}. ${solo}`;
  const mitad = Math.ceil(items.length / 2);
  return `${barra} Debajo, ${items.length} píldoras blancas grandes con sombra, repartidas en dos columnas de ${mitad} filas, cada una con un círculo azul a su izquierda con su número blanco. Columna izquierda, números del 1 al ${mitad}, de arriba abajo: ${lista(items.slice(0, mitad))}. Columna derecha, números del ${mitad + 1} al ${items.length}, de arriba abajo: ${lista(items.slice(mitad))}. ${solo}`;
}

function promptLamina(l, c, clase) {
  const items = itemsLamina(l, c);
  const fija = BARRAS_VIDS[l.parte];
  const barra = fija ? barraVids(fija[1], fija[0]) : barraVids(l.tema ? `el número ${l.tema}` : c.icono, c.barra);
  const sesion = (/Sesi[oó]n\s+\d+/i.exec(`${clase.modulo} ${clase.tema}`) || ['Sesión'])[0];
  // La pregunta y el ejemplo del buscador ya están revisados en la diapositiva: se copian tal cual.
  const pregunta = /¿/.test(l.diapo.titulo || '') ? String(l.diapo.titulo).replace(/\*/g, '') : c.barra;
  const busqueda = String(l.diapo.codigo || '').split('\n')[0] || c.frase;
  const app = appVids(clase);
  if (l.parte === 'portada') return portadaVids(clase, sesion, app);
  const visual = app && c.pantalla ? capturaVids(app, l.parte === 'desarrollo' ? c : { pantalla: c.pantalla, vista: c.vista }) : `una ilustración grande de ${c.ilustracion}`;
  const titulos = items.map(i => ({ titulo: i.titulo })); // junto a una captura grande solo caben los títulos
  const cuerpo = {
    logro: app && c.pantalla
      ? `${barra} Debajo, ${visual}. La captura es la protagonista: ocupa todo el ancho de las dos columnas izquierdas. Debajo de la captura, una franja azul pálida con un círculo verde con check y el texto ${comillas(c.frase)}.`
      : `${barra} Debajo, a la izquierda, ${visual}. A su derecha, una tarjeta azul pálida con un círculo verde con check y el texto ${comillas(c.frase)}.`,
    motivacion: app && c.pantalla
      ? `${barraVids(BARRAS_VIDS.motivacion[1], pregunta)} Debajo, ${visual}. La captura es la protagonista: ocupa todo el ancho de las dos columnas izquierdas. Debajo de la captura, una franja azul pálida con el texto ${comillas(c.frase)}.`
      : `${barra} Debajo, a la izquierda, ${visual}. A su derecha, una tarjeta blanca con la pregunta en negrita azul marino ${comillas(pregunta)} y debajo la frase ${comillas(c.frase)}.`,
    temario: temarioVids(barra, items),
    practica: `${barra} Debajo, a la izquierda, una laptop con una lista de tareas con checks verdes. A su derecha, estas tareas con check verde: ${lista(items)}. Abajo, una tarjeta azul pálida con un círculo azul con la letra i y el texto ${comillas(TEXTO_PRACTICA)}.`,
    conclusiones: `${barraVids('una planta que crece', '¿Qué aprendí?', 'verde')} Debajo, filas con un círculo verde con check y el texto: ${lista(items)}.`,
    cierre: `Sin barra de título. Una ilustración de ${c.ilustracion} y, muy grande en negrita azul marino, el texto ${comillas(c.frase)}.`,
    pantalla: `${barra} Debajo, ${visual}. La captura es la protagonista: ocupa todo el ancho de las dos columnas izquierdas. Debajo de la captura, ${titulos.length} etiquetas azul pálido en negrita: ${lista(titulos)}.`,
    tarjetas: `${barra} Debajo, ${items.length} tarjetas azul pálido, cada una con un ícono de línea azul, título azul en negrita y texto: ${lista(items)}.`,
    pasos: `${barra} Debajo, una ruta de ${items.length} pasos numerados en círculos azules unidos por una línea, con título en negrita y texto: ${lista(items)}.`,
    tabla: `${barra} Debajo, una barra de búsqueda blanca con una lupa azul y el texto ${comillas(busqueda)}. Más abajo, una tabla de dos columnas con filas blancas redondeadas: ${lista(items)}.`,
    lista: `${barra} Debajo, a la izquierda, una ilustración de ${c.ilustracion}. A su derecha, filas con un círculo verde con check: ${lista(items)}.`,
  };
  return [ESTILO_VIDS, ZONA_AVATAR_VIDS, cuerpo[plantillaLamina(l, c)], app && c.pantalla ? CIERRE_PANTALLA_VIDS : CIERRE_VIDS].join(' ');
}

// Devuelve qué le falta a la lámina para repetir el pedido: un error de la IA aquí se volvería un error en pantalla.
function faltaEnLamina(l, c, clase) {
  const plantilla = plantillaLamina(l, c);
  const items = itemsLamina(l, c);
  const textos = [c.barra, c.frase, ...items.flatMap(i => [i.titulo, i.texto])].filter(Boolean);
  if (textos.some(x => /(^|[\s,])(\p{L}+),?\s+\2(?=[\s,.;:]|$)/iu.test(x))) return 'una palabra repetida';
  if (/ventena|mensaje nueva/i.test(c.pantalla || '')) return 'una errata: se escribe «ventana» y «Mensaje nuevo»';
  const hablado = `${c.pantalla || ''} ${c.experiencia || ''}`;
  if (/\b(boss|appears|the|and)\b/i.test(hablado)) return 'una palabra en inglés: escribe todo en español';
  if (/\b(entregás|podés|tenés|querés|sabés|hacés)\b/i.test(hablado)) return 'voseo: usa el trato de tú';
  if (items.some(i => String(i.texto || '').split(/\s+/).length > 12)) return 'un texto de más de 12 palabras';
  if (['temario', 'practica', 'conclusiones', 'tarjetas', 'pasos', 'tabla', 'lista'].includes(plantilla) && items.length < 2) return 'items';
  if (l.parte === 'desarrollo' && !c.barra) return 'barra';
  if (['logro', 'motivacion', 'cierre'].includes(plantilla) && !c.frase) return 'frase';
  if (appVids(clase) && (['logro', 'motivacion'].includes(plantilla) || l.parte === 'desarrollo') && !c.pantalla) return 'pantalla';
  const pideExperiencia = ['logro', 'motivacion', 'desarrollo', 'practica', 'conclusiones'].includes(l.parte);
  const experiencia = String(c.experiencia || '').trim();
  if (pideExperiencia && !experiencia) return 'experiencia';
  if (pideExperiencia && (experiencia.split(/\s+/).length > 34 || /\d|%|por ciento|yo trabaj|mi empresa|mi jefe/i.test(experiencia))) {
    return 'una experiencia de hasta 30 palabras, sin cifras y sin hablar de tu propio trabajo';
  }
  if (!c.pantalla && ['logro', 'motivacion', 'cierre', 'lista'].includes(plantilla) && !c.ilustracion) return 'ilustracion';
  return '';
}

function pedidoLamina(l, aviso) {
  return JSON.stringify({
    lamina: l.id, parte: l.parte, voz: l.voz, diapositiva: l.diapo, corregir: aviso,
    plantilla: l.parte === 'desarrollo' ? PLANTILLA_DE_DIAPO[l.diapo.tipo] : undefined,
    items_listos: itemsDeDiapo(l.diapo).length >= 2 || undefined,
  });
}
function guiasVids(clase) {
  const app = appVids(clase);
  return `${skill('vids')}${app ? `\n\n${skill(`pantallas/${app.clave}`)}` : ''}\n\n${FORMATO_VIDS}`;
}
const tituloVids = clase => [clase.curso, clase.modulo, clase.tema, clase.nivel].filter(Boolean).join(' · ');

// El pedido completo, con todo el contexto de la clase, para pegarlo en Claude o ChatGPT.
export function contextoVids(clase, bloques = []) {
  const conContenido = laminasVids(clase, bloques).filter(l => l.parte !== 'portada');
  return `${guiasVids(clase)}\n\nClase: ${tituloVids(clase)}\n\nEscribe estas láminas:\n${conContenido.map(l => pedidoLamina(l)).join('\n')}\n`;
}

// contenido: lo que escribió un modelo con más contexto (vids-contenido.json). Solo lo que falte se le pide a la IA gratis.
export async function promptsVids({ clase, env, bloques = [], contenido = {} }) {
  const laminas = laminasVids(clase, bloques);
  const hechas = {};
  for (const l of laminas) {
    if (l.parte === 'portada') hechas[l.id] = {}; // la portada sale de los datos de la clase
    if (!contenido[l.id] || hechas[l.id]) continue;
    const falta = faltaEnLamina(l, contenido[l.id], clase);
    if (falta) throw new Error(`Corrige la lámina ${l.id} de vids-contenido.json: ${falta}.`);
    hechas[l.id] = contenido[l.id];
  }
  const pedir = laminas.every(l => hechas[l.id]) ? null : clienteGratis(env, []);
  for (let intento = 0, avisos = {}; pedir && intento < 10 && Object.keys(hechas).length < laminas.length; intento++) {
    const grupo = laminas.filter(l => !hechas[l.id]).slice(0, 4); // el plan gratis acepta pocos tokens por minuto
    const inicios = [...new Set(Object.values(hechas).map(c => String(c.experiencia || '').split(/\s+/).slice(0, 2).join(' ')).filter(Boolean))];
    const variar = inicios.length ? `\n\nEn "experiencia" no empieces con: ${inicios.join(' · ')}.` : '';
    const { datos } = await pedir(guiasVids(clase), `Clase: ${tituloVids(clase)}\n\nEscribe estas láminas:\n${grupo.map(l => pedidoLamina(l, avisos[l.id])).join('\n')}${variar}`);
    for (const c of Array.isArray(datos.laminas) ? datos.laminas : []) {
      const l = grupo.find(g => g.id === String(c && c.lamina).padStart(2, '0'));
      if (!l) continue;
      const falta = faltaEnLamina(l, c, clase);
      if (falta) avisos[l.id] = `Tu respuesta anterior falló: ${falta}.`;
      else hechas[l.id] = c;
    }
  }
  const faltan = laminas.filter(l => !hechas[l.id]).map(l => l.id);
  if (faltan.length) throw new Error(`Falta el contenido de las láminas ${faltan.join(', ')}. Intenta de nuevo.`);
  return {
    avatar: AVATAR_VIDS,
    logo: LOGO_VIDS,
    laminas: laminas.map(l => ({ id: l.id, parte: l.parte, plantilla: plantillaLamina(l, hechas[l.id]), prompt: promptLamina(l, hechas[l.id], clase), guion: guionVids(l.voz, clase, hechas[l.id].experiencia) })),
  };
}

// ---------------------------------------------------------------- pedidos para cualquier modelo y láminas de Hyperframes
// Un pedido reúne las reglas, el ejemplo y el formato: se pega en Claude, ChatGPT o cualquier modelo futuro.
const fichaDeClase = clase => ({ ...clase, duracion: clase.duracion || clase.duracion_objetivo });
export function contextoGuion(clase) {
  const ficha = fichaDeClase(clase);
  return `${INTRO()}\n\n${REGLAS_GUION()}\n\n${guionDeEjemplo(ejemploPara(ficha))}\n\n${FORMATO_GUION}\n\n${fichaTexto(ficha)}\n`;
}

const FORMATO_HF = `Responde SOLO con un objeto JSON, sin texto antes ni después:
{"laminas": [{"lamina": "02", "html": "...", "imagen": "...", "animaciones": [{"selector": ".barra", "momento": 0.2, "efecto": "subir", "escalonado": 0}]}]}`;
const CLASES_HF = ['barra', 'barra-icono', 'barra-texto', 'frase', 'grupo', 'tarjeta', 'fila', 'num', 'texto', 'codigo', 'nota', 'icono', 'imagen'];
const CON_IMAGEN_HF = ['logro', 'motivacion', 'desarrollo'];
const ICONOS_HF = { logro: '✓', motivacion: '?', practica: '✓', conclusiones: '✓' };
const ETIQUETAS_HF = ['div', 'span', 'h2', 'h3', 'p', 'b', 'em', 'code'];
export const EFECTOS_HF = { aparecer: { opacity: 0 }, subir: { opacity: 0, y: 40 }, izquierda: { opacity: 0, x: -60 }, escala: { opacity: 0, scale: 0.85 } };
const sinEtiquetas = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const escHtml = t => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const duracionHf = guion => Math.round((guion.trim().split(/\s+/).length / 2.35 + 0.6) * 10) / 10;
const sesionDe = clase => (/Sesi[oó]n\s+\d+/i.exec(`${clase.modulo} ${clase.tema}`) || ['Sesión'])[0];

function portadaHf(clase) {
  const app = appVids(clase);
  const marca = app ? app.marca || (app.web ? 'Google Workspace' : 'Microsoft 365') : clase.curso;
  const colores = ['g-a', 'g-r', 'g-y', 'g-a', 'g-v', 'g-r'];
  const marcaHtml = /^Google /.test(marca) ? `${[...'Google'].map((x, i) => `<span class="${colores[i]}">${x}</span>`).join('')} ${escHtml(marca.slice(7))}` : escHtml(marca);
  return {
    html: `<div class="programa">${escHtml(clase.programa || clase.curso)}</div><div class="modulo">${escHtml(clase.modulo_programa || clase.modulo)}</div><div class="sesion">${escHtml(sesionDe(clase))}</div><div class="tema">${escHtml(clase.tema)}</div><div class="marca">${marcaHtml}</div>`,
    app: app ? app.clave : '',
    animaciones: [{ selector: '.programa', momento: 0.2, efecto: 'subir' }, { selector: '.modulo', momento: 0.5, efecto: 'izquierda' }, { selector: '.sesion', momento: 0.8, efecto: 'escala' }, { selector: '.tema', momento: 1.1, efecto: 'subir' }, { selector: '.marca', momento: 1.6, efecto: 'aparecer' }],
  };
}

// Devuelve qué falló para repetir el pedido: el HTML de un modelo nunca entra sin pasar por aquí.
function faltaEnHf(l, c, duracion) {
  const html = String(c.html || '').trim();
  if (html.length < 30) return 'html';
  if (/<\s*(script|style|iframe|img|video|audio|link|svg|a)\b|\son\w+\s*=|\s(style|id)\s*=|https?:/i.test(html)) return 'html prohibido: sin script, style, img, enlaces, id ni estilos en línea';
  const ajena = [...html.matchAll(/<\s*([a-z0-9]+)/gi)].map(m => m[1].toLowerCase()).find(t => !ETIQUETAS_HF.includes(t));
  if (ajena) return `la etiqueta ${ajena} no está permitida`;
  const clases = [...html.matchAll(/class\s*=\s*"([^"]*)"/g)].flatMap(m => m[1].split(/\s+/)).filter(Boolean);
  const mala = clases.find(x => !CLASES_HF.includes(x));
  if (mala) return `la clase ${mala} no existe`;
  const texto = sinEtiquetas(html);
  // Se revisa dentro de cada elemento: un título «Carpeta» seguido de su descripción no es una palabra repetida.
  if (/(^|[\s,])(\p{L}+),?\s+\2(?=[\s,.;:]|$)/iu.test(html.replace(/<[^>]+>/g, ' | '))) return 'una palabra repetida';
  if (/\b(entregás|podés|tenés|querés|sabés|hacés)\b/i.test(texto)) return 'voseo: usa el trato de tú';
  if (texto.split(/\s+/).length > 45) return 'demasiado texto: máximo 30 palabras';
  const ausente = itemsDeDiapo(l.diapo).map(i => String(i.titulo || '').trim()).find(t => t && !texto.toLowerCase().includes(t.toLowerCase()));
  if (ausente) return `falta el texto de la diapositiva: ${ausente}`;
  const icono = (/class="barra-icono"[^>]*>([^<]*)</.exec(html) || [])[1];
  if (!/class="barra"/.test(html)) return 'la barra';
  if (ICONOS_HF[l.parte] && (icono || '').trim() !== ICONOS_HF[l.parte]) return `en ${l.parte} barra-icono es ${ICONOS_HF[l.parte]}`;
  if (clases.length < 5) return 'más contenido: al menos 3 elementos además de la barra';
  if (l.parte === 'temario' && (/<(h3|p)\b/i.test(html) || !clases.includes('fila'))) return 'en temario usa solo filas con num y texto, sin subtítulos';
  const iconoMalo = [...html.matchAll(/data-icono="([^"]*)"/g)].map(m => m[1]).find(n => !NOMBRES_ICONOS.includes(n));
  if (iconoMalo) return `el ícono ${iconoMalo} no existe`;
  const pideImagen = CON_IMAGEN_HF.includes(l.parte);
  if (pideImagen && (!/<div class="imagen"><\/div>/.test(html) || String(c.imagen || '').trim().split(/\s+/).length < 6)) return 'agrega <div class="imagen"></div> y describe la imagen en "imagen"';
  const animaciones = Array.isArray(c.animaciones) ? c.animaciones : [];
  if (new Set(animaciones.map(a => a.selector)).size < 2) return 'anima también el contenido, no solo la barra';
  for (const a of animaciones) {
    if (!/^\.[a-z-]+$/.test(String(a.selector)) || !clases.includes(String(a.selector).slice(1))) return `el selector ${a.selector} no está en tu html`;
    if (!EFECTOS_HF[a.efecto]) return `el efecto ${a.efecto} no existe`;
    if (!(Number(a.momento) >= 0 && Number(a.momento) < duracion)) return `el momento ${a.momento} está fuera de los ${duracion} segundos`;
  }
  return '';
}

const pedidoHf = (l, duracion, aviso) => JSON.stringify({ lamina: l.id, parte: l.parte, voz: l.voz, segundos: duracion, diapositiva: l.diapo, corregir: aviso });
const guiasHf = () => `${skill('hyperframes')}\n\n${FORMATO_HF}`;
function laminasHf(clase, bloques, experiencias = {}) {
  return laminasVids(clase, bloques).map(l => {
    const guion = guionVids(l.voz, clase, experiencias[l.id]);
    return { ...l, guion, duracion: duracionHf(guion) };
  });
}
export function contextoHyperframes(clase, bloques = []) {
  const conContenido = laminasHf(clase, bloques).filter(l => l.parte !== 'portada');
  return `${guiasHf()}\n\nClase: ${tituloVids(clase)}\n\nEscribe estas láminas:\n${conContenido.map(l => pedidoHf(l, l.duracion)).join('\n')}\n`;
}

// contenido: lo que escribió Claude, ChatGPT u otro modelo (hyperframes-contenido.json). Solo lo que falte se le pide a la IA gratis.
// alAvanzar recibe lo ya aceptado tras cada pedido: si la IA se corta, el siguiente intento continúa desde ahí.
export async function contenidoHyperframes({ clase, env, bloques = [], contenido = {}, vids = {}, alAvanzar = () => {} }) {
  const experiencias = Object.fromEntries(Object.entries(vids).map(([id, c]) => [id, c.experiencia]));
  const laminas = laminasHf(clase, bloques, experiencias);
  const hechas = {};
  for (const l of laminas) {
    if (l.parte === 'portada') { hechas[l.id] = portadaHf(clase); continue; }
    if (!contenido[l.id]) continue;
    const falta = faltaEnHf(l, contenido[l.id], l.duracion);
    if (falta) throw new Error(`Corrige la lámina ${l.id} de hyperframes-contenido.json: ${falta}.`);
    hechas[l.id] = contenido[l.id];
  }
  const pedir = laminas.every(l => hechas[l.id]) ? null : clienteGratis(env, []);
  // Cada lámina tiene sus propios intentos: una que se resiste no detiene a las demás.
  const avisos = {};
  const fallos = {};
  const pendientes = () => laminas.filter(l => !hechas[l.id] && (fallos[l.id] || 0) < 4);
  while (pedir && pendientes().length) {
    const grupo = pendientes().slice(0, 3);
    const { datos } = await pedir(guiasHf(), `Clase: ${tituloVids(clase)}\n\nEscribe estas láminas:\n${grupo.map(l => pedidoHf(l, l.duracion, avisos[l.id])).join('\n')}`);
    for (const c of Array.isArray(datos.laminas) ? datos.laminas : []) {
      const l = grupo.find(g => g.id === String(c && c.lamina).padStart(2, '0'));
      if (!l) continue;
      const falta = faltaEnHf(l, c, l.duracion);
      if (falta) avisos[l.id] = `Tu respuesta anterior falló: ${falta}.`;
      else hechas[l.id] = c;
    }
    for (const l of grupo) if (!hechas[l.id]) fallos[l.id] = (fallos[l.id] || 0) + 1;
    alAvanzar(hechas);
  }
  const faltan = laminas.filter(l => !hechas[l.id]).map(l => (avisos[l.id] ? `${l.id} (${avisos[l.id].replace(/^Tu respuesta anterior falló: |\.$/g, '')})` : l.id));
  if (faltan.length) throw new Error(`Faltan las láminas ${faltan.join('; ')}. Lo demás quedó guardado: pulsa el botón otra vez para continuar.`);
  return laminas.map(l => ({ id: l.id, parte: l.parte, guion: l.guion, duracion: l.duracion, ...hechas[l.id] }));
}

// Lo que ni el programa ni el modelo de texto pueden dibujar: cada hueco lleva su prompt, para una IA de imágenes o para el docente.
export function imagenesHf(clase, laminas, vids = {}) {
  const app = appVids(clase);
  return laminas.flatMap(l => {
    if (l.parte === 'portada') return [{ id: `l${l.id}`, lamina: l.id, titulo: 'Foto de la portada', prompt: 'Fotografía real y luminosa de una oficina moderna con ventanales, estantes y plantas, suavemente desenfocada, sin personas, sin texto y sin logotipos. Formato horizontal 16:9.' }];
    if (!/class="imagen"/.test(l.html)) return [];
    const c = vids[l.id] || {};
    const prompt = app && c.pantalla ? `Imagen horizontal 16:9: ${capturaVids(app, c)}. Sin personas y sin marcas de agua.` : `Imagen horizontal 16:9, ilustración corporativa limpia en azul y blanco: ${l.imagen}. Sin texto, sin personas y sin marcas de agua.`;
    return [{ id: `l${l.id}`, lamina: l.id, titulo: String(app && c.pantalla ? c.pantalla : l.imagen || '').trim(), prompt }];
  });
}
