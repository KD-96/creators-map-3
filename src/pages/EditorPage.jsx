// src/pages/EditDataPage.jsx
import React from "react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import EditorComponent from "../components/EditorComponent";

const EditorPage = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/"); // After logout, go back to MapViewPage
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    return (
        <div>
            <EditorComponent />
            <h1>EditorPage

            </h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default EditorPage;
