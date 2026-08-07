import { apiRequest } from "./apiClient";

export async function fetchUserPoints(userId, gameweekId) {
    return apiRequest(`/api/points/${userId}/${gameweekId}`);
}

export async function fetchUserLivePoints(userId, gameweekId) {
    return apiRequest(`/api/points/${userId}/${gameweekId}/live`);
}

export async function fetchUserTotalPoints(userId) {
    return apiRequest(`/api/points/${userId}`);
}
