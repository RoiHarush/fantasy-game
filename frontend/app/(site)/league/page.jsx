"use client";

import { RequireLeague } from "../../../src/RouteGuards";
import LeaguePage from "../../../src/Components/Pages/LeagueTab/LeaguePage";

export default function LeagueRoute() {
    return (
        <RequireLeague>
            <LeaguePage />
        </RequireLeague>
    );
}
