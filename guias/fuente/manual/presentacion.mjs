// Presentación para capacitar al equipo: las 4 formas de crear el video. Los datos salen de la guía F16.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const PptxGenJS = require('pptxgenjs');

// Colores de la marca del estudio. El tema queda dentro del archivo: se cambia en un solo lugar desde PowerPoint.
const T = { tinta: '121214', gris: '5D616C', linea: 'E3E4E8', caja: 'F4F4F7', lima: 'A6C61A', limaSuave: 'F3F8DC', verde: '4F5F00', blanco: 'FFFFFF' };
const FUENTE = 'Arial'; // viene instalada en Windows y en Mac

// Las imágenes van incrustadas como datos: así el archivo no guarda rutas de esta PC.
const incrustar = f => `${f.endsWith('.png') ? 'image/png' : 'image/jpeg'};base64,${fs.readFileSync(f).toString('base64')}`;

const FORMAS = [
  { n: 1, titulo: 'Gemini + Hyperframes + avatar de Vids', corto: 'Láminas animadas con avatar', imagen: 'Gemini, incrustada en las láminas', voz: 'Clip de Vids', donde: 'Web', gasta: '1 avatar por lámina' },
  { n: 2, titulo: 'Lámina + avatar de Vids', corto: 'Tu lámina como fondo', imagen: 'Tu lámina lista', voz: 'Avatar de Vids', donde: 'Google Vids', gasta: '1 avatar por lámina' },
  { n: 3, titulo: 'HTML puro + voz de ElevenLabs', corto: 'Solo láminas y voz', imagen: 'Láminas HTML', voz: 'ElevenLabs', donde: 'Web', gasta: 'Créditos de ElevenLabs' },
  { n: 4, titulo: 'Solo Google Vids', corto: 'Todo dentro de Vids', imagen: 'Panel Imagen de Vids', voz: 'Avatar de Vids', donde: 'Google Vids', gasta: '1 imagen y 1 avatar por lámina' },
];

export async function crearPresentacion({ salida, capturas, logo }) {
  const p = new PptxGenJS();
  p.layout = 'LAYOUT_WIDE'; // 13.33 × 7.5 pulgadas
  p.author = 'Estudio de clases USS';
  p.company = 'Universidad Señor de Sipán';
  p.title = 'Las 4 formas de crear el video';
  p.theme = { headFontFace: FUENTE, bodyFontFace: FUENTE };

  const pie = { x: 0.6, y: 7.0, w: 9, h: 0.3, fontSize: 10, color: T.gris, fontFace: FUENTE };
  p.defineSlideMaster({
    title: 'CONTENIDO',
    background: { color: T.blanco },
    objects: [
      { image: { data: incrustar(logo), x: 11.4, y: 0.32, w: 1.33, h: 0.34 } },
      { text: { text: 'Estudio de clases USS · Centro de Informática', options: pie } },
      { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.35, w: 10.5, h: 0.9, fontSize: 32, bold: true, color: T.tinta, fontFace: FUENTE, align: 'left', valign: 'top', margin: 0 }, text: '' } },
    ],
    slideNumber: { x: 12.2, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: T.gris, fontFace: FUENTE, align: 'right' },
  });
  p.defineSlideMaster({
    title: 'OSCURA',
    background: { color: T.tinta },
    objects: [{ placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.4, w: 11.7, h: 1.7, fontSize: 48, bold: true, color: T.blanco, fontFace: FUENTE, align: 'left', valign: 'top', margin: 0 }, text: '' } }],
  });

  const contenido = titulo => {
    const s = p.addSlide({ masterName: 'CONTENIDO' });
    s.addText(titulo, { placeholder: 'title' });
    return s;
  };
  const texto = (s, t, o) => s.addText(t, { isTextBox: true, fontFace: FUENTE, color: T.tinta, margin: 0, valign: 'top', ...o });
  const circulo = (s, n, x, y, d = 0.55) => s.addText(String(n), { shape: p.ShapeType.ellipse, x, y, w: d, h: d, fill: { color: T.lima }, color: T.tinta, bold: true, fontSize: d > 0.5 ? 18 : 14, align: 'center', valign: 'middle', margin: 0, fontFace: FUENTE, objectName: `Número ${n}` });
  const tarjeta = (s, x, y, w, h, fill = T.caja) => s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill } });
  const imagen = (s, archivo, x, y, w, h, alt) => s.addImage({ data: incrustar(path.join(capturas, archivo)), x, y, w, h, altText: alt, rounding: false });
  // Pasos numerados en columna, con su captura al lado
  const forma = (titulo, pasos, nota, archivo, ancho, alto, alt) => {
    const s = contenido(titulo);
    pasos.forEach(([t, d], i) => {
      const y = 1.5 + i * 1.03;
      circulo(s, i + 1, 0.6, y);
      texto(s, t, { x: 1.35, y: y - 0.03, w: 4.9, h: 0.34, fontSize: 18, bold: true });
      texto(s, d, { x: 1.35, y: y + 0.32, w: 4.9, h: 0.55, fontSize: 14, color: T.gris });
    });
    const maxW = 6.2;
    const maxH = 5.1;
    const e = Math.min(maxW / ancho, maxH / alto);
    imagen(s, archivo, 6.55 + (maxW - ancho * e) / 2, 1.5 + (maxH - alto * e) / 2, ancho * e, alto * e, alt);
    s.addNotes(nota);
    return s;
  };

  // 1. Portada
  p.addSection({ title: 'Inicio' });
  let s = p.addSlide({ masterName: 'OSCURA', sectionTitle: 'Inicio' });
  s.addShape(p.ShapeType.roundRect, { x: 0.8, y: 0.8, w: 2.6, h: 0.95, rectRadius: 0.1, fill: { color: T.blanco }, line: { color: T.blanco } });
  s.addImage({ data: incrustar(logo), x: 1.0, y: 1.01, w: 2.2, h: 0.56, altText: 'Logo USS Centro de Informática' });
  s.addText('Las 4 formas de crear una clase en video', { placeholder: 'title' });
  texto(s, 'Guía para el equipo del Estudio de clases USS', { x: 0.8, y: 4.3, w: 11.7, h: 0.5, fontSize: 22, color: 'C4C7CE' });
  s.addNotes('Esta presentación resume la guía F16. Al final de cada forma se indica la guía con el detalle.');

  // 2. Las 4 formas
  s = contenido('Tienes 4 formas de crear el video');
  FORMAS.forEach((f, i) => {
    const x = 0.6 + (i % 2) * 6.15;
    const y = 1.55 + Math.floor(i / 2) * 2.65;
    tarjeta(s, x, y, 5.95, 2.4);
    circulo(s, f.n, x + 0.3, y + 0.3);
    texto(s, f.titulo, { x: x + 1.05, y: y + 0.3, w: 4.6, h: 0.75, fontSize: 20, bold: true });
    texto(s, f.corto, { x: x + 1.05, y: y + 1.1, w: 4.6, h: 0.35, fontSize: 16, color: T.gris });
    texto(s, `Se arma en: ${f.donde}`, { x: x + 1.05, y: y + 1.55, w: 4.6, h: 0.35, fontSize: 14, color: T.verde, bold: true });
  });
  s.addNotes('Las cuatro formas entregan un MP4 de 1920 por 1080. Cambian la imagen, la voz y el lugar donde se arma el video.');

  // 3. Comparación
  p.addSection({ title: 'Las 4 formas' });
  s = p.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Las 4 formas' });
  s.addText('Compara antes de empezar', { placeholder: 'title' });
  const celda = (t, o = {}) => ({ text: t, options: { fontFace: FUENTE, fontSize: 14, color: T.tinta, valign: 'middle', margin: [0.06, 0.1, 0.06, 0.1], ...o } });
  const cab = t => celda(t, { bold: true, fill: { color: T.limaSuave } });
  s.addTable([
    ['Forma', 'Imagen', 'Voz y avatar', 'Se arma en', 'Qué gasta'].map(cab),
    ...FORMAS.map(f => [celda(`${f.n}. ${f.titulo}`, { bold: true }), celda(f.imagen), celda(f.voz), celda(f.donde), celda(f.gasta)]),
  ], { x: 0.6, y: 1.6, w: 12.1, colW: [4.0, 2.9, 1.7, 1.4, 2.1], rowH: 0.8, border: { type: 'solid', pt: 0.75, color: T.linea } });
  s.addNotes('La forma 3 no lleva una persona: en el recuadro aparece el robot de la web. En la forma 1, el avatar llega a 1280 por 720.');

  forma('Forma 1: láminas animadas con avatar', [
    ['Genera las láminas', 'En la web: Imágenes y avatar › Generar láminas.'],
    ['Crea las imágenes en Gemini', 'Copia cada prompt, descarga la imagen y súbela.'],
    ['Agrega el avatar', 'Sube un clip por lámina o un solo video.'],
    ['Crea el video', 'Pulsa Crear video y descárgalo.'],
  ], 'Detalle completo en la guía F15. El clip del avatar se saca por la pestaña Network de Chrome.', 'f15-avatar.jpg', 800, 824, 'Pestaña Avatar que habla en la web del estudio').sectionTitle = 'Las 4 formas';

  forma('Forma 2: tu lámina con avatar de Vids', [
    ['Crea un video nuevo', 'Entra a docs.google.com/videos y pulsa +.'],
    ['Sube tu lámina', 'Insertar › Subir. Clic derecho › Establecer imagen como fondo.'],
    ['Genera el avatar', 'Panel Avatar: pega el guion y elige a William.'],
    ['Aplica las medidas y descarga', 'Avatar y logo con las medidas únicas.'],
  ], 'No gasta créditos de imagen, porque la lámina ya existe. Los pasos de avatar, logo y descarga están en F14.', 'f14-09-formato.jpg', 800, 573, 'Opciones de formato en Google Vids');

  forma('Forma 3: HTML puro con voz de ElevenLabs', [
    ['Crea la clase', 'Nueva clase › Láminas HTML animadas.'],
    ['Revisa guion y láminas', 'Corrige el texto en el editor.'],
    ['Elige la voz', 'Voz y avatar › ElevenLabs.'],
    ['Crea el video', 'Pulsa Crear video final.'],
  ], 'Se documenta en F01, F06 y F08. Gasta créditos de ElevenLabs, así que revisa el guion antes de generar la voz.', 'f15-portada.jpg', 1000, 563, 'Portada de una clase en video');

  forma('Forma 4: todo dentro de Google Vids', [
    ['Genera la lámina', 'Panel Imagen: pega el prompt y revisa el resultado.'],
    ['Fíjala como fondo', 'Insertar, y luego Establecer imagen como fondo.'],
    ['Genera el avatar', 'Panel Avatar: pega el guion y elige a William.'],
    ['Pon logo, medidas y descarga', 'Archivo › Descargar › Video MP4.'],
  ], 'Cada lámina gasta una imagen y un avatar. Una errata en la imagen obliga a generar otra. El detalle está en F14.', 'f14-05-vista-previa.jpg', 800, 573, 'Vista previa de una lámina en Google Vids');

  // Medidas: lienzo a escala
  p.addSection({ title: 'Medidas y cupos' });
  s = p.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Medidas y cupos' });
  s.addText('Usa una sola medida en todas las láminas', { placeholder: 'title' });
  const lienzo = { x: 0.6, y: 1.6, w: 6.4 };
  const k = lienzo.w / 1920;
  s.addShape(p.ShapeType.rect, { x: lienzo.x, y: lienzo.y, w: lienzo.w, h: 1080 * k, fill: { color: T.caja }, line: { color: T.gris, width: 1 }, objectName: 'Lienzo 1920 × 1080' });
  texto(s, 'Lienzo 1920 × 1080', { x: lienzo.x + 0.2, y: lienzo.y + 0.2, w: 3, h: 0.3, fontSize: 14, color: T.gris });
  s.addText('Avatar', { shape: p.ShapeType.rect, x: lienzo.x + 1320 * k, y: lienzo.y + 371 * k, w: 600 * k, h: 337.5 * k, fill: { color: T.lima }, color: T.tinta, bold: true, fontSize: 14, align: 'center', valign: 'middle', margin: 0, fontFace: FUENTE, objectName: 'Avatar a escala' });
  s.addImage({ data: incrustar(logo), x: lienzo.x + 1600 * k, y: lienzo.y + 20 * k, w: 300 * k, h: 76.2 * k, altText: 'Logo a escala' });
  texto(s, 'El dibujo está a escala.', { x: lienzo.x, y: 5.3, w: 6.4, h: 0.3, fontSize: 12, color: T.gris });
  const dato = t => celda(t, { align: 'center' });
  s.addTable([
    ['', 'Avatar', 'Logo'].map(cab),
    [celda('Ancho', { bold: true }), dato('600'), dato('300')],
    [celda('Altura', { bold: true }), dato('337.5'), dato('76.2')],
    [celda('Ángulo', { bold: true }), dato('0°'), dato('0°')],
    [celda('X', { bold: true }), dato('1320'), dato('1600')],
    [celda('Y', { bold: true }), dato('371'), dato('20')],
  ], { x: 7.5, y: 1.6, w: 5.2, colW: [1.8, 1.7, 1.7], rowH: 0.52, border: { type: 'solid', pt: 0.75, color: T.linea } });
  texto(s, 'Mide desde la parte superior izquierda. Deja Bloquear relación de aspecto activado.', { x: 7.5, y: 4.9, w: 5.2, h: 0.7, fontSize: 14, color: T.gris });
  s.addNotes('X más Ancho del avatar da 1920, por eso queda pegado al borde derecho. Estas medidas valen también para la portada.');

  // Network
  s = p.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Medidas y cupos' });
  s.addText('Saca el clip del avatar por Network', { placeholder: 'title' });
  [
    ['Abre DevTools', 'Clic derecho › Inspeccionar › Network.'],
    ['Filtra', 'Escribe videoplayback.'],
    ['Carga el clip', 'Reproduce el avatar de la escena.'],
    ['Abre el enlace', 'Clic derecho › Open in new tab.'],
    ['Guárdalo', 'Tres puntos › Descargar.'],
    ['Súbelo a la web', 'Avatar que habla › Subir clip.'],
  ].forEach(([t, d], i) => {
    const x = 0.6 + (i % 3) * 4.1;
    const y = 1.6 + Math.floor(i / 3) * 2.1;
    tarjeta(s, x, y, 3.9, 1.9);
    circulo(s, i + 1, x + 0.25, y + 0.25);
    texto(s, t, { x: x + 0.95, y: y + 0.3, w: 2.8, h: 0.45, fontSize: 18, bold: true });
    texto(s, d, { x: x + 0.25, y: y + 1.0, w: 3.4, h: 0.7, fontSize: 14, color: T.gris });
  });
  texto(s, 'Es un MP4 de 1280 × 720 con voz. El enlace caduca en unas horas.', { x: 0.6, y: 5.95, w: 12.1, h: 0.4, fontSize: 16, bold: true, color: T.verde });
  s.addNotes('No es una función oficial de Google y puede cambiar. Si el enlace deja de abrir, recarga Google Vids y repite los pasos.');

  // Cupos
  s = p.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Medidas y cupos' });
  s.addText('Planifica el cupo antes de generar avatares', { placeholder: 'title' });
  [['25', 'avatares al mes con Google AI Pro'], ['6', 'avatares al mes con cuenta gratis'], ['15', 'avatares para una sesión de 15 láminas']].forEach(([n, d], i) => {
    const x = 0.6 + i * 4.1;
    tarjeta(s, x, 1.7, 3.9, 3.1, i === 2 ? T.limaSuave : T.caja);
    texto(s, n, { x: x + 0.3, y: 2.0, w: 3.3, h: 1.3, fontSize: 66, bold: true });
    texto(s, d, { x: x + 0.3, y: 3.5, w: 3.3, h: 0.9, fontSize: 18, color: T.gris });
  });
  texto(s, 'Revisa el guion antes de generar: cada avatar gasta cupo.', { x: 0.6, y: 5.2, w: 12.1, h: 0.4, fontSize: 18, bold: true, color: T.verde });
  s.addNotes('Son los límites publicados por Google para cada plan. Con AI Pro, una sesión de 15 láminas usa 15 de los 25 avatares del mes.');

  // Dónde está cada cosa
  p.addSection({ title: 'Cierre' });
  s = p.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Cierre' });
  s.addText('Encuentra cada guía en un solo lugar', { placeholder: 'title' });
  tarjeta(s, 0.6, 1.6, 5.9, 4.3, T.tinta);
  texto(s, [
    { text: 'guias/', options: { bold: true, breakLine: true } },
    { text: '  index.html', options: { color: T.lima, bold: true, breakLine: true } },
    { text: '  por-web/  pdf · word', options: { breakLine: true } },
    { text: '  por-terminal/  pdf · word', options: { breakLine: true } },
    { text: '  presentaciones/', options: { breakLine: true } },
    { text: '  instalacion/', options: { breakLine: true } },
    { text: '  fuente/', options: {} },
  ], { x: 0.95, y: 1.9, w: 5.2, h: 3.7, fontSize: 20, color: T.blanco, fontFace: 'Courier New', paraSpaceAfter: 8 });
  [['Abre el portal', 'Doble clic en guias/index.html.'], ['Busca la guía', 'Filtra por web o por terminal.'], ['Elige el formato', 'PDF para leer y Word para editar.']].forEach(([t, d], i) => {
    const y = 1.8 + i * 1.5;
    circulo(s, i + 1, 7.0, y);
    texto(s, t, { x: 7.8, y: y - 0.03, w: 4.9, h: 0.4, fontSize: 20, bold: true });
    texto(s, d, { x: 7.8, y: y + 0.4, w: 4.9, h: 0.4, fontSize: 16, color: T.gris });
  });
  s.addNotes('El portal funciona sin internet y enlaza todas las guías.');

  await p.writeFile({ fileName: salida });
}
