// js/render.js
// Tunn fasad – delegerar till PluginManager för all rendering.
// Behåller samma publika API: renderProblem, renderExtraProblem, renderUppstallning.

const Renderer = (() => {

  function _renderContent(problem, cell) {
    // ── Flersteg: text + dolda beräkningssteg ────────────────
    if (problem.type === 'flersteg') {
      const p = document.createElement('p');
      p.className = 'text-problem';
      p.textContent = problem.textTemplate;
      cell.appendChild(p);

      const OPS = { add: '+', sub: '\u2212', mult: '\u00d7' };
      const stepsDiv = document.createElement('div');
      stepsDiv.className = 'flersteg-steps';

      // Steg 1: a [op1] b = [intermediate – dolt]
      const step1 = document.createElement('div');
      step1.className = 'flersteg-step';
      step1.innerHTML =
        `<span class="flersteg-label">Steg\u00a01:</span>` +
        `<span class="flersteg-op-str">${problem.a}\u00a0${OPS[problem.op1]}\u00a0${problem.b}\u00a0=\u00a0</span>` +
        `<span class="answer-value answer-hidden flersteg-inter">${problem.intermediate}</span>`;

      // Steg 2: [intermediate – dolt] [op2] c = [svar – dolt]
      const step2 = document.createElement('div');
      step2.className = 'flersteg-step';
      step2.innerHTML =
        `<span class="flersteg-label">Steg\u00a02:</span>` +
        `<span class="answer-value answer-hidden flersteg-inter-copy">${problem.intermediate}</span>` +
        `<span class="flersteg-op-str">\u00a0${OPS[problem.op2]}\u00a0${problem.c}\u00a0=\u00a0</span>` +
        `<span class="answer-value answer-hidden flersteg-final">${problem.answer}</span>`;

      stepsDiv.appendChild(step1);
      stepsDiv.appendChild(step2);
      stepsDiv.style.display = 'none'; // visas först när läraren klickar "Visa svar"
      cell.appendChild(stepsDiv);
      return;
    }

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
