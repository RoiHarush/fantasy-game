import API_URL from "../config";

const userCache = new Map();

export async function getUserFromId(id) {
    if (!id) return null;

    if (userCache.has(id)) {
        return userCache.get(id);
    }

    try {
        const res = await fetch(`${API_URL}/api/users/${id}`);
        if (!res.ok) throw new Error("User not found");
        const user = await res.json();

        userCache.set(id, user);
        return user;
    } catch (err) {
        console.error("Failed to fetch user:", err);
        return null;
    }
}

