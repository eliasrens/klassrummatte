// js/arbetsblad.js
// Stencil-verktyg: genererar och renderar ett utskriftsvänligt arbetsblad.
// Underkategorier med individuella antal per område.

const Arbetsblad = (() => {

  let sheetProblems = [];  // Aktuell lista med problem
  let startenData   = null; // { grade, rows } för Starten-läge
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
      { id: 'addition', label: 'Addition', checked: true, subcats: [
        { id: 'standard',       label: 'Standard',       default: 5 },
        { id: 'uppstallning',   label: 'Uppställning',   default: 0 },
      ]},
      { id: 'subtraktion', label: 'Subtraktion', checked: true, subcats: [
        { id: 'standard',       label: 'Standard',       default: 5 },
        { id: 'uppstallning',   label: 'Uppställning',   default: 0 },
      ]},
      { id: 'multiplikation', label: 'Multiplikation', checked: true, subcats: [
        { id: 'tables-basic',   label: 'Tabeller',       default: 5 },
        { id: 'tables-large',   label: 'Stora tal',      default: 0 },
      ]},
      { id: 'division', label: 'Division', checked: true, subcats: [
        { id: 'tables-basic',   label: 'Tabeller',       default: 5 },
        { id: 'tables-large',   label: 'Stora tal',      default: 0 },
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
    { cat: 'Problemlösning', areas: [
      { id: 'problemlosning-auto', label: 'Autogenererade', subcats: [
        { id: 'problemlosning', label: 'Antal', default: 0 },
      ]},
      { id: 'problemlosning-egna', label: 'Egna uppgifter', subcats: [
        { id: 'egna', label: 'Antal', default: 0 },
      ]},
    ]},
  ];

  // =========================================================
  //  Bygg områdes-popup dynamiskt
  // =========================================================
  function buildAreasPopup() {
    const popup = document.getElementById('areas-popup');
    if (!popup) return;
    popup.innerHTML = '';

    AREA_CONFIG.forEach(category => {
      const catDiv = document.createElement('div');
      catDiv.className = 'areas-category';

      const catLabel = document.createElement('div');
      catLabel.className = 'areas-cat-label';
      catLabel.textContent = category.cat;
      catDiv.appendChild(catLabel);

      category.areas.forEach(area => {
        const item = document.createElement('div');
        item.className = 'ab-area-item';

        // Huvudcheckbox
        const label = document.createElement('label');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = area.id;
        if (area.checked) cb.checked = true;
        label.appendChild(cb);
        label.appendChild(document.createTextNode(' ' + area.label));
        item.appendChild(label);

        // Visa antal lagrade uppgifter för "Egna uppgifter"
        if (area.id === 'problemlosning-egna') {
          const stored = typeof Settings !== 'undefined' ? Settings.getCustomProblems() : [];
          const hint = document.createElement('span');
          hint.className = 'ab-egna-hint';
          hint.style.cssText = 'font-size:0.7rem;color:rgba(255,255,255,0.4);margin-left:0.3rem;';
          hint.textContent = stored.length > 0
            ? `(${stored.length} lagrade)`
            : '(inga importerade)';
          label.appendChild(hint);
        }

        // Underkategorier
        const subcats = area.subcats || [{ id: 'standard', label: 'Antal', default: 10 }];
        const subcatDiv = document.createElement('div');
        subcatDiv.className = 'ab-subcats';
        subcatDiv.dataset.area = area.id;
        if (!area.checked) subcatDiv.classList.add('hidden');

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
          input.value = area.checked ? sc.default : 0;
          input.dataset.area = area.id;
          input.dataset.subcat = sc.id;
          row.appendChild(input);

          subcatDiv.appendChild(row);
        });

        item.appendChild(subcatDiv);

        // Toggle subcats vid checkbox-ändring
        cb.addEventListener('change', () => {
          subcatDiv.classList.toggle('hidden', !cb.checked);
          if (cb.checked) {
            // Sätt default-värden
            subcats.forEach(sc => {
              const inp = subcatDiv.querySelector(`input[data-subcat="${sc.id}"]`);
              if (inp && parseInt(inp.value) === 0) inp.value = sc.default;
            });
          }
          updateTotalCount();
        });

        catDiv.appendChild(item);
      });

      popup.appendChild(catDiv);
    });

    // Totalsumma-rad
    const totalDiv = document.createElement('div');
    totalDiv.className = 'ab-total-row';
    totalDiv.innerHTML = 'Totalt: <strong id="ab-total-count">20</strong> uppgifter';
    popup.appendChild(totalDiv);

    // Lyssna på ändringar i alla antal-inputs
    popup.querySelectorAll('input[type="number"]').forEach(inp => {
      inp.addEventListener('input', updateTotalCount);
    });

    updateTotalCount();
  }

  function updateTotalCount() {
    const total = getSubcatSpecs().reduce((sum, s) => sum + s.count, 0);
    const el = document.getElementById('ab-total-count');
    if (el) el.textContent = total;
    // Uppdatera knapptext
    const btn = document.getElementById('ab-areas-toggle');
    if (btn) btn.textContent = `Välj områden (${total} st) ▾`;
  }

  // =========================================================
  //  Läs underkategori-specifikationer
  // =========================================================
  function getSubcatSpecs() {
    const specs = [];
    const popup = document.getElementById('areas-popup');
    if (!popup) return specs;

    popup.querySelectorAll('.ab-subcats:not(.hidden)').forEach(subcatDiv => {
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

  // =========================================================
  //  Inställningar från konfigurations-panelen
  // =========================================================
  function readConfig() {
    const grade   = parseInt(document.getElementById('ab-grade').value)  || 3;
    const colsRaw = parseInt(document.getElementById('ab-cols').value)   || 2;
    const theme   = document.getElementById('ab-theme').value            || '';
    const title   = document.getElementById('ab-title').value.trim()     || 'Matematik';
    const showAns = document.getElementById('ab-show-answers').checked;
    const pagesVal = document.getElementById('ab-pages').value;
    const specs   = getSubcatSpecs();
    const total   = specs.reduce((sum, s) => sum + s.count, 0);
    const hasProblemlosning = specs.some(s =>
      (s.area === 'problemlosning-auto' || s.area === 'problemlosning-egna') && s.count > 0);
    const cols    = hasProblemlosning ? Math.min(colsRaw, 2) : colsRaw;
    // Max uppgifter per A4-sida: 6 rader × antal kolumner (5 rader för problemlösning)
    const perPage = hasProblemlosning ? (cols * 5) : (cols * 6);
    const pages   = pagesVal === 'auto'
      ? Math.max(1, Math.ceil(total / perPage))
      : parseInt(pagesVal) || 1;
    return { grade, count: total, cols, pages, perPage, theme, title, showAns, specs, pagesVal };
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

  // Generera autogenererade problemlösningsuppgifter (blandar alla areas som stöder Templates.canWrap)
  function generateAutoProblemlosning(count, grade, allProblems) {
    const problems = [];
    const settings = makeBaseSettings(grade);
    for (let i = 0; i < count; i++) {
      let p = null;
      for (let attempt = 0; attempt < 10 && !p; attempt++) {
        try {
          // Välj slumpmässigt bland alla områden som stöder problemlösning
          const area = PROBLEMLOSNING_AREAS[Math.floor(Math.random() * PROBLEMLOSNING_AREAS.length)];
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
    if (area === 'addition' || area === 'subtraktion') {
      if (subcat === 'uppstallning') settings.addSubMode = ['uppstallning'];
      // 'standard' → tom addSubMode → plugin väljer standard
    }
    if (area === 'multiplikation' || area === 'division') {
      if (subcat === 'tables-basic')  settings.multDivMode = ['tables-basic'];
      else if (subcat === 'tables-large') settings.multDivMode = ['tables-large'];
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
  //  Rendering av enskilt uppgiftskort
  // =========================================================
  function renderProblemCard(problem, index, showAns) {
    const card = document.createElement('div');
    const isText = problem && problem.isTextProblem;
    card.className = 'ab-problem-card' + (isText ? ' ab-problem-card--text' : '');

    // Nummerbubbla
    const num = document.createElement('div');
    num.className = 'ab-problem-num';
    num.textContent = index + 1;
    card.appendChild(num);

    // Problem-innehåll
    const content = document.createElement('div');
    content.className = 'ab-problem-content';

    if (!problem) {
      content.textContent = '—';
    } else if (problem.isTextProblem) {
      const p = document.createElement('p');
      p.className = 'ab-text-problem';
      p.textContent = problem.textTemplate || '';
      content.appendChild(p);
    } else {
      const plugin = PluginManager.get(problem.type);
      if (plugin) {
        try { plugin.render(problem, content); } catch (_) {
          content.textContent = problem.answer != null ? `= ${problem.answer}` : '—';
        }
      }
    }
    if (isText) {
      card.appendChild(content);
      const ansSpace = document.createElement('div');
      ansSpace.className = 'ab-answer-space ab-answer-space--text';

      if (showAns && problem) {
        const key = document.createElement('div');
        key.className = 'ab-answer-key';
        key.textContent = `Svar: ${problem.answer}`;
        ansSpace.appendChild(key);
      } else {
        // Starten-liknande rutnät för beräkning
        const table = document.createElement('table');
        table.className = 'ab-answer-grid ab-answer-grid--calc';
        const cols = 5;
        for (let r = 0; r < 3; r++) {
          const tr = document.createElement('tr');
          for (let c = 0; c < cols; c++) tr.appendChild(document.createElement('td'));
          table.appendChild(tr);
        }
        const lastRow = document.createElement('tr');
        lastRow.className = 'ab-answer-grid-answer';
        for (let c = 0; c < cols; c++) lastRow.appendChild(document.createElement('td'));
        table.appendChild(lastRow);
        ansSpace.appendChild(table);

        const svarLine = document.createElement('div');
        svarLine.className = 'ab-answer-svar';
        svarLine.innerHTML = 'Svar: <span class="ab-answer-svar-line"></span>';
        ansSpace.appendChild(svarLine);
      }
      card.appendChild(ansSpace);
    } else {
      card.appendChild(content);
      const ansSpace = document.createElement('div');
      ansSpace.className = 'ab-answer-space';
      const isArithmetic = problem && ['addition', 'subtraktion', 'multiplikation'].includes(problem.type);
      if (showAns && problem) {
        const key = document.createElement('div');
        key.className = 'ab-answer-key';
        key.textContent = `Svar: ${problem.answer}`;
        ansSpace.appendChild(key);
      } else if (isArithmetic) {
        // Starten-liknande rutnät: dynamiska kolumner, 3 rader + svarsrad
        const digits = Math.max(
          String(problem.a).length,
          String(problem.b).length,
          String(problem.answer).length
        ) + 1;
        const cols = Math.max(digits, 4);
        const table = document.createElement('table');
        table.className = 'ab-answer-grid ab-answer-grid--calc';
        for (let r = 0; r < 3; r++) {
          const tr = document.createElement('tr');
          for (let c = 0; c < cols; c++) tr.appendChild(document.createElement('td'));
          table.appendChild(tr);
        }
        const lastRow = document.createElement('tr');
        lastRow.className = 'ab-answer-grid-answer';
        for (let c = 0; c < cols; c++) lastRow.appendChild(document.createElement('td'));
        table.appendChild(lastRow);
        ansSpace.appendChild(table);
      } else if (problem && problem.type !== 'division') {
        for (let i = 0; i < 2; i++) {
          const line = document.createElement('div');
          line.className = 'ab-answer-line';
          ansSpace.appendChild(line);
        }
      }
      card.appendChild(ansSpace);
    }

    // Regenerera-knapp
    const regen = document.createElement('button');
    regen.className = 'ab-regen-btn no-print';
    regen.title = 'Byt uppgift';
    regen.textContent = '\u{1F504}';
    regen.addEventListener('click', () => regenerateProblem(index));
    card.appendChild(regen);

    return card;
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
  //  Rendering – en .ab-sheet per sida
  // =========================================================
  function renderSheet() {
    const cfg  = readConfig();
    const wrap = document.getElementById('ab-sheet');
    const empty = document.getElementById('empty-state');

    if (!wrap) return;
    wrap.innerHTML = '';

    const PAGE_SIZE  = cfg.perPage || 20;
    const totalPages = Math.max(1, Math.ceil(sheetProblems.length / PAGE_SIZE));

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageStart    = pageIdx * PAGE_SIZE;
      const pageProblems = sheetProblems.slice(pageStart, pageStart + PAGE_SIZE);

      const sheet = document.createElement('div');
      sheet.className = 'ab-sheet' + (cfg.theme ? ` ${cfg.theme}` : '') + (startenColor ? ` starten-${startenColor}` : '');
      if (pageIdx > 0) sheet.classList.add('ab-sheet--next-page');

      const inner = document.createElement('div');
      inner.className = 'ab-sheet-inner';

      if (pageIdx === 0) inner.appendChild(buildHeader(cfg));

      const grid = document.createElement('div');
      grid.className = `ab-problem-grid ab-problem-grid--${cfg.cols}col`;

      pageProblems.forEach((p, i) => {
        grid.appendChild(renderProblemCard(p, pageStart + i, cfg.showAns));
      });

      inner.appendChild(grid);

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

  function generateStartenProblems(grade) {
    const c = PluginUtils.cfg(grade);
    const rows = [];
    for (let d = 0; d < 5; d++) {
      // 3 uppställningsproblem: blanda add/sub/mult
      const ops = ['add', 'sub', 'mult'];
      // Fisher-Yates shuffle
      for (let i = ops.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ops[i], ops[j]] = [ops[j], ops[i]];
      }
      const uppstallningar = ops.map(op => PluginUtils.genUppstallning(op, c));

      // Division som bråk: täljare / nämnare
      const divisor  = PluginUtils.randInt(2, 9);
      const quotient = PluginUtils.randInt(2, 9);
      const dividend = divisor * quotient;
      const brak = { dividend, divisor, quotient };

      rows.push({ uppstallningar, brak });
    }
    return rows;
  }

  function regenStartenCell(dayIdx, cellIdx) {
    if (!startenData) return;
    const c = PluginUtils.cfg(startenData.grade);
    const row = startenData.rows[dayIdx];
    if (cellIdx < 3) {
      // Uppställning – behåll samma räknesätt
      const oldType = row.uppstallningar[cellIdx].type.replace('uppstallning-', '');
      row.uppstallningar[cellIdx] = PluginUtils.genUppstallning(oldType, c);
    } else {
      // Bråk/division
      const divisor  = PluginUtils.randInt(2, 9);
      const quotient = PluginUtils.randInt(2, 9);
      row.brak = { dividend: divisor * quotient, divisor, quotient };
    }
    renderStartenFromData();
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

      // Bråk/division-cell
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

      // Regenera-knapp för bråk
      const regenBrak = document.createElement('button');
      regenBrak.className = 'starten-regen no-print';
      regenBrak.title = 'Byt uppgift';
      regenBrak.textContent = '\u{1F504}';
      regenBrak.addEventListener('click', () => regenStartenCell(di, 3));
      tdBrak.appendChild(regenBrak);

      tr.appendChild(tdBrak);
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
      renderStartenSheet(grade);
      return;
    }

    const cfg   = readConfig();
    const specs = cfg.specs;
    sheetProblems = [];

    if (specs.length === 0) {
      alert('Välj minst ett område och ange antal.');
      return;
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
        // Fördela jämnt över alla aktiva specs
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

  function regenerateProblem(index) {
    const cfg   = readConfig();
    const specs = cfg.specs;
    if (specs.length === 0) return;

    // Välj en slumpmässig spec att regenerera från
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
               height: auto !important; min-height: 0 !important; overflow: visible !important; }
  .ab-sheet-wrap { display: block !important; padding: 0 !important; }
  .ab-sheet      { display: block !important; width: 100% !important; height: auto !important; box-shadow: none !important; overflow: visible !important; }
  .ab-sheet-inner{ display: block !important; overflow: visible !important; }
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
  function updateModeVisibility() {
    const mode = document.getElementById('ab-mode').value;
    const isStarten = mode === 'starten';
    document.querySelectorAll('.ab-standard-only').forEach(el => {
      el.style.display = isStarten ? 'none' : '';
    });
    const titleInput = document.getElementById('ab-title');
    if (titleInput && !titleInput.value) {
      titleInput.placeholder = isStarten ? 'T.ex. Starten v.12' : 'T.ex. Multiplikation';
    }
  }

  function init() {
    buildAreasPopup();

    document.getElementById('ab-mode')
      ?.addEventListener('change', updateModeVisibility);
    updateModeVisibility();

    // Färgval-knappar
    document.getElementById('ab-starten-colors')?.addEventListener('click', e => {
      const btn = e.target.closest('.starten-color-btn');
      if (!btn) return;
      document.querySelectorAll('.starten-color-btn').forEach(b => b.classList.remove('starten-color-btn--active'));
      btn.classList.add('starten-color-btn--active');
      startenColor = btn.dataset.theme || '';
      if (startenData) renderStartenFromData();
    });

    document.getElementById('ab-generate-btn')
      ?.addEventListener('click', generate);

    document.getElementById('ab-print-btn')
      ?.addEventListener('click', printViaIframe);

    const areaToggle = document.getElementById('ab-areas-toggle');
    const areaPopup  = document.getElementById('areas-popup');
    areaToggle?.addEventListener('click', () => {
      areaPopup?.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!areaToggle?.contains(e.target) && !areaPopup?.contains(e.target)) {
        areaPopup?.classList.remove('open');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { generate, regenerateProblem };
})();
