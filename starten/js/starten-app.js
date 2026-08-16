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
  const SUBJ = { svenska: "Berättelse", no: "NO", so: "SO", engelska: "Engelska" };
  function subjLabel(s) { return SUBJ[s] || "Berättelse"; }

  // Cachat matte-ark + ev. dag som redigeras inline.
  // matte = { rows, grade } – speglar veckans matte vid render.
  const state = { matte: null, editingDay: null, savingFromWeek: false };

  function weeksStore() { return window.StartenWeeksStore || null; }

  /* ── Avläsning av kontroller ─────────────────────────── */
  function currentColor() { const b = document.querySelector(".st-color-btn--active"); return b ? (b.dataset.theme || "") : ""; }
  function currentTitle() { const v = ($("#st-title").value || "").trim(); return v || "Starten"; }
  function currentVaxling() { const el = document.querySelector('input[name="m-vaxling"]:checked'); return el && el.value ? el.value : null; }
  function currentUppgiftstyp() { const el = $("#m-type"); return (el && el.value) || "raknesatt"; }
  function readMatteSettings() {
    const ops = [];
    if ($("#m-add").checked) ops.push("add");
    if ($("#m-sub").checked) ops.push("sub");
    if ($("#m-mult").checked) ops.push("mult");
    if ($("#m-div-cell").checked) ops.push("div");
    return {
      uppgiftstyp: currentUppgiftstyp(),
      ops: ops.length ? ops : ["add", "sub", "mult"],
      showDiv: $("#m-div-col").checked,
      vaxling: currentVaxling(),
      grade: parseInt($("#m-grade").value, 10) || 3
    };
  }

  /* ── Generera problem för icke-räknesätt-typer (plugin-baserat) ─ */
  function brakToDisplayText(p) {
    // Konvertera BrakPlugin-resultat till en visnings-sträng som passar i en Starten-cell.
    const qt = p.questionType;
    if (qt === "add-same-den") return p.a + "/" + p.denominator + " + " + p.b + "/" + p.denominator + " =";
    if (qt === "sub-same-den") return p.a + "/" + p.denominator + " − " + p.b + "/" + p.denominator + " =";
    if (qt === "add-diff-den") return p.a.numerator + "/" + p.a.denominator + " + " + p.b.numerator + "/" + p.b.denominator + " =";
    if (qt === "sub-diff-den") return p.a.numerator + "/" + p.a.denominator + " − " + p.b.numerator + "/" + p.b.denominator + " =";
    if (qt === "compare")      return p.a.numerator + "/" + p.a.denominator + "  ?  " + p.b.numerator + "/" + p.b.denominator;
    if (qt === "simplify")     return "Förkorta: " + p.numerator + "/" + p.denominator;
    if (qt === "fraction-of-whole") return p.numerator + "/" + p.denominator + " av " + p.whole + " =";
    if (qt === "to-mixed")     return "Blandat tal: " + p.numerator + "/" + p.denominator;
    if (qt === "name")         return p.nameStyle === "frac-to-word" ? "Vad heter " + p.numerator + "/" + p.denominator + "?" : "Skriv som bråk: " + p.wordName;
    if (qt === "order-same-den" || qt === "order-diff-den") {
      return "Sortera: " + (p.fractions || []).map(function (f) { return f.numerator + "/" + f.denominator; }).join(", ");
    }
    // Fallback: BrakPlugin gav addition (för låga årskurser)
    if (p.operator && p.a != null && p.b != null) return p.a + " " + p.operator + " " + p.b + " =";
    return "Bråk-uppgift";
  }
  function genSingleProblem(type, grade) {
    if (type === "brak" && typeof PluginManager !== "undefined") {
      const plug = PluginManager.get("brak"); if (!plug) return null;
      const p = plug.generate({ grade: grade, brakTypes: [] });
      p.displayText = brakToDisplayText(p);
      p.type = "brak";
      return p;
    }
    if (type === "prioritet" && typeof PluginManager !== "undefined") {
      const plug = PluginManager.get("prioritet"); if (!plug) return null;
      const p = plug.generate({ grade: grade, prioritetOps: ["mult", "div"] });
      p.displayText = (p.expression || "") + "  =";
      p.type = "prioritet";
      return p;
    }
    if (type === "klocka" && typeof PluginManager !== "undefined") {
      const plug = PluginManager.get("klocka"); if (!plug) return null;
      // Generera tills vi får en hanterbar frågetyp för Starten (skippa "diff" som är texttung)
      let p;
      for (let tries = 0; tries < 10; tries++) {
        p = plug.generate({ grade: grade, klockaTypes: ["analog"] });
        if (p && (p.questionType === "read" || p.questionType === "add-minutes")) break;
      }
      if (!p) return null;
      p.type = "klocka";
      p.displayMode = "analog";
      return p;
    }
    return null;
  }
  function generateStartenProblemsForType(type, grade) {
    const rows = [];
    for (let d = 0; d < 5; d++) {
      const upp = [];
      for (let i = 0; i < 4; i++) {
        const p = genSingleProblem(type, grade);
        if (p) upp.push(p);
      }
      // För icke-räknesätt fyller vi alla 4 platser i uppstallningar och har ingen brak-kolumn
      rows.push({ uppstallningar: upp });
    }
    return rows;
  }

  /* ── Matte: generera / byt enskild ruta ──────────────── */
  function regenerateMatte() {
    const m = readMatteSettings();
    let rows;
    if (m.uppgiftstyp === "raknesatt") {
      rows = ArbetsbladStarten.generateStartenProblemsWithOps(m.grade, m.ops, m.showDiv, m.vaxling);
    } else {
      rows = generateStartenProblemsForType(m.uppgiftstyp, m.grade);
    }
    state.matte = {
      rows: rows,
      grade: m.grade,
      uppgiftstyp: m.uppgiftstyp,
      ops: m.ops, showDiv: m.showDiv, vaxling: m.vaxling
    };
    persistMatteToWeek();
  }

  function regenCell(sheetIdx, d, cellIdx) {
    if (!state.matte) return;
    const row = state.matte.rows[d];
    const typ = state.matte.uppgiftstyp || "raknesatt";
    if (typ === "raknesatt") {
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
    } else {
      // Icke-räknesätt: generera ny enskild uppgift av samma typ
      const p = genSingleProblem(typ, state.matte.grade);
      if (p && cellIdx < row.uppstallningar.length) row.uppstallningar[cellIdx] = p;
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
        uppgiftstyp: state.matte.uppgiftstyp || "raknesatt",
        ops: state.matte.ops || [],
        showDiv: !!state.matte.showDiv,
        vaxling: state.matte.vaxling || null,
        rows: state.matte.rows || []
      }
    });
  }

  /* ── Visa rätt sub-settings beroende på uppgiftstyp ────── */
  function syncMatteTypeUI() {
    const typ = currentUppgiftstyp();
    const isRakn = typ === "raknesatt";
    const r = $("#m-raknesatt-wrap"); if (r) r.style.display = isRakn ? "" : "none";
    const d = $("#m-div-col-wrap");   if (d) d.style.display = isRakn ? "" : "none";
    const v = $("#m-vaxling-wrap");   if (v) v.style.display = isRakn ? "" : "none";
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
  function weekLabelFor(w) {
    return "v." + w.week + " " + w.year + (w.name ? " – " + w.name : "");
  }

  function renderWeekSelect() {
    const sel = $("#week-select"); if (!sel) return;
    const s = weeksStore(); if (!s) return;
    const list = s.getList(); // exkluderar arkiverade + filtrerar på vald årskurs
    const activeId = s.getActiveId();

    const gsel = $("#grade-select");
    if (gsel && document.activeElement !== gsel) gsel.value = String(s.getGrade());

    sel.innerHTML = list.map(function (w) {
      return '<option value="' + w.id + '"' + (w.id === activeId ? " selected" : "") + ">" +
             escapeHtml(weekLabelFor(w)) + "</option>";
    }).join("");
    if (!list.length) {
      sel.innerHTML = '<option value="">Ingen vecka för åk ' + s.getGrade() + "</option>";
    }

    // Visa "Arkiverade (N)"-länken om det finns några
    const archived = s.getArchivedList();
    const showBtn = $("#btn-show-archive");
    const countEl = $("#archive-count");
    if (showBtn && countEl) {
      if (archived.length) { showBtn.classList.remove("hidden"); countEl.textContent = archived.length; }
      else { showBtn.classList.add("hidden"); $("#archive-popover").classList.add("hidden"); }
    }
    renderArchiveList();
  }

  function renderArchiveList() {
    const s = weeksStore(); if (!s) return;
    const host = $("#archive-list"); if (!host) return;
    const archived = s.getArchivedList();
    if (!archived.length) {
      host.innerHTML = '<div class="st-archive-empty">Inga arkiverade veckor.</div>';
      return;
    }
    host.innerHTML = archived.map(function (w) {
      return '<div class="st-archive-item"><span>' + escapeHtml(weekLabelFor(w)) + '</span>' +
             '<span class="st-archive-btns">' +
               '<button class="st-restore" data-id="' + w.id + '">Återställ</button>' +
               '<button class="st-delete"  data-id="' + w.id + '" title="Ta bort permanent">🗑</button>' +
             '</span></div>';
    }).join("");
    host.querySelectorAll(".st-restore").forEach(function (btn) {
      btn.addEventListener("click", function () {
        s.unarchiveWeek(btn.dataset.id);
        s.setActive(btn.dataset.id);
        $("#archive-popover").classList.add("hidden");
      });
    });
    host.querySelectorAll(".st-delete").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const id = btn.dataset.id;
        const w = s.getArchivedList().find(function (x) { return x.id === id; });
        const label = w ? weekLabelFor(w) : id;
        if (!confirm('Ta bort "' + label + '" permanent? Detta går inte att ångra.')) return;
        s.deleteWeek(id);
      });
    });
  }

  function archiveActiveWeek() {
    const s = weeksStore(); if (!s) return;
    const cur = s.getActive(); if (!cur || !cur.id) return;
    if (!confirm("Arkivera \"" + weekLabelFor(cur) + "\"? Du kan återställa den senare.")) return;
    s.archiveWeek(cur.id);
    // Växla till första icke-arkiverade vecka (eller skapa nuvarande ISO)
    const list = s.getList();
    if (list.length) { s.setActive(list[0].id); }
    else {
      const p = s.currentIsoParts();
      s.ensureWeek(p.year, p.week, "");
    }
  }

  function openNewWeekForm() {
    const s = weeksStore(); if (!s) return;
    const cur = s.currentIsoParts();
    $("#nw-week").value = String(cur.week);
    $("#nw-year").value = String(cur.year);
    $("#nw-grade").value = String(s.getGrade());
    $("#nw-name").value = "";
    $("#week-row").classList.add("hidden");
    $("#new-week-form").classList.remove("hidden");
    $("#nw-week").focus();
    $("#nw-week").select();
  }
  function closeNewWeekForm() {
    $("#new-week-form").classList.add("hidden");
    $("#week-row").classList.remove("hidden");
  }
  function saveNewWeekForm() {
    const s = weeksStore(); if (!s) return;
    const w = parseInt(($("#nw-week").value || "").trim(), 10);
    const y = parseInt(($("#nw-year").value || "").trim(), 10);
    const g = parseInt($("#nw-grade").value, 10) || s.getGrade();
    const name = ($("#nw-name").value || "").trim();
    if (!w || w < 1 || w > 53) { $("#nw-week").focus(); return; }
    if (!y || y < 2024 || y > 2099) { $("#nw-year").focus(); return; }
    // Skapa först – då finns veckan i listan när vyn byter årskurs, så setGrade
    // behåller den i stället för att auto-skapa en tom vecka för den nya årskursen.
    s.ensureWeek(y, w, name, g);
    s.setGrade(g);
    closeNewWeekForm();
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
      // Läsförståelsens format: en text per dag eller en per vecka
      const fmt = (week && week.svFormat === "vecka") ? "vecka" : "dag";
      const fmtEl = document.querySelector('input[name="sv-format"][value="' + fmt + '"]');
      if (fmtEl) fmtEl.checked = true;
      syncSvFormatUI();
      // Matte: om veckan har sparad matte, ladda den; annars regenerera enligt UI
      if (week && week.matte && Array.isArray(week.matte.rows) && week.matte.rows.length) {
        state.matte = {
          rows: week.matte.rows,
          grade: week.matte.grade || 3,
          uppgiftstyp: week.matte.uppgiftstyp || "raknesatt",
          ops: week.matte.ops || [],
          showDiv: !!week.matte.showDiv,
          vaxling: week.matte.vaxling || null
        };
        // Synka matte-kontrollerna
        const gradeEl = $("#m-grade"); if (gradeEl) gradeEl.value = String(state.matte.grade);
        const typeEl = $("#m-type");   if (typeEl)  typeEl.value  = state.matte.uppgiftstyp;
        const ops = state.matte.ops || [];
        $("#m-add").checked = ops.indexOf("add") !== -1;
        $("#m-sub").checked = ops.indexOf("sub") !== -1;
        $("#m-mult").checked = ops.indexOf("mult") !== -1;
        $("#m-div-cell").checked = ops.indexOf("div") !== -1;
        $("#m-div-col").checked = !!state.matte.showDiv;
        const vax = state.matte.vaxling || "";
        const r = document.querySelector('input[name="m-vaxling"][value="' + vax + '"]');
        if (r) r.checked = true;
        syncMatteTypeUI();
      } else {
        // Veckan saknar matte – låt veckans årskurs sätta mattenivån som utgångspunkt.
        const s2 = weeksStore();
        const wg = (s2 && week) ? s2.weekGrade(week) : null;
        const gEl = $("#m-grade");
        if (wg && gEl) gEl.value = String(wg);
        // Flagga för att regenerera EFTER att savingFromWeek nollställts.
        needRegenerate = true;
      }
      renderWeekSelect();
    } finally {
      state.savingFromWeek = false;
    }
    if (needRegenerate) regenerateMatte(); // sparar matten på veckan
    render();
    refreshSv();
    refreshVt();
  }

  function onWeeksListChanged() { renderWeekSelect(); }

  /* ── Klass-lista (global, localStorage) ──────────────── */
  const KEY_CLASSES = "starten.classes.v1";
  function readJson(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (e) { return fb; } }
  function writeJson(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function getClasses() { return readJson(KEY_CLASSES, []); }
  function setClasses(list) { writeJson(KEY_CLASSES, list); }

  function renderClassesList() {
    const host = $("#classes-list"); if (!host) return;
    const list = getClasses();
    if (!list.length) { host.innerHTML = ""; return; }
    host.innerHTML = list.map(function (c, i) {
      return '<div class="st-classes-item">' +
        '<span><span class="st-class-info">' + escapeHtml(c.name) + '</span>' +
        '<span class="st-class-meta">' + c.students + ' elever</span></span>' +
        '<button class="st-class-del" data-i="' + i + '" title="Ta bort">✕</button>' +
        '</div>';
    }).join("");
    host.querySelectorAll(".st-class-del").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const arr = getClasses();
        arr.splice(parseInt(btn.dataset.i, 10), 1);
        setClasses(arr);
        renderClassesList();
      });
    });
  }

  function addClass() {
    const name = ($("#class-name").value || "").trim();
    const students = parseInt(($("#class-students").value || "").trim(), 10);
    if (!name) { $("#class-name").focus(); return; }
    if (!students || students < 1 || students > 40) { $("#class-students").focus(); return; }
    const arr = getClasses();
    arr.push({ name: name, students: students });
    setClasses(arr);
    $("#class-name").value = "";
    $("#class-students").value = "";
    $("#class-name").focus();
    renderClassesList();
  }

  /* ── Klass-utskrift: separator + N elever per klass ──── */
  function printClasses() {
    const classes = getClasses();
    if (!classes.length) { alert("Lägg till minst en klass först."); return; }
    const w = wrap();
    if (!w || w.classList.contains("hidden") || !w.children.length) render();
    const sheetContent = wrap().innerHTML; // svenska + matte för en elev

    // Bygg printable HTML: per klass = separator + tom + (svenska + matte) × N elever
    let content = "";
    classes.forEach(function (c) {
      content += '<div class="ab-sheet st-sep-sheet"><div class="st-sep-text">' + escapeHtml(c.name) + '</div></div>';
      content += '<div class="ab-sheet st-blank-sheet"></div>';
      for (let i = 0; i < c.students; i++) content += sheetContent;
    });

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
    $("#edit-title").textContent = isSv ? "Redigera läsförståelse" : "Redigera matte";
    panel.classList.toggle("st-panel--left", isSv);
    panel.classList.toggle("st-panel--right", !isSv);
    $("#tab-sv").classList.toggle("hidden", !isSv);
    $("#tab-matte").classList.toggle("hidden", isSv);
    panel.classList.remove("hidden");
    // Skjut förhandsvisningen åt motsatt håll så arken syns medan man redigerar
    document.body.classList.toggle("edit-left", isSv);
    document.body.classList.toggle("edit-right", !isSv);
    if (isSv) { syncSvFormatUI(); refreshSv(); refreshVt(); refreshPrompt(); }
  }
  function closePanel() {
    $("#edit-panel").classList.add("hidden");
    document.body.classList.remove("edit-left", "edit-right");
    state.editingDay = null;
  }

  /* ── Läsförståelse: dag- eller veckoformat ───────────── */
  function currentSvFormat() {
    const el = document.querySelector('input[name="sv-format"]:checked');
    return (el && el.value === "vecka") ? "vecka" : "dag";
  }

  function syncSvFormatUI() {
    const isWeek = currentSvFormat() === "vecka";
    document.querySelectorAll(".st-dag-only").forEach(function (el) { el.classList.toggle("hidden", isWeek); });
    document.querySelectorAll(".st-vt-only").forEach(function (el) { el.classList.toggle("hidden", !isWeek); });
    refreshPrompt();
  }

  let vtSaveTimer = null;

  function renderVtQuestions() {
    const host = $("#vt-questions"); if (!host) return;
    const vt = StartenSvenska.getWeekText();
    host.innerHTML = StartenSvenska.DAYS.map(function (d, i) {
      return '<label class="st-vt-qrow"><span class="st-vt-qday">' + d + "</span>" +
        '<input type="text" class="st-input st-input--sm vt-q" maxlength="140" value="' +
        escapeHtml(vt.questions[i] || "") + '"></label>';
    }).join("");
    host.querySelectorAll(".vt-q").forEach(function (inp) {
      inp.addEventListener("input", scheduleVtSave);
    });
  }

  function updateVtCount() {
    const max = StartenSvenska.WEEK_MAX_CHARS;
    const n = ($("#vt-text").value || "").length;
    const paras = ($("#vt-text").value || "").split(/\n\s*\n/).filter(function (p) { return p.trim(); }).length;
    $("#vt-count").textContent = n + " / " + max + " tecken · " + paras + " stycken";
    $("#vt-count").style.color = n >= max ? "#dc2626" : "";
  }

  // Debounce – annars blir varje tangenttryck en molnskrivning.
  function scheduleVtSave() {
    updateVtCount();
    if (vtSaveTimer) clearTimeout(vtSaveTimer);
    vtSaveTimer = setTimeout(function () {
      StartenSvenska.setWeekText({
        title: $("#vt-title").value,
        text: $("#vt-text").value,
        questions: Array.prototype.map.call(
          document.querySelectorAll("#vt-questions .vt-q"),
          function (i) { return i.value; })
      });
      render();
    }, 400);
  }

  // Bygg inte om fälten medan användaren skriver i dem.
  function refreshVt() {
    const sec = $("#sv-vt-details");
    if (sec && sec.contains(document.activeElement)) { updateVtCount(); return; }
    const vt = StartenSvenska.getWeekText();
    $("#vt-title").value = vt.title;
    $("#vt-text").value = vt.text;
    renderVtQuestions();
    updateVtCount();
  }

  function importWeekText() {
    const fb = $("#import-feedback");
    const vt = StartenPrompt.parseWeekResponse($("#import-input").value);
    if (!vt || !vt.text) {
      fb.textContent = "Kunde inte tolka svaret (förväntar JSON med text och questions).";
      fb.className = "st-feedback st-feedback--err";
      return;
    }
    const s = weeksStore();
    if (!s || !s.getActive() || !s.getActive().id) {
      fb.textContent = "Ingen vecka är vald.";
      fb.className = "st-feedback st-feedback--err";
      return;
    }
    const over = vt.text.length - StartenSvenska.WEEK_MAX_CHARS;
    StartenSvenska.setWeekText(vt);
    fb.textContent = "Veckans text inlagd (" + Math.min(vt.text.length, StartenSvenska.WEEK_MAX_CHARS) +
      " tecken, " + vt.questions.length + " frågor)" +
      (over > 0 ? " – texten var " + over + " tecken för lång och kortades" : "") + ".";
    fb.className = over > 0 ? "st-feedback" : "st-feedback st-feedback--ok";
    $("#import-input").value = "";
    refreshVt();
    render();
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
        const maxC = StartenSvenska.MAX_CHARS;
        row.innerHTML =
          '<div class="st-day-head"><strong>' + dayName + "</strong></div>" +
          '<div class="st-form">' +
            '<select class="ed-subject st-input st-input--sm">' +
              '<option value="svenska">Berättelse</option><option value="no">NO</option>' +
              '<option value="so">SO</option><option value="engelska">Engelska</option></select>' +
            '<textarea class="ed-text st-input" rows="3" placeholder="Text" maxlength="' + maxC + '"></textarea>' +
            '<span class="ed-count st-muted st-count"></span>' +
            '<input class="ed-question st-input" type="text" placeholder="Fråga">' +
            '<div class="st-form-actions"><button class="ed-save st-btn st-btn--primary st-btn--sm">Spara</button>' +
            '<button class="ed-cancel st-btn st-btn--ghost st-btn--sm">Avbryt</button></div>' +
          "</div>";
        if (c) {
          row.querySelector(".ed-subject").value = c.subject || "svenska";
          row.querySelector(".ed-text").value = c.text || "";
          row.querySelector(".ed-question").value = (c.questions && c.questions[0]) || "";
        }
        const textEl = row.querySelector(".ed-text");
        const countEl = row.querySelector(".ed-count");
        function updateCount() {
          const n = textEl.value.length;
          countEl.textContent = n + " / " + maxC + " tecken";
          countEl.style.color = n >= maxC ? "#dc2626" : "";
        }
        textEl.addEventListener("input", updateCount);
        updateCount();
        row.querySelector(".ed-save").addEventListener("click", function () {
          const text = textEl.value.trim();
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
  // Ikryssade ämnen i rutnätsfiltret. Tom lista = inget filter = allt visas.
  function bankFilterSubjects() {
    const boxes = document.querySelectorAll("#sv-bank-filters input:checked");
    return Array.prototype.map.call(boxes, function (b) { return b.value; });
  }

  function dayKey(iso) { return String(iso || "").slice(0, 10); }

  // Vilken vecka/årskurs en text ska antecknas på när den placeras på en dag.
  function currentWeekStamp() {
    const s = weeksStore();
    const w = s && s.getActive();
    if (!w || !w.id) return null;
    return { grade: s.weekGrade(w), year: w.year, week: w.week };
  }

  // Bara den egna årskursen visas. Att en annan årskurs använt texten säger
  // inget om de här eleverna, och skulle märka upp nästan hela banken med tiden.
  // Blå ◆ = redan använd i veckan man står i (risk för samma text två dagar).
  // Röd ● = använd av samma årskurs en annan vecka – information, inget hinder.
  function usageMark(usage, stamp) {
    if (!usage.length || !stamp) return "";
    const mine = usage.filter(function (u) { return u.grade === stamp.grade; });
    if (!mine.length) return "";
    const here = mine.some(function (u) { return u.year === stamp.year && u.week === stamp.week; });
    const all = mine.map(function (u) { return "v." + u.week + " " + u.year; }).join(", ");
    const title = (here ? "Redan använd den här veckan · " : "Använd av åk " + stamp.grade + ": ") +
      all + " — klicka för att rensa";
    return '<span class="st-used' + (here ? " st-used--here" : "") + '" title="' +
      escapeHtml(title) + '">' + (here ? "◆" : "●") + "</span>";
  }

  function dateHeading(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "Utan datum";
    const midnight = function (x) { return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(); };
    const diff = Math.round((midnight(new Date()) - midnight(d)) / 86400000);
    if (diff === 0) return "Idag";
    if (diff === 1) return "Igår";
    return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
  }

  function renderSvBank() {
    const subjects = bankFilterSubjects();
    const all = StartenSvenska.getBank();
    const bank = subjects.length
      ? all.filter(function (e) { return subjects.indexOf(e.subject) !== -1; })
      : all.slice();
    // Nyast först – createdAt är ISO-strängar, så lexikografisk jämförelse räcker.
    bank.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });

    $("#sv-bank-count").textContent = all.length;
    const clearBtn = $("#sv-bank-clear");
    if (clearBtn) clearBtn.classList.toggle("hidden", !subjects.length);
    const hint = document.querySelector(".st-filter-hint");
    if (hint) hint.textContent = subjects.length
      ? bank.length + " av " + all.length + " visas"
      : "Inget ikryssat = alla visas";

    const host = $("#sv-bank"); host.innerHTML = "";
    if (!bank.length) { host.innerHTML = '<p class="st-muted">Inga texter.</p>'; return; }

    const stamp = currentWeekStamp();
    let lastDay = null;
    bank.forEach(function (e) {
      const key = dayKey(e.createdAt);
      if (key !== lastDay) {
        lastDay = key;
        const head = document.createElement("div");
        head.className = "st-bank-date";
        head.textContent = dateHeading(e.createdAt);
        host.appendChild(head);
      }
      const item = document.createElement("div");
      item.className = "st-bank-item";
      const dayOpts = StartenSvenska.DAYS.map(function (d, i) { return '<option value="' + i + '">' + d + "</option>"; }).join("");
      const usedMark = usageMark(Array.isArray(e.usage) ? e.usage : [], stamp);
      item.innerHTML =
        '<div class="st-bank-text">' + usedMark + '<span class="st-badge">' + subjLabel(e.subject) + "</span> " + escapeHtml(e.text) + "</div>" +
        '<div class="st-bank-actions">' +
          '<select class="use-day st-input st-input--sm">' + dayOpts + "</select>" +
          '<button data-act="use" class="st-btn st-btn--ghost st-btn--sm">Använd</button>' +
          '<button data-act="del" class="st-del">Ta bort</button>' +
        "</div>";
      item.querySelector('[data-act="use"]').addEventListener("click", function () {
        const i = parseInt(item.querySelector(".use-day").value, 10);
        StartenSvenska.setDay(i, e);
        StartenSvenska.markUsed([e.id], currentWeekStamp());
        render(); renderSvDays(); renderSvBank();
      });
      item.querySelector('[data-act="del"]').addEventListener("click", function () {
        StartenSvenska.removeFromBank(e.id); renderSvBank();
      });
      const usedEl = item.querySelector(".st-used");
      if (usedEl) usedEl.addEventListener("click", function () {
        if (!confirm("Rensa markeringen om att den här texten redan använts?")) return;
        StartenSvenska.clearUsage(e.id); renderSvBank();
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
    const added = StartenSvenska.addToBank([{ subject: $("#own-subject").value, text: text, questions: [q], source: "manual" }], "manual").length;
    if (added) {
      $("#own-text").value = ""; $("#own-question").value = "";
      fb.textContent = "Tillagd!"; fb.className = "st-feedback st-feedback--ok";
    } else { fb.textContent = "Texten finns redan."; fb.className = "st-feedback"; }
    renderSvBank();
  }

  /* ── Svenska: AI ─────────────────────────────────────── */
  function refreshPrompt() {
    const opts = {
      subject: $("#gen-subject").value, count: $("#gen-count").value,
      numQuestions: 1, age: $("#gen-age").value, topic: $("#gen-topic").value
    };
    $("#prompt-output").value = currentSvFormat() === "vecka"
      ? StartenPrompt.buildWeek(opts)
      : StartenPrompt.build(opts);
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
    const added = StartenSvenska.addToBank(parsed, "ai").length;
    const skipped = parsed.length - added;
    fb.textContent = "Importerade " + added + (skipped ? " (" + skipped + " dubbletter)" : "") + ".";
    fb.className = "st-feedback st-feedback--ok";
    if (added) $("#import-input").value = "";
    renderSvBank();
  }

  // Genvägen: AI-svaret rakt ner på måndag–fredag utan omvägen via banken.
  function importToDays() {
    const fb = $("#import-feedback");
    const parsed = StartenPrompt.parseResponse($("#import-input").value);
    if (!parsed.length) {
      fb.textContent = "Kunde inte tolka svaret (förväntar JSON).";
      fb.className = "st-feedback st-feedback--err";
      return;
    }
    const s = weeksStore();
    const active = s && s.getActive();
    if (!active || !active.id) {
      fb.textContent = "Ingen vecka är vald.";
      fb.className = "st-feedback st-feedback--err";
      return;
    }
    const days = StartenSvenska.DAYS;
    const use = parsed.slice(0, days.length);
    // Skriv inte över befintliga texter utan att fråga.
    const week = StartenSvenska.getWeek();
    const occupied = (week.days || []).slice(0, use.length).some(Boolean);
    if (occupied && !confirm("Det finns redan texter på de dagarna. Ersätta dem?")) return;

    // Texterna sparas även i banken, så de går att återanvända av en annan
    // årskurs – och kan märkas som använda den här veckan.
    const entries = StartenSvenska.bankAndResolve(use, "ai");
    const n = StartenSvenska.setDays(entries.map(function (e, i) { return e || use[i]; }), "ai");
    StartenSvenska.markUsed(entries.slice(0, n).map(function (e) { return e && e.id; }), currentWeekStamp());

    const range = n === 1
      ? days[0].toLowerCase()
      : days[0].toLowerCase() + "–" + days[n - 1].toLowerCase();
    const over = parsed.length - n;
    fb.textContent = "Lade " + n + (n === 1 ? " text på " : " texter på ") + range +
      " och sparade dem i banken" + (over ? " (" + over + " över, används inte)" : "") + ".";
    fb.className = "st-feedback st-feedback--ok";
    $("#import-input").value = "";
    refreshSv();
    render();
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

    $("#btn-edit-sv").addEventListener("click", function () { openEditor("sv"); });
    $("#btn-edit-matte").addEventListener("click", function () { openEditor("matte"); });
    $("#btn-rand-sv").addEventListener("click", randomizeSvenska);

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
        const s2 = weeksStore(); if (!s2 || !wsel.value) return;
        s2.setActive(wsel.value);
      });
    }
    const gsel = $("#grade-select");
    if (gsel) {
      gsel.addEventListener("change", function () {
        const s2 = weeksStore(); if (!s2) return;
        s2.setGrade(gsel.value);
      });
    }
    const newBtn = $("#btn-new-week");
    if (newBtn) newBtn.addEventListener("click", openNewWeekForm);
    const archBtn = $("#btn-archive-week");
    if (archBtn) archBtn.addEventListener("click", archiveActiveWeek);
    const showArchBtn = $("#btn-show-archive");
    if (showArchBtn) showArchBtn.addEventListener("click", function () {
      $("#archive-popover").classList.toggle("hidden");
    });
    $("#archive-close").addEventListener("click", function () { $("#archive-popover").classList.add("hidden"); });
    $("#nw-save").addEventListener("click", saveNewWeekForm);
    $("#nw-cancel").addEventListener("click", closeNewWeekForm);

    // Skriv ut-meny
    $("#btn-print").addEventListener("click", function (e) {
      e.stopPropagation();
      $("#print-menu").classList.toggle("hidden");
    });
    $("#print-single").addEventListener("click", function () {
      $("#print-menu").classList.add("hidden");
      printBoth();
    });
    $("#print-classes-open").addEventListener("click", function () {
      $("#print-menu").classList.add("hidden");
      renderClassesList();
      $("#classes-popover").classList.remove("hidden");
    });
    // Stäng menyn vid klick utanför
    document.addEventListener("click", function (e) {
      const wrap = e.target.closest(".st-print-wrap");
      if (!wrap) $("#print-menu").classList.add("hidden");
    });

    // Klass-popover
    $("#classes-close").addEventListener("click", function () { $("#classes-popover").classList.add("hidden"); });
    $("#class-add").addEventListener("click", addClass);
    ["#class-name", "#class-students"].forEach(function (sel) {
      $(sel).addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addClass(); } });
    });
    $("#classes-print").addEventListener("click", printClasses);
    // Enter i formulärfälten = spara, Escape = avbryt
    ["#nw-week", "#nw-year", "#nw-name"].forEach(function (sel) {
      $(sel).addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); saveNewWeekForm(); }
        else if (e.key === "Escape") { e.preventDefault(); closeNewWeekForm(); }
      });
    });

    // Matte
    $("#btn-rand-matte").addEventListener("click", randomizeMatte);
    document.querySelectorAll(".m-setting").forEach(function (el) {
      el.addEventListener("change", function () { syncMatteTypeUI(); regenerateMatte(); render(); });
    });
    syncMatteTypeUI();

    // Svenska
    $("#sv-bank-filters").addEventListener("change", renderSvBank);
    $("#sv-bank-clear").addEventListener("click", function () {
      document.querySelectorAll("#sv-bank-filters input:checked").forEach(function (b) { b.checked = false; });
      renderSvBank();
    });
    $("#own-text").setAttribute("maxlength", String(StartenSvenska.MAX_CHARS));
    $("#own-text").addEventListener("input", updateOwnCount);
    updateOwnCount();
    $("#own-add").addEventListener("click", addOwn);
    ["#gen-subject", "#gen-count", "#gen-age", "#gen-topic"].forEach(function (s) { $(s).addEventListener("input", refreshPrompt); });
    $("#copy-prompt").addEventListener("click", copyPrompt);
    $("#import-days-btn").addEventListener("click", importToDays);
    $("#import-btn").addEventListener("click", importResponse);
    $("#import-vt-btn").addEventListener("click", importWeekText);

    // Läsförståelsens format (dag / vecka)
    document.querySelectorAll('input[name="sv-format"]').forEach(function (r) {
      r.addEventListener("change", function () {
        syncSvFormatUI();
        if (!state.savingFromWeek) StartenSvenska.setSvFormat(currentSvFormat());
        refreshVt();
        render();
      });
    });
    $("#vt-title").addEventListener("input", scheduleVtSave);
    $("#vt-text").addEventListener("input", scheduleVtSave);

    // Om ingen WeeksStore finns: rendera ändå (fallback)
    if (!s) render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
