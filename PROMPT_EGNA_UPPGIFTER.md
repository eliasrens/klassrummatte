# Prompt: Skapa egna problemlösningsuppgifter till Klassrummatte

Använd denna prompt (eller anpassa den) när du vill att en AI ska generera en CSV-fil med färdiga problemlösningsuppgifter som läraren kan importera i appen Klassrummatte.

---

## Mall för AI-prompten

Kopiera och klistra in nedan i din AI-chatt. Ändra **område**, **årskurs** och **antal** efter behov.

```
Du ska skapa en CSV-fil med svenska matematikuppgifter (problemlösning) för grundskolan.
Filen ska användas i appen Klassrummatte och importeras av läraren.

**Format (exakt):**
- Första raden måste vara rubrikraden: Fråga,Svar,Område
- Varje uppgift är en rad med tre kolumner, avgränsade med komma.
- Kolumn 1 – Fråga: Uppgiftstexten på svenska (en tydlig problemlösningsfråga).
- Kolumn 2 – Svar: Det exakta svaret (tal, enhet om det behövs, t.ex. "17" eller "24 kr").
- Kolumn 3 – Område: Valfri etikett, t.ex. addition, subtraktion, multiplikation, division, bråk, procent, klocka, mått, geometri.

**Krav:**
- Skriv [ANTAL] uppgifter inom området [OMRÅDE].
- Lämplig svårighetsgrad för årskurs [ÅRSKURS] (åk 1–6).
- Varje fråga ska vara en kort, tydlig textuppgift (en eller två meningar).
- Använd svenska namn (t.ex. Emma, Leo, Maja) och vardagliga situationer.
- Svaret ska vara entydigt (ett tal eller ett kort svar).
- Om en fråga innehåller kommatecken, sätt hela fältet inom citationstecken, t.ex. "Emma har 5 äpplen, 3 päron och 2 bananer. Hur många frukter har hon?"

**Exempel på rader (efter rubrikraden):**
Emma har 12 pennor och får 5 till. Hur många pennor har hon nu?,17,addition
En bok har 48 sidor. Leo har läst 19 sidor. Hur många sidor har han kvar?,29,subtraktion

Ge mig endast CSV-innehållet (rubrik + alla rader), så att jag kan spara det som .csv och importera i Klassrummatte.
```

**Ersätt i prompten:**
- `[ANTAL]` – t.ex. 10, 15, 20
- `[OMRÅDE]` – t.ex. addition, subtraktion, multiplikation, division, bråk, procent, klocka, mått (längd/vikt/tid/area/volym), geometri
- `[ÅRSKURS]` – t.ex. 2, 3, 4

---

## Så importerar läraren i Klassrummatte

1. Öppna **Inställningar** (hamburgermeny).
2. Under **Egna uppgifter**: kryssa i **Använd egna uppgifter**.
3. **Ladda ner mall (CSV)** om du vill se formatet.
4. **Importera fil**: välj din sparade CSV-fil, eller **Klistra in CSV** i textrutan och klicka **Importera från text**.
5. När uppgifter är importerade blandas de in bland de valda matematikområdena vid **Tryck för ny uppgift**.

---

## Filformat (teknisk spec)

- **Teckenkodning:** UTF-8 (Excel: Spara som → CSV UTF-8 (kommaavgränsad)).
- **Avgränsare:** Komma (`,`) eller semicolon (`;`) – appen gissar från rubrikraden.
- **Kolumner:** `Fråga` (obligatorisk), `Svar` (obligatorisk), `Område` (valfri).
- **Citering:** Om texten innehåller komma, sätt hela fältet i dubbelcitationstecken: `"Emma har 5, 3 och 2. Summa?"`
