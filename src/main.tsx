import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
//import { SpeedInsights } from "@vercel/speed-insights/next"
import "./css/index.css";
import { BirthDateProvider } from "./context/BirthDateContext";
import Landing from "./pages/Landing";
import Milestones from "./pages/Milestones";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BirthDateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing/>}/>
          <Route path="/milestones" element={<Milestones/>}/>
        </Routes>
      </BrowserRouter>
      <Analytics />
    </BirthDateProvider>
  </StrictMode>
);
