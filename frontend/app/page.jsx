"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingPage from "../src/Components/General/LoadingPage";
import { useAuth } from "../src/Context/AuthContext";

export default function HomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (user.role === "ROLE_SUPER_ADMIN") {
            router.replace("/admin");
            return;
        }

        router.replace(user.leagueId ? "/status" : "/onboarding");
    }, [loading, router, user]);

    return <LoadingPage />;
}