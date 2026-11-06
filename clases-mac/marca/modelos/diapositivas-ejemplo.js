// Clase: Introduccion a la estructura semantica en HTML (2:30, nivel basico)
// b('05') = segundo en que empieza el bloque 05 · b('05', 0.5) = mitad del bloque
// p('05', 'Nav') = segundo aproximado en que la voz dice "Nav" dentro del bloque 05

export default function ({ b, p, u }) {
  u.estilo(`
    .diapo::after { content: ''; position: absolute; right: -140px; top: -160px; width: 460px; height: 460px; border-radius: 50%;
      background: radial-gradient(circle, rgba(166,198,26,.20), transparent 68%); pointer-events: none; }
    .portada-deco { position: absolute; right: 90px; top: 110px; font: 900 300px/1 var(--mono); color: #efeefe; letter-spacing: -0.08em; }
    .maqueta { position: relative; display: grid; grid-template-columns: 1fr 1fr 170px; grid-template-rows: 72px 54px 1fr 1fr 64px; gap: 12px; height: 470px; }
    .maqueta .caja { position: relative; font-size: 22px; }
    .m-header { grid-column: 1 / 4; grid-row: 1; }
    .m-nav { grid-column: 1 / 4; grid-row: 2; }
    .m-main { grid-column: 1 / 3; grid-row: 3 / 5; align-items: flex-start !important; justify-content: flex-start !important; padding: 10px 16px; }
    .m-section { grid-column: 1 / 3; grid-row: 3; }
    .m-article { grid-column: 1 / 3; grid-row: 4; }
    .con-main .m-section, .con-main .m-article { margin: 44px 18px 0; }
    .con-main .m-article { margin: 0 18px 18px; }
    .m-aside { grid-column: 3; grid-row: 3 / 5; }
    .m-footer { grid-column: 1 / 4; grid-row: 5; }
    .q { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font: 900 30px var(--sans); color: #e5484d; }
    .lectores { display: flex; flex-direction: column; gap: 14px; }
    .lector { display: flex; align-items: center; gap: 14px; font-size: 26px; font-weight: 600; color: #34343f; }
    .lector i { width: 46px; height: 46px; border-radius: 12px; background: #fde8e8; color: #d93036; display: grid; place-items: center; font: 900 24px var(--sans); font-style: normal; }
    .w3c { background: var(--tinta); color: #fff; border-radius: 26px; padding: 44px 46px; display: flex; flex-direction: column; gap: 14px; }
    .w3c .sigla { font: 900 132px/0.9 var(--sans); letter-spacing: -0.06em; }
    .w3c .sigla span { color: var(--verde); }
    .w3c .nombre { font-size: 28px; font-weight: 600; color: #e6e6ee; }
    .w3c .dato { font-size: 22px; color: #a9a9b8; }
    .estandares { display: flex; flex-direction: column; gap: 18px; }
    .estandar { display: flex; align-items: center; gap: 18px; font-size: 26px; color: #34343f; }
    .estandar .chip { min-width: 150px; justify-content: center; }
    .compara .tarjeta { gap: 18px; }
    .compara .chip { align-self: flex-start; font-size: 28px; }
    .tachado { text-decoration: line-through; text-decoration-thickness: 3px; color: #b0b0bd; }
    .defs { display: flex; flex-direction: column; gap: 10px; }
    .def { display: flex; align-items: center; gap: 14px; font-size: 21px; color: #45454f; }
    .def .chip { font-size: 19px; padding: 6px 10px; min-width: 128px; justify-content: center; }
    .esqueleto { display: grid; grid-template-columns: 430px 1fr; gap: 44px; align-items: center; }
    .esqueleto .codigo { font-size: 22px; padding: 26px 32px; }
    .paso { display: flex; gap: 20px; align-items: center; font-size: 27px; line-height: 1.35; color: #34343f; }
    .paso b.n { flex: 0 0 52px; height: 52px; border-radius: 14px; background: var(--morado); color: #fff; display: grid; place-items: center; font: 800 24px var(--mono); }
    .despedida { display: inline-flex; align-items: center; gap: 14px; align-self: flex-start; padding: 14px 22px; border-radius: 14px; background: var(--verde-claro); color: var(--verde-osc); font-size: 26px; font-weight: 700; }
  `);

  // ---------- 1. Portada (bloque 01)
  const s1 = u.diapo(`
    <div class="portada-deco">&lt;/&gt;</div>
    <div class="kicker">Diseño Web · Nivel básico</div>
    <h1 class="titulo">Estructura <em>semántica</em><br>en HTML</h1>
    <p class="sub">Cómo darle significado a tu página para personas, navegadores y buscadores.</p>
    <div class="fila chips">
      <span class="chip">&lt;header&gt;</span><span class="chip">&lt;nav&gt;</span><span class="chip">&lt;main&gt;</span>
      <span class="chip">&lt;article&gt;</span><span class="chip verde">&lt;footer&gt;</span>
    </div>`);
  u.mostrar(s1, 0);
  u.entrar(u.$(s1, '.portada-deco'), 0.1, { y: 0, escala: 0.9, desenfoque: 20, dur: 1.2 });
  u.entrar(u.$(s1, '.kicker'), 0.2);
  u.letras(u.$(s1, '.titulo'), 0.35);
  u.entrar(u.$(s1, '.sub'), p('01', 'Soy'));
  u.entrar(u.$$(s1, '.chips .chip'), p('01', 'estructura'), { stagger: 0.1, y: 20 });

  // ---------- 2. El problema de los div (bloque 02)
  const s2 = u.diapo(`
    <div class="dos" style="grid-template-columns: 520px 1fr">
      <div style="display:flex;flex-direction:column;gap:26px">
        <div class="kicker">El problema</div>
        <h2 class="titulo mediano">Una caja llena de <em>cajas sin nombre</em></h2>
        <div class="lectores">
          <div class="lector"><i>?</i>El navegador</div>
          <div class="lector"><i>?</i>Google</div>
          <div class="lector"><i>?</i>Un lector de pantalla</div>
        </div>
      </div>
      <div class="maqueta">
        <div class="caja m-header">&lt;div&gt;<b class="q">?</b></div>
        <div class="caja m-nav">&lt;div&gt;<b class="q">?</b></div>
        <div class="caja m-section">&lt;div&gt;<b class="q">?</b></div>
        <div class="caja m-article">&lt;div&gt;<b class="q">?</b></div>
        <div class="caja m-aside">&lt;div&gt;<b class="q">?</b></div>
        <div class="caja m-footer">&lt;div&gt;<b class="q">?</b></div>
      </div>
    </div>`);
  u.mostrar(s2, b('02'));
  u.entrar(u.$(s2, '.kicker'), b('02') + 0.2);
  u.entrar(u.$$(s2, '.maqueta .caja'), b('02') + 0.3, { stagger: 0.09, y: 20, escala: 0.96 });
  u.entrar(u.$(s2, '.titulo'), p('02', 'Para ti'));
  u.entrar(u.$$(s2, '.lector')[0], p('02', 'navegador'), { x: -20, y: 0 });
  u.entrar(u.$$(s2, '.lector')[1], p('02', 'Google'), { x: -20, y: 0 });
  u.entrar(u.$$(s2, '.lector')[2], p('02', 'lector de pantalla'), { x: -20, y: 0 });
  u.entrar(u.$$(s2, '.q'), p('02', 'cajas sin nombre'), { stagger: 0.08, y: 0, escala: 1.6 });

  // ---------- 3. El W3C (bloque 03)
  const s3 = u.diapo(`
    <div class="kicker">Los estándares de la web</div>
    <div class="dos" style="grid-template-columns: 560px 1fr; align-items: stretch">
      <div class="w3c">
        <div class="sigla">W<span>3</span>C</div>
        <div class="nombre">World Wide Web Consortium</div>
        <div class="dato">Fundado en 1994 por Tim Berners-Lee, creador de la web.</div>
      </div>
      <div class="estandares" style="justify-content:center">
        <div class="estandar"><span class="chip">HTML</span>Estructura del contenido</div>
        <div class="estandar"><span class="chip">CSS</span>Diseño y presentación</div>
        <div class="estandar"><span class="chip verde">WCAG</span>Pautas de accesibilidad</div>
        <p class="texto final" style="margin-top:10px">Estándares abiertos = tu página funciona en <span class="marca">cualquier navegador</span>.</p>
      </div>
    </div>
    <p class="nota">Dato: hoy el estándar “vivo” de HTML lo mantiene el WHATWG en colaboración con el W3C.</p>`);
  u.mostrar(s3, b('03'));
  u.entrar(u.$(s3, '.kicker'), b('03') + 0.2);
  u.entrar(u.$(s3, '.w3c'), b('03') + 0.3, { escala: 0.94 });
  u.letras(u.$(s3, '.sigla'), b('03') + 0.45, { stagger: 0.08 });
  u.entrar(u.$(s3, '.dato'), p('03', 'Lo fundó'));
  u.entrar(u.$$(s3, '.estandar')[0], p('03', 'HTML'), { x: 30, y: 0 });
  u.entrar(u.$$(s3, '.estandar')[1], p('03', 'CSS'), { x: 30, y: 0 });
  u.entrar(u.$$(s3, '.estandar')[2], p('03', 'pautas'), { x: 30, y: 0 });
  u.entrar(u.$(s3, '.final'), p('03', 'Gracias'));
  u.resaltar(u.$(s3, '.marca'), p('03', 'cualquier navegador'));
  u.entrar(u.$(s3, '.nota'), p('03', 'Gracias') + 1.2, { y: 10 });

  // ---------- 4. Semantica = significado (bloque 04)
  const s4 = u.diapo(`
    <div class="kicker">La idea clave</div>
    <h2 class="titulo mediano">Semántica = <em>significado</em></h2>
    <p class="sub">Una etiqueta semántica describe <b>qué</b> contenido tiene dentro, no <b>cómo se ve</b>.</p>
    <div class="dos compara" style="gap:30px; align-items: stretch">
      <div class="tarjeta">
        <span class="num">SIN SEMÁNTICA</span>
        <span class="chip oscuro">&lt;div class="arriba"&gt;</span>
        <p>Una caja más: el navegador no sabe qué contiene.</p>
      </div>
      <div class="tarjeta">
        <span class="num">CON SEMÁNTICA</span>
        <span class="chip">&lt;header&gt;</span>
        <p><span class="tachado">“letras grandes”</span> &nbsp;→&nbsp; <b style="color:var(--tinta)">significa cabecera</b></p>
      </div>
    </div>`);
  u.mostrar(s4, b('04'));
  u.entrar(u.$(s4, '.kicker'), b('04') + 0.2);
  u.letras(u.$(s4, '.titulo'), b('04') + 0.25);
  u.entrar(u.$(s4, '.sub'), p('04', 'Una etiqueta'));
  u.entrar(u.$$(s4, '.tarjeta')[0], p('04', 'no cómo se ve'), { x: -30, y: 0 });
  u.entrar(u.$$(s4, '.tarjeta')[1], p('04', 'Por ejemplo'), { x: 30, y: 0 });
  u.pulso(u.$$(s4, '.tarjeta .chip')[1], p('04', 'significa cabecera'));

  // ---------- 5. Las etiquetas principales (bloques 05 y 06)
  const etiquetas = [
    ['header', 'Cabecera: logo y título', p('05', 'Header')],
    ['nav', 'Enlaces de navegación', p('05', 'Nav agrupa')],
    ['main', 'Contenido principal (solo uno)', p('05', 'main contiene')],
    ['section', 'Agrupa un tema', p('06', 'section')],
    ['article', 'Contenido independiente', p('06', 'article')],
    ['aside', 'Información complementaria', p('06', 'Aside')],
    ['footer', 'Pie: contactos y derechos', p('06', 'footer')],
  ];
  const s5 = u.diapo(`
    <div class="kicker">Las etiquetas principales</div>
    <div class="dos" style="grid-template-columns: 1fr 470px; gap: 40px">
      <div class="maqueta con-main">
        <div class="caja m-header">&lt;header&gt;</div>
        <div class="caja m-nav">&lt;nav&gt;</div>
        <div class="caja m-main">&lt;main&gt;</div>
        <div class="caja m-section">&lt;section&gt;</div>
        <div class="caja m-article">&lt;article&gt;</div>
        <div class="caja m-aside">&lt;aside&gt;</div>
        <div class="caja m-footer">&lt;footer&gt;</div>
      </div>
      <div class="defs">
        ${etiquetas.map(([n, d]) => `<div class="def" data-tag="${n}"><span class="chip">&lt;${n}&gt;</span>${d}</div>`).join('')}
      </div>
    </div>`);
  u.mostrar(s5, b('05'));
  u.entrar(u.$(s5, '.kicker'), b('05') + 0.2);
  u.entrar(u.$$(s5, '.maqueta .caja'), b('05') + 0.3, { stagger: 0.06, y: 16, escala: 0.97 });
  etiquetas.forEach(([n, , t], i) => {
    const caja = u.$(s5, `.m-${n}`);
    u.entrar(u.$(s5, `.def[data-tag="${n}"]`), t, { x: 24, y: 0 });
    u.activar(caja, t, 'on', '1');
    const siguiente = etiquetas[i + 1];
    const apagar = siguiente ? siguiente[2] : b('06', 1) + 0.3;
    u.activar(caja, apagar, 'on', '0');
    u.activar(caja, apagar, 'ok', '1');
  });

  // ---------- 6. El esqueleto en codigo (bloque 07)
  const s6 = u.diapo(`
    <div class="esqueleto">
      <div style="display:flex;flex-direction:column;gap:24px">
        <div class="kicker">Manos a la obra</div>
        <h2 class="titulo chico">El esqueleto <em>en código</em></h2>
        <p class="sub" style="font-size:28px">Se lee casi como <span class="marca">el índice de un libro</span>.</p>
      </div>
      <pre class="codigo">${u.codigo(`
<body>
  <header>
    <h1>Mi sitio</h1>
    <nav>Inicio · Cursos · Contacto</nav>
  </header>
  <main>
    <section>
      <h2>Novedades</h2>
      <article>Una noticia completa…</article>
    </section>
  </main>
  <aside>Enlaces relacionados</aside>
  <footer>© 2026 · Contacto</footer>
</body>`)}</pre>
    </div>`);
  u.mostrar(s6, b('07'));
  u.entrar(u.$(s6, '.kicker'), b('07') + 0.2);
  u.entrar(u.$(s6, '.titulo'), b('07') + 0.3);
  u.entrar(u.$(s6, '.codigo'), b('07') + 0.3, { y: 20, desenfoque: 0 });
  u.teclear(u.$(s6, '.codigo'), b('07') + 0.6, { cps: 48 });
  u.entrar(u.$(s6, '.sub'), p('07', 'Se lee'));
  u.resaltar(u.$(s6, '.marca'), p('07', 'índice'));

  // ---------- 7. Beneficios (bloque 08)
  const s7 = u.diapo(`
    <div class="kicker">¿Por qué vale la pena?</div>
    <h2 class="titulo mediano">Tres <em>beneficios</em></h2>
    <div class="tres">
      <div class="tarjeta"><span class="num">01</span><h3>Accesibilidad</h3><p>Los lectores de pantalla saltan directo al menú o al contenido.</p></div>
      <div class="tarjeta"><span class="num">02</span><h3>SEO</h3><p>Los buscadores entienden mejor de qué trata tu página.</p></div>
      <div class="tarjeta oscura"><span class="num" style="color:var(--verde)">03</span><h3>Mantenimiento</h3><p>Tú y tu equipo entienden el código de un vistazo.</p></div>
    </div>`);
  u.mostrar(s7, b('08'));
  u.entrar(u.$(s7, '.kicker'), b('08') + 0.2);
  u.letras(u.$(s7, '.titulo'), b('08') + 0.25);
  u.entrar(u.$$(s7, '.tarjeta')[0], p('08', 'Accesibilidad'), { y: 40 });
  u.entrar(u.$$(s7, '.tarjeta')[1], p('08', 'SEO'), { y: 40 });
  u.entrar(u.$$(s7, '.tarjeta')[2], p('08', 'mantenimiento'), { y: 40 });

  // ---------- 8. Reto y despedida (bloque 09)
  const s8 = u.diapo(`
    <div class="kicker">Tu reto de hoy</div>
    <h2 class="titulo mediano">De <span class="tachado" style="color:inherit;opacity:.35">div</span> a <em>semántico</em></h2>
    <div style="display:flex;flex-direction:column;gap:20px">
      <div class="paso"><b class="n">1</b><span>Toma una página tuya hecha solo con <b>div</b>.</span></div>
      <div class="paso"><b class="n">2</b><span>Cambia las cajas por <b>header, nav, main, section, article, aside</b> y <b>footer</b>.</span></div>
      <div class="paso"><b class="n">3</b><span>Revísala en el validador del W3C: <span class="marca"><b>validator.w3.org</b></span></span></div>
    </div>
    <div class="despedida">¡Nos vemos en la próxima clase! · SIPANCITOBOT</div>`);
  u.mostrar(s8, b('09'));
  u.entrar(u.$(s8, '.kicker'), b('09') + 0.2);
  u.entrar(u.$(s8, '.titulo'), b('09') + 0.25);
  u.entrar(u.$$(s8, '.paso')[0], p('09', 'toma'), { x: -24, y: 0 });
  u.entrar(u.$$(s8, '.paso')[1], p('09', 'cambia'), { x: -24, y: 0 });
  u.entrar(u.$$(s8, '.paso')[2], p('09', 'revísala'), { x: -24, y: 0 });
  u.resaltar(u.$(s8, '.marca'), p('09', 'validator'));
  u.entrar(u.$(s8, '.despedida'), p('09', 'Nos vemos'), { escala: 0.9 });
}
