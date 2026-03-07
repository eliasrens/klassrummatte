// js/custom-problems.js
// Egna problemlösningsuppgifter: CSV-mall, import (fil eller klistra in), lagring.
// Beror på Settings (getCustomProblems, setCustomProblems).

const CustomProblems = (() => {

  const CSV_HEADER = 'Fråga,Svar,Område';
  const CSV_EXAMPLE = [
    'Emma har 12 pennor och får 5 till. Hur många pennor har hon nu?,17',
    'En bok har 48 sidor. Leo har läst 19 sidor. Hur många sidor har han kvar?,29',
  ];

  /**
   * Returnerar CSV-sträng för nedladdning (mall med rubrik och exempelrader).
   */
  function getTemplateCsv() {
    const lines = [CSV_HEADER, ...CSV_EXAMPLE];
    return '\uFEFF' + lines.join('\r\n'); // BOM för UTF-8 i Excel
  }

  /**
   * Laddar ner mall-fil (CSV).
   */
  function downloadTemplate() {
    const csv = getTemplateCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'klassrummatte-egna-uppgifter-mall.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Parsar en rad CSV. Stödjer citattecken: "text med, komma" blir ett fält.
   * Returnerar array med fält.
   */
  function parseCsvLine(line, delimiter) {
    const out = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (inQuotes) {
        current += c;
      } else if (c === delimiter) {
        out.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    out.push(current.trim());
    return out;
  }

  /**
   * Gissar avgränsare från rubrikraden (komma eller semicolon).
   */
  function detectDelimiter(headerLine) {
    const bySemicolon = headerLine.split(';').map(s => s.trim().toLowerCase());
    if (bySemicolon.some(c => c === 'fråga' || c === 'fraga')) return ';';
    return ',';
  }

  /**
   * Hittar kolumnindex för Fråga, Svar, Område (ok om Område saknas).
   */
  function getColumnIndices(headers) {
    const lower = headers.map(h => (h || '').trim().toLowerCase());
    const idxFraga = lower.findIndex(h => h === 'fråga' || h === 'fraga');
    const idxSvar = lower.findIndex(h => h === 'svar');
    const idxOmrade = lower.findIndex(h => h === 'område' || h === 'omrade');
    return { idxFraga, idxSvar, idxOmrade };
  }

  /**
   * Parsar CSV-text till array av { question, answer, area }.
   * Returnerar { success: true, problems: [...] } eller { success: false, error: string }.
   */
  function parseCsvToProblems(csvText) {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return { success: false, error: 'Filen behöver en rubrikrad och minst en uppgift.' };
    }
    const delimiter = detectDelimiter(lines[0]);
    const headers = parseCsvLine(lines[0], delimiter);
    const { idxFraga, idxSvar, idxOmrade } = getColumnIndices(headers);
    if (idxFraga < 0 || idxSvar < 0) {
      return { success: false, error: 'Kolumner "Fråga" och "Svar" krävs. Kontrollera rubrikraden.' };
    }
    const problems = [];
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCsvLine(lines[i], delimiter);
      const question = (fields[idxFraga] || '').trim();
      const answer = (fields[idxSvar] != null ? String(fields[idxSvar]).trim() : '');
      if (!question) continue; // hoppa över tomma rader
      const area = idxOmrade >= 0 && fields[idxOmrade] != null ? String(fields[idxOmrade]).trim() : '';
      problems.push({ question, answer, area: area || undefined });
    }
    if (problems.length === 0) {
      return { success: false, error: 'Inga giltiga uppgifter hittades (minst Fråga måste vara ifylld).' };
    }
    return { success: true, problems };
  }

  /**
   * Importerar CSV-text: parsar och sparar i Settings. Returnerar samma som parseCsvToProblems.
   */
  function importFromCsvText(csvText) {
    const result = parseCsvToProblems(csvText);
    if (result.success) {
      Settings.setCustomProblems(result.problems);
    }
    return result;
  }

  return {
    getTemplateCsv,
    downloadTemplate,
    parseCsvToProblems,
    importFromCsvText,
  };
})();
