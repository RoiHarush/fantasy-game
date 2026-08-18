import { apiRequest } from "../../services/apiClient";
import { getClientInstanceId } from "./clientInstance";

export function getPushPublicKey() {
    return apiRequest("/api/notifications/push/public-key");
}

export function savePushSubscription(subscription) {
    return apiRequest("/api/notifications/push/subscriptions", {
        method: "PUT",
        body: { ...subscription.toJSON(), clientInstanceId: getClientInstanceId() },
    });
}

export function deletePushSubscription(endpoint) {
    return apiRequest("/api/notifications/push/subscriptions", {
        method: "DELETE",
        body: { endpoint },
    });
}

function base64UrlToUint8Array(value) {
    const padding = "=".repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
    const raw = window.atob(base64);
    return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export async function enablePushForCurrentDevice() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        throw new Error("Push notifications are not supported on this device.");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        throw new Error(permission === "denied"
            ? "Notifications are blocked in your browser settings."
            : "Notification permission was not granted.");
    }
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    const { publicKey } = await getPushPublicKey();
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(publicKey),
    });
    await savePushSubscription(subscription);
    return subscription;
}

export async function disablePushForCurrentDevice({ notifyServer = true } = {}) {
    if (!("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration("/");
    const subscription = await registration?.pushManager?.getSubscription();
    if (!subscription) return false;
    if (notifyServer) await deletePushSubscription(subscription.endpoint);
    await subscription.unsubscribe();
    return true;
}

export async function getCurrentPushState() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return "unsupported";
    }
    if (Notification.permission === "denied") return "blocked";
    const registration = await navigator.serviceWorker.getRegistration("/");
    return await registration?.pushManager?.getSubscription() ? "enabled" : "disabled";
}

export async function syncExistingPushSubscription() {
    if (!("serviceWorker" in navigator) || Notification.permission !== "granted") return false;
    const registration = await navigator.serviceWorker.getRegistration("/");
    await registration?.update();
    const subscription = await registration?.pushManager?.getSubscription();
    if (!subscription) return false;
    await savePushSubscription(subscription);
    return true;
}
