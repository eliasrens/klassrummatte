// js/plugins/brak.js

class BrakPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'brak';
  }

  generate(settings) {
    const grade = settings.grade;
    const level = PluginUtils.cfg(grade).fractions;

    if (!level || level === 'intro') {
      const options = [[1,2],[1,4],[3,4],[1,3],[2,3],[1,5],[2,5],[3,5]];
      const [num, den] = PluginUtils.pickRandom(options);
      return { type: 'brak', questionType: 'name', numerator: num, denominator: den, answer: `${num}/${den}` };
    }

    if (level === 'same-den') {
      const den = PluginUtils.pickRandom([2,3,4,5,6,8,10]);
      const a   = PluginUtils.randInt(1, Math.max(1, den - 2));
      const b   = PluginUtils.randInt(1, den - a);
      return { type: 'brak', questionType: 'add-same-den', a, b, denominator: den, numerator: a + b, answer: `${a + b}/${den}` };
    }

    // diff-den / full (åk 5–6)
    const dens = [2,3,4,5,6,8,10];
    const den1 = PluginUtils.pickRandom(dens);
    const den2 = PluginUtils.pickRandom(dens.filter(d => d !== den1));
    const num1 = PluginUtils.randInt(1, den1 - 1);
    const num2 = PluginUtils.randInt(1, den2 - 1);
    const LCD  = PluginUtils.lcm(den1, den2);
    const ansN = num1 * (LCD / den1) + num2 * (LCD / den2);
    const g    = PluginUtils.gcd(ansN, LCD);
    return {
      type: 'brak', questionType: 'add-diff-den',
      a: { numerator: num1, denominator: den1 },
      b: { numerator: num2, denominator: den2 },
      answer: g > 1 ? `${ansN/g}/${LCD/g}` : `${ansN}/${LCD}`,
    };
  }

  render(problem, container) {
    if (problem.questionType === 'name') {
      container.appendChild(PluginUtils.buildFractionEl(problem.numerator, problem.denominator));
      PluginUtils.appendText(container, ' =');
    } else if (problem.questionType === 'add-same-den') {
      container.appendChild(PluginUtils.buildFractionEl(problem.a, problem.denominator));
      PluginUtils.appendText(container, ' + ');
      container.appendChild(PluginUtils.buildFractionEl(problem.b, problem.denominator));
      PluginUtils.appendText(container, ' =');
    } else {
      container.appendChild(PluginUtils.buildFractionEl(problem.a.numerator, problem.a.denominator));
      PluginUtils.appendText(container, ' + ');
      container.appendChild(PluginUtils.buildFractionEl(problem.b.numerator, problem.b.denominator));
      PluginUtils.appendText(container, ' =');
    }
    const ans = document.createElement('span');
    ans.className = 'answer-value answer-hidden';
    ans.textContent = ` ${problem.answer}`;
    container.appendChild(ans);
  }

  isSameProblem(a, b) {
    return a.answer === b.answer && a.questionType === b.questionType;
  }
}

PluginManager.register(new BrakPlugin());
