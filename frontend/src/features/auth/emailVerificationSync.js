const CHANNEL_NAME = "fantasy-email-verification";
const STORAGE_KEY = "fantasy-email-verification-event";

function normalizeEvent(event) {
    if (!event || typeof event !== "object" || typeof event.type !== "string") return null;
    return event;
}

export function publishEmailVerificationEvent(type, email) {
    if (typeof window === "undefined") return;

    const event = {
        type,
        email: String(email || "").trim().toLowerCase(),
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };

    if ("BroadcastChannel" in window) {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage(event);
        channel.close();
    }

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(event));
    } catch {
        // Cross-tab handoff is an enhancement; the verification tab has its own redirect fallback.
    }
}

export function subscribeToEmailVerificationEvents(listener) {
    if (typeof window === "undefined") return () => {};

    const deliver = (event) => {
        const normalized = normalizeEvent(event);
        if (normalized) listener(normalized);
    };
    const channel = "BroadcastChannel" in window ? new BroadcastChannel(CHANNEL_NAME) : null;
    const handleChannelMessage = (event) => deliver(event.data);
    const handleStorage = (event) => {
        if (event.key !== STORAGE_KEY || !event.newValue) return;
        try {
            deliver(JSON.parse(event.newValue));
        } catch {
            // Ignore malformed values written by extensions or old application versions.
        }
    };

    channel?.addEventListener("message", handleChannelMessage);
    window.addEventListener("storage", handleStorage);

    return () => {
        channel?.removeEventListener("message", handleChannelMessage);
        channel?.close();
        window.removeEventListener("storage", handleStorage);
    };
}
