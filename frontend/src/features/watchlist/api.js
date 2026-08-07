import { apiRequest } from "../../services/apiClient";

export function getWatchlist(userId, { signal } = {}) {
    return apiRequest(`/api/teams/${userId}/watchlist`, { signal });
}

export function addToWatchlist(userId, playerId) {
    return apiRequest(`/api/teams/${userId}/watchlist/add`, {
        method: "POST",
        body: { playerId },
    });
}

export function removeFromWatchlist(userId, playerId) {
    return apiRequest(`/api/teams/${userId}/watchlist/remove`, {
        method: "DELETE",
        body: { playerId },
    });
}
