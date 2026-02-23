// js/settings.js
// Hanterar inställningar och localStorage-persistens.
// Ingen kunskap om DOM, uppgifter eller rendering.

const Settings = (() => {
  const STORAGE_KEY = 'klassrummatte-settings';

  const DEFAULTS = {
    grade: 3,
    areas: ['addition'],
    problemlosning: false,
    extraEnabled: false,
    extraType: 'uppstallning-add',
  };

  let state = { ...DEFAULTS };

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && typeof saved === 'object') {
        state = { ...DEFAULTS, ...saved };
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
  function get()               { return { ...state, areas: [...state.areas] }; }
  function getGrade()          { return state.grade; }
  function getAreas()          { return [...state.areas]; }
  function isExtraEnabled()    { return state.extraEnabled; }
  function getExtraType()      { return state.extraType; }
  function isProblemlosning()  { return state.problemlosning; }

  // Setters – sparar direkt
  function setGrade(g)         { state.grade = parseInt(g, 10); save(); }
  function setAreas(arr)       { state.areas = [...arr]; save(); }
  function setExtraEnabled(b)  { state.extraEnabled = !!b; save(); }
  function setExtraType(t)     { state.extraType = t; save(); }
  function setProblemlosning(b){ state.problemlosning = !!b; save(); }

  // Initiering
  load();

  return {
    get,
    getGrade, getAreas, isExtraEnabled, getExtraType, isProblemlosning,
    setGrade, setAreas, setExtraEnabled, setExtraType, setProblemlosning,
  };
})();
