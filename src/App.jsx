// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import EditorPage from "./pages/EditorPage";
import ViewerPage from "./pages/ViewerPage";

import { AuthProvider } from "./contexts/AuthContext";
import PrivateRoutes from "./routes/PrivateRoutes";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ViewerPage />} />
          <Route
            path="/editor"
            element={
              <PrivateRoutes>
                <EditorPage />
              </PrivateRoutes>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
