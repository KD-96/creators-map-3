import { db } from "./firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { storage } from "./firebase"; // make sure your firebase.js exports storage
import { getAuth, deleteUser } from "firebase/auth";

// Delete user Firestore document and image
export const deleteUserDataAndImage = async (userEmail) => {
    if (!userEmail) throw new Error("User email is required");

    const docRef = doc(db, "locations", userEmail);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        throw new Error("User document does not exist.");
    }

    const userData = docSnap.data();

    // Delete image from storage if exists
    if (userData.img) {
        const imgPath = decodeURIComponent(new URL(userData.img).pathname.split("/o/")[1].split("?alt=")[0]);
        const imageRef = ref(storage, imgPath);
        await deleteObject(imageRef);
    }

    // Delete document
    await deleteDoc(docRef);
};

// Delete gmail
export const deleteFirebaseAuthUser = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
        await deleteUser(user);
    } else {
        throw new Error("No authenticated user.");
    }
}