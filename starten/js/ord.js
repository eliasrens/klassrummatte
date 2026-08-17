/* Starten – "Veckans ord". Alternativ till läsförståelsen som sida 1:
   tio ord som eleven skriver av en gång per veckodag, med fullt
   skrivlinjesystem i varje ruta.

   Arket är LIGGANDE och skrivs därför ut separat från matten – de går
   inte att kombinera i ett dubbelsidigt blad. Orden lagras på veckan
   (fältet `ord`) och följer med till molnet. */
window.StartenOrd = (function () {
  "use strict";

  const DAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];
  const WORD_COUNT = 10;
  const FULL_SIZE = 32;   // px – ordets normalstorlek
  const MIN_SIZE = 17;    // px – golv när ett långt ord måste krympas

  function escapeHtml(s) {
    return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function store() { return window.StartenWeeksStore || null; }

  /* ---- Sida 1: läsförståelse eller veckans ord ---- */
  function getSida1() {
    const s = store();
    const w = s && s.getActive();
    return (w && w.sida1Typ === "ord") ? "ord" : "las";
  }
  function setSida1(v) {
    const s = store(); if (!s) return;
    const w = s.getActive(); if (!w || !w.id) return;
    s.patchActive({ sida1Typ: v === "ord" ? "ord" : "las" });
  }

  /* ---- Orden ---- */
  function getWords() {
    const s = store();
    const w = s && s.getActive();
    const src = (w && Array.isArray(w.ord)) ? w.ord : [];
    return src.slice(0, WORD_COUNT).map(function (x) { return String(x == null ? "" : x); });
  }

  // Radbrytning ELLER kommatecken skiljer orden åt.
  function parseWords(raw) {
    return String(raw || "")
      .split(/[\n,;]+/)
      .map(function (x) { return x.trim(); })
      .filter(Boolean)
      .slice(0, WORD_COUNT);
  }

  function wordsToText(list) { return (list || []).join("\n"); }

  function setWords(list) {
    const s = store(); if (!s) return;
    const w = s.getActive(); if (!w || !w.id) return;
    s.patchActive({
      ord: (list || []).slice(0, WORD_COUNT).map(function (x) { return String(x || "").trim(); })
    });
  }

  /* ---- Använt tidigare? ----
     Vecko-listan innehåller redan hela veckodokumenten, så orden går att
     läsa därifrån utan en enda extra databasläsning. Bara den egna
     årskursen räknas – en annan årskurs säger inget om de här eleverna. */
  function usedBefore(word) {
    const s = store();
    const cur = s && s.getActive();
    if (!s || !cur || !cur.id || !word) return [];
    const grade = s.weekGrade(cur);
    const needle = String(word).trim().toLowerCase();
    if (!needle) return [];
    return (s.getAllList() || []).filter(function (w) {
      if (w.id === cur.id || s.weekGrade(w) !== grade) return false;
      return (w.ord || []).some(function (o) {
        return String(o || "").trim().toLowerCase() === needle;
      });
    }).map(function (w) { return { year: w.year, week: w.week }; })
      .sort(function (a, b) { return (b.year - a.year) || (b.week - a.week); });
  }

  function usageTitle(list) {
    return "Använd " + list.map(function (u) { return "v." + u.week + " " + u.year; }).join(", ");
  }

  /* ---- Ark-rendering (som .ab-sheet, liggande) ---- */
  const LINES = '<div class="st-ord-tak"></div><div class="st-ord-mid"></div>' +
                '<div class="st-ord-base"></div><div class="st-ord-kallare"></div>';

  function renderSheet(wrap, opts) {
    opts = opts || {};
    const color = opts.color || "";
    const words = getWords();

    const sheet = document.createElement("div");
    sheet.className = "ab-sheet st-ord-sheet" + (color ? " starten-" + color : "");
    const inner = document.createElement("div");
    inner.className = "ab-sheet-inner";

    let rows = "";
    for (let i = 0; i < WORD_COUNT; i++) {
      const word = words[i] || "";
      const used = word ? usedBefore(word) : [];
      const mark = used.length
        ? '<span class="st-ord-used" title="' + escapeHtml(usageTitle(used)) + '">●</span>'
        : "";
      let cells = '<td><div class="st-ord-cell">' + LINES +
                  '<span class="st-ord-word">' + escapeHtml(word) + "</span>" + mark + "</div></td>";
      for (let d = 0; d < DAYS.length; d++) cells += '<td><div class="st-ord-cell">' + LINES + "</div></td>";
      rows += "<tr>" + cells + "</tr>";
    }

    inner.innerHTML =
      '<header class="ab-header starten-header">' +
        '<div class="ab-header-left"><div class="ab-title">' +
          escapeHtml(opts.title || "Veckans ord") + "</div></div>" +
        '<div class="ab-header-fields"><div><div class="ab-field-label">Namn:</div>' +
        '<div class="ab-field-line">&nbsp;</div></div></div>' +
      "</header>" +
      '<table class="st-ord-table"><thead><tr><th>Veckans ord</th>' +
        DAYS.map(function (d) { return "<th>" + d + "</th>"; }).join("") +
      "</tr></thead><tbody>" + rows + "</tbody></table>";

    sheet.appendChild(inner);
    wrap.appendChild(sheet);
  }

  /* Ord som inte får plats i sin ruta krymps tills de gör det. Ord som
     ryms rörs inte alls och behåller sin exakta placering på linjerna.
     Måste ske i JS – CSS kan inte mäta textbredd. */
  function fitWords(root) {
    (root || document).querySelectorAll(".st-ord-word").forEach(function (el) {
      const cell = el.parentNode;
      const avail = cell.clientWidth - el.offsetLeft - 6;
      if (avail <= 0) return;
      let size = FULL_SIZE;
      el.style.fontSize = size + "px";
      while (el.getBoundingClientRect().width > avail && size > MIN_SIZE) {
        size -= 1;
        el.style.fontSize = size + "px";
      }
    });
  }

  // Bredden går inte att mäta förrän typsnittet laddat.
  function fitWhenReady(root) {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { fitWords(root); });
    } else {
      fitWords(root);
    }
  }

  return {
    DAYS: DAYS, WORD_COUNT: WORD_COUNT,
    getSida1: getSida1, setSida1: setSida1,
    getWords: getWords, setWords: setWords, parseWords: parseWords, wordsToText: wordsToText,
    usedBefore: usedBefore, usageTitle: usageTitle,
    renderSheet: renderSheet, fitWords: fitWords, fitWhenReady: fitWhenReady
  };
})();
