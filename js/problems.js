// js/problems.js
// Genererar matematikuppgifter baserat på inställningar.
// Ren modul – tar emot ett settings-snapshot, returnerar ett problem-objekt.

const Problems = (() => {

  // =========================================================
  //  Konfiguration per årskurs
  // =========================================================
  const GRADE_CONFIG = {
    1: {
      addMax: 20,
      subMax: 20,
      multTables: [2],
      divTables: [],
      fractions: false,
      geometry: false,
      decimals: false,
      clockMinuteStep: 30,  // hel och halv
    },
    2: {
      addMax: 100,
      subMax: 100,
      multTables: [2, 3, 4, 5],
      divTables: [2, 3, 4, 5],
      fractions: false,
      geometry: false,
      decimals: false,
      clockMinuteStep: 15,  // kvart i/över
    },
    3: {
      addMax: 1000,
      subMax: 1000,
      multTables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      divTables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      fractions: 'intro',   // bara namnge
      geometry: false,
      decimals: false,
      clockMinuteStep: 5,
    },
    4: {
      addMax: 10000,
      subMax: 10000,
      multTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      divTables: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      fractions: 'same-den',
      geometry: 'basic',    // kvadrat + rektangel
      decimals: false,
      clockMinuteStep: 1,
    },
    5: {
      addMax: 100000,
      subMax: 100000,
      multTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      divTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      fractions: 'diff-den',
      geometry: 'with-triangle',
      decimals: true,
      clockMinuteStep: 1,
    },
    6: {
      addMax: 1000000,
      subMax: 1000000,
      multTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      divTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      fractions: 'full',
      geometry: 'with-circle',
      decimals: true,
      clockMinuteStep: 1,
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

  function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
  }

  function lcm(a, b) {
    return (a * b) / gcd(a, b);
  }

  function cfg(grade) {
    return GRADE_CONFIG[grade] || GRADE_CONFIG[3];
  }

  // =========================================================
  //  Huvudfunktioner
  // =========================================================

  /**
   * Genererar en uppgift baserat på inställningar.
   * @param {Object} settings  – snapshot från Settings.get()
   * @returns {Object}         – problem-objekt
   */
  function generateProblem(settings) {
    const areas = settings.areas.length > 0 ? settings.areas : ['addition'];
    let area;

    if (areas.includes('blandad')) {
      // Blandad: välj bland de "vanliga" operationerna
      const candidates = areas.filter(a => a !== 'blandad');
      area = candidates.length > 0
        ? pickRandom(candidates)
        : pickRandom(['addition', 'subtraktion', 'multiplikation', 'division']);
    } else {
      area = pickRandom(areas);
    }

    let problem = dispatchGenerate(area, settings.grade);

    // Textuppgifter om aktiverat (bara för stöd­ba­ra typer)
    if (settings.problemlosning && Templates.canWrap(area)) {
      problem = Templates.wrapInTemplate(problem, settings.grade);
    }

    return problem;
  }

  /**
   * Genererar en extrauppgift.
   * @param {Object} settings
   * @returns {Object}
   */
  function generateExtraProblem(settings) {
    const type = settings.extraType;
    const c = cfg(settings.grade);

    switch (type) {
      case 'uppstallning-add':  return genUppstallning('add', c);
      case 'uppstallning-sub':  return genUppstallning('sub', c);
      case 'uppstallning-mult': return genUppstallning('mult', c);
      case 'geometri-area':     return genGeometri(settings.grade, 'area');
      case 'klocka':            return genKlocka(c);
      default:                  return genUppstallning('add', c);
    }
  }

  function dispatchGenerate(area, grade) {
    const c = cfg(grade);
    switch (area) {
      case 'addition':       return genAddition(c);
      case 'subtraktion':    return genSubtraktion(c);
      case 'multiplikation': return genMultiplikation(c);
      case 'division':       return genDivision(c);
      case 'brak':           return genBrak(grade);
      case 'geometri':       return genGeometri(grade);
      case 'klocka':         return genKlocka(c);
      case 'matt-langd':     return genMattLangd(grade);
      case 'matt-volym':     return genMattVolym(grade);
      default:               return genAddition(c);
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
  //  Multiplikation
  // =========================================================
  function genMultiplikation(c) {
    const tables = c.multTables === 'all'
      ? [2,3,4,5,6,7,8,9,10,11,12]
      : c.multTables;
    const table  = pickRandom(tables);
    const factor = randInt(1, 12);
    // Slumpa ordning (kommutativt)
    const [a, b] = Math.random() < 0.5 ? [table, factor] : [factor, table];
    return { type: 'multiplikation', a, b, operator: '×', answer: a * b };
  }

  // =========================================================
  //  Division
  // =========================================================
  function genDivision(c) {
    const tables = c.divTables;
    if (!tables || tables.length === 0) {
      // Fallback för åk 1
      return genAddition(c);
    }
    const realTables = tables === 'all'
      ? [2,3,4,5,6,7,8,9,10]
      : tables;

    const divisor  = pickRandom(realTables);
    const quotient = randInt(1, 10);
    const dividend = divisor * quotient; // alltid jämnt!

    return {
      type: 'division',
      a: dividend,       // täljare (visas överst)
      b: divisor,        // nämnare (visas underst)
      operator: 'division',
      answer: quotient,
      showCircles: dividend <= 30,
      circleCount: dividend,
    };
  }

  // =========================================================
  //  Bråk
  // =========================================================
  function genBrak(grade) {
    const level = cfg(grade).fractions;

    if (!level || level === 'intro') {
      // Åk 3: namnge bråket
      const options = [[1,2],[1,4],[3,4],[1,3],[2,3],[1,5],[2,5],[3,5]];
      const [num, den] = pickRandom(options);
      return {
        type: 'brak',
        questionType: 'name',
        numerator: num,
        denominator: den,
        answer: `${num}/${den}`,
      };
    }

    if (level === 'same-den') {
      // Åk 4: addition med samma nämnare
      const den = pickRandom([2, 3, 4, 5, 6, 8, 10]);
      const a   = randInt(1, Math.max(1, den - 2));
      const b   = randInt(1, den - a);
      return {
        type: 'brak',
        questionType: 'add-same-den',
        a, b, denominator: den,
        numerator: a + b,
        answer: `${a + b}/${den}`,
      };
    }

    // Åk 5–6: olika nämnare
    const dens  = [2, 3, 4, 5, 6, 8, 10];
    const den1  = pickRandom(dens);
    const den2  = pickRandom(dens.filter(d => d !== den1));
    const num1  = randInt(1, den1 - 1);
    const num2  = randInt(1, den2 - 1);
    const LCD   = lcm(den1, den2);
    const ansN  = num1 * (LCD / den1) + num2 * (LCD / den2);
    const g     = gcd(ansN, LCD);
    return {
      type: 'brak',
      questionType: 'add-diff-den',
      a: { numerator: num1, denominator: den1 },
      b: { numerator: num2, denominator: den2 },
      answer: g > 1 ? `${ansN/g}/${LCD/g}` : `${ansN}/${LCD}`,
    };
  }

  // =========================================================
  //  Geometri
  // =========================================================
  function genGeometri(grade, forceQuestion) {
    const level = cfg(grade).geometry;
    if (!level) {
      // Fallback: generera addition istället
      return genAddition(cfg(grade));
    }

    const shapePool = [];
    shapePool.push('square', 'rectangle');
    if (level === 'with-triangle' || level === 'with-circle') shapePool.push('triangle');
    if (level === 'with-circle') shapePool.push('circle');

    const shape    = pickRandom(shapePool);
    const maxSide  = grade <= 4 ? 20 : 50;
    const question = forceQuestion || pickRandom(['area', 'perimeter']);

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
      const base = randInt(4, 30);
      const h    = randInt(3, 20);
      // Se till att arean är ett heltal
      const evenBase = base % 2 === 0 ? base : base + 1;
      dimensions = { base: evenBase, height: h };
      area       = (evenBase * h) / 2;
      perimeter  = null;
    } else {
      // circle
      const r = randInt(2, 15);
      dimensions = { radius: r };
      area       = parseFloat((Math.PI * r * r).toFixed(1));
      perimeter  = parseFloat((2 * Math.PI * r).toFixed(1));
    }

    return {
      type: 'geometri',
      shape,
      dimensions,
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

    const hours          = randInt(1, 12);
    const minutes        = pickRandom(possibleMinutes);
    const questionType   = Math.random() < 0.6 ? 'read' : 'add-minutes';
    let   minutesToAdd   = null;

    if (questionType === 'add-minutes') {
      const addOptions = [5, 10, 15, 20, 30].filter(m => m % step === 0);
      minutesToAdd = addOptions.length > 0 ? pickRandom(addOptions) : 15;
    }

    return {
      type: 'klocka',
      hours,
      minutes,
      questionType,
      minutesToAdd,
    };
  }

  // =========================================================
  //  Mått – längd
  // =========================================================
  function genMattLangd(grade) {
    const pairs = grade <= 3
      ? [
          () => ({ from: randInt(1, 20),  fromUnit: 'cm',  toUnit: 'mm',  factor: 10   }),
          () => ({ from: randInt(2, 10),  fromUnit: 'm',   toUnit: 'cm',  factor: 100  }),
          () => ({ from: randInt(20,200), fromUnit: 'mm',  toUnit: 'cm',  factor: 0.1  }),
        ]
      : grade <= 5
        ? [
          () => ({ from: randInt(1, 10),   fromUnit: 'km',  toUnit: 'm',   factor: 1000 }),
          () => ({ from: randInt(1, 50),   fromUnit: 'm',   toUnit: 'cm',  factor: 100  }),
          () => ({ from: randInt(500,5000),fromUnit: 'm',   toUnit: 'km',  factor: 0.001}),
          () => ({ from: randInt(1, 10),   fromUnit: 'm',   toUnit: 'mm',  factor: 1000 }),
        ]
        : [
          () => ({ from: randInt(1, 10) + randInt(0, 9) * 0.1, fromUnit: 'km', toUnit: 'm',  factor: 1000 }),
          () => ({ from: randInt(1, 5)  + randInt(0, 9) * 0.1, fromUnit: 'm',  toUnit: 'cm', factor: 100  }),
        ];

    const conv = pickRandom(pairs)();
    return {
      type: 'matt-langd',
      conversion: conv,
      answer: parseFloat((conv.from * conv.factor).toFixed(3)),
    };
  }

  // =========================================================
  //  Mått – volym
  // =========================================================
  function genMattVolym(grade) {
    const pairs = grade <= 3
      ? [
          () => ({ from: randInt(1, 5),  fromUnit: 'dl',  toUnit: 'cl', factor: 10  }),
          () => ({ from: randInt(1, 10), fromUnit: 'cl',  toUnit: 'ml', factor: 10  }),
          () => ({ from: randInt(1, 3),  fromUnit: 'l',   toUnit: 'dl', factor: 10  }),
        ]
      : [
          () => ({ from: randInt(1, 5),  fromUnit: 'l',   toUnit: 'dl', factor: 10  }),
          () => ({ from: randInt(1, 10), fromUnit: 'dl',  toUnit: 'l',  factor: 0.1 }),
          () => ({ from: randInt(1, 5),  fromUnit: 'l',   toUnit: 'cl', factor: 100 }),
          () => ({ from: randInt(1, 3),  fromUnit: 'l',   toUnit: 'ml', factor: 1000}),
        ];

    const conv = pickRandom(pairs)();
    return {
      type: 'matt-volym',
      conversion: conv,
      answer: parseFloat((conv.from * conv.factor).toFixed(3)),
    };
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

    // mult: tvåsiffrigt × ensiffrigt
    const a = randInt(11, Math.min(99, maxVal));
    const b = randInt(2, 9);
    return { type: 'uppstallning-mult', a, b, operator: '×', answer: a * b };
  }

  // =========================================================
  //  Publik API
  // =========================================================
  return {
    generateProblem,
    generateExtraProblem,
    GRADE_CONFIG, // exporteras för ev. felsökning
  };
})();
