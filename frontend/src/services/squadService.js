import { apiRequest } from "./apiClient";

export async function fetchSquadForGameweek(userId, gameweekId, { signal } = {}) {
    return apiRequest(`/api/teams/${userId}/squad?gw=${gameweekId}`, { signal });
}

export async function fetchPlayerDataForGameweek(userId, gameweekId, { signal } = {}) {
    return apiRequest(`/api/players/squad-data?userId=${userId}&gw=${gameweekId}`, { signal });
}
