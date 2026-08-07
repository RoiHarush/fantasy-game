import { apiRequest } from "../../services/apiClient";

export function updateUserSettings(data) {
    return apiRequest("/api/users/profile", {
        method: "PUT",
        body: data,
    });
}
