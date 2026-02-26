// js/plugins/_utils.js
// Tunn kombinerare – slår ihop PluginMathUtils och PluginRenderUtils till PluginUtils.
// Kräver att _math-utils.js och _render-utils.js laddats först.

const PluginUtils = (() => {
  return { ...PluginMathUtils, ...PluginRenderUtils };
})();
