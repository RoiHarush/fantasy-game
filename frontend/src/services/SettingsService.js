import { apiRequest } from "./apiClient";

export const updateUserSettings = async (data) => {
    try {
        const response = await apiRequest(`/api/users/profile`, {
            method: 'PUT',
            body: data,
        });

        return response;
    } catch (error) {
        console.error("Update failed:", error);
        throw error;
    }
};