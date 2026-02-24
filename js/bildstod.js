// js/bildstod.js
// Bildstöd – bygger visuella prickar/figurer som pedagogiskt stöd.
// Ren modul – ingen applikationsstate. Tar emot problem, settings och container som parametrar.

const Bildstod = (() => {

  const CIRCLE_COLORS  = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261', '#a8dadc'];
  const DOT_COLOR_A    = '#e63946';
  const DOT_COLOR_B    = '#457b9d';
  const DOT_COLOR_GREY = '#d1d5db';

  // =========================================================
  //  Publikt: kan detta problem ha bildstöd?
  // =========================================================
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

  // =========================================================
  //  Publikt: bygg och lägg till bildstöd i container
  //  problemVisible – aktuellt värde vid anropstillfället (via closure i app.js)
  // =========================================================
  function appendBildstod(problem, settings, problemDisplay, problemVisible) {
    if (!problemVisible) return;
    const el = buildBildstodEl(problem, settings);
    if (!el) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'bildstod-container bildstod-anim';
    wrapper.appendChild(el);
    problemDisplay.prepend(wrapper);
  }

  // =========================================================
  //  Privat: välj rätt byggare
  // =========================================================
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

  // =========================================================
  //  Prickar för aritmetik
  // =========================================================
  function buildArithmeticDots(problem) {
    const { type, a, b } = problem;

    if (type === 'addition') {
      const wrap = makeDotWrap('bildstod-dots');
      for (let i = 0; i < a; i++) addDot(wrap, DOT_COLOR_A);
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

  // =========================================================
  //  Rutnät för division
  // =========================================================
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
  //  Mått-bildstöd (block-visualisering)
  // =========================================================
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
  //  Hjälpfunktioner
  // =========================================================
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

  return { hasBildstodSupport, appendBildstod };
})();
