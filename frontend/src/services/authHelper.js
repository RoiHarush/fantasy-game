import { getStoredToken } from "./apiClient";

export function getAuthHeaders() {
    const token = getStoredToken();

    if (!token) {
        return {};
    }

    return {
        Authorization: `Bearer ${token}`,
    };
}