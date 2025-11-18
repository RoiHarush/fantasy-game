import API_URL from "../config";
import { getAuthHeaders } from "./authHelper";

export async function fetchTransferWindowState() {
    const res = await fetch(`${API_URL}/api/transfer-window/state`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch transfer window state");
    return res.json();
}

export async function passTurn(userId) {
    const res = await fetch(`${API_URL}/api/transfer-window/pass?userId=${userId}`, {
        method: "POST",
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to pass turn");
    }
}
