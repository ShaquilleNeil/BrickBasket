importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAPpy2ltDTz9rMFDKBH-708fvSjNj1-k3I",
  authDomain: "brickbasket-d8cc4.firebaseapp.com",
  projectId: "brickbasket-d8cc4",
  messagingSenderId: "622109971283",
  appId: "1:622109971283:web:9096e4e8e597e07b34c7a6",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });
});
