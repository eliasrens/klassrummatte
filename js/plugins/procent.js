// js/plugins/procent.js
// Procent, bråkform och decimalform (Åk 4–6).

// Tabeller för procent ↔ bråk ↔ decimal (omvandling)
const PROCENT_SIMPLE = [
  { percent: 10,  fraction: [1, 10], decimal: 0.1  },
  { percent: 25,  fraction: [1, 4],  decimal: 0.25 },
  { percent: 50,  fraction: [1, 2],  decimal: 0.5  },
  { percent: 75,  fraction: [3, 4],  decimal: 0.75 },
  { percent: 100, fraction: [1, 1],  decimal: 1.0  },
];

const PROCENT_FULL = [
  { percent: 10,  fraction: [1, 10], decimal: 0.1  },
  { percent: 20,  fraction: [1, 5],  decimal: 0.2  },
  { percent: 25,  fraction: [1, 4],  decimal: 0.25 },
  { percent: 30,  fraction: [3, 10], decimal: 0.3  },
  { percent: 40,  fraction: [2, 5],  decimal: 0.4  },
  { percent: 50,  fraction: [1, 2],  decimal: 0.5  },
  { percent: 60,  fraction: [3, 5],  decimal: 0.6  },
  { percent: 70,  fraction: [7, 10], decimal: 0.7  },
  { percent: 75,  fraction: [3, 4],  decimal: 0.75 },
  { percent: 80,  fraction: [4, 5],  decimal: 0.8  },
  { percent: 90,  fraction: [9, 10], decimal: 0.9  },
  { percent: 100, fraction: [1, 1],  decimal: 1.0  },
];

// Tabell: procent av heltal – alltid heltalssvar
const PCT_OF_WHOLE_SIMPLE = [
  { percent: 10, wholes: [10, 20, 30, 40, 50, 60, 70, 80, 100] },
  { percent: 25, wholes: [4, 8, 12, 16, 20, 24, 40, 60, 80, 100] },
  { percent: 50, wholes: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 30, 40, 50] },
];

const PCT_OF_WHOLE_FULL = [
  { percent: 10, wholes: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200] },
  { percent: 20, wholes: [5, 10, 15, 20, 25, 30, 35, 40, 50, 100] },
  { percent: 25, wholes: [4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 60, 80, 100] },
  { percent: 50, wholes: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 30, 40, 50, 100] },
  { percent: 75, wholes: [4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 60, 80] },
];

// Tabell: baklänges-procent (åk 6) – origPris × (1 − pct/100) = slutPris
// originals = möjliga ursprungspriser (ger jämna slutpriser)
const PCT_REVERSE = [
  { percent: 10, originals: [10, 20, 30, 40, 50, 60, 70, 80, 100, 200] },
  { percent: 20, originals: [5, 10, 15, 20, 25, 30, 40, 50, 100] },
  { percent: 25, originals: [4, 8, 12, 16, 20, 24, 40, 60, 80, 100, 200] },
  { percent: 50, originals: [2, 4, 6, 8, 10, 20, 30, 40, 50, 100] },
];

class ProcentPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'procent';
  }

  generate(settings) {
    const grade = Math.max(settings.grade, 4); // procent börjar åk 4

    if (grade >= 6) {
      const qt = PluginUtils.pickRandom([
        'pct-to-frac', 'pct-to-dec', 'frac-to-pct', 'dec-to-pct',
        'pct-of-whole', 'part-to-pct', 'reverse-pct',
      ]);
      return this._genByType(qt, grade);
    }

    if (grade >= 5) {
      const qt = PluginUtils.pickRandom([
        'pct-to-frac', 'pct-to-dec', 'frac-to-pct', 'dec-to-pct',
        'pct-of-whole', 'part-to-pct',
      ]);
      return this._genByType(qt, grade);
    }

    // åk 4
    const qt = PluginUtils.pickRandom(['pct-to-frac', 'frac-to-pct', 'pct-of-whole']);
    return this._genByType(qt, grade);
  }

  _genByType(qt, grade) {
    switch (qt) {
      case 'pct-to-frac':
      case 'pct-to-dec':
      case 'frac-to-pct':
      case 'dec-to-pct':    return this._genConvert(qt, grade);
      case 'pct-of-whole':  return this._genPctOfWhole(grade);
      case 'part-to-pct':   return this._genPartToPct(grade);
      case 'reverse-pct':   return this._genReversePct();
      default:              return this._genConvert('pct-to-frac', grade);
    }
  }

  _genConvert(qt, grade) {
    const values = grade >= 5 ? PROCENT_FULL : PROCENT_SIMPLE;
    const val    = PluginUtils.pickRandom(values);
    const [num, den] = val.fraction;
    const decStr = String(val.decimal).replace('.', ',');
    const fracStr = `${num}/${den}`;
    const pctStr  = `${val.percent}%`;
    const answer  = qt === 'pct-to-frac' ? fracStr
                  : qt === 'pct-to-dec'  ? decStr
                  : pctStr;
    return { type: 'procent', questionType: qt, percent: val.percent, numerator: num, denominator: den, decimal: val.decimal, decStr, answer };
  }

  _genPctOfWhole(grade) {
    const table  = grade >= 5 ? PCT_OF_WHOLE_FULL : PCT_OF_WHOLE_SIMPLE;
    const row    = PluginUtils.pickRandom(table);
    const whole  = PluginUtils.pickRandom(row.wholes);
    const part   = (row.percent * whole) / 100;
    return { type: 'procent', questionType: 'pct-of-whole', percent: row.percent, whole, answer: String(part) };
  }

  _genPartToPct(grade) {
    const table  = grade >= 5 ? PCT_OF_WHOLE_FULL : PCT_OF_WHOLE_SIMPLE;
    const row    = PluginUtils.pickRandom(table);
    const whole  = PluginUtils.pickRandom(row.wholes);
    const part   = (row.percent * whole) / 100;
    return { type: 'procent', questionType: 'part-to-pct', percent: row.percent, whole, part, answer: `${row.percent}%` };
  }

  _genReversePct() {
    const row    = PluginUtils.pickRandom(PCT_REVERSE);
    const orig   = PluginUtils.pickRandom(row.originals);
    const final_ = orig * (1 - row.percent / 100);
    return { type: 'procent', questionType: 'reverse-pct', percent: row.percent, originalPrice: orig, finalPrice: final_, answer: `${orig} kr` };
  }

  // ── Render ────────────────────────────────────────────────

  render(problem, container) {
    const { questionType: qt } = problem;

    if (qt === 'pct-to-frac') {
      PluginUtils.appendText(container, `${problem.percent}% = `);
      const frac = PluginUtils.buildFractionEl(problem.numerator, problem.denominator);
      frac.classList.add('answer-value', 'answer-hidden');
      container.appendChild(frac);

    } else if (qt === 'pct-to-dec') {
      PluginUtils.appendText(container, `${problem.percent}% = `);
      const ans = document.createElement('span');
      ans.className = 'answer-value answer-hidden';
      ans.textContent = problem.decStr;
      container.appendChild(ans);

    } else if (qt === 'frac-to-pct') {
      container.appendChild(PluginUtils.buildFractionEl(problem.numerator, problem.denominator));
      PluginUtils.appendText(container, ' = ');
      const ans = document.createElement('span');
      ans.className = 'answer-value answer-hidden';
      ans.textContent = `${problem.percent}%`;
      container.appendChild(ans);

    } else if (qt === 'dec-to-pct') {
      PluginUtils.appendText(container, `${problem.decStr} = `);
      const ans = document.createElement('span');
      ans.className = 'answer-value answer-hidden';
      ans.textContent = `${problem.percent}%`;
      container.appendChild(ans);

    } else if (qt === 'pct-of-whole') {
      PluginUtils.appendText(container, `Vad\u00a0är\u00a0${problem.percent}%\u00a0av\u00a0${problem.whole}?\u00a0=`);
      const ans = document.createElement('span');
      ans.className = 'answer-value answer-hidden';
      ans.textContent = `\u00a0${problem.answer}`;
      container.appendChild(ans);

    } else if (qt === 'part-to-pct') {
      PluginUtils.appendText(container, `${problem.part}\u00a0av\u00a0${problem.whole}\u00a0=`);
      const ans = document.createElement('span');
      ans.className = 'answer-value answer-hidden';
      ans.textContent = `\u00a0${problem.answer}`;
      container.appendChild(ans);

    } else if (qt === 'reverse-pct') {
      const p = document.createElement('p');
      p.className = 'text-problem';
      p.textContent = `Priset är ${problem.finalPrice} kr efter ${problem.percent}% rabatt. Vad var originalpriset?`;
      container.appendChild(p);
    }
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    const el = container.querySelector('.answer-value');
    if (el) {
      el.classList.remove('answer-hidden');
      return;
    }
    // reverse-pct saknar inline-svar – visa answer-box
    PluginUtils.appendAnswerBox(problem.answer, container);
  }

  isSameProblem(a, b) {
    if (a.questionType !== b.questionType) return false;
    return a.answer === b.answer;
  }
}

PluginManager.register(new ProcentPlugin());
