// js/plugins/sannolikhet.js
// Åk 5–6: sannolikhet – bråk, jämförelse, sannolikhetsord

class SannolikhetPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'sannolikhet';
  }

  generate(settings) {
    const qt = PluginUtils.pickRandom(['frac', 'frac', 'word', 'compare']);
    if (qt === 'frac')    return this._genFrac();
    if (qt === 'word')    return this._genWord();
    return this._genCompare();
  }

  // "En påse har r röda och b blå kulor – hur sannolikt att dra röd?" → r/total
  _genFrac() {
    const totals = [6, 8, 10, 12];
    const total  = PluginUtils.pickRandom(totals);
    const red    = PluginUtils.randInt(1, total - 1);
    const blue   = total - red;
    const g      = PluginUtils.gcd(red, total);
    const answer = red === total ? '1' : g > 1 ? `${red/g}/${total/g}` : `${red}/${total}`;
    return { type: 'sannolikhet', questionType: 'frac', red, blue, total, answer };
  }

  // Välj rätt sannolikhetsord
  _genWord() {
    const scenarios = [
      { text: 'En tärning visar 7.',              answer: 'Omöjligt'        },
      { text: 'En tärning visar ett tal under 7.',answer: 'Säkert'          },
      { text: 'Kasta krona med ett mynt.',        answer: 'Lika sannolikt'  },
      { text: 'En tärning visar en 6.',           answer: 'Osannolikt'      },
      { text: 'En tärning visar ett jämnt tal.',  answer: 'Lika sannolikt'  },
      { text: 'Du drar en röd kula ur en påse med 9 röda och 1 blå.', answer: 'Sannolikt' },
      { text: 'Du drar en blå kula ur en påse med 9 röda och 1 blå.', answer: 'Osannolikt' },
      { text: 'En tärning visar mer än 1.',        answer: 'Sannolikt'      },
      { text: 'En tärning visar 0.',               answer: 'Omöjligt'       },
    ];
    const s = PluginUtils.pickRandom(scenarios);
    return { type: 'sannolikhet', questionType: 'word', text: s.text, answer: s.answer };
  }

  // Vilket är mest sannolikt?
  _genCompare() {
    const pairs = [
      {
        a: { label: 'Tärningen visar en 6', red: 1, total: 6 },
        b: { label: 'Tärningen visar ett jämnt tal', red: 3, total: 6 },
        answer: 'Tärningen visar ett jämnt tal',
      },
      {
        a: { label: '3 röda av 10 kulor', red: 3, total: 10 },
        b: { label: '7 röda av 10 kulor', red: 7, total: 10 },
        answer: '7 röda av 10 kulor',
      },
      {
        a: { label: '1 röd av 4 kulor', red: 1, total: 4 },
        b: { label: '2 röda av 4 kulor', red: 2, total: 4 },
        answer: '2 röda av 4 kulor',
      },
      {
        a: { label: '5 röda av 8 kulor', red: 5, total: 8 },
        b: { label: '3 röda av 8 kulor', red: 3, total: 8 },
        answer: '5 röda av 8 kulor',
      },
    ];
    const p = PluginUtils.pickRandom(pairs);
    return { type: 'sannolikhet', questionType: 'compare', a: p.a, b: p.b, answer: p.answer };
  }

  render(problem, container) {
    if (problem.questionType === 'frac') {
      container.appendChild(_buildKulpase(problem.red, problem.blue));
      const q = document.createElement('p');
      q.className = 'sann-question';
      q.innerHTML = `Påsen har ${problem.red} röda och ${problem.blue} blå kulor.<br>Hur sannolikt är det att du drar en röd kula?`;
      container.appendChild(q);

    } else if (problem.questionType === 'word') {
      const q = document.createElement('p');
      q.className = 'sann-question';
      q.textContent = problem.text;
      container.appendChild(q);
      const hint = document.createElement('p');
      hint.className = 'sann-hint';
      hint.innerHTML = 'Omöjligt<br>Osannolikt<br>Lika sannolikt<br>Sannolikt<br>Säkert';
      container.appendChild(hint);

    } else {
      // compare
      const wrap = document.createElement('div');
      wrap.className = 'sann-compare-wrap';
      const q = document.createElement('p');
      q.className = 'sann-question';
      q.textContent = 'Vilket är mest sannolikt?';
      wrap.appendChild(q);
      const row = document.createElement('div');
      row.className = 'sann-compare-row';
      [problem.a, problem.b].forEach(opt => {
        const col = document.createElement('div');
        col.className = 'sann-compare-col';
        col.appendChild(_buildKulpase(opt.red, opt.total - opt.red));
        const lbl = document.createElement('p');
        lbl.className = 'sann-col-label';
        lbl.textContent = opt.label;
        col.appendChild(lbl);
        row.appendChild(col);
      });
      wrap.appendChild(row);
      container.appendChild(wrap);
    }
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    PluginUtils.appendAnswerBox(problem.answer, container);
  }

  isSameProblem(a, b) {
    if (a.questionType !== b.questionType) return false;
    if (a.questionType === 'frac') return a.red === b.red && a.total === b.total;
    return a.answer === b.answer;
  }
}

// =========================================================
//  SVG-kulpåse (privat)
// =========================================================
function _buildKulpase(red, blue) {
  const total  = red + blue;
  const cols   = Math.min(total, 6);
  const rows   = Math.ceil(total / cols);
  const r      = 14;
  const gap    = 6;
  const W      = cols * (r * 2 + gap) + gap;
  const H      = rows * (r * 2 + gap) + gap;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg   = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.classList.add('sann-kulor-svg');

  let content = '';
  for (let i = 0; i < total; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx  = gap + r + col * (r * 2 + gap);
    const cy  = gap + r + row * (r * 2 + gap);
    const fill = i < red ? '#e63946' : '#457b9d';
    content += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="white" stroke-width="1.5"/>`;
  }

  svg.innerHTML = content;
  return svg;
}

PluginManager.register(new SannolikhetPlugin());
