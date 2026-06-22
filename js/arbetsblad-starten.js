// js/arbetsblad-starten.js
// Starten-relaterade hjälpfunktioner (stateless) extraherade från arbetsblad.js.

const ArbetsbladStarten = (() => {

  const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

  const STARTEN_COLORS = [
    { theme: '',          label: 'Blågrön',  bg: 'linear-gradient(135deg,hsl(204,38%,44%),hsl(172,58%,39%))' },
    { theme: 'vinrod',    label: 'Vinröd',   bg: 'linear-gradient(135deg,hsl(350,38%,44%),hsl(318,58%,39%))' },
    { theme: 'lila',      label: 'Lila',     bg: 'linear-gradient(135deg,hsl(275,38%,44%),hsl(243,58%,39%))' },
    { theme: 'skog',      label: 'Skog',     bg: 'linear-gradient(135deg,hsl(140,38%,44%),hsl(108,58%,39%))' },
    { theme: 'korall',    label: 'Korall',   bg: 'linear-gradient(135deg,hsl(15,38%,44%),hsl(343,58%,39%))' },
    { theme: 'guld',      label: 'Guld',     bg: 'linear-gradient(135deg,hsl(40,38%,44%),hsl(8,58%,39%))' },
    { theme: 'hav',       label: 'Hav',      bg: 'linear-gradient(135deg,hsl(215,38%,44%),hsl(190,58%,39%))' },
    { theme: 'rosa',      label: 'Rosa',     bg: 'linear-gradient(135deg,hsl(330,38%,44%),hsl(300,58%,39%))' },
    { theme: 'lavendel',  label: 'Lavendel', bg: 'linear-gradient(135deg,hsl(258,38%,44%),hsl(226,58%,39%))' },
    { theme: 'oliv',      label: 'Oliv',     bg: 'linear-gradient(135deg,hsl(75,38%,44%),hsl(45,58%,39%))' },
    { theme: 'persika',   label: 'Persika',  bg: 'linear-gradient(135deg,hsl(25,38%,44%),hsl(355,58%,39%))' },
    { theme: 'stal',      label: 'Stål',     bg: 'linear-gradient(135deg,hsl(200,20%,48%),hsl(220,25%,42%))' },
  ];

  let periodCounter = 0;

  // Fyll numCols platser med selectedOps och rotera vilken som dubbleras per dag
  function buildBalancedOps(selectedOps, numCols, dayIndex) {
    const ops = [];
    if (selectedOps.length >= numCols) {
      // Fler (eller lika många) ops än kolumner — välj slumpmässigt
      for (let i = 0; i < numCols; i++) ops.push(selectedOps[i % selectedOps.length]);
    } else {
      // Färre ops än kolumner — varje op minst en gång, rotera extra-platser
      selectedOps.forEach(op => ops.push(op));
      const extras = numCols - selectedOps.length;
      for (let i = 0; i < extras; i++) {
        ops.push(selectedOps[(dayIndex + i) % selectedOps.length]);
      }
    }
    // Blanda ordningen
    for (let i = ops.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ops[i], ops[j]] = [ops[j], ops[i]];
    }
    return ops;
  }

  function readStartenOps() {
    const ops = [];
    if (document.getElementById('st-op-add')?.checked) ops.push('add');
    if (document.getElementById('st-op-sub')?.checked) ops.push('sub');
    if (document.getElementById('st-op-mult')?.checked) ops.push('mult');
    if (document.getElementById('st-op-div-cell')?.checked) ops.push('div');
    const showDiv = document.getElementById('st-op-div')?.checked ?? true;
    const vaxlingEl = document.querySelector('input[name="st-vaxling"]:checked');
    const vaxling = vaxlingEl && vaxlingEl.value ? vaxlingEl.value : null;
    return { ops: ops.length > 0 ? ops : ['add', 'sub', 'mult'], showDiv, vaxling };
  }

  function readStartenPeriods() {
    const periods = [];
    document.querySelectorAll('.st-period').forEach(el => {
      const weeks = parseInt(el.querySelector('.st-period-weeks')?.value) || 4;
      const ops = [];
      el.querySelectorAll('.st-period-ops input[type="checkbox"]:checked').forEach(cb => {
        const op = cb.dataset.op;
        if (op === 'div-cell') ops.push('div');
        else if (op !== 'div') ops.push(op);
      });
      const showDiv = !!el.querySelector('.st-period-ops input[data-op="div"]:checked');
      const colorBtn = el.querySelector('.st-pcolor-btn--active');
      const color = colorBtn ? (colorBtn.dataset.theme || '') : '';
      const vaxEl = el.querySelector('.st-period-vaxling input[type="radio"]:checked');
      const vaxling = vaxEl && vaxEl.value ? vaxEl.value : null;
      periods.push({
        weeks,
        ops: ops.length > 0 ? ops : ['add', 'sub', 'mult'],
        showDiv,
        color,
        vaxling,
      });
    });
    return periods;
  }

  function buildPeriodEl(numWeeks) {
    const idx = periodCounter++;
    const div = document.createElement('div');
    div.className = 'st-period';
    div.dataset.periodIdx = idx;

    // Header med veckorange
    const header = document.createElement('div');
    header.className = 'st-period-header';
    const title = document.createElement('span');
    title.className = 'st-period-title';
    title.textContent = 'Period ' + (document.querySelectorAll('.st-period').length + 1);
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'st-period-remove';
    removeBtn.textContent = '\u2715';
    removeBtn.title = 'Ta bort period';
    removeBtn.addEventListener('click', () => {
      div.remove();
      reindexPeriods();
    });
    header.append(title, removeBtn);
    div.appendChild(header);

    // Veckorange
    const rangeRow = document.createElement('div');
    rangeRow.className = 'st-period-range';
    rangeRow.innerHTML =
      `<label>Antal veckor <input type="number" class="st-period-weeks" value="${numWeeks}" min="1" max="40"></label>`;
    div.appendChild(rangeRow);

    // Räknesätt
    const opsDiv = document.createElement('div');
    opsDiv.className = 'st-period-ops';
    opsDiv.innerHTML =
      '<label class="st-period-check"><input type="checkbox" data-op="add" checked> Add</label>' +
      '<label class="st-period-check"><input type="checkbox" data-op="sub" checked> Sub</label>' +
      '<label class="st-period-check"><input type="checkbox" data-op="mult" checked> Mult</label>' +
      '<label class="st-period-check"><input type="checkbox" data-op="div-cell"> Div</label>' +
      '<label class="st-period-check"><input type="checkbox" data-op="div" checked> Div-kol</label>';
    div.appendChild(opsDiv);

    // Växling
    const vaxDiv = document.createElement('div');
    vaxDiv.className = 'st-period-vaxling';
    const vaxName = 'st-vax-' + idx;
    vaxDiv.innerHTML =
      `<span class="st-period-vax-label">Växling:</span>` +
      `<label class="st-period-check"><input type="radio" name="${vaxName}" value="" checked> Blandad</label>` +
      `<label class="st-period-check"><input type="radio" name="${vaxName}" value="utan"> Utan</label>` +
      `<label class="st-period-check"><input type="radio" name="${vaxName}" value="med"> Med</label>`;
    div.appendChild(vaxDiv);

    // Färg
    const colorDiv = document.createElement('div');
    colorDiv.className = 'st-period-colors';
    STARTEN_COLORS.forEach((c, ci) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'st-pcolor-btn' + (ci === 0 ? ' st-pcolor-btn--active' : '');
      btn.dataset.theme = c.theme;
      btn.title = c.label;
      const span = document.createElement('span');
      span.style.background = c.bg;
      btn.appendChild(span);
      btn.addEventListener('click', () => {
        colorDiv.querySelectorAll('.st-pcolor-btn').forEach(b => b.classList.remove('st-pcolor-btn--active'));
        btn.classList.add('st-pcolor-btn--active');
      });
      colorDiv.appendChild(btn);
    });
    div.appendChild(colorDiv);

    return div;
  }

  function reindexPeriods() {
    document.querySelectorAll('.st-period').forEach((el, i) => {
      el.querySelector('.st-period-title').textContent = 'Period ' + (i + 1);
    });
  }

  function generateStartenProblemsWithOps(grade, ops, showDiv, vaxling) {
    const c = PluginUtils.cfg(grade);
    const numCols = showDiv ? 3 : 4;
    const vaxOpts = vaxling ? { vaxling } : null;
    const rows = [];
    for (let d = 0; d < 5; d++) {
      const colOps = buildBalancedOps(ops, numCols, d);
      const uppstallningar = colOps.map(op => PluginUtils.genUppstallning(op, c, vaxOpts));

      let brak = null;
      if (showDiv) {
        const divisor  = PluginUtils.randInt(2, 9);
        const quotient = PluginUtils.randInt(2, 9);
        brak = { dividend: divisor * quotient, divisor, quotient };
      }
      rows.push({ uppstallningar, brak });
    }
    return rows;
  }

  // Bygg en starten-problemcell (uppstallning eller division)
  function buildStartenProblemTd(problem, regenFn) {
    const td = document.createElement('td');

    if (problem.type === 'uppstallning-div') {
      td.className = 'starten-problem starten-problem--div';
      const line = document.createElement('div');
      line.className = 'starten-brak-line starten-div-brak-line';
      line.innerHTML =
        `<span class="starten-frac">` +
          `<span class="starten-frac-num">${problem.a}</span>` +
          `<span class="starten-frac-den">${problem.b}</span>` +
        `</span>` +
        `<span class="starten-eq">=</span>`;
      td.appendChild(line);
    } else if (problem.type === 'klocka' && typeof PluginManager !== 'undefined' && PluginManager.get('klocka')) {
      // Visa riktig klock-SVG via klocka-pluginen i samma cellstorlek
      td.className = 'starten-problem starten-problem--klocka';
      PluginManager.get('klocka').render(problem, td);
    } else if (problem.displayText) {
      // Plugin-genererad uppgift (bråk, prioritet m.fl.) – ingen siffer-grid,
      // men SAMMA cellstorlek: en tom skrivyta för handskriften.
      td.className = 'starten-problem starten-problem--text';
      const text = document.createElement('div');
      text.className = 'starten-problem-text';
      text.textContent = problem.displayText;
      td.appendChild(text);

      const ansArea = document.createElement('div');
      ansArea.className = 'starten-answer-area';
      td.appendChild(ansArea);
    } else {
      td.className = 'starten-problem';
      const text = document.createElement('div');
      text.className = 'starten-problem-text';
      text.textContent = `${problem.a} ${problem.operator} ${problem.b}`;
      td.appendChild(text);

      const grid = document.createElement('table');
      grid.className = 'starten-grid';
      const digits = Math.max(String(problem.a).length, String(problem.b).length, String(problem.answer).length) + 1;
      const cols = Math.max(digits, 4);
      for (let r = 0; r < 3; r++) {
        const gtr = document.createElement('tr');
        for (let c = 0; c < cols; c++) gtr.appendChild(document.createElement('td'));
        grid.appendChild(gtr);
      }
      const lastRow = document.createElement('tr');
      lastRow.className = 'starten-grid-answer';
      for (let c = 0; c < cols; c++) lastRow.appendChild(document.createElement('td'));
      grid.appendChild(lastRow);
      td.appendChild(grid);
    }

    if (regenFn) {
      const regen = document.createElement('button');
      regen.className = 'starten-regen no-print';
      regen.title = 'Byt uppgift';
      regen.textContent = '\u{1F504}';
      regen.addEventListener('click', regenFn);
      td.appendChild(regen);
    }

    return td;
  }

  /**
   * Renderar ett enskilt Starten-ark.
   * @param {HTMLElement} wrap - Container att lägga arket i
   * @param {number} grade - Årskurs
   * @param {Array} startenRows - Rader med uppställningar/bråk
   * @param {string} title - Arkrubrik
   * @param {string} color - Tema-klass för färgval
   * @param {boolean} pageBreak - Om sidbrytning ska läggas till
   * @param {number} sheetIdx - Arkindex (för regen-knappar)
   * @param {string} dStyle - Designstil (closure-värde från arbetsblad.js)
   * @param {Function} injectFrame - injectFrameSVG-funktion från arbetsblad.js
   * @param {Function|null} regenCellFn - Callback-fabrik (sheetIdx, dayIdx, cellIdx) => void
   */
  function renderSingleStartenSheet(wrap, grade, startenRows, title, color, pageBreak, sheetIdx, dStyle, injectFrame, regenCellFn) {
    const sheet = document.createElement('div');
    sheet.className = 'ab-sheet' + (color ? ` starten-${color}` : '') + (dStyle ? ` ab-design--${dStyle}` : '') + (ArbetsbladConfig.FRAME_SVG[dStyle] ? ' ab-design--frame' : '');
    if (pageBreak) sheet.classList.add('ab-sheet--next-page');

    const inner = document.createElement('div');
    inner.className = 'ab-sheet-inner';

    // Header
    const header = document.createElement('header');
    header.className = 'ab-header starten-header';
    const left = document.createElement('div');
    left.className = 'ab-header-left';
    const titleEl = document.createElement('div');
    titleEl.className = 'ab-title';
    titleEl.textContent = title;
    const sub = document.createElement('div');
    sub.className = 'ab-subtitle';
    sub.textContent = `\u00c5k ${grade}`;
    left.append(titleEl, sub);
    const fields = document.createElement('div');
    fields.className = 'ab-header-fields';
    fields.innerHTML = '<div><div class="ab-field-label">Namn:</div><div class="ab-field-line">&nbsp;</div></div>';
    header.append(left, fields);
    inner.appendChild(header);

    // Tabell
    const table = document.createElement('table');
    table.className = 'starten-table' + (color ? ` starten-${color}` : '');

    startenRows.forEach((row, di) => {
      const tr = document.createElement('tr');
      const tdDay = document.createElement('td');
      tdDay.className = 'starten-day';
      tdDay.textContent = DAYS[di];
      tr.appendChild(tdDay);

      row.uppstallningar.forEach((problem, pi) => {
        const regenFn = regenCellFn ? () => regenCellFn(sheetIdx, di, pi) : null;
        tr.appendChild(buildStartenProblemTd(problem, regenFn));
      });

      if (row.brak) {
        const tdBrak = document.createElement('td');
        tdBrak.className = 'starten-brak';
        const brakLine = document.createElement('div');
        brakLine.className = 'starten-brak-line';
        brakLine.innerHTML =
          `<span class="starten-frac">` +
            `<span class="starten-frac-num">${row.brak.dividend}</span>` +
            `<span class="starten-frac-den">${row.brak.divisor}</span>` +
          `</span>` +
          `<span class="starten-eq">=</span>` +
          `<span class="starten-blank"></span>`;
        tdBrak.appendChild(brakLine);

        const multLine = document.createElement('div');
        multLine.className = 'starten-mult-line';
        multLine.innerHTML =
          '<span class="starten-blank starten-blank--short"></span>' +
          '<span class="starten-op">&middot;</span>' +
          '<span class="starten-blank starten-blank--short"></span>' +
          '<span class="starten-eq">=</span>' +
          '<span class="starten-blank starten-blank--short"></span>';
        tdBrak.appendChild(multLine);

        if (regenCellFn) {
          const regenBrak = document.createElement('button');
          regenBrak.className = 'starten-regen no-print';
          regenBrak.title = 'Byt uppgift';
          regenBrak.textContent = '\u{1F504}';
          regenBrak.addEventListener('click', () => regenCellFn(sheetIdx, di, row.uppstallningar.length));
          tdBrak.appendChild(regenBrak);
        }

        tr.appendChild(tdBrak);
      }
      table.appendChild(tr);
    });

    inner.appendChild(table);
    sheet.appendChild(inner);
    injectFrame(sheet);
    wrap.appendChild(sheet);
  }

  return {
    DAYS,
    STARTEN_COLORS,
    buildBalancedOps,
    readStartenOps,
    readStartenPeriods,
    buildPeriodEl,
    reindexPeriods,
    generateStartenProblemsWithOps,
    buildStartenProblemTd,
    renderSingleStartenSheet,
  };
})();
