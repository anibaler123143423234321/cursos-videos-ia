// Portal de la documentación: guias/index.html. Se abre con doble clic, sin internet y sin instalar nada.
// Solo enlaza los archivos que existen, con rutas relativas a la carpeta guias/.
import fs from 'node:fs';
import path from 'node:path';

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ESTILOS = `
:root {
  --fondo: #f5f6f8; --panel: #fff; --tinta: #121214; --tinta-2: #3b3e46; --gris: #5d616c; --linea: #e3e4e8;
  --lima: #a6c61a; --lima-suave: #f3f8dc; --verde: #4f5f00; --sombra: 0 1px 2px rgba(18, 18, 20, .05);
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root {
    --fondo: #111214; --panel: #1b1d21; --tinta: #f2f3f5; --tinta-2: #d5d7dc; --gris: #a2a7b2; --linea: #2f3238;
    --lima-suave: #2a3110; --verde: #cfe36a; --sombra: none;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--fondo); color: var(--tinta); font: 15px/1.5 Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
a { color: inherit; }
:focus-visible { outline: 3px solid var(--lima); outline-offset: 2px; border-radius: 6px; }
.saltar { position: absolute; left: 16px; top: -48px; padding: 8px 12px; border-radius: 8px; background: var(--tinta); color: var(--fondo); }
.saltar:focus { top: 12px; }
body > header { background: #121214; color: #fff; }
.interior { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
.cabeza { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px; padding-top: 28px; padding-bottom: 28px; }
.logo { display: block; height: 44px; padding: 6px 10px; border-radius: 10px; background: #fff; }
body > header h1 { margin: 14px 0 4px; font-size: 28px; line-height: 1.2; letter-spacing: -.02em; }
body > header p { margin: 0; color: #c4c7ce; }
.version { align-self: flex-start; font-size: 13px; color: #c4c7ce; }
main.interior { padding-top: 24px; padding-bottom: 56px; }
.atajos { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; }
.atajo { display: block; padding: 16px; border: 1px solid var(--linea); border-radius: 12px; background: var(--panel); box-shadow: var(--sombra); text-decoration: none; }
.atajo:hover { border-color: var(--lima); }
.atajo b { display: block; font-size: 15px; }
.atajo span { color: var(--gris); font-size: 13.5px; }
.controles { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 28px 0 8px; }
.controles input { flex: 1 1 260px; min-width: 0; height: 42px; padding: 0 14px; border: 1px solid var(--linea); border-radius: 10px; background: var(--panel); color: var(--tinta); font: inherit; }
.filtros { display: flex; gap: 4px; padding: 3px; border: 1px solid var(--linea); border-radius: 10px; background: var(--panel); }
.filtros button { padding: 7px 12px; border: 0; border-radius: 8px; background: none; color: var(--gris); font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; }
.filtros button[aria-pressed="true"] { background: var(--tinta); color: var(--fondo); }
h2 { margin: 28px 0 10px; font-size: 18px; letter-spacing: -.01em; }
.rejilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
.guia { display: flex; flex-direction: column; gap: 8px; padding: 16px; border: 1px solid var(--linea); border-radius: 12px; background: var(--panel); box-shadow: var(--sombra); }
.guia header { display: flex; align-items: center; gap: 8px; }
.codigo { padding: 2px 8px; border-radius: 6px; background: var(--tinta); color: var(--fondo); font-size: 12.5px; font-weight: 700; }
.via { margin-left: auto; padding: 2px 8px; border-radius: 999px; background: var(--lima-suave); color: var(--verde); font-size: 12px; font-weight: 600; }
.guia h3 { margin: 0; font-size: 15.5px; line-height: 1.3; }
.guia p { flex: 1; margin: 0; color: var(--gris); font-size: 13.5px; }
.enlaces { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.enlaces a { padding: 5px 10px; border: 1px solid var(--linea); border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; }
.enlaces a:hover { border-color: var(--lima); }
.nada { padding: 24px; border: 1px dashed var(--linea); border-radius: 12px; color: var(--gris); text-align: center; }
.medidas { width: 100%; border-collapse: collapse; background: var(--panel); border: 1px solid var(--linea); border-radius: 12px; overflow: hidden; font-size: 14px; }
.medidas th, .medidas td { padding: 10px 12px; border-bottom: 1px solid var(--linea); text-align: left; white-space: nowrap; }
.tabla { overflow-x: auto; }
.oculto { display: none !important; }
@media (max-width: 640px) { .interior { padding: 0 16px; } .rejilla { grid-template-columns: minmax(0, 1fr); } body > header h1 { font-size: 24px; } }
`;

const LOGICA = `
const buscar = document.getElementById('buscar');
const filtros = [...document.querySelectorAll('[data-filtro]')];
const nada = document.getElementById('nada');
let via = 'todas';
function aplicar() {
  const q = buscar.value.trim().toLowerCase();
  let visibles = 0;
  document.querySelectorAll('[data-guia]').forEach(g => {
    const ok = (via === 'todas' || g.dataset.via === via) && (!q || g.dataset.texto.includes(q));
    g.classList.toggle('oculto', !ok);
    visibles += ok ? 1 : 0;
  });
  document.querySelectorAll('[data-grupo]').forEach(s => s.classList.toggle('oculto', !s.querySelector('[data-guia]:not(.oculto)')));
  nada.classList.toggle('oculto', visibles > 0);
}
buscar.addEventListener('input', aplicar);
filtros.forEach(b => b.addEventListener('click', () => {
  via = b.dataset.filtro;
  filtros.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  aplicar();
}));
`;

export function crearPortal({ salida, guias, flujos, grupos, version, viaDe, logo }) {
  const existe = r => fs.existsSync(path.join(guias, r));
  const enlace = (r, texto) => (existe(r) ? `<a href="${esc(r)}">${esc(texto)}</a>` : '');
  const tarjeta = f => {
    const via = viaDe(f);
    const texto = `${f.codigo} ${f.nombre} ${f.proposito}`.toLowerCase();
    return `<article class="guia" data-guia data-via="${via}" data-texto="${esc(texto)}">
      <header><span class="codigo">${esc(f.codigo)}</span><span class="via">${via === 'por-web' ? 'Por web' : 'Por terminal'}</span></header>
      <h3>${esc(f.nombre)}</h3>
      <p>${esc(f.proposito)}</p>
      <div class="enlaces">
        ${enlace(`${via}/pdf/${f.archivo}.pdf`, 'PDF')}
        ${enlace(`${via}/word/${f.archivo}.docx`, 'Word')}
        ${enlace(`fuente/manual/html/${f.archivo}.html`, 'Ver aquí')}
      </div>
    </article>`;
  };
  const secciones = grupos.map(g => `<section data-grupo>
      <h2>${esc(g.titulo)}</h2>
      <div class="rejilla">${g.codigos.map(c => tarjeta(flujos.find(f => f.codigo === c))).join('\n')}</div>
    </section>`).join('\n');
  const atajo = (r, titulo, detalle) => (existe(r) ? `<a class="atajo" href="${esc(r)}"><b>${esc(titulo)}</b><span>${esc(detalle)}</span></a>` : '');
  const logoDatos = `data:image/png;base64,${fs.readFileSync(logo).toString('base64')}`;

  fs.writeFileSync(salida, `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Guías en PDF y Word del Estudio de clases USS">
<title>Documentación · Estudio de clases USS</title>
<style>${ESTILOS}</style>
</head>
<body>
<a class="saltar" href="#guias">Ir a las guías</a>
<header>
  <div class="interior cabeza">
    <div>
      <img class="logo" src="${logoDatos}" alt="USS Centro de Informática">
      <h1>Documentación del Estudio de clases</h1>
      <p>Elige una guía y ábrela en PDF o edítala en Word.</p>
    </div>
    <span class="version">${esc(version)}</span>
  </div>
</header>
<main class="interior">
  <section aria-label="Accesos rápidos" class="atajos">
    ${atajo('por-web/pdf/Guia-docente-crear-un-video.pdf', 'Soy docente', 'Crea tu clase en 6 pasos.')}
    ${atajo('por-web/pdf/F16-las-4-formas-de-crear-el-video.pdf', 'Las 4 formas', 'Compara las formas y usa las medidas únicas.')}
    ${atajo('presentaciones/Las-4-formas-de-crear-el-video.pptx', 'Presentación', 'Diapositivas para capacitar al equipo.')}
    ${atajo('instalacion/INSTALAR-EN-OTRA-PC.txt', 'Instalar en otra PC', 'Pasos para instalar una sola vez.')}
    ${atajo('instalacion/PC-DEL-ESTUDIO.txt', 'PC del estudio', 'Cómo encender la web cada día.')}
  </section>

  <div class="controles" id="guias">
    <label class="oculto" for="buscar">Buscar guía</label>
    <input id="buscar" type="search" placeholder="Buscar: avatar, voz, Drive…" autocomplete="off" aria-label="Buscar guía">
    <div class="filtros" role="group" aria-label="Dónde se trabaja">
      <button type="button" data-filtro="todas" aria-pressed="true">Todas</button>
      <button type="button" data-filtro="por-web" aria-pressed="false">Por web</button>
      <button type="button" data-filtro="por-terminal" aria-pressed="false">Por terminal</button>
    </div>
  </div>
  ${secciones}
  <p class="nada oculto" id="nada">Ninguna guía coincide con tu búsqueda.</p>

  <section>
    <h2>Medidas únicas</h2>
    <div class="tabla"><table class="medidas">
      <tr><th>Elemento</th><th>Ancho</th><th>Altura</th><th>Ángulo</th><th>X</th><th>Y</th></tr>
      <tr><td>Avatar</td><td>600</td><td>337.5</td><td>0°</td><td>1320</td><td>371</td></tr>
      <tr><td>Logo</td><td>300</td><td>76.2</td><td>0°</td><td>1600</td><td>20</td></tr>
      <tr><td>Lámina de fondo</td><td>1920</td><td>1080</td><td>0°</td><td>0</td><td>0</td></tr>
    </table></div>
  </section>
</main>
<script>${LOGICA}</script>
</body>
</html>
`);
}
