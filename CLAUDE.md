# Klassrummatte – AI-kontext

Svensk matematikapp för klassrumsprojektor. Åk 1–6. Vanilla JS, ingen byggprocess, ingen bundler.

## Filstruktur

```
index.html          – UI-struktur (menyer, scen, extrauppgiftspanel)
css/style.css       – All styling
js/
  settings.js       – Inställningar + localStorage-persistens (Settings)
  templates.js      – Svenska textuppgiftsmallar (Templates)
  problems.js       – Problemgenerering, ren modul (Problems)
  render.js         – All DOM-rendering av problem (Renderer)
  bildstod.js       – Bildstöd-prickar och figurer (Bildstod)
  answer.js         – Visa svar + upprepningsskydd (Answer)
  menu.js           – Menyhantering + inställnings-UI (Menu)
  app.js            – Orkestration, scen-events, problemflöde (App)
```

## Moduler och ansvar

| Modul | Globalt namn | Ansvar |
|---|---|---|
| `settings.js` | `Settings` | Läs/skriv inställningar, localStorage-persistens |
| `templates.js` | `Templates` | Textuppgiftsmallar med svenska namn och föremål |
| `problems.js` | `Problems` | Generera problem-objekt utifrån settings |
| `render.js` | `Renderer` | Rita problem till valfri container-div |
| `bildstod.js` | `Bildstod` | Pedagogiskt bildstöd (prickar, rutnät, mått-block) |
| `answer.js` | `Answer` | Visa rätt svar; `isSameProblem` för upprepningsskydd |
| `menu.js` | `Menu` | Hamburgarmeny, hopfällbara grupper, inställnings-UI |
| `app.js` | `App` | Scen-klick, problemflöde, timers, DOM-refs, orkestration |

Laddningsordning i `index.html`: settings → templates → problems → render → bildstod → answer → menu → app.

## Arkitekturmönster

- **IIFE-moduler** – varje fil definierar `const ModulNamn = (() => { ... return {}; })();`
- **Inga importer/exports** – globala variabler räcker utan bundler
- **Ren datagenerering** – `problems.js` returnerar enkla objekt, ingen DOM-kunskap
- **Rendera med container** – `Renderer.renderProblem(problem, container)` tar emot valfri div
- **State i app.js** – `problemVisible`, timers, `currentProblem`, `lastProblem` samlas i App

## Problem-objektet

Alla generatorer i `problems.js` returnerar ett objekt med minst `{ type, answer }`:

```
{ type: 'addition', a, b, operator, answer }
{ type: 'division', a, b, operator, answer, bildstodEligible, rows, cols }
{ type: 'oppna-utsaga', expression, answer }   // '_' markerar blanken
{ type: 'klocka', hours, minutes, questionType, minutesToAdd, answer }
{ type: 'geometri', shape, dimensions, geoQuestion, answer }
{ type: 'matt-langd' | 'matt-volym', conversion: { from, fromUnit, toUnit, factor }, answer }
{ type: 'brak', questionType, ..., answer }
{ type: 'prioritet', expression, answer }
// Med problemlosning: true dessutom isTextProblem: true, textTemplate: '<mening>'
```

## Viktiga detaljer

- **`oppna-utsagor`** är area-värdet (checkbox i HTML). **`oppna-utsaga`** är problem-typen.
- **Tabellval-selektor**: måste vara `#multdiv-mode-checkboxes > label input` (ej `input`) för att undvika att träffa de inre checkboxarna för specifika tabeller i `#specific-tables-wrap`.
- **`specificTables`** (array 1–9) filtreras i `genMultiplikation`, `genDivision` och `genOppnaUtsaga`.
- **Bildstöd** prependas till `#problem-display` med `position: absolute; right: calc(100% + 1.5rem); top: 50%` – utanför layoutflödet.
- **`#problem-display`** har `position: relative` som ankare för bildstöd (absolut till vänster) och svarruta (absolut nedanför).
- **`.open-blank`**: `overflow: hidden` + `height: 1.1em` – CSS-spec-trick: baseline = underkant alltid → strecket på fast höjd oavsett om tomt eller fyllt.
- **Svar-knapp** (`#show-answer-btn`) har `e.stopPropagation()` för att inte trigga scen-klick.
- **Menyer**: `#matematikarea-group-label` startar öppen; alla andra ihopfällda via `collapseMenuLabel`.
- **Upprepningsskydd**: retry-loop (max 5 försök) med `Answer.isSameProblem(problem, lastProblem)`.

## Lägga till ett nytt matematikområde

1. `problems.js` – lägg till en `genXxx(c, grade)` funktion + `case 'xxx'` i `dispatchGenerate`.
2. `render.js` – lägg till `renderXxx(problem, container)` + `case 'xxx'` i `renderProblem`.
3. `answer.js` – lägg till `case 'xxx'` i `showAnswer` och `isSameProblem` om nödvändigt.
4. `bildstod.js` – lägg till `case 'xxx'` i `hasBildstodSupport` och `buildBildstodEl` om relevant.
5. `index.html` – lägg till en checkbox i `#area-checkboxes`.
6. `settings.js` – inga ändringar behövs (areas sparas dynamiskt).
7. `menu.js` – uppdatera `updateConditionalSections` om ett undermenyssystem behövs.

## CSS-klasser att känna till

| Klass | Syfte |
|---|---|
| `.bildstod-container` | Wrapper för bildstöd, absolut positionerat till vänster om problem |
| `.open-blank` | Blank-streck i öppna utsagor |
| `.open-blank--answered` | Rödmarkerad blank när svar visas |
| `.answer-value` | Röd text för det rätta svaret |
| `.answer-box` | "Svar: X"-ruta (absolut under problem) för klocka/geometri |
| `.show-answer-btn` | Diskret svarknapp nere-höger på scenen |
| `.specific-tables-wrap` | Dold/visad sektion med specifika tabellval (1–9) |
| `.check-label--sm` | Liten checkbox-label för tabellvalen |
| `.problem-visible` | Läggs på `show-answer-btn` när problem visas |
| `.hidden-hint` | Döljer "Tryck för att börja"-texten efter första uppgiften |

## Linting / kodstil

- Inga externa beroenden, inget build-steg
- Vanilla ES2020 – `const`/`let`, arrow functions, template literals, spread, destructuring
- Inga klasser, inga ES modules
- Svenska kommentarer och variabelnamn
