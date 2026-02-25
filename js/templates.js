// js/templates.js
// Svenska textuppgiftsmallar.
// Ren modul – tar emot ett problem-objekt och returnerar ett berikat objekt
// med isTextProblem: true och textTemplate: "<svensk mening>".

const Templates = (() => {

  // =========================================================
  //  Namnlista
  // =========================================================
  const NAMES = [
    'Emma', 'Liam', 'Maja', 'Noah', 'Ella', 'Oscar', 'Julia', 'Felix',
    'Sara', 'Erik', 'Astrid', 'Leo', 'Linnea', 'Hugo', 'Wilma', 'Anton',
    'Alice', 'Nils', 'Sofia', 'Gustav', 'Saga', 'Elias', 'Vera', 'Axel',
    'Stella', 'Oliver', 'Ebba', 'William', 'Agnes', 'Theo',
  ];

  // =========================================================
  //  Föremål (med singular/plural på svenska)
  // =========================================================
  const OBJECTS = [
    { sv: 'äpple',         svPlural: 'äpplen'         },
    { sv: 'apelsin',       svPlural: 'apelsiner'       },
    { sv: 'bok',           svPlural: 'böcker'          },
    { sv: 'klistermärke',  svPlural: 'klistermärken'   },
    { sv: 'fotboll',       svPlural: 'fotbollar'       },
    { sv: 'krita',         svPlural: 'kritor'          },
    { sv: 'godisbit',      svPlural: 'godisbitar'      },
    { sv: 'blomma',        svPlural: 'blommor'         },
    { sv: 'frimärke',      svPlural: 'frimärken'       },
    { sv: 'mynt',          svPlural: 'mynt'            },
    { sv: 'kort',          svPlural: 'kort'            },
    { sv: 'penna',         svPlural: 'pennor'          },
    { sv: 'suddgummi',     svPlural: 'suddgummin'      },
    { sv: 'kulört pärlor', svPlural: 'kulörta pärlor'  },
    { sv: 'tofflar',       svPlural: 'tofflor'         },
    { sv: 'popcorn',       svPlural: 'popcorn'         },
    { sv: 'pinne',         svPlural: 'pinnar'          },
    { sv: 'kaka',          svPlural: 'kakor'           },
    { sv: 'morot',         svPlural: 'morötter'        },
    { sv: 'boll',          svPlural: 'bollar'          },
  ];

  function n(count, obj) {
    return `${count} ${count === 1 ? obj.sv : obj.svPlural}`;
  }

  // =========================================================
  //  Mallar per operation
  //  Signatur: (name1, name2, obj, a, b) => String
  // =========================================================

  const ADDITION_TEMPLATES = [
    (n1, n2, o, a, b) =>
      `${n1} har ${n(a, o)} och ${n2} har ${n(b, o)}. Hur många ${o.svPlural} har de tillsammans?`,

    (n1, n2, o, a, b) =>
      `Det finns ${n(a, o)} i korgen. ${n1} lägger i ${n(b, o)} till. Hur många ${o.svPlural} finns det nu?`,

    (n1, _n2, o, a, b) =>
      `${n1} samlar ${o.svPlural}. På måndag hittar hen ${a} och på tisdag ${b}. Hur många ${o.svPlural} har ${n1} totalt?`,

    (n1, n2, o, a, b) =>
      `${n1} plockar ${n(a, o)} och ${n2} plockar ${n(b, o)}. Hur många ${o.svPlural} har de plockat tillsammans?`,

    (n1, _n2, o, a, b) =>
      `I en låda finns ${n(a, o)}. I en annan låda finns ${n(b, o)}. Hur många ${o.svPlural} är det sammanlagt?`,
  ];

  const SUBTRAKTION_TEMPLATES = [
    (n1, n2, o, a, b) =>
      `${n1} hade ${n(a, o)}. ${n1} gav ${n(b, o)} till ${n2}. Hur många ${o.svPlural} har ${n1} kvar?`,

    (n1, _n2, o, a, b) =>
      `Det låg ${n(a, o)} i korgen. ${n1} tog ${n(b, o)}. Hur många ${o.svPlural} är kvar?`,

    (n1, _n2, o, a, b) =>
      `${n1} hade ${a} kronor. Hen köpte något för ${b} kronor. Hur mycket har ${n1} kvar?`,

    (n1, n2, o, a, b) =>
      `${n1} och ${n2} hade ${n(a, o)} tillsammans. ${n2} tog sina ${b}. Hur många har ${n1} kvar?`,

    (_n1, _n2, o, a, b) =>
      `Det var ${n(a, o)} på hyllan. Nu är det ${a - b}. Hur många ${o.svPlural} har försvunnit?`,
  ];

  const MULTIPLIKATION_TEMPLATES = [
    (n1, _n2, o, a, b) =>
      `${n1} har ${a} påsar. I varje påse finns ${n(b, o)}. Hur många ${o.svPlural} har ${n1} totalt?`,

    (_n1, _n2, o, a, b) =>
      `Det finns ${a} rader med ${n(b, o)} i varje rad. Hur många ${o.svPlural} är det?`,

    (n1, _n2, o, a, b) =>
      `${n1} ska ge ${b} ${o.svPlural} till var och en av sina ${a} kompisar. Hur många ${o.svPlural} behövs?`,

    (n1, _n2, o, a, b) =>
      `${n1} samlar ${o.svPlural} i ${a} veckor och samlar ${b} i veckan. Hur många har ${n1} efter ${a} veckor?`,
  ];

  const DIVISION_TEMPLATES = [
    (n1, _n2, o, dividend, divisor) =>
      `${n1} ska dela ut ${n(dividend, o)} lika till ${divisor} kompisar. Hur många ${o.svPlural} får varje kompis?`,

    (_n1, _n2, o, dividend, divisor) =>
      `${n(dividend, o)} ska läggas i ${divisor} lika stora högar. Hur många ${o.svPlural} är det i varje hög?`,

    (n1, n2, o, dividend, divisor) =>
      `${n1} och ${divisor - 1} kompisar ska dela lika på ${n(dividend, o)}. Hur många ${o.svPlural} får var och en?`,

    (n1, _n2, o, dividend, divisor) =>
      `${n1} har ${n(dividend, o)} och packar dem i ${divisor} lika stora påsar. Hur många ${o.svPlural} ryms i varje påse?`,
  ];

  // =========================================================
  //  Mallar – geometri (per form + frågetyp)
  //  Signatur: (name1, dimensions) => String
  // =========================================================
  const GEOMETRI_TEMPLATES = {
    rectangle: {
      perimeter: [
        (n1, d) => `${n1} ska sätta upp ett staket runt sin rektangulära trädgård. Den är ${d.width} m bred och ${d.height} m lång. Hur lång är stängslet (omkretsen)?`,
        (n1, d) => `${n1} ska rama in en rektangulär tavla. Den är ${d.width} cm bred och ${d.height} cm hög. Hur lång blir ramen?`,
        (n1, d) => `${n1} ska springa runt en rektangulär fotbollsplan. Den är ${d.width} m bred och ${d.height} m lång. Hur långt springer ${n1} runt hela planen?`,
      ],
      area: [
        (n1, d) => `${n1} har ett rektangulärt rum. Det är ${d.width} m brett och ${d.height} m långt. Hur stor är golvytan?`,
        (n1, d) => `${n1} ska lägga en rektangulär matta i vardagsrummet. Den är ${d.width} m bred och ${d.height} m lång. Hur stor area har mattan?`,
        (_n1, d) => `En rektangulär pool är ${d.width} m bred och ${d.height} m lång. Hur stor är poolens area?`,
      ],
    },
    square: {
      perimeter: [
        (n1, d) => `${n1} ska stängsla in en kvadratisk lekplats. Sidan är ${d.side} m. Hur lång staket behövs?`,
        (n1, d) => `${n1} ska rama in en kvadratisk bild. Sidan är ${d.side} cm. Hur lång blir ramen?`,
        (_n1, d) => `En kvadratisk åker har sidan ${d.side} m. Hur lång är hela kanten (omkretsen)?`,
      ],
      area: [
        (n1, d) => `${n1} har en kvadratisk trädgård. Sidan är ${d.side} m. Hur stor är trädgårdens area?`,
        (_n1, d) => `En kvadratisk badhandduk har sidan ${d.side} cm. Hur stor area har den?`,
        (n1, d) => `${n1} ska kakla ett kvadratiskt rum. Sidan är ${d.side} m. Hur stor area ska kaklas?`,
      ],
    },
    triangle: {
      area: [
        (_n1, d) => `En triangulär skylt har basen ${d.base} cm och höjden ${d.height} cm. Hur stor är skylten (arean)?`,
        (n1, d) => `${n1} ritar en triangel med basen ${d.base} cm och höjden ${d.height} cm. Hur stor är triangelns area?`,
        (_n1, d) => `En triangulär segelduk har basen ${d.base} m och höjden ${d.height} m. Vad är segeldukets area?`,
      ],
    },
  };

  // =========================================================
  //  Mallar – mått
  //  Signatur: (name1, conv) => String
  // =========================================================
  const MATT_LANGD_TEMPLATES = {
    'cm→mm': [
      (n1, c) => `${n1} har en penna som är ${c.from} cm lång. Hur lång är den i mm?`,
      (_n1, c) => `En krita är ${c.from} cm lång. Hur lång är den i mm?`,
      (n1, c) => `${n1} mäter ett gem och det är ${c.from} cm långt. Hur långt är det i mm?`,
      (_n1, c) => `Ett sugrör är ${c.from} cm långt. Hur långt är det i mm?`,
    ],
    'mm→cm': [
      (n1, c) => `${n1} har ett gem som är ${c.from} mm långt. Hur långt är det i cm?`,
      (_n1, c) => `En spik är ${c.from} mm lång. Hur lång är den i cm?`,
      (n1, c) => `${n1} mäter en tråd och den är ${c.from} mm lång. Hur lång är den i cm?`,
    ],
    'm→cm': [
      (n1, c) => `${n1} har ett rep som är ${c.from} m långt. Hur långt är det i cm?`,
      (_n1, c) => `En gren är ${c.from} m lång. Hur lång är den i cm?`,
      (_n1, c) => `En orm är ${c.from} m lång. Hur lång är den i cm?`,
      (n1, c) => `${n1} hoppar ${c.from} m långt. Hur långt är det i cm?`,
    ],
    'km→m': [
      (n1, c) => `${n1} cyklar ${c.from} km till skolan. Hur långt är det i m?`,
      (_n1, c) => `En löparbana är ${c.from} km lång. Hur lång är den i m?`,
      (n1, c) => `${n1} promenerar ${c.from} km i parken. Hur långt är det i m?`,
      (_n1, c) => `En väg är ${c.from} km lång. Hur lång är den i m?`,
    ],
    'm→km': [
      (n1, c) => `${n1} springer ${c.from} m. Hur långt är det i km?`,
      (_n1, c) => `En kanal är ${c.from} m lång. Hur lång är den i km?`,
      (_n1, c) => `En löparbana är ${c.from} m lång. Hur lång är den i km?`,
    ],
    'm→mm': [
      (n1, c) => `${n1} har ett rep som är ${c.from} m långt. Hur långt är det i mm?`,
      (_n1, c) => `En strimla tyg är ${c.from} m lång. Hur lång är den i mm?`,
      (_n1, c) => `En slang är ${c.from} m lång. Hur lång är den i mm?`,
    ],
  };

  const MATT_VOLYM_TEMPLATES = [
    (n1, c) => `${n1} häller ${c.from} ${c.fromUnit} juice i ett glas. Hur mycket är det i ${c.toUnit}?`,
    (_n1, c) => `Det finns ${c.from} ${c.fromUnit} mjölk i kartongen. Hur mycket är det i ${c.toUnit}?`,
    (n1, c) => `${n1} fyller en hink med ${c.from} ${c.fromUnit} vatten. Hur mycket vatten är det i ${c.toUnit}?`,
    (_n1, c) => `En flaska innehåller ${c.from} ${c.fromUnit} läsk. Hur många ${c.toUnit} är det?`,
  ];

  // =========================================================
  //  Flerstegsgeneratorer (privata)
  // =========================================================
  function ri(min, max) { return PluginUtils.randInt(min, max); }

  function genAddSub(max, names, obj) {
    const half = Math.max(3, max >> 1);
    const a = ri(2, half);
    const b = ri(1, Math.min(half, max - a));
    const c = ri(1, a + b - 1);
    const tmpl = pickRandom([
      () => `${names[0]} har ${n(a, obj)}. ${names[1]} ger ${names[0]} ${n(b, obj)} till. Sedan ger ${names[0]} bort ${n(c, obj)}. Hur många ${obj.svPlural} har ${names[0]} kvar?`,
      () => `I en korg finns ${n(a, obj)}. ${names[0]} lägger i ${n(b, obj)} till. Sen tar ${names[1]} ${n(c, obj)}. Hur många ${obj.svPlural} finns kvar i korgen?`,
      () => `${names[0]} har ${n(a, obj)} och ${names[1]} ger ${n(b, obj)} till. ${names[0]} tappar bort ${n(c, obj)}. Hur många ${obj.svPlural} har ${names[0]} kvar?`,
    ]);
    return { op1: 'add', op2: 'sub', a, b, c, intermediate: a + b, answer: a + b - c, textTemplate: tmpl() };
  }

  function genSubAdd(max, names, obj) {
    const bMax = Math.max(2, max >> 2);
    const b = ri(2, bMax);
    const a = ri(b + 2, max);
    const c = ri(1, Math.max(1, max >> 2));
    const tmpl = pickRandom([
      () => `${names[0]} hade ${n(a, obj)}. ${names[1]} tog ${n(b, obj)}. Sedan fick ${names[0]} ${n(c, obj)} till. Hur många ${obj.svPlural} har ${names[0]} nu?`,
      () => `Det var ${n(a, obj)} i en korg. ${names[0]} tog ${n(b, obj)}. Sedan lade ${names[1]} ${n(c, obj)} i korgen. Hur många ${obj.svPlural} finns nu i korgen?`,
    ]);
    return { op1: 'sub', op2: 'add', a, b, c, intermediate: a - b, answer: a - b + c, textTemplate: tmpl() };
  }

  function genMultAdd(max, names, obj) {
    const a = ri(2, Math.min(5, Math.max(2, max >> 2)));
    const b = ri(2, Math.min(9, Math.max(2, (max / a) | 0)));
    const c = ri(1, Math.max(1, Math.min(10, max >> 2)));
    const tmpl = pickRandom([
      () => `${names[0]} köper ${a} påsar med ${n(b, obj)} i varje. ${names[0]} hittar dessutom ${n(c, obj)}. Hur många ${obj.svPlural} har ${names[0]} totalt?`,
      () => `Det finns ${a} lådor med ${n(b, obj)} i varje. ${names[0]} lägger ${n(c, obj)} bredvid. Hur många ${obj.svPlural} är det totalt?`,
    ]);
    return { op1: 'mult', op2: 'add', a, b, c, intermediate: a * b, answer: a * b + c, textTemplate: tmpl() };
  }

  function genMultSub(max, names, obj) {
    const a = ri(2, Math.min(5, Math.max(2, max >> 2)));
    const b = ri(2, Math.min(9, Math.max(2, (max / a) | 0)));
    const total = a * b;
    const c = ri(1, Math.max(1, total - 1));
    const tmpl = pickRandom([
      () => `${names[0]} köper ${a} påsar med ${n(b, obj)} i varje. ${names[0]} ger bort ${n(c, obj)}. Hur många ${obj.svPlural} har ${names[0]} kvar?`,
      () => `${names[0]} samlar ihop ${n(b, obj)} från var och en av ${a} lådor. ${names[1]} tar ${n(c, obj)} av dem. Hur många ${obj.svPlural} har ${names[0]} kvar?`,
    ]);
    return { op1: 'mult', op2: 'sub', a, b, c, intermediate: total, answer: total - c, textTemplate: tmpl() };
  }

  // =========================================================
  //  Hjälpfunktioner
  // =========================================================
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function twoDistinctNames() {
    const n1 = pickRandom(NAMES);
    let n2   = pickRandom(NAMES);
    while (n2 === n1) n2 = pickRandom(NAMES);
    return [n1, n2];
  }

  // =========================================================
  //  Publik API
  // =========================================================

  /**
   * Vilka uppgiftstyper stöder textuppgifter?
   */
  function canWrap(area) {
    return ['addition', 'subtraktion', 'multiplikation', 'division',
            'geometri', 'matt-langd', 'matt-volym'].includes(area);
  }

  /**
   * Slår in ett problem i en svensk textuppgift.
   */
  function wrapInTemplate(problem, _grade) {
    const [name1, name2] = twoDistinctNames();
    const obj = pickRandom(OBJECTS);

    let text;
    switch (problem.type) {
      case 'addition':
        text = pickRandom(ADDITION_TEMPLATES)(name1, name2, obj, problem.a, problem.b);
        break;
      case 'subtraktion':
        text = pickRandom(SUBTRAKTION_TEMPLATES)(name1, name2, obj, problem.a, problem.b);
        break;
      case 'multiplikation':
        text = pickRandom(MULTIPLIKATION_TEMPLATES)(name1, name2, obj, problem.a, problem.b);
        break;
      case 'division':
        text = pickRandom(DIVISION_TEMPLATES)(name1, name2, obj, problem.a, problem.b);
        break;
      case 'geometri': {
        const shapeMap = GEOMETRI_TEMPLATES[problem.shape];
        if (!shapeMap) return problem;
        const tmplArr = shapeMap[problem.geoQuestion];
        if (!tmplArr) return problem;
        text = pickRandom(tmplArr)(name1, problem.dimensions);
        const unit = problem.geoQuestion === 'area' ? 'cm²' : 'cm';
        return { ...problem, isTextProblem: true, textTemplate: text, answer: `${problem.answer} ${unit}` };
      }
      case 'matt-langd': {
        const key = `${problem.conversion.fromUnit}→${problem.conversion.toUnit}`;
        const arr = MATT_LANGD_TEMPLATES[key] || MATT_LANGD_TEMPLATES['m→cm'];
        text = pickRandom(arr)(name1, problem.conversion);
        const ans = `${problem.answer} ${problem.conversion.toUnit}`;
        return { ...problem, isTextProblem: true, textTemplate: text, answer: ans };
      }
      case 'matt-volym': {
        text = pickRandom(MATT_VOLYM_TEMPLATES)(name1, problem.conversion);
        const ans = `${problem.answer} ${problem.conversion.toUnit}`;
        return { ...problem, isTextProblem: true, textTemplate: text, answer: ans };
      }
      default:
        return problem;
    }

    return { ...problem, isTextProblem: true, textTemplate: text };
  }

  /**
   * Genererar ett tvåstegsproblem (text).
   * Väljer operationspar baserat på valda matematikområden.
   */
  function generateFlersteg(settings) {
    const grade = settings.grade;
    const max = grade <= 1 ? 10 : grade <= 2 ? 20 : grade <= 3 ? 50 : 100;
    const [name1, name2] = twoDistinctNames();
    const obj = pickRandom(OBJECTS);
    const names = [name1, name2];

    const areas = settings.areas.length > 0 ? settings.areas : [];
    const hasAdd  = areas.length === 0 || areas.some(a => a === 'addition'       || a === 'blandad');
    const hasSub  = areas.length === 0 || areas.some(a => a === 'subtraktion'    || a === 'blandad');
    const hasMult = areas.length === 0 || areas.some(a => a === 'multiplikation' || a === 'blandad');

    const gens = [];
    if (hasAdd && hasSub)  { gens.push(() => genAddSub(max, names, obj)); gens.push(() => genSubAdd(max, names, obj)); }
    if (hasMult && hasAdd) { gens.push(() => genMultAdd(max, names, obj)); }
    if (hasMult && hasSub) { gens.push(() => genMultSub(max, names, obj)); }
    if (gens.length === 0) gens.push(() => genAddSub(max, names, obj)); // fallback

    const result = pickRandom(gens)();
    return { type: 'flersteg', ...result, isTextProblem: true };
  }

  return { canWrap, wrapInTemplate, generateFlersteg };
})();
