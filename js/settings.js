// js/settings.js
// Hanterar inställningar och localStorage-persistens.
// Ingen kunskap om DOM, uppgifter eller rendering.

const Settings = (() => {
  const STORAGE_KEY = 'klassrummatte-settings';
  const CUSTOM_PROBLEMS_KEY = 'klassrummatte-custom-problems';
  const CUSTOM_SETS_KEY = 'klassrummatte-custom-problem-sets';

  const DEFAULTS = {
    grade: 3,
    gradeSelected: false,
    areas: [],
    customProblemsEnabled: false,
    problemlosning: false,
    extraEnabled: false,
    extraType: 'uppstallning-add',
    extraDelay: 10,
    bildstod: false,
    bildstodDelay: 10,
    divisionRest: false,
    geometriTypes: ['area', 'perimeter'],
    multDivMode: [],
    specificTables: [],
    addSubMode: [],
    addSubVaxling: ['med'],
    prioritetOps: ['mult', 'div'],
    brakTypes: [],
    flersteg: false,
    multipleProblems: false,
    multipleCount: 2,
    numbering: false,
    klockaTypes: ['analog', 'digital'],
    sessionLimit: 'unlimited',
    discussionEnabled: false,
    statistikTypes: ['bar', 'freq-table', 'pie-chart'],
    timerEnabled: false,
    timerDuration: 20,
    langdUnits: [],
    volymUnits: [],
    volymModes: [],
  };

  let state = { ...DEFAULTS };

  // Session-import: ej persistent, nollställs vid omladdning
  let sessionActiveSetId = null;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === 'object') {
        state = { ...DEFAULTS, ...saved };
        // Returning user who saved grade before gradeSelected existed → treat as selected
        if (saved.grade !== undefined && !saved.gradeSelected) {
          state.gradeSelected = true;
        }
        // Migrate klockaDisplayMode (string) → klockaTypes (array)
        if (saved.klockaDisplayMode && !Array.isArray(saved.klockaTypes)) {
          state.klockaTypes = saved.klockaDisplayMode === 'analog'  ? ['analog']
                            : saved.klockaDisplayMode === 'digital' ? ['digital']
                            : ['analog', 'digital'];
        }
        // Migrate: ta bort 'blandad' från sparade areas
        if (Array.isArray(state.areas) && state.areas.includes('blandad')) {
          state.areas = state.areas.filter(a => a !== 'blandad');
        }
        // Migrate geometriMode (string) + geometriExtra (array) → geometriTypes (array)
        if (saved.geometriMode && !Array.isArray(saved.geometriTypes)) {
          const base = saved.geometriMode === 'area' ? ['area']
                     : saved.geometriMode === 'perimeter' ? ['perimeter']
                     : ['area', 'perimeter'];
          const extra = Array.isArray(saved.geometriExtra) ? saved.geometriExtra : [];
          state.geometriTypes = [...base, ...extra.filter(v => ['kropp','klassificering','vinklar','volym'].includes(v))];
        }
      }
    } catch (_) {
      state = { ...DEFAULTS };
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      // Ignore storage errors (t.ex. privat läge med fullt storage)
    }
  }

  // Getters – returnerar alltid kopior, aldrig referenser
  function get() {
    return {
      ...state,
      sessionActiveSetId,
      areas:         [...state.areas],
      multDivMode:   [...(state.multDivMode    || [])],
      specificTables:[...(state.specificTables || [1,2,3,4,5,6,7,8,9])],
      addSubMode:    [...(state.addSubMode     || [])],
      addSubVaxling: [...(state.addSubVaxling  || ['med'])],
      prioritetOps:  [...(state.prioritetOps   || ['mult', 'div'])],
      brakTypes:     [...(state.brakTypes      || [])],
      statistikTypes:[...(state.statistikTypes || ['bar', 'freq-table', 'pie-chart'])],
      langdUnits:    [...(state.langdUnits    || [])],
    };
  }
  function getGrade()          { return state.grade; }
  function getAreas()          { return [...state.areas]; }
  function isExtraEnabled()    { return state.extraEnabled; }
  function getExtraType()      { return state.extraType; }
  function isProblemlosning()  { return state.problemlosning; }
  function isBildstod()        { return state.bildstod; }
  function getBildstodDelay()  { return state.bildstodDelay ?? 10; }
  function getGeometriTypes()  { return [...(state.geometriTypes || ['area', 'perimeter'])]; }
  function getAddSubMode()     { return [...(state.addSubMode  || [])]; }
  function getAddSubVaxling()  { return [...(state.addSubVaxling || ['med'])]; }

  // Setters – sparar direkt
  function setGrade(g)             { state.grade = parseInt(g, 10); save(); }
  function setAreas(arr)           { state.areas = [...arr]; save(); }
  function isCustomProblemsEnabled() { return !!state.customProblemsEnabled; }
  function setCustomProblemsEnabled(b) { state.customProblemsEnabled = !!b; save(); }

  // ── Set-baserad hantering av egna uppgifter ──
  function migrateOldCustomProblems() {
    try {
      const raw = localStorage.getItem(CUSTOM_PROBLEMS_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length === 0) return;
      // Kolla om sets redan finns (undvik dubbelmigrering)
      const existing = localStorage.getItem(CUSTOM_SETS_KEY);
      if (existing) return;
      const set = { id: 'migrated_' + Date.now(), name: 'Importerade uppgifter', problems: arr, enabled: true };
      localStorage.setItem(CUSTOM_SETS_KEY, JSON.stringify([set]));
      localStorage.removeItem(CUSTOM_PROBLEMS_KEY);
    } catch (_) {}
  }
  migrateOldCustomProblems();

  function getCustomProblemSets() {
    try {
      const raw = localStorage.getItem(CUSTOM_SETS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }
  function setCustomProblemSets(sets) {
    try {
      localStorage.setItem(CUSTOM_SETS_KEY, JSON.stringify(Array.isArray(sets) ? sets : []));
    } catch (_) {}
  }
  function addCustomProblemSet(name, problems) {
    const sets = getCustomProblemSets();
    const id = 'set_' + Date.now();
    sets.push({ id: id, name: name, problems: problems, enabled: true });
    setCustomProblemSets(sets);
    return id;
  }
  function toggleCustomProblemSet(id, enabled) {
    const sets = getCustomProblemSets();
    const s = sets.find(x => x.id === id);
    if (s) { s.enabled = enabled; setCustomProblemSets(sets); }
  }
  function deleteCustomProblemSet(id) {
    const sets = getCustomProblemSets().filter(x => x.id !== id);
    setCustomProblemSets(sets);
  }

  // Returnerar alla uppgifter från aktiverade sets
  function getCustomProblems() {
    const sets = getCustomProblemSets();
    const result = [];
    for (const s of sets) {
      if (s.enabled && Array.isArray(s.problems)) {
        for (const p of s.problems) result.push(p);
      }
    }
    return result;
  }
  // Returnerar uppgifter från ett specifikt set (för session-import)
  function getCustomProblemsBySetId(setId) {
    if (!setId) return getCustomProblems();
    const sets = getCustomProblemSets();
    const s = sets.find(x => x.id === setId);
    return (s && Array.isArray(s.problems)) ? s.problems : [];
  }
  // Bakåtkompatibelt alias (används ej längre för sparning)
  function setCustomProblems(arr) {
    // Migrerad – gör inget; import sker via addCustomProblemSet
  }
  function setExtraEnabled(b)      { state.extraEnabled = !!b; save(); }
  function setExtraType(t)         { state.extraType = t; save(); }
  function setExtraDelay(n)        { state.extraDelay = parseInt(n, 10); save(); }
  function setProblemlosning(b)    { state.problemlosning = !!b; save(); }
  function setBildstod(b)          { state.bildstod = !!b; save(); }
  function setBildstodDelay(n)     { state.bildstodDelay = parseInt(n, 10); save(); }
  function setDivisionRest(b)      { state.divisionRest = !!b; save(); }
  function setGeometriTypes(arr)   { state.geometriTypes = [...arr]; save(); }
  function setMultDivMode(arr)     { state.multDivMode = [...arr]; save(); }
  function setSpecificTables(arr)  { state.specificTables = [...arr]; save(); }
  function setAddSubMode(arr)      { state.addSubMode = [...arr]; save(); }
  function setAddSubVaxling(arr)   { state.addSubVaxling = [...arr]; save(); }
  function setPrioritetOps(arr)    { state.prioritetOps  = [...arr]; save(); }
  function setBrakTypes(arr)       { state.brakTypes     = [...arr]; save(); }
  function setFlersteg(b)          { state.flersteg = !!b; save(); }
  function setGradeSelected(b)     { state.gradeSelected = !!b; save(); }
  function setMultipleProblems(b)  { state.multipleProblems = !!b; save(); }
  function setMultipleCount(n)         { state.multipleCount = parseInt(n, 10); save(); }
  // Numrering av uppgifterna (1., 2., ...) plus a) b) c) i flera-uppgifter-läget
  function setNumbering(b)             { state.numbering = !!b; save(); }
  function getKlockaTypes()            { return [...(state.klockaTypes || ['analog', 'digital'])]; }
  function setKlockaTypes(arr)         { state.klockaTypes = [...arr]; save(); }
  function getSessionLimit()           { return state.sessionLimit || 'unlimited'; }
  function setSessionLimit(v)          { state.sessionLimit = v; save(); }
  function isDiscussionEnabled()       { return !!state.discussionEnabled; }
  function setDiscussionEnabled(b)     { state.discussionEnabled = !!b; save(); }
  function getStatistikTypes()         { return [...(state.statistikTypes || ['bar', 'freq-table', 'pie-chart'])]; }
  function setStatistikTypes(arr)      { state.statistikTypes = [...arr]; save(); }
  function getLangdUnits()             { return [...(state.langdUnits || [])]; }
  function setLangdUnits(arr)          { state.langdUnits = [...arr]; save(); }
  function getVolymUnits()             { return [...(state.volymUnits || [])]; }
  function setVolymUnits(arr)          { state.volymUnits = [...arr]; save(); }
  function getVolymModes()             { return [...(state.volymModes || [])]; }
  function setVolymModes(arr)          { state.volymModes = [...arr]; save(); }
  function getSessionActiveSetId()     { return sessionActiveSetId; }
  function setSessionActiveSetId(id)   { sessionActiveSetId = id || null; }
  function isTimerEnabled()            { return !!state.timerEnabled; }
  function setTimerEnabled(b)          { state.timerEnabled = !!b; save(); }
  function getTimerDuration()          { return state.timerDuration || 20; }
  function setTimerDuration(n)         { state.timerDuration = parseInt(n, 10); save(); }

  // Initiering
  load();

  return {
    get,
    getGrade, getAreas, isExtraEnabled, getExtraType, isProblemlosning,
    isCustomProblemsEnabled, setCustomProblemsEnabled, getCustomProblems, getCustomProblemsBySetId, setCustomProblems,
    getCustomProblemSets, setCustomProblemSets, addCustomProblemSet, toggleCustomProblemSet, deleteCustomProblemSet,
    getSessionActiveSetId, setSessionActiveSetId,
    isBildstod, getBildstodDelay, getGeometriTypes, getAddSubMode, getAddSubVaxling,
    setGrade, setAreas, setExtraEnabled, setExtraType, setExtraDelay, setProblemlosning,
    setBildstod, setBildstodDelay, setDivisionRest, setGeometriTypes,
    setMultDivMode, setSpecificTables, setAddSubMode, setAddSubVaxling, setPrioritetOps, setBrakTypes, setFlersteg,
    setGradeSelected, setMultipleProblems, setMultipleCount, setNumbering,
    getKlockaTypes, setKlockaTypes,
    getSessionLimit, setSessionLimit,
    isDiscussionEnabled, setDiscussionEnabled,
    getStatistikTypes, setStatistikTypes,
    getLangdUnits, setLangdUnits,
    getVolymUnits, setVolymUnits, getVolymModes, setVolymModes,
    isTimerEnabled, setTimerEnabled, getTimerDuration, setTimerDuration,
  };
})();
