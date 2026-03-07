// js/session-teacher.js
// Hanterar livesessioner på lärarsidan (koppling mot Firebase).

(function () {
  if (!window.KlassrumsFirebase || !window.KlassrumsFirebase.db) {
    return;
  }

  const db = window.KlassrumsFirebase.db;

  let sessionId = null;
  let problemIndex = 0;
  let unsubSubmissions = null;
  let currentSubmissions = [];
  let currentSubmissionIndex = 0;

  function genCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  function $(id) {
    return document.getElementById(id);
  }

  function normalizeAnswer(val) {
    return String(val == null ? '' : val).trim().replace(',', '.');
  }

  function init() {
    const startBtn = $('session-start-btn');
    const sendBtn = $('session-send-problem-btn');
    const codeText = $('session-code-text');
    const submissionsSection = $('session-submissions-section');
    const stageSendBtn = $('send-to-students-btn');

    if (!startBtn || !sendBtn || !codeText) return;

    function setSendEnabled(enabled) {
      sendBtn.disabled = !enabled;
      if (stageSendBtn) stageSendBtn.disabled = !enabled;
    }

    async function sendCurrentProblem() {
      if (!sessionId) {
        alert('Starta en livesession först.');
        return;
      }
      const sessionState = window.KlassrumsSession || {};
      const problem = sessionState.currentProblem || null;
      if (!problem) {
        alert('Det finns ingen enkel uppgift att skicka. Stäng av "Flera uppgifter" och generera en uppgift.');
        return;
      }
      const problemDisplay = document.getElementById('problem-display');
      const html = problemDisplay ? problemDisplay.innerHTML : '';
      try {
        problemIndex += 1;
        const correctAnswer = problem.answer != null ? String(problem.answer).trim() : '';
        await db.collection('sessions').doc(sessionId).update({
          activeProblem: {
            data: problem,
            html,
            sentAt: firebase.firestore.FieldValue.serverTimestamp(),
            index: problemIndex,
          },
          problemIndex,
          ['answers.' + problemIndex]: correctAnswer,
        });
        attachSubmissionsListener(); // växla över till nya problemIndex
      } catch (err) {
        console.error('Kunde inte skicka uppgift', err);
        alert('Kunde inte skicka uppgiften till eleverna.');
      }
    }

    if (stageSendBtn) {
      stageSendBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Förhindra att klicket når scenen och byter uppgift
        sendCurrentProblem();
      });
    }

    startBtn.addEventListener('click', async () => {
      try {
        if (sessionId) {
          // Startknappen fungerar som "starta om" – skapa ny session
          if (unsubSubmissions) { unsubSubmissions(); unsubSubmissions = null; }
        }
        const code = genCode();
        const now = new Date();
        const docRef = await db.collection('sessions').add({
          code,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdAtLocal: now.toISOString(),
          activeProblem: null,
          problemIndex: 0,
        });
        sessionId = docRef.id;
        problemIndex = 0;
        codeText.textContent = `Sessionskod för elever: ${code}`;
        codeText.classList.remove('hidden');
        setSendEnabled(true);
        submissionsSection.style.display = 'block';
        attachSubmissionsListener();
      } catch (err) {
        console.error('Kunde inte starta session', err);
        alert('Kunde inte starta livesession. Kontrollera internetanslutning och Firestore.');
      }
    });

    sendBtn.addEventListener('click', sendCurrentProblem);

    window.KlassrumsSessionTeacher = {
      hasActiveSession: () => !!sessionId,
      sendCurrentProblem,
    };
  }

  function attachSubmissionsListener() {
    const listEl = $('session-submissions-list');
    const mainEl = $('session-submissions-main');
    if (!sessionId || !listEl) return;
    if (unsubSubmissions) { unsubSubmissions(); unsubSubmissions = null; }
    listEl.innerHTML = '';
    if (mainEl) {
      mainEl.innerHTML = '';
      mainEl.classList.add('hidden');
    }

    const sessionRef = db.collection('sessions').doc(sessionId);

    function renderSubmissions(snap) {
      listEl.innerHTML = '';
      currentSubmissions = [];
      currentSubmissionIndex = 0;
      if (mainEl) {
        mainEl.innerHTML = '';
      }

      snap.forEach((docSnap) => {
        const d = docSnap.data();
        currentSubmissions.push({
          id: docSnap.id,
          ...d,
        });
      });

      sessionRef.get().then((sessionSnap) => {
        const sessionData = sessionSnap.data() || {};
        const answers = sessionData.answers || {};
        const correctAnswer = answers[problemIndex] != null ? normalizeAnswer(answers[problemIndex]) : null;

        if (currentSubmissions.length === 0) {
          const li = document.createElement('li');
          li.textContent = 'Inga svar ännu.';
          listEl.appendChild(li);
          if (mainEl) {
            mainEl.innerHTML = '';
            mainEl.classList.add('hidden');
          }
          return;
        }

        currentSubmissions.forEach((d, idx) => {
          const li = document.createElement('li');
          const name = d.name || 'Elev';
          li.textContent = name;
          listEl.appendChild(li);

          if (mainEl) {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'session-submissions-card';
            card.dataset.index = String(idx);

            const nameEl = document.createElement('div');
            nameEl.className = 'session-submissions-card-name';
            nameEl.textContent = name;

            const isCorrect = correctAnswer != null && correctAnswer !== '' &&
              normalizeAnswer(d.finalAnswer) === correctAnswer;
            if (isCorrect) {
              card.classList.add('session-submissions-card-correct');
            }

            card.appendChild(nameEl);

            card.addEventListener('click', () => {
              currentSubmissionIndex = idx;
              openSubmissionModal();
            });

            mainEl.appendChild(card);
          }
        });

        if (mainEl && currentSubmissions.length > 0) {
          mainEl.classList.remove('hidden');
        }
      });
    }

    unsubSubmissions = sessionRef
      .collection('submissions')
      .where('problemIndex', '==', problemIndex)
      .orderBy('createdAt', 'asc')
      .onSnapshot((snap) => {
        renderSubmissions(snap);
      }, (err) => {
        console.error('Lyssnare för elevsvar felade', err);
      });
  }

  function openSubmissionModal() {
    const modal = $('submission-modal');
    const body = $('submission-modal-body');
    const meta = $('submission-modal-meta');
    const title = $('submission-modal-title');
    const prevBtn = $('submission-modal-prev');
    const nextBtn = $('submission-modal-next');
    const closeBtn = $('submission-modal-close');

    if (!modal || !body || !meta || !title || !prevBtn || !nextBtn || !closeBtn) return;
    if (!currentSubmissions.length) return;

    const data = currentSubmissions[currentSubmissionIndex];
    const name = data.name || 'Elev';
    const answerText = data.answerText || '';
    const finalAnswer = data.finalAnswer || '';
    const drawingUrl = data.drawingDataUrl || null;

    title.textContent = `Elevsvar`;
    meta.textContent = `${name} – svar ${currentSubmissionIndex + 1} av ${currentSubmissions.length}`;

    body.innerHTML = '';
    if (finalAnswer) {
      const finalDiv = document.createElement('p');
      finalDiv.className = 'submission-modal-final';
      const strong = document.createElement('strong');
      strong.textContent = 'Slutgiltigt svar: ';
      finalDiv.appendChild(strong);
      finalDiv.appendChild(document.createTextNode(finalAnswer));
      body.appendChild(finalDiv);
    }
    const textDiv = document.createElement('div');
    textDiv.className = 'submission-modal-text';
    textDiv.textContent = answerText || '(ingen uträkningstext)';
    body.appendChild(textDiv);

    if (drawingUrl) {
      const drawDiv = document.createElement('div');
      drawDiv.className = 'submission-modal-drawing';
      const img = document.createElement('img');
      img.src = drawingUrl;
      img.alt = 'Elevens rityta';
      drawDiv.appendChild(img);
      body.appendChild(drawDiv);
    }

    modal.classList.remove('hidden');

    prevBtn.onclick = () => {
      if (!currentSubmissions.length) return;
      currentSubmissionIndex = (currentSubmissionIndex - 1 + currentSubmissions.length) % currentSubmissions.length;
      openSubmissionModal();
    };
    nextBtn.onclick = () => {
      if (!currentSubmissions.length) return;
      currentSubmissionIndex = (currentSubmissionIndex + 1) % currentSubmissions.length;
      openSubmissionModal();
    };
    closeBtn.onclick = () => {
      modal.classList.add('hidden');
    };
    modal.querySelector('.submission-modal-backdrop').onclick = () => {
      modal.classList.add('hidden');
    };
  }

  document.addEventListener('DOMContentLoaded', init);
})();

