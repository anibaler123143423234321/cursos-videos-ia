// Ayudantes para escribir diapositivas.js sin pelear con GSAP.
// Regla de oro: el estado inicial se fija con gsap.set al construir y la linea de tiempo solo
// anima HACIA el estado final. Asi cada cuadro es identico en cada render.

export function crearUtil({ tl, gsap, escena }) {
  let actual = null;

  const lista = x => {
    if (!x) return [];
    if (typeof x === 'string') return Array.from(escena.querySelectorAll(x));
    if (x instanceof Element) return [x];
    return Array.from(x);
  };

  const u = {
    // Crea una diapositiva (oculta). Devuelve el <section>.
    diapo(html, { clase = '' } = {}) {
      const s = document.createElement('section');
      s.className = `diapo ${clase}`.trim();
      s.innerHTML = html;
      escena.appendChild(s);
      gsap.set(s, { autoAlpha: 0 });
      return s;
    },

    // Cambia a la diapositiva s en el segundo t (la anterior sale por la izquierda).
    mostrar(s, t) {
      const prev = actual;
      if (prev) tl.to(prev, { autoAlpha: 0, x: -70, duration: 0.45, ease: 'power2.in' }, Math.max(0, t - 0.45));
      gsap.set(s, { x: prev ? 70 : 0 });
      tl.to(s, { autoAlpha: 1, x: 0, duration: prev ? 0.65 : 0.01, ease: 'power3.out' }, t);
      actual = s;
      return s;
    },

    // Busca dentro de una diapositiva.
    $(s, sel) { return s.querySelector(sel); },
    $$(s, sel) { return Array.from(s.querySelectorAll(sel)); },

    // Aparece subiendo y enfocando (uno tras otro si son varios).
    entrar(objetivo, t, { y = 34, x = 0, escala = 1, stagger = 0.12, dur = 0.7, desenfoque = 8 } = {}) {
      const els = lista(objetivo);
      gsap.set(els, { autoAlpha: 0, y, x, scale: escala, filter: `blur(${desenfoque}px)` });
      tl.to(els, { autoAlpha: 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)', duration: dur, stagger, ease: 'power3.out' }, t);
      return t + dur + stagger * (els.length - 1);
    },

    // Desaparece.
    salir(objetivo, t, { dur = 0.4, y = -18 } = {}) {
      tl.to(lista(objetivo), { autoAlpha: 0, y, duration: dur, ease: 'power2.in' }, t);
    },

    // Titulo letra por letra, subiendo desde una mascara (respeta <em> y otras etiquetas).
    letras(objetivo, t, { stagger = 0.022, dur = 0.8 } = {}) {
      const letras = lista(objetivo).flatMap(partirLetras);
      gsap.set(letras, { yPercent: 115, opacity: 0, filter: 'blur(6px)' });
      tl.to(letras, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: dur, stagger, ease: 'power4.out' }, t);
      return t + dur + stagger * letras.length;
    },

    // Escribe caracter por caracter (ideal para .codigo). Devuelve el segundo en que termina.
    teclear(objetivo, t, { cps = 45 } = {}) {
      const cars = lista(objetivo).flatMap(partirCaracteres);
      gsap.set(cars, { opacity: 0 });
      tl.to(cars, { opacity: 1, duration: 0.01, stagger: 1 / cps, ease: 'none' }, t);
      return t + cars.length / cps;
    },

    // Subrayado tipo resaltador en elementos con class="marca".
    resaltar(objetivo, t, { dur = 0.6 } = {}) {
      const els = lista(objetivo);
      gsap.set(els, { backgroundSize: '0% 100%' });
      tl.to(els, { backgroundSize: '100% 100%', duration: dur, ease: 'power2.inOut' }, t);
    },

    // Pequeno "golpe" de escala para llamar la atencion.
    pulso(objetivo, t, { escala = 1.07 } = {}) {
      tl.to(lista(objetivo), { scale: escala, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }, t);
    },

    // Activa un estado CSS: pone data-<nombre>="1" en el segundo t (ej.: .caja[data-on="1"]).
    activar(objetivo, t, nombre = 'on', valor = '1') {
      tl.set(lista(objetivo), { attr: { [`data-${nombre}`]: valor } }, t);
    },

    // Contador numerico.
    contar(objetivo, t, hasta, { desde = 0, dur = 1.2, decimales = 0, sufijo = '' } = {}) {
      lista(objetivo).forEach(el => {
        const o = { v: desde };
        el.textContent = desde.toFixed(decimales) + sufijo;
        tl.to(o, { v: hasta, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = o.v.toFixed(decimales) + sufijo; } }, t);
      });
    },

    // Dibuja trazos SVG (path, line, rect...).
    dibujar(objetivo, t, { dur = 0.8 } = {}) {
      lista(objetivo).forEach(el => {
        const largo = el.getTotalLength ? el.getTotalLength() : 1000;
        gsap.set(el, { strokeDasharray: largo, strokeDashoffset: largo });
        tl.to(el, { strokeDashoffset: 0, duration: dur, ease: 'power2.inOut' }, t);
      });
    },

    // CSS propio de la clase.
    estilo(css) {
      const st = document.createElement('style');
      st.textContent = css;
      document.head.appendChild(st);
    },

    // Resalta codigo HTML: u.codigo(`<header>...</header>`) -> HTML con colores para .codigo
    codigo(src) {
      const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return src.replace(/^\n/, '').replace(/\s+$/, '')
        .split(/(<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>)/g)
        .map(parte => {
          if (!parte) return '';
          if (parte.startsWith('<!--')) return `<span class="c-com">${esc(parte)}</span>`;
          const m = parte.match(/^<(\/?)([A-Za-z][\w-]*)([\s\S]*?)(\/?)>$/);
          if (!m) return esc(parte);
          const attrs = m[3].replace(/([\w:-]+)(?:(=)("[^"]*"|'[^']*'|[^\s"']+))?/g, (_, n, eq, v) =>
            `<span class="c-atr">${n}</span>${eq ? `<span class="c-sig">=</span><span class="c-val">${esc(v)}</span>` : ''}`);
          return `<span class="c-sig">&lt;${m[1]}</span><span class="c-tag">${m[2]}</span>${attrs}<span class="c-sig">${m[4]}&gt;</span>`;
        })
        .join('');
    },
  };
  return u;
}

function textos(el) {
  const nodos = [];
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) nodos.push(w.currentNode);
  return nodos;
}

function partirLetras(el) {
  const letras = [];
  for (const n of textos(el)) {
    const frag = document.createDocumentFragment();
    for (const parte of n.textContent.split(/(\s+)/)) {
      if (!parte) continue;
      if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(parte)); continue; }
      const m = document.createElement('span');
      m.className = 'u-mascara';
      for (const c of parte) {
        const s = document.createElement('span');
        s.className = 'u-letra';
        s.textContent = c;
        m.appendChild(s);
        letras.push(s);
      }
      frag.appendChild(m);
    }
    n.parentNode.replaceChild(frag, n);
  }
  return letras;
}

function partirCaracteres(el) {
  const cars = [];
  for (const n of textos(el)) {
    const frag = document.createDocumentFragment();
    for (const c of n.textContent) {
      const s = document.createElement('span');
      s.textContent = c;
      frag.appendChild(s);
      if (c.trim()) cars.push(s);
      else frag.lastChild.className = 'u-esp';
    }
    n.parentNode.replaceChild(frag, n);
  }
  return cars;
}
