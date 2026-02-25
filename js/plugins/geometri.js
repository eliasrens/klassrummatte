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
    if (grade >= 4) shapePool.push('angle');
    if (grade >= 5) shapePool.push('cuboid');

    const shape   = PluginUtils.pickRandom(shapePool);
    const maxSide = grade <= 2 ? 5 : grade <= 4 ? 20 : 50;
    const types   = (settings.geometriTypes && settings.geometriTypes.length > 0) ? settings.geometriTypes : ['area', 'perimeter'];

    // ── Vinkel ────────────────────────────────────────────────
    if (shape === 'angle') {
      const angleType = PluginUtils.pickRandom(['spetsig', 'rät', 'trubbig']);
      let degrees;
      if      (angleType === 'spetsig') degrees = PluginUtils.pickRandom([20, 30, 40, 45, 55, 60, 70, 80]);
      else if (angleType === 'rät')     degrees = 90;
      else                              degrees = PluginUtils.pickRandom([100, 110, 120, 130, 135, 145, 155]);
      return { type: 'geometri', shape: 'angle', dimensions: { degrees }, geoQuestion: 'identify-type', answer: angleType.charAt(0).toUpperCase() + angleType.slice(1) };
    }

    // ── Rätblock / Volym ──────────────────────────────────────
    if (shape === 'cuboid') {
      const l = PluginUtils.randInt(2, 10);
      const b = PluginUtils.randInt(2, 10);
      const h = PluginUtils.randInt(2, 10);
      return { type: 'geometri', shape: 'cuboid', dimensions: { l, b, h }, geoQuestion: 'volume', answer: l * b * h };
    }

    let question;
    if (forceQuestion)             question = forceQuestion;
    else if (shape === 'triangle') question = 'area';
    else                           question = PluginUtils.pickRandom(types);

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
    if (problem.geoQuestion === 'area')          qTxt.textContent = 'Vad är arean?';
    else if (problem.geoQuestion === 'perimeter') qTxt.textContent = 'Vad är omkretsen?';
    else if (problem.geoQuestion === 'volume')    qTxt.textContent = 'Vad är volymen?';
    else                                          qTxt.textContent = 'Vad är det för typ av vinkel?';
    wrapper.appendChild(qTxt);
    container.appendChild(wrapper);
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    const unit = problem.geoQuestion === 'area'      ? ' cm²'
               : problem.geoQuestion === 'perimeter' ? ' cm'
               : problem.geoQuestion === 'volume'    ? ' cm³'
               : '';
    PluginUtils.appendAnswerBox(`${problem.answer}${unit}`, container);
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

  } else if (shape === 'circle') {
    const cx=W/2, cy=H/2, r=Math.min(85, H/2-20);
    inner = `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fef3c7" stroke="#e9c46a" stroke-width="3"/>
      <line x1="${cx}" y1="${cy}" x2="${cx+r}" y2="${cy}" stroke="#d97706" stroke-width="2.5" stroke-dasharray="6,4"/>
      <text x="${cx+r/2}" y="${cy-14}" text-anchor="middle" font-size="16" fill="#92400e" font-weight="600">r = ${d.radius} cm</text>
      <circle cx="${cx}" cy="${cy}" r="4" fill="#d97706"/>`;

  } else if (shape === 'angle') {
    // ── Vinkel-SVG ──────────────────────────────────────────
    const cx = 80, cy = 175, rayLen = 200;
    const deg = d.degrees;
    const rad = (deg * Math.PI) / 180;
    // Basstråle: horisontellt höger
    const ex = cx + rayLen, ey = cy;
    // Vinkelstråle: uppåt (SVG Y ökar nedåt, vi ritar uppåt)
    const ax = cx + Math.round(rayLen * Math.cos(rad));
    const ay = cy - Math.round(rayLen * Math.sin(rad));
    const arcR = 40;

    if (deg === 90) {
      // Rätvinkelsmarkering – liten kvadrat
      inner = `
        <line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#1a1a2e" stroke-width="4" stroke-linecap="round"/>
        <line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}" stroke="#1a1a2e" stroke-width="4" stroke-linecap="round"/>
        <polyline points="${cx+25},${cy} ${cx+25},${cy-25} ${cx},${cy-25}" fill="none" stroke="#e63946" stroke-width="2.5"/>`;
    } else {
      // Arcmarkering för spetsig/trubbig
      const arcX1 = cx + arcR;
      const arcY1 = cy;
      const arcX2 = cx + Math.round(arcR * Math.cos(rad));
      const arcY2 = cy - Math.round(arcR * Math.sin(rad));
      const largeArc = deg > 180 ? 1 : 0;
      inner = `
        <line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#1a1a2e" stroke-width="4" stroke-linecap="round"/>
        <line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}" stroke="#1a1a2e" stroke-width="4" stroke-linecap="round"/>
        <path d="M ${arcX1} ${arcY1} A ${arcR} ${arcR} 0 ${largeArc} 0 ${arcX2} ${arcY2}" fill="none" stroke="#e63946" stroke-width="2"/>
        <circle cx="${cx}" cy="${cy}" r="5" fill="#1a1a2e"/>`;
    }

  } else if (shape === 'cuboid') {
    // ── Rätblock (3D perspektiv) ─────────────────────────────
    // Tre synliga ytor: frontyta, topyta, högeryta
    const fw = 160, fh = 100; // frontytans pixlar
    const dx = 55, dy = -35;   // djupoffset (upp-höger)
    const x0 = 60, y0 = 75;    // front top-left

    // Fronthörn
    const [x1,y1] = [x0,    y0];
    const [x2,y2] = [x0+fw, y0];
    const [x3,y3] = [x0+fw, y0+fh];
    const [x4,y4] = [x0,    y0+fh];
    // Bakre hörn (front + djupoffset)
    const [x5,y5] = [x1+dx, y1+dy];
    const [x6,y6] = [x2+dx, y2+dy];
    const [x7,y7] = [x3+dx, y3+dy];
    const [x8,y8] = [x4+dx, y4+dy];

    inner = `
      <polygon points="${x1},${y1} ${x2},${y2} ${x6},${y6} ${x5},${y5}" fill="#fde8d8" stroke="none"/>
      <polygon points="${x2},${y2} ${x3},${y3} ${x7},${y7} ${x6},${y6}" fill="#f9c7b8" stroke="none"/>
      <polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}" fill="#fef0e6" stroke="none"/>
      <polygon points="${x1},${y1} ${x2},${y2} ${x6},${y6} ${x5},${y5}" fill="none" stroke="#c2410c" stroke-width="2.5"/>
      <polygon points="${x2},${y2} ${x3},${y3} ${x7},${y7} ${x6},${y6}" fill="none" stroke="#c2410c" stroke-width="2.5"/>
      <rect x="${x1}" y="${y1}" width="${fw}" height="${fh}" fill="none" stroke="#c2410c" stroke-width="2.5"/>
      <line x1="${x5}" y1="${y5}" x2="${x6}" y2="${y6}" stroke="#c2410c" stroke-width="1.5" stroke-dasharray="5,4"/>
      <line x1="${x5}" y1="${y5}" x2="${x8}" y2="${y8}" stroke="#c2410c" stroke-width="1.5" stroke-dasharray="5,4"/>
      <line x1="${x8}" y1="${y8}" x2="${x7}" y2="${y7}" stroke="#c2410c" stroke-width="1.5" stroke-dasharray="5,4"/>
      <text x="${(x1+x2)/2}" y="${y3+22}" text-anchor="middle" font-size="15" fill="#7c2d12" font-weight="700">l\u00a0=\u00a0${d.l}\u00a0cm</text>
      <text x="${x3+10}" y="${(y2+y3)/2}" dominant-baseline="central" font-size="15" fill="#7c2d12" font-weight="700">h\u00a0=\u00a0${d.h}\u00a0cm</text>
      <text x="${(x2+x6)/2+6}" y="${y2-14}" text-anchor="middle" font-size="15" fill="#7c2d12" font-weight="700">b\u00a0=\u00a0${d.b}\u00a0cm</text>`;
  }

  svg.innerHTML = inner;
  return svg;
}

PluginManager.register(new GeometriPlugin());
