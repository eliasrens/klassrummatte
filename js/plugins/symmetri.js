// js/plugins/symmetri.js
// Åk 1–5: symmetrilinjer i enkla figurer

class SymmetriPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'symmetri';
  }

  generate(settings) {
    const grade = settings.grade;

    // Pool: { shape, lines, label }
    // lines = antal symmetrilinjer
    const pool4 = [
      { shape: 'kvadrat',         lines: 4, label: 'kvadrat'           },
      { shape: 'rektangel',       lines: 2, label: 'rektangel'         },
      { shape: 'liksidig',        lines: 3, label: 'liksidig triangel'  },
      { shape: 'likbent',         lines: 1, label: 'likbent triangel'   },
      { shape: 'cirkel',          lines: 0, label: 'cirkel'             }, // 0 = oändligt
      { shape: 'romb',            lines: 2, label: 'romb'               },
      { shape: 'trapets-sym',     lines: 1, label: 'symmetrisk trapets' },
    ];
    const pool5 = [
      ...pool4,
      { shape: 'parallellogram',  lines: -1, label: 'parallellogram'   }, // -1 = inga
      { shape: 'oliksidig',       lines: -1, label: 'oliksidig triangel'},
      { shape: 'pentagon',        lines: 5,  label: 'femhörning'        },
    ];

    const item = PluginUtils.pickRandom(grade >= 5 ? pool5 : pool4);

    let answer;
    if (item.lines === 0)       answer = 'Oändligt många';
    else if (item.lines === -1) answer = '0';
    else                        answer = String(item.lines);

    return { type: 'symmetri', shape: item.shape, label: item.label, lines: item.lines, answer };
  }

  render(problem, container) {
    const wrap = document.createElement('div');
    wrap.className = 'sym-wrap';
    wrap.appendChild(_buildSymmetriSVG(problem.shape));
    const q = document.createElement('p');
    q.className = 'sym-question';
    q.textContent = 'Hur många symmetrilinjer har figuren?';
    wrap.appendChild(q);
    container.appendChild(wrap);
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    PluginUtils.appendAnswerBox(problem.answer, container);
  }

  isSameProblem(a, b) {
    return a.shape === b.shape;
  }
}

// =========================================================
//  SVG-figurer för symmetri (privat)
// =========================================================
function _buildSymmetriSVG(shape) {
  const W = 280, H = 200;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg   = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.classList.add('sym-svg');

  let inner = '';

  if (shape === 'kvadrat') {
    const s = 130, x = (W - s) / 2, y = (H - s) / 2;
    inner = `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#dbeafe" stroke="#457b9d" stroke-width="3" rx="2"/>`;

  } else if (shape === 'rektangel') {
    const rw = 200, rh = 100, x = (W - rw) / 2, y = (H - rh) / 2;
    inner = `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="#dbeafe" stroke="#457b9d" stroke-width="3" rx="2"/>`;

  } else if (shape === 'liksidig') {
    // Bas=160, höjd≈139
    inner = `<polygon points="60,180 220,180 140,41" fill="#dcfce7" stroke="#2a9d8f" stroke-width="3"/>`;

  } else if (shape === 'likbent') {
    inner = `<polygon points="40,178 240,178 140,48" fill="#dcfce7" stroke="#2a9d8f" stroke-width="3"/>`;

  } else if (shape === 'oliksidig') {
    inner = `<polygon points="35,178 235,178 190,52" fill="#dcfce7" stroke="#2a9d8f" stroke-width="3"/>`;

  } else if (shape === 'romb') {
    inner = `<polygon points="140,20 248,100 140,180 32,100" fill="#fde8d8" stroke="#c2410c" stroke-width="3"/>`;

  } else if (shape === 'parallellogram') {
    inner = `<polygon points="60,172 200,172 220,40 80,40" fill="#fef3c7" stroke="#e9c46a" stroke-width="3"/>`;

  } else if (shape === 'trapets-sym') {
    // Symmetrisk trapets (övre sida kortare, centrerad)
    inner = `<polygon points="40,172 240,172 200,48 80,48" fill="#fef3c7" stroke="#e9c46a" stroke-width="3"/>`;

  } else if (shape === 'cirkel') {
    inner = `<circle cx="140" cy="100" r="88" fill="#fef9c3" stroke="#ca8a04" stroke-width="3"/>`;

  } else if (shape === 'pentagon') {
    // Regelbunden femhörning
    const cx = 140, cy = 105, r = 85;
    const pts = Array.from({ length: 5 }, (_, i) => {
      const angle = (i * 72 - 90) * Math.PI / 180;
      return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
    }).join(' ');
    inner = `<polygon points="${pts}" fill="#ede9fe" stroke="#7c3aed" stroke-width="3"/>`;
  }

  svg.innerHTML = inner;
  return svg;
}

PluginManager.register(new SymmetriPlugin());
