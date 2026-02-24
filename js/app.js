// js/app.js
// Huvudapplikation: orkestration, scen-events och problemflöde.
// Beror på: Settings, Problems, Templates, Renderer, Bildstod, Answer, Menu.

const App = (() => {

  const EXTRA_DELAY_MS    = 10000;
  const BILDSTOD_DELAY_MS = 10000;

  // =========================================================
  //  DOM-referenser
  // =========================================================
  let stage, problemDisplay, extraPanel, extraDisplay, clickHint, showAnswerBtn;

  // =========================================================
  //  App-state
  // =========================================================
  let problemVisible = false;
  let extraTimer     = null;
  let hideTimer      = null;
  let bildstodTimer  = null;
  let currentProblem = null;
  let lastProblem    = null;

  // =========================================================
  //  Init
  // =========================================================
  function init() {
    stage          = document.getElementById('stage');
    problemDisplay = document.getElementById('problem-display');
    extraPanel     = document.getElementById('extra-panel');
    extraDisplay   = document.getElementById('extra-display');
    clickHint      = document.getElementById('click-hint');
    showAnswerBtn  = document.getElementById('show-answer-btn');

    Menu.init(
      document.getElementById('menu-toggle'),
      document.getElementById('menu-overlay')
    );

    bindStageEvents();

    showAnswerBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (currentProblem && problemVisible) {
        Answer.showAnswer(currentProblem, problemDisplay, showAnswerBtn);
      }
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

    // Förhindra samma uppgift två gånger i rad
    let problem;
    let attempts = 0;
    do {
      problem = Problems.generateProblem(settings);
      attempts++;
    } while (Answer.isSameProblem(problem, lastProblem) && attempts < 5);
    lastProblem    = problem;
    currentProblem = problem;

    Renderer.renderProblem(problem, problemDisplay);

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

    if (settings.extraEnabled) {
      extraTimer = setTimeout(() => showExtraTask(settings), EXTRA_DELAY_MS);
    }

    if (settings.bildstod && Bildstod.hasBildstodSupport(problem, settings)) {
      const delay = settings.bildstodInstant ? 80 : BILDSTOD_DELAY_MS;
      bildstodTimer = setTimeout(() => {
        Bildstod.appendBildstod(problem, settings, problemDisplay, problemVisible);
      }, delay);
    }
  }

  function clearExtraTask() {
    if (extraTimer) { clearTimeout(extraTimer); extraTimer = null; }
    extraPanel.classList.remove('visible');
    document.body.classList.remove('extra-visible');
    setTimeout(() => { extraDisplay.innerHTML = ''; }, 460);
  }

  function clearBildstod() {
    if (bildstodTimer) { clearTimeout(bildstodTimer); bildstodTimer = null; }
    const existing = problemDisplay.querySelector('.bildstod-container');
    if (existing) existing.remove();
  }

  function showExtraTask(settings) {
    const extra = Problems.generateExtraProblem(settings);
    Renderer.renderExtraProblem(extra, extraDisplay);
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
  return {};
})();
