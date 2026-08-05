"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../src/Header";
import HeaderCollage from "../../src/HeaderCollage";
import Footer from "../../src/Footer";
import LoadingPage from "../../src/Components/General/LoadingPage";
import { useAuth } from "../../src/Context/AuthContext";

export default function SiteLayout({ children }) {
    const { user, loading } = useAuth();
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

        if (user.role === "ROLE_SUPER_ADMIN") {
            setAuthorized(false);
            router.replace("/admin");
            return;
        }

        setAuthorized(true);
    }, [loading, router, user]);

    if (loading || !authorized) {
        return <LoadingPage />;
    }

    return (
        <div>
            <HeaderCollage />
            <Header />
            <main>{children}</main>
            <Footer />
        </div>
    );
}