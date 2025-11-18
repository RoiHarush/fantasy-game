import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

export async function fetchAllUsers() {
    const res = await fetch(`${API_URL}/api/users`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}