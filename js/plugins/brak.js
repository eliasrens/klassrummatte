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

  hasBildstodSupport(problem) {
    if (problem.questionType === 'name')         return problem.denominator <= 10;
    if (problem.questionType === 'add-same-den') return problem.denominator <= 8;
    return false;
  }

  buildBildstod(problem) {
    if (problem.questionType === 'name') {
      return buildFractionCircle(problem.numerator, problem.denominator);
    }
    if (problem.questionType === 'add-same-den') {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex; gap:0.5rem; align-items:center;';
      wrap.appendChild(buildFractionCircle(problem.a, problem.denominator));
      const plus = document.createElement('span');
      plus.textContent = '+';
      plus.style.cssText = 'font-size:1.2rem; font-weight:700; color:#1a1a2e;';
      wrap.appendChild(plus);
      wrap.appendChild(buildFractionCircle(problem.b, problem.denominator));
      return wrap;
    }
    return null;
  }
}

PluginManager.register(new BrakPlugin());
