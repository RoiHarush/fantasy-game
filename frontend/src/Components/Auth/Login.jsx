"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
    ArrowRight,
    Eye,
    EyeOff,
    LoaderCircle,
    LockKeyhole,
    ShieldCheck,
    Sparkles,
    UserRound,
    UsersRound,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "../../Context/AuthContext";
import { loginSchema, registrationSchema } from "../../features/auth/schemas";
import { useAuthenticateUser } from "../../features/auth/useAuthActions";
import { useTeams } from "../../features/teams/useTeams";
import { cn } from "../../lib/cn";
import { Button } from "../../shared/ui/Button";
import ImageWithFallback from "../../shared/ui/ImageWithFallback";
import ThemeToggle from "../Theme/ThemeToggle";

const INPUT_CLASS_NAME = "h-12 w-full rounded-xl border border-app-border bg-app-surface-elevated pl-11 pr-4 text-base text-app-foreground shadow-sm outline-none transition placeholder:text-app-muted/70 hover:border-app-accent-border focus:border-app-positive-border focus:ring-3 focus:ring-app-positive-border/30 aria-[invalid=true]:border-app-danger-border aria-[invalid=true]:focus:ring-app-danger-border/25";

function FieldError({ id, error }) {
    if (!error) return null;
    return <p id={id} className="mt-1.5 text-xs font-semibold text-app-danger-foreground">{error.message}</p>;
}

function AuthenticationField({
    id,
    label,
    placeholder,
    autoComplete,
    registration,
    error,
    icon: Icon,
    type = "text",
    revealable = false,
    inputMode,
    autoCapitalize,
    spellCheck,
}) {
    const [revealed, setRevealed] = useState(false);
    const resolvedType = revealable && revealed ? "text" : type;

    return (
        <div className="min-w-0">
            <label className="mb-2 block text-sm font-bold text-app-foreground" htmlFor={id}>{label}</label>
            <div className="relative">
                <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-app-muted" aria-hidden="true" />
                <input
                    id={id}
                    {...registration}
                    className={cn(INPUT_CLASS_NAME, revealable && "pr-12")}
                    type={resolvedType}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    autoCapitalize={autoCapitalize}
                    spellCheck={spellCheck}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : undefined}
                />
                {revealable && (
                    <button
                        type="button"
                        onClick={() => setRevealed((current) => !current)}
                        className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-app-muted transition hover:bg-app-accent-hover hover:text-app-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-positive-border"
                        aria-label={revealed ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                        aria-pressed={revealed}
                    >
                        {revealed ? <EyeOff className="size-4.5" aria-hidden="true" /> : <Eye className="size-4.5" aria-hidden="true" />}
                    </button>
                )}
            </div>
            <FieldError id={`${id}-error`} error={error} />
        </div>
    );
}

function AuthenticationForm({ isRegistering, initialUsername, auth, onToggleMode }) {
    const schema = isRegistering ? registrationSchema : loginSchema;
    const authentication = useAuthenticateUser({
        registering: isRegistering,
        onSuccess: ({ user }) => auth.login(user),
    });

    const {
        register,
        handleSubmit,
        getValues,
        setError,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            firstName: "",
            lastName: "",
            username: initialUsername,
            password: "",
            confirmPassword: "",
        },
        mode: "onBlur",
    });

    const onSubmit = (values) => {
        auth.clearSessionMessage();
        authentication.mutate(values, {
            onError: (requestError) => {
                const fallback = isRegistering ? "Registration failed" : "Wrong username or password";
                setError("root.server", {
                    type: "server",
                    message: requestError?.message || fallback,
                });
            },
        });
    };

    const toggleMode = () => {
        auth.clearSessionMessage();
        onToggleMode(getValues("username"));
    };

    return (
        <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {isRegistering && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <AuthenticationField
                        id="first-name"
                        label="First name"
                        placeholder="Roi"
                        autoComplete="given-name"
                        registration={register("firstName")}
                        error={errors.firstName}
                        icon={UserRound}
                    />
                    <AuthenticationField
                        id="last-name"
                        label="Last name"
                        placeholder="Harush"
                        autoComplete="family-name"
                        registration={register("lastName")}
                        error={errors.lastName}
                        icon={UserRound}
                    />
                </div>
            )}

            <AuthenticationField
                id="username"
                label="Username"
                placeholder="Enter your username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                registration={register("username")}
                error={errors.username}
                icon={UsersRound}
            />

            <AuthenticationField
                id="password"
                label="Password"
                placeholder={isRegistering ? "At least 8 characters" : "Enter your password"}
                autoComplete={isRegistering ? "new-password" : "current-password"}
                registration={register("password")}
                error={errors.password}
                icon={LockKeyhole}
                type="password"
                revealable
            />

            {isRegistering && (
                <AuthenticationField
                    id="confirm-password"
                    label="Confirm password"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    registration={register("confirmPassword")}
                    error={errors.confirmPassword}
                    icon={LockKeyhole}
                    type="password"
                    revealable
                />
            )}

            {(auth.sessionMessage || errors.root?.server) && (
                <div
                    className="rounded-xl border border-app-danger-border bg-app-danger-surface px-4 py-3 text-sm font-semibold text-app-danger-foreground"
                    role={errors.root?.server ? "alert" : "status"}
                    aria-live="polite"
                >
                    {errors.root?.server?.message || auth.sessionMessage}
                </div>
            )}

            <Button
                type="submit"
                size="lg"
                className="mt-2 w-full rounded-xl font-extrabold shadow-lg shadow-brand-purple/15"
                disabled={authentication.isPending}
            >
                {authentication.isPending ? (
                    <><LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> Please wait…</>
                ) : (
                    <>{isRegistering ? "Create Account" : "Sign In"}<ArrowRight className="size-5" aria-hidden="true" /></>
                )}
            </Button>

            <button
                type="button"
                className="mx-auto block rounded-lg px-3 py-2 text-sm font-bold text-app-accent-foreground transition hover:bg-app-accent-hover hover:text-app-positive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-positive-border disabled:pointer-events-none disabled:opacity-50"
                disabled={authentication.isPending}
                onClick={toggleMode}
            >
                {isRegistering ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
        </form>
    );
}

const CAROUSEL_ROW_COUNT = 8;
const BADGES_PER_ROW = 10;

function ClubBadgeCarousel({ teams, isPending }) {
    const rows = Array.from({ length: CAROUSEL_ROW_COUNT }, (_, rowIndex) => (
        Array.from({ length: BADGES_PER_ROW }, (_, badgeIndex) => (
            teams.length > 0 ? teams[(badgeIndex + rowIndex * 3) % teams.length] : null
        ))
    ));

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {rows.map((rowTeams, rowIndex) => (
                <div
                    key={rowIndex}
                    className="absolute left-0 flex h-16 w-full items-center overflow-hidden sm:h-20"
                    style={{ top: `${rowIndex * 12.25}%` }}
                >
                    <div
                        className="flex w-max will-change-transform [animation:login-club-marquee_var(--login-marquee-duration)_linear_infinite] [animation-direction:var(--login-marquee-direction)] motion-reduce:animate-none"
                        style={{
                            "--login-marquee-duration": `${94 + rowIndex * 7}s`,
                            "--login-marquee-direction": rowIndex % 2 === 0 ? "normal" : "reverse",
                        }}
                    >
                        {[0, 1].map((segmentIndex) => (
                            <div key={segmentIndex} className="flex shrink-0 items-center gap-10 pr-10 sm:gap-16 sm:pr-16">
                                {rowTeams.map((team, badgeIndex) => (
                                    team && !isPending ? (
                                        <ImageWithFallback
                                            key={`${team.id}-${badgeIndex}`}
                                            src={team.badgeUrl}
                                            fallbackSrc="/UI/club-placeholder.svg"
                                            alt=""
                                            width={64}
                                            height={64}
                                            sizes="(max-width: 639px) 46px, 60px"
                                            className="size-12 shrink-0 object-contain opacity-35 drop-shadow-[0_4px_7px_rgba(27,16,53,0.22)] sm:size-15 dark:opacity-30"
                                        />
                                    ) : (
                                        <span key={`placeholder-${badgeIndex}`} className="size-12 shrink-0 rounded-full bg-white/12 sm:size-15" />
                                    )
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [usernameDraft, setUsernameDraft] = useState("");
    const auth = useAuth();
    const teamsQuery = useTeams({ allowUnauthenticated: true });

    const toggleMode = (username) => {
        setUsernameDraft(username);
        setIsRegistering((current) => !current);
    };

    return (
        <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-brand-gradient px-4 py-5 text-app-foreground sm:px-6 sm:py-7">
            <ClubBadgeCarousel teams={teamsQuery.teams} isPending={teamsQuery.isPending} />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(27,16,53,0.08)_55%,rgba(27,16,53,0.2)_100%)] dark:bg-[radial-gradient(circle_at_center,rgba(9,11,18,0.12)_0,rgba(9,11,18,0.38)_62%,rgba(9,11,18,0.62)_100%)]" aria-hidden="true" />

            <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
                <ThemeToggle />
            </div>

            <main className="relative z-10 flex flex-1 items-center justify-center py-12 sm:py-14">
                <section className="w-full max-w-xl">
                    <div className="text-center text-white [text-shadow:0_4px_18px_rgba(27,16,53,0.28)]">
                        <div className="mx-auto flex w-fit items-center gap-3">
                            <Image
                                src="/UI/premier-league-logo.svg"
                                alt="Premier League lion"
                                width={112}
                                height={112}
                                priority
                                className="size-20 object-contain drop-shadow-[0_7px_12px_rgba(27,16,53,0.3)] sm:size-24"
                            />
                            <span className="rounded-full border border-white/35 bg-white/18 px-3 py-1.5 text-[0.64rem] font-black uppercase tracking-[0.16em] backdrop-blur-md">
                                The fun version
                            </span>
                        </div>
                        <p className="mt-3 flex items-center justify-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-white/80 sm:text-xs">
                            <Sparkles className="size-4" aria-hidden="true" /> Your league. Your draft.
                        </p>
                        <h1 className="mt-1 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Fantasy Draft</h1>
                        <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-white/80 sm:text-base">
                            Build your squad, outsmart your league and follow every Gameweek together.
                        </p>
                    </div>

                    <div className="mt-6 rounded-[1.75rem] border border-white/35 bg-app-surface/88 p-5 shadow-[0_20px_65px_rgba(27,16,53,0.28)] backdrop-blur-2xl sm:p-8 dark:bg-app-surface/90">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-xl border border-app-positive-border bg-app-positive-surface text-app-positive-foreground">
                                <ShieldCheck className="size-5" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-app-positive-foreground">
                                    {isRegistering ? "Join the league" : "Manager access"}
                                </p>
                                <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                                    {isRegistering ? "Create your account" : "Welcome back"}
                                </h2>
                                <p className="mt-1.5 text-sm leading-6 text-app-muted">
                                    {isRegistering ? "Register once and manage your team for the season." : "Sign in to continue managing your squad."}
                                </p>
                            </div>
                        </div>

                        <AuthenticationForm
                            key={isRegistering ? "register" : "login"}
                            isRegistering={isRegistering}
                            initialUsername={usernameDraft}
                            auth={auth}
                            onToggleMode={toggleMode}
                        />
                    </div>
                </section>
            </main>

            <footer className="relative z-10 text-center text-[0.68rem] font-semibold tracking-wide text-white/65 sm:text-xs">
                Educational project · Not affiliated with the Premier League
            </footer>
        </div>
    );
}
