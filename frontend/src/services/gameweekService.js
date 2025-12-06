import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

export async function fetchDailyStatus(gwId) {
    const res = await fetch(`${API_URL}/api/gameweeks/${gwId}/daily-status`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch daily status");
    return res.json();
}