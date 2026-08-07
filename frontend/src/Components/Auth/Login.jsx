"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "../../Context/AuthContext";
import { loginSchema, registrationSchema } from "../../features/auth/schemas";
import { apiRequest, ApiError } from "../../services/apiClient";
import styles from "../../Styles/Login.module.css";

const LOGIN_LOGOS = Array.from({ length: 20 }, (_, index) => `${index + 1}_logo.svg`);
const LOGO_ROWS = Array.from({ length: 8 }, (_, rowIndex) => (
    LOGIN_LOGOS.map((_, logoIndex) => LOGIN_LOGOS[(logoIndex + rowIndex * 3) % LOGIN_LOGOS.length])
));

function FieldError({ id, error }) {
    if (!error) return null;
    return <p id={id} className={styles.fieldError}>{error.message}</p>;
}

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    const { login, sessionMessage, clearSessionMessage } = useAuth();
    const schema = isRegistering ? registrationSchema : loginSchema;

    const {
        register,
        handleSubmit,
        reset,
        getValues,
        setError,
        clearErrors,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            username: "",
            password: "",
            confirmPassword: "",
        },
        mode: "onBlur",
    });

    const onSubmit = async (values) => {
        clearSessionMessage();

        try {
            const endpoint = isRegistering ? "register" : "login";
            const payload = isRegistering
                ? { name: values.name, username: values.username, password: values.password }
                : { username: values.username, password: values.password };
            const data = await apiRequest(`/api/auth/${endpoint}`, {
                method: "POST",
                body: payload,
                auth: false,
            });

            login(data.user);
        } catch (requestError) {
            const fallback = isRegistering ? "Registration failed" : "Wrong username or password";
            setError("root.server", {
                type: "server",
                message: requestError instanceof ApiError ? requestError.message || fallback : fallback,
            });
        }
    };

    const toggleMode = () => {
        const username = getValues("username");
        setIsRegistering((current) => !current);
        clearErrors();
        clearSessionMessage();
        reset({ name: "", username, password: "", confirmPassword: "" });
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
                                <img key={`${logo}-${logoIndex}`} src={`/Logos/${logo}`} alt="" loading="lazy" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.contentWrapper}>
                <div className={styles.logoWrapper}>
                    <img src="/UI/premier-league-logo.svg" alt="Premier League Logo" className={styles.premierLogo} />
                </div>

                <h1 className={styles.title}>Fantasy Draft</h1>

                <form className={styles.card} onSubmit={handleSubmit(onSubmit)} noValidate>
                    {isRegistering && (
                        <>
                            <input
                                {...register("name")}
                                className={styles.input}
                                placeholder="Display name"
                                autoComplete="name"
                                aria-invalid={Boolean(errors.name)}
                                aria-describedby={errors.name ? "name-error" : undefined}
                            />
                            <FieldError id="name-error" error={errors.name} />
                        </>
                    )}

                    <input
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

                    <input
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
                            <input
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

                    <button type="submit" className={styles.button} disabled={isSubmitting}>
                        {isSubmitting ? "Please wait…" : isRegistering ? "Create Account" : "Sign In"}
                    </button>
                    <button type="button" className={styles.secondaryButton} disabled={isSubmitting} onClick={toggleMode}>
                        {isRegistering ? "Already have an account? Sign in" : "New here? Create an account"}
                    </button>
                </form>
            </div>

            <div className={styles.disclaimer}>Educational Project | Not affiliated with the Premier League</div>

            {sessionMessage && <div className={styles.error} role="status" aria-live="polite">{sessionMessage}</div>}
        </div>
    );
}
