import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authApi = vi.hoisted(() => ({ verifyEmail: vi.fn() }));
const authContext = vi.hoisted(() => ({ login: vi.fn() }));
const verificationSync = vi.hoisted(() => ({ publish: vi.fn(), subscribe: vi.fn(() => () => {}) }));

vi.mock("next/image", () => ({
    default: ({ alt }) => <span role="img" aria-label={alt || "decorative image"} />,
}));

vi.mock("../../features/teams/useTeams", () => ({
    useTeams: () => ({ teams: [], isPending: false }),
}));

vi.mock("../../features/auth/api", () => ({
    verifyEmail: authApi.verifyEmail,
}));

vi.mock("../../Context/AuthContext", () => ({
    useAuth: () => authContext,
}));

vi.mock("../../features/auth/emailVerificationSync", () => ({
    publishEmailVerificationEvent: verificationSync.publish,
    subscribeToEmailVerificationEvents: verificationSync.subscribe,
}));

import VerifyEmail from "./VerifyEmail";

describe("VerifyEmail", () => {
    afterEach(() => {
        cleanup();
        authApi.verifyEmail.mockReset();
        authContext.login.mockReset();
        verificationSync.publish.mockReset();
        verificationSync.subscribe.mockClear();
    });

    it("replaces the loading state after successful verification", async () => {
        authApi.verifyEmail.mockResolvedValue({
            message: "Email verified. Your account is ready.",
            user: { id: 7, email: "manager@example.com", role: "ROLE_USER" },
        });

        render(<VerifyEmail token="valid-token" />);

        expect(screen.getByText("Verifying your email…")).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText("Email verified. Your account is ready.")).toBeInTheDocument());
        expect(authApi.verifyEmail).toHaveBeenCalledWith("valid-token", expect.objectContaining({ signal: expect.any(AbortSignal) }));
        expect(verificationSync.publish).toHaveBeenCalledWith("verified", "manager@example.com");
    });

    it("shows the API error and a retry action", async () => {
        authApi.verifyEmail.mockRejectedValue(new Error("This link is invalid or has already been used"));

        render(<VerifyEmail token="invalid-token" />);

        await waitFor(() => expect(screen.getByText("This link is invalid or has already been used")).toBeInTheDocument());
        expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    });
});
