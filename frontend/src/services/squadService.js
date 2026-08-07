import { apiRequest } from "./apiClient";

export async function fetchSquadForGameweek(userId, gameweekId) {
    return apiRequest(`/api/teams/${userId}/squad?gw=${gameweekId}`);
}

export async function fetchPlayerDataForGameweek(userId, gameweekId) {
    return apiRequest(`/api/players/squad-data?userId=${userId}&gw=${gameweekId}`);
}