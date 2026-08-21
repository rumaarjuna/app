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
    apiKey: "AIzaSyDhWKqdQd664Fk7XM9-HI8RYGdYkS7xe9g",
    authDomain: "ruma-9b3cf.firebaseapp.com",
    projectId: "ruma-9b3cf",
    storageBucket: "ruma-9b3cf.firebasestorage.app",
    messagingSenderId: "770596277924",
    appId: "1:770596277924:web:0e6f758b69ecbab84be031",
    vapidKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCrMVkhEf5nYSdO\nqzbKBdzKVqaKQTTKEFuvqK7jMyVnDk2zsTx62RiHIyb3Gv6q6+M5p3z/Yihqzugy\nXnZ/jv1mefbIBXZSPrRma2Cs3pd3iEYfsTc2cNhjkbch4dpfezqBqi8DhVnESPBu\nf0lyjiguZioQxnwtm9hDZLJJPVyqHnw5Ba44rRTu0BE62yDG6Zj1An61HfyblvMO\n/JfdFCfwkwIIh2CisxE89t11ZWk42ULtZS7ZV1m3/SNZm1CdlNuJ/3F5WJ/ovnfE\nZ5N+hE6SwCIEA88Yd4DHvDMLI01k+H2pMOURDSZNP9afyZUnhwwIUv80H914wUWM\nW9X3um+zAgMBAAECggEAByu5gTOeQEP8YAS29k5kObYtzVkUNinqP+46aSTsJP10\njsQr9YoLciRW+P8l+hCIbj1QSehEK3kq67/eNH36VPpjNmyte0jKHgd9v1qm5ehi\nO5NHmJ2wdWHrVbLUBq+EO13eu0XbhT0i6RX8Lx1k8dCbZCQpm8V35mwc4F7UIgIJ\nosdNVzain3sGBR5YJUypRyZBP/ROu+sJCClFypxhefkgFZEwZhhMtT5sgLb2IGbN\n77X/WHZ//taiDtjEHRcoVuFME/Cla8ekMcbMFFqSM4FgEGSI5QtaMrJjacWC1xVo\nzGcxOYkr+FtGA7B6/v73j3MA0hrjxtSEcvV7kH486QKBgQDicvRP+QuozVyRloVz\nCM2UFWUX3dWuesFLn13mC+G9QezzvKH+YVVg+NTQMlPgmegjgeMkEtnYSAXQjwdJ\n5T2dvFW617tXIawZuW97BmN6BOr7fauugE/AEKoV3aPF7VsJ0DQvFBkr5XZSbbmx\nUajQh3SEw68Qxho74Ccqn90SqQKBgQDBiG6kl6JexNXh418+ZgRnHpr8isLy43Kj\nPJy5oV9LlG8/bH6C6id6r+xcVEMFKO8x7fpF+vXiy3/PvTZq65MWIq7cpEBSe6dk\nFLsG8FXPN0ECPT0iY9D43Y+3y3qXf4yteySA0756/FHCFtEMzrzPlZTMHs633bF4\nybotS8qE+wKBgQCK05K4HKRrPktL7g2uMm1mJZ+ufA9uQk+Sfwdf61TfZDVSUAi4\nHQ/svWAqq1AE2BYa/pw0F2J6V91IuQbs5J9bvoSIYY22oywRMUAJGieOPMmamLbR\n6lP6Gb1MXm7y/srbP0teuWGdKbXaXu6CqN9nyENEyXrgO7MFliws04kC0QKBgBP9\nNHhZlRK2v+SZ6G94eAHynk1xQ5t0tJV5oDJoIYCb7zWcziBVcQhx/Ta4GUgCJ1p/\n2va5agYnwKbDQ0id1k5V/LubV21tiieDIKIh1qsVaOiDTLotlxrtP3fbU2ksampM\nqsOHm0f2obcrRiJNhCDosTq3/9/rzPXN2CXvixZbAoGAM/diBFCN6zYEnGOsl50H\nf9Xa9NKqR/RfEImCDSiSZqXRCbtQOwrU2miPXTT9fUNmDSIUJspw11+Y6FC5w0OY\nrryjygbMyAq5GR7Z8t5Z0FtSL6qUTRxYYvrW9YJgB3DsvQU2VFMl+vM/HPzsfrVL\nrr+CIyuwgExMP9fbFjKoBIo=\n-----END PRIVATE KEY-----\n"
  }
};
