/* Starten – enkel lösenords-spärr (klient-sidan).
   - Lösenordet jämförs som SHA-256-hash så det inte är direkt läsbart i source.
   - Godkänd inloggning sparas i localStorage så lärare inte måste logga in dagligen.
   - OBS: detta är en UI-spärr (ej riktig säkerhet). Firestore-regler ger validering. */
(function () {
  "use strict";

  const KEY_AUTH   = "starten.auth.v1";
  const PWD_HASH   = "87097611d3b17daf31566828441a4b3ddf668cf9bd4fb2663bda960b388a6ed6";

  async function sha256(text) {
    const buf  = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash))
      .map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  function isAuthed() {
    try { return localStorage.getItem(KEY_AUTH) === "ok"; } catch (e) { return false; }
  }
  function markAuthed() {
    try { localStorage.setItem(KEY_AUTH, "ok"); } catch (e) {}
  }
  function clearAuth() {
    try { localStorage.removeItem(KEY_AUTH); } catch (e) {}
  }

  function showGate() {
    const gate = document.getElementById("auth-gate");
    if (gate) gate.classList.remove("hidden");
    document.body.classList.add("auth-locked");
  }
  function hideGate() {
    const gate = document.getElementById("auth-gate");
    if (gate) gate.classList.add("hidden");
    document.body.classList.remove("auth-locked");
  }

  async function tryLogin(pwd) {
    const hash = await sha256(pwd || "");
    if (hash === PWD_HASH) {
      markAuthed();
      hideGate();
      return true;
    }
    return false;
  }

  function init() {
    if (isAuthed()) { hideGate(); return; }
    showGate();
    const form = document.getElementById("auth-form");
    const input = document.getElementById("auth-input");
    const err = document.getElementById("auth-error");
    if (!form || !input) return;
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      err.textContent = "";
      const ok = await tryLogin(input.value);
      if (!ok) { err.textContent = "Fel lösenord"; input.select(); }
      else { input.value = ""; }
    });
    setTimeout(function () { input.focus(); }, 50);
  }

  // Exponera utloggning för debug / framtida UI
  window.StartenAuth = { logout: function () { clearAuth(); showGate(); } };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
