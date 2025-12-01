import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

export async function fetchSquadForGameweek(userId, gameweekId) {
    const res = await fetch(`${API_URL}/api/teams/${userId}/squad?gw=${gameweekId}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch squad");
    return res.json();
}

export async function fetchPlayerDataForGameweek(userId, gameweekId) {
    const res = await fetch(`${API_URL}/api/players/squad-data?userId=${userId}&gw=${gameweekId}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch player data");
    return res.json();
}