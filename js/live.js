// js/live.js
// Live-läge: realtids-svar via Supabase Realtime.
// Sessionsmodell: QR-koden skannas EN gång per lektion.
// Varje ny uppgift är en ny "omgång" (round_id) inom samma session.
// Beror på: Supabase JS SDK (CDN), QRCode.js (CDN).

const LiveMode = (() => {
  const SUPABASE_URL = 'https://zsmnegroxrthbgcwmrob.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzbW5lZ3JveHJ0aGJnY3dtcm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njk0NTksImV4cCI6MjA4ODE0NTQ1OX0.IAvYwVmbiBBfVf-IWLe70jP-OAqtdQkLRcJVOr0a7X4';

  let db             = null;
  let sessionChannel = null;  // Broadcast-kanal (konstant per lektion)
  let answerChannel  = null;  // Svarsprenumeration (byts per omgång)
  let sessionCode    = null;  // Konstant under hela lektionen
  let currentRoundId = null;  // Ändras vid varje ny uppgift
  let answers        = {};    // { normaliserat svar: antal }
  let active         = false;

  // =========================================================
  //  Hjälpare
  // =========================================================
  function getDb() {
    if (!db) db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return db;
  }

  function generateCode(len) {
    // Undviker tvetydiga tecken (0/O, 1/I/l)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  }

  function getStudentUrl(code) {
    // Fungerar för både GitHub Pages och localhost
    const base = window.location.href.replace(/[^/]*(\?.*)?$/, '');
    return `${base}elev.html?k=${code}`;
  }

  // =========================================================
  //  Rendering av svar-moln
  // =========================================================
  function renderAnswers() {
    const container = document.getElementById('live-answers');
    const countEl   = document.getElementById('live-count');
    if (!container) return;

    const entries  = Object.entries(answers);
    const total    = entries.reduce((s, [, n]) => s + n, 0);
    const maxCount = entries.reduce((m, [, n]) => Math.max(m, n), 1);

    container.innerHTML = '';
    entries
      .sort((a, b) => b[1] - a[1])
      .forEach(([ans, count]) => {
        const item = document.createElement('span');
        item.className   = 'live-answer-item';
        item.textContent = ans;
        const ratio      = count / maxCount;
        item.style.fontSize = `${1.6 + ratio * 3.4}rem`;
        item.style.opacity  = String(0.4 + ratio * 0.6);
        container.appendChild(item);
      });

    if (countEl) countEl.textContent = total === 0 ? '' : `${total} svar`;
  }

  // =========================================================
  //  Sessionshantering
  // =========================================================
  function enable() {
    active      = true;
    sessionCode = generateCode(4);
    answers     = {};

    // Visa QR-märke i hörnet
    const badge  = document.getElementById('live-qr-badge');
    const codeEl = document.getElementById('live-code-text');
    const qrEl   = document.getElementById('live-qr');
    if (badge)  badge.classList.remove('hidden');
    if (codeEl) codeEl.textContent = sessionCode;
    if (qrEl && typeof QRCode !== 'undefined') {
      qrEl.innerHTML = '';
      new QRCode(qrEl, {
        text:         getStudentUrl(sessionCode),
        width:        120,
        height:       120,
        colorDark:    '#000000',
        colorLight:   '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
    }

    // Öppna broadcast-kanalen som elevernas sidor lyssnar på
    sessionChannel = getDb()
      .channel(`session-${sessionCode}`)
      .subscribe();
  }

  async function startRound() {
    if (!active) return;

    // Avsluta föregående svarsprenumeration
    if (answerChannel) {
      try { await getDb().removeChannel(answerChannel); } catch (_) {}
      answerChannel = null;
    }

    currentRoundId = generateCode(8);
    answers        = {};
    renderAnswers();

    // Visa svarsöverlägget
    document.getElementById('live-answers-overlay')?.classList.remove('hidden');

    // Prenumerera på svar för just denna omgång
    answerChannel = getDb()
      .channel(`answers-${currentRoundId}`)
      .on('postgres_changes', {
        event:  'INSERT',
        schema: 'public',
        table:  'live_answers',
        filter: `round_id=eq.${currentRoundId}`,
      }, payload => {
        const ans = (payload.new.answer || '').trim().toLowerCase();
        if (ans) { answers[ans] = (answers[ans] || 0) + 1; renderAnswers(); }
      })
      .subscribe();

    // Meddela elevernas sidor om ny omgång
    if (sessionChannel) {
      sessionChannel.send({
        type:    'broadcast',
        event:   'new_round',
        payload: { round_id: currentRoundId },
      });
    }
  }

  function disable() {
    active = false;
    if (answerChannel) {
      try { getDb().removeChannel(answerChannel); } catch (_) {}
      answerChannel = null;
    }
    if (sessionChannel) {
      try { getDb().removeChannel(sessionChannel); } catch (_) {}
      sessionChannel = null;
    }
    sessionCode    = null;
    currentRoundId = null;
    answers        = {};
    document.getElementById('live-qr-badge')?.classList.add('hidden');
    document.getElementById('live-answers-overlay')?.classList.add('hidden');
  }

  // =========================================================
  //  Publik API
  // =========================================================
  function isActive() { return active; }

  return { enable, disable, startRound, isActive };
})();
