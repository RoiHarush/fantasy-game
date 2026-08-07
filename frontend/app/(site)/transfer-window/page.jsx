"use client";

import { RequireLeague, RequireActiveLeague } from "../../../src/RouteGuards";
import GameweekUpdatingGuard from "../../../src/GameweekUpdatingGuard";
import TransferWindowPage from "../../../src/Components/Pages/TransferWindowTab/TransferWindowPage";

export default function TransferWindowRoute() {
    return (
        <RequireLeague>
            <RequireActiveLeague>
                <GameweekUpdatingGuard>
                    <TransferWindowPage />
                </GameweekUpdatingGuard>
            </RequireActiveLeague>
        </RequireLeague>
    );
}
