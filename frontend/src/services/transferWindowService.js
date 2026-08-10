import { apiRequest } from "./apiClient";

export async function fetchTransferWindowState({ signal } = {}) {
    return apiRequest("/api/market/state", { signal });
}

export async function fetchTransferHistory(gameWeekId, { signal } = {}) {
    return apiRequest(`/api/market/history/${gameWeekId}`, { signal });
}

export async function passTurn(userId) {
    await apiRequest(`/api/market/pass?userId=${userId}`, {
        method: "POST",
    });
}

export async function skipCurrentTurn() {
    await apiRequest("/api/market/admin/skip-current-turn", {
        method: "POST",
    });
}

export async function fetchTransferAttendance(gameweekId, { signal } = {}) {
    return apiRequest(`/api/market/attendance/${gameweekId}`, { signal });
}

export async function saveTransferAttendance(gameweekId, automatic) {
    return apiRequest(`/api/market/attendance/${gameweekId}`, {
        method: "PUT",
        body: { automatic },
    });
}

export async function makeDraftPick(playerId) {
    await apiRequest(`/api/market/draft-pick/${playerId}`, {
        method: "POST",
    });
}

export async function fetchTransferOrder(gameweekId, { signal } = {}) {
    return apiRequest(`/api/market/turn-order/${gameweekId}`, { signal });
}

export async function saveTransferOrder(gameweekId, order) {
    return apiRequest(`/api/market/set-order/${gameweekId}`, {
        method: "POST",
        body: { order },
    });
}

export async function openTransferWindow(gameweekId) {
    return apiRequest(`/api/market/open/${gameweekId}`, { method: "POST" });
}

export async function transferPlayer(playerOutId, playerInId) {
    return apiRequest("/api/market/transfer", {
        method: "POST",
        body: { playerOutId, playerInId },
    });
}

export async function signIrPlayer(userId, playerId) {
    return apiRequest("/api/market/ir-sign", {
        method: "POST",
        body: { userId, playerId },
    });
}
