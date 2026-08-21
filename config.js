/*
  RUMA CONFIG v2.12.0
  Simpan hanya konfigurasi PUBLIK di sini.
  API key Gemini/Groq, Firebase service-account private key, dan credential rahasia wajib tetap di backend / Script Properties.
*/
window.RUMA_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbwsWLNR7NB2MQTe173VQPfRM3nf1rpg5pqoNk2btgUfPq3YvSe463FmLE8xNLpDNgaI/exec",
  APP_VERSION: "2.12.2",
  REQUEST_TIMEOUT: 32000,
  CACHE_TTL_MS: 300000,
  BACKGROUND_SYNC_MS: 120000,
  PWA_ENABLED: true,

  // Firebase Web config memang bersifat public. Aktifkan setelah project Firebase siap.
  FIREBASE: {
    enabled: true,
    sdkVersion: "12.17.1",
    apiKey: "AIzaSyDhWKqdQd664Fk7XM9-HI8RYGdYkS7xe9g",
    authDomain: "ruma-9b3cf.firebaseapp.com",
    projectId: "ruma-9b3cf",
    storageBucket: "ruma-9b3cf.firebasestorage.app",
    messagingSenderId: "770596277924",
    appId: "1:770596277924:web:0e6f758b69ecbab84be031",
    vapidKey: "BDBiG0ThNzvxi2tmkjl0R_4S_hlGJAy8CGtac-f1IYIR0KB9PiJOP2j974TLR5zW1n5o9P8nBGyScFprem5QtJ0"
  }
};
