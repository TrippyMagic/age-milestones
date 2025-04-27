
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";  
import { Analytics } from "@vercel/analytics/react";
import "./css/index.css";      
import Landing    from "./Landing";          
import DateFocus  from "./pages/DateFocus";  

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>                       {/* router wrapper */}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dateFocus" element={<DateFocus />} />
      </Routes>
    </BrowserRouter>
    <Analytics />
  </StrictMode>
);
