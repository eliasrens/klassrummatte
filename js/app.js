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
  let stage, problemDisplay, extraPanel, extraDisplay, clickHint, showAnswerBtn, extraAnswerBtn, prevBtn;

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
  let problemHistory       = [];   // historik för bakåtnavigering
  let historyIndex         = -1;   // -1 = ingen historik visas

  // Timer-state
  let timerInterval        = null;
  let timerRemaining       = 0;
  let timerDuration        = 0;
  let timerPaused          = false;

  // Global hook för livesession (lärarvy + Firebase)
  window.KlassrumsSession = window.KlassrumsSession || {
    currentProblem: null,
  };

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

    prevBtn         = document.getElementById('prev-problem-btn');

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

    prevBtn.addEventListener('click', e => {
      e.stopPropagation();
      goBack();
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

    // Genomgång
    if (typeof Genomgang !== 'undefined') Genomgang.init();
  }

  // =========================================================
  //  Scen-events
  // =========================================================
  function bindStageEvents() {
    const nextBtn = document.getElementById('next-problem-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', e => {
        e.stopPropagation();
        handleStageClick(e, true);
      });
    }
    if (clickHint) {
      clickHint.style.cursor = 'pointer';
      clickHint.addEventListener('click', e => {
        e.stopPropagation();
        handleStageClick();
      });
    }
    stage.addEventListener('click', e => handleStageClick(e));
    stage.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStageClick(); }
    });
  }

  function handleStageClick(e, fromButton) {
    if (e && (
      e.target.closest('#settings-menu') ||
      e.target.closest('#menu-toggle') ||
      e.target.closest('#extra-panel') ||
      e.target.closest('#prev-problem-btn')
    )) return;

    // Under aktiv livesession: bara "Nästa uppgift"-knappen byter uppgift
    if (!fromButton && problemVisible && window.KlassrumsSessionTeacher && window.KlassrumsSessionTeacher.hasActiveSession()) return;

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
      prevBtn.classList.remove('problem-visible');
      const sendBtn = document.getElementById('send-to-students-btn');
      if (sendBtn) sendBtn.classList.remove('problem-visible');
      const nextBtn = document.getElementById('next-problem-btn');
      if (nextBtn) nextBtn.classList.remove('problem-visible');
      clearExtraTask();
      clearBildstod();
      stopTimer();
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

    // ── Genomgång-playback ──────────────────────────────
    if (typeof Genomgang !== 'undefined' && Genomgang.isPlaybackActive()) {
      Genomgang.advance();
      if (Genomgang.isPlaybackDone()) {
        Genomgang.stopPlayback();
        problemDisplay.innerHTML = '<p style="font-size:1.6rem;font-weight:700;color:var(--text-muted);text-align:center;margin-top:2rem">Genomgången är klar!</p>';
        problemDisplay.classList.remove('hidden');
        requestAnimationFrame(() => requestAnimationFrame(() => {
          problemDisplay.classList.add('visible');
        }));
        problemVisible = true;
        clickHint.classList.add('hidden-hint');
        return;
      }
      const problem = Genomgang.getPlaybackProblem();
      const ggSettings = Genomgang.getPlaybackSettings();
      problemDisplay.classList.remove('multi-mode');
      currentProblem  = problem;
      currentProblems = [];
      Renderer.renderProblem(problem, problemDisplay);

      showAnswerBtn.disabled    = false;
      showAnswerBtn.textContent = 'Visa svar';
      problemDisplay.classList.remove('hidden');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        problemDisplay.classList.add('visible');
        showAnswerBtn.classList.add('problem-visible');
        prevBtn.classList.toggle('problem-visible', Genomgang.canGoBackPlayback());
      }));
      clickHint.classList.add('hidden-hint');
      problemVisible = true;

      // Bildstöd under genomgång-playback
      if (ggSettings && ggSettings.bildstod && problem &&
          Bildstod.hasBildstodSupport(problem, ggSettings)) {
        const delay = (ggSettings.bildstodDelay ?? 0) * 1000;
        bildstodTimer = setTimeout(() => {
          Bildstod.appendBildstod(problem, ggSettings, problemDisplay, problemVisible);
        }, delay || 80);
      }
      startTimer();
      return;
    }

    // Töm tidigare elevsvar på lärarvyn när en ny uppgift startas
    const submissionsMain = document.getElementById('session-submissions-main');
    const submissionsList = document.getElementById('session-submissions-list');
    if (submissionsMain) {
      submissionsMain.innerHTML = '';
      submissionsMain.classList.add('hidden');
    }
    if (submissionsList) {
      submissionsList.innerHTML = '';
    }

    const settings = Settings.get();

    if (settings.multipleProblems) {
      problemDisplay.classList.add('multi-mode');
      currentProblems = Problems.generateMultipleProblems(settings);
      currentProblem  = null;
      Renderer.renderMultiple(currentProblems, problemDisplay);
      window.KlassrumsSession.currentProblem = null;
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
      window.KlassrumsSession.currentProblem = currentProblem;
    }

    // Spara i historik
    problemHistory.push({
      problem: currentProblem,
      problems: currentProblems.length > 0 ? currentProblems.slice() : null,
      multi: settings.multipleProblems,
    });
    if (problemHistory.length > 50) problemHistory.shift();
    historyIndex = -1;

    // Återställ svar-knappen
    showAnswerBtn.disabled    = false;
    showAnswerBtn.textContent = 'Visa svar';

    problemDisplay.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      problemDisplay.classList.add('visible');
      showAnswerBtn.classList.add('problem-visible');
      prevBtn.classList.toggle('problem-visible', problemHistory.length > 1);
      const liveActive = window.KlassrumsSessionTeacher && window.KlassrumsSessionTeacher.hasActiveSession();
      const nextBtn = document.getElementById('next-problem-btn');
      if (nextBtn) nextBtn.classList.toggle('problem-visible', !!liveActive);
      const sendBtn = document.getElementById('send-to-students-btn');
      if (sendBtn) sendBtn.classList.toggle('problem-visible', !!liveActive);
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

    startTimer();
  }

  // =========================================================
  //  Historiknavigering (bakåt)
  // =========================================================
  function goBack() {
    // Genomgång-playback: backa i kön
    if (typeof Genomgang !== 'undefined' && Genomgang.isPlaybackActive()) {
      if (!Genomgang.canGoBackPlayback()) return;
      Genomgang.goBackPlayback();
      const problem = Genomgang.getPlaybackProblem();
      if (!problem) return;
      clearExtraTask();
      clearBildstod();
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      problemDisplay.classList.remove('multi-mode');
      currentProblem  = problem;
      currentProblems = [];
      Renderer.renderProblem(problem, problemDisplay);
      showAnswerBtn.disabled    = false;
      showAnswerBtn.textContent = 'Visa svar';
      problemDisplay.classList.remove('hidden');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        problemDisplay.classList.add('visible');
        showAnswerBtn.classList.add('problem-visible');
        prevBtn.classList.toggle('problem-visible', Genomgang.canGoBackPlayback());
      }));
      problemVisible = true;

      // Bildstöd vid bakåtnavigering i genomgång
      const ggSettings = Genomgang.getPlaybackSettings();
      if (ggSettings && ggSettings.bildstod && problem &&
          Bildstod.hasBildstodSupport(problem, ggSettings)) {
        bildstodTimer = setTimeout(() => {
          Bildstod.appendBildstod(problem, ggSettings, problemDisplay, problemVisible);
        }, 80);
      }
      return;
    }

    if (problemHistory.length < 2) return;

    // Bestäm index att visa
    if (historyIndex === -1) {
      // Första gången bakåt: visa näst sista
      historyIndex = problemHistory.length - 2;
    } else if (historyIndex > 0) {
      historyIndex--;
    } else {
      return; // redan längst bak
    }

    showFromHistory(historyIndex);
  }

  function showFromHistory(idx) {
    const entry = problemHistory[idx];
    if (!entry) return;

    clearExtraTask();
    clearBildstod();
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }

    if (entry.multi && entry.problems) {
      problemDisplay.classList.add('multi-mode');
      currentProblems = entry.problems;
      currentProblem  = null;
      Renderer.renderMultiple(currentProblems, problemDisplay);
    } else {
      problemDisplay.classList.remove('multi-mode');
      currentProblem  = entry.problem;
      currentProblems = [];
      Renderer.renderProblem(currentProblem, problemDisplay);
    }

    showAnswerBtn.disabled    = false;
    showAnswerBtn.textContent = 'Visa svar';

    problemDisplay.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      problemDisplay.classList.add('visible');
      showAnswerBtn.classList.add('problem-visible');
      prevBtn.classList.toggle('problem-visible', idx > 0);
    }));

    problemVisible = true;
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
    problemHistory = [];
    historyIndex   = -1;
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

  // =========================================================
  //  Timer
  // =========================================================
  const TIMER_CIRCUMFERENCE = 2 * Math.PI * 26; // 163.36

  function startTimer() {
    stopTimer();
    if (!Settings.isTimerEnabled()) return;
    timerDuration  = Settings.getTimerDuration();
    timerRemaining = timerDuration;
    timerPaused    = false;

    const el   = document.getElementById('stage-timer');
    const ring = el?.querySelector('.stage-timer-ring');
    const text = el?.querySelector('.stage-timer-text');
    if (!el) return;

    el.classList.remove('hidden', 'stage-timer--done', 'stage-timer--paused');
    updateTimerDisplay(ring, text);

    timerInterval = setInterval(() => {
      if (timerPaused) return;
      timerRemaining--;
      updateTimerDisplay(ring, text);
      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        el.classList.add('stage-timer--done');
      }
    }, 1000);
  }

  function updateTimerDisplay(ring, text) {
    const fraction = timerDuration > 0 ? timerRemaining / timerDuration : 0;
    const offset = TIMER_CIRCUMFERENCE * (1 - fraction);
    if (ring) ring.style.strokeDashoffset = offset;
    if (text) text.textContent = timerRemaining;
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    timerPaused = false;
    const el = document.getElementById('stage-timer');
    if (el) {
      el.classList.add('hidden');
      el.classList.remove('stage-timer--done', 'stage-timer--paused');
    }
  }

  function toggleTimerPause() {
    if (!timerInterval && timerRemaining <= 0) return;
    timerPaused = !timerPaused;
    const el = document.getElementById('stage-timer');
    if (el) el.classList.toggle('stage-timer--paused', timerPaused);
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
