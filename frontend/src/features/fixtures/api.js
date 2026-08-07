import { apiRequest } from "../../services/apiClient";

export function getFixtures({ signal } = {}) {
    return apiRequest("/api/fixtures", { auth: false, signal });
}

export function getTeamFixtures(teamId, { signal } = {}) {
    return apiRequest(`/api/fixtures/team/${teamId}`, { signal });
}
