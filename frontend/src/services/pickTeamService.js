import { apiRequest } from "./apiClient";

export async function fetchUserChips(userId, { signal } = {}) {
    return apiRequest(`/api/teams/${userId}/chips`, { signal });
}

export async function saveTeamRequest(userId, dto) {
    return apiRequest(`/api/teams/${userId}/save`, {
        method: "POST",
        body: dto,
    });
}

async function runChipAction(userId, endpoint) {
    const updatedSquad = await apiRequest(endpoint, { method: "POST" });
    const updatedChips = await fetchUserChips(userId);
    return { updatedSquad, updatedChips };
}

export function assignIrPlayer(userId, playerId) {
    return runChipAction(userId, `/api/teams/${userId}/chips/ir?playerId=${playerId}`);
}

export function releaseIrPlayer(userId, playerOutId) {
    return runChipAction(userId, `/api/teams/${userId}/chips/ir/release?playerOutId=${playerOutId}`);
}

export function toggleFirstPickCaptain(userId, active) {
    const endpoint = active
        ? `/api/teams/${userId}/chips/first-pick-captain/release`
        : `/api/teams/${userId}/chips/first-pick-captain`;
    return runChipAction(userId, endpoint);
}
