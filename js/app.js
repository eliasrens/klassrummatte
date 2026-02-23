// js/app.js
// Huvudapplikation: klickhantering, timers och all DOM-rendering.

const App = (() => {

  // =========================================================
  //  Konstanter
  // =========================================================
  const EXTRA_DELAY_MS = 10000; // 10 sekunder
  const CIRCLE_COLORS  = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261', '#a8dadc'];
  const DOT_COLOR_A    = '#e63946'; // röd – första operand
  const DOT_COLOR_B    = '#457b9d'; // blå – andra operand
  const DOT_COLOR_GREY = '#ccc';    // grå – subtraherade prickar

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
  let hideTimer      = null; // används för att undvika race condition vid klick

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

    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });
    menuOverlay.addEventListener('click', closeMenu);
  }

  // =========================================================
  //  Scen-events
  // =========================================================
  function bindStageEvents() {
    stage.addEventListener('click', handleStageClick);
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStageClick();
      }
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
      // Starta uttoningAnimation
      problemDisplay.classList.remove('visible');
      clearExtraTask();
      problemVisible = false;

      // Avbryt eventuell pågående hide-timer (kan inte hända i normal flöde,
      // men säkrar mot dubbel-klick)
      if (hideTimer) clearTimeout(hideTimer);

      // Vänta tills uttoning är klar, visa sedan ny uppgift
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
    const settings = Settings.get();
    const problem  = Problems.generateProblem(settings);

    renderProblem(problem, settings);

    problemDisplay.classList.remove('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        problemDisplay.classList.add('visible');
      });
    });

    clickHint.classList.add('hidden-hint');
    problemVisible = true;

    if (settings.extraEnabled) {
      extraTimer = setTimeout(() => showExtraTask(settings), EXTRA_DELAY_MS);
    }
  }

  function clearExtraTask() {
    if (extraTimer) { clearTimeout(extraTimer); extraTimer = null; }
    extraPanel.classList.remove('visible');
    document.body.classList.remove('extra-visible');
    setTimeout(() => { extraDisplay.innerHTML = ''; }, 460);
  }

  function showExtraTask(settings) {
    const extra = Problems.generateExtraProblem(settings);
    renderExtraProblem(extra, settings);
    extraPanel.classList.remove('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        extraPanel.classList.add('visible');
        document.body.classList.add('extra-visible');
      });
    });
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
      case 'division':
        renderDivision(problem, problemDisplay, settings);
        break;
      case 'klocka':
        renderKlocka(problem, problemDisplay);
        break;
      case 'brak':
        renderBrak(problem, problemDisplay);
        break;
      case 'geometri':
        renderGeometri(problem, problemDisplay);
        break;
      case 'matt-langd':
      case 'matt-volym':
        renderMatt(problem, problemDisplay, settings);
        break;
      default:
        renderArithmetic(problem, problemDisplay, settings);
        break;
    }
  }

  // =========================================================
  //  Aritmetik (addition, subtraktion, multiplikation)
  // =========================================================
  function renderArithmetic(problem, container, settings) {
    const grade = settings ? settings.grade : 3;
    const bildstod = settings && settings.bildstod;

    const span = document.createElement('span');
    span.textContent = `${problem.a} ${problem.operator} ${problem.b} = ?`;
    container.appendChild(span);

    // Bildstöd-prickar: bara åk 1-3 och om aktiverat
    if (bildstod && grade <= 3) {
      const dots = buildArithmeticDots(problem);
      if (dots) container.appendChild(dots);
    }
  }

  function buildArithmeticDots(problem) {
    const { type, a, b } = problem;
    const MAX = 30;

    if (type === 'addition') {
      if (a + b > MAX) return null;
      const wrap = makeDotWrap();
      // a röda prickar
      for (let i = 0; i < a; i++) addDot(wrap, DOT_COLOR_A);
      // separator
      const sep = document.createElement('span');
      sep.style.cssText = 'display:block; width:100%; height:0.4rem;';
      wrap.appendChild(sep);
      // b blå prickar
      for (let i = 0; i < b; i++) addDot(wrap, DOT_COLOR_B);
      return wrap;
    }

    if (type === 'subtraktion') {
      if (a > MAX) return null;
      const wrap = makeDotWrap();
      // a prickar, sista b är gråa (subtraheras)
      for (let i = 0; i < a; i++) addDot(wrap, i < (a - b) ? DOT_COLOR_A : DOT_COLOR_GREY);
      return wrap;
    }

    if (type === 'multiplikation') {
      if (a * b > MAX || a > 10 || b > 10) return null;
      const wrap = document.createElement('div');
      wrap.className = 'bildstod-mult-grid';
      for (let r = 0; r < a; r++) {
        const row = document.createElement('div');
        row.className = 'bildstod-row';
        for (let c = 0; c < b; c++) {
          addDot(row, CIRCLE_COLORS[r % CIRCLE_COLORS.length]);
        }
        wrap.appendChild(row);
      }
      return wrap;
    }

    return null;
  }

  // =========================================================
  //  Division
  // =========================================================
  function renderDivision(problem, container, settings) {
    const grade   = settings ? settings.grade : 3;
    const bildstod = settings && settings.bildstod;
    const showGrid = bildstod && problem.bildstodEligible && grade <= 4;

    if (showGrid) {
      const grid = buildDivisionGrid(problem.rows, problem.cols);
      container.appendChild(grid);
    }

    container.appendChild(buildFractionEl(problem.a, problem.b));

    const eq = document.createElement('span');
    eq.textContent = '= ?';
    container.appendChild(eq);
  }

  // Bygger ett rutnät med `rows` rader och `cols` kolumner
  // T.ex. 15÷3: rows=3, cols=5 → 3 rader med 5 prickar
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
      appendText(container, ' = ?');

    } else if (problem.questionType === 'add-same-den') {
      container.appendChild(buildFractionEl(problem.a, problem.denominator));
      appendText(container, ' + ');
      container.appendChild(buildFractionEl(problem.b, problem.denominator));
      appendText(container, ' = ?');

    } else {
      container.appendChild(buildFractionEl(problem.a.numerator, problem.a.denominator));
      appendText(container, ' + ');
      container.appendChild(buildFractionEl(problem.b.numerator, problem.b.denominator));
      appendText(container, ' = ?');
    }
  }

  // =========================================================
  //  Geometri med SVG-figurer
  // =========================================================
  function renderGeometri(problem, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'geometry-display';

    const svg = buildShapeSVG(problem);
    wrapper.appendChild(svg);

    const qTxt = document.createElement('p');
    qTxt.className = 'geometry-question';
    if (problem.geoQuestion === 'area') {
      qTxt.textContent = 'Vad är arean?';
    } else if (problem.shape === 'circle') {
      qTxt.textContent = 'Vad är omkretsen?';
    } else {
      qTxt.textContent = 'Vad är omkretsen?';
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

    const { shape, dimensions } = problem;
    let inner = '';

    if (shape === 'square') {
      const s  = Math.min(160, H - 50);
      const x  = (W - s) / 2;
      const y  = (H - s) / 2;
      const lx = W / 2;
      const ty = y - 18;
      const rx = x + s + 22;
      const my = H / 2;
      inner = `
        <rect x="${x}" y="${y}" width="${s}" height="${s}" fill="#dbeafe" stroke="#457b9d" stroke-width="3" rx="3"/>
        <text x="${lx}" y="${ty}" text-anchor="middle" font-size="17" fill="#1a1a2e" font-weight="600">${dimensions.side} cm</text>
        <text x="${rx}" y="${my}" text-anchor="start" dominant-baseline="central" font-size="17" fill="#1a1a2e" font-weight="600">${dimensions.side} cm</text>
      `;

    } else if (shape === 'rectangle') {
      const rw = Math.min(220, W - 80);
      const rh = Math.min(120, H - 60);
      const x  = (W - rw) / 2;
      const y  = (H - rh) / 2;
      inner = `
        <rect x="${x}" y="${y}" width="${rw}" height="${rh}" fill="#dbeafe" stroke="#457b9d" stroke-width="3" rx="3"/>
        <text x="${W/2}" y="${y - 16}" text-anchor="middle" font-size="17" fill="#1a1a2e" font-weight="600">${dimensions.width} cm</text>
        <text x="${x + rw + 16}" y="${H/2}" text-anchor="start" dominant-baseline="central" font-size="17" fill="#1a1a2e" font-weight="600">${dimensions.height} cm</text>
      `;

    } else if (shape === 'triangle') {
      const bx  = 50,  by  = H - 40;
      const ex  = W - 50, ey  = H - 40;
      const tx  = W / 2,  ty  = 30;
      const midX = W / 2;
      const midY = H - 22;
      inner = `
        <polygon points="${bx},${by} ${ex},${ey} ${tx},${ty}" fill="#dcfce7" stroke="#2a9d8f" stroke-width="3"/>
        <text x="${midX}" y="${midY}" text-anchor="middle" font-size="17" fill="#1a1a2e" font-weight="600">${dimensions.base} cm</text>
        <line x1="${tx}" y1="${ty}" x2="${tx}" y2="${by}" stroke="#2a9d8f" stroke-width="2" stroke-dasharray="6,4"/>
        <text x="${tx + 16}" y="${(ty + by) / 2}" dominant-baseline="central" font-size="15" fill="#2a9d8f" font-weight="600">${dimensions.height} cm</text>
      `;

    } else if (shape === 'circle') {
      const cx = W / 2, cy = H / 2;
      const r  = Math.min(85, H / 2 - 20);
      inner = `
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fef3c7" stroke="#e9c46a" stroke-width="3"/>
        <line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="#d97706" stroke-width="2.5" stroke-dasharray="6,4"/>
        <text x="${cx + r / 2}" y="${cy - 12}" text-anchor="middle" font-size="16" fill="#92400e" font-weight="600">r = ${dimensions.radius} cm</text>
        <circle cx="${cx}" cy="${cy}" r="4" fill="#d97706"/>
      `;
    }

    svg.innerHTML = inner;
    return svg;
  }

  // =========================================================
  //  Mått
  // =========================================================
  function renderMatt(problem, container, settings) {
    const { from, fromUnit, toUnit } = problem.conversion;
    const bildstod = settings && settings.bildstod;

    const wrapper = document.createElement('div');
    wrapper.className = 'matt-display';
    wrapper.innerHTML =
      `<span>${from}\u202F</span>` +
      `<span class="matt-unit">${fromUnit}</span>` +
      `<span>\u202F=\u202F?\u202F</span>` +
      `<span class="matt-unit">${toUnit}</span>`;
    container.appendChild(wrapper);

    if (bildstod) {
      const vis = buildMattBildstod(problem);
      if (vis) container.appendChild(vis);
    }
  }

  // Enkel visuell representation av måttomvandling
  function buildMattBildstod(problem) {
    const { from, fromUnit, toUnit, factor } = problem.conversion;
    // Visa bara för enkla heltalsfaktorer och rimliga antal block (≤ 10)
    if (!Number.isInteger(from) || from > 10) return null;
    const blockFactor = Math.round(factor);
    if (!Number.isInteger(factor) || blockFactor < 2 || blockFactor > 20) return null;

    const wrap = document.createElement('div');
    wrap.className = 'matt-bildstod';

    for (let i = 0; i < from; i++) {
      const bigBlock = document.createElement('div');
      bigBlock.className = 'matt-block-big';
      bigBlock.innerHTML = `<span class="matt-block-label">1 ${fromUnit}</span>
        <div class="matt-block-inner">`;
      const inner = document.createElement('div');
      inner.className = 'matt-block-inner';
      for (let j = 0; j < blockFactor; j++) {
        const small = document.createElement('span');
        small.className = 'matt-block-small';
        small.title = `1 ${toUnit}`;
        inner.appendChild(small);
      }
      bigBlock.appendChild(inner);

      const lbl = document.createElement('span');
      lbl.className = 'matt-block-sublabel';
      lbl.textContent = `= ${blockFactor} ${toUnit}`;
      bigBlock.appendChild(lbl);

      wrap.appendChild(bigBlock);
    }

    return wrap;
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
      renderArithmetic(problem, extraDisplay, settings);
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
      const r1     = isHour ? 76 : 83;
      const sw     = isHour ? 3  : 1;
      const col    = isHour ? '#1a1a2e' : '#aaa';
      ticks += `<line x1="${(CX+Math.cos(angle)*r1).toFixed(1)}" y1="${(CY+Math.sin(angle)*r1).toFixed(1)}"
                      x2="${(CX+Math.cos(angle)*90).toFixed(1)}" y2="${(CY+Math.sin(angle)*90).toFixed(1)}"
                      stroke="${col}" stroke-width="${sw}"/>`;
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

  function makeDotWrap() {
    const wrap = document.createElement('div');
    wrap.className = 'bildstod-dots';
    return wrap;
  }

  function addDot(container, color) {
    const d = document.createElement('span');
    d.className = 'dot';
    d.style.background = color;
    container.appendChild(d);
  }

  // =========================================================
  //  Menyhantering
  // =========================================================
  function toggleMenu() { document.body.classList.toggle('menu-open'); }
  function closeMenu()  { document.body.classList.remove('menu-open'); }

  // =========================================================
  //  Inställnings-UI
  // =========================================================
  function loadSettingsIntoUI() {
    const s = Settings.get();

    document.getElementById('grade-select').value = s.grade;

    document.querySelectorAll('#area-checkboxes input[type=checkbox]').forEach(cb => {
      cb.checked = s.areas.includes(cb.value);
    });

    document.getElementById('problemlosning-check').checked = s.problemlosning;
    document.getElementById('bildstod-check').checked       = s.bildstod;
    document.getElementById('extra-enabled-check').checked  = s.extraEnabled;
    document.getElementById('extra-type-select').value      = s.extraType;

    document.querySelectorAll('#geometri-type-checkboxes input[type=checkbox]').forEach(cb => {
      cb.checked = s.geometriTypes.includes(cb.value);
    });

    document.getElementById('extra-task-options')
      .classList.toggle('hidden', !s.extraEnabled);
  }

  function bindSettingsUI() {
    document.getElementById('grade-select').addEventListener('change', e => {
      Settings.setGrade(e.target.value);
    });

    document.querySelectorAll('#area-checkboxes input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = [...document.querySelectorAll('#area-checkboxes input:checked')]
          .map(c => c.value);
        Settings.setAreas(checked);
      });
    });

    document.getElementById('problemlosning-check').addEventListener('change', e => {
      Settings.setProblemlosning(e.target.checked);
    });

    document.getElementById('bildstod-check').addEventListener('change', e => {
      Settings.setBildstod(e.target.checked);
    });

    document.getElementById('extra-enabled-check').addEventListener('change', e => {
      Settings.setExtraEnabled(e.target.checked);
      document.getElementById('extra-task-options')
        .classList.toggle('hidden', !e.target.checked);
    });

    document.getElementById('extra-type-select').addEventListener('change', e => {
      Settings.setExtraType(e.target.value);
    });

    document.querySelectorAll('#geometri-type-checkboxes input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = [...document.querySelectorAll('#geometri-type-checkboxes input:checked')]
          .map(c => c.value);
        // Se till att minst ett alternativ alltid är valt
        if (checked.length > 0) Settings.setGeometriTypes(checked);
        else cb.checked = true; // återställ om man avmarkerar det sista
      });
    });
  }

  // =========================================================
  //  Start
  // =========================================================
  document.addEventListener('DOMContentLoaded', init);

  return {};
})();
