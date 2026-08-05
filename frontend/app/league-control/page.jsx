"use client";

import { RequireLeague, RequireLeagueAdmin } from "../../src/RouteGuards";
import LeagueControlPage from "../../src/Components/Pages/Admin/LeagueControlPage";

export default function LeagueControlRoute() {
    return (
        <RequireLeague>
            <RequireLeagueAdmin>
                <LeagueControlPage />
            </RequireLeagueAdmin>
        </RequireLeague>
    );
}