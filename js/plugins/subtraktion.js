// js/plugins/subtraktion.js

class SubtraktionPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'subtraktion';
  }

  generate(settings) {
    const grade = settings.grade;
    const c = PluginUtils.cfg(grade);
    const modes = (settings.addSubMode || ['standard']).filter(m => {
      if (m === 'uppstallning' && grade < 2) return false;
      if (m === 'decimaler'    && grade < 4) return false;
      if (m === 'flersteg') return false; // Ingen flerstegs-subtraktion
      return true;
    });
    const mode = modes.length > 0 ? PluginUtils.pickRandom(modes) : 'standard';

    if (mode === 'uppstallning') return PluginUtils.genUppstallningSub(grade, settings.addSubVaxling || ['med']);
    if (mode === 'decimaler')    return PluginUtils.genDecimaler(grade, '−');

    const max = c.subMax;
    const a = PluginUtils.randInt(1, max);
    const b = PluginUtils.randInt(0, a);
    return { type: 'subtraktion', a, b, operator: '−', answer: a - b };
  }

  render(problem, container) {
    if (problem.mode === 'uppstallning') {
      PluginUtils.renderUppstallning(problem, container);
    } else if (problem.mode === 'decimaler') {
      PluginUtils.renderDecimaler(problem, container);
    } else {
      PluginUtils.renderArithmetic(problem, container);
    }
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    if (problem.mode === 'uppstallning') {
      const row = container.querySelector('.uppstallning-answer');
      if (row) row.classList.add('shown');
    } else {
      const el = container.querySelector('.answer-hidden');
      if (el) el.classList.remove('answer-hidden');
    }
  }

  isSameProblem(a, b) {
    return a.a === b.a && a.b === b.b;
  }

  hasBildstodSupport(problem, settings) {
    return settings.grade <= 3 && problem.a <= 30 && problem.b <= 30;
  }

  buildBildstod(problem, settings) {
    if (settings.grade <= 3 && problem.a <= 30)
      return PluginUtils.buildArithmeticDots(problem);
    return null;
  }
}

PluginManager.register(new SubtraktionPlugin());
