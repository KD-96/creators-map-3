// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase config (replace with your own)
const firebaseConfig = {
    apiKey: "Your data",
    authDomain: "Your data",
    projectId: "Your data",
    storageBucket: "Your data",
    messagingSenderId: "Your data",
    appId: "Your data",
    measurementId: "Your data",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, provider, db, storage };
