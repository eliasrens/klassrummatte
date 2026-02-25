// js/answer.js
// Tunn fasad – delegerar till PluginManager för svar och upprepningsskydd.
// Behåller samma publika API: isSameProblem, showAnswer, appendAnswerBox.

const Answer = (() => {

  function isSameProblem(a, b) {
    if (!a || !b || a.type !== b.type) return false;
    const plugin = PluginManager.get(a.type);
    return plugin ? plugin.isSameProblem(a, b) : false;
  }

  function showAnswer(problem, problemDisplay, showAnswerBtn) {
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
