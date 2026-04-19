// js/plugins/matt-langd.js

class MattLangdPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'matt-langd';
  }

  generate(settings) {
    const grade = settings.grade;
    const allowedUnits = settings.langdUnits?.length ? settings.langdUnits : ['mm', 'cm', 'dm', 'm', 'km'];
    const has = u => allowedUnits.includes(u);
    const hasPair = (a, b) => has(a) && has(b);

    const allPairs = grade <= 3
      ? [
          hasPair('cm','mm') && (() => ({ from: PluginUtils.randInt(1, 20),   fromUnit: 'cm',  toUnit: 'mm',  factor: 10   })),
          hasPair('m','cm')  && (() => ({ from: PluginUtils.randInt(2, 10),   fromUnit: 'm',   toUnit: 'cm',  factor: 100  })),
          hasPair('mm','cm') && (() => ({ from: PluginUtils.randInt(20, 200), fromUnit: 'mm',  toUnit: 'cm',  factor: 0.1  })),
          hasPair('dm','cm') && (() => ({ from: PluginUtils.randInt(1, 10),   fromUnit: 'dm',  toUnit: 'cm',  factor: 10   })),
          hasPair('cm','dm') && (() => ({ from: PluginUtils.randInt(10, 100), fromUnit: 'cm',  toUnit: 'dm',  factor: 0.1  })),
          hasPair('m','dm')  && (() => ({ from: PluginUtils.randInt(1, 10),   fromUnit: 'm',   toUnit: 'dm',  factor: 10   })),
          hasPair('dm','m')  && (() => ({ from: PluginUtils.randInt(10, 50),  fromUnit: 'dm',  toUnit: 'm',   factor: 0.1  })),
        ]
      : grade <= 5
        ? [
          hasPair('km','m')  && (() => ({ from: PluginUtils.randInt(1, 10),    fromUnit: 'km',  toUnit: 'm',   factor: 1000  })),
          hasPair('m','cm')  && (() => ({ from: PluginUtils.randInt(1, 50),    fromUnit: 'm',   toUnit: 'cm',  factor: 100   })),
          hasPair('m','km')  && (() => ({ from: PluginUtils.randInt(500, 5000),fromUnit: 'm',   toUnit: 'km',  factor: 0.001 })),
          hasPair('m','mm')  && (() => ({ from: PluginUtils.randInt(1, 10),    fromUnit: 'm',   toUnit: 'mm',  factor: 1000  })),
          hasPair('cm','mm') && (() => ({ from: PluginUtils.randInt(1, 20),    fromUnit: 'cm',  toUnit: 'mm',  factor: 10    })),
          hasPair('dm','cm') && (() => ({ from: PluginUtils.randInt(1, 20),    fromUnit: 'dm',  toUnit: 'cm',  factor: 10    })),
          hasPair('cm','dm') && (() => ({ from: PluginUtils.randInt(10, 200),  fromUnit: 'cm',  toUnit: 'dm',  factor: 0.1   })),
          hasPair('m','dm')  && (() => ({ from: PluginUtils.randInt(1, 20),    fromUnit: 'm',   toUnit: 'dm',  factor: 10    })),
          hasPair('dm','m')  && (() => ({ from: PluginUtils.randInt(10, 100),  fromUnit: 'dm',  toUnit: 'm',   factor: 0.1   })),
        ]
        : [
          hasPair('km','m')  && (() => ({ from: PluginUtils.randInt(1, 10) + PluginUtils.randInt(0, 9) * 0.1, fromUnit: 'km', toUnit: 'm',  factor: 1000 })),
          hasPair('m','cm')  && (() => ({ from: PluginUtils.randInt(1, 5)  + PluginUtils.randInt(0, 9) * 0.1, fromUnit: 'm',  toUnit: 'cm', factor: 100  })),
          hasPair('cm','mm') && (() => ({ from: PluginUtils.randInt(1, 20),    fromUnit: 'cm',  toUnit: 'mm',  factor: 10    })),
          hasPair('m','mm')  && (() => ({ from: PluginUtils.randInt(1, 10),    fromUnit: 'm',   toUnit: 'mm',  factor: 1000  })),
          hasPair('dm','cm') && (() => ({ from: PluginUtils.randInt(1, 20),    fromUnit: 'dm',  toUnit: 'cm',  factor: 10    })),
          hasPair('m','dm')  && (() => ({ from: PluginUtils.randInt(1, 10) + PluginUtils.randInt(0, 9) * 0.1, fromUnit: 'm', toUnit: 'dm', factor: 10 })),
        ];

    const pairs = allPairs.filter(Boolean);
    if (pairs.length === 0) {
      // Fallback: enkel addition
      const c = PluginUtils.cfg(grade);
      const a = PluginUtils.randInt(1, Math.floor(c.addMax * 0.6));
      const b = PluginUtils.randInt(1, c.addMax - a);
      return { type: 'addition', a, b, operator: '+', answer: a + b };
    }

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
