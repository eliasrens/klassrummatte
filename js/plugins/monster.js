// js/plugins/monster.js
// Åk 1–4: visuella figurmönster – repetera och växa

class MonsterPlugin extends BasePlugin {
  constructor() {
    super();
    this.type = 'monster';
  }

  // Formbibliotek: namn → SVG-path (i 40×40 viewBox)
  static SHAPES = [
    { name: 'cirkel',   draw: (svg, fill) => { const c = _svgEl(svg, 'circle', { cx:20, cy:20, r:16, fill }); } },
    { name: 'kvadrat',  draw: (svg, fill) => { _svgEl(svg, 'rect', { x:4, y:4, width:32, height:32, rx:2, fill }); } },
    { name: 'triangel', draw: (svg, fill) => { _svgEl(svg, 'polygon', { points:'20,4 36,36 4,36', fill }); } },
    { name: 'stjarna',  draw: (svg, fill) => { _svgEl(svg, 'polygon', { points: _starPoints(20,20,16,7,5), fill }); } },
    { name: 'romb',     draw: (svg, fill) => { _svgEl(svg, 'polygon', { points:'20,2 38,20 20,38 2,20', fill }); } },
    { name: 'hjarta',   draw: (svg, fill) => { _svgEl(svg, 'path', { d:'M20 36 C10 28 0 20 0 13 A8 8 0 0 1 20 10 A8 8 0 0 1 40 13 C40 20 30 28 20 36Z', fill }); } },
  ];

  static COLORS = [
    { name: 'röd',   hex: '#e63946' },
    { name: 'blå',   hex: '#457b9d' },
    { name: 'grön',  hex: '#2a9d8f' },
    { name: 'gul',   hex: '#e9c46a' },
    { name: 'orange', hex: '#f4a261' },
    { name: 'lila',  hex: '#7c3aed' },
  ];

  generate(settings) {
    const grade = settings.grade;

    if (grade <= 2) {
      // Repeterande mönster: form eller färg
      return Math.random() < 0.5
        ? this._genRepeatShape(grade)
        : this._genRepeatColor(grade);
    }
    if (grade <= 4) {
      // Blandning: repeterande + växande
      const pool = [
        () => this._genRepeatShape(grade),
        () => this._genRepeatColor(grade),
        () => this._genGrowing(),
      ];
      return PluginUtils.pickRandom(pool)();
    }
    // Åk 5+: mest växande
    return Math.random() < 0.3
      ? this._genRepeatShape(grade)
      : this._genGrowing();
  }

  // ── Repeterande formmönster ──────────────────────────
  _genRepeatShape(grade) {
    const patternLen = grade <= 1 ? 2 : PluginUtils.pickRandom([2, 3]);
    const shapes = [];
    const available = MonsterPlugin.SHAPES.slice();
    for (let i = 0; i < patternLen; i++) {
      const idx = Math.floor(Math.random() * available.length);
      shapes.push(available.splice(idx, 1)[0]);
    }
    const color = PluginUtils.pickRandom(MonsterPlugin.COLORS);

    // Bygg sekvens: 3 repetitioner + 1 element att gissa
    const fullPattern = [];
    const reps = 3;
    for (let r = 0; r < reps; r++) {
      for (let s = 0; s < patternLen; s++) {
        fullPattern.push({ shape: shapes[s], color });
      }
    }
    // Lägg till början av nästa repetition
    for (let s = 0; s < patternLen; s++) {
      fullPattern.push({ shape: shapes[s], color });
    }

    // Bestäm vilken position som är frågetecknet
    const questionIdx = PluginUtils.pickRandom([
      fullPattern.length - 1,                        // sista (vanligast)
      reps * patternLen,                              // första i sista rep
      reps * patternLen + Math.min(1, patternLen - 1) // andra i sista rep
    ]);

    const answerShape = fullPattern[questionIdx].shape.name;

    return {
      type: 'monster',
      questionType: 'repeat-shape',
      sequence: fullPattern.map((item, i) => ({
        shapeIdx: MonsterPlugin.SHAPES.indexOf(item.shape),
        colorIdx: MonsterPlugin.COLORS.indexOf(item.color),
        hidden: i === questionIdx,
      })),
      answer: answerShape,
    };
  }

  // ── Repeterande färgmönster ──────────────────────────
  _genRepeatColor(grade) {
    const patternLen = grade <= 1 ? 2 : PluginUtils.pickRandom([2, 3]);
    const colors = [];
    const available = MonsterPlugin.COLORS.slice();
    for (let i = 0; i < patternLen; i++) {
      const idx = Math.floor(Math.random() * available.length);
      colors.push(available.splice(idx, 1)[0]);
    }
    const shape = PluginUtils.pickRandom(MonsterPlugin.SHAPES);

    const fullPattern = [];
    const reps = 3;
    for (let r = 0; r < reps; r++) {
      for (let c = 0; c < patternLen; c++) {
        fullPattern.push({ shape, color: colors[c] });
      }
    }
    for (let c = 0; c < patternLen; c++) {
      fullPattern.push({ shape, color: colors[c] });
    }

    const questionIdx = PluginUtils.pickRandom([
      fullPattern.length - 1,
      reps * patternLen,
      reps * patternLen + Math.min(1, patternLen - 1)
    ]);

    const answerColor = fullPattern[questionIdx].color.name;

    return {
      type: 'monster',
      questionType: 'repeat-color',
      sequence: fullPattern.map((item, i) => ({
        shapeIdx: MonsterPlugin.SHAPES.indexOf(item.shape),
        colorIdx: MonsterPlugin.COLORS.indexOf(item.color),
        hidden: i === questionIdx,
      })),
      answer: answerColor,
    };
  }

  // ── Växande mönster ──────────────────────────────────
  _genGrowing() {
    // Visar grupper med ökande antal: t.ex. 1, 2, 3, ?
    const shape = PluginUtils.pickRandom(MonsterPlugin.SHAPES);
    const color = PluginUtils.pickRandom(MonsterPlugin.COLORS);
    const step = PluginUtils.pickRandom([1, 2]);
    const start = step === 1 ? 1 : PluginUtils.pickRandom([1, 2]);

    const groups = [];
    for (let i = 0; i < 4; i++) {
      groups.push(start + i * step);
    }
    // Frågan: hur många i grupp 4?
    const answer = groups[3];

    return {
      type: 'monster',
      questionType: 'growing',
      shapeIdx: MonsterPlugin.SHAPES.indexOf(shape),
      colorIdx: MonsterPlugin.COLORS.indexOf(color),
      groups: groups.slice(0, 3), // visa 3, fråga om 4:e
      answer: String(answer),
    };
  }

  render(problem, container) {
    const wrap = document.createElement('div');
    wrap.className = 'monster-wrap';

    if (problem.questionType === 'growing') {
      this._renderGrowing(problem, wrap);
    } else {
      this._renderRepeat(problem, wrap);
    }

    container.appendChild(wrap);
  }

  _renderRepeat(problem, wrap) {
    const q = document.createElement('p');
    q.className = 'monster-question';
    q.textContent = 'Vilken figur saknas i mönstret?';
    wrap.appendChild(q);

    const row = document.createElement('div');
    row.className = 'monster-row';

    problem.sequence.forEach(item => {
      if (item.hidden) {
        const box = document.createElement('div');
        box.className = 'monster-missing';
        box.textContent = '?';
        row.appendChild(box);
      } else {
        row.appendChild(this._buildShapeSVG(item.shapeIdx, item.colorIdx));
      }
    });

    wrap.appendChild(row);

    const ans = document.createElement('span');
    ans.className = 'answer-value answer-hidden monster-answer';
    ans.textContent = problem.answer;
    wrap.appendChild(ans);
  }

  _renderGrowing(problem, wrap) {
    const q = document.createElement('p');
    q.className = 'monster-question';
    q.textContent = 'Hur många figurer ska det vara i nästa grupp?';
    wrap.appendChild(q);

    const row = document.createElement('div');
    row.className = 'monster-groups';

    problem.groups.forEach((count, gi) => {
      const group = document.createElement('div');
      group.className = 'monster-group';
      for (let i = 0; i < count; i++) {
        group.appendChild(this._buildShapeSVG(problem.shapeIdx, problem.colorIdx));
      }
      row.appendChild(group);

      // Separator mellan grupper
      if (gi < problem.groups.length - 1) {
        const sep = document.createElement('span');
        sep.className = 'monster-sep';
        row.appendChild(sep);
      }
    });

    // Frågetecken-grupp
    const missingGroup = document.createElement('div');
    missingGroup.className = 'monster-group monster-group--missing';
    missingGroup.textContent = '?';
    row.appendChild(missingGroup);

    wrap.appendChild(row);

    const ans = document.createElement('span');
    ans.className = 'answer-value answer-hidden monster-answer';
    ans.textContent = problem.answer;
    wrap.appendChild(ans);
  }

  _buildShapeSVG(shapeIdx, colorIdx) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 40 40');
    svg.classList.add('monster-svg');
    const shape = MonsterPlugin.SHAPES[shapeIdx];
    const color = MonsterPlugin.COLORS[colorIdx];
    if (shape && color) shape.draw(svg, color.hex);
    return svg;
  }

  showAnswer(problem, container, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '✓'; }
    // Fyll i frågetecknet
    const missing = container.querySelector('.monster-missing');
    if (missing && problem.questionType !== 'growing') {
      const item = problem.sequence.find(s => s.hidden);
      if (item) {
        const svg = this._buildShapeSVG(item.shapeIdx, item.colorIdx);
        missing.textContent = '';
        missing.appendChild(svg);
        missing.classList.add('monster-missing--revealed');
      }
    }
    PluginUtils.appendAnswerBox(problem.answer, container);
  }

  isSameProblem(a, b) {
    if (a.questionType !== b.questionType) return false;
    return a.answer === b.answer;
  }
}

// SVG-hjälpare
function _svgEl(parent, tag, attrs) {
  const ns = 'http://www.w3.org/2000/svg';
  const el = document.createElementNS(ns, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  parent.appendChild(el);
  return el;
}

function _starPoints(cx, cy, outerR, innerR, points) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI / points) - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(' ');
}

PluginManager.register(new MonsterPlugin());
