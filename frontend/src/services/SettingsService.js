import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

export const updateUserSettings = async (data) => {
    try {
        const response = await fetch(`${API_URL}/api/users/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to update settings");
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};