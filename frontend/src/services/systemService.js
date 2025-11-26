import API_URL from "../config";

export const fetchSystemStatus = async () => {
    try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/system/status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
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