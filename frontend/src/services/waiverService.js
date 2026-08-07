import { apiRequest } from "./apiClient";

export async function fetchWaiverPlan(gameWeekId) {
    return apiRequest(`/api/waivers/${gameWeekId}`);
}

export async function saveWaiverPlan(gameWeekId, entries) {
    return apiRequest(`/api/waivers/${gameWeekId}`, {
        method: "PUT",
        body: {
            entries: entries.map(entry => ({
                playerInId: entry.playerInId,
                playerOutId: entry.playerOutId
            }))
        }
    });
}
