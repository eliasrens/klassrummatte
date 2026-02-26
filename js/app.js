// js/app.js
// Huvudapplikation: orkestration, scen-events och problemflöde.
// Beror på: Settings, Problems, Templates, Renderer, Bildstod, Answer, Menu.

const App = (() => {

  const BILDSTOD_DELAY_MS = 10000;

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

    bindStageEvents();

    showAnswerBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (!problemVisible) return;
      const settings = Settings.get();
      if (settings.multipleProblems && currentProblems.length > 0) {
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
      } else {
        const ans = document.createElement('p');
        ans.className = 'extra-answer-reveal';
        ans.textContent = `Svar: ${currentExtraProblem.answer}`;
        extraDisplay.appendChild(ans);
      }
      extraAnswerBtn.disabled    = true;
      extraAnswerBtn.textContent = '✓';
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

    const settings = Settings.get();

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
      const delay = settings.bildstodInstant ? 80 : BILDSTOD_DELAY_MS;
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
