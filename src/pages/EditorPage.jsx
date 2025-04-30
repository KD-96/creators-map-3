// src/pages/EditDataPage.jsx
import React from "react";
import { useEffect, useState } from "react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { IconButton } from "@mui/material";
import { Logout } from "@mui/icons-material";

import EditorComponent from "../components/EditorComponent";

const EditorPage = () => {
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState(null);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/"); // After logout, go back to MapViewPage
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserEmail(user.email); // Save Gmail address
            } else {
                navigate("/"); // If not logged in, redirect to home/login
            }
        });

        return () => unsubscribe(); // Cleanup listener on unmount
    }, []);

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
            <EditorComponent userEmail={userEmail} />

        </div>
    );
};

export default EditorPage;
