"use client";

import { RequireLeague } from "../../../src/RouteGuards";
import GameweekUpdatingGuard from "../../../src/GameweekUpdatingGuard";
import StatusPage from "../../../src/Components/Pages/StatusTab/StatusPage";

export default function StatusRoute() {
    return (
        <RequireLeague>
            <GameweekUpdatingGuard>
                <StatusPage />
            </GameweekUpdatingGuard>
        </RequireLeague>
    );
}
