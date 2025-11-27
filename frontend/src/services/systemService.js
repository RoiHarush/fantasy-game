import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

export const fetchSystemStatus = async () => {
    try {
        const response = await fetch(`${API_URL}/api/system/status`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        return data.isRolloverInProgress;
    } catch (error) {
        console.error("Failed to fetch system status", error);
        return false;
    }
};