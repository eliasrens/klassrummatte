// js/plugins/romerska.js
// Åk 4–5: Romerska siffror – läsa och skriva (I, V, X, L, C)

// Konvertera arabiskt tal till romskt
function _toRoman(n) {
  const MAP = [[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let s = '';
  for (const [v, r] of MAP) { while (n >= v) { s += r; n -= v; } }
  return s;
}

// Pool av tal som genereras
const ROMAN_VALUES_4 = [
  1,2,3,4,5,6,7,8,9,
  10,11,12,13,14,15,16,17,18,19,20,
  30,40,50,60,70,80,90,100,
];
const ROMAN_VALUES_5 = [
  ...ROMAN_VALUES_4,
  110,120,130,140,150,
  200,300,400,500,
];

class RomerskaPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'romerska';
  }

  generate(settings) {
    const grade = Math.max(settings.grade, 4);
    const values = grade >= 5 ? ROMAN_VALUES_5 : ROMAN_VALUES_4;
    const num    = PluginUtils.pickRandom(values);
    const roman  = _toRoman(num);
    const qt     = PluginUtils.pickRandom(['roman-to-arabic', 'roman-to-arabic', 'arabic-to-roman']);
    const answer = qt === 'roman-to-arabic' ? String(num) : roman;
    return { type: 'romerska', questionType: qt, number: num, roman, answer };
  }

  render(problem, container) {
    const wrap = document.createElement('div');
    wrap.className = 'rom-wrap';

    if (problem.questionType === 'roman-to-arabic') {
      const val = document.createElement('p');
      val.className = 'rom-value';
      val.textContent = problem.roman;
      wrap.appendChild(val);
      const q = document.createElement('p');
      q.className = 'rom-question';
      q.textContent = 'Vilket tal är detta?';
      wrap.appendChild(q);
    } else {
      const val = document.createElement('p');
      val.className = 'rom-value';
      val.textContent = problem.number;
      wrap.appendChild(val);
      const q = document.createElement('p');
      q.className = 'rom-question';
      q.textContent = 'Skriv talet med romerska siffror.';
      wrap.appendChild(q);
    }

    // Referenstabell
    const ref = document.createElement('p');
    ref.className = 'rom-ref';
    ref.textContent = 'I\u00a0=\u00a01 · V\u00a0=\u00a05 · X\u00a0=\u00a010 · L\u00a0=\u00a050 · C\u00a0=\u00a0100';
    wrap.appendChild(ref);

    container.appendChild(wrap);
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    PluginUtils.appendAnswerBox(problem.answer, container);
  }

  isSameProblem(a, b) {
    return a.questionType === b.questionType && a.number === b.number;
  }
}

PluginManager.register(new RomerskaPlugin());
