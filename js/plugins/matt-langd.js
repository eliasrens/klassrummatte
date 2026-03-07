// js/plugins/matt-langd.js

class MattLangdPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'matt-langd';
  }

  generate(settings) {
    const grade = settings.grade;
    const pairs = grade <= 3
      ? [
          () => ({ from: PluginUtils.randInt(1, 20),   fromUnit: 'cm',  toUnit: 'mm',  factor: 10   }),
          () => ({ from: PluginUtils.randInt(2, 10),   fromUnit: 'm',   toUnit: 'cm',  factor: 100  }),
          () => ({ from: PluginUtils.randInt(20, 200), fromUnit: 'mm',  toUnit: 'cm',  factor: 0.1  }),
        ]
      : grade <= 5
        ? [
          () => ({ from: PluginUtils.randInt(1, 10),    fromUnit: 'km',  toUnit: 'm',   factor: 1000  }),
          () => ({ from: PluginUtils.randInt(1, 50),    fromUnit: 'm',   toUnit: 'cm',  factor: 100   }),
          () => ({ from: PluginUtils.randInt(500, 5000),fromUnit: 'm',   toUnit: 'km',  factor: 0.001 }),
          () => ({ from: PluginUtils.randInt(1, 10),    fromUnit: 'm',   toUnit: 'mm',  factor: 1000  }),
        ]
        : [
          () => ({ from: PluginUtils.randInt(1, 10) + PluginUtils.randInt(0, 9) * 0.1, fromUnit: 'km', toUnit: 'm',  factor: 1000 }),
          () => ({ from: PluginUtils.randInt(1, 5)  + PluginUtils.randInt(0, 9) * 0.1, fromUnit: 'm',  toUnit: 'cm', factor: 100  }),
        ];

    const conv = PluginUtils.pickRandom(pairs)();
    return { type: 'matt-langd', conversion: conv, answer: parseFloat((conv.from * conv.factor).toFixed(3)) };
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

PluginManager.register(new MattLangdPlugin());
