// js/plugins/matt-vikt.js
// Vikt/massa: g, hg, kg, ton (Åk 2–6).

class MattViktPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'matt-vikt';
  }

  generate(settings) {
    const grade = settings.grade;
    const pairs = grade <= 3
      ? [
          () => ({ from: PluginUtils.randInt(1, 9) * 100, fromUnit: 'g',  toUnit: 'hg', factor: 0.01  }),
          () => ({ from: PluginUtils.randInt(1, 9),        fromUnit: 'hg', toUnit: 'g',  factor: 100   }),
          () => ({ from: PluginUtils.randInt(1, 5),        fromUnit: 'kg', toUnit: 'hg', factor: 10    }),
          () => ({ from: PluginUtils.randInt(1, 5) * 10,   fromUnit: 'hg', toUnit: 'kg', factor: 0.1   }),
        ]
      : grade <= 5
        ? [
          () => ({ from: PluginUtils.randInt(1, 5) * 1000, fromUnit: 'g',  toUnit: 'kg', factor: 0.001 }),
          () => ({ from: PluginUtils.randInt(1, 5),         fromUnit: 'kg', toUnit: 'g',  factor: 1000  }),
          () => ({ from: PluginUtils.randInt(1, 9) * 100,  fromUnit: 'g',  toUnit: 'hg', factor: 0.01  }),
          () => ({ from: PluginUtils.randInt(1, 9),         fromUnit: 'hg', toUnit: 'g',  factor: 100   }),
          () => ({ from: PluginUtils.randInt(1, 5),         fromUnit: 'kg', toUnit: 'hg', factor: 10    }),
        ]
        : [
          () => ({ from: PluginUtils.randInt(1, 5) * 1000, fromUnit: 'g',   toUnit: 'kg',  factor: 0.001 }),
          () => ({ from: PluginUtils.randInt(1, 5),         fromUnit: 'kg',  toUnit: 'g',   factor: 1000  }),
          () => ({ from: PluginUtils.randInt(1, 5),         fromUnit: 'ton', toUnit: 'kg',  factor: 1000  }),
          () => ({ from: PluginUtils.randInt(1, 5) * 1000,  fromUnit: 'kg',  toUnit: 'ton', factor: 0.001 }),
        ];

    const conv = PluginUtils.pickRandom(pairs)();
    return { type: 'matt-vikt', conversion: conv, answer: parseFloat((conv.from * conv.factor).toFixed(3)) };
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

PluginManager.register(new MattViktPlugin());
