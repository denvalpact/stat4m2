export const firebaseConfig = {
    apiKey: "AIzaSyDpUB0SDEYVhy8J9LSHY4UoQmbXx3F6adU",
    authDomain: "handballmatchstatisticscounter.firebaseapp.com",
    projectId: "handballmatchstatisticscounter",
    storageBucket: "handballmatchstatisticscounter.firebasestorage.app",
    messagingSenderId: "801047095180",
    appId: "1:801047095180:web:97ed51c9b2f1d025b158a9",
    measurementId: "G-92CEXGX2N5"
};

export const gameConfig = {
    periodDurations: {
        '1H': 30 * 60,  // 30 minutes in seconds
        '2H': 30 * 60,
        'ET1': 5 * 60,
        'ET2': 5 * 60
    },
    maxTimeouts: 3,
    maxPlayers: 16,
    suspensionDuration: 120, // 2 minutes in seconds
    timeoutDuration: 60,     // 1 minute in seconds
    autoSaveInterval: 30000  // 30 seconds
}; 