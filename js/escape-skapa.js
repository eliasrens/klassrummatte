// js/escape-skapa.js
// Skaparverktyg för Escape Room.
// Alt 1: genererar uppgifter + kod här, kodar allt i URL:en.
// Alla elever som öppnar samma länk får identiska uppgifter och kod.

const EscapeSkapa = (() => {

  // ─── Rumsdefinitioner ─────────────────────────────────────
  // Objekten per rum måste matcha data-obj i SVG-filerna.
  const ROOMS = [
    { id: 'klassrum',    name: 'Klassrummet',  emoji: '🏫',
      objects: ['tavla','bokhylla','kateder','bank-fram','bank-bak','klocka','skap','papperskorg','affisch'] },
    { id: 'rymden',      name: 'Rymden',       emoji: '🚀',
      objects: ['planet','rymdskepp','meteor','jord','station','stjarna','flagga','satellit'] },
    { id: 'spokslottet', name: 'Spökslottet',  emoji: '👻',
      objects: ['fackla','spegel','kista','trollbok','trolldryck','skalle','fladdermus','spindel'] },
    { id: 'djungeln',    name: 'Djungeln',     emoji: '🌴',
      objects: ['apa','papegoja','orm','skattkista','vattenfall','blomma','diamant'] },
    { id: 'undervatten', name: 'Undervatten',  emoji: '🐙',
      objects: ['blackfisk','korall','skattkista','fisk','ankare','sjostjarna','krabba'] },
    { id: 'pyramiden',   name: 'Pyramiden',     emoji: '🏺',
      objects: ['fackla','sarkofag','hieroglyf','skarabe','mask','guldmynt','kobra'] },
  ];

  // ─── State ───────────────────────────────────────────────
  let selectedRoom = 'klassrum';
  let codeLength = 4;

  // ─── AREA_CONFIG ─────────────────────────────────────────
  const AREA_CONFIG = (typeof ArbetsbladConfig !== 'undefined') ? ArbetsbladConfig.AREA_CONFIG : [];

  // =========================================================
  //  Bygg UI: Rum-kort
  // =========================================================
  function buildRoomCards() {
    const container = document.getElementById('es-rooms');
    if (!container) return;

    ROOMS.forEach(room => {
      const card = document.createElement('div');
      card.className = 'es-room-card' + (room.id === selectedRoom ? ' es-room-card--selected' : '');

      card.innerHTML =
        '<div class="es-room-preview">' + room.emoji + '</div>' +
        '<span class="es-room-name">' + room.name + '</span>';

      card.addEventListener('click', () => {
        selectedRoom = room.id;
        document.querySelectorAll('.es-room-card').forEach(c => c.classList.remove('es-room-card--selected'));
        card.classList.add('es-room-card--selected');
        updateMaxCode();
      });

      container.appendChild(card);
    });
  }

  function updateMaxCode() {
    const room = ROOMS.find(r => r.id === selectedRoom);
    const max = room ? room.objects.length : 8;
    document.querySelectorAll('.es-len-btn').forEach(btn => {
      const len = parseInt(btn.dataset.len);
      btn.disabled = len > max;
      btn.style.opacity = len > max ? '0.3' : '1';
    });
    if (codeLength > max) {
      codeLength = max;
      document.querySelectorAll('.es-len-btn').forEach(btn => {
        btn.classList.toggle('es-len-btn--active', parseInt(btn.dataset.len) === codeLength);
      });
    }
  }

  // =========================================================
  //  Bygg UI: Områdescheckboxar
  // =========================================================
  function buildAreaCheckboxes() {
    const container = document.getElementById('es-areas');
    if (!container) return;

    AREA_CONFIG.forEach(cat => {
      const catLabel = document.createElement('div');
      catLabel.className = 'es-area-category';
      catLabel.textContent = cat.cat;
      container.appendChild(catLabel);

      cat.areas.forEach(area => {
        const label = document.createElement('label');
        label.className = 'es-area-label';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = area.id;
        cb.checked = true;
        label.appendChild(cb);
        label.append(' ' + area.label);
        container.appendChild(label);
      });
    });
  }

  // =========================================================
  //  Kodlängd-knappar
  // =========================================================
  function initCodeLengthButtons() {
    document.querySelectorAll('.es-len-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        codeLength = parseInt(btn.dataset.len);
        document.querySelectorAll('.es-len-btn').forEach(b => b.classList.remove('es-len-btn--active'));
        btn.classList.add('es-len-btn--active');
      });
    });
  }

  // =========================================================
  //  Markera / avmarkera allt
  // =========================================================
  function initAreaActions() {
    document.getElementById('es-select-all')?.addEventListener('click', () => {
      document.querySelectorAll('#es-areas input[type="checkbox"]').forEach(cb => { cb.checked = true; });
    });
    document.getElementById('es-deselect-all')?.addEventListener('click', () => {
      document.querySelectorAll('#es-areas input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    });
  }

  // =========================================================
  //  Egna uppgifter (import)
  // =========================================================
  function initImport() {
    document.getElementById('es-import-csv')?.addEventListener('click', () => {
      document.getElementById('es-file-input')?.click();
    });
    document.getElementById('es-download-template')?.addEventListener('click', () => {
      if (typeof CustomProblems !== 'undefined') CustomProblems.downloadTemplate();
    });
    document.getElementById('es-file-input')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const name = file.name.replace(/\.[^.]+$/, '');
        const result = CustomProblems.importFromCsvText(reader.result, name);
        showImportStatus(result);
      };
      reader.readAsText(file, 'UTF-8');
      e.target.value = '';
    });
    document.getElementById('es-import-paste-btn')?.addEventListener('click', () => {
      const text = document.getElementById('es-paste')?.value || '';
      if (!text.trim()) return;
      const result = CustomProblems.importFromCsvText(text);
      showImportStatus(result);
    });
    renderCustomSets();
  }

  function showImportStatus(result) {
    const el = document.getElementById('es-import-status');
    if (result.success) {
      if (el) {
        el.textContent = result.problems.length + ' uppgifter importerade!';
        el.className = 'es-import-status es-import-status--ok';
      }
      const ta = document.getElementById('es-paste');
      if (ta) ta.value = '';
    } else {
      if (el) {
        el.textContent = result.error;
        el.className = 'es-import-status es-import-status--err';
      }
    }
    renderCustomSets();
  }

  function renderCustomSets() {
    const container = document.getElementById('es-custom-sets');
    if (!container || typeof Settings === 'undefined') return;
    const sets = Settings.getCustomProblemSets();
    container.innerHTML = '';
    if (sets.length === 0) {
      container.innerHTML = '<div class="es-hint" style="margin-top:0.3rem">Inga importerade set</div>';
      return;
    }
    sets.forEach(s => {
      const row = document.createElement('div');
      row.className = 'es-custom-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!s.enabled;
      cb.addEventListener('change', () => Settings.toggleCustomProblemSet(s.id, cb.checked));
      const label = document.createElement('span');
      label.textContent = s.name + ' (' + s.problems.length + ')';
      label.className = 'es-custom-name';
      const del = document.createElement('button');
      del.textContent = '\u00D7';
      del.className = 'es-custom-del';
      del.addEventListener('click', () => { Settings.deleteCustomProblemSet(s.id); renderCustomSets(); });
      row.append(cb, label, del);
      container.appendChild(row);
    });
  }

  // =========================================================
  //  Generera uppgifter + URL (Alt 1)
  // =========================================================
  function getSelectedAreas() {
    return Array.from(document.querySelectorAll('#es-areas input[type="checkbox"]:checked')).map(cb => cb.value);
  }

  function generateProblemsForEscape() {
    const grade = parseInt(document.getElementById('es-grade').value) || 3;
    const problemlosning = document.getElementById('es-problemlosning')?.checked || false;
    const onlyCustom = document.getElementById('es-only-custom')?.checked || false;
    const customList = (typeof Settings !== 'undefined') ? Settings.getCustomProblems() : [];
    const useCustom = customList.length > 0;

    // "Endast egna" – strunta i matteområden
    const areas = onlyCustom ? [] : getSelectedAreas();

    if (onlyCustom && !useCustom) {
      alert('Du har valt "endast egna" men inga egna uppgifter är importerade.');
      return null;
    }
    if (!onlyCustom && areas.length === 0 && !useCustom) {
      alert('Välj minst ett matteområde eller importera egna uppgifter.');
      return null;
    }

    const settings = {
      grade, areas,
      problemlosning,
      customProblemsEnabled: useCustom,
      specificTables: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    };

    const generated = [];
    for (let i = 0; i < codeLength; i++) {
      let p = null;
      let q = null;
      let attempts = 0;
      while (attempts < 25) {
        p = Problems.generateProblem(settings);
        attempts++;
        if (!p) continue;
        q = problemToText(p);
        if (q) break; // gick att formatera
        p = null;
      }
      if (!p || !q) continue;
      generated.push({ q, a: String(p.answer) });
    }

    if (generated.length === 0) {
      alert('Kunde inte generera uppgifter. Kontrollera inställningarna.');
      return null;
    }

    return generated;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // Text-representation av ett problem. Returnerar null om problemet inte
  // går att uttrycka rent som text (t.ex. geometri med figur, klocka, tallinje).
  function problemToText(p) {
    if (!p) return null;
    // Textuppgift (problemlösning) – alltid text
    if (p.isTextProblem && p.textTemplate) return p.textTemplate;
    // Uttryck (prioritet, öppna utsagor)
    if (p.expression) return p.expression.replace(/_/g, '___') + ' = ?';
    // Enhetsomvandling
    if (p.conversion) return p.conversion.from + ' ' + p.conversion.fromUnit + ' = ? ' + p.conversion.toUnit;
    // Grundläggande aritmetik
    if (p.a !== undefined && p.b !== undefined && p.operator) {
      return p.a + ' ' + p.operator + ' ' + p.b + ' = ?';
    }
    // Talsorter / avrundning etc med fråga + värde
    if (p.question && typeof p.question === 'string') return p.question;
    // Typer utan ren text-representation: skippa
    return null;
  }

  // Bakåtkompat-alias (används i lärarsummering)
  function formatProblemText(p) {
    return problemToText(p) || ('Uppgift (svar: ' + p.answer + ')');
  }

  async function handleGenerate() {
    const problems = generateProblemsForEscape();
    if (!problems) return;

    // Generera utgångskod (en siffra per uppgift – "lås-koden")
    const code = problems.map(() => Math.floor(Math.random() * 10)).join('');

    // Tilldela föremål
    const room = ROOMS.find(r => r.id === selectedRoom);
    const shuffledObjs = [...room.objects].sort(() => Math.random() - 0.5);
    const activeObjs = shuffledObjs.slice(0, problems.length);

    // Bygg payload som JSON (lagras i store, inte i URL – så längden spelar ingen roll)
    const payload = {
      r: selectedRoom,
      c: code,
      p: problems.map((prob, i) => ({
        o: activeObjs[i],
        q: prob.q,
        a: prob.a,
        d: code[i],
      })),
    };

    // Spara till store → få kort rumskod (t.ex. "KLAS-4X7B")
    let roomCode;
    try {
      roomCode = await EscapeStore.save(payload);
    } catch (e) {
      alert('Kunde inte spara rummet: ' + e.message);
      return;
    }

    // Kort URL: escape.html?k=<rumskod>
    const base = window.location.href.replace(/[^/]*$/, '');
    const url = base + 'escape.html?k=' + encodeURIComponent(roomCode);

    // Visa resultat
    const result = document.getElementById('es-result');
    result.classList.remove('hidden');
    document.getElementById('es-link').value = url;

    // Visa stora rumskoden
    const codeDisplay = document.getElementById('es-room-code');
    if (codeDisplay) codeDisplay.textContent = roomCode;

    // Visa lås-koden och uppgifterna för läraren
    showTeacherSummary(code, problems, activeObjs, room);

    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showTeacherSummary(code, problems, objects, room) {
    const container = document.getElementById('es-teacher-summary');
    if (!container) return;
    container.classList.remove('hidden');

    let html = '<div class="es-summary-code">Kod: <strong>' + code + '</strong></div>';
    html += '<div class="es-summary-room">Rum: ' + room.name + '</div>';
    html += '<table class="es-summary-table"><tr><th>Föremål</th><th>Fråga</th><th>Svar</th><th>Siffra</th></tr>';
    problems.forEach((p, i) => {
      html += '<tr><td>' + objects[i] + '</td><td>' + escapeHtml(p.q) + '</td><td>' + escapeHtml(p.a) + '</td><td class="es-summary-digit">' + code[i] + '</td></tr>';
    });
    html += '</table>';
    container.innerHTML = html;
  }

  // =========================================================
  //  Kopiera länk
  // =========================================================
  function initCopyButton() {
    document.getElementById('es-copy-link')?.addEventListener('click', () => {
      const input = document.getElementById('es-link');
      navigator.clipboard.writeText(input.value).then(() => {
        const btn = document.getElementById('es-copy-link');
        btn.textContent = 'Kopierad!';
        btn.classList.add('es-small-btn--copied');
        setTimeout(() => { btn.textContent = 'Kopiera'; btn.classList.remove('es-small-btn--copied'); }, 2000);
      });
    });
  }

  // =========================================================
  //  Init
  // =========================================================
  function init() {
    buildRoomCards();
    buildAreaCheckboxes();
    initCodeLengthButtons();
    initAreaActions();
    initImport();
    initCopyButton();

    document.getElementById('es-generate')?.addEventListener('click', handleGenerate);
    document.getElementById('es-open-game')?.addEventListener('click', () => {
      const url = document.getElementById('es-link')?.value;
      if (url) window.open(url, '_blank');
    });

    updateMaxCode();
  }

  document.addEventListener('DOMContentLoaded', init);

  return { ROOMS };
})();
