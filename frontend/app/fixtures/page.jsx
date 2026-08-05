"use client";

import { RequireLeague } from "../../src/RouteGuards";
import FixturesPage from "../../src/Components/Pages/FixturesTab/FixturePage";

export default function FixturesRoute() {
    return (
        <RequireLeague>
            <FixturesPage />
        </RequireLeague>
    );
}