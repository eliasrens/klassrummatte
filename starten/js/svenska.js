/* Starten – svensk-delen (idébank + veckodata + ark-renderare).
   Flyttad från startenskola-projektet och paketerad som ett .ab-sheet så att
   den kan skrivas ut tillsammans med matte-arket. Stateless mot DOM förutom renderSheet. */
window.StartenSvenska = (function () {
  "use strict";

  const DAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];
  // Teckengräns per text – avstämd så att en hel sida med maxlånga texter ryms vid 16px.
  const MAX_CHARS = 250;
  window.STARTEN_MAX_CHARS = MAX_CHARS;
  const FIXED_SV = "Ett ord från texten som jag vill lära mig:";
  const FIXED_EN = "A word from the text I want to learn:";
  // Veckotext-läget: EN text för hela veckan. Kortare etikett eftersom den
  // upprepas fem gånger i en smalare spalt. Teckentaket är uppmätt mot arket.
  const WEEK_FIXED = "Ett ord jag vill lära mig:";
  const WEEK_MAX_CHARS = 1400;
  window.STARTEN_WEEK_MAX_CHARS = WEEK_MAX_CHARS;

  const KEY_BANK = "starten.bank.v1";
  // KEY_WEEK (legacy) hanteras nu av StartenWeeksStore (migreras till `weeks`-collection).

  const SEED = [
    { subject: "svenska", text: "Djupt inne i den täta skogen stod ett gammalt, övergivet trätorn. Ingen hade bott där på över hundra år, men i morse syntes plötsligt en tunn strimma rök stiga från skorstenen. Fåglarna tystnade som om de väntade på något.", questions: ["Vad hände vid tornet i morse som var ovanligt?"] },
    { subject: "svenska", text: "Kapten Nemo blickade ut över det stormiga havet. Hans stolta skepp krängde kraftigt i de enorma vågorna. Men djupt nere i det mörka lastutrymmet låg den hemliga kartan helt säker i en fastlåst järnkista.", questions: ["Varför behövde kaptenen inte oroa sig för kartan?"] },
    { subject: "svenska", text: "Maya knöt sina löparskor extra hårt den här morgonen. Idag var dagen då hon äntligen skulle försöka slå det gamla skolrekordet på sextio meter. När startskottet brann av flög hon fram över löparbanan som en pil.", questions: ["Vilket mål hade Maya med dagens löpning?"] },
    { subject: "svenska", text: "Robotfågeln Kvittra landade på fönsterbrädan med ett svagt, surrande ljud. Hennes mekaniska ögon lyste i en skarp blå färg. Det betydde att hon bar på ett brådskande meddelande som måste levereras direkt.", questions: ["Vad avslöjade att Kvittras meddelande var viktigt?"] },
    { subject: "svenska", text: "I bageriet på hörnet doftade det fantastiskt av nymalda kardemummakärnor. Bagaren Lukas hade varit vaken sedan klockan tre på natten för att hinna få de magiska fredagsbullarna helt klara i tid.", questions: ["Varför började bagaren arbeta mitt i natten?"] }
  ];

  function uid() { return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }
  function read(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (e) { return fb; } }
  function write(key, v) { localStorage.setItem(key, JSON.stringify(v)); }
  function escapeHtml(s) {
    return (s == null ? "" : String(s)).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fixedFor(subject) { return subject === "engelska" ? FIXED_EN : FIXED_SV; }

  function normalize(raw, source) {
    if (!raw || !raw.text) return null;
    const text = String(raw.text).trim();
    let qs = Array.isArray(raw.questions) ? raw.questions : (raw.question ? [raw.question] : []);
    qs = qs.map(function (q) { return String(q || "").trim(); }).filter(Boolean);
    if (!text || !qs.length) return null;
    const subject = String(raw.subject || "svenska").toLowerCase();
    return {
      id: raw.id || uid(),
      subject: ["svenska", "no", "so", "engelska"].indexOf(subject) !== -1 ? subject : "svenska",
      text: text, questions: qs,
      // Alltid nuvarande version – gamla bank-poster får ny label automatiskt.
      fixedField: fixedFor(subject),
      source: source || raw.source || "manual",
      createdAt: raw.createdAt || new Date().toISOString(),
      // [{ grade, year, week }] – var texten redan använts. Måste med här,
      // annars strippas fältet bort när bank-snapshoten normaliseras.
      usage: Array.isArray(raw.usage) ? raw.usage : []
    };
  }

  /* ---- Idébank (Firestore-realtid + lokal cache) ---- */
  function cloudDb() { return (window.StartenFirebase && window.StartenFirebase.db) || null; }
  let bankCache = read(KEY_BANK, []);        // init från lokal spegel (snabb paint / offline)
  let pendingMigration = read(KEY_BANK, []); // lokala texter att flytta till molnet vid första seed
  let bankChangeCb = null;
  let seeded = false;

  function getBank() { return bankCache; }
  function onBankChange(cb) { bankChangeCb = cb; }
  function emitBank() { write(KEY_BANK, bankCache); if (bankChangeCb) bankChangeCb(); }

  function subscribeBank() {
    const db = cloudDb();
    if (!db) return; // lokalt läge – bankCache kommer från localStorage
    db.collection("bank").orderBy("createdAt").onSnapshot(function (snap) {
      bankCache = snap.docs.map(function (d) {
        const data = d.data() || {};
        return normalize(Object.assign({ id: d.id }, data), data.source);
      }).filter(Boolean);
      emitBank();
      // Första gången: tom collection → seeda (migrera lokala texter, annars startinnehåll)
      if (snap.empty && !seeded) {
        seeded = true;
        const src = (pendingMigration && pendingMigration.length) ? pendingMigration : SEED;
        pendingMigration = null;
        addToBank(src, null);
      }
    }, function (err) { console.warn("[Starten] bank-prenumeration fel:", err); });
  }

  // Returnerar de poster som faktiskt lades till (inte bara antalet), så anropare
  // kan följa upp med t.ex. markUsed. Doc-id sätts explicit till postens id –
  // annars är id:t okänt tills snapshoten kommit tillbaka.
  function addToBank(rawList, source) {
    const db = cloudDb();
    const seen = new Set(bankCache.map(function (e) { return e.text.trim().toLowerCase(); }));
    const added = [];
    rawList.forEach(function (raw) {
      const e = normalize(raw, source); if (!e) return;
      const fp = e.text.trim().toLowerCase(); if (seen.has(fp)) return;
      seen.add(fp); added.push(e);
      const payload = { subject: e.subject, text: e.text, questions: e.questions, fixedField: e.fixedField, source: e.source, createdAt: e.createdAt };
      if (db) { // snapshot uppdaterar cachen
        db.collection("bank").doc(e.id).set(payload)
          .catch(function (err) { console.error("[Starten] text kunde inte sparas i banken:", (err && err.code) || "", err); });
      } else { bankCache.push(e); }
    });
    if (!db && added.length) emitBank();
    return added;
  }

  // Lägger texterna i banken vid behov och returnerar motsvarande bankposter,
  // även för texter som redan fanns (dedupas på texten).
  function bankAndResolve(rawList, source) {
    const added = addToBank(rawList, source);
    const byText = {};
    bankCache.concat(added).forEach(function (e) { byText[e.text.trim().toLowerCase()] = e; });
    return rawList.map(function (raw) {
      const n = normalize(raw, source);
      return n ? (byText[n.text.trim().toLowerCase()] || null) : null;
    });
  }

  // Antecknar att texten använts av en viss årskurs en viss vecka.
  // Dubbletter på (årskurs, år, vecka) hoppas över så listan inte växer vid omtryck.
  function markUsed(ids, stampIn) {
    if (!stampIn || !ids || !ids.length) return;
    const db = cloudDb();
    const stamp = {
      grade: stampIn.grade || null,
      year: parseInt(stampIn.year, 10) || 0,
      week: parseInt(stampIn.week, 10) || 0
    };
    let touchedLocal = false;
    ids.filter(Boolean).forEach(function (id) {
      const e = bankCache.filter(function (x) { return x.id === id; })[0];
      const list = (e && Array.isArray(e.usage)) ? e.usage.slice() : [];
      const dup = list.some(function (u) {
        return u.grade === stamp.grade && u.year === stamp.year && u.week === stamp.week;
      });
      if (dup) return;
      list.push(stamp);
      if (list.length > 12) list.splice(0, list.length - 12); // tak – reglerna har storleksgräns
      if (db) {
        db.collection("bank").doc(id).set({ usage: list }, { merge: true })
          .catch(function (err) { console.error("[Starten] användning kunde inte sparas:", (err && err.code) || "", err); });
      } else if (e) { e.usage = list; touchedLocal = true; }
    });
    if (touchedLocal) emitBank();
  }

  // Nollställer användningsmarkeringen. Behövs eftersom anteckningen inte är
  // kopplad till veckodokumentet och alltså överlever att veckan raderas.
  function clearUsage(id) {
    const db = cloudDb();
    if (db) {
      db.collection("bank").doc(id).set({ usage: [] }, { merge: true })
        .catch(function (err) { console.error("[Starten] kunde inte rensa användning:", (err && err.code) || "", err); });
    } else {
      const e = bankCache.filter(function (x) { return x.id === id; })[0];
      if (e) { e.usage = []; emitBank(); }
    }
  }

  function removeFromBank(id) {
    const db = cloudDb();
    if (db) { db.collection("bank").doc(id).delete().catch(function (e) { console.warn(e); }); }
    else { bankCache = bankCache.filter(function (x) { return x.id !== id; }); emitBank(); }
  }

  /* ---- Vecka (delegerar till StartenWeeksStore) ---- */
  // EMPTY_DAYS används bara som return-fallback innan WeeksStore har laddat.
  const EMPTY_WEEK = { id: "", weekLabel: "", days: [null, null, null, null, null], title: "Starten", color: "", matte: null };

  function store() { return window.StartenWeeksStore || null; }

  function getWeek() {
    const s = store();
    const w = s && s.getActive();
    if (!w) return Object.assign({}, EMPTY_WEEK);
    // Backåtkomp: ge weekLabel om läsare letar efter det fältet.
    if (!w.weekLabel) w.weekLabel = s.weekLabel({ year: w.year, week: w.week });
    return w;
  }
  function saveWeek(w) {
    const s = store();
    if (!s) return;
    s.save(w);
  }

  function randomizeWeek() {
    const pool = getBank().slice();
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    const week = getWeek();
    if (!week.id) return week;
    week.days = DAYS.map(function (_, i) { return pool.length ? Object.assign({}, pool[i % pool.length]) : null; });
    saveWeek(week);
    return week;
  }

  function setDay(i, raw) {
    const week = getWeek();
    if (!week.id) return;
    week.days[i] = raw ? normalize(raw, raw.source) : null;
    saveWeek(week);
  }

  // Sätter flera dagar från början i EN skrivning. Att loopa setDay hade gett
  // en molnskrivning och en omrendering per dag. Överskjutande texter ignoreras.
  // Returnerar antalet dagar som fylldes.
  function setDays(list, source) {
    const week = getWeek();
    if (!week.id) return 0;
    const n = Math.min((list || []).length, DAYS.length);
    for (let i = 0; i < n; i++) {
      week.days[i] = list[i] ? normalize(list[i], list[i].source || source || null) : null;
    }
    saveWeek(week);
    return n;
  }

  /* ---- Veckotext-läget (en text/vecka) ---- */
  function getSvFormat() {
    const w = getWeek();
    return w && w.svFormat === "vecka" ? "vecka" : "dag";
  }
  function setSvFormat(f) {
    const s = store(); if (!s) return;
    const w = getWeek(); if (!w.id) return;
    s.patchActive({ svFormat: f === "vecka" ? "vecka" : "dag" });
  }
  function getWeekText() {
    const vt = (getWeek() || {}).veckotext || {};
    const qs = Array.isArray(vt.questions) ? vt.questions.slice(0, DAYS.length) : [];
    while (qs.length < DAYS.length) qs.push("");
    return { title: String(vt.title || ""), text: String(vt.text || ""), questions: qs };
  }
  function setWeekText(patch) {
    const s = store(); if (!s) return;
    const w = getWeek(); if (!w.id) return;
    const cur = getWeekText();
    const next = {
      title: String(patch.title != null ? patch.title : cur.title).slice(0, 60),
      text: String(patch.text != null ? patch.text : cur.text).slice(0, WEEK_MAX_CHARS),
      questions: (patch.questions != null ? patch.questions : cur.questions)
        .slice(0, DAYS.length).map(function (q) { return String(q || ""); })
    };
    while (next.questions.length < DAYS.length) next.questions.push("");
    s.patchActive({ veckotext: next });
  }

  function init() { subscribeBank(); }

  function seedIfEmpty() {
    // Bank: i molnläge seedas den av subscribeBank (tom collection). Lokalt läge:
    if (!cloudDb() && !bankCache.length) { addToBank(SEED, null); }
    // Vecka hanteras av StartenWeeksStore (init skapar nuvarande ISO-vecka vid behov).
  }

  /* ---- Ark-rendering (som .ab-sheet) ---- */
  function sheetHeader(title) {
    return '<header class="ab-header starten-header">' +
      '<div class="ab-header-left"><div class="ab-title">' + escapeHtml(title || "Starten") + "</div></div>" +
      '<div class="ab-header-fields"><div><div class="ab-field-label">Namn:</div>' +
      '<div class="ab-field-line">&nbsp;</div></div></div>' +
      "</header>";
  }

  // Veckotext: hela veckans text i vänsterspalten, en fråga + en ordrad per dag
  // till höger. Dagblocken delar höjden lika så ordraderna hamnar jämnt.
  function renderWeekTextSheet(wrap, opts) {
    const vt = getWeekText();
    const color = opts.color || "";

    const sheet = document.createElement("div");
    sheet.className = "ab-sheet st-vt-sheet" + (color ? " starten-" + color : "");
    const inner = document.createElement("div");
    inner.className = "ab-sheet-inner";

    const paras = vt.text.split(/\n+/).map(function (p) { return p.trim(); }).filter(Boolean);
    const textHtml = paras.length
      ? paras.map(function (p) { return "<p>" + escapeHtml(p) + "</p>"; }).join("")
      : '<p class="st-sv-empty">— ingen text ännu —</p>';

    let daysHtml = "";
    DAYS.forEach(function (dayName, i) {
      const q = vt.questions[i]
        ? escapeHtml(vt.questions[i])
        : '<span class="st-sv-empty">— ingen fråga —</span>';
      daysHtml +=
        '<div class="st-vt-day">' +
          '<div class="st-sv-dayname">' + escapeHtml(dayName) + "</div>" +
          '<p class="st-sv-question">' + q + "</p>" +
          '<div class="st-sv-writeline"></div><div class="st-sv-writeline"></div>' +
          '<div class="st-vt-word"><span class="st-vt-word-label">' + escapeHtml(WEEK_FIXED) +
            '</span><span class="st-vt-word-line"></span></div>' +
        "</div>";
    });

    inner.innerHTML = sheetHeader(opts.title) +
      '<div class="st-vt-body">' +
        '<div class="st-vt-textcol">' +
          (vt.title ? '<h2 class="st-vt-heading">' + escapeHtml(vt.title) + "</h2>" : "") +
          '<div class="st-vt-text">' + textHtml + "</div>" +
        "</div>" +
        '<div class="st-sv-divider"></div>' +
        '<div class="st-vt-daycol">' + daysHtml + "</div>" +
      "</div>";

    sheet.appendChild(inner);
    wrap.appendChild(sheet);
  }

  function renderSheet(wrap, opts) {
    opts = opts || {};
    if (getSvFormat() === "vecka") return renderWeekTextSheet(wrap, opts);
    const week = getWeek();
    const color = opts.color || "";

    const sheet = document.createElement("div");
    sheet.className = "ab-sheet st-sv-sheet" + (color ? " starten-" + color : "");

    const inner = document.createElement("div");
    inner.className = "ab-sheet-inner";

    const SUBJ_LABEL = { svenska: "Berättelse", no: "NO", so: "SO", engelska: "Engelska" };
    let daysHtml = "";
    DAYS.forEach(function (dayName, i) {
      const c = week.days[i];
      const text = c ? escapeHtml(c.text) : '<span class="st-sv-empty">— tomt —</span>';
      const fixed = escapeHtml(c ? (c.fixedField || FIXED_SV) : FIXED_SV);
      const subjLbl = c ? (SUBJ_LABEL[c.subject] || "") : "";
      const dayLabel = subjLbl
        ? escapeHtml(dayName) + ' <span class="st-sv-dayname-subj">· ' + escapeHtml(subjLbl) + '</span>'
        : escapeHtml(dayName);
      const qHtml = c ? c.questions.map(function (q) {
        return '<p class="st-sv-question">' + escapeHtml(q) + "</p>" +
          '<div class="st-sv-writeline"></div><div class="st-sv-writeline"></div>';
      }).join("") : "";
      daysHtml +=
        '<div class="st-sv-day">' +
          '<div class="st-sv-left">' +
            '<div class="st-sv-dayname">' + dayLabel + "</div>" +
            '<p class="st-sv-text">' + text + "</p>" +
          "</div>" +
          '<div class="st-sv-divider"></div>' +
          '<div class="st-sv-right">' + qHtml +
            '<div class="st-sv-fixed"><p class="st-sv-fixed-label">' + fixed + "</p><div class=\"st-sv-dotted\"></div></div>" +
          "</div>" +
        "</div>";
    });

    const title = escapeHtml(opts.title || "Starten");
    inner.innerHTML =
      '<header class="ab-header starten-header">' +
        '<div class="ab-header-left"><div class="ab-title">' + title + "</div></div>" +
        '<div class="ab-header-fields"><div><div class="ab-field-label">Namn:</div><div class="ab-field-line">&nbsp;</div></div></div>' +
      "</header>" +
      '<div class="st-sv-days">' + daysHtml + "</div>";

    sheet.appendChild(inner);
    wrap.appendChild(sheet);
  }

  return {
    DAYS: DAYS,
    seedIfEmpty: seedIfEmpty,
    MAX_CHARS: MAX_CHARS,
    init: init, onBankChange: onBankChange,
    getBank: getBank, addToBank: addToBank, removeFromBank: removeFromBank,
    bankAndResolve: bankAndResolve, markUsed: markUsed, clearUsage: clearUsage,
    getWeek: getWeek, randomizeWeek: randomizeWeek, setDay: setDay, setDays: setDays,
    WEEK_MAX_CHARS: WEEK_MAX_CHARS,
    getSvFormat: getSvFormat, setSvFormat: setSvFormat,
    getWeekText: getWeekText, setWeekText: setWeekText,
    renderSheet: renderSheet
  };
})();
