// js/escape.js
// Escape Room – spelet.
// Läser rumskod från ?k=<kod> och hämtar data via EscapeStore.
// Om ingen kod i URL visas en välkomstskärm där eleven skriver in koden.
// SVG-rummen laddas synkront från EscapeRooms (escape-rooms.js).

const EscapeGame = (() => {

  // ─── State ───────────────────────────────────────────────
  let data = null;        // { r: rum-id, c: kod, p: [{ o, q, a, d }] }
  let solvedMap = {};     // objectId → true
  let collectedDigits = []; // parallell med data.p, null tills löst

  // ─── DOM-refs ────────────────────────────────────────────
  let els = {};

  // =========================================================
  //  Hämta rumsdata via kod
  // =========================================================
  async function loadDataFromCode(code) {
    if (typeof EscapeStore === 'undefined') {
      console.error('EscapeStore saknas');
      return false;
    }
    const payload = await EscapeStore.load(code);
    if (!payload || !payload.p) return false;
    data = payload;
    collectedDigits = new Array(data.p.length).fill(null);
    return true;
  }

  // =========================================================
  //  Ladda SVG-rum
  // =========================================================
  function loadRoom() {
    const svgText = (typeof EscapeRooms !== 'undefined') ? EscapeRooms.get(data.r) : null;
    if (!svgText) {
      els.room.innerHTML = '<div class="er-error">Kunde inte ladda rummet.</div>';
      return;
    }

    // Infoga SVG i rummet
    els.room.innerHTML = svgText;
    const svg = els.room.querySelector('svg');
    if (svg) {
      svg.classList.add('er-svg');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }

    // Koppla klick-hanterare till föremål
    bindObjects(svg);
  }

  // =========================================================
  //  Bind klick på SVG-objekt
  // =========================================================
  function bindObjects(svg) {
    if (!svg) return;

    // Alla grupper med data-obj
    const groups = svg.querySelectorAll('[data-obj]');
    groups.forEach(g => {
      const objId = g.getAttribute('data-obj');

      // Hitta om detta objekt har en uppgift
      const entry = data.p.find(p => p.o === objId);

      if (objId === 'dorr') {
        // Dörren → kodlås
        g.classList.add('er-obj', 'er-obj--door');
        g.style.cursor = 'pointer';
        g.addEventListener('click', openLockModal);
      } else if (entry) {
        // Uppgifts-objekt
        g.classList.add('er-obj', 'er-obj--active');
        g.style.cursor = 'pointer';
        g.addEventListener('click', () => openProblemModal(entry));
      } else {
        // Dekorations-objekt
        g.classList.add('er-obj', 'er-obj--deco');
        g.style.cursor = 'pointer';
        g.addEventListener('click', () => shakeObject(g));
      }
    });
  }

  // =========================================================
  //  HUD: kodsiffror
  // =========================================================
  function buildCodeSlots() {
    const container = els.codeSlots;
    container.innerHTML = '';
    for (let i = 0; i < data.p.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'er-code-slot';
      slot.textContent = '?';
      container.appendChild(slot);
    }
  }

  function updateCodeSlot(index, digit) {
    const slots = els.codeSlots.children;
    if (slots[index]) {
      slots[index].textContent = digit;
      slots[index].classList.add('er-code-slot--filled');
    }
  }

  // =========================================================
  //  Uppgifts-modal
  // =========================================================
  function openProblemModal(entry) {
    const idx = data.p.indexOf(entry);
    if (solvedMap[entry.o]) return;

    const problemEl = els.modalProblem;
    problemEl.innerHTML = '';
    els.modalAnswer.value = '';
    els.modalFeedback.textContent = '';
    els.modalFeedback.className = 'er-modal-feedback';

    // Visa frågan som text
    const qEl = document.createElement('div');
    qEl.className = 'er-question-text';
    qEl.textContent = entry.q;
    problemEl.appendChild(qEl);

    els.modal.classList.remove('hidden');
    els.modal.dataset.entryIndex = idx;
    els.modalAnswer.focus();
  }

  function handleProblemSubmit() {
    const idx = parseInt(els.modal.dataset.entryIndex);
    const entry = data.p[idx];
    if (!entry || solvedMap[entry.o]) return;

    if (answersMatch(els.modalAnswer.value, entry.a)) {
      solvedMap[entry.o] = true;
      collectedDigits[idx] = entry.d;
      els.modalFeedback.textContent = 'Rätt! Siffran är: ' + entry.d;
      els.modalFeedback.className = 'er-modal-feedback er-feedback--correct';

      updateCodeSlot(idx, entry.d);
      markObjectSolved(entry.o);

      setTimeout(() => {
        els.modal.classList.add('hidden');
        checkAllSolved();
      }, 1200);
    } else {
      els.modalFeedback.textContent = 'Fel, försök igen!';
      els.modalFeedback.className = 'er-modal-feedback er-feedback--wrong';
      els.modalAnswer.value = '';
      els.modalAnswer.focus();
    }
  }

  function normalize(str) {
    return String(str == null ? '' : str).trim().toLowerCase().replace(/\s+/g, '').replace(',', '.');
  }

  // Plockar ut det första talet i en sträng (stöder komma/punkt + minus).
  // "948 min" → 948, "91 kr" → 91, "−5°C" → -5, "1,5 kg" → 1.5, "Kvadrat" → null
  function extractNumber(str) {
    const s = String(str == null ? '' : str).replace(',', '.').replace(/−/g, '-');
    const m = s.match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }

  // Smart svarjämförelse:
  // 1. Om det rätta svaret innehåller ett tal: räcker att elevens svar ger samma tal.
  //    Enheter, mellanslag, stavning spelar ingen roll.
  // 2. Annars (t.ex. "Kvadrat", "Spetsig"): textmatch utan skiftläge/mellanslag.
  function answersMatch(userInput, correctAnswer) {
    const correctNum = extractNumber(correctAnswer);
    if (correctNum !== null) {
      const userNum = extractNumber(userInput);
      if (userNum !== null && userNum === correctNum) return true;
      // Fallback: om eleven ändå skrev exakt samma textform (t.ex. "948 min")
      return normalize(userInput) === normalize(correctAnswer);
    }
    return normalize(userInput) === normalize(correctAnswer);
  }

  function markObjectSolved(objectId) {
    const g = els.room.querySelector('[data-obj="' + objectId + '"]');
    if (g) {
      g.classList.add('er-obj--solved');
      g.style.cursor = 'default';
    }
  }

  function shakeObject(g) {
    g.classList.add('er-obj--shake');
    setTimeout(() => g.classList.remove('er-obj--shake'), 500);
  }

  function checkAllSolved() {
    const allSolved = data.p.every(p => solvedMap[p.o]);
    if (allSolved) {
      const door = els.room.querySelector('[data-obj="dorr"]');
      if (door) door.classList.add('er-obj--door-ready');
    }
  }

  // =========================================================
  //  Kodlås-modal
  // =========================================================
  function openLockModal() {
    els.lock.classList.remove('hidden');
    els.lockInput.value = '';
    els.lockFeedback.textContent = '';
    els.lockFeedback.className = 'er-modal-feedback';
    els.lockInput.maxLength = data.c.length;
    els.lockInput.placeholder = '_ '.repeat(data.c.length).trim();
    els.lockInput.focus();
  }

  function handleLockSubmit() {
    if (els.lockInput.value.trim() === data.c) {
      els.lock.classList.add('hidden');
      els.win.classList.remove('hidden');
      els.room.classList.add('er-room--won');
    } else {
      els.lockFeedback.textContent = 'Fel kod! Samla fler ledtrådar.';
      els.lockFeedback.className = 'er-modal-feedback er-feedback--wrong';
      els.lockInput.value = '';
      els.lockInput.focus();
    }
  }

  // =========================================================
  //  Init
  // =========================================================
  async function startGame() {
    buildCodeSlots();
    loadRoom();
  }

  async function init() {
    els = {
      room:          document.getElementById('escape-room'),
      codeSlots:     document.getElementById('er-code-slots'),
      modal:         document.getElementById('er-modal'),
      modalProblem:  document.getElementById('er-modal-problem'),
      modalAnswer:   document.getElementById('er-modal-answer'),
      modalSubmit:   document.getElementById('er-modal-submit'),
      modalFeedback: document.getElementById('er-modal-feedback'),
      modalClose:    document.getElementById('er-modal-close'),
      lock:          document.getElementById('er-lock'),
      lockInput:     document.getElementById('er-lock-input'),
      lockSubmit:    document.getElementById('er-lock-submit'),
      lockFeedback:  document.getElementById('er-lock-feedback'),
      lockClose:     document.getElementById('er-lock-close'),
      win:           document.getElementById('er-win'),
      entry:         document.getElementById('er-entry'),
      entryInput:    document.getElementById('er-entry-input'),
      entrySubmit:   document.getElementById('er-entry-submit'),
      entryFeedback: document.getElementById('er-entry-feedback'),
    };

    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('k');

    if (urlCode) {
      // Direkt ingång via länk
      const ok = await loadDataFromCode(urlCode);
      if (!ok) {
        els.room.innerHTML = '<div class="er-error">Rummet med kod "' + urlCode + '" hittades inte.</div>';
        return;
      }
      startGame();
    } else {
      // Visa välkomstskärm
      if (els.entry) {
        els.entry.classList.remove('hidden');
        els.entryInput?.focus();
      }
    }

    // Välkomstskärm: skicka-knapp
    const submitEntryCode = async () => {
      const code = (els.entryInput?.value || '').trim().toUpperCase();
      if (!code) return;
      els.entryFeedback.textContent = 'Hämtar rum...';
      els.entryFeedback.className = 'er-entry-feedback';
      const ok = await loadDataFromCode(code);
      if (!ok) {
        els.entryFeedback.textContent = 'Hittade inget rum med den koden.';
        els.entryFeedback.className = 'er-entry-feedback er-feedback--wrong';
        return;
      }
      els.entry.classList.add('hidden');
      startGame();
    };
    els.entrySubmit?.addEventListener('click', submitEntryCode);
    els.entryInput?.addEventListener('keydown', e => { if (e.key === 'Enter') submitEntryCode(); });

    // Uppgifts-modal events
    els.modalSubmit.addEventListener('click', handleProblemSubmit);
    els.modalAnswer.addEventListener('keydown', e => { if (e.key === 'Enter') handleProblemSubmit(); });
    els.modalClose.addEventListener('click', () => els.modal.classList.add('hidden'));

    // Kodlås events
    els.lockSubmit.addEventListener('click', handleLockSubmit);
    els.lockInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleLockSubmit(); });
    els.lockClose.addEventListener('click', () => els.lock.classList.add('hidden'));

    // Escape-tangent & klick utanför
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { els.modal.classList.add('hidden'); els.lock.classList.add('hidden'); }
    });
    els.modal.addEventListener('click', e => { if (e.target === els.modal) els.modal.classList.add('hidden'); });
    els.lock.addEventListener('click', e => { if (e.target === els.lock) els.lock.classList.add('hidden'); });

    // Spela igen
    document.getElementById('er-play-again')?.addEventListener('click', () => window.location.reload());
  }

  document.addEventListener('DOMContentLoaded', init);

  return {};
})();
