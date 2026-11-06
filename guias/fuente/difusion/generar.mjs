// Piezas de LinkedIn: carrusel de 7 imágenes, su PDF y una imagen única.
// Uso, desde la carpeta del repositorio:  node guias/fuente/difusion/generar.mjs
// Los textos van en este archivo. Las fotos son cuadros reales de los videos de prueba.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '..', '..', '..');
const SALIDA = path.join(REPO, 'guias', 'difusion', 'linkedin');
const datos = (f, tipo) => `data:${tipo};base64,${fs.readFileSync(f).toString('base64')}`;
const LOGO = datos(path.join(REPO, 'clases-mac', 'marca', 'logo-transparente.png'), 'image/png');
const foto = n => datos(path.join(AQUI, n), 'image/jpeg');
const kit = ['clases-mac', 'clases-windows'].find(k => fs.existsSync(path.join(REPO, k, 'node_modules', '@fontsource')));
const fuente = peso => {
  const f = path.join(REPO, kit, 'node_modules', '@fontsource', 'inter', 'files', `inter-latin-${peso}-normal.woff2`);
  return `@font-face { font-family: Inter; font-weight: ${peso}; src: url(${datos(f, 'font/woff2')}) format('woff2'); }`;
};

const FORMAS = [
  { n: 1, titulo: 'Gemini + Hyperframes + avatar de Google Vids', texto: 'Láminas animadas en HTML, imágenes de Gemini y un avatar que habla.', imagen: 'Gemini', voz: 'Avatar de Vids', donde: 'Web del estudio', foto: 'forma-1.jpg' },
  { n: 2, titulo: 'Lámina + avatar de Google Vids', texto: 'Tu lámina ya hecha como fondo, con un avatar encima.', imagen: 'Tu lámina', voz: 'Avatar de Vids', donde: 'Google Vids', foto: 'forma-2.jpg' },
  { n: 3, titulo: 'HTML puro + voz de ElevenLabs', texto: 'Láminas animadas con voz, sin una persona en pantalla.', imagen: 'HTML', voz: 'ElevenLabs', donde: 'Web del estudio', foto: 'forma-3.jpg' },
  { n: 4, titulo: 'Solo Google Vids', texto: 'Imagen, avatar y montaje en la misma herramienta.', imagen: 'Google Vids', voz: 'Avatar de Vids', donde: 'Google Vids', foto: 'forma-4.jpg' },
];
const APRENDIDO = [
  'La IA escribe. Un programa valida el formato y el diseño.',
  'Una sola medida de avatar y logo mantiene todas las láminas iguales.',
  'Las pantallas dibujadas por IA pueden inventar textos: revísalas siempre.',
  'Cada avatar gasta cupo: revisa el guion antes de generarlo.',
];

const CSS = `
${[400, 600, 700, 800].map(fuente).join('\n')}
@page { size: 1080px 1350px; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; background: #888; font-family: Inter, Arial, sans-serif; color: #121214; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.pieza { position: relative; width: 1080px; height: 1350px; padding: 72px; overflow: hidden; display: flex; flex-direction: column; background: #fff; break-after: page; }
.oscura { background: #121214; color: #fff; }
.logo { display: block; width: 250px; padding: 14px 18px; border-radius: 14px; background: #fff; }
.pie { position: absolute; left: 72px; right: 72px; bottom: 44px; display: flex; justify-content: space-between; font-size: 24px; color: #5d616c; }
.oscura .pie { color: #c4c7ce; }
h1 { margin: 56px 0 24px; font-size: 96px; line-height: 1.05; letter-spacing: -.03em; font-weight: 800; }
h2 { margin: 28px 0 20px; font-size: 68px; line-height: 1.08; letter-spacing: -.025em; font-weight: 800; }
p { margin: 0; font-size: 38px; line-height: 1.3; }
.gris { color: #c4c7ce; }
.tenue { color: #4a4d55; }
.numero { display: grid; place-items: center; flex: 0 0 auto; width: 92px; height: 92px; border-radius: 50%; background: #a6c61a; color: #121214; font-size: 48px; font-weight: 800; }
.cuadro { margin-top: auto; margin-bottom: 72px; border-radius: 22px; overflow: hidden; box-shadow: 0 0 0 2px #e3e4e8; }
.cuadro img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
.datos { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
.datos span { padding: 10px 18px; border-radius: 999px; background: #f3f8dc; color: #3f4c00; font-size: 26px; font-weight: 600; }
.lista { flex: 1; display: grid; align-content: space-evenly; margin: 24px 0 72px; }
.lista div { display: flex; align-items: center; gap: 32px; }
.lista p { font-size: 46px; font-weight: 600; line-height: 1.22; }
.centro { margin-top: auto; margin-bottom: auto; }
.unica { width: 1200px; height: 627px; padding: 48px; display: grid; grid-template-columns: 500px 1fr; gap: 40px; align-items: center; background: #121214; color: #fff; }
.unica .logo { width: 190px; padding: 10px 14px; border-radius: 10px; }
.unica h1 { margin: 28px 0 0; font-size: 54px; }
.tarjetas { display: grid; gap: 14px; }
.tarjetas div { display: flex; align-items: center; gap: 18px; padding: 16px 18px; border-radius: 14px; background: #fff; color: #121214; font-size: 25px; font-weight: 700; line-height: 1.2; }
.tarjetas .numero { width: 50px; height: 50px; font-size: 26px; }
`;

const pie = n => `<div class="pie"><span>Centro de Informática · USS</span><span>${n} / 7</span></div>`;
const piezas = [
  `<section class="pieza oscura">
    <img class="logo" src="${LOGO}" alt="USS Centro de Informática">
    <h1>4 formas de crear una clase en video con IA</h1>
    <p class="gris">Lo que documentamos en el Estudio de clases.</p>
    <div class="cuadro" style="box-shadow:none"><img src="${foto('portada.jpg')}" alt="Cuadro de una clase en video con avatar"></div>
    ${pie(1)}
  </section>`,
  ...FORMAS.map((f, i) => `<section class="pieza">
    <div class="numero">${f.n}</div>
    <h2>${f.titulo}</h2>
    <p class="tenue">${f.texto}</p>
    <div class="datos"><span>Imagen: ${f.imagen}</span><span>Voz: ${f.voz}</span><span>Se arma en: ${f.donde}</span></div>
    <div class="cuadro"><img src="${foto(f.foto)}" alt="Ejemplo de la forma ${f.n}"></div>
    ${pie(i + 2)}
  </section>`),
  `<section class="pieza">
    <h2 style="margin-top:0;font-size:84px">Lo que aprendimos</h2>
    <div class="lista">${APRENDIDO.map((t, i) => `<div><span class="numero">${i + 1}</span><p>${t}</p></div>`).join('')}</div>
    ${pie(6)}
  </section>`,
  `<section class="pieza oscura">
    <div class="centro">
      <h1 style="margin-top:0">¿Cuál usarías en tus clases?</h1>
      <p class="gris">No hay una forma ganadora: depende de la clase, del tiempo y de tu plan.</p>
    </div>
    <img class="logo" src="${LOGO}" alt="USS Centro de Informática" style="margin-bottom:64px">
    ${pie(7)}
  </section>`,
];
const unica = `<section class="unica">
  <div><img class="logo" src="${LOGO}" alt="USS Centro de Informática"><h1>4 formas de crear una clase en video con IA</h1></div>
  <div class="tarjetas">${FORMAS.map(f => `<div><span class="numero">${f.n}</span>${f.titulo.replace(' de Google Vids', ' de Vids')}</div>`).join('')}</div>
</section>`;

const pagina = cuerpo => `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Piezas de LinkedIn</title><style>${CSS}</style></head><body>${cuerpo}</body></html>`;

const { chromium } = await import(pathToFileURL(path.join(REPO, kit, 'node_modules', 'playwright', 'index.mjs')).href);
const navegador = await chromium.launch();
try {
  fs.mkdirSync(path.join(SALIDA, 'carrusel'), { recursive: true });
  const p = await navegador.newPage({ viewport: { width: 1200, height: 1350 } });
  await p.setContent(pagina(piezas.join('')), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const nombres = ['01-portada', '02-forma-1', '03-forma-2', '04-forma-3', '05-forma-4', '06-aprendizajes', '07-cierre'];
  const secciones = await p.$$('.pieza');
  for (let i = 0; i < secciones.length; i++) await secciones[i].screenshot({ path: path.join(SALIDA, 'carrusel', `${nombres[i]}.png`) });
  const desbordes = await p.$$eval('.pieza', s => s.map((x, i) => (x.scrollHeight > x.clientHeight ? i + 1 : 0)).filter(Boolean));
  await p.emulateMedia({ media: 'print' });
  await p.pdf({ path: path.join(SALIDA, 'carrusel.pdf'), width: '1080px', height: '1350px', printBackground: true, pageRanges: '1-7' });
  await p.setContent(pagina(unica), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await (await p.$('.unica')).screenshot({ path: path.join(SALIDA, 'imagen-unica.png') });
  console.log(`[OK] ${path.relative(process.cwd(), SALIDA)}${desbordes.length ? ` · se desbordan: ${desbordes}` : ''}`);
} finally {
  await navegador.close();
}
