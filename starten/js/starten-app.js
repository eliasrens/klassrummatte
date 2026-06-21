/* Starten – limmet. Bygger svensk-ark (sida 1) + matte-ark (sida 2),
   sköter tvåsidig utskrift, samt redigeringspanelen (Svenska/Matte).
   Återanvänder klassrummattes mattemotor (PluginUtils + ArbetsbladStarten). */
(function () {
  "use strict";

  function $(s) { return document.querySelector(s); }
  function wrap() { return document.getElementById("ab-sheet"); }
  function escapeHtml(s) {
    return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  const SUBJ = { svenska: "Svenska", no: "NO", so: "SO", engelska: "Engelska" };
  function subjLabel(s) { return SUBJ[s] || "Svenska"; }

  // Cachat matte-ark + ev. dag som redigeras inline.
  // matte = { rows, grade } – speglar veckans matte vid render.
  const state = { matte: null, editingDay: null, savingFromWeek: false };

  function weeksStore() { return window.StartenWeeksStore || null; }

  /* ── Avläsning av kontroller ─────────────────────────── */
  function currentColor() { const b = document.querySelector(".st-color-btn--active"); return b ? (b.dataset.theme || "") : ""; }
  function currentTitle() { const v = ($("#st-title").value || "").trim(); return v || "Starten"; }
  function currentVaxling() { const el = document.querySelector('input[name="m-vaxling"]:checked'); return el && el.value ? el.value : null; }
  function readMatteSettings() {
    const ops = [];
    if ($("#m-add").checked) ops.push("add");
    if ($("#m-sub").checked) ops.push("sub");
    if ($("#m-mult").checked) ops.push("mult");
    if ($("#m-div-cell").checked) ops.push("div");
    return {
      ops: ops.length ? ops : ["add", "sub", "mult"],
      showDiv: $("#m-div-col").checked,
      vaxling: currentVaxling(),
      grade: parseInt($("#m-grade").value, 10) || 3
    };
  }

  /* ── Matte: generera / byt enskild ruta ──────────────── */
  function regenerateMatte() {
    const m = readMatteSettings();
    state.matte = {
      rows: ArbetsbladStarten.generateStartenProblemsWithOps(m.grade, m.ops, m.showDiv, m.vaxling),
      grade: m.grade,
      ops: m.ops, showDiv: m.showDiv, vaxling: m.vaxling
    };
    persistMatteToWeek();
  }

  function regenCell(sheetIdx, d, cellIdx) {
    if (!state.matte) return;
    const row = state.matte.rows[d];
    const c = PluginUtils.cfg(state.matte.grade);
    const vax = currentVaxling();
    const opts = vax ? { vaxling: vax } : null;
    if (cellIdx < row.uppstallningar.length) {
      const map = { "uppstallning-add": "add", "uppstallning-sub": "sub", "uppstallning-mult": "mult", "uppstallning-div": "div" };
      const sub = map[row.uppstallningar[cellIdx].type] || "mult";
      row.uppstallningar[cellIdx] = PluginUtils.genUppstallning(sub, c, opts);
    } else if (row.brak) {
      const divisor = PluginUtils.randInt(2, 9), quotient = PluginUtils.randInt(2, 9);
      row.brak = { dividend: divisor * quotient, divisor: divisor, quotient: quotient };
    }
    persistMatteToWeek();
    render();
  }

  function persistMatteToWeek() {
    const s = weeksStore();
    if (!s || state.savingFromWeek || !state.matte) return;
    const w = s.getActive();
    if (!w || !w.id) return;
    s.patchActive({
      matte: {
        grade: state.matte.grade,
        ops: state.matte.ops || [],
        showDiv: !!state.matte.showDiv,
        vaxling: state.matte.vaxling || null,
        rows: state.matte.rows || []
      }
    });
  }

  /* ── Rendera båda sidorna ────────────────────────────── */
  function render() {
    StartenSvenska.seedIfEmpty();
    if (!state.matte) regenerateMatte();
    const color = currentColor();
    const title = currentTitle();
    const w = wrap();
    w.innerHTML = "";
    w.classList.remove("hidden");

    // Sida 1 – svenska
    StartenSvenska.renderSheet(w, { color: color, title: title });

    // Sida 2 – matte (cachade uppgifter + byt-ruta-knappar)
    ArbetsbladStarten.renderSingleStartenSheet(
      w, state.matte.grade, state.matte.rows, title, color, true, 1, "", function () {}, regenCell
    );

    // Matte-sidan: ta bort Namn-fält och "Åk X"-underrubrik (räcker med rubriken)
    const sheets = w.querySelectorAll(".ab-sheet");
    const matteSheet = sheets[sheets.length - 1];
    if (matteSheet) {
      const f = matteSheet.querySelector(".ab-header-fields"); if (f) f.innerHTML = "";
      const sub = matteSheet.querySelector(".ab-subtitle"); if (sub) sub.remove();
    }
  }

  function createWeek() { StartenSvenska.randomizeWeek(); regenerateMatte(); render(); refreshSv(); }
  function randomizeSvenska() { StartenSvenska.randomizeWeek(); render(); refreshSv(); }
  function randomizeMatte() { regenerateMatte(); render(); }

  /* ── Vecko-väljare ───────────────────────────────────── */
  function renderWeekSelect() {
    const sel = $("#week-select"); if (!sel) return;
    const s = weeksStore(); if (!s) return;
    const list = s.getList();
    const activeId = s.getActiveId();
    sel.innerHTML = list.map(function (w) {
      const label = "v." + w.week + " " + w.year + (w.name ? " – " + w.name : "");
      return '<option value="' + w.id + '"' + (w.id === activeId ? " selected" : "") + ">" + label + "</option>";
    }).join("");
    if (!list.length && activeId) {
      // Aktiv vecka inte än i listan (precis skapad) – lägg in själv
      sel.innerHTML = '<option value="' + activeId + '" selected>' + activeId + "</option>";
    }
  }

  function promptNewWeek() {
    const s = weeksStore(); if (!s) return;
    const cur = s.currentIsoParts();
    const ans = prompt("Vilken vecka? (t.ex. " + cur.week + ")", String(cur.week));
    if (ans == null) return;
    const w = parseInt(String(ans).trim(), 10);
    if (!w || w < 1 || w > 53) { alert("Ange ett veckonummer mellan 1 och 53."); return; }
    const yAns = prompt("År:", String(cur.year));
    if (yAns == null) return;
    const y = parseInt(String(yAns).trim(), 10);
    if (!y || y < 2024 || y > 2099) { alert("Ange ett rimligt år."); return; }
    const name = prompt("Eget namn på veckan (valfritt):", "") || "";
    s.ensureWeek(y, w, name.trim());
  }

  function onWeekChanged(week) {
    // Veckan har laddats/uppdaterats från moln (eller lokal cache). Synka UI och re-rendera.
    state.savingFromWeek = true;
    let needRegenerate = false;
    try {
      // Titel – uppdatera bara om värdet faktiskt skiljer sig och användaren inte skriver
      const t = $("#st-title");
      if (t && week && typeof week.title === "string" &&
          document.activeElement !== t && t.value !== week.title) {
        t.value = week.title;
      }
      // Färg
      if (week && typeof week.color === "string") {
        document.querySelectorAll(".st-color-btn").forEach(function (b) {
          b.classList.toggle("st-color-btn--active", (b.dataset.theme || "") === (week.color || ""));
        });
      }
      // Matte: om veckan har sparad matte, ladda den; annars regenerera enligt UI
      if (week && week.matte && Array.isArray(week.matte.rows) && week.matte.rows.length) {
        state.matte = {
          rows: week.matte.rows,
          grade: week.matte.grade || 3,
          ops: week.matte.ops || [],
          showDiv: !!week.matte.showDiv,
          vaxling: week.matte.vaxling || null
        };
        // Synka matte-kontrollerna
        const gradeEl = $("#m-grade"); if (gradeEl) gradeEl.value = String(state.matte.grade);
        const ops = state.matte.ops || [];
        $("#m-add").checked = ops.indexOf("add") !== -1;
        $("#m-sub").checked = ops.indexOf("sub") !== -1;
        $("#m-mult").checked = ops.indexOf("mult") !== -1;
        $("#m-div-cell").checked = ops.indexOf("div") !== -1;
        $("#m-div-col").checked = !!state.matte.showDiv;
        const vax = state.matte.vaxling || "";
        const r = document.querySelector('input[name="m-vaxling"][value="' + vax + '"]');
        if (r) r.checked = true;
      } else {
        // Veckan saknar matte – flagga för att regenerera EFTER att savingFromWeek nollställts.
        needRegenerate = true;
      }
      renderWeekSelect();
    } finally {
      state.savingFromWeek = false;
    }
    if (needRegenerate) regenerateMatte(); // sparar matten på veckan
    render();
    refreshSv();
  }

  function onWeeksListChanged() { renderWeekSelect(); }

  /* ── Tvåsidig utskrift ───────────────────────────────── */
  function printBoth() {
    const w = wrap();
    if (!w || w.classList.contains("hidden") || !w.children.length) render();
    const content = wrap().innerHTML;
    let iframe = document.getElementById("print-iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "print-iframe";
      iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;";
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write('<!DOCTYPE html><html lang="sv"><head><meta charset="UTF-8">' +
      '<base href="' + document.baseURI + '">' +
      '<link rel="stylesheet" href="../css/arbetsblad-sheet.css">' +
      '<link rel="stylesheet" href="../css/arbetsblad-starten.css">' +
      '<link rel="stylesheet" href="starten.css">' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link href="https://fonts.googleapis.com/css2?family=Andika:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">' +
      '<style>' +
      '*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
      'html,body{margin:0;padding:0;background:#fff!important;height:100%!important;overflow:visible!important;}' +
      '.ab-sheet-wrap{display:block!important;padding:0!important;height:100%;}' +
      '.ab-sheet{display:flex!important;flex-direction:column!important;width:100%!important;height:100vh!important;box-shadow:none!important;overflow:hidden!important;}' +
      '.ab-sheet::before{flex-shrink:0!important;}' +
      '.ab-sheet-inner{display:flex!important;flex-direction:column!important;flex:1!important;overflow:hidden!important;}' +
      '.ab-sheet + .ab-sheet{page-break-before:always!important;break-before:page!important;margin-top:0!important;}' +
      '.no-print{display:none!important;}' +
      '@page{size:A4 portrait;margin:0.4cm;}' +
      '</style></head><body><div class="ab-sheet-wrap">' + content + '</div></body></html>');
    doc.close();
    iframe.onload = function () { iframe.contentWindow.focus(); iframe.contentWindow.print(); };
  }

  /* ── Redigeringspanel (svenska = vänster, matte = höger) ── */
  function openEditor(which) {
    const isSv = which === "sv";
    const panel = $("#edit-panel");
    $("#edit-title").textContent = isSv ? "Redigera svenska" : "Redigera matte";
    panel.classList.toggle("st-panel--left", isSv);
    panel.classList.toggle("st-panel--right", !isSv);
    $("#tab-sv").classList.toggle("hidden", !isSv);
    $("#tab-matte").classList.toggle("hidden", isSv);
    panel.classList.remove("hidden");
    // Skjut förhandsvisningen åt motsatt håll så arken syns medan man redigerar
    document.body.classList.toggle("edit-left", isSv);
    document.body.classList.toggle("edit-right", !isSv);
    if (isSv) { refreshSv(); refreshPrompt(); }
  }
  function closePanel() {
    $("#edit-panel").classList.add("hidden");
    document.body.classList.remove("edit-left", "edit-right");
    state.editingDay = null;
  }

  /* ── Svenska: dagar ──────────────────────────────────── */
  function refreshSv() { renderSvDays(); renderSvBank(); }

  // Realtid: körs när den delade idébanken ändras (av dig eller en kollega).
  let firstFill = false;
  function onBankUpdate() {
    renderSvBank();
    const wk = StartenSvenska.getWeek();
    const empty = wk.days.every(function (d) { return !d; });
    if (!firstFill && empty && StartenSvenska.getBank().length) {
      firstFill = true;
      StartenSvenska.randomizeWeek();
      render();
    }
  }

  function randomBankEntry() {
    const bank = StartenSvenska.getBank();
    return bank.length ? bank[Math.floor(Math.random() * bank.length)] : null;
  }

  function renderSvDays() {
    const week = StartenSvenska.getWeek();
    const host = $("#sv-days"); host.innerHTML = "";
    StartenSvenska.DAYS.forEach(function (dayName, i) {
      const c = week.days[i];
      const row = document.createElement("div");
      row.className = "st-day";

      if (state.editingDay === i) {
        row.innerHTML =
          '<div class="st-day-head"><strong>' + dayName + "</strong></div>" +
          '<div class="st-form">' +
            '<select class="ed-subject st-input st-input--sm">' +
              '<option value="svenska">Svenska</option><option value="no">NO</option>' +
              '<option value="so">SO</option><option value="engelska">Engelska</option></select>' +
            '<textarea class="ed-text st-input" rows="3" placeholder="Text"></textarea>' +
            '<input class="ed-question st-input" type="text" placeholder="Fråga">' +
            '<div class="st-form-actions"><button class="ed-save st-btn st-btn--primary st-btn--sm">Spara</button>' +
            '<button class="ed-cancel st-btn st-btn--ghost st-btn--sm">Avbryt</button></div>' +
          "</div>";
        if (c) {
          row.querySelector(".ed-subject").value = c.subject || "svenska";
          row.querySelector(".ed-text").value = c.text || "";
          row.querySelector(".ed-question").value = (c.questions && c.questions[0]) || "";
        }
        row.querySelector(".ed-save").addEventListener("click", function () {
          const text = row.querySelector(".ed-text").value.trim();
          const q = row.querySelector(".ed-question").value.trim();
          if (!text || !q) { alert("Fyll i både text och fråga."); return; }
          StartenSvenska.setDay(i, { subject: row.querySelector(".ed-subject").value, text: text, questions: [q], source: "manual" });
          state.editingDay = null; render(); refreshSv();
        });
        row.querySelector(".ed-cancel").addEventListener("click", function () { state.editingDay = null; renderSvDays(); });
      } else {
        const preview = c ? escapeHtml(c.text.slice(0, 70)) + (c.text.length > 70 ? "…" : "") : '<span class="st-muted">tomt</span>';
        row.innerHTML =
          '<div class="st-day-head"><strong>' + dayName + "</strong>" +
            '<div class="st-day-btns">' +
              '<button data-act="rand" title="Slumpa från banken">🎲</button>' +
              '<button data-act="edit" title="Redigera">✏️</button>' +
              '<button data-act="clear" title="Töm">✕</button>' +
            "</div></div>" +
          '<div class="st-day-prev">' + preview + "</div>";
        row.querySelector('[data-act="rand"]').addEventListener("click", function () {
          const e = randomBankEntry(); if (!e) { alert("Idébanken är tom."); return; }
          StartenSvenska.setDay(i, e); render(); refreshSv();
        });
        row.querySelector('[data-act="edit"]').addEventListener("click", function () { state.editingDay = i; renderSvDays(); });
        row.querySelector('[data-act="clear"]').addEventListener("click", function () { StartenSvenska.setDay(i, null); render(); refreshSv(); });
      }
      host.appendChild(row);
    });
  }

  /* ── Svenska: idébank ────────────────────────────────── */
  function renderSvBank() {
    const filter = $("#sv-bank-filter").value;
    const all = StartenSvenska.getBank();
    const bank = all.filter(function (e) { return !filter || e.subject === filter; });
    $("#sv-bank-count").textContent = all.length;
    const host = $("#sv-bank"); host.innerHTML = "";
    if (!bank.length) { host.innerHTML = '<p class="st-muted">Inga texter.</p>'; return; }
    bank.forEach(function (e) {
      const item = document.createElement("div");
      item.className = "st-bank-item";
      const dayOpts = StartenSvenska.DAYS.map(function (d, i) { return '<option value="' + i + '">' + d + "</option>"; }).join("");
      item.innerHTML =
        '<div class="st-bank-text"><span class="st-badge">' + subjLabel(e.subject) + "</span> " + escapeHtml(e.text) + "</div>" +
        '<div class="st-bank-actions">' +
          '<select class="use-day st-input st-input--sm">' + dayOpts + "</select>" +
          '<button data-act="use" class="st-btn st-btn--ghost st-btn--sm">Använd</button>' +
          '<button data-act="del" class="st-del">Ta bort</button>' +
        "</div>";
      item.querySelector('[data-act="use"]').addEventListener("click", function () {
        const i = parseInt(item.querySelector(".use-day").value, 10);
        StartenSvenska.setDay(i, e); render(); renderSvDays();
      });
      item.querySelector('[data-act="del"]').addEventListener("click", function () {
        StartenSvenska.removeFromBank(e.id); renderSvBank();
      });
      host.appendChild(item);
    });
  }

  /* ── Svenska: egen text ──────────────────────────────── */
  function updateOwnCount() {
    const max = StartenSvenska.MAX_CHARS;
    const n = $("#own-text").value.length;
    const words = Math.round(max / 6.3);
    $("#own-count").textContent = n + " / " + max + " tecken (≈ " + words + " ord)";
    $("#own-count").style.color = n >= max ? "#dc2626" : "";
  }

  function addOwn() {
    const fb = $("#own-feedback");
    const text = $("#own-text").value.trim();
    const q = $("#own-question").value.trim();
    if (!text || !q) { fb.textContent = "Fyll i text och fråga."; fb.className = "st-feedback st-feedback--err"; return; }
    const added = StartenSvenska.addToBank([{ subject: $("#own-subject").value, text: text, questions: [q], source: "manual" }], "manual");
    if (added) {
      $("#own-text").value = ""; $("#own-question").value = "";
      fb.textContent = "Tillagd!"; fb.className = "st-feedback st-feedback--ok";
    } else { fb.textContent = "Texten finns redan."; fb.className = "st-feedback"; }
    renderSvBank();
  }

  /* ── Svenska: AI ─────────────────────────────────────── */
  function refreshPrompt() {
    $("#prompt-output").value = StartenPrompt.build({
      subject: $("#gen-subject").value, count: $("#gen-count").value,
      numQuestions: 1, age: $("#gen-age").value, topic: $("#gen-topic").value
    });
  }
  function copyPrompt() {
    const ta = $("#prompt-output");
    const done = function () { const b = $("#copy-prompt"); const o = b.textContent; b.textContent = "Kopierat!"; setTimeout(function () { b.textContent = o; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); document.execCommand("copy"); done(); });
    } else { ta.select(); document.execCommand("copy"); done(); }
  }
  function importResponse() {
    const fb = $("#import-feedback");
    const parsed = StartenPrompt.parseResponse($("#import-input").value);
    if (!parsed.length) { fb.textContent = "Kunde inte tolka svaret (förväntar JSON)."; fb.className = "st-feedback st-feedback--err"; return; }
    const added = StartenSvenska.addToBank(parsed, "ai");
    const skipped = parsed.length - added;
    fb.textContent = "Importerade " + added + (skipped ? " (" + skipped + " dubbletter)" : "") + ".";
    fb.className = "st-feedback st-feedback--ok";
    if (added) $("#import-input").value = "";
    renderSvBank();
  }

  /* ── Färgteman ───────────────────────────────────────── */
  // Mörka teman (8 distinkta kulörer runt färgcirkeln): [namn, hue1, hue2, titel].
  const TH_DARK = [
    ["vinrod", 350, 318, "Vinröd"], ["guld", 40, 8, "Guld"], ["oliv", 75, 45, "Oliv"],
    ["skog", 140, 108, "Skog"], ["", 204, 172, "Blågrön"], ["indigo", 235, 260, "Indigo"],
    ["lila", 275, 243, "Lila"], ["plommon", 300, 330, "Plommon"]
  ];
  // Ljusa teman (8, samma kulörordning): [namn, swatch-gradient, titel].
  const TH_LIGHT = [
    ["rosenljus", "linear-gradient(135deg,hsl(340,90%,84%),hsl(355,90%,75%))", "Rosenljus"],
    ["persikoljus", "linear-gradient(135deg,hsl(28,95%,80%),hsl(14,92%,72%))", "Persikoljus"],
    ["sol", "linear-gradient(135deg,hsl(48,95%,72%),hsl(40,95%,60%))", "Sol"],
    ["limeljus", "linear-gradient(135deg,hsl(90,65%,76%),hsl(108,55%,66%))", "Lime"],
    ["mynta", "linear-gradient(135deg,hsl(160,62%,75%),hsl(174,55%,62%))", "Mynta"],
    ["himmel", "linear-gradient(135deg,hsl(202,85%,78%),hsl(190,78%,66%))", "Himmel"],
    ["lavendelljus", "linear-gradient(135deg,hsl(260,75%,84%),hsl(235,75%,76%))", "Lavendelljus"],
    ["ceriseljus", "linear-gradient(135deg,hsl(320,85%,82%),hsl(340,88%,74%))", "Cerise"]
  ];
  // Duotoner (8): gradient mellan två tydligt olika kulörer. Samma format som TH_DARK.
  const TH_DUO = [
    ["sunset", 32, 335, "Solnedgång"], ["eld", 2, 42, "Eld"], ["citrus", 52, 105, "Citrus"],
    ["tropik", 140, 195, "Tropik"], ["ocean", 205, 250, "Ocean"], ["galax", 258, 315, "Galax"],
    ["bar", 320, 358, "Bär"], ["aurora", 160, 262, "Aurora"]
  ];

  function buildColorButtons() {
    let html = "";
    TH_DARK.forEach(function (t) {
      const sw = "linear-gradient(135deg,hsl(" + t[1] + ",38%,44%),hsl(" + t[2] + ",58%,39%))";
      html += '<button class="st-color-btn' + (t[0] === "" ? " st-color-btn--active" : "") +
        '" data-theme="' + t[0] + '" title="' + t[3] + '"><span style="background:' + sw + '"></span></button>';
    });
    TH_LIGHT.forEach(function (t) {
      html += '<button class="st-color-btn" data-theme="' + t[0] + '" title="' + t[2] +
        '"><span style="background:' + t[1] + '"></span></button>';
    });
    TH_DUO.forEach(function (t) {
      const sw = "linear-gradient(135deg,hsl(" + t[1] + ",55%,46%),hsl(" + t[2] + ",58%,42%))";
      html += '<button class="st-color-btn" data-theme="' + t[0] + '" title="' + t[3] +
        '"><span style="background:' + sw + '"></span></button>';
    });
    $("#color-row").innerHTML = html;
  }

  function initColors() {
    document.querySelectorAll(".st-color-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const theme = btn.dataset.theme || "";
        // Synka alla färgrader (svenska + matte) så de visar samma val
        document.querySelectorAll(".st-color-btn").forEach(function (b) {
          b.classList.toggle("st-color-btn--active", (b.dataset.theme || "") === theme);
        });
        // Spara på aktiv vecka (skippa vid laddning från moln för att slippa eko-loop)
        const s = weeksStore();
        if (s && !state.savingFromWeek) s.patchActive({ color: theme });
        render();
      });
    });
  }

  /* ── Init ────────────────────────────────────────────── */
  function init() {
    StartenSvenska.onBankChange(onBankUpdate);
    StartenSvenska.init();
    StartenSvenska.seedIfEmpty();
    buildColorButtons();
    initColors();

    // Veckostore: prenumerera först, init sist (så onChange fyller UI vid första lyft)
    const s = weeksStore();
    if (s) {
      s.onChange(onWeekChanged);
      s.onListChange(onWeeksListChanged);
      s.init();
    }

    $("#btn-create").addEventListener("click", createWeek);
    $("#btn-edit-sv").addEventListener("click", function () { openEditor("sv"); });
    $("#btn-edit-matte").addEventListener("click", function () { openEditor("matte"); });
    $("#btn-print").addEventListener("click", printBoth);

    $("#edit-close").addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });

    let titleSaveTimer = null;
    let titleRenderTimer = null;
    $("#st-title").addEventListener("input", function () {
      // Debounce moln-spar så vi inte ekar tillbaka mitt i att användaren skriver
      if (titleSaveTimer) clearTimeout(titleSaveTimer);
      titleSaveTimer = setTimeout(function () {
        const s2 = weeksStore();
        if (s2 && !state.savingFromWeek) s2.patchActive({ title: currentTitle() });
      }, 400);
      // Debounce re-render också för smidigare typing
      if (titleRenderTimer) clearTimeout(titleRenderTimer);
      titleRenderTimer = setTimeout(render, 150);
    });

    // Vecko-väljare
    const wsel = $("#week-select");
    if (wsel) {
      wsel.addEventListener("change", function () {
        const s2 = weeksStore(); if (!s2) return;
        s2.setActive(wsel.value || null);
      });
    }
    const newBtn = $("#btn-new-week");
    if (newBtn) newBtn.addEventListener("click", promptNewWeek);

    // Matte
    $("#btn-rand-matte").addEventListener("click", randomizeMatte);
    document.querySelectorAll(".m-setting").forEach(function (el) {
      el.addEventListener("change", function () { regenerateMatte(); render(); });
    });

    // Svenska
    $("#sv-bank-filter").addEventListener("change", renderSvBank);
    $("#own-text").setAttribute("maxlength", String(StartenSvenska.MAX_CHARS));
    $("#own-text").addEventListener("input", updateOwnCount);
    updateOwnCount();
    $("#own-add").addEventListener("click", addOwn);
    ["#gen-subject", "#gen-count", "#gen-age", "#gen-topic"].forEach(function (s) { $(s).addEventListener("input", refreshPrompt); });
    $("#copy-prompt").addEventListener("click", copyPrompt);
    $("#import-btn").addEventListener("click", importResponse);

    // Om ingen WeeksStore finns: rendera ändå (fallback)
    if (!s) render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
