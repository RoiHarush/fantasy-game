import { apiRequest } from "../../services/apiClient";

export function getTeams({ signal } = {}) {
    return apiRequest("/api/teams", { signal });
}
