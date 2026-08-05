"use client";

import { AuthProvider } from "../src/Context/AuthContext";
import { WatchlistProvider } from "../src/Context/WatchlistContext";
import { WebSocketProvider } from "../src/Context/WebSocketProvider";
import { SystemStatusProvider } from "../src/Context/SystemStatusContext";
import { GameweekProvider } from "../src/Context/GameweeksContext";
import { PlayersProvider } from "../src/Context/PlayersContext";
import { TeamsProvider } from "../src/Context/TeamsContext";
import { FixturesProvider } from "../src/Context/FixturesContext";

export default function Providers({ children }) {
    return (
        <AuthProvider>
            <WatchlistProvider>
                <WebSocketProvider>
                    <SystemStatusProvider>
                        <GameweekProvider>
                            <PlayersProvider>
                                <TeamsProvider>
                                    <FixturesProvider>{children}</FixturesProvider>
                                </TeamsProvider>
                            </PlayersProvider>
                        </GameweekProvider>
                    </SystemStatusProvider>
                </WebSocketProvider>
            </WatchlistProvider>
        </AuthProvider>
    );
}