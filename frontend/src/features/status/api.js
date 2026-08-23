import { apiRequest } from "../../services/apiClient";

export function getDailyStatus(gameweekId, { signal } = {}) {
    return apiRequest(`/api/gameweeks/${gameweekId}/daily-status`, { signal });
}

export function getIrStatuses({ signal } = {}) {
    return apiRequest("/api/teams/ir-status", { signal });
}

export function getPlayersOfTheWeek(userId, { signal } = {}) {
    return apiRequest(`/api/fpl/players-of-the-week?userId=${encodeURIComponent(userId)}`, { signal });
}

export function getDreamTeam(gameweekId, { signal } = {}) {
    return apiRequest(`/api/fpl/dream-team/${gameweekId}`, { auth: false, signal });
}

export function getGameweekRoast(gameweekId, { signal } = {}) {
    return apiRequest(`/api/ai/roasts/gameweeks/${gameweekId}`, { signal });
}

export function generateGameweekRoast(gameweekId) {
    return apiRequest(`/api/ai/roasts/gameweeks/${gameweekId}`, { method: "POST" });
}
