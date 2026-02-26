// js/menu.js
// Menyhantering: hamburgarmeny, hopfällbara grupper och inställnings-UI.
// Beror på Settings-modulen för att läsa/skriva inställningar.

const Menu = (() => {

  // =========================================================
  //  Öppna/stänga menyn
  // =========================================================
  function toggleMenu() { document.body.classList.toggle('menu-open'); }
  function closeMenu()  { document.body.classList.remove('menu-open'); }

  // =========================================================
  //  Hopfällbara menygrupper
  // =========================================================
  function collapseMenuLabel(label) {
    label.classList.add('is-collapsed');
    let el = label.nextElementSibling;
    while (el && !el.classList.contains('menu-group-label')) {
      el.classList.add('section-collapsed');
      el = el.nextElementSibling;
    }
  }

  function bindMenuCollapse() {
    document.querySelectorAll('#settings-menu .menu-group-label').forEach(label => {
      label.classList.add('is-collapsible');
      label.addEventListener('click', () => {
        const collapsed = label.classList.toggle('is-collapsed');
        let el = label.nextElementSibling;
        while (el && !el.classList.contains('menu-group-label')) {
          el.classList.toggle('section-collapsed', collapsed);
          el = el.nextElementSibling;
        }
      });

      // Matematikområden startar öppen bara om klass redan är vald
      const gradeAlreadySelected = Settings.get().gradeSelected;
      if (label.id !== 'matematikarea-group-label' || !gradeAlreadySelected) {
        collapseMenuLabel(label);
      }
    });
  }

  // =========================================================
  //  Villkorliga sektioner och bildstöd-tillgänglighet
  // =========================================================
  function couldHaveBildstod(settings) {
    const g = settings.grade;
    const a = settings.areas;
    return (a.includes('division')       && g <= 4)
        || (a.includes('addition')       && g <= 3)
        || (a.includes('subtraktion')    && g <= 3)
        || (a.includes('multiplikation') && g <= 3)
        || a.includes('matt-langd')
        || a.includes('matt-volym')
        || a.includes('brak')
        || a.includes('blandad');
  }

  function updateSpecificTablesVisibility() {
    const tablesBasicChecked = document.querySelector('#multdiv-mode-checkboxes input[value="tables-basic"]').checked;
    document.getElementById('specific-tables-wrap').classList.toggle('hidden', !tablesBasicChecked);
  }

  function updateAddSubVaxlingVisibility() {
    const uppstallningChecked = document.querySelector('#addsub-mode-checkboxes input[value="uppstallning"]').checked;
    document.getElementById('addsub-vaxling-wrap').classList.toggle('hidden', !uppstallningChecked);
  }

  function updateConditionalSections() {
    const areas        = Settings.getAreas();
    const showAddSub   = areas.some(a => a === 'addition'  || a === 'subtraktion' || a === 'blandad');
    const showMultDiv  = areas.some(a => a === 'multiplikation' || a === 'division' || a === 'blandad');
    const showGeometri = areas.some(a => a === 'geometri'       || a === 'blandad');
    const showDivRest  = areas.some(a => a === 'division'       || a === 'blandad');

    function setSection(labelId, sectionId, show) {
      const lbl = document.getElementById(labelId);
      const sec = document.getElementById(sectionId);
      if (show) {
        lbl.classList.remove('hidden', 'section-collapsed', 'is-collapsed');
        sec.classList.remove('hidden', 'section-collapsed');
      } else {
        lbl.classList.add('hidden');
        sec.classList.add('hidden');
      }
    }

    setSection('addsub-group-label',  'addsub-section',  showAddSub);
    setSection('multdiv-group-label',  'multdiv-section',  showMultDiv);
    setSection('geometri-group-label', 'geometri-section', showGeometri);
    document.getElementById('division-rest-label').classList.toggle('hidden', !showDivRest);
  }

  function updateBildstodCheckbox() {
    const s       = Settings.get();
    const canHave = couldHaveBildstod(s);
    const cb      = document.getElementById('bildstod-check');
    const lbl     = cb.closest('.check-label--featured');
    cb.disabled   = !canHave;
    if (lbl) lbl.classList.toggle('bildstod-unavailable', !canHave);
    if (!canHave && cb.checked) {
      cb.checked = false;
      Settings.setBildstod(false);
      document.getElementById('bildstod-options').classList.add('hidden');
    }
  }

  // =========================================================
  //  Ladda inställningar till UI
  // =========================================================
  function loadSettingsIntoUI() {
    const s = Settings.get();

    document.getElementById('grade-select').value = s.gradeSelected ? s.grade : '';

    document.querySelectorAll('#area-checkboxes input[type=checkbox]').forEach(cb => {
      cb.checked = s.areas.includes(cb.value);
    });

    document.querySelectorAll('#addsub-mode-checkboxes > label input[type=checkbox]').forEach(cb => {
      cb.checked = (s.addSubMode || ['standard']).includes(cb.value);
    });

    document.querySelectorAll('#addsub-vaxling-checkboxes input[type=checkbox]').forEach(cb => {
      cb.checked = (s.addSubVaxling || ['med']).includes(cb.value);
    });
    updateAddSubVaxlingVisibility();

    document.querySelectorAll('#multdiv-mode-checkboxes > label input[type=checkbox]').forEach(cb => {
      cb.checked = (s.multDivMode || ['tables-basic']).includes(cb.value);
    });

    document.querySelectorAll('#specific-tables-checkboxes input[type=checkbox]').forEach(cb => {
      cb.checked = (s.specificTables || [1,2,3,4,5,6,7,8,9]).includes(parseInt(cb.value, 10));
    });
    updateSpecificTablesVisibility();

    document.querySelectorAll('#geometri-type-checkboxes input[type=checkbox]').forEach(cb => {
      cb.checked = s.geometriTypes.includes(cb.value);
    });

    document.getElementById('bildstod-check').checked = s.bildstod;
    document.getElementById('bildstod-options').classList.toggle('hidden', !s.bildstod);
    const timingVal = s.bildstodInstant ? 'instant' : 'delayed';
    document.querySelectorAll('input[name="bildstod-timing"]').forEach(r => {
      r.checked = r.value === timingVal;
    });
    document.getElementById('problemlosning-check').checked = s.problemlosning;
    document.getElementById('flersteg-check').checked = s.flersteg || false;
    document.getElementById('flersteg-wrap').classList.toggle('hidden', !s.problemlosning);
    document.getElementById('extra-enabled-check').checked  = s.extraEnabled;
    document.getElementById('extra-type-select').value      = s.extraType;
    document.getElementById('extra-delay-select').value     = s.extraDelay || 10;
    document.getElementById('extra-task-options').classList.toggle('hidden', !s.extraEnabled);
    document.getElementById('division-rest-check').checked  = s.divisionRest || false;
    document.getElementById('multiple-check').checked       = s.multipleProblems || false;
    document.getElementById('multiple-count-select').value  = s.multipleCount || 2;
    document.getElementById('multiple-count-wrap').classList.toggle('hidden', !s.multipleProblems);
    updateConditionalSections();
    updateBildstodCheckbox();
  }

  // =========================================================
  //  Binda inställnings-UI
  // =========================================================
  function bindSettingsUI() {
    document.getElementById('grade-select').addEventListener('change', e => {
      Settings.setGrade(e.target.value);
      if (!Settings.get().gradeSelected) {
        Settings.setGradeSelected(true);
        // Fäll ut Matematikområden automatiskt
        const matLabel = document.getElementById('matematikarea-group-label');
        if (matLabel && matLabel.classList.contains('is-collapsed')) {
          matLabel.click();
        }
      }
      updateBildstodCheckbox();
    });

    document.querySelectorAll('#area-checkboxes input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = [...document.querySelectorAll('#area-checkboxes input:checked')].map(c => c.value);
        Settings.setAreas(checked);
        updateConditionalSections();
        updateBildstodCheckbox();
      });
    });

    document.querySelectorAll('#addsub-mode-checkboxes > label input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = [...document.querySelectorAll('#addsub-mode-checkboxes > label input:checked')].map(c => c.value);
        if (checked.length > 0) Settings.setAddSubMode(checked);
        else cb.checked = true;
        updateAddSubVaxlingVisibility();
      });
    });

    document.querySelectorAll('#addsub-vaxling-checkboxes input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = [...document.querySelectorAll('#addsub-vaxling-checkboxes input:checked')].map(c => c.value);
        if (checked.length > 0) Settings.setAddSubVaxling(checked);
        else cb.checked = true;
      });
    });

    document.querySelectorAll('#multdiv-mode-checkboxes > label input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = [...document.querySelectorAll('#multdiv-mode-checkboxes > label input:checked')].map(c => c.value);
        if (checked.length > 0) Settings.setMultDivMode(checked);
        else cb.checked = true;
        updateSpecificTablesVisibility();
      });
    });

    document.querySelectorAll('#specific-tables-checkboxes input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = [...document.querySelectorAll('#specific-tables-checkboxes input:checked')]
          .map(c => parseInt(c.value, 10));
        if (checked.length > 0) Settings.setSpecificTables(checked);
        else cb.checked = true;
      });
    });

    document.querySelectorAll('#geometri-type-checkboxes input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = [...document.querySelectorAll('#geometri-type-checkboxes input:checked')].map(c => c.value);
        if (checked.length > 0) Settings.setGeometriTypes(checked);
        else cb.checked = true;
      });
    });

    document.getElementById('bildstod-check').addEventListener('change', e => {
      Settings.setBildstod(e.target.checked);
      document.getElementById('bildstod-options').classList.toggle('hidden', !e.target.checked);
    });

    document.querySelectorAll('input[name="bildstod-timing"]').forEach(r => {
      r.addEventListener('change', () => {
        Settings.setBildstodInstant(r.value === 'instant');
      });
    });

    document.getElementById('problemlosning-check').addEventListener('change', e => {
      Settings.setProblemlosning(e.target.checked);
      document.getElementById('flersteg-wrap').classList.toggle('hidden', !e.target.checked);
      if (!e.target.checked) {
        document.getElementById('flersteg-check').checked = false;
        Settings.setFlersteg(false);
      }
    });

    document.getElementById('flersteg-check').addEventListener('change', e => {
      Settings.setFlersteg(e.target.checked);
    });

    document.getElementById('extra-enabled-check').addEventListener('change', e => {
      Settings.setExtraEnabled(e.target.checked);
      document.getElementById('extra-task-options').classList.toggle('hidden', !e.target.checked);
    });

    document.getElementById('extra-type-select').addEventListener('change', e => {
      Settings.setExtraType(e.target.value);
    });

    document.getElementById('extra-delay-select').addEventListener('change', e => {
      Settings.setExtraDelay(e.target.value);
    });

    document.getElementById('division-rest-check').addEventListener('change', e => {
      Settings.setDivisionRest(e.target.checked);
    });

    document.getElementById('multiple-check').addEventListener('change', e => {
      Settings.setMultipleProblems(e.target.checked);
      document.getElementById('multiple-count-wrap').classList.toggle('hidden', !e.target.checked);
    });

    document.getElementById('multiple-count-select').addEventListener('change', e => {
      Settings.setMultipleCount(e.target.value);
    });

    document.getElementById('clear-areas-btn').addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('#area-checkboxes input[type=checkbox]').forEach(cb => { cb.checked = false; });
      Settings.setAreas([]);

      document.getElementById('problemlosning-check').checked = false;
      Settings.setProblemlosning(false);
      document.getElementById('flersteg-wrap').classList.add('hidden');
      document.getElementById('flersteg-check').checked = false;
      Settings.setFlersteg(false);

      document.getElementById('extra-enabled-check').checked = false;
      Settings.setExtraEnabled(false);
      document.getElementById('extra-task-options').classList.add('hidden');

      updateConditionalSections();
      updateBildstodCheckbox();
    });
  }

  // =========================================================
  //  Init – anropas från app.js
  // =========================================================
  function init(menuToggleEl, menuOverlayEl) {
    loadSettingsIntoUI();
    bindSettingsUI();
    bindMenuCollapse();
    menuToggleEl.addEventListener('click', e => { e.stopPropagation(); toggleMenu(); });
    menuOverlayEl.addEventListener('click', closeMenu);
  }

  return { init, toggleMenu, closeMenu };
})();
