// js/arbetsblad-problemlosning.js
// Problemlösning: sidebar-byggning, import, config-läsning.
// Stateless DOM-funktioner. Laddas före arbetsblad.js.

const ArbetsbladPL = (() => {

  const { PROBLEMLOSNING_AREAS, AREA_CONFIG } = ArbetsbladConfig;

  function readPLConfig() {
    const grade   = parseInt(document.getElementById('ab-grade').value) || 3;
    const title   = document.getElementById('ab-title').value.trim()   || 'Problemlösning';
    const source  = document.querySelector('input[name="pl-source"]:checked')?.value || 'auto';
    const perPage = parseInt(document.querySelector('input[name="pl-layout"]:checked')?.value) || 6;
    const pages   = parseInt(document.getElementById('pl-pages').value) || 1;
    const showAns  = document.getElementById('pl-show-answers')?.checked || false;
    const showGrid = document.getElementById('pl-show-grid')?.checked ?? true;
    const cols     = 2;

    // Hämta valda områden
    const selectedAreas = [];
    document.querySelectorAll('#pl-area-checks input[type="checkbox"]:checked').forEach(cb => {
      selectedAreas.push(cb.value);
    });

    return { grade, title, source, perPage, pages, showAns, showGrid, cols, selectedAreas };
  }

  function buildPLSidebar() {
    const container = document.getElementById('pl-area-checks');
    if (!container) return;
    container.innerHTML = '';

    PROBLEMLOSNING_AREAS.forEach(area => {
      // Hitta label från AREA_CONFIG
      let label = area;
      for (const cat of AREA_CONFIG) {
        const found = cat.areas.find(a => a.id === area);
        if (found) { label = found.label; break; }
      }

      const row = document.createElement('label');
      row.className = 'sidebar-check-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = area;
      cb.checked = false;
      row.appendChild(cb);
      row.appendChild(document.createTextNode(' ' + label));
      container.appendChild(row);
    });

    // Visa info om egna uppgifter
    const info = document.getElementById('pl-egna-info');
    if (info) {
      const stored = typeof Settings !== 'undefined' ? Settings.getCustomProblems() : [];
      info.textContent = stored.length > 0
        ? `${stored.length} lagrade uppgifter`
        : 'Inga importerade uppgifter';
    }

    // Visa/dölj auto-only sektioner beroende på källa
    document.querySelectorAll('input[name="pl-source"]').forEach(radio => {
      radio.addEventListener('change', updatePLSourceVisibility);
    });
    updatePLSourceVisibility();
  }

  function updatePLSourceVisibility() {
    const source = document.querySelector('input[name="pl-source"]:checked')?.value || 'auto';
    const showAuto = source === 'auto' || source === 'mix';
    const showImport = source === 'egna' || source === 'mix';
    document.querySelectorAll('.pl-auto-only').forEach(el => {
      el.style.display = showAuto ? '' : 'none';
    });
    const importSection = document.getElementById('pl-import-section');
    if (importSection) importSection.classList.toggle('hidden', !showImport);
  }

  function initPLImport() {
    // Ladda ner mall
    document.getElementById('pl-download-template')?.addEventListener('click', () => {
      if (typeof CustomProblems !== 'undefined') CustomProblems.downloadTemplate();
    });

    // Import från fil
    document.getElementById('pl-file-input')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = CustomProblems.importFromCsvText(reader.result);
        if (result.success) Settings.setSessionActiveSetId(result.setId);
        showPLImportStatus(result);
      };
      reader.readAsText(file, 'UTF-8');
    });

    // Import från textfält
    document.getElementById('pl-import-paste')?.addEventListener('click', () => {
      const text = document.getElementById('pl-paste')?.value || '';
      if (!text.trim()) return;
      const result = CustomProblems.importFromCsvText(text);
      if (result.success) Settings.setSessionActiveSetId(result.setId);
      showPLImportStatus(result);
    });
  }

  function showPLImportStatus(result) {
    const el = document.getElementById('pl-import-status');
    if (!el) return;
    if (result.success) {
      el.className = 'pl-import-status success';
      el.textContent = `${result.problems.length} uppgifter importerade! ★ Aktiv session`;
    } else {
      el.className = 'pl-import-status error';
      el.textContent = result.error;
    }
    // Uppdatera info-texten
    updatePLEgnaInfo();
  }

  function updatePLEgnaInfo() {
    const info = document.getElementById('pl-egna-info');
    if (!info) return;
    const stored = typeof Settings !== 'undefined' ? Settings.getCustomProblems() : [];
    info.textContent = stored.length > 0
      ? `${stored.length} lagrade uppgifter`
      : 'Inga importerade uppgifter';
  }

  return { readPLConfig, buildPLSidebar, updatePLSourceVisibility, initPLImport, showPLImportStatus, updatePLEgnaInfo };
})();
