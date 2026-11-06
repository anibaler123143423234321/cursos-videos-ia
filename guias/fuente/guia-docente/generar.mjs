// Guía del docente: imprime guia-docente.html como PDF y devuelve su contenido para el Word.
// La llama guias/fuente/manual/generar.mjs.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));

export async function crearGuiaDocente({ navegador, salidaPdf }) {
  const pagina = await navegador.newPage();
  await pagina.goto(pathToFileURL(path.join(AQUI, 'guia-docente.html')).href, { waitUntil: 'load' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({ path: salidaPdf, format: 'A4', printBackground: true, preferCSSPageSize: true, outline: true, tagged: true });
  const datos = await pagina.evaluate(() => {
    const limpio = el => (el ? el.innerText.replace(/\s+/g, ' ').trim() : '');
    const items = el => [...el.querySelectorAll('li')].map(limpio);
    const caja = c => ({ titulo: limpio(c.querySelector('h3')), texto: [...c.querySelectorAll(':scope > p, :scope > .ruta')].map(limpio), lista: items(c) });
    return {
      titulo: limpio(document.querySelector('h1')),
      bajada: limpio(document.querySelector('.bajada')),
      antes: { titulo: limpio(document.querySelector('.antes h3')), lista: items(document.querySelector('.antes')), nota: limpio(document.querySelector('.antes .nota')) },
      pasos: [...document.querySelectorAll('.paso')].map(p => {
        const h2 = p.querySelector('h2');
        const tiempo = limpio(h2.querySelector('.tiempo'));
        return {
          numero: limpio(p.querySelector('.num')), titulo: limpio(h2).replace(tiempo, '').trim(), tiempo,
          texto: [...p.querySelectorAll(':scope > div > p')].map(limpio), lista: items(p), imagen: p.querySelector('img') ? p.querySelector('img').getAttribute('src') : '',
        };
      }),
      cajas: [...document.querySelectorAll('.dos .caja')].map(caja),
    };
  });
  await pagina.close();
  return datos;
}
