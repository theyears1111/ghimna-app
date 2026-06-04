// ============================================================
// GHIMNA TROTTA 2.0 — firebase.ts
// ============================================================
// ⚠️  Ricordati di aggiornare authDomain, projectId e
//     storageBucket col tuo vero project ID Firebase.
// ============================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
 authDomain:    "ghimna-ea24d.firebaseapp.com",
projectId:     "ghimna-ea24d",
storageBucket: "ghimna-ea24d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inizializzazione app modular
const app = initializeApp(firebaseConfig);

// App Check (debug token in locale, reCAPTCHA v3 in produzione)
if (import.meta.env.DEV) {
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

// Exports modular
export const db      = getFirestore(app);
export const storage = getStorage(app);

// Auth usa compat API (più stabile con il pattern AuthContext)
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
export const auth           = firebase.auth();
export const googleProvider = new firebase.auth.GoogleAuthProvider();
