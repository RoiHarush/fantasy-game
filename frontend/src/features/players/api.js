import { apiRequest } from "../../services/apiClient";

export function getPlayers({ signal } = {}) {
    return apiRequest("/api/players", { signal });
}

export function getPlayerStats(playerId, { signal } = {}) {
    return apiRequest(`/api/players/${playerId}/all-stats`, { auth: false, signal });
}

export function getPlayerMatchStats(playerId, gameweekId, userId, { signal } = {}) {
    const search = new URLSearchParams({
        gw: String(gameweekId),
        userId: String(userId),
    });
    return apiRequest(`/api/players/${playerId}/match-stats?${search}`, { auth: false, signal });
}
