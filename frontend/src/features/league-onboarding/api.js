import { apiRequest } from "../../services/apiClient";

export function getScoringDefaults({ signal } = {}) {
    return apiRequest("/api/leagues/scoring-rules/defaults", { signal });
}

export function createLeague(values) {
    return apiRequest("/api/leagues", {
        method: "POST",
        body: {
            name: values.leagueName,
            maxParticipants: values.maxParticipants,
            fantasyTeamName: values.teamName,
            scoringRules: values.scoringRules,
        },
    });
}

export function joinLeague(values) {
    return apiRequest("/api/leagues/join", {
        method: "POST",
        body: {
            leagueCode: values.leagueCode.trim().toUpperCase(),
            fantasyTeamName: values.teamName,
        },
    });
}
