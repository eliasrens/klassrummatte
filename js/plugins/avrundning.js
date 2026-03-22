// js/plugins/avrundning.js
// Åk 2–6: avrundning och uppskattning

class AvrundningPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'avrundning';
  }

  generate(settings) {
    const grade = settings.grade;

    // Åk 2: avrunda till närmaste tiotal
    // Åk 3: avrunda till närmaste tiotal/hundratal, enkel uppskattning
    // Åk 4: avrunda till hundratal/tusental, uppskatta summa/differens
    // Åk 5–6: avrunda decimaler, uppskatta produkt/kvot

    const questionType = PluginUtils.pickRandom(this._getPool(grade));

    switch (questionType) {
      case 'round-ten':      return this._roundToTen(grade);
      case 'round-hundred':  return this._roundToHundred(grade);
      case 'round-thousand': return this._roundToThousand();
      case 'round-decimal':  return this._roundToDecimal();
      case 'estimate-sum':   return this._estimateSum(grade);
      case 'estimate-diff':  return this._estimateDiff(grade);
      case 'estimate-prod':  return this._estimateProd();
      case 'nearest':        return this._nearestChoice(grade);
    }
  }

  _getPool(grade) {
    if (grade <= 2) return ['round-ten', 'nearest'];
    if (grade <= 3) return ['round-ten', 'round-hundred', 'estimate-sum', 'nearest'];
    if (grade <= 4) return ['round-ten', 'round-hundred', 'round-thousand', 'estimate-sum', 'estimate-diff'];
    return ['round-hundred', 'round-thousand', 'round-decimal', 'estimate-sum', 'estimate-diff', 'estimate-prod'];
  }

  // Avrunda till närmaste tiotal
  _roundToTen(grade) {
    const num = grade <= 2
      ? PluginUtils.randInt(11, 99)
      : PluginUtils.randInt(11, 999);
    const answer = Math.round(num / 10) * 10;
    return {
      type: 'avrundning', questionType: 'round',
      number: num, target: 'tiotal',
      question: `Avrunda ${num} till närmaste tiotal.`,
      answer: String(answer),
    };
  }

  // Avrunda till närmaste hundratal
  _roundToHundred(grade) {
    const num = grade <= 3
      ? PluginUtils.randInt(101, 999)
      : PluginUtils.randInt(101, 9999);
    const answer = Math.round(num / 100) * 100;
    return {
      type: 'avrundning', questionType: 'round',
      number: num, target: 'hundratal',
      question: `Avrunda ${num} till närmaste hundratal.`,
      answer: String(answer),
    };
  }

  // Avrunda till närmaste tusental
  _roundToThousand() {
    const num = PluginUtils.randInt(1001, 9999);
    const answer = Math.round(num / 1000) * 1000;
    return {
      type: 'avrundning', questionType: 'round',
      number: num, target: 'tusental',
      question: `Avrunda ${num} till närmaste tusental.`,
      answer: String(answer),
    };
  }

  // Avrunda decimal till heltal
  _roundToDecimal() {
    const whole = PluginUtils.randInt(1, 99);
    const dec = PluginUtils.randInt(1, 9);
    const num = whole + dec / 10;
    const answer = Math.round(num);
    return {
      type: 'avrundning', questionType: 'round',
      number: num, target: 'heltal',
      question: `Avrunda ${num.toFixed(1)} till närmaste heltal.`,
      answer: String(answer),
    };
  }

  // Uppskatta summa
  _estimateSum(grade) {
    let a, b;
    if (grade <= 3) {
      a = PluginUtils.randInt(12, 98);
      b = PluginUtils.randInt(12, 98);
    } else {
      a = PluginUtils.randInt(102, 998);
      b = PluginUtils.randInt(102, 998);
    }
    const exact = a + b;
    // Rätt svar: avrunda varje term, summera
    const roundTo = grade <= 3 ? 10 : 100;
    const est = Math.round(a / roundTo) * roundTo + Math.round(b / roundTo) * roundTo;
    return {
      type: 'avrundning', questionType: 'estimate',
      expression: `${a} + ${b}`, exact,
      question: `Ungefär hur mycket är ${a} + ${b}?`,
      answer: '≈ ' + est,
    };
  }

  // Uppskatta differens
  _estimateDiff(grade) {
    let a, b, est;
    const roundTo = grade <= 4 ? 10 : 100;
    // Säkerställ att uppskattningen blir > 0
    for (let tries = 0; tries < 20; tries++) {
      if (grade <= 4) {
        a = PluginUtils.randInt(50, 998);
        b = PluginUtils.randInt(12, a - 10);
      } else {
        a = PluginUtils.randInt(200, 9999);
        b = PluginUtils.randInt(100, a - 50);
      }
      est = Math.round(a / roundTo) * roundTo - Math.round(b / roundTo) * roundTo;
      if (est > 0) break;
    }
    return {
      type: 'avrundning', questionType: 'estimate',
      expression: `${a} − ${b}`,
      question: `Ungefär hur mycket är ${a} − ${b}?`,
      answer: '≈ ' + est,
    };
  }

  // Uppskatta produkt (åk 5–6)
  _estimateProd() {
    const a = PluginUtils.randInt(11, 99);
    const b = PluginUtils.randInt(3, 9);
    const estA = Math.round(a / 10) * 10;
    const est = estA * b;
    return {
      type: 'avrundning', questionType: 'estimate',
      expression: `${a} · ${b}`,
      question: `Ungefär hur mycket är ${a} · ${b}?`,
      answer: '≈ ' + est,
    };
  }

  // "Vilket tal är närmast X?" (åk 2–3)
  _nearestChoice(grade) {
    const target = grade <= 2
      ? PluginUtils.randInt(15, 85)
      : PluginUtils.randInt(100, 900);
    // Skapa 3 alternativ: ett nära, två längre bort
    const roundTo = grade <= 2 ? 10 : 100;
    const nearest = Math.round(target / roundTo) * roundTo;
    // Skapa distraktorer
    const offsets = grade <= 2
      ? [-20, -10, 10, 20]
      : [-200, -100, 100, 200];
    const distractors = [];
    for (const off of offsets) {
      const d = nearest + off;
      if (d > 0 && d !== nearest && !distractors.includes(d)) distractors.push(d);
      if (distractors.length >= 2) break;
    }
    // Blanda alternativ
    const choices = [nearest, ...distractors].sort(() => Math.random() - 0.5);
    return {
      type: 'avrundning', questionType: 'nearest',
      target, choices,
      question: `Vilket tal är närmast ${target}?`,
      answer: String(nearest),
    };
  }

  render(problem, container) {
    const wrap = document.createElement('div');
    wrap.className = 'avrund-wrap';

    const q = document.createElement('p');
    q.className = 'avrund-question';
    q.textContent = problem.question;
    wrap.appendChild(q);

    // Visa alternativ för "nearest"
    if (problem.questionType === 'nearest' && problem.choices) {
      const row = document.createElement('div');
      row.className = 'avrund-choices';
      problem.choices.forEach(c => {
        const span = document.createElement('span');
        span.className = 'avrund-choice';
        span.textContent = c;
        row.appendChild(span);
      });
      wrap.appendChild(row);
    }

    const ans = document.createElement('span');
    ans.className = 'answer-value answer-hidden avrund-answer';
    ans.textContent = problem.answer;
    wrap.appendChild(ans);

    container.appendChild(wrap);
  }

  isSameProblem(a, b) {
    if (a.questionType !== b.questionType) return false;
    if (a.questionType === 'estimate') return a.expression === b.expression;
    return a.number === b.number && a.target === b.target;
  }
}

PluginManager.register(new AvrundningPlugin());
