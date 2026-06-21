/* Starten – veckostore. Firestore-backat lager för veckor/sessioner.
   collection `weeks`, doc-id "YYYY-vWW" (ISO-vecka). Realtidsprenumeration på aktiv vecka.
   Lokal cache i localStorage så sidan funkar offline och får snabb paint. */
window.StartenWeeksStore = (function () {
  "use strict";

  const KEY_ACTIVE = "starten.activeWeekId.v1";
  const KEY_LOCAL_PREFIX = "starten.week."; // + id  ⇒ localStorage-cache per vecka
  const KEY_LEGACY_WEEK = "starten.week.v1"; // legacy (singel-vecka) – migreras

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
  function weekIdFromParts(p) { return p.year + "-v" + String(p.week).padStart(2, "0"); }
  function partsFromId(id) {
    const m = /^(\d{4})-v(\d{1,2})$/.exec(id || "");
    return m ? { year: parseInt(m[1], 10), week: parseInt(m[2], 10) } : null;
  }
  function weekLabel(parts) { return "v." + parts.week + " " + parts.year; }

  /* ── Default-veckostruktur ──────────────────────────── */
  function emptyWeek(id, name) {
    const parts = partsFromId(id) || currentIsoParts();
    return {
      id: id,
      year: parts.year,
      week: parts.week,
      name: name || "",
      title: "Starten",
      color: "",
      days: [null, null, null, null, null],
      matte: null, // { grade, ops, showDiv, vaxling, rows }
      updatedAt: new Date().toISOString(),
    };
  }

  /* ── State ──────────────────────────────────────────── */
  let activeId = read(KEY_ACTIVE, null);
  let activeWeek = null;
  let unsubscribeActive = null;

  let allWeeks = []; // [{id, year, week, name, title}] – metadata för väljaren
  let unsubscribeList = null;

  let onChangeCb = null;
  let onListCb = null;

  function emitChange()  { if (onChangeCb) onChangeCb(activeWeek); }
  function emitList()    { if (onListCb) onListCb(allWeeks); }

  function onChange(cb)  { onChangeCb = cb; }
  function onListChange(cb) { onListCb = cb; }

  /* ── List-prenumeration ─────────────────────────────── */
  function subscribeList() {
    const db = cloudDb();
    if (!db) {
      // Lokalt läge: list = aktiv vecka (om finns) + alla lokala cacher
      allWeeks = listLocalWeeks();
      emitList();
      return;
    }
    if (unsubscribeList) unsubscribeList();
    // Visa cachelistan direkt så väljaren inte är tom medan vi väntar på molnet
    const cached = read("starten.weekList.v1", []);
    if (cached.length) { allWeeks = cached; emitList(); }
    unsubscribeList = db.collection("weeks").onSnapshot(function (snap) {
      const cloudWeeks = snap.docs
        .map(function (d) {
          const data = d.data() || {};
          return {
            id: d.id,
            year: data.year || 0,
            week: data.week || 0,
            name: data.name || "",
            title: data.title || "Starten",
          };
        });
      // Slå ihop med lokalt cachade veckor som ännu inte synkat upp till molnet
      const localOnly = listLocalWeeks().filter(function (w) {
        return !cloudWeeks.some(function (c) { return c.id === w.id; });
      });
      allWeeks = cloudWeeks.concat(localOnly).sort(function (a, b) {
        if (a.year !== b.year) return b.year - a.year;
        return b.week - a.week;
      });
      // Spegla metadata lokalt så list är snabb även offline nästa gång
      write("starten.weekList.v1", allWeeks);
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
          if (w && w.id) out.push({ id: w.id, year: w.year || 0, week: w.week || 0, name: w.name || "", title: w.title || "Starten" });
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
  function getList() { return allWeeks; }

  function setActive(id) {
    activeId = id || null;
    write(KEY_ACTIVE, activeId);
    subscribeActive(activeId);
  }

  /* ── Skapa / spara ─────────────────────────────────── */
  function ensureWeek(year, week, name) {
    const id = weekIdFromParts({ year: year, week: week });
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
      allWeeks.push({ id: id, year: fresh.year, week: fresh.week, name: fresh.name || "", title: fresh.title });
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
    const id = weekIdFromParts(parts);
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
      // Fallback: nuvarande ISO-vecka
      setActive(weekIdFromParts(currentIsoParts()));
      return;
    }
    setActive(activeId);
  }

  return {
    init: init,
    onChange: onChange, onListChange: onListChange,
    getActive: getActive, getActiveId: getActiveId, getList: getList,
    setActive: setActive, ensureWeek: ensureWeek,
    save: save, patchActive: patchActive,
    currentIsoParts: currentIsoParts, weekIdFromParts: weekIdFromParts,
    weekLabel: weekLabel, emptyWeek: emptyWeek,
  };
})();
