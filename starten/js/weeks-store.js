/* Starten – veckostore. Firestore-backat lager för veckor/sessioner.
   collection `weeks`, doc-id "YYYY-vWW" (ISO-vecka). Realtidsprenumeration på aktiv vecka.
   Lokal cache i localStorage så sidan funkar offline och får snabb paint. */
window.StartenWeeksStore = (function () {
  "use strict";

  const KEY_ACTIVE = "starten.activeWeekId.v1";
  const KEY_GRADE = "starten.activeGrade.v1";   // vald årskurs (vy-filter, per enhet)
  const KEY_LOCAL_PREFIX = "starten.week."; // + id  ⇒ localStorage-cache per vecka
  const KEY_LEGACY_WEEK = "starten.week.v1"; // legacy (singel-vecka) – migreras

  const DEFAULT_GRADE = 4;

  function cloudDb() { return (window.StartenFirebase && window.StartenFirebase.db) || null; }
  function read(key, fb) { try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch (e) { return fb; } }
  function write(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function del(key)      { try { localStorage.removeItem(key); } catch (e) {} }

  /* ── ISO-vecka ──────────────────────────────────────── */
  function isoWeekParts(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    const week = 1 + Math.round(((d - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
    return { year: d.getUTCFullYear(), week: week };
  }
  function currentIsoParts() { return isoWeekParts(new Date()); }
  // Doc-id: "YYYY-vWW-akN". Suffixet gör att samma ISO-vecka kan finnas per årskurs.
  // Äldre veckor saknar suffix ("YYYY-vWW") och räknas som otaggade – de syns i alla årskurser.
  function weekIdFromParts(p) {
    const base = p.year + "-v" + String(p.week).padStart(2, "0");
    return p.grade ? base + "-ak" + p.grade : base;
  }
  function partsFromId(id) {
    const m = /^(\d{4})-v(\d{1,2})(?:-ak(\d))?$/.exec(id || "");
    if (!m) return null;
    return { year: parseInt(m[1], 10), week: parseInt(m[2], 10), grade: m[3] ? parseInt(m[3], 10) : null };
  }
  function weekLabel(parts) { return "v." + parts.week + " " + parts.year; }

  /* ── Default-veckostruktur ──────────────────────────── */
  function emptyWeek(id, name) {
    const parts = partsFromId(id) || currentIsoParts();
    return {
      id: id,
      year: parts.year,
      week: parts.week,
      grade: parts.grade || null,
      name: name || "",
      title: "Starten",
      color: "",
      days: [null, null, null, null, null],
      matte: null, // { grade, ops, showDiv, vaxling, rows }
      archived: false,
      updatedAt: new Date().toISOString(),
    };
  }

  /* ── State ──────────────────────────────────────────── */
  let activeId = read(KEY_ACTIVE, null);
  let activeWeek = null;
  let unsubscribeActive = null;
  let activeGrade = parseInt(read(KEY_GRADE, DEFAULT_GRADE), 10) || DEFAULT_GRADE;

  let allWeeks = []; // [{id, year, week, name, title}] – metadata för väljaren
  let unsubscribeList = null;

  let onChangeCb = null;
  let onListCb = null;

  function emitChange()  { if (onChangeCb) onChangeCb(activeWeek); }
  function emitList()    { if (onListCb) onListCb(allWeeks); }

  function onChange(cb)  { onChangeCb = cb; }
  function onListChange(cb) { onListCb = cb; }

  /* ── List-prenumeration ─────────────────────────────── */
  function mergeUnique(primary, extra) {
    const seen = new Set(primary.map(function (w) { return w.id; }));
    const out = primary.slice();
    extra.forEach(function (w) { if (w && w.id && !seen.has(w.id)) { seen.add(w.id); out.push(w); } });
    return out.sort(function (a, b) {
      if (a.year !== b.year) return b.year - a.year;
      return b.week - a.week;
    });
  }

  function subscribeList() {
    const db = cloudDb();
    // Initialt: visa union av cache + lokala vecko-keys så väljaren är komplett från start
    const cached = read("starten.weekList.v1", []);
    const local  = listLocalWeeks();
    allWeeks = mergeUnique(cached, local);
    emitList();

    if (!db) return;
    if (unsubscribeList) unsubscribeList();
    unsubscribeList = db.collection("weeks").onSnapshot(function (snap) {
      const cloudWeeks = snap.docs.map(function (d) {
        const data = d.data() || {};
        return {
          id: d.id,
          year: data.year || 0,
          week: data.week || 0,
          grade: data.grade || null,
          name: data.name || "",
          title: data.title || "Starten",
          archived: !!data.archived,
        };
      });
      // Slå ihop molnets veckor med ALLA lokalt kända (cache + scan) som inte finns i molnet
      const allLocal = mergeUnique(read("starten.weekList.v1", []), listLocalWeeks());
      allWeeks = mergeUnique(cloudWeeks, allLocal);
      write("starten.weekList.v1", allWeeks);
      console.log("[Starten] veckor laddade:", allWeeks.length, "(moln:", cloudWeeks.length, ", lokala:", allLocal.length, ")");
      emitList();
    }, function (err) { console.warn("[Starten] weeks-list fel:", err); });
  }

  function listLocalWeeks() {
    // Scan localStorage efter cachade veckor (varje vecka ligger i `starten.week.<id>`)
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.indexOf(KEY_LOCAL_PREFIX) === 0 && k !== KEY_LEGACY_WEEK) {
        try {
          const w = JSON.parse(localStorage.getItem(k));
          if (w && w.id) out.push({
            id: w.id, year: w.year || 0, week: w.week || 0,
            grade: w.grade || null,
            name: w.name || "", title: w.title || "Starten",
            archived: !!w.archived
          });
        } catch (e) {}
      }
    }
    return out;
  }

  /* ── Aktiv vecka ────────────────────────────────────── */
  function localKey(id) { return KEY_LOCAL_PREFIX + id; }

  function subscribeActive(id) {
    if (unsubscribeActive) { unsubscribeActive(); unsubscribeActive = null; }
    if (!id) { activeWeek = null; emitChange(); return; }
    // Snabb paint från lokal cache
    activeWeek = read(localKey(id), null);
    if (activeWeek) emitChange();

    const db = cloudDb();
    if (!db) {
      if (!activeWeek) { activeWeek = emptyWeek(id); write(localKey(id), activeWeek); emitChange(); }
      return;
    }
    unsubscribeActive = db.collection("weeks").doc(id).onSnapshot(function (snap) {
      if (snap.exists) {
        activeWeek = Object.assign({ id: id }, snap.data());
      } else {
        activeWeek = emptyWeek(id);
      }
      write(localKey(id), activeWeek);
      emitChange();
    }, function (err) { console.warn("[Starten] week-prenumeration fel:", err); });
  }

  function getActiveId() { return activeId; }
  function getActive() { return activeWeek; }

  /* ── Årskurs (vy-filter) ────────────────────────────── */
  // Veckans årskurs: fältet först, annars ur doc-id:t.
  // Veckor från tiden före åk-filtret saknar båda och räknas som åk 4.
  function weekGrade(w) {
    if (!w) return DEFAULT_GRADE;
    if (w.grade) return parseInt(w.grade, 10) || DEFAULT_GRADE;
    const p = partsFromId(w.id);
    return (p && p.grade) || DEFAULT_GRADE;
  }
  function matchesGrade(w) { return weekGrade(w) === activeGrade; }
  function getGrade() { return activeGrade; }
  function setGrade(g) {
    const next = parseInt(g, 10) || DEFAULT_GRADE;
    if (next === activeGrade) return;
    activeGrade = next;
    write(KEY_GRADE, activeGrade);
    emitList();
    // Behåll aktiv vecka om den hör hemma i den nya årskursen, annars byt/skapa.
    const cur = allWeeks.filter(function (w) { return w.id === activeId; })[0];
    if (cur && matchesGrade(cur) && !cur.archived) return;
    const list = getList();
    if (list.length) { setActive(list[0].id); return; }
    const p = currentIsoParts();
    ensureWeek(p.year, p.week, "");
  }

  function getList() { return allWeeks.filter(function (w) { return !w.archived && matchesGrade(w); }); }
  function getArchivedList() { return allWeeks.filter(function (w) { return !!w.archived && matchesGrade(w); }); }
  function getAllList() { return allWeeks; }

  function setArchived(id, archived) {
    const w = (activeWeek && activeWeek.id === id) ? activeWeek : read(localKey(id), null);
    if (!w) return;
    w.archived = !!archived;
    save(w);
    // Uppdatera även list-metadata
    const idx = allWeeks.findIndex(function (x) { return x.id === id; });
    if (idx !== -1) { allWeeks[idx].archived = !!archived; emitList(); }
  }
  function archiveWeek(id)   { setArchived(id, true); }
  function unarchiveWeek(id) { setArchived(id, false); }

  function deleteWeek(id) {
    if (!id) return;
    const db = cloudDb();
    if (db) db.collection("weeks").doc(id).delete().catch(function (e) { console.warn("[Starten] week delete fel:", e); });
    try { localStorage.removeItem(localKey(id)); } catch (e) {}
    const idx = allWeeks.findIndex(function (w) { return w.id === id; });
    if (idx !== -1) {
      allWeeks.splice(idx, 1);
      write("starten.weekList.v1", allWeeks);
      emitList();
    }
    // Om vi just raderade aktiv vecka, växla till första icke-arkiverade (annars skapa nuvarande ISO)
    if (activeId === id) {
      const remaining = allWeeks.filter(function (w) { return !w.archived; });
      if (remaining.length) { setActive(remaining[0].id); }
      else {
        const p = currentIsoParts();
        ensureWeek(p.year, p.week, "");
      }
    }
  }

  function setActive(id) {
    activeId = id || null;
    write(KEY_ACTIVE, activeId);
    subscribeActive(activeId);
  }

  /* ── Skapa / spara ─────────────────────────────────── */
  function ensureWeek(year, week, name, grade) {
    const g = parseInt(grade, 10) || activeGrade;
    const id = weekIdFromParts({ year: year, week: week, grade: g });
    const db = cloudDb();
    const existing = (activeWeek && activeWeek.id === id) ? activeWeek : read(localKey(id), null);
    if (existing) {
      if (name !== undefined && name !== null && name !== existing.name) {
        existing.name = name;
        save(existing);
      }
      setActive(id);
      return id;
    }
    const fresh = emptyWeek(id, name || "");
    write(localKey(id), fresh);
    if (db) db.collection("weeks").doc(id).set(stripId(fresh));
    // Lägg alltid till i listan omedelbart (cloud-snapshot kommer ikapp senare)
    if (!allWeeks.some(function (w) { return w.id === id; })) {
      allWeeks.push({ id: id, year: fresh.year, week: fresh.week, grade: fresh.grade, name: fresh.name || "", title: fresh.title });
      allWeeks.sort(function (a, b) {
        if (a.year !== b.year) return b.year - a.year;
        return b.week - a.week;
      });
      write("starten.weekList.v1", allWeeks);
      emitList();
    }
    setActive(id);
    return id;
  }

  function stripId(week) {
    const out = Object.assign({}, week);
    delete out.id;
    return out;
  }

  function save(week) {
    if (!week || !week.id) return;
    week.updatedAt = new Date().toISOString();
    write(localKey(week.id), week);
    const db = cloudDb();
    if (db) db.collection("weeks").doc(week.id).set(stripId(week), { merge: true });
    if (activeWeek && activeWeek.id === week.id) {
      activeWeek = week;
      emitChange();
    }
  }

  // Bekväm uppdaterare: läser → patchar → sparar
  function patchActive(patch) {
    if (!activeWeek) return;
    const next = Object.assign({}, activeWeek, patch);
    save(next);
  }

  /* ── Migrering: legacy starten.week.v1 → första molnvecka ── */
  function migrateLegacy() {
    const legacy = read(KEY_LEGACY_WEEK, null);
    if (!legacy) return null;
    const parts = currentIsoParts();
    const id = weekIdFromParts({ year: parts.year, week: parts.week, grade: activeGrade });
    const fresh = emptyWeek(id, "");
    fresh.days = Array.isArray(legacy.days) ? legacy.days.slice(0, 5) : fresh.days;
    while (fresh.days.length < 5) fresh.days.push(null);
    if (legacy.weekLabel) fresh.name = legacy.weekLabel;
    write(localKey(id), fresh);
    const db = cloudDb();
    if (db) db.collection("weeks").doc(id).set(stripId(fresh), { merge: true });
    del(KEY_LEGACY_WEEK);
    return id;
  }

  /* ── Init ──────────────────────────────────────────── */
  function init() {
    subscribeList();
    // Migrera legacy om det finns och ingen aktiv vecka är satt
    if (!activeId) {
      const migrated = migrateLegacy();
      if (migrated) {
        setActive(migrated);
        return;
      }
      // Fallback: nuvarande ISO-vecka i vald årskurs
      const p = currentIsoParts();
      setActive(weekIdFromParts({ year: p.year, week: p.week, grade: activeGrade }));
      return;
    }
    setActive(activeId);
  }

  return {
    init: init,
    onChange: onChange, onListChange: onListChange,
    getActive: getActive, getActiveId: getActiveId,
    getList: getList, getArchivedList: getArchivedList, getAllList: getAllList,
    getGrade: getGrade, setGrade: setGrade, weekGrade: weekGrade,
    setActive: setActive, ensureWeek: ensureWeek,
    archiveWeek: archiveWeek, unarchiveWeek: unarchiveWeek, deleteWeek: deleteWeek,
    save: save, patchActive: patchActive,
    currentIsoParts: currentIsoParts, weekIdFromParts: weekIdFromParts,
    weekLabel: weekLabel, emptyWeek: emptyWeek,
  };
})();
