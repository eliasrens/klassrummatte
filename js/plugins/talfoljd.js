// js/plugins/talfoljd.js
// Talföljder och mönster (Åk 1–6).

class TalfoljdPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'talfoljd';
  }

  generate(settings) {
    const grade = settings.grade;
    let ruleType, ruleValue, start;
    const length = 5;

    if (grade <= 2) {
      ruleType  = '+';
      ruleValue = PluginUtils.pickRandom([1, 2, 5, 10]);
      start     = PluginUtils.randInt(0, 15);
    } else if (grade <= 4) {
      if (Math.random() < 0.6) {
        ruleType  = '+';
        ruleValue = PluginUtils.pickRandom([2, 3, 4, 5, 10, 25, 100]);
        start     = PluginUtils.randInt(0, 20);
      } else {
        ruleType  = '\u00d7';
        ruleValue = PluginUtils.pickRandom([2, 3, 5, 10]);
        start     = PluginUtils.randInt(1, 5);
      }
    } else {
      ruleType  = PluginUtils.pickRandom(['+', '\u00d7', '\u2212']);
      if (ruleType === '+') {
        ruleValue = PluginUtils.pickRandom([3, 4, 5, 6, 7, 8, 9, 11, 15, 20, 50]);
        start     = PluginUtils.randInt(0, 50);
      } else if (ruleType === '\u00d7') {
        ruleValue = PluginUtils.pickRandom([2, 3, 4, 5]);
        start     = PluginUtils.randInt(1, 5);
      } else {
        ruleValue = PluginUtils.pickRandom([2, 3, 5, 10]);
        start     = ruleValue * PluginUtils.randInt(5, 15);
      }
    }

    // Bygg sekvensen
    const sequence = [start];
    for (let i = 1; i < length; i++) {
      const prev = sequence[i - 1];
      if      (ruleType === '+')       sequence.push(prev + ruleValue);
      else if (ruleType === '\u2212')  sequence.push(prev - ruleValue);
      else                             sequence.push(prev * ruleValue);
    }

    // Frågetyp: åk 1–2 bara next/missing, äldre även rule
    const qtOpts = grade <= 2 ? ['next', 'missing']
                              : ['next', 'missing', 'rule'];
    const qt = PluginUtils.pickRandom(qtOpts);
    const ruleStr = `${ruleType}\u00a0${ruleValue}`;

    if (qt === 'next') {
      return { type: 'talfoljd', questionType: 'next', sequence, answer: String(_nextVal(ruleType, ruleValue, sequence[length - 1])) };
    }
    if (qt === 'missing') {
      const blankIdx = PluginUtils.randInt(1, length - 2); // inte första/sista
      const display  = sequence.map((v, i) => i === blankIdx ? null : v);
      return { type: 'talfoljd', questionType: 'missing', display, sequence, answer: String(sequence[blankIdx]) };
    }
    // rule
    return { type: 'talfoljd', questionType: 'rule', sequence, answer: ruleStr };
  }

  render(problem, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'tallinje-display';

    const seq = document.createElement('div');
    seq.className = 'tallinje-sequence';

    const qt    = problem.questionType;
    const terms = qt === 'next'    ? [...problem.sequence, null]
                : qt === 'missing' ? problem.display
                :                    problem.sequence;

    terms.forEach((val, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'tallinje-sep';
        sep.textContent = ',\u00a0';
        seq.appendChild(sep);
      }
      const box = document.createElement('span');
      box.className = 'tallinje-box';
      if (val === null) {
        const blank = document.createElement('span');
        blank.className = 'open-blank tallinje-blank';
        box.appendChild(blank);
      } else {
        box.textContent = val;
      }
      seq.appendChild(box);
    });

    const q = document.createElement('p');
    q.className = 'tallinje-question';
    if (qt === 'next')    q.textContent = 'Vad är nästa tal?';
    else if (qt === 'missing') q.textContent = 'Vilket tal saknas?';
    else                  q.textContent = 'Vad är regeln?';

    wrapper.appendChild(seq);
    wrapper.appendChild(q);
    container.appendChild(wrapper);
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    if (problem.questionType === 'rule') {
      PluginUtils.appendAnswerBox(problem.answer, container);
      return;
    }
    const blank = container.querySelector('.tallinje-blank');
    if (blank) {
      blank.textContent = problem.answer;
      blank.classList.add('open-blank--answered');
    }
  }

  isSameProblem(a, b) {
    if (a.questionType !== b.questionType) return false;
    return a.sequence[0] === b.sequence[0] && a.answer === b.answer;
  }
}

function _nextVal(ruleType, ruleValue, last) {
  if (ruleType === '+')       return last + ruleValue;
  if (ruleType === '\u2212')  return last - ruleValue;
  return last * ruleValue;
}

PluginManager.register(new TalfoljdPlugin());
