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

export async function fetchIrWaiverPlan(gameWeekId) {
    return apiRequest(`/api/waivers/${gameWeekId}/ir`);
}

export async function saveIrWaiverPlan(gameWeekId, entries) {
    return apiRequest(`/api/waivers/${gameWeekId}/ir`, {
        method: "PUT",
        body: {
            entries: entries.map(entry => ({
                playerInId: entry.playerInId,
                playerOutId: entry.playerOutId ?? null,
            })),
        },
    });
}
