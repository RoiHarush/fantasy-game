import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

export async function fetchUserChips(userId) {
    const res = await fetch(`${API_URL}/api/teams/${userId}/chips`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch chips");
    return res.json();
}

export async function saveTeamRequest(userId, dto) {
    const res = await fetch(`${API_URL}/api/teams/${userId}/save`, {
        method: "POST",
        headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dto)
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
    }

    return res.json();
}