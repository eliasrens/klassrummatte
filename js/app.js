// js/app.js
// Huvudapplikation: klickhantering, timers och all DOM-rendering.
// Koordinerar Settings, Templates och Problems utan att duplicera deras logik.

const App = (() => {

  // =========================================================
  //  Konstanter
  // =========================================================
  const EXTRA_DELAY_MS = 20000;
  const CIRCLE_COLORS  = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261', '#a8dadc'];

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
  //  Scen-events (klick & tangentbord)
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
    // Ignorera klick inifrån menyn eller extrauppgiftspanelen
    if (e && (
      e.target.closest('#settings-menu') ||
      e.target.closest('#menu-toggle') ||
      e.target.closest('#extra-panel')
    )) return;

    // Stäng meny om öppen
    if (document.body.classList.contains('menu-open')) {
      closeMenu();
      return;
    }

    if (!problemVisible) {
      showNewProblem();
    } else {
      hideProblem();
      setTimeout(showNewProblem, 320);
    }
  }

  // =========================================================
  //  Problemflöde
  // =========================================================
  function showNewProblem() {
    clearExtraTask();
    const settings = Settings.get();
    const problem  = Problems.generateProblem(settings);

    renderProblem(problem);

    problemDisplay.classList.remove('hidden');
    // Ge webbläsaren en frame att beräkna layouten innan animationen körs
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

  function hideProblem() {
    problemDisplay.classList.remove('visible');
    clearExtraTask();
    problemVisible = false;
    setTimeout(() => {
      problemDisplay.classList.add('hidden');
      problemDisplay.innerHTML = '';
    }, 380);
  }

  function clearExtraTask() {
    if (extraTimer) { clearTimeout(extraTimer); extraTimer = null; }
    extraPanel.classList.remove('visible');
    document.body.classList.remove('extra-visible');
    setTimeout(() => {
      extraDisplay.innerHTML = '';
    }, 460);
  }

  function showExtraTask(settings) {
    const extra = Problems.generateExtraProblem(settings);
    renderExtraProblem(extra);
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
  function renderProblem(problem) {
    problemDisplay.innerHTML = '';
    problemDisplay.className = 'hidden'; // återställ för ny animation

    if (problem.isTextProblem) {
      renderTextProblem(problem);
      return;
    }

    switch (problem.type) {
      case 'division':       renderDivision(problem, problemDisplay); break;
      case 'klocka':         renderKlocka(problem, problemDisplay);   break;
      case 'brak':           renderBrak(problem, problemDisplay);     break;
      case 'geometri':       renderGeometri(problem, problemDisplay); break;
      case 'matt-langd':
      case 'matt-volym':     renderMatt(problem, problemDisplay);     break;
      default:               renderArithmetic(problem, problemDisplay); break;
    }
  }

  function renderTextProblem(problem) {
    const p = document.createElement('p');
    p.className = 'text-problem';
    p.textContent = problem.textTemplate;
    problemDisplay.appendChild(p);
  }

  // Standard aritmetik: "47 + 23 = ?"
  function renderArithmetic(problem, container) {
    const span = document.createElement('span');
    span.textContent = `${problem.a} ${problem.operator} ${problem.b} = ?`;
    container.appendChild(span);
  }

  // Division som lodrätt bråk + cirklar
  function renderDivision(problem, container) {
    // Cirklar till vänster
    if (problem.showCircles) {
      const circles = document.createElement('div');
      circles.className = 'division-circles';
      for (let i = 0; i < problem.circleCount; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.style.background = CIRCLE_COLORS[i % CIRCLE_COLORS.length];
        circles.appendChild(dot);
      }
      container.appendChild(circles);
    }

    // Bråk
    container.appendChild(buildFractionEl(problem.a, problem.b));

    // = ?
    const eq = document.createElement('span');
    eq.textContent = '= ?';
    container.appendChild(eq);
  }

  // Klocka: SVG + fråga
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

  // Bråk
  function renderBrak(problem, container) {
    if (problem.questionType === 'name') {
      container.appendChild(buildFractionEl(problem.numerator, problem.denominator));
      const q = document.createElement('span');
      q.textContent = '= ?';
      container.appendChild(q);

    } else if (problem.questionType === 'add-same-den') {
      container.appendChild(buildFractionEl(problem.a, problem.denominator));
      appendText(container, ' + ');
      container.appendChild(buildFractionEl(problem.b, problem.denominator));
      appendText(container, ' = ?');

    } else {
      // add-diff-den
      container.appendChild(buildFractionEl(problem.a.numerator, problem.a.denominator));
      appendText(container, ' + ');
      container.appendChild(buildFractionEl(problem.b.numerator, problem.b.denominator));
      appendText(container, ' = ?');
    }
  }

  // Geometri
  function renderGeometri(problem, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'geometry-display';

    const shapeTxt = document.createElement('span');
    shapeTxt.className = 'geometry-shape';
    shapeTxt.textContent = formatShapeText(problem);
    wrapper.appendChild(shapeTxt);

    const qTxt = document.createElement('span');
    qTxt.className = 'geometry-question';
    qTxt.textContent = problem.geoQuestion === 'area'
      ? 'Vad är arean?'
      : problem.shape === 'circle'
        ? 'Vad är omkretsen (circumferensen)?'
        : 'Vad är omkretsen?';
    wrapper.appendChild(qTxt);

    container.appendChild(wrapper);
  }

  function formatShapeText(problem) {
    const d = problem.dimensions;
    switch (problem.shape) {
      case 'square':    return `Kvadrat  |  sida = ${d.side} cm`;
      case 'rectangle': return `Rektangel  |  ${d.width} × ${d.height} cm`;
      case 'triangle':  return `Triangel  |  bas = ${d.base} cm, höjd = ${d.height} cm`;
      case 'circle':    return `Cirkel  |  r = ${d.radius} cm`;
      default:          return '';
    }
  }

  // Mått
  function renderMatt(problem, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'matt-display';
    const { from, fromUnit, toUnit } = problem.conversion;

    wrapper.innerHTML =
      `<span>${from} </span>` +
      `<span class="matt-unit">${fromUnit}</span>` +
      `<span> = ? </span>` +
      `<span class="matt-unit">${toUnit}</span>`;

    container.appendChild(wrapper);
  }

  // =========================================================
  //  Renderers – extrauppgift
  // =========================================================
  function renderExtraProblem(problem) {
    extraDisplay.innerHTML = '';

    if (problem.type.startsWith('uppstallning')) {
      renderUppstallning(problem, extraDisplay);
    } else if (problem.type === 'klocka') {
      renderKlocka(problem, extraDisplay);
    } else if (problem.type === 'geometri') {
      renderGeometriExtra(problem, extraDisplay);
    } else {
      renderArithmetic(problem, extraDisplay);
    }
  }

  function renderGeometriExtra(problem, container) {
    const shapeTxt = document.createElement('p');
    shapeTxt.style.cssText = 'font-size:0.8em; color: var(--accent-2); margin-bottom:0.3em;';
    shapeTxt.textContent = formatShapeText(problem);
    container.appendChild(shapeTxt);

    const qTxt = document.createElement('p');
    qTxt.style.cssText = 'font-size:0.55em; color: var(--text-muted);';
    qTxt.textContent = problem.geoQuestion === 'area' ? 'Vad är arean?' : 'Vad är omkretsen?';
    container.appendChild(qTxt);
  }

  // Uppställning (lodrätt kolumn)
  function renderUppstallning(problem, container) {
    const aStr = String(problem.a);
    const bStr = String(problem.b);
    const ansStr = String(problem.answer);
    const width = Math.max(aStr.length, bStr.length, ansStr.length) + 1;

    const div = document.createElement('div');
    div.className = 'uppstallning';

    // Rad 1: a
    const row1 = document.createElement('div');
    row1.className = 'uppstallning-row';
    row1.textContent = aStr.padStart(width, '\u00A0');
    div.appendChild(row1);

    // Rad 2: operator + b
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

    // Linje
    const line = document.createElement('div');
    line.className = 'uppstallning-line';
    div.appendChild(line);

    // Svar (dolt)
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
    const SIZE = 200;
    const CX = 100, CY = 100;

    const minAngle  = (minutes / 60) * 2 * Math.PI - Math.PI / 2;
    const hourAngle = ((hours % 12 + minutes / 60) / 12) * 2 * Math.PI - Math.PI / 2;

    const mx = CX + Math.cos(minAngle)  * 68;
    const my = CY + Math.sin(minAngle)  * 68;
    const hx = CX + Math.cos(hourAngle) * 48;
    const hy = CY + Math.sin(hourAngle) * 48;

    // Bygger SVG-innehåll som HTML-sträng
    let ticks = '';
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
      const isHour = i % 5 === 0;
      const r1 = isHour ? 76 : 83;
      const r2 = 90;
      const sw = isHour ? 3 : 1;
      const col = isHour ? '#1a1a2e' : '#aaa';
      ticks += `<line x1="${(CX + Math.cos(angle) * r1).toFixed(1)}" y1="${(CY + Math.sin(angle) * r1).toFixed(1)}"
                      x2="${(CX + Math.cos(angle) * r2).toFixed(1)}" y2="${(CY + Math.sin(angle) * r2).toFixed(1)}"
                      stroke="${col}" stroke-width="${sw}"/>`;
    }

    let numbers = '';
    for (let i = 1; i <= 12; i++) {
      const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
      const nx = (CX + Math.cos(angle) * 64).toFixed(1);
      const ny = (CY + Math.sin(angle) * 64).toFixed(1);
      numbers += `<text x="${nx}" y="${ny}" text-anchor="middle" dominant-baseline="central"
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
      ${ticks}
      ${numbers}
      <!-- Timvisare -->
      <line x1="${CX}" y1="${CY}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}"
            stroke="#1a1a2e" stroke-width="6" stroke-linecap="round"/>
      <!-- Minutvisare -->
      <line x1="${CX}" y1="${CY}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}"
            stroke="#457b9d" stroke-width="4" stroke-linecap="round"/>
      <!-- Centerpunkt -->
      <circle cx="${CX}" cy="${CY}" r="5" fill="#1a1a2e"/>
    `;

    return svg;
  }

  // =========================================================
  //  Menyhantering
  // =========================================================
  function toggleMenu() {
    document.body.classList.toggle('menu-open');
  }

  function closeMenu() {
    document.body.classList.remove('menu-open');
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

    document.getElementById('problemlosning-check').checked  = s.problemlosning;
    document.getElementById('extra-enabled-check').checked   = s.extraEnabled;
    document.getElementById('extra-type-select').value       = s.extraType;

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

    document.getElementById('extra-enabled-check').addEventListener('change', e => {
      Settings.setExtraEnabled(e.target.checked);
      document.getElementById('extra-task-options')
        .classList.toggle('hidden', !e.target.checked);
    });

    document.getElementById('extra-type-select').addEventListener('change', e => {
      Settings.setExtraType(e.target.value);
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

  // =========================================================
  //  Start
  // =========================================================
  document.addEventListener('DOMContentLoaded', init);

  return {}; // Ingen publik API behövs externt
})();
