import API_URL from "../config";

const userCache = new Map();

export async function getUserFromId(id) {
    if (!id) return null;

    if (userCache.has(id)) {
        return userCache.get(id);
    }

    try {
        const res = await fetch(`${API_URL}/api/users/${id}`);

        if (!res.ok) {
            if (res.status === 404) {
                console.warn(`User ${id} not found`);
                return null;
            }
            throw new Error(`HTTP ${res.status}`);
        }

        let user;
        try {
            user = await res.json();
        } catch {
            console.error("Bad JSON response from server");
            return null;
        }

        userCache.set(id, user);
        return user;

    } catch (err) {
        console.error("Network or fetch error:", err.message);
        return null;
    }
}


