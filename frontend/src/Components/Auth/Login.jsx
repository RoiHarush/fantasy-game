import { useState, useMemo } from "react";
import styles from "../../Styles/Login.module.css";
import API_URL from "../../config";
import { useAuth } from "../../Context/AuthContext";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const { login } = useAuth();
    const disallowed = /[\sא-ת]/;

    const logos = useMemo(() => {
        return Array.from({ length: 20 }, (_, i) => `${i + 1}_logo.svg`);
    }, []);

    const logoRows = useMemo(() => {
        function shuffle(arr) {
            return [...arr].sort(() => Math.random() - 0.5);
        }
        return Array.from({ length: 8 }, () => shuffle(logos));
    }, [logos]);

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

        if (!username || !password) {
            setError("Please fill in all fields");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                setError("Wrong Username or Password");
                return;
            }

            const data = await res.json();
            login(data.user, data.token);

        } catch (err) {
            setError("Error while sign-in");
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.logosBackground}>
                {logoRows.map((row, i) => (
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
                    <input
                        className={styles.input}
                        placeholder="Username"
                        value={username}
                        onChange={handleUsernameChange}
                    />
                    <input
                        className={styles.input}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={handlePasswordChange}
                    />

                    {error && <div className={styles.error}>{error}</div>}

                    <button type="submit" className={styles.button}>
                        Sign In
                    </button>
                </form>
            </div>

            <div className={styles.disclaimer}>
                Educational Project | Not affiliated with the Premier League
            </div>
        </div>
    );
}