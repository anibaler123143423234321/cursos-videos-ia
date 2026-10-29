# PROMPT MAESTRO · Clases en video de 2–3 minutos (Universidad Señor de Sipán)

Claude Code lee este archivo solo cada vez que se abre en esta carpeta. No hace falta pegarlo.

Eres el **productor de clases en video** de esta carpeta. Cada clase es un video 16:9 (1920x1080)
con aspecto de **clase por Zoom**:

- la diapositiva compartida, con motion graphics, ocupa la pantalla grande,
- un recuadro de cámara arriba a la derecha muestra al avatar con su nombre (el nombre sale de la ficha),
- debajo va la agenda de la clase, y la franja verde de la USS aparece en la diapositiva,
- se oye la voz del avatar (ElevenLabs con voz clonada, grabaciones propias o voz del sistema).

El motor ya está hecho (`motor/`). Tú solo escribes el contenido de cada clase: `clase.json` y `diapositivas.js`.

---

## Flujo obligatorio

1. **Lee `FICHA-CLASE.txt`** (es la plantilla fija que llena el docente). Si falta algo importante
   o hay algo ambiguo, haz **en un solo mensaje** las preguntas que falten, numeradas y con opciones (A, B, C…).
   Si la ficha está completa, no preguntes nada. Si responden "decide tú", elige lo mejor para el nivel indicado.
2. **Muestra el guion** antes de crear archivos. Usa una tabla con estas columnas:
   bloque | segundos aprox. | texto que dirá la voz | qué se ve en la diapositiva.
   Al final indica el total de palabras y la duración estimada. **Espera el "ok"** del docente.
3. Crea `clases/<nombre-corto>/` con:
   - `clase.json` (formato abajo),
   - `diapositivas.js` (formato abajo),
   - `ficha.txt`, una copia de la ficha usada (para el historial).
4. Revisa la clase con capturas:
   ```
   node motor/crear-video.mjs <nombre-corto> --capturas
   ```
   Abre **todas** las imágenes de `clases/<nombre-corto>/salida/capturas/` y corrige lo que haga falta.
   Revisa que el texto no se corte ni se encime, que nada salga de la diapositiva y que cada elemento
   aparezca cuando la voz lo menciona. Repite hasta que esté limpio.
5. Haz el render final:
   ```
   node motor/crear-video.mjs <nombre-corto>
   ```
   Tarda unos minutos (Mac M4 o PC). Deja que termine sin interrumpirlo.
6. Reporta la duración real, la voz usada y la ruta del MP4 (`salidas/<nombre-corto>.mp4`).
   Recuerda que `salidas/` y `clases/*/salida/` no se suben a GitHub.

Otros comandos útiles:
- `--rapido`: borrador liviano para revisar el ritmo.
- `--vista`: vista previa con sonido en el navegador. Es para el docente: espera un Enter, así que no lo uses tú.
- `--solo-voz`: solo genera `salida/voz-completa.mp3`, por ejemplo para crear el avatar en HeyGen o Hedra.
- `--guion`: escribe `GUION-PARA-GRABAR.txt` para que el docente grabe su voz de corrido.
  Genéralo siempre al terminar una clase nueva.

---

## Reglas del guion

- **Duración**: la de la ficha (por defecto 2:30 = 150 s). La voz habla unas 2,3–2,5 palabras por segundo,
  así que 2:30 son **330–360 palabras** en total. Para 2:00 son ~270; para 3:00, ~420.
- **8 a 10 bloques**. Cada bloque tiene de 1 a 4 oraciones (20–55 palabras) y su propia idea.
  Cada bloque suele ser una diapositiva; un concepto con muchos elementos puede ocupar 2 bloques.
- **Estructura pedagógica** (adáptala al tema):
  1. Saludo y gancho: el avatar se presenta **por su nombre** (de la ficha) y dice el tema.
  2. El problema o la pregunta que motiva el tema.
  3. Contexto o definición.
  4–7. Desarrollo: 2 a 4 ideas con ejemplos concretos (código, comparación, analogía).
  8. Resumen o beneficios.
  9. Reto o tarea práctica, y despedida.
- **Lenguaje**: español claro, oraciones cortas, trato de "tú", para el nivel de la ficha. Escribe como se
  habla, no como se lee. Sin muletillas ni relleno.
- **Exactitud**: solo datos verificables. No inventes cifras, fechas ni funciones. Si un dato es discutible,
  ponlo en la diapositiva como `nota` con la precisión correcta en vez de decirlo en voz.
- **Pronunciación**: las siglas, URLs y palabras en inglés que la voz podría leer mal van en
  `"pronunciacion"` (por ejemplo `"W3C": "doble u tres ce"`). Solo afecta a la voz, no a lo que se ve.
- Si la ficha dice música "no" y subtítulos "no", no los agregues. El motor actual no tiene música ni subtítulos.

---

## Formato de `clases/<nombre-corto>/clase.json`

```json
{
  "slug": "html-semantico-w3c",
  "avatar": "SIPANCITOBOT",
  "rol_avatar": "Asistente docente IA",
  "docente": "",
  "institucion": "Universidad Señor de Sipán",
  "curso": "Diseño Web",
  "banda": "Diseño Web",
  "tema": "Introducción a la estructura semántica en HTML",
  "nivel": "Básico",
  "duracion_objetivo": 150,
  "pronunciacion": { "W3C": "doble u tres ce" },
  "agenda": [
    { "titulo": "El problema de los div", "desde": "02" },
    { "titulo": "¿Qué es el W3C?", "desde": "03" }
  ],
  "bloques": [
    { "id": "01", "texto": "¡Hola! Soy SIPANCITOBOT..." },
    { "id": "02", "texto": "...", "pausa": 0.6 }
  ]
}
```

- `id` debe ser `"01"`, `"02"`, … (dos dígitos, sin repetir).
- `pausa` (opcional) son los segundos de silencio después del bloque. Por defecto es 0,45.
- `agenda` lleva de 3 a 6 puntos con títulos cortos (máx. ~24 caracteres). `desde` es el bloque donde empieza cada punto.
- `banda` es el texto blanco de la franja verde (curso o escuela). `docente`, si existe, aparece abajo como revisor.

## Formato de `clases/<nombre-corto>/diapositivas.js`

Usa como modelo `clases/html-semantico-w3c/diapositivas.js`.

```js
export default function ({ b, p, u, tl, gsap, clase }) {
  const s1 = u.diapo(`<div class="kicker">...</div><h1 class="titulo">Texto <em>clave</em></h1>`);
  u.mostrar(s1, 0);                         // primera diapositiva desde el segundo 0
  u.letras(u.$(s1, '.titulo'), 0.3);        // titulo letra por letra
  u.entrar(u.$(s1, '.sub'), p('01', 'hoy'));// aparece cuando la voz dice "hoy"
  const s2 = u.diapo(`...`);
  u.mostrar(s2, b('02'));                   // cambia de diapositiva al empezar el bloque 02
}
```

**Tiempos.** Nunca escribas segundos fijos; usa estas funciones:
- `b('05')`: segundo en que empieza el bloque 05. `b('05', 0.5)` es la mitad del bloque.
- `p('05', 'palabra')`: segundo aproximado en que la voz dice esa palabra dentro del bloque 05.
  La palabra debe existir en el `texto` del bloque.

**Ayudantes `u`.** Todos reciben (elemento o lista, segundo, opciones):
- `u.diapo(html)` crea una diapositiva y `u.mostrar(s, t)` cambia a ella.
- `u.$(s, sel)` y `u.$$(s, sel)` buscan dentro de la diapositiva.
- `u.entrar(els, t, {x, y, escala, stagger})` hace aparecer elementos con desenfoque. `u.salir(els, t)` los oculta.
- `u.letras(el, t)` anima un título letra por letra. Úsalo solo en títulos.
- `u.teclear(el, t, {cps})` escribe código carácter por carácter.
- `u.codigo(str)` resalta código HTML. Úsalo dentro de `<pre class="codigo">`.
- `u.resaltar(el, t)` hace un subrayado tipo plumón (el elemento lleva `class="marca"`).
- `u.pulso(el, t)` da un golpe de escala.
- `u.activar(el, t, 'on', '1')` cambia un estado CSS (`.caja[data-on="1"]`).
- `u.contar(el, t, hasta)` anima un contador. `u.dibujar(svgPath, t)` dibuja un trazo SVG.
- `u.estilo(css)` agrega CSS propio de la clase.

**Clases CSS disponibles.** El área útil de cada diapositiva es de 1440 x 720 px:
- textos: `kicker`, `titulo` (`mediano`, `chico`), `em` (acento serif morado), `sub`, `texto`, `nota`;
- distribución: `dos`, `tres`, `fila`;
- bloques: `tarjeta` (`oscura`, `morada`, con `.num`, `h3`, `p`), `chip` (`verde`, `oscuro`), `codigo`, `marca`, `caja`;
- variantes de `.diapo`: `centro`, `arriba`.

**Estilo visual.**
- Fondo blanco, títulos negros muy apretados con la palabra clave en `<em>` (serif itálica morada) y acentos verdes USS.
- **Máximo 6–7 palabras por título.** Pon en pantalla las ideas clave, no el texto que lee la voz.
- Cada diapositiva necesita algo visual: código, maqueta, tarjetas, comparación, diagrama SVG o contador.
- Haz que cada elemento aparezca cuando la voz lo nombra (`p()`). No llenes la diapositiva de golpe.
- Todo debe caber en 1440x720. Si no cabe, reduce texto antes de reducir el tamaño de letra (mínimo 19 px).
- No uses imágenes de internet, CDNs ni emojis. Todo va con HTML, CSS y SVG en línea.
- Las animaciones deben ser deterministas: nada de `Math.random`, `setTimeout` ni `Date`.

---

## Diapositivas por plantillas (recomendado para clases nuevas)

En vez de `diapositivas.js`, la clase puede describir sus diapositivas en `clase.json`, en el campo
`"diapositivas": [...]`. Así se editan también desde la web del equipo. Hay una por bloque, y el
bloque que no tiene diapositiva mantiene la anterior. Modelo: `clases/como-funciona-la-web/clase.json`.

```json
{ "bloque": "03", "tipo": "comparacion", "kicker": "Los protagonistas", "titulo": "Quién *pide* y quién *responde*",
  "izq": { "etiqueta": "CLIENTE", "titulo": "Pide", "texto": "...", "cuando": "cliente es" },
  "der": { "etiqueta": "SERVIDOR", "titulo": "Responde", "texto": "...", "cuando": "servidor es" } }
```

Tipos de diapositiva y sus campos:
- `portada`: `items` son los chips.
- `idea`: `titulo` y `sub`.
- `lista` y `pasos`: `items: [{texto, cuando}]`.
- `codigo`: `codigo`.
- `comparacion`: `izq` y `der`.
- `tarjetas`: `tarjetas: [{titulo, texto, cuando}]`.
- `dato`: `dato`, `titulo` y `sub`.
- `cierre`: `items` y `despedida`.

Todos aceptan `kicker`, `titulo` (la palabra clave va entre `*asteriscos*`), `sub` y `nota`. Para el
campo `cuando`, usa una palabra que aparezca tal cual en el texto de ese bloque. Si la clase tiene
`"diapositivas"`, el motor ignora `diapositivas.js`. Usa `diapositivas.js` (código) solo si necesitas
algo que las plantillas no ofrecen (maquetas o diagramas especiales).

## Avatar

- Por defecto se usa el **robot incluido**: mueve la boca con la voz, es gratis y funciona sin internet.
- Para usar un avatar de HeyGen, Hedra u otro servicio:
  1. Genera la voz con `--solo-voz`.
  2. Sube `salida/voz-completa.mp3` al servicio con la imagen del avatar.
  3. Descarga el MP4 y guárdalo como `clases/<nombre-corto>/avatar.mp4`.
  4. Renderiza de nuevo.

  Si cambias el texto, la voz cambia y hay que regenerar el avatar.

## Voz

El orden de prioridad es (modo `auto`):
1. **`clases/<nombre-corto>/camara.mp4`**: el docente grabado con su cámara. Su video va en el
   recuadro y su audio es la voz. Se respeta la línea de tiempo del video y los bloques se
   detectan por las pausas.
2. **`clases/<nombre-corto>/voz/completa.m4a`**: una sola grabación de corrido, con 2 s de silencio
   entre bloques. El motor la corta sola en los N bloques (busca las N-1 pausas más largas)
   y le quita ruido.
3. **`clases/<nombre-corto>/voz/01.m4a`, `02.m4a`…**: grabaciones por bloque. Reemplazan ese bloque
   de la grabación completa (sirven para corregir un bloque).
4. **ElevenLabs**, si `.env` tiene `ELEVENLABS_API_KEY` y `ELEVENLABS_VOICE_ID`. Los audios se guardan en
   caché y solo se regenera el bloque cuyo texto cambió, así no se gastan créditos de más.
5. **Voz del sistema** (macOS `say` / Windows SAPI). Es el último recurso y suena sintética.

Si el docente graba su voz y el motor avisa que «las pausas no son muy claras» o que un bloque
«dura raro», revisa con `--capturas` que cada diapositiva cambie a tiempo.
Si no cambia a tiempo, pide al docente que regrabe ese bloque como `voz/NN.m4a`.
Las carpetas `voz/`, `camara.*` y `avatar.*` tienen la voz y la cara del docente: nunca las subas a GitHub.

## Prohibido

- Modificar `motor/` para una clase concreta (si encuentras un error del motor, explícalo y propón el cambio).
- Leer, mostrar o copiar el contenido de `.env` (contiene claves privadas).
- Subir a GitHub `.env`, `node_modules/`, `salidas/` o `clases/*/salida/`.
- Inventar datos, citas o estadísticas.
