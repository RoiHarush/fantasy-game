import { apiRequest } from "../../services/apiClient";

export function getLeagueLive({ signal } = {}) {
    return apiRequest("/api/live", { signal });
}
