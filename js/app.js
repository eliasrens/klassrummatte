// js/app.js
// Huvudapplikation: orkestration, scen-events och problemflöde.
// Beror på: Settings, Problems, Templates, Renderer, Bildstod, Answer, Menu.

const App = (() => {


  const DISCUSSION_PROMPTS = [
    'Förklara för din granne hur du tänkte.',
    'Hur visste du att svaret är rätt?',
    'Finns det ett annat sätt att lösa det?',
    'Är alla överens? Varför / varför inte?',
    'Vad är det knepiga med den här uppgiften?',
  ];

  // =========================================================
  //  DOM-referenser
  // =========================================================
  let stage, problemDisplay, extraPanel, extraDisplay, clickHint, showAnswerBtn, extraAnswerBtn;

  // =========================================================
  //  App-state
  // =========================================================
  let problemVisible       = false;
  let extraTimer           = null;
  let extraClearTimer      = null;
  let hideTimer            = null;
  let bildstodTimer        = null;
  let currentProblem       = null;
  let lastProblem          = null;
  let currentProblems      = [];   // används i multi-mode
  let currentExtraProblem  = null;
  let sessionCurrent       = 0;
  let customCycleIndex     = -1; // cyklar igenom egna uppgifter vid scen-klick

  // =========================================================
  //  Init
  // =========================================================
  function init() {
    stage           = document.getElementById('stage');
    problemDisplay  = document.getElementById('problem-display');
    extraPanel      = document.getElementById('extra-panel');
    extraDisplay    = document.getElementById('extra-display');
    clickHint       = document.getElementById('click-hint');
    showAnswerBtn   = document.getElementById('show-answer-btn');
    extraAnswerBtn  = document.getElementById('extra-answer-btn');

    Menu.init(
      document.getElementById('menu-toggle'),
      document.getElementById('menu-overlay')
    );

    // Helskärmsknapp
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });
    document.addEventListener('fullscreenchange', () => {
      const isFs = !!document.fullscreenElement;
      fullscreenBtn.classList.toggle('is-fullscreen', isFs);
      fullscreenBtn.setAttribute('aria-label', isFs ? 'Avsluta helskärm' : 'Helskärmsläge');
      fullscreenBtn.setAttribute('title',      isFs ? 'Avsluta helskärm' : 'Helskärmsläge');
    });

    bindStageEvents();
    bindCustomProblem();

    showAnswerBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (!problemVisible) return;
      const settings = Settings.get();
      if (currentProblem && currentProblem.type === 'custom') {
        if (!currentProblem.answer) return;
        const box = document.createElement('div');
        box.className = 'answer-box';
        box.textContent = `Svar: ${currentProblem.answer}`;
        problemDisplay.appendChild(box);
        showAnswerBtn.disabled    = true;
        showAnswerBtn.textContent = '✓';
      } else if (settings.multipleProblems && currentProblems.length > 0) {
        const cells = problemDisplay.querySelectorAll('.problem-cell');
        currentProblems.forEach((p, i) => {
          if (cells[i]) Answer.showAnswer(p, cells[i], null);
        });
        showAnswerBtn.disabled    = true;
        showAnswerBtn.textContent = '✓';
      } else if (currentProblem) {
        Answer.showAnswer(currentProblem, problemDisplay, showAnswerBtn);
      }
    });

    extraAnswerBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (!currentExtraProblem) return;
      if (currentExtraProblem.type.startsWith('uppstallning')) {
        const row = extraDisplay.querySelector('.uppstallning-answer');
        if (row) row.classList.add('shown');
        extraAnswerBtn.disabled    = true;
        extraAnswerBtn.textContent = '✓';
      } else if (currentExtraProblem.type === 'brak') {
        const fracStr  = currentExtraProblem.answer;
        const brakPlug = PluginManager.get('brak');
        const word     = brakPlug ? brakPlug.getFractionName(fracStr) : null;
        const ans = document.createElement('p');
        ans.className   = 'extra-answer-reveal';
        ans.textContent = word ? `Svar: ${word} (${fracStr})` : `Svar: ${fracStr}`;
        extraDisplay.appendChild(ans);
        extraAnswerBtn.disabled    = true;
        extraAnswerBtn.textContent = '✓';
      } else {
        const ans = document.createElement('p');
        ans.className = 'extra-answer-reveal';
        ans.textContent = `Svar: ${currentExtraProblem.answer}`;
        extraDisplay.appendChild(ans);
        extraAnswerBtn.disabled    = true;
        extraAnswerBtn.textContent = '✓';
      }
    });
  }

  // =========================================================
  //  Egna uppgifter
  // =========================================================

  // Parser: "Svar: X" avslutar en uppgift – kan stå på egen rad eller sist på frågeraden.
  function parseCustomProblems(rawText) {
    if (!rawText || !rawText.trim()) return [];
    const problems = [];
    const lines    = rawText.split('\n');
    let currentLines = [];

    for (const line of lines) {
      const clean = line.replace(/\r$/, ''); // hantera Windows-radslut
      // Matcha "Svar: X" var som helst på raden (t.ex. "Fråga? Svar: 42" eller "Svar: 42")
      const m = clean.match(/^(.*?)[Ss]var:\s*(.+?)\s*$/);
      if (m) {
        const before = m[1].trim();
        const answer = m[2].trim();
        if (before) currentLines.push(before);
        const text = currentLines.join('\n').trim();
        if (text) problems.push({ type: 'custom', text, answer });
        currentLines = [];
      } else if (clean.trim()) {
        currentLines.push(clean.trimEnd());
      }
    }
    // Ev. sista uppgift utan svar-rad
    const lastText = currentLines.join('\n').trim();
    if (lastText) problems.push({ type: 'custom', text: lastText, answer: '' });

    return problems;
  }

  // Visa en egengjord uppgift på scenen
  function displayCustomProblem(prob) {
    clearExtraTask();
    clearBildstod();
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    problemDisplay.classList.remove('visible');
    problemDisplay.innerHTML = '';

    currentProblem  = prob;
    lastProblem     = null;
    currentProblems = [];

    const p = document.createElement('p');
    p.className   = 'custom-problem-text';
    p.textContent = prob.text;
    problemDisplay.appendChild(p);

    showAnswerBtn.disabled    = !prob.answer;
    showAnswerBtn.textContent = prob.answer ? 'Visa svar' : '–';

    problemDisplay.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      problemDisplay.classList.add('visible');
      showAnswerBtn.classList.add('problem-visible');
    }));
    clickHint.classList.add('hidden-hint');
    problemVisible = true;
  }

  function bindCustomProblem() {
    const textarea = document.getElementById('custom-problem-textarea');
    const counter  = document.getElementById('custom-counter');
    if (!textarea) return;

    function updateCounter() {
      const n = parseCustomProblems(textarea.value).length;
      counter.textContent = n === 0 ? '0 uppg. sparade' : `${n} uppg. sparade`;
    }

    // Ladda sparad text
    textarea.value = Settings.getCustomText();
    updateCounter();

    // Spara direkt vid redigering; börja om cykeln från uppgift 1
    textarea.addEventListener('input', () => {
      customCycleIndex = -1;
      updateCounter();
      Settings.setCustomText(textarea.value);
    });
  }

  // =========================================================
  //  Scen-events
  // =========================================================
  function bindStageEvents() {
    stage.addEventListener('click', handleStageClick);
    stage.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStageClick(); }
    });
  }

  function handleStageClick(e) {
    if (e && (
      e.target.closest('#settings-menu') ||
      e.target.closest('#menu-toggle') ||
      e.target.closest('#extra-panel')
    )) return;

    if (document.body.classList.contains('menu-open')) {
      Menu.closeMenu();
      return;
    }

    if (!problemVisible) {
      showNewProblem();
    } else {
      // Starta uttoning
      problemDisplay.classList.remove('visible');
      showAnswerBtn.classList.remove('problem-visible');
      clearExtraTask();
      clearBildstod();
      problemVisible = false;

      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        hideTimer = null;
        problemDisplay.innerHTML = '';
        showNewProblem();
      }, 370);
    }
  }

  // =========================================================
  //  Problemflöde
  // =========================================================
  function showNewProblem() {
    clearExtraTask();
    clearBildstod();

    const settings      = Settings.get();
    const hasCustomArea = settings.areas.includes('custom');
    const mathAreas     = settings.areas.filter(a => a !== 'custom');
    settings.areas      = mathAreas; // ta bort 'custom' så generatorer inte ser det

    // Egna uppgifter – cykla i ordning (enbart egna) eller blanda med matematik (blandläge)
    if (!settings.multipleProblems && hasCustomArea) {
      const parsed = parseCustomProblems(Settings.getCustomText());
      if (parsed.length > 0) {
        if (mathAreas.length === 0) {
          // Enbart egna uppgifter: cykla i ordning
          customCycleIndex = (customCycleIndex + 1) % parsed.length;
          displayCustomProblem(parsed[customCycleIndex]);
          return;
        }
        // Blandläge: egna uppgifter viktas lika som ett matematikområde
        const nAreas = mathAreas.length;
        if (Math.random() * (nAreas + parsed.length) < parsed.length) {
          displayCustomProblem(PluginUtils.pickRandom(parsed));
          return;
        }
      }
    }

    if (settings.multipleProblems) {
      problemDisplay.classList.add('multi-mode');
      currentProblems = Problems.generateMultipleProblems(settings);
      currentProblem  = null;
      Renderer.renderMultiple(currentProblems, problemDisplay);
    } else {
      problemDisplay.classList.remove('multi-mode');
      // Förhindra samma uppgift två gånger i rad
      let problem;
      let attempts = 0;
      do {
        problem = Problems.generateProblem(settings);
        attempts++;
      } while (Answer.isSameProblem(problem, lastProblem) && attempts < 5);
      lastProblem    = problem;
      currentProblem = problem;
      currentProblems = [];
      Renderer.renderProblem(problem, problemDisplay);
    }

    // Återställ svar-knappen
    showAnswerBtn.disabled    = false;
    showAnswerBtn.textContent = 'Visa svar';

    problemDisplay.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      problemDisplay.classList.add('visible');
      showAnswerBtn.classList.add('problem-visible');
    }));

    clickHint.classList.add('hidden-hint');
    problemVisible = true;

    updateSessionCounter();

    const dp = document.getElementById('discussion-prompt');
    if (Settings.isDiscussionEnabled()) {
      dp.textContent = DISCUSSION_PROMPTS[Math.floor(Math.random() * DISCUSSION_PROMPTS.length)];
      dp.classList.remove('hidden');
    } else {
      dp.classList.add('hidden');
    }

    if (settings.extraEnabled && !settings.multipleProblems) {
      const extraDelayMs = settings.extraDelay === 0 ? 80 : (settings.extraDelay || 10) * 1000;
      extraTimer = setTimeout(() => showExtraTask(settings), extraDelayMs);
    }

    if (!settings.multipleProblems && currentProblem &&
        settings.bildstod && Bildstod.hasBildstodSupport(currentProblem, settings)) {
      const delay = (settings.bildstodDelay ?? 10) * 1000;
      bildstodTimer = setTimeout(() => {
        Bildstod.appendBildstod(currentProblem, settings, problemDisplay, problemVisible);
      }, delay);
    }
  }

  function clearExtraTask() {
    if (extraTimer)      { clearTimeout(extraTimer);      extraTimer      = null; }
    if (extraClearTimer) { clearTimeout(extraClearTimer); extraClearTimer = null; }
    currentExtraProblem = null;
    extraPanel.classList.remove('visible');
    document.body.classList.remove('extra-visible');
    extraClearTimer = setTimeout(() => { extraDisplay.innerHTML = ''; extraClearTimer = null; }, 460);
  }

  function resetSession() {
    sessionCurrent = 0;
    const el = document.getElementById('session-counter');
    if (el) el.textContent = '';
  }

  function updateSessionCounter() {
    const limit = Settings.getSessionLimit();
    const el = document.getElementById('session-counter');
    if (limit === 'unlimited') { el.textContent = ''; return; }
    sessionCurrent++;
    const n = parseInt(limit, 10);
    el.textContent = `${sessionCurrent} / ${n}`;
    if (sessionCurrent >= n) sessionCurrent = 0;
  }

  function clearBildstod() {
    if (bildstodTimer) { clearTimeout(bildstodTimer); bildstodTimer = null; }
    const existing = problemDisplay.querySelector('.bildstod-container');
    if (existing) existing.remove();
  }

  function showExtraTask(settings) {
    if (extraClearTimer) { clearTimeout(extraClearTimer); extraClearTimer = null; extraDisplay.innerHTML = ''; }
    const extra = Problems.generateExtraProblem(settings);
    currentExtraProblem = extra;
    Renderer.renderExtraProblem(extra, extraDisplay);

    // Bildstöd för bråk i extra-panelen (respekterar bildstöd-inställningen)
    if (settings.bildstod && extra && extra.type === 'brak') {
      const plugin = PluginManager.get('brak');
      if (plugin && plugin.hasBildstodSupport(extra, settings)) {
        const el = plugin.buildBildstod(extra, settings);
        if (el) {
          if (!(el instanceof Node) && el.type === 'inject') {
            el.targets.forEach(({ selector, circle }) => {
              const host = extraDisplay.querySelector(selector);
              if (host) { circle.classList.add('brak-circle-anim'); host.prepend(circle); }
            });
          } else {
            extraDisplay.prepend(el);
          }
        }
      }
    }

    extraAnswerBtn.disabled    = false;
    extraAnswerBtn.textContent = 'Visa svar';
    extraPanel.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      extraPanel.classList.add('visible');
      document.body.classList.add('extra-visible');
    }));
  }

  // =========================================================
  //  Start
  // =========================================================
  document.addEventListener('DOMContentLoaded', init);
  return { resetSession };
})();
