import React from "react";
import ReactDOM from "react-dom/client";
import { SkaffaProvider } from "@skaffa/react-runtime-adapter";
import { App } from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <SkaffaProvider
      config={{
        adapterId: "react",
        adapterVersion: "0.1.0",
        debug: true,
      }}
    >
      <App />
    </SkaffaProvider>
  </React.StrictMode>,
);
