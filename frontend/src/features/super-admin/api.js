import { apiRequest } from "../../services/apiClient";

export function getAdminUsers({ signal } = {}) {
    return apiRequest("/api/admin/users-summary", { signal });
}

export function getAdminUserDetails(userId, { signal } = {}) {
    return apiRequest(`/api/admin/user-details/${userId}`, { signal });
}

export function updateAdminUser(userId, values) {
    return apiRequest(`/api/admin/user-details/${userId}`, {
        method: "PUT",
        body: { ...values, password: values.password || null },
    });
}

export function getAdminPlayers({ signal } = {}) {
    return apiRequest("/api/players", { signal });
}

export function runAdminAction({ endpoint, method, body }) {
    return apiRequest(endpoint, { method, body });
}
