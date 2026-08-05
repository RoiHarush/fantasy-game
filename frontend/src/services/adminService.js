import API_URL from '../config';
import { getAuthHeaders } from './authHelper';

export const AdminService = {
    getAssisters: async (gameweek, leagueId = null) => {
        try {
            const endpoint = leagueId
                ? `/api/admin/leagues/${leagueId}/players/assists/${gameweek}`
                : `/api/league-admin/players/assists/${gameweek}`;
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch assisters');
            return await response.json();
        } catch (error) {
            console.error("Error in getAssisters:", error);
            throw error;
        }
    },

    updateAssist: async (playerId, gameweek, action, leagueId = null) => {
        try {
            const endpoint = leagueId
                ? `/api/admin/leagues/${leagueId}/players/assists`
                : `/api/league-admin/players/assists`;
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ playerId, gameweek, action })
            });
            if (!response.ok) throw new Error('Failed to update assist');
            return await response.json();
        } catch (error) {
            console.error("Error in updateAssist:", error);
            throw error;
        }
    },

    getPenaltiesConceded: async (gameweek, leagueId = null) => {
        try {
            const endpoint = leagueId
                ? `/api/admin/leagues/${leagueId}/players/penalties/${gameweek}`
                : `/api/league-admin/players/penalties/${gameweek}`;
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch penalties');
            return await response.json();
        } catch (error) {
            console.error("Error in getPenaltiesConceded:", error);
            throw error;
        }
    },

    updatePenaltyConceded: async (playerId, gameweek, action, leagueId = null) => {
        try {
            const endpoint = leagueId
                ? `/api/admin/leagues/${leagueId}/players/penalties`
                : `/api/league-admin/players/penalties`;
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ playerId, gameweek, action })
            });
            if (!response.ok) throw new Error('Failed to update penalty');
            return await response.json();
        } catch (error) {
            console.error("Error in updatePenaltyConceded:", error);
            throw error;
        }
    },

    togglePlayerLock: async (playerId, shouldLock, leagueId = null) => {
        try {
            const endpoint = leagueId
                ? `/api/admin/leagues/${leagueId}/players/${playerId}/lock?locked=${shouldLock}`
                : `/api/league-admin/players/${playerId}/lock?locked=${shouldLock}`;
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to toggle lock');
            return await response.json();
        } catch (error) {
            console.error("Error in togglePlayerLock:", error);
            throw error;
        }
    },

    getLockedPlayers: async (leagueId = null) => {
        try {
            const endpoint = leagueId
                ? `/api/admin/leagues/${leagueId}/players/locked`
                : `/api/league-admin/players/locked`;
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Failed to fetch locked players');
            return await response.json();
        } catch (error) {
            console.error("Error in getLockedPlayers:", error);
            throw error;
        }
    },

    updatePlayerPosition: async (playerId, positionId, leagueId = null) => {
        try {
            const endpoint = leagueId
                ? `/api/admin/leagues/${leagueId}/players/position`
                : `/api/league-admin/players/position`;
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ playerId, positionId })
            });
            if (!response.ok) throw new Error('Failed to update position');
            return true;
        } catch (error) {
            console.error("Error in updatePlayerPosition:", error);
            throw error;
        }
    },

    getDraftConfig: async (leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/draft`
            : `/api/league-admin/draft/config`;
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: getAuthHeaders()
        });
        if (!response.ok) return null;
        const body = await response.text();
        return body ? JSON.parse(body) : null;
    },

    deleteDraft: async (leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/draft`
            : `/api/league-admin/draft/config`;
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete draft');
        return true;
    },

    scheduleDraft: async (time, leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/draft/schedule`
            : `/api/league-admin/draft/schedule`;
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ scheduledTime: time })
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.error || 'Failed to schedule draft');
        }
        return true;
    },

    openDraftNow: async (leagueId = null) => {
        const endpoint = leagueId
            ? `/api/admin/leagues/${leagueId}/draft/open-now`
            : `/api/league-admin/draft/open-now`;
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.error || 'Failed to open draft');
        }
        return true;
    }
};
