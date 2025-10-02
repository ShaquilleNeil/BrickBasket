import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail
} from "firebase/auth";

// Create a new user with email and password
export function signup(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

// Login with email and password
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Sign in with Google
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);

    const token = await result.user.getIdToken();
    console.log("User Token:", token);

    return result.user;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

// Sign out
export function logout() {
  return auth.signOut();
}


//password reset email
export function sendPasswordResetEmail(email) {
  return firebaseSendPasswordResetEmail(auth,email);
}

export function updatePassword(password) {
  if (!auth.currentUser) {
    return Promise.reject("No user is signed in.");
  }

  return auth.currentUser.updatePassword(password).catch((err) => {
    if (err.code === "auth/requires-recent-login") {
      return Promise.reject("Please sign in again to update your password.");
    }
    return Promise.reject(err);
  });
}


// Email verification
export function sendEmailVerification() {
  if (auth.currentUser) {
    return auth.currentUser.sendEmailVerification();
  } else {
    return Promise.reject("No user is signed in.");
  }
}
