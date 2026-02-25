// js/problems.js
// Tunn fasad – delegerar till PluginManager för problemgenerering.
// Behåller samma publika API som tidigare: generateProblem, generateExtraProblem, GRADE_CONFIG.

const Problems = (() => {

  function generateProblem(settings) {
    const areas = settings.areas.length > 0 ? settings.areas : ['addition'];
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

    let problem = plugin.generate(settings);
    if (settings.problemlosning && Templates.canWrap(pluginType)) {
      problem = Templates.wrapInTemplate(problem, settings.grade);
    }
    return problem;
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

  return { generateProblem, generateExtraProblem, GRADE_CONFIG: PluginUtils.GRADE_CONFIG };
})();
