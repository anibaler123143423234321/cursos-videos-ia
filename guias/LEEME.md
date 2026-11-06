# Documentación del Estudio de clases USS

Abre [`index.html`](index.html) con doble clic. Es el portal de todas las guías: tiene buscador y funciona sin internet.

## Carpetas

```
guias/
├── index.html            Portal de la documentación (se genera solo)
├── LEEME.md              Este mapa
├── por-web/              Se hace solo con el navegador
│   ├── pdf/              Para leer e imprimir
│   └── word/             Para editar
├── por-terminal/         Necesita la terminal o editar archivos
│   ├── pdf/
│   └── word/
├── presentaciones/       PowerPoint para capacitar al equipo
├── instalacion/          Instalar en otra PC y hoja de la PC del estudio
├── difusion/linkedin/    Publicación, carrusel, imagen y prompt para ChatGPT
└── fuente/               Lo que se edita para regenerar todo
    ├── difusion/         Piezas de LinkedIn: textos y cuadros reales
    ├── manual/
    │   ├── datos.mjs         Contenido de cada guía
    │   ├── plantilla.mjs     Diseño del PDF y del HTML
    │   ├── word.mjs          Armado del Word
    │   ├── presentacion.mjs  Armado del PowerPoint
    │   ├── portal.mjs        Armado de index.html
    │   ├── generar.mjs       Genera todo
    │   ├── capturas/         Capturas reales de la web y de Google Vids
    │   └── html/             Versión HTML de cada guía (se genera sola)
    └── guia-docente/         Guía de 6 pasos: su HTML y sus capturas
```

No edites los archivos de `por-web/`, `por-terminal/` ni `presentaciones/`: se reemplazan al regenerar. El contenido se cambia en `fuente/`.

## Nombres de archivo

Cada guía usa su código y un nombre corto, igual en todos los formatos: `F15-video-con-hyperframes.pdf` y `F15-video-con-hyperframes.docx`.

## Guías

### Por web

| Código | Guía |
| --- | --- |
| — | Guía del docente: crear un video en 6 pasos |
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
| F13 | Flujo de láminas con Gemini y Nano Banana |
| F15 | Crear un video animado con Hyperframes: láminas HTML, imágenes de Gemini y avatar que habla |
| F16 | Las 4 formas de crear el video, con las medidas únicas de avatar y logo |

### Por terminal

| Código | Guía | Qué parte sale de la web |
| --- | --- | --- |
| F11 | Mejorar la IA: skills y ejemplos | Editar archivos de `web/skills/` |
| F12 | Crear una clase con Claude Code | Toda la guía |
| F14 | Crear un video con Google Vids | Dos comandos para preparar los prompts; lo demás ocurre en Google Vids |

## Cómo regenerar todo

Una sola vez, dentro de `guias/fuente/manual`:

```
npm install
```

Después, desde la carpeta del repositorio:

```
node guias/fuente/manual/generar.mjs
```

Necesita el kit instalado, porque usa el Playwright de `clases-mac` o de `clases-windows`. Si un texto del diagrama no entra en su caja, el generador lo avisa con `[!]`.

Si editas un Word a mano, copia esos cambios a `fuente/manual/datos.mjs`: al regenerar, el archivo se reemplaza.

Las imágenes de LinkedIn se generan aparte:

```
node guias/fuente/difusion/generar.mjs
```
