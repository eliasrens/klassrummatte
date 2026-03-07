// js/plugins/BasePlugin.js
// Basklass för alla matematikplugins.
// Varje plugin extends BasePlugin och override:ar relevanta metoder.

class BasePlugin {
  constructor() {
    this.type = ''; // Måste sättas i varje subklass
  }

  // Generera ett problem-objekt utifrån settings-snapshot
  generate(settings) { return null; }

  // Rendera problem till container-div
  render(problem, container) {}

  // Visa rätt svar. Default: ta bort .answer-hidden + inaktivera knapp.
  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    const el = container.querySelector('.answer-hidden');
    if (el) el.classList.remove('answer-hidden');
  }

  // Kontrollera om två problem är identiska (upprepningsskydd)
  isSameProblem(a, b) { return false; }

  // Kan detta problem ha bildstöd?
  hasBildstodSupport(problem, settings) { return false; }

  // Bygg och returnera ett bildstöd-DOM-element, eller null
  buildBildstod(problem, settings) { return null; }
}
