import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

export const updateUserSettings = async (data) => {
    try {
        const response = await fetch(`${API_URL}/api/users/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        const contentType = response.headers.get("content-type");
        let errorData;

        if (contentType && contentType.indexOf("application/json") !== -1) {
            errorData = await response.json();
        } else {
            const text = await response.text();
            errorData = { error: text || "Unknown error occurred" };
        }

        if (!response.ok) {
            throw new Error(errorData.error || "Failed to update settings");
        }

        return errorData;
    } catch (error) {
        console.error("Update failed:", error);
        throw error;
    }
};