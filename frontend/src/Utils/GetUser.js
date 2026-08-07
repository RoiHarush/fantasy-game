import { apiRequest } from "../services/apiClient";

const userCache = new Map();

export async function getUserFromId(id) {
    if (!id) return null;

    if (userCache.has(id)) {
        return userCache.get(id);
    }

    try {
        const user = await apiRequest(`/api/users/${id}`);

        userCache.set(id, user);
        return user;

    } catch (err) {
        if (err?.status === 404) {
            console.warn(`User ${id} not found`);
            return null;
        }
        console.error("Network or fetch error:", err.message);
        return null;
    }
}


