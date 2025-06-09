// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBhVIeNC53fH1kpraFNG6fL4KMplNPNcoU",
  authDomain: "foodshare-31faa.firebaseapp.com",
  projectId: "foodshare-31faa",
  storageBucket: "foodshare-31faa.firebasestorage.app",
  messagingSenderId: "366356176485",
  appId: "1:366356176485:web:2194e1d7a6fc36ee10f08c",
  measurementId: "G-0TJQZELXGK"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// Only initialize analytics on client side
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, auth, db, analytics };