import { apiRequest } from "./apiClient";

export async function fetchLeague({ signal } = {}) {
    return apiRequest("/api/league", { signal });
}

export async function fetchMyLeague({ signal } = {}) {
    return apiRequest("/api/leagues/me", { signal });
}

export async function updateLeagueSettings(leagueId, settings) {
    return apiRequest(`/api/leagues/${leagueId}/settings`, {
        method: "PUT",
        body: settings,
    });
}

export async function removeLeagueMember(leagueId, memberId) {
    return apiRequest(`/api/leagues/${leagueId}/members/${memberId}`, {
        method: "DELETE",
    });
}

export async function fetchMaintenanceLeagues() {
    return apiRequest("/api/admin/leagues");
}

export async function fetchMaintenanceLeague(leagueId, { signal } = {}) {
    return apiRequest(`/api/admin/leagues/${leagueId}`, { signal });
}

export async function updateMaintenanceLeagueSettings(leagueId, settings) {
    return apiRequest(`/api/admin/leagues/${leagueId}/settings`, {
        method: "PUT",
        body: settings,
    });
}
