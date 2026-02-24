// js/problems.js
// Genererar matematikuppgifter baserat på inställningar.
// Ren modul – tar emot ett settings-snapshot, returnerar ett problem-objekt.

const Problems = (() => {

  // =========================================================
  //  Konfiguration per årskurs
  // =========================================================
  const GRADE_CONFIG = {
    1: {
      addMax: 20, subMax: 20,
      multTables: [2], divTables: [],
      fractions: false, geometry: 'basic', decimals: false, clockMinuteStep: 30,
    },
    2: {
      addMax: 100, subMax: 100,
      multTables: [2, 3, 4, 5], divTables: [2, 3, 4, 5],
      fractions: false, geometry: 'basic', decimals: false, clockMinuteStep: 15,
    },
    3: {
      addMax: 1000, subMax: 1000,
      multTables: [2, 3, 4, 5, 6, 7, 8, 9, 10], divTables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      fractions: 'intro', geometry: 'basic', decimals: false, clockMinuteStep: 5,
    },
    4: {
      addMax: 10000, subMax: 10000,
      multTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], divTables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      fractions: 'same-den', geometry: 'basic', decimals: false, clockMinuteStep: 1,
    },
    5: {
      addMax: 100000, subMax: 100000,
      multTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      divTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      fractions: 'diff-den', geometry: 'with-triangle', decimals: true, clockMinuteStep: 1,
    },
    6: {
      addMax: 1000000, subMax: 1000000,
      multTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      divTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      fractions: 'full', geometry: 'with-circle', decimals: true, clockMinuteStep: 1,
    },
  };

  // =========================================================
  //  Hjälpfunktioner
  // =========================================================
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
  function lcm(a, b) { return (a * b) / gcd(a, b); }
  function cfg(grade) { return GRADE_CONFIG[grade] || GRADE_CONFIG[3]; }

  // =========================================================
  //  Huvudfunktioner
  // =========================================================
  function generateProblem(settings) {
    const areas = settings.areas.length > 0 ? settings.areas : ['addition'];
    let area;

    if (areas.includes('blandad')) {
      const candidates = areas.filter(a => a !== 'blandad');
      area = candidates.length > 0
        ? pickRandom(candidates)
        : pickRandom(['addition', 'subtraktion', 'multiplikation', 'division']);
    } else {
      area = pickRandom(areas);
    }

    let problem = dispatchGenerate(area, settings);

    if (settings.problemlosning && Templates.canWrap(area)) {
      problem = Templates.wrapInTemplate(problem, settings.grade);
    }
    return problem;
  }

  function generateExtraProblem(settings) {
    const type = settings.extraType;
    const c = cfg(settings.grade);
    switch (type) {
      case 'uppstallning-add':    return genUppstallning('add', c);
      case 'uppstallning-sub':    return genUppstallning('sub', c);
      case 'uppstallning-mult':   return genUppstallning('mult', c);
      case 'geometri-area':       return genGeometri(settings.grade, 'area',      settings.geometriTypes);
      case 'geometri-perimeter':  return genGeometri(settings.grade, 'perimeter', settings.geometriTypes);
      case 'klocka':              return genKlocka(c);
      default:                    return genUppstallning('add', c);
    }
  }

  function dispatchGenerate(area, settings) {
    const grade       = settings.grade;
    const c           = cfg(grade);
    const multDivMode = settings.multDivMode || ['tables-basic'];

    const specificTables = settings.specificTables || [1,2,3,4,5,6,7,8,9];

    switch (area) {
      case 'addition':          return genAddition(c);
      case 'subtraktion':       return genSubtraktion(c);
      case 'multiplikation':    return genMultiplikation(c, grade, multDivMode, specificTables);
      case 'division':          return genDivision(c, grade, multDivMode, settings.divisionRest || false, specificTables);
      case 'prioritet':         return genPrioritet(grade);
      case 'oppna-utsagor':    return genOppnaUtsaga(c, grade, specificTables);
      case 'brak':              return genBrak(grade);
      case 'geometri':          return genGeometri(grade, null, settings.geometriTypes);
      case 'klocka':            return genKlocka(c);
      case 'matt-langd':        return genMattLangd(grade);
      case 'matt-volym':        return genMattVolym(grade);
      default:                  return genAddition(c);
    }
  }

  // =========================================================
  //  Addition
  // =========================================================
  function genAddition(c) {
    const max = c.addMax;
    const a = randInt(1, Math.floor(max * 0.6));
    const b = randInt(1, max - a);
    return { type: 'addition', a, b, operator: '+', answer: a + b };
  }

  // =========================================================
  //  Subtraktion
  // =========================================================
  function genSubtraktion(c) {
    const max = c.subMax;
    const a = randInt(1, max);
    const b = randInt(0, a);
    return { type: 'subtraktion', a, b, operator: '−', answer: a - b };
  }

  // =========================================================
  //  Multiplikation – stödjer tre nivåer via multDivMode
  // =========================================================
  function genMultiplikation(c, grade, multDivMode, specificTables) {
    const modes = multDivMode && multDivMode.length > 0 ? multDivMode : ['tables-basic'];
    const mode  = pickRandom(modes);

    if (mode === 'tables-ten') {
      const tenPow = grade >= 5 ? pickRandom([10, 100]) : 10;
      const factor = randInt(2, grade <= 3 ? 9 : grade <= 5 ? 99 : 999);
      const [a, b] = Math.random() < 0.5 ? [factor, tenPow] : [tenPow, factor];
      return { type: 'multiplikation', a, b, operator: '·', answer: a * b };
    }

    if (mode === 'tables-large') {
      if (grade >= 6) {
        const a = randInt(11, 99), b = randInt(11, 99);
        return { type: 'multiplikation', a, b, operator: '·', answer: a * b };
      }
      const a = randInt(11, grade <= 4 ? 99 : 999);
      const b = randInt(2, 9);
      const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a];
      return { type: 'multiplikation', a: x, b: y, operator: '·', answer: x * y };
    }

    // tables-basic (standard) – cap at 9 to match label "Tabeller 1–9"
    const allTables = (c.multTables === 'all'
      ? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : c.multTables).filter(t => t <= 9);
    let tables = specificTables ? allTables.filter(t => specificTables.includes(t)) : allTables;
    if (tables.length === 0) tables = allTables; // fallback om inget matchar årsklassen
    if (tables.length === 0) return { type: 'multiplikation', a: 2, b: 2, operator: '·', answer: 4 };
    const table  = pickRandom(tables);
    const factor = randInt(1, 12);
    const [a, b] = Math.random() < 0.5 ? [table, factor] : [factor, table];
    return { type: 'multiplikation', a, b, operator: '·', answer: a * b };
  }

  // =========================================================
  //  Division – stödjer tre nivåer via multDivMode
  // =========================================================
  function genDivision(c, grade, multDivMode, withRest, specificTables) {
    const tables = c.divTables;
    if (!tables || tables.length === 0) return genAddition(c);

    const modes = multDivMode && multDivMode.length > 0 ? multDivMode : ['tables-basic'];
    const mode  = pickRandom(modes);

    if (mode === 'tables-ten') {
      const tenPow  = grade >= 5 ? pickRandom([10, 100]) : 10;
      const quotient = randInt(2, grade <= 3 ? 9 : grade <= 5 ? 99 : 999);
      const dividend = quotient * tenPow;
      return {
        type: 'division', a: dividend, b: tenPow,
        operator: 'division', answer: quotient,
        bildstodEligible: false, rows: tenPow, cols: quotient,
      };
    }

    if (mode === 'tables-large') {
      const divisor  = randInt(2, grade <= 4 ? 9 : 12);
      const quotient = randInt(10, grade <= 4 ? 20 : grade <= 5 ? 50 : 100);
      const dividend = divisor * quotient;
      return {
        type: 'division', a: dividend, b: divisor,
        operator: 'division', answer: quotient,
        bildstodEligible: false, rows: divisor, cols: quotient,
      };
    }

    // tables-basic (standard) – cap at 9 to match label "Tabeller 1–9"
    const allRealTables = (tables === 'all' ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : tables).filter(t => t <= 9);
    let realTables = specificTables ? allRealTables.filter(t => specificTables.includes(t)) : allRealTables;
    if (realTables.length === 0) realTables = allRealTables; // fallback
    if (realTables.length === 0) return genAddition(c);
    const divisor  = pickRandom(realTables);

    if (withRest && divisor >= 2) {
      const quotient  = randInt(1, 9);
      const remainder = randInt(1, divisor - 1);
      const dividend  = divisor * quotient + remainder;
      return {
        type: 'division', a: dividend, b: divisor,
        operator: '÷', answer: quotient, remainder,
        hasRemainder: true, bildstodEligible: false, rows: divisor, cols: quotient,
      };
    }

    const quotient = randInt(1, 10);
    const dividend = divisor * quotient;
    return {
      type: 'division', a: dividend, b: divisor,
      operator: 'division', answer: quotient,
      bildstodEligible: (grade || 3) <= 4 && dividend <= 50,
      rows: divisor, cols: quotient,
    };
  }

  // =========================================================
  //  Prioriteringsregler (räkneordning)
  // =========================================================
  function genPrioritet(grade) {
    // Åk 3-4: mult/div före add/sub, inga parenteser
    // Åk 5+: hälften av uppgifterna med parenteser
    const useParens  = grade >= 5 && Math.random() < 0.5;
    const maxFactor  = grade <= 3 ? 9 : grade <= 5 ? 12 : 20;

    for (let attempt = 0; attempt < 30; attempt++) {
      let expr, answer;

      if (!useParens) {
        const a = randInt(2, maxFactor);
        const b = randInt(2, maxFactor);
        const c = randInt(2, maxFactor);
        const t = randInt(0, 3);
        if      (t === 0)          { expr = `${c} + ${a} · ${b}`;  answer = c + a * b; }
        else if (t === 1)          { expr = `${a} · ${b} + ${c}`;  answer = a * b + c; }
        else if (t === 2 && c > a * b) { expr = `${c} − ${a} · ${b}`; answer = c - a * b; }
        else if (t === 3 && a * b > c) { expr = `${a} · ${b} − ${c}`; answer = a * b - c; }
        else continue;
      } else {
        const a = randInt(2, maxFactor);
        const b = randInt(2, maxFactor);
        const c = randInt(2, maxFactor);
        const t = randInt(0, 4);
        if      (t === 0)          { expr = `(${a} + ${b}) · ${c}`;   answer = (a + b) * c; }
        else if (t === 1)          { expr = `${a} · (${b} + ${c})`;   answer = a * (b + c); }
        else if (t === 2 && a > b) { expr = `(${a} − ${b}) · ${c}`;   answer = (a - b) * c; }
        else if (t === 3 && a > b) { expr = `${c} · (${a} − ${b})`;   answer = c * (a - b); }
        else if (t === 4) {
          // (da + db) ÷ c — alltid jämnt
          const mult = randInt(2, 9);
          const sum  = c * mult;
          const da   = randInt(1, sum - 1);
          expr = `(${da} + ${sum - da}) ÷ ${c}`;
          answer = mult;
        }
        else continue;
      }

      if (answer !== undefined && answer > 0 && Number.isInteger(answer)) {
        return { type: 'prioritet', expression: expr, answer, hasParentheses: useParens };
      }
    }

    // Fallback
    return { type: 'prioritet', expression: '3 + 4 · 2', answer: 11, hasParentheses: false };
  }

  // =========================================================
  //  Öppna utsagor  (5 + _ = 14)
  // =========================================================
  function genOppnaUtsaga(c, grade, specificTables) {
    const ops = ['add', 'sub'];
    if (grade >= 2) ops.push('mult');
    if (grade >= 3) ops.push('div');
    const op = pickRandom(ops);

    if (op === 'add') {
      const max = Math.min(c.addMax, grade <= 2 ? 20 : grade <= 3 ? 100 : 1000);
      const total  = randInt(3, Math.floor(max * 0.7));
      const known  = randInt(1, total - 1);
      const hidden = total - known;
      if (Math.random() < 0.5)
        return { type: 'oppna-utsaga', expression: `${known} + _ = ${total}`, answer: hidden };
      return { type: 'oppna-utsaga', expression: `_ + ${known} = ${total}`, answer: hidden };
    }

    if (op === 'sub') {
      const max = Math.min(c.subMax, grade <= 2 ? 20 : grade <= 3 ? 100 : 1000);
      const a = randInt(4, Math.floor(max * 0.8));
      const b = randInt(1, a - 1);
      if (Math.random() < 0.5)
        return { type: 'oppna-utsaga', expression: `${a} − _ = ${a - b}`, answer: b };
      return { type: 'oppna-utsaga', expression: `_ − ${b} = ${a - b}`, answer: a };
    }

    if (op === 'mult') {
      const allMultTables = (c.multTables === 'all' ? [2,3,4,5,6,7,8,9,10] : c.multTables).filter(t => t <= 9);
      let multTables = specificTables ? allMultTables.filter(t => specificTables.includes(t)) : allMultTables;
      if (multTables.length === 0) multTables = allMultTables;
      const table  = pickRandom(multTables);
      const factor = randInt(2, grade <= 3 ? 9 : 12);
      if (Math.random() < 0.5)
        return { type: 'oppna-utsaga', expression: `${table} · _ = ${table * factor}`, answer: factor };
      return { type: 'oppna-utsaga', expression: `_ · ${factor} = ${table * factor}`, answer: table };
    }

    // div
    const allDivTables = (c.divTables === 'all' ? [2,3,4,5,6,7,8,9,10] : (c.divTables || [2,3,4,5])).filter(t => t <= 9);
    let divTables = specificTables ? allDivTables.filter(t => specificTables.includes(t)) : allDivTables;
    if (divTables.length === 0) divTables = allDivTables;
    if (!divTables || divTables.length === 0) return genAddition(c);
    const divisor  = pickRandom(divTables);
    const quotient = randInt(2, grade <= 3 ? 9 : 12);
    const dividend = divisor * quotient;
    if (Math.random() < 0.5)
      return { type: 'oppna-utsaga', expression: `${dividend} ÷ _ = ${quotient}`, answer: divisor };
    return { type: 'oppna-utsaga', expression: `_ ÷ ${divisor} = ${quotient}`, answer: dividend };
  }

  // =========================================================
  //  Bråk
  // =========================================================
  function genBrak(grade) {
    const level = cfg(grade).fractions;

    if (!level || level === 'intro') {
      const options = [[1,2],[1,4],[3,4],[1,3],[2,3],[1,5],[2,5],[3,5]];
      const [num, den] = pickRandom(options);
      return { type: 'brak', questionType: 'name', numerator: num, denominator: den, answer: `${num}/${den}` };
    }

    if (level === 'same-den') {
      const den = pickRandom([2, 3, 4, 5, 6, 8, 10]);
      const a   = randInt(1, Math.max(1, den - 2));
      const b   = randInt(1, den - a);
      return {
        type: 'brak', questionType: 'add-same-den',
        a, b, denominator: den, numerator: a + b, answer: `${a + b}/${den}`,
      };
    }

    // diff-den / full (åk 5-6)
    const dens = [2, 3, 4, 5, 6, 8, 10];
    const den1 = pickRandom(dens);
    const den2 = pickRandom(dens.filter(d => d !== den1));
    const num1 = randInt(1, den1 - 1);
    const num2 = randInt(1, den2 - 1);
    const LCD  = lcm(den1, den2);
    const ansN = num1 * (LCD / den1) + num2 * (LCD / den2);
    const g    = gcd(ansN, LCD);
    return {
      type: 'brak', questionType: 'add-diff-den',
      a: { numerator: num1, denominator: den1 },
      b: { numerator: num2, denominator: den2 },
      answer: g > 1 ? `${ansN/g}/${LCD/g}` : `${ansN}/${LCD}`,
    };
  }

  // =========================================================
  //  Geometri
  // =========================================================
  function genGeometri(grade, forceQuestion, allowedTypes) {
    const level = cfg(grade).geometry;
    if (!level) return genAddition(cfg(grade));

    const shapePool = ['square', 'rectangle'];
    if (level === 'with-triangle' || level === 'with-circle') shapePool.push('triangle');
    if (level === 'with-circle') shapePool.push('circle');

    const shape   = pickRandom(shapePool);
    const maxSide = grade <= 2 ? 5 : grade <= 4 ? 20 : 50;

    const types = (allowedTypes && allowedTypes.length > 0) ? allowedTypes : ['area', 'perimeter'];
    let question;
    if (forceQuestion) {
      question = forceQuestion;
    } else if (shape === 'triangle') {
      // Triangel: omkrets kräver alla tre sidor – visa bara area
      question = 'area';
    } else {
      question = pickRandom(types);
    }

    let dimensions, area, perimeter;

    if (shape === 'square') {
      const side = randInt(2, maxSide);
      dimensions = { side };
      area       = side * side;
      perimeter  = 4 * side;
    } else if (shape === 'rectangle') {
      const w = randInt(2, maxSide);
      const h = randInt(2, Math.floor(maxSide * 0.8));
      dimensions = { width: w, height: h };
      area       = w * h;
      perimeter  = 2 * (w + h);
    } else if (shape === 'triangle') {
      const evenBase = randInt(2, 15) * 2; // jämnt tal → hel area
      const h        = randInt(3, 20);
      dimensions = { base: evenBase, height: h };
      area       = (evenBase * h) / 2;
      perimeter  = null;
    } else {
      const r = randInt(2, 15);
      dimensions = { radius: r };
      area       = parseFloat((Math.PI * r * r).toFixed(1));
      perimeter  = parseFloat((2 * Math.PI * r).toFixed(1));
    }

    return {
      type: 'geometri', shape, dimensions,
      geoQuestion: question,
      answer: question === 'area' ? area : perimeter,
    };
  }

  // =========================================================
  //  Klocka
  // =========================================================
  function genKlocka(c) {
    const step = c.clockMinuteStep;
    const possibleMinutes = [];
    for (let m = 0; m < 60; m += step) possibleMinutes.push(m);

    const hours        = randInt(1, 12);
    const minutes      = pickRandom(possibleMinutes);
    const questionType = Math.random() < 0.6 ? 'read' : 'add-minutes';
    let minutesToAdd   = null;

    if (questionType === 'add-minutes') {
      const opts = [5, 10, 15, 20, 30].filter(m => m % step === 0);
      minutesToAdd = opts.length > 0 ? pickRandom(opts) : 15;
    }

    let answer;
    if (questionType === 'read') {
      answer = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}`;
    } else {
      const totalMin = hours * 60 + minutes + minutesToAdd;
      const nh = Math.floor(totalMin / 60) % 12 || 12;
      const nm = totalMin % 60;
      answer = `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`;
    }

    return { type: 'klocka', hours, minutes, questionType, minutesToAdd, answer };
  }

  // =========================================================
  //  Mått – längd
  // =========================================================
  function genMattLangd(grade) {
    const pairs = grade <= 3
      ? [
          () => ({ from: randInt(1, 20),   fromUnit: 'cm',  toUnit: 'mm',  factor: 10   }),
          () => ({ from: randInt(2, 10),   fromUnit: 'm',   toUnit: 'cm',  factor: 100  }),
          () => ({ from: randInt(20, 200), fromUnit: 'mm',  toUnit: 'cm',  factor: 0.1  }),
        ]
      : grade <= 5
        ? [
          () => ({ from: randInt(1, 10),    fromUnit: 'km',  toUnit: 'm',   factor: 1000  }),
          () => ({ from: randInt(1, 50),    fromUnit: 'm',   toUnit: 'cm',  factor: 100   }),
          () => ({ from: randInt(500, 5000),fromUnit: 'm',   toUnit: 'km',  factor: 0.001 }),
          () => ({ from: randInt(1, 10),    fromUnit: 'm',   toUnit: 'mm',  factor: 1000  }),
        ]
        : [
          () => ({ from: randInt(1, 10) + randInt(0, 9) * 0.1, fromUnit: 'km', toUnit: 'm',  factor: 1000 }),
          () => ({ from: randInt(1, 5)  + randInt(0, 9) * 0.1, fromUnit: 'm',  toUnit: 'cm', factor: 100  }),
        ];

    const conv = pickRandom(pairs)();
    return { type: 'matt-langd', conversion: conv, answer: parseFloat((conv.from * conv.factor).toFixed(3)) };
  }

  // =========================================================
  //  Mått – volym
  // =========================================================
  function genMattVolym(grade) {
    const pairs = grade <= 3
      ? [
          () => ({ from: randInt(1, 5),  fromUnit: 'dl',  toUnit: 'cl',  factor: 10   }),
          () => ({ from: randInt(1, 10), fromUnit: 'cl',  toUnit: 'ml',  factor: 10   }),
          () => ({ from: randInt(1, 3),  fromUnit: 'l',   toUnit: 'dl',  factor: 10   }),
        ]
      : [
          () => ({ from: randInt(1, 5),  fromUnit: 'l',   toUnit: 'dl',  factor: 10   }),
          () => ({ from: randInt(1, 10), fromUnit: 'dl',  toUnit: 'l',   factor: 0.1  }),
          () => ({ from: randInt(1, 5),  fromUnit: 'l',   toUnit: 'cl',  factor: 100  }),
          () => ({ from: randInt(1, 3),  fromUnit: 'l',   toUnit: 'ml',  factor: 1000 }),
        ];

    const conv = pickRandom(pairs)();
    return { type: 'matt-volym', conversion: conv, answer: parseFloat((conv.from * conv.factor).toFixed(3)) };
  }

  // =========================================================
  //  Uppställning (extrauppgift)
  // =========================================================
  function genUppstallning(subtype, c) {
    const maxVal = Math.min(c.addMax || 10000, 9999);
    const minVal = Math.max(10, Math.floor(maxVal / 20));

    if (subtype === 'add') {
      const a = randInt(minVal, Math.floor(maxVal * 0.6));
      const b = randInt(minVal, maxVal - a);
      return { type: 'uppstallning-add', a, b, operator: '+', answer: a + b };
    }
    if (subtype === 'sub') {
      const a = randInt(Math.floor(maxVal / 2), maxVal);
      const b = randInt(minVal, a - minVal > 0 ? a - minVal : a);
      return { type: 'uppstallning-sub', a, b, operator: '−', answer: a - b };
    }
    const a = randInt(11, Math.min(99, maxVal));
    const b = randInt(2, 9);
    return { type: 'uppstallning-mult', a, b, operator: '·', answer: a * b };
  }

  // =========================================================
  //  Publik API
  // =========================================================
  return { generateProblem, generateExtraProblem, GRADE_CONFIG };
})();
