// js/plugins/matt-volym.js

class MattVolymPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'matt-volym';
  }

  generate(settings) {
    const grade = settings.grade;
    const pairs = grade <= 3
      ? [
          () => ({ from: PluginUtils.randInt(1, 5),  fromUnit: 'dl',  toUnit: 'cl',  factor: 10   }),
          () => ({ from: PluginUtils.randInt(1, 10), fromUnit: 'cl',  toUnit: 'ml',  factor: 10   }),
          () => ({ from: PluginUtils.randInt(1, 3),  fromUnit: 'l',   toUnit: 'dl',  factor: 10   }),
        ]
      : [
          () => ({ from: PluginUtils.randInt(1, 5),  fromUnit: 'l',   toUnit: 'dl',  factor: 10   }),
          () => ({ from: PluginUtils.randInt(1, 10), fromUnit: 'dl',  toUnit: 'l',   factor: 0.1  }),
          () => ({ from: PluginUtils.randInt(1, 5),  fromUnit: 'l',   toUnit: 'cl',  factor: 100  }),
          () => ({ from: PluginUtils.randInt(1, 3),  fromUnit: 'l',   toUnit: 'ml',  factor: 1000 }),
        ];

    const conv = PluginUtils.pickRandom(pairs)();
    return { type: 'matt-volym', conversion: conv, answer: parseFloat((conv.from * conv.factor).toFixed(3)) };
  }

  render(problem, container) {
    PluginUtils.renderMatt(problem, container);
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    const { from, fromUnit, toUnit } = problem.conversion;
    const display = container.querySelector('.matt-display');
    if (display) {
      display.innerHTML =
        `<span>${from}\u202F</span>` +
        `<span class="matt-unit">${fromUnit}</span>` +
        `<span>\u202F=\u202F</span>` +
        `<span class="answer-value">${problem.answer}\u202F</span>` +
        `<span class="matt-unit">${toUnit}</span>`;
    }
  }

  isSameProblem(a, b) {
    return a.conversion.from === b.conversion.from &&
           a.conversion.fromUnit === b.conversion.fromUnit &&
           a.conversion.toUnit === b.conversion.toUnit;
  }

  hasBildstodSupport(problem, settings) {
    return PluginUtils.canBuildMattBildstod(problem);
  }

  buildBildstod(problem, settings) {
    return PluginUtils.buildMattBildstodEl(problem);
  }
}

PluginManager.register(new MattVolymPlugin());
