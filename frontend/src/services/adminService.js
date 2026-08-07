import { apiRequest } from "./apiClient";

export const AdminService = {
    getAssisters: async (gameweek, leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/players/assists/${gameweek}`
            : `/api/league-admin/players/assists/${gameweek}`;
        return apiRequest(endpoint);
    },

    updateAssist: async (playerId, gameweek, action, leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/players/assists`
            : `/api/league-admin/players/assists`;
        return apiRequest(endpoint, {
            method: "POST",
            body: { playerId, gameweek, action },
        });
    },

    getPenaltiesConceded: async (gameweek, leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/players/penalties/${gameweek}`
            : `/api/league-admin/players/penalties/${gameweek}`;
        return apiRequest(endpoint);
    },

    updatePenaltyConceded: async (playerId, gameweek, action, leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/players/penalties`
            : `/api/league-admin/players/penalties`;
        return apiRequest(endpoint, {
            method: "POST",
            body: { playerId, gameweek, action },
        });
    },

    togglePlayerLock: async (playerId, shouldLock, leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/players/${playerId}/lock?locked=${shouldLock}`
            : `/api/league-admin/players/${playerId}/lock?locked=${shouldLock}`;
        return apiRequest(endpoint, { method: "POST" });
    },

    getLockedPlayers: async (leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/players/locked`
            : `/api/league-admin/players/locked`;
        return apiRequest(endpoint);
    },

    updatePlayerPosition: async (playerId, positionId, leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/players/position`
            : `/api/league-admin/players/position`;
        await apiRequest(endpoint, {
            method: "POST",
            body: { playerId, positionId },
        });
        return true;
    },

    getDraftConfig: async (leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/draft`
            : `/api/league-admin/draft/config`;
        return apiRequest(endpoint);
    },

    deleteDraft: async (leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/draft`
            : `/api/league-admin/draft/config`;
        await apiRequest(endpoint, { method: "DELETE" });
        return true;
    },

    scheduleDraft: async (time, leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/draft/schedule`
            : `/api/league-admin/draft/schedule`;
        await apiRequest(endpoint, {
            method: "POST",
            body: { scheduledTime: time },
        });
        return true;
    },

    openDraftNow: async (leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/draft/open-now`
            : `/api/league-admin/draft/open-now`;
        await apiRequest(endpoint, { method: "POST" });
        return true;
    }
};
