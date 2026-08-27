import { apiRequest } from "../../services/apiClient";

export function getAdminUsers({ signal } = {}) {
    return apiRequest("/api/admin/users-summary", { signal });
}

export function getAdminUserDetails(userId, { signal } = {}) {
    return apiRequest(`/api/admin/user-details/${userId}`, { signal });
}

export function updateAdminUser(userId, values) {
    return apiRequest(`/api/admin/user-details/${userId}`, {
        method: "PUT",
        body: { ...values, password: values.password || null },
    });
}

export function getAdminPlayers({ signal } = {}) {
    return apiRequest("/api/players", { signal });
}

export function runAdminAction({ endpoint, method, body }) {
    return apiRequest(endpoint, { method, body });
}

export function updateAdminUserLogo(userId, logo) {
    const body = new FormData();
    body.set("logo", logo);
    return apiRequest(`/api/admin/user-details/${userId}/team-logo`, {
        method: "PUT",
        body,
    });
}

export function removeAdminUserLogo(userId) {
    return apiRequest(`/api/admin/user-details/${userId}/team-logo`, { method: "DELETE" });
}

export function getPlayerReplacementOptions(leagueId, userId, { signal } = {}) {
    return apiRequest(`/api/admin/leagues/${leagueId}/users/${userId}/player-replacement`, { signal });
}

export function replacePlayerForManager({ leagueId, userId, playerOutId, playerInId }) {
    return apiRequest(`/api/admin/leagues/${leagueId}/users/${userId}/player-replacement`, {
        method: "POST",
        body: { playerOutId, playerInId },
    });
}
