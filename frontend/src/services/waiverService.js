import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

async function readError(response, fallback) {
    const message = await response.text();
    throw new Error(message || fallback);
}

export async function fetchWaiverPlan(gameWeekId) {
    const response = await fetch(`${API_URL}/api/waivers/${gameWeekId}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) return readError(response, "Failed to load waiver plan");
    return response.json();
}

export async function saveWaiverPlan(gameWeekId, entries) {
    const response = await fetch(`${API_URL}/api/waivers/${gameWeekId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            entries: entries.map(entry => ({
                playerInId: entry.playerInId,
                playerOutId: entry.playerOutId
            }))
        })
    });
    if (!response.ok) return readError(response, "Failed to save waiver plan");
    return response.json();
}
