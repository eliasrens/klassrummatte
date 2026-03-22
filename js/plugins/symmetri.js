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
    // lines = antal symmetrilinjer; 0 = oändligt; -1 = inga
    const pool4 = [
      { shape: 'kvadrat',         lines: 4, label: 'kvadrat'           },
      { shape: 'rektangel',       lines: 2, label: 'rektangel'         },
      { shape: 'liksidig',        lines: 3, label: 'liksidig triangel'  },
      { shape: 'likbent',         lines: 1, label: 'likbent triangel'   },
      { shape: 'cirkel',          lines: 0, label: 'cirkel'             },
      { shape: 'romb',            lines: 2, label: 'romb'               },
      { shape: 'trapets-sym',     lines: 1, label: 'symmetrisk trapets' },
      { shape: 'trapets-asym',    lines: -1, label: 'trapets'           },
    ];
    const pool5 = [
      ...pool4,
      { shape: 'parallellogram',  lines: -1, label: 'parallellogram'   },
      { shape: 'oliksidig',       lines: -1, label: 'oliksidig triangel'},
      { shape: 'pentagon',        lines: 5,  label: 'femhörning'        },
    ];

    const pool = grade >= 5 ? pool5 : pool4;

    // Symmetrilinjer att rita (30% chans, bara arbetsblad – passar ej projektor)
    if (settings.isArbetsblad) {
      const drawPool = pool.filter(f => f.lines > 0);
      if (drawPool.length > 0 && Math.random() < 0.3) {
        const item = PluginUtils.pickRandom(drawPool);
        return {
          type: 'symmetri', questionType: 'draw-lines',
          shape: item.shape, label: item.label, lines: item.lines,
          answer: String(item.lines),
        };
      }
    }

    // ~30% chans för "identify-non-sym" (kräver icke-symmetriska figurer)
    const nonSymPool = pool.filter(f => f.lines === -1);
    const symPool = pool.filter(f => f.lines !== -1);
    if (nonSymPool.length > 0 && symPool.length >= 2 && Math.random() < 0.3) {
      return this._generateIdentifyNonSym(symPool, nonSymPool);
    }

    const item = PluginUtils.pickRandom(pool);

    let answer;
    if (item.lines === 0)       answer = 'Oändligt många';
    else if (item.lines === -1) answer = '0';
    else                        answer = String(item.lines);

    return { type: 'symmetri', shape: item.shape, label: item.label, lines: item.lines, answer };
  }

  // Neutrala namn som inte avslöjar symmetri/asymmetri
  static NEUTRAL_LABELS = {
    'kvadrat': 'kvadrat', 'rektangel': 'rektangel',
    'liksidig': 'triangel', 'likbent': 'triangel',
    'cirkel': 'cirkel', 'romb': 'romb',
    'trapets-sym': 'trapets', 'trapets-asym': 'trapets',
    'parallellogram': 'parallellogram', 'oliksidig': 'triangel',
    'pentagon': 'femhörning',
  };

  _generateIdentifyNonSym(symPool, nonSymPool) {
    // Välj 2 symmetriska + 1 icke-symmetrisk
    const shuffledSym = symPool.slice().sort(() => Math.random() - 0.5);
    const sym1 = shuffledSym[0];
    const sym2 = shuffledSym[1];
    const nonSym = PluginUtils.pickRandom(nonSymPool);

    // Blanda ordningen, placera icke-symmetrisk slumpmässigt
    const trio = [sym1, sym2, nonSym].sort(() => Math.random() - 0.5);
    const correctIndex = trio.indexOf(nonSym);
    const neutral = s => SymmetriPlugin.NEUTRAL_LABELS[s.shape] || s.label;

    return {
      type: 'symmetri',
      questionType: 'identify-non-sym',
      shapes: trio.map(f => f.shape),
      labels: trio.map(f => neutral(f)),
      correctIndex,
      answer: neutral(nonSym),
      shape: nonSym.shape,
    };
  }

  render(problem, container) {
    if (problem.questionType === 'draw-lines') {
      const wrap = document.createElement('div');
      wrap.className = 'sym-wrap';
      const q = document.createElement('p');
      q.className = 'sym-question';
      q.textContent = 'Rita symmetrilinjerna i figuren.';
      wrap.appendChild(q);
      wrap.appendChild(_buildSymmetriSVG(problem.shape));
      container.appendChild(wrap);
      return;
    }
    if (problem.questionType === 'identify-non-sym') {
      const wrap = document.createElement('div');
      wrap.className = 'sym-wrap';
      const q = document.createElement('p');
      q.className = 'sym-question';
      q.textContent = 'Vilken figur är inte symmetrisk?';
      wrap.appendChild(q);
      const row = document.createElement('div');
      row.className = 'sym-trio';
      problem.shapes.forEach((shape, i) => {
        const cell = document.createElement('div');
        cell.className = 'sym-trio-cell';
        cell.appendChild(_buildSymmetriSVG(shape));
        const lbl = document.createElement('span');
        lbl.className = 'sym-trio-label';
        lbl.textContent = (i + 1) + '. ' + problem.labels[i];
        cell.appendChild(lbl);
        row.appendChild(cell);
      });
      wrap.appendChild(row);
      container.appendChild(wrap);
      return;
    }
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
    if (problem.questionType === 'identify-non-sym') {
      // Markera rätt figur
      const cells = container.querySelectorAll('.sym-trio-cell');
      if (cells[problem.correctIndex]) {
        cells[problem.correctIndex].classList.add('sym-trio-cell--correct');
      }
      PluginUtils.appendAnswerBox(problem.answer, container);
      return;
    }
    PluginUtils.appendAnswerBox(problem.answer, container);
  }

  isSameProblem(a, b) {
    if (a.questionType !== b.questionType) return false;
    if (a.questionType === 'identify-non-sym') return a.answer === b.answer;
    return a.shape === b.shape && a.questionType === b.questionType;
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

  } else if (shape === 'trapets-asym') {
    // Asymmetrisk trapets (övre sida förskjuten)
    inner = `<polygon points="30,172 250,172 210,48 100,48" fill="#fef3c7" stroke="#e9c46a" stroke-width="3"/>`;

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
