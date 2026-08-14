import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
    mutate: vi.fn(),
    login: vi.fn(),
    clearSessionMessage: vi.fn(),
}));

vi.mock("next/image", () => ({
    default: ({ alt }) => <span role="img" aria-label={alt || "decorative image"} />,
}));

vi.mock("../../Context/AuthContext", () => ({
    useAuth: () => ({
        login: authMocks.login,
        clearSessionMessage: authMocks.clearSessionMessage,
        sessionMessage: "",
    }),
}));

vi.mock("../../features/auth/useAuthActions", () => ({
    useAuthenticateUser: () => ({
        mutate: authMocks.mutate,
        isPending: false,
    }),
    useResendVerification: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../../features/teams/useTeams", () => ({
    useTeams: () => ({ teams: [], isPending: false }),
}));

import Login from "./Login";

describe("Login registration mode", () => {
    beforeEach(() => {
        authMocks.mutate.mockClear();
        authMocks.login.mockClear();
        authMocks.clearSessionMessage.mockClear();
    });

    afterEach(() => cleanup());

    it("submits the registration values after switching from sign-in mode", async () => {
        render(<Login />);

        fireEvent.click(screen.getByRole("button", { name: "New here? Create an account" }));
        fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Test" } });
        fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "User" } });
        fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "test@example.com" } });
        fireEvent.change(screen.getByLabelText("Username"), { target: { value: "test.user" } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { value: "valid-password" } });
        fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "valid-password" } });
        fireEvent.click(screen.getByRole("button", { name: "Create account" }));

        await waitFor(() => expect(authMocks.mutate).toHaveBeenCalledOnce());
        expect(authMocks.mutate.mock.calls[0][0]).toEqual({
            firstName: "Test",
            lastName: "User",
            email: "test@example.com",
            username: "test.user",
            password: "valid-password",
            confirmPassword: "valid-password",
        });
    });
});
