"use client";

import { RequireLeague } from "../../../src/RouteGuards";
import GameweekUpdatingGuard from "../../../src/GameweekUpdatingGuard";
import DraftRoomPage from "../../../src/Components/Pages/DraftRoomTab/DraftRoomPage";

export default function DraftRoomRoute() {
    return (
        <RequireLeague>
            <GameweekUpdatingGuard>
                <DraftRoomPage />
            </GameweekUpdatingGuard>
        </RequireLeague>
    );
}
