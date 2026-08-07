"use client";

import { useEffect, useState } from "react";
import styles from "../../Styles/Login.module.css";
import { useAuth } from "../../Context/AuthContext";
import { apiRequest, ApiError } from "../../services/apiClient";

const LOGIN_LOGOS = Array.from({ length: 20 }, (_, i) => `${i + 1}_logo.svg`);

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { login, sessionMessage, clearSessionMessage } = useAuth();

    const disallowed = /[\sא-ת]/;

    useEffect(() => {
        setMounted(true);
    }, []);

    const [logoRows, setLogoRows] = useState(() => Array.from({ length: 8 }, () => LOGIN_LOGOS));

    useEffect(() => {
        const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
        setLogoRows(Array.from({ length: 8 }, () => shuffle(LOGIN_LOGOS)));
    }, []);

    function handleUsernameChange(e) {
        const value = e.target.value;
        if (!disallowed.test(value)) setUsername(value);
    }

    function handlePasswordChange(e) {
        const value = e.target.value;
        if (!disallowed.test(value)) setPassword(value);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        clearSessionMessage();

        if (!username || !password || (isRegistering && !name)) {
            setError("Please fill in all fields");
            return;
        }

        if (isRegistering && password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setSubmitting(true);
            const endpoint = isRegistering ? "register" : "login";
            const payload = isRegistering ? { name, username, password } : { username, password };
            const data = await apiRequest(`/api/auth/${endpoint}`, {
                method: "POST",
                body: payload,
                auth: false,
            });

            login({ user: data.user, token: data.token });
        } catch (requestError) {
            if (requestError instanceof ApiError) {
                setError(requestError.message || (isRegistering ? "Registration failed" : "Wrong Username or Password"));
                return;
            }

            setError(isRegistering ? "Error while registering" : "Error while sign-in");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.logosBackground}>
                {mounted && logoRows.map((row, i) => (
                    <div
                        key={i}
                        className={styles.marqueeRow}
                        style={{
                            top: `${i * 12}%`,
                            '--direction': i % 2 === 0 ? 'normal' : 'reverse',
                            '--duration': '120s'
                        }}
                    >
                        <div className={styles.marqueeTrack}>
                            {row.map((logo, index) => (
                                <img key={`a-${index}`} src={`/Logos/${logo}`} alt="" loading="lazy" />
                            ))}
                            {row.map((logo, index) => (
                                <img key={`b-${index}`} src={`/Logos/${logo}`} alt="" loading="lazy" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.contentWrapper}>
                <div className={styles.logoWrapper}>
                    <img
                        src="/UI/premier-league-logo.svg"
                        alt="Premier League Logo"
                        className={styles.premierLogo}
                    />
                </div>

                <h1 className={styles.title}>Fantasy Draft</h1>

                <form className={styles.card} onSubmit={handleSubmit}>
                    {isRegistering && (
                        <input
                            className={styles.input}
                            placeholder="Display name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            autoComplete="name"
                            minLength={2}
                            maxLength={50}
                            required
                        />
                    )}
                    <input
                        className={styles.input}
                        placeholder="Username"
                        value={username}
                        onChange={handleUsernameChange}
                        autoComplete="username"
                        minLength={3}
                        maxLength={30}
                        required
                    />
                    <input
                        className={styles.input}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={handlePasswordChange}
                        autoComplete={isRegistering ? "new-password" : "current-password"}
                        minLength={isRegistering ? 8 : undefined}
                        maxLength={72}
                        required
                    />

                    {isRegistering && (
                        <input
                            className={styles.input}
                            type="password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={72}
                            required
                        />
                    )}

                    {error && <div className={styles.error} role="alert" aria-live="polite">{error}</div>}

                    <button type="submit" className={styles.button} disabled={submitting}>
                        {submitting ? "Please wait..." : isRegistering ? "Create Account" : "Sign In"}
                    </button>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        disabled={submitting}
                        onClick={() => {
                            setIsRegistering((current) => !current);
                            setError("");
                        }}
                    >
                        {isRegistering ? "Already have an account? Sign in" : "New here? Create an account"}
                    </button>
                </form>
            </div>

            <div className={styles.disclaimer}>
                Educational Project | Not affiliated with the Premier League
            </div>

            {sessionMessage && <div className={styles.error} role="status" aria-live="polite">{sessionMessage}</div>}
        </div>
    );
}
