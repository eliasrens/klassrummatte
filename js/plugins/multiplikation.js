// js/plugins/multiplikation.js

class MultiplikationPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'multiplikation';
  }

  generate(settings) {
    const grade = settings.grade;
    const c = PluginUtils.cfg(grade);
    const multDivMode    = settings.multDivMode    || ['tables-basic'];
    const specificTables = settings.specificTables || [1,2,3,4,5,6,7,8,9];
    const mode = PluginUtils.pickRandom(multDivMode);

    if (mode === 'tables-ten') {
      const tenPow = grade >= 5 ? PluginUtils.pickRandom([10, 100]) : 10;
      const factor = PluginUtils.randInt(2, grade <= 3 ? 9 : grade <= 5 ? 99 : 999);
      const [a, b] = Math.random() < 0.5 ? [factor, tenPow] : [tenPow, factor];
      return { type: 'multiplikation', a, b, operator: '·', answer: a * b };
    }

    if (mode === 'tables-large') {
      if (grade >= 6) {
        const a = PluginUtils.randInt(11, 99), b = PluginUtils.randInt(11, 99);
        return { type: 'multiplikation', a, b, operator: '·', answer: a * b };
      }
      const a = PluginUtils.randInt(11, grade <= 4 ? 99 : 999);
      const b = PluginUtils.randInt(2, 9);
      const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
      return { type: 'multiplikation', a: x, b: y, operator: '·', answer: x * y };
    }

    // tables-basic – cap at 9
    const allTables = (c.multTables === 'all'
      ? [2,3,4,5,6,7,8,9,10,11,12] : c.multTables).filter(t => t <= 9);
    let tables = specificTables ? allTables.filter(t => specificTables.includes(t)) : allTables;
    if (tables.length === 0) tables = allTables;
    if (tables.length === 0) return { type: 'multiplikation', a: 2, b: 2, operator: '·', answer: 4 };
    const table  = PluginUtils.pickRandom(tables);
    const factor = PluginUtils.randInt(1, 12);
    const [a, b] = Math.random() < 0.5 ? [table, factor] : [factor, table];
    return { type: 'multiplikation', a, b, operator: '·', answer: a * b };
  }

  render(problem, container) {
    PluginUtils.renderArithmetic(problem, container);
  }

  isSameProblem(a, b) {
    return a.a === b.a && a.b === b.b;
  }

  hasBildstodSupport(problem, settings) {
    return settings.grade <= 3 && problem.a * problem.b <= 30 && problem.a <= 10 && problem.b <= 10;
  }

  buildBildstod(problem, settings) {
    if (settings.grade <= 3 && problem.a * problem.b <= 30 && problem.a <= 10 && problem.b <= 10)
      return PluginUtils.buildArithmeticDots(problem);
    return null;
  }
}

PluginManager.register(new MultiplikationPlugin());
