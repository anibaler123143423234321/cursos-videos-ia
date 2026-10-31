# Cursos en video con IA · Universidad Señor de Sipán

Este repositorio tiene tres kits:

| Carpeta | Para qué | Dónde se usa |
|---|---|---|
| `clases-mac/` | **Clases de 2–3 min** tipo Zoom: diapositivas con motion graphics, avatar (SIPANCITOBOT) y voz clonada (ElevenLabs) | Mac (chip M) |
| `clases-windows/` | El mismo kit de clases, con lanzador `.bat` | PC con Windows 10/11 |
| `clases-*/web/` | **Web del equipo** (Estudio de clases): crear y editar clases y videos desde el navegador. Ver `LEEME-WEB.txt` | La PC del estudio sirve la web en la red |
| raíz (`PROMPT-ANUNCIOS-30s.txt`, `CREAR-VIDEO.bat`, `LEEME-GUIA.txt`) | Anuncios de 30 s con Claude Design (kit anterior, sin cambios) | Windows |

## Ver el demo

`demo/clase-demo-html-semantico.mp4` es la clase de ejemplo generada en el servidor de pruebas
con una voz sintética de prueba (SVOX Pico). En tu Mac o PC se usará tu voz grabada, tu voz
clonada en ElevenLabs o la voz del sistema. Los videos que generes tú quedan en `salidas/` de
cada kit y no se suben a GitHub.

## Empezar

- En Mac, sigue `clases-mac/LEEME-MAC.txt`.
- En Windows, sigue `clases-windows/LEEME-WINDOWS.txt`.

La primera prueba es gratis: la clase de ejemplo `html-semantico-w3c` se renderiza con la voz del sistema y el robot incluido, sin cuentas.

## Cómo funciona

```
FICHA o web ──► láminas: opción 1 = las del docente (PDF / imágenes; la IA las lee)
                         opción 2 = HTML animadas (las crea la IA)
            ──► guion: el docente, IA gratis (Groq / Gemini / Ollama) o Claude
                        │  clases/<nombre>/clase.json (+ laminas/ o diapositivas.js)
                        ▼
motor/crear-video.mjs ──► voz (grabación propia / ElevenLabs / Azure / Piper local gratis / sistema)
                        ──► tiempos de cada bloque + movimiento de la boca
                        ──► cuadros 1920x1080 con Playwright (HTML + GSAP)
                        ──► ffmpeg ──► salidas/<nombre>.mp4
                        ──► motor/drive.mjs ──► Google Drive (carpeta compartida):
                                                Videos de clases IA / AAAA-MM / Curso / Módulo / clase
```

La propuesta de costos está en `propuesta/` (fuente editable en `propuesta/fuente/`; se regenera con
`node propuesta/fuente/generar-pdf.mjs`).

`motor/` es idéntico en las dos carpetas; si lo cambias, cópialo a la otra.
