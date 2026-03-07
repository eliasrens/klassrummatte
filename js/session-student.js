// js/session-student.js
// Elevvy – ansluter till en sessionskod och lämnar in lösningar.

(function () {
  if (!window.KlassrumsFirebase || !window.KlassrumsFirebase.db) {
    return;
  }

  const db = window.KlassrumsFirebase.db;

  let sessionRef = null;
  let activeProblem = null;
  let problemIndex = 0;
  let unsubSession = null;
  let canvas, ctx;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  function $(id) {
    return document.getElementById(id);
  }

  function getClientId() {
    const key = 'klassrummatte-student-id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = Math.random().toString(36).slice(2, 10);
      try { localStorage.setItem(key, id); } catch (_) {}
    }
    return id;
  }

  function init() {
    const nameInput = $('student-name');
    const codeInput = $('session-code-input');
    const connectBtn = $('student-connect-btn');
    const statusEl = $('student-status');
    const answerEl = $('student-answer');
    const submitBtn = $('student-submit-btn');
    canvas = $('student-canvas');
    const clearBtn = $('student-canvas-clear');

    if (canvas && canvas.getContext) {
      ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#111827';

      const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
      };

      const startDraw = (e) => {
        e.preventDefault();
        const pos = getPos(e);
        isDrawing = true;
        lastX = pos.x;
        lastY = pos.y;
      };

      const moveDraw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastX = pos.x;
        lastY = pos.y;
      };

      const endDraw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        isDrawing = false;
      };

      canvas.addEventListener('pointerdown', startDraw);
      canvas.addEventListener('pointermove', moveDraw);
      canvas.addEventListener('pointerup', endDraw);
      canvas.addEventListener('pointerleave', endDraw);

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#111827';
        });
      }
    }

    if (!nameInput || !codeInput || !connectBtn) return;

    connectBtn.addEventListener('click', async () => {
      const name = (nameInput.value || '').trim();
      const code = (codeInput.value || '').trim();
      if (!name || !code) {
        statusEl.textContent = 'Fyll i både namn och sessionskod.';
        statusEl.style.color = 'crimson';
        return;
      }
      statusEl.textContent = 'Ansluter…';
      statusEl.style.color = 'var(--text-muted)';
      try {
        if (unsubSession) { unsubSession(); unsubSession = null; }
        const snap = await db.collection('sessions')
          .where('code', '==', code)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
        if (snap.empty) {
          statusEl.textContent = 'Hittar ingen aktiv session med den koden.';
          statusEl.style.color = 'crimson';
          return;
        }
        const doc = snap.docs[0];
        sessionRef = db.collection('sessions').doc(doc.id);
        statusEl.textContent = 'Ansluten. Väntar på uppgift från läraren…';
        statusEl.style.color = 'var(--text-muted)';
        listenToSession();
        answerEl.value = '';
        submitBtn.disabled = true;
      } catch (err) {
        console.error('Kunde inte ansluta till session', err);
        statusEl.textContent = 'Något gick fel vid anslutning. Försök igen.';
        statusEl.style.color = 'crimson';
      }
    });

    submitBtn.addEventListener('click', async () => {
      const name = ($('student-name').value || '').trim();
      const answerText = ($('student-answer').value || '').trim();
      const finalAnswer = ($('student-final-answer').value || '').trim();
      if (!sessionRef || !activeProblem) return;
      if (!finalAnswer) {
        $('student-status').textContent = 'Fyll i slutgiltigt svar.';
        $('student-status').style.color = 'crimson';
        return;
      }
      let drawingDataUrl = null;
      if (canvas && ctx) {
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        const blankCtx = blank.getContext('2d');
        blankCtx.fillStyle = '#ffffff';
        blankCtx.fillRect(0, 0, blank.width, blank.height);
        if (canvas.toDataURL() !== blank.toDataURL()) {
          drawingDataUrl = canvas.toDataURL('image/png');
        }
      }
      try {
        const clientId = getClientId();
        const docId = `${problemIndex}_${clientId}`;
        await sessionRef.collection('submissions').doc(docId).set({
          name,
          clientId,
          answerText,
          finalAnswer,
          drawingDataUrl: drawingDataUrl || null,
          problemIndex,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        $('student-status').textContent = 'Svar inlämnat.';
        $('student-status').style.color = 'var(--accent-3)';
      } catch (err) {
        console.error('Kunde inte lämna in svar', err);
        $('student-status').textContent = 'Kunde inte lämna in svaret. Försök igen.';
        $('student-status').style.color = 'crimson';
      }
    });
  }

  function listenToSession() {
    const problemEl = $('student-problem');
    const answerEl = $('student-answer');
    const submitBtn = $('student-submit-btn');
    const statusEl = $('student-status');

    if (!sessionRef || !problemEl) return;
    if (unsubSession) { unsubSession(); unsubSession = null; }

    unsubSession = sessionRef.onSnapshot((doc) => {
      const data = doc.data() || {};
      const active = data.activeProblem || null;
      if (!active || !active.html) {
        problemEl.innerHTML = '<p style="font-size:0.95rem; color:var(--text-muted); margin:0;">Väntar på att läraren ska skicka en uppgift…</p>';
        activeProblem = null;
        submitBtn.disabled = true;
        return;
      }
      activeProblem = active;
      problemIndex = active.index || 0;
      problemEl.innerHTML = active.html;
      // Skala ned uppgiften på elevsidan om den blir för bred
      const content = problemEl.firstElementChild || problemEl;
      if (content) {
        content.style.transformOrigin = 'top left';
        content.style.transform = 'scale(1)';
        const available = problemEl.clientWidth - 16;
        const needed = content.scrollWidth;
        if (available > 0 && needed > available) {
          const scale = Math.max(0.6, Math.min(1, available / needed));
          content.style.transform = `scale(${scale})`;
        }
      }
      answerEl.value = '';
      const finalInput = $('student-final-answer');
      if (finalInput) finalInput.value = '';
      if (canvas && ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#111827';
      }
      submitBtn.disabled = false;
      statusEl.textContent = 'Ny uppgift utskickad – lös och lämna in.';
      statusEl.style.color = 'var(--text-muted)';
    }, (err) => {
      console.error('Session-lyssnare felade', err);
      statusEl.textContent = 'Förlorade kontakten med sessionen.';
      statusEl.style.color = 'crimson';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

