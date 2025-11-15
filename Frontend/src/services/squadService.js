import API_URL from "../config";

export async function fetchSquadForGameweek(userId, gameweekId) {
    const res = await fetch(`${API_URL}/api/users/${userId}/squad?gw=${gameweekId}`);
    if (!res.ok) throw new Error("Failed to fetch squad");
    return res.json();
}

export async function fetchPlayerDataForGameweek(userId, gameweekId) {
    const res = await fetch(`${API_URL}/api/players/user/${userId}/gameweek/${gameweekId}`);
    if (!res.ok) throw new Error("Failed to fetch player data");
    return res.json();
}