// js/render.js
// Renderar problem-objekt till DOM-element.
// Ren modul – ingen applikationsstate. Tar emot problem och container som parametrar.

const Renderer = (() => {

  // =========================================================
  //  Huvud-dispatcher
  // =========================================================
  function renderProblem(problem, container) {
    container.innerHTML = '';
    container.className = 'hidden';

    if (problem.isTextProblem) {
      const p = document.createElement('p');
      p.className = 'text-problem';
      p.textContent = problem.textTemplate;
      container.appendChild(p);
      return;
    }

    switch (problem.type) {
      case 'division':     renderDivision(problem, container);    break;
      case 'klocka':       renderKlocka(problem, container);      break;
      case 'brak':         renderBrak(problem, container);        break;
      case 'geometri':     renderGeometri(problem, container);    break;
      case 'prioritet':    renderPrioritet(problem, container);   break;
      case 'oppna-utsaga': renderOppnaUtsaga(problem, container); break;
      case 'matt-langd':
      case 'matt-volym':   renderMatt(problem, container);        break;
      default:             renderArithmetic(problem, container);  break;
    }
  }

  function renderExtraProblem(problem, container) {
    container.innerHTML = '';
    if (problem.type.startsWith('uppstallning')) {
      renderUppstallning(problem, container);
    } else if (problem.type === 'klocka') {
      renderKlocka(problem, container);
    } else if (problem.type === 'geometri') {
      renderGeometri(problem, container);
    } else {
      renderArithmetic(problem, container);
    }
  }

  // =========================================================
  //  Aritmetik
  // =========================================================
  function renderArithmetic(problem, container) {
    const span = document.createElement('span');
    span.textContent = `${problem.a} ${problem.operator} ${problem.b} =`;
    container.appendChild(span);
  }

  // =========================================================
  //  Division (bråkform)
  // =========================================================
  function renderDivision(problem, container) {
    container.appendChild(buildFractionEl(problem.a, problem.b));
    const eq = document.createElement('span');
    eq.textContent = '=';
    container.appendChild(eq);
  }

  // =========================================================
  //  Prioriteringsregler
  // =========================================================
  function renderPrioritet(problem, container) {
    const wrap = document.createElement('div');
    wrap.className = 'prioritet-display';
    const expr = document.createElement('span');
    expr.className = 'prioritet-expr';
    expr.textContent = `${problem.expression} =`;
    wrap.appendChild(expr);
    container.appendChild(wrap);
  }

  // =========================================================
  //  Öppna utsagor
  // =========================================================
  function renderOppnaUtsaga(problem, container) {
    const parts = problem.expression.split('_');
    if (parts.length === 2) {
      appendText(container, parts[0]);
      const blank = document.createElement('span');
      blank.className = 'open-blank';
      container.appendChild(blank);
      appendText(container, parts[1]);
    } else {
      appendText(container, problem.expression);
    }
  }

  // =========================================================
  //  Klocka
  // =========================================================
  function renderKlocka(problem, container) {
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

  // =========================================================
  //  Bråk
  // =========================================================
  function renderBrak(problem, container) {
    if (problem.questionType === 'name') {
      container.appendChild(buildFractionEl(problem.numerator, problem.denominator));
      appendText(container, ' =');
    } else if (problem.questionType === 'add-same-den') {
      container.appendChild(buildFractionEl(problem.a, problem.denominator));
      appendText(container, ' + ');
      container.appendChild(buildFractionEl(problem.b, problem.denominator));
      appendText(container, ' =');
    } else {
      container.appendChild(buildFractionEl(problem.a.numerator, problem.a.denominator));
      appendText(container, ' + ');
      container.appendChild(buildFractionEl(problem.b.numerator, problem.b.denominator));
      appendText(container, ' =');
    }
  }

  // =========================================================
  //  Geometri med SVG
  // =========================================================
  function renderGeometri(problem, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'geometry-display';
    wrapper.appendChild(buildShapeSVG(problem));
    const qTxt = document.createElement('p');
    qTxt.className = 'geometry-question';
    qTxt.textContent = problem.geoQuestion === 'area' ? 'Vad är arean?' : 'Vad är omkretsen?';
    wrapper.appendChild(qTxt);
    container.appendChild(wrapper);
  }

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

  // =========================================================
  //  Mått
  // =========================================================
  function renderMatt(problem, container) {
    const { from, fromUnit, toUnit } = problem.conversion;
    const wrapper = document.createElement('div');
    wrapper.className = 'matt-display';
    wrapper.innerHTML =
      `<span>${from}\u202F</span>` +
      `<span class="matt-unit">${fromUnit}</span>` +
      `<span>\u202F=\u202F?\u202F</span>` +
      `<span class="matt-unit">${toUnit}</span>`;
    container.appendChild(wrapper);
  }

  // =========================================================
  //  Uppställning (extrauppgift)
  // =========================================================
  function renderUppstallning(problem, container) {
    const aStr   = String(problem.a);
    const bStr   = String(problem.b);
    const ansStr = String(problem.answer);
    const width  = Math.max(aStr.length, bStr.length, ansStr.length) + 1;

    const div = document.createElement('div');
    div.className = 'uppstallning';

    const row1 = document.createElement('div');
    row1.className = 'uppstallning-row';
    row1.textContent = aStr.padStart(width, '\u00A0');
    div.appendChild(row1);

    const row2 = document.createElement('div');
    row2.className = 'uppstallning-row';
    const opSpan = document.createElement('span');
    opSpan.className = 'uppstallning-operator';
    opSpan.textContent = problem.operator;
    const bSpan = document.createElement('span');
    bSpan.textContent = bStr.padStart(width - 1, '\u00A0');
    row2.appendChild(opSpan);
    row2.appendChild(bSpan);
    div.appendChild(row2);

    const line = document.createElement('div');
    line.className = 'uppstallning-line';
    div.appendChild(line);

    const rowAns = document.createElement('div');
    rowAns.className = 'uppstallning-row uppstallning-answer';
    rowAns.textContent = ansStr.padStart(width, '\u00A0');
    div.appendChild(rowAns);

    container.appendChild(div);
  }

  // =========================================================
  //  SVG-klocka
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

  // =========================================================
  //  Hjälpfunktioner
  // =========================================================
  function buildFractionEl(num, den) {
    const frac = document.createElement('div');
    frac.className = 'fraction';
    const top = document.createElement('span');
    top.className = 'numerator';
    top.textContent = num;
    const bot = document.createElement('span');
    bot.className = 'denominator';
    bot.textContent = den;
    frac.appendChild(top);
    frac.appendChild(bot);
    return frac;
  }

  function appendText(container, text) {
    const span = document.createElement('span');
    span.textContent = text;
    container.appendChild(span);
  }

  return { renderProblem, renderExtraProblem, renderUppstallning };
})();
