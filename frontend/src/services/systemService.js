import { apiRequest, ApiError } from "./apiClient";

export const fetchSystemStatus = async () => {
    try {
        const data = await apiRequest("/api/system/status");
        return data.isRolloverInProgress;
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            return false;
        }
        console.error("Failed to fetch system status", error);
        return false;
    }
};