// js/plugins/oppna-utsaga.js

class OppnaUtsagaPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'oppna-utsaga';
  }

  generate(settings) {
    const grade = settings.grade;
    const c = PluginUtils.cfg(grade);
    const specificTables = settings.specificTables || [1,2,3,4,5,6,7,8,9];

    const ops = ['add', 'sub'];
    if (grade >= 2) ops.push('mult');
    if (grade >= 3) ops.push('div');
    const op = PluginUtils.pickRandom(ops);

    if (op === 'add') {
      const max    = Math.min(c.addMax, grade <= 2 ? 20 : grade <= 3 ? 100 : 1000);
      const total  = PluginUtils.randInt(3, Math.floor(max * 0.7));
      const known  = PluginUtils.randInt(1, total - 1);
      const hidden = total - known;
      if (Math.random() < 0.5)
        return { type: 'oppna-utsaga', expression: `${known} + _ = ${total}`, answer: hidden };
      return { type: 'oppna-utsaga', expression: `_ + ${known} = ${total}`, answer: hidden };
    }

    if (op === 'sub') {
      const max = Math.min(c.subMax, grade <= 2 ? 20 : grade <= 3 ? 100 : 1000);
      const a   = PluginUtils.randInt(4, Math.floor(max * 0.8));
      const b   = PluginUtils.randInt(1, a - 1);
      if (Math.random() < 0.5)
        return { type: 'oppna-utsaga', expression: `${a} − _ = ${a - b}`, answer: b };
      return { type: 'oppna-utsaga', expression: `_ − ${b} = ${a - b}`, answer: a };
    }

    if (op === 'mult') {
      const allMultTables = (c.multTables === 'all' ? [2,3,4,5,6,7,8,9,10] : c.multTables).filter(t => t <= 9);
      let multTables = specificTables ? allMultTables.filter(t => specificTables.includes(t)) : allMultTables;
      if (multTables.length === 0) multTables = allMultTables;
      const table  = PluginUtils.pickRandom(multTables);
      const factor = PluginUtils.randInt(2, grade <= 3 ? 9 : 12);
      if (Math.random() < 0.5)
        return { type: 'oppna-utsaga', expression: `${table} · _ = ${table * factor}`, answer: factor };
      return { type: 'oppna-utsaga', expression: `_ · ${factor} = ${table * factor}`, answer: table };
    }

    // div
    const allDivTables = (c.divTables === 'all' ? [2,3,4,5,6,7,8,9,10] : (c.divTables || [2,3,4,5])).filter(t => t <= 9);
    let divTables = specificTables ? allDivTables.filter(t => specificTables.includes(t)) : allDivTables;
    if (divTables.length === 0) divTables = allDivTables;
    if (!divTables || divTables.length === 0) {
      const max   = Math.min(c.addMax, grade <= 2 ? 20 : grade <= 3 ? 100 : 1000);
      const total = PluginUtils.randInt(3, Math.floor(max * 0.7));
      const known = PluginUtils.randInt(1, total - 1);
      return { type: 'oppna-utsaga', expression: `${known} + _ = ${total}`, answer: total - known };
    }
    const divisor  = PluginUtils.pickRandom(divTables);
    const quotient = PluginUtils.randInt(2, grade <= 3 ? 9 : 12);
    const dividend = divisor * quotient;
    if (Math.random() < 0.5)
      return { type: 'oppna-utsaga', expression: `${dividend} ÷ _ = ${quotient}`, answer: divisor };
    return { type: 'oppna-utsaga', expression: `_ ÷ ${divisor} = ${quotient}`, answer: dividend };
  }

  render(problem, container) {
    const parts = problem.expression.split('_');
    if (parts.length === 2) {
      PluginUtils.appendText(container, parts[0]);
      const blank = document.createElement('span');
      blank.className = 'open-blank';
      container.appendChild(blank);
      PluginUtils.appendText(container, parts[1]);
    } else {
      PluginUtils.appendText(container, problem.expression);
    }
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    const blank = container.querySelector('.open-blank');
    if (blank) {
      blank.textContent = problem.answer;
      blank.classList.add('open-blank--answered');
    }
  }

  isSameProblem(a, b) {
    return a.expression === b.expression;
  }
}

PluginManager.register(new OppnaUtsagaPlugin());
