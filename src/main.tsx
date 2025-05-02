import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import "./css/index.css";
import { BirthDateProvider } from "./context/BirthDateContext";

import Landing    from "./pages/Landing";
import Milestones from "./pages/Milestones";
import DateFocus  from "./pages/DateFocus";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BirthDateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"           element={<Landing />}     />
          <Route path="/milestones" element={<Milestones />}  />
          <Route path="/dateFocus"  element={<DateFocus />}   />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </BirthDateProvider>
  </StrictMode>
);
