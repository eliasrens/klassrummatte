// js/plugins/PluginManager.js
// Central plugin-hanterare. Varje plugin registrerar sig själv
// via PluginManager.register(new XxxPlugin()) i slutet av sin fil.

const PluginManager = (() => {
  const registry = new Map();

  function register(plugin) {
    registry.set(plugin.type, plugin);
  }

  function get(type) {
    return registry.get(type) || null;
  }

  function getAll() {
    return [...registry.values()];
  }

  return { register, get, getAll };
})();
