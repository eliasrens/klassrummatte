// js/answer.js
// Visar rätt svar i problem-displayen.
// Hanterar också upprepningsskydd (isSameProblem).
// Ren modul – tar emot problem och DOM-element som parametrar.

const Answer = (() => {

  // =========================================================
  //  Upprepningsskydd
  // =========================================================
  function isSameProblem(a, b) {
    if (!a || !b || a.type !== b.type) return false;
    switch (a.type) {
      case 'addition':
      case 'subtraktion':
        return a.a === b.a && a.b === b.b && a.c === b.c;
      case 'multiplikation':
      case 'division':
        return a.a === b.a && a.b === b.b;
      case 'oppna-utsaga':
      case 'prioritet':
        return a.expression === b.expression;
      case 'klocka':
        return a.hours === b.hours && a.minutes === b.minutes && a.questionType === b.questionType;
      case 'brak':
        return a.answer === b.answer && a.questionType === b.questionType;
      case 'geometri':
        return a.shape === b.shape && a.geoQuestion === b.geoQuestion &&
               JSON.stringify(a.dimensions) === JSON.stringify(b.dimensions);
      case 'matt-langd':
      case 'matt-volym':
        return a.conversion.from === b.conversion.from &&
               a.conversion.fromUnit === b.conversion.fromUnit &&
               a.conversion.toUnit === b.conversion.toUnit;
      default:
        return false;
    }
  }

  // =========================================================
  //  Visa rätt svar
  // =========================================================
  function showAnswer(problem, problemDisplay, showAnswerBtn) {
    showAnswerBtn.disabled    = true;
    showAnswerBtn.textContent = '✓';

    if (problem.isTextProblem) {
      appendAnswerBox(problem.answer, problemDisplay);
      return;
    }

    switch (problem.type) {
      case 'addition':
      case 'subtraktion': {
        if (problem.mode === 'uppstallning') {
          const ansRow = problemDisplay.querySelector('.uppstallning-answer');
          if (ansRow) ansRow.classList.add('shown');
        } else {
          const ansEl = problemDisplay.querySelector('.answer-hidden');
          if (ansEl) ansEl.classList.remove('answer-hidden');
        }
        break;
      }
      case 'oppna-utsaga': {
        const blank = problemDisplay.querySelector('.open-blank');
        if (blank) {
          blank.textContent = problem.answer;
          blank.classList.add('open-blank--answered');
        }
        break;
      }
      case 'klocka':
        appendAnswerBox(problem.answer, problemDisplay);
        break;
      case 'geometri': {
        const unit = problem.geoQuestion === 'area' ? 'cm²' : 'cm';
        appendAnswerBox(`${problem.answer} ${unit}`, problemDisplay);
        break;
      }
      case 'matt-langd':
      case 'matt-volym': {
        const { from, fromUnit, toUnit } = problem.conversion;
        const display = problemDisplay.querySelector('.matt-display');
        if (display) {
          display.innerHTML =
            `<span>${from}\u202F</span>` +
            `<span class="matt-unit">${fromUnit}</span>` +
            `<span>\u202F=\u202F</span>` +
            `<span class="answer-value">${problem.answer}\u202F</span>` +
            `<span class="matt-unit">${toUnit}</span>`;
        }
        break;
      }
      default: {
        const ansEl = problemDisplay.querySelector('.answer-hidden');
        if (ansEl) {
          ansEl.classList.remove('answer-hidden');
        }
      }
    }
  }

  function appendAnswerBox(text, container) {
    const box = document.createElement('div');
    box.className = 'answer-box';
    const label = document.createElement('span');
    label.className = 'answer-box-label';
    label.textContent = 'Svar:';
    const val = document.createElement('span');
    val.className = 'answer-value';
    val.textContent = text;
    box.appendChild(label);
    box.appendChild(val);
    container.appendChild(box);
  }

  return { isSameProblem, showAnswer, appendAnswerBox };
})();
