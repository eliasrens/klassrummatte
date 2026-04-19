// js/genomgang.js
// Genomgång – skapa, spara och spela upp förplanerade uppgiftssekvenser.
// IIFE-modul. Beror på: Settings, Problems, Renderer, PluginManager, PluginUtils.

const Genomgang = (() => {
  const STORAGE_KEY = 'klassrummatte-genomgangar';

  // Alla areas med svenska namn
  const AREA_LIST = [
    { value: 'addition',       label: 'Addition' },
    { value: 'subtraktion',    label: 'Subtraktion' },
    { value: 'multiplikation', label: 'Multiplikation' },
    { value: 'division',       label: 'Division' },
    { value: 'prioritet',      label: 'Prioritetsregler' },
    { value: 'oppna-utsagor',  label: 'Öppna utsagor' },
    { value: 'brak',           label: 'Bråk' },
    { value: 'procent',        label: 'Procent' },
    { value: 'tallinje',       label: 'Tallinje' },
    { value: 'talsorter',      label: 'Talsorter' },
    { value: 'talfoljd',       label: 'Talföljder' },
    { value: 'avrundning',    label: 'Avrundning' },
    { value: 'monster',       label: 'Mönster' },
    { value: 'negativa-tal',   label: 'Negativa tal' },
    { value: 'romerska',       label: 'Romerska siffror' },
    { value: 'geometri',       label: 'Geometri' },
    { value: 'koordinatsystem',label: 'Koordinatsystem' },
    { value: 'symmetri',       label: 'Symmetri' },
    { value: 'klocka',         label: 'Klocka' },
    { value: 'matt-langd',     label: 'Mått – längd' },
    { value: 'matt-volym',     label: 'Mått – volym' },
    { value: 'matt-vikt',      label: 'Mått – vikt' },
    { value: 'matt-tid',       label: 'Mått – tid' },
    { value: 'matt-area',      label: 'Mått – area' },
    { value: 'statistik',      label: 'Statistik' },
    { value: 'sannolikhet',    label: 'Sannolikhet' },
  ];

  // ── State ───────────────────────────────────────────────
  let previewProblems = [];
  let selectedQueue   = [];
  let playbackQueue   = [];
  let playbackIndex   = -1;
  let isPlaying       = false;
  let currentGG       = null;

  // DOM-refs (sätts i init)
  let overlay, previewGrid, queueList, queueCount, nameInput, saveBtn;
  let gradeSelect, areasWrap, playbackBar, playbackName, playbackCounter;

  // Sub-section wraps
  let ggAddsubWrap, ggMultdivWrap, ggGeometriWrap, ggKlockaWrap, ggBrakWrap, ggPrioritetWrap, ggStatistikWrap, ggVolymWrap;

  // =========================================================
  //  localStorage
  // =========================================================
  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (_) { return []; }
  }

  function saveAll(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (_) {}
  }

  function saveGenomgang(gg) {
    const list = loadAll();
    const idx = list.findIndex(g => g.id === gg.id);
    if (idx >= 0) list[idx] = gg; else list.push(gg);
    saveAll(list);
  }

  function deleteGenomgang(id) {
    saveAll(loadAll().filter(g => g.id !== id));
  }

  // =========================================================
  //  Overlay – öppna / stäng
  // =========================================================
  function openCreator() {
    previewProblems = [];
    selectedQueue   = [];
    nameInput.value = '';
    saveBtn.disabled = true;

    // Fyll årskurs från nuvarande inställning
    gradeSelect.value = Settings.getGrade();

    // Fyll areas med checkboxar
    buildAreaCheckboxes();

    overlay.classList.remove('hidden');
    generateBatch();
  }

  function closeCreator() {
    overlay.classList.add('hidden');
    previewProblems = [];
    selectedQueue   = [];
    previewGrid.innerHTML = '';
    queueList.innerHTML = '';
  }

  // =========================================================
  //  Config-panelen
  // =========================================================
  function buildAreaCheckboxes() {
    areasWrap.innerHTML = '';
    const currentAreas = Settings.getAreas();
    AREA_LIST.forEach(a => {
      const lbl = document.createElement('label');
      const cb  = document.createElement('input');
      cb.type  = 'checkbox';
      cb.value = a.value;
      if (currentAreas.length === 0 || currentAreas.includes(a.value)) cb.checked = true;
      cb.addEventListener('change', updateConfigVisibility);
      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(' ' + a.label));
      areasWrap.appendChild(lbl);
    });
    updateConfigVisibility();
  }

  function readOverlaySettings() {
    const grade = parseInt(gradeSelect.value) || 3;
    const areas = [];
    areasWrap.querySelectorAll('input:checked').forEach(cb => areas.push(cb.value));

    // Add/Sub mode
    const addSubMode = [];
    document.querySelectorAll('#gg-addsub-mode > label input:checked').forEach(cb => addSubMode.push(cb.value));
    const addSubVaxling = [];
    document.querySelectorAll('#gg-addsub-vaxling-wrap input:checked').forEach(cb => addSubVaxling.push(cb.value));

    // Mult/Div mode
    const multDivMode = [];
    document.querySelectorAll('#gg-multdiv-mode > label input:checked').forEach(cb => multDivMode.push(cb.value));
    const specificTables = [];
    document.querySelectorAll('input[name="gg-specific-table"]:checked').forEach(cb => specificTables.push(parseInt(cb.value)));
    const divisionRest = document.getElementById('gg-division-rest').checked;

    // Geometri types
    const geometriTypes = [];
    document.querySelectorAll('#gg-geometri-types input:checked').forEach(cb => geometriTypes.push(cb.value));

    // Klocka types
    const klockaTypes = [];
    document.querySelectorAll('#gg-klocka-types input:checked').forEach(cb => klockaTypes.push(cb.value));

    // Bråk types
    const brakTypes = [];
    document.querySelectorAll('#gg-brak-types input:checked').forEach(cb => brakTypes.push(cb.value));

    // Prioritet ops
    const prioritetOps = [];
    document.querySelectorAll('#gg-prioritet-ops input:checked').forEach(cb => prioritetOps.push(cb.value));

    // Statistik types
    const statistikTypes = [];
    document.querySelectorAll('#gg-statistik-types input:checked').forEach(cb => statistikTypes.push(cb.value));

    // Längd units
    const langdUnits = [];
    document.querySelectorAll('#gg-langd-units input:checked').forEach(cb => langdUnits.push(cb.value));

    // Volym units & modes
    const volymUnits = [];
    document.querySelectorAll('#gg-volym-units input:checked').forEach(cb => volymUnits.push(cb.value));
    const volymModes = [];
    document.querySelectorAll('#gg-volym-modes input:checked').forEach(cb => volymModes.push(cb.value));

    // Toggles
    const bildstod = document.getElementById('gg-bildstod-check').checked;
    const problemlosning = document.getElementById('gg-problemlosning-check').checked;
    const discussionEnabled = document.getElementById('gg-discussion-check').checked;

    // Problemlösningskälla: auto eller egenimporterade
    const srcRadio = document.querySelector('input[name="gg-problemlosning-src"]:checked');
    const customEnabled = problemlosning && srcRadio && srcRadio.value === 'egna';

    return {
      grade,
      areas: customEnabled ? [...areas, 'egna-uppgifter'] : areas,
      addSubMode,
      addSubVaxling: addSubVaxling.length ? addSubVaxling : ['med'],
      multDivMode,
      specificTables: specificTables.length ? specificTables : [1,2,3,4,5,6,7,8,9],
      divisionRest,
      geometriTypes: geometriTypes.length ? geometriTypes : ['area', 'perimeter'],
      klockaTypes: klockaTypes.length ? klockaTypes : ['analog', 'digital'],
      brakTypes,
      prioritetOps: prioritetOps.length ? prioritetOps : ['mult', 'div'],
      statistikTypes: statistikTypes.length ? statistikTypes : ['bar', 'freq-table', 'pie-chart'],
      langdUnits: langdUnits.length ? langdUnits : ['mm', 'cm', 'dm', 'm', 'km'],
      volymUnits: volymUnits.length ? volymUnits : ['dl', 'l'],
      volymModes: volymModes.length ? volymModes : ['convert'],
      bildstod,
      bildstodDelay: 0,
      problemlosning: problemlosning && !customEnabled,
      flersteg: false,
      multipleProblems: false,
      multipleCount: 1,
      extraEnabled: false,
      sessionLimit: 'unlimited',
      discussionEnabled,
      gradeSelected: true,
      customProblemsEnabled: !!customEnabled,
    };
  }

  // Visa/dölj subsektioner beroende på valda areas
  function updateConfigVisibility() {
    const checked = new Set();
    areasWrap.querySelectorAll('input:checked').forEach(cb => checked.add(cb.value));

    const hasAddSub = checked.has('addition') || checked.has('subtraktion');
    const hasMultDiv = checked.has('multiplikation') || checked.has('division') || checked.has('oppna-utsagor');
    const hasGeometri = checked.has('geometri');
    const hasKlocka = checked.has('klocka');
    const hasBrak = checked.has('brak');
    const hasPrioritet = checked.has('prioritet');
    const hasStatistik = checked.has('statistik');
    const hasVolym = checked.has('matt-volym');

    if (ggAddsubWrap)   ggAddsubWrap.classList.toggle('hidden', !hasAddSub);
    if (ggMultdivWrap)  ggMultdivWrap.classList.toggle('hidden', !hasMultDiv);
    if (ggGeometriWrap) ggGeometriWrap.classList.toggle('hidden', !hasGeometri);
    if (ggKlockaWrap)   ggKlockaWrap.classList.toggle('hidden', !hasKlocka);
    if (ggBrakWrap)     ggBrakWrap.classList.toggle('hidden', !hasBrak);
    if (ggPrioritetWrap) ggPrioritetWrap.classList.toggle('hidden', !hasPrioritet);
    if (ggStatistikWrap) ggStatistikWrap.classList.toggle('hidden', !hasStatistik);
    if (ggVolymWrap)    ggVolymWrap.classList.toggle('hidden', !hasVolym);
  }

  // Visa/dölj uppställnings-växling
  function updateAddSubVaxlingVisibility() {
    const wrap = document.getElementById('gg-addsub-vaxling-wrap');
    if (!wrap) return;
    const uppstChecked = document.querySelector('#gg-addsub-mode input[value="uppstallning"]');
    wrap.classList.toggle('hidden', !uppstChecked || !uppstChecked.checked);
  }

  // Visa/dölj specifika tabeller
  function updateSpecificTablesVisibility() {
    const wrap = document.getElementById('gg-specific-tables-wrap');
    if (!wrap) return;
    const basicChecked = document.querySelector('#gg-multdiv-mode input[value="tables-basic"]');
    wrap.classList.toggle('hidden', !basicChecked || !basicChecked.checked);
  }

  // Visa/dölj problemlösnings-alternativ (auto/egna)
  function updateProblemlosningVisibility() {
    const cb = document.getElementById('gg-problemlosning-check');
    const opts = document.getElementById('gg-problemlosning-opts');
    if (!cb || !opts) return;
    opts.classList.toggle('hidden', !cb.checked);
    updateEgnaImportVisibility();
  }

  // Visa/dölj egna-import-sektionen
  function updateEgnaImportVisibility() {
    const wrap = document.getElementById('gg-egna-import-wrap');
    if (!wrap) return;
    const srcRadio = document.querySelector('input[name="gg-problemlosning-src"]:checked');
    const isEgna = srcRadio && srcRadio.value === 'egna';
    const plCheck = document.getElementById('gg-problemlosning-check');
    wrap.classList.toggle('hidden', !isEgna || !plCheck || !plCheck.checked);
    // Visa status om det redan finns importerade uppgifter
    if (isEgna) updateGgCustomStatus();
  }

  function updateGgCustomStatus() {
    const el = document.getElementById('gg-custom-status');
    if (!el) return;
    const list = Settings.getCustomProblems();
    if (list.length > 0) {
      el.textContent = list.length + ' uppgift' + (list.length === 1 ? '' : 'er') + ' importerade.';
    } else {
      el.textContent = 'Inga uppgifter importerade ännu.';
    }
  }

  // =========================================================
  //  Batch-generering
  // =========================================================
  function generateBatch() {
    previewGrid.innerHTML = '';
    previewProblems = [];
    const settings = readOverlaySettings();

    const count = 12;
    for (let i = 0; i < count; i++) {
      let problem = null;
      let attempts = 0;
      const maxAttempts = settings.problemlosning ? 20 : 8;
      do {
        problem = Problems.generateProblem(settings);
        // Om problemlösning är på, kasta bort uppgifter som inte blev textuppgifter
        if (problem && settings.problemlosning && !problem.isTextProblem) {
          problem = null;
        }
        attempts++;
      } while (!problem && attempts < maxAttempts);
      if (problem) previewProblems.push(problem);
    }
    renderPreviewGrid();
  }

  // =========================================================
  //  Förhandsgranskning (miniatyrer)
  // =========================================================
  function renderPreviewGrid() {
    previewGrid.innerHTML = '';
    previewProblems.forEach((problem, i) => {
      const card = document.createElement('div');
      card.className = 'gg-preview-card';

      // Rendera uppgiften i en nedskalad container
      const renderHost = document.createElement('div');
      renderHost.className = 'gg-preview-render';
      // renderProblem sätter className='hidden', vi jobbar runt det med en wrapper
      const inner = document.createElement('div');
      Renderer.renderProblem(problem, inner);
      inner.className = '';  // ta bort 'hidden'

      // Bildstöd i förhandsgranskningen
      const settings = readOverlaySettings();
      if (settings.bildstod && typeof Bildstod !== 'undefined' && Bildstod.hasBildstodSupport(problem, settings)) {
        const plugin = PluginManager.get(problem.type);
        if (plugin) {
          const bEl = plugin.buildBildstod(problem, settings);
          if (bEl && bEl instanceof Node) {
            const bWrap = document.createElement('div');
            bWrap.className = 'bildstod-container';
            bWrap.appendChild(bEl);
            inner.prepend(bWrap);
          }
        }
      }

      renderHost.appendChild(inner);
      card.appendChild(renderHost);

      // Typindikator
      const typeLabel = document.createElement('div');
      typeLabel.className = 'gg-preview-type';
      typeLabel.textContent = getTypeLabel(problem);
      card.appendChild(typeLabel);

      card.addEventListener('click', () => {
        addToQueue(problem);
        // Ta bort kortet från preview-griden
        card.remove();
      });

      previewGrid.appendChild(card);
    });

    // Beräkna skala baserat på kortstorlek
    requestAnimationFrame(() => {
      const firstCard = previewGrid.querySelector('.gg-preview-card');
      if (firstCard) {
        const cardW = firstCard.clientWidth;
        const scale = Math.min(cardW / 600, 0.6);
        previewGrid.querySelectorAll('.gg-preview-render').forEach(el => {
          el.style.setProperty('--gg-scale', scale);
        });
      }
    });
  }

  function getTypeLabel(problem) {
    if (!problem) return '';
    const map = {};
    AREA_LIST.forEach(a => { map[a.value] = a.label; });
    // oppna-utsaga → oppna-utsagor
    const key = problem.type === 'oppna-utsaga' ? 'oppna-utsagor' : problem.type;
    return map[key] || problem.type;
  }

  // =========================================================
  //  Kö-hantering
  // =========================================================
  function addToQueue(problem) {
    // Kopiera problemet (undvik referensdelning)
    const copy = JSON.parse(JSON.stringify(problem));
    selectedQueue.push(copy);
    updateQueueUI();
    updateSaveState();
  }

  function removeFromQueue(idx) {
    selectedQueue.splice(idx, 1);
    updateQueueUI();
    updateSaveState();
  }

  function moveInQueue(fromIdx, toIdx) {
    if (toIdx < 0 || toIdx >= selectedQueue.length) return;
    const [item] = selectedQueue.splice(fromIdx, 1);
    selectedQueue.splice(toIdx, 0, item);
    updateQueueUI();
  }

  // Drag-state
  let dragFromIdx = -1;

  function buildQueuePreview(problem) {
    const preview = document.createElement('div');
    preview.className = 'gg-queue-preview';

    const renderHost = document.createElement('div');
    renderHost.className = 'gg-queue-preview-render';
    const inner = document.createElement('div');
    Renderer.renderProblem(problem, inner);
    inner.className = '';  // ta bort 'hidden'

    // Bildstöd
    const settings = readOverlaySettings();
    if (settings.bildstod && typeof Bildstod !== 'undefined' && Bildstod.hasBildstodSupport(problem, settings)) {
      const plugin = PluginManager.get(problem.type);
      if (plugin) {
        const bEl = plugin.buildBildstod(problem, settings);
        if (bEl && bEl instanceof Node) {
          const bWrap = document.createElement('div');
          bWrap.className = 'bildstod-container';
          bWrap.appendChild(bEl);
          inner.prepend(bWrap);
        }
      }
    }

    renderHost.appendChild(inner);
    preview.appendChild(renderHost);

    // Beräkna skalad höjd efter rendering
    requestAnimationFrame(() => {
      const scale = 0.35;
      const contentH = renderHost.scrollHeight;
      preview.style.maxHeight = (contentH * scale + 8) + 'px';
    });

    return preview;
  }

  function updateQueueUI() {
    queueList.innerHTML = '';
    queueCount.textContent = '(' + selectedQueue.length + ')';

    if (selectedQueue.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'gg-queue-empty';
      empty.textContent = 'Klicka på uppgifter till vänster för att lägga till dem.';
      queueList.appendChild(empty);
      return;
    }

    selectedQueue.forEach((problem, i) => {
      const item = document.createElement('div');
      item.className = 'gg-queue-item';
      item.draggable = true;
      item.dataset.idx = i;

      // Drag events
      item.addEventListener('dragstart', e => {
        dragFromIdx = i;
        item.classList.add('gg-queue-dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('gg-queue-dragging');
        dragFromIdx = -1;
        // Ta bort alla drop-indikatorer
        queueList.querySelectorAll('.gg-queue-drop-above,.gg-queue-drop-below').forEach(el => {
          el.classList.remove('gg-queue-drop-above', 'gg-queue-drop-below');
        });
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = item.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        // Visa drop-indikator
        queueList.querySelectorAll('.gg-queue-drop-above,.gg-queue-drop-below').forEach(el => {
          el.classList.remove('gg-queue-drop-above', 'gg-queue-drop-below');
        });
        if (e.clientY < mid) {
          item.classList.add('gg-queue-drop-above');
        } else {
          item.classList.add('gg-queue-drop-below');
        }
      });
      item.addEventListener('dragleave', () => {
        item.classList.remove('gg-queue-drop-above', 'gg-queue-drop-below');
      });
      item.addEventListener('drop', e => {
        e.preventDefault();
        item.classList.remove('gg-queue-drop-above', 'gg-queue-drop-below');
        if (dragFromIdx < 0 || dragFromIdx === i) return;
        const rect = item.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        let toIdx = e.clientY < mid ? i : i + 1;
        // Justera index om vi drar nedåt
        if (dragFromIdx < toIdx) toIdx--;
        if (dragFromIdx !== toIdx) {
          const [moved] = selectedQueue.splice(dragFromIdx, 1);
          selectedQueue.splice(toIdx, 0, moved);
          updateQueueUI();
        }
        dragFromIdx = -1;
      });

      const num = document.createElement('span');
      num.className = 'gg-queue-num';
      num.textContent = i + 1;

      // Expandera-knapp (visa miniatyr)
      const expandBtn = document.createElement('button');
      expandBtn.className = 'gg-queue-expand';
      expandBtn.textContent = '▸';
      expandBtn.title = 'Visa uppgift';
      expandBtn.addEventListener('click', e => {
        e.stopPropagation();
        const wrap = item.closest('.gg-queue-entry');
        if (!wrap) return;
        const isOpen = wrap.classList.toggle('gg-queue-entry--open');
        expandBtn.textContent = isOpen ? '▾' : '▸';
        // Lazy-rendera preview vid första öppning
        if (isOpen) {
          let preview = wrap.querySelector('.gg-queue-preview');
          if (!preview) {
            preview = buildQueuePreview(problem);
            wrap.appendChild(preview);
          }
        }
      });

      const label = document.createElement('span');
      label.className = 'gg-queue-label';
      label.textContent = getQueueLabel(problem);

      const arrows = document.createElement('span');
      arrows.className = 'gg-queue-arrows';
      const up = document.createElement('button');
      up.className = 'gg-queue-arrow';
      up.textContent = '▲';
      up.title = 'Flytta upp';
      up.addEventListener('click', e => { e.stopPropagation(); moveInQueue(i, i - 1); });
      const down = document.createElement('button');
      down.className = 'gg-queue-arrow';
      down.textContent = '▼';
      down.title = 'Flytta ned';
      down.addEventListener('click', e => { e.stopPropagation(); moveInQueue(i, i + 1); });
      arrows.append(up, down);

      const remove = document.createElement('button');
      remove.className = 'gg-queue-remove';
      remove.textContent = '✕';
      remove.title = 'Ta bort';
      remove.addEventListener('click', e => { e.stopPropagation(); removeFromQueue(i); });

      item.append(num, expandBtn, label, arrows, remove);

      // Wrap: item-rad + expanderbar preview
      const entry = document.createElement('div');
      entry.className = 'gg-queue-entry';
      entry.appendChild(item);
      queueList.appendChild(entry);
    });
  }

  function getQueueLabel(problem) {
    if (!problem) return '—';
    const type = getTypeLabel(problem);
    if (problem.answer != null) return type + ': ' + problem.answer;
    return type;
  }

  function updateSaveState() {
    saveBtn.disabled = selectedQueue.length === 0 || nameInput.value.trim() === '';
  }

  // =========================================================
  //  Spara genomgång
  // =========================================================
  function saveCurrentGenomgang() {
    const name = nameInput.value.trim();
    if (!name || selectedQueue.length === 0) return;

    const cleanProblems = selectedQueue.map(p => ({ ...p }));

    // Spara relevanta inställningar med genomgången (för playback)
    const overlaySettings = readOverlaySettings();

    const gg = {
      id: 'gg_' + Date.now(),
      name,
      grade: parseInt(gradeSelect.value) || 3,
      created: Date.now(),
      problems: cleanProblems,
      settings: {
        bildstod: overlaySettings.bildstod,
        bildstodDelay: overlaySettings.bildstodDelay,
        discussionEnabled: overlaySettings.discussionEnabled,
        grade: overlaySettings.grade,
      },
    };

    saveGenomgang(gg);
    renderMenuList();
    closeCreator();
  }

  // =========================================================
  //  Menysektion (sparade genomgångar)
  // =========================================================
  function renderMenuList() {
    const container = document.getElementById('gg-menu-list');
    const emptyHint = document.getElementById('gg-menu-empty');
    if (!container) return;

    const list = loadAll();
    container.innerHTML = '';

    const expandBtn = document.getElementById('gg-expand-btn');
    if (list.length === 0) {
      if (emptyHint) emptyHint.classList.remove('hidden');
      if (expandBtn) expandBtn.classList.add('hidden');
      return;
    }
    if (emptyHint) emptyHint.classList.add('hidden');
    if (expandBtn) expandBtn.classList.remove('hidden');

    list.forEach(gg => {
      const item = document.createElement('div');
      item.className = 'gg-menu-item';

      const playBtn = document.createElement('button');
      playBtn.className = 'gg-menu-play';
      playBtn.textContent = '▶';
      playBtn.title = 'Spela genomgång';
      playBtn.addEventListener('click', e => {
        e.stopPropagation();
        startPlayback(gg);
        // Stäng menyn
        if (typeof Menu !== 'undefined') Menu.closeMenu();
      });

      const info = document.createElement('div');
      info.className = 'gg-menu-info';
      const nameEl = document.createElement('div');
      nameEl.className = 'gg-menu-name';
      nameEl.textContent = gg.name;
      const meta = document.createElement('div');
      meta.className = 'gg-menu-meta';
      meta.textContent = gg.problems.length + ' uppgifter · Åk ' + gg.grade;
      info.append(nameEl, meta);

      const delBtn = document.createElement('button');
      delBtn.className = 'gg-menu-delete';
      delBtn.textContent = '✕';
      delBtn.title = 'Ta bort';
      delBtn.addEventListener('click', e => {
        e.stopPropagation();
        deleteGenomgang(gg.id);
        renderMenuList();
      });

      item.append(playBtn, info, delBtn);
      container.appendChild(item);
    });
  }

  // =========================================================
  //  Playback
  // =========================================================
  function startPlayback(gg) {
    currentGG     = gg;
    playbackQueue = gg.problems.slice();
    playbackIndex = -1;  // advance() sätter till 0
    isPlaying     = true;

    playbackBar.classList.remove('hidden');
    playbackName.textContent = gg.name;
    updatePlaybackCounter();
  }

  function stopPlayback() {
    isPlaying     = false;
    playbackQueue = [];
    playbackIndex = -1;
    currentGG     = null;
    playbackBar.classList.add('hidden');
  }

  function advance() {
    if (!isPlaying) return;
    playbackIndex++;
    updatePlaybackCounter();
  }

  function goBackPlayback() {
    if (!isPlaying || playbackIndex <= 0) return;
    playbackIndex--;
    updatePlaybackCounter();
  }

  function getPlaybackProblem() {
    if (!isPlaying || playbackIndex < 0 || playbackIndex >= playbackQueue.length) return null;
    return playbackQueue[playbackIndex];
  }

  function getPlaybackSettings() {
    if (!currentGG || !currentGG.settings) return null;
    return currentGG.settings;
  }

  function isPlaybackActive() { return isPlaying; }

  function isPlaybackDone() {
    return isPlaying && playbackIndex >= playbackQueue.length;
  }

  function canGoBackPlayback() {
    return isPlaying && playbackIndex > 0;
  }

  function updatePlaybackCounter() {
    if (!playbackCounter) return;
    const total = playbackQueue.length;
    const current = Math.min(playbackIndex + 1, total);
    playbackCounter.textContent = current + ' / ' + total;
  }

  // =========================================================
  //  Init
  // =========================================================
  function init() {
    overlay         = document.getElementById('gg-overlay');
    previewGrid     = document.getElementById('gg-previews');
    queueList       = document.getElementById('gg-queue-list');
    queueCount      = document.getElementById('gg-queue-count');
    nameInput       = document.getElementById('gg-name-input');
    saveBtn         = document.getElementById('gg-save-btn');
    gradeSelect     = document.getElementById('gg-grade');
    areasWrap       = document.getElementById('gg-areas');
    playbackBar     = document.getElementById('gg-playback-bar');
    playbackName    = document.getElementById('gg-playback-name');
    playbackCounter = document.getElementById('gg-playback-counter');

    // Sub-section wraps
    ggAddsubWrap   = document.getElementById('gg-addsub-wrap');
    ggMultdivWrap  = document.getElementById('gg-multdiv-wrap');
    ggGeometriWrap = document.getElementById('gg-geometri-wrap');
    ggKlockaWrap   = document.getElementById('gg-klocka-wrap');
    ggBrakWrap     = document.getElementById('gg-brak-wrap');
    ggPrioritetWrap = document.getElementById('gg-prioritet-wrap');
    ggStatistikWrap = document.getElementById('gg-statistik-wrap');
    ggVolymWrap     = document.getElementById('gg-volym-wrap');

    if (!overlay) return;

    // Stäng-knapp
    document.getElementById('gg-close-btn').addEventListener('click', closeCreator);

    // Avmarkera allt
    const deselectBtn = document.getElementById('gg-deselect-all');
    if (deselectBtn) {
      deselectBtn.addEventListener('click', () => {
        areasWrap.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
        updateConfigVisibility();
      });
    }

    // Generera
    document.getElementById('gg-generate-btn').addEventListener('click', generateBatch);

    // Spara
    saveBtn.addEventListener('click', saveCurrentGenomgang);
    nameInput.addEventListener('input', updateSaveState);

    // Skapa-knapp i menyn
    const createBtn = document.getElementById('gg-create-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        if (typeof Menu !== 'undefined') Menu.closeMenu();
        openCreator();
      });
    }

    // Expand-knapp för sparade genomgångar
    const expandBtn = document.getElementById('gg-expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        const card = document.getElementById('gg-tool-card');
        if (card) card.classList.toggle('tool-card--expanded');
      });
    }

    // Stopp-knapp i playback-bar
    const stopBtn = document.getElementById('gg-playback-stop');
    if (stopBtn) {
      stopBtn.addEventListener('click', stopPlayback);
    }

    // Add/Sub: visa/dölj växling vid uppställning-toggle
    const uppstCb = document.querySelector('#gg-addsub-mode input[value="uppstallning"]');
    if (uppstCb) uppstCb.addEventListener('change', updateAddSubVaxlingVisibility);

    // Mult/Div: visa/dölj specifika tabeller vid tables-basic-toggle
    const basicCb = document.querySelector('#gg-multdiv-mode input[value="tables-basic"]');
    if (basicCb) basicCb.addEventListener('change', updateSpecificTablesVisibility);

    // Problemlösning: visa/dölj auto/egna + import
    const plCheck = document.getElementById('gg-problemlosning-check');
    if (plCheck) plCheck.addEventListener('change', updateProblemlosningVisibility);
    document.querySelectorAll('input[name="gg-problemlosning-src"]').forEach(r => {
      r.addEventListener('change', updateEgnaImportVisibility);
    });

    // Egna uppgifter: import via fil
    const ggFileInput = document.getElementById('gg-custom-file-input');
    if (ggFileInput) {
      ggFileInput.addEventListener('change', e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
          const text = (ev.target && ev.target.result) || '';
          const result = CustomProblems.importFromCsvText(text);
          const statusEl = document.getElementById('gg-custom-status');
          if (statusEl) {
            statusEl.textContent = result.success
              ? result.problems.length + ' uppgift' + (result.problems.length === 1 ? '' : 'er') + ' importerade.'
              : 'Fel: ' + result.error;
          }
        };
        reader.readAsText(file);
      });
    }

    // Egna uppgifter: import via inklistring
    const ggImportBtn = document.getElementById('gg-custom-import-btn');
    if (ggImportBtn) {
      ggImportBtn.addEventListener('click', () => {
        const textarea = document.getElementById('gg-custom-paste');
        const text = (textarea && textarea.value) || '';
        const result = CustomProblems.importFromCsvText(text);
        const statusEl = document.getElementById('gg-custom-status');
        if (statusEl) {
          statusEl.textContent = result.success
            ? result.problems.length + ' uppgift' + (result.problems.length === 1 ? '' : 'er') + ' importerade.'
            : 'Fel: ' + result.error;
        }
        if (result.success && textarea) textarea.value = '';
      });
    }

    // Rendera sparade genomgångar i menyn
    renderMenuList();
  }

  return {
    init,
    openCreator,
    isPlaybackActive,
    isPlaybackDone,
    getPlaybackProblem,
    getPlaybackSettings,
    advance,
    goBackPlayback,
    canGoBackPlayback,
    stopPlayback,
    renderMenuList,
  };
})();
