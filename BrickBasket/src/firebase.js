// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // gets firestore from plugin
import { getAuth } from "firebase/auth"; // gets auth from plugin
import { getMessaging, getToken, onMessage } from "firebase/messaging";


const firebaseConfig = {
  apiKey: "AIzaSyAPpy2ltDTz9rMFDKBH-708fvSjNj1-k3I",
  authDomain: "brickbasket-d8cc4.firebaseapp.com",
  databaseURL: "https://brickbasket-d8cc4-default-rtdb.firebaseio.com",
  projectId: "brickbasket-d8cc4",
  storageBucket: "brickbasket-d8cc4.firebasestorage.app",
  messagingSenderId: "622109971283",
  appId: "1:622109971283:web:9096e4e8e597e07b34c7a6",
  measurementId: "G-FVEJFHPR8S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
