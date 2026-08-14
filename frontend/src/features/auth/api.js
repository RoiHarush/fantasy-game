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
            email: values.email,
            password: values.password,
        }
        : { identifier: values.identifier, password: values.password };

    return apiRequest(`/api/auth/${endpoint}`, {
        method: "POST",
        body,
        auth: false,
    });
}

function publicAuthMutation(endpoint, body) {
    return apiRequest(`/api/auth/${endpoint}`, { method: "POST", body, auth: false });
}

export function verifyEmail(token, { signal } = {}) {
    return apiRequest("/api/auth/verify-email", {
        method: "POST",
        body: { token },
        auth: false,
        signal,
    });
}

export function resendVerification(email) {
    return publicAuthMutation("resend-verification", { email });
}

export function requestPasswordReset(email) {
    return publicAuthMutation("forgot-password", { email });
}

export function resetPassword(token, password) {
    return publicAuthMutation("reset-password", { token, password });
}

export function endSession() {
    return apiRequest("/api/auth/logout", {
        method: "POST",
        auth: false,
    });
}
