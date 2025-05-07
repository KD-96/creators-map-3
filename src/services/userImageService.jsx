// firebaseImageService.js
import { storage, db } from "./firebase";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";

// Upload new image and return URL
export const uploadUserImage = async (file, userEmail) => {
    const imageRef = ref(storage, `user_images/${userEmail}/${file.name}`);
    await uploadBytes(imageRef, file);
    const url = await getDownloadURL(imageRef);
    return { url, path: imageRef.fullPath };
};

// Delete image from Firebase Storage
export const deleteUserImage = async (imgPath) => {
    if (!imgPath) return;
    const imageRef = ref(storage, imgPath);
    await deleteObject(imageRef);
};

// Update Firestore image URL
export const updateUserImageUrl = async (userEmail, url) => {
    const userDoc = doc(db, "locations", userEmail);
    await updateDoc(userDoc, { img: url });
};
