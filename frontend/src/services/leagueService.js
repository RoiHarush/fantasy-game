import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

export async function fetchLeague(userGameweekId) {
    const res = await fetch(`${API_URL}/api/league?gw=${userGameweekId}`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        throw new Error(`Failed to load league data (HTTP ${res.status})`);
    }

    return res.json();
}

export async function fetchMyLeague() {
    const response = await fetch(`${API_URL}/api/leagues/me`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to load league settings");
    return response.json();
}

export async function updateLeagueSettings(leagueId, settings) {
    const response = await fetch(`${API_URL}/api/leagues/${leagueId}/settings`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Failed to update league settings");
    }
    return response.json();
}

export async function fetchMaintenanceLeagues() {
    const response = await fetch(`${API_URL}/api/admin/leagues`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to load leagues");
    return response.json();
}

export async function fetchMaintenanceLeague(leagueId) {
    const response = await fetch(`${API_URL}/api/admin/leagues/${leagueId}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to load the selected league");
    return response.json();
}

export async function updateMaintenanceLeagueSettings(leagueId, settings) {
    const response = await fetch(`${API_URL}/api/admin/leagues/${leagueId}/settings`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(settings)
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Failed to update league settings");
    }
    return response.json();
}
