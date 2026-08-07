"use client";

import { RequireLeague } from "../../../src/RouteGuards";
import SettingsPage from "../../../src/Components/Pages/SettingsTab/SettingsPage";

export default function SettingsRoute() {
    return (
        <RequireLeague>
            <SettingsPage />
        </RequireLeague>
    );
}
