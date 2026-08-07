import { apiRequest } from "./apiClient";

export async function fetchAllUsers() {
    return apiRequest("/api/users");
}

export async function fetchUserById(userId) {
    return apiRequest(`/api/users/${userId}`);
}