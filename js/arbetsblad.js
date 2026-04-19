// js/arbetsblad.js
// Stencil-verktyg: genererar och renderar ett utskriftsvänligt arbetsblad.
// Underkategorier med individuella antal per område.

const Arbetsblad = (() => {

  let sheetProblems = [];  // Aktuell lista med problem
  let startenData   = null; // { grade, rows } för Starten-läge
  let batchSheets   = [];   // [{ grade, rows, color, vaxling }] för batch-regen
  let plConfig      = null; // Senaste PL-config för omrendering vid färgbyte
  let startenColor  = '';   // tema-klass för färgval
  let designStyle   = '';   // designstil: '', 'kort', 'ramad', 'minimal'

  // Hämta konfigdata från ArbetsbladConfig (laddas före denna fil)
  const { PROBLEMLOSNING_AREAS, AREA_CONFIG, SUB_SETTINGS, FRAME_SVG } = ArbetsbladConfig;

  /** Injicerar SVG-rambild i arket om designStyle har en ram. */
  function injectFrameSVG(sheet) {
    const src = FRAME_SVG[designStyle];
    if (!src) return;
    const img = document.createElement('img');
    img.src = src;
    img.className = 'ab-frame-img';
    img.setAttribute('aria-hidden', 'true');
    sheet.appendChild(img);
  }

  // =========================================================
  //  Bygg områdes-sidebar med accordion + detaljpanel
  // =========================================================
  function buildAbSidebar() {
    const container = document.getElementById('ab-area-checks');
    if (!container) return;
    container.innerHTML = '';

    AREA_CONFIG.forEach((category, catIdx) => {
      const cat = document.createElement('div');
      cat.className = 'ab-category' + (catIdx === 0 ? ' ab-category--open' : '');

      // Kategori-label (klickbar accordion)
      const catLabel = document.createElement('div');
      catLabel.className = 'ab-category-label';
      catLabel.innerHTML = category.cat + (category.desc
        ? ' <span class="ab-category-desc">(' + category.desc + ')</span>' : '');
      cat.appendChild(catLabel);

      // Rutnät med checkboxar
      const grid = document.createElement('div');
      grid.className = 'ab-area-grid';

      category.areas.forEach(area => {
        const label = document.createElement('label');
        label.className = 'sidebar-check-row';
        if (area.hasSub) label.classList.add('sidebar-check-row--has-sub');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = area.id;
        label.appendChild(cb);
        const span = document.createElement('span');
        span.textContent = area.label;
        label.appendChild(span);
        grid.appendChild(label);

        cb.addEventListener('change', () => {
          updateDetailPanel();
          updateTotalCount();
        });
      });

      cat.appendChild(grid);
      container.appendChild(cat);

      // Accordion-toggle
      catLabel.addEventListener('click', () => {
        cat.classList.toggle('ab-category--open');
      });
    });

    updateTotalCount();
  }

  // =========================================================
  //  Detaljpanel – visar sub-settings för ikryssade områden
  // =========================================================
  function updateDetailPanel() {
    const panel = document.getElementById('ab-detail-panel');
    if (!panel) return;

    const checkedAreas = getCheckedAreas();
    panel.innerHTML = '';
    const grade = parseInt(document.getElementById('ab-grade')?.value) || 3;

    // Samla unika sub-settings (hantera shared)
    const shown = new Set();
    checkedAreas.forEach(areaId => {
      const sub = SUB_SETTINGS[areaId];
      if (!sub) return;
      const key = sub.shared || areaId;
      if (shown.has(key)) return;
      shown.add(key);

      const resolved = SUB_SETTINGS[key];
      if (!resolved || !resolved.options) return;

      const block = document.createElement('div');
      block.className = 'ab-detail-block';
      block.dataset.settingsKey = resolved.settingsKey;

      const title = document.createElement('div');
      title.className = 'ab-detail-title';
      title.textContent = resolved.title;
      block.appendChild(title);

      // Rendera en grupp av checkboxar
      function renderOptionGroup(parent, opts, settingsKey) {
        opts.forEach(opt => {
          const hidden = opt.minGrade && opt.minGrade > grade;
          const label = document.createElement('label');
          label.className = 'sidebar-check-row sidebar-check-row--sm';
          if (hidden) label.classList.add('hidden');

          const input = document.createElement('input');
          input.type = 'checkbox';
          input.value = opt.value;
          input.checked = !!opt.checked;
          if (hidden) input.disabled = true;
          label.appendChild(input);

          const span = document.createElement('span');
          span.textContent = opt.label;
          if (opt.minGrade) {
            const small = document.createElement('small');
            small.textContent = ' (Åk ' + opt.minGrade + '+)';
            span.appendChild(small);
          }
          label.appendChild(span);
          parent.appendChild(label);
        });
      }

      renderOptionGroup(block, resolved.options, resolved.settingsKey);

      panel.appendChild(block);

      // Extra grupper (t.ex. volym har enheter + läge)
      if (resolved.extraGroups) {
        resolved.extraGroups.forEach(group => {
          const subBlock = document.createElement('div');
          subBlock.className = 'ab-detail-block';
          subBlock.dataset.settingsKey = group.settingsKey;

          const subTitle = document.createElement('div');
          subTitle.className = 'ab-detail-title';
          subTitle.textContent = group.title;
          subBlock.appendChild(subTitle);

          renderOptionGroup(subBlock, group.options, group.settingsKey);
          panel.appendChild(subBlock);
        });
      }
    });

    // Visa/dölj panelen
    const hasContent = panel.children.length > 0;
    panel.classList.toggle('visible', hasContent);
    document.getElementById('ab-sidebar')?.classList.toggle('has-detail', hasContent);
  }

  function updateTotalCount() {
    const el = document.getElementById('ab-total-count');
    if (!el) return;
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

  // Hämta ikryssade områden (bara area-checkboxar, inte detail-panel)
  function getCheckedAreas() {
    const container = document.getElementById('ab-area-checks');
    if (!container) return [];
    const areas = [];
    container.querySelectorAll('.ab-area-grid input[type="checkbox"]:checked').forEach(cb => {
      areas.push(cb.value);
    });
    return areas;
  }

  // Läs detaljpanel-inställningar → settings-objekt
  function getDetailSettings() {
    const panel = document.getElementById('ab-detail-panel');
    if (!panel) return {};
    const result = {};
    panel.querySelectorAll('.ab-detail-block').forEach(block => {
      const key = block.dataset.settingsKey;
      const checked = [...block.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)')].map(cb => cb.value);
      result[key] = checked;
    });
    return result;
  }

  // Bakåtkompatibilitet: getSubcatSpecs returnerar nu tom lista
  // (subcats med antal-inputs finns ej längre)
  function getSubcatSpecs() { return []; }

  // =========================================================
  //  Inställningar från konfigurations-panelen
  // =========================================================
  function readConfig() {
    const grade   = parseInt(document.getElementById('ab-grade').value)  || 3;
    const cols    = parseInt(document.getElementById('ab-cols').value)   || 2;
    const themeEl = document.getElementById('ab-theme');
    const theme   = themeEl ? themeEl.value : '';
    const title   = document.getElementById('ab-title').value.trim()     || 'Matematik';
    const showAns   = document.getElementById('ab-show-answers').checked;
    const showGrade = document.getElementById('ab-show-grade')?.checked ?? true;
    const showGrid  = document.getElementById('ab-show-grid')?.checked ?? true;
    const showSvar  = document.getElementById('ab-show-svar')?.checked ?? false;
    const pagesVal = document.getElementById('ab-pages').value;
    const frameDesigns = ['blomma', 'pask', 'bjorkris', 'stjarnor', 'vag', 'linje'];
    const rows = frameDesigns.includes(designStyle) ? 4 : 5;
    const perPage = cols * rows;
    const pages   = pagesVal === 'auto' ? 1 : (parseInt(pagesVal) || 1);
    return { grade, cols, pages, perPage, theme, title, showAns, showGrade, showGrid, showSvar, pagesVal };
  }

  // Läs config för problemlösning-läget (från sidopanelen)
  // Delegering till ArbetsbladPL
  const { readPLConfig, buildPLSidebar, initPLImport } = ArbetsbladPL;

  // =========================================================
  //  Problem-generering per underkategori
  // =========================================================
  function makeBaseSettings(grade) {
    const detail = getDetailSettings();
    return {
      grade,
      areas:          [],
      problemlosning: false,
      flersteg:       !!(detail.addSubMode && detail.addSubMode.includes('flersteg')),
      addSubMode:     detail.addSubMode || [],
      multDivMode:    detail.multDivMode || [],
      specificTables: [],
      brakTypes:      detail.brakTypes || ['name', 'add-same-den', 'compare', 'add-diff-den', 'fraction-of-whole', 'simplify'],
      geometriTypes:  detail.geometriTypes || ['area', 'perimeter'],
      klockaTypes:    detail.klockaTypes || ['analog', 'digital'],
      prioritetOps:   detail.prioritetOps || ['mult', 'div'],
      statistikTypes: detail.statistikTypes || ['bar', 'freq-table', 'pie-chart'],
      langdUnits:     detail.langdUnits || ['mm', 'cm', 'dm', 'm', 'km'],
      volymUnits:     detail.volymUnits || ['dl', 'l'],
      volymModes:     detail.volymModes || ['convert'],
      isArbetsblad:   true,
    };
  }

  // Generera egna (lagrade) uppgifter från Settings/CustomProblems
  function generateEgnaProblems(count, allProblems) {
    const activeId = typeof Settings !== 'undefined' ? Settings.getSessionActiveSetId() : null;
    const stored = typeof Settings !== 'undefined'
      ? (activeId ? Settings.getCustomProblemsBySetId(activeId) : Settings.getCustomProblems())
      : [];
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

    // Standardvärden om detail-panel saknar val
    if ((area === 'addition' || area === 'subtraktion') && settings.addSubMode.length === 0) {
      settings.addSubMode = ['standard'];
    }
    if ((area === 'multiplikation' || area === 'division') && settings.multDivMode.length === 0) {
      settings.multDivMode = ['tables-basic'];
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
  function renderCell(problem, index, showAns, showGrid, showSvar) {
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
        if (showGrid) {
          const grid = document.createElement('div');
          grid.className = 'ab-calc-grid ab-calc-grid--text';
          inner.appendChild(grid);
        } else {
          const space = document.createElement('div');
          space.className = 'ab-cell-space--text';
          inner.appendChild(space);
        }

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
        // Visuella uppgifter (bild-mult, geometri, klocka, symmetri, etc.) behöver ej rutnät
        const VISUAL_TYPES = ['geometri', 'klocka', 'symmetri', 'koordinatsystem',
          'statistik', 'sannolikhet', 'tallinje', 'talsorter', 'negativa-tal', 'romerska',
          'avrundning', 'monster'];
        const isVisual = VISUAL_TYPES.includes(problem.type)
          || (problem.questionType === 'bild-mult');
        let gridAdded = false;
        if (showGrid && !isVisual) {
          const grid = buildCalcGrid(problem);
          if (grid) {
            td.appendChild(grid);
            gridAdded = true;
          } else if (problem.type === 'division' || problem.type === 'multiplikation') {
            const space = document.createElement('div');
            space.className = 'ab-cell-space';
            td.appendChild(space);
            gridAdded = true;
          }
        }
        // Svarslinje om vald och inget rutnät visades
        if (showSvar && !gridAdded) {
          const svar = document.createElement('div');
          svar.className = 'ab-cell-svar';
          svar.innerHTML = 'Svar: <span class="ab-cell-svar-line"></span>';
          td.appendChild(svar);
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

    const titleEl = document.createElement('div');
    titleEl.className = 'ab-title';
    titleEl.textContent = cfg.title || 'Matematik';

    if (cfg.showGrade !== false) {
      const sub = document.createElement('div');
      sub.className = 'ab-subtitle';
      sub.textContent = `\u00c5k ${cfg.grade}`;
      left.append(titleEl, sub);
    } else {
      left.append(titleEl);
    }

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
    // Trunkera problem som inte ryms på valt antal sidor (t.ex. vid designbyte)
    const maxProblems = PAGE_SIZE * cfg.pages;
    if (sheetProblems.length > maxProblems) {
      sheetProblems.length = maxProblems;
    }
    const totalPages = Math.max(1, Math.ceil(sheetProblems.length / PAGE_SIZE));
    const numCols    = cfg.cols;

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageStart    = pageIdx * PAGE_SIZE;
      const pageProblems = sheetProblems.slice(pageStart, pageStart + PAGE_SIZE);

      const sheet = document.createElement('div');
      sheet.className = 'ab-sheet' + (startenColor ? ` starten-${startenColor}` : '') + (designStyle ? ` ab-design--${designStyle}` : '') + (FRAME_SVG[designStyle] ? ' ab-design--frame' : '');
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
            tr.appendChild(renderCell(pageProblems[idx], pageStart + idx, cfg.showAns, cfg.showGrid, cfg.showSvar));
          } else {
            tr.appendChild(document.createElement('td'));
          }
        }
        table.appendChild(tr);
      }

      inner.appendChild(table);
      sheet.appendChild(inner);
      injectFrameSVG(sheet);
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
  //  Starten – delegerar till ArbetsbladStarten
  // =========================================================

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

  // Delegering till ArbetsbladStarten
  const { DAYS, buildBalancedOps, readStartenOps, readStartenPeriods,
          buildPeriodEl, generateStartenProblemsWithOps,
          buildStartenProblemTd } = ArbetsbladStarten;

  function renderSingleStartenSheet(wrap, grade, startenRows, title, color, pageBreak, sheetIdx) {
    ArbetsbladStarten.renderSingleStartenSheet(
      wrap, grade, startenRows, title, color, pageBreak, sheetIdx,
      designStyle, injectFrameSVG, regenBatchCell
    );
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
    sheet.className = 'ab-sheet' + (startenColor ? ` starten-${startenColor}` : '') + (designStyle ? ` ab-design--${designStyle}` : '') + (FRAME_SVG[designStyle] ? ' ab-design--frame' : '');

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

      // 3–4 uppställningar (inkl. ev. division)
      row.uppstallningar.forEach((problem, pi) => {
        tr.appendChild(buildStartenProblemTd(problem, () => regenStartenCell(di, pi)));
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
    injectFrameSVG(sheet);
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
    sheetProblems = [];

    const checkedAreas = getCheckedAreas();
    if (checkedAreas.length === 0) {
      alert('Välj minst ett område.');
      return;
    }
    const total = cfg.perPage * cfg.pages;
    const perArea = Math.floor(total / checkedAreas.length);
    const remainder = total % checkedAreas.length;
    const specs = checkedAreas.map((area, i) => ({
      area,
      count: perArea + (i < remainder ? 1 : 0),
    }));

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
      sheet.className = 'ab-sheet' + (startenColor ? ` starten-${startenColor}` : '') + (designStyle ? ` ab-design--${designStyle}` : '') + (FRAME_SVG[designStyle] ? ' ab-design--frame' : '');
      if (pageIdx > 0) sheet.classList.add('ab-sheet--next-page');

      const inner = document.createElement('div');
      inner.className = 'ab-sheet-inner';

      if (pageIdx === 0) {
        const showGrade = document.getElementById('ab-show-grade')?.checked ?? true;
        inner.appendChild(buildHeader({ grade: pl.grade, title: pl.title, showGrade }));
      }

      const table = document.createElement('table');
      table.className = 'ab-table ab-table--' + numCols + 'col';

      for (let i = 0; i < pageProblems.length; i += numCols) {
        const tr = document.createElement('tr');
        for (let c = 0; c < numCols; c++) {
          const idx = i + c;
          if (idx < pageProblems.length) {
            tr.appendChild(renderCell(pageProblems[idx], pageStart + idx, pl.showAns, pl.showGrid, false));
          } else {
            tr.appendChild(document.createElement('td'));
          }
        }
        table.appendChild(tr);
      }

      inner.appendChild(table);
      sheet.appendChild(inner);
      injectFrameSVG(sheet);
      wrap.appendChild(sheet);
    }

    wrap.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
  }

  // Bygg sidopanelens områdes-checkboxar
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
    const checkedAreas = getCheckedAreas();
    if (checkedAreas.length === 0) return;

    const area = checkedAreas[Math.floor(Math.random() * checkedAreas.length)];
    const results = generateForSubcat({ area, count: 1 }, cfg.grade, sheetProblems);
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
<link rel="stylesheet" href="css/arbetsblad-base.css">
<link rel="stylesheet" href="css/arbetsblad-sidebar.css">
<link rel="stylesheet" href="css/arbetsblad-sheet.css">
<link rel="stylesheet" href="css/arbetsblad-starten.css">
<link rel="stylesheet" href="css/arbetsblad-design.css">
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

    // Göm designknappen i starten-läge (starten har egna färgteman)
    const designToggleBtn = document.getElementById('ab-design-toggle');
    const designPanelEl   = document.getElementById('ab-design-panel');
    if (designToggleBtn) designToggleBtn.style.display = isStarten ? 'none' : '';
    if (isStarten && designPanelEl) designPanelEl.classList.add('hidden');

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

  // =========================================================
  //  Importera områden från sparad genomgång
  // =========================================================
  function loadGenomgangar() {
    try {
      return JSON.parse(localStorage.getItem('klassrummatte-genomgangar')) || [];
    } catch (_) { return []; }
  }

  function populateGGSelect(selectId, checkContainerId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const ggs = loadGenomgangar();
    // Rensa gamla options (behåll placeholder)
    while (sel.options.length > 1) sel.remove(1);
    ggs.forEach(gg => {
      const opt = document.createElement('option');
      opt.value = gg.id;
      opt.textContent = gg.name || 'Namnlös';
      sel.appendChild(opt);
    });
    sel.classList.toggle('hidden', ggs.length === 0);

    sel.addEventListener('change', () => {
      if (!sel.value) return;
      const gg = ggs.find(g => g.id === sel.value);
      if (!gg || !gg.problems) return;
      // Extrahera unika areas
      const areas = new Set();
      gg.problems.forEach(p => {
        const key = p.type === 'oppna-utsaga' ? 'oppna-utsagor' : p.type;
        areas.add(key);
      });
      // Kryssa i matchande checkboxar
      const container = document.getElementById(checkContainerId);
      if (container) {
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = areas.has(cb.value);
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
      sel.value = '';  // Återställ dropdown
    });
  }

  function syncConfigHeight() {
    const cp = document.getElementById('config-panel');
    if (cp) document.documentElement.style.setProperty('--config-h', cp.offsetHeight + 'px');
  }

  function init() {
    syncConfigHeight();
    window.addEventListener('resize', syncConfigHeight);
    buildAbSidebar();
    buildPLSidebar();
    populateGGSelect('ab-import-gg', 'ab-area-checks');
    populateGGSelect('pl-import-gg', 'pl-area-checks');
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

    // Uppdatera detaljpanel vid årskursändring
    document.getElementById('ab-grade')?.addEventListener('change', () => {
      updateDetailPanel();
      updateTotalCount();
    });

    // Uppdatera total vid kolumn/sid-ändring
    document.getElementById('ab-cols')?.addEventListener('change', updateTotalCount);
    document.getElementById('ab-pages')?.addEventListener('change', updateTotalCount);

    document.getElementById('ab-generate-btn')
      ?.addEventListener('click', generate);

    document.getElementById('ab-print-btn')
      ?.addEventListener('click', printViaIframe);

    // Design panel toggle
    const designToggle = document.getElementById('ab-design-toggle');
    const designPanel  = document.getElementById('ab-design-panel');
    designToggle?.addEventListener('click', () => {
      const hidden = designPanel.classList.toggle('hidden');
      designToggle.classList.toggle('active', !hidden);
    });

    // Design style selection — ändrar klass + re-renderar arket
    document.getElementById('ab-design-panel')?.addEventListener('change', e => {
      const radio = e.target.closest('input[name="ab-design"]');
      if (!radio) return;
      designStyle = radio.value;
      // Re-rendera arket i rätt läge så perPage (4 vs 5 rader) uppdateras
      const currentMode = document.getElementById('ab-mode')?.value;
      if (currentMode === 'problemlosning' && plConfig) renderPLSheet(plConfig);
      else if (currentMode === 'standard' && sheetProblems.length) renderSheet();
    });

    window.addEventListener('resize', syncSidebarTop);
  }

  document.addEventListener('DOMContentLoaded', init);

  return { generate, regenerateProblem };
})();
