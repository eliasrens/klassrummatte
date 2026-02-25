// js/plugins/tallinje.js
// Tallinje med ett saknat tal (Åk 1–3).

class TallinjPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'tallinje';
  }

  generate(settings) {
    const grade = Math.min(settings.grade, 3);

    // Stegstorlek per årskurs
    const stepOptions = grade <= 1 ? [1]
      : grade <= 2               ? [1, 2, 5, 10]
      :                            [2, 5, 10, 100];
    const step = PluginUtils.pickRandom(stepOptions);

    // Maxvärde och sekvensens längd
    const maxNum = grade <= 1 ? 20 : grade <= 2 ? 100 : 1000;
    const length = grade <= 1 ? 5 : 6;

    // Startpunkt (multipel av steget, så att ingen siffra överstiger maxNum)
    const maxStart = maxNum - step * (length - 1);
    const startBase = Math.floor(PluginUtils.randInt(0, Math.max(0, maxStart)) / step) * step;

    // Blanktecknets position: inte på första platsen (elever behöver se startvärdet)
    const blankIndex = PluginUtils.randInt(1, length - 1);

    const sequence = [];
    for (let i = 0; i < length; i++) sequence.push(startBase + i * step);

    const answer = sequence[blankIndex];
    const display = sequence.map((v, i) => i === blankIndex ? null : v);

    return { type: 'tallinje', display, answer, step };
  }

  render(problem, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'tallinje-display';

    const seq = document.createElement('div');
    seq.className = 'tallinje-sequence';

    problem.display.forEach((val, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'tallinje-sep';
        sep.textContent = ',';
        seq.appendChild(sep);
      }
      const box = document.createElement('div');
      box.className = 'tallinje-box';
      if (val === null) {
        const blank = document.createElement('span');
        blank.className = 'open-blank tallinje-blank';
        blank.style.minWidth = '1.2em';
        box.appendChild(blank);
      } else {
        box.textContent = val;
      }
      seq.appendChild(box);
    });

    const q = document.createElement('p');
    q.className = 'tallinje-question';
    q.textContent = 'Vilket tal saknas?';

    wrapper.appendChild(seq);
    wrapper.appendChild(q);
    container.appendChild(wrapper);
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    const blank = container.querySelector('.tallinje-blank');
    if (blank) {
      blank.textContent = problem.answer;
      blank.classList.add('open-blank--answered');
    }
  }

  isSameProblem(a, b) {
    return a.answer === b.answer && a.display[0] === b.display[0] && a.step === b.step;
  }
}

PluginManager.register(new TallinjPlugin());
