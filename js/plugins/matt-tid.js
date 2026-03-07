// js/plugins/matt-tid.js
// Tid som måttenhet: sek, min, h, dygn, veckor (Åk 2–6).

class MattTidPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'matt-tid';
  }

  generate(settings) {
    const grade = settings.grade;
    const pairs = grade <= 3
      ? [
          () => ({ from: PluginUtils.randInt(1, 5) * 60, fromUnit: 'min',   toUnit: 'h',     factor: 1/60 }),
          () => ({ from: PluginUtils.randInt(1, 5),       fromUnit: 'h',     toUnit: 'min',   factor: 60   }),
          () => ({ from: PluginUtils.randInt(1, 7),       fromUnit: 'dygn',  toUnit: 'h',     factor: 24   }),
          () => ({ from: PluginUtils.randInt(1, 4),       fromUnit: 'veckor', toUnit: 'dygn', factor: 7    }),
        ]
      : grade <= 5
        ? [
          () => ({ from: PluginUtils.randInt(1, 5) * 60, fromUnit: 'sek',   toUnit: 'min',  factor: 1/60 }),
          () => ({ from: PluginUtils.randInt(1, 5),       fromUnit: 'min',   toUnit: 'sek',  factor: 60   }),
          () => ({ from: PluginUtils.randInt(1, 5) * 60, fromUnit: 'min',   toUnit: 'h',    factor: 1/60 }),
          () => ({ from: PluginUtils.randInt(1, 5),       fromUnit: 'h',     toUnit: 'min',  factor: 60   }),
          () => ({ from: PluginUtils.randInt(1, 7),       fromUnit: 'dygn',  toUnit: 'h',    factor: 24   }),
          () => ({ from: PluginUtils.randInt(1, 4),       fromUnit: 'veckor', toUnit: 'dygn', factor: 7   }),
        ]
        : [
          () => ({ from: PluginUtils.randInt(1, 5) * 60, fromUnit: 'sek',   toUnit: 'min',   factor: 1/60 }),
          () => ({ from: PluginUtils.randInt(1, 5),       fromUnit: 'min',   toUnit: 'sek',   factor: 60   }),
          () => ({ from: PluginUtils.randInt(1, 5) * 60, fromUnit: 'min',   toUnit: 'h',     factor: 1/60 }),
          () => ({ from: PluginUtils.randInt(1, 5),       fromUnit: 'h',     toUnit: 'min',   factor: 60   }),
          () => ({ from: PluginUtils.randInt(1, 7),       fromUnit: 'dygn',  toUnit: 'h',     factor: 24   }),
          () => ({ from: PluginUtils.randInt(2, 5) * 7,   fromUnit: 'dygn',  toUnit: 'veckor', factor: 1/7 }),
          () => ({ from: PluginUtils.randInt(1, 4),       fromUnit: 'veckor', toUnit: 'dygn', factor: 7    }),
        ];

    const conv = PluginUtils.pickRandom(pairs)();
    return { type: 'matt-tid', conversion: conv, answer: parseFloat((conv.from * conv.factor).toFixed(3)) };
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
}

PluginManager.register(new MattTidPlugin());
