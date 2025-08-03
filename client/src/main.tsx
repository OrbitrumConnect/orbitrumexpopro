import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/utils/supabase-test"; // Registra função global de teste

createRoot(document.getElementById("root")!).render(<App />);
