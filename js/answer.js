// js/answer.js
// Tunn fasad – delegerar till PluginManager för svar och upprepningsskydd.
// Behåller samma publika API: isSameProblem, showAnswer, appendAnswerBox.

const Answer = (() => {

  function isSameProblem(a, b) {
    if (!a || !b || a.type !== b.type) return false;
    if (a.type === 'flersteg') return a.intermediate === b.intermediate && a.answer === b.answer;
    const plugin = PluginManager.get(a.type);
    return plugin ? plugin.isSameProblem(a, b) : false;
  }

  function showAnswer(problem, problemDisplay, showAnswerBtn) {
    // ── Flersteg: visa uträkning + svar i ett klick ──────────
    if (problem.type === 'flersteg') {
      const stepsDiv = problemDisplay.querySelector('.flersteg-steps');
      if (stepsDiv) stepsDiv.style.display = '';
      problemDisplay.querySelectorAll('.flersteg-inter, .flersteg-inter-copy, .flersteg-final')
        .forEach(el => el.classList.remove('answer-hidden'));
      showAnswerBtn.disabled    = true;
      showAnswerBtn.textContent = '\u2713';
      return;
    }

    if (problem.isTextProblem) {
      showAnswerBtn.disabled    = true;
      showAnswerBtn.textContent = '✓';
      PluginUtils.appendAnswerBox(problem.answer, problemDisplay);
      return;
    }
    const plugin = PluginManager.get(problem.type);
    if (plugin) plugin.showAnswer(problem, problemDisplay, showAnswerBtn);
  }

  function appendAnswerBox(text, container) {
    PluginUtils.appendAnswerBox(text, container);
  }

  return { isSameProblem, showAnswer, appendAnswerBox };
})();
