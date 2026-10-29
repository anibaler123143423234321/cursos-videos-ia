// Genera el guion y las diapositivas (plantillas) de una clase a partir de la ficha del docente.
// Modos: "manual" (el docente pega su guion, sin IA), "gratis" (API compatible con OpenAI: Groq,
// Ollama, OpenRouter...) y "claude" (API de Anthropic, de pago por uso).

export const TIPOS = ['portada', 'idea', 'lista', 'codigo', 'comparacion', 'tarjetas', 'pasos', 'dato', 'cierre'];
const texto = e => String((e && e.message) || e);

// ---------------------------------------------------------------- prompt
const REGLAS = `Eres el productor de clases en video de 2 a 3 minutos de la Universidad Señor de Sipán (USS).
Cada clase se ve como una clase por Zoom: una diapositiva compartida con animaciones y un avatar que habla.
Escribe el GUION (lo que dice la voz) y las DIAPOSITIVAS (plantillas) a partir de la ficha del docente.

REGLAS DEL GUION
- La voz habla unas 2,4 palabras por segundo: 2:30 = 330-360 palabras en total; 2:00 = ~270; 3:00 = ~420.
- 8 a 10 bloques. Cada bloque: 1 a 4 oraciones, 20 a 55 palabras, una idea. Ids "01", "02", ...
- Estructura: 1) saludo y gancho (el avatar se presenta por su nombre y dice el tema), 2) el problema o pregunta,
  3) contexto o definición, 4-7) desarrollo con ejemplos concretos, 8) resumen o beneficios, 9) reto práctico y despedida.
- Español claro y natural, oraciones cortas, trato de "tú", al nivel indicado. Escribe como se habla.
- Exactitud: solo datos verificables. No inventes cifras, fechas, citas ni funciones.
- "pronunciacion": siglas, URLs o palabras en inglés que una voz en español leería mal, con cómo deben sonar
  (ej.: {"escrito": "CSS", "dice": "ce ese ese"}). Solo afecta a la voz.
- "agenda": 3 a 6 puntos cortos (máx. 24 caracteres) con el bloque donde empieza cada uno ("desde").

DIAPOSITIVAS (una por bloque, en el mismo orden; "bloque" = id del bloque donde aparece)
Tipos disponibles:
- portada: kicker, titulo, sub, items (2-5 chips cortos, p. ej. etiquetas o conceptos). Úsala solo en el bloque 01.
- idea: kicker, titulo, sub. Para una idea o pregunta clave.
- lista: kicker, titulo, items (2-5 viñetas de máx. 10 palabras).
- pasos: kicker, titulo, items (2-5 pasos numerados).
- codigo: kicker, titulo, sub, codigo (máx. 14 líneas y 50 caracteres por línea; HTML, CSS o JS real y correcto).
- comparacion: kicker, titulo, izq y der (etiqueta corta en mayúsculas, titulo, texto de máx. 15 palabras).
- tarjetas: kicker, titulo, tarjetas (2-4 con titulo y texto de máx. 12 palabras).
- dato: kicker, dato (número o palabra corta, p. ej. "404" o "1994"), titulo, sub.
- cierre: kicker, titulo, items (resumen y reto), despedida (ej.: "¡Nos vemos en la próxima clase! · NOMBRE DEL AVATAR").
Reglas de diapositivas:
- titulo de máx. 7 palabras; marca la palabra clave entre asteriscos: "Semántica = *significado*".
- kicker: 1 a 4 palabras en mayúsculas o tipo etiqueta ("El problema", "Paso 2 · La petición").
- En pantalla van las ideas clave, no el texto de la voz.
- "cuando": una palabra o frase corta que aparece TAL CUAL en el texto del bloque; el elemento aparece cuando la voz la dice.
- Usa variedad de tipos: al menos 1 codigo o comparacion o tarjetas cuando el tema lo permita.
- Rellena con "" o [] los campos que no use el tipo elegido.`;

const EJEMPLO_JSON = `{
  "tema": "...",
  "agenda": [{"titulo": "...", "desde": "02"}],
  "pronunciacion": [{"escrito": "CSS", "dice": "ce ese ese"}],
  "bloques": [{"id": "01", "texto": "..."}],
  "diapositivas": [{"bloque": "01", "tipo": "portada", "kicker": "...", "titulo": "... *clave*", "sub": "...", "nota": "",
    "items": [{"texto": "...", "cuando": ""}], "codigo": "", "izq": {"etiqueta": "", "titulo": "", "texto": "", "cuando": ""},
    "der": {"etiqueta": "", "titulo": "", "texto": "", "cuando": ""}, "tarjetas": [], "dato": "", "despedida": ""}]
}`;

function pedido(ficha, bloquesFijos) {
  const f = k => (ficha[k] || '').toString().trim();
  const lineas = [
    'FICHA DE LA CLASE',
    `Nombre del avatar: ${f('avatar') || 'SIPANCITOBOT'}`,
    `Rol del avatar: ${f('rol_avatar') || 'Asistente docente IA'}`,
    `Universidad: ${f('institucion') || 'Universidad Señor de Sipán'}`,
    `Curso: ${f('curso')}`,
    `Tema: ${f('tema')}`,
    `Nivel: ${f('nivel') || 'Básico'}`,
    `Duración: ${f('duracion') || '2:30'}`,
    `Objetivo de aprendizaje: ${f('objetivo')}`,
    `Puntos que debe cubrir: ${f('puntos')}`,
    `Ejemplo o código a mostrar: ${f('ejemplo')}`,
    `Reto o tarea final: ${f('reto')}`,
    `Notas: ${f('notas')}`,
  ];
  if (bloquesFijos) {
    lineas.push('', 'EL GUION YA ESTÁ ESCRITO. Usa EXACTAMENTE estos bloques (mismo id y mismo texto, sin cambiar nada) y crea',
      'solo agenda, pronunciacion y diapositivas para ellos:', JSON.stringify(bloquesFijos, null, 1));
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

// ---------------------------------------------------------------- proveedores
async function conClaude(ficha, bloquesFijos, env) {
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
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: ESQUEMA_CLASE } },
      system: REGLAS,
      messages: [{ role: 'user', content: pedido(ficha, bloquesFijos) }],
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

async function conIaGratis(ficha, bloquesFijos, env) {
  const url = (env.IA_GRATIS_URL || 'https://api.groq.com/openai/v1').replace(/\/+$/, '');
  const modelo = env.IA_GRATIS_MODELO || 'openai/gpt-oss-120b';
  const cabeceras = { 'Content-Type': 'application/json' };
  if (env.IA_GRATIS_KEY) cabeceras.Authorization = `Bearer ${env.IA_GRATIS_KEY}`;
  else if (!/localhost|127\.0\.0\.1/.test(url)) throw new Error('Falta la API key de la IA gratis (Ajustes).');
  let r;
  try {
    r = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: cabeceras,
      body: JSON.stringify({
        model: modelo,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `${REGLAS}\n\nResponde SOLO con un objeto JSON con esta forma exacta:\n${EJEMPLO_JSON}` },
          { role: 'user', content: pedido(ficha, bloquesFijos) },
        ],
      }),
    });
  } catch (e) {
    throw new Error(`No hay conexión con la IA gratis (${url}): ${texto(e.cause || e)}`);
  }
  const cuerpo = await r.text();
  if (!r.ok) {
    const pista = r.status === 401 ? ' (API key inválida)' : r.status === 413 || r.status === 429 ? ' (límite del plan gratis: espera un minuto o usa otro modelo)' : '';
    throw new Error(`La IA gratis respondió ${r.status}${pista}: ${cuerpo.slice(0, 300)}`);
  }
  const j = JSON.parse(cuerpo);
  const contenido = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  if (!contenido) throw new Error('La IA gratis no devolvió contenido.');
  return { datos: extraerJson(contenido), uso: j.usage };
}

// Algunos modelos abiertos (Qwen, DeepSeek...) escriben su razonamiento en <think>...</think> o envuelven el
// JSON en ```json: nos quedamos solo con el objeto JSON.
function extraerJson(contenido) {
  const limpio = String(contenido).replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/```(?:json)?/gi, '').trim();
  try { return JSON.parse(limpio); } catch { /* sigue */ }
  const a = limpio.indexOf('{');
  const z = limpio.lastIndexOf('}');
  if (a >= 0 && z > a) {
    try { return JSON.parse(limpio.slice(a, z + 1)); } catch { /* sigue */ }
  }
  throw new Error('La IA gratis no devolvió un JSON válido. Intenta de nuevo o usa otro modelo.');
}

// ---------------------------------------------------------------- modo manual (sin IA)
export function guionManual(textoGuion) {
  const parrafos = String(textoGuion || '').replace(/\r/g, '').split(/\n\s*\n/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const bloques = [];
  for (const p of parrafos) {
    // un parrafo muy largo se parte por oraciones en trozos de ~45 palabras
    const oraciones = p.match(/[^.!?]*[.!?]+["»”]?|[^.!?]+$/g) || [p];
    let actual = '';
    for (const o of oraciones.map(x => x.trim()).filter(Boolean)) {
      if (actual && (actual + ' ' + o).split(' ').length > 55) { bloques.push(actual); actual = o; } else actual = (actual + ' ' + o).trim();
    }
    if (actual) bloques.push(actual);
  }
  return bloques.map((t, i) => ({ id: String(i + 1).padStart(2, '0'), texto: t }));
}

function diapositivasBasicas(ficha, bloques) {
  return bloques.map((bl, i) => {
    if (i === 0) return { bloque: bl.id, tipo: 'portada', kicker: [ficha.curso, ficha.nivel].filter(Boolean).join(' · '), titulo: ficha.tema || 'Nueva clase', sub: ficha.objetivo || '', items: [] };
    const primera = (bl.texto.match(/[^.!?]+[.!?]?/) || [bl.texto])[0].trim().split(/\s+/).slice(0, 7).join(' ').replace(/[,;:]$/, '');
    const ultimo = i === bloques.length - 1;
    return ultimo
      ? { bloque: bl.id, tipo: 'cierre', kicker: 'Resumen y reto', titulo: primera, items: [], despedida: `¡Nos vemos en la próxima clase! · ${ficha.avatar || 'SIPANCITOBOT'}` }
      : { bloque: bl.id, tipo: 'idea', kicker: `Parte ${i}`, titulo: primera, sub: '' };
  });
}

// ---------------------------------------------------------------- normalizacion
const corto = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const items = (arr, n, largo) => (Array.isArray(arr) ? arr : []).filter(x => x && (x.texto || x.titulo))
  .slice(0, n).map(x => ({ texto: corto(x.texto, largo), cuando: corto(x.cuando, 40) }));

export function normalizar(datos, ficha, base = {}) {
  const bloquesIn = (Array.isArray(datos.bloques) ? datos.bloques : []).filter(x => x && String(x.texto || '').trim());
  if (!bloquesIn.length) throw new Error('La IA no devolvió bloques de guion.');
  const mapa = {};
  const bloques = bloquesIn.slice(0, 14).map((x, i) => {
    const id = String(i + 1).padStart(2, '0');
    mapa[String(x.id)] = id;
    return { id, texto: String(x.texto).replace(/\s+/g, ' ').trim() };
  });
  const ids = bloques.map(x => x.id);
  const idOk = v => mapa[String(v)] || (ids.includes(String(v)) ? String(v) : null);

  const diapositivas = (Array.isArray(datos.diapositivas) ? datos.diapositivas : []).map((d, k) => {
    const tipo = TIPOS.includes(d && d.tipo) ? d.tipo : 'idea';
    const lado = x => ({ etiqueta: corto(x && x.etiqueta, 24), titulo: corto(x && x.titulo, 60), texto: corto(x && x.texto, 140), cuando: corto(x && x.cuando, 40) });
    return {
      bloque: idOk(d && d.bloque) || ids[Math.min(k, ids.length - 1)],
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
export async function generarClase({ ficha, modo, guion, env, base }) {
  if (modo === 'manual') {
    const bloques = guionManual(guion);
    if (!bloques.length) throw new Error('Pega el guion: un párrafo por bloque, separados por una línea en blanco.');
    return { clase: normalizar({ bloques, diapositivas: diapositivasBasicas(ficha, bloques) }, ficha, base), uso: null };
  }
  const bloquesFijos = guion ? (Array.isArray(guion) ? guion : guionManual(guion)) : null;
  const { datos, uso } = modo === 'claude' ? await conClaude(ficha, bloquesFijos, env) : await conIaGratis(ficha, bloquesFijos, env);
  if (bloquesFijos) datos.bloques = bloquesFijos; // el guion del docente no se toca
  return { clase: normalizar(datos, ficha, base), uso };
}
