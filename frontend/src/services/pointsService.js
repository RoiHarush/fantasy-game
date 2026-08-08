import { apiRequest } from "./apiClient";

export async function fetchUserPoints(userId, gameweekId, { signal } = {}) {
    return apiRequest(`/api/points/${userId}/${gameweekId}`, { signal });
}

export async function fetchUserLivePoints(userId, gameweekId, { signal } = {}) {
    return apiRequest(`/api/points/${userId}/${gameweekId}/live`, { signal });
}

export async function fetchUserTotalPoints(userId, { signal } = {}) {
    return apiRequest(`/api/points/${userId}`, { signal });
}

export async function fetchUserHistory(userId, { signal } = {}) {
    return apiRequest(`/api/points/${userId}/history`, { signal });
}
