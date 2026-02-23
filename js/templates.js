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
    return ['addition', 'subtraktion', 'multiplikation', 'division'].includes(area);
  }

  /**
   * Slår in ett problem i en svensk textuppgift.
   * Returnerar det ursprungliga problem-objektet berikat med:
   *   isTextProblem: true
   *   textTemplate: "<svensk mening>"
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
      default:
        return problem; // okänd typ – returnera oförändrat
    }

    return { ...problem, isTextProblem: true, textTemplate: text };
  }

  return { canWrap, wrapInTemplate };
})();
