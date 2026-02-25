// js/plugins/talsorter.js
// Talsorter – identifiera talsort för en markerad siffra (Åk 1–3).

const PLACE_NAMES = ['ental', 'tiotal', 'hundratal', 'tusental'];

class TalsorterPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'talsorter';
  }

  generate(settings) {
    const grade = Math.min(settings.grade, 3);

    let num;
    if (grade <= 1) {
      num = PluginUtils.randInt(11, 99);          // 2-siffrigt
    } else if (grade <= 2) {
      num = PluginUtils.pickRandom([
        () => PluginUtils.randInt(11, 99),
        () => PluginUtils.randInt(100, 999),
      ])();
    } else {
      num = PluginUtils.pickRandom([
        () => PluginUtils.randInt(100, 999),
        () => PluginUtils.randInt(1000, 9999),
      ])();
    }

    const numStr   = String(num);
    const maxPos   = numStr.length - 1;
    const digitPos = PluginUtils.randInt(0, maxPos); // 0=enheter, 1=tiotal …
    const targetDigit = Math.floor(num / Math.pow(10, digitPos)) % 10;

    return {
      type: 'talsorter',
      number: num,
      targetDigit,
      digitPosition: digitPos,
      answer: PLACE_NAMES[digitPos],
    };
  }

  render(problem, container) {
    const { number, digitPosition } = problem;
    const numStr       = String(number);
    const highlightIdx = numStr.length - 1 - digitPosition;

    const wrapper = document.createElement('div');
    wrapper.className = 'talsorter-wrapper';

    // Tal med markerad siffra
    const numDiv = document.createElement('div');
    numDiv.className = 'talsorter-display';
    [...numStr].forEach((digit, i) => {
      const span = document.createElement('span');
      if (i === highlightIdx) span.className = 'talsorter-highlight';
      span.textContent = digit;
      numDiv.appendChild(span);
    });

    const q = document.createElement('p');
    q.className = 'talsorter-question';
    q.textContent = 'Vilken talsort?';

    const ans = document.createElement('span');
    ans.className = 'answer-value answer-hidden talsorter-answer';
    ans.textContent = problem.answer;

    wrapper.appendChild(numDiv);
    wrapper.appendChild(q);
    wrapper.appendChild(ans);
    container.appendChild(wrapper);
  }

  isSameProblem(a, b) {
    return a.number === b.number && a.digitPosition === b.digitPosition;
  }
}

PluginManager.register(new TalsorterPlugin());
