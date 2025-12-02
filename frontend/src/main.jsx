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
import { AuthProvider } from "./Context/AuthContext.jsx";
import { WatchlistProvider } from "./Context/WatchlistContext.jsx";
import { SystemStatusProvider } from "./Context/SystemStatusContext.jsx";
import { FixturesProvider } from "./Context/FixturesContext.jsx";
import App from "./App.jsx";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WatchlistProvider>
          <WebSocketProvider>
            <SystemStatusProvider>
              <GameweekProvider>
                <PlayersProvider>
                  <TeamsProvider>
                    <FixturesProvider>
                      <App />
                    </FixturesProvider>
                  </TeamsProvider>
                </PlayersProvider>
              </GameweekProvider>
            </SystemStatusProvider>
          </WebSocketProvider>
        </WatchlistProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
