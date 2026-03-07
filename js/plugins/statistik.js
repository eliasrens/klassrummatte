// js/plugins/statistik.js
// Åk 4–6: läsa stapeldiagram, medelvärde, median, typvärde

const _STAT_TEMAN = [
  { kategori: 'Sport',    items: ['Fotboll', 'Simning', 'Tennis', 'Cykling', 'Löpning'] },
  { kategori: 'Djur',     items: ['Katter', 'Hundar', 'Fåglar', 'Fiskar', 'Kaniner'] },
  { kategori: 'Frukt',    items: ['Äpplen', 'Bananer', 'Apelsiner', 'Päron', 'Plommon'] },
  { kategori: 'Färger',   items: ['Röd', 'Blå', 'Grön', 'Gul', 'Lila'] },
  { kategori: 'Väder',    items: ['Sol', 'Moln', 'Regn', 'Snö', 'Åska'] },
];

class StatistikPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'statistik';
  }

  generate(settings) {
    const tema  = PluginUtils.pickRandom(_STAT_TEMAN);
    const n     = PluginUtils.randInt(4, 5);
    const items = tema.items.slice(0, n).map(lbl => ({ label: lbl, value: PluginUtils.randInt(2, 18) }));

    // Välj frågetyp baserat på åk
    const qtPool = ['read-val', 'read-val', 'most', 'least', 'diff'];
    if (settings.grade >= 5) qtPool.push('mean', 'mode');
    if (settings.grade >= 6) qtPool.push('median');
    const qt = PluginUtils.pickRandom(qtPool);

    return this._buildProblem(tema.kategori, items, qt);
  }

  _buildProblem(kategori, items, qt) {
    const vals = items.map(d => d.value);

    if (qt === 'read-val') {
      const target = PluginUtils.pickRandom(items);
      return {
        type: 'statistik', questionType: 'read-val',
        kategori, items,
        question: `Hur många röstar på "${target.label}"?`,
        answer: String(target.value),
      };
    }
    if (qt === 'most') {
      const max  = Math.max(...vals);
      const best = items.find(d => d.value === max);
      return {
        type: 'statistik', questionType: 'most',
        kategori, items,
        question: 'Vilket alternativ har flest?',
        answer: best.label,
      };
    }
    if (qt === 'least') {
      const min   = Math.min(...vals);
      const least = items.find(d => d.value === min);
      return {
        type: 'statistik', questionType: 'least',
        kategori, items,
        question: 'Vilket alternativ har minst?',
        answer: least.label,
      };
    }
    if (qt === 'diff') {
      const sorted = [...items].sort((a, b) => b.value - a.value);
      const diff   = sorted[0].value - sorted[1].value;
      return {
        type: 'statistik', questionType: 'diff',
        kategori, items,
        question: `Hur många fler har "${sorted[0].label}" än "${sorted[1].label}"?`,
        answer: String(diff),
      };
    }
    if (qt === 'mean') {
      const sum  = vals.reduce((a, b) => a + b, 0);
      const mean = parseFloat((sum / vals.length).toFixed(1));
      return {
        type: 'statistik', questionType: 'mean',
        kategori, items,
        question: 'Vad är medelvärdet?',
        answer: String(mean),
      };
    }
    if (qt === 'mode') {
      const freq = {};
      vals.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
      const maxF = Math.max(...Object.values(freq));
      const mode = vals.find(v => freq[v] === maxF);
      // Ensure a clear mode – regenerate if all unique
      if (maxF === 1) return this._buildProblem(kategori, items, 'mean');
      return {
        type: 'statistik', questionType: 'mode',
        kategori, items,
        question: 'Vad är typvärdet?',
        answer: String(mode),
      };
    }
    // median
    const sorted = [...vals].sort((a, b) => a - b);
    const mid    = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
    return {
      type: 'statistik', questionType: 'median',
      kategori, items,
      question: 'Vad är medianen?',
      answer: String(median),
    };
  }

  render(problem, container) {
    const wrap = document.createElement('div');
    wrap.className = 'stat-wrap';
    wrap.appendChild(_buildBarChart(problem.items, problem.kategori));
    const q = document.createElement('p');
    q.className = 'stat-question';
    q.textContent = problem.question;
    wrap.appendChild(q);
    container.appendChild(wrap);
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    PluginUtils.appendAnswerBox(problem.answer, container);
  }

  isSameProblem(a, b) {
    return a.questionType === b.questionType &&
           a.question === b.question &&
           a.items[0]?.value === b.items[0]?.value;
  }
}

// =========================================================
//  SVG-stapeldiagram (privat)
// =========================================================
function _buildBarChart(items, title) {
  const W     = 400, H = 210;
  const padL  = 34, padB = 42, padT = 16, padR = 12;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const n      = items.length;

  const maxVal  = Math.max(...items.map(d => d.value));
  const yMax    = Math.ceil(maxVal / 5) * 5 || 5;
  const barW    = (chartW / n) * 0.65;
  const barStep = chartW / n;
  const colors  = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261'];

  let c = '';

  // Y-tics + vågräta stödlinjer
  const ticks = 4;
  for (let i = 0; i <= ticks; i++) {
    const val = Math.round((yMax * i) / ticks);
    const y   = H - padB - (chartH * i / ticks);
    c += `<line x1="${padL - 4}" y1="${y.toFixed(1)}" x2="${padL}" y2="${y.toFixed(1)}"
                stroke="#1a1a2e" stroke-width="1.5"/>`;
    c += `<text x="${(padL - 6).toFixed(1)}" y="${y.toFixed(1)}"
                text-anchor="end" dominant-baseline="central"
                font-size="11" fill="#1a1a2e">${val}</text>`;
    if (i > 0) {
      c += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}"
                  stroke="#e5e7eb" stroke-width="1" stroke-dasharray="3,3"/>`;
    }
  }

  // Axlar
  c += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" stroke="#1a1a2e" stroke-width="2"/>`;
  c += `<line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" stroke="#1a1a2e" stroke-width="2"/>`;

  // Staplar
  items.forEach((item, i) => {
    const x    = padL + i * barStep + (barStep - barW) / 2;
    const barH = (item.value / yMax) * chartH;
    const y    = H - padB - barH;
    const fill = colors[i % colors.length];

    c += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}"
               width="${barW.toFixed(1)}" height="${barH.toFixed(1)}"
               fill="${fill}" rx="2"/>`;
    c += `<text x="${(x + barW / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}"
               text-anchor="middle" font-size="11" font-weight="600" fill="#1a1a2e">${item.value}</text>`;

    // X-etikett (bryt vid mellanslag om nödvändigt)
    const words = item.label.split(' ');
    words.forEach((word, wi) => {
      c += `<text x="${(x + barW / 2).toFixed(1)}" y="${(H - padB + 13 + wi * 12).toFixed(1)}"
                  text-anchor="middle" font-size="10" fill="#1a1a2e">${word}</text>`;
    });
  });

  // Titel
  c += `<text x="${(padL + chartW / 2).toFixed(1)}" y="${(padT - 2).toFixed(1)}"
              text-anchor="middle" font-size="11" font-weight="600" fill="#6b7280">${title}</text>`;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg   = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.classList.add('stat-chart-svg');
  svg.innerHTML = c;
  return svg;
}

PluginManager.register(new StatistikPlugin());
