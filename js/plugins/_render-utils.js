// js/plugins/_render-utils.js
// Render- och bildstöd-hjälpare: DOM-byggare, bildstöd-prickar och -rutnät.
// Exponeras globalt som PluginRenderUtils.

const PluginRenderUtils = (() => {

  // =========================================================
  //  Render-hjälpare (delade)
  // =========================================================
  function appendText(container, text) {
    const span = document.createElement('span');
    span.textContent = text;
    container.appendChild(span);
  }

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

  function appendAnswerBox(text, container) {
    const box = document.createElement('div');
    box.className = 'answer-box';
    const label = document.createElement('span');
    label.className = 'answer-box-label';
    label.textContent = 'Svar:';
    const val = document.createElement('span');
    val.className = 'answer-value';
    val.textContent = text;
    box.appendChild(label);
    box.appendChild(val);
    container.appendChild(box);
  }

  function renderArithmetic(problem, container) {
    const span = document.createElement('span');
    span.textContent = `${problem.a} ${problem.operator} ${problem.b} =`;
    container.appendChild(span);
    const ans = document.createElement('span');
    ans.className = 'answer-value answer-hidden';
    ans.textContent = ` ${problem.answer}`;
    container.appendChild(ans);
  }

  function renderDecimaler(problem, container) {
    const d = problem.decimalDigits || 1;
    function toComma(n) { return n.toFixed(d).replace('.', ','); }
    const span = document.createElement('span');
    span.textContent = `${toComma(problem.a)} ${problem.operator} ${toComma(problem.b)} =`;
    container.appendChild(span);
    const ans = document.createElement('span');
    ans.className = 'answer-value answer-hidden';
    ans.textContent = ` ${toComma(problem.answer)}`;
    container.appendChild(ans);
  }

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
  //  Bildstöd-hjälpare
  // =========================================================
  const CIRCLE_COLORS  = ['#e63946', '#457b9d', '#2a9d8f', '#e9c46a', '#f4a261', '#a8dadc'];
  const DOT_COLOR_A    = '#e63946';
  const DOT_COLOR_B    = '#457b9d';
  const DOT_COLOR_GREY = '#d1d5db';

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
  //  Publik API
  // =========================================================
  return {
    appendText, buildFractionEl, appendAnswerBox,
    renderArithmetic, renderDecimaler, renderUppstallning, renderMatt,
    CIRCLE_COLORS, DOT_COLOR_A, DOT_COLOR_B, DOT_COLOR_GREY,
    makeDotWrap, addDot,
    buildArithmeticDots, buildDivisionGrid,
    canBuildMattBildstod, buildMattBildstodEl,
  };
})();
