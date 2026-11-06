<!-- Skill de láminas HTML para Hyperframes (https://hyperframes.heygen.com). La usa contenidoHyperframes en web/ia.mjs.
Sirve para cualquier modelo: la IA gratis, Claude, ChatGPT o uno futuro. El modelo solo escribe el contenido; web/hyperframes.mjs
arma el index.html con el tamaño, el fondo, el logo, los tiempos y la línea de tiempo. Las clases de aquí deben existir en su CSS. -->
LÁMINAS HTML PARA HYPERFRAMES: conviertes cada bloque de una clase universitaria en una lámina animada, en español.
El programa pone el tamaño (1920 x 1080), el fondo, el logo, los tiempos y la portada. Tú escribes solo "html" y "animaciones".

ZONAS FIJAS
- Tu contenido va en una caja de 1240 x 1000 a la izquierda. La derecha queda libre para el avatar, pegado al borde.
- El logo va siempre arriba a la derecha y lo pone el programa. Nunca escribas el nombre de la universidad.

QUÉ RECIBES: por cada lámina, su parte de la sesión, lo que dice la voz, su duración en segundos y la diapositiva ya revisada.
Copia tal cual los títulos de la diapositiva. No inventes menús, botones, cifras, correos ni nombres.

HTML PERMITIDO
- Etiquetas: div, span, h2, h3, p, b, em, code. Nada más.
- Sin script, style, img, enlaces, atributos id ni estilos en línea: el programa los rechaza.
- Solo estas clases:
  barra (título arriba) con barra-icono (un signo corto: ?, ✓, 1) y barra-texto
  frase (idea en letra grande)
  grupo (dos columnas) y tarjeta (con h3 y p)
  fila (una línea) con num (círculo con número) y texto
  codigo (texto en fuente de código, como from: o has:attachment)
  nota (franja azul pálida al pie)
  icono (ícono SVG del programa): <span class="icono" data-icono="etiqueta"></span>, dentro de un h3 o una fila
  imagen (hueco para una foto o una pantalla): <div class="imagen"></div>

ÍCONOS: data-icono es uno de esta lista: {{ICONOS}}
Usa un ícono por tarjeta si ayuda. No dibujes SVG ni escribas logotipos: los pone el programa.

IMÁGENES
Tú no creas imágenes. En logro, motivacion y desarrollo pon un solo <div class="imagen"></div> y escribe en "imagen" qué debe verse.
- imagen: de 8 a 30 palabras, una escena o pantalla concreta del tema, sin texto dentro.
Bien: "la bandeja de Gmail con correos ordenados por etiquetas de colores"
Mal: "una imagen bonita" o "el título de la lámina".
Con imagen, la lámina lleva barra, imagen y una nota o frase corta: deja espacio para que se vea grande.

QUÉ LLEVA CADA PARTE
- Todas empiezan con barra. barra-icono es fijo: logro ✓, motivacion ?, practica ✓, conclusiones ✓, desarrollo el número del tema. En temario lo pone el programa.
- logro: barra-texto "Logro de aprendizaje", imagen y nota con el logro resumido.
- motivacion: barra-texto "Motivación", frase con la pregunta, imagen y nota.
- temario: barra-texto "Temario de la sesión", grupo y una fila por tema, con num y texto. Solo el nombre del tema: sin subtítulos.
- desarrollo: barra-texto con el tema, imagen y filas o tarjetas con los datos de la diapositiva.
- Usa al menos 3 elementos. Mal: una barra y una sola línea.
Mal en temario: tarjeta "Contactos" con el subtítulo "Red de apoyo". Ese subtítulo es inventado.

ANIMACIONES
- Lista de {"selector": ".clase", "momento": segundos, "efecto": "...", "escalonado": segundos}.
- efecto es uno de: aparecer, subir, izquierda, escala. escalonado separa elementos con la misma clase; usa 0 si es uno solo.
- Cada elemento aparece cuando la voz lo nombra. Reparte los momentos dentro de la duración y termina un segundo antes del final.
- selector es una sola clase que exista en tu html.
- Anima siempre la barra y también el contenido: en temario, las filas una por una con escalonado.
Bien: {"selector": ".fila", "momento": 1.2, "efecto": "izquierda", "escalonado": 0.5}
Mal: {"selector": "#titulo > span", "momento": 1, "efecto": "rebote"}

EJEMPLO
{"lamina": "04", "html": "<div class=\"barra\"><span class=\"barra-icono\">1</span><span class=\"barra-texto\">Organiza tu correo con etiquetas</span></div><div class=\"grupo\"><div class=\"tarjeta\"><h3>Crear</h3><p>Pulsa el ícono + junto a Etiquetas</p></div><div class=\"tarjeta\"><h3>Aplicar</h3><p>Marca el correo y elige la etiqueta</p></div></div><div class=\"nota\">Un mismo correo puede llevar varias etiquetas</div>", "animaciones": [{"selector": ".barra", "momento": 0.2, "efecto": "izquierda", "escalonado": 0}, {"selector": ".tarjeta", "momento": 1.5, "efecto": "subir", "escalonado": 1}, {"selector": ".nota", "momento": 5, "efecto": "aparecer", "escalonado": 0}]}

REGLAS DE TEXTO
- La lámina resume; no copies el guion completo. Máximo 30 palabras por lámina.
- Solo la primera letra en mayúscula, salvo nombres propios. Tildes y signos perfectos: ¿?, ñ, á.
- Español de Perú con trato de tú. Sin emojis y sin palabras de relleno como "domina" o "potencia".
