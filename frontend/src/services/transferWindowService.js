import { apiRequest } from "./apiClient";

export async function fetchTransferWindowState() {
    return apiRequest("/api/market/state");
}

export async function fetchTransferHistory(gameWeekId) {
    return apiRequest(`/api/market/history/${gameWeekId}`);
}

export async function passTurn(userId) {
    await apiRequest(`/api/market/pass?userId=${userId}`, {
        method: "POST",
    });
}

export async function makeDraftPick(playerId) {
    await apiRequest(`/api/market/draft-pick/${playerId}`, {
        method: "POST",
    });
}
