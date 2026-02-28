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
    geometriMode: 'mixed',
    multDivMode: [],
    specificTables: [],
    addSubMode: [],
    addSubVaxling: ['med'],
    flersteg: false,
    multipleProblems: false,
    multipleCount: 2,
    klockaDisplayMode: 'mixed',
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
        // Migrate old geometriTypes array → geometriMode string
        if (saved.geometriTypes && !saved.geometriMode) {
          const t = saved.geometriTypes;
          state.geometriMode = (t.includes('area') && t.includes('perimeter')) ? 'mixed'
                             : t.includes('area') ? 'area'
                             : 'perimeter';
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
    };
  }
  function getGrade()          { return state.grade; }
  function getAreas()          { return [...state.areas]; }
  function isExtraEnabled()    { return state.extraEnabled; }
  function getExtraType()      { return state.extraType; }
  function isProblemlosning()  { return state.problemlosning; }
  function isBildstod()        { return state.bildstod; }
  function getBildstodDelay()  { return state.bildstodDelay ?? 10; }
  function getGeometriMode()   { return state.geometriMode || 'mixed'; }
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
  function setGeometriMode(v)      { state.geometriMode = v; save(); }
  function setMultDivMode(arr)     { state.multDivMode = [...arr]; save(); }
  function setSpecificTables(arr)  { state.specificTables = [...arr]; save(); }
  function setAddSubMode(arr)      { state.addSubMode = [...arr]; save(); }
  function setAddSubVaxling(arr)   { state.addSubVaxling = [...arr]; save(); }
  function setFlersteg(b)          { state.flersteg = !!b; save(); }
  function setGradeSelected(b)     { state.gradeSelected = !!b; save(); }
  function setMultipleProblems(b)  { state.multipleProblems = !!b; save(); }
  function setMultipleCount(n)         { state.multipleCount = parseInt(n, 10); save(); }
  function getKlockaDisplayMode()      { return state.klockaDisplayMode || 'mixed'; }
  function setKlockaDisplayMode(v)     { state.klockaDisplayMode = v; save(); }
  function getSessionLimit()           { return state.sessionLimit || 'unlimited'; }
  function setSessionLimit(v)          { state.sessionLimit = v; save(); }
  function isDiscussionEnabled()       { return !!state.discussionEnabled; }
  function setDiscussionEnabled(b)     { state.discussionEnabled = !!b; save(); }

  // Initiering
  load();

  return {
    get,
    getGrade, getAreas, isExtraEnabled, getExtraType, isProblemlosning,
    isBildstod, getBildstodDelay, getGeometriMode, getAddSubMode, getAddSubVaxling,
    setGrade, setAreas, setExtraEnabled, setExtraType, setExtraDelay, setProblemlosning,
    setBildstod, setBildstodDelay, setDivisionRest, setGeometriMode,
    setMultDivMode, setSpecificTables, setAddSubMode, setAddSubVaxling, setFlersteg,
    setGradeSelected, setMultipleProblems, setMultipleCount,
    getKlockaDisplayMode, setKlockaDisplayMode,
    getSessionLimit, setSessionLimit,
    isDiscussionEnabled, setDiscussionEnabled,
  };
})();
