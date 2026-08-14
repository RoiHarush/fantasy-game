self.addEventListener("push", (event) => {
    if (!event.data) return;
    const payload = event.data.json();
    event.waitUntil(self.registration.showNotification(payload.title || "Fantasy Draft", {
        body: payload.body || "",
        icon: "/UI/pl-logo-lion.svg",
        badge: "/UI/pl-logo-lion.svg",
        tag: payload.eventId,
        renotify: false,
        data: { url: payload.url || "/", eventId: payload.eventId, type: payload.type },
    }));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;
    event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
        const sameOriginClient = windows.find((client) => new URL(client.url).origin === self.location.origin);
        if (sameOriginClient) {
            sameOriginClient.navigate(targetUrl);
            return sameOriginClient.focus();
        }
        return clients.openWindow(targetUrl);
    }));
});
