// js/templates.js
// Svenska textuppgiftsmallar.
// Ren modul – tar emot ett problem-objekt och returnerar ett berikat objekt
// med isTextProblem: true och textTemplate: "<svensk mening>".

const Templates = (() => {

  // =========================================================
  //  Namnlista
  // =========================================================
  const NAMES = [
    // Svenska namn
    { name: 'Emma',    pronoun: 'hon' }, { name: 'Liam',    pronoun: 'han' },
    { name: 'Maja',    pronoun: 'hon' }, { name: 'Noah',    pronoun: 'han' },
    { name: 'Ella',    pronoun: 'hon' }, { name: 'Oscar',   pronoun: 'han' },
    { name: 'Julia',   pronoun: 'hon' }, { name: 'Felix',   pronoun: 'han' },
    { name: 'Sara',    pronoun: 'hon' }, { name: 'Erik',    pronoun: 'han' },
    { name: 'Astrid',  pronoun: 'hon' }, { name: 'Leo',     pronoun: 'han' },
    { name: 'Linnea',  pronoun: 'hon' }, { name: 'Hugo',    pronoun: 'han' },
    { name: 'Wilma',   pronoun: 'hon' }, { name: 'Anton',   pronoun: 'han' },
    { name: 'Alice',   pronoun: 'hon' }, { name: 'Nils',    pronoun: 'han' },
    { name: 'Sofia',   pronoun: 'hon' }, { name: 'Gustav',  pronoun: 'han' },
    { name: 'Saga',    pronoun: 'hon' }, { name: 'Elias',   pronoun: 'han' },
    { name: 'Vera',    pronoun: 'hon' }, { name: 'Axel',    pronoun: 'han' },
    { name: 'Stella',  pronoun: 'hon' }, { name: 'Oliver',  pronoun: 'han' },
    { name: 'Ebba',    pronoun: 'hon' }, { name: 'William', pronoun: 'han' },
    { name: 'Agnes',   pronoun: 'hon' }, { name: 'Theo',    pronoun: 'han' },
    // Flerspråkiga namn
    { name: 'Ali',     pronoun: 'han' }, { name: 'Fatima',  pronoun: 'hon' },
    { name: 'Youssef', pronoun: 'han' }, { name: 'Aisha',   pronoun: 'hon' },
    { name: 'Amir',    pronoun: 'han' }, { name: 'Noor',    pronoun: 'hon' },
    { name: 'Reza',    pronoun: 'han' }, { name: 'Zahra',   pronoun: 'hon' },
    { name: 'Omid',    pronoun: 'han' }, { name: 'Leyla',   pronoun: 'hon' },
    { name: 'Abdi',    pronoun: 'han' }, { name: 'Fadumo',  pronoun: 'hon' },
    { name: 'Walid',   pronoun: 'han' }, { name: 'Selam',   pronoun: 'hon' },
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

    (n1, _n2, o, a, b, p1) =>
      `${n1} samlar ${o.svPlural}. På måndag hittar ${p1} ${a} och på tisdag ${b}. Hur många ${o.svPlural} har ${n1} totalt?`,

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

  const DIVISION_OBJECT_TEMPLATES = [
    (n1, _n2, o, dividend, divisor) =>
      `${n1} ska dela ut ${n(dividend, o)} lika till ${divisor} kompisar. Hur många ${o.svPlural} får varje kompis?`,

    (_n1, _n2, o, dividend, divisor) =>
      `${n(dividend, o)} ska läggas i ${divisor} lika stora högar. Hur många ${o.svPlural} är det i varje hög?`,

    (n1, n2, o, dividend, divisor) =>
      `${n1} och ${divisor - 1} kompisar ska dela lika på ${n(dividend, o)}. Hur många ${o.svPlural} får var och en?`,

    (n1, _n2, o, dividend, divisor) =>
      `${n1} har ${n(dividend, o)} och packar dem i ${divisor} lika stora påsar. Hur många ${o.svPlural} ryms i varje påse?`,
  ];

  const DIVISION_PENGAR_TEMPLATES = [
    (n1, _n2, _o, dividend, divisor) =>
      `${n1} ska dela ${dividend}\u00a0kr lika med ${divisor} kompisar. Hur mycket får varje kompis?`,

    (_n1, _n2, _o, dividend, divisor) =>
      `${dividend}\u00a0kr ska delas lika mellan ${divisor} syskon. Hur mycket får var och en?`,
  ];

  // ── Pengar-mallar (blandas in i addition/subtraktion/multiplikation) ──────
  const PENGAR_ADDITION_TEMPLATES = [
    (n1, n2, _o, a, b) =>
      `${n1} har ${a}\u00a0kr och ${n2} har ${b}\u00a0kr. Hur mycket har de tillsammans?`,
    (n1, _n2, _o, a, b) =>
      `${n1} tjänar ${a}\u00a0kr på lördag och ${b}\u00a0kr på söndag. Hur mycket tjänar ${n1} totalt?`,
    (n1, _n2, _o, a, b) =>
      `${n1} hittar ${a}\u00a0kr i fickan och ${b}\u00a0kr i väskan. Hur mycket är det totalt?`,
    (n1, n2, _o, a, b) =>
      `${n1} har sparat ${a}\u00a0kr och ${n2} har sparat ${b}\u00a0kr. Hur mycket har de sparat ihop?`,
  ];

  const PENGAR_SUBTRAKTION_TEMPLATES = [
    (n1, _n2, _o, a, b, p1) =>
      `${n1} hade ${a} kronor. ${cap(p1)} köpte något för ${b} kronor. Hur mycket har ${n1} kvar?`,
    (n1, _n2, _o, a, b) =>
      `${n1} har ${a}\u00a0kr och köper en bok för ${b}\u00a0kr. Hur mycket har ${n1} kvar?`,
    (n1, _n2, _o, a, b) =>
      `${n1} hade ${a}\u00a0kr och handlade mat för ${b}\u00a0kr. Hur mycket pengar är kvar?`,
    (n1, n2, _o, a, b) =>
      `${n1} har ${a}\u00a0kr och lånar ut ${b}\u00a0kr till ${n2}. Hur mycket har ${n1} kvar?`,
    (n1, _n2, _o, a, b) =>
      `${n1} ska betala ${a}\u00a0kr men har bara ${a - b}\u00a0kr. Hur mycket saknas?`,
  ];

  const PENGAR_MULTIPLIKATION_TEMPLATES = [
    (_n1, _n2, _o, a, b) =>
      `En glass kostar ${b}\u00a0kr. Hur mycket kostar ${a} glassar?`,
    (n1, _n2, _o, a, b) =>
      `${n1} köper ${a} böcker. Varje bok kostar ${b}\u00a0kr. Hur mycket kostar det totalt?`,
    (_n1, _n2, _o, a, b) =>
      `En biobiljett kostar ${b}\u00a0kr. Hur mycket kostar det för ${a} personer?`,
    (n1, _n2, _o, a, b) =>
      `${n1} sparar ${b}\u00a0kr om dagen i ${a} dagar. Hur mycket har ${n1} sparat?`,
  ];

  // ── Tid-mallar ───────────────────────────────────────────────────────────
  const TID_ADDITION_TEMPLATES = [
    (n1, _n2, _o, a, b) =>
      `${n1} tränar ${a} minuter på måndag och ${b} minuter på tisdag. Hur lång tid tränar ${n1} totalt?`,
    (n1, _n2, _o, a, b) =>
      `${n1} läser i ${a} minuter på förmiddagen och ${b} minuter på eftermiddagen. Hur länge läser ${n1} totalt?`,
    (n1, n2, _o, a, b) =>
      `${n1} promenerar ${a} minuter och ${n2} promenerar ${b} minuter. Hur lång tid promenerar de sammanlagt?`,
    (_n1, _n2, _o, a, b) =>
      `En film är ${a} minuter lång och förhandsvisningen tar ${b} minuter. Hur lång är hela visningen?`,
  ];

  const TID_SUBTRAKTION_TEMPLATES = [
    (n1, _n2, _o, a, b, p1) =>
      `${n1} ska träna ${a} minuter. ${cap(p1)} har tränat i ${b} minuter. Hur många minuter är det kvar?`,
    (_n1, _n2, _o, a, b) =>
      `En film är ${a} minuter lång. Det är ${a - b} minuter kvar. Hur länge har filmen spelat?`,
    (n1, _n2, _o, a, b) =>
      `${n1} ska städa i ${a} minuter och har städat i ${b} minuter. Hur lång tid är det kvar?`,
    (n1, _n2, _o, a, b, p1) =>
      `${n1} ska vara ute i ${a} minuter. ${cap(p1)} har redan varit ute ${b} minuter. Hur länge är det kvar?`,
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
  //  Mallar – vikt, tid, area (mått)
  // =========================================================
  const MATT_VIKT_TEMPLATES = [
    (n1, c) => `${n1} väger en väska. Den väger ${c.from} ${c.fromUnit}. Hur mycket är det i ${c.toUnit}?`,
    (_n1, c) => `En påse potatis väger ${c.from} ${c.fromUnit}. Hur mycket är det i ${c.toUnit}?`,
    (n1, c) => `${n1} har en melon som väger ${c.from} ${c.fromUnit}. Hur tung är den i ${c.toUnit}?`,
    (n1, c) => `${n1} köper ${c.from} ${c.fromUnit} äpplen. Hur mycket är det i ${c.toUnit}?`,
  ];

  const MATT_TID_TEMPLATES = [
    (n1, c) => `${n1} sover ${c.from} ${c.fromUnit} varje natt. Hur länge är det i ${c.toUnit}?`,
    (_n1, c) => `En film är ${c.from} ${c.fromUnit} lång. Hur lång är den i ${c.toUnit}?`,
    (n1, c) => `${n1} tränar i ${c.from} ${c.fromUnit}. Hur länge är det i ${c.toUnit}?`,
    (n1, c) => `${n1} läser i ${c.from} ${c.fromUnit}. Hur länge läser ${n1} i ${c.toUnit}?`,
    (_n1, c) => `En resa tar ${c.from} ${c.fromUnit}. Hur lång tid är det i ${c.toUnit}?`,
  ];

  const MATT_AREA_TEMPLATES = [
    (n1, c) => `${n1} mäter en yta. Den är ${c.from} ${c.fromUnit}. Hur stor är den i ${c.toUnit}?`,
    (_n1, c) => `Ett bord har arean ${c.from} ${c.fromUnit}. Hur stor är den i ${c.toUnit}?`,
    (n1, c) => `${n1} ska måla en vägg med arean ${c.from} ${c.fromUnit}. Hur stor är den i ${c.toUnit}?`,
    (_n1, c) => `En trädgårdsland är ${c.from} ${c.fromUnit}. Hur stor är den i ${c.toUnit}?`,
  ];

  // =========================================================
  //  Mallar – klocka (tid på dygnet)
  // =========================================================
  function fmtTime(hours, minutes) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const KLOCKA_READ_TEMPLATES = [
    (n1, h, m) => `${n1} tittar på klockan. Vad är klockan?`,
    (n1, h, m) => `${n1} ser att klockan visar en tid. Vad är klockan?`,
    (_n1, h, m) => `Klockan visar en tid. Vad är klockan?`,
  ];

  const KLOCKA_ADD_MINUTES_TEMPLATES = [
    (n1, h, m, add) => `${n1} ser att klockan är ${fmtTime(h, m)}. Vad blir klockan om ${add} minuter?`,
    (n1, h, m, add) => `Klockan är ${fmtTime(h, m)}. Vad är klockan om ${add} minuter?`,
    (n1, h, m, add) => `${n1} ska möta en kompis om ${add} minuter. Klockan är nu ${fmtTime(h, m)}. Vilken tid blir det då?`,
  ];

  const KLOCKA_DIFF_TEMPLATES = [
    (n1, ctx, endStr) => `${n1} undrar. ${ctx} klockan ${endStr}. Hur lång tid är det?`,
    (_n1, ctx, endStr) => `${ctx} klockan ${endStr}. Hur lång tid är det?`,
  ];

  // =========================================================
  //  Mallar – procent
  // =========================================================
  const PROCENT_OF_WHOLE_TEMPLATES = [
    (n1, pct, whole) => `${n1} ska räkna ut ${pct}% av ${whole}. Vad blir det?`,
    (n1, pct, whole) => `Vad är ${pct}% av ${whole}? ${n1} ska räkna ut det.`,
    (_n1, pct, whole) => `I en klass med ${whole} elever ska man räkna ut ${pct}%. Hur många elever är det?`,
  ];

  const PROCENT_PART_TO_PCT_TEMPLATES = [
    (n1, part, whole) => `${n1} har ${part} rätt av ${whole} på ett prov. Hur många procent är det?`,
    (n1, part, whole) => `${n1} har läst ${part} av ${whole} sidor i boken. Hur många procent har ${n1} läst?`,
    (_n1, part, whole) => `Av ${whole} bollar är ${part} röda. Hur många procent är röda?`,
  ];

  const PROCENT_PCT_TO_FRAC_TEMPLATES = [
    (n1, pct) => `${n1} ska skriva ${pct}% i bråkform. Vad blir det?`,
    (_n1, pct) => `Vad är ${pct}% i bråkform?`,
  ];

  const PROCENT_PCT_TO_DEC_TEMPLATES = [
    (n1, pct) => `${n1} ska skriva ${pct}% i decimalform. Vad blir det?`,
    (_n1, pct) => `Vad är ${pct}% i decimalform?`,
  ];

  const PROCENT_TO_PCT_TEMPLATES = [
    (n1) => `${n1} ska skriva talet i procent. Vad blir det?`,
    (_n1) => `Skriv talet i procent. Vad blir det?`,
  ];

  const PROCENT_REVERSE_TEMPLATES = [
    (n1, finalPrice, pct) => `${n1} ser att priset är ${finalPrice} kr efter ${pct}% rea. Vad var originalpriset?`,
    (_n1, finalPrice, pct) => `Efter ${pct}% rabatt kostar det ${finalPrice} kr. Vad kostade det från början?`,
  ];

  // =========================================================
  //  Mallar – bråk (vissa frågetyper)
  // =========================================================
  const BRAK_FRACTION_OF_WHOLE_TEMPLATES = [
    (n1, num, den, whole, obj) => `${n1} ska ta ${num}/${den} av ${whole} ${obj.svPlural}. Hur många ${obj.svPlural} blir det?`,
    (n1, num, den, whole) => `${n1} räknar: Vad är ${num}/${den} av ${whole}?`,
    (_n1, num, den, whole, obj) => `En låda innehåller ${whole} ${obj.svPlural}. Hur många ${obj.svPlural} är ${num}/${den} av dem?`,
  ];

  const BRAK_ADD_SAME_DEN_TEMPLATES = [
    (n1, a, b, den) => `${n1} räknar: ${a}/${den} + ${b}/${den}. Vad blir summan?`,
    (n1, a, b, den) => `${n1} lägger ihop ${a}/${den} och ${b}/${den}. Vad får ${n1}?`,
  ];

  const BRAK_SUB_SAME_DEN_TEMPLATES = [
    (n1, a, b, den) => `${n1} räknar: ${a}/${den} − ${b}/${den}. Vad blir skillnaden?`,
    (n1, a, b, den) => `${n1} har ${a}/${den} och ger bort ${b}/${den}. Hur mycket har ${n1} kvar?`,
  ];

  const BRAK_COMPARE_TEMPLATES = [
    (n1, a, b) => `${n1} ska jämföra bråken. Vilket är störst: ${a.numerator}/${a.denominator} eller ${b.numerator}/${b.denominator}?`,
    (_n1, a, b) => `Vilket bråk är störst: ${a.numerator}/${a.denominator} eller ${b.numerator}/${b.denominator}?`,
  ];

  const BRAK_SIMPLIFY_TEMPLATES = [
    (n1, num, den) => `${n1} ska förenkla bråket ${num}/${den}. Vad blir det förenklat?`,
    (_n1, num, den) => `Förenkla bråket ${num}/${den}.`,
  ];

  const BRAK_NAME_TEMPLATES = [
    (n1, num, den, wordName) => `${n1} tittar på ett bråk: ${num}/${den}. Vad heter det bråket?`,
    (n1, num, den, wordName) => `Hur skriver man "${wordName}" i bråkform?`,
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

  function genDivAdd(max, names, obj) {
    const divisor  = ri(2, Math.min(5, Math.max(2, max >> 2)));
    const quotient = ri(2, Math.min(9, Math.max(2, (max / divisor) | 0)));
    const dividend = divisor * quotient;
    const c = ri(1, Math.max(1, Math.min(10, max >> 2)));
    const tmpl = pickRandom([
      () => `${n(dividend, obj)} delas lika i ${divisor} högar. Sedan läggs ${n(c, obj)} till i en hög. Hur många ${obj.svPlural} är det i den högen nu?`,
      () => `${names[0]} delar ${n(dividend, obj)} lika på ${divisor} tallrikar. ${names[1]} lägger sedan ${n(c, obj)} till på en tallrik. Hur många ${obj.svPlural} finns på den tallriken?`,
    ]);
    return { op1: 'div', op2: 'add', a: dividend, b: divisor, c, intermediate: quotient, answer: quotient + c, textTemplate: tmpl() };
  }

  function genDivSub(max, names, obj) {
    const divisor  = ri(2, Math.min(5, Math.max(2, max >> 2)));
    const quotient = ri(3, Math.min(9, Math.max(3, (max / divisor) | 0)));
    const dividend = divisor * quotient;
    const c = ri(1, quotient - 1);
    const tmpl = pickRandom([
      () => `${n(dividend, obj)} delas lika i ${divisor} högar. ${names[0]} tar ${n(c, obj)} från en hög. Hur många ${obj.svPlural} är kvar i den högen?`,
      () => `${names[0]} delar ${n(dividend, obj)} lika på ${divisor} kompisar. En kompis ger sedan bort ${n(c, obj)}. Hur många ${obj.svPlural} har den kompisen kvar?`,
    ]);
    return { op1: 'div', op2: 'sub', a: dividend, b: divisor, c, intermediate: quotient, answer: quotient - c, textTemplate: tmpl() };
  }

  // =========================================================
  //  Hjälpfunktioner
  // =========================================================
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /**
   * Lägger till en irrelevant mening i en textuppgift ("för mycket information").
   * Distraktorn innehåller ett tal som INTE används i beräkningen.
   */
  function _addExtraInfo(text, name1, obj) {
    const d = pickRandom([3, 4, 6, 7, 8, 11, 13]);
    const extras = [
      `Det finns ${d} sorters ${obj.svPlural}. `,
      `Varje ${obj.sv} kostar ${d}\u00a0kr. `,
      `${obj.svPlural} finns i ${d} olika färger. `,
      `Det tar ${d} minuter att räkna alla ${obj.svPlural}. `,
      `${name1} samlar på ${obj.svPlural} sedan ${d} år tillbaka. `,
      `Det finns plats för ${d} ${obj.svPlural} till på hyllan. `,
    ];
    const extra = pickRandom(extras);
    // Infoga distraktorn mitt i texten (efter första meningen)
    const firstPeriod = text.indexOf('. ');
    if (firstPeriod > 0 && firstPeriod < text.length - 3) {
      return text.slice(0, firstPeriod + 2) + extra + text.slice(firstPeriod + 2);
    }
    return extra + text;
  }

  function twoDistinctNames() {
    const p1 = pickRandom(NAMES);
    let p2   = pickRandom(NAMES);
    while (p2.name === p1.name) p2 = pickRandom(NAMES);
    return [p1.name, p1.pronoun, p2.name, p2.pronoun];
  }

  // =========================================================
  //  Publik API
  // =========================================================

  /**
   * Vilka uppgiftstyper stöder textuppgifter?
   */
  function canWrap(area) {
    return ['addition', 'subtraktion', 'multiplikation', 'division',
            'geometri', 'matt-langd', 'matt-volym', 'matt-vikt', 'matt-tid', 'matt-area',
            'klocka', 'procent', 'brak'].includes(area);
  }

  /**
   * Slår in ett problem i en svensk textuppgift.
   */
  function wrapInTemplate(problem, _grade) {
    const [name1, pronoun1, name2] = twoDistinctNames();
    const obj = pickRandom(OBJECTS);

    let text;
    switch (problem.type) {
      case 'addition': {
        const addPool = pickRandom([ADDITION_TEMPLATES, ADDITION_TEMPLATES, PENGAR_ADDITION_TEMPLATES, TID_ADDITION_TEMPLATES]);
        text = pickRandom(addPool)(name1, name2, obj, problem.a, problem.b, pronoun1);
        // 20% chans: lägg till irrelevant information (bara för objektmallar)
        if (addPool === ADDITION_TEMPLATES && Math.random() < 0.2) text = _addExtraInfo(text, name1, obj);
        const addUnit = addPool === PENGAR_ADDITION_TEMPLATES ? 'kr' : addPool === TID_ADDITION_TEMPLATES ? 'min' : obj.svPlural;
        return { ...problem, isTextProblem: true, textTemplate: text, answer: `${problem.answer} ${addUnit}` };
      }
      case 'subtraktion': {
        const subPool = pickRandom([SUBTRAKTION_TEMPLATES, SUBTRAKTION_TEMPLATES, PENGAR_SUBTRAKTION_TEMPLATES, TID_SUBTRAKTION_TEMPLATES]);
        text = pickRandom(subPool)(name1, name2, obj, problem.a, problem.b, pronoun1);
        if (subPool === SUBTRAKTION_TEMPLATES && Math.random() < 0.2) text = _addExtraInfo(text, name1, obj);
        const subUnit = subPool === PENGAR_SUBTRAKTION_TEMPLATES ? 'kr' : subPool === TID_SUBTRAKTION_TEMPLATES ? 'min' : obj.svPlural;
        return { ...problem, isTextProblem: true, textTemplate: text, answer: `${problem.answer} ${subUnit}` };
      }
      case 'multiplikation': {
        const multPool = pickRandom([MULTIPLIKATION_TEMPLATES, MULTIPLIKATION_TEMPLATES, PENGAR_MULTIPLIKATION_TEMPLATES]);
        text = pickRandom(multPool)(name1, name2, obj, problem.a, problem.b, pronoun1);
        const multUnit = multPool === PENGAR_MULTIPLIKATION_TEMPLATES ? 'kr' : obj.svPlural;
        return { ...problem, isTextProblem: true, textTemplate: text, answer: `${problem.answer} ${multUnit}` };
      }
      case 'division': {
        const divPool = pickRandom([DIVISION_OBJECT_TEMPLATES, DIVISION_OBJECT_TEMPLATES, DIVISION_PENGAR_TEMPLATES]);
        text = pickRandom(divPool)(name1, name2, obj, problem.a, problem.b, pronoun1);
        const divUnit = divPool === DIVISION_PENGAR_TEMPLATES ? 'kr' : obj.svPlural;
        const divAnswer = String(problem.answer).includes('rest') ? String(problem.answer) : `${problem.answer} ${divUnit}`;
        return { ...problem, isTextProblem: true, textTemplate: text, answer: divAnswer };
      }
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
      case 'matt-vikt': {
        text = pickRandom(MATT_VIKT_TEMPLATES)(name1, problem.conversion);
        const ansV = `${problem.answer} ${problem.conversion.toUnit}`;
        return { ...problem, isTextProblem: true, textTemplate: text, answer: ansV };
      }
      case 'matt-tid': {
        text = pickRandom(MATT_TID_TEMPLATES)(name1, problem.conversion);
        const ansT = `${problem.answer} ${problem.conversion.toUnit}`;
        return { ...problem, isTextProblem: true, textTemplate: text, answer: ansT };
      }
      case 'matt-area': {
        text = pickRandom(MATT_AREA_TEMPLATES)(name1, problem.conversion);
        const ansA = `${problem.answer} ${problem.conversion.toUnit}`;
        return { ...problem, isTextProblem: true, textTemplate: text, answer: ansA };
      }
      case 'klocka': {
        if (problem.questionType === 'read') {
          text = pickRandom(KLOCKA_READ_TEMPLATES)(name1, problem.hours, problem.minutes);
        } else if (problem.questionType === 'add-minutes') {
          text = pickRandom(KLOCKA_ADD_MINUTES_TEMPLATES)(name1, problem.hours, problem.minutes, problem.minutesToAdd);
        } else if (problem.questionType === 'diff') {
          text = pickRandom(KLOCKA_DIFF_TEMPLATES)(name1, problem.context, problem.endStr);
        } else {
          return problem;
        }
        return { ...problem, isTextProblem: true, textTemplate: text, answer: problem.answer };
      }
      case 'procent': {
        const qt = problem.questionType;
        if (qt === 'pct-of-whole') {
          text = pickRandom(PROCENT_OF_WHOLE_TEMPLATES)(name1, problem.percent, problem.whole);
        } else if (qt === 'part-to-pct') {
          text = pickRandom(PROCENT_PART_TO_PCT_TEMPLATES)(name1, problem.part, problem.whole);
        } else if (qt === 'pct-to-frac') {
          text = pickRandom(PROCENT_PCT_TO_FRAC_TEMPLATES)(name1, problem.percent);
        } else if (qt === 'pct-to-dec') {
          text = pickRandom(PROCENT_PCT_TO_DEC_TEMPLATES)(name1, problem.percent);
        } else if (qt === 'frac-to-pct' || qt === 'dec-to-pct') {
          text = pickRandom(PROCENT_TO_PCT_TEMPLATES)(name1);
        } else if (qt === 'reverse-pct') {
          text = pickRandom(PROCENT_REVERSE_TEMPLATES)(name1, problem.finalPrice, problem.percent);
        } else {
          return problem;
        }
        return { ...problem, isTextProblem: true, textTemplate: text, answer: problem.answer };
      }
      case 'brak': {
        const bqt = problem.questionType;
        if (bqt === 'fraction-of-whole') {
          const obj = pickRandom(OBJECTS);
          text = pickRandom(BRAK_FRACTION_OF_WHOLE_TEMPLATES)(name1, problem.numerator, problem.denominator, problem.whole, obj);
          return { ...problem, isTextProblem: true, textTemplate: text, answer: problem.answer };
        }
        if (bqt === 'add-same-den') {
          text = pickRandom(BRAK_ADD_SAME_DEN_TEMPLATES)(name1, problem.a, problem.b, problem.denominator);
          return { ...problem, isTextProblem: true, textTemplate: text, answer: problem.answer };
        }
        if (bqt === 'sub-same-den') {
          text = pickRandom(BRAK_SUB_SAME_DEN_TEMPLATES)(name1, problem.a, problem.b, problem.denominator);
          return { ...problem, isTextProblem: true, textTemplate: text, answer: problem.answer };
        }
        if (bqt === 'compare') {
          text = pickRandom(BRAK_COMPARE_TEMPLATES)(name1, problem.a, problem.b);
          return { ...problem, isTextProblem: true, textTemplate: text, answer: problem.answer };
        }
        if (bqt === 'simplify') {
          text = pickRandom(BRAK_SIMPLIFY_TEMPLATES)(name1, problem.numerator, problem.denominator);
          return { ...problem, isTextProblem: true, textTemplate: text, answer: problem.answer };
        }
        if (bqt === 'name') {
          text = pickRandom(BRAK_NAME_TEMPLATES)(name1, problem.numerator, problem.denominator, problem.wordName);
          return { ...problem, isTextProblem: true, textTemplate: text, answer: problem.answer };
        }
        return problem;
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
    const [name1, , name2] = twoDistinctNames();
    const obj = pickRandom(OBJECTS);
    const names = [name1, name2];

    const areas = settings.areas.length > 0 ? settings.areas : [];
    const hasAdd  = areas.length === 0 || areas.includes('addition');
    const hasSub  = areas.length === 0 || areas.includes('subtraktion');
    const hasMult = areas.length === 0 || areas.includes('multiplikation');
    const hasDiv  = areas.length === 0 || areas.includes('division');

    const gens = [];
    if (hasAdd && hasSub) { gens.push(() => genAddSub(max, names, obj)); gens.push(() => genSubAdd(max, names, obj)); }
    if (hasMult)          { gens.push(() => genMultAdd(max, names, obj)); gens.push(() => genMultSub(max, names, obj)); }
    if (hasDiv)           { gens.push(() => genDivAdd(max, names, obj));  gens.push(() => genDivSub(max, names, obj)); }
    if (gens.length === 0) gens.push(() => genAddSub(max, names, obj)); // fallback

    const result = pickRandom(gens)();
    return { type: 'flersteg', ...result, isTextProblem: true, answer: `${result.answer} ${obj.svPlural}` };
  }

  return { canWrap, wrapInTemplate, generateFlersteg };
})();
