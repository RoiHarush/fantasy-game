import { apiRequest } from "../../services/apiClient";
import { normalizeGameweekResponses } from "./model";

export async function getGameweekState({ signal } = {}) {
    const responses = await Promise.allSettled([
        apiRequest("/api/gameweeks", { signal }),
        apiRequest("/api/gameweeks/current", { signal }),
        apiRequest("/api/gameweeks/next", { signal }),
        apiRequest("/api/gameweeks/last", { signal }),
    ]);

    return normalizeGameweekResponses(responses);
}
