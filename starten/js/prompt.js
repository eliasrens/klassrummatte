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
    const maxChars = (window.STARTEN_MAX_CHARS || 250);
    // Sikta på övre tredjedelen av intervallet så texterna utnyttjar utrymmet på arket.
    const targetLow  = Math.round(maxChars * 0.86); // ~215 vid 250
    const targetHigh = Math.round(maxChars * 0.97); // ~243 vid 250
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

  /* ── Veckotext: EN längre text för hela veckan + en fråga per dag ──
     Teckentaket är uppmätt mot arket. Antalet stycken måste också begränsas
     eftersom varje styckesbrytning kostar höjd – bara ett teckentak släpper
     igenom texter som ändå svämmar över spalten. */
  // Ämnesbeskrivningar för veckoformatet. SUBJECT_DESC duger inte här –
  // den säger "korta texter", vilket är raka motsatsen till en veckotext.
  const WEEK_SUBJECT_DESC = {
    svenska: "en längre läsförståelsetext på svenska",
    no: "en längre faktatext inom naturorienterande ämnen (biologi, fysik, kemi, teknik)",
    so: "en längre faktatext inom samhällsorienterande ämnen (historia, geografi, samhällskunskap, religion)",
    engelska: "en längre läsförståelsetext på engelska"
  };

  function buildWeek(opts) {
    const subject = WEEK_SUBJECT_DESC[opts.subject] ? opts.subject : "svenska";
    const age = opts.age || "årskurs 4–6";
    const topic = (opts.topic || "").trim();
    const isEnglish = subject === "engelska";
    // Berättande bara för svenska/engelska. NO och SO ska vara faktatext –
    // annars blandas riktiga fakta med påhittad handling.
    const isStory = (subject === "svenska" || subject === "engelska");
    const max = window.STARTEN_WEEK_MAX_CHARS || 1400;
    const low = Math.round(max * 0.93);
    const words = Math.round(((low + max) / 2) / 6.3);

    const langNote = isEnglish
      ? "- Skriv BÅDE texten och frågorna på engelska, anpassat för " + age + " som lär sig engelska.\n"
      : "- Skriv på korrekt, åldersanpassad svenska för " + age + ".\n";
    const formNote = isStory
      ? "- Skriv en berättande text med en handling som utvecklas, och avsluta gärna med något olöst.\n"
      : "- Skriv en sammanhängande faktatext som förklarar ämnet steg för steg. Hitta INTE på någon " +
        "berättelse eller påhittade personer – allt innehåll ska vara korrekt och gå att lita på. " +
        "Konkreta exempel, jämförelser och siffror gör texten intressant.\n";
    const topicLine = topic
      ? "- Texten ska utgå från det vi jobbar med just nu: " + topic + ".\n"
      : (isStory
          ? "- Välj ett eget tema som håller hela veckan (äventyr, mysterium, vardag, natur, teknik).\n"
          : "- Välj ett tydligt avgränsat område inom ämnet, tillräckligt rikt för en hel veckas frågor.\n");

    return (
      "Du skapar " + WEEK_SUBJECT_DESC[subject] + " för svensk grundskola (" + age + ").\n" +
      "Texten används hela veckan: eleverna läser samma text varje dag och svarar på en ny fråga per dag.\n\n" +
      "Krav på texten:\n" +
      "- " + low + "–" + max + " tecken (ungefär " + words + " ord). Det är VIKTIGT att texten är så här lång – " +
        "kortare texter slösar bort utrymmet på arket och ger för lite att arbeta med under en vecka. " +
        "Absolut tak: " + max + " tecken.\n" +
      "- Dela upp den i 7–9 stycken om 2–4 meningar vardera, åtskilda med dubbla radbrytningar (\\n\\n). " +
        "Undvik många enmeningsstycken – de äter upp plats utan att ge mer innehåll.\n" +
      formNote + langNote + topicLine +
      "- Ge texten en kort titel på högst 40 tecken.\n\n" +
      "Krav på frågorna:\n" +
      "- Exakt 5 frågor, en för varje dag måndag till fredag.\n" +
      "- Ordna dem så att de blir svårare under veckan: börja med sådant som står direkt i texten " +
        "och avsluta med frågor som kräver att man drar egna slutsatser.\n" +
      "- Varje fråga ska gå att besvara på två skrivrader.\n\n" +
      "Svara ENDAST med giltig JSON i exakt detta format, utan förklaringar och utan markdown-kodstaket:\n\n" +
      '{\n  "title": "Textens titel",\n  "text": "Första stycket ...\\n\\nAndra stycket ...",\n' +
      '  "questions": ["Fråga måndag", "Fråga tisdag", "Fråga onsdag", "Fråga torsdag", "Fråga fredag"]\n}\n\n' +
      "Regler:\n- Ett enda objekt, inte en array.\n" +
      "- Styckesbrytningar skrivs som \\n\\n inuti \"text\".\n" +
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

  /* ── Veckans ord: 10 träningsord ──
     Orden ska rymmas i en 4,8 cm bred ruta, därav längdgränsen. */
  function buildWords(opts) {
    const age = opts.age || "årskurs 4–6";
    const topic = (opts.topic || "").trim();
    const count = opts.count || 10;

    return (
      "Du väljer ut " + count + " svenska träningsord för rättstavning (" + age + ").\n" +
      "Eleverna skriver av varje ord en gång per dag, måndag till fredag.\n\n" +
      "Krav:\n" +
      "- Exakt " + count + " ord.\n" +
      "- Varje ord högst 13 bokstäver – längre ord får inte plats i rutan.\n" +
      "- Blanda svårighetsgrad: några lätta, några som utmanar.\n" +
      "- Ta gärna med ord som brukar stavas fel (dubbelteckning, sj- och tj-ljud, " +
        "ng-ljud, stumt h, ord på -ig eller -lig).\n" +
      (topic
        ? "- Utgå från detta tema: " + topic + ".\n"
        : "- Välj vardagsnära ord som eleverna känner igen.\n") +
      "- Skriv varje ord i grundform och med STOR begynnelsebokstav.\n\n" +
      "Svara ENDAST med giltig JSON, utan förklaringar och utan markdown-kodstaket:\n\n" +
      '{ "ord": ["Glass", "Regnbåge", "Köttbullar"] }\n'
    );
  }

  // Plockar ut ordlistan ur ett AI-svar. Accepterar { ord: [...] },
  // { words: [...] }, en ren array, eller radbruten text som sista utväg.
  function parseWordsResponse(raw) {
    const text = (raw || "").trim();
    if (!text) return [];
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    let data = null;
    try { data = JSON.parse(cleaned); } catch (e) {}
    let list = null;
    if (Array.isArray(data)) list = data;
    else if (data && Array.isArray(data.ord)) list = data.ord;
    else if (data && Array.isArray(data.words)) list = data.words;
    if (!list) {
      const m = cleaned.match(/\[[^\]]*\]/);
      if (m) { try { list = JSON.parse(m[0]); } catch (e) {} }
    }
    if (!list) list = cleaned.split(/[\n,;]+/);
    return list.map(function (x) { return String(x || "").replace(/^[-*\d.\s"]+|["\s]+$/g, "").trim(); })
      .filter(Boolean)
      // Prompten ber om stor begynnelsebokstav, men modellen glömmer ibland.
      .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); });
  }

  // Plockar ut veckotext-objektet ur ett AI-svar. Accepterar både ett ensamt
  // objekt och en array med ett objekt i.
  function parseWeekResponse(raw) {
    const list = parseResponse(raw);
    const o = list.length ? list[0] : null;
    if (!o || !o.text) return null;
    const qs = Array.isArray(o.questions) ? o.questions : (o.question ? [o.question] : []);
    return {
      title: String(o.title || o.rubrik || "").trim(),
      text: String(o.text).trim(),
      questions: qs.map(function (q) { return String(q || "").trim(); }).filter(Boolean).slice(0, 5)
    };
  }

  return {
    build: build, buildWeek: buildWeek, buildWords: buildWords,
    parseResponse: parseResponse, parseWeekResponse: parseWeekResponse,
    parseWordsResponse: parseWordsResponse
  };
})();
