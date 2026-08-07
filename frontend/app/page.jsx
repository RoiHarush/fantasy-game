"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingPage from "../src/Components/General/LoadingPage";
import { useAuth } from "../src/Context/AuthContext";
import { getRootRedirectRoute } from "../src/Utils/routing";

export default function HomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        router.replace(getRootRedirectRoute(user));
    }, [loading, router, user]);

    return <LoadingPage />;
}