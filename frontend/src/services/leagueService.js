import { apiRequest } from "./apiClient";

export async function fetchLeague() {
    return apiRequest("/api/league");
}

export async function fetchMyLeague() {
    return apiRequest("/api/leagues/me");
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

export async function fetchMaintenanceLeague(leagueId) {
    return apiRequest(`/api/admin/leagues/${leagueId}`);
}

export async function updateMaintenanceLeagueSettings(leagueId, settings) {
    return apiRequest(`/api/admin/leagues/${leagueId}/settings`, {
        method: "PUT",
        body: settings,
    });
}
