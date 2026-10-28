// Avatar incluido (gratis, sin internet): un robot que mueve la boca con el volumen de la voz.
// Todo depende solo de t, asi cada cuadro sale igual en cada render.

const NS = 'http://www.w3.org/2000/svg';

export function crearRobot(cont) {
  cont.innerHTML = `
<svg viewBox="0 0 376 282" xmlns="${NS}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <radialGradient id="rb-fondo" cx="50%" cy="35%" r="80%">
      <stop offset="0" stop-color="#4b40e6"/><stop offset=".55" stop-color="#2a2394"/><stop offset="1" stop-color="#120f38"/>
    </radialGradient>
    <linearGradient id="rb-metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d5d8e8"/>
    </linearGradient>
    <linearGradient id="rb-visor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#211d4a"/><stop offset="1" stop-color="#110f2b"/>
    </linearGradient>
    <pattern id="rb-puntos" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.3" fill="#ffffff"/>
    </pattern>
    <filter id="rb-brillo" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="3.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="rb-sombra" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#05041a" flood-opacity=".55"/>
    </filter>
  </defs>

  <rect width="376" height="282" fill="url(#rb-fondo)"/>
  <rect width="376" height="282" fill="url(#rb-puntos)" opacity=".10"/>
  <circle cx="318" cy="46" r="96" fill="#a6c61a" opacity=".13"/>
  <circle cx="40" cy="262" r="80" fill="#7f74ff" opacity=".18"/>

  <g id="rb-todo" filter="url(#rb-sombra)">
    <!-- cuerpo -->
    <rect x="96" y="214" width="184" height="110" rx="50" fill="url(#rb-metal)"/>
    <circle cx="188" cy="246" r="9" fill="#191636"/>
    <circle cx="188" cy="246" r="4.5" fill="#b6e21f" filter="url(#rb-brillo)"/>
    <rect x="171" y="194" width="34" height="26" rx="7" fill="#c3c7da"/>

    <!-- cabeza -->
    <g id="rb-cabeza">
      <line x1="188" y1="62" x2="188" y2="36" stroke="#c3c7da" stroke-width="5" stroke-linecap="round"/>
      <circle id="rb-antena" cx="188" cy="30" r="9" fill="#b6e21f" filter="url(#rb-brillo)"/>
      <rect x="100" y="108" width="17" height="44" rx="7" fill="#a6c61a"/>
      <rect x="259" y="108" width="17" height="44" rx="7" fill="#a6c61a"/>
      <rect x="113" y="60" width="150" height="138" rx="42" fill="url(#rb-metal)"/>
      <text x="188" y="78" text-anchor="middle" font-family="Inter, sans-serif" font-weight="900" font-size="12" fill="#3e32d4" letter-spacing="1.5">USS</text>
      <rect x="128" y="84" width="120" height="94" rx="28" fill="url(#rb-visor)"/>
      <path d="M140 96 Q150 90 166 90" stroke="#ffffff" stroke-opacity=".18" stroke-width="5" stroke-linecap="round" fill="none"/>
      <g id="rb-ojos" filter="url(#rb-brillo)">
        <ellipse id="rb-ojo1" cx="164" cy="119" rx="12.5" ry="15" fill="#b6e21f"/>
        <ellipse id="rb-ojo2" cx="212" cy="119" rx="12.5" ry="15" fill="#b6e21f"/>
      </g>
      <path id="rb-sonrisa" d="M170 151 Q188 163 206 151" stroke="#b6e21f" stroke-width="5" stroke-linecap="round" fill="none" filter="url(#rb-brillo)"/>
      <rect id="rb-boca" x="166" y="146" width="44" height="6" rx="3" fill="#b6e21f" filter="url(#rb-brillo)"/>
    </g>
  </g>
</svg>`;

  const g = id => cont.querySelector('#' + id);
  const cabeza = g('rb-cabeza');
  const todo = g('rb-todo');
  const ojos = g('rb-ojos');
  const ojo1 = g('rb-ojo1');
  const ojo2 = g('rb-ojo2');
  const boca = g('rb-boca');
  const sonrisa = g('rb-sonrisa');
  const antena = g('rb-antena');

  return {
    actualizar(t, nivel, hablando) {
      const parpado = parpadeo(t);
      const ry = Math.max(1.6, 15 * (1 - parpado));
      ojo1.setAttribute('ry', ry.toFixed(2));
      ojo2.setAttribute('ry', ry.toFixed(2));
      const mirar = Math.sin(t * 0.55) * 3 + Math.sin(t * 0.21 + 1) * 2;
      ojos.setAttribute('transform', `translate(${mirar.toFixed(2)} ${(Math.sin(t * 0.4) * 1.2).toFixed(2)})`);

      const abierto = hablando && nivel > 0.04;
      const h = 5 + nivel * 24;
      boca.setAttribute('height', h.toFixed(2));
      boca.setAttribute('y', (146 - nivel * 4).toFixed(2));
      boca.setAttribute('rx', Math.min(h / 2, 11).toFixed(2));
      boca.setAttribute('opacity', abierto ? '1' : '0');
      sonrisa.setAttribute('opacity', abierto ? '0' : '1');

      const giro = Math.sin(t * 1.1) * 2.2 + (hablando ? Math.sin(t * 6.3) * nivel * 2.2 : 0);
      const sube = Math.sin(t * 2.0) * 1.6 - nivel * 2.5;
      cabeza.setAttribute('transform', `translate(0 ${sube.toFixed(2)}) rotate(${giro.toFixed(2)} 188 198)`);
      todo.setAttribute('transform', `translate(12 ${(Math.sin(t * 1.0 + 0.5) * 1.2).toFixed(2)})`);
      antena.setAttribute('r', (8.5 + (hablando ? nivel * 3.5 : Math.sin(t * 3) * 0.8)).toFixed(2));
    },
  };
}

// parpadeo cada ~3.4 s con un desfase pseudoaleatorio fijo (0 = abierto, 1 = cerrado)
function parpadeo(t) {
  const periodo = 3.4;
  const k = Math.floor(t / periodo);
  const azar = Math.abs(Math.sin(k * 91.7 + 3.1) * 43758.5453) % 1;
  const inicio = k * periodo + 0.4 + azar * 1.8;
  const d = t - inicio;
  return d >= 0 && d < 0.18 ? Math.sin((d / 0.18) * Math.PI) : 0;
}
