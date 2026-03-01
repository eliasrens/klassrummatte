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

    // Tillgängliga räknesätt baserat på inställning och årskurs
    const rawOps   = settings.prioritetOps && settings.prioritetOps.length > 0
                     ? settings.prioritetOps : ['mult', 'div'];
    const availOps = grade < 3 ? rawOps.filter(o => o !== 'div') : rawOps;
    const ops      = availOps.length > 0 ? availOps : ['mult'];

    for (let attempt = 0; attempt < 30; attempt++) {
      let expr, answer;
      const op = PluginUtils.pickRandom(ops);

      if (!useParens) {
        if (op === 'mult') {
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
          // division: välj divisor och kvot, beräkna täljaren
          const divisor  = PluginUtils.randInt(2, Math.min(9, maxFactor));
          const quotient = PluginUtils.randInt(2, Math.floor(maxFactor / divisor));
          const dividend = divisor * quotient;
          const c        = PluginUtils.randInt(2, maxFactor);
          const t        = PluginUtils.randInt(0, 3);
          if      (t === 0)                { expr = `${c} + ${dividend} ÷ ${divisor}`;  answer = c + quotient; }
          else if (t === 1)                { expr = `${dividend} ÷ ${divisor} + ${c}`;  answer = quotient + c; }
          else if (t === 2 && c > quotient){ expr = `${c} − ${dividend} ÷ ${divisor}`; answer = c - quotient; }
          else if (t === 3 && quotient > c){ expr = `${dividend} ÷ ${divisor} − ${c}`; answer = quotient - c; }
          else continue;
        }
      } else {
        // Parenteser (åk 5+)
        if (op === 'mult') {
          const a = PluginUtils.randInt(2, maxFactor);
          const b = PluginUtils.randInt(2, maxFactor);
          const c = PluginUtils.randInt(2, maxFactor);
          const t = PluginUtils.randInt(0, 3);
          if      (t === 0)          { expr = `(${a} + ${b}) · ${c}`;  answer = (a + b) * c; }
          else if (t === 1)          { expr = `${a} · (${b} + ${c})`;  answer = a * (b + c); }
          else if (t === 2 && a > b) { expr = `(${a} − ${b}) · ${c}`;  answer = (a - b) * c; }
          else if (t === 3 && a > b) { expr = `${c} · (${a} − ${b})`; answer = c * (a - b); }
          else continue;
        } else {
          // (a + b) ÷ c  eller  (a − b) ÷ c
          const divisor = PluginUtils.randInt(2, Math.min(9, maxFactor));
          const t       = PluginUtils.randInt(0, 1);
          if (t === 0) {
            const quotient = PluginUtils.randInt(2, Math.floor(maxFactor * 2 / divisor));
            const sum      = divisor * quotient;
            const da       = PluginUtils.randInt(1, sum - 1);
            expr   = `(${da} + ${sum - da}) ÷ ${divisor}`;
            answer = quotient;
          } else {
            const quotient = PluginUtils.randInt(2, Math.floor(maxFactor / divisor));
            const diff     = divisor * quotient;
            const b2       = PluginUtils.randInt(1, maxFactor - diff);
            const a2       = b2 + diff;
            if (a2 > maxFactor * 2) continue;
            expr   = `(${a2} − ${b2}) ÷ ${divisor}`;
            answer = quotient;
          }
        }
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
