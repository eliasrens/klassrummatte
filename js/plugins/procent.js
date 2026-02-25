// js/plugins/procent.js
// Procent, bråkform och decimalform (Åk 4–6).
// Frågetyper: procent↔bråk, procent↔decimal (åk 5+).

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

class ProcentPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'procent';
  }

  generate(settings) {
    const grade  = Math.max(settings.grade, 4); // procent börjar åk 4
    const values = grade >= 5 ? PROCENT_FULL : PROCENT_SIMPLE;
    const val    = PluginUtils.pickRandom(values);
    const [num, den] = val.fraction;
    const decStr = String(val.decimal).replace('.', ',');
    const types  = grade >= 5
      ? ['pct-to-frac', 'pct-to-dec', 'frac-to-pct', 'dec-to-pct']
      : ['pct-to-frac', 'frac-to-pct'];
    const questionType = PluginUtils.pickRandom(types);
    const fracStr = `${num}/${den}`;
    const pctStr  = `${val.percent}%`;
    const answer  = questionType === 'pct-to-frac' ? fracStr
                  : questionType === 'pct-to-dec'  ? decStr
                  : pctStr;
    return { type: 'procent', questionType, percent: val.percent, numerator: num, denominator: den, decimal: val.decimal, decStr, answer };
  }

  render(problem, container) {
    const { questionType, percent, numerator, denominator, decStr } = problem;

    if (questionType === 'pct-to-frac') {
      PluginUtils.appendText(container, `${percent}% = `);
      const frac = PluginUtils.buildFractionEl(numerator, denominator);
      frac.classList.add('answer-value', 'answer-hidden');
      container.appendChild(frac);

    } else if (questionType === 'pct-to-dec') {
      PluginUtils.appendText(container, `${percent}% = `);
      const ans = document.createElement('span');
      ans.className = 'answer-value answer-hidden';
      ans.textContent = decStr;
      container.appendChild(ans);

    } else if (questionType === 'frac-to-pct') {
      container.appendChild(PluginUtils.buildFractionEl(numerator, denominator));
      PluginUtils.appendText(container, ' = ');
      const ans = document.createElement('span');
      ans.className = 'answer-value answer-hidden';
      ans.textContent = `${percent}%`;
      container.appendChild(ans);

    } else { // dec-to-pct
      PluginUtils.appendText(container, `${decStr} = `);
      const ans = document.createElement('span');
      ans.className = 'answer-value answer-hidden';
      ans.textContent = `${percent}%`;
      container.appendChild(ans);
    }
  }

  isSameProblem(a, b) {
    return a.questionType === b.questionType && a.percent === b.percent;
  }
}

PluginManager.register(new ProcentPlugin());
