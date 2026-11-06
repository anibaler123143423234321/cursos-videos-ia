# Cursos en video con IA · Universidad Señor de Sipán

Clases en video de 2 a 3 minutos con aspecto de clase por Zoom: láminas, avatar (SIPANCITOBOT) y voz.
Cada video final se guarda solo en la carpeta compartida de Google Drive del equipo.

| Si eres… | Lee esto |
|---|---|
| **Docente** (crea clases desde el navegador, sin instalar nada) | [`guias/por-web/pdf/Guia-docente-crear-un-video.pdf`](guias/por-web/pdf/Guia-docente-crear-un-video.pdf): 6 pasos con capturas |
| **Quien administra la PC del estudio** (enciende la web y da la clave) | [`guias/instalacion/PC-DEL-ESTUDIO.txt`](guias/instalacion/PC-DEL-ESTUDIO.txt): una página |
| **Quien instala en otra PC** | [`guias/instalacion/INSTALAR-EN-OTRA-PC.txt`](guias/instalacion/INSTALAR-EN-OTRA-PC.txt): un doble clic en `INSTALAR-TODO.bat` y copiar 2 archivos |
| **Quien cambia el sistema** | Este README y `clases-windows/LEEME-WINDOWS.txt` |
| **Quien busca una guía** | Abre [`guias/index.html`](guias/index.html) con doble clic: todas las guías en PDF y Word, con buscador |

## Crear un video en 5 pasos (PC del estudio, Windows)

La PC del estudio ya tiene todo instalado y conectado: Node.js, ffmpeg, la voz local gratis (Piper) y Google Drive.
En otra PC, primero haz [Instalar en otra PC](#instalar-en-otra-pc-una-sola-vez-unos-30-minutos).

1. **Abre la web.** Doble clic en `clases-windows\INICIAR-WEB.bat` y deja abierta la ventana negra.
   Entra a http://localhost:8080 con la clave del equipo (`WEB_CLAVE` en `clases-windows\.env`;
   la primera vez la ventana negra la muestra).
2. **Elige tus láminas.** Pulsa **Nueva clase** y responde «¿Cómo son tus láminas?»:
   - **Opción 1 · Mis láminas (imágenes):** arrastra tu PDF o tus PNG/JPG
     (PowerPoint: Archivo › Exportar › PDF; Canva: Compartir › Descargar › PDF). Cada lámina es un bloque del video,
     con efectos que aparecen cuando la voz los nombra: números en las listas, foco, plumón o zoom.
   - **Opción 2 · Láminas HTML animadas:** solo escribes el tema y la IA crea las láminas.
3. **Elige quién escribe la voz y llena la ficha.**
   - **IA gratis:** lee tus láminas (opción 1) o escribe todo a partir del tema (opción 2).
   - **Escribo la voz** (opción 1) o **Pego mi guion** (opción 2): un párrafo por lámina o por bloque.
   - Escribe el **curso** y el **módulo**: son las carpetas donde quedará el video en Drive.
   - Pulsa **Crear clase**. Tarda de 1 a 3 minutos; con láminas, unos 20 a 40 segundos por lámina.
4. **Revisa y elige la voz.** En el editor, corrige el texto de cada bloque.
   - En la pestaña **Voz y avatar**, elige **Voz local gratis**. Con «Automática», si hay ElevenLabs configurado, se gastan sus créditos.
   - Pulsa **Vista previa con voz** (≈ 1 min) para escucharla en el navegador.
5. **Crea el video final.** Pulsa **Crear video final** (arriba a la derecha). Tarda de 4 a 8 minutos.
   Al terminar quedan tres cosas, y se suben solas a Drive:
   - el video `salidas\<clase>.mp4`;
   - la clase en un solo HTML `salidas\<clase>.html`, que se abre con doble clic y se ve con voz, sin internet;
   - el código de la clase (`clase.json` y las láminas).

   En Drive quedan en `CINF GEX / Videos de clases IA / <mes> / <curso> / <tipo> / <módulo> / <clase>`,
   donde `<tipo>` es **Video con HTML** (opción 2) o **Video con láminas** (opción 1).
   El botón **Abrir en Google Drive** lleva a esa carpeta.

> Para que todas las clases nuevas usen la voz gratis: **Ajustes › Voz por defecto › Voz local gratis**.

### Sin la web

- **Menú:** doble clic en `clases-windows\CREAR-VIDEO.bat`, escribe el número de la clase y pulsa Enter (video final).
- **Con comandos** (PowerShell, dentro de `clases-windows`):

  ```powershell
  node motor\crear-video.mjs como-funciona-la-web --voz=local
  ```

  Otros: `--rapido` (borrador), `--capturas` (fotos de cada lámina), `--solo-voz`.
  Para subir a Drive a mano: `node motor\drive.mjs subir <clase>`.
- **Con Claude Code:** llena `FICHA-CLASE.txt`, escribe `claude` en la carpeta y pídele «crea la clase de la ficha».

## ¿Qué voz uso?

| Voz | Costo | Cuándo usarla |
|---|---|---|
| **Voz local gratis (Piper)** | US$ 0, sin límite | Para empezar y para producir mucho. Suena sintética, mejor que la de Windows. |
| **Azure** (voces de Perú) | Gratis hasta ≈ 240 clases al mes | Más natural que Piper. Se configura en Ajustes (clave y región). |
| **ElevenLabs** | Desde US$ 6 al mes | La voz clonada del docente, la más natural. |
| **Tu grabación** | US$ 0 | Lees el guion y subes el audio en «Voz y avatar». Es tu voz real. |

## Instalar en otra PC (una sola vez, unos 30 minutos)

Clonar no alcanza: las claves, el permiso de Drive y la voz local no están en GitHub a propósito.
El paso a paso completo está en [`guias/instalacion/INSTALAR-EN-OTRA-PC.txt`](guias/instalacion/INSTALAR-EN-OTRA-PC.txt). En corto:

1. **En la PC actual:** sube lo último a GitHub y copia en un USB `clases-windows\.env`,
   `google-drive-cliente.json` y, si quieres, `drive-token.json`.
2. **En la PC nueva:** instala Git (`winget install -e --id Git.Git`) y clona el repositorio
   (o descarga el ZIP).
3. Doble clic en `clases-windows\INSTALAR-TODO.bat`. Instala Node.js, ffmpeg, Python, el motor y la voz
   local gratis; si te pide cerrarlo y abrirlo otra vez, hazlo.
4. Copia los archivos del USB en `clases-windows\`. Si no trajiste `drive-token.json`, abre `CONECTAR-DRIVE.bat`.
5. Doble clic en `INICIAR-WEB.bat` y da a los docentes la nueva dirección.

En Mac es igual con los archivos `.command` de `clases-mac/` (`INSTALAR-TODO.command`; detalle en `clases-mac/LEEME-MAC.txt`).

## Si algo falla

- **La web no abre desde otra PC:** en la PC del estudio, permite Node.js en el Firewall (Redes privadas).
- **«falta la voz es_MX-claude-high»:** abre `INSTALAR-VOZ-LOCAL.bat`.
- **Drive dice «el permiso venció»:** abre `CONECTAR-DRIVE.bat` otra vez.
- **Un video falla:** en el editor abre «Ver detalle del error» y pégaselo a Claude Code.
- **Más ayuda:** las secciones «PROBLEMAS FRECUENTES» de `clases-windows/LEEME-WINDOWS.txt` y `clases-mac/LEEME-MAC.txt`.

## Qué hay en este repositorio

| Carpeta | Para qué | Dónde se usa |
|---|---|---|
| `clases-windows/` | Kit de clases con lanzadores `.bat` y la web del equipo | PC con Windows 10/11 |
| `clases-mac/` | El mismo kit, con lanzadores `.command` | Mac (chip M) |
| `clases-*/web/` | **Web del equipo** (Estudio de clases): crear y editar clases desde el navegador. Ver `LEEME-WEB.txt` | La PC del estudio sirve la web en la red |
| `guias/` | Documentación: portal, guías en PDF y Word, presentación e instalación. Mapa en [`guias/LEEME.md`](guias/LEEME.md) | Cualquier PC |
| `propuesta/` | Propuesta de costos (PDF). La fuente editable está en `propuesta/fuente/`; se regenera con `node propuesta/fuente/generar-pdf.mjs` | — |
| `demo/` | `clase-demo-html-semantico.mp4`, la clase de ejemplo ya renderizada | — |
| raíz (`PROMPT-ANUNCIOS-30s.txt`, `CREAR-VIDEO.bat`, `LEEME-GUIA.txt`) | Anuncios de 30 s con Claude Design (kit anterior, sin cambios) | Windows |

Los videos que crees quedan en `salidas/` de cada kit y no se suben a GitHub (sí a Drive).
Las claves (`.env`), el permiso de Drive (`drive-token.json`, `google-drive-cliente.json`) y la voz local (`voces/`)
tampoco se suben.

## Cómo funciona

```
web o FICHA ──► láminas: opción 1 = las del docente (PDF / imágenes; la IA las lee)
                         opción 2 = HTML animadas (las crea la IA)
            ──► guion: el docente, IA gratis (Groq / Gemini / Ollama) o Claude
                        │  clases/<nombre>/clase.json (+ laminas/ o diapositivas.js)
                        ▼
motor/crear-video.mjs ──► voz (grabación propia / ElevenLabs / Azure / Piper local gratis / sistema)
                        ──► tiempos de cada bloque + movimiento de la boca
                        ──► cuadros 1920x1080 con Playwright (HTML + GSAP)
                        ──► ffmpeg ──► salidas/<nombre>.mp4
                        ──► motor/exportar-html.mjs ──► salidas/<nombre>.html (la clase en un solo archivo)
                        ──► motor/drive.mjs ──► Google Drive (carpeta compartida):
                                                Videos de clases IA / AAAA-MM / Curso /
                                                (Video con HTML | Video con láminas) / Módulo / clase
```

`motor/` y `web/` son idénticos en las dos carpetas; si cambias uno, cópialo a la otra.
