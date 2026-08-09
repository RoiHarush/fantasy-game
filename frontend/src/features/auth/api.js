import { apiRequest } from "../../services/apiClient";

export function getCurrentUser() {
    return apiRequest("/api/auth/me");
}

export function authenticateUser(values, registering) {
    const endpoint = registering ? "register" : "login";
    const body = registering
        ? {
            firstName: values.firstName,
            lastName: values.lastName,
            username: values.username,
            password: values.password,
        }
        : { username: values.username, password: values.password };

    return apiRequest(`/api/auth/${endpoint}`, {
        method: "POST",
        body,
        auth: false,
    });
}

export function endSession() {
    return apiRequest("/api/auth/logout", {
        method: "POST",
        auth: false,
    });
}
