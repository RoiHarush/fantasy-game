import API_URL from "../config";

export async function fetchAllUsers() {
    const res = await fetch(`${API_URL}/api/users`);
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}
