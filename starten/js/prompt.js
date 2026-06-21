/* Starten – AI-prompt (kopiera-prompt + tolka JSON-svar). Porterad från startenskola. */
window.StartenPrompt = (function () {
  const SUBJECT_DESC = {
    svenska: "läsförståelsetexter på svenska",
    no: "korta faktabaserade läsförståelsetexter inom naturorienterande ämnen (biologi, fysik, kemi, teknik)",
    so: "korta faktabaserade läsförståelsetexter inom samhällsorienterande ämnen (historia, geografi, samhällskunskap, religion)",
    engelska: "korta läsförståelsetexter på engelska"
  };

  function jsonExample(subject) {
    if (subject === "engelska") {
      return '[\n  {\n    "subject": "engelska",\n    "text": "The little robot beeped twice ...",\n    "questions": ["What did the robot do?"]\n  }\n]';
    }
    return '[\n  {\n    "subject": "' + (subject || "svenska") + '",\n    "text": "Här kommer den korta texten ...",\n    "questions": ["Fråga ..."]\n  }\n]';
  }

  function build(opts) {
    const subject = SUBJECT_DESC[opts.subject] ? opts.subject : "svenska";
    const count = Math.max(1, parseInt(opts.count, 10) || 5);
    const numQuestions = Math.max(1, parseInt(opts.numQuestions, 10) || 1);
    const age = opts.age || "årskurs 4–6";
    const topic = (opts.topic || "").trim();
    const isEnglish = subject === "engelska";

    const langNote = isEnglish
      ? "- Skriv BÅDE texten och frågorna på engelska, anpassat för " + age + " som lär sig engelska.\n"
      : "- Skriv på korrekt, åldersanpassad svenska för " + age + ".\n";
    const topicLine = topic
      ? "- Alla texter ska utgå från det vi jobbar med just nu: " + topic + ".\n"
      : (subject === "no" || subject === "so"
          ? "- Variera innehållet inom ämnesområdet.\n"
          : "- Ge varje text ett eget tema (äventyr, vardag, natur, teknik, mysterium, sport, mat).\n");
    const qWord = numQuestions > 1 ? "frågor" : "fråga";
    const maxChars = (window.STARTEN_MAX_CHARS || 290);
    // Sikta på övre tredjedelen av intervallet så texterna utnyttjar utrymmet på arket.
    const targetLow  = Math.round(maxChars * 0.86); // ~250 vid 290
    const targetHigh = Math.round(maxChars * 0.97); // ~280 vid 290
    const targetWords = Math.round(((targetLow + targetHigh) / 2) / 6.3);

    return (
      "Du skapar " + SUBJECT_DESC[subject] + " för svensk grundskola (" + age + ").\n\n" +
      "Skapa " + count + " texter. Varje text ska:\n" +
      "- vara 4–6 meningar lång, engagerande och innehållsrik,\n" +
      "- sikta på " + targetLow + "–" + targetHigh + " tecken (ungefär " + targetWords + " ord). " +
        "Det är VIKTIGT att texten är så här lång – kortare texter är försiktiga och slösar plats. " +
        "Absolut tak: " + maxChars + " tecken.\n" +
      langNote + topicLine +
      "- följas av " + numQuestions + " läsförståelse" + qWord + " som kräver att man förstått texten.\n\n" +
      "Svara ENDAST med giltig JSON – en array i exakt detta format, utan inledande text, " +
      "utan förklaringar och utan markdown-kodstaket:\n\n" + jsonExample(subject) +
      "\n\nRegler:\n- " + count + " objekt i arrayen.\n" +
      '- Varje objekt har "subject": "' + subject + '", "text" och "questions".\n' +
      "- " + numQuestions + " frågor per text i \"questions\".\n" +
      "- Använd inga citattecken inuti texten som bryter JSON.\n"
    );
  }

  function extractJsonObjects(str) {
    const objs = []; let depth = 0, start = -1, inStr = false, esc = false;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') { inStr = true; continue; }
      if (ch === "{") { if (depth === 0) start = i; depth++; }
      else if (ch === "}") { if (depth > 0) { depth--; if (depth === 0 && start !== -1) { objs.push(str.slice(start, i + 1)); start = -1; } } }
    }
    return objs;
  }

  function parseResponse(raw) {
    const text = (raw || "").trim();
    if (!text) return [];
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    try { const data = JSON.parse(cleaned); return Array.isArray(data) ? data : [data]; } catch (e) {}
    const objStrings = extractJsonObjects(cleaned);
    if (objStrings.length) {
      const parsed = [];
      objStrings.forEach(function (s) { try { parsed.push(JSON.parse(s)); } catch (e) {} });
      if (parsed.length) return parsed;
    }
    const blocks = cleaned.split(/\n\s*\n/); const out = [];
    blocks.forEach(function (block) {
      const lines = block.split("\n"); let entryText = ""; const questions = [];
      lines.forEach(function (line) {
        const t = line.replace(/^[-*\d.\s]+/, "").trim();
        const mText = t.match(/^(?:text)\s*[:：]\s*(.+)$/i);
        const mFraga = t.match(/^(?:fr[åa]ga|question)\s*\d*\s*[:：]\s*(.+)$/i);
        if (mText) entryText = mText[1].trim();
        else if (mFraga) questions.push(mFraga[1].trim());
      });
      if (entryText && questions.length) out.push({ text: entryText, questions: questions });
    });
    return out;
  }

  return { build: build, parseResponse: parseResponse };
})();
