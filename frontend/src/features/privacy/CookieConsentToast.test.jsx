import { StrictMode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sonner = vi.hoisted(() => ({
    renderer: null,
    custom: vi.fn((renderer) => {
        sonner.renderer = renderer;
        return "fantasy-cookie-consent";
    }),
    dismiss: vi.fn(),
}));

vi.mock("sonner", () => ({
    toast: {
        custom: sonner.custom,
        dismiss: sonner.dismiss,
    },
}));

import CookieConsentToast, { COOKIE_PREFERENCE_KEY, CookieConsentContent } from "./CookieConsentToast";

describe("CookieConsentToast", () => {
    beforeEach(() => {
        window.localStorage.clear();
        sonner.renderer = null;
        sonner.custom.mockClear();
        sonner.dismiss.mockClear();
    });

    afterEach(() => cleanup());

    it("offers a mobile-friendly consent choice when no preference exists", () => {
        render(<CookieConsentToast />);

        expect(sonner.custom).toHaveBeenCalledOnce();

        render(sonner.renderer());

        expect(screen.getByRole("heading", { name: "Your cookie preferences" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Essential only" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
    });

    it("stores an essential-only preference and dismisses the toast", () => {
        render(<CookieConsentToast />);
        render(sonner.renderer());

        fireEvent.click(screen.getByRole("button", { name: "Essential only" }));

        expect(window.localStorage.getItem(COOKIE_PREFERENCE_KEY)).toBe("essential");
        expect(sonner.dismiss).toHaveBeenCalledWith("fantasy-cookie-consent");
    });

    it("does not open again after a preference was saved", () => {
        window.localStorage.setItem(COOKIE_PREFERENCE_KEY, "accepted");

        render(<CookieConsentToast />);

        expect(sonner.custom).not.toHaveBeenCalled();
    });

    it("does not dismiss itself during the React Strict Mode effect check", () => {
        render(<StrictMode><CookieConsentToast /></StrictMode>);

        expect(sonner.custom).toHaveBeenCalled();
        expect(sonner.dismiss).not.toHaveBeenCalled();
    });

    it("supports a preview handler without storing a real preference", () => {
        const onPreference = vi.fn();
        render(<CookieConsentContent onPreference={onPreference} />);

        fireEvent.click(screen.getByRole("button", { name: "Accept" }));

        expect(onPreference).toHaveBeenCalledWith("accepted");
        expect(window.localStorage.getItem(COOKIE_PREFERENCE_KEY)).toBeNull();
    });
});
