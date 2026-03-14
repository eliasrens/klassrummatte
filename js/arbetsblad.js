// js/arbetsblad.js
// Stencil-verktyg: genererar och renderar ett utskriftsvänligt arbetsblad.
// Underkategorier med individuella antal per område.

const Arbetsblad = (() => {

  let sheetProblems = [];  // Aktuell lista med problem
  let startenData   = null; // { grade, rows } för Starten-läge
  let batchSheets   = [];   // [{ grade, rows, color, vaxling }] för batch-regen
  let plConfig      = null; // Senaste PL-config för omrendering vid färgbyte
  let startenColor  = '';   // tema-klass för färgval

  // =========================================================
  //  Områdeskonfiguration med underkategorier
  // =========================================================
  // Områden som stöder autogenererad problemlösning (Templates.canWrap)
  const PROBLEMLOSNING_AREAS = [
    'addition', 'subtraktion', 'multiplikation', 'division',
    'geometri', 'matt-langd', 'matt-volym', 'matt-vikt', 'matt-tid', 'matt-area',
    'klocka', 'procent', 'brak'
  ];

  const AREA_CONFIG = [
    { cat: 'Aritmetik', areas: [
      { id: 'addition',       label: 'Addition' },
      { id: 'subtraktion',    label: 'Subtraktion' },
      { id: 'multiplikation', label: 'Multiplikation', subcats: [
        { id: 'tables-basic',   label: 'Tabeller',       default: 0 },
        { id: 'tables-large',   label: 'Stora tal',      default: 0 },
      ]},
      { id: 'division', label: 'Division', subcats: [
        { id: 'tables-basic',   label: 'Tabeller',       default: 0 },
        { id: 'tables-large',   label: 'Stora tal',      default: 0 },
        { id: 'rest',           label: 'Med rest',        default: 0 },
      ]},
    ]},
    { cat: 'Algebra', areas: [
      { id: 'prioritet',     label: 'Prioritetsregler' },
      { id: 'oppna-utsagor', label: 'Öppna utsagor' },
      { id: 'talfoljd',      label: 'Talföljd' },
    ]},
    { cat: 'Tal & samband', areas: [
      { id: 'brak',         label: 'Bråk' },
      { id: 'procent',      label: 'Procent' },
      { id: 'tallinje',     label: 'Tallinje' },
      { id: 'talsorter',    label: 'Talsorter' },
      { id: 'negativa-tal', label: 'Negativa tal' },
      { id: 'romerska',     label: 'Romerska siffror' },
    ]},
    { cat: 'Geometri', areas: [
      { id: 'geometri',         label: 'Geometri' },
      { id: 'symmetri',         label: 'Symmetri' },
      { id: 'koordinatsystem',  label: 'Koordinatsystem' },
    ]},
    { cat: 'Mått & tid', areas: [
      { id: 'klocka',     label: 'Klocka' },
      { id: 'matt-langd', label: 'Längd' },
      { id: 'matt-volym', label: 'Volym' },
      { id: 'matt-vikt',  label: 'Vikt' },
      { id: 'matt-tid',   label: 'Tid' },
      { id: 'matt-area',  label: 'Area-mått' },
    ]},
    { cat: 'Statistik', areas: [
      { id: 'statistik',   label: 'Statistik' },
      { id: 'sannolikhet', label: 'Sannolikhet' },
    ]},
  ];

  // =========================================================
  //  Bygg områdes-popup dynamiskt
  // =========================================================
  function buildAbSidebar() {
    const container = document.getElementById('ab-area-checks');
    if (!container) return;
    container.innerHTML = '';

    AREA_CONFIG.forEach(category => {
      const catLabel = document.createElement('div');
      catLabel.className = 'sidebar-cat-label';
      catLabel.textContent = category.cat;
      container.appendChild(catLabel);

      category.areas.forEach(area => {
        const item = document.createElement('div');
        item.className = 'ab-area-item';

        // Huvudcheckbox
        const label = document.createElement('label');
        label.className = 'sidebar-check-row';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = area.id;
        if (area.checked) cb.checked = true;
        label.appendChild(cb);
        label.appendChild(document.createTextNode(' ' + area.label));
        item.appendChild(label);

        // Underkategorier (antal-inputs) – bara om explicit definierade
        if (area.subcats && area.subcats.length > 0) {
          const subcats = area.subcats;
          const subcatDiv = document.createElement('div');
          subcatDiv.className = 'ab-subcats';
          subcatDiv.dataset.area = area.id;
          subcatDiv.classList.add('hidden');

          subcats.forEach(sc => {
            const row = document.createElement('div');
            row.className = 'ab-subcat-row';

            const span = document.createElement('span');
            span.textContent = sc.label;
            row.appendChild(span);

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '99';
            input.value = sc.default || 0;
            input.dataset.area = area.id;
            input.dataset.subcat = sc.id;
            row.appendChild(input);

            subcatDiv.appendChild(row);
          });

          cb.addEventListener('change', () => {
            subcatDiv.classList.toggle('hidden', !cb.checked);
            updateTotalCount();
          });

          item.appendChild(subcatDiv);
        } else {
          cb.addEventListener('change', () => updateTotalCount());
        }

        container.appendChild(item);
      });
    });

    // Lyssna på ändringar i alla antal-inputs
    container.querySelectorAll('input[type="number"]').forEach(inp => {
      inp.addEventListener('input', updateTotalCount);
    });

    updateTotalCount();
  }

  function updateTotalCount() {
    const manualTotal = getSubcatSpecs().reduce((sum, s) => sum + s.count, 0);
    const el = document.getElementById('ab-total-count');
    if (!el) return;
    if (manualTotal > 0) {
      el.textContent = manualTotal;
    } else {
      // Auto-fördeling: beräkna från layout
      const checkedAreas = getCheckedAreas();
      if (checkedAreas.length > 0) {
        const cols = parseInt(document.getElementById('ab-cols')?.value) || 2;
        const pagesVal = document.getElementById('ab-pages')?.value || 'auto';
        const pages = pagesVal === 'auto' ? 1 : (parseInt(pagesVal) || 1);
        el.textContent = `~${cols * 5 * pages} (auto)`;
      } else {
        el.textContent = '0';
      }
    }
  }

  // =========================================================
  //  Läs underkategori-specifikationer
  // =========================================================
  function getSubcatSpecs() {
    const specs = [];
    const container = document.getElementById('ab-area-checks');
    if (!container) return specs;

    container.querySelectorAll('.ab-subcats:not(.hidden)').forEach(subcatDiv => {
      const area = subcatDiv.dataset.area;
      subcatDiv.querySelectorAll('input[type="number"]').forEach(inp => {
        const count = parseInt(inp.value) || 0;
        if (count > 0) {
          specs.push({ area, subcat: inp.dataset.subcat, count });
        }
      });
    });
    return specs;
  }

  // Hämta ikryssade områden (utan att titta på antal)
  function getCheckedAreas() {
    const container = document.getElementById('ab-area-checks');
    if (!container) return [];
    const areas = [];
    container.querySelectorAll('.sidebar-check-row input[type="checkbox"]:checked').forEach(cb => {
      areas.push(cb.value);
    });
    return areas;
  }

  // =========================================================
  //  Inställningar från konfigurations-panelen
  // =========================================================
  function readConfig() {
    const grade   = parseInt(document.getElementById('ab-grade').value)  || 3;
    const cols    = parseInt(document.getElementById('ab-cols').value)   || 2;
    const themeEl = document.getElementById('ab-theme');
    const theme   = themeEl ? themeEl.value : '';
    const title   = document.getElementById('ab-title').value.trim()     || 'Matematik';
    const showAns = document.getElementById('ab-show-answers').checked;
    const pagesVal = document.getElementById('ab-pages').value;
    const specs   = getSubcatSpecs();
    const total   = specs.reduce((sum, s) => sum + s.count, 0);
    const perPage = cols * 5;
    const pages   = pagesVal === 'auto'
      ? Math.max(1, Math.ceil(total / perPage))
      : parseInt(pagesVal) || 1;
    return { grade, count: total, cols, pages, perPage, theme, title, showAns, specs, pagesVal };
  }

  // Läs config för problemlösning-läget (från sidopanelen)
  function readPLConfig() {
    const grade   = parseInt(document.getElementById('ab-grade').value) || 3;
    const title   = document.getElementById('ab-title').value.trim()   || 'Problemlösning';
    const source  = document.querySelector('input[name="pl-source"]:checked')?.value || 'auto';
    const perPage = parseInt(document.querySelector('input[name="pl-layout"]:checked')?.value) || 6;
    const pages   = parseInt(document.getElementById('pl-pages').value) || 1;
    const showAns = document.getElementById('pl-show-answers')?.checked || false;
    const cols    = 2;

    // Hämta valda områden
    const selectedAreas = [];
    document.querySelectorAll('#pl-area-checks input[type="checkbox"]:checked').forEach(cb => {
      selectedAreas.push(cb.value);
    });

    return { grade, title, source, perPage, pages, showAns, cols, selectedAreas };
  }

  // =========================================================
  //  Problem-generering per underkategori
  // =========================================================
  function makeBaseSettings(grade) {
    return {
      grade,
      areas:          [],
      problemlosning: false,
      flersteg:       false,
      addSubMode:     [],
      multDivMode:    [],
      specificTables: [],
      brakTypes:      ['name', 'add-same-den', 'compare', 'add-diff-den', 'fraction-of-whole', 'simplify'],
      geometriTypes:  ['area', 'perimeter'],
      klockaTypes:    ['analog', 'digital'],
    };
  }

  // Generera egna (lagrade) uppgifter från Settings/CustomProblems
  function generateEgnaProblems(count, allProblems) {
    const stored = typeof Settings !== 'undefined' ? Settings.getCustomProblems() : [];
    if (!stored || stored.length === 0) return [];
    const problems = [];
    const shuffled = stored.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < count; i++) {
      const p = shuffled[i % shuffled.length];
      problems.push({
        type: 'egna',
        isTextProblem: true,
        textTemplate: p.question,
        answer: p.answer,
      });
    }
    return problems;
  }

  // Generera autogenererade problemlösningsuppgifter
  // areas: om angivet, begränsa till dessa områden; annars PROBLEMLOSNING_AREAS
  function generateAutoProblemlosning(count, grade, allProblems, areas) {
    const pool = (areas && areas.length > 0) ? areas : PROBLEMLOSNING_AREAS;
    const problems = [];
    const settings = makeBaseSettings(grade);
    for (let i = 0; i < count; i++) {
      let p = null;
      for (let attempt = 0; attempt < 10 && !p; attempt++) {
        try {
          const area = pool[Math.floor(Math.random() * pool.length)];
          const plugin = PluginManager.get(area);
          if (!plugin) continue;
          let candidate = plugin.generate(settings);
          if (candidate && typeof Templates !== 'undefined' && Templates.canWrap(area)) {
            candidate = Templates.wrapInTemplate(candidate, grade);
          }
          if (candidate && !isDuplicate(candidate, [...allProblems, ...problems])) {
            p = candidate;
          }
        } catch (_) {}
      }
      if (p) problems.push(p);
    }
    return problems;
  }

  function generateForSubcat(spec, grade, allProblems) {
    const area   = spec.area;
    const subcat = spec.subcat;
    const count  = spec.count;

    // Problemlösning – egen kategori
    if (area === 'problemlosning-auto') {
      return generateAutoProblemlosning(count, grade, allProblems);
    }
    if (area === 'problemlosning-egna') {
      return generateEgnaProblems(count, allProblems);
    }

    const type   = area === 'oppna-utsagor' ? 'oppna-utsaga' : area;
    const plugin = PluginManager.get(type);
    if (!plugin) return [];

    const problems = [];
    const settings = makeBaseSettings(grade);

    // Konfigurera settings för denna specifika underkategori
    // addition/subtraktion: alltid standard (ingen uppställning på arbetsblad)
    if (area === 'multiplikation' || area === 'division') {
      if (subcat === 'tables-basic')  settings.multDivMode = ['tables-basic'];
      else if (subcat === 'tables-large') settings.multDivMode = ['tables-large'];
      else if (subcat === 'rest') { settings.multDivMode = ['tables-basic']; settings.divisionRest = true; }
    }

    for (let i = 0; i < count; i++) {
      let p = null;
      for (let attempt = 0; attempt < 10 && !p; attempt++) {
        try {
          let candidate = plugin.generate(settings);
          if (candidate && !isDuplicate(candidate, [...allProblems, ...problems])) {
            p = candidate;
          }
        } catch (_) {}
      }
      // Fallback
      if (!p) { try { p = plugin.generate(settings); } catch(_){} }
      if (p) problems.push(p);
    }
    return problems;
  }

  function getDefaultAreas(grade) {
    const all = ['addition', 'subtraktion', 'multiplikation', 'division',
                 'brak', 'geometri', 'klocka', 'matt-langd', 'matt-volym',
                 'matt-vikt', 'matt-tid', 'talfoljd'];
    if (grade >= 4) all.push('procent', 'prioritet');
    return all;
  }

  // =========================================================
  //  Bygg calc-rutnät (starten-stil)
  // =========================================================
  function buildCalcGrid(problem, forceGrid) {
    const isArithmetic = problem && ['addition', 'subtraktion', 'multiplikation'].includes(problem.type);
    if (!isArithmetic && !forceGrid) return null;
    let cols = 4;
    if (isArithmetic) {
      const digits = Math.max(
        String(problem.a).length,
        String(problem.b).length,
        String(problem.answer).length
      ) + 1;
      cols = Math.max(digits, 4);
    }
    const table = document.createElement('table');
    table.className = 'ab-calc-grid';
    for (let r = 0; r < 3; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < cols; c++) tr.appendChild(document.createElement('td'));
      table.appendChild(tr);
    }
    const lastRow = document.createElement('tr');
    lastRow.className = 'ab-calc-grid-answer';
    for (let c = 0; c < cols; c++) lastRow.appendChild(document.createElement('td'));
    table.appendChild(lastRow);
    return table;
  }

  // =========================================================
  //  Rendering av en cell i tabellen
  // =========================================================
  function renderCell(problem, index, showAns) {
    const td = document.createElement('td');
    const isText = problem && problem.isTextProblem;
    td.className = isText ? 'ab-cell ab-cell--text' : 'ab-cell';

    if (isText) {
      // === Problemlösningslayout ===
      const inner = document.createElement('div');
      inner.className = 'ab-cell-inner';

      // Uppgiftstext med nummer
      const text = document.createElement('div');
      text.className = 'ab-cell-problem';
      const num = document.createElement('span');
      num.className = 'ab-cell-problem-num';
      num.textContent = `${index + 1}. `;
      text.appendChild(num);
      text.appendChild(document.createTextNode(problem.textTemplate || ''));
      inner.appendChild(text);

      if (showAns) {
        const key = document.createElement('div');
        key.className = 'ab-answer-key';
        key.textContent = `Svar: ${problem.answer}`;
        inner.appendChild(key);
      } else {
        // Rutnät som fyller tillgängligt utrymme med kvadratiska celler
        const grid = document.createElement('div');
        grid.className = 'ab-calc-grid ab-calc-grid--text';
        inner.appendChild(grid);

        // Svarslinje längst ner
        const svar = document.createElement('div');
        svar.className = 'ab-cell-svar';
        svar.innerHTML = 'Svar: <span class="ab-cell-svar-line"></span>';
        inner.appendChild(svar);
      }

      td.appendChild(inner);
    } else {
      // === Vanlig uppgiftslayout ===
      const num = document.createElement('span');
      num.className = 'ab-cell-num';
      num.textContent = index + 1;
      td.appendChild(num);

      const text = document.createElement('div');
      text.className = 'ab-cell-text';
      if (!problem) {
        text.textContent = '—';
      } else {
        const plugin = PluginManager.get(problem.type);
        if (plugin) {
          try { plugin.render(problem, text); } catch (_) {
            text.textContent = problem.answer != null ? `= ${problem.answer}` : '—';
          }
        }
      }
      td.appendChild(text);

      if (showAns && problem) {
        const key = document.createElement('div');
        key.className = 'ab-answer-key';
        key.textContent = `Svar: ${problem.answer}`;
        td.appendChild(key);
      } else if (problem) {
        const grid = buildCalcGrid(problem);
        if (grid) {
          td.appendChild(grid);
        } else if (problem.type === 'division' || problem.type === 'multiplikation') {
          const space = document.createElement('div');
          space.className = 'ab-cell-space';
          td.appendChild(space);
        }
      }
    }

    // Regenerera-knapp
    const regen = document.createElement('button');
    regen.className = 'ab-regen-btn no-print';
    regen.title = 'Byt uppgift';
    regen.textContent = '\u{1F504}';
    regen.addEventListener('click', () => regenerateProblem(index));
    td.appendChild(regen);

    return td;
  }

  // =========================================================
  //  Bygg sidhuvud
  // =========================================================
  function buildHeader(cfg) {
    const header = document.createElement('header');
    header.className = 'ab-header';

    const left = document.createElement('div');
    left.className = 'ab-header-left';

    const brand = document.createElement('div');
    brand.className = 'ab-brand';
    brand.textContent = 'Klassrummatte';

    const titleEl = document.createElement('div');
    titleEl.className = 'ab-title';
    titleEl.textContent = cfg.title || 'Matematik';

    const sub = document.createElement('div');
    sub.className = 'ab-subtitle';
    sub.textContent = `\u00c5k ${cfg.grade}`;

    left.append(brand, titleEl, sub);

    const fields = document.createElement('div');
    fields.className = 'ab-header-fields';
    fields.innerHTML =
      `<div><div class="ab-field-label">Namn</div><div class="ab-field-line">&nbsp;</div></div>`;

    header.append(left, fields);
    return header;
  }

  // =========================================================
  //  Rendering – en .ab-sheet per sida (tabell-layout)
  // =========================================================
  function renderSheet() {
    const cfg  = readConfig();
    const wrap = document.getElementById('ab-sheet');
    const empty = document.getElementById('empty-state');

    if (!wrap) return;
    wrap.innerHTML = '';

    const PAGE_SIZE  = cfg.perPage || 24;
    const totalPages = Math.max(1, Math.ceil(sheetProblems.length / PAGE_SIZE));
    const numCols    = cfg.cols;

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageStart    = pageIdx * PAGE_SIZE;
      const pageProblems = sheetProblems.slice(pageStart, pageStart + PAGE_SIZE);

      const sheet = document.createElement('div');
      sheet.className = 'ab-sheet' + (startenColor ? ` starten-${startenColor}` : '');
      if (pageIdx > 0) sheet.classList.add('ab-sheet--next-page');

      const inner = document.createElement('div');
      inner.className = 'ab-sheet-inner';

      if (pageIdx === 0) inner.appendChild(buildHeader(cfg));

      // Bygg tabell
      const table = document.createElement('table');
      table.className = 'ab-table ab-table--' + numCols + 'col';

      for (let i = 0; i < pageProblems.length; i += numCols) {
        const tr = document.createElement('tr');
        for (let c = 0; c < numCols; c++) {
          const idx = i + c;
          if (idx < pageProblems.length) {
            tr.appendChild(renderCell(pageProblems[idx], pageStart + idx, cfg.showAns));
          } else {
            tr.appendChild(document.createElement('td'));
          }
        }
        table.appendChild(tr);
      }

      inner.appendChild(table);
      sheet.appendChild(inner);
      wrap.appendChild(sheet);
    }

    wrap.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
  }

  // =========================================================
  //  Duplikatkontroll
  // =========================================================
  function isDuplicate(problem, list) {
    if (!problem) return false;
    const plugin = PluginManager.get(problem.type);
    if (plugin && typeof plugin.isSameProblem === 'function') {
      return list.some(existing => existing && plugin.isSameProblem(problem, existing));
    }
    return list.some(existing => existing &&
      existing.type === problem.type &&
      String(existing.answer) === String(problem.answer));
  }

  // =========================================================
  //  Starten – veckouppgifter (mån–fre)
  // =========================================================
  const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

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
    const showDiv = document.getElementById('st-op-div')?.checked ?? true;
    const vaxlingEl = document.querySelector('input[name="st-vaxling"]:checked');
    const vaxling = vaxlingEl && vaxlingEl.value ? vaxlingEl.value : null;
    return { ops: ops.length > 0 ? ops : ['add', 'sub', 'mult'], showDiv, vaxling };
  }

  // =========================================================
  //  Starten batch-läge – perioder
  // =========================================================
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
    removeBtn.textContent = '✕';
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
      '<label class="st-period-check"><input type="checkbox" data-op="div" checked> Div</label>';
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

  function readStartenPeriods() {
    const periods = [];
    document.querySelectorAll('.st-period').forEach(el => {
      const weeks = parseInt(el.querySelector('.st-period-weeks')?.value) || 4;
      const ops = [];
      el.querySelectorAll('.st-period-ops input[type="checkbox"]:checked').forEach(cb => {
        const op = cb.dataset.op;
        if (op !== 'div') ops.push(op);
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

  function generateBatchStarten(grade) {
    const periods = readStartenPeriods();
    if (periods.length === 0) return;

    const startWeek = parseInt(document.getElementById('st-start-week')?.value) || 1;
    const titlePrefix = document.getElementById('ab-title').value.trim() || 'Starten';

    const wrap = document.getElementById('ab-sheet');
    const empty = document.getElementById('empty-state');
    if (!wrap) return;
    wrap.innerHTML = '';

    batchSheets = [];
    let weekNum = startWeek;
    let sheetIdx = 0;
    periods.forEach(period => {
      for (let w = 0; w < period.weeks; w++) {
        const weekTitle = `${titlePrefix} - Vecka ${weekNum}`;
        const rows = generateStartenProblemsWithOps(grade, period.ops, period.showDiv, period.vaxling);
        batchSheets.push({ grade, rows, color: period.color, vaxling: period.vaxling, title: weekTitle });
        renderSingleStartenSheet(wrap, grade, rows, weekTitle, period.color, sheetIdx > 0, sheetIdx);
        weekNum++;
        sheetIdx++;
      }
    });

    startenData = null;

    wrap.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
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

  function renderSingleStartenSheet(wrap, grade, startenRows, title, color, pageBreak, sheetIdx) {
    const sheet = document.createElement('div');
    sheet.className = 'ab-sheet' + (color ? ` starten-${color}` : '');
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
    fields.innerHTML = '<div><div class="ab-field-label">Namn</div><div class="ab-field-line">&nbsp;</div></div>';
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
        const td = document.createElement('td');
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

        if (sheetIdx !== undefined) {
          const regen = document.createElement('button');
          regen.className = 'starten-regen no-print';
          regen.title = 'Byt uppgift';
          regen.textContent = '\u{1F504}';
          regen.addEventListener('click', () => regenBatchCell(sheetIdx, di, pi));
          td.appendChild(regen);
        }

        tr.appendChild(td);
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

        if (sheetIdx !== undefined) {
          const regenBrak = document.createElement('button');
          regenBrak.className = 'starten-regen no-print';
          regenBrak.title = 'Byt uppgift';
          regenBrak.textContent = '\u{1F504}';
          regenBrak.addEventListener('click', () => regenBatchCell(sheetIdx, di, row.uppstallningar.length));
          tdBrak.appendChild(regenBrak);
        }

        tr.appendChild(tdBrak);
      }
      table.appendChild(tr);
    });

    inner.appendChild(table);
    sheet.appendChild(inner);
    wrap.appendChild(sheet);
  }

  function generateStartenProblems(grade) {
    const c = PluginUtils.cfg(grade);
    const { ops: selectedOps, showDiv, vaxling } = readStartenOps();
    const numCols = showDiv ? 3 : 4;
    const rows = [];
    for (let d = 0; d < 5; d++) {
      const ops = buildBalancedOps(selectedOps, numCols, d);
      const vaxOpts = vaxling ? { vaxling } : null;
      const uppstallningar = ops.map(op => PluginUtils.genUppstallning(op, c, vaxOpts));

      // Division som bråk
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

  function regenStartenCell(dayIdx, cellIdx) {
    if (!startenData) return;
    const c = PluginUtils.cfg(startenData.grade);
    const { vaxling } = readStartenOps();
    const vaxOpts = vaxling ? { vaxling } : null;
    const row = startenData.rows[dayIdx];
    if (cellIdx < row.uppstallningar.length) {
      const oldType = row.uppstallningar[cellIdx].type.replace('uppstallning-', '');
      row.uppstallningar[cellIdx] = PluginUtils.genUppstallning(oldType, c, vaxOpts);
    } else if (row.brak) {
      const divisor  = PluginUtils.randInt(2, 9);
      const quotient = PluginUtils.randInt(2, 9);
      row.brak = { dividend: divisor * quotient, divisor, quotient };
    }
    renderStartenFromData();
  }

  function regenBatchCell(sheetIdx, dayIdx, cellIdx) {
    const entry = batchSheets[sheetIdx];
    if (!entry) return;
    const c = PluginUtils.cfg(entry.grade);
    const vaxOpts = entry.vaxling ? { vaxling: entry.vaxling } : null;
    const row = entry.rows[dayIdx];
    if (cellIdx < row.uppstallningar.length) {
      const oldType = row.uppstallningar[cellIdx].type.replace('uppstallning-', '');
      row.uppstallningar[cellIdx] = PluginUtils.genUppstallning(oldType, c, vaxOpts);
    } else if (row.brak) {
      const divisor  = PluginUtils.randInt(2, 9);
      const quotient = PluginUtils.randInt(2, 9);
      row.brak = { dividend: divisor * quotient, divisor, quotient };
    }
    rerenderBatchSheets();
  }

  function rerenderBatchSheets() {
    const wrap = document.getElementById('ab-sheet');
    if (!wrap) return;
    wrap.innerHTML = '';
    batchSheets.forEach((entry, si) => {
      renderSingleStartenSheet(wrap, entry.grade, entry.rows, entry.title, entry.color, si > 0, si);
    });
  }

  function renderStartenSheet(grade) {
    startenData = { grade, rows: generateStartenProblems(grade) };
    renderStartenFromData();
  }

  function renderStartenFromData() {
    const wrap  = document.getElementById('ab-sheet');
    const empty = document.getElementById('empty-state');
    if (!wrap || !startenData) return;
    wrap.innerHTML = '';

    const { grade, rows: startenRows } = startenData;
    const title = document.getElementById('ab-title').value.trim() || 'Starten';

    const sheet = document.createElement('div');
    sheet.className = 'ab-sheet' + (startenColor ? ` starten-${startenColor}` : '');

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
    fields.innerHTML = '<div><div class="ab-field-label">Namn</div><div class="ab-field-line">&nbsp;</div></div>';
    header.append(left, fields);
    inner.appendChild(header);

    // Tabell
    const table = document.createElement('table');
    table.className = 'starten-table' + (startenColor ? ` starten-${startenColor}` : '');

    startenRows.forEach((row, di) => {
      const tr = document.createElement('tr');

      // Dag-cell
      const tdDay = document.createElement('td');
      tdDay.className = 'starten-day';
      tdDay.textContent = DAYS[di];
      tr.appendChild(tdDay);

      // 3 uppställningar
      row.uppstallningar.forEach((problem, pi) => {
        const td = document.createElement('td');
        td.className = 'starten-problem';

        // Uppgiftstext
        const text = document.createElement('div');
        text.className = 'starten-problem-text';
        text.textContent = `${problem.a} ${problem.operator} ${problem.b}`;
        td.appendChild(text);

        // Rutnät för räkning
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

        // Regenera-knapp
        const regen = document.createElement('button');
        regen.className = 'starten-regen no-print';
        regen.title = 'Byt uppgift';
        regen.textContent = '\u{1F504}';
        regen.addEventListener('click', () => regenStartenCell(di, pi));
        td.appendChild(regen);

        tr.appendChild(td);
      });

      // Bråk/division-cell (villkorlig)
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

        const regenBrak = document.createElement('button');
        regenBrak.className = 'starten-regen no-print';
        regenBrak.title = 'Byt uppgift';
        regenBrak.textContent = '\u{1F504}';
        regenBrak.addEventListener('click', () => regenStartenCell(di, row.uppstallningar.length));
        tdBrak.appendChild(regenBrak);

        tr.appendChild(tdBrak);
      }
      table.appendChild(tr);
    });

    inner.appendChild(table);

    sheet.appendChild(inner);
    wrap.appendChild(sheet);
    wrap.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
  }

  // =========================================================
  //  Generera arbetsblad
  // =========================================================
  function generate() {
    const mode = document.getElementById('ab-mode').value;
    if (mode === 'starten') {
      const grade = parseInt(document.getElementById('ab-grade').value) || 3;
      const isBatch = document.getElementById('st-batch-mode')?.checked;
      if (isBatch) {
        generateBatchStarten(grade);
      } else {
        renderStartenSheet(grade);
      }
      return;
    }
    if (mode === 'problemlosning') {
      generateProblemlosning();
      return;
    }

    const cfg   = readConfig();
    let specs = cfg.specs;
    sheetProblems = [];

    // Om inga antal angivits men områden är ikryssade → fördela jämnt
    if (specs.length === 0) {
      const checkedAreas = getCheckedAreas();
      if (checkedAreas.length === 0) {
        alert('Välj minst ett område.');
        return;
      }
      const total = cfg.perPage * cfg.pages;
      const perArea = Math.floor(total / checkedAreas.length);
      const remainder = total % checkedAreas.length;
      specs = checkedAreas.map((area, i) => ({
        area,
        subcat: 'standard',
        count: perArea + (i < remainder ? 1 : 0),
      }));
    }

    // Om användaren valt specifikt antal sidor, skala upp antal problem
    const wantedTotal = cfg.pagesVal !== 'auto'
      ? cfg.pages * cfg.perPage
      : 0;

    // Generera per underkategori
    const baseSpecs = specs;
    baseSpecs.forEach(spec => {
      const problems = generateForSubcat(spec, cfg.grade, sheetProblems);
      sheetProblems.push(...problems);
    });

    // Fyll på med fler problem om användaren valt fler sidor
    if (wantedTotal > 0 && sheetProblems.length < wantedTotal) {
      let remaining = wantedTotal - sheetProblems.length;
      while (remaining > 0) {
        for (const spec of baseSpecs) {
          if (remaining <= 0) break;
          const extra = generateForSubcat({ ...spec, count: 1 }, cfg.grade, sheetProblems);
          if (extra.length > 0) {
            sheetProblems.push(...extra);
            remaining--;
          }
        }
      }
    }

    // Blanda ordningen
    for (let i = sheetProblems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sheetProblems[i], sheetProblems[j]] = [sheetProblems[j], sheetProblems[i]];
    }

    renderSheet();
  }

  // =========================================================
  //  Problemlösning-läge
  // =========================================================
  function generateProblemlosning() {
    const pl = readPLConfig();
    const total = pl.perPage * pl.pages;
    sheetProblems = [];

    if (pl.source === 'auto' || pl.source === 'mix') {
      const autoCount = pl.source === 'mix' ? Math.ceil(total / 2) : total;
      const autoProblems = generateAutoProblemlosning(autoCount, pl.grade, sheetProblems, pl.selectedAreas);
      sheetProblems.push(...autoProblems);
    }
    if (pl.source === 'egna' || pl.source === 'mix') {
      const egnaCount = pl.source === 'mix' ? total - sheetProblems.length : total;
      const egnaProblems = generateEgnaProblems(egnaCount, sheetProblems);
      sheetProblems.push(...egnaProblems);
    }

    // Blanda
    for (let i = sheetProblems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sheetProblems[i], sheetProblems[j]] = [sheetProblems[j], sheetProblems[i]];
    }

    // Rendera med problemlösnings-config
    plConfig = pl;
    renderPLSheet(pl);
  }

  function renderPLSheet(pl) {
    const wrap = document.getElementById('ab-sheet');
    const empty = document.getElementById('empty-state');
    if (!wrap) return;
    wrap.innerHTML = '';

    const numCols = pl.cols;
    const perPage = pl.perPage;

    for (let pageIdx = 0; pageIdx < pl.pages; pageIdx++) {
      const pageStart    = pageIdx * perPage;
      const pageProblems = sheetProblems.slice(pageStart, pageStart + perPage);

      const sheet = document.createElement('div');
      sheet.className = 'ab-sheet' + (startenColor ? ` starten-${startenColor}` : '');
      if (pageIdx > 0) sheet.classList.add('ab-sheet--next-page');

      const inner = document.createElement('div');
      inner.className = 'ab-sheet-inner';

      if (pageIdx === 0) {
        inner.appendChild(buildHeader({ grade: pl.grade, title: pl.title }));
      }

      const table = document.createElement('table');
      table.className = 'ab-table ab-table--' + numCols + 'col';

      for (let i = 0; i < pageProblems.length; i += numCols) {
        const tr = document.createElement('tr');
        for (let c = 0; c < numCols; c++) {
          const idx = i + c;
          if (idx < pageProblems.length) {
            tr.appendChild(renderCell(pageProblems[idx], pageStart + idx, pl.showAns));
          } else {
            tr.appendChild(document.createElement('td'));
          }
        }
        table.appendChild(tr);
      }

      inner.appendChild(table);
      sheet.appendChild(inner);
      wrap.appendChild(sheet);
    }

    wrap.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
  }

  // Bygg sidopanelens områdes-checkboxar
  function buildPLSidebar() {
    const container = document.getElementById('pl-area-checks');
    if (!container) return;
    container.innerHTML = '';

    PROBLEMLOSNING_AREAS.forEach(area => {
      // Hitta label från AREA_CONFIG
      let label = area;
      for (const cat of AREA_CONFIG) {
        const found = cat.areas.find(a => a.id === area);
        if (found) { label = found.label; break; }
      }

      const row = document.createElement('label');
      row.className = 'sidebar-check-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = area;
      cb.checked = false;
      row.appendChild(cb);
      row.appendChild(document.createTextNode(' ' + label));
      container.appendChild(row);
    });

    // Visa info om egna uppgifter
    const info = document.getElementById('pl-egna-info');
    if (info) {
      const stored = typeof Settings !== 'undefined' ? Settings.getCustomProblems() : [];
      info.textContent = stored.length > 0
        ? `${stored.length} lagrade uppgifter`
        : 'Inga importerade uppgifter';
    }

    // Visa/dölj auto-only sektioner beroende på källa
    document.querySelectorAll('input[name="pl-source"]').forEach(radio => {
      radio.addEventListener('change', updatePLSourceVisibility);
    });
    updatePLSourceVisibility();
  }

  function updatePLSourceVisibility() {
    const source = document.querySelector('input[name="pl-source"]:checked')?.value || 'auto';
    const showAuto = source === 'auto' || source === 'mix';
    const showImport = source === 'egna' || source === 'mix';
    document.querySelectorAll('.pl-auto-only').forEach(el => {
      el.style.display = showAuto ? '' : 'none';
    });
    const importSection = document.getElementById('pl-import-section');
    if (importSection) importSection.classList.toggle('hidden', !showImport);
  }

  function initPLImport() {
    // Ladda ner mall
    document.getElementById('pl-download-template')?.addEventListener('click', () => {
      if (typeof CustomProblems !== 'undefined') CustomProblems.downloadTemplate();
    });

    // Import från fil
    document.getElementById('pl-file-input')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = CustomProblems.importFromCsvText(reader.result);
        showPLImportStatus(result);
      };
      reader.readAsText(file, 'UTF-8');
    });

    // Import från textfält
    document.getElementById('pl-import-paste')?.addEventListener('click', () => {
      const text = document.getElementById('pl-paste')?.value || '';
      if (!text.trim()) return;
      const result = CustomProblems.importFromCsvText(text);
      showPLImportStatus(result);
    });
  }

  function showPLImportStatus(result) {
    const el = document.getElementById('pl-import-status');
    if (!el) return;
    if (result.success) {
      el.className = 'pl-import-status success';
      el.textContent = `${result.problems.length} uppgifter importerade!`;
    } else {
      el.className = 'pl-import-status error';
      el.textContent = result.error;
    }
    // Uppdatera info-texten
    updatePLEgnaInfo();
  }

  function updatePLEgnaInfo() {
    const info = document.getElementById('pl-egna-info');
    if (!info) return;
    const stored = typeof Settings !== 'undefined' ? Settings.getCustomProblems() : [];
    info.textContent = stored.length > 0
      ? `${stored.length} lagrade uppgifter`
      : 'Inga importerade uppgifter';
  }

  function regenerateProblem(index) {
    const mode = document.getElementById('ab-mode').value;

    if (mode === 'problemlosning') {
      const pl = readPLConfig();
      const source = pl.source;
      let newProblem = null;
      if (source === 'egna') {
        const results = generateEgnaProblems(1, sheetProblems);
        newProblem = results[0] || null;
      } else {
        const results = generateAutoProblemlosning(1, pl.grade, sheetProblems, pl.selectedAreas);
        newProblem = results[0] || null;
      }
      sheetProblems[index] = newProblem;
      renderPLSheet(pl);
      return;
    }

    const cfg   = readConfig();
    const specs = cfg.specs;
    if (specs.length === 0) return;

    const spec = specs[Math.floor(Math.random() * specs.length)];
    const results = generateForSubcat({ ...spec, count: 1 }, cfg.grade, sheetProblems);
    sheetProblems[index] = results[0] || null;
    renderSheet();
  }

  // =========================================================
  //  Utskrift via dold iframe
  // =========================================================
  function printViaIframe() {
    const wrap = document.getElementById('ab-sheet');
    if (!wrap || wrap.classList.contains('hidden')) {
      alert('Generera ett arbetsblad f\u00f6rst!');
      return;
    }

    const content = wrap.innerHTML;

    let iframe = document.getElementById('print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html lang="sv"><head><meta charset="UTF-8">
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/arbetsblad.css">
<style>
  html, body { margin: 0; padding: 0; background: white !important;
               height: 100% !important; overflow: visible !important; }
  .ab-sheet-wrap { display: block !important; padding: 0 !important; height: 100%; }
  .ab-sheet      { display: flex !important; flex-direction: column !important; width: 100% !important; height: 100vh !important; box-shadow: none !important; overflow: visible !important; }
  .ab-sheet::before { flex-shrink: 0 !important; }
  .ab-sheet-inner{ display: flex !important; flex-direction: column !important; flex: 1 !important; overflow: visible !important; padding: 0 !important; }
  .ab-table      { flex: 1 !important; }
  .ab-sheet + .ab-sheet { page-break-before: always !important; break-before: page !important; margin-top: 0 !important; }
  .ab-regen-btn, .no-print { display: none !important; }
  @page { size: A4 portrait; margin: 1cm 1.5cm; }
</style>
</head><body>
<div class="ab-sheet-wrap">${content}</div>
</body></html>`);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };
  }

  // =========================================================
  //  Init
  // =========================================================
  function syncSidebarTop() {
    const panel = document.getElementById('config-panel');
    if (!panel) return;
    const h = panel.offsetHeight + 'px';
    ['ab-sidebar', 'pl-sidebar', 'st-sidebar'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.top = h;
    });
  }

  function updateModeVisibility() {
    const mode = document.getElementById('ab-mode').value;
    const isStandard = mode === 'standard';
    const isPL       = mode === 'problemlosning';
    const isStarten  = mode === 'starten';

    // Visa/dölj sidopaneler
    const abSidebar = document.getElementById('ab-sidebar');
    if (abSidebar) abSidebar.classList.toggle('hidden', !isStandard);

    const plSidebar = document.getElementById('pl-sidebar');
    if (plSidebar) plSidebar.classList.toggle('hidden', !isPL);

    const stSidebar = document.getElementById('st-sidebar');
    if (stSidebar) stSidebar.classList.toggle('hidden', !isStarten);

    // Placeholder i rubrikfältet
    const titleInput = document.getElementById('ab-title');
    if (titleInput && !titleInput.value) {
      if (mode === 'starten') titleInput.placeholder = 'T.ex. Starten';
      else if (isPL) titleInput.placeholder = 'T.ex. Problemlösning';
      else titleInput.placeholder = 'T.ex. Multiplikation';
    }

    syncSidebarTop();
  }

  function initBatchMode() {
    const toggle = document.getElementById('st-batch-mode');
    const singleWrap = document.getElementById('st-single-mode');
    const batchWrap = document.getElementById('st-batch-wrap');
    if (!toggle || !singleWrap || !batchWrap) return;

    toggle.addEventListener('change', () => {
      singleWrap.classList.toggle('hidden', toggle.checked);
      batchWrap.classList.toggle('hidden', !toggle.checked);
    });

    // Lägg till-knapp
    document.getElementById('st-add-period')?.addEventListener('click', () => {
      const container = document.getElementById('st-periods');
      if (!container) return;
      container.appendChild(buildPeriodEl(4));
    });

    // Starta med en period
    const container = document.getElementById('st-periods');
    if (container) container.appendChild(buildPeriodEl(4));
  }

  function init() {
    buildAbSidebar();
    buildPLSidebar();
    initPLImport();
    initBatchMode();

    document.getElementById('ab-mode')
      ?.addEventListener('change', updateModeVisibility);
    updateModeVisibility();

    // Färgval-knappar
    const colorHandler = e => {
      const btn = e.target.closest('.starten-color-btn');
      if (!btn) return;
      document.querySelectorAll('.starten-color-btn').forEach(b => b.classList.remove('starten-color-btn--active'));
      btn.classList.add('starten-color-btn--active');
      startenColor = btn.dataset.theme || '';
      const currentMode = document.getElementById('ab-mode')?.value;
      if (currentMode === 'starten' && startenData) renderStartenFromData();
      else if (currentMode === 'problemlosning' && plConfig) renderPLSheet(plConfig);
      else if (currentMode === 'standard' && sheetProblems.length) renderSheet();
    };
    document.getElementById('ab-starten-colors')?.addEventListener('click', colorHandler);
    document.getElementById('ab-starten-colors-2')?.addEventListener('click', colorHandler);

    // Uppdatera total vid kolumn/sid-ändring
    document.getElementById('ab-cols')?.addEventListener('change', updateTotalCount);
    document.getElementById('ab-pages')?.addEventListener('change', updateTotalCount);

    document.getElementById('ab-generate-btn')
      ?.addEventListener('click', generate);

    document.getElementById('ab-print-btn')
      ?.addEventListener('click', printViaIframe);

    window.addEventListener('resize', syncSidebarTop);
  }

  document.addEventListener('DOMContentLoaded', init);

  return { generate, regenerateProblem };
})();
