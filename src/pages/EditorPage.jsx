// src/pages/EditDataPage.jsx
import React from "react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { IconButton } from "@mui/material";
import { Logout } from "@mui/icons-material";

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

            <IconButton
                className="add-data-button"
                size="large"
                onClick={handleLogout}
                sx={{
                    position: "absolute", zIndex: 1000, top: 5, right: 10, bgcolor: 'white', width: 55,         // Set width
                    height: 55, "&:hover": {
                        bgcolor: "primary.light",
                    },

                }}
            >
                <Logout sx={{
                    fontSize: 30, color: "primary.main"
                }} />
            </IconButton>
            <EditorComponent />

        </div>
    );
};

export default EditorPage;
