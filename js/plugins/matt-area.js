// js/plugins/matt-area.js

class MattAreaPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'matt-area';
  }

  generate(settings) {
    const grade = settings.grade;
    const pairs = [];

    if (grade >= 4) {
      // cm² ↔ dm²  (1 dm² = 100 cm²)
      pairs.push(
        () => ({ from: PluginUtils.pickRandom([100,200,300,400,500,600,800,1000]), fromUnit: 'cm²', toUnit: 'dm²', factor: 0.01 }),
        () => ({ from: PluginUtils.pickRandom([1,2,3,4,5,6,8,10]),               fromUnit: 'dm²', toUnit: 'cm²', factor: 100  }),
      );
    }
    if (grade >= 5) {
      // dm² ↔ m²  (1 m² = 100 dm²)
      pairs.push(
        () => ({ from: PluginUtils.pickRandom([100,200,300,400,500]), fromUnit: 'dm²', toUnit: 'm²',  factor: 0.01 }),
        () => ({ from: PluginUtils.pickRandom([1,2,3,4,5]),           fromUnit: 'm²',  toUnit: 'dm²', factor: 100  }),
      );
    }
    if (grade >= 6) {
      // m² ↔ ha  (1 ha = 10 000 m²)
      // ha ↔ km²  (1 km² = 100 ha)
      pairs.push(
        () => ({ from: PluginUtils.pickRandom([10000,20000,30000,40000,50000]), fromUnit: 'm²',  toUnit: 'ha',  factor: 0.0001 }),
        () => ({ from: PluginUtils.pickRandom([1,2,3,4,5]),                    fromUnit: 'ha',  toUnit: 'm²',  factor: 10000  }),
        () => ({ from: PluginUtils.pickRandom([100,200,300,400,500]),           fromUnit: 'ha',  toUnit: 'km²', factor: 0.01   }),
        () => ({ from: PluginUtils.pickRandom([1,2,3,4,5]),                    fromUnit: 'km²', toUnit: 'ha',  factor: 100    }),
      );
    }

    const conv = PluginUtils.pickRandom(pairs)();
    const answer = String(parseFloat((conv.from * conv.factor).toFixed(4)));
    return { type: 'matt-area', conversion: conv, answer };
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

PluginManager.register(new MattAreaPlugin());
