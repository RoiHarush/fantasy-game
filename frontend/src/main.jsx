// main.jsx
window.global = window;

import "./Styles/Reset.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PlayersProvider } from "./Context/PlayersContext.jsx";
import { GameweekProvider } from "./Context/GameweeksContext.jsx";
import { TeamsProvider } from "./Context/TeamsContext.jsx";
import { WebSocketProvider } from "./Context/WebSocketContext.jsx";
import RootApp from "./RootApp.jsx";
import { AuthProvider } from "./Context/AuthContext.jsx";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <GameweekProvider>
            <PlayersProvider>
              <TeamsProvider>
                <RootApp />
              </TeamsProvider>
            </PlayersProvider>
          </GameweekProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
