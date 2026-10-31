// Diapositivas por PLANTILLAS: se describen en clase.json ("diapositivas": [...]) sin escribir codigo.
// Las llena el docente desde la web, una IA gratis o Claude. Cada elemento puede aparecer cuando
// la voz dice una palabra ("cuando"); si no, aparece escalonado dentro de su bloque.
//
// Tipos: portada | idea | lista | codigo | comparacion | tarjetas | pasos | dato | cierre
//        imagen (una lamina subida por el docente: clases/<clase>/laminas/01.jpg, en el campo "imagen")
// Campos comunes: bloque (id donde empieza), kicker, titulo (la palabra clave entre *asteriscos*), sub, nota

const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// *palabra* -> <em>palabra</em> (acento serif morado)
const conAcento = s => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>');

export const TIPOS = ['portada', 'idea', 'lista', 'codigo', 'comparacion', 'tarjetas', 'pasos', 'dato', 'cierre', 'imagen'];

export function construirAuto({ b, p, u, tl, gsap, clase, tiempos, archivo }) {
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
    .diapo.lamina { padding: 0; align-items: center; justify-content: center; background: #f3f3f6; }
    .diapo.lamina::after { display: none; }
    .lamina-fondo { position: absolute; inset: -60px; width: calc(100% + 120px); height: calc(100% + 120px); object-fit: cover; filter: blur(36px) saturate(1.1); opacity: .45; }
    .lamina-kb, .lamina-zoom { position: relative; height: 100%; }
    .lamina-img { display: block; height: 100%; width: auto; box-shadow: 0 0 40px rgba(27, 27, 34, .16); }
    .lamina-foco { position: absolute; border: 4px solid var(--verde); border-radius: 14px;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, .85), 0 0 22px rgba(166, 198, 26, .6), 0 0 0 3000px rgba(16, 20, 40, .28); }
    .lamina-num { position: absolute; width: 52px; height: 52px; margin: -26px 0 0 -40px; border-radius: 50%; background: var(--verde);
      color: #17180f; font: 800 26px/52px var(--sans); text-align: center; box-shadow: 0 4px 14px rgba(0, 0, 0, .28); }
    .lamina-resalta { position: absolute; border-radius: 6px; background: rgba(166, 198, 26, .32); border-bottom: 5px solid var(--verde);
      transform-origin: left center; mix-blend-mode: multiply; }
  `);

  const lista = clase.diapositivas || [];
  const ids = clase.bloques.map(x => x.id);
  const texto = id => (clase.bloques.find(x => x.id === id) || {}).texto || '';
  // segundo en que aparece un elemento: la palabra "cuando" (sin importar tildes ni mayusculas) o escalonado en el bloque
  const plano = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const momento = (bloque, cuando, i, n, desde = 0.12) => {
    const t = plano(texto(bloque));
    const k = cuando ? t.indexOf(plano(cuando)) : -1;
    if (k >= 0) return b(bloque, k / t.length);
    return b(bloque, Math.min(0.85, desde + (i / Math.max(1, n)) * 0.7));
  };

  const bloqueDe = (d, k) => (ids.includes(d.bloque) ? d.bloque : ids[Math.min(k, ids.length - 1)]);
  const inicios = lista.map((d, k) => (k === 0 ? 0 : b(bloqueDe(d, k))));

  lista.forEach((d, k) => {
    const bloque = bloqueDe(d, k);
    const t0 = inicios[k];
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
      case 'imagen': {
        // la lamina entera (sin recortar) sobre un fondo desenfocado de si misma, con un acercamiento lento mientras dura.
        // "efectos" (los propone la IA que lee la lamina; caja en % de la imagen) aparecen cuando la voz los nombra:
        //   numero = enumera un punto y lo enmarca · foco = enmarca y oscurece lo demas · resaltar = plumon · zoom = acerca
        const src = archivo(d.imagen || '');
        const fin = k + 1 < inicios.length ? inicios[k + 1] : tiempos.total;
        const efs = (d.efectos || []).filter(e => e && Array.isArray(e.caja) && e.caja.length === 4)
          .map((e, i, todos) => ({ ...e, t: momento(ids.includes(e.bloque) ? e.bloque : bloque, e.cuando, i, todos.length, 0.15) }))
          .sort((a, z) => a.t - z.t);
        const pos = ([x, y, w, h]) => ({ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` });
        let n = 0;
        const capas = efs.map((e, i) => (e.tipo === 'numero' ? `<b class="lamina-num" data-e="${i}" style="left:${e.caja[0]}%;top:${e.caja[1] + e.caja[3] / 2}%">${++n}</b>`
          : e.tipo === 'resaltar' ? `<i class="lamina-resalta" data-e="${i}"></i>` : '')).join('');
        const focos = efs.filter(e => e.tipo === 'foco' || e.tipo === 'numero');
        s = u.diapo(`<img class="lamina-fondo" src="${esc(src)}" alt="">
          <div class="lamina-kb"><div class="lamina-zoom"><img class="lamina-img" src="${esc(src)}" alt="" data-lamina="${esc(d.imagen)}">
          ${focos.length ? '<div class="lamina-foco"></div>' : ''}${capas}</div></div>`, { clase: 'lamina' });
        u.mostrar(s, t0);
        const kb = u.$(s, '.lamina-kb');
        gsap.set(kb, { scale: 1, transformOrigin: '50% 50%' });
        tl.to(kb, { scale: 1.035, duration: Math.max(1, fin - t0), ease: 'none' }, t0);
        // el foco salta de zona en zona (se oculta mientras hay un zoom y vuelve en el punto siguiente)
        const foco = focos.length ? u.$(s, '.lamina-foco') : null;
        if (foco) {
          gsap.set(foco, { autoAlpha: 0, ...pos(focos[0].caja) });
          tl.to(foco, { autoAlpha: 1, duration: 0.35 }, focos[0].t);
          focos.slice(1).forEach(e => tl.to(foco, { ...pos(e.caja), autoAlpha: 1, duration: 0.45, ease: 'power2.inOut' }, e.t));
        }
        efs.forEach((e, i) => {
          if (e.tipo === 'numero') u.entrar(u.$(s, `.lamina-num[data-e="${i}"]`), e.t, { y: 0, escala: 0.4 });
          if (e.tipo === 'resaltar') {
            const el = u.$(s, `.lamina-resalta[data-e="${i}"]`);
            gsap.set(el, { ...pos(e.caja), scaleX: 0 });
            tl.to(el, { scaleX: 1, duration: 0.55, ease: 'power2.out' }, e.t);
          }
          if (e.tipo === 'zoom') {
            // acerca hasta que la zona ocupe ~3/4 de la lamina y vuelve antes del siguiente efecto
            const [x, y, w, h] = e.caja;
            const z = Math.max(1.3, Math.min(2.4, 75 / w, 75 / h));
            const cx = x + w / 2 - 50;
            const cy = y + h / 2 - 50;
            const zona = u.$(s, '.lamina-zoom');
            const vuelta = Math.min(efs[i + 1] ? efs[i + 1].t - 0.1 : fin - 0.6, e.t + 5);
            gsap.set(zona, { transformOrigin: '50% 50%' });
            if (foco) tl.to(foco, { autoAlpha: 0, duration: 0.3 }, e.t);
            tl.to(zona, { scale: z, xPercent: -cx * z, yPercent: -cy * z, duration: 0.8, ease: 'power2.inOut' }, e.t);
            if (vuelta > e.t + 1) tl.to(zona, { scale: 1, xPercent: 0, yPercent: 0, duration: 0.7, ease: 'power2.inOut' }, vuelta);
          }
        });
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
