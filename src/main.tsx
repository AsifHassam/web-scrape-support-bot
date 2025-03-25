import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { handleChatRequest } from "./api/chat";

// Handle API requests
if (window.location.pathname.startsWith('/api/chat')) {
  // If this is an API request, handle it with our API handler
  handleChatRequest(new Request(window.location.href))
    .then(response => {
      return response.text();
    })
    .then(text => {
      document.body.innerHTML = text;
    })
    .catch(error => {
      document.body.innerHTML = JSON.stringify({ error: error.message });
    });
} else {
  // Otherwise, render the React application
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
