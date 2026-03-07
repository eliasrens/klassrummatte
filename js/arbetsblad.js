// js/arbetsblad.js
// Stencil-verktyg: genererar och renderar ett utskriftsvänligt arbetsblad.

const Arbetsblad = (() => {

  let sheetProblems = [];  // Aktuell lista med problem

  // =========================================================
  //  Inställningar från konfigurations-panelen
  // =========================================================
  function readConfig() {
    const grade   = parseInt(document.getElementById('ab-grade').value)  || 3;
    const pages   = parseInt(document.getElementById('ab-pages').value)  || 1;
    const colsRaw = parseInt(document.getElementById('ab-cols').value)   || 2;
    const problemlosningRaw = document.getElementById('ab-problemlosning').checked;
    // Problemlösning: max 2 kolumner, 8 uppgifter/sida (4 rader × 2 kol)
    const cols    = problemlosningRaw ? Math.min(colsRaw, 2) : colsRaw;
    const perPage = problemlosningRaw ? 8 : 20;
    const count   = pages * perPage;
    const theme   = document.getElementById('ab-theme').value            || '';
    const title   = document.getElementById('ab-title').value.trim()     || 'Matematik';
    const showAns = document.getElementById('ab-show-answers').checked;
    const areas   = [...document.querySelectorAll('#areas-popup input[type="checkbox"]:checked')]
                      .map(el => el.value);
    return { grade, count, cols, pages, perPage, theme, title, showAns, problemlosning: problemlosningRaw, areas };
  }

  // =========================================================
  //  Problem-generering
  // =========================================================
  function makeSettings(cfg) {
    return {
      grade:          cfg.grade,
      areas:          cfg.areas,
      problemlosning: cfg.problemlosning,
      flersteg:       false,
      addsubModes:    ['enkel', 'talserie', 'flerciffrig'],
      specificTables: [],
      brakTypes:      ['name', 'add-same-den', 'compare', 'add-diff-den', 'fraction-of-whole', 'simplify'],
      geoQuestions:   ['area', 'perimeter', 'identify-type'],
      clockTypes:     ['read', 'set'],
    };
  }

  function generateOne(settings) {
    const available = settings.areas.length > 0
      ? settings.areas
      : getDefaultAreas(settings.grade);

    const filtered = available.filter(a => a !== 'custom');
    if (filtered.length === 0) return null;

    const area = filtered[Math.floor(Math.random() * filtered.length)];
    const type = area === 'oppna-utsagor' ? 'oppna-utsaga' : area;

    const plugin = PluginManager.get(type);
    if (!plugin) return null;

    try {
      let problem = plugin.generate(settings);
      if (problem && settings.problemlosning && typeof Templates !== 'undefined' && Templates.canWrap(area)) {
        problem = Templates.wrapInTemplate(problem, settings.grade);
      }
      return problem;
    } catch (_) {
      return null;
    }
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
      // Textuppgift: text ovanför, svarsdel under delad i rityta + rutnät
      card.appendChild(content);

      const ansSpace = document.createElement('div');
      ansSpace.className = 'ab-answer-space ab-answer-space--text';

      if (showAns && problem) {
        const key = document.createElement('div');
        key.className = 'ab-answer-key';
        key.textContent = `Svar: ${problem.answer}`;
        ansSpace.appendChild(key);
      } else {
        // Vänster: tom rityta
        const drawArea = document.createElement('div');
        drawArea.className = 'ab-draw-area';
        ansSpace.appendChild(drawArea);

        // Höger: rutnät + svarslinje
        const gridWrap = document.createElement('div');
        gridWrap.className = 'ab-text-grid-wrap';

        const table = document.createElement('table');
        table.className = 'ab-answer-grid ab-answer-grid--small';
        const ROWS = 4, COLS = 4;
        for (let r = 0; r < ROWS; r++) {
          const tr = document.createElement('tr');
          for (let c = 0; c < COLS; c++) {
            tr.appendChild(document.createElement('td'));
          }
          table.appendChild(tr);
        }
        gridWrap.appendChild(table);

        const svarLine = document.createElement('div');
        svarLine.className = 'ab-answer-svar';
        svarLine.innerHTML = 'Svar: <span class="ab-answer-svar-line"></span>';
        gridWrap.appendChild(svarLine);

        ansSpace.appendChild(gridWrap);
      }
      card.appendChild(ansSpace);
    } else {
      card.appendChild(content);

      // Svarsutrymme – flex: 0 0 100% tvingar till egen rad
      const ansSpace = document.createElement('div');
      ansSpace.className = 'ab-answer-space';
      const isArithmetic = problem && ['addition', 'subtraktion', 'multiplikation', 'division'].includes(problem.type);
      if (showAns && problem) {
        const key = document.createElement('div');
        key.className = 'ab-answer-key';
        key.textContent = `Svar: ${problem.answer}`;
        ansSpace.appendChild(key);
      } else if (isArithmetic) {
        const table = document.createElement('table');
        table.className = 'ab-answer-grid';
        const ROWS = 5, COLS = 10;
        for (let r = 0; r < ROWS; r++) {
          const tr = document.createElement('tr');
          for (let c = 0; c < COLS; c++) {
            tr.appendChild(document.createElement('td'));
          }
          table.appendChild(tr);
        }
        ansSpace.appendChild(table);
      } else {
        for (let i = 0; i < 2; i++) {
          const line = document.createElement('div');
          line.className = 'ab-answer-line';
          ansSpace.appendChild(line);
        }
      }
      card.appendChild(ansSpace);
    }

    // 🔄 Regenerera-knapp (position: absolute, utanför flödet)
    const regen = document.createElement('button');
    regen.className = 'ab-regen-btn no-print';
    regen.title = 'Byt uppgift';
    regen.textContent = '🔄';
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
    sub.textContent = `Åk ${cfg.grade}`;

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
  //  Varje sida är ett självständigt block. Sida 2+ får
  //  klassen .ab-sheet--next-page som i print triggar
  //  break-before: page → garanterad ny papperssida.
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
      sheet.className = 'ab-sheet' + (cfg.theme ? ` ${cfg.theme}` : '');
      if (pageIdx > 0) sheet.classList.add('ab-sheet--next-page');

      const inner = document.createElement('div');
      inner.className = 'ab-sheet-inner';

      // Sidhuvud enbart på första sidan
      if (pageIdx === 0) inner.appendChild(buildHeader(cfg));

      const grid = document.createElement('div');
      grid.className = `ab-problem-grid ab-problem-grid--${cfg.cols}col`;

      pageProblems.forEach((p, i) => {
        grid.appendChild(renderProblemCard(p, pageStart + i, cfg.showAns));
      });

      inner.appendChild(grid);

      const footer = document.createElement('footer');
      footer.className = 'ab-footer';
      footer.textContent = 'klassrummatte.se';
      inner.appendChild(footer);

      sheet.appendChild(inner);
      wrap.appendChild(sheet);
    }

    wrap.classList.remove('hidden');
    if (empty) empty.classList.add('hidden');
  }

  // =========================================================
  //  Publik API
  // =========================================================
  function isDuplicate(problem, list) {
    if (!problem) return false;
    const plugin = PluginManager.get(problem.type);
    if (plugin && typeof plugin.isSameProblem === 'function') {
      return list.some(existing => existing && plugin.isSameProblem(problem, existing));
    }
    // Fallback: jämför answer + type
    return list.some(existing => existing &&
      existing.type === problem.type &&
      String(existing.answer) === String(problem.answer));
  }

  function generate() {
    const cfg      = readConfig();
    const settings = makeSettings(cfg);
    sheetProblems  = [];

    for (let i = 0; i < cfg.count; i++) {
      let p = null;
      for (let attempt = 0; attempt < 10 && !p; attempt++) {
        const candidate = generateOne(settings);
        if (candidate && !isDuplicate(candidate, sheetProblems)) {
          p = candidate;
        }
      }
      // Om inga unika hittades efter 10 försök, ta vad som helst
      if (!p) {
        for (let attempt = 0; attempt < 3 && !p; attempt++) {
          p = generateOne(settings);
        }
      }
      sheetProblems.push(p);
    }

    renderSheet();
  }

  function regenerateProblem(index) {
    const cfg      = readConfig();
    const settings = makeSettings(cfg);
    let p = null;
    for (let attempt = 0; attempt < 5 && !p; attempt++) {
      p = generateOne(settings);
    }
    sheetProblems[index] = p;
    renderSheet();
  }

  // =========================================================
  //  Utskrift via dold iframe – laddar CSS via <link>,
  //  fungerar på både file:// och https://.
  // =========================================================
  function printViaIframe() {
    const wrap = document.getElementById('ab-sheet');
    if (!wrap || wrap.classList.contains('hidden')) {
      alert('Generera ett arbetsblad först!');
      return;
    }

    const content = wrap.innerHTML;

    // Skapa eller återanvänd gömd iframe
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
  .ab-sheet      { display: block !important; width: 100% !important; box-shadow: none !important; }
  .ab-sheet-inner{ display: block !important; }
  .ab-sheet + .ab-sheet { page-break-before: always !important; break-before: page !important; margin-top: 0 !important; }
  .ab-regen-btn, .no-print { display: none !important; }
  @page { size: A4 portrait; margin: 1cm 1.5cm; }
</style>
</head><body>
<div class="ab-sheet-wrap">${content}</div>
</body></html>`);
    doc.close();

    // Vänta tills CSS-filerna laddats, sedan skriv ut
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };
  }

  function updateColsVisibility() {
    const colsGroup = document.getElementById('ab-cols')?.closest('.config-group');
    const isProblemlosning = document.getElementById('ab-problemlosning')?.checked;
    if (colsGroup) {
      colsGroup.style.opacity = isProblemlosning ? '0.4' : '1';
      colsGroup.style.pointerEvents = isProblemlosning ? 'none' : '';
    }
  }

  function init() {
    document.getElementById('ab-generate-btn')
      ?.addEventListener('click', generate);

    document.getElementById('ab-print-btn')
      ?.addEventListener('click', printViaIframe);

    document.getElementById('ab-problemlosning')
      ?.addEventListener('change', updateColsVisibility);

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
