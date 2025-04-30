import React from "react";
import { useNavigate } from "react-router-dom";

import { auth, provider } from "../services/firebase";
import { signInWithPopup } from "firebase/auth";

import ViewerComponent from "../components/ViewerComponent";
import { useAuth } from "../contexts/AuthContext";

import { IconButton } from "@mui/material";
import { Add } from "@mui/icons-material";

const ViewerPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); // Get user from context

    const handleLogin = async () => {
        if (user) {
            navigate("/editor");
            return;
        }

        try {
            await signInWithPopup(auth, provider);
            navigate("/editor");
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    return (
        <div className="map-view-page-container">
            <IconButton
                className="add-data-button"
                size="large"
                onClick={handleLogin}
                sx={{
                    position: "absolute", zIndex: 99, bottom: 40, right: 10, bgcolor: 'primary.main', width: 60,         // Set width
                    height: 60, "&:hover": {
                        bgcolor: "primary.dark",
                    },
                    boxShadow: 5,
                }}
            >
                <Add sx={{ fontSize: 40, color: "white" }} />
            </IconButton>
            <ViewerComponent />
        </div>
    );
};

export default ViewerPage;
