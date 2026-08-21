"use client";

import { BadgeCheck, LoaderCircle, MailWarning } from "@/src/shared/ui/icons";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "../../Context/AuthContext";
import { verifyEmail } from "../../features/auth/api";
import { publishEmailVerificationEvent, subscribeToEmailVerificationEvents } from "../../features/auth/emailVerificationSync";
import { Button } from "../../shared/ui/Button";
import AuthActionCard from "./AuthActionCard";

export default function VerifyEmail({ token }) {
    const { login, prepareForAccountSwitch } = useAuth();
    const [attempt, setAttempt] = useState(0);
    const [state, setState] = useState({ status: token ? "loading" : "error", message: "" });
    const verifiedEmail = useRef("");

    useEffect(() => {
        if (!token) return undefined;

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 15_000);
        let active = true;

        let fallbackTimer;
        const unsubscribe = subscribeToEmailVerificationEvents((event) => {
            if (event.type !== "acknowledged" || event.email !== verifiedEmail.current) return;
            window.clearTimeout(fallbackTimer);
            if (active) {
                setState((current) => ({
                    ...current,
                    handedOff: true,
                    message: "Email verified. Your original tab is taking you into the app — you can close this one.",
                }));
            }
        });

        prepareForAccountSwitch()
            .then(() => verifyEmail(token, { signal: controller.signal }))
            .then(({ message, user }) => {
                if (!active) return;
                const email = user?.email?.trim().toLowerCase() || "";
                verifiedEmail.current = email;
                setState({ status: "success", message, user, email, handedOff: false });
                publishEmailVerificationEvent("verified", email);
                fallbackTimer = window.setTimeout(() => {
                    if (active) login(user);
                }, 2_500);
            })
            .catch((error) => {
                if (!active) return;
                setState({
                    status: "error",
                    message: error?.name === "AbortError"
                        ? "Verification is taking longer than expected. Check that the backend is running and try again."
                        : error?.message || "Email verification failed. Request a new link and try again.",
                });
            })
            .finally(() => window.clearTimeout(timeout));

        return () => {
            active = false;
            window.clearTimeout(timeout);
            window.clearTimeout(fallbackTimer);
            unsubscribe();
            controller.abort();
        };
    }, [attempt, login, prepareForAccountSwitch, token]);

    const missingToken = !token;
    const successful = state.status === "success";
    const failed = missingToken || state.status === "error";
    const message = missingToken
        ? "The verification link is missing its token. Request a new email from the sign-in screen."
        : successful
            ? state.message
            : failed ? state.message : "";

    return (
        <AuthActionCard eyebrow="Email verification" title={successful ? "Email verified" : "Activating your account"} description={successful ? "Your manager account is ready." : "We are validating the secure link from your email."} icon={successful ? BadgeCheck : MailWarning} showBackLink={!successful}>
            <div className={`mt-7 rounded-2xl border p-5 text-center ${successful ? "border-app-positive-border bg-app-positive-surface" : message ? "border-app-danger-border bg-app-danger-surface" : "border-app-border bg-app-surface-muted"}`} role={message ? "status" : undefined}>
                {!message && <LoaderCircle className="mx-auto size-8 animate-spin text-app-accent-foreground" aria-hidden="true" />}
                <p className="text-sm font-bold leading-6 text-app-foreground">{message || "Verifying your email…"}</p>
                {failed && !missingToken && (
                    <Button className="mt-4" variant="secondary" onClick={() => {
                        setState({ status: "loading", message: "" });
                        setAttempt((current) => current + 1);
                    }}>
                        Try again
                    </Button>
                )}
            </div>
        </AuthActionCard>
    );
}
