import { apiRequest } from "./apiClient";

export async function fetchUserChips(userId) {
    return apiRequest(`/api/teams/${userId}/chips`);
}

export async function saveTeamRequest(userId, dto) {
    return apiRequest(`/api/teams/${userId}/save`, {
        method: "POST",
        body: dto,
    });
}