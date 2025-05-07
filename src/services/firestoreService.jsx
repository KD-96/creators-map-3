import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

export const fetchAllUsers = async () => {


    const usersCol = collection(db, "locations"); // adjust collection name
    const snapshot = await getDocs(usersCol);
    const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    return data;
};
