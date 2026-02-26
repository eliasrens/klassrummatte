// js/plugins/negativa-tal.js
// Åk 5–6: negativa tal på tallinje, temperatur, addition/subtraktion

class NegativaTalPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'negativa-tal';
  }

  generate(settings) {
    const qt = PluginUtils.pickRandom(['tallinje', 'temp', 'temp', 'add-sub', 'add-sub']);
    if (qt === 'tallinje') return this._genTallinje();
    if (qt === 'temp')     return this._genTemp();
    return this._genAddSub();
  }

  _genTallinje() {
    const val = PluginUtils.randInt(-9, 9);
    return { type: 'negativa-tal', questionType: 'tallinje', value: val, answer: String(val) };
  }

  _genTemp() {
    const start  = PluginUtils.randInt(-10, 8);
    const change = PluginUtils.randInt(1, 8);
    const dir    = PluginUtils.pickRandom(['stiger', 'sjunker']);
    const result = dir === 'stiger' ? start + change : start - change;
    const contexts = [
      'Det är',
      'Termometern visar',
      'Temperaturen ute är',
    ];
    const ctx = PluginUtils.pickRandom(contexts);
    return {
      type: 'negativa-tal', questionType: 'temp',
      ctx, start, change, dir, answer: String(result),
    };
  }

  _genAddSub() {
    const op = PluginUtils.pickRandom(['+', '+', '-']);
    let a, b;
    if (op === '+') {
      a = PluginUtils.randInt(-9, -1);
      b = PluginUtils.randInt(1, 9);
    } else {
      a = PluginUtils.randInt(1, 9);
      b = PluginUtils.randInt(a + 1, a + 9);
    }
    const answer = op === '+' ? a + b : a - b;
    return { type: 'negativa-tal', questionType: 'add-sub', a, b, op, answer: String(answer) };
  }

  render(problem, container) {
    if (problem.questionType === 'tallinje') {
      const q = document.createElement('p');
      q.className = 'negtal-question';
      q.textContent = 'Vilket tal visar pilen?';
      container.appendChild(q);
      container.appendChild(_buildNegTallinje(problem.value));

    } else if (problem.questionType === 'temp') {
      const p = document.createElement('p');
      p.className = 'negtal-text';
      const dirText = problem.dir === 'stiger'
        ? `${problem.ctx} ${problem.start}°C och temperaturen stiger med ${problem.change} grader.`
        : `${problem.ctx} ${problem.start}°C och temperaturen sjunker med ${problem.change} grader.`;
      p.textContent = dirText + ' Vad är temperaturen nu?';
      container.appendChild(p);

    } else {
      // add-sub: inline
      const expr = document.createElement('span');
      expr.className = 'negtal-expr';
      expr.textContent = `${problem.a} ${problem.op} ${problem.b} =`;
      container.appendChild(expr);
      const ans = document.createElement('span');
      ans.className = 'answer-value answer-hidden';
      ans.textContent = ` ${problem.answer}`;
      container.appendChild(ans);
    }
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    if (problem.questionType === 'add-sub') {
      const el = container.querySelector('.answer-value');
      if (el) el.classList.remove('answer-hidden');
    } else {
      PluginUtils.appendAnswerBox(problem.answer + (problem.questionType === 'temp' ? '°C' : ''), container);
    }
  }

  isSameProblem(a, b) {
    if (a.questionType !== b.questionType) return false;
    if (a.questionType === 'tallinje') return a.value === b.value;
    if (a.questionType === 'temp') return a.start === b.start && a.change === b.change && a.dir === b.dir;
    return a.a === b.a && a.b === b.b && a.op === b.op;
  }
}

// =========================================================
//  SVG-tallinje –10 till 10 (privat)
// =========================================================
function _buildNegTallinje(markedVal) {
  const W = 420, H = 90, padX = 28;
  const range = 20;
  const step  = (W - 2 * padX) / range;
  const midY  = 46;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg   = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.classList.add('negtal-line');

  let c = `<line x1="${padX}" y1="${midY}" x2="${W - padX}" y2="${midY}" stroke="#1a1a2e" stroke-width="2.5"/>`;
  // Pilar på ändarna
  c += `<polygon points="${W-padX},${midY} ${W-padX-8},${midY-4} ${W-padX-8},${midY+4}" fill="#1a1a2e"/>`;
  c += `<polygon points="${padX},${midY} ${padX+8},${midY-4} ${padX+8},${midY+4}" fill="#1a1a2e"/>`;

  for (let i = -10; i <= 10; i++) {
    const x      = padX + (i + 10) * step;
    const isZero = i === 0;
    const isMaj  = i % 5 === 0;
    const tH     = isZero ? 18 : isMaj ? 12 : 7;
    c += `<line x1="${x.toFixed(1)}" y1="${(midY - tH / 2).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(midY + tH / 2).toFixed(1)}"
                stroke="${isZero ? '#e63946' : '#1a1a2e'}" stroke-width="${isZero ? 3 : isMaj ? 2 : 1}"/>`;
    if (isMaj) {
      c += `<text x="${x.toFixed(1)}" y="${(midY + tH / 2 + 13).toFixed(1)}"
                  text-anchor="middle" font-size="12" font-family="Segoe UI, sans-serif"
                  fill="${isZero ? '#e63946' : '#1a1a2e'}" font-weight="${isZero ? 700 : 400}">${i}</text>`;
    }
  }

  // Pil + frågetecken på markerat värde
  const px = padX + (markedVal + 10) * step;
  c += `<circle cx="${px.toFixed(1)}" cy="${midY}" r="8" fill="#e63946" stroke="white" stroke-width="2"/>`;
  c += `<text x="${px.toFixed(1)}" y="${(midY - 16).toFixed(1)}"
              text-anchor="middle" font-size="15" font-family="Segoe UI, sans-serif"
              fill="#e63946" font-weight="700">?</text>`;
  c += `<line x1="${px.toFixed(1)}" y1="${(midY - 8).toFixed(1)}"
              x2="${px.toFixed(1)}" y2="${(midY - 10).toFixed(1)}"
              stroke="#e63946" stroke-width="2"/>`;

  svg.innerHTML = c;
  return svg;
}

PluginManager.register(new NegativaTalPlugin());
