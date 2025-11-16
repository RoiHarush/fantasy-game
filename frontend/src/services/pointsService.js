import API_URL from "../config";

export async function fetchUserPoints(userId, gameweekId) {
    const res = await fetch(`${API_URL}/api/points/${userId}/${gameweekId}`);
    if (!res.ok) throw new Error("Failed to fetch points");
    return res.json();
}
