// Arma el proyecto de Hyperframes de una clase. Lo usan la web y web/hyperframes.mjs.
// Íconos: motor/diapos-auto.js. Logos de aplicaciones: marca/apps/<clave>.svg. Fotos y pantallas: huecos con prompt en imagenes.json.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONOS } from '../motor/diapos-auto.js';
import { contenidoHyperframes, EFECTOS_HF, imagenesHf, LOGO_VIDS } from './ia.mjs';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS = `
  body { margin: 0; }
  #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; font-family: Inter, Arial, sans-serif; color: #0b1f4d; background: linear-gradient(135deg, #fff 45%, #e6f0fd); }
  .clip { position: absolute; inset: 0; }
  .logo { position: absolute; z-index: 10; left: ${LOGO_VIDS.x}px; top: ${LOGO_VIDS.y}px; width: ${LOGO_VIDS.ancho}px; box-sizing: border-box; padding: 8px 14px; background: rgba(255, 255, 255, .92); border-radius: 14px; }
  .contenido { position: absolute; left: 40px; top: 40px; width: 1240px; height: 1000px; display: flex; flex-direction: column; gap: 28px; justify-content: center; }
  .barra { display: flex; align-items: center; background: #0b1f4d; color: #fff; border-radius: 22px; overflow: hidden; }
  .barra-icono { flex: none; width: 110px; height: 110px; display: grid; place-items: center; background: #1a73e8; font-size: 56px; font-weight: 800; }
  .barra-texto { padding: 0 36px; font-size: 52px; font-weight: 800; }
  .frase { font-size: 64px; font-weight: 800; line-height: 1.2; }
  .grupo { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  .tarjeta { background: #eaf2fe; border-radius: 22px; padding: 30px 34px; box-shadow: 0 10px 26px rgba(11, 31, 77, .1); }
  .tarjeta h3 { margin: 0 0 10px; font-size: 40px; color: #1a56c4; } .tarjeta p { margin: 0; font-size: 34px; line-height: 1.3; }
  .fila { display: flex; align-items: center; gap: 24px; background: #fff; border-radius: 60px; padding: 16px 34px 16px 18px; box-shadow: 0 8px 22px rgba(11, 31, 77, .12); font-size: 38px; font-weight: 700; }
  .num { flex: none; width: 76px; height: 76px; display: grid; place-items: center; border-radius: 50%; background: #1a73e8; color: #fff; font-size: 40px; font-weight: 800; }
  .codigo { font-family: Menlo, Consolas, monospace; font-size: 34px; color: #1a56c4; }
  .nota { background: #dbe9fc; border-radius: 18px; padding: 22px 32px; font-size: 34px; }
  .imagen { flex: 1 1 0; min-height: 0; width: 100%; object-fit: cover; object-position: top; border-radius: 20px; box-shadow: 0 10px 26px rgba(11, 31, 77, .14); }
  .vacia { display: grid; place-content: center; gap: 10px; text-align: center; background: #f4f7fc; border: 4px dashed #1a73e8; box-sizing: border-box; color: #1a56c4; font-size: 30px; padding: 20px; box-shadow: none; }
  .vacia b { font-size: 38px; }
  .icono { display: inline-flex; vertical-align: -6px; margin-right: 12px; } .icono svg { width: 44px; height: 44px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  .contenido.portada { width: 1010px; gap: 22px; }
  .foto { position: absolute; left: 830px; top: 0; width: 1090px; height: 1080px; object-fit: cover; clip-path: polygon(22% 0, 100% 0, 100% 100%, 42% 100%); }
  .foto.vacia { border: 0; background: #e6eefb; }
  .triangulo { position: absolute; right: 0; bottom: 0; width: 230px; height: 230px; background: #22b35e; clip-path: polygon(100% 0, 100% 100%, 0 100%); }
  .burbuja { position: absolute; left: 1250px; top: 110px; width: 210px; height: 170px; display: grid; place-items: center; background: #fff; border-radius: 36px; box-shadow: 0 14px 34px rgba(11, 31, 77, .22); }
  .avatar { position: absolute; left: 1320px; top: 371px; width: 600px; height: 337.5px; object-fit: cover; }
  .burbuja img { width: 130px; } .burbuja::after { content: ''; position: absolute; left: 44px; bottom: -32px; border: 18px solid transparent; border-top-color: #fff; border-left-color: #fff; }
  .g-a { color: #4285f4; } .g-r { color: #ea4335; } .g-y { color: #fbbc05; } .g-v { color: #34a853; }
  .programa { font-size: 40px; line-height: 1.25; } .modulo { background: linear-gradient(90deg, #0b1f4d, #1a73e8); color: #fff; border-radius: 18px; padding: 20px 30px; font-size: 38px; font-weight: 800; }
  .sesion { align-self: flex-start; background: #22b35e; color: #fff; border-radius: 14px; padding: 10px 26px; font-size: 40px; font-weight: 800; }
  .tema { font-size: 84px; font-weight: 900; line-height: 1.08; } .marca { font-size: 40px; font-weight: 700; color: #5d616c; }
`;

const escAttr = t => String(t || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const conIconos = html => html.replace(/<span class="icono" data-icono="([a-z]+)"><\/span>/g, (t, n) => `<span class="icono"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n] || ''}</svg></span>`);
const hueco = (texto, clase) => `<div class="${clase} vacia"><b>Inserta aquí la imagen</b><span>${escAttr(texto)}</span></div>`;

function archivoDe(dir, id) {
  const assets = path.join(dir, 'assets');
  const f = fs.existsSync(assets) ? fs.readdirSync(assets).find(x => new RegExp(`^${id}\\.(jpe?g|png|webp)$`).test(x)) : '';
  return f ? `assets/${f}` : '';
}

// Cada lámina es una subcomposición con su propia línea de tiempo: sus tiempos cuentan desde el inicio de la lámina.
function lamina(l, imagen) {
  const id = `lamina-${l.id}`;
  const raiz = `[data-composition-id="${id}"]`;
  const animar = l.animaciones.map(a => {
    const fin = { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.6, ease: 'power3.out', stagger: Number(a.escalonado) || 0 };
    return `tl.fromTo(${JSON.stringify(`${raiz} ${a.selector}`)}, ${JSON.stringify(EFECTOS_HF[a.efecto])}, ${JSON.stringify(fin)}, ${Number(a.momento)});`;
  });
  const foto = l.parte === 'portada' ? `${imagen && imagen.archivo ? `<img class="foto" src="${imagen.archivo}" alt="Foto de oficina" />` : hueco('Foto de la portada', 'foto')}
    <div class="triangulo"></div>
    ${l.app === 'gmail' ? '<div class="burbuja"><img src="assets/app.svg" alt="Ícono de la aplicación" /></div>' : ''}` : '';
  const base = l.parte === 'temario' ? l.html.replace(/(class="barra-icono"[^>]*>)[^<]*/, '$1≡') : l.html;
  const html = conIconos(base).replace(/<div class="imagen"><\/div>/, imagen ? (imagen.archivo ? `<img class="imagen" src="${imagen.archivo}" alt="${escAttr(imagen.titulo)}" />` : hueco(imagen.titulo, 'imagen')) : '');
  return `<template id="${id}-template">
  <div data-composition-id="${id}" data-width="1920" data-height="1080">
    ${foto}
    <div class="contenido${l.parte === 'portada' ? ' portada' : ''}">${html}</div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
      ${animar.join('\n      ')}
      window.__timelines[${JSON.stringify(id)}] = tl;
    </script>
  </div>
</template>
`;
}

function indice(laminas) {
  let inicio = 0;
  const hosts = laminas.map(l => {
    const desde = inicio;
    inicio = redondo(inicio + l.duracion);
    return `<div id="host-${l.id}" class="clip" data-composition-id="lamina-${l.id}" data-composition-src="compositions/lamina-${l.id}.html" data-start="${desde}" data-duration="${l.duracion}" data-track-index="1" data-width="1920" data-height="1080"></div>`;
  }).join('\n      ');
  let tiempo = 0;
  const avatares = laminas.map(l => {
    const desde = tiempo;
    tiempo = redondo(tiempo + l.duracion);
    return l.avatar ? `<video id="avatar-${l.id}" class="clip avatar" src="${l.avatar.src}" data-start="${desde}" data-duration="${l.duracion}" data-media-start="${l.avatar.desde}" data-track-index="3" data-has-audio="true" playsinline></video>` : '';
  }).filter(Boolean).join('\n      ');
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>${CSS}</style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${inicio}" data-width="1920" data-height="1080">
      ${hosts}
      ${avatares}
      <img id="logo" class="logo" src="assets/logo.png" alt="Logo USS" data-start="0" data-duration="${inicio}" data-track-index="2" />
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines.main = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;
}

// Avatar que habla: un video con toda la clase o un clip por lámina. El video completo manda sobre los clips.
const redondo = n => Math.round(n * 100) / 100;
const segundosDe = f => Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], { encoding: 'utf8' }).stdout) || 0;
function avatarDe(dir) {
  const hallar = base => ['mp4', 'webm'].map(e => `${base}.${e}`).find(n => fs.existsSync(path.join(dir, 'assets', n)));
  return { completo: hallar('avatar'), clip: id => hallar(`l${id}-avatar`) };
}
function conAvatar(laminas, dir) {
  const { completo, clip } = avatarDe(dir);
  const total = completo ? segundosDe(path.join(dir, 'assets', completo)) : 0;
  const estimado = laminas.reduce((t, l) => t + l.duracion, 0);
  let usado = 0;
  return laminas.map((l, i) => {
    const archivo = completo || clip(l.id);
    if (!archivo || (completo && !total)) return l;
    const final = i === laminas.length - 1;
    const duracion = completo ? redondo(final ? total - usado : (l.duracion * total) / estimado) : redondo(segundosDe(path.join(dir, 'assets', archivo)) || l.duracion);
    const escala = duracion / l.duracion;
    const avatar = { src: `assets/${archivo}`, desde: completo ? usado : 0 };
    usado = redondo(usado + duracion);
    return { ...l, duracion, avatar, animaciones: (l.animaciones || []).map(a => ({ ...a, momento: redondo(Number(a.momento) * escala), escalonado: a.escalonado ? redondo(Number(a.escalonado) * escala) : a.escalonado })) };
  });
}

const porLamina = f => (fs.existsSync(f) ? Object.fromEntries(JSON.parse(fs.readFileSync(f, 'utf8')).laminas.map(c => [String(c.lamina).padStart(2, '0'), c])) : {});
const dirProyecto = slug => path.join(RAIZ, 'clases', slug, 'hyperframes');

export function estadoHyperframes(slug) {
  const dir = dirProyecto(slug);
  const f = path.join(dir, 'imagenes.json');
  if (!fs.existsSync(f)) return { existe: false, imagenes: [] };
  const { segundos, laminas, imagenes, lista = [] } = JSON.parse(fs.readFileSync(f, 'utf8'));
  const mp4 = path.join(dir, 'renders', `${slug}.mp4`);
  const { completo, clip } = avatarDe(dir);
  const clips = lista.filter(l => clip(l.id));
  const avatar = { completo: completo ? `assets/${completo}` : null, clips: clips.map(l => l.id), extension: Object.fromEntries(clips.map(l => [l.id, clip(l.id).split('.').pop()])) };
  return { existe: true, segundos, laminas, lista, avatar, video: fs.existsSync(mp4) ? fs.statSync(mp4).mtimeMs : null, imagenes: imagenes.map(i => ({ ...i, archivo: archivoDe(dir, i.id) })) };
}

// reconstruir: vuelve a armar con el contenido ya escrito, sin gastar IA (por ejemplo, tras subir una imagen).
export async function generarProyecto({ slug, env = {}, bloques = [], reconstruir = false }) {
  const dirClase = path.join(RAIZ, 'clases', slug);
  const clase = JSON.parse(fs.readFileSync(path.join(dirClase, 'clase.json'), 'utf8').replace(/^\uFEFF/, ''));
  const contenidoF = path.join(dirClase, 'hyperframes-contenido.json');
  const contenido = porLamina(contenidoF);
  const dir = dirProyecto(slug);
  const previos = fs.existsSync(path.join(dir, 'imagenes.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'imagenes.json'), 'utf8')).ids : null;
  const elegidos = reconstruir ? previos || Object.keys(contenido) : bloques;
  const vids = porLamina(path.join(dirClase, 'vids-contenido.json'));
  const guardar = lista => fs.writeFileSync(contenidoF, `${JSON.stringify({ laminas: lista.map(({ lamina: id, html, imagen, animaciones }) => ({ lamina: id, html, imagen, animaciones })) }, null, 2)}\n`);
  const alAvanzar = hechas => guardar(Object.entries({ ...contenido, ...hechas }).filter(([id]) => id !== '01').map(([id, c]) => ({ ...c, lamina: id })));
  const escritas = await contenidoHyperframes({ clase, env, bloques: elegidos, contenido, vids, alAvanzar });
  const laminas = conAvatar(escritas, dir);
  const imagenes = imagenesHf(clase, laminas, vids);
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  fs.copyFileSync(path.join(RAIZ, 'marca', 'logo-transparente.png'), path.join(dir, 'assets', 'logo.png'));
  const portada = laminas.find(l => l.app);
  if (portada && fs.existsSync(path.join(RAIZ, 'marca', 'apps', `${portada.app}.svg`))) fs.copyFileSync(path.join(RAIZ, 'marca', 'apps', `${portada.app}.svg`), path.join(dir, 'assets', 'app.svg'));
  fs.rmSync(path.join(dir, 'compositions'), { recursive: true, force: true });
  fs.mkdirSync(path.join(dir, 'compositions'), { recursive: true });
  for (const l of laminas) {
    const hueco_ = imagenes.find(i => i.lamina === l.id);
    fs.writeFileSync(path.join(dir, 'compositions', `lamina-${l.id}.html`), lamina(l, hueco_ && { ...hueco_, archivo: archivoDe(dir, hueco_.id) }));
  }
  fs.writeFileSync(path.join(dir, 'index.html'), indice(laminas));
  const segundos = redondo(laminas.reduce((s, l) => s + l.duracion, 0));
  const lista = laminas.map(l => ({ id: l.id, parte: l.parte, duracion: l.duracion, guion: l.guion }));
  fs.writeFileSync(path.join(dir, 'imagenes.json'), `${JSON.stringify({ segundos, laminas: laminas.length, ids: laminas.map(l => l.id), lista, imagenes }, null, 2)}\n`);
  guardar(escritas.filter(l => l.parte !== 'portada').map(l => ({ ...l, lamina: l.id })));
  return estadoHyperframes(slug);
}
