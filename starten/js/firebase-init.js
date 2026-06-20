/* Firebase-init för Starten – Elias eget projekt (starten-ba789).
   Compat-SDK utan bundler. Krockar inte med klassrummattes "klassmatte"-projekt
   eftersom Starten-sidan laddar sina egna script (och vi använder en namngiven app-instans). */
(function () {
  "use strict";

  const startenFirebaseConfig = {
    apiKey: "AIzaSyDfIujIbY1MhD_sQxRcTlVVjG5A5zuf5lU",
    authDomain: "starten-ba789.firebaseapp.com",
    projectId: "starten-ba789",
    storageBucket: "starten-ba789.firebasestorage.app",
    messagingSenderId: "920023180464",
    appId: "1:920023180464:web:058354ad3eed27be808775"
  };

  // Robust: om Firebase-SDK:n inte laddats (offline el. blockerad) ska resten av
  // appen fungera ändå. Sätter window.StartenFirebase = null vid fel.
  try {
    if (typeof firebase === "undefined") throw new Error("Firebase-SDK saknas");
    const startenApp = firebase.initializeApp(startenFirebaseConfig, "starten");
    const db = firebase.firestore(startenApp);
    // Robust transport (bra vid file:// och bakom proxy)
    try { db.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) { /* redan startad */ }
    // Offline-cache: sidan funkar även utan nät ("lokalt som backup")
    db.enablePersistence({ synchronizeTabs: true }).catch(function (e) {
      console.warn("[Starten] offline-cache ej tillgänglig:", e && e.code);
    });
    window.StartenFirebase = { app: startenApp, db: db };
    console.log("[Starten] Firebase ansluten:", startenFirebaseConfig.projectId);
  } catch (e) {
    window.StartenFirebase = null;
    console.warn("[Starten] Firebase kunde inte initieras – kör vidare lokalt.", e);
  }
})();
