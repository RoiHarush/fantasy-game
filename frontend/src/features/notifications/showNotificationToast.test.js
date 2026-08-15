import { beforeEach, describe, expect, it, vi } from "vitest";

import { showNotificationToast } from "./showNotificationToast";

const { toastMock } = vi.hoisted(() => ({ toastMock: vi.fn() }));

vi.mock("sonner", () => ({ toast: toastMock }));

describe("showNotificationToast", () => {
    beforeEach(() => toastMock.mockReset());

    it("places live notification toasts at the top without moving the global toaster", () => {
        showNotificationToast({
            eventId: "event-1",
            title: "IR chip activated",
            body: "A player moved into IR.",
        });

        expect(toastMock).toHaveBeenCalledWith("IR chip activated", expect.objectContaining({
            id: "event-1",
            description: "A player moved into IR.",
            position: "top-center",
            className: "app-toast--notification",
        }));
    });
});
