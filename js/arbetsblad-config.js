// js/arbetsblad-config.js
// Ren data: områdeskonfiguration, underkategorier, problemlösningsområden.
// Ingen DOM-access, inga beroenden. Laddas före arbetsblad.js.

const ArbetsbladConfig = (() => {

  // Områden som stöder autogenererad problemlösning (Templates.canWrap)
  const PROBLEMLOSNING_AREAS = [
    'addition', 'subtraktion', 'multiplikation', 'division',
    'geometri', 'matt-langd', 'matt-volym', 'matt-vikt', 'matt-tid', 'matt-area',
    'klocka', 'procent', 'brak'
  ];

  const AREA_CONFIG = [
    { cat: 'Aritmetik', desc: 'de fyra räknesätten', areas: [
      { id: 'addition',       label: 'Addition', hasSub: true },
      { id: 'subtraktion',    label: 'Subtraktion', hasSub: true },
      { id: 'multiplikation', label: 'Multiplikation', hasSub: true },
      { id: 'division',       label: 'Division', hasSub: true },
    ]},
    { cat: 'Algebra', desc: 'mönster och okända tal', areas: [
      { id: 'prioritet',     label: 'Prioritetsregler', hasSub: true },
      { id: 'oppna-utsagor', label: 'Öppna utsagor' },
      { id: 'talfoljd',      label: 'Talföljd' },
      { id: 'monster',       label: 'Mönster' },
    ]},
    { cat: 'Tal & samband', desc: 'bråk, procent, taluppfattning', areas: [
      { id: 'brak',         label: 'Bråk', hasSub: true },
      { id: 'procent',      label: 'Procent' },
      { id: 'tallinje',     label: 'Tallinje' },
      { id: 'talsorter',    label: 'Talsorter' },
      { id: 'avrundning',   label: 'Avrundning' },
      { id: 'negativa-tal', label: 'Negativa tal' },
      { id: 'romerska',     label: 'Romerska siffror' },
    ]},
    { cat: 'Geometri', desc: 'former, area, omkrets', areas: [
      { id: 'geometri',         label: 'Geometri', hasSub: true },
      { id: 'symmetri',         label: 'Symmetri' },
      { id: 'koordinatsystem',  label: 'Koordinatsystem' },
    ]},
    { cat: 'Mått & tid', desc: 'enheter och omvandling', areas: [
      { id: 'klocka',     label: 'Klocka', hasSub: true },
      { id: 'matt-langd', label: 'Längd' },
      { id: 'matt-volym', label: 'Volym' },
      { id: 'matt-vikt',  label: 'Vikt' },
      { id: 'matt-tid',   label: 'Tid' },
      { id: 'matt-area',  label: 'Area-mått' },
    ]},
    { cat: 'Statistik', desc: 'diagram och chanser', areas: [
      { id: 'statistik',   label: 'Statistik', hasSub: true },
      { id: 'sannolikhet', label: 'Sannolikhet' },
    ]},
  ];

  // Sub-settings per område (visas i detaljpanelen)
  const SUB_SETTINGS = {
    addition: {
      title: 'Addition & subtraktion',
      settingsKey: 'addSubMode',
      options: [
        { value: 'standard', label: 'Standard', checked: true },
        { value: 'uppstallning', label: 'Uppställning' },
        { value: 'decimaler', label: 'Decimaler', minGrade: 4 },
        { value: 'flersteg', label: 'Flerstegsaddition', minGrade: 3 },
      ],
    },
    subtraktion: {
      title: 'Addition & subtraktion',
      settingsKey: 'addSubMode',
      shared: 'addition',  // delar inställningar med addition
    },
    multiplikation: {
      title: 'Multiplikation & division',
      settingsKey: 'multDivMode',
      options: [
        { value: 'tables-basic', label: 'Tabeller 1–9', checked: true },
        { value: 'tables-ten', label: 'Mult/div med 10 och 100' },
        { value: 'tables-large', label: 'Stora tal (flersiffrigt)' },
        { value: 'double-half', label: 'Dubbelt & hälften' },
        { value: 'bild-mult', label: 'Vilken mult. visar bilden?' },
      ],
    },
    division: {
      title: 'Multiplikation & division',
      settingsKey: 'multDivMode',
      shared: 'multiplikation',
    },
    prioritet: {
      title: 'Prioritet – räknesätt',
      settingsKey: 'prioritetOps',
      options: [
        { value: 'mult', label: 'Med × och ÷', checked: true },
        { value: 'div', label: 'Med ÷', checked: true },
        { value: 'parens', label: 'Med parenteser' },
      ],
    },
    brak: {
      title: 'Bråk – delmoment',
      settingsKey: 'brakTypes',
      options: [
        { value: 'name', label: 'Namnge bråk', checked: true },
        { value: 'add-same-den', label: 'Add – lika nämn.', checked: true, minGrade: 4 },
        { value: 'sub-same-den', label: 'Sub – lika nämn.', checked: true, minGrade: 4 },
        { value: 'compare', label: 'Jämföra bråk', checked: true, minGrade: 4 },
        { value: 'fraction-of-whole', label: 'Bråk av heltal', checked: true, minGrade: 4 },
        { value: 'simplify', label: 'Förenkla bråk', checked: true, minGrade: 4 },
        { value: 'add-diff-den', label: 'Add – olika nämn.', checked: true, minGrade: 5 },
        { value: 'to-mixed', label: 'Blandat tal', checked: true, minGrade: 6 },
      ],
    },
    geometri: {
      title: 'Geometri – frågetyp',
      settingsKey: 'geometriTypes',
      options: [
        { value: 'area', label: 'Area', checked: true },
        { value: 'perimeter', label: 'Omkrets', checked: true },
        { value: 'volume', label: 'Namnge kroppar', minGrade: 3 },
      ],
    },
    klocka: {
      title: 'Klocka – visningsläge',
      settingsKey: 'klockaTypes',
      options: [
        { value: 'analog', label: 'Analogt', checked: true },
        { value: 'digital', label: 'Digitalt', checked: true },
      ],
    },
    statistik: {
      title: 'Statistik – diagramtyp',
      settingsKey: 'statistikTypes',
      options: [
        { value: 'bar', label: 'Stapeldiagram', checked: true },
        { value: 'freq-table', label: 'Frekvenstabell', checked: true },
        { value: 'pie-chart', label: 'Cirkeldiagram', checked: true },
      ],
    },
    'matt-volym': {
      title: 'Volym – enheter',
      settingsKey: 'volymUnits',
      options: [
        { value: 'ml', label: 'ml' },
        { value: 'cl', label: 'cl' },
        { value: 'dl', label: 'dl', checked: true },
        { value: 'l', label: 'l', checked: true },
      ],
      extraGroups: [
        {
          title: 'Volym – läge',
          settingsKey: 'volymModes',
          options: [
            { value: 'convert', label: 'Omvandling', checked: true },
            { value: 'addition', label: 'Addition' },
            { value: 'subtraction', label: 'Subtraktion' },
            { value: 'open', label: 'Öppna utsagor' },
          ],
        },
      ],
    },
  };

  // SVG-ramfiler för designstilar
  const FRAME_SVG = {
    blomma:   'css/blomma-border.svg',
    pask:     'css/pask-border.svg',
    bjorkris: 'css/bjorkris-border.svg',
    stjarnor: 'css/stjarnor-border.svg',
    vag:      'css/vag-border.svg',
    linje:    'css/linje-border.svg',
  };

  return { PROBLEMLOSNING_AREAS, AREA_CONFIG, SUB_SETTINGS, FRAME_SVG };
})();
