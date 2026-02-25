// js/plugins/geometri.js

class GeometriPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'geometri';
  }

  generate(settings, forceQuestion = null) {
    const grade = settings.grade;
    const level = PluginUtils.cfg(grade).geometry;

    if (!level) {
      const c = PluginUtils.cfg(grade);
      const a = PluginUtils.randInt(1, Math.floor(c.addMax * 0.6));
      const b = PluginUtils.randInt(1, c.addMax - a);
      return { type: 'addition', a, b, operator: '+', answer: a + b };
    }

    const shapePool = ['square', 'rectangle'];
    if (level === 'with-triangle' || level === 'with-circle') shapePool.push('triangle');
    if (level === 'with-circle') shapePool.push('circle');

    const shape   = PluginUtils.pickRandom(shapePool);
    const maxSide = grade <= 2 ? 5 : grade <= 4 ? 20 : 50;
    const types   = (settings.geometriTypes && settings.geometriTypes.length > 0) ? settings.geometriTypes : ['area', 'perimeter'];

    let question;
    if (forceQuestion)          question = forceQuestion;
    else if (shape === 'triangle') question = 'area';
    else                        question = PluginUtils.pickRandom(types);

    let dimensions, area, perimeter;

    if (shape === 'square') {
      const side = PluginUtils.randInt(2, maxSide);
      dimensions = { side };
      area       = side * side;
      perimeter  = 4 * side;
    } else if (shape === 'rectangle') {
      const w = PluginUtils.randInt(2, maxSide);
      const h = PluginUtils.randInt(2, Math.floor(maxSide * 0.8));
      dimensions = { width: w, height: h };
      area       = w * h;
      perimeter  = 2 * (w + h);
    } else if (shape === 'triangle') {
      const evenBase = PluginUtils.randInt(2, 15) * 2;
      const h        = PluginUtils.randInt(3, 20);
      dimensions = { base: evenBase, height: h };
      area       = (evenBase * h) / 2;
      perimeter  = null;
    } else {
      const r = PluginUtils.randInt(2, 15);
      dimensions = { radius: r };
      area       = parseFloat((Math.PI * r * r).toFixed(1));
      perimeter  = parseFloat((2 * Math.PI * r).toFixed(1));
    }

    return {
      type: 'geometri', shape, dimensions,
      geoQuestion: question,
      answer: question === 'area' ? area : perimeter,
    };
  }

  render(problem, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'geometry-display';
    wrapper.appendChild(buildShapeSVG(problem));
    const qTxt = document.createElement('p');
    qTxt.className = 'geometry-question';
    qTxt.textContent = problem.geoQuestion === 'area' ? 'Vad är arean?' : 'Vad är omkretsen?';
    wrapper.appendChild(qTxt);
    container.appendChild(wrapper);
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    const unit = problem.geoQuestion === 'area' ? 'cm²' : 'cm';
    PluginUtils.appendAnswerBox(`${problem.answer} ${unit}`, container);
  }

  isSameProblem(a, b) {
    return a.shape === b.shape && a.geoQuestion === b.geoQuestion &&
           JSON.stringify(a.dimensions) === JSON.stringify(b.dimensions);
  }
}

// =========================================================
//  SVG-byggare (privat i denna fil)
// =========================================================
function buildShapeSVG(problem) {
  const W = 340, H = 220;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.classList.add('geometry-svg');

  const { shape, dimensions: d } = problem;
  let inner = '';

  if (shape === 'square') {
    const s = Math.min(160, H - 50);
    const x = (W - s) / 2, y = (H - s) / 2;
    inner = `
      <rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#dbeafe" stroke="#457b9d" stroke-width="3" rx="3"/>
      <text x="${W/2}" y="${y-16}" text-anchor="middle" font-size="17" fill="#1a1a2e" font-weight="600">${d.side} cm</text>
      <text x="${x+s+18}" y="${H/2}" dominant-baseline="central" font-size="17" fill="#1a1a2e" font-weight="600">${d.side} cm</text>`;

  } else if (shape === 'rectangle') {
    const rw = Math.min(220, W - 80), rh = Math.min(120, H - 60);
    const x = (W - rw) / 2, y = (H - rh) / 2;
    inner = `
      <rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="#dbeafe" stroke="#457b9d" stroke-width="3" rx="3"/>
      <text x="${W/2}" y="${y-16}" text-anchor="middle" font-size="17" fill="#1a1a2e" font-weight="600">${d.width} cm</text>
      <text x="${x+rw+16}" y="${H/2}" dominant-baseline="central" font-size="17" fill="#1a1a2e" font-weight="600">${d.height} cm</text>`;

  } else if (shape === 'triangle') {
    const bx=50, by=H-40, ex=W-50, ey=H-40, tx=W/2, ty=30;
    inner = `
      <polygon points="${bx},${by} ${ex},${ey} ${tx},${ty}" fill="#dcfce7" stroke="#2a9d8f" stroke-width="3"/>
      <text x="${W/2}" y="${by+22}" text-anchor="middle" font-size="17" fill="#1a1a2e" font-weight="600">${d.base} cm</text>
      <line x1="${tx}" y1="${ty}" x2="${tx}" y2="${by}" stroke="#2a9d8f" stroke-width="2" stroke-dasharray="6,4"/>
      <text x="${tx+18}" y="${(ty+by)/2}" dominant-baseline="central" font-size="15" fill="#2a9d8f" font-weight="600">${d.height} cm</text>`;

  } else {
    const cx=W/2, cy=H/2, r=Math.min(85, H/2-20);
    inner = `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fef3c7" stroke="#e9c46a" stroke-width="3"/>
      <line x1="${cx}" y1="${cy}" x2="${cx+r}" y2="${cy}" stroke="#d97706" stroke-width="2.5" stroke-dasharray="6,4"/>
      <text x="${cx+r/2}" y="${cy-14}" text-anchor="middle" font-size="16" fill="#92400e" font-weight="600">r = ${d.radius} cm</text>
      <circle cx="${cx}" cy="${cy}" r="4" fill="#d97706"/>`;
  }

  svg.innerHTML = inner;
  return svg;
}

PluginManager.register(new GeometriPlugin());
