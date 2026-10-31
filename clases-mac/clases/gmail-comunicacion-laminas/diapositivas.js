// Clase: Gestion profesional de la comunicacion con Gmail, armada con las 9 laminas oficiales de la sesion.
// Cada lamina es una imagen (laminas/01.png ... 09.png, recortadas de laminas-referencia.webp).
// El "foco" verde resalta en la lamina lo que la voz va nombrando; la lamina 9 cubre los bloques 09 y 10.
// b('05') = segundo en que empieza el bloque 05 · p('05', 'firma') = cuando la voz dice "firma"

// Zonas de cada lamina en % de la imagen: [izquierda, arriba, ancho, alto]
const Z = {
  logroDibujo: [6, 37, 38, 54], logroTexto: [47, 34, 51, 52],
  entornoTexto: [2, 34, 40, 49], entornoLaptop: [38.5, 30, 60, 64],
  engranaje: [43.5, 23.5, 7.5, 12.5], verToda: [29.5, 44.5, 34, 10.5],
  temario: [40.1, 51.3, 62.8, 74.3, 86.0].map(y => [7.8, y - 5.6, 66.4, 11.2]),
  puedes: [[49.5, 10.5], [58.3, 7.5], [68.5, 10.5], [80.5, 10.5]].map(([y, h]) => [67.8, y - h / 2, 30.8, h]),
  tarjetas: [[26.2, 20.2], [49, 19.9], [71.6, 21.6]].map(([y, h]) => [37.8, y, 60.6, h]),
  buscador: [35.8, 28.5, 61.2, 11.6],
  operadores: [56.1, 63.7, 71.1, 78.7, 86.0].map(y => [36, y - 3.9, 61.2, 7.8]),
  recomendaciones: [[42.9, 7.4], [50.4, 7.4], [58.2, 7.4], [68.1, 11.2], [77.8, 7.4]].map(([y, h]) => [56.6, y - h / 2, 41.8, h]),
  tarea: [1, 1.5, 49, 97.5], aprendi: [50.8, 1.5, 48.6, 97.5],
  aprendiItems: [[32.2, 11.5], [42.3, 7.5], [53.0, 11.5], [65.0, 11.5], [77.5, 11.5]].map(([y, h]) => [52.8, y - h / 2, 46.4, h]),
};

export default async function ({ b, p, u, tl, gsap, clase }) {
  u.estilo(`
    .diapo.lam-diapo { padding: 0; align-items: center; justify-content: center; background: #f4f6fb; }
    .diapo.lam-diapo::after { display: none; }
    .lam-fondo { position: absolute; inset: -40px; width: calc(100% + 80px); height: calc(100% + 80px); object-fit: cover;
      filter: blur(26px) saturate(1.1); opacity: .5; }
    .marco { position: relative; height: 100%; overflow: hidden; box-shadow: 0 0 40px rgba(27,27,34,.18); }
    .marco .lam { display: block; height: 100%; width: auto; }
    .foco { position: absolute; border: 4px solid #a6c61a; border-radius: 14px;
      box-shadow: 0 0 0 3px rgba(255,255,255,.85), 0 0 22px rgba(166,198,26,.65), 0 0 0 3000px rgba(16,20,40,.26); }
  `);

  const ruta = n => `/clases/${clase.slug}/laminas/${String(n).padStart(2, '0')}.png`;
  const imagenes = [];

  // Una diapositiva por lamina: la imagen completa (sin recortar) sobre un fondo difuminado de si misma
  function lamina(n, desde, hasta) {
    const s = u.diapo(`
      <img class="lam-fondo" src="${ruta(n)}" alt="">
      <div class="marco"><img class="lam" src="${ruta(n)}" alt=""><div class="foco"></div></div>`, { clase: 'lam-diapo' });
    imagenes.push(...u.$$(s, 'img'));
    u.mostrar(s, desde);
    // acercamiento lento durante toda la lamina para que no se sienta como una foto fija
    const marco = u.$(s, '.marco');
    gsap.set(marco, { scale: 1 });
    tl.to(marco, { scale: 1.035, duration: Math.max(0.5, hasta - desde), ease: 'none' }, desde);
    return s;
  }

  // Mueve el foco de zona en zona: pasos = [[segundo, zona], ...]
  function enfocar(s, pasos) {
    const foco = u.$(s, '.foco');
    const caja = ([x, y, w, h]) => ({ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` });
    const [[t0, z0], ...resto] = pasos;
    gsap.set(foco, { autoAlpha: 0, ...caja(z0) });
    tl.to(foco, { autoAlpha: 1, duration: 0.35 }, t0);
    resto.forEach(([t, z]) => tl.to(foco, { ...caja(z), duration: 0.45, ease: 'power2.inOut' }, t));
  }

  // 1. Portada
  lamina(1, 0, b('01', 1));

  // 2. Logro de aprendizaje
  const s2 = lamina(2, b('02'), b('02', 1));
  enfocar(s2, [[p('02', 'llena'), Z.logroDibujo], [p('02', 'Al terminar'), Z.logroTexto]]);

  // 3. Temario
  const s3 = lamina(3, b('03'), b('03', 1));
  enfocar(s3, ['entorno', 'configuración', 'organización', 'búsqueda', 'buenas'].map((w, i) => [p('03', w), Z.temario[i]]));

  // 4. Parte 1: Gmail en el entorno academico y laboral
  const s4 = lamina(4, b('04'), b('04', 1));
  enfocar(s4, [[p('04', 'Gmail es'), Z.entornoTexto], [p('04', 'dispositivo'), Z.entornoLaptop]]);

  // 5. Parte 2: configuracion inicial
  const s5 = lamina(5, b('05'), b('05', 1));
  enfocar(s5, [
    [p('05', 'engranaje'), Z.engranaje],
    [p('05', 'Ver toda'), Z.verToda],
    ...['firma', 'tema', 'respuesta', 'ajustar'].map((w, i) => [p('05', w), Z.puedes[i]]),
  ]);

  // 6. Parte 3: etiquetas, filtros y categorias
  const s6 = lamina(6, b('06'), b('06', 1));
  enfocar(s6, ['etiquetas', 'filtros', 'categorías'].map((w, i) => [p('06', w), Z.tarjetas[i]]));

  // 7. Parte 4: busqueda avanzada
  const s7 = lamina(7, b('07'), b('07', 1));
  enfocar(s7, [
    [p('07', 'operadores'), Z.buscador],
    ...['From busca', 'to por', 'subject', 'Has attachment', 'after'].map((w, i) => [p('07', w), Z.operadores[i]]),
  ]);

  // 8. Parte 5: buenas practicas
  const s8 = lamina(8, b('08'), b('08', 1));
  enfocar(s8, ['asunto', 'tono', 'breve', 'firma', 'revisa'].map((w, i) => [p('08', w), Z.recomendaciones[i]]));

  // 9. Tarea (bloque 09) y que aprendi (bloque 10): la misma lamina, el foco pasa de una mitad a la otra
  const s9 = lamina(9, b('09'), b('10', 1));
  enfocar(s9, [
    [p('09', 'Revisa'), Z.tarea],
    [b('10') + 0.2, Z.aprendi],
    ...['reconoces', 'configuras', 'organizas', 'usas', 'aplicas'].map((w, i) => [p('10', w), Z.aprendiItems[i]]),
  ]);

  // El motor espera a esta funcion: asi ningun cuadro sale sin la lamina cargada
  await Promise.all(imagenes.map(i => i.decode().catch(() => {})));
}
