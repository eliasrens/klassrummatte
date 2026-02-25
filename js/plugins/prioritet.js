// js/plugins/prioritet.js

class PrioritetPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'prioritet';
  }

  generate(settings) {
    const grade     = settings.grade;
    const useParens = grade >= 5 && Math.random() < 0.5;
    const maxFactor = grade <= 3 ? 9 : grade <= 5 ? 12 : 20;

    for (let attempt = 0; attempt < 30; attempt++) {
      let expr, answer;

      if (!useParens) {
        const a = PluginUtils.randInt(2, maxFactor);
        const b = PluginUtils.randInt(2, maxFactor);
        const c = PluginUtils.randInt(2, maxFactor);
        const t = PluginUtils.randInt(0, 3);
        if      (t === 0)              { expr = `${c} + ${a} · ${b}`;  answer = c + a * b; }
        else if (t === 1)              { expr = `${a} · ${b} + ${c}`;  answer = a * b + c; }
        else if (t === 2 && c > a * b) { expr = `${c} − ${a} · ${b}`; answer = c - a * b; }
        else if (t === 3 && a * b > c) { expr = `${a} · ${b} − ${c}`; answer = a * b - c; }
        else continue;
      } else {
        const a = PluginUtils.randInt(2, maxFactor);
        const b = PluginUtils.randInt(2, maxFactor);
        const c = PluginUtils.randInt(2, maxFactor);
        const t = PluginUtils.randInt(0, 4);
        if      (t === 0)          { expr = `(${a} + ${b}) · ${c}`;   answer = (a + b) * c; }
        else if (t === 1)          { expr = `${a} · (${b} + ${c})`;   answer = a * (b + c); }
        else if (t === 2 && a > b) { expr = `(${a} − ${b}) · ${c}`;   answer = (a - b) * c; }
        else if (t === 3 && a > b) { expr = `${c} · (${a} − ${b})`;   answer = c * (a - b); }
        else if (t === 4) {
          const mult = PluginUtils.randInt(2, 9);
          const sum  = c * mult;
          const da   = PluginUtils.randInt(1, sum - 1);
          expr = `(${da} + ${sum - da}) ÷ ${c}`;
          answer = mult;
        }
        else continue;
      }

      if (answer !== undefined && answer > 0 && Number.isInteger(answer)) {
        return { type: 'prioritet', expression: expr, answer, hasParentheses: useParens };
      }
    }

    return { type: 'prioritet', expression: '3 + 4 · 2', answer: 11, hasParentheses: false };
  }

  render(problem, container) {
    const wrap = document.createElement('div');
    wrap.className = 'prioritet-display';
    const expr = document.createElement('span');
    expr.className = 'prioritet-expr';
    expr.textContent = `${problem.expression} =`;
    wrap.appendChild(expr);
    const ans = document.createElement('span');
    ans.className = 'answer-value answer-hidden';
    ans.textContent = ` ${problem.answer}`;
    wrap.appendChild(ans);
    container.appendChild(wrap);
  }

  isSameProblem(a, b) {
    return a.expression === b.expression;
  }
}

PluginManager.register(new PrioritetPlugin());
