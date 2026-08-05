"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingPage from "../../src/Components/General/LoadingPage";
import { useAuth } from "../../src/Context/AuthContext";

export default function AdminLayout({ children }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (loading) {
            setAuthorized(false);
            return;
        }

        if (!user) {
            setAuthorized(false);
            router.replace("/login");
            return;
        }

        if (user.role !== "ROLE_SUPER_ADMIN") {
            setAuthorized(false);
            router.replace("/status");
            return;
        }

        setAuthorized(true);
    }, [loading, router, user]);

    if (loading || !authorized) {
        return <LoadingPage />;
    }

    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <nav style={{ width: "220px", background: "#1f2937", color: "white", padding: "1rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "1rem 0" }}>Admin Panel</h2>
                <ul style={{ listStyle: "none", padding: 0 }}>
                    <li style={{ marginBottom: "0.5rem" }}>
                        <Link href="/admin" style={{ color: "white", textDecoration: "none" }}>Dashboard</Link>
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>
                        <Link href="/admin/users" style={{ color: "white", textDecoration: "none" }}>User Management</Link>
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>
                        <Link href="/admin/actions" style={{ color: "white", textDecoration: "none" }}>System Actions</Link>
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>
                        <Link href="/admin/leagues" style={{ color: "white", textDecoration: "none" }}>League Maintenance</Link>
                    </li>
                    <li style={{ marginTop: "2rem" }}>
                        <Link href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>Back To Game</Link>
                    </li>
                    <li style={{ marginTop: "0.5rem" }}>
                        <button onClick={logout} style={{ background: "none", border: "none", color: "#ef4444", padding: 0, cursor: "pointer" }}>Logout</button>
                    </li>
                </ul>
            </nav>
            <main style={{ flex: 1, padding: "2rem", background: "#f3f4f6" }}>{children}</main>
        </div>
    );
}