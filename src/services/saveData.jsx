// src/services/locationService.js

import { db } from "../services/firebase"; // adjust path to your firebase config
import { doc, setDoc } from "firebase/firestore";

/**
 * Save or update a user location document in Firestore.
 * If the document doesn't exist, it creates one.
 * If it exists, it merges the new data.
 * 
 * @param {string} email - The user's email, used as document ID.
 * @param {object} data - The data object to be saved.
 */
export const saveUserData = async (email, data) => {
    if (!email) throw new Error("User email is required.");

    const docRef = doc(db, "locations", email);

    await setDoc(docRef, {
        name: data.name || null,
        desc: data.desc || null,
        category: data.category.label || null,
        contact: email,
        smt: data.smt.label || null,
        location: data.location || null,
        img: data.img || null,
    }, { merge: true });
};
