// js/render.js
// Tunn fasad – delegerar till PluginManager för all rendering.
// Behåller samma publika API: renderProblem, renderExtraProblem, renderUppstallning.

const Renderer = (() => {

  function renderProblem(problem, container) {
    container.innerHTML = '';
    container.className = 'hidden';

    if (problem.isTextProblem) {
      const p = document.createElement('p');
      p.className = 'text-problem';
      p.textContent = problem.textTemplate;
      container.appendChild(p);
      return;
    }

    const plugin = PluginManager.get(problem.type);
    if (plugin) plugin.render(problem, container);
  }

  function renderExtraProblem(problem, container) {
    container.innerHTML = '';
    if (!problem) return;
    if (problem.type.startsWith('uppstallning')) {
      PluginUtils.renderUppstallning(problem, container);
      return;
    }
    const plugin = PluginManager.get(problem.type);
    if (plugin) plugin.render(problem, container);
    else PluginUtils.renderArithmetic(problem, container);
  }

  // Publik för bakåtkompatibilitet (används av extra-panel)
  function renderUppstallning(problem, container) {
    PluginUtils.renderUppstallning(problem, container);
  }

  return { renderProblem, renderExtraProblem, renderUppstallning };
})();
