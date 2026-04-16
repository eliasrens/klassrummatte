// js/plugins/ekvationer.js

class EkvationerPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'ekvationer';
  }

  generate(settings) {
    const grade = settings.grade || 3;

    if (grade < 3) {
      const c = PluginUtils.cfg(grade);
      const a = PluginUtils.randInt(1, Math.floor(c.addMax * 0.6));
      const b = PluginUtils.randInt(1, c.addMax - a);
      return { type: 'addition', a, b, operator: '+', answer: a + b };
    }

    const userModes = settings.ekvationerMode?.length ? settings.ekvationerMode : null;
    const defaultModes = grade >= 5 ? ['enstegs', 'tvastegs'] : ['enstegs'];
    const modes = userModes ? userModes.filter(m => {
      if (m === 'tvastegs' && grade < 5) return false;
      if (m === 'geometri' && grade < 4) return false;
      return true;
    }) : defaultModes;
    const mode = PluginUtils.pickRandom(modes.length ? modes : ['enstegs']);

    const R = PluginUtils.randInt, P = PluginUtils.pickRandom;

    if (mode === 'geometri') {
      const variant = P(['kvadrat-omkrets', 'kvadrat-area', 'rektangel-omkrets', 'rektangel-area']);
      if (variant === 'kvadrat-omkrets') {
        const x = R(2, 25);
        const omkrets = 4 * x;
        return {
          type: 'ekvationer',
          isGeometri: true,
          questionText: `Omkretsen på en kvadrat är ${omkrets} cm. Hur lång är varje sida?`,
          equation: `4x = ${omkrets}`,
          answer: x,
          unit: 'cm',
        };
      }
      if (variant === 'kvadrat-area') {
        const x = R(2, 12);
        const area = x * x;
        return {
          type: 'ekvationer',
          isGeometri: true,
          questionText: `Arean på en kvadrat är ${area} cm². Hur lång är varje sida?`,
          equation: `x · x = ${area}`,
          answer: x,
          unit: 'cm',
        };
      }
      if (variant === 'rektangel-omkrets') {
        const lang = R(5, 25);
        const x = R(2, lang - 1);
        const omkrets = 2 * (lang + x);
        return {
          type: 'ekvationer',
          isGeometri: true,
          questionText: `Omkretsen på en rektangel är ${omkrets} cm. Den långa sidan är ${lang} cm. Hur lång är den korta sidan?`,
          equation: `2(${lang} + x) = ${omkrets}`,
          answer: x,
          unit: 'cm',
        };
      }
      // rektangel-area
      const lang = R(3, 12);
      const x = R(2, 9);
      const area = lang * x;
      return {
        type: 'ekvationer',
        isGeometri: true,
        questionText: `Arean på en rektangel är ${area} cm². Den ena sidan är ${lang} cm. Hur lång är den andra sidan?`,
        equation: `${lang}x = ${area}`,
        answer: x,
        unit: 'cm',
      };
    }

    if (mode === 'tvastegs') {
      const a = R(2, 9);
      const x = R(1, grade >= 6 ? 15 : 10);
      const b = R(1, 15);
      const sign = P(['+', '-']);
      const c = sign === '+' ? a * x + b : a * x - b;
      return {
        type: 'ekvationer',
        equation: `${a}x ${sign} ${b} = ${c}`,
        answer: x,
      };
    }

    // enstegs
    const op = P(['+', '-', '*', '/']);
    const maxNum = grade <= 3 ? 20 : grade <= 4 ? 50 : 100;

    if (op === '+') {
      const a = R(1, Math.floor(maxNum / 2));
      const x = R(1, Math.floor(maxNum / 2));
      return { type: 'ekvationer', equation: `x + ${a} = ${a + x}`, answer: x };
    }
    if (op === '-') {
      const variant = P(['x-a', 'a-x']);
      if (variant === 'x-a') {
        const a = R(1, Math.floor(maxNum / 2));
        const x = R(a + 1, maxNum);
        return { type: 'ekvationer', equation: `x − ${a} = ${x - a}`, answer: x };
      }
      const x = R(1, Math.floor(maxNum / 2));
      const a = R(x + 1, maxNum);
      return { type: 'ekvationer', equation: `${a} − x = ${a - x}`, answer: x };
    }
    if (op === '*') {
      const maxFactor = grade <= 3 ? 9 : 12;
      const a = R(2, maxFactor);
      const x = R(2, maxFactor);
      return { type: 'ekvationer', equation: `${a}x = ${a * x}`, answer: x };
    }
    // '/'
    const a = R(2, grade <= 3 ? 9 : 12);
    const b = R(2, 9);
    return { type: 'ekvationer', equation: `x / ${a} = ${b}`, answer: a * b };
  }

  render(problem, container) {
    if (problem.isGeometri) {
      const wrap = document.createElement('div');
      wrap.className = 'ekvationer-geo-wrap';
      const q = document.createElement('p');
      q.className = 'ekvationer-geo-question';
      q.textContent = problem.questionText;
      wrap.appendChild(q);
      const ansRow = document.createElement('span');
      ansRow.className = 'ekvationer-row';
      const lbl = document.createElement('span');
      lbl.textContent = 'Sidan x\u00a0=\u00a0';
      ansRow.appendChild(lbl);
      const ans = document.createElement('span');
      ans.className = 'answer-value answer-hidden';
      ans.textContent = `${problem.answer} ${problem.unit || ''}`.trim();
      ansRow.appendChild(ans);
      wrap.appendChild(ansRow);
      container.appendChild(wrap);
      return;
    }

    const row = document.createElement('span');
    row.className = 'ekvationer-row';

    const eq = document.createElement('span');
    eq.textContent = problem.equation + '\u00a0\u00a0→\u00a0\u00a0x\u00a0=\u00a0';
    row.appendChild(eq);

    const ans = document.createElement('span');
    ans.className = 'answer-value answer-hidden';
    ans.textContent = problem.answer;
    row.appendChild(ans);

    container.appendChild(row);
  }

  isSameProblem(a, b) {
    return a.equation === b.equation && a.questionText === b.questionText;
  }
}

PluginManager.register(new EkvationerPlugin());
