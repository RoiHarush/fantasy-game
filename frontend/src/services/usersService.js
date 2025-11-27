import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

export async function fetchAllUsers() {
    const res = await fetch(`${API_URL}/api/users`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}

export async function fetchUserById(userId) {
    const res = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        if (res.status === 404) throw new Error("User not found");
        if (res.status === 401 || res.status === 403) throw new Error("Access Denied");
        throw new Error("Failed to fetch user");
    }

    return res.json();
}