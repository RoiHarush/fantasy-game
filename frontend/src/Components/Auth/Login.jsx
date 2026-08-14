"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
    ArrowRight,
    BadgeCheck,
    LoaderCircle,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sparkles,
    UserRound,
    UsersRound,
} from "@/src/shared/ui/icons";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "../../Context/AuthContext";
import { loginSchema, registrationSchema } from "../../features/auth/schemas";
import { useAuthenticateUser, useResendVerification } from "../../features/auth/useAuthActions";
import { publishEmailVerificationEvent, subscribeToEmailVerificationEvents } from "../../features/auth/emailVerificationSync";
import { Button } from "../../shared/ui/Button";
import { AuthenticationField } from "./AuthFormControls";
import AuthPageShell, { AuthBrandIntro } from "./AuthPageShell";

function AuthenticationForm({ isRegistering, initialIdentifier, auth, onToggleMode, onRegistrationComplete }) {
    const schema = isRegistering ? registrationSchema : loginSchema;
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            firstName: "",
            lastName: "",
            username: isRegistering ? initialIdentifier : "",
            identifier: isRegistering ? "" : initialIdentifier,
            email: "",
            password: "",
            confirmPassword: "",
        },
        mode: "onBlur",
    });
    const authentication = useAuthenticateUser({
        registering: isRegistering,
        onSuccess: (payload) => {
            if (isRegistering) {
                onRegistrationComplete({
                    email: form.getValues("email"),
                    message: payload.message,
                    cooldownSeconds: 60,
                });
            } else {
                auth.login(payload.user);
            }
        },
    });

    const onSubmit = (values) => {
        auth.clearSessionMessage();
        authentication.mutate(values, {
            onError: (requestError) => {
                const verificationEmail = requestError?.body?.email;
                if (requestError?.body?.code === "EMAIL_NOT_VERIFIED" && verificationEmail) {
                    onRegistrationComplete({ email: verificationEmail, message: requestError.message });
                    return;
                }
                form.setError("root.server", {
                    type: "server",
                    message: requestError?.message || (isRegistering ? "Registration failed" : "Invalid sign-in details"),
                });
            },
        });
    };

    const toggleMode = () => {
        auth.clearSessionMessage();
        onToggleMode(form.getValues(isRegistering ? "username" : "identifier"));
    };

    return (
        <form className="mt-7 space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            {isRegistering && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <AuthenticationField id="first-name" label="First name" placeholder="Roi" autoComplete="given-name" registration={form.register("firstName")} error={form.formState.errors.firstName} icon={UserRound} />
                    <AuthenticationField id="last-name" label="Last name" placeholder="Harush" autoComplete="family-name" registration={form.register("lastName")} error={form.formState.errors.lastName} icon={UserRound} />
                </div>
            )}

            {isRegistering && (
                <AuthenticationField
                    id="email"
                    label="Email address"
                    placeholder="you@example.com"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    registration={form.register("email")}
                    error={form.formState.errors.email}
                    icon={Mail}
                    type="email"
                />
            )}

            <AuthenticationField
                id={isRegistering ? "username" : "identifier"}
                label={isRegistering ? "Username" : "Email or username"}
                placeholder={isRegistering ? "Choose a username" : "Enter your email or username"}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                registration={form.register(isRegistering ? "username" : "identifier")}
                error={isRegistering ? form.formState.errors.username : form.formState.errors.identifier}
                icon={UsersRound}
            />

            <AuthenticationField
                id="password"
                label="Password"
                placeholder={isRegistering ? "At least 8 characters" : "Enter your password"}
                autoComplete={isRegistering ? "new-password" : "current-password"}
                registration={form.register("password")}
                error={form.formState.errors.password}
                icon={LockKeyhole}
                type="password"
                revealable
            />

            {!isRegistering && (
                <div className="-mt-2 text-right">
                    <Link className="rounded-md px-1 py-1 text-xs font-bold text-app-accent-foreground hover:text-app-positive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-positive-border" href="/forgot-password">Forgot password?</Link>
                </div>
            )}

            {isRegistering && (
                <AuthenticationField id="confirm-password" label="Confirm password" placeholder="Repeat your password" autoComplete="new-password" registration={form.register("confirmPassword")} error={form.formState.errors.confirmPassword} icon={LockKeyhole} type="password" revealable />
            )}

            {(auth.sessionMessage || form.formState.errors.root?.server) && (
                <div className="rounded-xl border border-app-danger-border bg-app-danger-surface px-4 py-3 text-sm font-semibold text-app-danger-foreground" role={form.formState.errors.root?.server ? "alert" : "status"} aria-live="polite">
                    {form.formState.errors.root?.server?.message || auth.sessionMessage}
                </div>
            )}

            <Button type="submit" size="lg" className="mt-2 w-full rounded-xl font-extrabold shadow-lg shadow-brand-purple/15" disabled={authentication.isPending}>
                {authentication.isPending ? <><LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> Please wait…</> : <>{isRegistering ? "Create account" : "Sign in"}<ArrowRight className="size-5" aria-hidden="true" /></>}
            </Button>

            <Button type="button" variant="ghost" className="mx-auto text-sm font-bold text-app-accent-foreground" disabled={authentication.isPending} onClick={toggleMode}>
                {isRegistering ? "Already have an account? Sign in" : "New here? Create an account"}
            </Button>
        </form>
    );
}

function VerificationPending({ email, message, cooldownSeconds = 0, onBack }) {
    const [feedback, setFeedback] = useState(message);
    const [resendCooldown, setResendCooldown] = useState(cooldownSeconds);
    const resend = useResendVerification({
        onSuccess: (response) => {
            setFeedback(response.message);
            setResendCooldown(60);
        },
        onError: (error) => setFeedback(error.message),
    });
    const auth = useAuth();
    const handoffStarted = useRef(false);

    useEffect(() => subscribeToEmailVerificationEvents(async (event) => {
        if (event.type !== "verified" || event.email !== email.trim().toLowerCase() || handoffStarted.current) return;
        handoffStarted.current = true;

        try {
            const verifiedUser = await auth.refreshCurrentUser();
            if (!verifiedUser) {
                handoffStarted.current = false;
                return;
            }
            publishEmailVerificationEvent("acknowledged", email);
            auth.login(verifiedUser);
        } catch {
            handoffStarted.current = false;
            setFeedback("Your email was verified. Refresh this page to continue.");
        }
    }), [auth, email]);

    useEffect(() => {
        if (resendCooldown <= 0) return undefined;
        const timer = window.setInterval(() => {
            setResendCooldown((current) => Math.max(0, current - 1));
        }, 1_000);
        return () => window.clearInterval(timer);
    }, [resendCooldown]);

    return (
        <div className="mt-7 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-app-positive-border bg-app-positive-surface text-app-positive-foreground"><BadgeCheck className="size-7" aria-hidden="true" /></span>
            <h3 className="mt-4 text-xl font-black">Check your inbox</h3>
            <p className="mt-2 text-sm leading-6 text-app-muted">We sent a verification link to <strong className="text-app-foreground">{email}</strong>. Verify it before signing in.</p>
            {feedback && <p className="mt-4 rounded-xl border border-app-border bg-app-surface-muted px-4 py-3 text-sm font-semibold" role="status">{feedback}</p>}
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Button variant="secondary" onClick={onBack}>Back to sign in</Button>
                <Button onClick={() => resend.mutate(email)} disabled={resend.isPending || resendCooldown > 0}>
                    {resend.isPending ? "Sending…" : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend email"}
                </Button>
            </div>
        </div>
    );
}

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [identifierDraft, setIdentifierDraft] = useState("");
    const [pendingVerification, setPendingVerification] = useState(null);
    const auth = useAuth();

    const toggleMode = (identifier) => {
        setIdentifierDraft(identifier);
        setIsRegistering((current) => !current);
    };

    return (
        <AuthPageShell>
            <section className="w-full max-w-xl">
                <AuthBrandIntro
                    eyebrow={<p className="mt-3 flex items-center justify-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-white/80 sm:text-xs"><Sparkles className="size-4" aria-hidden="true" /> Your league. Your draft.</p>}
                    title="Fantasy Draft"
                    description="Build your squad, outsmart your league and follow every Gameweek together."
                />

                <div className="mt-6 rounded-[1.75rem] border border-white/35 bg-app-surface/88 p-5 shadow-[0_20px_65px_rgba(27,16,53,0.28)] backdrop-blur-2xl sm:p-8 dark:bg-app-surface/90">
                    <div className="flex items-start gap-3">
                        <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-xl border border-app-positive-border bg-app-positive-surface text-app-positive-foreground"><ShieldCheck className="size-5" aria-hidden="true" /></span>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-app-positive-foreground">{pendingVerification ? "Secure activation" : isRegistering ? "Join the league" : "Manager access"}</p>
                            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{pendingVerification ? "Verify your email" : isRegistering ? "Create your account" : "Welcome back"}</h2>
                            <p className="mt-1.5 text-sm leading-6 text-app-muted">{pendingVerification ? "One quick step keeps every manager account protected." : isRegistering ? "Register once and manage your team for the season." : "Sign in to continue managing your squad."}</p>
                        </div>
                    </div>

                    {pendingVerification ? (
                        <VerificationPending
                            {...pendingVerification}
                            onBack={() => {
                                setIdentifierDraft(pendingVerification.email);
                                setPendingVerification(null);
                                setIsRegistering(false);
                            }}
                        />
                    ) : (
                        <AuthenticationForm key={isRegistering ? "register" : "login"} isRegistering={isRegistering} initialIdentifier={identifierDraft} auth={auth} onToggleMode={toggleMode} onRegistrationComplete={setPendingVerification} />
                    )}
                </div>
            </section>
        </AuthPageShell>
    );
}
