import { apiRequest } from "../../services/apiClient";
import { normalizeTeamFixtures } from "./model";

export function getFixtures({ signal } = {}) {
    return apiRequest("/api/fixtures", { auth: false, signal });
}

export function getTeamFixtures(teamId, { signal } = {}) {
    return apiRequest(`/api/fixtures/team/${teamId}`, { signal }).then(normalizeTeamFixtures);
}
