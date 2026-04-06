// js/gameshow.js
// Gameshow-läge: poängtavla, timer, frågor via plugin-systemet.

const Gameshow = (() => {

  // ─── State ──────────────────────────────────────────────
  let teamScores = Array(10).fill(0);
  let teamNames  = Array.from({ length: 10 }, (_, i) => `Lag ${i + 1}`);
  let timerInterval = null;
  let timeLeft = 60;
  let currentProblems = [];
  let sessionActiveSetId = null; // Session-import: när satt, används bara detta set

  // ─── DOM-refs (sätts i init) ────────────────────────────
  let els = {};

  // ─── Config från ArbetsbladConfig ───────────────────────
  const { AREA_CONFIG, SUB_SETTINGS } = ArbetsbladConfig;

  // =========================================================
  //  Poängtavla
  // =========================================================
  function renderScoreboard() {
    const count = parseInt(els.teamCount.value);
    els.teamsContainer.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'gs-team-row';

      // Redigerbart lagnamn
      const name = document.createElement('span');
      name.className = 'gs-team-name';
      name.textContent = teamNames[i];
      name.title = 'Klicka för att byta namn';
      name.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'gs-team-name-input';
        input.value = teamNames[i];
        input.maxLength = 20;
        const save = () => {
          const val = input.value.trim();
          teamNames[i] = val || `Lag ${i + 1}`;
          renderScoreboard();
        };
        input.addEventListener('blur', save);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
        name.replaceWith(input);
        input.focus();
        input.select();
      });

      const controls = document.createElement('div');
      controls.className = 'gs-score-controls';

      const minus = document.createElement('button');
      minus.className = 'gs-score-btn';
      minus.textContent = '−';
      minus.onclick = () => { teamScores[i] = Math.max(0, teamScores[i] - 1); renderScoreboard(); };

      const score = document.createElement('span');
      score.className = 'gs-team-score';
      score.textContent = teamScores[i];

      const plus = document.createElement('button');
      plus.className = 'gs-score-btn';
      plus.textContent = '+';
      plus.onclick = () => { teamScores[i]++; renderScoreboard(); };

      controls.append(minus, score, plus);
      row.append(name, controls);
      els.teamsContainer.appendChild(row);
    }
  }

  // =========================================================
  //  Timer (övre vänstra hörnet av scenen)
  // =========================================================
  function startTimer() {
    clearInterval(timerInterval);
    const duration = parseInt(els.timerDuration.value) || 60;

    if (duration === 0) {
      els.timeDisplay.textContent = '';
      els.timerPath.style.strokeDashoffset = 283;
      els.timerWrap.classList.add('gs-timer--off');
      return;
    }

    els.timerWrap.classList.remove('gs-timer--off');
    timeLeft = duration;
    updateTimerDisplay(duration);
    els.timerPath.style.stroke = '#00ffcc';

    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimerDisplay(duration);
      if (timeLeft <= 10) els.timerPath.style.stroke = '#ff4757';
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        els.timeDisplay.textContent = '0';
      }
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function updateTimerDisplay(duration) {
    els.timeDisplay.textContent = timeLeft;
    const offset = 283 - ((timeLeft / duration) * 283);
    els.timerPath.style.strokeDashoffset = offset;
  }

  // =========================================================
  //  Inställningar → Settings-objekt
  // =========================================================
  function readSettings() {
    const grade = parseInt(els.grade.value) || 3;
    const areas = [];
    document.querySelectorAll('#gs-areas input[type="checkbox"]:checked').forEach(cb => {
      areas.push(cb.value);
    });

    const problemlosning = document.getElementById('gs-problemlosning')?.checked || false;
    const customList = Settings.getCustomProblems();
    const customProblemsEnabled = customList.length > 0;

    const settings = {
      grade, areas,
      problemlosning,
      customProblemsEnabled,
      specificTables: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      sessionActiveSetId,
    };

    // Läs sub-settings dynamiskt
    const seenKeys = new Set();
    for (const [, sub] of Object.entries(SUB_SETTINGS)) {
      const key = sub.settingsKey;
      if (!key || seenKeys.has(key)) continue;
      seenKeys.add(key);
      settings[key] = getCheckedValues('gs-' + key);
      if (sub.extraGroups) {
        sub.extraGroups.forEach(eg => {
          if (!seenKeys.has(eg.settingsKey)) {
            seenKeys.add(eg.settingsKey);
            settings[eg.settingsKey] = getCheckedValues('gs-' + eg.settingsKey);
          }
        });
      }
    }

    return settings;
  }

  function getCheckedValues(name) {
    const cbs = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(cbs).map(cb => cb.value);
  }

  // =========================================================
  //  Frågor
  // =========================================================
  function generateProblem() {
    const settings = readSettings();
    const p = Problems.generateProblem(settings);
    return p;
  }

  function renderProblem(problem) {
    const container = els.problemDisplay;
    container.innerHTML = '';

    if (!problem) {
      container.innerHTML = '<div class="gs-intro">Inga uppgifter — kontrollera inställningarna</div>';
      container.className = 'gs-problem-area';
      return;
    }

    Renderer.renderProblem(problem, container);
    // Renderer sätter className='hidden' — återställ till gameshow-klass
    container.className = 'gs-problem-area';
  }

  function revealAnswers() {
    stopTimer();
    if (currentProblems.length > 0) {
      Answer.showAnswer(currentProblems[0], els.problemDisplay, null);
    }
  }

  function nextRound() {
    const p = generateProblem();
    currentProblems = p ? [p] : [];
    renderProblem(p);
    startTimer();
  }

  // =========================================================
  //  Områdesval + sub-settings i sidebaren
  // =========================================================
  function buildAreaCheckboxes() {
    const container = els.areasGrid;
    container.innerHTML = '';

    const renderedSubKeys = new Set();

    AREA_CONFIG.forEach(cat => {
      const catLabel = document.createElement('div');
      catLabel.className = 'gs-area-category';
      catLabel.textContent = cat.cat;
      container.appendChild(catLabel);

      cat.areas.forEach(a => {
        const label = document.createElement('label');
        label.className = 'gs-area-label';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = a.id;
        cb.checked = true;
        label.appendChild(cb);
        label.append(' ' + a.label);
        container.appendChild(label);

        const sub = SUB_SETTINGS[a.id];
        if (sub && sub.options && !sub.shared && !renderedSubKeys.has(sub.settingsKey)) {
          renderedSubKeys.add(sub.settingsKey);
          container.appendChild(buildSubSection(sub));
          if (sub.extraGroups) {
            sub.extraGroups.forEach(eg => {
              if (!renderedSubKeys.has(eg.settingsKey)) {
                renderedSubKeys.add(eg.settingsKey);
                container.appendChild(buildSubSection(eg));
              }
            });
          }
        }
      });
    });
  }

  function buildSubSection(sub) {
    const wrap = document.createElement('div');
    wrap.className = 'gs-sub-section';

    const toggle = document.createElement('div');
    toggle.className = 'gs-sub-toggle';
    toggle.textContent = sub.title;
    toggle.addEventListener('click', () => wrap.classList.toggle('gs-sub-section--open'));
    wrap.appendChild(toggle);

    const body = document.createElement('div');
    body.className = 'gs-sub-body';

    sub.options.forEach(opt => {
      const label = document.createElement('label');
      label.className = 'gs-area-label';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.name = 'gs-' + sub.settingsKey;
      cb.value = opt.value;
      cb.checked = !!opt.checked;
      label.appendChild(cb);
      label.append(' ' + opt.label);
      body.appendChild(label);
    });

    wrap.appendChild(body);
    return wrap;
  }

  function toggleAllAreas(check) {
    document.querySelectorAll('#gs-areas input[type="checkbox"]').forEach(cb => {
      cb.checked = check;
    });
  }

  // =========================================================
  //  Egna uppgifter (import)
  // =========================================================
  function handleFileImport() {
    const file = els.fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const name = file.name.replace(/\.[^.]+$/, '');
      const result = CustomProblems.importFromCsvText(reader.result, name);
      if (result.success) {
        sessionActiveSetId = result.setId;
        renderCustomSets();
      } else {
        alert(result.error);
      }
    };
    reader.readAsText(file, 'utf-8');
    els.fileInput.value = '';
  }

  function handlePasteImport() {
    const textarea = document.getElementById('gs-paste');
    const text = (textarea && textarea.value) || '';
    if (!text.trim()) return;
    const result = CustomProblems.importFromCsvText(text);
    if (result.success) {
      sessionActiveSetId = result.setId;
      if (textarea) textarea.value = '';
      renderCustomSets();
    } else {
      alert(result.error);
    }
  }

  function renderCustomSets() {
    const container = document.getElementById('gs-custom-sets');
    if (!container) return;
    const sets = Settings.getCustomProblemSets();
    container.innerHTML = '';

    if (sets.length === 0) {
      container.innerHTML = '<div class="gs-custom-empty">Inga importerade set</div>';
      return;
    }

    sets.forEach(s => {
      const row = document.createElement('div');
      row.className = 'gs-custom-row';
      const isSession = sessionActiveSetId === s.id;

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!s.enabled;
      cb.addEventListener('change', () => {
        Settings.toggleCustomProblemSet(s.id, cb.checked);
      });

      const label = document.createElement('span');
      label.className = 'gs-custom-name';
      label.textContent = `${s.name} (${s.problems.length})` + (isSession ? ' ★' : '');
      if (isSession) label.title = 'Aktiv session-import – bara detta set används';

      const useBtn = document.createElement('button');
      useBtn.className = 'gs-custom-use';
      useBtn.textContent = isSession ? '●' : '○';
      useBtn.title = isSession ? 'Aktiv session' : 'Använd bara detta set';
      useBtn.addEventListener('click', () => {
        sessionActiveSetId = isSession ? null : s.id;
        renderCustomSets();
      });

      const del = document.createElement('button');
      del.className = 'gs-custom-del';
      del.textContent = '×';
      del.title = 'Ta bort';
      del.addEventListener('click', () => {
        if (sessionActiveSetId === s.id) sessionActiveSetId = null;
        Settings.deleteCustomProblemSet(s.id);
        renderCustomSets();
      });

      row.append(cb, useBtn, label, del);
      container.appendChild(row);
    });
  }

  // =========================================================
  //  Panel & helskärm
  // =========================================================
  function toggleSettings() {
    document.getElementById('gs-settings').classList.toggle('gs-settings--hidden');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      els.fullscreenBtn.classList.add('is-fullscreen');
    } else {
      document.exitFullscreen();
      els.fullscreenBtn.classList.remove('is-fullscreen');
    }
  }

  // =========================================================
  //  Init
  // =========================================================
  function init() {
    els = {
      teamCount:      document.getElementById('gs-team-count'),
      teamsContainer: document.getElementById('gs-teams'),
      grade:          document.getElementById('gs-grade'),
      timerDuration:  document.getElementById('gs-timer'),
      fileInput:      document.getElementById('gs-file-input'),
      areasGrid:      document.getElementById('gs-areas'),
      problemDisplay: document.getElementById('gs-problem-display'),
      timeDisplay:    document.getElementById('gs-time'),
      timerPath:      document.getElementById('gs-timer-path'),
      timerWrap:      document.getElementById('gs-timer-wrap'),
      fullscreenBtn:  document.getElementById('gs-fullscreen'),
    };

    renderScoreboard();
    els.teamCount.addEventListener('change', () => {
      teamScores = Array(10).fill(0);
      teamNames = Array.from({ length: 10 }, (_, i) => `Lag ${i + 1}`);
      renderScoreboard();
    });

    buildAreaCheckboxes();

    document.getElementById('gs-areas-toggle')?.addEventListener('click', () => {
      document.getElementById('gs-areas-section').classList.toggle('gs-sub-section--open');
    });
    document.getElementById('gs-select-all')?.addEventListener('click', () => toggleAllAreas(true));
    document.getElementById('gs-deselect-all')?.addEventListener('click', () => toggleAllAreas(false));
    document.getElementById('gs-settings-toggle')?.addEventListener('click', toggleSettings);

    // Import av egna uppgifter
    document.getElementById('gs-import-csv')?.addEventListener('click', () => els.fileInput.click());
    document.getElementById('gs-download-template')?.addEventListener('click', () => CustomProblems.downloadTemplate());
    els.fileInput?.addEventListener('change', handleFileImport);
    document.getElementById('gs-import-paste')?.addEventListener('click', handlePasteImport);
    renderCustomSets();

    document.getElementById('gs-btn-next').addEventListener('click', nextRound);
    document.getElementById('gs-btn-answer').addEventListener('click', revealAnswers);
    els.fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Timer startläge
    els.timerPath.style.strokeDashoffset = 0;
    els.timeDisplay.textContent = els.timerDuration.value;

    els.timerDuration.addEventListener('change', () => {
      if (!timerInterval) {
        const v = els.timerDuration.value;
        els.timeDisplay.textContent = v === '0' ? '' : v;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { nextRound, revealAnswers };
})();
