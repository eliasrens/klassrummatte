// js/settings.js
// Hanterar inställningar och localStorage-persistens.
// Ingen kunskap om DOM, uppgifter eller rendering.

const Settings = (() => {
  const STORAGE_KEY = 'klassrummatte-settings';

  const DEFAULTS = {
    grade: 3,
    gradeSelected: false,
    areas: [],
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
    flersteg: false,
    multipleProblems: false,
    multipleCount: 2,
    klockaTypes: ['analog', 'digital'],
    sessionLimit: 'unlimited',
    discussionEnabled: false,
  };

  let state = { ...DEFAULTS };

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
      areas:         [...state.areas],
      multDivMode:   [...(state.multDivMode    || [])],
      specificTables:[...(state.specificTables || [1,2,3,4,5,6,7,8,9])],
      addSubMode:    [...(state.addSubMode     || [])],
      addSubVaxling: [...(state.addSubVaxling  || ['med'])],
      prioritetOps:  [...(state.prioritetOps   || ['mult', 'div'])],
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
  function setFlersteg(b)          { state.flersteg = !!b; save(); }
  function setGradeSelected(b)     { state.gradeSelected = !!b; save(); }
  function setMultipleProblems(b)  { state.multipleProblems = !!b; save(); }
  function setMultipleCount(n)         { state.multipleCount = parseInt(n, 10); save(); }
  function getKlockaTypes()            { return [...(state.klockaTypes || ['analog', 'digital'])]; }
  function setKlockaTypes(arr)         { state.klockaTypes = [...arr]; save(); }
  function getSessionLimit()           { return state.sessionLimit || 'unlimited'; }
  function setSessionLimit(v)          { state.sessionLimit = v; save(); }
  function isDiscussionEnabled()       { return !!state.discussionEnabled; }
  function setDiscussionEnabled(b)     { state.discussionEnabled = !!b; save(); }

  // Initiering
  load();

  return {
    get,
    getGrade, getAreas, isExtraEnabled, getExtraType, isProblemlosning,
    isBildstod, getBildstodDelay, getGeometriTypes, getAddSubMode, getAddSubVaxling,
    setGrade, setAreas, setExtraEnabled, setExtraType, setExtraDelay, setProblemlosning,
    setBildstod, setBildstodDelay, setDivisionRest, setGeometriTypes,
    setMultDivMode, setSpecificTables, setAddSubMode, setAddSubVaxling, setPrioritetOps, setFlersteg,
    setGradeSelected, setMultipleProblems, setMultipleCount,
    getKlockaTypes, setKlockaTypes,
    getSessionLimit, setSessionLimit,
    isDiscussionEnabled, setDiscussionEnabled,
  };
})();
