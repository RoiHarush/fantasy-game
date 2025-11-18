import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

export async function fetchUserPoints(userId, gameweekId) {
    const res = await fetch(`${API_URL}/api/points/${userId}/${gameweekId}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch points");
    return res.json();
}
