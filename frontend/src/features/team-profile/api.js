import { apiRequest } from "../../services/apiClient";

export function updateTeamProfile({ teamName, logo }) {
    const body = new FormData();
    body.set("teamName", teamName);
    if (logo) body.set("logo", logo);

    return apiRequest("/api/users/team", {
        method: "PUT",
        body,
    });
}

export function removeTeamLogo() {
    return apiRequest("/api/users/team/logo", { method: "DELETE" });
}
