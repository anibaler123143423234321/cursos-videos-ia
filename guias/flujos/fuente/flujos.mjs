// Manual de flujos del Estudio de clases USS: un PDF por flujo (ficha, diagrama por carriles, pasos, reglas y errores).
// Los flujos se describen abajo (FLUJOS); para cambiar uno, edita sus datos y vuelve a generar.
// Uso (desde la carpeta del repositorio):  node guias/flujos/fuente/flujos.mjs
// Deja los PDF en guias/flujos/ y el HTML de cada uno en guias/flujos/fuente/html/ (para verlo en el navegador).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '..', '..', '..');
const VERSION = 'Versión 1 · noviembre de 2026';
const LOGO = `data:image/png;base64,${fs.readFileSync(path.join(REPO, 'clases-mac', 'marca', 'logo-transparente.png')).toString('base64')}`;

// ---------------------------------------------------------------- los flujos
// pasos: [carril (indice), texto corto para el diagrama, detalle para la tabla, decision?]
const FLUJOS = [
  {
    codigo: 'F00', archivo: 'F00-mapa-general', nombre: 'Mapa general del Estudio de clases',
    proposito: 'Ver de un vistazo cómo nace una clase en video, quién interviene en cada etapa y qué flujo la documenta.',
    ficha: {
      Responsable: 'Equipo del Centro de Informática', Frecuencia: 'Cada clase', 'Tiempo total': '15 a 30 minutos por clase',
      Disparador: 'Un docente necesita una clase en video de 2 a 3 minutos',
      Entradas: 'Tema y ficha del docente, o sus láminas, o su guion', Salidas: 'Video MP4 1920×1080 y la clase en un solo HTML',
      Sistemas: 'Web del estudio, IA (gratis o Claude), motor de video, servicios de voz, Google Drive (opcional)',
    },
    carriles: ['Docente', 'Web del estudio', 'IA', 'Motor de video'],
    pasos: [
      [0, 'Entra a la web con la clave del equipo', 'Desde cualquier PC de la red, en Chrome o Edge (F10 configura la web).'],
      [0, 'Crea la clase: con IA, con sus láminas o con su guion', 'F01 (IA crea las diapositivas), F02 (láminas propias) o F03 (guion propio).'],
      [2, 'Escribe guion y diapositivas con skills y un ejemplo', 'La IA sigue la estructura de sesión USS y copia el nivel de un ejemplo revisado (F01, F11).'],
      [1, 'Guarda la clase y abre el editor', 'Queda en clases/<nombre>/clase.json.'],
      [0, 'Revisa el texto, las diapositivas y el diseño', 'F04 (editor) y F05 (estilo visual y variantes).'],
      [0, 'Elige la voz', 'F06: grabación propia, ElevenLabs, Azure, voz local o del sistema.'],
      [3, 'Hace capturas, vista previa o borrador', 'F07: revisa antes de gastar tiempo en el video final.'],
      [0, '¿Todo está bien?', 'Si algo se corta o aparece a destiempo, vuelve al editor (F04).', true],
      [3, 'Crea el video final y el HTML', 'F08: MP4 en salidas/ y la clase en un solo HTML con la voz incluida.'],
      [3, 'Sube a Google Drive si está conectado', 'F09: a la carpeta del curso y del módulo.'],
    ],
    indice: true,
  },
  {
    codigo: 'F01', archivo: 'F01-crear-clase-con-ia', nombre: 'Crear una clase con IA (láminas HTML animadas)',
    proposito: 'Obtener, a partir del tema, una clase completa —guion, diapositivas animadas, agenda y pronunciación— escrita por la IA gratis siguiendo la estructura de sesión USS.',
    ficha: {
      Responsable: 'Docente', Frecuencia: 'Cada clase nueva', Tiempo: '1 a 4 minutos de IA (según el plan gratis)',
      Disparador: 'El docente pulsa «Nueva clase»', Requisitos: 'Sesión iniciada · IA gratis «Configurado» en Servicios (F10)',
      Entradas: 'Tema, nivel, duración y, opcional, objetivo y puntos verificados', Salidas: 'Clase de 9 a 15 bloques con diapositivas, agenda, pronunciación y diseño',
      Sistemas: 'Web del estudio · IA gratis (Groq) · skills y ejemplos (web/skills)',
    },
    carriles: ['Docente', 'Web del estudio', 'IA gratis', 'Reglas del programa'],
    pasos: [
      [0, 'Nueva clase › Láminas HTML animadas › IA gratis', 'En «¿Cómo son tus láminas?» elige «Láminas HTML animadas» y en «¿Quién escribe el guion?», «IA gratis».'],
      [0, 'Escribe tema, nivel y duración (y la guía opcional)', 'El tema es obligatorio. En «Guiar a la IA › Puntos que debe cubrir» escribe datos verificados (menús, cifras): así la IA no adivina. El curso aparece en la franja verde.'],
      [0, 'Pulsa «Crear clase con IA»', 'No cierres la pestaña: la web muestra el avance.'],
      [1, 'Elige la clase modelo más parecida', 'Compara curso, tema y puntos con web/skills/ejemplos/*.json; si ninguna se parece, usa la de Gmail.'],
      [2, 'Escribe el guion por partes de la sesión', 'Portada, logro, motivación, temario, un bloque por tema, práctica con el texto estándar, conclusiones y cierre (web/skills/guion.md). Cada bloque trae su «parte».'],
      [3, '¿Están todas las partes y el largo pedido?', 'Si falta una parte (suele ser el temario) se pide solo esa; si no llega, el temario se arma con los puntos de la ficha. Si el guion quedó corto (menos del 88 %), se alargan los bloques más cortos.', true],
      [2, 'Revisa el guion y diseña las diapositivas', 'Un pedido corrige erratas, el trato de «tú» y datos dudosos (revision.md). Luego diseña una diapositiva por bloque con el catálogo y el ejemplo (diapositivas.md), en varias partes si el plan gratis lo exige.'],
      [2, 'Lista lo mal escrito', 'Último pedido (ortografia.md): la IA solo dice qué está mal; el programa lo reemplaza en la voz y en las diapositivas, también en los «cuando».'],
      [3, 'Aplica la estructura y pule', 'Diseño fijo por parte, agenda desde el temario, despedida con el logo, sin Title Case, palabra *clave* marcada, «cuando» que la voz sí dice, pronunciación y semilla de diseño.'],
      [1, 'Guarda y abre el editor', 'Guarda clases/<nombre>/clase.json; el docente revisa en el editor (F04).'],
    ],
    reglas: [
      'La voz lee unas 2,3 palabras por segundo: 2:00 ≈ 275 palabras, 2:30 ≈ 345 y 3:00 ≈ 415.',
      'La estructura de sesión es obligatoria y la práctica siempre incluye «Revisa las pautas y actividades que tu docente asignará en el aula virtual».',
      'El cierre —la despedida con el logo del Centro de Informática al centro— lo arma el programa, no la IA.',
      'Solo datos verificables. La IA gratis puede equivocarse en menús y cifras: el docente revisa siempre antes del video final.',
      'Las skills y los ejemplos se leen en cada pedido: una mejora del equipo vale desde la siguiente clase (F11).',
    ],
    errores: [
      ['«La IA gratis respondió 429 … OTPM»', 'El plan gratis solo deja escribir unos 1 000 tokens por minuto.', 'La web pide respuestas más cortas y espera el minuto sola. Si se repite, en Ajustes usa openai/gpt-oss-120b.'],
      ['«json_validate_failed» o «no devolvió un JSON válido»', 'El modelo escribió comillas sueltas u otro error de formato.', 'La web lo rescata y lo repara; si aún falla, pulsa de nuevo «Crear clase con IA».'],
      ['«Falta la API key de la IA gratis»', 'No hay clave guardada.', 'Ajustes › IA gratis (F10).'],
      ['Menús, botones o cifras que no existen', 'El modelo no conoce bien esa herramienta.', 'Escribe los datos correctos en «Puntos que debe cubrir» y crea la clase otra vez, o corrige en el editor.'],
      ['Aviso «puse unas simples» en algunos bloques', 'La IA no completó esas diapositivas.', 'Corrígelas en el editor o pulsa «Diapositivas con IA».'],
    ],
    datos: ['web/ia.mjs', 'web/skills/*.md', 'web/skills/ejemplos/*.json', 'clases/<nombre>/clase.json'],
    relacionados: ['F04', 'F05', 'F10', 'F11'],
  },
  {
    codigo: 'F02', archivo: 'F02-crear-clase-con-laminas', nombre: 'Crear una clase con láminas propias',
    proposito: 'Convertir las láminas que el docente ya hizo (PowerPoint, Canva o imágenes) en una clase en video: la IA mira cada lámina y escribe lo que dice la voz, con efectos que señalan lo que nombra.',
    ficha: {
      Responsable: 'Docente', Frecuencia: 'Cada clase con láminas propias', Tiempo: 'Unos 30 segundos de IA por lámina',
      Disparador: 'El docente tiene sus láminas listas', Requisitos: 'Láminas en PDF, PNG o JPG · «IA que lee láminas» configurada (o «Escribo la voz»)',
      Entradas: 'PDF o imágenes en orden (1, 2, 3…)', Salidas: 'Un bloque por lámina, con su voz, efectos, agenda y pronunciación',
      Sistemas: 'Web del estudio · IA que lee láminas (visión) · skill laminas.md',
    },
    carriles: ['Docente', 'Web del estudio', 'IA que lee láminas', 'Reglas del programa'],
    pasos: [
      [0, 'Nueva clase › Mis láminas', 'PowerPoint: Archivo › Exportar › PDF. Canva: Compartir › Descargar › PDF.'],
      [0, 'Sube el PDF o las imágenes', 'Arrastra al recuadro «Subir láminas»; se ordenan por nombre (1, 2, 3…).'],
      [1, 'Convierte cada página en imagen', 'El navegador convierte el PDF en imágenes JPG (pdf.js) antes de enviarlas.'],
      [0, '¿Quién escribe la voz?', '«IA gratis» (la IA mira las láminas), «Escribo la voz» (un párrafo por lámina, separados por una línea en blanco) o «Claude» (de pago).', true],
      [2, 'Mira cada lámina y escribe la voz', 'Una lámina por pedido: 20 a 60 palabras; la primera saluda y la última despide; explica sin leer la lámina literal.'],
      [2, 'Propone efectos y los ubica', 'Número, foco, resaltar o zoom sobre lo que la voz nombra; un segundo pedido ubica la caja de cada efecto en la imagen.'],
      [2, 'Arma la agenda y la pronunciación', 'Si la agenda no avanza lámina a lámina, se arma con los títulos de las láminas.'],
      [3, 'Arma los bloques', 'Un bloque por lámina; un texto de más de 55 palabras se parte en dos bloques y la lámina sigue en pantalla.'],
      [1, 'Guarda y abre el editor', 'En el editor (F04) se reemplaza una lámina o se quitan sus efectos.'],
    ],
    reglas: [
      'Las láminas no se modifican: la IA solo escribe la voz y propone efectos.',
      'Cada efecto aparece cuando la voz dice su «cuando»; en la portada no hay efectos.',
      'Con «Escribo la voz» debe haber tantos párrafos como láminas.',
    ],
    errores: [
      ['«El modelo … no lee imágenes»', 'El modelo configurado no tiene visión.', 'Ajustes › IA que lee láminas: qwen/qwen3.8-27b en Groq o gemini-3.8-flash en Gemini.'],
      ['«Tienes N láminas y M párrafos»', 'Con «Escribo la voz» falta o sobra un párrafo.', 'Un párrafo por lámina, separados por una línea en blanco.'],
      ['Un foco o un número cae fuera de lugar', 'La IA ubicó mal la caja del efecto.', 'En el editor, «Quitar efectos» en esa lámina.'],
      ['«No pude abrir la lámina …»', 'Falta el archivo en clases/<nombre>/laminas.', 'Reemplaza la lámina desde el editor.'],
    ],
    datos: ['web/skills/laminas.md', 'clases/<nombre>/laminas/01.jpg …', 'clases/<nombre>/clase.json'],
    relacionados: ['F04', 'F06', 'F10'],
  },
  {
    codigo: 'F03', archivo: 'F03-crear-clase-con-guion-propio', nombre: 'Crear una clase con guion propio',
    proposito: 'Usar un guion que el docente ya escribió: la web lo parte en bloques y, si el docente quiere, la IA solo diseña las diapositivas sin cambiar una palabra.',
    ficha: {
      Responsable: 'Docente', Frecuencia: 'Cuando el docente trae su guion', Tiempo: 'Inmediato sin IA · 1 a 2 minutos con IA',
      Disparador: 'El docente pega su guion en «Nueva clase»', Requisitos: 'Sesión iniciada',
      Entradas: 'Guion: un párrafo por bloque', Salidas: 'Clase con el guion intacto y sus diapositivas',
      Sistemas: 'Web del estudio · IA gratis (opcional)',
    },
    carriles: ['Docente', 'Web del estudio', 'IA gratis'],
    pasos: [
      [0, 'Nueva clase › Láminas HTML animadas', 'El tema sigue siendo obligatorio.'],
      [0, '¿Quieres diapositivas hechas por la IA?', '«Pego mi guion»: sin IA, la web arma diapositivas básicas. «IA gratis» con el guion pegado: la IA solo diseña diapositivas, agenda y pronunciación.', true],
      [0, 'Pega el guion: un párrafo por bloque', 'Separa los bloques con una línea en blanco. Sugerido: 2:30 ≈ 345 palabras.'],
      [1, 'Parte el guion en bloques', 'Cada párrafo es un bloque; uno de más de 55 palabras se parte por oraciones.'],
      [2, 'Diseña las diapositivas (con IA)', 'Respeta tu texto; corrige la ortografía de las diapositivas, no la de tu guion.'],
      [1, 'Arma portada, ideas y cierre (sin IA)', 'Portada con el tema; ideas con la primera oración de cada bloque; cierre en el último.'],
      [1, 'Guarda y abre el editor', 'Revisión en F04.'],
    ],
    reglas: [
      'El guion del docente nunca se reescribe: la IA solo diseña.',
      'En este flujo la estructura de sesión la decide el docente.',
    ],
    errores: [
      ['«Pega el guion: un párrafo por bloque»', 'El cuadro de guion está vacío.', 'Pega el texto antes de crear la clase.'],
      ['Un bloque marcado «muy largo»', 'Tiene más de 60 palabras.', 'Divídelo en dos en el editor.'],
    ],
    datos: ['clases/<nombre>/clase.json'],
    relacionados: ['F01', 'F04'],
  },
  {
    codigo: 'F04', archivo: 'F04-revisar-y-editar', nombre: 'Revisar y editar la clase',
    proposito: 'Dejar la clase lista para el video: corregir lo que dice la voz, ajustar cada diapositiva viendo exactamente cómo se verá, ordenar los bloques y revisar agenda y pronunciación.',
    ficha: {
      Responsable: 'Docente', Frecuencia: 'Cada clase, antes del video final', Tiempo: '5 a 15 minutos',
      Disparador: 'La clase se abrió en el editor', Requisitos: 'Clase creada (F01, F02 o F03)',
      Entradas: 'clase.json', Salidas: 'clase.json revisado',
      Sistemas: 'Editor web («Así se verá» usa el mismo dibujo del video)',
    },
    carriles: ['Docente', 'Editor web', 'IA gratis'],
    pasos: [
      [0, 'Abre la clase desde «Clases»', ''],
      [1, 'Muestra bloques, tiempos y «Así se verá»', 'Cada bloque: lo que dice la voz, segundos aproximados, contador de palabras y su diapositiva dibujada como en el video.'],
      [0, 'Corrige el texto de la voz', 'Sin comillas ni código; siglas escritas normal (CSS, PDF): cómo suenan va en «Pronunciación».'],
      [0, 'Ajusta la diapositiva', 'Tipo, etiqueta superior, título (máx. 7 palabras, *clave* en morado), subtítulo, puntos «texto | palabra que dice la voz | icono» y variante.'],
      [0, 'Ordena: subir, bajar, quitar o agregar', 'Cada bloque tiene sus botones; «Agregar bloque» va al final.'],
      [0, '¿Rehacer las diapositivas con IA?', '«Diapositivas con IA › IA gratis» rehace diapositivas, agenda y pronunciación respetando el guion.', true],
      [2, 'Rehace diapositivas, agenda y pronunciación', 'Con la skill de diapositivas y la clase modelo más parecida.'],
      [0, 'Revisa agenda y pronunciación', 'Pestaña «Agenda y pronunciación»: 3 a 6 puntos cortos y cómo suena cada sigla.'],
      [0, 'Guarda (Ctrl+S)', ''],
      [1, 'Valida y guarda clase.json', 'No acepta bloques vacíos; conserva iconos, «cuando», estilo, semilla y variantes.'],
    ],
    reglas: [
      '«cuando» debe ser una palabra del texto de ese bloque: el elemento aparece cuando la voz la dice.',
      'Un bloque de más de 60 palabras se marca «muy largo».',
      'Un bloque sin diapositiva mantiene en pantalla la anterior.',
    ],
    errores: [
      ['«Hay un bloque vacío»', 'Un bloque no tiene texto.', 'Escribe su texto o quítalo.'],
      ['«Elige una diapositiva para el primer bloque»', 'El bloque 01 quedó sin diapositiva.', 'Elige «Portada».'],
      ['Un elemento aparece tarde o nunca', 'Su «cuando» no está en el texto del bloque.', 'Escribe una palabra que la voz diga.'],
    ],
    datos: ['web/publico/app.js (editor)', 'motor/diapos-auto.js (dibujo de las diapositivas)', 'clases/<nombre>/clase.json'],
    relacionados: ['F05', 'F06', 'F07'],
  },
  {
    codigo: 'F05', archivo: 'F05-diseno-visual', nombre: 'Diseño visual de la clase',
    proposito: 'Que cada clase tenga su propio aspecto: un estilo visual para toda la clase y una variante de cada plantilla, que el docente puede cambiar con un clic.',
    ficha: {
      Responsable: 'Docente', Frecuencia: 'Opcional, en cada clase', Tiempo: 'Segundos',
      Disparador: 'El docente quiere otro aspecto', Requisitos: 'Clase con diapositivas por plantillas',
      Entradas: 'Semilla, estilo y variantes de la clase', Salidas: 'El mismo diseño en «Así se verá» y en el video',
      Sistemas: 'Editor web · motor/diapos-auto.js',
    },
    carriles: ['Docente', 'Editor web', 'Motor de video'],
    pasos: [
      [1, 'Da una semilla de diseño a cada clase nueva', 'La semilla elige el estilo (Vibrante, Editorial, Noche o Pastel) y una variante de cada plantilla.'],
      [0, 'Mira la barra «Diseño de la clase»', 'Está sobre los bloques, en «Guion y diapositivas».'],
      [0, '¿Te gusta el diseño?', 'No: pulsa «Otro diseño» (nueva semilla) o fija un estilo en la lista.', true],
      [1, 'Redibuja todas las vistas', 'Al instante; el aviso dice el estilo nuevo.'],
      [0, 'Fija la variante de una diapositiva (opcional)', 'En cada diapositiva, «Variante». Ej.: la portada puede ser icono grande, panel de color, centrada o tipográfica.'],
      [0, 'Guarda', 'El estilo, la semilla y las variantes quedan en clase.json.'],
      [2, 'Dibuja el video con el mismo diseño', 'El motor arma el mismo HTML que «Así se verá» y lo anima en la línea de tiempo.'],
    ],
    reglas: [
      'Dos diapositivas seguidas del mismo tipo nunca repiten variante, salvo que el docente la fije.',
      'La franja verde, el logo y la columna de agenda no cambian con el estilo: son la marca USS.',
      'Las clases anteriores (sin semilla) se ven en Vibrante con la primera variante de cada tipo.',
      'Estilos: Vibrante (blanco y morado), Editorial (papel y serifa), Noche (fondo oscuro) y Pastel (un tono suave por diapositiva).',
      'Variantes: portada (4), pregunta (2), idea (3), definición (2), temario (2), lista (2), tarjetas (2), dato (2) y cierre (2).',
    ],
    errores: [
      ['El video no se ve como la vista', 'La clase no se guardó después de cambiar el diseño.', 'Guarda y vuelve a pedir «Revisar diapositivas» (F07).'],
    ],
    datos: ['clase.json: "semilla", "estilo" y "variante" de cada diapositiva', 'motor/diapos-auto.js (ESTILOS y VARIANTES)'],
    relacionados: ['F04', 'F07'],
  },
  {
    codigo: 'F06', archivo: 'F06-voz-de-la-clase', nombre: 'Voz de la clase',
    proposito: 'Elegir y generar la voz que dice el guion —la grabación del docente o una voz sintética— sin mezclar voces y sin gastar créditos de más.',
    ficha: {
      Responsable: 'Docente (elige) · Motor de video (genera)', Frecuencia: 'Cada revisión o video', Tiempo: '1 a 2 minutos',
      Disparador: 'Se pide una vista previa, capturas o el video final', Requisitos: 'Al menos una voz disponible (la del sistema siempre está)',
      Entradas: 'Guion, pronunciación y voz elegida', Salidas: 'salida/voz-completa.wav y .mp3, con la duración de cada bloque',
      Sistemas: 'Motor de video · ElevenLabs · Azure · voz local (Piper o Kokoro) · voz del sistema',
    },
    carriles: ['Docente', 'Editor web', 'Motor de video', 'Servicios de voz'],
    pasos: [
      [0, 'Pestaña «Voz y avatar»', 'Automática, Tu grabación, ElevenLabs, Azure, Voz local o Del sistema; y un Voice ID de ElevenLabs para esta clase (opcional).'],
      [1, 'Guarda la voz en la clase', 'clase.json › "voz": { proveedor, elevenlabs_voz }.'],
      [2, 'Busca la voz en orden', 'Automática: 1) camara.mp4, 2) voz/completa.m4a (se corta por las pausas), 3) voz/NN.m4a por bloque, 4) ElevenLabs, 5) Azure, 6) voz local, 7) voz del sistema.'],
      [3, '¿La voz respondió?', 'Si una voz falla, se usa la siguiente para TODA la clase: nunca mezcla voces.', true],
      [2, 'Reutiliza lo ya generado', 'Caché por bloque: solo se vuelve a generar el bloque cuyo texto o voz cambió.'],
      [2, 'Normaliza y mide cada bloque', 'WAV 48 kHz mono, 0,45 s de pausa entre bloques y volumen nivelado.'],
    ],
    reglas: [
      'La voz se elige por clase; la de Ajustes es la predeterminada.',
      'La pronunciación solo cambia cómo suena: «Gmail» se escribe igual y se dice «yi meil».',
      'Las carpetas voz/, camara.* y avatar.* tienen la voz y la cara del docente: nunca se suben a GitHub.',
      'Dos creaciones de la misma clase a la vez esperan su turno (candado de la clase).',
    ],
    errores: [
      ['ElevenLabs «HTTP 402 … library voices»', 'El plan Free no permite voces de la biblioteca por la API.', 'Usa una voz Default, por ejemplo Sarah (EXAVITQu4vr4xnSDxMaL), en «Voz y avatar».'],
      ['ElevenLabs «HTTP 401»', 'API key inválida o sin permiso de Text to Speech.', 'Ajustes › Voz · ElevenLabs.'],
      ['«Las pausas no son muy claras»', 'La grabación completa no tiene silencios de unos 2 segundos.', 'Regraba ese bloque como voz/NN.m4a.'],
      ['«No pude medir la duración de NN.norm.wav»', 'El audio salió vacío o dos creaciones se pisaron.', 'Vuelve a intentar; ahora la segunda creación espera a la primera.'],
    ],
    datos: ['motor/crear-video.mjs (prepararVoz)', 'clases/<nombre>/salida/voz/ (caché)', 'clases/<nombre>/voz/ (grabaciones)'],
    relacionados: ['F04', 'F07', 'F10'],
  },
  {
    codigo: 'F07', archivo: 'F07-revisar-antes-del-video', nombre: 'Revisar antes del video final',
    proposito: 'Comprobar en uno o dos minutos que nada se corta, se encima ni aparece a destiempo, antes de dedicar varios minutos al video final.',
    ficha: {
      Responsable: 'Docente', Frecuencia: 'Antes de cada video final', Tiempo: 'Vista previa ≈ 1 min · capturas ≈ 1 min · borrador 2 a 3 min',
      Disparador: 'La clase está editada', Requisitos: 'Clase guardada',
      Entradas: 'clase.json y la voz', Salidas: 'Vista con sonido, fotos de cada diapositiva o un video liviano',
      Sistemas: 'Web del estudio (cola de trabajos) · motor de video',
    },
    carriles: ['Docente', 'Web del estudio', 'Motor de video'],
    pasos: [
      [0, 'En «Producción» elige una revisión', 'Vista previa con voz, Revisar diapositivas o Borrador rápido.'],
      [1, 'Pone el trabajo en la cola', 'Se hace un trabajo a la vez y se muestra el avance.'],
      [2, 'Genera la voz y la línea de tiempo', 'F06.'],
      [2, '¿Qué revisión pediste?', 'Vista previa: la clase con sonido en el navegador. Capturas: dos fotos por bloque, al 25 % y al 85 %. Borrador: video de 960×540 a 12 cuadros por segundo.', true],
      [1, 'Muestra el resultado', 'Las capturas se ven en la misma página de la clase.'],
      [0, '¿Algo se corta, se encima o llega tarde?', 'Sí: corrige en el editor (F04) y repite. No: pasa al video final (F08).', true],
    ],
    reglas: [
      'Las capturas sirven para revisar que nada salga de la diapositiva y que cada elemento aparezca cuando la voz lo nombra.',
      'Las revisiones nunca suben nada a Google Drive.',
    ],
    errores: [
      ['El trabajo se queda «En cola»', 'Hay otro trabajo en curso.', 'Espera: se hacen de uno en uno.'],
      ['«Falló: revisa el detalle»', 'Error del motor (ffmpeg, Chromium o voz).', 'Abre el detalle del trabajo y envía una captura al equipo.'],
    ],
    datos: ['clases/<nombre>/salida/capturas/', 'salidas/<nombre>-borrador.mp4'],
    relacionados: ['F04', 'F06', 'F08'],
  },
  {
    codigo: 'F08', archivo: 'F08-video-final', nombre: 'Crear el video final',
    proposito: 'Producir el video de la clase en alta calidad (MP4 1920×1080) y la misma clase en un solo archivo HTML que se abre con doble clic.',
    ficha: {
      Responsable: 'Docente (lo pide) · PC del estudio (lo hace)', Frecuencia: 'Una vez por clase revisada', Tiempo: '5 a 8 minutos',
      Disparador: 'El docente pulsa «Crear video final»', Requisitos: 'Clase revisada (F07) · ffmpeg y Chromium instalados en la PC del estudio',
      Entradas: 'clase.json, voz y avatar', Salidas: 'salidas/<nombre>.mp4 y salidas/<nombre>.html',
      Sistemas: 'Motor de video (Playwright + Chromium + ffmpeg) · Google Drive (opcional)',
    },
    carriles: ['Docente', 'Web del estudio', 'Motor de video', 'Google Drive'],
    pasos: [
      [0, 'Pulsa «Crear video final»', ''],
      [1, 'Pone el trabajo en la cola', 'No apagues la PC del estudio mientras dure.'],
      [2, 'Prepara la voz', 'F06.'],
      [2, 'Abre la plantilla de la clase en Chromium', 'motor/plantilla.html con las diapositivas, la agenda, el avatar y la franja con el logo.'],
      [2, 'Dibuja cada cuadro y arma el MP4', '30 cuadros por segundo, 1920×1080, con ffmpeg.'],
      [2, 'Exporta la clase en un solo HTML', 'Con la voz incluida: se abre con doble clic en cualquier navegador.'],
      [2, '¿Google Drive está conectado?', 'Sí: sube el video, el HTML y el código de la clase (F09). No: termina aquí.', true],
      [3, 'Recibe los archivos de la clase', 'En la carpeta del curso y del módulo.'],
      [1, 'Avisa «Video listo»', 'El video queda en salidas/<nombre>.mp4.'],
    ],
    reglas: [
      'salidas/ y clases/*/salida/ no se suben a GitHub.',
      'El HTML exportado lleva la voz y las imágenes dentro: no necesita la web para verse.',
    ],
    errores: [
      ['«No puedo usar ffmpeg»', 'ffmpeg no está instalado o no está en el PATH.', 'Mac: brew install ffmpeg · Windows: winget install -e --id Gyan.FFmpeg, o FFMPEG_PATH en .env.'],
      ['«Error en diapositivas.js / plantilla»', 'Una diapositiva tiene un dato inválido.', 'Revisa la clase con capturas (F07) y corrige en el editor.'],
      ['El video dura más de lo previsto', 'Más palabras de las planeadas o una voz más lenta.', 'Acorta los bloques más largos.'],
    ],
    datos: ['motor/crear-video.mjs', 'motor/exportar-html.mjs', 'salidas/<nombre>.mp4 y .html'],
    relacionados: ['F06', 'F07', 'F09'],
  },
  {
    codigo: 'F09', archivo: 'F09-subir-a-google-drive', nombre: 'Subir a Google Drive',
    proposito: 'Dejar el video, la clase en HTML y su código en la carpeta compartida del curso, ordenados por mes, curso, tipo y módulo.',
    ficha: {
      Responsable: 'Equipo del estudio (conecta) · Docente (sube)', Frecuencia: 'Al terminar cada video final', Tiempo: '≈ 1 minuto',
      Disparador: 'Termina un video final o se pulsa «Subir a Google Drive»', Requisitos: 'Drive conectado una vez en la PC del estudio (CONECTAR-DRIVE) o Google Drive para escritorio',
      Entradas: 'Video, HTML, clase.json y láminas', Salidas: 'Archivos en la carpeta compartida',
      Sistemas: 'motor/drive.mjs · API de Google Drive o carpeta local de Drive',
    },
    carriles: ['Docente', 'Web del estudio', 'Motor de video', 'Google Drive'],
    pasos: [
      [0, 'Conecta Drive una vez (Ajustes)', 'Se sube el JSON del cliente de Google y se pulsa «Conectar»; el permiso queda en drive-token.json.'],
      [0, '¿Subir ahora?', 'Automático al terminar el video final, o con «Subir a Google Drive» en «Producción».', true],
      [2, 'Arma la ruta de carpetas', 'Videos de clases IA / AAAA-MM / Curso / Video con HTML o Video con láminas / Módulo / clase.'],
      [3, 'Recibe video, HTML y código de la clase', 'Nunca la voz ni la cámara del docente.'],
      [1, 'Avisa «Subido a Google Drive»', ''],
    ],
    reglas: [
      'El curso y el módulo de la ficha deciden las carpetas: escríbelos bien antes del video final.',
      'Sin Drive conectado no se sube nada.',
    ],
    errores: [
      ['«Google Drive no está conectado»', 'Falta drive-token.json.', 'Abre CONECTAR-DRIVE en la PC del estudio.'],
      ['«No existe DRIVE_RUTA_LOCAL»', 'La carpeta de Google Drive para escritorio no está disponible.', 'Abre Google Drive para escritorio y revisa la ruta.'],
    ],
    datos: ['motor/drive.mjs', 'drive-token.json y google-drive-cliente.json (privados)'],
    relacionados: ['F08', 'F10'],
  },
  {
    codigo: 'F10', archivo: 'F10-configurar-servicios', nombre: 'Configurar servicios (Ajustes)',
    proposito: 'Dejar listos, una sola vez en la PC del estudio, los servicios que usa la web: IA gratis, IA que lee láminas, Claude, voces, Google Drive y la clave del equipo.',
    ficha: {
      Responsable: 'Equipo del estudio', Frecuencia: 'Al instalar o al cambiar una cuenta', Tiempo: '10 a 20 minutos',
      Disparador: 'Un servicio aparece «Sin configurar»', Requisitos: 'Cuentas y claves de cada servicio',
      Entradas: 'Direcciones, claves y modelos', Salidas: '.env actualizado (privado) y «Servicios» en verde',
      Sistemas: 'Web del estudio · archivo .env',
    },
    carriles: ['Equipo del estudio', 'Web del estudio', 'Archivo .env'],
    pasos: [
      [0, 'Abre «Ajustes»', 'Desde el menú de la izquierda.'],
      [0, 'IA gratis: dirección, API key y modelo', 'Groq: https://api.groq.com/openai/v1 con openai/gpt-oss-120b o qwen/qwen3.8-27b · Ollama: http://localhost:11434/v1.'],
      [0, 'IA que lee láminas (opcional)', 'Vacío = la de la IA gratis. Gemini: https://generativelanguage.googleapis.com/v1beta/openai con gemini-3.8-flash.'],
      [0, 'Claude (de pago, opcional)', 'API key de Anthropic.'],
      [0, 'Voces: ElevenLabs, Azure o voz local', 'En el plan Free de ElevenLabs solo sirven las voces Default.'],
      [0, 'Google Drive y clave de la web', 'Drive: F09. La clave del equipo es la que piden al entrar.'],
      [1, 'Guarda sin volver a mostrar las claves', 'Las claves secretas no se muestran después de guardarlas.'],
      [2, 'Queda en .env', 'Archivo privado de la PC del estudio.'],
      [1, 'Actualiza «Servicios» en el menú', 'Cada servicio dice «Configurado» o «Sin configurar».'],
    ],
    reglas: [
      '.env tiene claves privadas: no se comparte, no se copia y no se sube a GitHub.',
      'Un cambio en web/ia.mjs (no en las skills) necesita reiniciar la web; las sesiones abiertas se conservan.',
    ],
    errores: [
      ['«API key inválida»', 'La clave se copió mal o venció.', 'Vuelve a pegarla en Ajustes.'],
      ['Un servicio sigue «Sin configurar»', 'Falta un dato (por ejemplo, la región de Azure).', 'Completa todos los campos de ese servicio.'],
    ],
    datos: ['web/servidor.mjs (Ajustes)', '.env (privado)'],
    relacionados: ['F01', 'F02', 'F06', 'F09'],
  },
  {
    codigo: 'F11', archivo: 'F11-mejorar-la-ia', nombre: 'Mejorar la IA: skills y ejemplos',
    proposito: 'Hacer que la IA gratis escriba cada vez mejor sin entrenarla: con guías (skills) más claras y con más clases modelo revisadas que ella imita.',
    ficha: {
      Responsable: 'Equipo del estudio', Frecuencia: 'Cuando un error se repite', Tiempo: '15 a 30 minutos por mejora',
      Disparador: 'Varias clases salen con el mismo problema', Requisitos: 'Una clase revisada para usar de ejemplo, o una regla clara',
      Entradas: 'Errores observados', Salidas: 'web/skills/*.md o web/skills/ejemplos/*.json actualizados',
      Sistemas: 'web/skills · web/ia.mjs',
    },
    carriles: ['Equipo del estudio', 'Archivos de la IA', 'IA gratis', 'Web del estudio'],
    pasos: [
      [0, 'Detecta un error que se repite', 'Ej.: menús inventados, Title Case, partes que faltan, diapositivas pobres.'],
      [0, '¿Es una regla o falta un ejemplo?', 'Regla: edita web/skills/*.md (guion, diapositivas, revision, ortografia, laminas). Ejemplo: agrega una clase revisada a web/skills/ejemplos/.', true],
      [1, 'Guarda la skill o el ejemplo', 'Las notas para el equipo van entre <!-- -->: la IA no las ve.'],
      [3, 'Elige el ejemplo más parecido al tema', 'Por curso, tema y "palabras"; "predeterminado": true se usa si ninguno se parece.'],
      [2, 'Lee las skills en cada pedido', 'Sin reiniciar la web.'],
      [0, 'Prueba con «Nueva clase» y revisa capturas', 'F01 y F07.'],
      [0, '¿Mejoró?', 'No: ajusta y repite. Sí: copia los mismos archivos a la versión de Windows.', true],
    ],
    reglas: [
      'Un ejemplo con errores enseña errores: solo se agregan clases revisadas.',
      'Cuida el largo: los planes gratis aceptan pocos tokens por minuto (como máximo unas 1 500 palabras por guía).',
      'Un tipo de diapositiva nuevo debe existir primero en motor/diapos-auto.js.',
      'Hoy hay 5 ejemplos: Gmail y Gemini (Google Workspace), Excel, inglés (presente simple) y Business Model Canvas.',
    ],
    errores: [
      ['La IA copia el contenido del ejemplo', 'El ejemplo es casi del mismo tema.', 'Está bien si el ejemplo es correcto; si no, agrega un ejemplo más cercano.'],
    ],
    datos: ['web/skills/README.md', 'web/skills/*.md', 'web/skills/ejemplos/*.json'],
    relacionados: ['F01', 'F05'],
  },
  {
    codigo: 'F12', archivo: 'F12-clase-con-claude-code', nombre: 'Crear una clase con Claude Code (terminal)',
    proposito: 'Producir una clase a pedido del equipo desde la terminal, con Claude Code siguiendo el prompt maestro (CLAUDE.md): ficha, guion aprobado, diapositivas, revisión con capturas y video.',
    ficha: {
      Responsable: 'Equipo del estudio con Claude Code', Frecuencia: 'Clases especiales o ejemplos', Tiempo: '20 a 40 minutos',
      Disparador: 'Llega una ficha (FICHA-CLASE.txt) o un pedido', Requisitos: 'Claude Code abierto en la carpeta clases-mac o clases-windows',
      Entradas: 'Ficha de la clase', Salidas: 'clases/<nombre>/ con clase.json, video MP4, HTML y GUION-PARA-GRABAR.txt',
      Sistemas: 'Claude Code · motor de video',
    },
    carriles: ['Docente o equipo', 'Claude Code', 'Motor de video'],
    pasos: [
      [0, 'Llena FICHA-CLASE.txt', 'Tema, nivel, duración, objetivo, puntos, ejemplo y reto.'],
      [1, '¿Falta algo en la ficha?', 'Pregunta todo en un solo mensaje, numerado y con opciones.', true],
      [1, 'Muestra el guion en una tabla', 'Bloque · segundos · lo que dice la voz · qué se ve; con el total de palabras.'],
      [0, 'Da el «ok»', ''],
      [1, 'Crea clases/<nombre>/', 'clase.json (con diapositivas por plantillas) y ficha.txt.'],
      [2, 'Hace capturas (--capturas)', 'Claude Code revisa todas las fotos y corrige hasta que estén limpias.'],
      [2, 'Render final y HTML', 'node motor/crear-video.mjs <nombre>'],
      [1, 'Reporta duración, voz y ruta del MP4', 'Y genera GUION-PARA-GRABAR.txt para el docente.'],
    ],
    reglas: [
      'Claude Code nunca lee ni muestra .env, google-drive-cliente.json ni drive-token.json.',
      'No modifica motor/ para una clase concreta: un error del motor se explica y se propone.',
      'No inventa datos, citas ni estadísticas.',
    ],
    errores: [
      ['Una diapositiva se corta en las capturas', 'Demasiado texto para su espacio.', 'Reducir el texto antes que la letra (mínimo 19 px).'],
    ],
    datos: ['CLAUDE.md (prompt maestro)', 'FICHA-CLASE.txt', 'clases/<nombre>/'],
    relacionados: ['F04', 'F08'],
  },
  {
    codigo: 'F13', archivo: 'F13-laminas-gemini-nano-banana', nombre: 'Flujo de láminas con Gemini y Nano Banana',
    proposito: 'Generar láminas 16:9 con Nano Banana (Google Imagen 3) y automatizar el guion docente y efectos de cámara en el backend con Gemini Multimodal a partir de un clic en la web.',
    ficha: {
      Responsable: 'Docente / Equipo del estudio', Frecuencia: 'Clases con láminas visuales avanzadas', Tiempo: '1 a 3 minutos',
      Disparador: 'Un clic en la web para crear clase con láminas Nano Banana', Requisitos: 'Cuenta Google Pro Estudiante o AI Studio · IA que lee láminas en .env',
      Entradas: 'Tema y parámetros desde la web · Láminas 16:9 generadas', Salidas: 'Clase en clases/<nombre>/ con láminas 1080p, guion, clase.json y video final',
      Sistemas: 'Web del estudio · Backend Node.js · Gemini / Nano Banana · Motor de video',
    },
    carriles: ['Docente (Web)', 'Backend del estudio', 'Gemini / Nano Banana', 'Motor de video'],
    pasos: [
      [0, 'Elige tema y solicita láminas', 'Desde la web da 1 clic para iniciar la clase con diseño Nano Banana en 16:9.'],
      [1, 'Recibe orden y conecta con Gemini', 'El backend procesa la petición de la web y coordina la generación visual.'],
      [2, 'Crea láminas 16:9 con branding USS', 'Nano Banana genera diapositivas en alta resolución (1920×1080) con paleta #073299.'],
      [1, 'Descarga láminas en carpeta de clase', 'Guarda 01.jpg, 02.jpg, 03.jpg en clases/<nombre>/laminas/ y prepara el entorno.'],
      [2, 'Visión multimodal: extrae guion y JSON', 'Gemini Flash lee cada lámina, extrae la explicación docente y arma clase.json.'],
      [2, 'Mapea coordenadas de efectos de cámara', 'Ubica cajas de foco, zoom y resaltadores sincronizados con la voz.'],
      [0, 'Revisa en el editor web (1 clic)', 'Verifica las láminas en «Así se verá», elige la voz (ElevenLabs) y da el visto bueno.'],
      [3, 'Renderiza video MP4 1080p final', 'Playwright anima los fotogramas Full HD y ffmpeg compila audio y video final.'],
    ],
    reglas: [
      'Las láminas deben generarse en proporción 16:9 widescreen (1920×1080) para calzar en la pantalla.',
      'Con la cuenta Pro Estudiante la generación en Gemini es gratuita e ilimitada.',
      'El backend procesa la visión multimodal con la API de Google AI Studio (hasta 1.500 peticiones diarias gratis).',
      'En ElevenLabs usar siempre voces oficiales Premade como George (JBFqnCBsd6RMkjVDRZzb) en planes Free.',
    ],
    errores: [
      ['La voz suena a robot de sistema', 'ElevenLabs devolvió error 402 por usar voz de biblioteca en cuenta Free.', 'Usa voces oficiales Premade como George (JBFqnCBsd6RMkjVDRZzb) o Sarah.'],
      ['Las láminas salen cortadas', 'La proporción de imagen no era 16:9.', 'Generar siempre en formato 16:9 (1920×1080).'],
      ['Error 401 en la web', 'La sesión del navegador expiró.', 'Vuelve a introducir la clave del equipo (WEB_CLAVE en .env).'],
    ],
    datos: ['clases/<nombre>/laminas/*.jpg', 'clases/<nombre>/clase.json', 'guias/FLUJO-LAMINAS-NANO-BANANA-GEMINI.pdf'],
    relacionados: ['F02', 'F04', 'F08', 'F10'],
  },
  {
    codigo: 'F14', archivo: 'F14-video-con-google-vids', nombre: 'Crear un video con Google Vids', word: true,
    proposito: 'Convertir una sesión en un video hecho dentro de Google Vids: cada bloque de la clase pasa a ser una lámina ilustrada, con pantallas de la aplicación, y un avatar que la explica en español.',
    ficha: {
      Responsable: 'Docente o equipo del estudio', Frecuencia: 'Cada sesión', Tiempo: 'Unos 5 minutos por lámina',
      Disparador: 'La clase ya tiene su guion aprobado en el estudio', Requisitos: 'Cuenta de Google con Vids y cupo disponible · Claude o ChatGPT para escribir el contenido',
      Entradas: 'Clase con bloques y diapositivas (clase.json)', Salidas: 'Video MP4 1920×1080 descargado de Vids',
      Sistemas: 'Google Vids (Imagen y Avatar) · Claude o ChatGPT · web/vids-prompts.mjs',
    },
    carriles: ['Docente', 'Claude o ChatGPT', 'Google Vids'],
    pasos: [
      [0, 'Prepara el pedido de la clase', 'En la carpeta del kit ejecuta: node web/vids-prompts.mjs <clase> --contexto. Queda vids-pedido.txt con las reglas, la guía de la aplicación y cada bloque de la clase.'],
      [1, 'Escribe el contenido de cada lámina', 'Pega el pedido en Claude o ChatGPT. Devuelve títulos, pantalla del software y experiencia laboral. Guarda la respuesta como vids-contenido.json en la carpeta de la clase.'],
      [0, 'Genera los prompts finales', 'Ejecuta: node web/vids-prompts.mjs <clase>. Queda vids.json con un prompt y un guion por lámina. El programa agrega el estilo, los textos revisados y el espacio del avatar.'],
      [0, 'Crea un video nuevo', 'Entra a docs.google.com/videos y pulsa +. Ponle nombre con el curso, la sesión y el tema.'],
      [2, 'Genera la lámina en el panel Imagen', 'Pega el prompt de la lámina, comprueba que diga 16:9 y pulsa la flecha. Tarda unos 25 segundos.'],
      [0, '¿El texto y la pantalla están bien?', 'Abre la vista previa. Si hay una errata, un menú falso o algo en la columna derecha, genera otra: cada intento gasta una imagen.', true],
      [0, 'Inserta y fija la lámina como fondo', 'Pulsa Insertar. Luego, clic derecho sobre la imagen › Establecer imagen como fondo.'],
      [0, 'Escribe el guion y elige al presentador', 'Panel Avatar: pega el guion de la lámina. En Cambiar elige a William, tono medio grave y firme.'],
      [2, 'Genera el avatar', 'Pulsa Obtener vista previa y después Generar. Tarda unos 3 minutos. Gasta un avatar.'],
      [0, 'Coloca el avatar en su recuadro', 'Siempre pegado al borde derecho (X + Ancho = 1920). Selecciona el video › Opciones de formato: Ancho 600, X 1320, Y 371. En la portada: Ancho 800, X 1120, Y 400.'],
      [0, 'Pon el logo en cada lámina (obligatorio)', 'Siempre, en todas las escenas y en el mismo lugar: Insertar › Subir y elige marca/logo-transparente.png. Selecciónalo y en Opciones de formato pon Ancho 300, X 1600, Y 20. El panel Cargas abre Drive y Fotos: no lo necesitas.'],
      [0, 'Repite en una escena nueva', 'El botón + crea la escena de la lámina siguiente. Repite desde el paso 5.'],
      [0, 'Reproduce y descarga el MP4', 'Revisa todas las escenas con sonido y comprueba que cada una tenga su logo. Después: Archivo › Descargar › Video MP4. Mantén la pestaña abierta hasta que termine.'],
    ],
    capturas: [
      { paso: 1, consola: `$ node web/vids-prompts.mjs google-workspace-s1-gmail --contexto\nPedido listo: clases/google-workspace-s1-gmail/vids-pedido.txt`, pie: 'Salida real del comando. Abre el archivo y copia todo su texto.' },
      { paso: 2, consola: `{\n  "lamina": "03",\n  "frase": "Una bandeja ordenada te ahorra tiempo y transmite una imagen profesional.",\n  "pantalla": "la bandeja Recibidos llena de correos sin leer…",\n  "vista": "general",\n  "experiencia": "Oye, imagina que tu jefe te pide un correo antiguo en plena reunión: si tu bandeja está desordenada, todos se quedan esperándote."\n}`, pie: 'Parte de una lámina en vids-contenido.json.' },
      { paso: 3, consola: `$ node web/vids-prompts.mjs google-workspace-s1-gmail\n...\n15 láminas guardadas en clases/google-workspace-s1-gmail/vids.json`, pie: 'Salida real del comando. Cada lámina trae su prompt y su guion.' },
      { paso: 4, imagen: 'f14-03-nuevo.jpg', marcas: [[89, 110, 137, 78]], pie: 'Pulsa + en Iniciar un nuevo video.' },
      { paso: 5, imagen: 'f14-04-prompt.jpg', alto: 573, marcas: [[744, 240, 46, 38], [514, 465, 208, 24], [690, 518, 26, 26]], pie: 'Imagen › pega el prompt › Horizontal (16:9) › flecha.' },
      { paso: 6, imagen: 'f14-05-vista-previa.jpg', marcas: [[277, 370, 76, 35]], pie: 'Revisa la vista previa antes de pulsar Insertar.' },
      { paso: 7, imagen: 'f14-06-fondo.jpg', marcas: [[145, 623, 205, 26]], pie: 'Clic derecho › Establecer imagen como fondo.' },
      { paso: 8, imagen: 'f14-07-avatar.jpg', marcas: [[628, 486, 58, 22], [460, 225, 240, 170]], pie: 'Guion con la experiencia laboral y William como presentador.' },
      { paso: 9, imagen: 'f14-08-generar.jpg', marcas: [[467, 546, 226, 36]], pie: 'La vista previa no gasta avatar. Generar sí.' },
      { paso: 10, imagen: 'f14-09-formato.jpg', alto: 573, marcas: [[512, 283, 150, 33]], pie: 'Pegado a la derecha: Ancho 600, X 1320, Y 371.' },
      { paso: 11, imagen: 'f14-10-logo.jpg', alto: 573, marcas: [[512, 283, 150, 33]], pie: 'Obligatorio en cada escena: Ancho 300, X 1600, Y 20.' },
      { paso: 12, imagen: 'f14-11-escena.jpg', alto: 573, marcas: [[429, 478, 33, 33]], pie: 'El botón + agrega la escena de la lámina siguiente.' },
      { paso: 13, imagen: 'f14-12-descargar.jpg', alto: 573, marcas: [[285, 186, 190, 24]], pie: 'Archivo › Descargar › Video MP4 (.mp4).' },
    ],
    tablas: [
      {
        titulo: 'Límite mensual por cuenta',
        columnas: ['Cuenta', 'Créditos al mes', 'Clips de IA', 'Avatares', 'Imágenes', 'Voz en off'],
        filas: [
          ['Personal gratis', '50', '60 s', '6', 'Gasta créditos', 'Gasta créditos'],
          ['Google AI Plus', '50', '60 s', '6', 'Gasta créditos', 'Gasta créditos'],
          ['Google AI Pro', 'No usa', '500 s', '25', '30', 'Ilimitada'],
          ['Google AI Ultra 5x', 'No usa', '2 500 s', '125', '300', 'Ilimitada'],
          ['Google AI Ultra 20x', 'No usa', '10 000 s', '500', '1 000', 'Ilimitada'],
          ['Workspace Business Starter', 'No usa', '200 s', '10', '5', 'Ilimitada'],
          ['Workspace Business Standard y Plus', 'No usa', '500 s', '25', '30', 'Ilimitada'],
          ['Workspace for Education y Teaching and Learning', 'No usa', '200 s', '10', '5', 'Ilimitada'],
          ['Google AI Pro for Education', 'No usa', '2 000 s', '100', '300', 'Ilimitada'],
        ],
        nota: 'Las cuentas personales y Google AI Plus solo usan avatares prediseñados. El cupo se renueva el día 1 de cada mes a las 12:00 a. m., hora del Pacífico (3:00 a. m. en Perú, o 2:00 a. m. durante el horario de verano de EE. UU.), y no se acumula ni se comparte. En varios planes, el límite de imágenes se comparte con otros productos de Workspace, como Slides y Docs. Datos de la ayuda de Google, consultada el 5 de noviembre de 2026; Google puede cambiarlos.',
      },
      {
        titulo: 'Qué es un crédito',
        columnas: ['Qué haces', 'Créditos que gasta'],
        filas: [
          ['Generar o editar una imagen', '1'],
          ['Generar una voz en off', '1'],
          ['Usar Ayúdame a crear', '5'],
          ['Convertir Presentaciones en video con voz en off', '5'],
        ],
        nota: 'El crédito es el saldo mensual de IA de las cuentas Personal gratis, Google AI Plus y Workspace Individual. Cada acción descuenta créditos de ese saldo de 50. Ejemplo: 30 imágenes y 20 voces en off gastan los 50 créditos. Los avatares y los clips tienen su propio límite en la tabla de arriba. Las cuentas con «No usa» no tienen créditos: cuentan cada imagen, avatar o segundo.',
      },
      {
        titulo: 'Cuánto rinde una cuenta Google AI Pro',
        columnas: ['Forma de trabajar', 'Imágenes', 'Avatares', 'Sesiones al mes'],
        filas: [
          ['15 láminas con avatar en todas', '15', '15', '1'],
          ['15 láminas con avatar en portada y cierre, y voz en off en el resto', '15', '2', '2'],
        ],
        nota: 'El límite que manda en esta cuenta son las 30 imágenes. Cuenta también los intentos: si una lámina se repite, gasta otra imagen.',
      },
    ],
    casuistica: {
      titulo: 'Cuántas láminas necesitas para 1, 2 o 3 minutos',
      cuentas: [
        { nombre: 'Personal gratis', creditos: 50, avatares: 6 },
        { nombre: 'Google AI Pro', imagenes: 30, avatares: 25 },
        { nombre: 'AI Pro for Education', imagenes: 300, avatares: 100 },
      ],
      casos: [
        { nombre: 'Todo sale a la primera', detalle: '15 s por lámina y 1 imagen por lámina', lamina: 15, escena: 15, intentos: 1 },
        { nombre: 'Falla una vez cada lámina', detalle: '15 s por lámina y 2 imágenes por lámina', lamina: 15, escena: 15, intentos: 2 },
        { nombre: 'Láminas cortas y falla una vez', detalle: '10 s por lámina y 2 imágenes por lámina', lamina: 10, escena: 10, intentos: 2 },
        { nombre: 'Misma lámina en 2 escenas', detalle: '30 s por lámina, 2 avatares de 15 s y 2 imágenes por lámina', lamina: 30, escena: 15, intentos: 2 },
        { nombre: 'Misma lámina en 3 escenas', detalle: '45 s por lámina, 3 avatares de 15 s y 2 imágenes por lámina', lamina: 45, escena: 15, intentos: 2 },
        { nombre: 'Misma lámina con guion largo', detalle: '45 s por lámina, 1 avatar de 45 s y 2 imágenes por lámina', lamina: 45, escena: 45, intentos: 2 },
        { nombre: 'Avatar solo en 2 láminas', detalle: '15 s por lámina, voz en off en las demás y 2 imágenes por lámina', lamina: 15, escena: 15, intentos: 2, soloAvatares: 2 },
      ],
      nota: 'Nuestro video midió 10, 20, 17 y 12 segundos: 4 láminas, 1 minuto y unos 15 segundos por lámina. Cada avatar puede durar hasta 60 segundos. Una imagen fallida gasta cupo aunque no se use; la vista previa del avatar no gasta.',
      tituloCuentas: 'Cuántas clases salen al mes en cada cuenta',
      notaCuentas: 'Cuenta vacía a inicio de mes; manda el límite que se acabe primero. La cuenta gratis tiene 50 créditos y 6 avatares: cada imagen y cada voz en off gasta 1 crédito. Google AI Pro tiene 30 imágenes y 25 avatares. Google AI Pro for Education tiene 300 imágenes y 100 avatares; lo asigna el administrador de la institución.',
    },
    casosEjemplo: {
      titulo: 'Con las 4 láminas que ya hicimos',
      columnas: ['Video', 'Láminas', 'Cómo se logra', 'Imágenes nuevas', 'Avatares nuevos'],
      filas: [
        ['1 minuto', '4', 'Ya está hecho', '0', '0'],
        ['2 minutos', '4', 'Cada lámina en 2 escenas, con la segunda parte del guion', '0', '4'],
        ['3 minutos', '4', 'Cada lámina en 3 escenas, con más guion', '0', '8'],
        ['2 minutos', '8', '4 láminas nuevas, fallando una vez cada una', '8', '4'],
        ['3 minutos', '12', '8 láminas nuevas, fallando una vez cada una', '16', '8'],
      ],
      nota: 'Un minuto de avatar lleva unas 140 palabras de guion: nuestro video tiene 141. Una lámina repetida no gasta imagen, pero cada guion nuevo gasta 1 avatar. En una cuenta gratis caben 6 avatares al mes: desde la escena 7 usa voz en off o un guion más largo.',
    },
    reutilizar: {
      titulo: 'Cómo usar la misma lámina otra vez',
      imagen: 'f14-13-duplicar.jpg', alto: 573, marcas: [[266, 134, 380, 22]],
      pasos: [
        'Abre la escena que quieres repetir.',
        'Entra a Escena › Escena duplicada. La copia trae la lámina, el logo y el avatar, y no gasta imagen.',
        'En el panel Avatar escribe la parte siguiente del guion.',
        'Pulsa Obtener vista previa y después Generar. Gasta 1 avatar.',
      ],
    },
    ejemplos: [
      {
        titulo: 'Ejemplo de prompt: portada',
        texto: 'Portada horizontal 16:9 de un curso universitario, con acabado de publicidad corporativa, muy luminosa y pulida. La lámina tiene dos mitades. La mitad izquierda es blanca con un degradado azul muy pálido. La mitad derecha es una fotografía real y luminosa de una oficina moderna con ventanales, estantes y plantas, suavemente desenfocada y sin personas, que se funde con la mitad blanca por un borde diagonal suave. En la esquina inferior derecha, un triángulo verde brillante. En la parte alta de la fotografía, cerca del borde derecho, el ícono oficial de [[Gmail]] dentro de un globo de chat blanco con esquinas redondeadas y sombra suave. En la mitad izquierda, alineado a la izquierda y ocupando toda la altura, de arriba abajo: el texto azul marino de peso normal "[[Programa de Competencias Digitales, Productividad e Inteligencia Artificial]]"; una barra con degradado de azul marino a azul brillante, esquinas redondeadas y texto blanco en negrita "[[Módulo I: Comunicación, organización y gestión de información digital]]"; una etiqueta verde brillante con esquinas redondeadas y texto blanco en negrita "[[Sesión 1]]"; el título muy grande en negrita gruesa azul marino, directamente sobre el fondo blanco, sin tarjeta ni recuadro detrás, "[[Gestión profesional de la comunicación con Gmail]]"; al pie, el logotipo a todo color de [[Google Workspace]]. Usa exactamente los textos entre comillas, con todas sus tildes, sin agregar ni repetir palabras y sin escribir las comillas en la lámina. Sin tarjetas, sobres ni ilustraciones dibujadas. Sin personas ni personajes. Sin marcas de agua. No escribas el nombre de la universidad ni otros logotipos.',
        cambios: [
          ['Programa', 'Programa de Competencias Digitales, Productividad e Inteligencia Artificial'],
          ['Módulo', 'Módulo I: Comunicación, organización y gestión de información digital'],
          ['Sesión', 'Sesión 1'],
          ['Título o tema', 'Gestión profesional de la comunicación con Gmail'],
          ['Aplicación del ícono', 'Gmail'],
          ['Categoría del pie', 'Google Workspace'],
        ],
      },
      {
        titulo: 'Ejemplo de prompt: lámina con pantalla',
        texto: 'Lámina horizontal 16:9 de un curso universitario, estilo infografía corporativa moderna y muy pulida. Fondo blanco con degradado azul muy pálido y formas suaves. Paleta: azul marino, azul brillante, verde y amarillo suave como acento. Tipografía sans serif clara, títulos en negrita. Tarjetas blancas o azul pálido con esquinas redondeadas y sombra suave. Íconos de línea azul. Todo el texto es grande y se lee a distancia, y el contenido llena todo el alto de la lámina. Divide la lámina en tres columnas iguales. La columna derecha queda completamente vacía de arriba abajo, solo con el fondo: nada de texto, íconos, tarjetas, ilustraciones ni personas. Todo el contenido cabe dentro de las dos columnas izquierdas y ningún elemento cruza a la columna derecha. Arriba, dentro de las dos columnas izquierdas, una barra azul marino con esquinas redondeadas; en su extremo izquierdo un cuadrado azul brillante con [[un signo de pregunta]] en blanco; dentro de la barra, en blanco y negrita: "[[¿Cuántas veces buscaste un correo?]]". Debajo, una captura de pantalla real de [[Gmail]] en computadora, en español, dentro de una ventana de navegador, plana y de frente, sin inclinación ni perspectiva, con la interfaz, los colores, los íconos y la tipografía originales: [[la bandeja Recibidos llena de correos sin leer de Aula virtual, Biblioteca y Coordinación académica, con el panel izquierdo visible]]. Se ve la ventana completa de la aplicación. La captura es la protagonista: ocupa todo el ancho de las dos columnas izquierdas. Debajo de la captura, una franja azul pálida con el texto "[[Una bandeja ordenada te ahorra tiempo y transmite una imagen profesional.]]". Usa exactamente los textos entre comillas, con todas sus tildes, sin agregar ni repetir palabras y sin escribir las comillas en la lámina. No dibujes personas, personajes, muñecos, mascotas ni ilustraciones decorativas: la única imagen es la captura. Sin marcas de agua. Los únicos logotipos son los propios de la aplicación dentro de la captura.',
        cambios: [
          ['Ícono de la barra', 'un signo de pregunta'],
          ['Título de la barra', '¿Cuántas veces buscaste un correo?'],
          ['Aplicación', 'Gmail'],
          ['Qué se ve en la pantalla', 'la bandeja Recibidos llena de correos sin leer…'],
          ['Frase de abajo', 'Una bandeja ordenada te ahorra tiempo y transmite una imagen profesional.'],
        ],
      },
    ],
    reglas: [
      'Cada sesión sigue la estructura USS: portada, logro, motivación, temario, desarrollo, práctica, conclusiones y cierre.',
      'El contenido de cada lámina lo escribe Claude o ChatGPT con el pedido de contexto. Lo que falte en vids-contenido.json lo completa la IA gratis configurada en .env.',
      'La columna derecha de la lámina queda libre para el avatar, que va pegado al borde derecho. Cada avatar puede durar hasta 60 segundos.',
      'El logo es obligatorio: ningún video se descarga con una escena sin logo. La IA de imágenes no lo dibuja, así que siempre se inserta el archivo real, con fondo transparente. Va siempre en el mismo lugar, arriba a la derecha, también en la portada.',
      'La portada sigue la lámina modelo clases/gmail-comunicacion-laminas/laminas/01.png: texto a la izquierda, foto de oficina a la derecha, ícono de la aplicación y triángulo verde.',
      'El avatar no solo lee el guion: agrega una situación de trabajo sin cifras inventadas. Revísala antes de generar, porque cada avatar gasta cupo.',
      'Hay guía de pantallas para Gmail, Drive, Documentos, Hojas, Presentaciones, Meet, Calendario, Gemini, Word, Excel y PowerPoint.',
      'Las pantallas las dibuja la IA: se parecen a la aplicación, pero pueden inventar menús. Revísalas siempre o usa una captura real.',
      'Una escena con avatar no lleva voz en off: se oirían dos voces.',
      'El cupo se gasta al generar. Mover, editar o descargar no aparece entre los límites de Google. Google no aclara si borrar lo generado devuelve el cupo: asume que no.',
      'No uses Deshacer mientras se genera un avatar: al llegar, Deshacer puede quitarlo y habría que generarlo de nuevo.',
      'Cada cuenta debe ser real. Las condiciones de Google prohíben crear cuentas falsas y saltarse sus medidas de protección, y Google puede suspender una cuenta. Para más cupo, cada docente usa su propia cuenta o se pide un plan institucional.',
    ],
    errores: [
      ['La lámina repite una palabra o trae una errata', 'La IA de imágenes copió mal el texto.', 'No la insertes. Genera otra y revisa la vista previa.'],
      ['Se oyen dos voces', 'La escena tiene voz en off y avatar a la vez.', 'Selecciona la pista azul de voz en off y bórrala.'],
      ['El avatar tapa la lámina', 'Vids lo inserta a pantalla completa.', 'Usa Opciones de formato con las medidas del paso 10.'],
      ['El avatar desapareció', 'Se usó Deshacer justo después de que llegó.', 'Genéralo de nuevo; gasta otro avatar. Espera a que termine antes de deshacer.'],
      ['Una escena quedó sin logo', 'Cada escena necesita su propio logo: Vids no lo copia a las demás.', 'Antes de descargar, insértalo en esa escena y dale sus medidas.'],
      ['Dice «El avatar está desactualizado»', 'Cambiaste el guion después de generar el avatar.', 'Pulsa Obtener vista previa y Generar. Gasta otro avatar.'],
      ['La imagen no sale en 16:9', 'El panel olvidó el formato.', 'Antes de la flecha, comprueba que diga 16:9.'],
      ['Ya no deja generar', 'Se terminó el cupo del mes.', 'Espera al día 1 o continúa con la cuenta real de otro docente.'],
    ],
    datos: ['web/vids-prompts.mjs', 'web/skills/vids.md', 'web/skills/pantallas/', 'clases/<nombre>/vids-pedido.txt', 'clases/<nombre>/vids-contenido.json', 'clases/<nombre>/vids.json', 'marca/logo-transparente.png'],
    relacionados: ['F01', 'F10', 'F11'],
  },
];

// ---------------------------------------------------------------- diagrama por carriles (SVG)
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const COLORES = [
  ['#eef6cf', '#7d9a0c'], ['#ecebff', '#3e32d4'], ['#fff1e6', '#c2410c'], ['#e8f1ff', '#1f5fd1'], ['#f3f3f6', '#5b5b6b'],
];
function partirTexto(t, max) {
  const lineas = [];
  let actual = '';
  for (const p of String(t).split(/\s+/)) {
    if ((actual + ' ' + p).trim().length > max && actual) { lineas.push(actual); actual = p; } else actual = (actual + ' ' + p).trim();
  }
  if (actual) lineas.push(actual);
  if (lineas.length > 3) console.warn(`[!] Texto largo para el diagrama (se corta): ${t}`);
  return lineas.slice(0, 3);
}
function diagrama(f) {
  const W = 680;
  const n = f.carriles.length;
  const ancho = W / n;
  const CAB = 34;
  const FILA = f.pasos.length > 12 ? 38 : 42;
  const ALTO = FILA - 7;
  const H = CAB + 12 + f.pasos.length * FILA + 6;
  const max = Math.floor((ancho - 40) / 5.3);
  const partes = [];
  partes.push(`<defs><marker id="punta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0 0L10 5L0 10z" fill="#1d1d22"/></marker></defs>`);
  f.carriles.forEach((c, i) => {
    const [fondo] = COLORES[i % COLORES.length];
    partes.push(`<rect x="${i * ancho}" y="0" width="${ancho}" height="${H}" fill="${i % 2 ? '#fbfbfd' : '#ffffff'}"/>`);
    partes.push(`<rect x="${i * ancho + 3}" y="3" width="${ancho - 6}" height="${CAB - 6}" rx="6" fill="${fondo}"/>`);
    partes.push(`<text x="${i * ancho + ancho / 2}" y="${CAB / 2 + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#1d1d22">${esc(c)}</text>`);
    if (i) partes.push(`<line x1="${i * ancho}" y1="0" x2="${i * ancho}" y2="${H}" stroke="#d9dbe2" stroke-dasharray="3 4"/>`);
  });
  const caja = (k) => {
    const [c] = f.pasos[k];
    return { x: c * ancho + 8, y: CAB + 12 + k * FILA, w: ancho - 16, cx: c * ancho + ancho / 2 };
  };
  f.pasos.forEach(([c, texto, , decision], k) => {
    if (k + 1 < f.pasos.length) {
      const a = caja(k), z = caja(k + 1);
      const y1 = a.y + ALTO, y2 = z.y;
      const medio = y1 + (y2 - y1) / 2;
      const d = a.cx === z.cx ? `M${a.cx} ${y1} V${y2 - 1}` : `M${a.cx} ${y1} V${medio} H${z.cx} V${y2 - 1}`;
      partes.push(`<path d="${d}" fill="none" stroke="#1d1d22" stroke-width="1.3" marker-end="url(#punta)"/>`);
      if (decision) partes.push(`<text x="${a.cx + 6}" y="${y1 + 10}" font-size="8.5" font-weight="700" fill="#5b6e00">Sí</text>`);
    }
    const { x, y, w } = caja(k);
    const [fondo, borde] = COLORES[c % COLORES.length];
    partes.push(`<rect x="${x}" y="${y}" width="${w}" height="${ALTO}" rx="${decision ? 18 : 7}" fill="${decision ? '#fffbe6' : '#fff'}" stroke="${decision ? '#c9a400' : borde}"
      stroke-width="1.4" ${decision ? 'stroke-dasharray="4 3"' : ''}/>`);
    partes.push(`<rect x="${x}" y="${y}" width="5" height="${ALTO}" rx="2" fill="${decision ? '#c9a400' : borde}"/>`);
    partes.push(`<circle cx="${x + 18}" cy="${y + ALTO / 2}" r="9" fill="${decision ? '#c9a400' : borde}"/>`);
    partes.push(`<text x="${x + 18}" y="${y + ALTO / 2 + 3.5}" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">${k + 1}</text>`);
    const lineas = partirTexto(texto, max);
    const y0 = y + ALTO / 2 - (lineas.length - 1) * 5.2 + 3.3;
    lineas.forEach((l, i) => partes.push(`<text x="${x + 32}" y="${y0 + i * 10.4}" font-size="9.2" font-weight="600" fill="#1d1d22">${esc(l)}</text>`));
    void fondo;
  });
  return `<svg class="diagrama" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Inter, Arial, sans-serif">${partes.join('')}</svg>`;
}

// ---------------------------------------------------------------- pagina HTML de un flujo
const fuente = archivo => pathToFileURL(path.join(REPO, 'clases-mac', 'node_modules', '@fontsource', archivo)).href;
const CSS = `
  @font-face { font-family: Inter; font-weight: 400; src: url(${fuente('inter/files/inter-latin-400-normal.woff2')}); }
  @font-face { font-family: Inter; font-weight: 600; src: url(${fuente('inter/files/inter-latin-600-normal.woff2')}); }
  @font-face { font-family: Inter; font-weight: 700; src: url(${fuente('inter/files/inter-latin-700-normal.woff2')}); }
  @font-face { font-family: Inter; font-weight: 800; src: url(${fuente('inter/files/inter-latin-800-normal.woff2')}); }
  @font-face { font-family: Inter; font-weight: 900; src: url(${fuente('inter/files/inter-latin-900-normal.woff2')}); }
  @font-face { font-family: Serif; font-style: italic; src: url(${fuente('instrument-serif/files/instrument-serif-latin-400-italic.woff2')}); }
  :root { --verde: #a6c61a; --verde-osc: #5b6e00; --verde-50: #f3f8dc; --tinta: #121214; --gris: #5d616c; --linea: #e3e4e8; --caja: #f4f4f7; --morado: #3e32d4; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 400 9.6pt/1.5 Inter, sans-serif; color: var(--tinta); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .etiqueta { font-size: 7.4pt; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: var(--verde-osc); margin: 0 0 2mm; }
  h1 { display: flex; align-items: center; gap: 4mm; font-size: 18pt; line-height: 1.05; letter-spacing: -0.035em; font-weight: 900; margin: 0 0 2.5mm; }
  h1 .cod { flex: none; font: 800 12pt/1 Inter; letter-spacing: .02em; color: #fff; background: var(--tinta); border-radius: 2mm; padding: 2mm 3mm; }
  .proposito { font-size: 9.8pt; color: #34343f; margin: 0 0 4mm; max-width: 172mm; }
  h2 { font-size: 11.5pt; font-weight: 800; letter-spacing: -0.01em; margin: 5mm 0 2mm; display: flex; align-items: center; gap: 2.5mm; }
  h2::before { content: ''; width: 5mm; height: 1.4mm; border-radius: 1mm; background: var(--verde); }
  .ficha { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--linea); border: 1px solid var(--linea); border-radius: 2.5mm; overflow: hidden; }
  .ficha div { background: #fff; padding: 1.3mm 3mm; }
  .ficha div.c2 { grid-column: span 2; }
  .ficha div.c4 { grid-column: 1 / -1; }
  .bloque-diagrama { break-inside: avoid; }
  .ficha b { display: block; font-size: 7pt; letter-spacing: .12em; text-transform: uppercase; color: var(--gris); margin-bottom: .4mm; }
  .ficha span { font-size: 8.9pt; line-height: 1.4; }
  .diagrama { width: 100%; height: auto; border: 1px solid var(--linea); border-radius: 2.5mm; }
  .leyenda { font-size: 7.8pt; color: var(--gris); margin: 1.5mm 0 0; }
  .salto { break-before: page; }
  table { width: 100%; border-collapse: collapse; font-size: 8.7pt; }
  th { text-align: left; font-size: 7pt; letter-spacing: .12em; text-transform: uppercase; color: var(--gris); padding: 1.6mm 2mm; border-bottom: 1.5px solid var(--tinta); }
  td { padding: 1.5mm 2mm; border-bottom: 1px solid var(--linea); vertical-align: top; line-height: 1.42; }
  tr { break-inside: avoid; }
  td.n { width: 9mm; font-weight: 800; color: var(--verde-osc); }
  td.actor { width: 33mm; font-weight: 700; }
  td.paso { width: 52mm; font-weight: 600; }
  .dec td.n { color: #a08300; }
  ul.reglas { margin: 0; padding-left: 4.5mm; } ul.reglas li { margin-bottom: .8mm; }
  .chips { display: flex; flex-wrap: wrap; gap: 2mm; } .chips span { font: 600 8.4pt Consolas, monospace; background: var(--caja); border-radius: 1.5mm; padding: .8mm 2.2mm; }
  .rel span { font-family: Inter; font-weight: 800; background: var(--verde-50); color: var(--verde-osc); }
  .indice td.cod { width: 14mm; font-weight: 900; }
  .sin-corte { break-inside: avoid; }
  .ejemplo { font: 500 8.2pt/1.5 Consolas, monospace; background: var(--caja); border-radius: 2mm; padding: 2.5mm 3mm; margin: 0; }
  mark { background: #ffe14d; color: var(--tinta); border-radius: .6mm; padding: 0 .5mm; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .aviso { margin: 0 0 2mm; font-size: 8.6pt; color: var(--tinta); }
  .cambios { margin-top: 2mm; }
  .cambios td { padding: 1mm 2mm; }
  .cambios td.que { width: 44mm; font-weight: 800; color: #d0021b; }
  td.calc { font-size: 8.3pt; line-height: 1.32; }
  .porcuenta th.cuenta { text-align: center; border-left: 1.5px solid var(--linea); letter-spacing: .06em; }
  .porcuenta .num { text-align: center; width: 12mm; font-weight: 700; padding-left: 1mm; padding-right: 1mm; }
  .porcuenta .no { color: #d0021b; }
  .porcuenta td.num:nth-child(3n+2), .porcuenta tr:nth-child(2) th.num:nth-child(3n+1) { border-left: 1.5px solid var(--linea); }
  td .detalle { display: block; font-weight: 400; font-size: 8pt; color: var(--gris); }
  .reutilizar { display: grid; grid-template-columns: 66mm 1fr; gap: 5mm; align-items: center; }
  .reutilizar .pantalla { width: 66mm; margin: 0; }
  .reutilizar ol { margin: 0; padding-left: 5mm; font-size: 9pt; } .reutilizar li { margin-bottom: 1.2mm; }
  .capturas { display: grid; grid-template-columns: repeat(6, 1fr); gap: 3mm; }
  .captura { grid-column: span 3; display: flex; flex-direction: column; break-inside: avoid; border: 1px solid var(--linea); border-radius: 2.5mm; padding: 2mm; }
  .captura.texto { grid-column: span 2; }
  .captura h3 { display: flex; align-items: flex-start; gap: 1.8mm; font-size: 9pt; line-height: 1.25; font-weight: 800; margin: 0 0 1.6mm; min-height: 6mm; }
  .captura h3 b { flex: none; min-width: 5.4mm; text-align: center; font-size: 8pt; line-height: 1; color: #fff; background: var(--tinta); border-radius: 1.2mm; padding: 1mm 1.1mm; }
  .captura p { font-size: 8pt; line-height: 1.35; color: #34343f; margin: 1.5mm 0 0; }
  .pantalla { position: relative; width: 72mm; margin: 0 auto; border: 1px solid var(--linea); border-radius: 1.5mm; overflow: hidden; }
  .pantalla img { display: block; width: 100%; }
  .pantalla i { position: absolute; border: 1.6pt solid #e01f3d; border-radius: 1.2mm; }
  .consola { flex: 1; margin: 0; padding: 2mm 2.4mm; border-radius: 1.5mm; background: #121214; color: #e9eaee; font: 500 6.6pt/1.45 Consolas, Menlo, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
`;
const nombreDe = c => (FLUJOS.find(f => f.codigo === c) || {}).nombre || c;
// Secciones opcionales de un flujo: tablas de datos y un ejemplo para copiar
const tablaHtml = t => `<div class="sin-corte"><h2>${esc(t.titulo)}</h2><table><tr>${t.columnas.map(c => `<th>${esc(c)}</th>`).join('')}</tr>
    ${t.filas.map(fila => `<tr>${fila.map((c, i) => `<td class="${i ? '' : 'paso'}">${esc(c)}</td>`).join('')}</tr>`).join('')}</table>
    <p class="leyenda">${esc(t.nota)}</p></div>`;
// Casuística de duración: se calcula para que las cifras no se desalineen si cambia un caso o un cupo.
function necesita(k, minutos) {
  const segundos = minutos * 60;
  const laminas = Math.ceil(segundos / k.lamina);
  const escenas = Math.ceil(segundos / k.escena);
  const avatares = k.soloAvatares || escenas;
  return { laminas, imagenes: laminas * k.intentos, avatares, voces: escenas - avatares };
}
function clasesAlMes(cuenta, n) {
  const porImagen = cuenta.creditos ? cuenta.creditos / (n.imagenes + n.voces) : cuenta.imagenes / n.imagenes;
  return Math.min(Math.floor(porImagen), Math.floor(cuenta.avatares / n.avatares));
}
function celdaCaso(k, minutos) {
  const n = necesita(k, minutos);
  const voces = n.voces ? `<br>${n.voces} ${n.voces === 1 ? 'voz' : 'voces'} en off` : '';
  return `<td class="calc"><b>${n.laminas} láminas</b><br>${n.imagenes} imágenes<br>${n.avatares} avatares${voces}</td>`;
}
const celdaCuenta = (cuenta, k, minutos) => {
  const clases = clasesAlMes(cuenta, necesita(k, minutos));
  return clases ? `<td class="num">${clases}</td>` : '<td class="num no">No</td>';
};
function casuisticaDe(f) {
  const c = f.casuistica;
  if (!c) return '';
  const minutos = [1, 2, 3];
  const nombre = k => `<td class="paso">${esc(k.nombre)}<span class="detalle">${esc(k.detalle)}</span></td>`;
  const filas = c.casos.map(k => `<tr>${nombre(k)}${minutos.map(m => celdaCaso(k, m)).join('')}</tr>`).join('');
  const porCuenta = c.casos.map(k => `<tr><td class="paso">${esc(k.nombre)}</td>${c.cuentas.map(q => minutos.map(m => celdaCuenta(q, k, m)).join('')).join('')}</tr>`).join('');
  const r = f.reutilizar;
  return `<div class="salto"></div><div class="sin-corte"><h2>${esc(c.titulo)}</h2><table><tr><th>Caso</th>${minutos.map(m => `<th>${m} ${m === 1 ? 'minuto' : 'minutos'}</th>`).join('')}</tr>${filas}</table>
    <p class="leyenda">${esc(c.nota)}</p></div>
    <div class="sin-corte"><h2>${esc(c.tituloCuentas)}</h2><table class="porcuenta"><tr><th rowspan="2">Caso</th>${c.cuentas.map(q => `<th colspan="3" class="cuenta">${esc(q.nombre)}</th>`).join('')}</tr>
      <tr>${c.cuentas.map(() => minutos.map(m => `<th class="num">${m} min</th>`).join('')).join('')}</tr>${porCuenta}</table>
    <p class="leyenda">${esc(c.notaCuentas)}</p></div>
    ${tablaHtml(f.casosEjemplo)}
    <div class="sin-corte"><h2>${esc(r.titulo)}</h2><div class="reutilizar">${pantallaHtml(r, r.titulo)}<ol>${r.pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol></div></div>`;
}
function tablasExtra(f) {
  const tablas = (f.tablas || []).map(tablaHtml).join('');
  const ejemplos = (f.ejemplos || []).map(e => `<div class="sin-corte"><h2>${esc(e.titulo)}</h2><p class="leyenda aviso">Copia el prompt y cambia solo lo que está en <mark>amarillo</mark>. Si va entre comillas, deja las comillas: la IA copia ese texto en la lámina. Lo demás guarda el estilo del curso.</p>
    <p class="ejemplo">${esc(e.texto).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>')}</p>
    <table class="cambios"><tr><th>Aquí cambias</th><th>En este ejemplo dice</th></tr>${e.cambios.map(([q, v]) => `<tr><td class="que">${esc(q)}</td><td><mark>${esc(v)}</mark></td></tr>`).join('')}</table></div>`).join('');
  return tablas + casuisticaDe(f) + ejemplos;
}
// Sección opcional: una captura o salida de comando por paso; las marcas van en píxeles de la captura original
const CAPTURA = { ancho: 800, alto: 677 };
function pantallaHtml(c, titulo) {
  const { ancho, alto } = { ...CAPTURA, ...c };
  const marcas = (c.marcas || []).map(([x, y, a, h]) => `<i style="left:${x / ancho * 100}%;top:${y / alto * 100}%;width:${a / ancho * 100}%;height:${h / alto * 100}%"></i>`).join('');
  return `<div class="pantalla"><img src="../capturas/${c.imagen}" alt="${esc(titulo)}">${marcas}</div>`;
}
function pasoConCaptura(f, c) {
  const titulo = f.pasos[c.paso - 1][1];
  const vista = c.consola ? `<pre class="consola">${esc(c.consola)}</pre>` : pantallaHtml(c, titulo);
  return `<div class="captura${c.consola ? ' texto' : ''}"><h3><b>${c.paso}</b>${esc(titulo)}</h3>${vista}<p>${esc(c.pie)}</p></div>`;
}
function capturasDe(f) {
  if (!f.capturas) return '';
  return `<div class="salto"></div><h2>Paso a paso con capturas</h2><div class="capturas">${f.capturas.map(c => pasoConCaptura(f, c)).join('')}</div><div class="salto"></div>`;
}
function html(f) {
  const ficha = Object.entries({ Código: f.codigo, ...f.ficha });
  // datos cortos en una celda; los largos en media fila; el ultimo largo sin pareja, en la fila completa
  const cortos = new Set(['Código', 'Responsable', 'Frecuencia', 'Tiempo', 'Tiempo total']);
  const largos = ficha.filter(([k]) => !cortos.has(k)).map(([k]) => k);
  const ancho = k => (cortos.has(k) ? '' : largos.length % 2 && k === largos[largos.length - 1] ? 'c4' : 'c2');
  const filas = f.pasos.map(([c, texto, detalle, decision], k) => `<tr class="${decision ? 'dec' : ''}"><td class="n">${k + 1}${decision ? ' ◆' : ''}</td>
    <td class="actor">${esc(f.carriles[c])}</td><td class="paso">${esc(texto)}</td><td>${esc(detalle)}</td></tr>`).join('');
  const indice = f.indice ? `<h2>Índice de flujos</h2><table class="indice"><tr><th>Código</th><th>Flujo</th><th>Para qué sirve</th></tr>
    ${FLUJOS.filter(x => !x.indice).map(x => `<tr><td class="cod">${x.codigo}</td><td class="paso">${esc(x.nombre)}</td><td>${esc(x.proposito)}</td></tr>`).join('')}</table>
    <h2>Dónde vive cada parte</h2><table><tr><th>Parte</th><th>Qué hace</th><th>Archivos</th></tr>
    <tr><td class="paso">Web del estudio</td><td>Formulario, editor, cola de trabajos y ajustes. Corre en la PC del estudio.</td><td>web/servidor.mjs · web/publico/</td></tr>
    <tr><td class="paso">IA</td><td>Escribe guion y diapositivas siguiendo las skills y una clase modelo.</td><td>web/ia.mjs · web/skills/ · web/skills/ejemplos/</td></tr>
    <tr><td class="paso">Motor de video</td><td>Voz, diapositivas animadas, video MP4, HTML y subida a Drive.</td><td>motor/crear-video.mjs · motor/diapos-auto.js · motor/drive.mjs</td></tr>
    <tr><td class="paso">Clases</td><td>Cada clase en su carpeta: guion, diapositivas, voz y diseño.</td><td>clases/&lt;nombre&gt;/clase.json</td></tr>
    <tr><td class="paso">Ajustes privados</td><td>Claves de los servicios. Nunca se comparten ni se suben a GitHub.</td><td>.env</td></tr></table>` : '';
  const resto = f.indice ? indice : `
    <h2>Pasos del flujo</h2><table><tr><th>N.°</th><th>Actor</th><th>Paso</th><th>Qué pasa</th></tr>${filas}</table>
    ${capturasDe(f)}
    ${tablasExtra(f)}
    <h2>Reglas del negocio</h2><ul class="reglas">${f.reglas.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
    <div class="sin-corte"><h2>Errores frecuentes</h2><table><tr><th>Lo que ves</th><th>Por qué pasa</th><th>Qué hacer</th></tr>
      ${f.errores.map(([a, b, c]) => `<tr><td class="paso">${esc(a)}</td><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}</table></div>
    <h2>Archivos y datos</h2><div class="chips">${f.datos.map(d => `<span>${esc(d)}</span>`).join('')}</div>
    <h2>Flujos relacionados</h2><div class="chips rel">${f.relacionados.map(r => `<span>${r} · ${esc(nombreDe(r))}</span>`).join('')}</div>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${f.codigo} · ${esc(f.nombre)}</title><style>${CSS}</style></head><body>
    <p class="etiqueta">Manual de flujos · Estudio de clases USS</p>
    <h1><span class="cod">${f.codigo}</span>${esc(f.nombre)}</h1>
    <p class="proposito">${esc(f.proposito)}</p>
    <div class="ficha">${ficha.map(([k, v]) => `<div class="${ancho(k)}"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('')}</div>
    <div class="bloque-diagrama"><h2>Diagrama del flujo</h2>${diagrama(f)}
    <p class="leyenda">Cada carril es un actor y los pasos van de arriba abajo. Las cajas punteadas son decisiones: «Sí» sigue la flecha; la otra salida está en la tabla de pasos (◆).</p></div>
    <div class="salto"></div>${resto}
  </body></html>`;
}

// ---------------------------------------------------------------- PDF con encabezado y pie de la USS
const encabezado = f => `<div style="width:100%;margin:0 16mm;padding-bottom:2mm;border-bottom:1px solid #e3e4e8;display:flex;justify-content:space-between;
  align-items:center;font-family:Arial,sans-serif;font-size:7pt;color:#5d616c;-webkit-print-color-adjust:exact">
  <img src="${LOGO}" alt="USS Centro de Informática" style="height:7mm"><span>Estudio de clases · ${f.codigo}</span></div>`;
const pie = f => `<div style="width:100%;margin:0 16mm;padding-top:2mm;border-top:1px solid #e3e4e8;display:flex;justify-content:space-between;
  font-family:Arial,sans-serif;font-size:6.8pt;color:#5d616c"><span>${esc(f.codigo)} · ${esc(f.nombre)}</span>
  <span>${VERSION} · <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;

async function playwright() {
  for (const kit of ['clases-mac', 'clases-windows']) {
    const f = path.join(REPO, kit, 'node_modules', 'playwright', 'index.mjs');
    if (fs.existsSync(f)) return import(pathToFileURL(f).href);
  }
  throw new Error('Falta Playwright: instala el kit (clases-mac o clases-windows) con INSTALAR-TODO.');
}

const DIR_HTML = path.join(AQUI, 'html');
fs.mkdirSync(DIR_HTML, { recursive: true });
const { chromium } = await playwright();
const navegador = await chromium.launch();
try {
  const pagina = await navegador.newPage();
  for (const f of FLUJOS) {
    const archivoHtml = path.join(DIR_HTML, `${f.archivo}.html`);
    fs.writeFileSync(archivoHtml, html(f));
    await pagina.goto(pathToFileURL(archivoHtml).href, { waitUntil: 'load' });
    await pagina.evaluate(() => document.fonts.ready);
    const salida = path.join(AQUI, '..', `${f.archivo}.pdf`);
    await pagina.pdf({ path: salida, format: 'A4', printBackground: true, displayHeaderFooter: true,
      headerTemplate: encabezado(f), footerTemplate: pie(f), margin: { top: '20mm', bottom: '16mm', left: '16mm', right: '16mm' } });
    console.log(`[OK] ${path.relative(process.cwd(), salida)}`);
  }
  // Word editable de los flujos marcados con `word: true`: usa las capturas ya dibujadas con sus marcas.
  const nitida = await navegador.newPage({ deviceScaleFactor: 3 });
  for (const f of FLUJOS.filter(x => x.word)) {
    const { crearWord } = await import('./word.mjs').catch(() => ({}));
    if (!crearWord) { console.log('[!] Falta la librería docx: ejecuta npm install en guias/flujos/fuente'); break; }
    const salida = path.join(AQUI, '..', `${f.archivo}.docx`);
    await crearWord({ f, nombreDe, necesita, clasesAlMes, pagina: nitida, archivoHtml: path.join(DIR_HTML, `${f.archivo}.html`), salida, version: VERSION, rutaLogo: path.join(REPO, 'clases-mac', 'marca', 'logo-transparente.png') });
    console.log(`[OK] ${path.relative(process.cwd(), salida)}`);
  }
} finally {
  await navegador.close();
}
