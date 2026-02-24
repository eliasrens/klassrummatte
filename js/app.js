// js/app.js
// Huvudapplikation: klickhantering, timers och all DOM-rendering.

const App = (() => {

  // =========================================================
  //  Konstanter
  // =========================================================
  const EXTRA_DELAY_MS    = 10000;
  const BILDSTOD_DELAY_MS = 10000;
  const CIRCLE_COLORS     = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261', '#a8dadc'];
  const DOT_COLOR_A       = '#e63946';
  const DOT_COLOR_B       = '#457b9d';
  const DOT_COLOR_GREY    = '#d1d5db';

  // =========================================================
  //  DOM-referenser
  // =========================================================
  let stage, problemDisplay, extraPanel, extraDisplay,
      clickHint, menuToggle, settingsMenu, menuOverlay;

  // =========================================================
  //  App-state
  // =========================================================
  let problemVisible = false;
  let extraTimer     = null;
  let hideTimer      = null;
  let bildstodTimer  = null;

  // =========================================================
  //  Init
  // =========================================================
  function init() {
    stage          = document.getElementById('stage');
    problemDisplay = document.getElementById('problem-display');
    extraPanel     = document.getElementById('extra-panel');
    extraDisplay   = document.getElementById('extra-display');
    clickHint      = document.getElementById('click-hint');
    menuToggle     = document.getElementById('menu-toggle');
    settingsMenu   = document.getElementById('settings-menu');
    menuOverlay    = document.getElementById('menu-overlay');

    loadSettingsIntoUI();
    bindSettingsUI();
    bindStageEvents();
    bindMenuCollapse();
    menuToggle.addEventListener('click', e => { e.stopPropagation(); toggleMenu(); });
    menuOverlay.addEventListener('click', closeMenu);
  }

  // =========================================================
  //  Scen-events
  // =========================================================
  function bindStageEvents() {
    stage.addEventListener('click', handleStageClick);
    stage.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStageClick(); }
    });
  }

  function handleStageClick(e) {
    if (e && (
      e.target.closest('#settings-menu') ||
      e.target.closest('#menu-toggle') ||
      e.target.closest('#extra-panel')
    )) return;

    if (document.body.classList.contains('menu-open')) {
      closeMenu();
      return;
    }

    if (!problemVisible) {
      showNewProblem();
    } else {
      // Starta uttoning
      problemDisplay.classList.remove('visible');
      clearExtraTask();
      clearBildstod();
      problemVisible = false;

      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        hideTimer = null;
        problemDisplay.innerHTML = '';
        showNewProblem();
      }, 370);
    }
  }

  // =========================================================
  //  Problemflöde
  // =========================================================
  function showNewProblem() {
    clearExtraTask();
    clearBildstod();

    const settings = Settings.get();
    const problem  = Problems.generateProblem(settings);

    renderProblem(problem, settings);

    problemDisplay.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      problemDisplay.classList.add('visible');
    }));

    clickHint.classList.add('hidden-hint');
    problemVisible = true;

    if (settings.extraEnabled) {
      extraTimer = setTimeout(() => showExtraTask(settings), EXTRA_DELAY_MS);
    }

    // Bildstöd – direkt eller fördröjt beroende på inställning
    if (settings.bildstod && hasBildstodSupport(problem, settings)) {
      const delay = settings.bildstodInstant ? 80 : BILDSTOD_DELAY_MS;
      bildstodTimer = setTimeout(() => appendBildstod(problem, settings), delay);
    }
  }

  function clearExtraTask() {
    if (extraTimer) { clearTimeout(extraTimer); extraTimer = null; }
    extraPanel.classList.remove('visible');
    document.body.classList.remove('extra-visible');
    setTimeout(() => { extraDisplay.innerHTML = ''; }, 460);
  }

  function clearBildstod() {
    if (bildstodTimer) { clearTimeout(bildstodTimer); bildstodTimer = null; }
    const existing = stage.querySelector('.bildstod-container');
    if (existing) existing.remove();
  }

  function showExtraTask(settings) {
    const extra = Problems.generateExtraProblem(settings);
    renderExtraProblem(extra, settings);
    extraPanel.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      extraPanel.classList.add('visible');
      document.body.classList.add('extra-visible');
    }));
  }

  // =========================================================
  //  Bildstöd – fördröjd rendering
  // =========================================================

  // Returnerar true om detta problem kan ha bildstöd
  function hasBildstodSupport(problem, settings) {
    const grade = settings.grade;
    switch (problem.type) {
      case 'division':       return problem.bildstodEligible && grade <= 4;
      case 'addition':
      case 'subtraktion':    return grade <= 3 && problem.a <= 30 && problem.b <= 30;
      case 'multiplikation': return grade <= 3 && problem.a * problem.b <= 30 && problem.a <= 10 && problem.b <= 10;
      case 'matt-langd':
      case 'matt-volym':     return canBuildMattBildstod(problem);
      default:               return false;
    }
  }

  // Bygger och lägger till bildstödet i problem-display, med fade-in
  function appendBildstod(problem, settings) {
    if (!problemVisible) return;

    const el = buildBildstodEl(problem, settings);
    if (!el) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'bildstod-container bildstod-anim';
    wrapper.appendChild(el);
    stage.appendChild(wrapper);
  }

  function buildBildstodEl(problem, settings) {
    const grade = settings.grade;
    switch (problem.type) {
      case 'division':
        if (problem.bildstodEligible && grade <= 4)
          return buildDivisionGrid(problem.rows, problem.cols);
        break;
      case 'addition':
        if (grade <= 3 && problem.a + problem.b <= 30)
          return buildArithmeticDots(problem);
        break;
      case 'subtraktion':
        if (grade <= 3 && problem.a <= 30)
          return buildArithmeticDots(problem);
        break;
      case 'multiplikation':
        if (grade <= 3 && problem.a * problem.b <= 30 && problem.a <= 10 && problem.b <= 10)
          return buildArithmeticDots(problem);
        break;
      case 'matt-langd':
      case 'matt-volym':
        return buildMattBildstodEl(problem);
    }
    return null;
  }

  // Prickar för aritmetik
  function buildArithmeticDots(problem) {
    const { type, a, b } = problem;

    if (type === 'addition') {
      const wrap = makeDotWrap('bildstod-dots');
      for (let i = 0; i < a; i++) addDot(wrap, DOT_COLOR_A);
      // visuell separator
      const sep = document.createElement('div');
      sep.style.cssText = 'width:100%; height:0; flex-basis:100%;';
      wrap.appendChild(sep);
      for (let i = 0; i < b; i++) addDot(wrap, DOT_COLOR_B);
      return wrap;
    }

    if (type === 'subtraktion') {
      const wrap = makeDotWrap('bildstod-dots');
      for (let i = 0; i < a; i++) addDot(wrap, i < (a - b) ? DOT_COLOR_A : DOT_COLOR_GREY);
      return wrap;
    }

    if (type === 'multiplikation') {
      const rows = Math.min(a, b), cols = Math.max(a, b);
      if (rows * cols > 30 || rows > 10 || cols > 10) return null;
      const grid = makeDotWrap('bildstod-mult-grid');
      for (let r = 0; r < rows; r++) {
        const row = document.createElement('div');
        row.className = 'bildstod-row';
        for (let c = 0; c < cols; c++) addDot(row, CIRCLE_COLORS[r % CIRCLE_COLORS.length]);
        grid.appendChild(row);
      }
      return grid;
    }

    return null;
  }

  // Rutnät för division: divisor rader × quotient kolumner
  function buildDivisionGrid(rows, cols) {
    const grid = document.createElement('div');
    grid.className = 'division-grid';
    for (let r = 0; r < rows; r++) {
      const row = document.createElement('div');
      row.className = 'division-grid-row';
      for (let c = 0; c < cols; c++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.style.background = CIRCLE_COLORS[r % CIRCLE_COLORS.length];
        row.appendChild(dot);
      }
      grid.appendChild(row);
    }
    return grid;
  }

  function canBuildMattBildstod(problem) {
    const { from, factor } = problem.conversion;
    return Number.isInteger(from) && from >= 1 && from <= 10 &&
           Number.isInteger(factor) && factor >= 2 && factor <= 20;
  }

  function buildMattBildstodEl(problem) {
    const { from, fromUnit, toUnit, factor } = problem.conversion;
    if (!canBuildMattBildstod(problem)) return null;

    const blockFactor = Math.round(factor);
    const wrap = document.createElement('div');
    wrap.className = 'matt-bildstod';

    for (let i = 0; i < from; i++) {
      const big = document.createElement('div');
      big.className = 'matt-block-big';

      const lbl = document.createElement('span');
      lbl.className = 'matt-block-label';
      lbl.textContent = `1 ${fromUnit}`;
      big.appendChild(lbl);

      const inner = document.createElement('div');
      inner.className = 'matt-block-inner';
      for (let j = 0; j < blockFactor; j++) {
        const small = document.createElement('span');
        small.className = 'matt-block-small';
        small.title = `1 ${toUnit}`;
        inner.appendChild(small);
      }
      big.appendChild(inner);

      const sub = document.createElement('span');
      sub.className = 'matt-block-sublabel';
      sub.textContent = `= ${blockFactor} ${toUnit}`;
      big.appendChild(sub);

      wrap.appendChild(big);
    }
    return wrap;
  }

  // =========================================================
  //  Renderers – huvud
  // =========================================================
  function renderProblem(problem, settings) {
    problemDisplay.innerHTML = '';
    problemDisplay.className = 'hidden';

    if (problem.isTextProblem) {
      const p = document.createElement('p');
      p.className = 'text-problem';
      p.textContent = problem.textTemplate;
      problemDisplay.appendChild(p);
      return;
    }

    switch (problem.type) {
      case 'division':       renderDivision(problem, problemDisplay);      break;
      case 'klocka':         renderKlocka(problem, problemDisplay);         break;
      case 'brak':           renderBrak(problem, problemDisplay);           break;
      case 'geometri':       renderGeometri(problem, problemDisplay);       break;
      case 'prioritet':      renderPrioritet(problem, problemDisplay);      break;
      case 'oppna-utsaga':   renderOppnaUtsaga(problem, problemDisplay);    break;
      case 'matt-langd':
      case 'matt-volym':     renderMatt(problem, problemDisplay);           break;
      default:               renderArithmetic(problem, problemDisplay);     break;
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
    if (problem.geoQuestion === 'area') {
      qTxt.textContent = 'Vad är arean?';
    } else {
      qTxt.textContent = problem.shape === 'circle' ? 'Vad är omkretsen?' : 'Vad är omkretsen?';
    }
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
  //  Renderers – extrauppgift
  // =========================================================
  function renderExtraProblem(problem, settings) {
    extraDisplay.innerHTML = '';
    if (problem.type.startsWith('uppstallning')) {
      renderUppstallning(problem, extraDisplay);
    } else if (problem.type === 'klocka') {
      renderKlocka(problem, extraDisplay);
    } else if (problem.type === 'geometri') {
      renderGeometri(problem, extraDisplay);
    } else {
      renderArithmetic(problem, extraDisplay);
    }
  }

  // =========================================================
  //  Uppställning
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
  //  Menyhantering
  // =========================================================
  function toggleMenu() { document.body.classList.toggle('menu-open'); }
  function closeMenu()  { document.body.classList.remove('menu-open'); }

  // =========================================================
  //  Hopfällbara menygrupper
  // =========================================================
  function bindMenuCollapse() {
    document.querySelectorAll('#settings-menu .menu-group-label').forEach(label => {
      label.classList.add('is-collapsible');
      label.addEventListener('click', () => {
        const collapsed = label.classList.toggle('is-collapsed');
        let el = label.nextElementSibling;
        while (el && !el.classList.contains('menu-group-label')) {
          el.classList.toggle('section-collapsed', collapsed);
          el = el.nextElementSibling;
        }
      });
    });
  }

  // =========================================================
  //  Bildstöd – tillgänglighetskoll
  // =========================================================
  function couldHaveBildstod(settings) {
    const g = settings.grade;
    const a = settings.areas;
    return (a.includes('division')       && g <= 4)
        || (a.includes('addition')       && g <= 3)
        || (a.includes('subtraktion')    && g <= 3)
        || (a.includes('multiplikation') && g <= 3)
        || a.includes('matt-langd')
        || a.includes('matt-volym')
        || a.includes('blandad');
  }

  function updateConditionalSections() {
    const areas        = Settings.getAreas();
    const showMultDiv  = areas.some(a => a === 'multiplikation' || a === 'division' || a === 'blandad');
    const showGeometri = areas.some(a => a === 'geometri'       || a === 'blandad');
    const showDivRest  = areas.some(a => a === 'division'       || a === 'blandad');

    function setSection(labelId, sectionId, show) {
      const lbl = document.getElementById(labelId);
      const sec = document.getElementById(sectionId);
      if (show) {
        lbl.classList.remove('hidden', 'section-collapsed', 'is-collapsed');
        sec.classList.remove('hidden', 'section-collapsed');
      } else {
        lbl.classList.add('hidden');
        sec.classList.add('hidden');
      }
    }

    setSection('multdiv-group-label',  'multdiv-section',  showMultDiv);
    setSection('geometri-group-label', 'geometri-section', showGeometri);
    document.getElementById('division-rest-label').classList.toggle('hidden', !showDivRest);
  }

  function updateBildstodCheckbox() {
    const s      = Settings.get();
    const canHave = couldHaveBildstod(s);
    const cb     = document.getElementById('bildstod-check');
    const lbl    = cb.closest('.check-label--featured');
    cb.disabled  = !canHave;
    if (lbl) lbl.classList.toggle('bildstod-unavailable', !canHave);
    if (!canHave && cb.checked) {
      cb.checked = false;
      Settings.setBildstod(false);
      document.getElementById('bildstod-options').classList.add('hidden');
    }
  }

  // =========================================================
  //  Inställnings-UI
  // =========================================================
  function loadSettingsIntoUI() {
    const s = Settings.get();

    document.getElementById('grade-select').value = s.grade;

    document.querySelectorAll('#area-checkboxes input[type=checkbox]').forEach(cb => {
      cb.checked = s.areas.includes(cb.value);
    });

    document.querySelectorAll('#multdiv-mode-checkboxes input[type=checkbox]').forEach(cb => {
      cb.checked = (s.multDivMode || ['tables-basic']).includes(cb.value);
    });

    document.querySelectorAll('#geometri-type-checkboxes input[type=checkbox]').forEach(cb => {
      cb.checked = s.geometriTypes.includes(cb.value);
    });

    document.getElementById('bildstod-check').checked       = s.bildstod;
    document.getElementById('bildstod-options').classList.toggle('hidden', !s.bildstod);
    const timingVal = s.bildstodInstant ? 'instant' : 'delayed';
    document.querySelectorAll('input[name="bildstod-timing"]').forEach(r => {
      r.checked = r.value === timingVal;
    });
    document.getElementById('problemlosning-check').checked = s.problemlosning;
    document.getElementById('extra-enabled-check').checked  = s.extraEnabled;
    document.getElementById('extra-type-select').value      = s.extraType;
    document.getElementById('extra-task-options').classList.toggle('hidden', !s.extraEnabled);
    document.getElementById('division-rest-check').checked = s.divisionRest || false;
    updateConditionalSections();
    updateBildstodCheckbox();
  }

  function bindSettingsUI() {
    document.getElementById('grade-select').addEventListener('change', e => {
      Settings.setGrade(e.target.value);
      updateBildstodCheckbox();
    });

    document.querySelectorAll('#area-checkboxes input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = [...document.querySelectorAll('#area-checkboxes input:checked')].map(c => c.value);
        Settings.setAreas(checked);
        updateConditionalSections();
        updateBildstodCheckbox();
      });
    });

    document.querySelectorAll('#multdiv-mode-checkboxes input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = [...document.querySelectorAll('#multdiv-mode-checkboxes input:checked')].map(c => c.value);
        if (checked.length > 0) Settings.setMultDivMode(checked);
        else cb.checked = true;
      });
    });

    document.querySelectorAll('#geometri-type-checkboxes input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = [...document.querySelectorAll('#geometri-type-checkboxes input:checked')].map(c => c.value);
        if (checked.length > 0) Settings.setGeometriTypes(checked);
        else cb.checked = true;
      });
    });

    document.getElementById('bildstod-check').addEventListener('change', e => {
      Settings.setBildstod(e.target.checked);
      document.getElementById('bildstod-options').classList.toggle('hidden', !e.target.checked);
    });

    document.querySelectorAll('input[name="bildstod-timing"]').forEach(r => {
      r.addEventListener('change', () => {
        Settings.setBildstodInstant(r.value === 'instant');
      });
    });

    document.getElementById('problemlosning-check').addEventListener('change', e => {
      Settings.setProblemlosning(e.target.checked);
    });

    document.getElementById('extra-enabled-check').addEventListener('change', e => {
      Settings.setExtraEnabled(e.target.checked);
      document.getElementById('extra-task-options').classList.toggle('hidden', !e.target.checked);
    });

    document.getElementById('extra-type-select').addEventListener('change', e => {
      Settings.setExtraType(e.target.value);
    });

    document.getElementById('division-rest-check').addEventListener('change', e => {
      Settings.setDivisionRest(e.target.checked);
    });
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

  function makeDotWrap(cls) {
    const wrap = document.createElement('div');
    wrap.className = cls;
    return wrap;
  }

  function addDot(container, color) {
    const d = document.createElement('span');
    d.className = 'dot';
    d.style.background = color;
    container.appendChild(d);
  }

  // =========================================================
  //  Start
  // =========================================================
  document.addEventListener('DOMContentLoaded', init);
  return {};
})();
