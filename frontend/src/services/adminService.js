import API_URL from '../config';
import { getAuthHeaders } from './authHelper';

export const AdminService = {
    getAssisters: async (gameweek) => {
        try {
            const response = await fetch(`${API_URL}/api/players/player-assisted/${gameweek}`, {
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

    updateAssist: async (playerId, gameweek, action) => {
        try {
            const response = await fetch(`${API_URL}/api/players/admin/update-assist`, {
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

    getPenaltiesConceded: async (gameweek) => {
        try {
            const response = await fetch(`${API_URL}/api/players/player-penalties/${gameweek}`, {
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

    updatePenaltyConceded: async (playerId, gameweek, action) => {
        try {
            const response = await fetch(`${API_URL}/api/players/admin/update-penalty`, {
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

    togglePlayerLock: async (playerId, shouldLock) => {
        try {
            const response = await fetch(`${API_URL}/api/players/toggle-lock?playerId=${playerId}&lock=${shouldLock}`, {
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

    getLockedPlayers: async () => {
        try {
            const response = await fetch(`${API_URL}/api/players/locked-players`, {
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
};