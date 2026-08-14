import { apiRequest } from "../../services/apiClient";

function readOnlyRequest(path) {
    return apiRequest(path, { method: "GET" });
}

export const getObservedLeague = (leagueId) => readOnlyRequest(`/api/admin/observe/leagues/${leagueId}`);
export const getObservedSquad = (leagueId, userId, gameweek) => readOnlyRequest(
    `/api/admin/observe/leagues/${leagueId}/users/${userId}/squad${gameweek ? `?gw=${gameweek}` : ""}`
);
export const getObservedWindow = (leagueId) => readOnlyRequest(`/api/admin/observe/leagues/${leagueId}/window`);
export const getObservedPlayers = (leagueId, userId) => readOnlyRequest(
    `/api/admin/observe/leagues/${leagueId}/users/${userId}/players`
);
export const getObservedSquadData = (leagueId, userId, gameweek) => readOnlyRequest(
    `/api/admin/observe/leagues/${leagueId}/users/${userId}/squad-data/${gameweek}`
);
export const getObservedPoints = (leagueId, userId, gameweek) => readOnlyRequest(
    `/api/admin/observe/leagues/${leagueId}/users/${userId}/points/${gameweek}`
);
export const getObservedHistory = (leagueId, gameweek) => readOnlyRequest(
    `/api/admin/observe/leagues/${leagueId}/history/${gameweek}`
);
