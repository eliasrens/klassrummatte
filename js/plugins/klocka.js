// js/plugins/klocka.js

class KlockaPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'klocka';
  }

  generate(settings) {
    const c = PluginUtils.cfg(settings.grade);
    const step = c.clockMinuteStep;
    const possibleMinutes = [];
    for (let m = 0; m < 60; m += step) possibleMinutes.push(m);

    const hours        = PluginUtils.randInt(1, 12);
    const minutes      = PluginUtils.pickRandom(possibleMinutes);
    const questionType = Math.random() < 0.6 ? 'read' : 'add-minutes';
    let minutesToAdd   = null;

    if (questionType === 'add-minutes') {
      const opts = [5, 10, 15, 20, 30].filter(m => m % step === 0);
      minutesToAdd = opts.length > 0 ? PluginUtils.pickRandom(opts) : 15;
    }

    let answer;
    if (questionType === 'read') {
      answer = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;
    } else {
      const totalMin = hours * 60 + minutes + minutesToAdd;
      const nh = Math.floor(totalMin / 60) % 12 || 12;
      const nm = totalMin % 60;
      answer = `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`;
    }

    return { type: 'klocka', hours, minutes, questionType, minutesToAdd, answer };
  }

  render(problem, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'clock-container';
    const svg = buildClockSVG(problem.hours, problem.minutes);
    svg.classList.add('clock-svg');
    wrapper.appendChild(svg);
    const q = document.createElement('p');
    q.className = 'clock-question';
    q.textContent = problem.questionType === 'read'
      ? 'Vad är klockan?'
      : `Vad är klockan om ${problem.minutesToAdd} minuter?`;
    wrapper.appendChild(q);
    container.appendChild(wrapper);
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    PluginUtils.appendAnswerBox(problem.answer, container);
  }

  isSameProblem(a, b) {
    return a.hours === b.hours && a.minutes === b.minutes && a.questionType === b.questionType;
  }
}

// =========================================================
//  SVG-klocka (privat i denna fil)
// =========================================================
function buildClockSVG(hours, minutes) {
  const SIZE = 200, CX = 100, CY = 100;
  const minAngle  = (minutes / 60) * 2 * Math.PI - Math.PI / 2;
  const hourAngle = ((hours % 12 + minutes / 60) / 12) * 2 * Math.PI - Math.PI / 2;
  const mx = CX + Math.cos(minAngle)  * 68;
  const my = CY + Math.sin(minAngle)  * 68;
  const hx = CX + Math.cos(hourAngle) * 48;
  const hy = CY + Math.sin(hourAngle) * 48;

  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const angle  = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isHour = i % 5 === 0;
    const r1 = isHour ? 76 : 83;
    ticks += `<line x1="${(CX+Math.cos(angle)*r1).toFixed(1)}" y1="${(CY+Math.sin(angle)*r1).toFixed(1)}"
                    x2="${(CX+Math.cos(angle)*90).toFixed(1)}" y2="${(CY+Math.sin(angle)*90).toFixed(1)}"
                    stroke="${isHour ? '#1a1a2e' : '#aaa'}" stroke-width="${isHour ? 3 : 1}"/>`;
  }
  let numbers = '';
  for (let i = 1; i <= 12; i++) {
    const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
    numbers += `<text x="${(CX+Math.cos(angle)*64).toFixed(1)}" y="${(CY+Math.sin(angle)*64).toFixed(1)}"
                      text-anchor="middle" dominant-baseline="central"
                      font-size="13" font-family="Segoe UI, sans-serif" font-weight="600" fill="#1a1a2e">${i}</text>`;
  }

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg   = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label',
    `Klockan visar ${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`);
  svg.innerHTML = `
    <circle cx="${CX}" cy="${CY}" r="92" fill="#f5f4f0" stroke="#1a1a2e" stroke-width="4"/>
    ${ticks}${numbers}
    <line x1="${CX}" y1="${CY}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}"
          stroke="#1a1a2e" stroke-width="6" stroke-linecap="round"/>
    <line x1="${CX}" y1="${CY}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}"
          stroke="#457b9d" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${CX}" cy="${CY}" r="5" fill="#1a1a2e"/>`;
  return svg;
}

PluginManager.register(new KlockaPlugin());
