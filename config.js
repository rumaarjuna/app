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
    enabled: false,
    sdkVersion: "12.17.1",
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    vapidKey: ""
  }
};
