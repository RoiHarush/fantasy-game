import { apiRequest } from "./apiClient";

export async function fetchDailyStatus(gwId) {
    return apiRequest(`/api/gameweeks/${gwId}/daily-status`);
}