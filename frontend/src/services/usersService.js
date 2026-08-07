import { apiRequest } from "./apiClient";

export async function fetchAllUsers({ signal } = {}) {
    return apiRequest("/api/users", { signal });
}
