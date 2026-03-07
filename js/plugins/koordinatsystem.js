// js/plugins/koordinatsystem.js
// Åk 4–6: läsa av och namnge koordinater i SVG-koordinatsystem

class KoordinatsystemPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'koordinatsystem';
  }

  generate(settings) {
    const grade = settings.grade;
    // Åk 4–5: första kvadranten (x,y ≥ 0), 0–8
    // Åk 6: alla fyra kvadranter, −5 till 5
    const allQuadrants = grade >= 6;
    const range = allQuadrants ? 5 : 8;
    const min   = allQuadrants ? -range : 0;

    // Slumpa 3 punkter, varav en markeras som "A"
    const points = [];
    const used   = new Set();
    while (points.length < 3) {
      const x = PluginUtils.randInt(min, range);
      const y = PluginUtils.randInt(min, range);
      const key = `${x},${y}`;
      if (!used.has(key) && !(x === 0 && y === 0)) {
        used.add(key);
        points.push({ x, y });
      }
    }

    const targetIdx = PluginUtils.randInt(0, points.length - 1);
    const target    = points[targetIdx];
    const answer    = `(${target.x}, ${target.y})`;

    return {
      type: 'koordinatsystem',
      points, targetIdx,
      allQuadrants, range,
      answer,
    };
  }

  render(problem, container) {
    const wrap = document.createElement('div');
    wrap.className = 'koord-wrap';
    wrap.appendChild(_buildGrid(problem));
    const q = document.createElement('p');
    q.className = 'koord-question';
    const lbl = String.fromCharCode(65 + problem.targetIdx); // A, B, C
    q.textContent = `Vilka koordinater har punkten ${lbl}?`;
    wrap.appendChild(q);
    container.appendChild(wrap);
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    PluginUtils.appendAnswerBox(problem.answer, container);
  }

  isSameProblem(a, b) {
    return a.answer === b.answer && a.targetIdx === b.targetIdx;
  }
}

// =========================================================
//  SVG-koordinatsystem (privat)
// =========================================================
function _buildGrid(problem) {
  const { points, targetIdx, allQuadrants, range } = problem;
  const SIZE   = 280;
  const PAD    = 32;
  const inner  = SIZE - 2 * PAD;
  const steps  = allQuadrants ? range * 2 : range;
  const step   = inner / steps;
  const origin = allQuadrants
    ? { x: PAD + range * step, y: PAD + range * step }
    : { x: PAD, y: PAD + inner };

  const colors  = ['#e63946', '#457b9d', '#2a9d8f'];
  const letters = ['A', 'B', 'C'];
  const min     = allQuadrants ? -range : 0;

  let c = '';

  // Stödlinjer
  for (let i = 0; i <= steps; i++) {
    const x = PAD + i * step;
    const y = PAD + i * step;
    c += `<line x1="${x.toFixed(1)}" y1="${PAD}" x2="${x.toFixed(1)}" y2="${(PAD + inner).toFixed(1)}"
                stroke="#e5e7eb" stroke-width="1"/>`;
    c += `<line x1="${PAD}" y1="${y.toFixed(1)}" x2="${(PAD + inner).toFixed(1)}" y2="${y.toFixed(1)}"
                stroke="#e5e7eb" stroke-width="1"/>`;
  }

  // Axlar
  c += `<line x1="${PAD}" y1="${origin.y.toFixed(1)}" x2="${(PAD + inner).toFixed(1)}" y2="${origin.y.toFixed(1)}"
              stroke="#1a1a2e" stroke-width="2"/>`;
  c += `<line x1="${origin.x.toFixed(1)}" y1="${PAD}" x2="${origin.x.toFixed(1)}" y2="${(PAD + inner).toFixed(1)}"
              stroke="#1a1a2e" stroke-width="2"/>`;

  // Pilar på axelns positiva ände
  const arrowTip = PAD + inner + 6;
  c += `<polygon points="${arrowTip},${origin.y} ${arrowTip-8},${origin.y-4} ${arrowTip-8},${origin.y+4}" fill="#1a1a2e"/>`;
  c += `<polygon points="${origin.x},${PAD-6} ${origin.x-4},${PAD+2} ${origin.x+4},${PAD+2}" fill="#1a1a2e"/>`;

  // Axeletiketter
  c += `<text x="${arrowTip + 4}" y="${origin.y + 4}" font-size="12" font-weight="700" fill="#1a1a2e">x</text>`;
  c += `<text x="${origin.x + 4}" y="${PAD - 10}" font-size="12" font-weight="700" fill="#1a1a2e">y</text>`;

  // Tal på axlarna
  for (let i = min; i <= range; i++) {
    if (i === 0) continue;
    const px = origin.x + i * step;
    const py = origin.y - i * step;
    // X-axel
    c += `<text x="${px.toFixed(1)}" y="${(origin.y + 14).toFixed(1)}"
                text-anchor="middle" font-size="10" fill="#4b5563">${i}</text>`;
    // Y-axel
    c += `<text x="${(origin.x - 8).toFixed(1)}" y="${py.toFixed(1)}"
                text-anchor="end" dominant-baseline="central" font-size="10" fill="#4b5563">${i}</text>`;
  }
  c += `<text x="${(origin.x - 8).toFixed(1)}" y="${(origin.y + 14).toFixed(1)}"
              text-anchor="middle" font-size="10" fill="#4b5563">0</text>`;

  // Punkter
  points.forEach((pt, i) => {
    const px    = origin.x + pt.x * step;
    const py    = origin.y - pt.y * step;
    const color = colors[i % colors.length];
    const isTarget = i === targetIdx;

    c += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${isTarget ? 7 : 6}"
                  fill="${color}" stroke="white" stroke-width="${isTarget ? 2.5 : 1.5}"/>`;
    c += `<text x="${(px + 10).toFixed(1)}" y="${(py - 6).toFixed(1)}"
                font-size="13" font-weight="700" fill="${color}">${letters[i]}</text>`;
  });

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg   = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
  svg.classList.add('koord-svg');
  svg.innerHTML = c;
  return svg;
}

PluginManager.register(new KoordinatsystemPlugin());
