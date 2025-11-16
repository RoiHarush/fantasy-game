import API_URL from "../config";

export async function fetchLeague(userGameweekId) {
    const res = await fetch(`${API_URL}/api/league?gw=${userGameweekId}`);

    if (!res.ok) {
        throw new Error(`Failed to load league data (HTTP ${res.status})`);
    }

    return res.json();
}