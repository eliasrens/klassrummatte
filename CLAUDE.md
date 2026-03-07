# Klassrummatte – AI-kontext

Svensk matematikapp för klassrumsprojektor. Åk 1–6. Vanilla JS, ingen byggprocess, ingen bundler.

## Filstruktur

```
index.html          – UI-struktur (menyer, scen, extrauppgiftspanel)
css/style.css       – All styling
js/
  plugins/
    _utils.js       – Delade helpers: PluginUtils (randInt, cfg, renderArithmetic, bildstöd-dots, m.m.)
    BasePlugin.js   – Basklass för alla plugins (ES6 class)
    PluginManager.js – IIFE-register (Map-baserat), register/get/getAll
    addition.js     – AdditionPlugin (självregistrerande)
    subtraktion.js  – SubtraktionPlugin
    multiplikation.js – MultiplikationPlugin
    division.js     – DivisionPlugin
    prioritet.js    – PrioritetPlugin
    oppna-utsaga.js – OppnaUtsagaPlugin
    brak.js         – BrakPlugin
    geometri.js     – GeometriPlugin (inkl. privat buildShapeSVG)
    klocka.js       – KlockaPlugin (inkl. privat buildClockSVG)
    matt-langd.js   – MattLangdPlugin
    matt-volym.js   – MattVolymPlugin
  settings.js       – Inställningar + localStorage-persistens (Settings)
  templates.js      – Svenska textuppgiftsmallar (Templates)
  problems.js       – Tunn fasad: area-val + Templates-wrap (Problems)
  render.js         – Tunn fasad: delegerar till plugin.render() (Renderer)
  bildstod.js       – Tunn fasad: delegerar till plugin.buildBildstod() (Bildstod)
  answer.js         – Tunn fasad: delegerar till plugin.showAnswer/isSameProblem (Answer)
  menu.js           – Menyhantering + inställnings-UI (Menu)
  app.js            – Orkestration, scen-events, problemflöde (App)
```

## Laddningsordning i index.html

plugins/_utils.js → BasePlugin.js → PluginManager.js → [alla 11 plugins] → settings.js → templates.js → problems.js → render.js → bildstod.js → answer.js → menu.js → app.js

## Plugin-arkitektur

Varje matematikområde är ett självständigt plugin. Alla plugins extends BasePlugin och override:ar relevanta metoder:

```javascript
class XxxPlugin extends BasePlugin {
  constructor() { super(); this.type = 'xxx'; }
  generate(settings) { ... }          // Returnerar problem-objekt
  render(problem, container) { ... }  // DOM-rendering
  showAnswer(problem, container, btn) { ... }
  isSameProblem(a, b) { ... }
  hasBildstodSupport(problem, settings) { ... }
  buildBildstod(problem, settings) { ... }
}
PluginManager.register(new XxxPlugin()); // Självregistrering sist i filen
```

**BasePlugin defaults:**
- `showAnswer`: tar bort `.answer-hidden`, sätter btn.disabled=true + textContent='✓'
- `isSameProblem`: returnerar false
- `hasBildstodSupport`: returnerar false
- `buildBildstod`: returnerar null

## PluginUtils – viktiga delade funktioner

| Funktion | Används av |
|---|---|
| `randInt`, `pickRandom`, `gcd`, `lcm` | Alla plugins |
| `GRADE_CONFIG`, `cfg(grade)` | Alla plugins |
| `hasCarry`, `hasBorrow`, `genNoCarryAdd`, `genNoCarrySub` | Addition, Subtraktion |
| `genDecimaler(grade, op)` | Addition, Subtraktion |
| `genUppstallningAdd/Sub(grade, vaxling)` | Addition, Subtraktion |
| `genFlersteg(grade)` | Addition |
| `genUppstallning(subtype, c)` | problems.js (extra-panel) |
| `renderArithmetic`, `renderDecimaler`, `renderUppstallning`, `renderMatt` | Plugins + fasader |
| `appendText`, `buildFractionEl`, `appendAnswerBox` | Plugins |
| `buildArithmeticDots`, `buildDivisionGrid` | Addition/Sub/Mult/Div plugins |
| `canBuildMattBildstod`, `buildMattBildstodEl` | MattLangd, MattVolym |

## Moduler och ansvar (fasader)

| Modul | Globalt namn | Ansvar |
|---|---|---|
| `settings.js` | `Settings` | Läs/skriv inställningar, localStorage-persistens |
| `templates.js` | `Templates` | Textuppgiftsmallar med svenska namn och föremål |
| `problems.js` | `Problems` | Area-val + blandad-logik + Templates-wrap; delegerar generate till plugin |
| `render.js` | `Renderer` | Tunn fasad; delegerar render till plugin; hanterar text-problem |
| `bildstod.js` | `Bildstod` | Tunn fasad; delegerar till plugin; hanterar animation/DOM-insertion |
| `answer.js` | `Answer` | Tunn fasad; delegerar showAnswer/isSameProblem till plugin |
| `menu.js` | `Menu` | Hamburgarmeny, hopfällbara grupper, inställnings-UI |
| `app.js` | `App` | Scen-klick, problemflöde, timers, DOM-refs, orkestration |

## Problem-objektet

Alla plugins returnerar ett objekt med minst `{ type, answer }`:

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
- **`specificTables`** (array 1–9) filtreras i MultiplikationPlugin, DivisionPlugin och OppnaUtsagaPlugin.
- **Bildstöd** prependas till `#problem-display` med `position: absolute; right: calc(100% + 1.5rem); top: 50%` – utanför layoutflödet.
- **`#problem-display`** har `position: relative` som ankare för bildstöd (absolut till vänster) och svarruta (absolut nedanför).
- **`.open-blank`**: `overflow: hidden` + `height: 1.1em` – CSS-spec-trick: baseline = underkant alltid → strecket på fast höjd oavsett om tomt eller fyllt.
- **Svar-knapp** (`#show-answer-btn`) har `e.stopPropagation()` för att inte trigga scen-klick.
- **Menyer**: `#matematikarea-group-label` startar öppen; alla andra ihopfällda via `collapseMenuLabel`.
- **Upprepningsskydd**: retry-loop (max 5 försök) med `Answer.isSameProblem(problem, lastProblem)`.

## Lägga till ett nytt matematikområde (3 steg)

1. Skapa `js/plugins/nytt-omrade.js` – extend BasePlugin, override metoder, anropa `PluginManager.register(new NyttOmradePlugin())` sist i filen.
2. Lägg till `<script src="js/plugins/nytt-omrade.js">` i `index.html` (bland plugin-scripts, före settings.js).
3. Lägg till en checkbox i `#area-checkboxes` i `index.html`.

*(Valfritt steg 4: uppdatera `menu.js updateConditionalSections` om området behöver ett eget menysegment)*

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
- ES6 klasser tillåts i `js/plugins/` (BasePlugin + plugins); övriga filer använder IIFE-moduler
- Inga ES modules
- Svenska kommentarer och variabelnamn
