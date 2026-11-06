# Skills de la IA que crea las clases

Estas guías son lo que la IA (la gratis y Claude) lee antes de escribir cada clase. Se leen en cada pedido:
si el equipo mejora una guía, la siguiente clase ya la usa, sin reiniciar la web.

| Archivo | Para qué sirve |
| --- | --- |
| `rol.md` | Quién es la IA y para quién escribe (va al inicio de todos los pedidos). |
| `guion.md` | Cómo escribir lo que dice la voz: estructura, extensión, tono, exactitud. |
| `agenda.md` | La agenda de la columna derecha y la pronunciación de siglas. |
| `diapositivas.md` | El catálogo de diseños de diapositiva, cuándo usar cada uno, reglas de redacción y un ejemplo. |
| `laminas.md` | Cómo explicar las láminas propias del docente y qué efectos marcar en ellas. |
| `revision.md` | Segundo pedido: corrige el guion ya escrito (erratas, trato de «tú», menús o direcciones inventados). |
| `ortografia.md` | Último pedido: la IA solo lista lo mal escrito y el programa lo cambia en la voz y en las diapositivas. |
| `vids.md` | Contenido de las láminas para Google Vids. El programa arma el prompt: `node web/vids-prompts.mjs <clase> [bloques]`. |
| `pantallas/*.md` | Una guía por software: Gmail, Drive, Documentos, Hojas, Presentaciones, Meet, Calendario, Gemini, Word, Excel y PowerPoint. Otra aplicación necesita su archivo y su fila en `APPS_VIDS` (`web/ia.mjs`). |

La clase sigue la estructura de sesión USS (`guion.md`): portada, logro, motivación, temario, un bloque de desarrollo por
tema, práctica con el texto estándar, conclusiones y cierre. El programa fija el diseño de cada parte, arma la agenda y la
despedida con el logo, y si la IA se salta una parte (suele ser el temario) se la vuelve a pedir.

## Ejemplos (`ejemplos/*.json`)

Son clases modelo ya revisadas, de los tres centros (Informática, Idiomas, Emprendimiento). En cada pedido la web
elige la más parecida al tema de la ficha (por curso, tema y `palabras`) y se la muestra a la IA: el guion cuando
escribe la voz y las diapositivas cuando las diseña. Así los modelos gratis copian el nivel, no el contenido.

Para agregar uno: copia uno de los archivos, cambia `centro`, `curso`, `tema` y `palabras` (sin tildes, en minúsculas),
y pega los `bloques` (con su `parte`) y las `diapositivas` de una clase que ya revisaste. Cuida que cada `cuando` sea una
palabra del texto de su bloque. El que tiene `"predeterminado": true` se usa cuando ningún ejemplo se parece al tema.
Más ejemplos buenos = mejores clases; uno con errores enseña errores.

Reglas para editarlas:

- Escribe en español, con frases cortas y ejemplos de **bien** y **mal**: los modelos gratis aprenden más de un ejemplo que de una regla.
- Cuida el largo: los planes gratis aceptan pocos tokens por minuto. Una guía de más de ~1 500 palabras hace la clase más lenta.
- Lo que va entre `<!--` y `-->` es una nota para el equipo: la IA no lo ve.
- `{{ICONOS}}` se reemplaza solo con la lista de iconos del motor (`motor/diapos-auto.js`).
- El formato JSON de la respuesta no va aquí: está en `web/ia.mjs`, porque el programa depende de él.
- Si agregas un tipo de diapositiva, primero tiene que existir en `motor/diapos-auto.js` (si no, el video no sabe dibujarlo).
