// js/bildstod.js
// Tunn fasad – delegerar till PluginManager för bildstöd-logiken.
// Behåller samma publika API: hasBildstodSupport, appendBildstod.
// appendBildstod hanterar animation och DOM-insertion lokalt.

const Bildstod = (() => {

  function hasBildstodSupport(problem, settings) {
    const plugin = PluginManager.get(problem.type);
    return plugin ? plugin.hasBildstodSupport(problem, settings) : false;
  }

  function appendBildstod(problem, settings, problemDisplay, problemVisible) {
    if (!problemVisible) return;
    const plugin = PluginManager.get(problem.type);
    if (!plugin) return;
    const el = plugin.buildBildstod(problem, settings);
    if (!el) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'bildstod-container bildstod-anim';
    wrapper.appendChild(el);
    problemDisplay.prepend(wrapper);
  }

  return { hasBildstodSupport, appendBildstod };
})();
