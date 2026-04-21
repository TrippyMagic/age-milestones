import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import "./css/index.css";
import { BirthDateProvider } from "./context/BirthDateContext";
import { PreferencesProvider } from "./context/PreferencesContext";
import { UserProfileProvider } from "./context/UserProfileContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import Milestones from "./pages/Milestones";
import Timescales from "./pages/Timescales";
import Settings from "./pages/Settings";
import About from "./pages/About";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BirthDateProvider>
        <PreferencesProvider>
          <UserProfileProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/milestones" element={<Milestones />} />
                <Route path="/timescales" element={<Timescales />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/personalize" element={<Navigate to="/settings" replace />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </BrowserRouter>
            <Analytics />
          </UserProfileProvider>
        </PreferencesProvider>
      </BirthDateProvider>
    </ErrorBoundary>
  </StrictMode>
);
