"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "../../Context/AuthContext";
import { loginSchema, registrationSchema } from "../../features/auth/schemas";
import { useAuthenticateUser } from "../../features/auth/useAuthActions";
import styles from "../../Styles/Login.module.css";

const LOGIN_LOGOS = Array.from({ length: 20 }, (_, index) => `${index + 1}_logo.svg`);
const LOGO_ROWS = Array.from({ length: 8 }, (_, rowIndex) => (
    LOGIN_LOGOS.map((_, logoIndex) => LOGIN_LOGOS[(logoIndex + rowIndex * 3) % LOGIN_LOGOS.length])
));

function FieldError({ id, error }) {
    if (!error) return null;
    return <p id={id} className={styles.fieldError}>{error.message}</p>;
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
        <form className={styles.card} onSubmit={handleSubmit(onSubmit)} noValidate>
            {isRegistering && (
                <>
                    <label className={styles.srOnly} htmlFor="first-name">First name</label>
                    <input
                        id="first-name"
                        {...register("firstName")}
                        className={styles.input}
                        placeholder="First name"
                        autoComplete="given-name"
                        aria-invalid={Boolean(errors.firstName)}
                        aria-describedby={errors.firstName ? "first-name-error" : undefined}
                    />
                    <FieldError id="first-name-error" error={errors.firstName} />

                    <label className={styles.srOnly} htmlFor="last-name">Last name</label>
                    <input
                        id="last-name"
                        {...register("lastName")}
                        className={styles.input}
                        placeholder="Last name"
                        autoComplete="family-name"
                        aria-invalid={Boolean(errors.lastName)}
                        aria-describedby={errors.lastName ? "last-name-error" : undefined}
                    />
                    <FieldError id="last-name-error" error={errors.lastName} />
                </>
            )}

            <label className={styles.srOnly} htmlFor="username">Username</label>
            <input
                id="username"
                {...register("username")}
                className={styles.input}
                placeholder="Username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? "username-error" : undefined}
            />
            <FieldError id="username-error" error={errors.username} />

            <label className={styles.srOnly} htmlFor="password">Password</label>
            <input
                id="password"
                {...register("password")}
                className={styles.input}
                type="password"
                placeholder="Password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
            />
            <FieldError id="password-error" error={errors.password} />

            {isRegistering && (
                <>
                    <label className={styles.srOnly} htmlFor="confirm-password">Confirm password</label>
                    <input
                        id="confirm-password"
                        {...register("confirmPassword")}
                        className={styles.input}
                        type="password"
                        placeholder="Confirm password"
                        autoComplete="new-password"
                        aria-invalid={Boolean(errors.confirmPassword)}
                        aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                    />
                    <FieldError id="confirm-password-error" error={errors.confirmPassword} />
                </>
            )}

            {errors.root?.server && (
                <div className={styles.error} role="alert" aria-live="polite">
                    {errors.root.server.message}
                </div>
            )}

            <button type="submit" className={styles.button} disabled={authentication.isPending}>
                {authentication.isPending ? "Please wait…" : isRegistering ? "Create Account" : "Sign In"}
            </button>
            <button type="button" className={styles.secondaryButton} disabled={authentication.isPending} onClick={toggleMode}>
                {isRegistering ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
        </form>
    );
}

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [usernameDraft, setUsernameDraft] = useState("");
    const auth = useAuth();

    const toggleMode = (username) => {
        setUsernameDraft(username);
        setIsRegistering((current) => !current);
    };

    return (
        <div className={styles.container}>
            <div className={styles.logosBackground} aria-hidden="true">
                {LOGO_ROWS.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        className={styles.marqueeRow}
                        style={{
                            top: `${rowIndex * 12}%`,
                            "--direction": rowIndex % 2 === 0 ? "normal" : "reverse",
                            "--duration": "120s",
                        }}
                    >
                        <div className={styles.marqueeTrack}>
                            {[...row, ...row].map((logo, logoIndex) => (
                                <Image
                                    key={`${logo}-${logoIndex}`}
                                    src={`/Logos/${logo}`}
                                    alt=""
                                    width={55}
                                    height={55}
                                    unoptimized
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.contentWrapper}>
                <div className={styles.logoWrapper}>
                    <Image
                        src="/UI/premier-league-logo.svg"
                        alt="Premier League Logo"
                        className={styles.premierLogo}
                        width={130}
                        height={130}
                        priority
                    />
                </div>

                <h1 className={styles.title}>Fantasy Draft</h1>

                <AuthenticationForm
                    key={isRegistering ? "register" : "login"}
                    isRegistering={isRegistering}
                    initialUsername={usernameDraft}
                    auth={auth}
                    onToggleMode={toggleMode}
                />
            </div>

            <div className={styles.disclaimer}>Educational Project | Not affiliated with the Premier League</div>

            {auth.sessionMessage && <div className={styles.error} role="status" aria-live="polite">{auth.sessionMessage}</div>}
        </div>
    );
}
