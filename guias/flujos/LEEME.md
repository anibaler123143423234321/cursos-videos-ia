# Manual de flujos · Estudio de clases USS

Un PDF por flujo, con su ficha (código, responsable, frecuencia, tiempo, disparador, requisitos, entradas, salidas y
sistemas), un diagrama por carriles (un carril por actor), la tabla de pasos, las reglas del negocio, los errores
frecuentes con su solución, los archivos que intervienen y los flujos relacionados.

| Código | Flujo |
| --- | --- |
| F00 | Mapa general del Estudio de clases (empieza aquí) |
| F01 | Crear una clase con IA (láminas HTML animadas) |
| F02 | Crear una clase con láminas propias |
| F03 | Crear una clase con guion propio |
| F04 | Revisar y editar la clase |
| F05 | Diseño visual de la clase |
| F06 | Voz de la clase |
| F07 | Revisar antes del video final |
| F08 | Crear el video final |
| F09 | Subir a Google Drive |
| F10 | Configurar servicios (Ajustes) |
| F11 | Mejorar la IA: skills y ejemplos |
| F12 | Crear una clase con Claude Code (terminal) |
| F13 | Flujo de láminas con Gemini y Nano Banana |
| F14 | Crear un video con Google Vids (con una captura por paso y el límite mensual por cuenta) |

Para cambiar un flujo, edita sus datos en `fuente/flujos.mjs` (lista `FLUJOS`) y vuelve a generar todo, desde la
carpeta del repositorio:

```
node guias/flujos/fuente/flujos.mjs
```

Necesita el kit instalado (usa el Playwright de `clases-mac` o de `clases-windows`). Deja los PDF aquí y el HTML de cada
flujo en `fuente/html/`. Si un texto del diagrama no entra en su caja, el generador lo avisa con `[!]`.

F14 también se entrega en Word editable (`F14-video-con-google-vids.docx`), con el mismo contenido del PDF. Para generarlo,
ejecuta `npm install` una vez dentro de `fuente/`. Si editas el Word a mano, copia esos cambios a `fuente/flujos.mjs`:
al regenerar, el archivo se reemplaza.
