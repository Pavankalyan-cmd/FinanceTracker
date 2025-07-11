import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { TransactionProvider } from "./context/TransactionContext";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TransactionProvider>
          <App />
        </TransactionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
