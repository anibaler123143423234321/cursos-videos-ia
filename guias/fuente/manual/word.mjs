// Word editable de cada guía, con el mismo contenido del PDF. Lo llama generar.mjs.
// Necesita la librería docx: ejecuta `npm install` dentro de guias/fuente/manual una sola vez.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, LevelFormat, Packer, PageNumber,
  Paragraph, ShadingType, Table, TableCell, TableRow, TabStopType, TextRun, VerticalAlign, WidthType,
} from 'docx';

const ANCHO = 9638; // A4 con márgenes de 2 cm, en DXA
const FUENTE = 'Arial';
const FUENTE_PROMPT = 'Courier New';
const COLOR = { tinta: '121214', gris: '5D616C', linea: 'E3E4E8', caja: 'F4F4F7', verde: '5B6E00', rojo: 'D0021B', oscuro: '121214', cabecera: 'F3F8DC' };

const texto = (t, o = {}) => new TextRun({ text: String(t), font: FUENTE, ...o });
const parrafo = (t, o = {}) => new Paragraph({ spacing: { after: 100 }, ...o, children: [texto(t, o.run)] });
const titulo2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [texto(t)] });
const titulo3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [texto(t)] });
const nota = t => parrafo(t, { spacing: { before: 80, after: 160 }, run: { size: 17, color: COLOR.gris } });
const vineta = (t, ref = 'vinetas') => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 60 }, children: [texto(t)] });

const borde = { style: BorderStyle.SINGLE, size: 4, color: COLOR.linea };
const bordes = { top: borde, bottom: borde, left: borde, right: borde };

function celda(contenido, ancho, o = {}) {
  const lineas = Array.isArray(contenido) ? contenido : [contenido];
  const children = lineas.map(l => (l instanceof Paragraph ? l : new Paragraph({
    alignment: o.centrado ? AlignmentType.CENTER : undefined,
    children: [l instanceof TextRun ? l : texto(l, { size: o.size || 18, bold: o.negrita, color: o.color })],
  })));
  return new TableCell({
    children, width: { size: ancho, type: WidthType.DXA }, borders: bordes, columnSpan: o.span, rowSpan: o.filas,
    verticalAlign: o.vertical, margins: { top: 50, bottom: 50, left: 90, right: 90 },
    shading: o.fondo ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fondo } : undefined,
  });
}
const cabecera = (t, ancho, o = {}) => celda(t, ancho, { negrita: true, fondo: COLOR.cabecera, size: 17, ...o });
function tabla(anchos, filas) {
  return new Table({ width: { size: anchos.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: anchos, rows: filas });
}
function tablaSimple(columnas, anchos, filas) {
  return tabla(anchos, [
    new TableRow({ tableHeader: true, children: columnas.map((c, i) => cabecera(c, anchos[i])) }),
    ...filas.map(f => new TableRow({ cantSplit: true, children: f.map((c, i) => celda(c, anchos[i], { negrita: i === 0 })) })),
  ]);
}
// Reparte el ancho: la primera columna es más grande y las demás iguales.
function anchosDe(n, primera = n > 4 ? 2000 : 3000) {
  const resto = Math.floor((ANCHO - primera) / (n - 1));
  return [ANCHO - resto * (n - 1), ...Array(n - 1).fill(resto)];
}

const altoPng = b => b.readUInt32BE(20);
const anchoPng = b => b.readUInt32BE(16);
function imagen(png, anchoPx, alt) {
  return new ImageRun({
    type: 'png', data: png, altText: { name: alt, title: alt, description: alt },
    transformation: { width: anchoPx, height: Math.round(anchoPx * altoPng(png) / anchoPng(png)) },
  });
}

function bloquePrompt(t) {
  const trozos = t.split(/\[\[(.+?)\]\]/);
  return new Paragraph({
    spacing: { before: 80, after: 120, line: 276 },
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: COLOR.caja },
    children: trozos.map((x, i) => texto(x, { font: FUENTE_PROMPT, size: 18, highlight: i % 2 ? 'yellow' : undefined })),
  });
}
function bloqueConsola(t) {
  return t.split('\n').map(linea => new Paragraph({
    shading: { type: ShadingType.CLEAR, color: 'auto', fill: COLOR.oscuro }, keepNext: true,
    children: [texto(linea || ' ', { font: FUENTE_PROMPT, size: 17, color: 'E9EAEE' })],
  }));
}

function pasosConCapturas(f, pantallas) {
  if (!f.capturas) return [];
  const salida = [titulo2('Paso a paso con capturas')];
  for (const c of f.capturas) {
    salida.push(titulo3(`${c.paso}. ${f.pasos[c.paso - 1][1]}`));
    if (c.consola) salida.push(...bloqueConsola(c.consola));
    else salida.push(new Paragraph({ keepNext: true, children: [imagen(pantallas.shift(), 400, f.pasos[c.paso - 1][1])] }));
    salida.push(nota(c.pie));
  }
  return salida;
}

function casuistica(f, necesita, clasesAlMes, nombrePantalla) {
  const c = f.casuistica;
  if (!c) return [];
  const minutos = [1, 2, 3];
  const anchos = anchosDe(4, 3400);
  const lineas = n => [
    texto(`${n.laminas} láminas`, { size: 18, bold: true }),
    texto(`${n.imagenes} imágenes`, { size: 18 }),
    texto(`${n.avatares} avatares`, { size: 18 }),
    ...(n.voces ? [texto(`${n.voces} ${n.voces === 1 ? 'voz' : 'voces'} en off`, { size: 18 })] : []),
  ];
  const caso = new Table({
    width: { size: ANCHO, type: WidthType.DXA }, columnWidths: anchos,
    rows: [
      new TableRow({ tableHeader: true, children: ['Caso', ...minutos.map(m => `${m} ${m === 1 ? 'minuto' : 'minutos'}`)].map((t, i) => cabecera(t, anchos[i])) }),
      ...c.casos.map(k => new TableRow({
        cantSplit: true,
        children: [
          celda([texto(k.nombre, { size: 18, bold: true }), texto(k.detalle, { size: 16, color: COLOR.gris })], anchos[0]),
          ...minutos.map((m, i) => celda(lineas(necesita(k, m)), anchos[i + 1])),
        ],
      })),
    ],
  });
  const col = 771;
  const primera = ANCHO - col * 9;
  const anchosCuenta = [primera, ...Array(9).fill(col)];
  const cuentas = tabla(anchosCuenta, [
    new TableRow({
      tableHeader: true,
      children: [cabecera('Caso', primera, { filas: 2, vertical: VerticalAlign.CENTER }), ...c.cuentas.map(q => cabecera(q.nombre, col * 3, { span: 3, centrado: true }))],
    }),
    new TableRow({ tableHeader: true, children: c.cuentas.flatMap((_, q) => minutos.map(m => cabecera(`${m} min`, col, { centrado: true, size: 15, key: q }))) }),
    ...c.casos.map(k => new TableRow({
      cantSplit: true,
      children: [
        celda(k.nombre, primera, { negrita: true }),
        ...c.cuentas.flatMap(q => minutos.map(m => {
          const clases = clasesAlMes(q, necesita(k, m));
          return celda(clases || 'No', col, { centrado: true, negrita: true, color: clases ? undefined : COLOR.rojo });
        })),
      ],
    })),
  ]);
  const e = f.casosEjemplo;
  const r = f.reutilizar;
  return [
    titulo2(c.titulo), caso, nota(c.nota),
    titulo2(c.tituloCuentas), cuentas, nota(c.notaCuentas),
    titulo2(e.titulo), tablaSimple(e.columnas, [1250, 1000, 4388, 1500, 1500], e.filas), nota(e.nota),
    titulo2(r.titulo),
    new Paragraph({ keepNext: true, spacing: { after: 100 }, children: [imagen(nombrePantalla, 400, r.titulo)] }),
    ...r.pasos.map(p => vineta(p, 'reutilizar')),
  ];
}

function ejemplos(f) {
  return (f.ejemplos || []).flatMap(e => [
    titulo2(e.titulo),
    new Paragraph({
      spacing: { after: 80 },
      children: [texto('Copia el prompt y cambia solo lo que está en '), texto('amarillo', { highlight: 'yellow' }), texto('. Si va entre comillas, deja las comillas: la IA copia ese texto en la lámina. Lo demás guarda el estilo del curso.')],
    }),
    bloquePrompt(e.texto),
    tabla([2800, ANCHO - 2800], [
      new TableRow({ tableHeader: true, children: [cabecera('Aquí cambias', 2800), cabecera('En este ejemplo dice', ANCHO - 2800)] }),
      ...e.cambios.map(([q, v]) => new TableRow({
        cantSplit: true,
        children: [celda(q, 2800, { negrita: true, color: COLOR.rojo }), celda([texto(v, { size: 18, highlight: 'yellow' })], ANCHO - 2800)],
      })),
    ]),
  ]);
}

// Mismo formato para todas las guías: encabezado con logo, pie con versión y páginas.
function documento({ titulo, codigo, pieTexto, version, rutaLogo, contenido }) {
  const logo = fs.readFileSync(rutaLogo);
  return new Document({
    title: titulo,
    creator: 'Estudio de clases USS',
    styles: {
      default: {
        document: { run: { font: FUENTE, size: 20, color: COLOR.tinta } },
        heading1: { run: { font: FUENTE, size: 36, bold: true, color: COLOR.tinta }, paragraph: { spacing: { before: 0, after: 120 }, keepNext: true } },
        heading2: { run: { font: FUENTE, size: 25, bold: true, color: COLOR.tinta }, paragraph: { spacing: { before: 280, after: 110 }, keepNext: true } },
        heading3: { run: { font: FUENTE, size: 21, bold: true, color: COLOR.tinta }, paragraph: { spacing: { before: 180, after: 70 }, keepNext: true } },
      },
    },
    numbering: {
      config: [
        { reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] },
        { reference: 'reutilizar', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } } } }] },
      ],
    },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1400, bottom: 1134, left: 1134, right: 1134, header: 500, footer: 450 } } },
      headers: {
        default: new Header({
          children: [new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: ANCHO }],
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR.linea, space: 4 } },
            children: [imagen(logo, 100, 'Logo USS Centro de Informática'), texto(`\tEstudio de clases · ${codigo}`, { size: 15, color: COLOR.gris })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: ANCHO }],
            children: [
              texto(`${pieTexto}\t${version} · `, { size: 15, color: COLOR.gris }),
              new TextRun({ children: [PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES], font: FUENTE, size: 15, color: COLOR.gris }),
            ],
          })],
        }),
      },
      children: contenido,
    }],
  });
}

async function guardar(doc, salida) {
  fs.writeFileSync(salida, await Packer.toBuffer(doc));
  // Word puede rechazar un archivo con entradas de carpeta dentro del ZIP.
  try { execFileSync('zip', ['-dq', salida, '*/'], { stdio: 'ignore' }); } catch { /* no había carpetas */ }
}

function indiceDeGuias(flujos, partes) {
  return [
    titulo2('Índice de flujos'),
    tablaSimple(['Código', 'Flujo', 'Para qué sirve'], [900, 3000, ANCHO - 3900], flujos.filter(x => !x.indice).map(x => [x.codigo, x.nombre, x.proposito])),
    titulo2('Dónde vive cada parte'),
    tablaSimple(['Parte', 'Qué hace', 'Archivos'], [2000, 4000, ANCHO - 6000], partes),
  ];
}

export async function crearWord({ f, via, flujos, partes, nombreDe, necesita, clasesAlMes, pagina, archivoHtml, salida, version, rutaLogo }) {
  await pagina.goto(`file://${archivoHtml}`, { waitUntil: 'load' });
  await pagina.evaluate(() => document.fonts.ready);
  const diagrama = await pagina.locator('.diagrama').screenshot({ type: 'png' });
  const pantallas = [];
  for (const el of await pagina.locator('.pantalla').all()) pantallas.push(await el.screenshot({ type: 'png' }));
  const pantallaReutilizar = f.reutilizar ? pantallas.pop() : null;

  const ficha = Object.entries({ Código: f.codigo, ...f.ficha });
  const anchosFicha = [2400, ANCHO - 2400];
  const anchosPasos = [560, 1560, 2700, ANCHO - 4820];
  const inicio = [
    new Paragraph({ spacing: { after: 40 }, children: [texto(`MANUAL DE FLUJOS · ESTUDIO DE CLASES USS · ${via === 'por-web' ? 'POR WEB' : 'POR TERMINAL'}`, { size: 15, bold: true, color: COLOR.verde })] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [texto(`${f.codigo} · ${f.nombre}`)] }),
    parrafo(f.proposito, { spacing: { after: 160 } }),
    tabla(anchosFicha, ficha.map(([k, v]) => new TableRow({
      cantSplit: true,
      children: [celda(k, anchosFicha[0], { negrita: true, fondo: COLOR.caja, size: 17 }), celda(v, anchosFicha[1])],
    }))),
    titulo2('Diagrama del flujo'),
    new Paragraph({ children: [imagen(diagrama, 640, `Diagrama del flujo ${f.codigo}`)] }),
    nota('Cada carril es un actor y los pasos van de arriba abajo. Las cajas punteadas son decisiones: «Sí» sigue la flecha; la otra salida está en la tabla de pasos (◆).'),
  ];
  const pasos = tablaSimple(['N.°', 'Actor', 'Paso', 'Qué pasa'], anchosPasos, f.pasos.map(([c, t, d, decision], i) => [`${i + 1}${decision ? ' ◆' : ''}`, f.carriles[c], t, d]));
  const cuerpo = f.indice ? [titulo2('Pasos del flujo'), pasos, ...indiceDeGuias(flujos, partes)] : [
    titulo2('Pasos del flujo'), pasos,
    ...pasosConCapturas(f, pantallas),
    ...(f.tablas || []).flatMap(t => [titulo2(t.titulo), tablaSimple(t.columnas, anchosDe(t.columnas.length), t.filas), ...(t.nota ? [nota(t.nota)] : [])]),
    ...casuistica(f, necesita, clasesAlMes, pantallaReutilizar),
    ...ejemplos(f),
    titulo2('Reglas del negocio'),
    ...f.reglas.map(r => vineta(r)),
    titulo2('Errores frecuentes'),
    tablaSimple(['Lo que ves', 'Por qué pasa', 'Qué hacer'], [2800, 3200, ANCHO - 6000], f.errores),
    titulo2('Archivos y datos'),
    ...f.datos.map(d => vineta(d)),
    titulo2('Flujos relacionados'),
    ...f.relacionados.map(r => vineta(`${r} · ${nombreDe(r)}`)),
  ];
  await guardar(documento({ titulo: `${f.codigo} · ${f.nombre}`, codigo: f.codigo, pieTexto: `${f.codigo} · ${f.nombre}`, version, rutaLogo, contenido: [...inicio, ...cuerpo] }), salida);
}

// Guía del docente: su contenido viene de guia-docente.html.
export async function crearWordDocente({ datos, salida, version, rutaLogo, dir }) {
  const contenido = [
    new Paragraph({ spacing: { after: 40 }, children: [texto('GUÍA PARA DOCENTES · ESTUDIO DE CLASES USS · POR WEB', { size: 15, bold: true, color: COLOR.verde })] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [texto(datos.titulo)] }),
    parrafo(datos.bajada, { spacing: { after: 160 } }),
    titulo2(datos.antes.titulo),
    ...datos.antes.lista.map(t => vineta(t, 'reutilizar')),
    nota(datos.antes.nota),
    ...datos.pasos.flatMap(p => [
      titulo2(`${p.numero}. ${p.titulo}`),
      nota(p.tiempo),
      ...p.texto.map(t => parrafo(t)),
      ...p.lista.map(t => vineta(t)),
      ...(p.imagen ? [new Paragraph({ spacing: { before: 100, after: 100 }, children: [imagen(fs.readFileSync(path.join(dir, p.imagen)), 480, p.titulo)] })] : []),
    ]),
    ...datos.cajas.flatMap(c => [titulo2(c.titulo), ...c.texto.map(t => parrafo(t)), ...c.lista.map(t => vineta(t))]),
  ];
  await guardar(documento({ titulo: 'Guía para docentes', codigo: 'Guía para docentes', pieTexto: 'Guía para docentes', version, rutaLogo, contenido }), salida);
}
