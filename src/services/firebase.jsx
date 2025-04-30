// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase config (replace with your own)
const firebaseConfig = {
    apiKey: "AIzaSyBWpiyXPJO7qxSE5osHtabVqPJjdGfqeUg",
    authDomain: "kajabi-web-map.firebaseapp.com",
    projectId: "kajabi-web-map",
    storageBucket: "kajabi-web-map.firebasestorage.app",
    messagingSenderId: "1060645406964",
    appId: "1:1060645406964:web:e11f864abe04908c44f6a1",
    measurementId: "G-BCEH9VY4TS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, db };
