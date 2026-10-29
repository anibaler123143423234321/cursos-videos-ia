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
FICHA-CLASE.txt ──► Claude Code (lee CLAUDE.md = prompt maestro)
                        │  escribe clases/<nombre>/clase.json + diapositivas.js
                        ▼
motor/crear-video.mjs ──► voz (grabación propia / ElevenLabs / sistema)
                        ──► tiempos de cada bloque + movimiento de la boca
                        ──► cuadros 1920x1080 con Playwright (HTML + GSAP)
                        ──► ffmpeg ──► salidas/<nombre>.mp4
```

`motor/` es idéntico en las dos carpetas; si lo cambias, cópialo a la otra.
