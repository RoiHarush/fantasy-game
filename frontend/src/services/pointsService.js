import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

export async function fetchUserPoints(userId, gameweekId) {
    const res = await fetch(`${API_URL}/api/points/${userId}/${gameweekId}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch points");
    return res.json();
}

export async function fetchUserLivePoints(userId, gameweekId) {
    const res = await fetch(`${API_URL}/api/points/${userId}/${gameweekId}/live`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch live points");
    return res.json();
}

export async function fetchUserTotalPoints(userId) {
    const res = await fetch(`${API_URL}/api/points/${userId}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch total points");
    return res.json();
}
