// js/plugins/brak.js

// Privat hjälpfunktion – cirkel-SVG som bildstöd för bråk
function buildFractionCircle(numerator, denominator) {
  const CX = 50, CY = 50, R = 46;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.classList.add('brak-circle-svg');

  if (denominator <= 1) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', CX); c.setAttribute('cy', CY); c.setAttribute('r', R);
    c.setAttribute('fill', numerator >= 1 ? '#e63946' : '#e5e7eb');
    c.setAttribute('stroke', '#6b7280'); c.setAttribute('stroke-width', '2');
    svg.appendChild(c);
    return svg;
  }

  const sliceAngle = (2 * Math.PI) / denominator;
  for (let i = 0; i < denominator; i++) {
    const start = -Math.PI / 2 + i * sliceAngle;
    const end   = start + sliceAngle;
    const x1 = CX + R * Math.cos(start), y1 = CY + R * Math.sin(start);
    const x2 = CX + R * Math.cos(end),   y2 = CY + R * Math.sin(end);
    const large = sliceAngle > Math.PI ? 1 : 0;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${CX} ${CY} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`);
    path.setAttribute('fill', i < numerator ? '#e63946' : '#e5e7eb');
    path.setAttribute('stroke', '#9ca3af'); path.setAttribute('stroke-width', '1');
    svg.appendChild(path);
  }

  const border = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  border.setAttribute('cx', CX); border.setAttribute('cy', CY); border.setAttribute('r', R);
  border.setAttribute('fill', 'none');
  border.setAttribute('stroke', '#6b7280'); border.setAttribute('stroke-width', '2');
  svg.appendChild(border);
  return svg;
}

class BrakPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'brak';
  }

  generate(settings) {
    const level = PluginUtils.cfg(settings.grade).fractions;

    if (!level || level === 'intro') {
      return this._genName();
    }

    if (level === 'same-den') {
      const qt = PluginUtils.pickRandom(['add-same-den', 'sub-same-den', 'compare', 'simplify']);
      return this._genByType(qt);
    }

    if (level === 'diff-den') {
      const qt = PluginUtils.pickRandom([
        'add-same-den', 'sub-same-den', 'add-diff-den', 'sub-diff-den',
        'compare', 'simplify', 'fraction-of-whole',
      ]);
      return this._genByType(qt);
    }

    // 'full' – åk 6: alla typer inklusive blandade tal
    const qt = PluginUtils.pickRandom([
      'add-diff-den', 'sub-diff-den', 'compare', 'simplify',
      'fraction-of-whole', 'to-mixed',
    ]);
    return this._genByType(qt);
  }

  _genByType(qt) {
    switch (qt) {
      case 'add-same-den':      return this._genAddSubSameDen('+');
      case 'sub-same-den':      return this._genAddSubSameDen('-');
      case 'compare':           return this._genCompare();
      case 'add-diff-den':      return this._genAddSubDiffDen('+');
      case 'sub-diff-den':      return this._genAddSubDiffDen('-');
      case 'fraction-of-whole': return this._genFractionOfWhole();
      case 'simplify':          return this._genSimplify();
      case 'to-mixed':          return this._genToMixed();
      default:                  return this._genName();
    }
  }

  _genName() {
    const options = [[1,2],[1,4],[3,4],[1,3],[2,3],[1,5],[2,5],[3,5]];
    const [num, den] = PluginUtils.pickRandom(options);
    return { type: 'brak', questionType: 'name', numerator: num, denominator: den, answer: `${num}/${den}` };
  }

  _genAddSubSameDen(op) {
    const den = PluginUtils.pickRandom([2, 3, 4, 5, 6, 8, 10]);
    let a, b;
    if (op === '+') {
      a = PluginUtils.randInt(1, Math.max(1, den - 2));
      b = PluginUtils.randInt(1, den - a);
    } else {
      a = PluginUtils.randInt(2, den - 1);
      b = PluginUtils.randInt(1, a - 1);
    }
    const resultNum = op === '+' ? a + b : a - b;
    const qt = op === '+' ? 'add-same-den' : 'sub-same-den';
    return { type: 'brak', questionType: qt, a, b, denominator: den, answer: `${resultNum}/${den}` };
  }

  _genCompare() {
    const dens = [2, 3, 4, 5, 6, 8, 10];
    let num1, den1, num2, den2, attempts = 0;
    do {
      den1 = PluginUtils.pickRandom(dens);
      den2 = PluginUtils.pickRandom(dens);
      num1 = PluginUtils.randInt(1, den1 - 1);
      num2 = PluginUtils.randInt(1, den2 - 1);
      attempts++;
    } while (num1 * den2 === num2 * den1 && attempts < 20);
    const answer = num1 * den2 > num2 * den1 ? `${num1}/${den1}` : `${num2}/${den2}`;
    return {
      type: 'brak', questionType: 'compare',
      a: { numerator: num1, denominator: den1 },
      b: { numerator: num2, denominator: den2 },
      answer,
    };
  }

  _genAddSubDiffDen(op) {
    const dens = [2, 3, 4, 5, 6, 8, 10];
    let den1, den2, num1, num2, attempts = 0;
    do {
      den1 = PluginUtils.pickRandom(dens);
      den2 = PluginUtils.pickRandom(dens.filter(d => d !== den1));
      num1 = PluginUtils.randInt(1, den1 - 1);
      num2 = PluginUtils.randInt(1, den2 - 1);
      attempts++;
    } while (op === '-' && num1 * den2 <= num2 * den1 && attempts < 20);

    const LCD  = PluginUtils.lcm(den1, den2);
    const n1   = num1 * (LCD / den1);
    const n2   = num2 * (LCD / den2);
    const ansN = op === '+' ? n1 + n2 : n1 - n2;
    const g    = PluginUtils.gcd(Math.abs(ansN), LCD);
    const rN   = ansN / g, rD = LCD / g;
    const answer = rD === 1 ? `${rN}` : `${rN}/${rD}`;
    const qt = op === '+' ? 'add-diff-den' : 'sub-diff-den';
    return {
      type: 'brak', questionType: qt,
      a: { numerator: num1, denominator: den1 },
      b: { numerator: num2, denominator: den2 },
      answer,
    };
  }

  _genFractionOfWhole() {
    const options = [
      { num: 1, den: 2, multiples: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20] },
      { num: 1, den: 3, multiples: [3, 6, 9, 12, 15, 18, 21] },
      { num: 2, den: 3, multiples: [3, 6, 9, 12, 15, 18, 21] },
      { num: 1, den: 4, multiples: [4, 8, 12, 16, 20, 24] },
      { num: 3, den: 4, multiples: [4, 8, 12, 16, 20, 24] },
      { num: 1, den: 5, multiples: [5, 10, 15, 20, 25, 30] },
      { num: 2, den: 5, multiples: [5, 10, 15, 20, 25, 30] },
      { num: 3, den: 5, multiples: [5, 10, 15, 20, 25, 30] },
    ];
    const opt   = PluginUtils.pickRandom(options);
    const whole = PluginUtils.pickRandom(opt.multiples);
    const answer = String((opt.num * whole) / opt.den);
    return { type: 'brak', questionType: 'fraction-of-whole', numerator: opt.num, denominator: opt.den, whole, answer };
  }

  _genSimplify() {
    const pairs = [
      [2,4],[2,6],[2,8],[2,10],
      [3,6],[3,9],[3,12],
      [4,6],[4,8],[4,10],[4,12],
      [5,10],[5,15],[5,20],
      [6,8],[6,9],[6,10],[6,12],
      [8,10],[8,12],
    ];
    const [num, den] = PluginUtils.pickRandom(pairs);
    const g = PluginUtils.gcd(num, den);
    return { type: 'brak', questionType: 'simplify', numerator: num, denominator: den, answer: `${num/g}/${den/g}` };
  }

  _genToMixed() {
    const den    = PluginUtils.pickRandom([2, 3, 4, 5, 6, 8]);
    const wholes = PluginUtils.randInt(1, 2);
    const rem    = PluginUtils.randInt(1, den - 1);
    return { type: 'brak', questionType: 'to-mixed', numerator: wholes * den + rem, denominator: den, answer: `${wholes} ${rem}/${den}` };
  }

  // ── Render ────────────────────────────────────────────────

  render(problem, container) {
    const qt = problem.questionType;

    if (qt === 'name') {
      container.appendChild(PluginUtils.buildFractionEl(problem.numerator, problem.denominator));
      PluginUtils.appendText(container, ' =');

    } else if (qt === 'add-same-den' || qt === 'sub-same-den') {
      const op = qt === 'add-same-den' ? ' + ' : ' \u2212 ';
      container.appendChild(PluginUtils.buildFractionEl(problem.a, problem.denominator));
      PluginUtils.appendText(container, op);
      container.appendChild(PluginUtils.buildFractionEl(problem.b, problem.denominator));
      PluginUtils.appendText(container, ' =');

    } else if (qt === 'add-diff-den' || qt === 'sub-diff-den') {
      const op = qt === 'add-diff-den' ? ' + ' : ' \u2212 ';
      container.appendChild(PluginUtils.buildFractionEl(problem.a.numerator, problem.a.denominator));
      PluginUtils.appendText(container, op);
      container.appendChild(PluginUtils.buildFractionEl(problem.b.numerator, problem.b.denominator));
      PluginUtils.appendText(container, ' =');

    } else if (qt === 'fraction-of-whole') {
      PluginUtils.appendText(container, 'Vad\u00a0är\u00a0');
      container.appendChild(PluginUtils.buildFractionEl(problem.numerator, problem.denominator));
      PluginUtils.appendText(container, `\u00a0av\u00a0${problem.whole}\u00a0=`);

    } else if (qt === 'compare') {
      const wrap = document.createElement('div');
      wrap.className = 'brak-question-wrap';
      const row = document.createElement('div');
      row.className = 'brak-compare-row';
      row.appendChild(PluginUtils.buildFractionEl(problem.a.numerator, problem.a.denominator));
      const eller = document.createElement('span');
      eller.className = 'brak-compare-eller';
      eller.textContent = 'eller';
      row.appendChild(eller);
      row.appendChild(PluginUtils.buildFractionEl(problem.b.numerator, problem.b.denominator));
      const q = document.createElement('p');
      q.className = 'brak-subtext';
      q.textContent = 'Vilket bråk är störst?';
      wrap.appendChild(row);
      wrap.appendChild(q);
      container.appendChild(wrap);
      return; // svar visas via appendAnswerBox i showAnswer

    } else if (qt === 'simplify') {
      const wrap = document.createElement('div');
      wrap.className = 'brak-question-wrap';
      const q = document.createElement('p');
      q.className = 'brak-subtext';
      q.textContent = 'Förenkla:';
      const expr = document.createElement('div');
      expr.className = 'brak-compare-row';
      expr.appendChild(PluginUtils.buildFractionEl(problem.numerator, problem.denominator));
      const eq  = document.createElement('span');
      eq.textContent = '=';
      expr.appendChild(eq);
      const ans = document.createElement('span');
      ans.className = 'answer-value answer-hidden';
      ans.textContent = problem.answer;
      expr.appendChild(ans);
      wrap.appendChild(q);
      wrap.appendChild(expr);
      container.appendChild(wrap);
      return;

    } else if (qt === 'to-mixed') {
      const wrap = document.createElement('div');
      wrap.className = 'brak-question-wrap';
      const q = document.createElement('p');
      q.className = 'brak-subtext';
      q.textContent = 'Skriv som blandat tal:';
      const expr = document.createElement('div');
      expr.className = 'brak-compare-row';
      expr.appendChild(PluginUtils.buildFractionEl(problem.numerator, problem.denominator));
      const eq  = document.createElement('span');
      eq.textContent = '=';
      expr.appendChild(eq);
      const ans = document.createElement('span');
      ans.className = 'answer-value answer-hidden';
      ans.textContent = problem.answer;
      expr.appendChild(ans);
      wrap.appendChild(q);
      wrap.appendChild(expr);
      container.appendChild(wrap);
      return;
    }

    // Inline-typer: name, add/sub-same-den, add/sub-diff-den, fraction-of-whole
    const ans = document.createElement('span');
    ans.className = 'answer-value answer-hidden';
    ans.textContent = ` ${problem.answer}`;
    container.appendChild(ans);
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    const el = container.querySelector('.answer-value');
    if (el) {
      el.classList.remove('answer-hidden');
      return;
    }
    // Endast 'compare' saknar inline-svar – visa answer-box
    PluginUtils.appendAnswerBox(problem.answer, container);
  }

  isSameProblem(a, b) {
    if (a.questionType !== b.questionType) return false;
    return a.answer === b.answer;
  }

  hasBildstodSupport(problem) {
    if (problem.questionType === 'name')         return problem.denominator <= 10;
    if (problem.questionType === 'add-same-den') return problem.denominator <= 8;
    if (problem.questionType === 'sub-same-den') return problem.denominator <= 8;
    if (problem.questionType === 'compare')      return problem.a.denominator <= 10 && problem.b.denominator <= 10;
    return false;
  }

  buildBildstod(problem) {
    if (problem.questionType === 'name') {
      return buildFractionCircle(problem.numerator, problem.denominator);
    }
    if (problem.questionType === 'add-same-den' || problem.questionType === 'sub-same-den') {
      const op   = problem.questionType === 'add-same-den' ? '+' : '\u2212';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; gap:0.5rem; align-items:center;';
      wrap.appendChild(buildFractionCircle(problem.a, problem.denominator));
      const sym = document.createElement('span');
      sym.textContent = op;
      sym.style.cssText = 'font-size:1.2rem; font-weight:700; color:#1a1a2e;';
      wrap.appendChild(sym);
      wrap.appendChild(buildFractionCircle(problem.b, problem.denominator));
      return wrap;
    }
    if (problem.questionType === 'compare') {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; gap:0.75rem; align-items:center;';
      wrap.appendChild(buildFractionCircle(problem.a.numerator, problem.a.denominator));
      const vs = document.createElement('span');
      vs.textContent = 'eller';
      vs.style.cssText = 'font-size:1rem; font-weight:600; color:#1a1a2e;';
      wrap.appendChild(vs);
      wrap.appendChild(buildFractionCircle(problem.b.numerator, problem.b.denominator));
      return wrap;
    }
    return null;
  }
}

PluginManager.register(new BrakPlugin());
