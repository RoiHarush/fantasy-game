const STORAGE_KEY = "fantasy-client-instance-id";

export function getClientInstanceId() {
    if (typeof window === "undefined") return "server";
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
        id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
}
