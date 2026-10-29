// Diapositivas por PLANTILLAS: se describen en clase.json ("diapositivas": [...]) sin escribir codigo.
// Las llena el docente desde la web, una IA gratis o Claude. Cada elemento puede aparecer cuando
// la voz dice una palabra ("cuando"); si no, aparece escalonado dentro de su bloque.
//
// Tipos: portada | idea | lista | codigo | comparacion | tarjetas | pasos | dato | cierre
// Campos comunes: bloque (id donde empieza), kicker, titulo (la palabra clave entre *asteriscos*), sub, nota

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// *palabra* -> <em>palabra</em> (acento serif morado)
const conAcento = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');

export const TIPOS = ['portada', 'idea', 'lista', 'codigo', 'comparacion', 'tarjetas', 'pasos', 'dato', 'cierre'];

export function construirAuto({ b, p, u, clase }) {
  u.estilo(`
    .diapo::after { content: ''; position: absolute; right: -140px; top: -160px; width: 460px; height: 460px; border-radius: 50%;
      background: radial-gradient(circle, rgba(166,198,26,.20), transparent 68%); pointer-events: none; }
    .auto-deco { position: absolute; right: 90px; top: 120px; font: 900 260px/1 var(--mono); color: #efeefe; letter-spacing: -0.08em; }
    .auto-items { display: flex; flex-direction: column; gap: 16px; }
    .auto-item { display: flex; gap: 18px; align-items: center; font-size: 28px; line-height: 1.3; color: #34343f; }
    .auto-item b.n { flex: 0 0 48px; height: 48px; border-radius: 14px; background: var(--morado); color: #fff; display: grid; place-items: center; font: 800 22px var(--mono); }
    .auto-item i.v { flex: 0 0 16px; height: 16px; border-radius: 50%; background: var(--verde); }
    .auto-codigo { display: grid; grid-template-columns: 430px 1fr; gap: 44px; align-items: center; }
    .auto-codigo .codigo { font-size: 22px; max-height: 560px; overflow: hidden; }
    .auto-dato { font: 900 150px/0.9 var(--sans); letter-spacing: -0.06em; color: var(--tinta); }
    .auto-dato em { font-family: var(--serif); font-weight: 400; color: var(--morado); }
    .auto-chips { display: flex; gap: 14px; flex-wrap: wrap; }
    .auto-despedida { display: inline-flex; align-self: flex-start; padding: 14px 22px; border-radius: 14px; background: var(--verde-claro); color: var(--verde-osc); font-size: 26px; font-weight: 700; }
  `);

  const lista = clase.diapositivas || [];
  const ids = clase.bloques.map(x => x.id);
  const texto = id => (clase.bloques.find(x => x.id === id) || {}).texto || '';
  // segundo en que aparece un elemento: la palabra "cuando" o escalonado en el bloque
  const momento = (bloque, cuando, i, n, desde = 0.12) => {
    if (cuando && texto(bloque).toLowerCase().includes(String(cuando).toLowerCase())) return p(bloque, cuando);
    return b(bloque, Math.min(0.85, desde + (i / Math.max(1, n)) * 0.7));
  };

  lista.forEach((d, k) => {
    const bloque = ids.includes(d.bloque) ? d.bloque : ids[Math.min(k, ids.length - 1)];
    const t0 = k === 0 ? 0 : b(bloque);
    const kicker = d.kicker ? `<div class="kicker">${esc(d.kicker)}</div>` : '';
    const titulo = d.titulo ? conAcento(d.titulo) : '';
    const sub = d.sub ? `<p class="sub">${conAcento(d.sub)}</p>` : '';
    const nota = d.nota ? `<p class="nota">${esc(d.nota)}</p>` : '';
    const items = (d.items || []).filter(x => x && x.texto);
    let s;

    switch (d.tipo) {
      case 'portada': {
        const chips = items.map(x => `<span class="chip">${esc(x.texto)}</span>`).join('');
        s = u.diapo(`<div class="auto-deco">&lt;/&gt;</div>${kicker}<h1 class="titulo">${titulo}</h1>${sub}
          ${chips ? `<div class="auto-chips">${chips}</div>` : ''}${nota}`);
        u.mostrar(s, t0);
        u.entrar(u.$(s, '.auto-deco'), t0 + 0.1, { y: 0, escala: 0.9, desenfoque: 20, dur: 1.2 });
        if (kicker) u.entrar(u.$(s, '.kicker'), t0 + 0.2);
        u.letras(u.$(s, '.titulo'), t0 + 0.35);
        if (sub) u.entrar(u.$(s, '.sub'), momento(bloque, null, 1, 3, 0.25));
        if (chips) u.entrar(u.$$(s, '.chip'), momento(bloque, null, 2, 3, 0.25), { stagger: 0.1, y: 20 });
        break;
      }
      case 'lista':
      case 'pasos':
      case 'cierre': {
        const numerado = d.tipo === 'pasos';
        const filas = items.map((x, i) => `<div class="auto-item">${numerado ? `<b class="n">${i + 1}</b>` : '<i class="v"></i>'}<span>${conAcento(x.texto)}</span></div>`).join('');
        const desp = d.tipo === 'cierre' && d.despedida ? `<div class="auto-despedida">${esc(d.despedida)}</div>` : '';
        s = u.diapo(`${kicker}<h2 class="titulo mediano">${titulo}</h2>${sub}<div class="auto-items">${filas}</div>${desp}${nota}`);
        u.mostrar(s, t0);
        entradaTitulo(s, t0, kicker);
        if (sub) u.entrar(u.$(s, '.sub'), t0 + 0.6);
        u.$$(s, '.auto-item').forEach((el, i) => u.entrar(el, momento(bloque, items[i].cuando, i, items.length), { x: -24, y: 0 }));
        if (desp) u.entrar(u.$(s, '.auto-despedida'), b(bloque, 0.85), { escala: 0.9 });
        break;
      }
      case 'codigo': {
        s = u.diapo(`<div class="auto-codigo"><div style="display:flex;flex-direction:column;gap:24px">${kicker}
          <h2 class="titulo chico">${titulo}</h2>${sub}</div><pre class="codigo">${resaltar(u, d.codigo)}</pre></div>${nota}`);
        u.mostrar(s, t0);
        entradaTitulo(s, t0, kicker);
        u.entrar(u.$(s, '.codigo'), t0 + 0.3, { y: 20, desenfoque: 0 });
        const largo = String(d.codigo || '').replace(/\s/g, '').length || 1;
        const disponible = Math.max(2, (b(bloque, 1) - b(bloque)) * 0.6);
        u.teclear(u.$(s, '.codigo'), t0 + 0.6, { cps: Math.max(25, Math.min(90, largo / disponible)) });
        if (sub) u.entrar(u.$(s, '.sub'), b(bloque, 0.5));
        break;
      }
      case 'comparacion': {
        const lado = (x, clase2) => `<div class="tarjeta ${clase2}"><span class="num">${esc(x && x.etiqueta)}</span>
          <h3>${conAcento(x && x.titulo)}</h3><p>${conAcento(x && x.texto)}</p></div>`;
        s = u.diapo(`${kicker}<h2 class="titulo mediano">${titulo}</h2>${sub}
          <div class="dos" style="gap:30px;align-items:stretch">${lado(d.izq, '')}${lado(d.der, 'oscura')}</div>${nota}`);
        u.mostrar(s, t0);
        entradaTitulo(s, t0, kicker);
        if (sub) u.entrar(u.$(s, '.sub'), t0 + 0.6);
        const [a, z] = u.$$(s, '.tarjeta');
        u.entrar(a, momento(bloque, d.izq && d.izq.cuando, 0, 2), { x: -30, y: 0 });
        u.entrar(z, momento(bloque, d.der && d.der.cuando, 1, 2), { x: 30, y: 0 });
        break;
      }
      case 'tarjetas': {
        const ts = (d.tarjetas || []).slice(0, 4);
        const cols = ts.length <= 2 ? 'dos' : 'tres';
        const html = ts.map((x, i) => `<div class="tarjeta${i === ts.length - 1 && ts.length > 1 ? ' oscura' : ''}">
          <span class="num"${i === ts.length - 1 && ts.length > 1 ? ' style="color:var(--verde)"' : ''}>${String(i + 1).padStart(2, '0')}</span>
          <h3>${conAcento(x.titulo)}</h3><p>${conAcento(x.texto)}</p></div>`).join('');
        s = u.diapo(`${kicker}<h2 class="titulo mediano">${titulo}</h2>${sub}<div class="${cols}"${ts.length === 4 ? ' style="grid-template-columns:repeat(4,1fr)"' : ''}>${html}</div>${nota}`);
        u.mostrar(s, t0);
        entradaTitulo(s, t0, kicker);
        if (sub) u.entrar(u.$(s, '.sub'), t0 + 0.6);
        u.$$(s, '.tarjeta').forEach((el, i) => u.entrar(el, momento(bloque, ts[i].cuando, i, ts.length), { y: 40 }));
        break;
      }
      case 'dato': {
        s = u.diapo(`${kicker}<div class="auto-dato">${conAcento(d.dato)}</div><h2 class="titulo chico">${titulo}</h2>${sub}${nota}`);
        u.mostrar(s, t0);
        if (kicker) u.entrar(u.$(s, '.kicker'), t0 + 0.2);
        u.entrar(u.$(s, '.auto-dato'), t0 + 0.3, { escala: 0.85, y: 0 });
        if (titulo) u.entrar(u.$(s, '.titulo'), b(bloque, 0.3));
        if (sub) u.entrar(u.$(s, '.sub'), b(bloque, 0.5));
        break;
      }
      default: { // idea
        s = u.diapo(`${kicker}<h2 class="titulo mediano">${titulo}</h2>${sub}${nota}`);
        u.mostrar(s, t0);
        entradaTitulo(s, t0, kicker);
        if (sub) u.entrar(u.$(s, '.sub'), b(bloque, 0.3));
      }
    }
    if (nota) u.entrar(u.$(s, '.nota'), b(bloque, 0.75), { y: 10 });
  });

  function entradaTitulo(s, t0, kicker) {
    if (kicker) u.entrar(u.$(s, '.kicker'), t0 + 0.2);
    const t = u.$(s, '.titulo');
    if (t) u.letras(t, t0 + 0.25);
  }
}

function resaltar(u, codigo) {
  const c = String(codigo || '');
  return /<\/?[a-zA-Z]/.test(c) ? u.codigo(c) : esc(c.replace(/^\n/, '').replace(/\s+$/, ''));
}
