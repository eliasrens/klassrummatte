// js/firebase-init.js
// Initierar Firebase för klassrummatte-projektet (utan bundler, via compat-SDK).

// Din Firebase-konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyDOL0fO84ZtXu2NMRauTeRb3PA1zRAJWkk",
  authDomain: "klassmatte.firebaseapp.com",
  projectId: "klassmatte",
  storageBucket: "klassmatte.firebasestorage.app",
  messagingSenderId: "1093358159739",
  appId: "1:1093358159739:web:5e9d678d84a36b6b49dfde",
  measurementId: "G-E7LNN1J7K2"
};

// Init Firebase-app
firebase.initializeApp(firebaseConfig);

// Valfria tjänster – redo att användas i resten av koden
let firebaseAnalytics = null;
try {
  firebaseAnalytics = firebase.analytics();
} catch (_) {
  // Analytics kräver vissa miljöer; ignorera fel lokalt
}

const firebaseAuth = firebase.auth();
const firebaseDb   = firebase.firestore();

// Exponera ett enkelt globalt objekt för resten av appen
window.KlassrumsFirebase = {
  app: firebase.app(),
  auth: firebaseAuth,
  db: firebaseDb,
  analytics: firebaseAnalytics,
};

