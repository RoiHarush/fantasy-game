import { apiRequest } from "../../services/apiClient";

export function getAlexAnalysis(gameweekId, { signal } = {}) {
    return apiRequest(`/api/ai/coach/gameweeks/${gameweekId}`, { signal });
}

export function generateAlexAnalysis(gameweekId, { mode, draftSquad }) {
    return apiRequest(`/api/ai/coach/gameweeks/${gameweekId}/analyze`, {
        method: "POST",
        body: { mode, draftSquad },
        timeoutMs: 30_000,
    });
}

export function askAlex(gameweekId, message) {
    return apiRequest(`/api/ai/coach/gameweeks/${gameweekId}/messages`, {
        method: "POST",
        body: { message },
        timeoutMs: 30_000,
    });
}
