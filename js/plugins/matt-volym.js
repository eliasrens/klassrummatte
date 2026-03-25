// js/plugins/matt-volym.js
// Volym: omvandling, addition och öppna utsagor med valbara enheter.

class MattVolymPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'matt-volym';
  }

  // Enhetsrelationer: [liten → stor]
  static UNIT_CHAIN = [
    { from: 'ml', to: 'cl', factor: 10 },
    { from: 'cl', to: 'dl', factor: 10 },
    { from: 'dl', to: 'l',  factor: 10 },
  ];

  // Hämta aktiva enheter från settings (fallback: dl + l)
  _getUnits(settings) {
    const units = settings.volymUnits;
    return (units && units.length >= 2) ? units : ['dl', 'l'];
  }

  // Hämta aktiva lägen (fallback: convert)
  _getModes(settings) {
    const modes = settings.volymModes;
    return (modes && modes.length > 0) ? modes : ['convert'];
  }

  // Bygg omvandlingspar baserat på valda enheter
  _getConversionPairs(units, grade) {
    const pairs = [];
    const allLinks = MattVolymPlugin.UNIT_CHAIN;

    // Direkta enstegsomvandlingar
    for (const link of allLinks) {
      if (units.includes(link.from) && units.includes(link.to)) {
        // Uppåt: ml→cl, cl→dl, dl→l
        pairs.push(() => {
          const n = PluginUtils.randInt(1, 9);
          return { from: n, fromUnit: link.from, toUnit: link.to, factor: 1 / link.factor };
        });
        // Nedåt: l→dl, dl→cl, cl→ml
        pairs.push(() => {
          const n = PluginUtils.randInt(1, 5);
          return { from: n, fromUnit: link.to, toUnit: link.from, factor: link.factor };
        });
      }
    }

    // Tvåstegsomvandlingar (åk 4+): ml↔dl, cl↔l
    if (grade >= 4) {
      if (units.includes('ml') && units.includes('dl')) {
        pairs.push(() => ({ from: PluginUtils.randInt(1, 5), fromUnit: 'dl', toUnit: 'ml', factor: 100 }));
        pairs.push(() => ({ from: PluginUtils.randInt(100, 500), fromUnit: 'ml', toUnit: 'dl', factor: 0.01 }));
      }
      if (units.includes('cl') && units.includes('l')) {
        pairs.push(() => ({ from: PluginUtils.randInt(1, 3), fromUnit: 'l', toUnit: 'cl', factor: 100 }));
        pairs.push(() => ({ from: PluginUtils.randInt(10, 100), fromUnit: 'cl', toUnit: 'l', factor: 0.01 }));
      }
      if (units.includes('ml') && units.includes('l')) {
        pairs.push(() => ({ from: PluginUtils.randInt(1, 3), fromUnit: 'l', toUnit: 'ml', factor: 1000 }));
      }
    }

    return pairs;
  }

  // Hämta omvandlingsfaktor mellan två enheter
  _factorBetween(fromUnit, toUnit) {
    const order = ['ml', 'cl', 'dl', 'l'];
    const fi = order.indexOf(fromUnit);
    const ti = order.indexOf(toUnit);
    if (fi < 0 || ti < 0) return null;
    let factor = 1;
    if (fi < ti) {
      // Uppåt (ml→l): dividera
      for (let i = fi; i < ti; i++) factor *= MattVolymPlugin.UNIT_CHAIN[i].factor;
      return 1 / factor;
    } else {
      // Nedåt (l→ml): multiplicera
      for (let i = ti; i < fi; i++) factor *= MattVolymPlugin.UNIT_CHAIN[i].factor;
      return factor;
    }
  }

  generate(settings) {
    const grade = settings.grade;
    const units = this._getUnits(settings);
    const modes = this._getModes(settings);
    const mode = PluginUtils.pickRandom(modes);

    switch (mode) {
      case 'addition':    return this._genAddition(units, grade);
      case 'subtraction': return this._genSubtraction(units, grade);
      case 'open':        return this._genOpen(units, grade);
      default:            return this._genConvert(units, grade);
    }
  }

  // ── Omvandling ──────────────────────────────────────────
  _genConvert(units, grade) {
    const pairs = this._getConversionPairs(units, grade);
    if (pairs.length === 0) return this._genConvertFallback(grade);
    const conv = PluginUtils.pickRandom(pairs)();
    const answer = parseFloat((conv.from * conv.factor).toFixed(3));
    return { type: 'matt-volym', questionType: 'convert', conversion: conv, answer };
  }

  _genConvertFallback(grade) {
    const from = PluginUtils.randInt(1, 5);
    return {
      type: 'matt-volym', questionType: 'convert',
      conversion: { from, fromUnit: 'dl', toUnit: 'l', factor: 0.1 },
      answer: parseFloat((from * 0.1).toFixed(3)),
    };
  }

  // ── Addition med enheter ────────────────────────────────
  _genAddition(units, grade) {
    // Välj en enhet att addera i
    const unit = PluginUtils.pickRandom(units);
    const max = unit === 'l' ? 5 : unit === 'dl' ? 9 : unit === 'cl' ? 50 : 500;
    const a = PluginUtils.randInt(1, max);
    const b = PluginUtils.randInt(1, max);
    const sum = a + b;

    // Ibland: blanda enheter (t.ex. 2 dl + 3 dl = ? cl)
    // Men vi håller det enkelt: samma enhet
    return {
      type: 'matt-volym', questionType: 'addition',
      a, b, unit, answer: sum,
    };
  }

  // ── Subtraktion med enheter ─────────────────────────────
  _genSubtraction(units, grade) {
    const unit = PluginUtils.pickRandom(units);
    const max = unit === 'l' ? 5 : unit === 'dl' ? 9 : unit === 'cl' ? 50 : 500;
    const a = PluginUtils.randInt(2, max);
    const b = PluginUtils.randInt(1, a - 1);
    const diff = a - b;
    return {
      type: 'matt-volym', questionType: 'subtraction',
      a, b, unit, answer: diff,
    };
  }

  // ── Öppen utsaga ───────────────────────────────────────
  _genOpen(units, grade) {
    // Välj två enheter som har en relation
    const unitPairs = [];
    for (const link of MattVolymPlugin.UNIT_CHAIN) {
      if (units.includes(link.from) && units.includes(link.to)) {
        unitPairs.push({ small: link.from, big: link.to, factor: link.factor });
      }
    }
    if (unitPairs.length === 0) {
      // Fallback: samma enhet
      const unit = PluginUtils.pickRandom(units);
      const total = PluginUtils.randInt(5, 15);
      const a = PluginUtils.randInt(1, total - 1);
      const answer = total - a;
      return {
        type: 'matt-volym', questionType: 'open',
        expression: `${a} ${unit} + _ = ${total} ${unit}`,
        blankUnit: unit, answer,
      };
    }

    const pair = PluginUtils.pickRandom(unitPairs);
    // T.ex. "3 dl + _ dl = 1 l" → svar: 7
    const bigVal = PluginUtils.randInt(1, 3);
    const totalSmall = bigVal * pair.factor;
    const aSmall = PluginUtils.randInt(1, totalSmall - 1);
    const answer = totalSmall - aSmall;

    // Slumpa format
    const formats = [
      // _ dl + 3 dl = 1 l
      { expr: `${aSmall} ${pair.small} + _ = ${bigVal} ${pair.big}`, blankUnit: pair.small },
      // 1 l − 3 dl = _ dl
      { expr: `${bigVal} ${pair.big} − ${aSmall} ${pair.small} = _`, blankUnit: pair.small },
    ];
    const fmt = PluginUtils.pickRandom(formats);

    return {
      type: 'matt-volym', questionType: 'open',
      expression: fmt.expr,
      blankUnit: fmt.blankUnit,
      answer,
    };
  }

  // ── Rendering ──────────────────────────────────────────
  render(problem, container) {
    if (problem.questionType === 'addition' || problem.questionType === 'subtraction') {
      this._renderAddSub(problem, container);
    } else if (problem.questionType === 'open') {
      this._renderOpen(problem, container);
    } else {
      PluginUtils.renderMatt(problem, container);
    }
  }

  _renderAddSub(problem, container) {
    const op = problem.questionType === 'subtraction' ? '−' : '+';
    const wrapper = document.createElement('div');
    wrapper.className = 'matt-display';
    wrapper.innerHTML =
      `<span>${problem.a}\u202F</span>` +
      `<span class="matt-unit">${problem.unit}</span>` +
      `<span>\u202F${op}\u202F</span>` +
      `<span>${problem.b}\u202F</span>` +
      `<span class="matt-unit">${problem.unit}</span>` +
      `<span>\u202F=\u202F?\u202F</span>` +
      `<span class="matt-unit">${problem.unit}</span>`;
    container.appendChild(wrapper);
  }

  // Lägg till text med enheter i blått
  _appendWithUnits(parent, text) {
    const unitPattern = /\b(ml|cl|dl|l)\b/g;
    let last = 0;
    let m;
    while ((m = unitPattern.exec(text)) !== null) {
      if (m.index > last) {
        const before = document.createElement('span');
        before.textContent = text.slice(last, m.index);
        parent.appendChild(before);
      }
      const unitSpan = document.createElement('span');
      unitSpan.className = 'matt-unit';
      unitSpan.textContent = m[1];
      parent.appendChild(unitSpan);
      last = unitPattern.lastIndex;
    }
    if (last < text.length) {
      const rest = document.createElement('span');
      rest.textContent = text.slice(last);
      parent.appendChild(rest);
    }
  }

  _renderOpen(problem, container) {
    const wrapper = document.createElement('div');
    wrapper.className = 'matt-display matt-open-display';
    // Ersätt _ med en blank
    const parts = problem.expression.split('_');
    parts.forEach((part, i) => {
      this._appendWithUnits(wrapper, part);
      if (i < parts.length - 1) {
        const blank = document.createElement('span');
        blank.className = 'open-blank';
        blank.innerHTML = '&nbsp;';
        wrapper.appendChild(blank);
        const unitSpan = document.createElement('span');
        unitSpan.className = 'matt-unit';
        unitSpan.textContent = '\u202F' + problem.blankUnit;
        wrapper.appendChild(unitSpan);
      }
    });
    container.appendChild(wrapper);
  }

  // ── Visa svar ──────────────────────────────────────────
  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }

    if (problem.questionType === 'addition' || problem.questionType === 'subtraction') {
      const op = problem.questionType === 'subtraction' ? '−' : '+';
      const display = container.querySelector('.matt-display');
      if (display) {
        display.innerHTML =
          `<span>${problem.a}\u202F</span>` +
          `<span class="matt-unit">${problem.unit}</span>` +
          `<span>\u202F${op}\u202F</span>` +
          `<span>${problem.b}\u202F</span>` +
          `<span class="matt-unit">${problem.unit}</span>` +
          `<span>\u202F=\u202F</span>` +
          `<span class="answer-value">${problem.answer}\u202F</span>` +
          `<span class="matt-unit">${problem.unit}</span>`;
      }
    } else if (problem.questionType === 'open') {
      const blanks = container.querySelectorAll('.open-blank');
      blanks.forEach(blank => {
        blank.textContent = problem.answer;
        blank.classList.add('open-blank--answered');
      });
    } else {
      // convert
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
  }

  isSameProblem(a, b) {
    if (a.questionType !== b.questionType) return false;
    if (a.questionType === 'open') return a.expression === b.expression;
    if (a.questionType === 'addition' || a.questionType === 'subtraction') return a.a === b.a && a.b === b.b && a.unit === b.unit;
    return a.conversion.from === b.conversion.from &&
           a.conversion.fromUnit === b.conversion.fromUnit &&
           a.conversion.toUnit === b.conversion.toUnit;
  }

  hasBildstodSupport(problem, settings) {
    return problem.questionType === 'convert' && PluginUtils.canBuildMattBildstod(problem);
  }

  buildBildstod(problem, settings) {
    return PluginUtils.buildMattBildstodEl(problem);
  }
}

PluginManager.register(new MattVolymPlugin());
