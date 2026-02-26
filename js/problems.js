// js/problems.js
// Tunn fasad – delegerar till PluginManager för problemgenerering.
// Behåller samma publika API som tidigare: generateProblem, generateExtraProblem, GRADE_CONFIG.

const Problems = (() => {

  // Fallback-pooler när inga områden är valda
  const BASE = ['addition', 'subtraktion', 'multiplikation', 'division', 'prioritet', 'oppna-utsagor', 'brak', 'geometri', 'klocka', 'matt-langd', 'matt-volym', 'matt-vikt', 'matt-tid'];
  const BASE_GR13 = [...BASE, 'tallinje', 'talsorter', 'talfoljd'];
  const BASE_GR4  = [...BASE, 'procent', 'talfoljd', 'matt-area', 'koordinatsystem', 'statistik'];
  const BASE_GR56 = [...BASE_GR4, 'negativa-tal', 'sannolikhet'];

  function generateProblem(settings) {
    // Flersteg: generera tvåstegsproblem om inställningen är aktiv
    if (settings.flersteg && settings.problemlosning) {
      return Templates.generateFlersteg(settings);
    }

    const fallback = settings.grade >= 5 ? BASE_GR56 : settings.grade >= 4 ? BASE_GR4 : BASE_GR13;
    const areas = settings.areas.length > 0 ? settings.areas : fallback;
    let area;

    if (areas.includes('blandad')) {
      const candidates = areas.filter(a => a !== 'blandad');
      area = candidates.length > 0
        ? PluginUtils.pickRandom(candidates)
        : PluginUtils.pickRandom(['addition', 'subtraktion', 'multiplikation', 'division']);
    } else {
      area = PluginUtils.pickRandom(areas);
    }

    // 'oppna-utsagor' är checkbox-värdet i HTML, 'oppna-utsaga' är plugin-typen
    const pluginType = area === 'oppna-utsagor' ? 'oppna-utsaga' : area;
    const plugin = PluginManager.get(pluginType);
    if (!plugin) return null;

    let problem;
    try {
      problem = plugin.generate(settings);
    } catch (err) {
      console.error(`[Klassrummatte] Plugin "${pluginType}" kastade ett fel:`, err);
      return null;
    }
    if (settings.problemlosning && Templates.canWrap(pluginType)) {
      problem = Templates.wrapInTemplate(problem, settings.grade);
    }
    return problem;
  }

  function generateMultipleProblems(settings) {
    const count = settings.multipleCount || 2;
    const fallback = settings.grade >= 5 ? BASE_GR56 : settings.grade >= 4 ? BASE_GR4 : BASE_GR13;
    let rawAreas = settings.areas.length > 0 ? settings.areas : fallback;

    // Expandera 'blandad' till konkreta områden
    if (rawAreas.includes('blandad')) {
      const extra = ['addition', 'subtraktion', 'multiplikation', 'division'];
      rawAreas = [...new Set([...rawAreas.filter(a => a !== 'blandad'), ...extra])];
    }

    let selectedAreas;
    if (rawAreas.length >= count) {
      const shuffled = [...rawAreas].sort(() => Math.random() - 0.5);
      selectedAreas = shuffled.slice(0, count);
    } else {
      selectedAreas = Array.from({ length: count }, () =>
        rawAreas[Math.floor(Math.random() * rawAreas.length)]
      );
    }

    return selectedAreas.map(area => {
      const pluginType = area === 'oppna-utsagor' ? 'oppna-utsaga' : area;
      const plugin = PluginManager.get(pluginType);
      if (!plugin) return null;
      let problem;
      try {
        problem = plugin.generate(settings);
      } catch (err) {
        console.error(`[Klassrummatte] Plugin "${pluginType}" kastade ett fel:`, err);
        return null;
      }
      if (settings.problemlosning && Templates.canWrap(pluginType)) {
        problem = Templates.wrapInTemplate(problem, settings.grade);
      }
      return problem;
    }).filter(Boolean);
  }

  function generateExtraProblem(settings) {
    const c = PluginUtils.cfg(settings.grade);
    switch (settings.extraType) {
      case 'uppstallning-add':   return PluginUtils.genUppstallning('add', c);
      case 'uppstallning-sub':   return PluginUtils.genUppstallning('sub', c);
      case 'uppstallning-mult':  return PluginUtils.genUppstallning('mult', c);
      case 'geometri-area':      return PluginManager.get('geometri').generate(settings, 'area');
      case 'geometri-perimeter': return PluginManager.get('geometri').generate(settings, 'perimeter');
      case 'klocka':             return PluginManager.get('klocka').generate(settings);
      default:                   return PluginUtils.genUppstallning('add', c);
    }
  }

  return { generateProblem, generateMultipleProblems, generateExtraProblem, GRADE_CONFIG: PluginUtils.GRADE_CONFIG };
})();
