// Clase: Gestion profesional de la comunicacion con Gmail (Modulo I · Sesion 1, ~2:40, nivel basico)
// Contenido tomado de las 12 laminas de la sesion (laminas-referencia.webp).
// b('05') = segundo en que empieza el bloque 05 · p('05', 'firma') = cuando la voz dice "firma"

// Iconos en linea: el kit no admite imagenes externas
const ic = {
  check: '<svg class="ic-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  palomita: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  sobre: '<svg viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="1.5" width="29" height="21" rx="4"/><path d="M4 5l12 9 12-9"/></svg>',
  sobreGrande: '<svg viewBox="0 0 190 142"><rect x="6" y="6" width="178" height="130" rx="18" fill="#fff" stroke="#1b1b22" stroke-width="10"/><path d="M16 20l79 60 79-60" fill="none" stroke="#3e32d4" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 124l54-48M174 124l-54-48" stroke="#a6c61a" stroke-width="10" stroke-linecap="round"/></svg>',
  lapiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 20l1-4L16 5l3 3L8 19z"/></svg>',
  engranaje: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="8.2" stroke-width="3.6" stroke-dasharray="3.3 3.14"/><circle cx="12" cy="12" r="5.4" stroke-width="2.2"/><circle cx="12" cy="12" r="2" stroke-width="2"/></svg>',
  apps: `<svg viewBox="0 0 24 24" fill="currentColor">${[5, 12, 19].flatMap(y => [5, 12, 19].map(x => `<circle cx="${x}" cy="${y}" r="2"/>`)).join('')}</svg>`,
  lupa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
  etiqueta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.6"/></svg>',
  filtro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/></svg>',
  bandeja: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M3 13h5l1.5 2.5h5L16 13h5"/></svg>',
  laptop: '<svg viewBox="0 0 48 36" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round"><rect x="8" y="4" width="32" height="21" rx="2.5"/><path d="M3 30h42l-3 3H6z"/></svg>',
  tablet: '<svg viewBox="0 0 48 36" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="13" y="2" width="22" height="32" rx="3"/><path d="M22 29h4"/></svg>',
  celular: '<svg viewBox="0 0 48 36" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="17" y="3" width="14" height="30" rx="3"/><path d="M22.5 28h3"/></svg>',
  portapapeles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2.5" width="6" height="3.5" rx="1"/><path d="M8.5 11l1.6 1.6L13 9.8M8.5 16.5h7"/></svg>',
  birrete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/></svg>',
};

export default function ({ b, p, u }) {
  u.estilo(`
    .diapo::after { content: ''; position: absolute; right: -140px; top: -160px; width: 460px; height: 460px; border-radius: 50%;
      background: radial-gradient(circle, rgba(166,198,26,.20), transparent 68%); pointer-events: none; }
    .diapo svg { display: block; }
    .ic-check { width: 30px; height: 30px; flex: 0 0 30px; color: #8db312; }
    .uso { display: flex; align-items: center; gap: 14px; font-size: 25px; font-weight: 500; line-height: 1.3; color: #34343f; }
    .usos, .puedes, .recs, .repaso { display: flex; flex-direction: column; gap: 14px; }

    /* ventanas que imitan a Gmail */
    .ventana { background: #fff; border: 2px solid #e7e7f0; border-radius: 20px; overflow: hidden; box-shadow: 0 24px 50px rgba(27,27,34,.12); }
    .v-top { height: 58px; padding: 0 20px; display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #f0f0f5; }
    .v-logo { display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 700; color: #3a3a46; }
    .v-logo svg { width: 32px; height: 24px; color: var(--morado); }
    .v-busca { flex: 1; height: 36px; border-radius: 18px; background: #f1f1f7; }
    .v-ic { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 50%; color: #6b6b7a; }
    .v-ic svg { width: 26px; height: 26px; }
    .v-ava { width: 32px; height: 32px; flex: 0 0 32px; border-radius: 50%; background: var(--verde); }

    /* portada */
    .tile-col { display: flex; flex-direction: column; align-items: center; gap: 26px; }
    .app-tile { position: relative; width: 300px; height: 300px; border-radius: 72px; background: #fff; border: 2px solid #ececf3;
      box-shadow: 0 30px 60px rgba(27,27,34,.14); display: grid; place-items: center; }
    .app-tile > svg { width: 190px; height: 142px; }
    .app-tile .ic-check { width: 170px; height: 170px; }
    .badge { position: absolute; top: -16px; right: -16px; width: 78px; height: 78px; border-radius: 50%; background: var(--rojo); color: #fff;
      display: grid; place-items: center; font: 900 38px var(--sans); box-shadow: 0 10px 24px rgba(255,77,79,.35); }
    .gw { font-size: 24px; font-weight: 600; color: var(--gris); }

    /* logro: bandeja llena */
    .bandeja .b-cuerpo { padding: 26px 30px 30px; display: flex; flex-direction: column; gap: 22px; }
    .b-num { display: flex; align-items: baseline; gap: 14px; transform-origin: left center; }
    .b-num .contador { font: 900 112px/0.9 var(--sans); letter-spacing: -0.05em; color: var(--rojo); }
    .b-num small { font-size: 24px; font-weight: 600; color: var(--gris); }
    .b-filas { display: flex; flex-direction: column; gap: 12px; }
    .b-filas i { height: 14px; border-radius: 7px; background: #e4e4ec; }
    .b-filas i:nth-child(2) { width: 82%; } .b-filas i:nth-child(3) { width: 90%; } .b-filas i:nth-child(4) { width: 64%; }
    .b-ok { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; background: var(--verde-claro);
      color: var(--verde-osc); font-size: 23px; font-weight: 700; }

    /* temario */
    .temario { display: flex; flex-direction: column; gap: 14px; }
    .tema { display: flex; align-items: center; gap: 20px; padding: 12px 22px 12px 12px; border-radius: 18px; background: #f6f6fa;
      border: 2px solid #ebebf2; font-size: 26px; font-weight: 600; color: #2c2c36; }
    .tema b { flex: 0 0 52px; height: 52px; border-radius: 14px; background: var(--morado); color: #fff; display: grid; place-items: center; font: 800 24px var(--mono); }
    .tile-chico { width: 150px; height: 150px; border-radius: 36px; background: var(--morado-claro); color: var(--morado); display: grid; place-items: center; }
    .tile-chico svg { width: 84px; height: 84px; }

    /* parte 1: bandeja de Gmail */
    .gm { display: grid; grid-template-columns: 200px 1fr; }
    .gm-lateral { padding: 16px 0 16px 12px; display: flex; flex-direction: column; gap: 4px; }
    .gm-redactar { display: inline-flex; align-items: center; gap: 10px; align-self: flex-start; padding: 12px 20px; margin-bottom: 10px;
      border-radius: 16px; background: var(--morado-claro); color: var(--morado); font-size: 19px; font-weight: 700; }
    .gm-redactar svg { width: 20px; height: 20px; }
    .gm-item { display: flex; align-items: center; gap: 12px; padding: 8px 14px; border-radius: 0 18px 18px 0; font-size: 19px; color: #45454f; }
    .gm-item i { width: 14px; height: 14px; border-radius: 4px; border: 2px solid currentColor; opacity: .6; }
    .gm-item em { margin-left: auto; font-style: normal; font-size: 16px; font-weight: 700; }
    .gm-item.activo { background: #e3e1ff; color: var(--morado); font-weight: 700; }
    .gm-lista { padding: 14px 20px; display: flex; flex-direction: column; gap: 6px; border-left: 2px solid #f0f0f5; }
    .gm-fila { display: grid; grid-template-columns: 18px 110px 1fr; gap: 14px; align-items: center; height: 38px; border-bottom: 1px solid #f3f3f7; }
    .gm-fila .cb { width: 16px; height: 16px; border: 2px solid #cfcfdb; border-radius: 4px; }
    .gm-fila b, .gm-fila span { height: 12px; border-radius: 6px; background: #e4e4ec; }
    .gm-fila.nuevo b { background: #8d8d9e; }
    .gm-fila.nuevo span { background: #c9c9d6; }
    .equipos { display: flex; gap: 34px; margin-top: 6px; }
    .equipo { display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: 19px; font-weight: 600; color: var(--gris); }
    .equipo svg { width: 64px; height: 48px; color: var(--morado); }

    /* parte 2: configuracion rapida */
    .ajustes .panel { padding: 22px 26px 26px; display: flex; flex-direction: column; gap: 12px; }
    .panel-tit { font-size: 22px; font-weight: 700; color: #2c2c36; }
    .ver-toda { text-align: center; padding: 12px; border-radius: 22px; border: 2px solid #d4d2fb; color: var(--morado); font-size: 20px; font-weight: 700; }
    .ver-toda[data-on="1"] { background: var(--morado); color: #fff; border-color: var(--morado); }
    .op { display: flex; justify-content: space-between; align-items: center; padding: 10px 4px; border-bottom: 1px solid #f0f0f5; font-size: 20px; color: #45454f; }
    .op::after { content: ''; width: 44px; height: 10px; border-radius: 5px; background: #e4e4ec; }
    .engr[data-on="1"] { background: var(--morado-claro); color: var(--morado); box-shadow: 0 0 0 3px var(--morado); }
    .puedes-tit { font-size: 22px; font-weight: 800; color: var(--verde-osc); text-transform: uppercase; letter-spacing: .14em; }

    /* parte 3: etiquetas, filtros y categorias */
    .org .tarjeta { gap: 14px; }
    .t-ic { width: 60px; height: 60px; border-radius: 16px; display: grid; place-items: center; background: var(--morado-claro); color: var(--morado); }
    .t-ic svg { width: 34px; height: 34px; }
    .tarjeta.oscura .t-ic { background: rgba(255,255,255,.1); color: var(--verde); }
    .etiq { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
    .etiq span { display: flex; align-items: center; gap: 12px; font-size: 21px; font-weight: 600; color: #34343f; }
    .etiq span::before { content: ''; width: 18px; height: 18px; border-radius: 5px; background: var(--c); }
    .acciones { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 4px; }
    .acciones .chip { font-size: 20px; padding: 7px 12px; }
    .pestanas { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
    .pestanas span { padding: 7px 14px; border-radius: 10px; background: rgba(255,255,255,.08); font-size: 20px; font-weight: 600; color: #e6e6ee; }
    .pestanas span:first-child { background: var(--verde); color: #17180f; }

    /* parte 4: busqueda */
    .buscador { display: flex; align-items: center; gap: 14px; height: 66px; padding: 0 24px; border-radius: 33px; background: #f1f1f7; border: 2px solid #e4e4ec; }
    .buscador svg { width: 28px; height: 28px; color: var(--gris); }
    .consulta { font-family: var(--mono); font-size: 23px; font-weight: 600; color: var(--tinta); }
    .res { display: flex; flex-direction: column; gap: 2px; padding: 12px 22px; border-bottom: 1px solid #f0f0f5; }
    .res:last-child { border-bottom: 0; }
    .res b { font-size: 19px; font-weight: 700; color: #2c2c36; }
    .res span { font-size: 19px; color: var(--gris); }
    .ops { display: flex; flex-direction: column; gap: 10px; }
    .op-fila { display: grid; grid-template-columns: 230px 1fr; align-items: center; gap: 18px; padding: 12px 18px; border-radius: 16px; background: #f6f6fa; border: 2px solid #ebebf2; }
    .op-fila code { font-family: var(--mono); font-size: 21px; font-weight: 700; color: var(--morado); }
    .op-fila span { font-size: 22px; color: #34343f; }

    /* parte 5: redactar */
    .r-top { height: 48px; padding: 0 20px; display: flex; align-items: center; background: var(--tinta); color: #fff; font-size: 19px; font-weight: 600; }
    .r-campo { display: flex; align-items: center; gap: 14px; padding: 10px 20px; border-bottom: 1px solid #f0f0f5; font-size: 20px; color: #2c2c36; }
    .r-campo small { width: 64px; font-size: 19px; color: #8a8a98; }
    .r-cuerpo { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
    .r-texto { white-space: pre-line; font-size: 20px; line-height: 1.45; color: #34343f; }
    .r-firma { align-self: flex-start; font-size: 19px; font-weight: 700; color: var(--morado); }
    .r-pie { padding: 6px 20px 18px; }
    .enviar { display: inline-flex; padding: 10px 26px; border-radius: 20px; background: var(--morado); color: #fff; font-size: 19px; font-weight: 700; }

    /* tarea */
    .pendiente { display: flex; align-items: center; gap: 16px; font-size: 26px; font-weight: 600; color: #2c2c36; padding: 6px 0; }
    .caja-check { flex: 0 0 40px; height: 40px; border-radius: 10px; border: 3px solid #c8c8d6; display: grid; place-items: center; background: #fff; }
    .caja-check svg { width: 24px; height: 24px; opacity: 0; color: #fff; }
    .pendiente[data-ok="1"] .caja-check { background: var(--verde); border-color: var(--verde); }
    .pendiente[data-ok="1"] .caja-check svg { opacity: 1; }

    .despedida { display: inline-flex; align-items: center; gap: 14px; align-self: flex-start; padding: 14px 22px; border-radius: 14px;
      background: var(--verde-claro); color: var(--verde-osc); font-size: 26px; font-weight: 700; }
  `);

  // ---------- 1. Portada (bloque 01)
  const s1 = u.diapo(`
    <div class="dos" style="grid-template-columns: 1fr 360px; gap: 64px">
      <div style="display:flex;flex-direction:column;gap:26px">
        <div class="kicker">Módulo I · Sesión 1</div>
        <h1 class="titulo mediano">Gestión profesional de la comunicación con <em>Gmail</em></h1>
        <p class="sub" style="font-size:27px">Programa de Competencias Digitales, Productividad e Inteligencia Artificial</p>
        <div class="fila chips">
          <span class="chip">Firma</span><span class="chip">Etiquetas</span><span class="chip">Filtros</span><span class="chip verde">Búsqueda</span>
        </div>
      </div>
      <div class="tile-col">
        <div class="app-tile">${ic.sobreGrande}<b class="badge">1</b></div>
        <div class="gw">Google Workspace</div>
      </div>
    </div>`);
  u.mostrar(s1, 0);
  u.entrar(u.$(s1, '.kicker'), 0.2);
  u.letras(u.$(s1, '.titulo'), 0.35);
  u.entrar(u.$(s1, '.app-tile'), 0.5, { y: 0, escala: 0.85, dur: 0.9 });
  u.entrar(u.$(s1, '.gw'), 0.9, { y: 12 });
  u.entrar(u.$(s1, '.sub'), p('01', 'Te doy'));
  u.entrar(u.$(s1, '.badge'), p('01', 'bienvenida'), { y: 0, escala: 0.3, desenfoque: 0, dur: 0.5 });
  u.pulso(u.$(s1, '.badge'), p('01', 'bienvenida') + 0.7, { escala: 1.15 });
  u.entrar(u.$$(s1, '.chips .chip'), p('01', 'Hoy'), { stagger: 0.12, y: 20 });

  // ---------- 2. Logro de aprendizaje (bloque 02)
  const s2 = u.diapo(`
    <div class="kicker">Logro de aprendizaje</div>
    <div class="dos" style="grid-template-columns: 430px 1fr; gap: 56px">
      <div class="ventana bandeja">
        <div class="v-top"><div class="v-logo">${ic.sobre}Recibidos</div></div>
        <div class="b-cuerpo">
          <div class="b-num"><span class="contador">0</span><small>sin leer</small></div>
          <div class="b-filas"><i></i><i></i><i></i><i></i></div>
          <div class="b-ok">${ic.check}<span>Todo en orden</span></div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:24px">
        <h2 class="titulo mediano">Ordena tu correo <em>como profesional</em></h2>
        <p class="sub" style="font-size:27px">Al finalizar, configuras y organizas tu Gmail para comunicarte de manera eficiente.</p>
        <div class="fila logros">
          <span class="chip">Personalización</span><span class="chip">Etiquetas</span><span class="chip">Filtros</span><span class="chip verde">Búsqueda avanzada</span>
        </div>
      </div>
    </div>`);
  const t2 = b('02');
  u.mostrar(s2, t2);
  u.entrar(u.$(s2, '.kicker'), t2 + 0.2);
  u.entrar(u.$(s2, '.bandeja'), t2 + 0.3, { escala: 0.95 });
  u.entrar(u.$$(s2, '.b-filas i'), t2 + 0.6, { stagger: 0.08, y: 10 });
  u.contar(u.$(s2, '.contador'), t2 + 0.6, 248, { dur: 2.2 });
  u.pulso(u.$(s2, '.b-num'), p('02', 'llena'));
  u.entrar(u.$(s2, '.titulo'), p('02', 'Al terminar'));
  u.entrar(u.$(s2, '.sub'), p('02', 'Al terminar') + 0.6);
  ['personalización', 'etiquetas', 'filtros', 'búsqueda'].forEach((w, i) =>
    u.entrar(u.$$(s2, '.logros .chip')[i], p('02', w), { y: 16, escala: 0.9 }));
  u.entrar(u.$(s2, '.b-ok'), p('02', 'organizar'), { y: 12 });

  // ---------- 3. Temario (bloque 03)
  const temas = [
    ['Gmail en el entorno académico y laboral', 'entorno'],
    ['Configuración inicial y personalización', 'configuración'],
    ['Organización: etiquetas, filtros y categorías', 'organización'],
    ['Búsqueda avanzada de información', 'búsqueda'],
    ['Buenas prácticas de comunicación profesional', 'buenas'],
  ];
  const s3 = u.diapo(`
    <div class="dos" style="grid-template-columns: 420px 1fr; gap: 48px">
      <div style="display:flex;flex-direction:column;gap:26px">
        <div class="kicker">Temario de la sesión</div>
        <h2 class="titulo mediano">En cinco <em>partes</em></h2>
        <div class="tile-chico">${ic.portapapeles}</div>
      </div>
      <div class="temario">${temas.map(([t], i) => `<div class="tema"><b>${i + 1}</b><span>${t}</span></div>`).join('')}</div>
    </div>`);
  const t3 = b('03');
  u.mostrar(s3, t3);
  u.entrar(u.$(s3, '.kicker'), t3 + 0.2);
  u.letras(u.$(s3, '.titulo'), t3 + 0.25);
  u.entrar(u.$(s3, '.tile-chico'), t3 + 0.4, { y: 0, escala: 0.8 });
  temas.forEach(([, w], i) => u.entrar(u.$$(s3, '.tema')[i], p('03', w), { x: 30, y: 0 }));

  // ---------- 4. Parte 1: Gmail en el entorno academico y laboral (bloque 04)
  const anchos = [[86, 72], [70, 90], [92, 64], [64, 80], [80, 58], [74, 86], [88, 70]];
  const filas = anchos.map(([a, c], i) =>
    `<div class="gm-fila${i < 3 ? ' nuevo' : ''}"><i class="cb"></i><b style="width:${a}%"></b><span style="width:${c}%"></span></div>`).join('');
  const s4 = u.diapo(`
    <div class="dos" style="grid-template-columns: 1fr 640px; gap: 48px">
      <div style="display:flex;flex-direction:column;gap:22px">
        <div class="kicker">Parte 1 · Entorno</div>
        <h2 class="titulo chico">El correo electrónico de <em>Google</em></h2>
        <div class="usos">
          <div class="uso">${ic.check}Comunicarte</div>
          <div class="uso">${ic.check}Recibir y enviar información</div>
          <div class="uso">${ic.check}Organizar tus mensajes</div>
          <div class="uso">${ic.check}Colaborar de forma segura</div>
        </div>
        <div class="equipos">
          <div class="equipo">${ic.laptop}<span>Computadora</span></div>
          <div class="equipo">${ic.tablet}<span>Tablet</span></div>
          <div class="equipo">${ic.celular}<span>Celular</span></div>
        </div>
      </div>
      <div class="ventana gm-ventana">
        <div class="v-top"><div class="v-logo">${ic.sobre}Gmail</div><div class="v-busca"></div><span class="v-ava"></span></div>
        <div class="gm">
          <div class="gm-lateral">
            <div class="gm-redactar">${ic.lapiz}Redactar</div>
            <div class="gm-item activo"><i></i>Recibidos<em>12</em></div>
            <div class="gm-item"><i></i>Destacados</div>
            <div class="gm-item"><i></i>Pospuestos</div>
            <div class="gm-item"><i></i>Enviados</div>
            <div class="gm-item"><i></i>Borradores</div>
          </div>
          <div class="gm-lista">${filas}</div>
        </div>
      </div>
    </div>`);
  const t4 = b('04');
  u.mostrar(s4, t4);
  u.entrar(u.$(s4, '.kicker'), t4 + 0.2);
  u.entrar(u.$(s4, '.titulo'), t4 + 0.25);
  u.entrar(u.$(s4, '.gm-ventana'), t4 + 0.3, { escala: 0.96 });
  u.entrar(u.$$(s4, '.gm-fila'), t4 + 0.7, { stagger: 0.06, y: 8 });
  ['comunicas', 'recibes', 'organizas', 'colaboras'].forEach((w, i) =>
    u.entrar(u.$$(s4, '.uso')[i], p('04', w), { x: -24, y: 0 }));
  u.pulso(u.$(s4, '.gm-redactar'), p('04', 'envías'), { escala: 1.1 });
  // Los tres equipos se nombran al final del bloque: entran juntos para que se alcancen a ver
  u.entrar(u.$$(s4, '.equipo'), p('04', 'dispositivo'), { y: 12, escala: 0.8, stagger: 0.3 });

  // ---------- 5. Parte 2: configuracion inicial (bloque 05)
  const s5 = u.diapo(`
    <div class="kicker">Parte 2 · Configuración inicial</div>
    <h2 class="titulo chico">Dale un toque <em>profesional</em></h2>
    <div class="dos" style="grid-template-columns: 560px 1fr; gap: 56px; align-items: start">
      <div class="ventana ajustes">
        <div class="v-top"><div class="v-busca"></div><span class="v-ic engr">${ic.engranaje}</span><span class="v-ic">${ic.apps}</span><span class="v-ava"></span></div>
        <div class="panel">
          <div class="panel-tit">Configuración rápida</div>
          <div class="ver-toda">Ver toda la configuración</div>
          <div class="op">Densidad</div><div class="op">Tema</div><div class="op">Panel de lectura</div>
        </div>
      </div>
      <div class="puedes">
        <div class="puedes-tit">Puedes:</div>
        <div class="uso">${ic.check}Agregar tu firma</div>
        <div class="uso">${ic.check}Elegir un tema</div>
        <div class="uso">${ic.check}Activar la respuesta automática</div>
        <div class="uso">${ic.check}Ajustar notificaciones y vista de lectura</div>
      </div>
    </div>`);
  const t5 = b('05');
  u.mostrar(s5, t5);
  u.entrar(u.$(s5, '.kicker'), t5 + 0.2);
  u.entrar(u.$(s5, '.titulo'), t5 + 0.25);
  u.entrar(u.$(s5, '.ajustes'), t5 + 0.4, { escala: 0.96 });
  u.activar(u.$(s5, '.engr'), p('05', 'engranaje'));
  u.pulso(u.$(s5, '.engr'), p('05', 'engranaje'), { escala: 1.2 });
  u.entrar(u.$(s5, '.panel'), p('05', 'engranaje') + 0.3, { y: -14 });
  u.activar(u.$(s5, '.ver-toda'), p('05', 'Ver toda'));
  u.pulso(u.$(s5, '.ver-toda'), p('05', 'Ver toda'), { escala: 1.05 });
  u.entrar(u.$(s5, '.puedes-tit'), p('05', 'Ahí'), { y: 12 });
  ['firma', 'tema', 'respuesta', 'ajustar'].forEach((w, i) =>
    u.entrar(u.$$(s5, '.puedes .uso')[i], p('05', w), { x: 24, y: 0 }));

  // ---------- 6. Parte 3: etiquetas, filtros y categorias (bloque 06)
  const s6 = u.diapo(`
    <div class="kicker">Parte 3 · Organiza tu correo</div>
    <h2 class="titulo chico">Etiquetas, filtros y <em>categorías</em></h2>
    <div class="tres org">
      <div class="tarjeta">
        <span class="t-ic">${ic.etiqueta}</span><h3>Etiquetas</h3><p>Agrupan tus correos por tema.</p>
        <div class="etiq"><span style="--c:#3e7bf2">Académico</span><span style="--c:#4caf50">Laboral</span><span style="--c:#f2b600">Proyectos</span></div>
      </div>
      <div class="tarjeta">
        <span class="t-ic">${ic.filtro}</span><h3>Filtros</h3><p>Automatizan acciones según reglas.</p>
        <div class="acciones"><span class="chip">Etiquetar</span><span class="chip">Archivar</span><span class="chip">Reenviar</span></div>
      </div>
      <div class="tarjeta oscura">
        <span class="t-ic">${ic.bandeja}</span><h3>Categorías</h3><p>Separan solas tus correos.</p>
        <div class="pestanas"><span>Principal</span><span>Promociones</span><span>Social</span><span>Notificaciones</span></div>
      </div>
    </div>`);
  const t6 = b('06');
  u.mostrar(s6, t6);
  u.entrar(u.$(s6, '.kicker'), t6 + 0.2);
  u.entrar(u.$(s6, '.titulo'), t6 + 0.25);
  ['etiquetas', 'filtros', 'categorías'].forEach((w, i) =>
    u.entrar(u.$$(s6, '.org .tarjeta')[i], p('06', w), { y: 40 }));
  ['Académico', 'Laboral', 'Proyectos'].forEach((w, i) =>
    u.entrar(u.$$(s6, '.etiq span')[i], p('06', w), { x: -16, y: 0 }));
  ['etiquetar,', 'archivar', 'reenviar'].forEach((w, i) =>
    u.entrar(u.$$(s6, '.acciones .chip')[i], p('06', w), { y: 12, escala: 0.9 }));
  // Las cuatro categorias cierran el bloque: entran en cadena junto con su tarjeta para alcanzar a verse
  u.entrar(u.$$(s6, '.pestanas span'), p('06', 'categorías') + 0.5, { x: -16, y: 0, stagger: 0.25 });

  // ---------- 7. Parte 4: busqueda avanzada (bloque 07)
  const ops = [
    ['from:', 'Correos de un remitente', 'From busca'],
    ['to:', 'Correos enviados a una persona', 'to por'],
    ['subject:', 'Palabras del asunto', 'subject'],
    ['has:attachment', 'Correos con adjuntos', 'Has attachment'],
    ['after: · before:', 'Después o antes de una fecha', 'adjuntos'],
  ];
  const s7 = u.diapo(`
    <div class="kicker">Parte 4 · Búsqueda avanzada</div>
    <h2 class="titulo chico">Encuéntralo en <em>segundos</em></h2>
    <div class="dos" style="grid-template-columns: 520px 1fr; gap: 48px; align-items: start">
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="buscador">${ic.lupa}<span class="consulta">from:docente@uss.edu.pe</span></div>
        <div class="ventana resultados">
          <div class="res"><b>docente@uss.edu.pe</b><span>Pautas del trabajo final</span></div>
          <div class="res"><b>docente@uss.edu.pe</b><span>Material de la sesión 1</span></div>
          <div class="res"><b>docente@uss.edu.pe</b><span>Horario de asesorías</span></div>
        </div>
        <p class="nota">Las fechas van como año/mes/día, por ejemplo: after:2026/03/01</p>
      </div>
      <div class="ops">${ops.map(([o, d]) => `<div class="op-fila"><code>${o}</code><span>${d}</span></div>`).join('')}</div>
    </div>`);
  const t7 = b('07');
  u.mostrar(s7, t7);
  u.entrar(u.$(s7, '.kicker'), t7 + 0.2);
  u.entrar(u.$(s7, '.titulo'), t7 + 0.25);
  u.entrar(u.$(s7, '.buscador'), t7 + 0.3, { escala: 0.96 });
  const tecleado = u.teclear(u.$(s7, '.consulta'), t7 + 0.8, { cps: 18 });
  u.entrar(u.$(s7, '.resultados'), tecleado + 0.2, { y: 16 });
  u.entrar(u.$$(s7, '.res'), tecleado + 0.4, { stagger: 0.12, y: 10 });
  ops.forEach(([, , w], i) => u.entrar(u.$$(s7, '.op-fila')[i], p('07', w), { x: 30, y: 0 }));
  u.entrar(u.$(s7, '.nota'), p('07', 'Has attachment'), { y: 10 });

  // ---------- 8. Parte 5: buenas practicas (bloque 08)
  const recs = [
    ['Asunto claro y específico', 'asunto'],
    ['Tono formal y respetuoso', 'tono'],
    ['Breve, claro y directo', 'breve'],
    ['Firma con tu nombre y programa', 'firma'],
    ['Revisa la ortografía', 'revisa'],
  ];
  const s8 = u.diapo(`
    <div class="kicker">Parte 5 · Buenas prácticas</div>
    <h2 class="titulo chico">Escribe como <em>profesional</em></h2>
    <div class="dos" style="grid-template-columns: 600px 1fr; gap: 52px; align-items: start">
      <div class="ventana redactor">
        <div class="r-top">Nuevo mensaje</div>
        <div class="r-campo"><small>Para</small>docente@uss.edu.pe</div>
        <div class="r-campo"><small>Asunto</small><span class="marca r-asunto">Consulta sobre el trabajo final</span></div>
        <div class="r-cuerpo">
          <span class="r-texto">${'Estimado(a) profesor(a):\nLe escribo para consultar la fecha de entrega.\nSaludos cordiales,'}</span>
          <span class="r-firma marca">Tu nombre · Tu programa de estudios</span>
        </div>
        <div class="r-pie"><span class="enviar">Enviar</span></div>
      </div>
      <div class="recs">${recs.map(([t]) => `<div class="uso">${ic.check}${t}</div>`).join('')}</div>
    </div>`);
  const t8 = b('08');
  u.mostrar(s8, t8);
  u.entrar(u.$(s8, '.kicker'), t8 + 0.2);
  u.entrar(u.$(s8, '.titulo'), t8 + 0.25);
  u.entrar(u.$(s8, '.redactor'), t8 + 0.3, { escala: 0.96 });
  u.teclear(u.$(s8, '.r-texto'), t8 + 0.9, { cps: 38 });
  u.resaltar(u.$(s8, '.r-asunto'), p('08', 'asunto'));
  u.entrar(u.$(s8, '.r-firma'), p('08', 'firma'), { y: 10 });
  u.resaltar(u.$(s8, '.r-firma'), p('08', 'firma') + 0.4);
  u.pulso(u.$(s8, '.enviar'), p('08', 'enviar'), { escala: 1.12 });
  recs.forEach(([, w], i) => u.entrar(u.$$(s8, '.recs .uso')[i], p('08', w), { x: 24, y: 0 }));

  // ---------- 9. Tarea de la sesion (bloque 09)
  const s9 = u.diapo(`
    <div class="kicker">Tarea de la sesión</div>
    <h2 class="titulo mediano">Ahora te toca <em>a ti</em></h2>
    <div class="dos" style="gap: 40px; align-items: stretch">
      <div class="tarjeta oscura tarea">
        <span class="t-ic">${ic.birrete}</span>
        <h3>En el aula virtual</h3>
        <p>Revisa las pautas y actividades que asignará tu docente para reforzar lo aprendido.</p>
      </div>
      <div class="tarjeta comienzo">
        <span class="num">UN BUEN COMIENZO</span>
        <div class="pendiente"><i class="caja-check">${ic.palomita}</i><span>Crea tu firma</span></div>
        <div class="pendiente"><i class="caja-check">${ic.palomita}</i><span>Crea tus primeras etiquetas</span></div>
      </div>
    </div>`);
  const t9 = b('09');
  u.mostrar(s9, t9);
  u.entrar(u.$(s9, '.kicker'), t9 + 0.2);
  u.letras(u.$(s9, '.titulo'), t9 + 0.25);
  u.entrar(u.$(s9, '.tarea'), p('09', 'Revisa'), { x: -30, y: 0 });
  u.entrar(u.$(s9, '.comienzo'), p('09', 'buen comienzo'), { x: 30, y: 0 });
  ['firma', 'etiquetas'].forEach((w, i) => {
    const fila = u.$$(s9, '.pendiente')[i];
    u.activar(fila, p('09', w), 'ok', '1');
    u.pulso(u.$(fila, '.caja-check'), p('09', w), { escala: 1.2 });
  });

  // ---------- 10. Que aprendi y despedida (bloque 10)
  const aprendi = [
    ['Reconozco la utilidad de Gmail', 'reconoces'],
    ['Configuro y personalizo mi cuenta', 'configuras'],
    ['Organizo con etiquetas, filtros y categorías', 'organizas'],
    ['Uso la búsqueda avanzada', 'usas'],
    ['Aplico buenas prácticas de comunicación', 'aplicas'],
  ];
  const s10 = u.diapo(`
    <div class="dos" style="grid-template-columns: 1fr 300px; gap: 60px">
      <div style="display:flex;flex-direction:column;gap:24px">
        <div class="kicker">¿Qué aprendí?</div>
        <h2 class="titulo chico">Repasemos lo <em>aprendido</em></h2>
        <div class="repaso">${aprendi.map(([t]) => `<div class="uso">${ic.check}${t}</div>`).join('')}</div>
        <div class="despedida">¡Nos vemos en la próxima sesión! · SIPANCITOBOT</div>
      </div>
      <div class="tile-col"><div class="app-tile">${ic.check}</div></div>
    </div>`);
  const t10 = b('10');
  u.mostrar(s10, t10);
  u.entrar(u.$(s10, '.kicker'), t10 + 0.2);
  u.letras(u.$(s10, '.titulo'), t10 + 0.25);
  u.entrar(u.$(s10, '.app-tile'), t10 + 0.4, { y: 0, escala: 0.85 });
  aprendi.forEach(([, w], i) => u.entrar(u.$$(s10, '.repaso .uso')[i], p('10', w), { x: -24, y: 0 }));
  u.entrar(u.$(s10, '.despedida'), p('10', 'Nos vemos'), { escala: 0.9 });
}
