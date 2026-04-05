// js/escape-store.js
// Abstraktion för lagring av escape room-data.
//
// Första implementationen använder localStorage (för lokal utveckling och test
// utan server). När Firebase är klart byts bara innehållet i save/load – API:et
// mot resten av koden är identiskt.
//
// API:
//   EscapeStore.save(payload) → Promise<string>   (returnerar kort kod)
//   EscapeStore.load(code)    → Promise<payload|null>

const EscapeStore = (() => {

  const LS_KEY_PREFIX = 'escape-room:';
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // utan 0/O/1/I för läsbarhet

  // Generera en kort kod: 4 bokstäver + "-" + 4 siffror/bokstäver
  // Ex: "KLAS-4X7B"
  function generateCode(roomId) {
    const prefix = (roomId || 'room').toUpperCase().slice(0, 4).padEnd(4, 'X');
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return prefix + '-' + suffix;
  }

  function normalizeCode(code) {
    return String(code || '').trim().toUpperCase();
  }

  // ─── localStorage-implementation ─────────────────────────────
  async function save(payload) {
    // Försök upp till 10 gånger att hitta en ledig kod
    for (let i = 0; i < 10; i++) {
      const code = generateCode(payload && payload.r);
      const key = LS_KEY_PREFIX + code;
      if (localStorage.getItem(key) === null) {
        const record = {
          payload: payload,
          createdAt: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(record));
        return code;
      }
    }
    throw new Error('Kunde inte skapa en unik kod.');
  }

  async function load(code) {
    const key = LS_KEY_PREFIX + normalizeCode(code);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      const record = JSON.parse(raw);
      return record.payload || null;
    } catch (e) {
      console.error('Korrupt escape-room-data:', e);
      return null;
    }
  }

  // Lista alla rum sparade lokalt (bra för debug/översikt i skaparen)
  function listLocal() {
    const rooms = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LS_KEY_PREFIX)) {
        try {
          const rec = JSON.parse(localStorage.getItem(k));
          rooms.push({ code: k.slice(LS_KEY_PREFIX.length), createdAt: rec.createdAt });
        } catch (_) {}
      }
    }
    return rooms.sort((a, b) => b.createdAt - a.createdAt);
  }

  async function remove(code) {
    localStorage.removeItem(LS_KEY_PREFIX + normalizeCode(code));
  }

  return { save, load, listLocal, remove, normalizeCode };
})();
