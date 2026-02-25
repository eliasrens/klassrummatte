// js/render.js
// Tunn fasad – delegerar till PluginManager för all rendering.
// Behåller samma publika API: renderProblem, renderExtraProblem, renderUppstallning.

const Renderer = (() => {

  function _renderContent(problem, cell) {
    if (problem.isTextProblem) {
      const p = document.createElement('p');
      p.className = 'text-problem';
      p.textContent = problem.textTemplate;
      cell.appendChild(p);
      return;
    }
    const plugin = PluginManager.get(problem.type);
    if (plugin) plugin.render(problem, cell);
  }

  function renderProblem(problem, container) {
    container.innerHTML = '';
    container.className = 'hidden';
    _renderContent(problem, container);
  }

  function renderMultiple(problems, container) {
    container.innerHTML = '';
    container.className = 'hidden';
    const grid = document.createElement('div');
    grid.className = `problems-grid problems-grid--${problems.length}`;
    problems.forEach(problem => {
      const cell = document.createElement('div');
      cell.className = 'problem-cell';
      _renderContent(problem, cell);
      // Right-align cells whose immediate child is a span (arithmetic expressions)
      // so that = signs align vertically within each grid column
      if (cell.firstElementChild && cell.firstElementChild.tagName === 'SPAN') {
        cell.classList.add('arithmetic-cell');
      }
      grid.appendChild(cell);
    });
    container.appendChild(grid);
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

  return { renderProblem, renderMultiple, renderExtraProblem, renderUppstallning };
})();
