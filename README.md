# Cursos en video con IA · Universidad Señor de Sipán

Este repositorio tiene tres kits:

| Carpeta | Para qué | Dónde se usa |
|---|---|---|
| `clases-mac/` | **Clases de 2–3 min** tipo Zoom: diapositivas con motion graphics, avatar (SIPANCITOBOT) y voz clonada (ElevenLabs) | Mac (chip M) |
| `clases-windows/` | El mismo kit de clases, con lanzador `.bat` | PC con Windows 10/11 |
| raíz (`PROMPT-ANUNCIOS-30s.txt`, `CREAR-VIDEO.bat`, `LEEME-GUIA.txt`) | Anuncios de 30 s con Claude Design (kit anterior, sin cambios) | Windows |

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
