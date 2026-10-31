// Genera el guion y las diapositivas (plantillas) de una clase a partir de la ficha del docente.
// Modos: "manual" (el docente pega su guion, sin IA), "gratis" (API compatible con OpenAI: Groq,
// Ollama, OpenRouter...) y "claude" (API de Anthropic, de pago por uso).
// Con LAMINAS (imagenes de las diapositivas del docente) la IA las mira y escribe lo que dice la voz en cada una.

import fs from 'node:fs';
import path from 'node:path';

export const TIPOS = ['portada', 'idea', 'lista', 'codigo', 'comparacion', 'tarjetas', 'pasos', 'dato', 'cierre'];
const TIPOS_VALIDOS = [...TIPOS, 'imagen']; // "imagen" = una lamina subida; la IA no la elige
const texto = e => String((e && e.message) || e);
export const rutaLamina = v => (/^laminas\/\d{2}\.(jpg|png|webp)$/.test(String(v || '')) ? String(v) : '');

// ---------------------------------------------------------------- prompt
const INTRO = `Eres el productor de clases en video de 2 a 3 minutos de la Universidad Señor de Sipán (USS).
Cada clase se ve como una clase por Zoom: una diapositiva compartida con animaciones y un avatar que habla.
Son clases universitarias reales: el contenido debe ser correcto, claro y bien escrito.`;

const REGLAS_PLAN = `- "pronunciacion": siglas, URLs o palabras en inglés que una voz en español leería mal, con cómo deben sonar
  (ej.: {"escrito": "CSS", "dice": "ce ese ese"}, {"escrito": "HTML", "dice": "hache te eme ele"}). Solo afecta a la voz.
- "agenda": 3 a 6 puntos cortos (máx. 24 caracteres) con el bloque donde empieza cada uno ("desde").`;

const REGLAS_GUION = `GUION: lo que dice la voz, a partir de la ficha del docente.
Si la ficha deja campos vacíos (objetivo, puntos, ejemplo, reto), decide tú lo más útil para el tema y el nivel:
un objetivo claro, 3 o 4 ideas clave, un ejemplo concreto (código si aplica) y un reto práctico corto.

REGLAS DEL GUION
- La voz habla unas 2,4 palabras por segundo: 2:30 = 330-360 palabras en total; 2:00 = ~270; 3:00 = ~420.
- 8 a 10 bloques. Cada bloque: 1 a 4 oraciones, 20 a 55 palabras, una idea. Ids "01", "02", ...
- Estructura: 1) saludo y gancho (el avatar se presenta por su nombre y dice el tema), 2) el problema o pregunta,
  3) contexto o definición, 4-7) desarrollo con ejemplos concretos, 8) resumen o beneficios, 9) reto práctico y despedida.
- Español latinoamericano (Perú) claro y natural, oraciones cortas, trato de "tú" (nunca "vosotros": nada de
  "recordad" ni "mirad"), al nivel indicado. Escribe como se habla. Cuida la ortografía y la concordancia (el/la, los/las).
- El texto de cada bloque es SOLO lo que la voz dice en voz alta: sin comillas, sin código y sin símbolos sueltos.
  Los símbolos se dicen con palabras: "un punto", "el numeral", "dos puntos", "las llaves". El código va en las diapositivas.
- Las siglas se escriben normal en el texto (CSS, HTML, ID). Cómo suenan va SOLO en "pronunciacion", nunca en el texto.
- Exactitud: solo datos verificables. No inventes cifras, fechas, citas ni funciones.
${REGLAS_PLAN}`;

const REGLAS_DIAPOS = `DIAPOSITIVAS: una por bloque, en el mismo orden ("bloque" = id del bloque al que acompaña).
Haz EXACTAMENTE una por cada bloque que se te pida. La del bloque 01 es portada y la del último bloque es cierre.
Tipos disponibles:
- portada: kicker, titulo, sub, items (2-5 chips cortos, p. ej. etiquetas o conceptos). Úsala solo en el bloque 01.
- idea: kicker, titulo, sub. Para una idea o pregunta clave.
- lista: kicker, titulo, items (2-5 viñetas de máx. 10 palabras).
- pasos: kicker, titulo, items (2-5 pasos numerados).
- codigo: kicker, titulo, sub, codigo (máx. 14 líneas y 50 caracteres por línea; HTML, CSS o JS real, correcto y en inglés,
  que funcione tal cual: "color: blue;", nunca "color: azul;").
- comparacion: kicker, titulo, izq y der, los DOS llenos (etiqueta corta en mayúsculas, titulo, texto de máx. 15 palabras).
- tarjetas: kicker, titulo, tarjetas (2-4 con titulo y texto de máx. 12 palabras).
- dato: kicker, dato (número o palabra corta, p. ej. "404" o "1994"), titulo, sub.
- cierre: kicker, titulo, items (resumen y reto), despedida (ej.: "¡Nos vemos en la próxima clase! · NOMBRE DEL AVATAR").
Reglas de diapositivas:
- titulo de máx. 7 palabras; marca la palabra clave entre asteriscos: "Semántica = *significado*".
- kicker: 1 a 4 palabras en español, en mayúsculas o tipo etiqueta ("El problema", "Paso 2 · La petición").
- En pantalla van las ideas clave, no el texto de la voz. Todo lo que se ve debe ser correcto.
- "cuando": una palabra o frase corta copiada TAL CUAL (con tildes) del texto de ESE bloque; el elemento aparece cuando la voz la dice.
- Usa variedad de tipos: al menos 1 codigo o comparacion o tarjetas cuando el tema lo permita.`;

const REGLAS_LAMINAS = `GUION A PARTIR DE LÁMINAS: el docente ya hizo sus láminas (imágenes de sus diapositivas).
Mira cada lámina y escribe lo que dice la voz mientras esa lámina está en pantalla.
- Explica el contenido de la lámina con tus palabras, como un buen docente: no la leas palabra por palabra
  ni describas su diseño (nada de "en esta lámina vemos" o "la imagen muestra").
- 20 a 60 palabras por lámina (10 a 25 segundos). Una lámina de título o de sección: 15 a 30 palabras.
- Primera lámina: el avatar saluda, se presenta por su nombre y dice el tema. Última lámina: resumen o reto y despedida.
- Si la lámina tiene código, explica qué hace; no lo dictes símbolo por símbolo.
- Español latinoamericano (Perú) claro y natural, oraciones cortas, trato de "tú" (nunca "vosotros"). Escribe como se habla.
- Exactitud: di solo lo que está en la lámina o es verificable. No inventes cifras, fechas ni citas.
- El texto es SOLO lo que la voz dice en voz alta: sin comillas, sin código y sin símbolos sueltos.
- Las siglas y direcciones se escriben normal en el texto (CSS, HTML, uss.edu.pe): no las deletrees.
- "pronunciacion": cómo se dicen EN ESPAÑOL las siglas de esa lámina (HTML = "hache te eme ele", HTTP = "hache te te pe"),
  nunca en inglés. Solo afecta a la voz.`;
const REGLAS_EFECTOS = `EFECTOS (opcionales, 0 a 5 por lámina): señalan en la lámina lo que la voz va nombrando.
- "numero": en una lista o en pasos SIN números, uno por cada punto, en el orden en que la voz los nombra.
  Si los puntos ya tienen número o viñeta en la lámina, usa "foco" en cada punto (no "numero").
- "foco": enmarca una parte (un recuadro, una imagen, un dato) y oscurece lo demás.
- "resaltar": subraya como plumón una frase clave.
- "zoom": acerca la cámara a un detalle pequeño (una captura, un menú, un código). Máximo 1 por lámina.
- "que": el elemento que señala, con el texto que se lee en él (ej.: "fila 2: Configuración inicial y personalización").
- "cuando": una palabra o frase corta copiada TAL CUAL de tu "texto": el efecto aparece cuando la voz la dice.
- En la portada no uses efectos. Si la lámina no tiene una lista ni nada que señalar, deja "efectos": [].`;
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
  SIPANCITOBOT: 'sipancitobot', Gmail: 'ge meil', Google: 'gúgol', Workspace: 'uórkspeis', Drive: 'draiv', Classroom: 'clásrum',
};
function pronunciacionBase(clase) {
  const texto = clase.bloques.map(b => b.texto).join(' ');
  for (const [escrito, dice] of Object.entries(PRONUNCIACION_BASE)) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escrito.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u');
    if (re.test(texto)) clase.pronunciacion[escrito] = dice;
  }
}

// Claude lo hace todo en una sola respuesta (salida estructurada, sin tope corto)
const REGLAS = `${INTRO}
Escribe el GUION y las DIAPOSITIVAS (plantillas) de la clase.

${REGLAS_GUION}

${REGLAS_DIAPOS}`;

// La IA gratis trabaja POR PARTES (guion, luego diapositivas) y cada diapositiva lleva solo los campos de su
// tipo: asi cada respuesta es corta. Si aun asi se corta por el tope de tokens, se pide la parte que falta.
const FORMATO_GUION = `Responde SOLO con un objeto JSON, sin texto antes ni después, con esta forma:
{"tema": "...", "agenda": [{"titulo": "...", "desde": "02"}], "pronunciacion": [{"escrito": "CSS", "dice": "ce ese ese"}],
 "bloques": [{"id": "01", "texto": "..."}, {"id": "02", "texto": "..."}]}`;
const FORMATO_SIGUE = `Responde SOLO con un objeto JSON, sin texto antes ni después: {"bloques": [{"id": "07", "texto": "..."}]}`;
const FORMATO_PLAN = `Responde SOLO con un objeto JSON, sin texto antes ni después:
{"agenda": [{"titulo": "...", "desde": "02"}], "pronunciacion": [{"escrito": "CSS", "dice": "ce ese ese"}]}`;
const FORMATO_DIAPOS = `Responde SOLO con un objeto JSON, sin texto antes ni después, con esta forma:
{"diapositivas": [
  {"bloque": "01", "tipo": "portada", "kicker": "...", "titulo": "... *clave*", "sub": "...", "items": [{"texto": "...", "cuando": ""}]},
  {"bloque": "02", "tipo": "comparacion", "kicker": "...", "titulo": "...", "izq": {"etiqueta": "...", "titulo": "...", "texto": "...", "cuando": "..."}, "der": {"etiqueta": "...", "titulo": "...", "texto": "...", "cuando": "..."}},
  {"bloque": "03", "tipo": "codigo", "kicker": "...", "titulo": "...", "sub": "...", "codigo": "p {\n  color: blue;\n}"}]}
En cada diapositiva escribe SOLO los campos que usa su tipo; no pongas campos vacíos.`;

function fichaTexto(ficha) {
  const f = k => (ficha[k] || '').toString().trim();
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
  ].join('\n');
}

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
const ITEM = obj({ texto: str, cuando: str });
const LADO = obj({ etiqueta: str, titulo: str, texto: str, cuando: str });
const TARJETA = obj({ titulo: str, texto: str, cuando: str });
const DIAPO = obj({
  bloque: str, tipo: { type: 'string', enum: TIPOS }, kicker: str, titulo: str, sub: str, nota: str,
  items: { type: 'array', items: ITEM }, codigo: str, izq: LADO, der: LADO,
  tarjetas: { type: 'array', items: TARJETA }, dato: str, despedida: str,
});
export const ESQUEMA_CLASE = obj({
  tema: str,
  agenda: { type: 'array', items: obj({ titulo: str, desde: str }) },
  pronunciacion: { type: 'array', items: obj({ escrito: str, dice: str }) },
  bloques: { type: 'array', items: obj({ id: str, texto: str }) },
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
  return claudeJson(env, `${REGLAS}\n- Rellena con "" o [] los campos que no use el tipo elegido.`, pedido(ficha, bloquesFijos), ESQUEMA_CLASE);
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
  if (!(Array.isArray(guion.agenda) && guion.agenda.length)) {
    const { datos } = await pedir(`${INTRO}\n\n${REGLAS_PLAN}\n\n${FORMATO_PLAN}`,
      `${fichaTexto(ficha)}\n\nGUION:\n${JSON.stringify(guion.bloques)}\n\nCrea solo la agenda y la pronunciación de este guion.`);
    guion.agenda = datos.agenda;
    if (!(Array.isArray(guion.pronunciacion) && guion.pronunciacion.length)) guion.pronunciacion = datos.pronunciacion;
  }
  // 2) diapositivas: se piden las que falten hasta tenerlas todas completas
  const diapositivas = await diapositivasPorPartes(pedir, ficha, guion.bloques);
  const uso = {
    partes: usos.length,
    prompt_tokens: usos.reduce((t, u) => t + (u.prompt_tokens || 0), 0),
    completion_tokens: usos.reduce((t, u) => t + (u.completion_tokens || 0), 0),
    fin: usos.map(u => u.fin),
  };
  return { datos: { ...guion, diapositivas }, uso };
}

async function guionPorPartes(pedir, ficha) {
  const objetivo = Math.round((segundos(ficha.duracion) || 150) * 2.3);
  let plan = {};
  let bloques = [];
  let sinAvance = 0;
  for (let parte = 0; parte < 6 && bloques.length < 14; parte++) {
    const sigue = bloques.length > 0;
    const usuario = sigue
      ? [fichaTexto(ficha), '', 'TU RESPUESTA ANTERIOR SE CORTÓ. Estos bloques ya están escritos (no los repitas ni los cambies):',
        JSON.stringify(bloques), '',
        `Escribe SOLO los bloques que faltan, desde el "${dosDigitos(bloques.length + 1)}", siguiendo la estructura hasta el reto y la despedida.`,
        `Van ${contarPalabras(bloques)} palabras; el guion completo debe tener unas ${objetivo}.`].join('\n')
      : fichaTexto(ficha);
    const { datos, cortada } = await pedir(`${INTRO}\n\n${REGLAS_GUION}\n\n${sigue ? FORMATO_SIGUE : FORMATO_GUION}`, usuario);
    if (!sigue) plan = { tema: datos.tema, agenda: datos.agenda, pronunciacion: datos.pronunciacion };
    const nuevos = (Array.isArray(datos.bloques) ? datos.bloques : []).filter(b => b && String(b.texto || '').trim());
    bloques = [...bloques, ...nuevos].slice(0, 14).map((b, i) => ({ id: dosDigitos(i + 1), texto: String(b.texto).replace(/\s+/g, ' ').trim() }));
    if (bloques.length && !cortada) break;
    if (!nuevos.length && ++sinAvance >= 2) break;
  }
  if (bloques.length < 3) throw new Error('La IA gratis no logró escribir el guion. Intenta de nuevo o usa otro modelo.');
  return { ...plan, bloques };
}

// Una diapositiva cuenta solo si tiene todo lo que su tipo necesita (una comparacion sin lado derecho no sirve)
function diapositivaCompleta(d) {
  if (!d || !TIPOS.includes(d.tipo) || !String(d.titulo || '').trim()) return false;
  const lleno = x => x && String(x.titulo || x.texto || '').trim();
  const cuantos = a => (Array.isArray(a) ? a.filter(lleno).length : 0);
  switch (d.tipo) {
    case 'lista': case 'pasos': return cuantos(d.items) >= 2;
    case 'cierre': return cuantos(d.items) >= 1 || !!String(d.despedida || '').trim();
    case 'codigo': return !!String(d.codigo || '').trim();
    case 'comparacion': return !!(lleno(d.izq) && lleno(d.der));
    case 'tarjetas': return cuantos(d.tarjetas) >= 2;
    case 'dato': return !!String(d.dato || '').trim();
    default: return true;
  }
}

async function diapositivasPorPartes(pedir, ficha, bloques) {
  const ids = bloques.map(b => b.id);
  const ultimo = ids[ids.length - 1];
  const hechas = {};
  let sinAvance = 0;
  let porParte = ids.length; // si una respuesta se corta, las siguientes piden menos diapositivas a la vez
  for (let parte = 0; parte < 12; parte++) {
    const faltan = ids.filter(id => !hechas[id]).slice(0, porParte);
    if (!faltan.length) break;
    const listas = ids.filter(id => hechas[id]).map(id => `${id} (${hechas[id].tipo})`);
    const usuario = [
      fichaTexto(ficha), '',
      'GUION COMPLETO (cada diapositiva acompaña a su bloque):', JSON.stringify(bloques), '',
      listas.length ? `Ya están hechas las diapositivas de los bloques ${listas.join(', ')}: no las repitas y varía los tipos.` : '',
      `Crea las diapositivas SOLO para estos bloques, una por bloque y en orden: ${faltan.join(', ')}.`,
      faltan.includes(ultimo) ? `La del bloque ${ultimo} es de tipo cierre.` : '',
    ].filter(Boolean).join('\n');
    const { datos, cortada } = await pedir(`${INTRO}\n\n${REGLAS_DIAPOS}\n\n${FORMATO_DIAPOS}`, usuario);
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

  return async function pedir(sistema, usuario) {
    let r, cuerpo, esperas = 0;
    for (let intento = 0; intento < 8; intento++) {
      const peticion = { model: modelo, messages: [{ role: 'system', content: sistema }, { role: 'user', content: usuario }] };
      if (formatoJson) peticion.response_format = { type: 'json_object' };
      if (maximo) peticion.max_tokens = maximo;
      try {
        r = await fetch(`${url}/chat/completions`, { method: 'POST', headers: cabeceras, body: JSON.stringify(peticion) });
      } catch (e) {
        throw new Error(`No hay conexión con la IA gratis (${url}): ${texto(e.cause || e)}`);
      }
      cuerpo = await r.text();
      if (r.ok) break;
      // "Request too large ... (OTPM): Limit 1000, Requested 1041": pedir menos tokens por respuesta (no sirve esperar)
      const muyGrande = /request too large|max_(completion_)?tokens/i.test(cuerpo);
      if (r.status === 429 && !muyGrande) {
        const s = esperaDe(r, cuerpo);
        if (s != null && s <= 65 && esperas < 4) { esperas++; await dormir((s + 1) * 1000); continue; }
        break;
      }
      if (r.status === 400 && formatoJson && /response_format|json_object/i.test(cuerpo)) { formatoJson = false; continue; }
      if (([400, 413].includes(r.status) || muyGrande) && maximo) {
        const nuevo = maximoPermitido(cuerpo, maximo);
        if (nuevo !== maximo) { maximo = nuevo; continue; }
      }
      break;
    }
    if (!r.ok) {
      const sinVision = vision && r.status >= 400 && r.status < 500 && /image|vision|multimodal|image_url|content type/i.test(cuerpo);
      const pista = r.status === 401 ? ' (API key inválida)'
        : sinVision ? ` (el modelo ${modelo} no lee imágenes: en Ajustes › IA que lee láminas usa qwen/qwen3.8-27b en Groq o gemini-3.8-flash en Gemini)`
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
// "max_tokens must be less than or equal to 4096" -> pedir ese maximo. Si no acepta max_tokens, sin limite (0).
function maximoPermitido(cuerpo, maximo) {
  let m = /Limit (\d+), Requested (\d+)/i.exec(cuerpo);
  if (m) {
    const n = maximo - (+m[2] - +m[1]) - 100;
    return n >= 400 ? n : maximo; // con poco espacio por respuesta, la clase se pide en mas partes
  }
  m = /max_(?:completion_)?tokens\D*?(?:less than or equal to|at most|<=)\D*(\d+)/i.exec(cuerpo);
  if (m && +m[1] < maximo) return +m[1];
  if (/max_(?:completion_)?tokens/i.test(cuerpo)) return 0;
  return maximo;
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
  // respuesta cortada a la mitad: se aprovecha hasta el ultimo elemento completo
  const rescatado = a >= 0 ? cerrarJson(limpio.slice(a)) : null;
  if (rescatado) return rescatado;
  throw new Error(cortada
    ? 'La respuesta de la IA gratis se cortó (límite de tokens). Intenta de nuevo o usa otro modelo.'
    : 'La IA gratis no devolvió un JSON válido. Intenta de nuevo o usa otro modelo.');
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
      fichaTexto(ficha), '',
      `LÁMINA ${i + 1} DE ${n} (la imagen va adjunta).`,
      i === 0 ? 'Es la primera lámina: saludo; el avatar se presenta por su nombre y dice el tema.' : '',
      i === n - 1 && n > 1 ? 'Es la última lámina: resumen o reto práctico y despedida.' : '',
      anterior ? `La voz acaba de decir, en la lámina anterior (no lo repitas, continúa la clase): ${anterior.texto}` : '',
    ].filter(Boolean).join('\n');
    const { url, w, h } = cuadradas[i];
    const { datos } = await pedir(`${INTRO}\n\n${REGLAS_LAMINAS}\n\n${REGLAS_EFECTOS}\n\n${FORMATO_LAMINA}`,
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
    const { datos } = await pedir(`${INTRO}\n\n${REGLAS_PLAN}\n\n${FORMATO_PLAN}`,
      `${fichaTexto(ficha)}\n\nTÍTULOS DE LAS LÁMINAS: ${JSON.stringify(hechas.map(x => x.titulo))}\n\nGUION (un bloque por lámina):\n${JSON.stringify(bloques)}\n\nCrea solo la agenda y la pronunciación de este guion.`);
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
  const contenido = [{ type: 'text', text: `${fichaTexto(ficha)}\n\nSon ${n} láminas, en orden. Escribe EXACTAMENTE ${n} textos en "laminas" (uno por lámina, en el mismo orden). ` +
    'En la agenda, "desde" es el número de la lámina donde empieza cada punto, con dos dígitos ("01", "02"...).' }];
  const cuadradas = await laminasCuadradas(dir, laminas);
  cuadradas.forEach((c, i) => contenido.push({ type: 'text', text: `Lámina ${i + 1} (arriba a la izquierda de un cuadrado blanco):` },
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: c.url.split(',')[1] } }));
  const { datos, uso } = await claudeJson(env, `${INTRO}\n\n${REGLAS_LAMINAS}\n\n${REGLAS_EFECTOS}\n${CAJA_CLAUDE}\n${REGLAS_PLAN}`, contenido, ESQUEMA_LAMINAS);
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
  pronunciacionBase(clase);
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
  if (['lista', 'pasos', 'cierre'].includes(d.tipo) && !d.items.length && !d.despedida) return { ...d, tipo: 'idea' };
  if (d.tipo === 'tarjetas' && !d.tarjetas.length) return { ...d, tipo: 'idea' };
  if (d.tipo === 'codigo' && !d.codigo.trim()) return { ...d, tipo: 'idea' };
  if (d.tipo === 'dato' && !d.dato) return { ...d, tipo: 'idea' };
  return d;
}

// ---------------------------------------------------------------- normalizacion
const corto = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const items = (arr, n, largo) => (Array.isArray(arr) ? arr : []).filter(x => x && (x.texto || x.titulo))
  .slice(0, n).map(x => ({ texto: corto(x.texto, largo), cuando: corto(x.cuando, 40) }));

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
    const lado = x => ({ etiqueta: corto(x && x.etiqueta, 24), titulo: corto(x && x.titulo, 60), texto: corto(x && x.texto, 140), cuando: corto(x && x.cuando, 40) });
    return {
      bloque,
      tipo,
      kicker: corto(d.kicker, 40), titulo: corto(d.titulo, 90), sub: corto(d.sub, 180), nota: corto(d.nota, 180),
      items: items(d.items, 6, 110),
      codigo: String(d.codigo || '').split('\n').slice(0, 18).map(l => l.slice(0, 72)).join('\n'),
      izq: lado(d.izq), der: lado(d.der),
      tarjetas: (Array.isArray(d.tarjetas) ? d.tarjetas : []).slice(0, 4).map(x => ({ titulo: corto(x.titulo, 40), texto: corto(x.texto, 110), cuando: corto(x.cuando, 40) })),
      dato: corto(d.dato, 12), despedida: corto(d.despedida, 80),
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
    return { clase: normalizar({ bloques, diapositivas: diapositivasBasicas(ficha, bloques) }, ficha, base), uso: null };
  }
  const bloquesFijos = guion ? (Array.isArray(guion) ? guion : guionManual(guion)) : null;
  const { datos, uso } = modo === 'claude' ? await conClaude(ficha, bloquesFijos, env) : await conIaGratis(ficha, bloquesFijos, env);
  if (bloquesFijos) datos.bloques = bloquesFijos; // el guion del docente no se toca
  const clase = normalizar(datos, ficha, base);
  if (!bloquesFijos) sinDeletreos(clase);
  pronunciacionBase(clase);
  const simples = completarDiapositivas(clase, ficha);
  const aviso = simples.length
    ? `La IA no completó las diapositivas de los bloques ${simples.join(', ')}: puse unas simples. Revísalas o pulsa «Diapositivas con IA».`
    : '';
  return { clase, uso, aviso };
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
